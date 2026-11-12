/**
 * «El boletín»: valores de las verificaciones reglamentarias antes de entregar la instalación.
 * IMPORTANTE: estos valores son los que el juego usa para decidir si una medida es apta. Están marcados
 * `verified: false` como la tabla de Iz del resto de la aplicación: contrástalos con el texto oficial del REBT
 * y de las normas UNE antes de usarlos en un examen. Se concentran aquí para poder corregirlos en un solo sitio.
 */
import type { Source } from '../data/rebt';

export const RULES = {
  /** Resistencia de aislamiento (ITC-BT-19 §2.9): circuitos hasta 500 V → ensayo a 500 V, mínimo 0,5 MΩ. */
  iso: { testV: 500, minMOhm: 0.5, instrumentMaxMOhm: 500 },
  /** Continuidad del conductor de protección: umbral de diseño del juego (el REBT pide continuidad, no fija este valor). */
  pe: { maxOhm: 2, leadsOhm: 0.3 },
  /** Resistencia de tierra: Ra·IΔn ≤ tensión de contacto límite (50 V; 24 V en local húmedo, no usado aquí). */
  earth: { vContact: 50, minAuxDistance: 20 },
  /** Diferencial de 30 mA: debe disparar entre 0,5 y 1 IΔn, en ≤ 300 ms a IΔn y ≤ 40 ms a 5·IΔn. */
  rcd: { inmA: 30, minFrac: 0.5, maxT1: 300, maxT5: 40 },
};
export const maxEarthOhm = () => RULES.earth.vContact / (RULES.rcd.inmA / 1000);

export const SOURCES: Record<string, Source> = {
  iso: { ref: 'ITC-BT-19 §2.9 (resistencia de aislamiento)', note: '500 V de ensayo y 0,5 MΩ para instalaciones hasta 500 V (250 V y 0,25 MΩ en MBTS/MBTP; 1000 V y 1 MΩ por encima de 500 V). Coincide con las guías técnicas consultadas (PLC Madrid, Voltimum), pero no se ha podido contrastar con el texto del BOE desde el entorno de desarrollo.', verified: false },
  pe: { ref: 'ITC-BT-19 / ITC-BT-18 (continuidad de los conductores de protección)', note: 'El umbral de 2 Ω es una simplificación del juego, no un valor del REBT.', verified: false },
  earth: { ref: 'ITC-BT-18 / ITC-BT-24 (puesta a tierra; tensión de contacto límite 50 V)', note: 'Ra ≤ 50 V / IΔn = 1666 Ω con un diferencial de 30 mA. Verifica con el texto oficial.', verified: false },
  rcd: { ref: 'UNE-EN 61008 / ITC-BT-24 (disparo de los interruptores diferenciales)', note: 'Entre 0,5·IΔn e IΔn; ≤ 300 ms a IΔn y ≤ 40 ms a 5·IΔn. Verifica con la norma.', verified: false },
};

export type TestKind = 'aislamiento' | 'continuidad' | 'tierra' | 'diferencial';
export type Pair = 'LPE' | 'NPE' | 'LN';
export const PAIR_LABEL: Record<Pair, string> = { LPE: 'Fase – tierra', NPE: 'Neutro – tierra', LN: 'Fase – neutro' };
