/**
 * Red abstracta de un circuito de CC para resolverlo «a mano»:
 *  - R: resistencia (lámparas, motores, hilo de bobinas, termistores… ya como ohmios),
 *  - E: fuente de tensión ideal (a = polo +: V(a) − V(b) = E),
 *  - J: fuente de corriente (circula de a → b por dentro de la fuente).
 * Las pilas con resistencia interna se separan en E + r_int. Interruptores cerrados y fusibles son cables;
 * los abiertos y los condensadores (en CC) se eliminan.
 */
import type { Project } from '../model/types';
import type { SimResult } from '../model/netlist';
import { defOf, fmt } from '../model/library';
import { solveDC, type Element } from '../engine/dc';

export type BrKind = 'R' | 'E' | 'J';
export interface Br { id: string; kind: BrKind; a: number; b: number; v: number; label: string; comp: string; internal?: boolean }
export interface Net {
  ok: boolean; reason?: string;
  n: number; names: string[]; desc: string[];
  branches: Br[]; pruned: Br[]; notes: string[];
  truth: { V: number[]; I: Record<string, number> };
}

const SWITCHLIKE = new Set(['switch', 'pushNO', 'pushNC', 'spdt', 'fuse', 'breaker']);
const UNSUPPORTED: Record<string, string> = {
  acsource: 'El circuito es de corriente alterna: los métodos de esta versión son de corriente continua (en CA se resuelve con fasores).',
  diode: 'Hay diodos: son elementos no lineales y no se resuelven con estos métodos.', led: 'Hay LED: son elementos no lineales y no se resuelven con estos métodos.', zener: 'Hay diodos Zener: son no lineales y no se resuelven con estos métodos.',
};

export const nameOf = (project: Project, id: string) => {
  const c = project.components.find((x) => x.id === id);
  return c ? c.label || (c.id.length <= 4 ? c.id : defOf(c.type).name) : id;
};

const empty = (reason: string): Net => ({ ok: false, reason, n: 0, names: [], desc: [], branches: [], pruned: [], notes: [], truth: { V: [], I: {} } });

