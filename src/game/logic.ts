/** Lógica del modo juego: análisis de la instalación del jugador, inspección y puntuación. Sin DOM. */
import { DROP, GAMMA, IZ, PIA_RATINGS, PRICES, U, ZS, circuitDef, dev, type DevKind } from './data';
import { area, houseOf, type House, type Room } from './houses';
import type { Client } from './clients';

export interface Dev { id: string; kind: DevKind; x: number; y: number; circuit: string | null }
export interface Choice { inA: number; section: number; curve: 5 | 10 | 20 }
export interface Board { iga: number; idCount: number; idA: number; idMa: 30 | 300; idType: 'A' | 'AC'; spd: boolean }
export interface GState {
  devices: Dev[]; links: { sw: string; light: string }[];
  panel: { x: number; y: number };
  choices: Record<string, Choice>; board: Board;
}

export const defaultBoard = (): Board => ({ iga: 25, idCount: 1, idA: 25, idMa: 30, idType: 'AC', spd: false });
export const defaultChoice = (): Choice => ({ inA: 10, section: 1.5, curve: 10 });
export const emptyState = (house: House): GState => ({ devices: [], links: [], panel: { ...house.panelDefault }, choices: {}, board: defaultBoard() });

export function roomAt(house: House, x: number, y: number): Room | null {
  return house.rooms.find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) ?? null;
}
const pointInRoom = (house: House, d: { x: number; y: number }) => roomAt(house, d.x, d.y);

/** Circuito que se asigna por defecto a un dispositivo (el alumno puede cambiarlo). */
export function defaultCircuit(kind: DevKind, room: Room | null): string | null {
  switch (kind) {
    case 'luz': case 'luzExt': case 'int': case 'conm': case 'detector': return 'C1';
    case 'toma': return room && (room.kind === 'bano' || room.kind === 'cocina') ? 'C5' : 'C2';
    case 'tomaHorno': return 'C3';
    case 'tomaLav': return 'C4';
    case 'ac': return 'C9';
    case 'ev': return 'CVE';
    default: return null;
  }
}

/** Zona prohibida alrededor de la bañera: bases a menos de 0,6 m (volúmenes de ITC-BT-27, orientativo). */
export function inBathZone(house: House, d: { x: number; y: number }, margin = 0.6): boolean {
  const t = house.tubZone;
  if (!t) return false;
  return d.x >= t.x - margin && d.x <= t.x + t.w + margin && d.y >= t.y - margin && d.y <= t.y + t.h + margin;
}

export interface CircuitInfo {
  id: string; devs: Dev[]; points: [number, number][]; ltotal: number; lmax: number;
  pTotal: number; ibUse: number; choice: Choice; iz: number; dropV: number; dropPct: number; dropLimit: number;
  icc: number; needIcc: number; cableCost: number; piaCost: number;
}
export interface Analysis {
  circuits: Record<string, CircuitInfo>; deviceCost: number; cableCost: number; protCost: number; total: number;
  idOk: boolean; pSimTotal: number; igaMin: number;
}

