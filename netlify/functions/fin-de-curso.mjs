/**
 * Cierre automático del curso: el 30 de junio a las 23:00 (hora de Madrid) el
 * alumnado de 1.º pasa a 2.º y el de 2.º queda como «terminó» (ver lib/curso.mjs).
 * Se programa a las 21:00 y 22:00 UTC (23:00 en Madrid en verano) y, por si
 * acaso, también el 1 de julio; si el curso ya está cerrado, no hace nada.
 */
import { comprobarCierre } from "../lib/curso.mjs";
import { cargarModulos } from "../lib/catalogo.mjs";

export default async () => {
  await cargarModulos();
  const r = await comprobarCierre({ forzar: true });
  console.log(JSON.stringify({ evento: "fin-de-curso", cerrado: !!r }));
};

export const config = { schedule: "0 21,22 30 6 *" };
