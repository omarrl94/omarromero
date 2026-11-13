/** Ejercicios del solucionario del Tema 3 (dos pilas y una carga; pila invertida), montados como circuitos. */
import type { Project, Component, Wire } from './types';
import { defaultParams } from './library';

const comp = (id: string, type: string, x: number, y: number, rot: 0 | 90 | 180 | 270 = 0, params: Record<string, number | boolean | string> = {}, label?: string): Component => ({ id, type, x, y, rot, params: { ...defaultParams(type), ...params }, label });
const w = (id: string, a: [string, number], b: [string, number]): Wire => ({ id, a: { comp: a[0], term: a[1] }, b: { comp: b[0], term: b[1] } });

/** Tres ramas entre los nudos A (arriba) y B (abajo): izquierda R1 + V1, centro R_c, derecha R2 + V2 (V2 puede ir invertida). */
function tresRamas(name: string, v1: number, r1: number, rc: number, r2: number, v2: number, invertida: boolean, rcLabel: string): Project {
  return {
    version: 1, name,
    components: [
      comp('R1', 'resistor', 160, 160, 90, { r: r1, pmax: 1000 }), comp('V1', 'battery', 160, 280, 90, { v: v1, rint: 0, imax: 1000 }, 'V1'),
      comp('R3', 'resistor', 380, 220, 90, { r: rc, pmax: 1000 }, rcLabel),
      comp('R2', 'resistor', 600, 160, 90, { r: r2, pmax: 1000 }), comp('V2', 'battery', 600, 280, invertida ? 270 : 90, { v: v2, rint: 0, imax: 1000 }, invertida ? 'V3' : 'V2'),
      comp('JA', 'junction', 380, 120), comp('JB', 'junction', 380, 320), comp('GND', 'ground', 380, 340),
    ],
    wires: [
      w('w1', ['R1', 1], ['V1', 0]), w('w2', ['R2', 1], ['V2', invertida ? 1 : 0]),
      w('w3', ['R1', 0], ['JA', 0]), w('w4', ['R2', 0], ['JA', 0]), w('w5', ['R3', 0], ['JA', 0]),
      w('w6', ['V1', 1], ['JB', 0]), w('w7', ['V2', invertida ? 0 : 1], ['JB', 0]), w('w8', ['R3', 1], ['JB', 0]), w('w9', ['JB', 0], ['GND', 0]),
    ],
    pointNames: { 'JA:0': 'A', 'JB:0': 'B' },
  };
}
export const ejercicio1 = (): Project => { const p = tresRamas('Ejercicio 1 · Dos pilas y una carga', 9, 3, 2, 1, 8, false, 'R3'); p.components.find((c) => c.id === 'R2')!.label = 'R2'; p.components.find((c) => c.id === 'R1')!.label = 'R1'; return p; };
export const ejercicio2 = (): Project => {
  const p = tresRamas('Ejercicio 2 · Tres ramas, una sin pila y otra con la pila invertida', 18, 3, 6, 4, 6, true, 'R2');
  p.components.find((c) => c.id === 'R2')!.label = 'R3'; p.components.find((c) => c.id === 'R1')!.label = 'R1';
  return p;
};
