/** Métodos de resolución de circuitos de CC, paso a paso. Cada método devuelve texto, ecuaciones y resultados. */
import { solveDC, type Element } from '../engine/dc';
import { solveLinear } from '../engine/solver';
import type { Br, Net } from './network';
import { num, signed } from './network';

export type MethodId = 'serie' | 'kirchhoff' | 'mallas' | 'nudos' | 'millman' | 'thevenin' | 'norton' | 'superposicion';
export type Block =
  | { t: 'h' | 'p' | 'note' | 'warn' | 'ok'; text: string }
  | { t: 'eq'; lines: string[] }
  | { t: 'table'; head: string[]; rows: string[][] };
export interface MethodResult { id: MethodId; title: string; applicable: boolean; why?: string; blocks: Block[]; I?: Record<string, number>; scope: 'todo' | 'carga' }

export const METHODS: { id: MethodId; title: string; short: string; needsLoad?: boolean }[] = [
  { id: 'serie', title: 'Resistencia equivalente y ley de Ohm', short: 'Serie / paralelo + Ohm' },
  { id: 'kirchhoff', title: 'Leyes de Kirchhoff (corrientes y tensiones)', short: 'Kirchhoff' },
  { id: 'mallas', title: 'Método de mallas (lazos)', short: 'Mallas' },
  { id: 'nudos', title: 'Método de nudos (análisis nodal)', short: 'Nudos' },
  { id: 'millman', title: 'Teorema de Millman', short: 'Millman' },
  { id: 'thevenin', title: 'Teorema de Thévenin', short: 'Thévenin', needsLoad: true },
  { id: 'norton', title: 'Teorema de Norton', short: 'Norton', needsLoad: true },
  { id: 'superposicion', title: 'Teorema de superposición', short: 'Superposición' },
];

const nm = (net: Net, i: number) => net.names[i];
const U = { V: 'V', A: 'A', W: 'W' };
const v = (x: number, u: string) => `${num(x)} ${u}`;
const na = (reason: string, id: MethodId): MethodResult => ({ id, title: METHODS.find((m) => m.id === id)!.title, applicable: false, why: reason, blocks: [], scope: 'todo' });
const mk = (id: MethodId, scope: 'todo' | 'carga' = 'todo'): MethodResult => ({ id, title: METHODS.find((m) => m.id === id)!.title, applicable: true, blocks: [], scope });
const dirTxt = (net: Net, b: Br) => `${nm(net, b.a)} → ${nm(net, b.b)}`;

/* ───────────── árbol recubridor y lazos fundamentales ───────────── */
interface Loop { chord: Br; items: { br: Br; d: 1 | -1 }[] }
function loops(net: Net): { loops: Loop[]; tree: Set<Br> } | null {
  const order = [...net.branches.filter((b) => b.kind === 'E'), ...net.branches.filter((b) => b.kind === 'R')];
  const parent = new Map<number, { br: Br; from: number }>();
  const depth = new Map<number, number>([[0, 0]]);
  const tree = new Set<Br>();
  const q = [0];
  while (q.length) {
    const u = q.shift()!;
    for (const b of order) {
      const w = b.a === u ? b.b : b.b === u ? b.a : -1;
      if (w >= 0 && !depth.has(w)) { depth.set(w, depth.get(u)! + 1); parent.set(w, { br: b, from: u }); tree.add(b); q.push(w); }
    }
  }
  if (depth.size < net.n) return null;
  const out: Loop[] = [];
  for (const c of net.branches) {
    if (tree.has(c)) continue;
    const items: Loop['items'] = [{ br: c, d: 1 }];
    // camino en el árbol de c.b hasta c.a
    let x = c.b, y = c.a;
    const up: Loop['items'] = [], down: Loop['items'] = [];
    while (x !== y) {
      if (depth.get(x)! >= depth.get(y)!) { const p = parent.get(x)!; up.push({ br: p.br, d: p.br.a === x ? 1 : -1 }); x = p.from; }
      else { const p = parent.get(y)!; down.push({ br: p.br, d: p.br.a === p.from ? 1 : -1 }); y = p.from; }
    }
    out.push({ chord: c, items: [...items, ...up, ...down.reverse()] });
  }
  return { loops: out, tree };
}

function termStr(coef: number, name: string, first: boolean) {
  const mag = Math.abs(coef) === 1 ? name : `${num(Math.abs(coef))}·${name}`;
  return first ? (coef < 0 ? `− ${mag}` : mag) : `${coef < 0 ? '−' : '+'} ${mag}`;
}
const sumStr = (parts: { c: number; n: string }[]) => (parts.length ? parts.map((p, i) => termStr(p.c, p.n, i === 0)).join(' ') : '0');
const currents = (net: Net, f: (b: Br) => number): Record<string, number> => Object.fromEntries(net.branches.map((b) => [b.id, f(b)]));
const vOf = (net: Net, I: Record<string, number>, b: Br) => (b.kind === 'R' ? b.v * I[b.id] : b.kind === 'E' ? b.v : NaN);

export function tableResults(net: Net, I: Record<string, number>, V?: number[]): Block {
  return {
    t: 'table', head: ['Elemento', 'Sentido', 'I (A)', 'V (V)', 'P (W)'],
    rows: net.branches.map((b) => {
      const vb = b.kind === 'J' && V ? V[b.a] - V[b.b] : vOf(net, I, b);
      return [b.label, dirTxt(net, b), num(I[b.id]), Number.isNaN(vb) ? '—' : num(vb), Number.isNaN(vb) ? '—' : num(vb * I[b.id])];
    }),
  };
}

/* ───────────── 1. Serie / paralelo + Ohm ───────────── */
interface TN { k: 'leaf' | 'ser' | 'par'; br?: Br; kids: { n: TN; s: 1 | -1 }[]; u: number; v: number; R: number; name: string }
interface Edge { u: number; v: number; n: TN }

