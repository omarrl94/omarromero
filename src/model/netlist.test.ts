import { describe, it, expect } from 'vitest';
import { simulate } from './netlist';
import { dosPilas, luzSimple, divisor } from './examples';

describe('del esquema al motor', () => {
  it('dos pilas en paralelo: V_AB = 5 V e I_carga = 5 A', () => {
    const r = simulate(dosPilas);
    expect(r.solution.ok).toBe(true);
    expect(r.componentVoltage.RL).toBeCloseTo(5, 9);
    expect(r.componentCurrent['RL:0']).toBeCloseTo(5, 9);
    // cada pila entrega 2,5 A
    expect(-r.componentCurrent['E1:0']).toBeCloseTo(2.5, 9);
    // el cable que va a la carga lleva 5 A hacia la carga (w5: J3 -> RL)
    expect(Math.abs(r.wireCurrent.w5)).toBeCloseTo(5, 9);
    expect(r.messages.filter((m) => m.level === 'error')).toHaveLength(0);
  });

  it('lámpara de 12 V/12 W con pila de 12 V y 0,2 Ω: ~0,98 A', () => {
    const r = simulate(luzSimple);
    expect(r.componentCurrent['L1:0']).toBeCloseTo(12 / 12.2, 4);
  });

  it('interruptor abierto: no circula corriente', () => {
    const p = structuredClone(luzSimple);
    p.components.find((c) => c.id === 'S1')!.params.closed = false;
    const r = simulate(p);
    expect(Math.abs(r.componentCurrent["L1:0"])).toBeLessThan(1e-6);
  });

  it('divisor 9 V · 1k/2k → 6 V en R2', () => {
    expect(simulate(divisor).componentVoltage.R2).toBeCloseTo(6, 9);
  });

  it('KCL en cables: la corriente en cada cable de un lazo simple es la misma', () => {
    const r = simulate(luzSimple);
    const vals = Object.values(r.wireCurrent).filter((v, i) => i < 3).map(Math.abs);
    for (const v of vals) expect(v).toBeCloseTo(vals[0], 4);
  });
});

import type { Project } from './types';
const mk = (components: Project['components'], wires: [string, number, string, number][]): Project => ({
  version: 1, name: 't', components,
  wires: wires.map(([a, at, b, bt], i) => ({ id: 'w' + i, a: { comp: a, term: at }, b: { comp: b, term: bt } })),
});
const C = (id: string, type: string, params: Record<string, number | boolean> = {}) => ({ id, type, x: 0, y: 0, rot: 0 as const, params: { ...defaultParams(type), ...params } });
import { defaultParams } from './library';

