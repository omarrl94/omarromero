import type { Config, Context } from '@netlify/functions';
import { createHmac } from 'node:crypto';
import { config as cfg } from '../../config/ffe.config';
import { almacen } from '../../server/almacen';
import { asegurarUsuario, contexto } from '../../server/autorizacion';
import { enviarCorreo, ErrorCorreo, proveedor } from '../../server/correo';
import { comprobarCodigo, cookieDobleFactor, cookieDobleFactorBorrada, dobleFactorValido, enviarCodigo, tokenDobleFactor } from '../../server/doble-factor';
import { modoPruebas, variable } from '../../server/entorno';
import { adminAuth, ErrorConfig } from '../../server/firebase';
import { error, esHttps, json } from '../../server/http';
import { identificar, uidPrueba } from '../../server/identidad';
import { consultarLimite, ipDe, registrarFallo } from '../../server/limite';
import { secreto } from '../../server/sesion';
import { borrarUsuario, guardarUsuario, superadmins, tipoPorCorreo } from '../../server/usuarios';

const urlApp = (req: Request) => variable('APP_URL') ?? new URL(req.url).origin;

async function firmaPrueba(uid: string) {
  return createHmac('sha256', await secreto()).update(`verificar|${uid}`).digest('base64url');
}

/** Aviso a los superadmin cuando un profesor pide ser tutor. */
async function avisarSolicitudTutor(req: Request, email: string, nombre: string) {
  for (const admin of superadmins()) {
    try {
      await enviarCorreo({
        para: admin,
        clave: `aviso-tutor:${email}:${admin}`,
        asunto: `Conecta FFE · Nueva solicitud de tutor: ${nombre || email}`,
        texto: [
          'Hola:',
          '',
          `${nombre || 'Un profesor'} (${email}) se ha registrado en Conecta FFE y pide acceso como tutor/a.`,
          '',
          `Para aprobarlo, entra en ${urlApp(req)}/#/admin y asígnale el rol «Tutor».`,
          '',
          'Conecta FFE',
        ].join('\n'),
      });
    } catch (e) {
      console.error('No se pudo avisar al superadmin', e);
    }
  }
}

export default async (req: Request, context: Context) => {
  try {
    return await manejar(req, context);
  } catch (e) {
    if (e instanceof ErrorCorreo) return error(e.message, e.estado);
    if (e instanceof ErrorConfig) return error(e.message, 503);
    console.error('Error en /api/cuenta', e);
    return error('Error del servidor. Inténtalo de nuevo en un minuto.', 500);
  }
};

