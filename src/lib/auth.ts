/**
 * Autenticación mínima del MVP: email + contraseña.
 *
 * - Contraseñas: scrypt (node:crypto) con sal aleatoria. Se guarda "sal:hash".
 * - Sesión: cookie httpOnly con "userId.expiración.firma", firmada con HMAC-SHA256
 *   usando AUTH_SECRET. No necesita tabla de sesiones. Cerrar sesión = borrar
 *   la cookie. Si más adelante necesitamos revocar sesiones o login social,
 *   el plan es migrar a Auth.js (ver ARCHITECTURE.md).
 */
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (pw: string, salt: string, len: number) => Promise<Buffer>;

export const SESSION_COOKIE = "pm_session";
export const SESSION_DAYS = 30;

// ---------------------------------------------------------------------------
// Contraseñas
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hex] = stored.split(":");
  if (!salt || !hex) return false;
  const expected = Buffer.from(hex, "hex");
  const actual = await scrypt(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// ---------------------------------------------------------------------------
// Token de sesión (puro, testeable sin Next.js)
// ---------------------------------------------------------------------------

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET debe tener al menos 32 caracteres.");
  return "dev-only-secret-change-me-dev-only-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string, now = Date.now()): string {
  const exp = now + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

/** Devuelve el userId si el token es válido y no ha caducado; si no, null. */
export function readSessionToken(token: string | undefined, now = Date.now()): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  const expected = Buffer.from(sign(`${userId}.${exp}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (!Number.isFinite(+exp) || +exp < now) return null;
  return userId;
}
