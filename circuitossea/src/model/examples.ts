import type { Project } from './types';
import { PROJECT_VERSION } from './types';

const c = (id: string, type: string, x: number, y: number, rot: 0 | 90 | 180 | 270, params: Record<string, number | boolean> = {}) =>
  ({ id, type, x, y, rot, params });
const w = (id: string, a: string, at: number, b: string, bt: number) => ({ id, a: { comp: a, term: at }, b: { comp: b, term: bt } });

/** Reto de Millman: dos pilas de 10 V con 2 Ω internos en paralelo sobre una carga de 1 Ω → 5 V y 5 A. */
export const dosPilas: Project = {
  version: PROJECT_VERSION, name: 'Dos pilas en paralelo (Millman)',
  components: [
    c('E1', 'battery', 200, 160, 90, { v: 10, rint: 2 }),
    c('E2', 'battery', 400, 160, 90, { v: 10, rint: 2 }),
    c('RL', 'resistor', 600, 160, 90, { r: 1 }),
    c('J1', 'junction', 200, 80, 0),
    c('J2', 'junction', 400, 80, 0),
    c('J3', 'junction', 600, 80, 0),
    c('G1', 'junction', 200, 240, 0),
    c('G2', 'junction', 400, 240, 0),
    c('G3', 'junction', 600, 240, 0),
    c('GND', 'ground', 400, 280, 0),
  ],
  // Rotación 90°: el terminal 0 (x=-40) queda arriba (y=-40) y el 1 abajo.
  wires: [
    w('w1', 'E1', 0, 'J1', 0), w('w2', 'J1', 0, 'J2', 0), w('w3', 'J2', 0, 'E2', 0),
    w('w4', 'J2', 0, 'J3', 0), w('w5', 'J3', 0, 'RL', 0),
    w('w6', 'E1', 1, 'G1', 0), w('w7', 'G1', 0, 'G2', 0), w('w8', 'G2', 0, 'E2', 1),
    w('w9', 'G2', 0, 'G3', 0), w('w10', 'G3', 0, 'RL', 1), w('w11', 'G2', 0, 'GND', 0),
  ],
};

export const luzSimple: Project = {
  version: PROJECT_VERSION, name: 'Lámpara con interruptor',
  components: [
    c('B1', 'battery', 160, 200, 90, { v: 12, rint: 0.2 }),
    c('S1', 'switch', 300, 120, 0, { closed: true }),
    c('L1', 'lamp', 460, 200, 90, { vn: 12, pn: 12 }),
    c('GND', 'ground', 160, 300, 0),
  ],
  wires: [
    w('a', 'B1', 0, 'S1', 0), w('b', 'S1', 1, 'L1', 0), w('c', 'L1', 1, 'B1', 1), w('d', 'B1', 1, 'GND', 0),
  ],
};

export const divisor: Project = {
  version: PROJECT_VERSION, name: 'Divisor de tensión',
  components: [
    c('B1', 'battery', 160, 200, 90, { v: 9, rint: 0 }),
    c('R1', 'resistor', 320, 100, 0, { r: 1000 }),
    c('R2', 'resistor', 480, 200, 90, { r: 2000 }),
    c('GND', 'ground', 160, 300, 0),
  ],
  wires: [
    w('a', 'B1', 0, 'R1', 0), w('b', 'R1', 1, 'R2', 0), w('c', 'R2', 1, 'B1', 1), w('d', 'B1', 1, 'GND', 0),
  ],
};

export const EXAMPLES = [dosPilas, luzSimple, divisor];