export function reduceR(brs: Br[], t1: number, t2: number): { ok: boolean; edge?: Edge; steps: string[] } {
  let edges: Edge[] = brs.map((b) => ({ u: b.a, v: b.b, n: { k: 'leaf', br: b, kids: [], u: b.a, v: b.b, R: b.v, name: b.label } }));
  const steps: string[] = [];
  let cnt = 0;
  const flipS = (e: Edge, P: number) => (e.u === P ? 1 : -1) as 1 | -1;
  for (let again = true; again;) {
    again = false;
    const key = (e: Edge) => [Math.min(e.u, e.v), Math.max(e.u, e.v)].join('-');
    const groups = new Map<string, Edge[]>();
    for (const e of edges) { const k = key(e); if (!groups.has(k)) groups.set(k, []); groups.get(k)!.push(e); }
    for (const g of groups.values()) {
      if (g.length < 2) continue;
      const u = g[0].u, w = g[0].v;
      const R = 1 / g.reduce((a, e) => a + 1 / e.n.R, 0);
      const node: TN = { k: 'par', kids: g.map((e) => ({ n: e.n, s: (e.u === u ? 1 : -1) as 1 | -1 })), u, v: w, R, name: `Req${++cnt}` };
      steps.push(g.length === 2
        ? `${g[0].n.name} ∥ ${g[1].n.name}:  Req${cnt} = (${num(g[0].n.R)}·${num(g[1].n.R)}) / (${num(g[0].n.R)} + ${num(g[1].n.R)}) = ${v(R, 'Ω')}`
        : `${g.map((e) => e.n.name).join(' ∥ ')}:  1/Req${cnt} = ${g.map((e) => `1/${num(e.n.R)}`).join(' + ')}  →  Req${cnt} = ${v(R, 'Ω')}`);
      edges = edges.filter((e) => !g.includes(e)).concat({ u, v: w, n: node });
      again = true; break;
    }
    if (again) continue;
    const deg = new Map<number, Edge[]>();
    for (const e of edges) { for (const x of [e.u, e.v]) { if (!deg.has(x)) deg.set(x, []); deg.get(x)!.push(e); } }
    for (const [x, es] of deg) {
      if (x === t1 || x === t2 || es.length !== 2 || es[0] === es[1]) continue;
      const [e1, e2] = es;
      const s1 = (e1.v === x ? 1 : -1) as 1 | -1, p = s1 === 1 ? e1.u : e1.v;
      const s2 = (e2.u === x ? 1 : -1) as 1 | -1, q = s2 === 1 ? e2.v : e2.u;
      const R = e1.n.R + e2.n.R;
      const node: TN = { k: 'ser', kids: [{ n: e1.n, s: s1 }, { n: e2.n, s: s2 }], u: p, v: q, R, name: `Req${++cnt}` };
      steps.push(`${e1.n.name} + ${e2.n.name} (en serie):  Req${cnt} = ${num(e1.n.R)} + ${num(e2.n.R)} = ${v(R, 'Ω')}`);
      edges = edges.filter((e) => e !== e1 && e !== e2).concat({ u: p, v: q, n: node });
      again = true; break;
    }
  }
  void flipS;
  const ok = edges.length === 1 && ((edges[0].u === t1 && edges[0].v === t2) || (edges[0].u === t2 && edges[0].v === t1));
  return { ok, edge: edges[0], steps };
}

function expand(n: TN, Iown: number, I: Record<string, number>, lines: string[]) {
  if (n.k === 'leaf') { I[n.br!.id] = Iown; return; }
  if (n.k === 'ser') {
    lines.push(`${n.name} (serie ${n.kids.map((k) => k.n.name).join(' + ')}):  misma corriente I = ${v(Iown, 'A')}  →  ${n.kids.map((k) => `V(${k.n.name}) = ${num(k.n.R)}·${num(Math.abs(Iown))} = ${v(k.n.R * Math.abs(Iown), 'V')}`).join(' ; ')}`);
    for (const k of n.kids) expand(k.n, k.s * Iown, I, lines);
  } else {
    const V = Iown * n.R;
    lines.push(`${n.name} (paralelo ${n.kids.map((k) => k.n.name).join(' ∥ ')}):  misma tensión V = I·Req = ${num(Math.abs(Iown))}·${num(n.R)} = ${v(Math.abs(V), 'V')}  →  ${n.kids.map((k) => `I(${k.n.name}) = V/${num(k.n.R)} = ${v(Math.abs(V / k.n.R), 'A')}`).join(' ; ')}`);
    for (const k of n.kids) expand(k.n, k.s * (V / k.n.R), I, lines);
  }
}

export function serie(net: Net): MethodResult {
  const E = net.branches.filter((b) => b.kind === 'E'), J = net.branches.filter((b) => b.kind === 'J');
  if (E.length !== 1 || J.length) return na('Solo se puede reducir por serie/paralelo cuando hay una única fuente de tensión y ninguna de corriente.', 'serie');
  const src = E[0];
  const red = reduceR(net.branches.filter((b) => b.kind === 'R'), src.a, src.b);
  if (!red.ok || !red.edge) return na('El circuito no se reduce a una sola resistencia con serie y paralelo (hay un puente u otra configuración mixta).', 'serie');
  const r = mk('serie');
  const R = red.edge.n.R;
  const Inet = src.v / R; // de la fuente (+) hacia la red
  r.blocks.push({ t: 'p', text: 'Se agrupan las resistencias en serie y en paralelo hasta tener una sola resistencia equivalente vista por la fuente.' });
  r.blocks.push({ t: 'h', text: 'Paso 1 · Reducir el circuito' }, { t: 'eq', lines: red.steps });
  r.blocks.push({ t: 'h', text: 'Paso 2 · Ley de Ohm en el circuito equivalente' }, { t: 'eq', lines: [`Req total = ${v(R, 'Ω')}`, `I = E / Req = ${num(src.v)} / ${num(R)} = ${v(Inet, 'A')}`] });
  const I: Record<string, number> = {};
  const lines: string[] = [];
  const own = red.edge.u === src.a ? Inet : -Inet;
  expand(red.edge.n, own, I, lines);
  I[src.id] = -Inet;
  r.blocks.push({ t: 'h', text: 'Paso 3 · Deshacer las reducciones (divisor de tensión y de corriente)' }, { t: 'eq', lines: lines.reverse() });
  r.I = I;
  r.blocks.push({ t: 'h', text: 'Resultado' }, tableResults(net, I, net.truth.V));
  return r;
}

