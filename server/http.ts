export const CABECERAS_BASE = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
};

export function json(datos: unknown, estado = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(datos), { status: estado, headers: { ...CABECERAS_BASE, ...extra } });
}

export function error(mensaje: string, estado: number, extra: Record<string, string> = {}): Response {
  return json({ error: mensaje }, estado, extra);
}

export function esHttps(req: Request): boolean {
  return new URL(req.url).protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
}