const manhattan = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export function analyze(state: GState, house: House): Analysis {
  void house;
  const byCircuit = new Map<string, Dev[]>();
  for (const d of state.devices) if (d.circuit) { if (!byCircuit.has(d.circuit)) byCircuit.set(d.circuit, []); byCircuit.get(d.circuit)!.push(d); }
  const circuits: Record<string, CircuitInfo> = {};
  let cableCost = 0, protCost = 0, pSim = 0;
  for (const [cid, devs] of byCircuit) {
    const def = circuitDef(cid);
    // Recorrido: vecino más próximo desde el cuadro, en L (horizontal y vertical)
    let cur: { x: number; y: number } = state.panel;
    const rest = [...devs];
    const points: [number, number][] = [[cur.x, cur.y]];
    let ltotal = 0, lmax = 0;
    while (rest.length) {
      rest.sort((a, b) => manhattan(cur, a) - manhattan(cur, b));
      const n = rest.shift()!;
      const seg = manhattan(cur, n);
      points.push([n.x, cur.y], [n.x, n.y]);
      ltotal += seg + DROP; lmax += seg;
      cur = n;
    }
    lmax += DROP * 2;
    const choice = state.choices[cid] ?? defaultChoice();
    const pTotal = devs.reduce((a, d) => a + dev(d.kind).p, 0);
    const ibUse = (pTotal * def.use) / U;
    const iz = IZ[choice.section] ?? 0;
    const dropV = (2 * lmax * choice.inA) / (GAMMA * choice.section);
    const dropPct = (dropV / U) * 100;
    const icc = U / ((2 * lmax) / (GAMMA * choice.section) + ZS);
    const cc = ltotal * (PRICES.cablePerM[choice.section] ?? 8) + ltotal * PRICES.tubePerM;
    const pc = PRICES.pia[choice.inA] ?? 10;
    cableCost += cc; protCost += pc; pSim += pTotal * def.use;
    circuits[cid] = { id: cid, devs, points, ltotal, lmax, pTotal, ibUse, choice, iz, dropV, dropPct, dropLimit: def.lighting ? 3 : 5, icc, needIcc: choice.curve * choice.inA, cableCost: cc, piaCost: pc };
  }
  const deviceCost = state.devices.reduce((a, d) => a + dev(d.kind).price, 0);
  const b = state.board;
  protCost += PRICES.iga + b.idCount * PRICES.id(b.idA, b.idType) + PRICES.box + (b.spd ? PRICES.spd : 0);
  const pSimTotal = pSim * 0.6;
  const igaMin = Math.max(25, PIA_RATINGS.find((r) => r >= pSimTotal / U) ?? 63);
  const nCirc = Object.keys(circuits).length;
  const idOk = b.idCount >= Math.ceil(nCirc / 5) && b.idMa === 30 && b.idA >= b.iga;
  return { circuits, deviceCost, cableCost, protCost, total: deviceCost + cableCost + protCost, idOk, pSimTotal, igaMin };
}

export interface Check { id: string; group: 'cliente' | 'estancias' | 'cuadro' | 'seguridad' | 'presupuesto'; label: string; ok: boolean; detail?: string }
export type TestOutcome = 'ok' | 'nuisance' | 'fire' | 'slow';
export interface TestResult { cid: string; outcome: TestOutcome; text: string }

export interface Ctx { house: House; state: GState; an: Analysis; roomOf: (d: Dev) => Room | null }
export const makeCtx = (house: House, state: GState): Ctx => ({ house, state, an: analyze(state, house), roomOf: (d) => pointInRoom(house, d) });

export const devsIn = (c: Ctx, roomId: string, kind: DevKind) => c.state.devices.filter((d) => d.kind === kind && c.roomOf(d)?.id === roomId);
export const roomsOfKind = (c: Ctx, kind: Room['kind']) => c.house.rooms.filter((r) => r.kind === kind);
export const controllers = (c: Ctx, lightId: string) => c.state.links.filter((l) => l.light === lightId).map((l) => c.state.devices.find((d) => d.id === l.sw)).filter(Boolean) as Dev[];