/* ───────────── 2. Kirchhoff ───────────── */
export function kirchhoff(net: Net): MethodResult {
  const L = loops(net);
  if (!L) return na('El circuito no se puede recorrer con las ramas de resistencia y fuentes de tensión (fuente de corriente en serie).', 'kirchhoff');
  const nb = net.branches.length;
  const r = mk('kirchhoff');
  const idx = new Map(net.branches.map((b, i) => [b.id, i]));
  const Iv = (b: Br) => `I_${b.label}`;
  const A: number[][] = [], z: number[] = [];
  const eqs: string[] = [], eqn: string[] = [];
  r.blocks.push({ t: 'p', text: `Incógnitas: la corriente de cada rama (${nb}), con el sentido de referencia indicado en la tabla de ramas. Se escriben ${net.n - 1} ecuaciones de nudos (1.ª ley) y las de lazos (2.ª ley) que hagan falta.` });
  // 1.ª ley
  r.blocks.push({ t: 'h', text: 'Primera ley (nudos): Σ corrientes que salen = Σ corrientes que entran' });
  for (let i = 1; i < net.n; i++) {
    const row = new Array(nb).fill(0);
    const parts: { c: number; n: string }[] = [];
    for (const b of net.branches) { const c = b.a === i ? 1 : b.b === i ? -1 : 0; if (c) { row[idx.get(b.id)!] = c; parts.push({ c, n: Iv(b) }); } }
    A.push(row); z.push(0); eqs.push(`Nudo ${nm(net, i)}:  ${sumStr(parts)} = 0`);
  }
  r.blocks.push({ t: 'eq', lines: eqs.splice(0) });
  // fuentes de corriente
  net.branches.filter((b) => b.kind === 'J').forEach((b) => { const row = new Array(nb).fill(0); row[idx.get(b.id)!] = 1; A.push(row); z.push(b.v); eqs.push(`${Iv(b)} = ${v(b.v, 'A')}   (fuente de corriente)`); });
  // 2.ª ley
  const kvl = L.loops.filter((l) => l.chord.kind !== 'J');
  r.blocks.push({ t: 'h', text: 'Segunda ley (lazos): Σ caídas de tensión = Σ fuerzas electromotrices' });
  kvl.forEach((l, k) => {
    const row = new Array(nb).fill(0);
    let rhs = 0;
    const lhs: { c: number; n: string }[] = [], lhsN: { c: number; n: string }[] = [], rhsS: { c: number; n: string }[] = [];
    for (const it of l.items) {
      if (it.br.kind === 'R') { row[idx.get(it.br.id)!] += it.d * it.br.v; lhs.push({ c: it.d, n: `${it.br.label}·${Iv(it.br)}` }); lhsN.push({ c: it.d * it.br.v, n: Iv(it.br) }); }
      else if (it.br.kind === 'E') { rhs -= it.d * it.br.v; rhsS.push({ c: -it.d, n: it.br.label }); }
    }
    A.push(row); z.push(rhs);
    eqs.push(`Lazo ${k + 1} (${l.items.map((i) => i.br.label).join(' → ')}):  ${sumStr(lhs)} = ${sumStr(rhsS)}`);
    eqn.push(`Lazo ${k + 1}:  ${sumStr(lhsN)} = ${num(rhs)}`);
  });
  r.blocks.push({ t: 'eq', lines: eqs.slice(net.branches.filter((b) => b.kind === 'J').length) });
  r.blocks.push({ t: 'p', text: 'Con los valores numéricos:' }, { t: 'eq', lines: eqn });
  const x = solveLinear(A, z);
  if (!x) return na('El sistema de ecuaciones es singular.', 'kirchhoff');
  const I = Object.fromEntries(net.branches.map((b, i) => [b.id, x[i]]));
  r.blocks.push({ t: 'h', text: 'Resolución del sistema' }, { t: 'p', text: `Sistema de ${nb} ecuaciones con ${nb} incógnitas, resuelto por eliminación gaussiana.` });
  r.I = I;
  r.blocks.push(tableResults(net, I, net.truth.V));
  return r;
}

