/** Corrección automática. Se ejecuta solo en el servidor. */
import { CONFIANZA } from "./examenes.mjs";

export const LETRAS = ["a", "b", "c", "d", "e", "f"];

const norm = (s) =>
  String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const r2 = (x) => Math.round(x * 100) / 100;
const pts = (q) => q.puntos ?? 1;

/** Abiertas: conceptos clave. Con rúbrica (`pesos`) suma los puntos de cada concepto mencionado. */
function puntuarAbierta(respuesta, q) {
  const t = norm(respuesta);
  const p = pts(q);
  if (t.trim().length < 3) return { v: "none", pts: 0 };
  const hechos = q.groups.map((g) => g.some((s) => t.includes(norm(s))));
  if (q.pesos) {
    const suma = Math.min(p, hechos.reduce((s, h, i) => s + (h ? q.pesos[i] : 0), 0));
    return { v: suma >= p - 1e-9 ? "full" : suma > 0 ? "partial" : "none", pts: r2(suma) };
  }
  const m = hechos.filter(Boolean).length;
  if (m >= q.full) return { v: "full", pts: p };
  if (m >= q.partial) return { v: "partial", pts: p / 2 };
  return { v: "none", pts: 0 };
}

/* ── Números escritos por el alumno ───────────────────────────
 * Acepta coma o punto decimal, miles con punto, notación científica
 * (1,872·10^21 · 1,872x10²¹ · 1.872e21) y unidades con prefijo (1,15 kW si
 * se esperaba W). Devuelve todos los valores posibles en la unidad esperada.
 */
const SUPER = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-", "⁺": "+" };
const PREFIJOS = { "": 1, k: 1e3, K: 1e3, M: 1e6, G: 1e9, m: 1e-3, "µ": 1e-6, "μ": 1e-6, u: 1e-6, n: 1e-9 };

function factorUnidad(escrita, esperada) {
  const a = escrita.replace(/\s+/g, ""), b = (esperada || "").replace(/\s+/g, "");
  if (!a || !b || a === b) return 1;
  for (const [pa, fa] of Object.entries(PREFIJOS)) {
    if (!a.startsWith(pa)) continue;
    for (const [pb, fb] of Object.entries(PREFIJOS)) {
      if (!b.startsWith(pb)) continue;
      const ra = a.slice(pa.length), rb = b.slice(pb.length);
      if (ra && ra === rb) return fa / fb;
    }
  }
  return 1;
}

export function valoresPosibles(texto, unidad) {
  const s = String(texto ?? "").trim()
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (m) => "^" + [...m].map((c) => SUPER[c]).join(""))
    .replace(/[−–]/g, "-").replace(/\^\^/g, "^");
  // número · exponente opcional · unidad opcional (lo que quede, sin empezar por cifra ni separador)
  const m = /^([-+]?\d[\d.,]*)\s*(?:(?:[·x×*]\s*10\s*\^?\s*([-+]?\d+))|(?:[eE]\s*([-+]?\d+)))?\s*([^\d.,\s].*)?$/.exec(s.replace(/^([-+])\s+/, "$1"));
  if (!m) return [];
  const mant = m[1].replace(/\s+/g, "");
  const exp = Number(m[2] ?? m[3] ?? 0);
  const base = [];
  if (mant.includes(",") && mant.includes(".")) {
    // El último separador es el decimal.
    base.push(mant.lastIndexOf(",") > mant.lastIndexOf(".") ? mant.replace(/\./g, "").replace(",", ".") : mant.replace(/,/g, ""));
  } else if (mant.includes(",")) {
    base.push(mant.match(/,/g).length > 1 ? mant.replace(/,/g, "") : mant.replace(",", "."));
  } else if (mant.includes(".")) {
    base.push(mant.match(/\./g).length > 1 ? mant.replace(/\./g, "") : mant); // 2.25
    if (/^[-+]?\d{1,3}(\.\d{3})+$/.test(mant)) base.push(mant.replace(/\./g, "")); // 1.150 (miles)
  } else base.push(mant);
  const f = factorUnidad(m[4] || "", unidad);
  return base.map(Number).filter(Number.isFinite).map((v) => v * 10 ** exp * f);
}

