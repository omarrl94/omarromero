/**
 * Biblioteca de componentes definida por DATOS. Para añadir uno nuevo basta con
 * una entrada aquí (terminales, parámetros y modelo) y su símbolo en ui/symbols.tsx.
 * Coordenadas locales en px; la rejilla es de 20 px y los terminales caen en ella.
 */
import type { Component } from './types';
import { fmt, fmtOhm, fmtSI } from './format';
import { EXTRA } from './library2';

type P = Component['params'];
export type ParamDef = {
  key: string; label: string; unit: string; default: number | boolean; min?: number; max?: number; step?: number;
  bool?: boolean; options?: { label: string; value: number }[];
};

export type Model =
  | { kind: 'R'; value: (p: P) => number }
  | { kind: 'V'; value: (p: P) => number; rint: (p: P) => number }
  | { kind: 'I'; value: (p: P) => number }
  | { kind: 'SW'; closed: (p: P) => boolean }
  | { kind: 'SPDT'; pos: (p: P) => number } // 0 = común↔terminal 1 ; 1 = común↔terminal 2
  | { kind: 'POT'; r: (p: P) => number; pos: (p: P) => number }
  | { kind: 'DIODE'; vf: (p: P) => number; rd: number; vz?: (p: P) => number; imax?: (p: P) => number }
  | { kind: 'FUSE'; rating: (p: P) => number; factor: number }
  | { kind: 'BREAKER'; rating: (p: P) => number; mag: (p: P) => number }
  | { kind: 'ACV'; v: (p: P) => number; f: (p: P) => number; rint: (p: P) => number; three?: 'star' | 'delta' } // three: trifásica (v = tensión de línea)
  | { kind: 'XFMR'; mode: '1ph' | 'tap' | 'auto' | '3ph'; n: (p: P) => number; zcc: (p: P) => { r: number; x: number }; rdc: (p: P) => number; pri?: 'Y' | 'D'; sec?: 'Y' | 'D' }
  | { kind: 'LOAD3'; delta: (p: P) => boolean; z: (p: P, w: number) => { re: number; im: number }[]; rdc: (p: P) => number }
  | { kind: 'GANG'; n: number; closed: (p: P, i: number) => boolean } // n contactos independientes: terminales (2i, 2i+1)
  | { kind: 'RCD'; poles: number; ina: (p: P) => number; rating?: (p: P) => number; mag?: (p: P) => number; closed: (p: P) => boolean } // diferencial (± magnetotérmico): dispara si la suma de corrientes ≠ 0
  | { kind: 'CROSS'; pos: (p: P) => number } // conmutador de cruce (inversor 2×2)
  | { kind: 'SEL'; pos: (p: P) => number } // selector de 3 posiciones: 0 → t1, 1 → ninguno, 2 → t2
  | { kind: 'RELAY'; rc: (p: P) => number; pickup: (p: P) => number; drop: (p: P) => number; nNO: number; nNC: number; inv?: boolean; timer?: { mode: 'on' | 'off' | 'pulse' | 'sd'; t: (p: P) => number } } // bobina (terminales 0-1) + contactos (pares 2+2j)
  | { kind: 'OPEN' } // condensador en CC permanente
  | { kind: 'GND' }
  | { kind: 'JUNCTION' };

export type Category = 'Fuentes' | 'Pasivos' | 'Conexión' | 'Tomas' | 'Control' | 'Transformadores' | 'Sensores' | 'Semiconductores' | 'Maniobra' | 'Protecciones' | 'Receptores' | 'Referencia';

export interface Def {
  type: string;
  name: string;
  category: Category;
  terminals: { x: number; y: number; name: string }[];
  params: ParamDef[];
  model: Model;
  tag?: (p: P) => string;
  w: number; h: number;
  /** 'toggle': un clic conmuta el parámetro; 'hold': activo mientras se mantiene pulsado */
  interactive?: { mode: 'toggle' | 'hold'; key: string; cycle?: number };
  /** Definiciones de ayuda (breve) */
  help?: string;
  /** Símbolo que se dibuja (y aparato de la vista real): por defecto, el propio tipo */
  sym?: string;
  /** Marca corta sobre el símbolo (p. ej. «NH», «PV») */
  mark?: string;
  /** Impedancia en CA (Ω) a la pulsación ω; si no existe, se usa el modelo de CC con parte imaginaria 0 */
  acz?: (p: P, w: number) => { re: number; im: number };
}

