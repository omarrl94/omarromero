import { ejercicio1, ejercicio2 } from './ejercicios';
import { defaultParams } from './library';
import type { Project } from './types';
import { PROJECT_VERSION } from './types';

const c = (id: string, type: string, x: number, y: number, rot: 0 | 90 | 180 | 270, params: Record<string, number | boolean> = {}, label?: string) =>
  ({ id, type, x, y, rot, params: { ...defaultParams(type), ...params }, ...(label ? { label } : {}) });
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

export const marchaParo: Project = {
  version: PROJECT_VERSION, name: 'Marcha-paro con contactor y autorretención',
  components: [
    c('A1', 'red', 100, 300, 90, { v: 230, f: 50, rint: 0.1 }, 'Red 230 V'),
    c('S0', 'pushNC', 260, 100, 0, {}, 'S0 paro'),
    c('S1', 'pushNO', 420, 60, 0, {}, 'S1 marcha'),
    c('KM', 'contactor', 640, 280, 0, { vn: 230, pn: 8 }, 'KM1'),
    c('L1', 'lamp', 900, 300, 90, { vn: 230, pn: 100 }, 'Motor (lámpara)'),
    c('GND', 'ground', 100, 440, 0),
  ],
  wires: [
    w('a', 'A1', 0, 'S0', 0), w('b', 'S0', 1, 'S1', 0), w('c', 'S1', 1, 'KM', 0), w('d', 'S0', 1, 'KM', 8), w('e', 'KM', 9, 'KM', 0),
    w('f', 'KM', 1, 'A1', 1), w('g', 'A1', 1, 'GND', 0), w('h', 'A1', 0, 'KM', 2), w('i', 'KM', 3, 'L1', 0), w('j', 'L1', 1, 'A1', 1),
  ],
};

export const trifasica: Project = {
  version: PROJECT_VERSION, name: 'Trifásica: motor en triángulo y carga en estrella',
  components: [
    c('S', 'red3', 140, 260, 180, { v: 400, f: 50, rint: 0.1 }, 'Red 400/230 V'),
    c('M', 'motor3', 520, 160, 0, { conn: 1 }, 'M1'),
    c('Z', 'carga3y', 520, 380, 0, { r: 100 }, 'Carga Y'),
    c('GND', 'ground', 140, 440, 0),
  ],
  wires: [w('1', 'S', 0, 'M', 0), w('2', 'S', 1, 'M', 1), w('3', 'S', 2, 'M', 2), w('4', 'S', 0, 'Z', 0), w('5', 'S', 1, 'Z', 1), w('6', 'S', 2, 'Z', 2), w('7', 'S', 3, 'Z', 3), w('8', 'S', 3, 'GND', 0)],
};

export const diferencial: Project = {
  version: PROJECT_VERSION, name: 'Diferencial: una fuga a tierra lo hace disparar',
  components: [
    c('A1', 'red', 120, 260, 90, { v: 230, f: 50, rint: 0.2 }, 'Red 230 V'),
    c('D', 'rcd2', 320, 240, 0, { ina: 30 }, 'Q1 30 mA'),
    c('L1', 'heater', 560, 260, 90, { vn: 230, pn: 1000 }, 'Receptor'),
    c('F', 'resistor', 560, 420, 90, { r: 4000, pmax: 100 }, 'Fuga a tierra'),
    c('GND', 'ground', 120, 420, 0),
  ],
  wires: [w('1', 'A1', 0, 'D', 0), w('2', 'D', 1, 'L1', 0), w('3', 'L1', 1, 'D', 3), w('4', 'D', 2, 'A1', 1), w('5', 'D', 1, 'F', 0), w('6', 'F', 1, 'GND', 0), w('7', 'A1', 1, 'GND', 0)],
};

