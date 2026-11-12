/** Creación de una partida: cliente, vivienda, instalación de partida (la del instalador profesional) y avería elegida. */
import { makeClient, rng, type PlanChoice } from '../game/clients';
import { autoSolve } from '../game/solver';
import { analyze } from '../game/logic';
import { circuitDef } from '../game/data';
import { houseOf } from '../game/houses';
import { FAULTS, type Case, type FaultDef, type Rec, type Setup } from './catalog';

export interface Scenario { seed: number; level: number; faultId: string; houseId: string; clientName: string; clientEmoji: string; circuit: string; symptom: string; case: Case; point: string }

const ROOM_W: Record<string, number> = { salon: 350, dormitorio: 150, pasillo: 100 };
function recsFor(cid: string, devs: { kind: string; x: number; y: number }[], house: ReturnType<typeof houseOf>): Rec[] {
  const roomName = (d: { x: number; y: number }) => house.rooms.find((r) => d.x >= r.x && d.x <= r.x + r.w && d.y >= r.y && d.y <= r.y + r.h);
  const byRoom = (kind: string, w: (k: string, n: number) => number, label: (n: string) => string): Rec[] => {
    const m = new Map<string, { name: string; kind: string; n: number }>();
    for (const d of devs.filter((x) => x.kind === kind)) { const r = roomName(d); if (!r) continue; const e = m.get(r.id) ?? { name: r.name, kind: r.kind, n: 0 }; e.n++; m.set(r.id, e); }
    return [...m.values()].slice(0, 3).map((e) => ({ name: label(e.name), w: w(e.kind, e.n) }));
  };
  switch (cid) {
    case 'C1': return byRoom('luz', (_k, n) => n * 100, (n) => `Luz · ${n}`);
    case 'C2': return byRoom('toma', (k) => ROOM_W[k] ?? 200, (n) => n);
    case 'C3': return [{ name: 'Horno', w: 2500 }];
    case 'C4': return [{ name: 'Lavadora', w: 2000 }, { name: 'Lavavajillas', w: 2000 }];
    case 'C5': return [{ name: 'Microondas', w: 1200 }, { name: 'Cafetera', w: 900 }];
    default: return [];
  }
}

export function makeScenario(seed: number, level: number, plan: PlanChoice = 'random', faultId?: string): Scenario {
  const r = rng(seed * 7919 + level);
  const client = makeClient(seed, 1, plan);
  const house = houseOf(client.houseId);
  const inst = autoSolve(client.houseId, client);
  const an = analyze(inst, house);
  const usable = (f: FaultDef) => f.circuits.find((cid) => { const ci = an.circuits[cid]; return !!ci && recsFor(cid, ci.devs, house).length >= (f.minRecs ?? 1); });
  const pool = faultId ? FAULTS.filter((f) => f.id === faultId) : FAULTS.filter((f) => f.level === level && usable(f));
  const fault = pool[Math.floor(r() * pool.length)];
  const cid = usable(fault)!;
  const ci = an.circuits[cid];
  const base: Setup = { circuit: cid, circuitName: circuitDef(cid).name, inA: ci.choice.inA, section: ci.choice.section, length: Math.max(6, Math.round(ci.lmax * 10) / 10), recs: recsFor(cid, ci.devs, house) };
  const { setup, effects, point } = fault.prepare(base, r);
  return { seed, level, faultId: fault.id, houseId: client.houseId, clientName: client.name, clientEmoji: client.emoji, circuit: cid, symptom: fault.symptom(setup, house.name), case: { setup, effects }, point };
}
