/**
 * Resolución de circuitos en los exámenes (Kirchhoff, mallas, nudos…).
 *
 * El profesor marca en un ejercicio qué resultados son las incógnitas del circuito
 * (I1 → apartado 2, campo 1…). Durante el examen, el alumno escribe SUS ecuaciones
 * (p. ej. «I1 = I2 + I3», «12 − 4·I1 − 6·I3 = 0») y la plataforma:
 *   1. comprueba en el servidor cada ecuación con la solución del ejercicio
 *      (de su versión, si el examen es aleatorio) sin enseñársela;
 *   2. solo si TODAS son correctas y bastan para hallar todas las incógnitas,
 *      resuelve el sistema y le da los valores.
 * No es IA generativa: es álgebra exacta (sistema lineal), así que el alumnado no
 * interactúa con ninguna IA. El sentido de cada corriente lo elige el alumno: una
 * incógnita con el signo cambiado también vale (y el resultado sale con su signo).
 */
import { fallo, texto } from "./http.mjs";

const NOMBRE = /^[A-Za-z][A-Za-z0-9_]{0,11}$/;
export const MAX_ECUACIONES = 12;

/** Configuración de un examen: [{ titulo, bloque, incognitas: [{ nombre, i, j }], intentos }] */
export function validarCircuitos(lista, num = [], bloques = []) {
  if (!Array.isArray(lista)) return [];
  return lista.slice(0, 10).map((c, n) => {
    const incognitas = (Array.isArray(c?.incognitas) ? c.incognitas : []).slice(0, 10).map((x) => {
      const nombre = String(x?.nombre ?? "").trim().replace(/[₀-₉]/g, (d) => "₀₁₂₃₄₅₆₇₈₉".indexOf(d));
      if (!NOMBRE.test(nombre)) fallo(400, `Circuito ${n + 1}: «${x?.nombre}» no vale como nombre de incógnita (letras y números, p. ej. I1)`);
      const i = Number(x.i), j = Number(x.j);
      if (num[i]?.campos?.[j]?.tipo !== "numero") fallo(400, `Circuito ${n + 1}: la incógnita ${nombre} debe ser un resultado numérico del examen`);
      return { nombre, i, j };
    });
    if (!incognitas.length) fallo(400, `Circuito ${n + 1}: elige al menos una incógnita`);
    if (new Set(incognitas.map((x) => x.nombre.toLowerCase())).size !== incognitas.length) fallo(400, `Circuito ${n + 1}: hay incógnitas con el mismo nombre`);
    const intentos = Math.max(0, Math.min(50, Number(c.intentos ?? 0) || 0));
    return { titulo: texto(c.titulo, 120) || `Circuito ${n + 1}`, bloque: bloques.some((b) => b.id === c.bloque) ? c.bloque : "", incognitas, intentos };
  });
}

/* ── Expresiones lineales: { coef: { I1: 3, … }, k: constante } ───────── */
function trocear(s) {
  s = String(s).replace(/[−–—]/g, "-").replace(/[×·]/g, "*").replace(/÷/g, "/").replace(/[₀-₉]/g, (d) => "₀₁₂₃₄₅₆₇₈₉".indexOf(d));
  const t = [];
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    const num = /^(\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][-+]?\d+)?/.exec(s.slice(i));
    if (num) { t.push({ k: "n", v: Number(num[0].replace(",", ".")) }); i += num[0].length; continue; }
    const id = /^[A-Za-z][A-Za-z0-9_]*/.exec(s.slice(i));
    if (id) { t.push({ k: "id", v: id[0] }); i += id[0].length; continue; }
    if ("+-*/()=".includes(c)) { t.push({ k: c }); i++; continue; }
    throw new Error(`símbolo no válido «${c}»`);
  }
  return t;
}
const constante = (v) => ({ coef: {}, k: v });
const esConst = (a) => !Object.values(a.coef).some((c) => c !== 0);
const suma = (a, b, s = 1) => { const coef = { ...a.coef }; for (const [x, c] of Object.entries(b.coef)) coef[x] = (coef[x] || 0) + s * c; return { coef, k: a.k + s * b.k }; };
const escala = (a, f) => ({ coef: Object.fromEntries(Object.entries(a.coef).map(([x, c]) => [x, c * f])), k: a.k * f });

/** «12 − 4·I1 − 6·I3 = 0» → forma lineal (lado izquierdo − lado derecho). */
export function analizarEcuacion(txt, nombres) {
  const t = trocear(txt); let p = 0;
  const canon = Object.fromEntries(nombres.map((n) => [n.toLowerCase(), n]));
  const toma = (k) => (t[p]?.k === k ? t[p++] : null);
  const empiezaFactor = () => t[p] && (t[p].k === "n" || t[p].k === "id" || t[p].k === "(");
  const expr = () => { let v = term(); for (;;) { if (toma("+")) v = suma(v, term()); else if (toma("-")) v = suma(v, term(), -1); else return v; } };
  const mult = (a, b) => {
    if (esConst(a)) return escala(b, a.k);
    if (esConst(b)) return escala(a, b.k);
    throw new Error("no se pueden multiplicar dos incógnitas (las ecuaciones de Kirchhoff son lineales)");
  };
  const term = () => {
    let v = unario();
    for (;;) {
      if (toma("*")) v = mult(v, unario());
      else if (toma("/")) { const d = unario(); if (!esConst(d)) throw new Error("no se puede dividir entre una incógnita"); if (d.k === 0) throw new Error("división entre 0"); v = escala(v, 1 / d.k); }
      else if (empiezaFactor()) v = mult(v, unario()); // 4I1, 2(I1+I2)
      else return v;
    }
  };
  const unario = () => (toma("-") ? escala(unario(), -1) : toma("+") ? unario() : primario());
  const primario = () => {
    const x = t[p++];
    if (!x) throw new Error("está incompleta");
    if (x.k === "n") return constante(x.v);
    if (x.k === "(") { const v = expr(); if (!toma(")")) throw new Error("falta cerrar un paréntesis"); return v; }
    if (x.k === "id") {
      const n = canon[x.v.toLowerCase()];
      if (!n) throw new Error(`«${x.v}» no es una incógnita de este circuito (usa ${nombres.join(", ")})`);
      return { coef: { [n]: 1 }, k: 0 };
    }
    throw new Error("revisa la ecuación");
  };
  const izq = expr();
  if (!toma("=")) throw new Error("falta el signo «=»");
  const der = expr();
  if (p < t.length) throw new Error("revisa la ecuación (sobra algo al final)");
  const f = suma(izq, der, -1);
  if (esConst(f)) throw new Error("no tiene ninguna incógnita");
  return f;
}

