/** Árbol recubridor, lazos fundamentales (orientados en sentido horario) y sus matrices, sobre la red de ramas. */
import type { CNet } from './cnet';
import { isZero } from './cx';

export interface Loop { chord: number; items: { k: number; along: 1 | -1 }[]; cx: number; cy: number }
export interface Graph { tree: Set<number>; chords: number[]; loops: Loop[]; /** σ[c][k]: +1 / −1 si el lazo c (horario) recorre la rama k a favor / en contra de su sentido; 0 si no pasa */ sigma: number[][]; /** coeficientes de la corriente de cada rama de árbol en función de las de las cuerdas */ treeExpr: Map<number, number[]> }

const hasSrc = (net: CNet, k: number) => { const r = net.ramas[k]; return !isZero(r.E) || !!r.J; };

export function buildGraph(net: CNet): Graph | null {
  const M = net.ramas.length, n = net.n;
  const meanX = net.ramas.reduce((a, r) => a + r.x, 0) / Math.max(1, M);
  const order = [...Array(M).keys()].sort((i, j) => (net.ramas[i].J ? 1 : 0) - (net.ramas[j].J ? 1 : 0) || (hasSrc(net, i) ? 1 : 0) - (hasSrc(net, j) ? 1 : 0) || Math.abs(net.ramas[i].x - meanX) - Math.abs(net.ramas[j].x - meanX));
  const uf = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => (uf[x] === x ? x : (uf[x] = find(uf[x])));
  const tree = new Set<number>();
  for (const k of order) { const a = find(net.ramas[k].a), b = find(net.ramas[k].b); if (a !== b) { uf[a] = b; tree.add(k); } }
  if (tree.size !== n - 1) return null;
  for (const k of tree) if (net.ramas[k].J) return null; // una fuente de corriente en el árbol: no se puede tomar su corriente como incógnita
  const chords = [...Array(M).keys()].filter((k) => !tree.has(k));
  // adyacencia del árbol
  const adj = new Map<number, { k: number; to: number; along: 1 | -1 }[]>();
  for (const k of tree) { const r = net.ramas[k]; (adj.get(r.a) ?? adj.set(r.a, []).get(r.a)!).push({ k, to: r.b, along: 1 }); (adj.get(r.b) ?? adj.set(r.b, []).get(r.b)!).push({ k, to: r.a, along: -1 }); }
  const treePath = (from: number, to: number): { k: number; along: 1 | -1 }[] | null => {
    const prev = new Map<number, { node: number; k: number; along: 1 | -1 }>(); const q = [from]; const seen = new Set([from]);
    while (q.length) { const u = q.shift()!; if (u === to) break; for (const e of adj.get(u) ?? []) if (!seen.has(e.to)) { seen.add(e.to); prev.set(e.to, { node: u, k: e.k, along: e.along }); q.push(e.to); } }
    if (!seen.has(to)) return null;
    const out: { k: number; along: 1 | -1 }[] = []; let cur = to;
    while (cur !== from) { const p = prev.get(cur)!; out.unshift({ k: p.k, along: p.along }); cur = p.node; }
    return out;
  };
  const nodeAfter = (k: number, along: 1 | -1) => (along === 1 ? net.ramas[k].b : net.ramas[k].a);
  const loops: Loop[] = [];
  for (const c of chords) {
    const r = net.ramas[c];
    const back = r.a === r.b ? [] : treePath(r.b, r.a);
    if (!back) return null;
    let items = [{ k: c, along: 1 as const }, ...back] as { k: number; along: 1 | -1 }[];
    // Sentido horario (en pantalla, y hacia abajo): área con signo positiva
    const poly: { x: number; y: number }[] = [];
    for (const it of items) { poly.push({ x: net.ramas[it.k].x, y: net.ramas[it.k].y }); poly.push(net.nodePos[nodeAfter(it.k, it.along)] ?? { x: 0, y: 0 }); }
    let area = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; area += p.x * q.y - q.x * p.y; }
    if (area < -1e-6) items = [...items].reverse().map((it) => ({ k: it.k, along: (it.along === 1 ? -1 : 1) as 1 | -1 }));
    const xs = poly.map((q) => q.x), ys = poly.map((q) => q.y);
    loops.push({ chord: c, items, cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2 });
  }
  loops.sort((p, q) => p.cx - q.cx || p.cy - q.cy);
  const sigma = loops.map((l) => { const row = new Array(M).fill(0); for (const it of l.items) row[it.k] = it.along; return row; });
  // Corriente de cada rama de árbol en función de las cuerdas: I_t = Σ_c σ'[c][t]·I_c con σ' respecto del sentido de la cuerda
  const treeExpr = new Map<number, number[]>();
  for (const t of tree) {
    const row = new Array(M).fill(0);
    loops.forEach((l, li) => {
      const it = l.items.find((x) => x.k === t); if (!it) return;
      const ch = l.items.find((x) => x.k === l.chord)!;
      row[l.chord] += it.along * ch.along; // I_t = Σ (σ_t·σ_chord)·I_chord
      void li;
    });
    treeExpr.set(t, row);
  }
  return { tree, chords, loops, sigma, treeExpr };
}