/* ───────────── 3. Mallas ───────────── */
export function mallas(net: Net): MethodResult {
  const L = loops(net);
  if (!L) return na('No se pueden definir lazos independientes con las ramas de resistencia y de fuentes de tensión.', 'mallas');
  const unk = L.loops.filter((l) => l.chord.kind !== 'J');
  const known = L.loops.filter((l) => l.chord.kind === 'J');
  const r = mk('mallas');
  r.blocks.push({ t: 'p', text: `Se eligen ${L.loops.length} lazos independientes (uno por cada rama que cierra un lazo con el árbol de ramas) y a cada uno se le asigna una corriente de malla en el sentido de su primera rama. Cada rama real lleva la suma (con signo) de las corrientes de malla que pasan por ella.` });
  r.blocks.push({ t: 'table', head: ['Malla', 'Corriente', 'Recorrido'], rows: L.loops.map((l, k) => [`${k + 1}`, `J${k + 1}`, l.items.map((i) => `${i.d > 0 ? '' : '(inv.) '}${i.br.label}`).join(' → ')]) });
  const idxOf = new Map(L.loops.map((l, k) => [l, k]));
  const sgn = (l: Loop, br: Br) => l.items.find((i) => i.br === br)?.d ?? 0;
  const m = unk.length;
  const A = Array.from({ length: m }, () => new Array(m).fill(0));
  const z = new Array(m).fill(0);
  const lines: string[] = [], linesN: string[] = [];
  const Jv = new Map<Loop, number>(known.map((l) => [l, l.chord.v]));
  unk.forEach((lk, k) => {
    const self: Br[] = [], parts: string[] = [];
    let rhsC = 0;
    const rhsS: { c: number; n: string }[] = [];
    const T: { neg: boolean; s: string; n: string }[] = [];
    const join = (key: 's' | 'n') => T.map((t, i) => `${t.neg ? '−' : i ? '+' : ''}${t.neg || i ? ' ' : ''}${t[key]}`).join(' ');
    for (const lj of L.loops) {
      const shared = lk.items.filter((i) => i.br.kind === 'R' && sgn(lj, i.br) !== 0);
      const Rsum = shared.reduce((a, i) => a + i.br.v * i.d * sgn(lj, i.br), 0);
      if (lj === lk) { self.push(...shared.map((s) => s.br)); T.push({ neg: false, s: `(${shared.map((s) => s.br.label).join(' + ')})·J${idxOf.get(lk)! + 1}`, n: `${num(Rsum)}·J${idxOf.get(lk)! + 1}` }); A[k][unk.indexOf(lk)] = Rsum; continue; }
      if (!shared.length) continue;
      T.push({ neg: Rsum < 0, s: `(${shared.map((s) => s.br.label).join(' + ')})·J${idxOf.get(lj)! + 1}`, n: `${num(Math.abs(Rsum))}·J${idxOf.get(lj)! + 1}` });
      if (lj.chord.kind === 'J') rhsC -= Rsum * Jv.get(lj)!; else A[k][unk.indexOf(lj)] = Rsum;
    }
    for (const it of lk.items) if (it.br.kind === 'E') { rhsC -= it.d * it.br.v; rhsS.push({ c: -it.d, n: it.br.label }); }
    z[k] = rhsC;
    void parts; void self;
    lines.push(`Malla ${idxOf.get(lk)! + 1}:  ${join('s')}  =  ${sumStr(rhsS)}`);
    linesN.push(`Malla ${idxOf.get(lk)! + 1}:  ${join('n')}  =  ${num(rhsC)}`);
  });
  known.forEach((l) => { lines.push(`Malla ${idxOf.get(l)! + 1}:  J${idxOf.get(l)! + 1} = ${v(l.chord.v, 'A')}   (la malla contiene la fuente de corriente ${l.chord.label})`); });
  r.blocks.push({ t: 'h', text: 'Ecuaciones de malla (2.ª ley de Kirchhoff)' }, { t: 'eq', lines }, { t: 'p', text: 'Con los valores numéricos:' }, { t: 'eq', lines: linesN });
  const sol = m ? solveLinear(A, z) : [];
  if (!sol) return na('El sistema de ecuaciones de malla es singular.', 'mallas');
  const Jval = new Map<Loop, number>();
  unk.forEach((l, k) => Jval.set(l, sol[k]));
  known.forEach((l) => Jval.set(l, l.chord.v));
  r.blocks.push({ t: 'h', text: 'Corrientes de malla' }, { t: 'eq', lines: L.loops.map((l, k) => `J${k + 1} = ${v(Jval.get(l)!, 'A')}`) });
  const I = currents(net, (b) => L.loops.reduce((a, l) => a + sgn(l, b) * Jval.get(l)!, 0));
  r.blocks.push({ t: 'h', text: 'Corriente de cada rama' }, { t: 'eq', lines: net.branches.map((b) => `I_${b.label} = ${L.loops.filter((l) => sgn(l, b) !== 0).map((l, i) => `${sgn(l, b) < 0 ? '−' : i ? '+' : ''} J${idxOf.get(l)! + 1}`).join(' ')} = ${v(I[b.id], 'A')}`) });
  r.I = I;
  r.blocks.push(tableResults(net, I, net.truth.V));
  return r;
}

