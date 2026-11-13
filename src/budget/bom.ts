/** Lista de material de un circuito: cuenta los componentes, los metros de cable y los accesorios necesarios. */
import type { Project } from '../model/types';
import type { SimResult } from '../model/netlist';
import { defOf, symOf } from '../model/library';
import { wireData } from '../model/cables';

export interface BomLine { key: string; qty: number; why: string }
export interface Bom { lines: BomLine[]; customer: { name: string; qty: number }[]; notes: string[] }

const CURVE = (mag: number) => (mag <= 5 ? 'B' : mag >= 20 ? 'D' : 'C');
const nextOf = (xs: number[], v: number) => xs.find((x) => x >= v - 1e-9) ?? xs[xs.length - 1];
const TUBE_BY_SECTION = (s: number) => (s <= 2.5 ? 20 : s <= 6 ? 25 : s <= 16 ? 32 : 40);
const MECH: Record<string, string> = { switch: 'interruptor', sel2: 'interruptor', tirador: 'interruptor', spdt: 'conmutador', cruce: 'cruce', pushNO: 'pulsador', pushNC: 'pulsador', toma_sw: 'schuko', schuko: 'schuko', usb: 'usb' };

export function buildBom(project: Project, sim: SimResult, opts: { lamps?: boolean } = {}): Bom {
  const acc = new Map<string, BomLine>();
  const add = (key: string, qty: number, why: string) => { const c = acc.get(key); if (c) { c.qty += qty; if (!c.why.includes(why)) c.why += `, ${why}`; } else acc.set(key, { key, qty, why }); };
  const customer = new Map<string, number>();
  const notes: string[] = [];
  let modules = 0;
  let mechs = 0;
  for (const c of project.components) {
    const d = defOf(c.type), sym = symOf(c.type), m = d.model, p = c.params;
    const label = c.label || c.id;
    if (m.kind === 'BREAKER') {
      add(`mt:1pn:${p.in}:${CURVE(Number(m.mag(p)))}`, 1, label); modules += 2;
    } else if (m.kind === 'RCD') {
      const ib = Math.abs(sim.live[c.id]?.i ?? 0);
      const cal = m.rating ? Number(p.in) : nextOf([25, 40, 63, 80, 100], Math.max(25, ib * 1.25));
      add(`dif:${cal}:${p.ina}:${['AC', 'A', 'F', 'B'][Number(p.tipo ?? 1)] ?? 'A'}`, 1, label); modules += m.poles;
      if (m.rating) add(`mt:1pn:${p.in}:C`, 1, label);
    } else if (m.kind === 'FUSE') { add(`fus:${p.in}`, 1, label); }
    else if (MECH[c.type] || MECH[sym]) {
      const k = MECH[c.type] ?? MECH[sym];
      add(`mec:${k}`, 1, label); mechs++;
    } else if (m.kind === 'R' && (sym === 'lamp') && opts.lamps !== false && ['lampled', 'bajoconsumo'].includes(c.type)) {
      add(`led:${nextOf([3, 5, 7, 9, 12, 15, 20], Number(p.pn))}`, 1, label);
    } else if (['Receptores', 'Fuentes'].includes(d.category) && c.type !== 'red') {
      customer.set(d.name, (customer.get(d.name) ?? 0) + 1);
    }
  }
  if (mechs) { add('caja', mechs, 'una por mecanismo'); add('placa', mechs, 'una por mecanismo'); }
  // Cables: metros por sección (+10 % de sobrante) y tubo corrugado (una por cada dos conductores)
  const bySec = new Map<number, number>();
  for (const w of project.wires) { if (w.auto) continue; const d = wireData(w); bySec.set(d.section, (bySec.get(d.section) ?? 0) + d.length); }
  const tube = new Map<number, number>();
  for (const [s, len] of bySec) {
    add(`cable:${s}`, Math.ceil(len * 1.1), 'conductores del esquema (+10 %)');
    tube.set(TUBE_BY_SECTION(s), (tube.get(TUBE_BY_SECTION(s)) ?? 0) + len / 2);
  }
  for (const [d, len] of tube) add(`tubo:${d}`, Math.ceil(len * 1.1), 'canalización');
  if (modules) add(`cuadro:${[12, 24, 36, 48].find((x) => x >= modules * 1.5) ?? 48}`, 1, `${modules} módulos + reserva`);
  notes.push('No incluye el conductor de protección (PE) ni las uniones y regletas: añádelos según el montaje.');
  notes.push('Los metros de cable son los del esquema (cada cable dibujado, con su longitud) más un 10 %.');
  return { lines: [...acc.values()], customer: [...customer].map(([name, qty]) => ({ name, qty })), notes };
}
