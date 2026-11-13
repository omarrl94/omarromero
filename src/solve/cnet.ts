/**
 * Red de «ramas» para resolver un circuito (CC o CA) a mano, con números complejos:
 *  - nudos esenciales con nombre (los que pone el alumno, o A, B, C… y la masa);
 *  - ramas = cadenas de elementos en serie entre dos nudos, con Z total, f.e.m. total E (en el sentido a→b) y el sentido
 *    de referencia de su corriente.
 * Convenio de rama: I (a→b) = (V_a − V_b + E) / Z. En CC todas las partes imaginarias son 0.
 */
import type { Project } from '../model/types';
import type { SimResult } from '../model/netlist';
import { termPos } from '../model/netlist';
import { defOf } from '../model/library';
import { C0, C1, add, sub, mul, div, abs, cneg, cx, isZero, subs, pretty, type C } from './cx';

export type DirMode = 'cargas' | 'haciaA';
export interface Part { label: string; comp: string; kind: 'Z' | 'E' | 'J'; v: C; /** sentido en que se recorre: +1 de su «a» a su «b», −1 al revés */ dir: 1 | -1; internal?: boolean; x: number; y: number }
export interface Rama { id: string; name: string; a: number; b: number; Z: C; E: C; J?: C; parts: Part[]; x: number; y: number }
export interface CNet {
  ok: boolean; reason?: string; ac: boolean; omega: number; freq: number;
  n: number; names: string[]; nodePos: { x: number; y: number }[]; ground: number;
  ramas: Rama[]; notes: string[];
  V: C[]; I: Record<string, C>;
  /** componente → posiciones de sus terminales y rama a la que pertenece (para dibujar flechas) */
  comps: { id: string; x: number; y: number; t0: { x: number; y: number }; t1: { x: number; y: number }; rama: string; dirAlong: 1 | -1 }[];
}

const SWITCHLIKE = new Set(['switch', 'pushNO', 'pushNC', 'spdt', 'fuse', 'breaker']);
const UNSUPPORTED: Record<string, string> = {
  diode: 'Hay diodos: son elementos no lineales y no se resuelven con estos métodos.', led: 'Hay LED: son elementos no lineales y no se resuelven con estos métodos.',
  zener: 'Hay diodos Zener: son no lineales y no se resuelven con estos métodos.', ntc: 'Hay termistores NTC: su valor depende de la temperatura; fija una resistencia para resolverlo.',
};
const empty = (reason: string): CNet => ({ ok: false, reason, ac: false, omega: 0, freq: 0, n: 0, names: [], nodePos: [], ground: 0, ramas: [], notes: [], V: [], I: {}, comps: [] });

export const nameOf = (project: Project, id: string) => {
  const c = project.components.find((x) => x.id === id);
  return c ? c.label || (c.id.length <= 4 ? c.id : defOf(c.type).name) : id;
};

