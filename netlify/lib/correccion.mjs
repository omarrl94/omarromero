/** Corrección automática. Se ejecuta solo en el servidor. */

export const LETRAS = ["a", "b", "c", "d", "e"];

const norm = (s) =>
  String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function puntuarAbierta(respuesta, q) {
  const t = norm(respuesta);
  if (t.trim().length < 3) return "none";
  let m = 0;
  for (const g of q.groups) if (g.some((s) => t.includes(norm(s)))) m++;
  if (m >= q.full) return "full";
  if (m >= q.partial) return "partial";
  return "none";
}

/** Normaliza las respuestas recibidas del navegador. */
export function limpiarRespuestas(ex, r) {
  const mc = ex.mc.map((q, i) => {
    const v = Array.isArray(r?.mc) ? r.mc[i] : -1;
    return Number.isInteger(v) && v >= 0 && v < q.o.length ? v : -1;
  });
  const open = ex.open.map((_, i) => String((Array.isArray(r?.open) ? r.open[i] : "") ?? "").slice(0, 4000));
  return { mc, open };
}

/**
 * Cada pregunta vale 1 punto (abiertas: Bien 1 · Casi 0,5). Nota sobre 10.
 * Las respuestas deben venir ya de `limpiarRespuestas`.
 */
export function corregir(ex, resp) {
  const mcRev = ex.mc.map((q, i) => ({ ok: resp.mc[i] === q.c }));
  const opRev = ex.open.map((q, i) => ({ v: puntuarAbierta(resp.open[i], q) }));
  const mcOk = mcRev.filter((r) => r.ok).length;
  const openPts = opRev.reduce((s, r) => s + (r.v === "full" ? 1 : r.v === "partial" ? 0.5 : 0), 0);
  const total = ex.mc.length + ex.open.length;
  const nota = total ? Math.round(((mcOk + openPts) / total) * 100) / 10 : 0;
  return { nota, mcOk, openPts, mcRev, opRev };
}
