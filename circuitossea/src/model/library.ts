/**
 * Biblioteca de componentes definida por DATOS. Para añadir uno nuevo basta con
 * una entrada aquí (terminales, parámetros, modelo eléctrico y símbolo).
 * Coordenadas locales en px; la rejilla es de 20 px y los terminales caen en ella.
 */
import type { Component } from './types';

export type ParamDef = {
  key: string; label: string; unit: string; default: number | boolean; min?: number; step?: number; bool?: boolean;
};

export type Model =
  | { kind: 'R'; value: (p: Component['params']) => number }
  | { kind: 'V'; value: (p: Component['params']) => number; rint: (p: Component['params']) => number }
  | { kind: 'I'; value: (p: Component['params']) => number }
  | { kind: 'SW' }
  | { kind: 'GND' }
  | { kind: 'JUNCTION' };

export interface Def {
  type: string;
  name: string;
  category: 'Fuentes' | 'Pasivos' | 'Maniobra' | 'Referencia';
  terminals: { x: number; y: number; name: string }[];
  params: ParamDef[];
  model: Model;
  /** Etiqueta corta de valor para mostrar bajo el símbolo */
  tag?: (p: Component['params']) => string;
  /** Caja de selección (local) */
  w: number; h: number;
}

const num = (k: string) => (p: Component['params']) => Number(p[k]);

export const LIBRARY: Def[] = [
  {
    type: 'battery', name: 'Pila / batería', category: 'Fuentes', w: 80, h: 40,
    terminals: [{ x: -40, y: 0, name: '+' }, { x: 40, y: 0, name: '−' }],
    params: [
      { key: 'v', label: 'Tensión', unit: 'V', default: 10, step: 0.5 },
      { key: 'rint', label: 'Resist. interna', unit: 'Ω', default: 0, min: 0, step: 0.1 },
    ],
    model: { kind: 'V', value: num('v'), rint: num('rint') },
    tag: (p) => `${fmt(Number(p.v))} V`,
  },
  {
    type: 'isource', name: 'Fuente de corriente', category: 'Fuentes', w: 80, h: 40,
    terminals: [{ x: -40, y: 0, name: 'entra' }, { x: 40, y: 0, name: 'sale' }],
    params: [{ key: 'i', label: 'Corriente', unit: 'A', default: 1, step: 0.1 }],
    model: { kind: 'I', value: num('i') },
    tag: (p) => `${fmt(Number(p.i))} A`,
  },
  {
    type: 'resistor', name: 'Resistencia', category: 'Pasivos', w: 80, h: 30,
    terminals: [{ x: -40, y: 0, name: '1' }, { x: 40, y: 0, name: '2' }],
    params: [{ key: 'r', label: 'Resistencia', unit: 'Ω', default: 100, min: 0, step: 1 }],
    model: { kind: 'R', value: num('r') },
    tag: (p) => `${fmtOhm(Number(p.r))}`,
  },
  {
    type: 'lamp', name: 'Lámpara', category: 'Pasivos', w: 80, h: 40,
    terminals: [{ x: -40, y: 0, name: '1' }, { x: 40, y: 0, name: '2' }],
    params: [
      { key: 'vn', label: 'Tensión nominal', unit: 'V', default: 12, min: 0.1 },
      { key: 'pn', label: 'Potencia nominal', unit: 'W', default: 12, min: 0.1 },
    ],
    // Modelo lineal: R = Vn²/Pn (la R real de un filamento varía con la temperatura; ver ayuda)
    model: { kind: 'R', value: (p) => Number(p.vn) ** 2 / Number(p.pn) },
    tag: (p) => `${fmt(Number(p.vn))} V · ${fmt(Number(p.pn))} W`,
  },
  {
    type: 'switch', name: 'Interruptor', category: 'Maniobra', w: 80, h: 30,
    terminals: [{ x: -40, y: 0, name: '1' }, { x: 40, y: 0, name: '2' }],
    params: [{ key: 'closed', label: 'Cerrado', unit: '', default: true, bool: true }],
    model: { kind: 'SW' },
  },
  {
    type: 'ground', name: 'Masa (0 V)', category: 'Referencia', w: 40, h: 40,
    terminals: [{ x: 0, y: -20, name: '0' }],
    params: [],
    model: { kind: 'GND' },
  },
  {
    type: 'junction', name: 'Empalme', category: 'Referencia', w: 20, h: 20,
    terminals: [{ x: 0, y: 0, name: 'J' }],
    params: [],
    model: { kind: 'JUNCTION' },
  },
];

export const defOf = (type: string): Def => {
  const d = LIBRARY.find((x) => x.type === type);
  if (!d) throw new Error(`Componente desconocido: ${type}`);
  return d;
};

export const defaultParams = (type: string): Component['params'] =>
  Object.fromEntries(defOf(type).params.map((p) => [p.key, p.default]));

/** Formato español: coma decimal y 3 cifras significativas. */
export function fmt(v: number, digits = 3): string {
  if (!isFinite(v)) return '—';
  if (v === 0) return '0';
  return Number(v.toPrecision(digits)).toString().replace('.', ',');
}
export function fmtOhm(r: number): string {
  if (r >= 1e6) return `${fmt(r / 1e6)} MΩ`;
  if (r >= 1e3) return `${fmt(r / 1e3)} kΩ`;
  return `${fmt(r)} Ω`;
}
/** Prefijos SI para magnitudes (mV, mA...). */
export function fmtSI(v: number, unit: string): string {
  const a = Math.abs(v);
  if (a === 0) return `0 ${unit}`;
  if (a >= 1e3) return `${fmt(v / 1e3)} k${unit}`;
  if (a >= 1) return `${fmt(v)} ${unit}`;
  if (a >= 1e-3) return `${fmt(v * 1e3)} m${unit}`;
  return `${fmt(v * 1e6)} µ${unit}`;
}