function campoCorrecto(c, resp) {
  if (c.tipo === "opcion") return Number.isInteger(resp) && resp === c.correcta;
  const tol = Math.max(Math.abs(c.valor) * (c.tolerancia ?? 2) / 100, 1e-9);
  return valoresPosibles(resp, c.unidad).some((v) => Math.abs(v - c.valor) <= tol);
}

/** Normaliza las respuestas recibidas del navegador. */
export function limpiarRespuestas(ex, r) {
  const mc = ex.mc.map((q, i) => {
    const v = Array.isArray(r?.mc) ? r.mc[i] : -1;
    return Number.isInteger(v) && v >= 0 && v < q.o.length ? v : -1;
  });
  const conf = ex.mc.map((_, i) => {
    const v = Array.isArray(r?.conf) ? r.conf[i] : -1;
    return ex.confianza && Number.isInteger(v) && v >= 0 && v < CONFIANZA.length ? v : -1;
  });
  const open = ex.open.map((_, i) => String((Array.isArray(r?.open) ? r.open[i] : "") ?? "").slice(0, 4000));
  const num = (ex.num || []).map((q, i) => q.campos.map((c, j) => {
    const v = Array.isArray(r?.num?.[i]) ? r.num[i][j] : null;
    if (c.tipo === "opcion") return Number.isInteger(v) && v >= 0 && v < c.opciones.length ? v : -1;
    return String(v ?? "").slice(0, 60);
  }));
  return { mc, conf, open, num };
}

/**
 * Nota sobre 10 = puntos obtenidos / puntos posibles.
 * Cada pregunta vale `puntos` (1 por defecto).
 *  · Test: acierta → puntos. Con confianza: × factor de acierto o de fallo
 *    (sin respuesta o sin confianza = 0) y la parte no baja de 0.
 *  · Abiertas: Bien = puntos, Casi = mitad; con rúbrica, suma de pesos.
 *  · Ejercicios: puntos repartidos entre sus resultados.
 * Las respuestas deben venir ya de `limpiarRespuestas`.
 */
export function corregir(ex, resp) {
  const mcRev = ex.mc.map((q, i) => {
    const ok = resp.mc[i] === q.c;
    if (!ex.confianza) return { ok, pts: ok ? pts(q) : 0 };
    const c = CONFIANZA[resp.conf?.[i]];
    if (resp.mc[i] < 0 || !c) return { ok, pts: 0 };
    return { ok, pts: r2(pts(q) * (ok ? c.acierto : c.fallo)) };
  });
  const opRev = ex.open.map((q, i) => puntuarAbierta(resp.open[i], q));
  const numRev = (ex.num || []).map((q, i) => {
    const campos = q.campos.map((c, j) => ({ ok: campoCorrecto(c, resp.num?.[i]?.[j]) }));
    return { campos, pts: r2((pts(q) * campos.filter((c) => c.ok).length) / campos.length) };
  });
  const suma = (l) => l.reduce((s, x) => s + x.pts, 0);
  const max = (l) => l.reduce((s, q) => s + pts(q), 0);
  const partes = {
    mc: { pts: r2(Math.max(0, suma(mcRev))), max: r2(max(ex.mc)) },
    open: { pts: r2(suma(opRev)), max: r2(max(ex.open)) },
    num: { pts: r2(suma(numRev)), max: r2(max(ex.num || [])) },
  };
  const total = partes.mc.max + partes.open.max + partes.num.max;
  const nota = total ? r2((10 * (partes.mc.pts + partes.open.pts + partes.num.pts)) / total) : 0;
  return {
    nota, partes, mcRev, opRev, numRev,
    // Compatibilidad con pantallas y entregas antiguas
    mcOk: mcRev.filter((r) => r.ok).length, openPts: partes.open.pts,
  };
}