describe('componentes no lineales y protecciones', () => {
  it('LED rojo con 330 Ω a 9 V: I ≈ (9−1,9)/(330+5) = 21,2 mA', () => {
    const p = mk([C('B', 'battery', { v: 9 }), C('R', 'resistor', { r: 330 }), C('D', 'led'), C('G', 'ground')],
      [['B', 0, 'R', 0], ['R', 1, 'D', 0], ['D', 1, 'B', 1], ['B', 1, 'G', 0]]);
    const r = simulate(p);
    expect(r.componentCurrent['D:0']).toBeCloseTo(7.1 / 335, 5);
    expect(r.live.D.on).toBe(true);
    expect(r.events).toHaveLength(0);
  });
  it('LED en polarización inversa: no conduce', () => {
    const p = mk([C('B', 'battery', { v: 9 }), C('R', 'resistor', { r: 330 }), C('D', 'led'), C('G', 'ground')],
      [['B', 0, 'R', 0], ['R', 1, 'D', 1], ['D', 0, 'B', 1], ['B', 1, 'G', 0]]);
    const r = simulate(p);
    expect(Math.abs(r.componentCurrent['D:0'])).toBeLessThan(1e-6);
    expect(r.live.D.on).toBe(false);
  });
  it('LED sin resistencia a 9 V: se quema', () => {
    const p = mk([C('B', 'battery', { v: 9 }), C('D', 'led'), C('G', 'ground')], [['B', 0, 'D', 0], ['D', 1, 'B', 1], ['B', 1, 'G', 0]]);
    expect(simulate(p).events[0]).toMatchObject({ id: 'D', state: 'burnt' });
  });
  it('Zener 5,1 V alimentado a 12 V con 220 Ω: regula ≈ 5,1 V', () => {
    const p = mk([C('B', 'battery', { v: 12 }), C('R', 'resistor', { r: 220 }), C('Z', 'zener'), C('G', 'ground')],
      [['B', 0, 'R', 0], ['R', 1, 'Z', 1], ['Z', 0, 'B', 1], ['B', 1, 'G', 0]]);
    const r = simulate(p);
    expect(-r.componentVoltage.Z).toBeCloseTo(5.1, 0); // tensión inversa ≈ Vz (+ caída en su resistencia)
    expect(-r.componentVoltage.Z).toBeGreaterThan(5.1);
    expect(-r.componentVoltage.Z).toBeLessThan(5.3);
  });
  it('fusible de 2 A con 12 A: se funde; con el runtime aplicado, el circuito queda abierto', () => {
    const p = mk([C('B', 'battery', { v: 12 }), C('F', 'fuse', { in: 2 }), C('R', 'resistor', { r: 1 }), C('G', 'ground')],
      [['B', 0, 'F', 0], ['F', 1, 'R', 0], ['R', 1, 'B', 1], ['B', 1, 'G', 0]]);
    const r = simulate(p);
    expect(r.events[0]).toMatchObject({ id: 'F', state: 'blown' });
    const r2 = simulate(p, { F: 'blown' });
    expect(Math.abs(r2.componentCurrent['R:0'])).toBeLessThan(1e-6);
    expect(r2.messages.some((m) => m.text.includes('fundido'))).toBe(true);
  });
  it('magnetotérmico C10: dispara a 12 A·? no (<100 A); sí con cortocircuito de 230 V sobre 1 Ω', () => {
    const p = mk([C('B', 'battery', { v: 230 }), C('Q', 'breaker', { in: 10, curve: 10 }), C('R', 'resistor', { r: 1 }), C('G', 'ground')],
      [['B', 0, 'Q', 0], ['Q', 1, 'R', 0], ['R', 1, 'B', 1], ['B', 1, 'G', 0]]);
    expect(simulate(p).events[0]).toMatchObject({ id: 'Q', state: 'tripped' });
  });
  it('potenciómetro al 50 % como divisor: 10 V → 5 V', () => {
    const p = mk([C('B', 'battery', { v: 10 }), C('P', 'pot', { r: 1000, pos: 0.5 }), C('G', 'ground')],
      [['B', 0, 'P', 0], ['P', 1, 'B', 1], ['B', 1, 'G', 0]]);
    const r = simulate(p);
    expect(r.solution.voltages[r.nodeOf['P:2']]).toBeCloseTo(5, 3);
  });
  it('conmutador: dirige la corriente a una u otra lámpara', () => {
    const base = () => mk([C('B', 'battery', { v: 12 }), C('S', 'spdt', { pos: 0 }), C('L1', 'lamp'), C('L2', 'lamp'), C('G', 'ground')],
      [['B', 0, 'S', 0], ['S', 1, 'L1', 0], ['S', 2, 'L2', 0], ['L1', 1, 'B', 1], ['L2', 1, 'B', 1], ['B', 1, 'G', 0]]);
    const a = simulate(base());
    expect(a.componentCurrent['L1:0']).toBeCloseTo(1, 2);
    expect(Math.abs(a.componentCurrent['L2:0'])).toBeLessThan(1e-6);
    const q = base(); q.components[1].params.pos = 1;
    expect(simulate(q).componentCurrent['L2:0']).toBeCloseTo(1, 2);
  });
  it('NTC: la resistencia baja al subir la temperatura (10 kΩ a 25 °C, B=3950)', () => {
    const a = simulate(mk([C('B', 'battery', { v: 5 }), C('N', 'ntc', { t: 25 }), C('G', 'ground')], [['B', 0, 'N', 0], ['N', 1, 'B', 1], ['B', 1, 'G', 0]]));
    const b = simulate(mk([C('B', 'battery', { v: 5 }), C('N', 'ntc', { t: 60 }), C('G', 'ground')], [['B', 0, 'N', 0], ['N', 1, 'B', 1], ['B', 1, 'G', 0]]));
    expect(a.componentCurrent['N:0']).toBeCloseTo(5 / 10000, 5);
    expect(b.componentCurrent['N:0']).toBeGreaterThan(a.componentCurrent['N:0'] * 3);
  });
});