/* ───────────── 4. Nudos ───────────── */
export function nudos(net: Net): MethodResult {
  // Fuentes reales (E + r_int en serie) → equivalente Norton
  const used = new Set<Br>();
  interface Nort { E: Br; R: Br; a: number; b: number }
  const nort: Nort[] = [];
  for (const E of net.branches.filter((b) => b.kind === 'E')) {
    const m = E.b;
    const at = net.branches.filter((b) => b.a === m || b.b === m);
    if (at.length === 2) { const R = at.find((b) => b !== E && b.kind === 'R' && b.internal); if (R && R.a === m) { nort.push({ E, R, a: E.a, b: R.b }); used.add(E); used.add(R); } }
  }
  const ideal = net.branches.filter((b) => b.kind === 'E' && !used.has(b));
  const fixed = new Map<number, number>([[0, 0]]);
  for (const E of ideal) {
    if (E.b === 0) fixed.set(E.a, E.v); else if (E.a === 0) fixed.set(E.b, -E.v);
    else return na('Hay una fuente de tensión ideal entre dos nudos sin masa (supernudo): este método simple no la incluye.', 'nudos');
  }
  const r = mk('nudos');
  r.blocks.push({ t: 'p', text: `Se toma el nudo 0 como referencia (0 V). Las incógnitas son las tensiones de los demás nudos respecto a él. En cada nudo se aplica la 1.ª ley de Kirchhoff expresando las corrientes con la ley de Ohm: I = (V_nudo − V_vecino)/R.` });
  if (nort.length) r.blocks.push({ t: 'h', text: 'Transformación de fuentes reales' }, { t: 'eq', lines: nort.map((n) => `${n.E.label} = ${v(n.E.v, 'V')} en serie con ${n.R.label} = ${v(n.R.v, 'Ω')}  ⇒  fuente de corriente I_N = E/r = ${num(n.E.v)}/${num(n.R.v)} = ${v(n.E.v / n.R.v, 'A')} en paralelo con ${num(n.R.v)} Ω, entre ${nm(net, n.a)} y ${nm(net, n.b)}`) });
  if (ideal.length) r.blocks.push({ t: 'note', text: ideal.map((e) => `${e.label} fija la tensión del nudo ${nm(net, e.b === 0 ? e.a : e.b)} en ${v(e.b === 0 ? e.v : -e.v, 'V')}.`).join(' ') });
  // red equivalente
  interface R2 { a: number; b: number; R: number; label: string }
  const Rs: R2[] = net.branches.filter((b) => b.kind === 'R' && !used.has(b)).map((b) => ({ a: b.a, b: b.b, R: b.v, label: b.label })).concat(nort.map((n) => ({ a: n.a, b: n.b, R: n.R.v, label: n.R.label })));
  const Js: { a: number; b: number; v: number; label: string }[] = net.branches.filter((b) => b.kind === 'J').map((b) => ({ a: b.a, b: b.b, v: b.v, label: b.label })).concat(nort.map((n) => ({ a: n.a, b: n.b, v: -n.E.v / n.R.v, label: `${n.E.label}/${n.R.label}` })));
  const eliminated = new Set(nort.map((n) => n.E.b));
  const unk = Array.from({ length: net.n }, (_, i) => i).filter((i) => !fixed.has(i) && !eliminated.has(i));
  const col = new Map(unk.map((n, k) => [n, k]));
  const A = Array.from({ length: unk.length }, () => new Array(unk.length).fill(0));
  const z = new Array(unk.length).fill(0);
  const lines: string[] = [], linesN: string[] = [];
  unk.forEach((i, k) => {
    const diag: Br[] = [], off = new Map<number, string[]>();
    const symb: string[] = [], rhsS: { c: number; n: string }[] = [];
    for (const q of Rs) {
      const j = q.a === i ? q.b : q.b === i ? q.a : -1;
      if (j < 0) continue;
      A[k][k] += 1 / q.R; diag.push({ label: q.label } as Br);
      if (fixed.has(j)) z[k] += fixed.get(j)! / q.R;
      else { A[k][col.get(j)!] -= 1 / q.R; off.set(j, [...(off.get(j) ?? []), q.label]); }
      if (fixed.has(j) && fixed.get(j) !== 0) rhsS.push({ c: 1, n: `${num(fixed.get(j)!)}/${q.label}` });
    }
    symb.push(`(${diag.map((d) => `1/${d.label}`).join(' + ')})·V_${nm(net, i)}`);
    for (const [j, ls] of off) symb.push(`− (${ls.map((l) => `1/${l}`).join(' + ')})·V_${nm(net, j)}`);
    for (const J of Js) { if (J.b === i) { z[k] += J.v; rhsS.push({ c: 1, n: J.label }); } if (J.a === i) { z[k] -= J.v; rhsS.push({ c: -1, n: J.label }); } }
    lines.push(`Nudo ${nm(net, i)}:  ${symb.join(' ')}  =  ${sumStr(rhsS)}   (corrientes inyectadas)`);
    const numb: string[] = [`${num(A[k][k])}·V_${nm(net, i)}`];
    for (const [j] of off) numb.push(`${A[k][col.get(j)!] < 0 ? '−' : '+'} ${num(Math.abs(A[k][col.get(j)!]))}·V_${nm(net, j)}`);
    linesN.push(`Nudo ${nm(net, i)}:  ${numb.join(' ')}  =  ${num(z[k])}`);
  });
  r.blocks.push({ t: 'h', text: 'Ecuaciones de nudo' }, { t: 'eq', lines }, { t: 'p', text: 'Con los valores numéricos (conductancias en S):' }, { t: 'eq', lines: linesN });
  const sol = unk.length ? solveLinear(A, z) : [];
  if (!sol) return na('El sistema nodal es singular.', 'nudos');
  const V = new Array(net.n).fill(0);
  fixed.forEach((x, i) => { V[i] = x; });
  unk.forEach((n, k) => { V[n] = sol[k]; });
  r.blocks.push({ t: 'h', text: 'Tensiones de nudo' }, { t: 'eq', lines: V.map((x, i) => `V_${nm(net, i)} = ${v(x, 'V')}`) });
  // corrientes de rama
  const I: Record<string, number> = {};
  for (const b of net.branches) if (b.kind === 'R' && !used.has(b)) I[b.id] = (V[b.a] - V[b.b]) / b.v;
  for (const n of nort) { const i = (V[n.a] - V[n.b] - n.E.v) / n.R.v; I[n.E.id] = i; I[n.R.id] = i; }
  for (const b of net.branches) if (b.kind === 'J') I[b.id] = b.v;
  for (const E of ideal) {
    const node = E.b === 0 ? E.a : E.b;
    const out = net.branches.filter((b) => b !== E && (b.a === node || b.b === node)).reduce((s, b) => s + (b.a === node ? 1 : -1) * (I[b.id] ?? 0), 0);
    I[E.id] = E.b === 0 ? -out : out;
  }
  r.blocks.push({ t: 'h', text: 'Corrientes de rama (ley de Ohm)' }, tableResults(net, I, V));
  r.I = I;
  return r;
}

