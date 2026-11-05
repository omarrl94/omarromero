import type { Config } from '@netlify/functions';
import { actualizarOfertas } from '../../server/actualizar-ofertas';

/** Función programada: actualiza la caché de ofertas una vez al día (06:17 UTC). */
export default async () => {
  const { cache, descartadas } = await actualizarOfertas();
  console.log(JSON.stringify({ actualizado: cache.actualizado, ofertas: cache.ofertas.length, fuentes: cache.fuentes, descartadas }));
};

export const config: Config = { schedule: '17 6 * * *' };
