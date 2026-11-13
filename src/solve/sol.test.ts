import { describe, it, expect } from 'vitest';
import { simulate } from '../model/netlist';
import { ejercicio1, ejercicio2 } from '../model/ejercicios';
import { buildCNet } from './cnet';
import { buildSolucionario } from './sol';

describe('solucionario', () => {
  for (const [nombre, mkp, mode, exp] of [['Ej.1', ejercicio1, 'cargas', [1, 2, 3]], ['Ej.2', ejercicio2, 'haciaA', [4, -1, -3]]] as const) {
    it(`${nombre}: todos los métodos coinciden con el resultado`, () => {
      const p = mkp(); const net = buildCNet(p, simulate(p), mode);
      const sol = buildSolucionario(net);
      expect(sol.ok).toBe(true);
      const ids = sol.methods.filter((m) => m.applicable).map((m) => m.id);
      expect(ids).toEqual(expect.arrayContaining(['kirchhoff', 'mallas', 'cramer', 'nudos', 'millman', 'thevenin', 'norton', 'superposicion']));
      for (const m of sol.methods.filter((x) => x.applicable && x.I)) {
        net.ramas.forEach((r, k) => {
          if (m.id === 'thevenin' || m.id === 'norton') { if (m.I![r.id]) expect(m.I![r.id].re, m.id).toBeCloseTo(net.I[r.id].re, 6); return; }
          expect(m.I![r.id].re, `${m.id} ${r.id}`).toBeCloseTo(exp[k], 6);
        });
      }
    });
  }
  it('Resultado del ej. 1: 25 W', () => {
    const p = ejercicio1(); const sol = buildSolucionario(buildCNet(p, simulate(p)));
    const box = sol.resultado[0] as { lines: string[] };
    expect(box.lines.join('\n')).toContain('25 W');
  });
});

import { EXAMPLES } from '../model/examples';
describe('alterna', () => {
  it('RLC serie: un solo lazo, sale I y el apartado de potencias', () => {
    const p = EXAMPLES.find((e) => e.name.includes('RLC serie'))!;
    const net = buildCNet(p, simulate(p)); const sol = buildSolucionario(net);
    expect(net.ac).toBe(true); expect(sol.ok).toBe(true);
    const pot = sol.methods.find((m) => m.id === 'potencias')!;
    expect(pot.applicable).toBe(true);
    expect(sol.methods.find((m) => m.id === 'ohm')!.applicable).toBe(true);
  });
  it('todos los ejemplos resolubles generan solucionario sin fallar', () => {
    for (const p of EXAMPLES) { const net = buildCNet(p, simulate(p)); if (!net.ok) continue; const sol = buildSolucionario(net); expect(sol.ok, p.name).toBe(true); }
  });
});