/* ───────────── 5. Millman ───────────── */
export function millman(net: Net): MethodResult {
  interface Ch { u: number; v: number; items: { br: Br; s: 1 | -1 }[] }
  let ch: Ch[] = net.branches.map((b) => ({ u: b.a, v: b.b, items: [{ br: b, s: 1 }] }));
  for (let again = true; again;) {
    again = false;
    const deg = new Map<number, Ch[]>();
    for (const c of ch) for (const x of [c.u, c.v]) { if (!deg.has(x)) deg.set(x, []); deg.get(x)!.push(c); }
    for (const [x, cs] of deg) {
      if (cs.length !== 2 || cs[0] === cs[1] || net.n <= 2) continue;
      const [c1, c2] = cs;
      const f1 = c1.v === x ? 1 : -1, f2 = c2.u === x ? 1 : -1;
      const items = [...(f1 === 1 ? c1.items : [...c1.items].reverse().map((i) => ({ ...i, s: -i.s as 1 | -1 }))), ...(f2 === 1 ? c2.items : [...c2.items].reverse().map((i) => ({ ...i, s: -i.s as 1 | -1 })))];
      ch = ch.filter((c) => c !== c1 && c !== c2).concat({ u: f1 === 1 ? c1.u : c1.v, v: f2 === 1 ? c2.v : c2.u, items });
      again = true; break;
    }
  }
  const nodes = new Set(ch.flatMap((c) => [c.u, c.v]));
  if (nodes.size !== 2 || ch.length < 2) return na('Millman exige un circuito formado solo por ramas en paralelo entre dos nudos (cada rama con su fuente y su resistencia en serie).', 'millman');
  const [P, Q] = [...nodes];
  const branches = ch.map((c) => (c.u === P ? c : { u: P, v: Q, items: [...c.items].reverse().map((i) => ({ ...i, s: -i.s as 1 | -1 })) }));
  const info = branches.map((c) => {
    const Rk = c.items.filter((i) => i.br.kind === 'R').reduce((a, i) => a + i.br.v, 0);
    const Ek = c.items.filter((i) => i.br.kind === 'E').reduce((a, i) => a + i.s * i.br.v, 0);
    const J = c.items.filter((i) => i.br.kind === 'J').reduce((a, i) => a + i.s * i.br.v, 0);
    return { c, Rk, Ek, J, hasJ: c.items.some((i) => i.br.kind === 'J') };
  });
  if (info.some((x) => !x.hasJ && x.Rk <= 0)) return na('Una de las ramas tiene una fuente ideal sin resistencia: Millman no se puede aplicar (divide por 0).', 'millman');
  if (info.filter((x) => x.hasJ).length > 0 && info.some((x) => x.hasJ && x.c.items.filter((i) => i.br.kind === 'J').length > 1)) return na('Rama con varias fuentes de corriente en serie.', 'millman');
  const r = mk('millman');
  r.blocks.push({ t: 'p', text: `El circuito se reduce a ${branches.length} ramas en paralelo entre los nudos ${nm(net, P)} y ${nm(net, Q)}. Cada rama k tiene una f.e.m. equivalente E_k (positiva si empuja corriente de ${nm(net, P)} a ${nm(net, Q)}) y una resistencia R_k.` });
  r.blocks.push({ t: 'table', head: ['Rama', 'Elementos', 'E_k (V)', 'R_k (Ω)', 'G_k = 1/R_k (S)', 'E_k/R_k (A)'], rows: info.map((x, k) => [`${k + 1}`, x.c.items.map((i) => i.br.label).join(' + '), x.hasJ ? '—' : num(x.Ek), x.hasJ ? '(fuente de corriente)' : num(x.Rk), x.hasJ ? '—' : num(1 / x.Rk), x.hasJ ? num(x.J) : num(x.Ek / x.Rk)]) });
  const num_ = info.reduce((a, x) => a + (x.hasJ ? -x.J : x.Ek / x.Rk), 0), den = info.reduce((a, x) => a + (x.hasJ ? 0 : 1 / x.Rk), 0);
  const Vpq = num_ / den;
  r.blocks.push({ t: 'h', text: 'Fórmula de Millman' }, { t: 'eq', lines: [`V_${nm(net, P)}${nm(net, Q)} = ( Σ E_k/R_k ${info.some((x) => x.hasJ) ? '− Σ I_fuentes ' : ''}) / ( Σ 1/R_k )`, `V_${nm(net, P)}${nm(net, Q)} = ( ${info.map((x) => (x.hasJ ? `(${num(-x.J)})` : `${num(x.Ek)}/${num(x.Rk)}`)).join(' + ')} ) / ( ${info.filter((x) => !x.hasJ).map((x) => `1/${num(x.Rk)}`).join(' + ')} )`, `V_${nm(net, P)}${nm(net, Q)} = ${num(num_)} / ${num(den)} = ${v(Vpq, 'V')}`] });
  const I: Record<string, number> = {};
  const lines: string[] = [];
  for (const [k, x] of info.entries()) {
    const Ik = x.hasJ ? x.J : (Vpq - x.Ek) / x.Rk;
    lines.push(x.hasJ ? `Rama ${k + 1}: la fuente de corriente impone I = ${v(Ik, 'A')}` : `Rama ${k + 1}: I = (V − E_k)/R_k = (${num(Vpq)} − ${num(x.Ek)}) / ${num(x.Rk)} = ${v(Ik, 'A')}`);
    for (const it of x.c.items) I[it.br.id] = it.s * Ik;
  }
  r.blocks.push({ t: 'h', text: 'Corriente de cada rama' }, { t: 'eq', lines }, { t: 'p', text: `Comprobación de la 1.ª ley en el nudo ${nm(net, P)}: la suma de las corrientes de las ramas es ${v(info.reduce((a, x, k) => a + (x.hasJ ? x.J : (Vpq - x.Ek) / x.Rk) * 1 + 0 * k, 0), 'A')} (debe ser 0).` });
  r.I = I;
  r.blocks.push(tableResults(net, I, net.truth.V));
  return r;
}