/** Mínimos por estancia (orientativos, tipo ITC-BT-25 tabla 2). */
export interface RoomNeed { key: string; label: string; need: number; have: number }
export function roomNeeds(c: Ctx, r: Room): RoomNeed[] {
  const count = (k: DevKind) => devsIn(c, r.id, k).length;
  const lights = devsIn(c, r.id, 'luz');
  const ctrl = lights.filter((l) => controllers(c, l.id).length > 0).length;
  const tomas = devsIn(c, r.id, 'toma').filter((t) => !inBathZone(c.house, t)).length;
  const L = Math.max(r.w, r.h);
  switch (r.kind) {
    case 'salon': return [{ key: 'luz', label: 'Puntos de luz', need: Math.max(2, Math.ceil(area(r) / 18)), have: lights.length }, { key: 'ctrl', label: 'Luces con mando', need: Math.max(2, Math.ceil(area(r) / 18)), have: ctrl }, { key: 'toma', label: 'Bases 16 A', need: Math.max(3, Math.ceil(area(r) / 6)), have: tomas }, { key: 'tv', label: 'Toma TV', need: 1, have: count('tomaTV') }];
    case 'dormitorio': return [{ key: 'luz', label: 'Punto de luz', need: 1, have: lights.length }, { key: 'ctrl', label: 'Con mando', need: 1, have: ctrl }, { key: 'toma', label: 'Bases 16 A', need: 3, have: tomas }];
    case 'cocina': return [{ key: 'luz', label: 'Punto de luz', need: 1, have: lights.length }, { key: 'ctrl', label: 'Con mando', need: 1, have: ctrl }, { key: 'toma', label: 'Bases 16 A', need: 2, have: tomas }, { key: 'horno', label: 'Base 25 A', need: 1, have: count('tomaHorno') }, { key: 'lav', label: 'Tomas electrodomésticos', need: 1, have: count('tomaLav') }];
    case 'bano': return [{ key: 'luz', label: 'Punto de luz', need: 1, have: lights.length }, { key: 'ctrl', label: 'Con mando', need: 1, have: ctrl }, { key: 'toma', label: 'Base fuera de la zona de la bañera', need: 1, have: tomas }];
    case 'pasillo': return [{ key: 'luz', label: 'Puntos de luz (1 cada 5 m)', need: Math.ceil(L / 5), have: lights.length }, { key: 'ctrl', label: 'Con mando', need: Math.ceil(L / 5), have: ctrl }, { key: 'toma', label: 'Bases (1 cada 5 m)', need: Math.max(1, Math.floor(L / 5)), have: tomas }];
    default: return [];
  }
}

export interface Evaluation { checks: Check[]; score: number; cost: number; budgetOk: boolean; tests: TestResult[]; caps: string[]; stars: number; an: Analysis; groupScore: Record<string, [number, number]> }

