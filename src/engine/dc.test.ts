import { describe, it, expect } from 'vitest';
import { solveDC, type Element } from './dc';

const close = (a: number, b: number, tol = 1e-9) => expect(Math.abs(a - b)).toBeLessThan(tol);
const solve = (nodeCount: number, elements: Element[]) => solveDC({ nodeCount, elements });

describe('MNA en continua', () => {
  it('Ohm: 12 V sobre 4 Ω → 3 A', () => {
    const s = solve(2, [
      { id: 'V', kind: 'V', a: 1, b: 0, value: 12 },
      { id: 'R', kind: 'R', a: 1, b: 0, value: 4 },
    ]);
    expect(s.ok).toBe(true);
    close(s.voltages[1], 12);
    close(s.currents.R, 3);
    close(s.currents.V, -3); // la fuente entrega: corriente negativa
    close(s.powers.R, 36);
    close(s.powers.V, -36);
  });

  it('serie: 10 V sobre 2+3+5 Ω → 1 A, caídas 2/3/5 V', () => {
    const s = solve(4, [
      { id: 'V', kind: 'V', a: 1, b: 0, value: 10 },
      { id: 'R1', kind: 'R', a: 1, b: 2, value: 2 },
      { id: 'R2', kind: 'R', a: 2, b: 3, value: 3 },
      { id: 'R3', kind: 'R', a: 3, b: 0, value: 5 },
    ]);
    close(s.currents.R1, 1);
    close(s.voltages[2], 8);
    close(s.voltages[3], 5);
  });

  it('paralelo: 12 V sobre 6 Ω ∥ 12 Ω → 6 A', () => {
    const s = solve(2, [
      { id: 'V', kind: 'V', a: 1, b: 0, value: 12 },
      { id: 'R1', kind: 'R', a: 1, b: 0, value: 6 },
      { id: 'R2', kind: 'R', a: 1, b: 0, value: 12 },
    ]);
    close(s.currents.R1, 2);
    close(s.currents.R2, 1);
    close(-s.currents.V, 3);
  });

  it('divisor de tensión: 9 V, 1 kΩ + 2 kΩ → 6 V en el punto medio', () => {
    const s = solve(3, [
      { id: 'V', kind: 'V', a: 1, b: 0, value: 9 },
      { id: 'R1', kind: 'R', a: 1, b: 2, value: 1000 },
      { id: 'R2', kind: 'R', a: 2, b: 0, value: 2000 },
    ]);
    close(s.voltages[2], 6);
  });

  it('Millman: dos pilas de 10 V con 2 Ω internos en paralelo y carga 1 Ω → 5 V y 5 A', () => {
    // nudo 1 = borne A (carga), nudo 2 = borne B (masa) = nudo 0
    const s = solve(2, [
      { id: 'E1', kind: 'V', a: 1, b: 0, value: 10, rint: 2 },
      { id: 'E2', kind: 'V', a: 1, b: 0, value: 10, rint: 2 },
      { id: 'RL', kind: 'R', a: 1, b: 0, value: 1 },
    ]);
    expect(s.ok).toBe(true);
    close(s.voltages[1], 5);
    close(s.currents.RL, 5);
    close(-s.currents.E1, 2.5);
    close(-s.currents.E2, 2.5);
  });

  it('Millman con pilas distintas: 12 V/1 Ω y 6 V/2 Ω, carga 3 Ω', () => {
    // V = (12/1 + 6/2) / (1/1 + 1/2 + 1/3) = 15 / (11/6)
    const s = solve(2, [
      { id: 'E1', kind: 'V', a: 1, b: 0, value: 12, rint: 1 },
      { id: 'E2', kind: 'V', a: 1, b: 0, value: 6, rint: 2 },
      { id: 'RL', kind: 'R', a: 1, b: 0, value: 3 },
    ]);
    close(s.voltages[1], 15 / (11 / 6), 1e-9);
  });

  it('mallas: dos fuentes y tres resistencias (Kirchhoff)', () => {
    // E1=10V -R1=2Ω- N1 -R3=4Ω- GND ; E2=4V -R2=1Ω- N1
    // V1 = (10/2 + 4/1)/(1/2+1/1+1/4) = 9/1.75
    const s = solve(4, [
      { id: 'E1', kind: 'V', a: 2, b: 0, value: 10 },
      { id: 'E2', kind: 'V', a: 3, b: 0, value: 4 },
      { id: 'R1', kind: 'R', a: 2, b: 1, value: 2 },
      { id: 'R2', kind: 'R', a: 3, b: 1, value: 1 },
      { id: 'R3', kind: 'R', a: 1, b: 0, value: 4 },
    ]);
    const v1 = 9 / 1.75;
    close(s.voltages[1], v1);
    // KCL en el nudo 1
    close(s.currents.R1 + s.currents.R2, s.currents.R3);
  });

  it('puente de Wheatstone equilibrado: sin corriente por el galvanómetro', () => {
    const s = solve(4, [
      { id: 'V', kind: 'V', a: 1, b: 0, value: 10 },
      { id: 'R1', kind: 'R', a: 1, b: 2, value: 100 },
      { id: 'R2', kind: 'R', a: 2, b: 0, value: 200 },
      { id: 'R3', kind: 'R', a: 1, b: 3, value: 150 },
      { id: 'R4', kind: 'R', a: 3, b: 0, value: 300 },
      { id: 'G', kind: 'R', a: 2, b: 3, value: 50 },
    ]);
    close(s.currents.G, 0, 1e-12);
  });

  it('Thevenin: equivalente visto desde una carga', () => {
    // 12 V, R1=6, R2=3 divisor; Vth=4V, Rth=2Ω; carga 2Ω → 1 V·... V=2V
    const s = solve(3, [
      { id: 'V', kind: 'V', a: 1, b: 0, value: 12 },
      { id: 'R1', kind: 'R', a: 1, b: 2, value: 6 },
      { id: 'R2', kind: 'R', a: 2, b: 0, value: 3 },
      { id: 'RL', kind: 'R', a: 2, b: 0, value: 2 },
    ]);
    close(s.voltages[2], 4 * 2 / (2 + 2));
  });

  it('superposición: fuente de corriente + fuente de tensión', () => {
    // 10 V -R1=5Ω- N1 ; N1 -R2=5Ω- GND ; fuente de 1 A inyecta en N1 (de GND hacia N1)
    const s = solve(3, [
      { id: 'V', kind: 'V', a: 2, b: 0, value: 10 },
      { id: 'R1', kind: 'R', a: 2, b: 1, value: 5 },
      { id: 'R2', kind: 'R', a: 1, b: 0, value: 5 },
      { id: 'I', kind: 'I', a: 0, b: 1, value: 1 },
    ]);
    // solo V: 5 V ; solo I: 1 A * (5∥5)=2.5 V ; total 7.5
    close(s.voltages[1], 7.5);
  });

  it('lazo de fuentes de tensión → error claro', () => {
    const s = solve(2, [
      { id: 'V1', kind: 'V', a: 1, b: 0, value: 10 },
      { id: 'V2', kind: 'V', a: 1, b: 0, value: 5 },
    ]);
    expect(s.ok).toBe(false);
    expect(s.issues[0].code).toBe('voltage-loop');
  });

  it('pila ideal cortocircuitada → error claro', () => {
    const s = solve(1, [{ id: 'V1', kind: 'V', a: 0, b: 0, value: 10 }]);
    expect(s.ok).toBe(false);
    expect(s.issues[0].code).toBe('short-source');
  });

  it('pila con rint en cortocircuito → I = E/rint, sin error', () => {
    const s = solve(2, [
      { id: 'V', kind: 'V', a: 1, b: 0, value: 9, rint: 0.5 },
      { id: 'W', kind: 'R', a: 1, b: 0, value: 0 },
    ]);
    expect(s.ok).toBe(true);
    close(-s.currents.V, 18, 1e-6);
  });

  it('rama colgante (abierta) no da error ni corriente', () => {
    const s = solve(3, [
      { id: 'V', kind: 'V', a: 1, b: 0, value: 5 },
      { id: 'R1', kind: 'R', a: 1, b: 0, value: 10 },
      { id: 'R2', kind: 'R', a: 2, b: 1, value: 10 },
    ]);
    expect(s.ok).toBe(true);
    expect(s.issues).toHaveLength(0);
    close(s.currents.R2, 0, 1e-9);
    close(s.voltages[2], 5);
  });

  it('isla sin conexión a tierra → aviso "floating" y resuelve', () => {
    const s = solve(4, [
      { id: 'V', kind: 'V', a: 1, b: 0, value: 5 },
      { id: 'R1', kind: 'R', a: 1, b: 0, value: 10 },
      { id: 'R2', kind: 'R', a: 2, b: 3, value: 10 },
    ]);
    expect(s.ok).toBe(true);
    expect(s.issues[0].code).toBe('floating');
  });
});

import { resistanceBetween } from './dc';
describe('óhmetro (resistencia equivalente)', () => {
  it('serie, paralelo y sin camino', () => {
    const els: Element[] = [
      { id: 'R1', kind: 'R', a: 1, b: 2, value: 100 },
      { id: 'R2', kind: 'R', a: 2, b: 0, value: 300 },
      { id: 'R3', kind: 'R', a: 1, b: 0, value: 400 },
      { id: 'V', kind: 'V', a: 1, b: 0, value: 12 }, // se anula: no cambia nada si rint=0 → cortocircuito
    ];
    expect(resistanceBetween({ nodeCount: 3, elements: els.slice(0, 3) }, 1, 0)).toBeCloseTo(200, 6);
    expect(resistanceBetween({ nodeCount: 3, elements: els.slice(0, 2) }, 1, 0)).toBeCloseTo(400, 6);
    expect(resistanceBetween({ nodeCount: 4, elements: els.slice(0, 2) }, 3, 0)).toBe(Infinity);
    // pila ideal anulada = cortocircuito entre 1 y 0 → R1 ∥ R2 = 75 Ω
    expect(resistanceBetween({ nodeCount: 3, elements: els }, 1, 2)).toBeCloseTo(75, 3);
  });
});
