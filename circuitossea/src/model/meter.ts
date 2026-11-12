/**
 * Polímetro digital virtual. Se comporta como el real, errores del alumno incluidos:
 *  - V⎓ con 10 MΩ de resistencia interna (carga el circuito).
 *  - A⎓ es un shunt de 0,05 Ω en serie: hay que abrir el circuito; en paralelo es un cortocircuito
 *    y funde el fusible de 10 A.
 *  - Ω solo es válido SIN tensión; con tensión el aparato se protege y avisa.
 */
import { solveDC, resistanceBetween } from '../engine/dc';
import { solveAC, abs as cabs, cx, sub as csub } from '../engine/ac';
import type { SimResult } from './netlist';
import { tkey } from './netlist';
import type { Project, TermRef } from './types';
import { defOf, fmt } from './library';

export type Dial = 'V' | 'Vac' | 'A' | 'Aac' | 'ohm' | 'cont' | 'off';
export type Jack = 'VOhm' | '10A';

export interface MeterState {
  dial: Dial;
  jack: Jack;
  red: TermRef | null;
  black: TermRef | null;
  armed: 'red' | 'black' | null;
  fuseBlown: boolean;
}

export interface Reading {
  text: string; // lo que muestra la pantalla
  unit: string;
  value: number | null; // valor numérico para la hoja de medidas
  beep: boolean;
  tips: { level: 'info' | 'warn' | 'error'; text: string }[];
  blowFuse?: boolean;
}

export const R_INT_V = 10e6;
export const R_SHUNT = 0.05;
export const FUSE_A = 10;
export const initialMeter: MeterState = { dial: 'V', jack: 'VOhm', red: null, black: null, armed: null, fuseBlown: false };

/** Nombre legible de un punto: «E1:+». */
export function pointName(project: Project, t: TermRef | null): string {
  if (!t) return '—';
  const c = project.components.find((x) => x.id === t.comp);
  if (!c) return '—';
  const d = defOf(c.type);
  const nm = c.label || (c.id.length <= 4 ? c.id : d.name);
  return `${nm}:${d.terminals[t.term].name}`;
}

/** Cifras: 4 dígitos significativos, coma decimal, prefijos SI. */
function show(v: number, unit: string): { text: string; unit: string } {
  const a = Math.abs(v);
  let s = v, u = unit;
  if (a >= 1e6) { s = v / 1e6; u = 'M' + unit; } else if (a >= 1e3) { s = v / 1e3; u = 'k' + unit; }
  else if (a < 1 && a >= 1e-3) { s = v * 1e3; u = 'm' + unit; } else if (a < 1e-3 && a > 0) { s = v * 1e6; u = 'µ' + unit; }
  const digits = Math.abs(s) >= 100 ? 1 : Math.abs(s) >= 10 ? 2 : 3;
  return { text: s.toFixed(digits).replace('.', ','), unit: u };
}

