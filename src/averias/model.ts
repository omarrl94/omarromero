/**
 * Puente entre la instalación de la vivienda y el simulador: genera un `Project` (circuito) de UN circuito de la
 * vivienda con su avería oculta, y define las reglas de la capa del juego (térmico, diferencial) y la comprobación final.
 * Todo se simula con el motor y el polímetro de siempre; aquí no hay otra física.
 */
import { simulate, type Runtime, type SimEvent, type SimResult } from '../model/netlist';
import { defaultParams } from '../model/library';
import { abs as cabs, cx } from '../engine/ac';
import { admissible } from '../model/cables';
import { GAMMA_CU } from '../data/rebt';
import type { Component, Project, Wire } from '../model/types';
import { RULES, type Case, type Effect } from './catalog';

type P = Record<string, number | boolean | string>;

/** Interruptores que el alumno puede accionar sobre el esquema. */
export const TOGGLEABLE = (id: string) => id === 'IGA' || /^P\d+$/.test(id) || id === 'S1' || id === 'S2';
const SWITCH_IDS = (c: Component) => c.id === 'IGA' || c.id === 'IGAN' || /^P\d+$/.test(c.id) || c.id === 'S1' || c.id === 'S2';

export const hasEffect = <T extends Effect['t']>(c: Case, t: T) => c.effects.filter((e): e is Extract<Effect, { t: T }> => e.t === t);

/** Resistencia de un conductor de la línea (γ del cobre a 70 °C, la del código). */
export const lineR = (length: number, section: number) => length / (GAMMA_CU.at70 * section);

