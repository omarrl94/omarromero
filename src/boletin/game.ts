/** Creación de una visita: cliente, vivienda, instalación (la del instalador profesional) y defectos ocultos. */
import { makeClient, rng, type PlanChoice } from '../game/clients';
import { autoSolve } from '../game/solver';
import { analyze } from '../game/logic';
import { circuitDef } from '../game/data';
import { houseOf } from '../game/houses';
import { lineR } from '../averias/model';
import { DEFECTS } from './catalog';
import { RULES, type Pair, type TestKind } from './rules';

export interface CircTruth { id: string; name: string; length: number; section: number; iso: Record<Pair, number>; rpe: number; recs: string[] }
export interface RcdTruth { id: string; circuits: string[]; tripmA: number; t1: number; t5: number }
export interface Truth { circuits: CircTruth[]; ra: number; rcds: RcdTruth[]; spd: boolean }
export interface DefectInst { defect: string; target: string; value: number }
/** Lo necesario para dibujar la vivienda: cuadro, mecanismos de toda la casa y recorrido de los circuitos que se verifican. */
export interface Layout { panel: { x: number; y: number }; devices: { kind: string; x: number; y: number; circuit: string | null }[]; routes: Record<string, [number, number][]>; far: Record<string, { x: number; y: number }> }
export interface Visit { seed: number; level: number; houseId: string; clientName: string; clientEmoji: string; intro: string; budgetMin: number; truth: Truth; defects: DefectInst[]; required: Required[]; layout?: Layout }
/** Verificación exigible: lo que hay que medir para poder firmar. */
export interface Required { key: string; kind: TestKind; target: string; pair?: Pair; label: string }

const INTROS = [
  'Es viernes por la tarde y quiero la luz dada de alta ya. Firmadme el boletín y listo.',
  'El técnico de la compañía viene el lunes. Necesito el boletín firmado hoy.',
  'Me da igual lo que midáis, ¿está bien o no? Y rápido, que tengo la cena.',
  'Mi hijo estudia electricidad y dice que tenéis que medir de todo. Medid de todo, pues.',
  'Ya hemos pagado la obra. Solo falta el papel.',
];
const CIRC_COUNT: Record<number, number> = { 1: 2, 2: 3, 3: 3 };
const BUDGET: Record<number, number> = { 1: 150, 2: 120, 3: 100 };

export function makeVisit(seed: number, level: number, plan: PlanChoice = 'random'): Visit {
  const r = rng(seed * 6007 + level * 13);
  const client = makeClient(seed, 1, plan);
  const house = houseOf(client.houseId);
  const inst = autoSolve(client.houseId, client);
  const an = analyze(inst, house);
  const ids = Object.keys(an.circuits);
  // Se verifican unos pocos circuitos (los suficientes para que el juego no sea eterno)
  const pool = [...ids]; const chosen: string[] = [];
  while (chosen.length < Math.min(CIRC_COUNT[level], pool.length)) chosen.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  chosen.sort();
  const circuits: CircTruth[] = chosen.map((id) => {
    const ci = an.circuits[id];
    const rpe = Math.min(lineR(ci.lmax, ci.choice.section) + 0.05, 1.5);
    const iso = (): number => Math.round((120 + r() * 380) * 10) / 10; // MΩ, muy por encima del mínimo
    return { id, name: circuitDef(id).name, length: Math.round(ci.lmax), section: ci.choice.section, iso: { LPE: iso(), NPE: iso(), LN: iso() }, rpe: Math.round(rpe * 100) / 100, recs: [] };
  });
  const nRcd = Math.max(1, inst.board.idCount);
  const rcds: RcdTruth[] = Array.from({ length: nRcd }, (_, i) => ({ id: `ID${i + 1}`, circuits: chosen.filter((_c, k) => Math.floor(k / 5) === i), tripmA: Math.round(18 + r() * 10), t1: Math.round(40 + r() * 140), t5: Math.round(12 + r() * 20) }));
  const truth: Truth = { circuits, ra: Math.round(15 + r() * 75), rcds, spd: inst.board.spd };
  // Defectos ocultos
  const nDef = level === 1 ? 1 : level === 2 ? (r() < 0.15 ? 0 : r() < 0.55 ? 1 : 2) : (r() < 0.3 ? 0 : 1 + Math.floor(r() * 3));
  const defects: DefectInst[] = [];
  const pickable = DEFECTS.filter((d) => d.level <= level && (level === 1 ? d.level === 1 : true));
  const used = new Set<string>();
  for (let i = 0; i < nDef && pickable.length; i++) {
    const d = pickable[Math.floor(r() * pickable.length)];
    const target = d.scope === 'earth' ? 'tierra' : d.scope === 'rcd' ? rcds[Math.floor(r() * rcds.length)].id : circuits[Math.floor(r() * circuits.length)].id;
    const key = `${d.test}:${target}:${d.pair ?? ''}`;
    if (used.has(key)) continue;
    used.add(key);
    const value = d.value(r);
    defects.push({ defect: d.id, target, value });
    if (d.scope === 'circuit') { const c = circuits.find((x) => x.id === target)!; if (d.test === 'aislamiento') c.iso[d.pair!] = value; else c.rpe = value; }
    else if (d.scope === 'earth') truth.ra = value;
    else { const x = rcds.find((q) => q.id === target)!; if (d.id === 'rcd_lento') x.t1 = value; else x.tripmA = value; }
  }
  // Un decoy honrado en el nivel 3: un circuito con un valor alto pero apto (para no creer que todo lo «raro» falla)
  if (level === 3 && circuits.length > 1) { const c = circuits.find((x) => !defects.some((d) => d.target === x.id)); if (c) c.iso.LPE = Math.round((RULES.iso.minMOhm + 0.05 + r() * 0.1) * 100) / 100; }
  const required: Required[] = [];
  for (const c of circuits) {
    required.push({ key: `cont:${c.id}`, kind: 'continuidad', target: c.id, label: `${c.id} · continuidad del conductor de protección` });
    required.push({ key: `iso:${c.id}:LPE`, kind: 'aislamiento', target: c.id, pair: 'LPE', label: `${c.id} · aislamiento fase–tierra` });
    required.push({ key: `iso:${c.id}:LN`, kind: 'aislamiento', target: c.id, pair: 'LN', label: `${c.id} · aislamiento fase–neutro` });
  }
  required.push({ key: 'tierra', kind: 'tierra', target: 'tierra', label: 'Resistencia de la puesta a tierra' });
  for (const x of rcds) required.push({ key: `dif:${x.id}`, kind: 'diferencial', target: x.id, label: `${x.id} · disparo del diferencial` });
  const far: Layout['far'] = {};
  for (const id of chosen) { const ci = an.circuits[id]; const f = [...ci.devs].sort((a, b) => Math.abs(b.x - inst.panel.x) + Math.abs(b.y - inst.panel.y) - (Math.abs(a.x - inst.panel.x) + Math.abs(a.y - inst.panel.y)))[0]; far[id] = { x: f.x, y: f.y }; }
  const layout: Layout = { panel: inst.panel, devices: inst.devices.map((d) => ({ kind: d.kind, x: d.x, y: d.y, circuit: d.circuit })), routes: Object.fromEntries(chosen.map((id) => [id, an.circuits[id].points])), far };
  return { seed, level, houseId: client.houseId, clientName: client.name, clientEmoji: client.emoji, intro: INTROS[Math.floor(r() * INTROS.length)], budgetMin: BUDGET[level], truth, defects, required, layout };
}