async function manejar(req: Request, context: Context): Promise<Response> {
  const url = new URL(req.url);
  const seguro = esHttps(req);

  // Enlace de verificación en modo de pruebas (en producción lo gestiona Firebase).
  if (req.method === 'GET' && url.searchParams.has('verificar')) {
    if (!modoPruebas()) return error('No disponible', 404);
    const uid = url.searchParams.get('verificar')!;
    if (url.searchParams.get('firma') !== (await firmaPrueba(uid))) return error('Enlace no válido', 400);
    await almacen('verificados-prueba').guardar(uid, true);
    return new Response(null, { status: 302, headers: { Location: '/#/entrar?verificado=1' } });
  }

  if (req.method === 'GET') {
    const c = await contexto(req);
    if (!c) return error('Inicia sesión.', 401);
    let usuario = c.usuario;
    let rol = c.rol;
    if (c.identidad.verificado && !usuario) {
      const alta = await asegurarUsuario(c.identidad);
      if (alta) {
        usuario = alta.usuario;
        rol = alta.usuario.rol;
        if (alta.creado && alta.usuario.rol === 'pendiente') await avisarSolicitudTutor(req, alta.usuario.email, alta.usuario.nombre);
      }
    }
    const necesita = rol === 'tutor' || rol === 'superadmin';
    return json({
      email: c.identidad.email,
      verificado: c.identidad.verificado,
      tipo: tipoPorCorreo(c.identidad.email),
      rol,
      nombre: usuario?.nombre ?? '',
      necesitaDobleFactor: necesita,
      dobleFactorOk: necesita ? await dobleFactorValido(req, c.identidad.uid) : true,
      correoConfigurado: Boolean(proveedor()),
    });
  }

  if (req.method !== 'POST') return error('Método no permitido', 405, { Allow: 'GET, POST' });
  let cuerpo: Record<string, unknown> = {};
  try {
    cuerpo = (await req.json()) as Record<string, unknown>;
  } catch {
    return error('Petición no válida', 400);
  }
  const accion = String(cuerpo.accion ?? '');

  // Restablecer contraseña: siempre responde igual (no revela si la cuenta existe).
  if (accion === 'restablecer') {
    const email = String(cuerpo.email ?? '').trim().toLowerCase().slice(0, 200);
    if (tipoPorCorreo(email)) {
      try {
        const enlace = modoPruebas() ? `${urlApp(req)}/#/entrar?restablecer=prueba` : await (await adminAuth()).generatePasswordResetLink(email, { url: `${urlApp(req)}/#/entrar` });
        await enviarCorreo({
          para: email,
          clave: `reset:${email}`,
          asunto: 'Conecta FFE · Cambiar la contraseña',
          texto: ['Hola:', '', 'Para elegir una contraseña nueva, abre este enlace:', enlace, '', 'Si no lo has pedido, ignora este correo.', '', cfg.centro.nombre].join('\n'),
        });
      } catch (e) {
        if (e instanceof ErrorCorreo && e.estado === 503) throw e;
        /* cuenta inexistente u otro error: misma respuesta */
      }
    }
    return json({ ok: true });
  }

  const id = await identificar(req);
  if (!id) return error('Inicia sesión.', 401);

  if (accion === 'verificacion') {
    if (id.verificado) return json({ ok: true, yaVerificado: true });
    if (!tipoPorCorreo(id.email)) {
      return error(`Solo se admiten correos @${cfg.cuentas.dominioAlumnado} (alumnado) o @${cfg.cuentas.dominioProfesorado} (profesorado).`, 403);
    }
    if (!proveedor()) return json({ ok: false, usarFirebase: true, error: 'El correo del centro no está configurado.' }, 503);
    const enlace = modoPruebas()
      ? `${new URL(req.url).origin}/api/cuenta?verificar=${id.uid}&firma=${await firmaPrueba(id.uid)}`
      : await (await adminAuth()).generateEmailVerificationLink(id.email, { url: `${urlApp(req)}/#/entrar?verificado=1` });
    const enviado = await enviarCorreo({
      para: id.email,
      clave: `verificacion:${id.uid}`,
      asunto: 'Conecta FFE · Confirma tu correo',
      texto: [
        `Hola${cuerpo.nombre ? `, ${String(cuerpo.nombre).slice(0, 80)}` : ''}:`,
        '',
        'Para activar tu cuenta de Conecta FFE, confirma tu correo abriendo este enlace:',
        enlace,
        '',
        'Si no has creado ninguna cuenta, ignora este correo.',
        '',
        cfg.centro.nombre,
      ].join('\n'),
    });
    return enviado ? json({ ok: true }) : error('Ya te hemos enviado un correo hace menos de un minuto. Espera un poco y revisa también el correo no deseado.', 429);
  }

  if (accion === 'nombre') {
    const c = await contexto(req);
    if (!c?.usuario) return error('Cuenta no activa', 403);
    await guardarUsuario({ ...c.usuario, nombre: String(cuerpo.nombre ?? '').slice(0, 120) });
    return json({ ok: true });
  }

  if (accion === 'enviar-codigo' || accion === 'verificar-codigo') {
    const c = await contexto(req);
    if (!c?.usuario || !c.necesitaDobleFactor) return error('No necesitas código.', 400);
    if (accion === 'enviar-codigo') {
      const ok = await enviarCodigo(c.identidad.uid, c.identidad.email, c.usuario.nombre);
      return ok ? json({ ok: true }) : error('Ya te hemos enviado un código hace menos de un minuto. Revisa tu correo.', 429);
    }
    const ip = ipDe(req, context?.ip);
    if ((await consultarLimite(`2fa|${ip}`)).bloqueado) return error('Demasiados intentos. Espera 15 minutos.', 429);
    const r = await comprobarCodigo(c.identidad.uid, String(cuerpo.codigo ?? ''));
    if (r !== 'ok') {
      await registrarFallo(`2fa|${ip}`);
      const mensajes = { incorrecto: 'Código incorrecto.', caducado: 'El código ha caducado. Pide otro.', bloqueado: 'Demasiados intentos con este código. Pide otro.' };
      return error(mensajes[r], 401);
    }
    return json({ ok: true }, 200, { 'Set-Cookie': cookieDobleFactor(await tokenDobleFactor(c.identidad.uid), seguro) });
  }

  if (accion === 'salir') return json({ ok: true }, 200, { 'Set-Cookie': cookieDobleFactorBorrada(seguro) });

  if (accion === 'borrar-cuenta') {
    if (superadmins().includes(id.email)) return error('La cuenta de superadmin no se puede borrar desde aquí.', 403);
    await borrarUsuario(id.uid);
    if (modoPruebas() && id.uid === uidPrueba(id.email)) await almacen('verificados-prueba').guardar(id.uid, null);
    else await (await adminAuth()).deleteUser(id.uid);
    return json({ ok: true }, 200, { 'Set-Cookie': cookieDobleFactorBorrada(seguro) });
  }

  return error('Acción desconocida', 400);
}

export const config: Config = { path: '/api/cuenta' };