export function buildProject(c: Case, prev?: Project): Project {
  const s = c.setup;
  const comps: Component[] = [];
  const wires: Wire[] = [];
  let wn = 0;
  const add = (id: string, type: string, x: number, y: number, rot: 0 | 90 | 180 | 270, params: P = {}, label?: string, hidden?: boolean) =>
    comps.push({ id, type, x, y, rot, params: { ...defaultParams(type), ...params }, label, hidden });
  const wire = (a: [string, number], b: [string, number]) => wires.push({ id: `w${++wn}`, a: { comp: a[0], term: a[1] }, b: { comp: b[0], term: b[1] } });

  const conm = !!s.conmutada;
  const n = s.recs.length;
  const x0 = conm ? 1100 : 720;
  const xs = (i: number) => x0 + i * 140;
  const R = lineR(s.length, s.section);

  add('SRC', 'acsource', 60, 220, 90, { v: 230, f: 50, rint: 0.25, imax: 5000 }, 'Red 230 V');
  add('IGA', 'switch', 180, 100, 0, { closed: true }, 'IGA (2 polos)');
  add('DIF', 'breaker', 300, 100, 0, { in: 40, curve: 1e6 }, 'Diferencial 30 mA');
  add('PIA', 'breaker', 420, 100, 0, { in: s.inA, curve: 10 }, `PIA ${s.inA} A`);
  add('LL', 'resistor', 540, 100, 0, { r: R, pmax: 1e9 }, `Fase ${s.length} m · ${String(s.section).replace('.', ',')} mm²`);
  add('JL', 'junction', 620, 100, 0);
  add('LN', 'resistor', 540, 400, 0, { r: R, pmax: 1e9 }, 'Neutro');
  add('IGAN', 'switch', 420, 400, 0, { closed: true }, 'IGA (neutro)');
  add('N0', 'junction', 260, 400, 0);
  add('GND', 'ground', 260, 480, 0, {}, 'Tierra');
  add('PE0', 'junction', 320, 540, 0, {}, 'Barra de tierra');
  add('JB1', 'junction', 660, 400, 0, {}, 'Caja');
  add('JB2', 'junction', 620, 400, 0);

  wire(['SRC', 0], ['IGA', 0]); wire(['IGA', 1], ['DIF', 0]); wire(['DIF', 1], ['PIA', 0]); wire(['PIA', 1], ['LL', 0]); wire(['LL', 1], ['JL', 0]);
  wire(['SRC', 1], ['N0', 0]); wire(['N0', 0], ['GND', 0]); wire(['N0', 0], ['IGAN', 0]); wire(['IGAN', 1], ['LN', 0]); wire(['LN', 1], ['JB2', 0]);
  if (!hasEffect(c, 'openN').length) wire(['JB2', 0], ['JB1', 0]);
  wire(['PE0', 0], ['GND', 0]);

  if (conm) {
    add('S1', 'spdt', 760, 180, 0, { pos: 0 }, 'Conmutador A');
    add('S2', 'spdt', 960, 180, 180, { pos: 0 }, 'Conmutador B');
    wire(['JL', 0], ['S1', 0]);
    wire(['S1', 1], ['S2', 2]);
    wire(['S1', 2], hasEffect(c, 'travelerTied').length ? ['S2', 2] : ['S2', 1]);
    wire(['S2', 0], ['H0', 0]);
  }
  s.recs.forEach((r, i) => {
    const x = xs(i);
    if (!conm) { add(`P${i}`, 'switch', x, 180, 90, { closed: true }, 'Enchufe'); wire(['JL', 0], [`P${i}`, 0]); wire([`P${i}`, 1], [`H${i}`, 0]); }
    add(`H${i}`, 'heater', x, 300, 90, { vn: 230, pn: r.w }, `${r.name} · ${r.w} W`);
    add(`NB${i}`, 'junction', x, 400, 0);
    add(`PE${i}`, 'junction', x, 540, 0, {}, 'Tierra');
    wire([`H${i}`, 1], [`NB${i}`, 0]); wire([`NB${i}`, 0], ['JB1', 0]);
    if (!hasEffect(c, 'openPE').some((e) => e.rec === i)) wire([`PE${i}`, 0], ['PE0', 0]);
    else { add(`XP${i}`, 'resistor', x + 60, 540, 0, { r: 3e8, pmax: 1e9 }, 'aislado', true); wire([`XP${i}`, 0], [`PE${i}`, 0]); wire([`XP${i}`, 1], ['PE0', 0]); } // un nudo sin ninguna conexión haría singular la matriz
    for (const e of hasEffect(c, 'leak')) if (e.rec === i) { add(`XL${i}`, 'resistor', x + 60, 300, 90, { r: e.ohms, pmax: 1e9 }, 'fuga', true); wire([`XL${i}`, 0], [`H${i}`, 0]); wire([`XL${i}`, 1], [`PE${i}`, 0]); }
    for (const e of hasEffect(c, 'short')) if (e.rec === i) { add(`XS${i}`, 'resistor', x + 60, 300, 90, { r: 0.01, pmax: 1e9 }, 'corto', true); wire([`XS${i}`, 0], [`H${i}`, 0]); wire([`XS${i}`, 1], [`H${i}`, 1]); }
  });
  void n;

  // Conserva los interruptores que el alumno ya había accionado
  if (prev) for (const cc of comps) {
    if (!SWITCH_IDS(cc)) continue;
    const old = prev.components.find((o) => o.id === cc.id);
    if (old) for (const k of ['closed', 'pos']) if (k in old.params && k in cc.params) cc.params[k] = old.params[k];
  }
  return { version: 1, name: `Parte de avería · ${s.circuitName}`, components: comps, wires };
}

/* ───────── Capa del juego: protecciones que el motor no modela ───────── */
const acI = (sim: SimResult, id: string) => (sim.ac ? cabs(sim.ac.compI[`${id}:0`] ?? cx()) : 0);
const acV = (sim: SimResult, id: string) => (sim.ac ? cabs(sim.ac.compV[id] ?? cx()) : 0);
export const currentOf = acI;
export const voltageOf = acV;

/** Disparos que el motor no calcula: térmico del magnetotérmico (sobrecarga) y diferencial por fuga. */
export function extraEvents(sim: SimResult, project: Project, runtime: Runtime): SimEvent[] {
  const ev: SimEvent[] = [];
  const pia = project.components.find((c) => c.id === 'PIA');
  if (pia && !runtime.PIA) {
    const In = Number(pia.params.in), I = acI(sim, 'PIA');
    if (I > RULES.thermalFactor * In) ev.push({ id: 'PIA', state: 'tripped', text: `El magnetotérmico ha disparado por sobrecarga (térmico): circulaban ${I.toFixed(1).replace('.', ',')} A y su calibre es ${In} A.` });
  }
  if (!runtime.DIF) {
    const leak = project.components.filter((c) => c.id.startsWith('XL')).reduce((a, c) => a + acI(sim, c.id), 0);
    if (leak >= RULES.rcdTripA) ev.push({ id: 'DIF', state: 'tripped', text: `El diferencial ha disparado: hay ${(leak * 1000).toFixed(0)} mA de fuga a tierra (el diferencial es de 30 mA).` });
  }
  return ev;
}

