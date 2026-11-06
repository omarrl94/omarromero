import type { Config } from '@netlify/functions';
import { cargarEmpresas } from '../../server/datos';
import { error, json } from '../../server/http';
import { contexto, puedeVerDirectorio } from '../../server/autorizacion';

export default async (req: Request) => {
  if (req.method !== 'GET') return error('Método no permitido', 405, { Allow: 'GET' });
  const c = await contexto(req);
  if (!c) return error('Inicia sesión para ver las empresas.', 401);
  if (!puedeVerDirectorio(c)) {
    const motivo = !c.identidad.verificado ? 'verificacion' : c.rol === 'pendiente' ? 'pendiente' : c.rol === 'bloqueado' || !c.rol ? 'sin-permiso' : 'doble-factor';
    return json({ error: 'No tienes acceso al directorio.', motivo }, 403);
  }
  try {
    const empresas = await cargarEmpresas();
    return json({ empresas, total: empresas.length });
  } catch (e) {
    console.error(e);
    return error('No se ha podido cargar el directorio.', 500);
  }
};

export const config: Config = { path: '/api/empresas' };
