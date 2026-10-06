/**
 * Exámenes: se guardan en el almacén «examenes» y los sube el profesor
 * desde /profesor/. Contienen las soluciones, así que nunca se envían
 * enteros al alumno: ver `enunciado()`.
 *
 * Formato (el mismo que los arrays MC y OPEN de los HTML de cuestionario):
 *  mc:   [{ t: "pregunta", o: ["opción a", "opción b", …], c: índiceCorrecta }]
 *  open: [{ act?: "actividad", t: "pregunta", groups: [["raíz", …], …],
 *           full: nºConceptosParaBien, partial: nºConceptosParaCasi, exp: "qué se esperaba" }]
 */
import { almacen } from "./almacen.mjs";
import { fallo, texto } from "./http.mjs";
import semilla from "./semilla-sad-temas-1-2.mjs";
import { buscarModulo, moduloPorNombre } from "./catalogo.mjs";

const str = (v, max, campo) => {
  if (typeof v !== "string" || !v.trim()) fallo(400, `Falta «${campo}»`);
  return v.trim().slice(0, max);
};

export function validarExamen(e) {
  if (!e || typeof e !== "object") fallo(400, "Examen no válido");
  const id = String(e.id || "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(id)) fallo(400, "El identificador solo puede tener minúsculas, números y guiones");
  if (!Array.isArray(e.mc) || !Array.isArray(e.open)) fallo(400, "Faltan las preguntas (mc y open)");
  if (e.mc.length + e.open.length === 0) fallo(400, "El examen no tiene preguntas");
  if (e.mc.length > 200 || e.open.length > 100) fallo(400, "Demasiadas preguntas");

  const mc = e.mc.map((q, i) => {
    const n = `pregunta test ${i + 1}`;
    if (!Array.isArray(q?.o) || q.o.length < 2 || q.o.length > 5) fallo(400, `La ${n} debe tener entre 2 y 5 opciones`);
    if (!Number.isInteger(q.c) || q.c < 0 || q.c >= q.o.length) fallo(400, `La ${n} no tiene una respuesta correcta válida (c)`);
    return { t: str(q.t, 2000, n), o: q.o.map((o, j) => str(String(o ?? ""), 1000, `${n}, opción ${j + 1}`)), c: q.c };
  });
  const open = e.open.map((q, i) => {
    const n = `pregunta abierta ${i + 1}`;
    if (!Array.isArray(q?.groups) || !q.groups.length || !q.groups.every((g) => Array.isArray(g) && g.length && g.every((s) => typeof s === "string" && s.trim())))
      fallo(400, `La ${n} necesita conceptos clave (groups)`);
    const full = Number(q.full), partial = Number(q.partial);
    if (!Number.isInteger(full) || !Number.isInteger(partial) || partial < 1 || partial > full || full > q.groups.length)
      fallo(400, `La ${n} tiene «full»/«partial» incoherentes`);
    return {
      act: typeof q.act === "string" ? q.act.trim().slice(0, 300) : "",
      t: str(q.t, 2000, n),
      groups: q.groups.map((g) => g.map((s) => s.trim().slice(0, 100))),
      full, partial,
      exp: typeof q.exp === "string" ? q.exp.trim().slice(0, 2000) : "",
    };
  });
  const ubic = buscarModulo(e.cicloId, e.moduloId) || moduloPorNombre(e.ciclo, e.modulo);
  if (!ubic) fallo(400, "Elige el ciclo y el módulo del examen");
  return {
    id,
    titulo: str(e.titulo, 200, "título"),
    subtitulo: texto(e.subtitulo, 300),
    cicloId: ubic.ciclo.id,
    moduloId: ubic.modulo.id,
    ciclo: ubic.ciclo.nombre,
    modulo: ubic.modulo.nombre,
    orden: Number.isFinite(Number(e.orden)) ? Number(e.orden) : 0,
    publicado: e.publicado === true,
    mostrarSoluciones: e.mostrarSoluciones !== false,
    mc, open,
  };
}

/** Lo que ve el alumno antes de entregar: sin soluciones ni criterios. */
export const enunciado = (ex) => ({
  id: ex.id, titulo: ex.titulo, subtitulo: ex.subtitulo, modulo: ex.modulo, ciclo: ex.ciclo, cicloId: ex.cicloId, moduloId: ex.moduloId,
  mc: ex.mc.map(({ t, o }) => ({ t, o })),
  open: ex.open.map(({ act, t }) => ({ act, t })),
});

export const resumen = (ex) => ({
  id: ex.id, titulo: ex.titulo, subtitulo: ex.subtitulo, modulo: ex.modulo, ciclo: ex.ciclo,
  cicloId: ex.cicloId, moduloId: ex.moduloId, orden: ex.orden || 0,
  nMc: ex.mc.length, nOpen: ex.open.length, publicado: ex.publicado, mostrarSoluciones: ex.mostrarSoluciones,
  creado: ex.creado, actualizado: ex.actualizado,
});

/** La primera vez se carga el cuestionario de ejemplo (publicado). */
async function sembrar() {
  const sis = almacen("sistema");
  if (await sis.get("semilla")) return;
  const store = almacen("examenes");
  if (!(await store.get(semilla.id))) {
    const ahora = new Date().toISOString();
    await store.set(semilla.id, { ...validarExamen({ ...semilla, publicado: true }), creado: ahora, actualizado: ahora });
  }
  await sis.set("semilla", { fecha: new Date().toISOString() });
}

export async function todosLosExamenes() {
  await sembrar();
  const store = almacen("examenes");
  const lista = (await Promise.all((await store.list()).map((k) => store.get(k)))).filter(Boolean);
  // Orden: por `orden` y, a igualdad, por título (Tema 1, Tema 2…).
  return lista.sort((a, b) => (a.orden || 0) - (b.orden || 0) || a.titulo.localeCompare(b.titulo, "es", { numeric: true }));
}

export async function obtenerExamen(id) {
  if (typeof id !== "string" || !id) return null;
  await sembrar();
  return almacen("examenes").get(id);
}
