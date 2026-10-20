/**
 * Copias de seguridad automáticas (functions/mantenimiento.mjs, cada hora).
 *
 * En el almacén «copias» se guarda un espejo de todos los almacenes:
 *   espejo/<almacén>/<clave>              último valor copiado
 *   anterior/<AAAA-MM-DD>/<almacén>/<clave>  valor que había antes de cambiar (30 días)
 *   indice/<almacén>                      { clave: etag } de lo copiado y { borrados }
 * Solo se copia lo que ha cambiado desde la última vez. Lo que se borra de la
 * plataforma sigue en la copia 30 días (por si fue un error) y después se borra.
 * Cada ejecución trabaja como mucho unos segundos y la siguiente sigue donde lo dejó.
 */
import { almacen } from "./almacen.mjs";

export const ALMACENES = ["usuarios", "examenes", "entregas", "progreso", "sistema", "trabajos", "entregasTrabajo", "notasExternas", "auditoria", "conservadas", "registroIA", "circuitos", "archivos"];
export const DIAS_COPIA = 30;
const copias = () => almacen("copias");
const dia = (d = new Date()) => d.toISOString().slice(0, 10);

/** En lotes de n en paralelo. */
async function enLotes(lista, n, fn, seguir = () => true) {
  for (let i = 0; i < lista.length && seguir(); i += n) await Promise.all(lista.slice(i, i + n).map(fn));
}

export async function hacerCopia({ segundos = 20 } = {}) {
  const fin = Date.now() + segundos * 1000, seguir = () => Date.now() < fin;
  const c = copias(), hoy = dia(), limite = Date.now() - DIAS_COPIA * 86_400_000;
  const r = { copiados: 0, borrados: 0, completa: true, almacenes: {} };
  for (const nombre of ALMACENES) {
    if (!seguir()) { r.completa = false; break; }
    const s = almacen(nombre);
    const idx = (await c.get(`indice/${nombre}`)) || { claves: {}, borrados: {} };
    const fuente = await s.listar();
    const cambiados = fuente.filter((b) => idx.claves[b.key] !== b.etag);
    let n = 0;
    await enLotes(cambiados, 15, async (b) => {
      const v = await s.get(b.key);
      if (v == null) return;
      if (idx.claves[b.key]) {
        const previo = await c.get(`espejo/${nombre}/${b.key}`);
        if (previo) await c.set(`anterior/${hoy}/${nombre}/${b.key}`, previo);
      }
      await c.set(`espejo/${nombre}/${b.key}`, { v, t: new Date().toISOString() });
      idx.claves[b.key] = b.etag;
      delete idx.borrados[b.key];
      n++;
    }, seguir);
    // Lo que ya no está: se apunta cuándo desapareció y, pasados 30 días, se quita de la copia.
    const hay = new Set(fuente.map((b) => b.key));
    for (const k of Object.keys(idx.claves)) {
      if (hay.has(k)) continue;
      idx.borrados[k] ||= Date.now();
      if (idx.borrados[k] < limite) {
        await c.del(`espejo/${nombre}/${k}`);
        delete idx.claves[k]; delete idx.borrados[k];
        r.borrados++;
      }
    }
    await c.set(`indice/${nombre}`, idx);
    r.copiados += n;
    r.almacenes[nombre] = { total: fuente.length, copiados: n, pendientes: cambiados.length - n, enCopiaBorrados: Object.keys(idx.borrados).length };
    if (n < cambiados.length) r.completa = false;
  }
  // Versiones anteriores de hace más de 30 días.
  if (seguir()) {
    const viejas = (await c.list("anterior/")).filter((k) => k.slice(9, 19) < dia(new Date(limite)));
    await enLotes(viejas, 20, (k) => c.del(k), seguir);
  }
  const estado = { ...((await c.get("estado")) || {}), ultima: new Date().toISOString(), completa: r.completa, ...(r.completa ? { ultimaCompleta: new Date().toISOString() } : {}), almacenes: r.almacenes };
  await c.set("estado", estado);
  console.log(JSON.stringify({ evento: "copia", copiados: r.copiados, borrados: r.borrados, completa: r.completa }));
  return { ...r, estado };
}

export async function estadoCopias() {
  const c = copias();
  const e = (await c.get("estado")) || null;
  const dias = [...new Set((await c.list("anterior/")).map((k) => k.slice(9, 19)))].sort();
  return { ...e, versionesDesde: dias[0] || null, dias: DIAS_COPIA };
}

/**
 * Restaura desde la copia lo que falta en la plataforma (lo borrado en los últimos 30 días).
 * Con `alumno`, solo lo de ese alumno (sus entregas, trabajos, archivos y su cuenta).
 * No sobrescribe nada que exista.
 */
export async function restaurar({ alumno = "" } = {}) {
  const c = copias();
  const del = (k) => !alumno || k === alumno || k.split("/").includes(alumno);
  const r = { restaurados: 0, porAlmacen: {} };
  for (const nombre of ALMACENES.filter((n) => !["copias", "sistema"].includes(n))) {
    const idx = (await c.get(`indice/${nombre}`)) || { claves: {}, borrados: {} };
    const s = almacen(nombre);
    const hay = new Set(await s.list());
    const faltan = Object.keys(idx.claves).filter((k) => !hay.has(k) && del(k));
    let n = 0;
    await enLotes(faltan, 15, async (k) => {
      const m = await c.get(`espejo/${nombre}/${k}`);
      if (m?.v != null) { await s.set(k, m.v); n++; }
    });
    if (n) r.porAlmacen[nombre] = n;
    r.restaurados += n;
  }
  return r;
}
