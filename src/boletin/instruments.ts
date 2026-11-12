/**
 * Instrumentos de verificación: funciones puras que, a partir de la verdad de la instalación y de las condiciones de ensayo
 * que ha dejado el alumno, devuelven lo que marcaría el aparato y si la medida es VÁLIDA (hecha en las condiciones correctas)
 * y APTA (el valor cumple, según RULES). Las condiciones mal puestas dan lecturas engañosas, como en la realidad.
 */
import { RULES, maxEarthOhm, type Pair } from './rules';
import type { Truth } from './game';

/** Estado de la instalación que prepara el alumno antes de medir. */
export interface Prep { igaOpen: boolean; receptorsOff: boolean; spdOff: boolean; leadsNulled: boolean; earthLinkOpen: boolean }
export const initialPrep = (): Prep => ({ igaOpen: false, receptorsOff: false, spdOff: false, leadsNulled: false, earthLinkOpen: false });

export interface Reading { text: string; unit: string; value: number | null; valid: boolean; apto: boolean | null; danger?: string; notes: string[]; extra?: Record<string, string> }
const fmt = (v: number, d = 2) => v.toFixed(d).replace('.', ',');
const noteOnly = (danger: string): Reading => ({ text: '—', unit: '', value: null, valid: false, apto: null, danger, notes: [danger] });

export function measureInsulation(t: Truth, circuit: string, pair: Pair, volts: number, p: Prep): Reading {
  if (!p.igaOpen) return noteOnly('¡HAY TENSIÓN! El medidor de aislamiento inyecta 500 V: nunca se usa con la instalación en servicio. Abre el IGA.');
  const c = t.circuits.find((x) => x.id === circuit)!;
  let v = c.iso[pair];
  const notes: string[] = [];
  let valid = true;
  if (!p.receptorsOff) { v = Math.min(v, 0.06); notes.push('Con los receptores conectados mides su propia resistencia interna, no el aislamiento de la instalación.'); valid = false; }
  if (t.spd && !p.spdOff) { v = Math.min(v, 0.2); notes.push('El limitador de sobretensiones conduce a 500 V y falsea la medida: hay que desconectarlo.'); valid = false; }
  if (volts !== RULES.iso.testV) {
    notes.push(`Ensayo a ${volts} V: el reglamento pide ${RULES.iso.testV} V para estas instalaciones.`); valid = false;
    if (volts < RULES.iso.testV && v < RULES.iso.minMOhm) v = v * 4; // a poca tensión los defectos se «esconden»
  }
  const shown = Math.min(v, RULES.iso.instrumentMaxMOhm);
  return { text: v >= RULES.iso.instrumentMaxMOhm ? `> ${RULES.iso.instrumentMaxMOhm}` : fmt(shown, shown < 10 ? 2 : 1), unit: 'MΩ', value: v, valid, apto: valid ? c.iso[pair] >= RULES.iso.minMOhm : null, notes };
}

export function measureContinuity(t: Truth, circuit: string, p: Prep): Reading {
  if (!p.igaOpen) return noteOnly('¡HAY TENSIÓN! La continuidad se mide con el circuito sin tensión. Abre el IGA.');
  const c = t.circuits.find((x) => x.id === circuit)!;
  const notes: string[] = [];
  const leads = p.leadsNulled ? 0 : RULES.pe.leadsOhm;
  if (!p.leadsNulled) notes.push('No has anulado la resistencia de las puntas: suman unos 0,3 Ω a la lectura.');
  const v = c.rpe + leads;
  return { text: fmt(v), unit: 'Ω', value: v, valid: true, apto: c.rpe <= RULES.pe.maxOhm, notes };
}

export function measureEarth(t: Truth, distance: number, p: Prep): Reading {
  const notes: string[] = [];
  let v = t.ra; let valid = true;
  if (!p.earthLinkOpen) { v = t.ra * 0.45; notes.push('Con la pica conectada a la instalación mides la tierra en paralelo con otras masas y sale menor de lo real.'); valid = false; }
  if (distance < RULES.earth.minAuxDistance) { v = v * (0.55 + 0.02 * distance); notes.push(`Las picas auxiliares están a ${distance} m: con menos de ${RULES.earth.minAuxDistance} m se solapan sus zonas de influencia y la lectura sale falsa.`); valid = false; }
  return { text: fmt(v, v < 100 ? 1 : 0), unit: 'Ω', value: v, valid, apto: valid ? t.ra <= maxEarthOhm() : null, notes, extra: { limite: `${Math.round(maxEarthOhm())} Ω` } };
}

export function measureRcd(t: Truth, id: string, p: Prep): Reading {
  if (p.igaOpen) return noteOnly('No hay tensión: cierra el IGA para probar el diferencial.');
  const d = t.rcds.find((x) => x.id === id)!;
  const notes: string[] = [];
  let valid = true; let trip = d.tripmA;
  if (!p.receptorsOff) { trip = Math.max(5, trip - 11); notes.push('Con los receptores conectados sus fugas se suman a la del ensayo y el diferencial dispara antes de lo real.'); valid = false; }
  const aptoI = trip >= RULES.rcd.inmA * RULES.rcd.minFrac && trip <= RULES.rcd.inmA;
  const aptoT = d.t1 <= RULES.rcd.maxT1 && d.t5 <= RULES.rcd.maxT5;
  const doesNotTrip = d.tripmA > RULES.rcd.inmA; // no dispara con IΔn
  return {
    text: `${trip} mA`, unit: '', value: trip, valid, apto: valid ? aptoI && aptoT : null, notes,
    extra: { dispara: `${trip} mA`, t1: doesNotTrip ? 'no dispara a 30 mA' : `${d.t1} ms`, t5: `${d.t5} ms` },
  };
}