export function readMeter(sim: SimResult, m: MeterState, project: Project): Reading {
  const base: Reading = { text: '', unit: '', value: null, beep: false, tips: [] };
  if (m.dial === 'off') return { ...base, text: '' };
  if (!m.red || !m.black) {
    return { ...base, text: m.dial === 'ohm' || m.dial === 'cont' ? 'OL' : '0,000', tips: [{ level: 'info', text: 'Coloca las dos puntas de prueba sobre terminales del circuito.' }] };
  }
  const na = sim.nodeOf[tkey(m.red)], nb = sim.nodeOf[tkey(m.black)];
  if (na === undefined || nb === undefined) return { ...base, text: '0,000' };
  const els = sim.problem.elements;
  const nodeCount = sim.problem.nodeCount;
  const jack10 = m.jack === '10A';
  const ac = sim.ac;
  /** Intensidad y tensión AC con la carga propia del instrumento */
  const acShunt = () => {
    const s = solveAC({ nodeCount: ac!.problem.nodeCount, elements: [...ac!.problem.elements, { id: '#m', kind: 'Z', a: na, b: nb, z: cx(R_SHUNT, 0) }] });
    return s.ok ? cabs(s.current['#m']) : 0;
  };
  const acVolt = () => {
    const s = solveAC({ nodeCount: ac!.problem.nodeCount, elements: [...ac!.problem.elements, { id: '#m', kind: 'Z', a: na, b: nb, z: cx(R_INT_V, 0) }] });
    return s.ok ? cabs(csub(s.nodeV[na], s.nodeV[nb])) : 0;
  };
  if (m.dial === 'Vac' || m.dial === 'Aac' || (ac && (m.dial === 'V' || m.dial === 'A'))) {
    const wantsAc = m.dial === 'Vac' || m.dial === 'Aac';
    const isV = m.dial === 'V' || m.dial === 'Vac';
    if (!wantsAc) return { ...base, text: isV ? '0,000' : '0,000', unit: isV ? 'V' : 'A', value: 0, tips: [{ level: 'warn', text: `Estás en ${isV ? 'V⎓' : 'A⎓'} (continua) pero el circuito es de corriente alterna: el valor medio de una senoide es 0. Gira la rueda a ${isV ? 'V~' : 'A~'}.` }] };
    if (!ac) return { ...base, text: '0,000', unit: isV ? 'V' : 'A', value: 0, tips: [{ level: 'warn', text: 'Este circuito es de corriente continua: en la posición de alterna el aparato bloquea la componente continua y marca 0. Usa la posición ⎓.' }] };
    if (isV) {
      if (jack10) return { ...base, text: '0,000', tips: [{ level: 'error', text: 'Punta roja en 10 A: así el aparato es un amperímetro. Pásala al borne VΩ.' }] };
      const v = acVolt();
      return { ...base, ...show(v, 'V'), value: v, tips: [{ level: 'info', text: 'Valor eficaz verdadero (RMS) a ' + fmt(ac.freq) + ' Hz.' }] };
    }
    if (!jack10) return { ...base, text: '0,000', tips: [{ level: 'error', text: 'Para medir intensidad mueve la punta roja al borne 10 A.' }] };
    if (m.fuseBlown) return { ...base, text: 'OL', tips: [{ level: 'error', text: 'El fusible de 10 A está fundido. Cámbialo.' }] };
    if (na === nb) return { ...base, text: '0,000', unit: 'A', value: 0, tips: [{ level: 'warn', text: 'La intensidad se mide EN SERIE: abre el circuito y pon las puntas a ambos lados del corte.' }] };
    const i = acShunt();
    if (i > FUSE_A) return { ...base, text: 'OL', tips: [{ level: 'error', text: `¡Intensidad medida EN PARALELO! Han circulado ${fmt(i, 3)} A y se ha fundido el fusible. Se mide siempre en serie.` }], blowFuse: true };
    return { ...base, ...show(i, 'A'), value: i, tips: [{ level: 'info', text: 'Valor eficaz (RMS).' }] };
  }

  // Cable en el borne de 10 A con el selector en otra posición: se comporta como amperímetro.
  if (jack10 && m.dial !== 'A') {
    if (m.fuseBlown) return { ...base, text: 'OL', tips: [{ level: 'error', text: 'El fusible de 10 A está fundido: el borne no conduce. Cámbialo.' }] };
    const s = solveDC({ nodeCount, elements: [...els, { id: '#m', kind: 'R', a: na, b: nb, value: R_SHUNT }] });
    const i = s.ok ? s.currents['#m'] : 0;
    const tips: Reading['tips'] = [{ level: 'error', text: 'Tienes la punta en el borne de 10 A: así el aparato actúa como amperímetro (casi un cable). Cambia al borne VΩ para medir tensión o resistencia.' }];
    if (Math.abs(i) > FUSE_A) return { ...base, text: 'OL', tips: [{ level: 'error', text: `¡Cortocircuito! Han circulado ${fmt(Math.abs(i), 3)} A por el polímetro y se ha fundido su fusible de 10 A.` }], blowFuse: true };
    return { ...base, text: '0,000', tips };
  }

  if (m.dial === 'V') {
    const s = solveDC({ nodeCount, elements: [...els, { id: '#m', kind: 'R', a: na, b: nb, value: R_INT_V }] });
    if (!s.ok) return { ...base, text: '0,000', tips: [{ level: 'warn', text: 'El circuito tiene un error: revisa los avisos.' }] };
    const v = s.voltages[na] - s.voltages[nb];
    const ideal = sim.solution.voltages[na] - sim.solution.voltages[nb];
    const tips: Reading['tips'] = [];
    if (Math.abs(v) > 1e-6 && Math.abs(ideal - v) / Math.abs(ideal) > 0.005)
      tips.push({ level: 'info', text: `El polímetro (10 MΩ) carga el circuito: sin él habría ${fmt(ideal, 4)} V.` });
    if (Math.abs(v) > 1000) return { ...base, text: 'OL', tips: [{ level: 'warn', text: 'Fuera de rango (máx. 1000 V).' }] };
    const d = show(v, 'V');
    return { ...base, ...d, value: v, tips };
  }

  if (m.dial === 'A') {
    if (!jack10) return { ...base, text: '0,000', tips: [{ level: 'error', text: 'Para medir intensidad mueve la punta roja al borne 10 A.' }] };
    if (m.fuseBlown) return { ...base, text: 'OL', tips: [{ level: 'error', text: 'El fusible de 10 A está fundido. Cámbialo para volver a medir intensidad.' }] };
    if (na === nb) return { ...base, text: '0,000', unit: 'A', value: 0, tips: [{ level: 'warn', text: 'Las dos puntas están en el mismo punto eléctrico: la intensidad se mide EN SERIE. Abre el circuito (quita un cable o usa un interruptor abierto) y pon las puntas a ambos lados del corte.' }] };
    const s = solveDC({ nodeCount, elements: [...els, { id: '#m', kind: 'R', a: na, b: nb, value: R_SHUNT }] });
    const i = s.ok ? s.currents['#m'] : 0;
    if (Math.abs(i) > FUSE_A) return { ...base, text: 'OL', tips: [{ level: 'error', text: `¡Has medido intensidad EN PARALELO! Han circulado ${fmt(Math.abs(i), 3)} A y se ha fundido el fusible del polímetro. La intensidad se mide siempre en serie.` }], blowFuse: true };
    const d = show(i, 'A');
    return { ...base, ...d, value: i, tips: [{ level: 'info', text: 'El amperímetro añade 0,05 Ω al circuito.' }] };
  }

  // Ohm / continuidad
  const vlive = Math.abs(sim.solution.voltages[na] - sim.solution.voltages[nb]);
  if (vlive > 1 && sim.problem.elements.some((e) => e.kind === 'V' || e.kind === 'I')) {
    return { ...base, text: 'OL', tips: [{ level: 'error', text: `Hay ${fmt(vlive, 3)} V entre las puntas. Nunca midas resistencia o continuidad con tensión: puedes dañar el aparato. Desconecta la alimentación (abre el interruptor o quita la pila).` }] };
  }
  const r = resistanceBetween(sim.problem, na, nb);
  if (m.dial === 'cont') {
    const beep = r < 50;
    return { ...base, text: isFinite(r) ? show(r, 'Ω').text : 'OL', unit: 'Ω', value: isFinite(r) ? r : null, beep, tips: [{ level: 'info', text: beep ? 'Continuidad: hay camino de baja resistencia (pitido).' : 'Sin continuidad.' }] };
  }
  if (!isFinite(r) || r > 40e6) return { ...base, text: 'OL', unit: 'Ω', tips: [{ level: 'info', text: 'Circuito abierto entre las puntas (resistencia infinita).' }] };
  const hasLive = els.some((e) => e.kind === 'V' && Math.abs(e.value) > 0);
  const d = show(r, 'Ω');
  return { ...base, ...d, value: r, tips: hasLive ? [{ level: 'info', text: 'Las fuentes se consideran desconectadas durante la medida de resistencia.' }] : [] };
}
