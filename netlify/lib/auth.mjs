/**
 * Cuentas de alumno y sesiones.
 *  · Contraseñas con scrypt (sal aleatoria).
 *  · Sesión en cookie HttpOnly firmada con HMAC-SHA256 (12 h).
 *    El secreto se toma de SESSION_SECRET o se genera una vez y se guarda.
 *  · Códigos de verificación de 6 cifras (15 min, 5 intentos).
 */
import { scrypt as _scrypt, randomBytes, randomInt, timingSafeEqual, createHmac } from "node:crypto";
import { promisify } from "node:util";
import { almacen } from "./almacen.mjs";
import { fallo, leerCookie } from "./http.mjs";

const scrypt = promisify(_scrypt);
const COOKIE = "jro_sesion";
export const DURACION_SESION = 12 * 3600;
const env = (k, d = "") => (process.env[k] || d).trim();

/* ── Dominios y roles ─────────────────────────────────────── */
export const dominiosPermitidos = () =>
  env("DOMINIOS_PERMITIDOS", "jrotero.es").toLowerCase().split(",").map((d) => d.trim()).filter(Boolean);
export const admins = () =>
  env("ADMIN_EMAILS").toLowerCase().split(",").map((d) => d.trim()).filter(Boolean);
export const esAdmin = (email) => admins().includes(email);

export function emailPermitido(email) {
  if (esAdmin(email)) return true;
  const lista = dominiosPermitidos();
  if (lista.includes("*")) return true;
  const dom = email.split("@")[1] || "";
  return lista.some((d) => dom === d || dom.endsWith("." + d));
}
export const EMAIL_RE = /^[^@\s<>"',;]+@[^@\s<>"',;]+\.[a-z]{2,}$/i;

/* ── Secreto ──────────────────────────────────────────────── */
let secretoCache;
async function secreto() {
  if (secretoCache) return secretoCache;
  if (env("SESSION_SECRET")) return (secretoCache = env("SESSION_SECRET"));
  const sis = almacen("sistema");
  let s = await sis.get("secreto");
  if (!s) { s = { v: randomBytes(32).toString("hex") }; await sis.set("secreto", s); }
  return (secretoCache = s.v);
}

/* ── Contraseñas ──────────────────────────────────────────── */
export async function hashPassword(pw) {
  const sal = randomBytes(16);
  const h = await scrypt(pw, sal, 64);
  return `scrypt$${sal.toString("hex")}$${h.toString("hex")}`;
}
export async function comprobarPassword(pw, guardado) {
  const [, salHex, hHex] = String(guardado || "scrypt$00$00").split("$");
  const h = await scrypt(pw, Buffer.from(salHex, "hex"), 64);
  const ref = Buffer.from(hHex, "hex");
  return ref.length === h.length && timingSafeEqual(ref, h);
}
export function validarPassword(pw) {
  if (typeof pw !== "string" || pw.length < 8) fallo(400, "La contraseña debe tener al menos 8 caracteres");
  if (pw.length > 200) fallo(400, "La contraseña es demasiado larga");
}

/* ── Códigos por correo ───────────────────────────────────── */
export async function nuevoCodigo(tipo) {
  const codigo = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const h = createHmac("sha256", await secreto()).update(codigo).digest("hex");
  return { codigo, registro: { tipo, h, exp: Date.now() + 15 * 60_000, intentos: 0 } };
}
/** Devuelve true si el código es válido; actualiza intentos en `u.codigo`. */
export async function comprobarCodigo(u, tipo, codigo) {
  const c = u.codigo;
  if (!c || c.tipo !== tipo || Date.now() > c.exp || c.intentos >= 5) return false;
  c.intentos++;
  const h = createHmac("sha256", await secreto()).update(String(codigo || "").trim()).digest("hex");
  return timingSafeEqual(Buffer.from(h), Buffer.from(c.h));
}

/* ── Sesión ───────────────────────────────────────────────── */
const b64 = (s) => Buffer.from(s).toString("base64url");
export async function crearToken(u) {
  const datos = b64(JSON.stringify({ e: u.email, v: u.ver || 0, exp: Date.now() + DURACION_SESION * 1000 }));
  const firma = createHmac("sha256", await secreto()).update(datos).digest("base64url");
  return `${datos}.${firma}`;
}
async function leerToken(token) {
  if (!token || !token.includes(".")) return null;
  const [datos, firma] = token.split(".");
  const ok = createHmac("sha256", await secreto()).update(datos).digest("base64url");
  if (ok.length !== firma.length || !timingSafeEqual(Buffer.from(ok), Buffer.from(firma))) return null;
  try {
    const p = JSON.parse(Buffer.from(datos, "base64url").toString());
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
}
export const NOMBRE_COOKIE = COOKIE;

/** Usuario de la sesión actual o null. */
export async function usuarioSesion(req) {
  const p = await leerToken(leerCookie(req, COOKIE));
  if (!p) return null;
  const u = await almacen("usuarios").get(p.e);
  if (!u || !u.verificado || (u.ver || 0) !== p.v) return null;
  return u;
}
export async function requiereUsuario(req) {
  const u = await usuarioSesion(req);
  if (!u) fallo(401, "Inicia sesión para continuar");
  return u;
}
export async function requiereAdmin(req) {
  const u = await requiereUsuario(req);
  if (!esAdmin(u.email)) fallo(403, "Solo para profesorado");
  return u;
}

export const perfilPublico = (u) => ({
  email: u.email, nombre: u.nombre, apellidos: u.apellidos, grupo: u.grupo, rol: esAdmin(u.email) ? "profesor" : "alumno",
});
