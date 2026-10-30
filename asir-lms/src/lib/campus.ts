import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Enlace de entrada del Campus Virtual del centro (?campus=<token>).
 * El campus firma con CAMPUS_API_KEY el correo y el nombre del alumno que tiene acceso a esta
 * formación; aquí se comprueba la firma, la formación (CAMPUS_FORMACION) y la caducidad (1 h).
 * Misma función que en netlify/lib/token-campus.mjs del campus.
 */
export type DatosCampus = { e: string; n?: string; f: string; m?: string; exp: number };

export const FORMACION_CAMPUS = process.env.CAMPUS_FORMACION || "modulo-sad";
export const URL_CAMPUS = /^https:\/\//.test(process.env.CAMPUS_URL ?? "") ? process.env.CAMPUS_URL!.replace(/\/+$/, "") : null;

export function verificarTokenCampus(token: string | null | undefined, ahora = Date.now() / 1000): DatosCampus | null {
  const secreto = process.env.CAMPUS_API_KEY;
  const [cuerpo, firma] = String(token ?? "").split(".");
  if (!cuerpo || !firma || !secreto) return null;
  const a = Buffer.from(firma);
  const b = Buffer.from(createHmac("sha256", secreto).update(cuerpo).digest("base64url"));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let p: DatosCampus;
  try {
    p = JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!p || p.f !== FORMACION_CAMPUS || !(p.exp > ahora) || typeof p.e !== "string") return null;
  return p;
}
