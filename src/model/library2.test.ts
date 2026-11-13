import { describe, it, expect } from 'vitest';
import { LIBRARY, defOf, defaultParams } from './library';
import { simulate } from './netlist';
import type { Component, Project, Wire } from './types';

const C = (id: string, type: string, x = 0, y = 0, params: Component['params'] = {}): Component => ({ id, type, x, y, rot: 0, params: { ...defaultParams(type), ...params } });
const W = (id: string, a: string, ta: number, b: string, tb: number): Wire => ({ id, a: { comp: a, term: ta }, b: { comp: b, term: tb } });
const P = (components: Component[], wires: Wire[]): Project => ({ version: 1, name: 't', components, wires });

describe('biblioteca ampliada', () => {
  it('no hay tipos repetidos y todos tienen símbolo definido', () => {
    const types = LIBRARY.map((d) => d.type);
    expect(new Set(types).size).toBe(types.length);
    expect(LIBRARY.length).toBeGreaterThanOrEqual(125);
  });
  it('interruptor bipolar: cierra y abre los dos polos', () => {
    const mk = (closed: boolean) => P([C('B', 'dcsource', 0, 0, { v: 12 }), C('S', 'sw2', 0, 0, { closed }), C('R1', 'resistor', 0, 0, { r: 12 }), C('R2', 'resistor', 0, 0, { r: 12 }), C('G', 'ground')],
      [W('a', 'B', 0, 'S', 0), W('b', 'S', 1, 'R1', 0), W('c', 'B', 0, 'S', 2), W('d', 'S', 3, 'R2', 0), W('e', 'R1', 1, 'B', 1), W('f', 'R2', 1, 'B', 1), W('g', 'B', 1, 'G', 0)]);
    const on = simulate(mk(true)), off = simulate(mk(false));
    expect(Math.abs(on.live['R1'].i)).toBeCloseTo(1, 2); expect(Math.abs(on.live['R2'].i)).toBeCloseTo(1, 2);
    expect(Math.abs(off.live['R1'].i)).toBeLessThan(1e-6); expect(Math.abs(off.live['R2'].i)).toBeLessThan(1e-6);
  });
  it('conmutador de cruce: invierte la conexión', () => {
    const p = (pos: number) => P([C('B', 'dcsource', 0, 0, { v: 10 }), C('X', 'cruce', 0, 0, { pos }), C('R1', 'resistor', 0, 0, { r: 10 }), C('G', 'ground')],
      [W('a', 'B', 0, 'X', 0), W('b', 'X', 1, 'R1', 0), W('c', 'R1', 1, 'B', 1), W('d', 'B', 1, 'G', 0)]);
    // pos 0: 1→2 conectados (circuito cerrado); pos 1: 1→4 y 3→2, no hay camino 1→2
    expect(Math.abs(simulate(p(0)).live['R1'].i)).toBeCloseTo(1, 2);
    expect(Math.abs(simulate(p(1)).live['R1'].i)).toBeLessThan(1e-6);
  });
  it('CA: carga genérica RL y condensador de arranque se resuelven con su impedancia', () => {
    const p = P([C('A', 'red', 0, 0, { v: 230, rint: 0 }), C('Z', 'carga', 0, 0, { r: 30, l: (40 / (2 * Math.PI * 50)) * 1000, c: 0 }), C('G', 'ground')],
      [W('a', 'A', 0, 'Z', 0), W('b', 'Z', 1, 'A', 1), W('c', 'A', 1, 'G', 0)]);
    const r = simulate(p);
    expect(r.live['Z'].i).toBeDefined();
    expect(Math.abs(r.live['Z'].i)).toBeCloseTo(230 / 50, 1); // |Z| = 50 Ω
    expect(r.live['Z'].pf).toBeCloseTo(0.6, 2);
  });
  it('impedancia genérica R + jX', () => {
    const p = P([C('A', 'alternador', 0, 0, { v: 100, rint: 0 }), C('Z', 'zgen', 0, 0, { r: 30, x: -40 }), C('G', 'ground')],
      [W('a', 'A', 0, 'Z', 0), W('b', 'Z', 1, 'A', 1), W('c', 'A', 1, 'G', 0)]);
    expect(Math.abs(simulate(p).live['Z'].i)).toBeCloseTo(2, 2);
  });
  it('batería de litio de 3 elementos = 11,1 V; fusible NH se funde', () => {
    expect(defOf('bat_li').model.kind).toBe('V');
    const p = P([C('B', 'bat_li', 0, 0, { cells: 3, rint: 0 }), C('R', 'resistor', 0, 0, { r: 11.1 }), C('G', 'ground')], [W('a', 'B', 0, 'R', 0), W('b', 'R', 1, 'B', 1), W('c', 'B', 1, 'G', 0)]);
    expect(Math.abs(simulate(p).live['R'].v)).toBeCloseTo(11.1, 2);
  });
  it('final de carrera NA/NC y shunt', () => {
    const f = (act: boolean, nc: boolean) => P([C('B', 'dcsource', 0, 0, { v: 10 }), C('F', 'fincarrera', 0, 0, { act, nc }), C('R', 'resistor', 0, 0, { r: 10 }), C('G', 'ground')],
      [W('a', 'B', 0, 'F', 0), W('b', 'F', 1, 'R', 0), W('c', 'R', 1, 'B', 1), W('d', 'B', 1, 'G', 0)]);
    expect(Math.abs(simulate(f(true, false)).live['R'].i)).toBeCloseTo(1, 2);
    expect(Math.abs(simulate(f(false, false)).live['R'].i)).toBeLessThan(1e-6);
    expect(Math.abs(simulate(f(true, true)).live['R'].i)).toBeLessThan(1e-6);
    expect(defOf('shunt').model.kind === 'R' && (defOf('shunt').model as { value: (p: Component['params']) => number }).value({ in: 50, mv: 75 })).toBeCloseTo(0.0015, 6);
  });
});

