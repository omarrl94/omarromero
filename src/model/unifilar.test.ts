import { describe, it, expect } from 'vitest';
import { syncReturns, isReturnWire } from './unifilar';
import { simulate } from './netlist';
import { defaultParams } from './library';
import type { Project } from './types';

const C = (id: string, type: string, params: Record<string, number | boolean> = {}) => ({ id, type, x: 0, y: 0, rot: 0 as const, params: { ...defaultParams(type), ...params } });
const W = (id: string, a: string, at: number, b: string, bt: number) => ({ id, a: { comp: a, term: at }, b: { comp: b, term: bt } });

/** Red 230 V → magnetotérmico → lámpara de 60 W, dibujado SOLO con la línea de fase. */
const solo = (): Project => ({ version: 1, name: 'u', components: [C('A', 'acsource', { v: 230 }), C('Q', 'breaker'), C('L', 'lamp', { vn: 230, pn: 60 })], wires: [W('w1', 'A', 0, 'Q', 0), W('w2', 'Q', 1, 'L', 0)] });

describe('montaje en unifilar', () => {
  it('una fuente de CA con un solo cable (circuito a medio montar) no se quema', () => {
    const p: Project = { version: 1, name: 'x', components: [C('A', 'acsource', { v: 230 }), C('Q', 'breaker')], wires: [W('w1', 'A', 0, 'Q', 0)] };
    expect(simulate(p).events).toHaveLength(0);
  });
  it('añade el retorno automático del receptor y el circuito funciona', () => {
    const p = syncReturns(solo(), true);
    const auto = p.wires.filter((w) => w.auto);
    expect(auto).toHaveLength(1);
    expect(auto[0].a).toEqual({ comp: 'L', term: 1 });
    expect(auto[0].b).toEqual({ comp: 'A', term: 1 });
    const r = simulate(p);
    expect(Math.abs(r.live.L.i)).toBeCloseTo(60 / 230, 3);
    expect(r.live.L.p).toBeCloseTo(60, 1);
  });
  it('sin retorno el circuito no funciona (lámpara apagada) y no se añade nada fuera de la vista unifilar', () => {
    const p = syncReturns(solo(), false);
    expect(p.wires.filter((w) => w.auto)).toHaveLength(0);
    expect(simulate(p).live.L.p).toBeLessThan(1e-6);
  });
  it('si el alumno cablea el retorno a mano, el automático desaparece', () => {
    let p = syncReturns(solo(), true);
    p = { ...p, wires: [...p.wires, W('w3', 'L', 1, 'A', 1)] };
    p = syncReturns(p, false);
    expect(p.wires.filter((w) => w.auto)).toHaveLength(0);
  });
  it('un receptor sin entrada no recibe retorno; varios receptores cuelgan de la misma salida', () => {
    const p0 = solo();
    p0.components.push(C('L2', 'lamp', { vn: 230, pn: 100 }));
    p0.wires.push(W('w4', 'Q', 1, 'L2', 0));
    const p = syncReturns(p0, true);
    expect(p.wires.filter((w) => w.auto).map((w) => w.id).sort()).toEqual(['auto-L', 'auto-L2']);
    expect(simulate(p).live.A.i).toBeDefined();
  });
  it('los retornos no se dibujan en unifilar (automáticos o hacia el borne de retorno de la fuente)', () => {
    const p = syncReturns(solo(), true);
    expect(p.wires.filter((w) => isReturnWire(p, w))).toHaveLength(1);
    expect(isReturnWire(p, W('x', 'L', 1, 'A', 1))).toBe(true);
    expect(isReturnWire(p, W('y', 'A', 0, 'Q', 0))).toBe(false);
  });
});
