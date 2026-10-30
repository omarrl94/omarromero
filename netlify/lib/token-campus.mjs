// Enlace de entrada a las plataformas: datos del alumno firmados con CAMPUS_API_KEY (HMAC-SHA256).
// Cada plataforma tiene una copia de verificarTokenCampus() y comprueba la firma en su servidor.
import { createHmac, timingSafeEqual } from "node:crypto";

export const DURACION_TOKEN_S = 3600;

export function firmarTokenCampus(datos, secreto, ahora = Date.now() / 1000) {
  const cuerpo = Buffer.from(JSON.stringify({ ...datos, exp: Math.floor(ahora) + DURACION_TOKEN_S })).toString("base64url");
  return `${cuerpo}.${createHmac("sha256", secreto).update(cuerpo).digest("base64url")}`;
}

/** { e: correo, n: nombre, f: formación, m: motivo, exp } si la firma es buena y no ha caducado; si no, null. */
export function verificarTokenCampus(token, secreto, formacion, ahora = Date.now() / 1000) {
  const [cuerpo, firma] = String(token || "").split(".");
  if (!cuerpo || !firma || !secreto) return null;
  const a = Buffer.from(firma), b = Buffer.from(createHmac("sha256", secreto).update(cuerpo).digest("base64url"));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let p;
  try { p = JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8")); } catch { return null; }
  if (!p || p.f !== formacion || !(p.exp > ahora) || typeof p.e !== "string") return null;
  return p;
}
