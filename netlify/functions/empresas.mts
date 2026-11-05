import type { Config } from '@netlify/functions';
import { cargarEmpresas } from '../../server/datos';
import { error, json } from '../../server/http';
import { sesionActiva } from '../../server/sesion';

export default async (req: Request) => {
  if (req.method !== 'GET') return error('Método no permitido', 405, { Allow: 'GET' });
  if (!sesionActiva(req)) return error('Necesitas el código de acceso del centro.', 401);
  try {
    const empresas = await cargarEmpresas();
    return json({ empresas, total: empresas.length });
  } catch (e) {
    console.error(e);
    return error('No se ha podido cargar el directorio.', 500);
  }
};

export const config: Config = { path: '/api/empresas' };
