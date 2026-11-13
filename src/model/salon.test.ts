import { describe, it, expect } from 'vitest';
import { salon } from './examples';
import { simulate } from './netlist';
import { cableReport } from './cables';

describe('ejemplo del salón', () => {
  it('funciona sin errores, C2 ≈ 7,3 A y C1 ≈ 0,08 A, sin sobrecargas ni caídas excesivas', () => {
    const sim = simulate(structuredClone(salon));
    expect(sim.messages.filter((m) => m.level === 'error')).toEqual([]);
    expect(sim.events).toEqual([]);
    expect(Math.abs(sim.live['Q2'].i)).toBeGreaterThan(6.5); expect(Math.abs(sim.live['Q2'].i)).toBeLessThan(8);
    expect(Math.abs(sim.live['Q1'].i)).toBeLessThan(0.2);
    const rep = cableReport(salon, sim);
    expect(rep.messages.filter((m) => m.level === 'error')).toEqual([]);
    expect(Math.max(...Object.values(rep.info).map((i) => i.pct ?? 0))).toBeLessThan(3);
  });
});