const n = (k: string) => (p: P) => Number(p[k]);
const two = [{ x: -40, y: 0, name: '1' }, { x: 40, y: 0, name: '2' }];
const LED_VF = [1.9, 2.1, 3.0, 2.0];
const R_PX = [
  { label: 'Rojo', value: 0 }, { label: 'Verde', value: 1 }, { label: 'Azul', value: 2 }, { label: 'Amarillo', value: 3 },
];

export const LIBRARY: Def[] = [
  ...BASE(),
  ...EXTRA,
];
export const symOf = (type: string): string => defOf(type).sym ?? type;
/** Siguiente valor de un parámetro que se conmuta con clic. */
export const nextToggle = (d: Def, cur: number | boolean | string): number | boolean => (typeof cur === 'boolean' ? !cur : d.interactive?.cycle ? (Number(cur) + 1) % d.interactive.cycle : Number(cur) < 0.5 ? 1 : 0);

function BASE(): Def[] { return [
  // ───── Fuentes
  { type: 'battery', name: 'Pila / batería', category: 'Fuentes', w: 80, h: 40,
    terminals: [{ x: -40, y: 0, name: '+' }, { x: 40, y: 0, name: '−' }],
    params: [
      { key: 'v', label: 'Tensión', unit: 'V', default: 10, step: 0.5 },
      { key: 'rint', label: 'Resist. interna', unit: 'Ω', default: 0, min: 0, step: 0.1 },
      { key: 'imax', label: 'Corriente máxima', unit: 'A', default: 30, min: 0.1, step: 1 },
    ],
    model: { kind: 'V', value: n('v'), rint: n('rint') }, tag: (p) => `${fmt(+p.v)} V`,
    help: 'Fuente de tensión continua con resistencia interna opcional.' },
  { type: 'acsource', name: 'Fuente de CA monofásica', category: 'Fuentes', w: 80, h: 40,
    terminals: [{ x: -40, y: 0, name: 'L' }, { x: 40, y: 0, name: 'N' }],
    params: [
      { key: 'v', label: 'Tensión eficaz', unit: 'V', default: 230, min: 0, step: 1 },
      { key: 'f', label: 'Frecuencia', unit: 'Hz', default: 50, min: 1, step: 1 },
      { key: 'rint', label: 'Impedancia de red', unit: 'Ω', default: 0, min: 0, step: 0.01 },
      { key: 'imax', label: 'Corriente máxima', unit: 'A', default: 100, min: 1, step: 5 },
    ],
    model: { kind: 'ACV', v: n('v'), f: n('f'), rint: n('rint') }, tag: (p) => `${fmt(+p.v)} V · ${fmt(+p.f)} Hz`,
    help: 'Fuente senoidal. El circuito se resuelve en régimen permanente con fasores (valores eficaces).' },
  { type: 'isource', name: 'Fuente de corriente', category: 'Fuentes', w: 80, h: 40,
    terminals: [{ x: -40, y: 0, name: 'entra' }, { x: 40, y: 0, name: 'sale' }],
    params: [{ key: 'i', label: 'Corriente', unit: 'A', default: 0.1, step: 0.01 }],
    model: { kind: 'I', value: n('i') }, tag: (p) => fmtSI(+p.i, 'A') },

  // ───── Pasivos
  { type: 'resistor', name: 'Resistencia', category: 'Pasivos', w: 80, h: 30, terminals: two,
    params: [{ key: 'r', label: 'Resistencia', unit: 'Ω', default: 100, min: 0, step: 1 }, { key: 'pmax', label: 'Potencia máx.', unit: 'W', default: 0.5, min: 0.01 }],
    model: { kind: 'R', value: n('r') }, tag: (p) => fmtOhm(+p.r) },
  { type: 'pot', name: 'Potenciómetro', category: 'Pasivos', w: 80, h: 50,
    terminals: [{ x: -40, y: 0, name: 'A' }, { x: 40, y: 0, name: 'B' }, { x: 0, y: 20, name: 'cursor' }],
    params: [{ key: 'r', label: 'Resistencia total', unit: 'Ω', default: 1000, min: 1 }, { key: 'pos', label: 'Posición cursor (0–1)', unit: '', default: 0.5, min: 0, max: 1, step: 0.05 }],
    model: { kind: 'POT', r: n('r'), pos: n('pos') }, tag: (p) => `${fmtOhm(+p.r)} · ${Math.round(+p.pos * 100)} %` },
  { type: 'capacitor', name: 'Condensador', category: 'Pasivos', w: 80, h: 40, terminals: two,
    params: [{ key: 'c', label: 'Capacidad', unit: 'µF', default: 100, min: 0 }],
    model: { kind: 'OPEN' }, acz: (p, w) => ({ re: 0, im: -1 / (w * Math.max(1e-12, Number(p.c) * 1e-6)) }), tag: (p) => `${fmt(+p.c)} µF`,
    help: 'En CC permanente es un circuito abierto. En CA tiene reactancia Xc = 1/(2πfC). Su carga/descarga (transitorio) llega en la fase 3b.' },
  { type: 'inductor', name: 'Bobina', category: 'Pasivos', w: 80, h: 30, terminals: two,
    params: [{ key: 'l', label: 'Inductancia', unit: 'mH', default: 100, min: 0 }, { key: 'r', label: 'Resist. del hilo', unit: 'Ω', default: 1, min: 0.001 }],
    model: { kind: 'R', value: n('r') }, acz: (p, w) => ({ re: Number(p.r), im: w * Number(p.l) * 1e-3 }), tag: (p) => `${fmt(+p.l)} mH`,
    help: 'En CC permanente solo queda la resistencia del hilo. En CA tiene reactancia XL = 2πfL.' },

  // ───── Sensores
  { type: 'ntc', name: 'NTC (termistor)', category: 'Sensores', w: 80, h: 30, terminals: two,
    params: [{ key: 'r25', label: 'R a 25 °C', unit: 'Ω', default: 10000, min: 1 }, { key: 'b', label: 'Constante B', unit: 'K', default: 3950 }, { key: 't', label: 'Temperatura', unit: '°C', default: 25, min: -40, max: 150 }],
    model: { kind: 'R', value: (p) => Number(p.r25) * Math.exp(Number(p.b) * (1 / (273.15 + Number(p.t)) - 1 / 298.15)) },
    tag: (p) => `${fmt(+p.t)} °C` },
  { type: 'ptc', name: 'PTC (termistor)', category: 'Sensores', w: 80, h: 30, terminals: two,
    params: [{ key: 'r25', label: 'R a 25 °C', unit: 'Ω', default: 100, min: 1 }, { key: 't', label: 'Temperatura', unit: '°C', default: 25, min: -40, max: 150 }],
    model: { kind: 'R', value: (p) => Number(p.r25) * Math.exp(0.02 * (Number(p.t) - 25)) },
    tag: (p) => `${fmt(+p.t)} °C`, help: 'Modelo simplificado exponencial R = R25·e^(0,02·(T−25)).' },
  { type: 'ldr', name: 'LDR (fotorresistencia)', category: 'Sensores', w: 80, h: 40, terminals: two,
    params: [{ key: 'r10', label: 'R a 10 lux', unit: 'Ω', default: 10000, min: 1 }, { key: 'lux', label: 'Iluminación', unit: 'lux', default: 100, min: 0.1 }],
    model: { kind: 'R', value: (p) => Number(p.r10) * Math.pow(10 / Math.max(0.1, Number(p.lux)), 0.7) },
    tag: (p) => `${fmt(+p.lux)} lux`, help: 'Modelo simplificado R = R10·(10/lux)^0,7.' },

  // ───── Semiconductores
  { type: 'diode', name: 'Diodo', category: 'Semiconductores', w: 80, h: 30,
    terminals: [{ x: -40, y: 0, name: 'A' }, { x: 40, y: 0, name: 'K' }],
    params: [{ key: 'vf', label: 'Tensión umbral', unit: 'V', default: 0.7, min: 0, step: 0.05 }],
    model: { kind: 'DIODE', vf: n('vf'), rd: 0.05 }, tag: (p) => `Vf ${fmt(+p.vf)} V`,
    help: 'Modelo lineal a tramos: umbral Vf + resistencia dinámica de 0,05 Ω.' },
  { type: 'led', name: 'LED', category: 'Semiconductores', w: 80, h: 40,
    terminals: [{ x: -40, y: 0, name: 'A' }, { x: 40, y: 0, name: 'K' }],
    params: [{ key: 'color', label: 'Color', unit: '', default: 0, options: R_PX }, { key: 'imax', label: 'Corriente máx.', unit: 'mA', default: 30, min: 1 }],
    model: { kind: 'DIODE', vf: (p) => LED_VF[Number(p.color)] ?? 2, rd: 5, imax: (p) => Number(p.imax) / 1000 },
    tag: (p) => ['Rojo', 'Verde', 'Azul', 'Amarillo'][Number(p.color)] ?? '',
    help: 'Se funde si supera su corriente máxima: ponle siempre una resistencia limitadora.' },
  { type: 'zener', name: 'Diodo Zener', category: 'Semiconductores', w: 80, h: 30,
    terminals: [{ x: -40, y: 0, name: 'A' }, { x: 40, y: 0, name: 'K' }],
    params: [{ key: 'vz', label: 'Tensión Zener', unit: 'V', default: 5.1, min: 1, step: 0.1 }],
    model: { kind: 'DIODE', vf: () => 0.7, rd: 0.05, vz: n('vz') }, tag: (p) => `Vz ${fmt(+p.vz)} V` },

  // ───── Maniobra
  { type: 'switch', name: 'Interruptor', category: 'Maniobra', w: 80, h: 40, terminals: two,
    params: [{ key: 'closed', label: 'Cerrado', unit: '', default: true, bool: true }],
    model: { kind: 'SW', closed: (p) => Boolean(p.closed) }, interactive: { mode: 'toggle', key: 'closed' } },
  { type: 'pushNO', name: 'Pulsador NA', category: 'Maniobra', w: 80, h: 40, terminals: two,
    params: [{ key: 'pressed', label: 'Pulsado', unit: '', default: false, bool: true }],
    model: { kind: 'SW', closed: (p) => Boolean(p.pressed) }, interactive: { mode: 'hold', key: 'pressed' },
    help: 'Normalmente abierto: conduce mientras lo mantienes pulsado.' },
  { type: 'pushNC', name: 'Pulsador NC', category: 'Maniobra', w: 80, h: 40, terminals: two,
    params: [{ key: 'pressed', label: 'Pulsado', unit: '', default: false, bool: true }],
    model: { kind: 'SW', closed: (p) => !p.pressed }, interactive: { mode: 'hold', key: 'pressed' },
    help: 'Normalmente cerrado: se abre mientras lo mantienes pulsado.' },
  { type: 'spdt', name: 'Conmutador', category: 'Maniobra', w: 80, h: 60,
    terminals: [{ x: -40, y: 0, name: 'C' }, { x: 40, y: -20, name: '1' }, { x: 40, y: 20, name: '2' }],
    params: [{ key: 'pos', label: 'Posición (0 = arriba, 1 = abajo)', unit: '', default: 0, min: 0, max: 1, step: 1 }],
    model: { kind: 'SPDT', pos: n('pos') }, interactive: { mode: 'toggle', key: 'pos' },
    help: 'Dos conmutadores en serie permiten encender una luz desde dos sitios.' },

  // ───── Protecciones
  { type: 'fuse', name: 'Fusible', category: 'Protecciones', w: 80, h: 30, terminals: two,
    params: [{ key: 'in', label: 'Corriente nominal', unit: 'A', default: 2, min: 0.1, step: 0.5 }],
    model: { kind: 'FUSE', rating: n('in'), factor: 1.6 }, tag: (p) => `${fmt(+p.in)} A`,
    help: 'Se funde al superar 1,6·In (simplificación: la curva tiempo-corriente real llega en la fase 6).' },
  { type: 'breaker', name: 'Magnetotérmico', category: 'Protecciones', w: 80, h: 40, terminals: two,
    params: [
      { key: 'in', label: 'Calibre', unit: 'A', default: 10, options: [6, 10, 16, 20, 25, 32, 40, 50, 63].map((v) => ({ label: `${v} A`, value: v })) },
      { key: 'curve', label: 'Curva', unit: '', default: 10, options: [{ label: 'B', value: 5 }, { label: 'C', value: 10 }, { label: 'D', value: 20 }] },
    ],
    model: { kind: 'BREAKER', rating: n('in'), mag: n('curve') },
    tag: (p) => `${p.curve === 5 ? 'B' : p.curve === 20 ? 'D' : 'C'}${p.in}`,
    help: 'Dispara de forma instantánea al superar el umbral magnético (B 5·In, C 10·In, D 20·In). La zona térmica de sobrecarga se simula en la fase 6.' },

  // ───── Receptores
  { type: 'lamp', name: 'Lámpara', category: 'Receptores', w: 80, h: 40, terminals: two,
    params: [{ key: 'vn', label: 'Tensión nominal', unit: 'V', default: 12, min: 0.1 }, { key: 'pn', label: 'Potencia nominal', unit: 'W', default: 12, min: 0.1 }],
    model: { kind: 'R', value: (p) => Number(p.vn) ** 2 / Number(p.pn) }, tag: (p) => `${fmt(+p.vn)} V · ${fmt(+p.pn)} W`,
    help: 'Resistencia lineal R = Vn²/Pn. Se funde si supera 1,5 veces su potencia nominal.' },
  { type: 'heater', name: 'Resistencia calefactora', category: 'Receptores', w: 80, h: 40, terminals: two,
    params: [{ key: 'vn', label: 'Tensión nominal', unit: 'V', default: 12, min: 0.1 }, { key: 'pn', label: 'Potencia nominal', unit: 'W', default: 24, min: 0.1 }],
    model: { kind: 'R', value: (p) => Number(p.vn) ** 2 / Number(p.pn) }, tag: (p) => `${fmt(+p.pn)} W` },
  { type: 'buzzer', name: 'Zumbador', category: 'Receptores', w: 80, h: 40, terminals: two,
    params: [{ key: 'vn', label: 'Tensión nominal', unit: 'V', default: 12, min: 0.1 }, { key: 'pn', label: 'Potencia nominal', unit: 'W', default: 0.5, min: 0.01 }],
    model: { kind: 'R', value: (p) => Number(p.vn) ** 2 / Number(p.pn) }, tag: (p) => `${fmt(+p.vn)} V` },
  { type: 'motor', name: 'Motor de CC', category: 'Receptores', w: 80, h: 50, terminals: two,
    params: [{ key: 'vn', label: 'Tensión nominal', unit: 'V', default: 12, min: 0.1 }, { key: 'r', label: 'Resist. del inducido', unit: 'Ω', default: 6, min: 0.01 }],
    model: { kind: 'R', value: n('r') }, tag: (p) => `${fmt(+p.vn)} V`,
    help: 'Modelo simplificado: resistencia del inducido; la velocidad mostrada es proporcional a V/Vn.' },

  // ───── Referencia
  { type: 'ground', name: 'Masa (0 V)', category: 'Referencia', w: 40, h: 40, terminals: [{ x: 0, y: -20, name: '0' }], params: [], model: { kind: 'GND' } },
  { type: 'junction', name: 'Empalme', category: 'Referencia', w: 20, h: 20, terminals: [{ x: 0, y: 0, name: 'J' }], params: [], model: { kind: 'JUNCTION' } },
]; }

export const defOf = (type: string): Def => {
  const d = LIBRARY.find((x) => x.type === type);
  if (!d) throw new Error(`Componente desconocido: ${type}`);
  return d;
};
export const defaultParams = (type: string): P => Object.fromEntries(defOf(type).params.map((p) => [p.key, p.default]));

export { fmt, fmtOhm, fmtSI } from './format';