/* ───────────── Equivalentes (Thévenin / Norton) ───────────── */
function solveNet(net: Net, brs: Br[], extra: Element[] = []): { V: number[]; I: Record<string, number>; ok: boolean } {
  const el: Element[] = brs.map((b): Element => (b.kind === 'R' ? { id: b.id, kind: 'R', a: b.a, b: b.b, value: b.v } : b.kind === 'E' ? { id: b.id, kind: 'V', a: b.a, b: b.b, value: b.v } : { id: b.id, kind: 'I', a: b.a, b: b.b, value: b.v })).concat(extra);
  const s = solveDC({ nodeCount: net.n, elements: el });
  return { V: s.voltages, I: s.currents, ok: s.ok };
}

function equivalent(net: Net, loadId: string | undefined) {
  const loads = net.branches.filter((b) => b.kind === 'R' && !b.internal);
  const load = loads.find((b) => b.id === loadId) ?? loads[loads.length - 1];
  if (!load) return null;
  const rest = net.branches.filter((b) => b !== load);
  const open = solveNet(net, rest);
  const Vth = open.V[load.a] - open.V[load.b];
  // Resistencia de Thévenin: fuentes apagadas
  const uf = Array.from({ length: net.n }, (_, i) => i);
  const f = (x: number): number => (uf[x] === x ? x : (uf[x] = f(uf[x])));
  for (const b of rest) if (b.kind === 'E') uf[f(b.a)] = f(b.b);
  const pas = rest.filter((b) => b.kind === 'R').map((b) => ({ ...b, a: f(b.a), b: f(b.b) })).filter((b) => b.a !== b.b);
  const A = f(load.a), B = f(load.b);
  let Rth = NaN, steps: string[] = [], how = '';
  if (A === B) { Rth = 0; steps = ['Los dos terminales quedan unidos al apagar las fuentes de tensión: Rth = 0 Ω.']; how = 'cable'; }
  else {
    const red = reduceR(pas, A, B);
    if (red.ok && red.edge) { Rth = red.edge.n.R; steps = red.steps; how = 'serie'; }
    else {
      const inj = solveNet({ ...net }, pas, [{ id: '#inj', kind: 'I', a: B, b: A, value: 1 }]);
      Rth = inj.V[A] - inj.V[B]; steps = ['La red no se reduce por serie/paralelo (puente). Se inyecta 1 A entre los terminales y se mide la tensión: Rth = V/1 A.']; how = 'inyeccion';
    }
  }
  const sc = solveNet(net, rest, [{ id: '#sc', kind: 'V', a: load.a, b: load.b, value: 0 }]);
  const In = sc.I['#sc'];
  return { load, Vth, Rth, steps, how, In, open };
}

export function thevenin(net: Net, loadId?: string): MethodResult {
  const eq = equivalent(net, loadId);
  if (!eq) return na('No hay ninguna resistencia que usar como carga.', 'thevenin');
  const { load, Vth, Rth, steps, open } = eq;
  const r = mk('thevenin', 'carga');
  r.blocks.push({ t: 'p', text: `Se elige como carga ${load.label} (${v(load.v, 'Ω')}), entre los nudos ${nm(net, load.a)} y ${nm(net, load.b)}. El resto del circuito se sustituye por una fuente de tensión V_th en serie con una resistencia R_th.` });
  r.blocks.push({ t: 'h', text: 'Paso 1 · Tensión de Thévenin (carga desconectada)' }, { t: 'p', text: 'Con la carga retirada se calcula la tensión en circuito abierto entre sus terminales (tensiones de nudo resueltas por nudos):' }, { t: 'eq', lines: [...open.V.map((x, i) => `V_${nm(net, i)} = ${v(x, 'V')}`), `V_th = V_${nm(net, load.a)} − V_${nm(net, load.b)} = ${num(open.V[load.a])} − ${num(open.V[load.b])} = ${v(Vth, 'V')}`] });
  r.blocks.push({ t: 'h', text: 'Paso 2 · Resistencia de Thévenin (fuentes apagadas)' }, { t: 'p', text: 'Se apagan las fuentes: las de tensión se sustituyen por un cable y las de corriente por un circuito abierto. Se calcula la resistencia vista desde los terminales:' }, { t: 'eq', lines: [...steps, `R_th = ${v(Rth, 'Ω')}`] });
  const IL = Vth / (Rth + load.v);
  r.blocks.push({ t: 'h', text: 'Paso 3 · Circuito equivalente y carga' }, { t: 'eq', lines: [`I_carga = V_th / (R_th + R_carga) = ${num(Vth)} / (${num(Rth)} + ${num(load.v)}) = ${v(IL, 'A')}`, `V_carga = I·R_carga = ${num(IL)}·${num(load.v)} = ${v(IL * load.v, 'V')}`, `P_carga = V·I = ${v(IL * IL * load.v, 'W')}`] });
  r.I = { [load.id]: IL };
  r.blocks.push({ t: 'note', text: 'Thévenin solo da las magnitudes de la carga elegida; para el resto de ramas usa otro método.' });
  return r;
}

