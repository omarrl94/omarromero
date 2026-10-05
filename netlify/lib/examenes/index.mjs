/**
 * Registro de exámenes. Para añadir uno nuevo:
 *   1. Copia sad-temas-1-2.mjs con otro `id` y sus preguntas.
 *   2. Impórtalo aquí y añádelo a EXAMENES.
 *   3. Comparte el enlace  /examen/?id=<id>
 */
import sadTemas12 from "./sad-temas-1-2.mjs";

export const EXAMENES = Object.fromEntries([sadTemas12].map((e) => [e.id, e]));

export function dominiosPermitidos() {
  return (process.env.DOMINIOS_PERMITIDOS || "jrotero.es").toLowerCase().split(",").map((d) => d.trim()).filter(Boolean);
}

/** Versión del examen apta para el navegador: sin soluciones ni criterios. */
export function enunciadoPublico(ex) {
  return {
    dominios: dominiosPermitidos(),
    id: ex.id,
    modulo: ex.modulo,
    ciclo: ex.ciclo,
    titulo: ex.titulo,
    subtitulo: ex.subtitulo,
    mc: ex.mc.map(({ t, o }) => ({ t, o })),
    open: ex.open.map(({ act, t }) => ({ act, t })),
  };
}

/** Listado para la portada. */
export function listado() {
  return Object.values(EXAMENES).map(({ id, modulo, ciclo, titulo, subtitulo, mc, open }) => ({
    id, modulo, ciclo, titulo, subtitulo, nMc: mc.length, nOpen: open.length,
  }));
}
