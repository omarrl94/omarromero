import { describe, it, expect } from 'vitest';
import { wirePoints, pathD, nearestOnPolyline, snapJunction, splitWire, midPoint } from './wiregeom';
import type { Wire } from './types';

const A = { x: 0, y: 0 }, B = { x: 200, y: 100 };
describe('geometría de cables', () => {
  it('sin codos: horizontal y luego vertical', () => {
    const { pts } = wirePoints(A, B, {});
    expect(pts).toEqual([{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 100 }]);
  });
  it('con vertical primero (vEnd)', () => {
    const { pts } = wirePoints(A, B, { vEnd: true });
    expect(pts).toEqual([{ x: 0, y: 0 }, { x: 0, y: 100 }, { x: 200, y: 100 }]);
  });
  it('los codos fijados con clic se respetan', () => {
    const { pts } = wirePoints(A, B, { via: [{ x: 100, y: 60 }] });
    expect(pts).toContainEqual({ x: 100, y: 60 });
    expect(pts[0]).toEqual(A); expect(pts[pts.length - 1]).toEqual(B);
    for (let i = 1; i < pts.length; i++) expect(pts[i].x === pts[i - 1].x || pts[i].y === pts[i - 1].y).toBe(true); // siempre ortogonal
  });
  it('el trazado y el punto medio son válidos', () => {
    const { pts } = wirePoints(A, B, {});
    expect(pathD(pts)).toMatch(/^M0 0/); expect(midPoint(pts)).toEqual({ x: 150, y: 0 });
  });
  it('encuentra el punto más cercano y lo ajusta a la rejilla', () => {
    const { pts } = wirePoints(A, B, {});
    const hit = nearestOnPolyline(pts, { x: 87, y: 6 }, 10)!;
    expect(hit.seg).toBe(0);
    expect(snapJunction(pts, hit)).toEqual({ x: 80, y: 0 });
    expect(nearestOnPolyline(pts, { x: 87, y: 40 }, 10)).toBeNull();
  });
  it('no se puede empalmar en el extremo del cable', () => {
    const { pts } = wirePoints(A, B, {});
    const hit = nearestOnPolyline(pts, { x: 2, y: 0 }, 10)!;
    expect(snapJunction(pts, hit)).toBeNull();
  });
  it('dividir un cable conserva los codos a cada lado', () => {
    const w: Wire = { id: 'w1', a: { comp: 'X', term: 0 }, b: { comp: 'Y', term: 0 }, via: [{ x: 100, y: 0 }, { x: 100, y: 60 }], section: 4, length: 6 };
    const g = wirePoints(A, B, w);
    const hit = nearestOnPolyline(g.pts, { x: 100, y: 30 }, 6)!;
    const j = snapJunction(g.pts, hit)!;
    const [f, s] = splitWire(w, g.viaCount, hit.seg, 'J1', 'w2');
    expect(f.b).toEqual({ comp: 'J1', term: 0 }); expect(s.a).toEqual({ comp: 'J1', term: 0 }); expect(s.b).toEqual(w.b);
    expect(f.section).toBe(4); expect(s.section).toBe(4); expect((f.length ?? 0) + (s.length ?? 0)).toBe(6);
    expect((f.via?.length ?? 0) + (s.via?.length ?? 0)).toBe(2);
    // las dos mitades siguen pasando por el empalme
    const g1 = wirePoints(A, j, f), g2 = wirePoints(j, B, s);
    expect(nearestOnPolyline(g1.pts, j, 0.5)).not.toBeNull(); expect(nearestOnPolyline(g2.pts, j, 0.5)).not.toBeNull();
  });
});
