/** Señales para el osciloscopio y el vatímetro: v(t) = dc + √2·Re(ph·e^{jωt}) (ph en valor eficaz). */
import { abs as cabs, arg as carg, cx, sub as csub, type Cx } from '../engine/ac';
import type { SimResult } from './netlist';
import type { TermRef } from './types';
import { tkey } from './netlist';

export interface Signal { dc: number; ph: Cx | null; }

export const zeroSignal: Signal = { dc: 0, ph: null };

/** Tensión del terminal respecto a masa (la masa de la sonda del osciloscopio es el nudo 0). */
export function probeVoltage(sim: SimResult, tip: TermRef | null): Signal {
  if (!tip) return zeroSignal;
  const n = sim.nodeOf[tkey(tip)];
  if (n === undefined) return zeroSignal;
  if (sim.ac) return { dc: 0, ph: sim.ac.nodeV[n] ?? cx() };
  return { dc: sim.solution.voltages[n] ?? 0, ph: null };
}

/** Intensidad que atraviesa un componente, del terminal 1 al 2 (pinza amperimétrica). */
export function currentThrough(sim: SimResult, compId: string | null): Signal {
  if (!compId) return zeroSignal;
  if (sim.ac) return { dc: 0, ph: sim.ac.compI[`${compId}:0`] ?? cx() };
  return { dc: sim.componentCurrent[`${compId}:0`] ?? 0, ph: null };
}

export function voltageAcross(sim: SimResult, compId: string | null): Signal {
  if (!compId) return zeroSignal;
  if (sim.ac) return { dc: 0, ph: sim.ac.compV[compId] ?? cx() };
  return { dc: sim.componentVoltage[compId] ?? 0, ph: null };
}

export const sample = (s: Signal, omega: number, t: number) =>
  s.dc + (s.ph ? Math.SQRT2 * cabs(s.ph) * Math.cos(omega * t + carg(s.ph)) : 0);
export const rmsOf = (s: Signal) => Math.hypot(s.dc, s.ph ? cabs(s.ph) : 0);
export const ampOf = (s: Signal) => (s.ph ? Math.SQRT2 * cabs(s.ph) : 0);
export const phaseDiff = (a: Signal, b: Signal) => {
  if (!a.ph || !b.ph) return null;
  let d = carg(b.ph) - carg(a.ph);
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d <= -Math.PI) d += 2 * Math.PI;
  return d;
};
export { csub };