export const fuenteRectificada: Project = {
  version: PROJECT_VERSION, name: 'Electrónica: fuente rectificada con filtro (puente + condensador)',
  components: [
    c('A1', 'acsource', 120, 260, 90, { v: 12, f: 50, rint: 0.2 }, 'Transformador 12 V'),
    c('B1', 'bridge1', 340, 240, 0, {}, 'Puente'),
    c('C1', 'capacitor', 540, 280, 90, { c: 2200 }, 'C filtro'),
    c('R1', 'resistor', 680, 280, 90, { r: 100, pmax: 5 }, 'Carga'),
    c('GND', 'ground', 340, 420, 0),
  ],
  wires: [w('1', 'A1', 0, 'B1', 0), w('2', 'A1', 1, 'B1', 1), w('3', 'B1', 2, 'C1', 0), w('4', 'B1', 2, 'R1', 0), w('5', 'C1', 1, 'GND', 0), w('6', 'R1', 1, 'GND', 0), w('7', 'B1', 3, 'GND', 0)],
};

export const astable555: Project = {
  version: PROJECT_VERSION, name: 'Electrónica: 555 astable con LED parpadeante',
  components: [
    c('V1', 'dcsource', 100, 260, 90, { v: 5 }, '5 V'),
    c('U1', 'ne555', 400, 260, 0, {}, '555'),
    c('R1', 'resistor', 280, 100, 90, { r: 4700, pmax: 1 }, 'R1'),
    c('R2', 'resistor', 280, 200, 90, { r: 47000, pmax: 1 }, 'R2'),
    c('C1', 'capacitor', 200, 400, 90, { c: 10 }, 'C'),
    c('R3', 'resistor', 640, 220, 0, { r: 330, pmax: 1 }, 'R3'),
    c('D1', 'led', 760, 280, 90, { color: 1 }, 'LED'),
    c('GND', 'ground', 400, 460, 0),
  ],
  wires: [w('1', 'V1', 0, 'U1', 0), w('2', 'V1', 0, 'U1', 4), w('3', 'V1', 0, 'R1', 0), w('4', 'R1', 1, 'U1', 6), w('5', 'R2', 0, 'U1', 6), w('6', 'R2', 1, 'U1', 3), w('7', 'U1', 3, 'U1', 2), w('8', 'U1', 3, 'C1', 0), w('9', 'C1', 1, 'GND', 0), w('10', 'U1', 1, 'GND', 0), w('11', 'V1', 1, 'GND', 0), w('12', 'U1', 5, 'R3', 0), w('13', 'R3', 1, 'D1', 0), w('14', 'D1', 1, 'GND', 0)],
};

export const opampInversor: Project = {
  version: PROJECT_VERSION, name: 'Electrónica: amplificador operacional inversor (×−10)',
  components: [
    c('G1', 'fgen', 120, 260, 90, { wf: 0, f: 1000, amp: 0.5, off: 0, rint: 0 }, 'Señal 1 kHz'),
    c('R1', 'resistor', 300, 160, 0, { r: 1000, pmax: 1 }, 'R1 1 kΩ'),
    c('R2', 'resistor', 480, 100, 0, { r: 10000, pmax: 1 }, 'Rf 10 kΩ'),
    c('U1', 'opamp', 480, 240, 0, { sup: 1 }, 'U1'),
    c('GND', 'ground', 300, 420, 0),
  ],
  wires: [w('1', 'G1', 0, 'R1', 0), w('2', 'R1', 1, 'U1', 1), w('3', 'R1', 1, 'R2', 0), w('4', 'R2', 1, 'U1', 2), w('5', 'U1', 0, 'GND', 0), w('6', 'G1', 1, 'GND', 0)],
};

export const EXAMPLES = [fuenteRectificada, astable555, opampInversor, trifasica, diferencial, marchaParo, ejercicio1(), ejercicio2(), dosPilas, luzSimple, divisor, ledResistencia, fusible, escalera, motorPulsador, potenciometro, rlcSerie, factorPotencia, lampara230];
