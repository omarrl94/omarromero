/** Función y color normalizado de cada conductor, según la red (nudo) a la que pertenece. */
import type { Project } from './types';
import type { SimResult } from './netlist';
import { symOf } from './library';

export interface WireStyle { role: 'pos' | 'neg' | 'mid'; color: string; hi: string; name: string; tag: string }

export function wireStyler(project: Project, sim: SimResult) {
  const ac = !!sim.ac;
  const pos = new Set<number>();
  for (const c of project.components) if (['battery', 'acsource', 'isource', 'vsrc', 'pv', 'usb'].includes(symOf(c.type))) pos.add(sim.nodeOf[`${c.id}:0`]);
  const mids = new Map<number, number>();
  return (node: number): WireStyle => {
    if (node === 0) return ac ? { role: 'neg', color: '#1565c0', hi: '#6fa8ee', name: 'Neutro (azul)', tag: 'N' } : { role: 'neg', color: '#1b1b1b', hi: '#6a6a6a', name: 'Negativo (negro)', tag: '−' };
    if (pos.has(node)) return ac ? { role: 'pos', color: '#7a4a24', hi: '#c08a5e', name: 'Fase (marrón)', tag: 'L' } : { role: 'pos', color: '#c62828', hi: '#ef7b7b', name: 'Positivo (rojo)', tag: '+' };
    if (!mids.has(node)) mids.set(node, mids.size + 1);
    return ac ? { role: 'mid', color: '#2b2b2b', hi: '#7a7a7a', name: 'Fase conmutada (negro)', tag: `L${mids.get(node)}` } : { role: 'mid', color: '#ef6c00', hi: '#ffb067', name: 'Intermedio (naranja)', tag: `${mids.get(node)}` };
  };
}
