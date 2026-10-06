/** Utilidades sobre entregas compartidas por alumno y profesor. */
import { enunciado } from "./examenes.mjs";
import { corregir } from "./correccion.mjs";
import { fallo } from "./http.mjs";

export const claveEntrega = (id, email) => `${id}/${email}`;

/* ── Intentos ────────────────────────────────────────────────
 * Cada entrega guarda todos los intentos del alumno en `historial`.
 * Los campos de arriba (respuestas, resultado, nota del profesor…) son
 * una copia del intento que cuenta (`vigente`): el mejor o el último,
 * según el examen. Las entregas antiguas tienen un único intento.
 */
const CAMPOS = ["examen", "respuestas", "resultado", "fecha", "fechaTexto", "salidas", "finalizadoPorSalida", "notaProfesor", "comentario", "ajustes"];

export const historialDe = (e) => (!e ? [] : e.historial?.length ? e.historial : [Object.fromEntries(CAMPOS.filter((c) => e[c] !== undefined).map((c) => [c, e[c]]))]);
export const intentosHechos = (e) => historialDe(e).length;
/** Intentos permitidos a un alumno: los del examen + los extra que le dé el profesor. Infinity = sin límite. */
export const intentosPermitidos = (ex, p) => ((ex.intentos ?? 1) === 0 ? Infinity : (ex.intentos ?? 1) + (p?.extra || 0));
export const notaDe = (i) => i.notaProfesor ?? i.resultado.nota;

/** Vuelve a calcular qué intento cuenta y copia sus datos arriba. */
export function consolidar(e, historial, calificacion) {
  let v = historial.length - 1;
  if (calificacion !== "ultima") historial.forEach((x, i) => { if (notaDe(x) > notaDe(historial[v])) v = i; });
  for (const c of CAMPOS) { if (historial[v][c] === undefined) delete e[c]; else e[c] = historial[v][c]; }
  e.historial = historial;
  e.vigente = v;
  return e;
}

/** La entrega vista desde uno de sus intentos (por defecto, el que cuenta). */
export function conIntento(e, i) {
  const h = historialDe(e);
  if (i == null || i === (e.vigente ?? 0)) return e;
  if (!h[i]) fallo(404, "Ese intento no existe");
  const x = { ...e };
  for (const c of CAMPOS) { if (h[i][c] === undefined) delete x[c]; else x[c] = h[i][c]; }
  x.mostrado = i;
  return x;
}

/** Resumen de los intentos para las pantallas. */
export const listaIntentos = (e) => historialDe(e).map((x, i) => ({
  n: i + 1, nota: notaDe(x), fecha: x.fecha, fechaTexto: x.fechaTexto, revisada: x.notaProfesor != null,
  ajustada: !!x.ajustes, vigente: i === (e.vigente ?? 0), finalizadoPorSalida: x.finalizadoPorSalida || "",
}));

/* ── Ajustes del profesor: puntos de cada pregunta ─────────── */
const r2 = (x) => Math.round(x * 100) / 100;

/** Valida los puntos que pone el profesor ({ mc: {i: pts}, open: {...}, num: {...} }). */
export function validarAjustes(ex, a) {
  if (!a || typeof a !== "object") return null;
  const limpio = {};
  for (const k of ["mc", "open", "num"]) {
    const lista = k === "num" ? ex.num || [] : ex[k];
    for (const [i, v] of Object.entries(a[k] || {})) {
      const q = lista[Number(i)];
      if (!q || v === null || v === "") continue;
      const n = Number(String(v).replace(",", "."));
      const max = q.puntos ?? 1, min = k === "mc" && ex.confianza ? -max : 0;
      if (!Number.isFinite(n) || n < min - 1e-9 || n > max + 1e-9) fallo(400, `Los puntos de la pregunta ${Number(i) + 1} deben estar entre ${min} y ${max}`);
      (limpio[k] ||= {})[i] = r2(n);
    }
  }
  return Object.keys(limpio).length ? limpio : null;
}

/** Corrige un intento y aplica encima los puntos que haya cambiado el profesor. */
export function resultadoCon(ex, respuestas, ajustes) {
  const r = corregir(ex, respuestas);
  if (!ajustes) return r;
  const aplica = (lista, k) => lista.forEach((x, i) => { if (ajustes[k]?.[i] != null) { x.pts = ajustes[k][i]; x.ajustado = true; } });
  aplica(r.mcRev, "mc"); aplica(r.opRev, "open"); aplica(r.numRev, "num");
  const suma = (l) => l.reduce((s, x) => s + x.pts, 0);
  r.partes.mc.pts = r2(Math.max(0, suma(r.mcRev)));
  r.partes.open.pts = r2(suma(r.opRev));
  r.partes.num.pts = r2(suma(r.numRev));
  const total = r.partes.mc.max + r.partes.open.max + r.partes.num.max;
  r.nota = total ? r2((10 * (r.partes.mc.pts + r.partes.open.pts + r.partes.num.pts)) / total) : 0;
  r.openPts = r.partes.open.pts;
  return r;
}

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
    intentos: listaIntentos(e), intento: (e.mostrado ?? e.vigente ?? 0) + 1,
    ajustados: {
      mc: e.resultado.mcRev.map((r) => !!r.ajustado),
      open: e.resultado.opRev.map((r) => !!r.ajustado),
      num: (e.resultado.numRev || []).map((r) => !!r.ajustado),
    },
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