describe('relés y contactores', () => {
  // Marcha-paro con autorretención: fuente 230 V → paro (NC) → [marcha (NA) ∥ contacto aux NA] → bobina → N; carga por contacto principal
  const circuito = (marcha: boolean, paro: boolean): Project => P(
    [C('A', 'red', 0, 0, { v: 230, rint: 0 }), C('PA', 'pushNC', 0, 0, { pressed: paro }), C('MA', 'pushNO', 0, 0, { pressed: marcha }), C('K', 'contactor', 0, 0, { vn: 230, pn: 8 }), C('L', 'resistor', 0, 0, { r: 100 }), C('G', 'ground')],
    [W('1', 'A', 0, 'PA', 0), W('2', 'PA', 1, 'MA', 0), W('3', 'PA', 1, 'K', 8), W('4', 'MA', 1, 'K', 0), W('5', 'K', 9, 'K', 0), W('6', 'K', 1, 'A', 1), W('7', 'A', 1, 'G', 0), W('8', 'A', 0, 'K', 2), W('9', 'K', 3, 'L', 0), W('10', 'L', 1, 'A', 1)]);
  it('autorretención: arranca al pulsar marcha, sigue al soltar y para con paro', () => {
    expect(Math.abs(simulate(circuito(false, false)).live['L'].i)).toBeLessThan(1e-4);
    expect(Math.abs(simulate(circuito(true, false)).live['L'].i)).toBeCloseTo(2.3, 1);
    expect(Math.abs(simulate(circuito(false, false)).live['L'].i)).toBeCloseTo(2.3, 1); // sigue
    expect(Math.abs(simulate(circuito(false, true)).live['L'].i)).toBeLessThan(1e-4);
    expect(Math.abs(simulate(circuito(false, false)).live['L'].i)).toBeLessThan(1e-4); // y queda parado
  });
});
