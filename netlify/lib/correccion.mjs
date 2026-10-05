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

/**
 * @param ex   examen completo (con soluciones)
 * @param resp { mc: number[] (-1 = en blanco), open: string[] }
 */
export function corregir(ex, resp) {
  const mcRev = ex.mc.map((q, i) => {
    const val = Number.isInteger(resp.mc[i]) && resp.mc[i] >= 0 && resp.mc[i] < q.o.length ? resp.mc[i] : -1;
    return { val, correcta: q.c, ok: val === q.c };
  });
  const opRev = ex.open.map((q, i) => {
    const ans = String(resp.open[i] || "");
    return { ans, v: puntuarAbierta(ans, q), exp: q.exp };
  });
  const mcOk = mcRev.filter((r) => r.ok).length;
  const openPts = opRev.reduce((s, r) => s + (r.v === "full" ? 1 : r.v === "partial" ? 0.5 : 0), 0);
  const total = ex.mc.length + ex.open.length;
  const nota = Math.round(((mcOk + openPts) / total) * 100) / 10;
  return { nota, mcOk, openPts, mcRev, opRev };
}
