/** Utilidades sobre entregas compartidas por alumno y profesor. */
import { enunciado } from "./examenes.mjs";

export const claveEntrega = (id, email) => `${id}/${email}`;

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
    nota: e.resultado.nota, mcOk: e.resultado.mcOk, openPts: e.resultado.openPts,
    notaProfesor: e.notaProfesor ?? null, comentario: e.comentario || "",
    salidas: e.salidas || 0,
    finalizadoPorSalida: e.finalizadoPorSalida || "",
    respuestas: e.respuestas,
    soluciones,
    mc: soluciones ? ex.mc.map((q, i) => ({ correcta: q.c, ok: e.resultado.mcRev[i].ok })) : null,
    open: soluciones ? ex.open.map((q, i) => ({ v: e.resultado.opRev[i].v, exp: q.exp })) : null,
  };
}