export function buildNet(project: Project, sim: SimResult): Net {
  for (const c of project.components) if (UNSUPPORTED[c.type]) return empty(UNSUPPORTED[c.type]);
  if (!project.components.length) return empty('El circuito está vacío.');
  if (sim.problem.elements.length === 0) return empty('El circuito no tiene elementos.');
  const els = sim.problem.elements;
  const total = sim.problem.nodeCount;
  const uf = Array.from({ length: total + els.length }, (_, i) => i);
  const find = (x: number): number => (uf[x] === x ? x : (uf[x] = find(uf[x])));
  const union = (a: number, b: number) => { uf[find(a)] = find(b); };
  const notes: string[] = [];
  type Raw = { id: string; kind: BrKind; a: number; b: number; v: number; label: string; comp: string; internal?: boolean };
  const raw: Raw[] = [];
  let extra = total;
  for (const e of els) {
    const compId = e.id.split('#')[0];
    const comp = project.components.find((c) => c.id === compId);
    const base = nameOf(project, compId);
    const sw = !!comp && SWITCHLIKE.has(comp.type);
    if (e.kind === 'R') {
      if (e.value >= 1e7) continue; // abierto
      if (sw || e.value <= 1e-6) { union(e.a, e.b); if (sw) notes.push(`${base} está cerrado (o es un fusible): se trata como un cable.`); continue; }
      const suffix = e.id.includes('#') ? `(${e.id.split('#')[1]})` : '';
      raw.push({ id: e.id, kind: 'R', a: e.a, b: e.b, v: e.value, label: base + suffix, comp: compId });
    } else if (e.kind === 'V') {
      if ((e.rint ?? 0) > 0) {
        const m = extra++;
        raw.push({ id: e.id, kind: 'E', a: e.a, b: m, v: e.value, label: base, comp: compId });
        raw.push({ id: e.id + '#rint', kind: 'R', a: m, b: e.b, v: e.rint!, label: `r_int(${base})`, comp: compId, internal: true });
      } else raw.push({ id: e.id, kind: 'E', a: e.a, b: e.b, v: e.value, label: base, comp: compId });
    } else raw.push({ id: e.id, kind: 'J', a: e.a, b: e.b, v: e.value, label: base, comp: compId });
  }
  let br: Br[] = [];
  for (const r of raw) {
    const a = find(r.a), b = find(r.b);
    if (a === b) { notes.push(`${r.label} queda entre dos puntos unidos por un cable: no pasa corriente por él.`); continue; }
    br.push({ ...r, a, b });
  }
  // Solo la parte conectada a alguna fuente; fuera, corriente nula
  const pruned: Br[] = [];
  const adj = new Map<number, Br[]>();
  const add = (n: number, b: Br) => { if (!adj.has(n)) adj.set(n, []); adj.get(n)!.push(b); };
  for (const b of br) { add(b.a, b); add(b.b, b); }
  const seen = new Set<number>(), keep = new Set<Br>();
  for (const s of br.filter((b) => b.kind !== 'R')) {
    if (seen.has(s.a)) continue;
    const st = [s.a]; seen.add(s.a);
    while (st.length) { const u = st.pop()!; for (const b of adj.get(u) ?? []) { keep.add(b); const w = b.a === u ? b.b : b.a; if (!seen.has(w)) { seen.add(w); st.push(w); } } }
  }
  for (const b of br) if (!keep.has(b)) pruned.push(b);
  br = br.filter((b) => keep.has(b));
  // Ramas colgantes (un extremo sin conexión): corriente nula
  for (let again = true; again;) {
    again = false;
    const deg = new Map<number, number>();
    for (const b of br) { deg.set(b.a, (deg.get(b.a) ?? 0) + 1); deg.set(b.b, (deg.get(b.b) ?? 0) + 1); }
    const dangling = br.find((b) => deg.get(b.a) === 1 || deg.get(b.b) === 1);
    if (dangling) { br = br.filter((b) => b !== dangling); pruned.push(dangling); again = true; }
  }
  if (!br.some((b) => b.kind !== 'R')) return { ...empty('No hay ninguna fuente que alimente un lazo cerrado: no circula corriente (revisa interruptores y conexiones).'), notes, pruned };
  // Reindexar: la masa es el nudo 0
  const used = [...new Set(br.flatMap((b) => [b.a, b.b]))];
  let ground = find(0);
  if (!used.includes(ground)) ground = br.find((b) => b.kind === 'E')?.b ?? used[0];
  const order = [ground, ...used.filter((u) => u !== ground)];
  const idx = new Map(order.map((u, i) => [u, i]));
  const branches = br.map((b) => ({ ...b, a: idx.get(b.a)!, b: idx.get(b.b)! }));
  const n = order.length;
  const names = order.map((_, i) => (i === 0 ? '0' : `N${i}`));
  const desc = order.map((_, i) => branches.filter((b) => b.a === i || b.b === i).map((b) => b.label + (b.kind === 'E' ? (b.a === i ? '(+)' : '(−)') : '')).join(', '));
  // Verdad numérica (nodal) de la red abstracta, para comprobar cada método
  const el: Element[] = branches.map((b) => b.kind === 'R' ? { id: b.id, kind: 'R', a: b.a, b: b.b, value: b.v } : b.kind === 'E' ? { id: b.id, kind: 'V', a: b.a, b: b.b, value: b.v } : { id: b.id, kind: 'I', a: b.a, b: b.b, value: b.v });
  const sol = solveDC({ nodeCount: n, elements: el });
  if (!sol.ok) return { ...empty(sol.issues[0]?.message ?? 'El circuito no se puede resolver.'), notes };
  return { ok: true, n, names, desc, branches, pruned, notes: [...new Set(notes)], truth: { V: sol.voltages, I: sol.currents } };
}

export const num = (v: number, d = 4) => (Math.abs(v) < 1e-12 ? '0' : fmt(v, d));
export const signed = (v: number) => (v < 0 ? `− ${num(-v)}` : `+ ${num(v)}`);
export const U = (v: number, u: string) => `${num(v)} ${u}`;
export const loadLabel = (b: Br) => b.label;