export function evaluate(state: GState, houseId: string, client: Client): Evaluation {
  const house = houseOf(houseId);
  const c = makeCtx(house, state);
  const an = c.an;
  const checks: Check[] = [];
  // 1. Cliente
  for (const rq of client.reqs) { const r = rq.check(c); checks.push({ id: 'rq-' + rq.id, group: 'cliente', label: rq.short, ok: r.ok, detail: r.detail }); }
  // 2. Estancias
  for (const r of house.rooms) for (const n of roomNeeds(c, r)) checks.push({ id: `rm-${r.id}-${n.key}`, group: 'estancias', label: `${r.name}: ${n.label}`, ok: n.have >= n.need, detail: `${n.have} de ${n.need}` });
  // Bases en la zona de la bañera
  const bad = state.devices.filter((d) => d.kind === 'toma' && inBathZone(house, d));
  checks.push({ id: 'bath-zone', group: 'seguridad', label: 'Ninguna base a menos de 0,6 m de la bañera', ok: bad.length === 0, detail: bad.length ? `${bad.length} base(s) en zona prohibida` : undefined });
  // 3. Cuadro y circuitos
  const ids = Object.keys(an.circuits);
  const hasLights = state.devices.some((d) => d.kind === 'luz');
  checks.push({ id: 'c1', group: 'cuadro', label: 'Alumbrado en circuito propio (C1)', ok: !hasLights || !!an.circuits.C1, detail: undefined });
  for (const id of ids) {
    const ci = an.circuits[id], def = circuitDef(id);
    checks.push({ id: `pia-${id}`, group: 'cuadro', label: `${id}: PIA ≤ ${def.inA} A y ≥ la corriente de uso (${ci.ibUse.toFixed(1).replace('.', ',')} A)`, ok: ci.choice.inA <= def.inA && ci.choice.inA >= ci.ibUse, detail: `PIA ${ci.choice.inA} A` });
    checks.push({ id: `sec-${id}`, group: 'cuadro', label: `${id}: sección ≥ ${String(def.section).replace('.', ',')} mm²`, ok: ci.choice.section >= def.section, detail: `${String(ci.choice.section).replace('.', ',')} mm²` });
  }
  checks.push({ id: 'iga', group: 'cuadro', label: `IGA de al menos ${an.igaMin} A`, ok: state.board.iga >= an.igaMin, detail: `IGA ${state.board.iga} A` });
  checks.push({ id: 'id30', group: 'cuadro', label: 'Diferencial de 30 mA, calibre ≥ IGA, uno por cada 5 circuitos', ok: an.idOk, detail: `${state.board.idCount} × ${state.board.idA} A / ${state.board.idMa} mA` });
  const entryD = Math.hypot(state.panel.x - house.entry.x, state.panel.y - house.entry.y);
  checks.push({ id: 'panel-pos', group: 'cuadro', label: 'Cuadro junto a la puerta de entrada (≤ 3 m)', ok: entryD <= 3 && roomAt(house, state.panel.x, state.panel.y)?.kind === 'pasillo', detail: `${entryD.toFixed(1).replace('.', ',')} m` });
  // 4. Seguridad por circuito
  const tests: TestResult[] = [];
  for (const id of ids) {
    const ci = an.circuits[id];
    checks.push({ id: `iz-${id}`, group: 'seguridad', label: `${id}: el cable aguanta el PIA (Iz ${ci.iz} A ≥ In ${ci.choice.inA} A)`, ok: ci.iz >= ci.choice.inA });
    checks.push({ id: `drop-${id}`, group: 'seguridad', label: `${id}: caída de tensión ≤ ${ci.dropLimit} %`, ok: ci.dropPct <= ci.dropLimit, detail: `${ci.dropPct.toFixed(2).replace('.', ',')} %` });
    checks.push({ id: `icc-${id}`, group: 'seguridad', label: `${id}: el magnético dispara en cortocircuito`, ok: ci.icc >= ci.needIcc, detail: `Icc ${Math.round(ci.icc)} A ≥ ${ci.needIcc} A` });
    if (ci.iz < ci.choice.inA) tests.push({ cid: id, outcome: 'fire', text: `El cable de ${id} (${ci.choice.section} mm²) admite ${ci.iz} A pero el PIA deja pasar ${ci.choice.inA} A: se calienta sin que nada dispare.` });
    else if (ci.ibUse > ci.choice.inA) tests.push({ cid: id, outcome: 'nuisance', text: `${id} salta en cuanto se usa con normalidad: ${ci.ibUse.toFixed(1)} A de uso frente a un PIA de ${ci.choice.inA} A.` });
    else if (ci.icc < ci.needIcc) tests.push({ cid: id, outcome: 'slow', text: `En ${id} un cortocircuito al final de la línea (${Math.round(ci.icc)} A) no alcanza el umbral magnético (${ci.needIcc} A): tardaría en disparar.` });
    else tests.push({ cid: id, outcome: 'ok', text: `${id} funciona: uso ${ci.ibUse.toFixed(1)} A, PIA ${ci.choice.inA} A, caída ${ci.dropPct.toFixed(1)} %.` });
  }
  checks.push({ id: 'diff-present', group: 'seguridad', label: 'La instalación tiene protección diferencial de 30 mA', ok: state.board.idMa === 30 && state.board.idCount > 0 });
  // 5. Presupuesto
  const budgetOk = an.total <= client.budget;
  checks.push({ id: 'budget', group: 'presupuesto', label: `Dentro del presupuesto (${client.budget} €)`, ok: budgetOk, detail: `${Math.round(an.total)} €` });

  const gs: Record<string, [number, number]> = {};
  for (const ck of checks) { const g = (gs[ck.group] ??= [0, 0]); g[1]++; if (ck.ok) g[0]++; }
  const frac = (g: string) => { const v = gs[g]; return v && v[1] ? v[0] / v[1] : 1; };
  let score = 100 * (0.4 * frac('cliente') + 0.2 * frac('estancias') + 0.15 * frac('cuadro') + 0.15 * frac('seguridad') + 0.1 * frac('presupuesto'));
  const caps: string[] = [];
  if (tests.some((t) => t.outcome === 'fire')) { score = Math.min(score, 30); caps.push('Riesgo de incendio: un cable no soporta su protección.'); }
  if (!(state.board.idMa === 30 && state.board.idCount > 0)) { score = Math.min(score, 40); caps.push('Sin diferencial de 30 mA: riesgo de electrocución.'); }
  if (bad.length) { score = Math.min(score, 55); caps.push('Hay bases demasiado cerca de la bañera.'); }
  if (!state.devices.length) score = 0;
  score = Math.round(score);
  return { checks, score, cost: an.total, budgetOk, tests, caps, stars: score >= 90 ? 3 : score >= 75 ? 2 : score >= 50 ? 1 : 0, an, groupScore: gs };
}
