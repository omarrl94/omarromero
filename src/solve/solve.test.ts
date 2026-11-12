import { describe, it, expect } from 'vitest';
import { simulate } from '../model/netlist';
import { buildNet } from './network';
import { METHODS, runMethod, type MethodId } from './methods';
import type { Project } from '../model/types';
import { dosPilas, divisor, luzSimple } from '../model/examples';
import { defaultParams } from '../model/library';

const C = (id: string, type: string, params: Record<string, number | boolean> = {}) => ({ id, type, x: 0, y: 0, rot: 0 as const, params: { ...defaultParams(type), ...params } });
const mk = (components: Project['components'], wires: [string, number, string, number][]): Project => ({ version: 1, name: 't', components, wires: wires.map(([a, at, b, bt], i) => ({ id: 'w' + i, a: { comp: a, term: at }, b: { comp: b, term: bt } })) });

/** Puente de Wheatstone desequilibrado con dos pilas: sirve para mallas, nudos, Kirchhoff, Thévenin, superposición. */
const puente = mk(
  [C('E1', 'battery', { v: 12, rint: 0 }), C('E2', 'battery', { v: 6, rint: 0 }), C('R1', 'resistor', { r: 100 }), C('R2', 'resistor', { r: 200 }), C('R3', 'resistor', { r: 150 }), C('R4', 'resistor', { r: 300 }), C('R5', 'resistor', { r: 50 }), C('G', 'ground')],
  [['E1', 0, 'R1', 0], ['R1', 1, 'R5', 0], ['R5', 1, 'R2', 0], ['R2', 1, 'G', 0], ['R1', 1, 'R3', 0], ['R3', 1, 'R4', 0], ['R4', 1, 'G', 0], ['R5', 1, 'R3', 1], ['E1', 1, 'G', 0], ['E2', 0, 'R4', 0], ['E2', 1, 'G', 0]],
);
const check = (p: Project, ids: MethodId[], expectApplicable: Record<string, boolean> = {}) => {
  const sim = simulate(p);
  const net = buildNet(p, sim);
  expect(net.ok).toBe(true);
  for (const id of ids) {
    const m = runMethod(id, net);
    if (expectApplicable[id] === false) { expect(m.applicable, id).toBe(false); continue; }
    expect(m.applicable, `${id}: ${m.why}`).toBe(true);
    for (const [bid, I] of Object.entries(m.I ?? {})) expect(I, `${id} · ${bid}`).toBeCloseTo(net.truth.I[bid], 6);
  }
  return net;
};
const ALL = METHODS.map((m) => m.id);

describe('resolución analítica', () => {
  it('Millman: dos pilas en paralelo (5 V / 5 A) con todos los métodos', () => {
    const net = check(dosPilas, ALL, { serie: false, superposicion: true });
    expect(net.truth.V[1]).toBeCloseTo(5, 6);
  });
  it('divisor de tensión: serie/paralelo, Kirchhoff, mallas, nudos y Millman coinciden con el simulador', () => {
    check(divisor, ['serie', 'kirchhoff', 'mallas', 'nudos', 'thevenin', 'norton', 'millman', 'superposicion'], { millman: false, superposicion: false });
  });
  it('lámpara con interruptor: pila con resistencia interna', () => {
    check(luzSimple, ['serie', 'kirchhoff', 'mallas', 'nudos'], { millman: false });
  });
  it('puente de Wheatstone con dos fuentes: Kirchhoff, mallas, nudos, superposición coinciden', () => {
    check(puente, ['kirchhoff', 'mallas', 'nudos', 'superposicion'], { serie: false });
  });
  it('Thévenin y Norton dan la misma corriente de carga que el simulador en el puente', () => {
    const sim = simulate(puente); const net = buildNet(puente, sim);
    for (const id of ['thevenin', 'norton'] as const) {
      const m = runMethod(id, net, 'R5');
      expect(m.applicable).toBe(true);
      expect(m.I!.R5).toBeCloseTo(net.truth.I.R5, 6);
    }
  });
  it('con CA o diodos avisa de que no es de CC', () => {
    const p = mk([C('A', 'acsource'), C('R', 'resistor'), C('G', 'ground')], [['A', 0, 'R', 0], ['R', 1, 'A', 1], ['A', 1, 'G', 0]]);
    const net = buildNet(p, simulate(p));
    expect(net.ok).toBe(false);
    expect(net.reason).toMatch(/alterna/);
  });
});