/** Resuelve A·x = b (Gauss con pivote). Devuelve { rango, x } (x solo si el rango es completo). */
function gauss(A, b) {
  const m = A.length, n = A[0]?.length || 0;
  const M = A.map((f, r) => [...f, b[r]]);
  let fila = 0; const piv = [];
  const escalaM = Math.max(1e-12, ...M.flat().map(Math.abs));
  for (let c = 0; c < n && fila < m; c++) {
    let mejor = fila;
    for (let r = fila + 1; r < m; r++) if (Math.abs(M[r][c]) > Math.abs(M[mejor][c])) mejor = r;
    if (Math.abs(M[mejor][c]) < 1e-9 * escalaM) continue;
    [M[fila], M[mejor]] = [M[mejor], M[fila]];
    for (let r = 0; r < m; r++) {
      if (r === fila) continue;
      const f = M[r][c] / M[fila][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[fila][k];
    }
    piv.push(c); fila++;
  }
  if (piv.length < n) return { rango: piv.length };
  const x = Array(n).fill(0);
  piv.forEach((c, r) => (x[c] = M[r][n] / M[r][c]));
  return { rango: n, x };
}

/**
 * Comprueba las ecuaciones del alumno con los valores de la solución y, si todas
 * están bien y bastan, las resuelve.
 * @param ecuaciones textos del alumno
 * @param incognitas [{ nombre, valor }] (valor: el resultado correcto de su versión)
 */
export function comprobarYResolver(ecuaciones, incognitas) {
  const nombres = incognitas.map((x) => x.nombre);
  const ref = Object.fromEntries(incognitas.map((x) => [x.nombre, Number(x.valor)]));
  const filas = ecuaciones.map((txt) => {
    const t = String(txt || "").trim();
    if (!t) return null;
    try { return { txt: t, f: analizarEcuacion(t, nombres) }; } catch (e) { return { txt: t, error: `No se entiende: ${e.message}.` }; }
  }).filter(Boolean);
  if (!filas.length) return { ecuaciones: [], resuelto: null, mensaje: "Escribe al menos una ecuación." };
  // Cada incógnita puede llevar el sentido contrario al de la solución: se prueba con todas las combinaciones de signos.
  const validas = filas.filter((x) => x.f);
  const residuo = (f, signos) => {
    let r = f.k, esc = Math.abs(f.k);
    nombres.forEach((n, i) => { const c = f.coef[n] || 0; r += c * signos[i] * ref[n]; esc += Math.abs(c * ref[n]); });
    return Math.abs(r) <= 0.02 * esc + 1e-9; // 2 %: los resultados del profesor pueden ir redondeados
  };
  let mejores = null;
  for (let m = 0; m < 2 ** nombres.length; m++) {
    const signos = nombres.map((_, i) => ((m >> i) & 1 ? -1 : 1));
    const bien = validas.map((x) => residuo(x.f, signos));
    const n = bien.filter(Boolean).length;
    if (!mejores || n > mejores.n) mejores = { n, bien, signos };
    if (n === validas.length) break;
  }
  let k = 0;
  const salida = filas.map((x) => (x.error ? { txt: x.txt, ok: false, error: x.error } : { txt: x.txt, ok: mejores.bien[k++] }));
  const todasBien = salida.every((x) => x.ok);
  if (!todasBien) {
    const mal = salida.filter((x) => !x.ok).length;
    return { ecuaciones: salida, resuelto: null, mensaje: `${mal === 1 ? "Hay 1 ecuación" : `Hay ${mal} ecuaciones`} que no ${mal === 1 ? "es correcta" : "son correctas"} para este circuito. Revísala${mal === 1 ? "" : "s"}: no se resuelve hasta que todas estén bien.` };
  }
  const usadas = nombres.filter((n) => validas.some((x) => (x.f.coef[n] || 0) !== 0));
  const A = validas.map((x) => nombres.map((n) => x.f.coef[n] || 0)), b = validas.map((x) => -x.f.k);
  const g = gauss(A, b);
  if (!g.x) {
    const faltan = nombres.length - g.rango;
    return { ecuaciones: salida, resuelto: null, completas: false,
      mensaje: `Tus ecuaciones son correctas, pero no bastan: ${usadas.length < nombres.length ? `faltan incógnitas (${nombres.filter((n) => !usadas.includes(n)).join(", ")}) y ` : ""}te ${faltan === 1 ? "falta 1 ecuación independiente" : `faltan ${faltan} ecuaciones independientes`} (alguna puede ser combinación de otras).` };
  }
  const resuelto = Object.fromEntries(nombres.map((n, i) => [n, Number(g.x[i].toPrecision(8))]));
  return { ecuaciones: salida, resuelto, completas: true, mensaje: "Todas las ecuaciones son correctas. Este es el resultado de tu sistema:" };
}
