import { describe, it, expect } from 'vitest';
import { simulateTran, type TEl } from './tran';

const at = (r: ReturnType<typeof simulateTran>, node: number, time: number) => { const k = r.t.findIndex((x) => x >= time - 1e-12); return r.v[node][k]; };

describe('transitorio', () => {
  it('RC: V(τ) = 63,2 % de la fuente', () => {
    const els: TEl[] = [{ k: 'V', a: 1, b: 0, w: () => 10 }, { k: 'R', a: 1, b: 2, r: 1000 }, { k: 'C', a: 2, b: 0, c: 1e-6 }];
    const r = simulateTran(3, els, { tEnd: 5e-3, dt: 1e-6 });
    expect(r.ok).toBe(true);
    expect(at(r, 2, 1e-3)).toBeCloseTo(10 * (1 - Math.exp(-1)), 1);
    expect(at(r, 2, 5e-3)).toBeCloseTo(10 * (1 - Math.exp(-5)), 1);
  });
  it('RL: i(τ) = 63,2 % de V/R', () => {
    const els: TEl[] = [{ k: 'V', a: 1, b: 0, w: () => 10 }, { k: 'R', a: 1, b: 2, r: 10 }, { k: 'L', a: 2, b: 0, l: 0.01 }];
    const r = simulateTran(3, els, { tEnd: 5e-3, dt: 1e-6 });
    expect(at(r, 1, 1e-3) - at(r, 2, 1e-3)).toBeCloseTo(10 * (1 - Math.exp(-1)), 1); // tensión en R = R·i, con τ = L/R = 1 ms
  });
  it('rectificador de media onda: pico ≈ Vm − 0,7 V y sin semiciclo negativo', () => {
    const els: TEl[] = [{ k: 'V', a: 1, b: 0, w: (t) => 10 * Math.sin(2 * Math.PI * 50 * t) }, { k: 'D', a: 1, b: 2 }, { k: 'R', a: 2, b: 0, r: 1000 }];
    const r = simulateTran(3, els, { tEnd: 0.04, dt: 2e-5 });
    expect(r.ok).toBe(true);
    const mx = Math.max(...r.v[2]), mn = Math.min(...r.v[2]);
    expect(mx).toBeGreaterThan(9.0); expect(mx).toBeLessThan(9.6);
    expect(mn).toBeGreaterThan(-0.01);
  });
  it('transistor NPN como interruptor: saturado con IB suficiente, cortado sin ella', () => {
    const mk = (vin: number): TEl[] => [{ k: 'V', a: 1, b: 0, w: () => 5 }, { k: 'V', a: 2, b: 0, w: () => vin }, { k: 'R', a: 2, b: 3, r: 10000 }, { k: 'Q', c: 4, b: 3, e: 0 }, { k: 'R', a: 1, b: 4, r: 1000 }];
    const on = simulateTran(5, mk(5), { tEnd: 1e-4, dt: 1e-6 }), off = simulateTran(5, mk(0), { tEnd: 1e-4, dt: 1e-6 });
    expect(on.ok && off.ok).toBe(true);
    expect(on.v[4][on.v[4].length - 1]).toBeLessThan(0.3);
    expect(off.v[4][off.v[4].length - 1]).toBeGreaterThan(4.9);
  });
  it('MOSFET N: conduce con VGS = 5 V y no con 0 V', () => {
    const mk = (vg: number): TEl[] => [{ k: 'V', a: 1, b: 0, w: () => 12 }, { k: 'V', a: 2, b: 0, w: () => vg }, { k: 'R', a: 1, b: 3, r: 100 }, { k: 'M', d: 3, g: 2, s: 0, kp: 0.5, vt: 2 }];
    const on = simulateTran(4, mk(5), { tEnd: 1e-5, dt: 1e-6 }), off = simulateTran(4, mk(0), { tEnd: 1e-5, dt: 1e-6 });
    expect(on.v[3][on.v[3].length - 1]).toBeLessThan(3);
    expect(off.v[3][off.v[3].length - 1]).toBeGreaterThan(11.9);
  });
  it('amplificador operacional inversor: ganancia −Rf/Rin', () => {
    const els: TEl[] = [{ k: 'V', a: 1, b: 0, w: () => 0.5 }, { k: 'R', a: 1, b: 2, r: 1000 }, { k: 'R', a: 2, b: 3, r: 10000 }, { k: 'V', a: 4, b: 0, w: () => 12 }, { k: 'V', a: 5, b: 0, w: () => -12 }, { k: 'OA', p: 0, n: 2, o: 3, vp: 4, vn: 5 }];
    const r = simulateTran(6, els, { tEnd: 2e-4, dt: 1e-6 });
    expect(r.ok).toBe(true);
    expect(r.v[3][r.v[3].length - 1]).toBeCloseTo(-5, 1);
  });
  it('op-amp satura en el carril', () => {
    const els: TEl[] = [{ k: 'V', a: 1, b: 0, w: () => 2 }, { k: 'R', a: 1, b: 2, r: 1000 }, { k: 'R', a: 2, b: 3, r: 10000 }, { k: 'V', a: 4, b: 0, w: () => 12 }, { k: 'V', a: 5, b: 0, w: () => -12 }, { k: 'OA', p: 0, n: 2, o: 3, vp: 4, vn: 5 }];
    const r = simulateTran(6, els, { tEnd: 2e-4, dt: 1e-6 });
    expect(r.v[3][r.v[3].length - 1]).toBeLessThan(-10);
    expect(r.v[3][r.v[3].length - 1]).toBeGreaterThan(-12.1);
  });
});