export function norton(net: Net, loadId?: string): MethodResult {
  const eq = equivalent(net, loadId);
  if (!eq) return na('No hay ninguna resistencia que usar como carga.', 'norton');
  const { load, Rth, steps, In, Vth } = eq;
  const r = mk('norton', 'carga');
  r.blocks.push({ t: 'p', text: `Carga elegida: ${load.label} (${v(load.v, 'Ω')}), entre ${nm(net, load.a)} y ${nm(net, load.b)}. El resto del circuito se sustituye por una fuente de corriente I_N en paralelo con una resistencia R_N.` });
  r.blocks.push({ t: 'h', text: 'Paso 1 · Corriente de Norton (carga en cortocircuito)' }, { t: 'p', text: 'Se sustituye la carga por un cable y se calcula la corriente que lo atraviesa:' }, { t: 'eq', lines: [`I_N = I_cc = ${v(In, 'A')}`] });
  r.blocks.push({ t: 'h', text: 'Paso 2 · Resistencia de Norton' }, { t: 'p', text: 'Es la misma que la de Thévenin (fuentes apagadas, vista desde los terminales):' }, { t: 'eq', lines: [...steps, `R_N = ${v(Rth, 'Ω')}`] });
  const IL = (In * Rth) / (Rth + load.v);
  r.blocks.push({ t: 'h', text: 'Paso 3 · Divisor de corriente' }, { t: 'eq', lines: [`I_carga = I_N · R_N / (R_N + R_carga) = ${num(In)} · ${num(Rth)} / (${num(Rth)} + ${num(load.v)}) = ${v(IL, 'A')}`, `V_carga = I·R_carga = ${v(IL * load.v, 'V')}`, `Comprobación: V_th = I_N·R_N = ${num(In)}·${num(Rth)} = ${v(In * Rth, 'V')}  (Thévenin: ${num(Vth)} V)`] });
  r.I = { [load.id]: IL };
  r.blocks.push({ t: 'note', text: 'Norton solo da las magnitudes de la carga elegida; para el resto de ramas usa otro método.' });
  return r;
}

/* ───────────── 8. Superposición ───────────── */
export function superposicion(net: Net): MethodResult {
  const srcs = net.branches.filter((b) => b.kind !== 'R');
  if (srcs.length < 2) return na('La superposición solo tiene sentido con dos o más fuentes independientes.', 'superposicion');
  const r = mk('superposicion');
  r.blocks.push({ t: 'p', text: 'La respuesta de un circuito lineal con varias fuentes es la suma de las respuestas a cada fuente por separado, con las demás apagadas (fuentes de tensión → cable, fuentes de corriente → circuito abierto). La resistencia interna de las pilas se mantiene.' });
  const partial: Record<string, number>[] = [];
  const total: Record<string, number> = Object.fromEntries(net.branches.map((b) => [b.id, 0]));
  srcs.forEach((s, k) => {
    const brs = net.branches.filter((b) => b.kind === 'R' || b === s || (b.kind === 'E' && b !== s)).filter((b) => b.kind !== 'J' || b === s).map((b) => (b.kind === 'E' && b !== s ? { ...b, v: 0 } : b));
    const sol = solveNet(net, brs);
    const I = Object.fromEntries(net.branches.map((b) => [b.id, sol.I[b.id] ?? 0]));
    partial.push(I);
    for (const b of net.branches) total[b.id] += I[b.id];
    r.blocks.push({ t: 'h', text: `Caso ${k + 1} · actúa solo ${s.label}` }, { t: 'p', text: `Se apagan: ${srcs.filter((o) => o !== s).map((o) => `${o.label} (${o.kind === 'E' ? 'cable' : 'abierto'})`).join(', ')}. Se resuelve el circuito resultante (serie/paralelo o nudos).` });
    r.blocks.push({ t: 'table', head: ['Rama', `I con solo ${s.label} (A)`], rows: net.branches.filter((b) => b.kind === 'R').map((b) => [b.label, num(I[b.id])]) });
  });
  r.blocks.push({ t: 'h', text: 'Suma de las respuestas' }, { t: 'table', head: ['Rama', ...srcs.map((s) => `Solo ${s.label}`), 'Total (A)'], rows: net.branches.map((b) => [b.label, ...partial.map((p) => num(p[b.id])), num(total[b.id])]) });
  r.blocks.push({ t: 'note', text: 'La potencia no se puede superponer (depende del cuadrado de la corriente): se calcula con la corriente total.' });
  r.I = total;
  r.blocks.push(tableResults(net, total, net.truth.V));
  return r;
}

export function balance(net: Net, I: Record<string, number>): Block[] {
  const V = net.truth.V;
  const rows = net.branches.map((b) => {
    const vb = b.kind === 'R' ? b.v * I[b.id] : b.kind === 'E' ? b.v : V[b.a] - V[b.b];
    return { b, P: vb * I[b.id] };
  });
  const gen = -rows.filter((r) => r.P < -1e-12).reduce((a, r) => a + r.P, 0), abs = rows.filter((r) => r.P > 1e-12).reduce((a, r) => a + r.P, 0);
  return [
    { t: 'table', head: ['Elemento', 'Potencia absorbida (W)', 'Papel'], rows: rows.map((r) => [r.b.label, num(r.P), r.P < -1e-12 ? 'genera' : r.P > 1e-12 ? 'consume' : '—']) },
    { t: 'eq', lines: [`Σ P generada = ${v(gen, 'W')}`, `Σ P consumida = ${v(abs, 'W')}`, `Diferencia = ${v(gen - abs, 'W')}  →  ${Math.abs(gen - abs) < 1e-6 * Math.max(1, gen) ? 'el balance de potencias se cumple' : 'revisar'}`] },
  ];
}

export function runMethod(id: MethodId, net: Net, loadId?: string): MethodResult {
  switch (id) {
    case 'serie': return serie(net);
    case 'kirchhoff': return kirchhoff(net);
    case 'mallas': return mallas(net);
    case 'nudos': return nudos(net);
    case 'millman': return millman(net);
    case 'thevenin': return thevenin(net, loadId);
    case 'norton': return norton(net, loadId);
    case 'superposicion': return superposicion(net);
  }
}
export { signed, U };
