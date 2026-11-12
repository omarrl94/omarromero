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
    expect(r.componentCurrent['L1:0']).toBeCloseTo(12 / 12.2, 6);
  });

  it('interruptor abierto: no circula corriente', () => {
    const p = structuredClone(luzSimple);
    p.components.find((c) => c.id === 'S1')!.params.closed = false;
    const r = simulate(p);
    expect(Math.abs(r.componentCurrent['L1:0'])).toBeLessThan(1e-9);
  });

  it('divisor 9 V · 1k/2k → 6 V en R2', () => {
    expect(simulate(divisor).componentVoltage.R2).toBeCloseTo(6, 9);
  });

  it('KCL en cables: la corriente en cada cable de un lazo simple es la misma', () => {
    const r = simulate(luzSimple);
    const vals = Object.values(r.wireCurrent).filter((v, i) => i < 3).map(Math.abs);
    for (const v of vals) expect(v).toBeCloseTo(vals[0], 6);
  });
});
