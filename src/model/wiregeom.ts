/**
 * Geometría de los cables del esquema: ruta ortogonal con codos fijados por el usuario, punto más cercano sobre un cable
 * (para conectar a mitad de otro) y división de un cable en dos al crear un empalme automático.
 */
import type { Wire } from './types';

export interface Pt { x: number; y: number }
export const GRID = 20;
export const snapG = (v: number) => Math.round(v / GRID) * GRID;

/** Esquina entre dos puntos: horizontal primero (o vertical primero si `v`). */
const corner = (a: Pt, b: Pt, v: boolean): Pt => (v ? { x: a.x, y: b.y } : { x: b.x, y: a.y });

/** Polilínea del cable (con las esquinas) y, para cada punto, cuántos codos del usuario quedan a su espalda o en él. */
export function wirePoints(a: Pt, b: Pt, w: Pick<Wire, 'via' | 'vEnd'>): { pts: Pt[]; viaCount: number[]; segVia: number[] } {
  const stops: { p: Pt; v: boolean; via: boolean }[] = [{ p: a, v: false, via: false }];
  (w.via ?? []).forEach((q) => stops.push({ p: { x: q.x, y: q.y }, v: !!q.v, via: true }));
  stops.push({ p: b, v: !!w.vEnd, via: false });
  const pts: Pt[] = [a]; const viaCount: number[] = [0]; const segVia: number[] = [];
  let nVia = 0;
  for (let i = 1; i < stops.length; i++) {
    const prev = stops[i - 1].p, cur = stops[i];
    const c = corner(prev, cur.p, cur.v);
    const push = (p: Pt, count: number) => { const last = pts[pts.length - 1]; if (Math.abs(last.x - p.x) < 0.01 && Math.abs(last.y - p.y) < 0.01) { viaCount[viaCount.length - 1] = Math.max(viaCount[viaCount.length - 1], count); return; } pts.push(p); viaCount.push(count); };
    if (Math.abs(c.x - prev.x) > 0.01 || Math.abs(c.y - prev.y) > 0.01) {
      if ((Math.abs(c.x - cur.p.x) > 0.01 || Math.abs(c.y - cur.p.y) > 0.01)) { push(c, nVia); segVia.push(i - 1); }
    }
    if (cur.via) nVia++;
    push(cur.p, nVia);
  }
  // segVia[k] = índice del tramo de usuario (0 = hasta el primer codo…) al que pertenece el k-ésimo segmento de la polilínea
  const seg: number[] = [];
  for (let k = 0; k < pts.length - 1; k++) seg.push(Math.min(viaCount[k + 1], (w.via ?? []).length));
  return { pts, viaCount, segVia: seg };
}

/** Trazado con esquinas redondeadas. */
export function pathD(pts: Pt[], r = 14): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1];
    const l1 = Math.hypot(p1.x - p0.x, p1.y - p0.y), l2 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    if (rr < 0.5) { d += `L${p1.x} ${p1.y}`; continue; }
    const ax = p1.x - ((p1.x - p0.x) / l1) * rr, ay = p1.y - ((p1.y - p0.y) / l1) * rr;
    const bx = p1.x + ((p2.x - p1.x) / l2) * rr, by = p1.y + ((p2.y - p1.y) / l2) * rr;
    d += `L${ax} ${ay}Q${p1.x} ${p1.y} ${bx} ${by}`;
  }
  const last = pts[pts.length - 1];
  return d + `L${last.x} ${last.y}`;
}

/** Punto medio (por longitud) de una polilínea. */
export function midPoint(pts: Pt[]): Pt {
  let total = 0; for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (acc + l >= total / 2 && l > 0) { const t = (total / 2 - acc) / l; return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t }; }
    acc += l;
  }
  return pts[0];
}

export interface Hit { seg: number; pt: Pt; d: number }
/** Punto más cercano a `p` sobre la polilínea, o null si está a más de `tol`. */
export function nearestOnPolyline(pts: Pt[], p: Pt, tol: number): Hit | null {
  let best: Hit | null = null;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
    if (l2 === 0) continue;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
    const q = { x: a.x + dx * t, y: a.y + dy * t };
    const d = Math.hypot(p.x - q.x, p.y - q.y);
    if (d <= tol && (!best || d < best.d)) best = { seg: i, pt: q, d };
  }
  return best;
}

/** Ajusta el punto de empalme a la rejilla sin salirse del tramo. Devuelve null si cae en un extremo del cable. */
export function snapJunction(pts: Pt[], hit: Hit): Pt | null {
  const a = pts[hit.seg], b = pts[hit.seg + 1];
  const horizontal = Math.abs(a.y - b.y) < 0.01;
  const lo = horizontal ? Math.min(a.x, b.x) : Math.min(a.y, b.y), hi = horizontal ? Math.max(a.x, b.x) : Math.max(a.y, b.y);
  let v = snapG(horizontal ? hit.pt.x : hit.pt.y);
  v = Math.max(lo, Math.min(hi, v));
  const q = horizontal ? { x: v, y: a.y } : { x: a.x, y: v };
  const ends = [pts[0], pts[pts.length - 1]];
  if (ends.some((e) => Math.hypot(e.x - q.x, e.y - q.y) < 6)) return null;
  return q;
}

/** Divide el cable en dos por el punto `j` (ya sobre la polilínea) y los conecta al empalme. */
export function splitWire(w: Wire, viaCount: number[], seg: number, jId: string, newId: string): [Wire, Wire] {
  const via = w.via ?? [];
  const k = Math.min(viaCount[seg] ?? 0, via.length); // codos que quedan antes del empalme
  const before = via.slice(0, k).map((q) => ({ ...q })), after = via.slice(k).map((q) => ({ ...q }));
  const flagOfSeg = k < via.length ? !!via[k].v : !!w.vEnd; // orientación del tramo del usuario que contiene el empalme
  const first: Wire = { ...w, b: { comp: jId, term: 0 }, via: before.length ? before : undefined, vEnd: flagOfSeg };
  const second: Wire = { ...w, id: newId, a: { comp: jId, term: 0 }, via: after.length ? after : undefined };
  const L = w.length;
  if (L !== undefined) { first.length = L / 2; second.length = L / 2; }
  return [first, second];
}
