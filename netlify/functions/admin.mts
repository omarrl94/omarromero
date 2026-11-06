import type { Config } from '@netlify/functions';
import { config as cfg } from '../../config/ffe.config';
import { contexto, esSuperadmin } from '../../server/autorizacion';
import { enviarCorreo } from '../../server/correo';
import { variable } from '../../server/entorno';
import { ErrorConfig } from '../../server/firebase';
import { error, json } from '../../server/http';
import { guardarUsuario, listarUsuarios, obtenerUsuario, rolEfectivo, superadmins, type Rol } from '../../server/usuarios';

const ROLES: Rol[] = ['alumno', 'tutor', 'superadmin', 'pendiente', 'bloqueado'];

export default async (req: Request) => {
  try {
    return await manejar(req);
  } catch (e) {
    if (e instanceof ErrorConfig) return error(e.message, 503);
    console.error(e);
    return error('Error del servidor. Inténtalo de nuevo en un minuto.', 500);
  }
};

async function manejar(req: Request): Promise<Response> {
  const c = await contexto(req);
  if (!c) return error('Inicia sesión.', 401);
  if (!esSuperadmin(c)) return error(c.rol === 'superadmin' ? 'Falta el código de doble factor.' : 'Solo para superadmin.', 403);

  if (req.method === 'GET') {
    const usuarios = (await listarUsuarios()).map((u) => ({ ...u, rol: rolEfectivo(u), fijo: superadmins().includes(u.email.toLowerCase()) }));
    return json({ usuarios });
  }
  if (req.method !== 'POST') return error('Método no permitido', 405, { Allow: 'GET, POST' });

  let cuerpo: { uid?: unknown; rol?: unknown } = {};
  try {
    cuerpo = (await req.json()) as typeof cuerpo;
  } catch {
    return error('Petición no válida', 400);
  }
  const uid = String(cuerpo.uid ?? '');
  const rol = String(cuerpo.rol ?? '') as Rol;
  if (!ROLES.includes(rol)) return error('Rol no válido', 400);
  const u = await obtenerUsuario(uid);
  if (!u) return error('Usuario no encontrado', 404);
  if (superadmins().includes(u.email.toLowerCase())) return error('Este superadmin está fijado en la configuración y no se puede cambiar aquí.', 403);
  if (u.uid === c.identidad.uid) return error('No puedes cambiar tu propio rol.', 403);

  const anterior = u.rol;
  await guardarUsuario({ ...u, rol });

  if (rol === 'tutor' && anterior !== 'tutor') {
    try {
      await enviarCorreo({
        para: u.email,
        clave: `tutor-activo:${u.uid}`,
        asunto: 'Conecta FFE · Tu acceso de tutor/a está activo',
        texto: [
          `Hola${u.nombre ? `, ${u.nombre}` : ''}:`,
          '',
          'Ya tienes acceso a la sección de tutores de Conecta FFE. Al entrar te pediremos un código que te llegará a este correo.',
          '',
          `${variable('APP_URL') ?? new URL(req.url).origin}/#/tutores`,
          '',
          cfg.centro.nombre,
        ].join('\n'),
      });
    } catch (e) {
      console.error('No se pudo avisar al tutor', e);
    }
  }
  return json({ ok: true });
}

export const config: Config = { path: '/api/admin' };
