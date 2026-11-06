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

/**
 * Resumen seguro de un error inesperado para mostrarlo en pantalla: tipo y mensaje, sin cadenas
 * largas que pudieran ser tokens o claves.
 */
export function resumenError(e: unknown): string {
  const err = e as { name?: string; code?: string; message?: string };
  const texto = `${err?.code ?? err?.name ?? 'Error'}: ${err?.message ?? String(e)}`;
  return texto.replace(/[A-Za-z0-9_\-.]{40,}/g, '[…]').slice(0, 220);
}