/** Estado de partida: deja disparadas las protecciones que dispararían de verdad. */
export function settle(project: Project, from: Runtime = {}): Runtime {
  const rt: Runtime = { ...from };
  for (let i = 0; i < 6; i++) {
    const sim = simulate(project, rt);
    const ev = [...sim.events, ...extraEvents(sim, project, rt)].filter((e) => !rt[e.id]);
    if (!ev.length) break;
    for (const e of ev) rt[e.id] = e.state;
  }
  return rt;
}

/* ───────── Comprobación final ───────── */
export interface Health { ok: boolean; problems: string[] }
const conmutadaWorks = (c: Case): boolean => {
  const base = buildProject(c);
  const lampOn = (a: number, b: number) => {
    const p = structuredClone(base);
    p.components.find((x) => x.id === 'S1')!.params.pos = a;
    p.components.find((x) => x.id === 'S2')!.params.pos = b;
    return voltageOf(simulate(p), 'H0') > 200;
  };
  const s00 = lampOn(0, 0);
  return lampOn(1, 0) !== s00 && lampOn(0, 1) !== s00 && lampOn(1, 1) === s00;
};

export function checkHealth(c: Case): Health {
  const problems: string[] = [];
  const s = c.setup;
  const project = buildProject(c);
  const rt = settle(project);
  if (Object.keys(rt).length) problems.push('Alguna protección sigue disparando.');
  const sim = simulate(project, rt);
  const Un = 230;
  s.recs.forEach((r, i) => {
    const v = voltageOf(sim, `H${i}`);
    if (!c.setup.conmutada && v < Un * RULES.minVoltagePct / 100) problems.push(`${r.name} no recibe tensión suficiente (${v.toFixed(0)} V).`);
  });
  const limit = s.circuit === 'C1' ? 3 : 5;
  const drop = ((voltageOf(sim, 'LL') + voltageOf(sim, 'LN')) / Un) * 100;
  if (drop > limit) problems.push(`Caída de tensión de ${drop.toFixed(1).replace('.', ',')} %: supera el ${limit} % admitido.`);
  const iz = admissible(s.section);
  const ib = acI(sim, 'LL');
  if (s.inA > iz) problems.push(`El magnetotérmico (${s.inA} A) es mayor que lo que admite el cable (${iz} A): no lo protege.`);
  if (ib > s.inA) problems.push('La corriente de servicio supera el calibre de la protección.');
  if (ib > iz) problems.push('El cable lleva más corriente de la que admite.');
  if (c.effects.length) problems.push('Se sigue notando la anomalía en la instalación.');
  if (s.conmutada && !conmutadaWorks(c)) problems.push('La luz no responde correctamente desde los dos conmutadores.');
  return { ok: problems.length === 0, problems };
}

/* ───────── Reparaciones sobre el caso ───────── */
export function applyRepair(c: Case, repair: string, target: string, param?: number): Case {
  const setup = { ...c.setup, recs: [...c.setup.recs] };
  let effects = [...c.effects];
  const idx = target.includes(':') ? Number(target.split(':')[1]) : -1;
  switch (repair) {
    case 'cambiar_pia': if (param) setup.inA = param; break;
    case 'cambiar_seccion': if (param) setup.section = param; break;
    case 'reapretar_borne': effects = effects.filter((e) => !(e.t === 'openN' && target === 'caja') && !(e.t === 'openPE' && e.rec === idx)); break;
    case 'sustituir_toma': effects = effects.filter((e) => !(e.t === 'short' && e.rec === idx)); break;
    case 'sustituir_receptor': effects = effects.filter((e) => !(e.t === 'leak' && e.rec === idx)); break;
    case 'recablear': effects = effects.filter((e) => e.t !== 'travelerTied'); break;
    case 'repartir_carga': setup.recs = setup.recs.filter((r) => !r.extra); break;
  }
  return { setup, effects };
}