describe('circuitos de corriente alterna', () => {
  it('RLC serie 230 V/50 Hz: I = V/|Z|, cos φ y potencias coherentes', () => {
    const p = mk([C('A', 'acsource', { v: 230, f: 50 }), C('R', 'resistor', { r: 10 }), C('L', 'inductor', { l: 50, r: 0.001 }), C('K', 'capacitor', { c: 470 }), C('G', 'ground')],
      [['A', 0, 'R', 0], ['R', 1, 'L', 0], ['L', 1, 'K', 0], ['K', 1, 'A', 1], ['A', 1, 'G', 0]]);
    const r = simulate(p);
    const w = 2 * Math.PI * 50;
    const X = w * 0.05 - 1 / (w * 470e-6);
    const Z = Math.hypot(10.001, X);
    expect(r.live.R.i).toBeCloseTo(230 / Z, 4);
    expect(r.live.R.p).toBeCloseTo((230 / Z) ** 2 * 10, 2); // P = I²R
    // La fuente entrega la misma P que consume R (L y C ideales no consumen)
    expect(r.live.A.pf).toBeCloseTo(10.001 / Z, 3);
    expect(r.ac!.freq).toBe(50);
    expect(r.messages.filter((m) => m.level === 'error')).toHaveLength(0);
  });
  it('corrección del cos φ: carga R-L (cos φ 0,6) + condensador en paralelo sube el cos φ y baja la corriente', () => {
    const mkc = (withC: boolean) => {
      const comps = [C('A', 'acsource', { v: 230 }), C('R', 'resistor', { r: 30 }), C('L', 'inductor', { l: (40 / (2 * Math.PI * 50)) * 1000, r: 0.001 }), C('G', 'ground'), ...(withC ? [C('K', 'capacitor', { c: 40 })] : [])];
      const wr: [string, number, string, number][] = [['A', 0, 'R', 0], ['R', 1, 'L', 0], ['L', 1, 'A', 1], ['A', 1, 'G', 0]];
      if (withC) wr.push(['A', 0, 'K', 0], ['K', 1, 'A', 1]);
      return simulate(mk(comps, wr));
    };
    const a = mkc(false), b = mkc(true);
    expect(a.live.A.pf).toBeCloseTo(0.6, 2);
    expect(b.live.A.pf).toBeGreaterThan(0.85);
    expect(Math.abs(b.live.A.i)).toBeLessThan(Math.abs(a.live.A.i));
  });
});

describe('cortocircuitos y averías que revientan componentes', () => {
  it('pila ideal con un cable entre sus bornes: se quema y el circuito queda abierto', () => {
    const p = mk([C('B', 'battery', { v: 12, rint: 0 }), C('G', 'ground')], [['B', 0, 'B', 1], ['B', 1, 'G', 0]]);
    const r = simulate(p);
    expect(r.events[0]).toMatchObject({ id: 'B', state: 'burnt' });
    const r2 = simulate(p, { B: 'burnt' });
    expect(r2.solution.ok).toBe(true);
    expect(r2.events).toHaveLength(0);
  });
  it('lámpara de 12 V conectada a 24 V: se funde (P ≈ 4× nominal)', () => {
    const p = mk([C('B', 'battery', { v: 24 }), C('L', 'lamp', { vn: 12, pn: 12 }), C('G', 'ground')], [['B', 0, 'L', 0], ['L', 1, 'B', 1], ['B', 1, 'G', 0]]);
    expect(simulate(p).events[0]).toMatchObject({ id: 'L', state: 'burnt' });
  });
  it('fuente de CA en cortocircuito se quema', () => {
    const p = mk([C('A', 'acsource', { v: 230, rint: 0 }), C('G', 'ground')], [['A', 0, 'A', 1], ['A', 1, 'G', 0]]);
    expect(simulate(p).events[0]).toMatchObject({ id: 'A', state: 'burnt' });
  });
});
