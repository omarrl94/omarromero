/**
 * Curso académico y cierre de curso.
 *
 * El curso va del 1 de julio al 30 de junio («2026/2027»). El 30 de junio a las
 * 23:00 (hora de Madrid) el curso se cierra solo:
 *   · el alumnado de 1.º pasa al 2.º de su ciclo;
 *   · el de 2.º queda marcado como «terminó» (sale de los grupos) para que la
 *     administración borre sus cuentas en bloque cuando quiera.
 * Ese cierre automático no borra nada. Desde el panel, la administración puede
 * además cerrar el curso a mano y, si quiere, borrar las notas del curso.
 *
 * Se lanza desde la función programada (functions/fin-de-curso.mjs) y, por si
 * esa no se ejecutara, también al llegar cualquier petición después de la hora.
 */
import { almacen, leerTodas } from "./almacen.mjs";
import { rolDe, esAdmin } from "./auth.mjs";
import { GRUPOS } from "./catalogo.mjs";
import { conservarYBorrar, registrar } from "./registro.mjs";

const sistema = () => almacen("sistema");
const usuarios = () => almacen("usuarios");

/** Ahora (en pruebas se puede fijar con FECHA_PRUEBA). */
const hoy = () => (process.env.FECHA_PRUEBA ? new Date(process.env.FECHA_PRUEBA) : new Date());

/** Fecha y hora de Madrid como números. */
function madrid(d = hoy()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false })
    .formatToParts(d).filter((x) => x.type !== "literal").map((x) => [x.type, Number(x.value)]));
  return { y: p.year, m: p.month, d: p.day, h: p.hour % 24 };
}

/** «2026/2027»: de julio a junio. */
export function cursoAcademico(d = hoy()) {
  const { y, m } = madrid(d);
  return m >= 7 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
}

/** ¿Ha pasado ya la hora de cierre (30 de junio, 23:00 de Madrid) del curso indicado? */
export function tocaCerrar(curso, d = hoy()) {
  const fin = Number(curso.split("/")[1]);
  const { y, m, d: dia, h } = madrid(d);
  return y > fin || (y === fin && (m > 6 || (m === 6 && (dia > 30 || (dia === 30 && h >= 23)))));
}

export const fechaCierre = (curso) => `30 de junio de ${curso.split("/")[1]}, 23:00`;

export async function estadoCurso() {
  return (await sistema().get("curso")) || { cerrados: [] };
}

/** Grupo de 2.º que corresponde a uno de 1.º («1.º AUT (GM)» → «2.º AUT (GM)»), si existe. */
export function grupoSiguiente(grupo) {
  if (!/^1\.º\s/.test(grupo || "")) return null;
  const sig = grupo.replace(/^1\.º/, "2.º");
  return GRUPOS().some((g) => g.grupo === sig) ? sig : null;
}

/**
 * Quita de la plataforma todo lo que un alumno ha hecho (entregas, progreso, trabajos,
 * archivos, defensas). No se pierde: pasa a «conservadas» hasta que acaba el plazo de
 * conservación de las pruebas de evaluación y entonces se borra solo (lib/registro.mjs).
 */
export async function borrarDatosAlumnos(emails, por = "sistema") {
  const set = new Set(emails);
  const de = (k) => set.has(k.split("/")[1]);
  const motivo = "Datos de una cuenta borrada";
  let n = 0;
  for (const nombre of ["entregas", "progreso", "entregasTrabajo", "archivos", "circuitos"]) {
    n += await conservarYBorrar(nombre, (await almacen(nombre).list()).filter(de), { tipo: nombre, por, motivo });
  }
  // Defensas de trabajos (exámenes privados de esos alumnos).
  const ex = almacen("examenes");
  for (const k of (await ex.list()).filter((k) => k.startsWith("defensa-"))) {
    const e = await ex.get(k);
    if (e?.privado && set.has(e.privado)) n += await conservarYBorrar("examenes", [k], { tipo: "defensa (examen)", por, motivo, alumnoDe: () => e.privado });
  }
  // Notas importadas (Alexia/Additio).
  const ext = almacen("notasExternas");
  for (const k of await ext.list()) {
    const x = await ext.get(k);
    if (x && Object.keys(x.notas || {}).some((e) => set.has(e))) {
      for (const e of set) delete x.notas[e];
      await ext.set(k, x);
    }
  }
  return n;
}

/**
 * Quita las notas de TODO el alumnado (nuevo curso desde cero). Se quedan los exámenes y
 * trabajos. Las entregas pasan a «conservadas» hasta el final del plazo de conservación.
 */
