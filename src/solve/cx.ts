/** Números complejos y formato «de pizarra» (subíndices, círculos, ·, −, ∠). Sirve igual para CC (parte imaginaria 0) y CA. */
import { add, sub, mul, div, abs, arg, cx, type Cx } from '../engine/ac';
export { add, sub, mul, div, abs, arg, cx };
export type C = Cx;
export const C0 = cx(0, 0), C1 = cx(1, 0);
export const cneg = (a: C): C => cx(-a.re, -a.im);
export const cscale = (a: C, k: number): C => cx(a.re * k, a.im * k);
export const isReal = (a: C, tol = 1e-9) => Math.abs(a.im) <= tol * Math.max(1, Math.abs(a.re));
export const isZero = (a: C, tol = 1e-12) => abs(a) <= tol;
export const cinv = (a: C) => div(C1, a);
export const cconj = (a: C): C => cx(a.re, -a.im);
export const polar = (m: number, deg: number): C => cx(m * Math.cos((deg * Math.PI) / 180), m * Math.sin((deg * Math.PI) / 180));
export const deg = (a: C) => (arg(a) * 180) / Math.PI;

/** Cifras con coma decimal; entero si lo es; hasta `d` decimales significativos. */
export function nf(v: number, d = 4): string {
  if (!isFinite(v)) return v > 0 ? '∞' : v < 0 ? '−∞' : 'NaN';
  if (Math.abs(v) < 1e-10) return '0';
  const r = Math.round(v);
  if (Math.abs(v - r) < 1e-9 * Math.max(1, Math.abs(v))) return String(r).replace('-', '−');
  let s = Math.abs(v) >= 1000 ? v.toFixed(Math.max(0, d - 4)) : Math.abs(v) >= 100 ? v.toFixed(Math.max(0, d - 3)) : Math.abs(v) >= 10 ? v.toFixed(Math.max(0, d - 2)) : v.toPrecision(d);
  if (s.includes('e')) s = String(+Number(s).toPrecision(d));
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s.replace('.', ',').replace('-', '−');
}
/** Complejo en forma rectangular: «3 + j4», «−2,5 − j1», «3» si es real. */
export function rect(a: C, d = 4): string {
  if (isReal(a)) return nf(a.re, d);
  if (Math.abs(a.re) < 1e-10 * Math.max(1, Math.abs(a.im))) return `${a.im < 0 ? '−' : ''}j${nf(Math.abs(a.im), d)}`;
  return `${nf(a.re, d)} ${a.im < 0 ? '−' : '+'} j${nf(Math.abs(a.im), d)}`;
}
/** Complejo en forma polar: «5∠53,13°». */
export function pol(a: C, d = 4): string {
  if (isReal(a)) return nf(a.re, d);
  const m = abs(a); let g = deg(a); if (Math.abs(g) < 1e-9) g = 0;
  return `${nf(m, d)}∠${nf(g, 5)}°`;
}
/** Valor con ambas formas si es complejo. */
export const both = (a: C, d = 4) => (isReal(a) ? nf(a.re, d) : `${rect(a, d)}  =  ${pol(a, d)}`);
/** Para operar en una expresión: entre paréntesis si es complejo o negativo. */
export const par = (a: C, d = 4) => (isReal(a) ? (a.re < 0 ? `(${nf(a.re, d)})` : nf(a.re, d)) : `(${rect(a, d)})`);

const SUB = '₀₁₂₃₄₅₆₇₈₉';
export const subs = (n: number | string) => String(n).replace(/\d/g, (d) => SUB[+d]);
/** «R1» → «R₁», «V_AB» tal cual. */
export const pretty = (s: string) => s.replace(/^([A-Za-zÀ-ÿ]+?)(\d+)$/, (_m, a, d) => `${a}${subs(d)}`);
const CIRC = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';
export const circ = (n: number) => CIRC[n - 1] ?? `(${n})`;
export const letter = (i: number) => String.fromCharCode(65 + (i % 26)) + (i >= 26 ? subs(Math.floor(i / 26)) : '');
export const meshName = (i: number) => 'I' + String.fromCharCode(97 + i); // Ia, Ib…

/** Suma de términos «c·x» con signos bonitos: «5·Ia − 2·Ib». */
export function sumTerms(terms: { c: C; x: string }[], opts: { d?: number } = {}): string {
  const d = opts.d ?? 4;
  const out: string[] = [];
  terms.forEach(({ c, x }) => {
    if (isZero(c)) return;
    const real = isReal(c);
    const neg = real ? c.re < 0 : false;
    const mag = real ? nf(Math.abs(c.re), d) : par(c, d);
    const body = real && mag === '1' ? x : `${mag}·${x}`;
    if (!out.length) out.push(neg ? `−${body}` : body); else out.push(`${neg ? '−' : '+'} ${body}`);
  });
  return out.length ? out.join(' ') : '0';
}