/** Resuelve el sistema complejo A·x = z por eliminación gaussiana con pivote parcial. */
export function csolve(A: C[][], z: C[]): C[] | null {
  const n = z.length;
  const M = A.map((r, i) => [...r.map((c) => ({ ...c })), { ...z[i] }]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (abs(M[r][col]) > abs(M[piv][col])) piv = r;
    if (abs(M[piv][col]) < 1e-12) return null;
    [M[col], M[piv]] = [M[piv], M[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = div(M[r][col], M[col][col]);
      if (isZero(f)) continue;
      for (let k = col; k <= n; k++) M[r][k] = sub(M[r][k], mul(f, M[col][k]));
    }
  }
  return M.map((row, i) => div(row[n], row[i]));
}

/** Resuelve la red de ramas (todas las incógnitas a la vez): tensiones de nudo y corrientes de rama. */
export function solveRamas(n: number, ramas: Pick<Rama, 'a' | 'b' | 'Z' | 'E' | 'J'>[]): { V: C[]; I: C[] } | null {
  const m = ramas.length, N = n - 1; // nudo 0 = masa
  const dim = N + m;
  const A: C[][] = Array.from({ length: dim }, () => Array.from({ length: dim }, () => C0));
  const z: C[] = Array.from({ length: dim }, () => C0);
  const vi = (node: number) => node - 1; // columna de V_node
  for (let node = 1; node < n; node++) ramas.forEach((r, k) => { const col = N + k; if (r.a === node) A[node - 1][col] = add(A[node - 1][col], C1); if (r.b === node) A[node - 1][col] = sub(A[node - 1][col], C1); });
  ramas.forEach((r, k) => {
    const row = N + k, col = N + k;
    if (r.J) { A[row][col] = C1; z[row] = r.J; return; }
    if (r.a !== 0) A[row][vi(r.a)] = add(A[row][vi(r.a)], C1);
    if (r.b !== 0) A[row][vi(r.b)] = sub(A[row][vi(r.b)], C1);
    A[row][col] = cneg(r.Z); z[row] = cneg(r.E);
  });
  const x = csolve(A, z);
  if (!x) return null;
  return { V: [C0, ...x.slice(0, N)], I: x.slice(N) };
}

type RawEl = { id: string; kind: 'Z' | 'E' | 'J'; a: number; b: number; v: C; label: string; comp: string; internal?: boolean };

export function buildCNet(project: Project, sim: SimResult, dirMode: DirMode = 'cargas'): CNet {
  if (sim.ac?.problem.elements.some((e) => e.kind === 'T')) return empty('Hay transformadores: el solucionario por mallas y nudos todavía no los incluye (se resuelven en el simulador).');
  for (const c of project.components) if (UNSUPPORTED[c.type]) return empty(UNSUPPORTED[c.type]);
  if (!project.components.length) return empty('El circuito está vacío.');
  const ac = !!sim.ac;
  const omega = sim.ac?.omega ?? 0, freq = sim.ac?.freq ?? 0;
  const els = ac
    ? sim.ac!.problem.elements.map((e) => (e.kind === 'Z' ? { id: e.id, kind: 'R' as const, a: e.a, b: e.b, z: e.z } : e.kind === 'V' ? { id: e.id, kind: 'V' as const, a: e.a, b: e.b, v: e.v, rint: e.rint } : e.kind === 'I' ? { id: e.id, kind: 'I' as const, a: e.a, b: e.b, i: e.i } : { id: e.id, kind: 'R' as const, a: e.a, b: e.b, z: cx(1e9, 0) }))
    : sim.problem.elements.map((e) => (e.kind === 'R' ? { id: e.id, kind: 'R' as const, a: e.a, b: e.b, z: cx(e.value, 0) } : e.kind === 'V' ? { id: e.id, kind: 'V' as const, a: e.a, b: e.b, v: cx(e.value, 0), rint: e.rint } : { id: e.id, kind: 'I' as const, a: e.a, b: e.b, i: cx(e.value, 0) }));
  if (!els.length) return empty('El circuito no tiene elementos.');
  const total = ac ? sim.ac!.problem.nodeCount : sim.problem.nodeCount;
  const uf = Array.from({ length: total + els.length * 2 }, (_, i) => i);
  const find = (x: number): number => (uf[x] === x ? x : (uf[x] = find(uf[x])));
  const union = (a: number, b: number) => { uf[find(a)] = find(b); };
  const notes: string[] = [];
  const raw: RawEl[] = [];
  let extra = total;
  for (const e of els) {
    const compId = e.id.split('#')[0];
    const comp = project.components.find((c) => c.id === compId);
    const base = nameOf(project, compId);
    const sw = !!comp && SWITCHLIKE.has(comp.type);
    if (e.kind === 'R') {
      const z = e.z;
      if (abs(z) >= 1e7) continue; // abierto
      if (sw || abs(z) <= 1e-6) { union(e.a, e.b); if (sw) notes.push(`${base} está cerrado (o es un fusible): se trata como un cable.`); continue; }
      const suffix = e.id.includes('#') ? `(${e.id.split('#')[1]})` : '';
      raw.push({ id: e.id, kind: 'Z', a: e.a, b: e.b, v: z, label: base + suffix, comp: compId });
    } else if (e.kind === 'V') {
      if ((e.rint ?? 0) > 0) {
        const m = extra++;
        raw.push({ id: e.id, kind: 'E', a: e.a, b: m, v: e.v, label: base, comp: compId });
        raw.push({ id: e.id + '#rint', kind: 'Z', a: m, b: e.b, v: cx(e.rint!, 0), label: `r_int(${base})`, comp: compId, internal: true });
      } else raw.push({ id: e.id, kind: 'E', a: e.a, b: e.b, v: e.v, label: base, comp: compId });
    } else raw.push({ id: e.id, kind: 'J', a: e.a, b: e.b, v: e.i, label: base, comp: compId });
  }
  type Br = RawEl;
  let br: Br[] = [];
  for (const r of raw) {
    const a = find(r.a), b = find(r.b);
    if (a === b) { notes.push(`${r.label} queda entre dos puntos unidos por un cable: no pasa corriente por él.`); continue; }
    br.push({ ...r, a, b });
  }
  // Solo la parte conectada a una fuente, sin ramas colgantes
  const adj = new Map<number, Br[]>();
  const addAdj = (n: number, b: Br) => { if (!adj.has(n)) adj.set(n, []); adj.get(n)!.push(b); };
  for (const b of br) { addAdj(b.a, b); addAdj(b.b, b); }
  const seen = new Set<number>(), keep = new Set<Br>();
  for (const s of br.filter((b) => b.kind !== 'Z')) {
    if (seen.has(s.a)) continue;
    const st = [s.a]; seen.add(s.a);
    while (st.length) { const u = st.pop()!; for (const b of adj.get(u) ?? []) { keep.add(b); const w = b.a === u ? b.b : b.a; if (!seen.has(w)) { seen.add(w); st.push(w); } } }
  }
  br = br.filter((b) => keep.has(b));
  for (let again = true; again;) {
    again = false;
    const deg = new Map<number, number>();
    for (const b of br) { deg.set(b.a, (deg.get(b.a) ?? 0) + 1); deg.set(b.b, (deg.get(b.b) ?? 0) + 1); }
    const dangling = br.find((b) => deg.get(b.a) === 1 || deg.get(b.b) === 1);
    if (dangling) { br = br.filter((b) => b !== dangling); again = true; }
  }
  if (!br.some((b) => b.kind !== 'Z')) return { ...empty('No hay ninguna fuente que alimente un lazo cerrado: no circula corriente (revisa interruptores y conexiones).'), notes };

  // Reindexado: la masa es el nudo 0
  const used = [...new Set(br.flatMap((b) => [b.a, b.b]))];
  let ground = find(0);
  if (!used.includes(ground)) ground = br.find((b) => b.kind === 'E')?.b ?? used[0];
  const order = [ground, ...used.filter((u) => u !== ground)];
  const idx = new Map(order.map((u, i) => [u, i]));

  // Posiciones y nombres que puso el alumno
  const termsOfNode = new Map<number, { x: number; y: number; junction: boolean }[]>();
  const named = new Map<number, string>();
  for (const c of project.components) {
    defOf(c.type).terminals.forEach((_, i) => {
      const key = `${c.id}:${i}`;
      const nd = sim.nodeOf[key];
      if (nd === undefined) return;
      const ni = idx.get(find(nd));
      if (ni === undefined) return;
      const p = termPos(c, i);
      if (!termsOfNode.has(ni)) termsOfNode.set(ni, []);
      termsOfNode.get(ni)!.push({ x: p.x, y: p.y, junction: c.type === 'junction' });
      const pn = project.pointNames?.[key];
      if (pn && !named.has(ni)) named.set(ni, pn);
    });
  }
  const nOld = order.length;
  const nodePosOld = order.map((_, i) => { const t = termsOfNode.get(i) ?? []; const j = t.find((q) => q.junction) ?? t[0]; return j ? { x: j.x, y: j.y } : { x: 0, y: 0 }; });

  // Ramas: contraer los nudos de grado 2 que no son masa ni tienen nombre
  type Path = { a: number; b: number; parts: Part[] };
  const compPos = (id: string) => { const c = project.components.find((q) => q.id === id); return { x: c?.x ?? 0, y: c?.y ?? 0 }; };
  let paths: Path[] = br.map((b) => ({ a: idx.get(b.a)!, b: idx.get(b.b)!, parts: [{ label: b.label, comp: b.comp, kind: b.kind, v: b.v, dir: 1 as const, internal: b.internal, ...compPos(b.comp) }] }));
  const flipPath = (p: Path): Path => ({ a: p.b, b: p.a, parts: [...p.parts].reverse().map((q) => ({ ...q, dir: (q.dir === 1 ? -1 : 1) as 1 | -1 })) });
  for (let again = true; again;) {
    again = false;
    for (let node = 1; node < nOld; node++) {
      if (named.has(node)) continue;
      const touching = paths.filter((p) => p.a === node || p.b === node);
      if (touching.length !== 2 || touching[0] === touching[1] || touching.some((p) => p.a === p.b)) continue;
      let [p1, p2] = touching;
      if (p1.b !== node) p1 = flipPath(p1);
      if (p2.a !== node) p2 = flipPath(p2);
      if (p1.a === p2.b && p1.a === node) continue;
      paths = [...paths.filter((p) => p !== touching[0] && p !== touching[1]), { a: p1.a, b: p2.b, parts: [...p1.parts, ...p2.parts] }];
      again = true; break;
    }
  }
  // Nudos esenciales (los que quedan tras contraer) y sus nombres: los del alumno y, si no, A, B, C… (la masa, la última)
  const ess = [0, ...[...new Set(paths.flatMap((p) => [p.a, p.b]))].filter((x) => x !== 0).sort((p, q) => p - q)];
  const remap = new Map(ess.map((o, i) => [o, i]));
  paths = paths.map((p) => ({ ...p, a: remap.get(p.a)!, b: remap.get(p.b)! }));
  const n = ess.length;
  const nodePos = ess.map((o) => nodePosOld[o]);
  const names = new Array<string>(n).fill('');
  const usedNames = new Set<string>();
  ess.forEach((o, i) => { const nm = named.get(o); if (nm && !usedNames.has(nm)) { names[i] = nm; usedNames.add(nm); } });
  let li = 0;
  const nextLetter = () => { while (usedNames.has(String.fromCharCode(65 + li))) li++; const l = String.fromCharCode(65 + (li % 26)); li++; usedNames.add(l); return l; };
  for (let i = 1; i < n; i++) if (!names[i]) names[i] = nextLetter();
  if (!names[0]) names[0] = nextLetter();
  const rank = (node: number) => (node === 0 ? n : node); // la masa, la última en orden alfabético

  // Resumen de cada rama y su sentido de referencia
  const summarize = (p: Path) => {
    let Z = C0, E = C0; let J: C | undefined;
    for (const q of p.parts) {
      if (q.kind === 'Z') Z = add(Z, q.v);
      else if (q.kind === 'E') E = add(E, q.dir === 1 ? cneg(q.v) : q.v);   // E.a es el polo +: al recorrerlo de a→b se «baja»
      else J = q.dir === 1 ? q.v : cneg(q.v);
    }
    return { Z, E, J };
  };
  // Para el elemento E el polo + es su «a». Recorrido a→b (dir +1) entra por + y sale por −: caída; por eso el signo anterior.
  const ramasRaw = paths.map((p) => {
    let path = p;
    const s0 = summarize(path);
    const hasSource = !isZero(s0.E) || !!s0.J;
    const A = 1; // «A» es el primer nudo no masa
    let flip = false;
    if (n === 2) {
      const toA = path.b === A;
      if (dirMode === 'haciaA') flip = !toA;
      else flip = hasSource ? !toA : path.b === 0 ? false : true; // con fuente, hacia A; sin ella, de A a la masa
    } else {
      if (hasSource && !isZero(s0.E)) flip = s0.E.re < -1e-12 || (Math.abs(s0.E.re) <= 1e-12 && s0.E.im < 0);
      else flip = rank(path.a) > rank(path.b);
    }
    if (flip) path = flipPath(path);
    const s = summarize(path);
    const px = path.parts.reduce((a, q) => a + q.x, 0) / path.parts.length, py = path.parts.reduce((a, q) => a + q.y, 0) / path.parts.length;
    return { a: path.a, b: path.b, parts: path.parts, Z: s.Z, E: s.E, J: s.J, x: px, y: py };
  });
  const hasSrc = (r: { E: C; J?: C }) => (!isZero(r.E) || !!r.J ? 0 : 1);
  // Numeración: en el modo «cargas» primero las ramas con fuente y luego las cargas (de izquierda a derecha); en «hacia A», por posición
  ramasRaw.sort((p, q) => (dirMode === 'cargas' ? hasSrc(p) - hasSrc(q) : 0) || p.x - q.x || p.y - q.y);
  const ramas: Rama[] = ramasRaw.map((r, i) => ({ id: `r${i + 1}`, name: `I${i + 1}`, ...r }));
  const sol = solveRamas(n, ramas);
  if (!sol) return { ...empty('El circuito no se puede resolver (¿hay un lazo de fuentes de tensión o una fuente de corriente sin retorno?).'), notes };
  const I: Record<string, C> = {};
  ramas.forEach((r, k) => { I[r.id] = sol.I[k]; });
  // Para dibujar flechas: cada componente con su rama y el sentido de la rama respecto de su terminal 0 → 1
  const comps: CNet['comps'] = [];
  for (const r of ramas) {
    const seenComp = new Set<string>();
    for (const q of r.parts) {
      if (seenComp.has(q.comp)) continue; seenComp.add(q.comp);
      const c = project.components.find((x) => x.id === q.comp);
      if (!c) continue;
      comps.push({ id: c.id, x: c.x, y: c.y, t0: termPos(c, 0), t1: termPos(c, defOf(c.type).terminals.length > 1 ? 1 : 0), rama: r.id, dirAlong: q.kind === 'E' ? (q.dir === 1 ? 1 : -1) : q.dir });
    }
  }
  return { ok: true, ac, omega, freq, n, names, nodePos, ground: 0, ramas, notes: [...new Set(notes)], V: sol.V, I, comps };
}

/** Etiqueta de una rama con sus elementos: «R₁ + V₁». */
export const ramaDesc = (r: Rama) => r.parts.filter((q) => !q.internal || q.kind === 'Z').map((q) => pretty(q.label)).join(' + ');
export const ramaName = (r: Rama) => `I${subs(r.name.slice(1))}`;
export { subs, pretty };
