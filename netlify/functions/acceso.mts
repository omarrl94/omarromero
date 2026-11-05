import type { Config, Context } from '@netlify/functions';
import { error, esHttps, json } from '../../server/http';
import { consultarLimite, ipDe, limpiarFallos, registrarFallo } from '../../server/limite';
import { codigoValido, cookieBorrada, cookieSesion, crearToken, sesionActiva } from '../../server/sesion';
import { variable } from '../../server/entorno';

export default async (req: Request, context: Context) => {
  try {
    return await manejar(req, context);
  } catch (e) {
    console.error('Error en /api/acceso', e);
    return error('No se ha podido comprobar el código por un error del servidor. Inténtalo de nuevo en un minuto.', 500);
  }
};

async function manejar(req: Request, context: Context): Promise<Response> {
  const seguro = esHttps(req);

  if (req.method === 'GET') return json({ autenticado: await sesionActiva(req) });
  if (req.method === 'DELETE') return json({ autenticado: false }, 200, { 'Set-Cookie': cookieBorrada(seguro) });
  if (req.method !== 'POST') return error('Método no permitido', 405, { Allow: 'GET, POST, DELETE' });

  if (!variable('ACCESS_CODE')) {
    return error('El acceso no está configurado en el servidor (falta ACCESS_CODE). Avisa a tu tutor/a.', 503);
  }

  const ip = ipDe(req, context?.ip);
  const limite = await consultarLimite(ip);
  if (limite.bloqueado) {
    return error(`Demasiados intentos. Vuelve a probar en ${Math.ceil(limite.reintentarEnSegundos / 60)} min.`, 429, {
      'Retry-After': String(limite.reintentarEnSegundos),
    });
  }

  let codigo = '';
  try {
    const cuerpo = (await req.json()) as { codigo?: unknown };
    codigo = typeof cuerpo.codigo === 'string' ? cuerpo.codigo.slice(0, 200) : '';
  } catch {
    return error('Petición no válida', 400);
  }

  if (!codigoValido(codigo)) {
    await registrarFallo(ip);
    const restantes = Math.max(0, limite.restantes - 1);
    return error(`Código incorrecto. Te quedan ${restantes} intento${restantes === 1 ? '' : 's'}.`, 401);
  }

  await limpiarFallos(ip);
  return json({ autenticado: true }, 200, { 'Set-Cookie': cookieSesion(await crearToken(), seguro) });
}

export const config: Config = { path: '/api/acceso' };
