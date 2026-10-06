/** Utilidades sobre entregas compartidas por alumno y profesor. */
import { enunciado } from "./examenes.mjs";

export const claveEntrega = (id, email) => `${id}/${email}`;

/** Puntos por parte (las entregas antiguas no los guardaban: se reconstruyen). */
export function partesDe(e) {
  const r = e.resultado, ex = e.examen;
  if (r.partes) return r.partes;
  return { mc: { pts: r.mcOk, max: ex.mc.length }, open: { pts: r.openPts, max: ex.open.length }, num: { pts: 0, max: 0 } };
}

/**
 * Vista de una entrega para mostrarla en pantalla.
 * `ex` es el examen guardado en la entrega (copia del momento de entregar),
 * así la corrección no cambia aunque luego se edite o borre el examen.
 */
export function vistaEntrega(e, { soluciones }) {
  const ex = e.examen;
  return {
    examen: enunciado(ex),
    alumno: { email: e.email, nombre: e.nombre, apellidos: e.apellidos, grupo: e.grupo },
    fecha: e.fecha, fechaTexto: e.fechaTexto,
    nota: e.resultado.nota, mcOk: e.resultado.mcOk, openPts: e.resultado.openPts, partes: partesDe(e),
    notaProfesor: e.notaProfesor ?? null, comentario: e.comentario || "",
    salidas: e.salidas || 0,
    finalizadoPorSalida: e.finalizadoPorSalida || "",
    respuestas: e.respuestas,
    soluciones,
    // Puntos por pregunta: siempre (el alumno ve su nota desglosada); soluciones solo si procede.
    pts: {
      mc: e.resultado.mcRev.map((r) => r.pts ?? (r.ok ? 1 : 0)),
      open: e.resultado.opRev.map((r) => r.pts ?? (r.v === "full" ? 1 : r.v === "partial" ? 0.5 : 0)),
      num: (e.resultado.numRev || []).map((r) => r.pts),
    },
    mc: soluciones ? ex.mc.map((q, i) => ({ correcta: q.c, ok: e.resultado.mcRev[i].ok, exp: q.exp || "" })) : null,
    open: soluciones ? ex.open.map((q, i) => ({ v: e.resultado.opRev[i].v, exp: q.exp })) : null,
    num: soluciones ? (ex.num || []).map((q, i) => ({
      exp: q.exp || "",
      campos: q.campos.map((c, j) => ({ ok: e.resultado.numRev[i].campos[j].ok, valor: c.tipo === "opcion" ? c.opciones[c.correcta] : c.valor, unidad: c.unidad || "" })),
    })) : null,
  };
}
