import type { Config } from '@netlify/functions';
import { leerCache } from '../../server/actualizar-ofertas';
import { modoPruebas } from '../../server/entorno';
import { error, json } from '../../server/http';

export default async (req: Request) => {
  if (req.method !== 'GET') return error('Método no permitido', 405, { Allow: 'GET' });
  try {
    if (modoPruebas() && process.env.CONECTA_DATOS === 'ficticios') {
      return json((await import('../../tests/fixtures/ofertas.ficticias.json')).default);
    }
    return json(await leerCache(), 200, { 'Cache-Control': 'public, max-age=300' });
  } catch (e) {
    console.error(e);
    return error('No se han podido cargar las ofertas.', 500);
  }
};

export const config: Config = { path: '/api/ofertas' };
