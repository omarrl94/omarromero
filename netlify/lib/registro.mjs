/**
 * Registro y conservación de las pruebas de evaluación.
 *
 *  · auditoria    quién cambia una nota, cuándo, qué había antes y qué hay después,
 *                 y si el cambio venía de una sugerencia de la IA. No se puede editar
 *                 ni borrar desde la plataforma.
 *  · conservadas  lo que se «borra» (un intento anulado, una entrega reabierta, un examen,
 *                 las notas de un curso, los datos de una cuenta…) no desaparece al momento:
 *                 se guarda aquí hasta que acaba el plazo de conservación y entonces se
 *                 borra solo (tarea diaria, functions/mantenimiento.mjs).
 *  · registroIA   cada uso de la IA: quién, para qué, modelo y tamaño (sin el contenido).
 *
 * Plazo de conservación: hasta CONSERVAR_MESES (6 por defecto) después del 30 de junio
 * del curso en el que se hizo la prueba (instrumentos de evaluación de FP: Orden
 * 893/2022 de la Comunidad de Madrid). Con una reclamación abierta, la administración
 * puede retener los datos de un alumno más tiempo.
 */
import { randomBytes, createHash } from "node:crypto";
import { almacen, leerTodas } from "./almacen.mjs";
import { fallo, env } from "./http.mjs";

const auditoria = () => almacen("auditoria");
const conservadas = () => almacen("conservadas");
const registroIA = () => almacen("registroIA");
const limites = () => almacen("limites");

const id = () => `${new Date().toISOString()}-${randomBytes(3).toString("hex")}`;
const ahora = () => (process.env.FECHA_PRUEBA ? new Date(process.env.FECHA_PRUEBA) : new Date());

/* ── Plazo de conservación ─────────────────────────────────── */
export const mesesConservacion = () => Math.max(1, Number(env("CONSERVAR_MESES", "6")) || 6);

/** Fecha hasta la que hay que conservar una prueba hecha en `fecha` (ISO). */
export function conservarHasta(fecha = ahora().toISOString()) {
  const d = new Date(fecha);
  const y = d.getUTCMonth() >= 6 ? d.getUTCFullYear() + 1 : d.getUTCFullYear(); // el curso acaba el 30 de junio de «y»
  // Último día del mes que cae «meses» después de junio (6 → 31 de diciembre), al final del día en Madrid.
  return new Date(Date.UTC(y, 6 + mesesConservacion(), 0, 22, 59)).toISOString();
}

/** Fecha de una entrega, un trabajo o una nota (la más reciente que se conozca). */
function fechaDe(v) {
  const fs = [v?.fecha, v?.actualizado, v?.creado, ...(Array.isArray(v?.historial) ? v.historial.map((x) => x.fecha) : [])]
    .map((x) => Date.parse(x)).filter(Number.isFinite);
  return fs.length ? new Date(Math.max(...fs)).toISOString() : ahora().toISOString();
}

/* ── Registro de cambios ───────────────────────────────────── */
/**
 * @param por      quien lo hace (usuario o «sistema»)
 * @param accion   «nota del intento», «puntos de una pregunta», «nota del trabajo»…
 * @param alumno   correo del alumno afectado
 * @param sobre    { tipo: "examen"|"trabajo"|"externa"|"cuenta"|"curso", id, titulo, cicloId }
 * @param antes / despues  valores (números, textos u objetos pequeños)
 * @param ia       true si el cambio aplica una sugerencia de la IA
 */
export async function registrar({ por, accion, alumno = "", sobre = {}, antes = null, despues = null, ia = false, detalle = "" }) {
  const quien = typeof por === "string" ? { email: por, nombre: por } : { email: por?.email || "", nombre: `${por?.nombre || ""} ${por?.apellidos || ""}`.trim() };
  const e = { t: ahora().toISOString(), por: quien, accion, alumno, sobre, antes, despues, ...(ia ? { ia: true } : {}), ...(detalle ? { detalle: String(detalle).slice(0, 500) } : {}) };
  try { await auditoria().set(`${alumno || "_general"}/${id()}`, e); }
  catch (x) { console.error("Registro de cambios:", x); }
  return e;
}

/** Entradas del registro (de un alumno, o todas), de la más nueva a la más antigua. */
export async function leerRegistro({ alumno = "", filtro = () => true, max = 1000 } = {}) {
  const ks = (await auditoria().list(alumno ? `${alumno}/` : "")).sort().reverse();
  const out = [];
  for (let i = 0; i < ks.length && out.length < max; i += 200) {
    out.push(...(await leerTodas(auditoria(), ks.slice(i, i + 200))).filter(filtro));
  }
  return out.sort((a, b) => b.t.localeCompare(a.t)).slice(0, max);
}

/* ── Conservación ──────────────────────────────────────────── */
/**
 * Guarda una copia de lo que se va a borrar. `alumno` agrupa la copia (para el expediente).
 * El que llama la borra después de su almacén.
 */
export async function conservar({ tipo, almacen: nombre, clave, datos, alumno = "", por = "", motivo = "" }) {
  if (datos == null) return;
  await conservadas().set(`${alumno || "_general"}/${id()}`, {
    tipo, almacen: nombre, clave, datos, alumno, motivo, por: typeof por === "string" ? por : por?.email || "",
    fecha: ahora().toISOString(), hasta: conservarHasta(fechaDe(datos)),
  });
}

