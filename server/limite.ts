import { createHash } from 'node:crypto';
import { config } from '../config/ffe.config';
import { almacen } from './almacen';

interface Registro {
  fallos: number[];
}

/** No se guarda la IP, solo un hash con sal (SESSION_SECRET) para limitar intentos. */
function claveIp(ip: string): string {
  return createHash('sha256').update(`${process.env.SESSION_SECRET ?? ''}|${ip}`).digest('hex').slice(0, 32);
}

export function ipDe(req: Request, contextoIp?: string): string {
  return (
    contextoIp ||
    req.headers.get('x-nf-client-connection-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'desconocida'
  );
}

export interface EstadoLimite {
  bloqueado: boolean;
  restantes: number;
  reintentarEnSegundos: number;
}

export async function consultarLimite(ip: string, ahora = Date.now()): Promise<EstadoLimite> {
  const ventana = config.acceso.ventanaMinutos * 60_000;
  const r = (await almacen('limites').leer<Registro>(claveIp(ip))) ?? { fallos: [] };
  const recientes = r.fallos.filter((t) => ahora - t < ventana);
  const bloqueado = recientes.length >= config.acceso.maxIntentos;
  const reintentar = bloqueado ? Math.ceil((recientes[0] + ventana - ahora) / 1000) : 0;
  return { bloqueado, restantes: Math.max(0, config.acceso.maxIntentos - recientes.length), reintentarEnSegundos: reintentar };
}

export async function registrarFallo(ip: string, ahora = Date.now()): Promise<void> {
  const ventana = config.acceso.ventanaMinutos * 60_000;
  const a = almacen('limites');
  const k = claveIp(ip);
  const r = (await a.leer<Registro>(k)) ?? { fallos: [] };
  await a.guardar(k, { fallos: [...r.fallos.filter((t) => ahora - t < ventana), ahora] });
}

export async function limpiarFallos(ip: string): Promise<void> {
  await almacen('limites').guardar(claveIp(ip), { fallos: [] });
}