async function borrarNotasCurso(por = "sistema") {
  const motivo = "Notas del curso borradas al cerrarlo";
  let n = 0;
  for (const nombre of ["entregas", "progreso", "entregasTrabajo"]) n += await conservarYBorrar(nombre, await almacen(nombre).list(), { tipo: nombre, por, motivo });
  n += await conservarYBorrar("notasExternas", await almacen("notasExternas").list(), { tipo: "notas importadas", por, motivo, alumnoDe: () => "" });
  n += await conservarYBorrar("archivos", (await almacen("archivos").list()).filter((k) => !k.includes("/_enunciado/")), { tipo: "archivo de un trabajo", por, motivo });
  const ex = almacen("examenes");
  for (const k of (await ex.list()).filter((k) => k.startsWith("defensa-"))) {
    const e = await ex.get(k);
    n += await conservarYBorrar("examenes", [k], { tipo: "defensa (examen)", por, motivo, alumnoDe: () => e?.privado || "" });
  }
  return n;
}

/**
 * Cierra el curso: 1.º → 2.º y 2.º → «terminó». Devuelve el resumen.
 * @param curso       curso que se cierra («2026/2027»)
 * @param automatico  true si lo lanza el sistema el 30 de junio
 * @param borrarNotas borra además entregas, trabajos entregados y notas importadas
 */
export async function cerrarCurso({ curso = cursoAcademico(), automatico = false, borrarNotas = false, por = "" } = {}) {
  // Los que ya pasaron de curso en este mismo cierre no se vuelven a tocar (por si se cierra dos veces).
  const lista = (await leerTodas(usuarios(), await usuarios().list())).filter((u) => rolDe(u) === "alumno" && !esAdmin(u.email) && !u.egresado && u.promocionado !== curso);
  const resumen = { curso, fecha: new Date().toISOString(), automatico, por, promocionados: 0, terminan: 0, sinGrupoSiguiente: [], notasBorradas: 0 };
  // Primero se marca 2.º (para no confundirlo con los que acaban de pasar de 1.º).
  for (const u of lista.filter((u) => /^2\.º\s/.test(u.grupo || ""))) {
    await usuarios().set(u.email, { ...u, egresado: curso, egresadoGrupo: u.grupo });
    resumen.terminan++;
  }
  for (const u of lista.filter((u) => /^1\.º\s/.test(u.grupo || ""))) {
    const sig = grupoSiguiente(u.grupo);
    if (!sig) { resumen.sinGrupoSiguiente.push(`${u.apellidos}, ${u.nombre} (${u.grupo})`); continue; }
    await usuarios().set(u.email, { ...u, grupo: sig, grupoAnterior: u.grupo, promocionado: curso });
    resumen.promocionados++;
  }
  if (borrarNotas) resumen.notasBorradas = await borrarNotasCurso(por || "sistema");
  await registrar({ por: por || "sistema", accion: "cierre de curso", sobre: { tipo: "curso", id: curso }, despues: { promocionados: resumen.promocionados, terminan: resumen.terminan, notasBorradas: resumen.notasBorradas }, detalle: automatico ? "automático (30 de junio)" : "manual" });
  const est = await estadoCurso();
  est.cerrados = [...(est.cerrados || []), resumen].slice(-30);
  await sistema().set("curso", est);
  console.log(JSON.stringify({ evento: "cierre-curso", ...resumen, sinGrupoSiguiente: resumen.sinGrupoSiguiente.length }));
  return resumen;
}

/** Cierre automático: si ya pasó el 30 de junio y ese curso no se ha cerrado, se cierra ahora. */
let ultimaComprobacion = 0;
export async function comprobarCierre({ forzar = false } = {}) {
  if (!forzar && Date.now() - ultimaComprobacion < 10 * 60_000) return null;
  ultimaComprobacion = Date.now();
  // El curso que hay que cerrar es el que terminó: si estamos en julio, el anterior.
  const ahora = cursoAcademico();
  const anterior = `${Number(ahora.split("/")[0]) - 1}/${ahora.split("/")[0]}`;
  const est = await estadoCurso();
  // Primera vez: se apunta desde qué curso funciona la plataforma (nunca se cierran cursos anteriores).
  if (!est.desde) { await sistema().set("curso", { ...est, desde: ahora }); return null; }
  for (const c of [anterior, ahora]) {
    if (c < est.desde) continue;
    if (tocaCerrar(c) && !(est.cerrados || []).some((x) => x.curso === c)) return cerrarCurso({ curso: c, automatico: true });
  }
  return null;
}