import { buildTran } from '../model/tranBuild';
import { simulate } from '../model/netlist';
import { defaultParams } from '../model/library';
import type { Component, Project, Wire } from '../model/types';
const C = (id: string, type: string, params: Component['params'] = {}): Component => ({ id, type, x: 0, y: 0, rot: 0, params: { ...defaultParams(type), ...params } });
const W = (id: string, a: string, ta: number, b: string, tb: number): Wire => ({ id, a: { comp: a, term: ta }, b: { comp: b, term: tb } });
const run = (p: Project, tEnd: number, dt: number) => { const sim = simulate(p); const b = buildTran(p, sim); return { b, sim, r: simulateTran(b.nodeCount, b.els, { tEnd, dt }) }; };

describe('transitorio desde el circuito dibujado', () => {
  it('rectificador de media onda con la red 230 V: pico ≈ 325 − 0,7 V', () => {
    const p: Project = { version: 1, name: 't', components: [C('A', 'red', { rint: 0 }), C('D', 'diode'), C('R', 'resistor', { r: 1000, pmax: 1000 }), C('G', 'ground')], wires: [W('1', 'A', 0, 'D', 0), W('2', 'D', 1, 'R', 0), W('3', 'R', 1, 'A', 1), W('4', 'A', 1, 'G', 0)] };
    const { b, sim, r } = run(p, 0.04, 2e-5);
    expect(r.ok).toBe(true);
    const nR = sim.nodeOf['R:0'];
    expect(Math.max(...r.v[nR])).toBeGreaterThan(323.5); expect(Math.max(...r.v[nR])).toBeLessThan(325);
    expect(Math.min(...r.v[nR])).toBeGreaterThan(-0.1);
    expect(b.unsupported).toEqual([]);
  });
  it('puente rectificador con condensador: tensión continua ≈ pico − 1,4 V con poco rizado', () => {
    const p: Project = { version: 1, name: 't', components: [C('A', 'acsource', { v: 12, rint: 0 }), C('B', 'bridge1'), C('C', 'capacitor', { c: 4700 }), C('R', 'resistor', { r: 100, pmax: 1000 }), C('G', 'ground')],
      wires: [W('1', 'A', 0, 'B', 0), W('2', 'A', 1, 'B', 1), W('3', 'B', 2, 'C', 0), W('4', 'B', 2, 'R', 0), W('5', 'C', 1, 'G', 0), W('6', 'R', 1, 'G', 0), W('7', 'B', 3, 'G', 0)] };
    const { sim, r } = run(p, 0.1, 5e-5);
    expect(r.ok).toBe(true);
    const nv = sim.nodeOf['R:0'];
    const tail = r.v[nv].slice(-400);
    expect(Math.max(...tail)).toBeGreaterThan(14.5); expect(Math.max(...tail)).toBeLessThan(15.6);
    expect(Math.min(...tail)).toBeGreaterThan(12);
  });
  it('555 astable: frecuencia ≈ 1,44/((R1+2R2)·C)', () => {
    const p: Project = { version: 1, name: 't', components: [C('V', 'dcsource', { v: 5 }), C('T', 'ne555'), C('R1', 'resistor', { r: 1000, pmax: 1 }), C('R2', 'resistor', { r: 10000, pmax: 1 }), C('C', 'capacitor', { c: 0.1 }), C('G', 'ground')],
      wires: [W('1', 'V', 0, 'T', 0), W('2', 'V', 0, 'T', 4), W('3', 'V', 0, 'R1', 0), W('4', 'R1', 1, 'T', 6), W('5', 'T', 6, 'R2', 0), W('6', 'R2', 1, 'T', 3), W('7', 'T', 3, 'T', 2), W('8', 'T', 3, 'C', 0), W('9', 'C', 1, 'G', 0), W('10', 'T', 1, 'G', 0), W('11', 'V', 1, 'G', 0)] };
    const { sim, r } = run(p, 0.03, 2e-6);
    expect(r.ok).toBe(true);
    const out = r.v[sim.nodeOf['T:5']];
    let edges = 0; for (let k = 1; k < out.length; k++) if (out[k - 1] < 2.5 && out[k] >= 2.5) edges++;
    const f = edges / 0.03; const fe = 1.44 / ((1000 + 2 * 10000) * 1e-7);
    expect(f).toBeGreaterThan(fe * 0.85); expect(f).toBeLessThan(fe * 1.15);
  });
});

import { fuenteRectificada, astable555, opampInversor } from '../model/examples';
describe('ejemplos de electrónica', () => {
  it('fuente rectificada: continua de ≈ 14 V', () => {
    const { sim, r } = run(fuenteRectificada, 0.1, 5e-5); const v = r.v[sim.nodeOf['R1:0']].slice(-400);
    expect(r.ok).toBe(true); expect(Math.min(...v)).toBeGreaterThan(13); expect(Math.max(...v)).toBeLessThan(16);
  });
  it('555 con LED: parpadea (≈ 0,9 Hz)', () => {
    const { sim, r } = run(astable555, 3, 1e-4); const out = r.v[sim.nodeOf['U1:5']];
    let edges = 0; for (let k = 1; k < out.length; k++) if (out[k - 1] < 2.5 && out[k] >= 2.5) edges++;
    expect(edges).toBeGreaterThanOrEqual(2);
  });
  it('op-amp inversor: ganancia −10 (salida ≈ 5 V de pico)', () => {
    const { sim, r } = run(opampInversor, 0.004, 2e-6); const v = r.v[sim.nodeOf['U1:2']].slice(-1000);
    expect(Math.max(...v)).toBeGreaterThan(4.6); expect(Math.max(...v)).toBeLessThan(5.2);
  });
});
