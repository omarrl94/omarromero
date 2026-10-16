/**
 * Tarea de mantenimiento, cada hora:
 *  · copia de seguridad de lo que ha cambiado (lib/copias.mjs);
 *  · una vez al día, borra lo conservado cuyo plazo ha terminado (lib/registro.mjs).
 */
import { hacerCopia } from "../lib/copias.mjs";
import { purgarCaducado } from "../lib/registro.mjs";
import { almacen } from "../lib/almacen.mjs";

export default async () => {
  const r = await hacerCopia({ segundos: 18 });
  const sis = almacen("sistema"), m = (await sis.get("mantenimiento")) || {};
  const hoy = new Date().toISOString().slice(0, 10);
  if (m.purga !== hoy && r.completa) {
    const n = await purgarCaducado();
    await sis.set("mantenimiento", { ...m, purga: hoy, purgados: n });
    console.log(JSON.stringify({ evento: "purga", borrados: n }));
  }
};

export const config = { schedule: "@hourly" };
