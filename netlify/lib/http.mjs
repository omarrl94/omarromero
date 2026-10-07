/** Utilidades HTTP compartidas por la API. */

/**
 * Lee una variable de entorno tolerando errores típicos al pegarla en Netlify:
 * espacios alrededor y comillas envolventes ("valor" o 'valor').
 */
export function env(k, def = "") {
  let v = String(process.env[k] ?? "").trim();
  if (v.length >= 2 && (v[0] === '"' || v[0] === "'") && v.at(-1) === v[0]) v = v.slice(1, -1).trim();
  return v || def;
}

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export const fallo = (status, msg) => { throw new HttpError(status, msg); };

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

export async function leerCuerpo(req, max = 200_000) {
  const raw = await req.text();
  if (raw.length > max) fallo(413, "Petición demasiado grande");
  try { return raw ? JSON.parse(raw) : {}; } catch { fallo(400, "Petición no válida"); }
}

export function leerCookie(req, nombre) {
  const c = req.headers.get("cookie") || "";
  const m = c.match(new RegExp(`(?:^|;\\s*)${nombre}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function cookie(req, nombre, valor, maxAge) {
  const segura = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return `${nombre}=${encodeURIComponent(valor)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${segura}`;
}

export const texto = (s, max) => String(s ?? "").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
