import type { Config } from '@netlify/functions';
import { contexto, esSuperadmin, puedeVerDirectorio } from '../../server/autorizacion';
import { cargarEmpresas } from '../../server/datos';
import { ErrorConfig } from '../../server/firebase';
import { error, json, resumenError } from '../../server/http';
import { empresasOcultas, guardarIncidencia, listarIncidencias, ocultarEmpresa, TIPOS_INCIDENCIA, type TipoIncidencia } from '../../server/incidencias';

export default async (req: Request) => {
  try {
    return await manejar(req);
  } catch (e) {
    if (e instanceof ErrorConfig) return error(e.message, 503);
    console.error(e);
    return error(`Error del servidor (${resumenError(e)}).`, 500);
  }
};

async function manejar(req: Request): Promise<Response> {
  const c = await contexto(req);
  if (!c) return error('Inicia sesión.', 401);

  // Superadmin: ver avisos y empresas ocultas.
  if (req.method === 'GET') {
    if (!esSuperadmin(c)) return error('Solo para superadmin.', 403);
    const todas = await cargarEmpresas();
    const empresas = Object.fromEntries(todas.map((e) => [e.id, { nombre: e.nombre, contacto: e.contacto.tipo === 'email' ? e.contacto.email! : e.contacto.formularioUrl! }]));
    return json({ incidencias: await listarIncidencias(), ocultas: await empresasOcultas(), empresas });
  }
  if (req.method !== 'POST') return error('Método no permitido', 405, { Allow: 'GET, POST' });

  let cuerpo: Record<string, unknown> = {};
  try {
    cuerpo = (await req.json()) as Record<string, unknown>;
  } catch {
    return error('Petición no válida', 400);
  }
  const empresaId = String(cuerpo.empresaId ?? '');
  const empresas = await cargarEmpresas();
  if (!empresas.some((e) => e.id === empresaId)) return error('Empresa no encontrada', 404);

  // Superadmin: ocultar o volver a mostrar una empresa.
  if (cuerpo.accion === 'ocultar') {
    if (!esSuperadmin(c)) return error('Solo para superadmin.', 403);
    await ocultarEmpresa(empresaId, cuerpo.ocultar !== false);
    return json({ ok: true });
  }

  // Cualquiera con acceso al directorio: avisar de un problema.
  if (!puedeVerDirectorio(c)) return error('No tienes acceso al directorio.', 403);
  const tipo = String(cuerpo.tipo ?? '') as TipoIncidencia;
  if (!TIPOS_INCIDENCIA.includes(tipo)) return error('Tipo de aviso no válido', 400);
  await guardarIncidencia(c.identidad.uid, {
    empresaId,
    tipo,
    comentario: String(cuerpo.comentario ?? '').slice(0, 500),
    fecha: new Date().toISOString(),
    email: c.identidad.email,
  });
  return json({ ok: true });
}

export const config: Config = { path: '/api/incidencias' };
