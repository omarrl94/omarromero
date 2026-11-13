import { ejercicio1, ejercicio2 } from './ejercicios';
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

export const ledResistencia: Project = {
  version: PROJECT_VERSION, name: 'LED con resistencia limitadora',
  components: [
    c('B1', 'battery', 160, 200, 90, { v: 9, rint: 0 }),
    c('R1', 'resistor', 300, 160, 0, { r: 330 }),
    c('D1', 'led', 500, 200, 90, { color: 0, imax: 30 }),
    c('GND', 'ground', 160, 320, 0),
  ],
  wires: [w('a', 'B1', 0, 'R1', 0), w('b', 'R1', 1, 'D1', 0), w('c', 'D1', 1, 'B1', 1), w('d', 'B1', 1, 'GND', 0)],
};

/** Pulsa el pulsador (cortocircuito sobre la lámpara) y mira qué pasa con el fusible. */
export const fusible: Project = {
  version: PROJECT_VERSION, name: 'Fusible: pulsa y provoca el cortocircuito',
  components: [
    c('B1', 'battery', 160, 200, 90, { v: 12, rint: 0.1 }),
    c('F1', 'fuse', 300, 160, 0, { in: 2 }),
    c('P1', 'pushNO', 400, 200, 90, {}),
    c('L1', 'lamp', 500, 200, 90, { vn: 12, pn: 12 }),
    c('GND', 'ground', 160, 320, 0),
  ],
  wires: [
    w('a', 'B1', 0, 'F1', 0), w('b', 'F1', 1, 'P1', 0), w('c', 'P1', 0, 'L1', 0),
    w('d', 'L1', 1, 'P1', 1), w('e', 'P1', 1, 'B1', 1), w('f', 'B1', 1, 'GND', 0),
  ],
};

export const escalera: Project = {
  version: PROJECT_VERSION, name: 'Conmutada: una luz desde dos sitios',
  components: [
    c('B1', 'battery', 120, 200, 90, { v: 12, rint: 0.1 }),
    c('S1', 'spdt', 200, 160, 0, { pos: 0 }),
    c('S2', 'spdt', 400, 160, 180, { pos: 1 }),
    c('L1', 'lamp', 540, 200, 90, { vn: 12, pn: 12 }),
    c('GND', 'ground', 120, 320, 0),
  ],
  wires: [
    w('a', 'B1', 0, 'S1', 0), w('b', 'S1', 1, 'S2', 2), w('c', 'S1', 2, 'S2', 1),
    w('d', 'S2', 0, 'L1', 0), w('e', 'L1', 1, 'B1', 1), w('f', 'B1', 1, 'GND', 0),
  ],
};

export const motorPulsador: Project = {
  version: PROJECT_VERSION, name: 'Motor de CC con pulsador de marcha',
  components: [
    c('B1', 'battery', 160, 200, 90, { v: 12, rint: 0.3 }),
    c('P1', 'pushNO', 300, 160, 0, {}),
    c('M1', 'motor', 500, 200, 90, { vn: 12, r: 6 }),
    c('GND', 'ground', 160, 320, 0),
  ],
  wires: [w('a', 'B1', 0, 'P1', 0), w('b', 'P1', 1, 'M1', 0), w('c', 'M1', 1, 'B1', 1), w('d', 'B1', 1, 'GND', 0)],
};

export const potenciometro: Project = {
  version: PROJECT_VERSION, name: 'Potenciómetro: regulador de brillo',
  components: [
    c('B1', 'battery', 160, 200, 90, { v: 12, rint: 0 }),
    c('P1', 'pot', 300, 200, 270, { r: 100, pos: 0.7 }),
    c('L1', 'lamp', 440, 240, 90, { vn: 12, pn: 5 }),
    c('GND', 'ground', 160, 340, 0),
  ],
  wires: [
    w('a', 'B1', 0, 'P1', 1), w('b', 'P1', 0, 'B1', 1), w('c', 'P1', 2, 'L1', 0),
    w('d', 'L1', 1, 'B1', 1), w('e', 'B1', 1, 'GND', 0),
  ],
};

/** Verás el desfase entre tensión e intensidad con el osciloscopio (CH1 = sonda en A:L, CH2 = pinza en R1). */
export const rlcSerie: Project = {
  version: PROJECT_VERSION, name: 'CA: circuito RLC serie (230 V, 50 Hz)',
  components: [
    c('A1', 'acsource', 160, 200, 90, { v: 230, f: 50, rint: 0 }),
    c('R1', 'resistor', 300, 160, 0, { r: 100, pmax: 1000 }),
    c('L1', 'inductor', 420, 160, 0, { l: 300, r: 0.5 }),
    c('C1', 'capacitor', 560, 200, 90, { c: 47 }),
    c('GND', 'ground', 160, 320, 0),
  ],
  wires: [w('a', 'A1', 0, 'R1', 0), w('b', 'R1', 1, 'L1', 0), w('c', 'L1', 1, 'C1', 0), w('d', 'C1', 1, 'A1', 1), w('e', 'A1', 1, 'GND', 0)],
};

/** Carga inductiva (cos φ ≈ 0,6). Cambia la capacidad de C1 (≈ 40 µF) y observa cos φ y la corriente de línea en el vatímetro. */
export const factorPotencia: Project = {
  version: PROJECT_VERSION, name: 'CA: corrección del factor de potencia',
  components: [
    c('A1', 'acsource', 160, 200, 90, { v: 230, f: 50, rint: 0 }),
    c('C1', 'capacitor', 240, 200, 90, { c: 40 }),
    c('R1', 'resistor', 340, 160, 0, { r: 30, pmax: 2000 }),
    c('L1', 'inductor', 460, 160, 0, { l: 127, r: 0.1 }),
    c('J1', 'junction', 540, 160, 0), c('J2', 'junction', 540, 240, 0),
    c('GND', 'ground', 160, 320, 0),
  ],
  wires: [
    w('a', 'A1', 0, 'C1', 0), w('b', 'C1', 0, 'R1', 0), w('c', 'R1', 1, 'L1', 0), w('d', 'L1', 1, 'J1', 0),
    w('e', 'J1', 0, 'J2', 0), w('f', 'J2', 0, 'C1', 1), w('g', 'C1', 1, 'A1', 1), w('h', 'A1', 1, 'GND', 0),
  ],
};

export const lampara230: Project = {
  version: PROJECT_VERSION, name: 'CA: lámpara de 230 V / 60 W con interruptor',
  components: [
    c('A1', 'acsource', 160, 200, 90, { v: 230, f: 50, rint: 0 }),
    c('S1', 'switch', 320, 160, 0, { closed: true }),
    c('L1', 'lamp', 500, 200, 90, { vn: 230, pn: 60 }),
    c('GND', 'ground', 160, 320, 0),
  ],
  wires: [w('a', 'A1', 0, 'S1', 0), w('b', 'S1', 1, 'L1', 0), w('c', 'L1', 1, 'A1', 1), w('d', 'A1', 1, 'GND', 0)],
};

export const EXAMPLES = [ejercicio1(), ejercicio2(), dosPilas, luzSimple, divisor, ledResistencia, fusible, escalera, motorPulsador, potenciometro, rlcSerie, factorPotencia, lampara230];
