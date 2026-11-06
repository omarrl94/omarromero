import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { almacen } from './almacen';
import { variable } from './entorno';

let claveEnMemoria: string | null = null;

/**
 * Clave para firmar las sesiones.
 * - Si SESSION_SECRET tiene 32 caracteres o más, se usa.
 * - Si no (falta o es corto), se genera una clave aleatoria de 256 bits la primera vez y se guarda
 *   en el almacén privado del proyecto (Netlify Blobs), así no depende de configurarla bien a mano.
 */
export async function secreto(): Promise<string> {
  const s = variable('SESSION_SECRET');
  if (s && s.length >= 32) return s;
  if (claveEnMemoria) return claveEnMemoria;
  const a = almacen('sistema');
  const guardada = await a.leer<{ clave: string }>('clave-sesion');
  if (guardada?.clave && guardada.clave.length >= 32) {
    claveEnMemoria = guardada.clave;
    return claveEnMemoria;
  }
  const nueva = randomBytes(32).toString('base64url');
  await a.guardar('clave-sesion', { clave: nueva, creada: new Date().toISOString() });
  // Si dos funciones la crearon a la vez, se queda la que quedó guardada.
  claveEnMemoria = (await a.leer<{ clave: string }>('clave-sesion'))?.clave ?? nueva;
  return claveEnMemoria;
}

/** Solo para pruebas. */
export function olvidarClaveEnMemoria() {
  claveEnMemoria = null;
}


export function iguales(a: string, b: string): boolean {
  // Se comparan los hashes para que la longitud no filtre información.
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function leerCookie(req: Request, nombre: string): string | undefined {
  const cabecera = req.headers.get('cookie') ?? '';
  for (const parte of cabecera.split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k === nombre) return decodeURIComponent(v.join('='));
  }
  return undefined;
}