/** Lee varias claves de un almacén, las conserva y las borra. Devuelve cuántas. */
export async function conservarYBorrar(nombre, claves, { tipo, por, motivo, alumnoDe = (k) => k.split("/")[1] || "" }) {
  const s = almacen(nombre);
  let n = 0;
  for (const k of claves) {
    const v = await s.get(k);
    if (v != null) await conservar({ tipo, almacen: nombre, clave: k, datos: v, alumno: alumnoDe(k, v), por, motivo });
    await s.del(k);
    n++;
  }
  return n;
}

/** Lo conservado de un alumno (sin los datos, que pueden ser grandes). */
export async function conservadasDe(alumno) {
  const ks = await conservadas().list(`${alumno}/`);
  return (await leerTodas(conservadas(), ks)).map(({ datos, ...r }) => ({ ...r, titulo: datos?.examen?.titulo || datos?.titulo || datos?.nombre || "" }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/** Retención por reclamación: la administración puede alargar el plazo de un alumno. */
export async function retenido(alumno) {
  const r = await almacen("sistema").get("retenciones");
  const x = r?.[alumno];
  return x && Date.parse(x.hasta) > ahora().getTime() ? x : null;
}

/** Borra lo conservado cuyo plazo ha terminado (tarea diaria). También el registro de cambios caducado. */
export async function purgarCaducado() {
  const t = ahora().getTime(), ret = (await almacen("sistema").get("retenciones")) || {};
  const libre = (alumno) => !(ret[alumno] && Date.parse(ret[alumno].hasta) > t);
  let n = 0;
  for (const k of await conservadas().list()) {
    const c = await conservadas().get(k);
    if (c && Date.parse(c.hasta) < t && libre(c.alumno)) { await conservadas().del(k); n++; }
  }
  // El registro de cambios se guarda lo mismo que las pruebas a las que se refiere.
  for (const k of await auditoria().list()) {
    const fecha = k.split("/").pop().slice(0, 24);
    if (Date.parse(conservarHasta(fecha)) < t && libre(k.split("/")[0])) { await auditoria().del(k); n++; }
  }
  for (const k of await registroIA().list()) {
    if (Date.parse(conservarHasta(k.split("/").pop().slice(0, 24))) < t) { await registroIA().del(k); n++; }
  }
  return n;
}

/* ── Uso de la IA ──────────────────────────────────────────── */
export async function registrarIA(por, tipo, extra = {}) {
  try {
    await registroIA().set(`${ahora().toISOString().slice(0, 7)}/${id()}`, { t: ahora().toISOString(), por: por?.email || "", tipo, ...extra });
  } catch (x) { console.error("Registro IA:", x); }
}
export async function leerRegistroIA(max = 300) {
  const ks = (await registroIA().list()).sort().reverse().slice(0, max);
  return (await leerTodas(registroIA(), ks)).sort((a, b) => b.t.localeCompare(a.t));
}

/* ── Límite de intentos por dirección IP (acceso, códigos) ─── */
export const ipDe = (req) => (req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
const claveIP = (req, que) => `${que}/${createHash("sha256").update(ipDe(req)).digest("hex").slice(0, 24)}`;
const VENTANA_IP = 15 * 60_000;

/** Lanza 429 si desde esa IP ya ha habido demasiados fallos en 15 minutos. */
export async function comprobarIP(req, que = "acceso", max = 30) {
  const r = await limites().get(claveIP(req, que));
  if (r && Date.now() - r.desde < VENTANA_IP && r.n >= max) fallo(429, "Demasiados intentos desde esta conexión. Espera 15 minutos.");
}
export async function falloIP(req, que = "acceso") {
  const k = claveIP(req, que), r = await limites().get(k);
  const f = r && Date.now() - r.desde < VENTANA_IP ? r : { n: 0, desde: Date.now() };
  await limites().set(k, { ...f, n: f.n + 1 });
}

/* ── Seudónimos para la IA ─────────────────────────────────── */
/**
 * Quita de un texto los datos que identifican a una persona antes de mandarlo a la IA:
 * correos, DNI/NIE, teléfonos y el nombre y apellidos de las personas indicadas.
 */
export function seudonimizar(texto, personas = []) {
  let s = String(texto ?? "");
  s = s.replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[correo]")
    .replace(/\b[XYZ]?\d{7,8}[-\s]?[A-HJ-NP-TV-Z]\b/gi, "[DNI]")
    .replace(/(\+34[\s-]?)?\b[6789]\d{2}[\s-]?\d{3}[\s-]?\d{3}\b/g, "[teléfono]");
  const quitarTildes = (w) => w.normalize("NFD").replace(/\p{M}/gu, "");
  const palabras = new Set();
  for (const p of personas) {
    for (const w of `${p?.nombre || ""} ${p?.apellidos || ""}`.split(/[\s-]+/)) if (w.replace(/\./g, "").length >= 3 && !/^(del|las|los|van|von)$/i.test(w)) palabras.add(quitarTildes(w).toLowerCase());
  }
  if (palabras.size) {
    s = s.replace(/[\p{L}\p{M}]+/gu, (w) => (palabras.has(quitarTildes(w).toLowerCase()) ? "[nombre]" : w))
      .replace(/\[nombre\](?:\s+(?:de|del|de la|y)?\s*\[nombre\])+/g, "[nombre]");
  }
  return s;
}
