/** Cálculo de cables: resistencia, caída de tensión, intensidad admisible y dimensionado. */
import { DROP_LIMITS, GAMMA_CU, IZ_CU_PVC_B1, SECTIONS, BREAKER_RATINGS } from '../data/rebt';
import type { Project, Wire } from './types';
import type { SimResult } from './netlist';
import { tkey } from './netlist';
import { defOf, fmt, symOf } from './library';

export const DEFAULT_SECTION = 1.5;
export const DEFAULT_LENGTH = 2; // m

export const wireData = (w: Wire) => ({ section: w.section ?? DEFAULT_SECTION, length: w.length ?? DEFAULT_LENGTH, material: w.material ?? 'Cu' as const });

/** Resistencia de un conductor (Ω), γ = 48 m/(Ω·mm²) (Cu, 70 °C). */
export const wireResistance = (section: number, length: number) => length / (GAMMA_CU.at70 * section);
export const admissible = (section: number) => IZ_CU_PVC_B1[section] ?? 0;

/** Caída de tensión de un circuito monofásico (ida y vuelta): e = 2·L·I·cosφ/(γ·S). */
export const dropSingle = (L: number, I: number, S: number, cos = 1) => (2 * L * I * cos) / (GAMMA_CU.at70 * S);
/** Sección mínima por caída de tensión: S = 2·L·P / (γ·e·U) con e en voltios. */
export const sectionForDrop = (L: number, P: number, eVolts: number, U: number) => (2 * L * P) / (GAMMA_CU.at70 * eVolts * U);

export const nextSection = (min: number) => SECTIONS.find((s) => s >= min - 1e-9) ?? SECTIONS[SECTIONS.length - 1];
export const nextBreaker = (ib: number) => BREAKER_RATINGS.find((r) => r >= ib - 1e-9) ?? BREAKER_RATINGS[BREAKER_RATINGS.length - 1];

export interface CableInfo { id: string; section: number; length: number; I: number; R: number; dV: number; pct: number | null; iz: number; overload: boolean; limit: number }

/** Tensión nominal del circuito (la de la primera fuente) para expresar la caída en %. */
export function nominalVoltage(project: Project): number | null {
  const s = project.components.find((c) => ['acsource', 'battery', 'vsrc'].includes(symOf(c.type)));
  return s ? Number(s.params.v) : null;
}

export function cableReport(project: Project, sim: SimResult): { info: Record<string, CableInfo>; messages: SimResult['messages'] } {
  const info: Record<string, CableInfo> = {};
  const messages: SimResult['messages'] = [];
  const U = nominalVoltage(project);
  const comps = new Map(project.components.map((c) => [c.id, c]));
  for (const w of project.wires) {
    const d = wireData(w);
    const I = Math.abs(sim.wireCurrent[w.id] ?? 0);
    const R = wireResistance(d.section, d.length);
    const dV = I * R;
    const lamp = [w.a.comp, w.b.comp].some((id) => comps.get(id)?.type === 'lamp');
    const limit = lamp ? DROP_LIMITS.alumbrado : DROP_LIMITS.resto;
    const pct = U ? (dV / U) * 100 : null;
    const iz = admissible(d.section);
    const overload = I > iz && iz > 0;
    info[w.id] = { id: w.id, section: d.section, length: d.length, I, R, dV, pct, iz, overload, limit };
    const name = `${w.a.comp}:${w.a.term + 1} → ${w.b.comp}:${w.b.term + 1}`;
    if (overload) messages.push({ level: 'error', ids: [w.a.comp], text: `El cable ${name} (${fmt(d.section)} mm²) lleva ${fmt(I)} A y solo admite ${fmt(iz)} A: se sobrecalienta. Aumenta la sección o reduce la carga.` });
    else if (pct !== null && pct > limit) messages.push({ level: 'warn', ids: [w.a.comp], text: `El cable ${name} pierde ${fmt(pct)} % de la tensión (máx. ${limit} %). Aumenta la sección o acorta el cable.` });
  }
  void tkey;
  void defOf;
  return { info, messages };
}
