/**
 * Del cableado a la netlist del motor, y de los resultados a corrientes por cable.
 * Incluye los componentes no lineales (diodos) por iteración de estados y las protecciones/averías
 * (fusible, magnetotérmico, LED y lámpara que se funden) como estado de ejecución persistente.
 */
import type { Component, Project, TermRef } from './types';
import { defOf, fmt } from './library';
import { solveDC, type Element, type Problem, type Solution } from '../engine/dc';
import { solveAC, type AcProblem, abs as cabs, arg as carg, conj, mul, div as cdiv, cx, sub as csub, add as cadd, type AcElement, type Cx } from '../engine/ac';

export type RuntimeState = 'blown' | 'tripped' | 'burnt';
/** Estado de avería por componente (se conserva entre simulaciones hasta pulsar «Reponer»). */
export type Runtime = Record<string, RuntimeState>;

export interface SimEvent { id: string; state: RuntimeState; text: string }
export interface Live { v: number; i: number; p: number; on?: boolean; state?: RuntimeState; q?: number; s?: number; pf?: number }

/** Datos del análisis en régimen permanente senoidal (solo si hay una fuente de CA). */
export interface AcInfo {
  freq: number; omega: number;
  nodeV: Cx[]; // fasores eficaces por nudo
  compV: Record<string, Cx>; // V(terminal 0) − V(terminal 1)
  compI: Record<string, Cx>; // corriente que entra por el terminal 0
  problem: AcProblem; // para que los instrumentos añadan su propia carga
}

export interface SimResult {
  solution: Solution;
  problem: Problem;
  nodeOf: Record<string, number>;
  wireCurrent: Record<string, number>;
  /** Corriente que entra por cada terminal hacia dentro del componente */
  componentCurrent: Record<string, number>;
  /** Tensión entre terminales 1 y 2 de cada componente */
  componentVoltage: Record<string, number>;
  live: Record<string, Live>;
  ac?: AcInfo;
  messages: { level: 'error' | 'warn'; text: string; ids: string[] }[];
  /** Averías nuevas que el llamador debe anotar en el `runtime` */
  events: SimEvent[];
}

export const tkey = (t: TermRef) => `${t.comp}:${t.term}`;

// Resistencias de los estados "cerrado" y "abierto" (equilibrio entre exactitud y condicionamiento numérico)
const R_CLOSED = 1e-4;
const R_OPEN = 1e8;

/** Relés accionados en la simulación en curso (se recuerdan entre simulaciones: autorretención). */
let PULLED: Set<string> = new Set();
let ENERG: Set<string> = new Set();
let PULLED_B: Set<string> = new Set();
/** Reloj de la simulación (s) y estado de los temporizadores: lo avanza la interfaz. */
let NOW = 0;
export const setSimClock = (t: number) => { NOW = t; };
interface TState { since: number | null; act: boolean; offAt: number | null; trigAt: number | null; was: boolean; count: number }
const TSTATE = new Map<string, TState>();
const T0 = (): TState => ({ since: null, act: false, offAt: null, trigAt: null, was: false, count: 0 });
function timerEval(timer: { mode: 'on' | 'off' | 'pulse' | 'sd' | 'toggle' | 'count'; t: number }, e: boolean, st: TState, now: number): { a: boolean; b: boolean; next: TState } {
  const nx = { ...st }; let a = false, b = false;
  if (timer.mode === 'on') { if (e) { nx.since = st.since ?? now; a = now - nx.since >= timer.t; } else nx.since = null; }
  else if (timer.mode === 'off') { if (e) { nx.act = true; nx.offAt = null; } else if (st.act) { nx.offAt = st.offAt ?? now; if (now - nx.offAt >= timer.t) { nx.act = false; nx.offAt = null; } } a = nx.act; }
  else if (timer.mode === 'toggle') { if (e && !st.was) nx.act = !st.act; nx.was = e; a = nx.act; }
  else if (timer.mode === 'count') { if (e && !st.was) nx.count = st.count >= timer.t ? 0 : st.count + 1; nx.was = e; a = nx.count >= timer.t; }
  else if (timer.mode === 'pulse') { if (e && !st.was) nx.trigAt = now; nx.was = e; a = nx.trigAt !== null && now - nx.trigAt < timer.t; }
  else { if (e) { nx.since = st.since ?? now; const el = now - nx.since; a = el < timer.t; b = el >= timer.t + 0.1; } else nx.since = null; }
  return { a, b, next: nx };
}

type DState = 'off' | 'on' | 'zener';
interface Part { el: Element; ta: number; tb: number }

function partsOf(c: Component, nd: number[], rt: Runtime, ds: Map<string, DState>): Part[] {
  const m = defOf(c.type).model;
  const id = c.id;
  const R = (v: number, a = 0, b = 1, sid = id): Part => ({ el: { id: sid, kind: 'R', a: nd[a], b: nd[b], value: v }, ta: a, tb: b });
  const bad = rt[id] !== undefined;
  switch (m.kind) {
    case 'R': return [R(bad ? R_OPEN : Math.max(m.value(c.params), 1e-9))];
    case 'V': return bad ? [R(R_OPEN)] : [{ el: { id, kind: 'V', a: nd[0], b: nd[1], value: m.value(c.params), rint: m.rint(c.params) }, ta: 0, tb: 1 }];
    case 'I': return [{ el: { id, kind: 'I', a: nd[0], b: nd[1], value: m.value(c.params) }, ta: 0, tb: 1 }];
    case 'SW': return [R(m.closed(c.params) ? R_CLOSED : R_OPEN)];
    case 'OPEN': return [R(R_OPEN)];
    case 'ACV': return bad ? [R(R_OPEN)] : [{ el: { id, kind: 'V', a: nd[0], b: nd[1], value: 0, rint: m.rint(c.params) }, ta: 0, tb: 1 }];
    case 'FUSE': return [R(bad ? R_OPEN : 0.02)];
    case 'BREAKER': return [R(bad ? R_OPEN : 0.01)];
    case 'SPDT': {
      const up = m.pos(c.params) < 0.5;
      return [R(up ? R_CLOSED : R_OPEN, 0, 1, id + '#1'), R(up ? R_OPEN : R_CLOSED, 0, 2, id + '#2')];
    }
    case 'POT': {
      const r = m.r(c.params), pos = Math.min(1, Math.max(0, m.pos(c.params)));
      return [R(Math.max(r * pos, 1e-3), 0, 2, id + '#a'), R(Math.max(r * (1 - pos), 1e-3), 2, 1, id + '#b')];
    }
    case 'DIODE': {
      const st = bad ? 'off' : ds.get(id) ?? 'off';
      if (st === 'on') return [{ el: { id, kind: 'V', a: nd[0], b: nd[1], value: m.vf(c.params), rint: m.rd }, ta: 0, tb: 1 }];
      if (st === 'zener') return [{ el: { id, kind: 'V', a: nd[1], b: nd[0], value: m.vz!(c.params), rint: 0.5 }, ta: 1, tb: 0 }];
      return [R(R_OPEN)];
    }
    case 'RELAY': {
      const on = PULLED.has(id);
      const cp = m.follow ? 0 : m.phase ? 3 : 2;
      const out: Part[] = m.follow ? [] : m.phase ? [R(m.rc(c.params), 0, 1, id + '#coil'), R(m.rc(c.params), 1, 2, id + '#coil2'), R(m.rc(c.params), 2, 0, id + '#coil3')] : [R(m.rc(c.params), 0, 1, id + '#coil')];
      for (let j = 0; j < m.nNO + m.nNC; j++) { const no = j < m.nNO; const st = m.timer?.mode === 'sd' && j === 1 ? PULLED_B.has(id) : on; out.push(R(no === st ? R_CLOSED : R_OPEN, cp + 2 * j, cp + 1 + 2 * j, `${id}#k${j}`)); }
      return out;
    }
    case 'RCD': return Array.from({ length: m.poles }, (_, i) => R(!bad && m.closed(c.params) ? R_CLOSED : R_OPEN, 2 * i, 2 * i + 1, `${id}#${i}`));
    case 'XFMR': {
      if (m.mode === '1ph' || m.mode === 'tap') return [R(m.rdc(c.params), 0, 1, id + '#p'), R(m.rdc(c.params), 2, 3, id + '#s')];
      return [R(m.rdc(c.params), 0, 1, id + '#p')];
    }
    case 'LOAD3': {
      const out: Part[] = [];
      for (let k = 0; k < 3; k++) out.push(R(m.rdc(c.params), k, m.delta(c.params) ? (k + 1) % 3 : 3, `${id}#z${k}`));
      return out;
    }
    case 'GANG': return Array.from({ length: m.n }, (_, i) => R(m.closed(c.params, i) ? R_CLOSED : R_OPEN, 2 * i, 2 * i + 1, `${id}#${i}`));
    case 'CROSS': {
      const x = m.pos(c.params) >= 0.5;
      return [R(x ? R_OPEN : R_CLOSED, 0, 1, id + '#a'), R(x ? R_OPEN : R_CLOSED, 2, 3, id + '#b'), R(x ? R_CLOSED : R_OPEN, 0, 3, id + '#c'), R(x ? R_CLOSED : R_OPEN, 2, 1, id + '#d')];
    }
    case 'SEL': {
      const pos = Math.round(m.pos(c.params));
      return [R(pos === 0 ? R_CLOSED : R_OPEN, 0, 1, id + '#1'), R(pos === 2 ? R_CLOSED : R_OPEN, 0, 2, id + '#2')];
    }
    default: return [];
  }
}

interface AcResult { parts: Part[]; solution: Solution; info: AcInfo; warnings: string[] }

/** Régimen permanente senoidal: se convierte el resultado a magnitudes eficaces con el mismo formato que la CC. */
function solveAcMode(components: Component[], nodesOf: (c: Component) => number[], n: number, runtime: Runtime, src: Component[]): AcResult {
  const warnings: string[] = [];
  const freqs = [...new Set(src.map((c) => { const mm = defOf(c.type).model; return mm.kind === 'ACV' ? mm.f(c.params) : 50; }))];
  const freq = freqs[0];
  if (freqs.length > 1) warnings.push('Hay fuentes de CA con distinta frecuencia: se simula todo a ' + fmt(freq) + ' Hz (el análisis es monofrecuencia).');
  const omega = 2 * Math.PI * freq;
  const els: AcElement[] = [];
  const owner: { id: string; ta: number; tb: number }[] = [];
  let dcIgnored = false, nonlinear = false;
  let nn = n; const alloc = () => nn++;
  for (const c of components) {
    const nd = nodesOf(c);
    const m = defOf(c.type).model;
    const push = (e: AcElement, ta = 0, tb = 1) => { els.push(e); owner.push({ id: e.id, ta, tb }); };
    if (runtime[c.id]) push({ id: c.id, kind: 'Z', a: nd[0], b: nd[1], z: cx(1e8, 0) });
    else if (m.kind === 'ACV' && m.three) {
      const VL = m.v(c.params), star = m.three === 'star';
      const vph = star ? VL / Math.sqrt(3) : VL;
      const ri = star ? m.rint(c.params) : Math.max(0.01, m.rint(c.params));
      for (let k = 0; k < 3; k++) {
        const ang = (-120 * k * Math.PI) / 180;
        const b = star ? 3 : (k + 1) % 3;
        push({ id: k === 0 ? c.id : `${c.id}#p${k}`, kind: 'V', a: nd[k], b: nd[b], v: cx(vph * Math.cos(ang), vph * Math.sin(ang)), rint: ri }, k, b);
      }
    }
    else if (m.kind === 'XFMR') {
      const zc = m.zcc(c.params), nref = m.n(c.params);
      const T = (k: string, a: number, b: number, c2: number, d: number, nr: number, ta: number, tb: number) => { els.push({ id: `${c.id}#T${k}`, kind: 'T', a, b, c: c2, d, n: nr }); owner.push({ id: `${c.id}#T${k}#s`, ta, tb }); };
      const series = (k: string, from: number, ta: number, tb: number) => { const x = alloc(); push({ id: `${c.id}#zp${k}`, kind: 'Z', a: from, b: x, z: cx(Math.max(zc.r, 1e-6), zc.x) }, ta, tb); return x; };
      if (m.mode === '1ph') { const x = series('', nd[0], 0, 1); T('', x, nd[1], nd[2], nd[3], nref, 2, 3); }
      else if (m.mode === 'tap') { const x = series('', nd[0], 0, 1); T('1', x, nd[1], nd[2], nd[3], nref, 2, 3); T('2', x, nd[1], nd[3], nd[4], nref, 3, 4); }
      else if (m.mode === 'auto') { const x = series('', nd[0], 0, 2); T('', x, nd[1], nd[1], nd[2], Math.abs(nref - 1) < 1e-3 ? 1e-3 : nref - 1, 1, 2); }
      else {
        const np = m.pri === 'Y' ? 4 : 3, ns = m.sec === 'Y' ? 4 : 3;
        void ns;
        for (let k = 0; k < 3; k++) {
          const pEnd = m.pri === 'Y' ? 3 : (k + 1) % 3, sEnd = m.sec === 'Y' ? 3 : (k + 1) % 3;
          const x = series(String(k), nd[k], k, pEnd);
          T(String(k), x, nd[pEnd], nd[np + k], nd[np + sEnd], nref, np + k, np + sEnd);
        }
      }
    }
    else if (m.kind === 'LOAD3') {
      const zs = m.z(c.params, omega), dl = m.delta(c.params);
      const sp = nd.length > 3 ? nd[3] : alloc(); // punto neutro (interno si el aparato no tiene borne N)
      for (let k = 0; k < 3; k++) { const b = dl ? (k + 1) % 3 : 3; push({ id: `${c.id}#z${k}`, kind: 'Z', a: nd[k], b: dl ? nd[b] : sp, z: cx(zs[k].re, zs[k].im) }, k, nd.length > 3 || dl ? b : 0); }
    }
    else if (m.kind === 'ACV') push({ id: c.id, kind: 'V', a: nd[0], b: nd[1], v: cx(m.v(c.params), 0), rint: m.rint(c.params) });
    else if (defOf(c.type).acz) { const z = defOf(c.type).acz!(c.params, omega); push({ id: c.id, kind: 'Z', a: nd[0], b: nd[1], z: cx(z.re, z.im) }); }
    else if (m.kind === 'V') { dcIgnored = true; push({ id: c.id, kind: 'V', a: nd[0], b: nd[1], v: cx(0, 0), rint: m.rint(c.params) }); }
    else if (m.kind === 'I') dcIgnored = true;
    else if (m.kind === 'DIODE') nonlinear = true;
    if (m.kind === 'ACV' || m.kind === 'XFMR' || m.kind === 'LOAD3' || defOf(c.type).acz || m.kind === 'V' || m.kind === 'I') continue;
    for (const p of partsOf(c, nd, runtime, new Map())) {
      if (p.el.kind === 'R') { els.push({ id: p.el.id, kind: 'Z', a: p.el.a, b: p.el.b, z: cx(p.el.value, 0) }); owner.push({ id: p.el.id, ta: p.ta, tb: p.tb }); }
    }
  }
  if (dcIgnored) warnings.push('Hay pilas o fuentes de CC en un circuito de CA: se ignoran (se toman como 0 V). La mezcla CC + CA no está soportada.');
  if (nonlinear) warnings.push('Los diodos y LED no se simulan en CA (rectificación): llegan con el análisis transitorio. Aquí se comportan como circuito abierto.');
  const s = solveAC({ nodeCount: nn, elements: els });
  const solution: Solution = { ok: s.ok, voltages: s.nodeV.map(cabs), currents: {}, powers: {}, issues: [] };
  if (!s.ok) solution.issues.push({ code: 'singular', message: s.message ?? 'Error en el circuito de CA.', elementIds: [] });
  const refPh = s.ok && src[0] ? carg(s.current[src[0].id] ?? cx(1, 0)) + Math.PI : 0; // sentido de la corriente ENTREGADA
  const sign = (i: Cx) => (Math.cos(carg(i) - refPh) >= -1e-9 ? 1 : -1);
  const parts: Part[] = [];
  const compI: Record<string, Cx> = {}, compV: Record<string, Cx> = {};
  for (const o of owner) {
    const i = s.current[o.id] ?? cx();
    solution.currents[o.id] = cabs(i) * sign(i);
    const comp = o.id.split('#')[0];
    const el = els.find((e) => e.id === o.id);
    parts.push({ el: { id: o.id, kind: 'R', a: el?.a ?? 0, b: el?.b ?? 0, value: 1 }, ta: o.ta, tb: o.tb });
    compI[`${comp}:${o.ta}`] = cadd(compI[`${comp}:${o.ta}`] ?? cx(), i);
    compI[`${comp}:${o.tb}`] = csub(compI[`${comp}:${o.tb}`] ?? cx(), i);
  }
  for (const c of components) {
    const nd = nodesOf(c);
    if (nd.length >= 2) compV[c.id] = csub(s.nodeV[nd[0]] ?? cx(), s.nodeV[nd[1]] ?? cx());
  }
  return { parts, solution, info: { freq, omega, nodeV: s.nodeV, compV, compI, problem: { nodeCount: nn, elements: els } }, warnings };
}

/** Bloques de contactos auxiliares (siguen a un contactor) y enclavamientos mecánicos (impiden que cierren dos a la vez). */
function applyLinks(project: Project) {
  const coils = project.components.filter((c) => { const m = defOf(c.type).model; return m.kind === 'RELAY' && !m.follow; });
  const nth = (k: number) => coils[Math.max(0, Math.round(k) - 1)];
  for (const c of project.components) {
    const m = defOf(c.type).model;
    if (m.kind !== 'INTERLOCK') continue;
    const a = nth(m.a(c.params)), b = nth(m.b(c.params));
    if (a && b && PULLED.has(a.id) && PULLED.has(b.id)) PULLED.delete(b.id);
  }
  for (const c of project.components) {
    const m = defOf(c.type).model;
    if (m.kind === 'RELAY' && m.follow) { const t = nth(m.follow(c.params)); if (t && PULLED.has(t.id)) PULLED.add(c.id); }
  }
}

export function simulate(project: Project, runtime: Runtime = {}): SimResult {
  const relays = project.components.filter((c) => defOf(c.type).model.kind === 'RELAY');
  if (!relays.length) { PULLED = new Set(); PULLED_B = new Set(); ENERG = new Set(); return simulateCore(project, runtime); }
  const ids = new Set(relays.map((c) => c.id));
  ENERG = new Set([...ENERG].filter((i) => ids.has(i)));
  type RM = Extract<ReturnType<typeof defOf>['model'], { kind: 'RELAY' }>;
  const mOf = (c: (typeof relays)[number]) => defOf(c.type).model as RM;
  let res!: SimResult;
  for (let it = 0; it < 12; it++) {
    PULLED = new Set(); PULLED_B = new Set();
    for (const c of relays) {
      const m = mOf(c);
      if (m.timer) { const r = timerEval({ mode: m.timer.mode, t: m.timer.t(c.params) }, ENERG.has(c.id), TSTATE.get(c.id) ?? T0(), NOW); if (r.a) PULLED.add(c.id); if (r.b) PULLED_B.add(c.id); }
      else if (m.inv ? !ENERG.has(c.id) : ENERG.has(c.id)) PULLED.add(c.id);
    }
    applyLinks(project);
    res = simulateCore(project, runtime);
    const next = new Set<string>();
    for (const c of relays) {
      const m = mOf(c);
      if (m.follow) continue;
      let v = res.ac ? cabs(res.ac.compV[c.id] ?? cx()) : Math.abs(res.live[c.id]?.v ?? 0);
      if (m.phase && res.ac) { // relé de control de fases: la tensión «efectiva» es la menor de las tres líneas, 0 si la asimetría supera el 20 %
        const nv = (k: number) => res.ac!.nodeV[res.nodeOf[`${c.id}:${k}`]] ?? cx();
        const l = [cabs(csub(nv(0), nv(1))), cabs(csub(nv(1), nv(2))), cabs(csub(nv(2), nv(0)))];
        const mean = (l[0] + l[1] + l[2]) / 3; v = mean > 0 && Math.max(...l.map((x) => Math.abs(x - mean))) / mean <= 0.2 ? Math.min(...l) : 0;
      }
      if (ENERG.has(c.id) ? v >= m.drop(c.params) : v >= m.pickup(c.params)) next.add(c.id);
    }
    const same = next.size === ENERG.size && [...next].every((i) => ENERG.has(i));
    if (same) break;
    ENERG = next;
  }
  for (const c of relays) {
    const m = mOf(c);
    if (m.timer) { const r = timerEval({ mode: m.timer.mode, t: m.timer.t(c.params) }, ENERG.has(c.id), TSTATE.get(c.id) ?? T0(), NOW); TSTATE.set(c.id, r.next); }
    if (res.live[c.id]) res.live[c.id] = { ...res.live[c.id], on: PULLED.has(c.id) };
  }
  return res;
}

function simulateCore(project: Project, runtime: Runtime = {}): SimResult {
  const { components, wires } = project;
  // 1) union-find sobre terminales
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    if (!parent.has(x)) parent.set(x, x);
    const p = parent.get(x)!;
    if (p === x) return x;
    const r = find(p);
    parent.set(x, r);
    return r;
  };
  const union = (a: string, b: string) => parent.set(find(a), find(b));
  for (const c of components) defOf(c.type).terminals.forEach((_, i) => find(`${c.id}:${i}`));
  for (const w of wires) union(tkey(w.a), tkey(w.b));

  // 2) Nudo 0: cualquier masa; si no hay, el borne − de la primera pila.
  const groundRoots = new Set<string>();
  for (const c of components) if (defOf(c.type).model.kind === 'GND') groundRoots.add(find(`${c.id}:0`));
  let implicitGround = false;
  if (!groundRoots.size) {
    const bat = components.find((c) => ['V', 'ACV'].includes(defOf(c.type).model.kind));
    if (bat) { groundRoots.add(find(`${bat.id}:1`)); implicitGround = true; }
  }
  const first = [...groundRoots][0];
  for (const g of groundRoots) if (first) union(g, first);

  const nodeIndex = new Map<string, number>();
  let n = 1;
  const groundRoot = first ? find(first) : null;
  if (groundRoot) nodeIndex.set(groundRoot, 0);
  const nodeOf: Record<string, number> = {};
  for (const c of components)
    defOf(c.type).terminals.forEach((_, i) => {
      const r = find(`${c.id}:${i}`);
      if (!nodeIndex.has(r)) nodeIndex.set(r, n++);
      nodeOf[`${c.id}:${i}`] = nodeIndex.get(r)!;
    });
  const nodesOf = (c: Component) => defOf(c.type).terminals.map((_, i) => nodeOf[`${c.id}:${i}`]);

  // 3) Resolver (iterando estados de diodos)
  const ds = new Map<string, DState>();
  const acSrc = components.filter((c) => defOf(c.type).model.kind === 'ACV');
  const diodes = components.filter((c) => defOf(c.type).model.kind === 'DIODE' && !runtime[c.id]);
  let parts: Part[] = [];
  let solution!: Solution;
  let acInfo: AcInfo | undefined;
  let acWarnings: string[] = [];
  if (acSrc.length) {
    const r = solveAcMode(components, nodesOf, n, runtime, acSrc);
    parts = r.parts; solution = r.solution; acInfo = r.info; acWarnings = r.warnings;
  } else {
    for (let it = 0; it < 60; it++) {
      parts = components.flatMap((c) => partsOf(c, nodesOf(c), runtime, ds));
      solution = solveDC({ nodeCount: n, elements: parts.map((p) => p.el) });
      if (!solution.ok || !diodes.length) break;
      let changed = false;
      for (const c of diodes) {
        const m = defOf(c.type).model as Extract<ReturnType<typeof defOf>['model'], { kind: 'DIODE' }>;
        const nd = nodesOf(c);
        const vak = solution.voltages[nd[0]] - solution.voltages[nd[1]];
        const st = ds.get(c.id) ?? 'off';
        const i = solution.currents[c.id] ?? 0;
        let next: DState = st;
        if (st === 'off') {
          if (vak > m.vf(c.params) + 1e-9) next = 'on';
          else if (m.vz && -vak > m.vz(c.params) + 1e-9) next = 'zener';
        } else if (i < -1e-12) next = 'off';
        if (next !== st) { ds.set(c.id, next); changed = true; }
      }
      if (!changed) break;
    }

  }
  const elements = acInfo ? components.flatMap((c) => partsOf(c, nodesOf(c), runtime, new Map())).map((p) => p.el) : parts.map((p) => p.el);

  const messages: SimResult['messages'] = solution.issues.map((i) => ({
    level: i.code === 'floating' ? 'warn' : 'error', text: i.message,
    ids: [...new Set(i.elementIds.map((x) => x.split('#')[0]))],
  }));
  for (const w of acWarnings) messages.push({ level: 'warn', text: w, ids: [] });
  { const act = components.filter((c) => defOf(c.type).model.kind === 'TRAN'); if (act.length) messages.push({ level: 'warn', text: `Hay electrónica activa (${[...new Set(act.map((c) => defOf(c.type).name))].slice(0, 3).join(', ')}…): no se calcula en el estado estático. Usa el botón «Transitorio» para simular el circuito en el tiempo.`, ids: act.map((c) => c.id) }); }
  if (implicitGround) messages.push({ level: 'warn', text: 'No hay símbolo de masa: se toma como 0 V el borne − de la primera pila.', ids: [] });
  if (!elements.some((e) => e.kind === 'V' || e.kind === 'I') && components.length)
    messages.push({ level: 'warn', text: 'El circuito no tiene ninguna fuente: no circula corriente.', ids: [] });

  // 4) Magnitudes por componente
  const componentCurrent: Record<string, number> = {};
  const componentVoltage: Record<string, number> = {};
  const live: Record<string, Live> = {};
  const volt = (nd: number) => solution.voltages[nd] ?? 0;
  for (const p of parts) {
    const i = solution.currents[p.el.id] ?? 0;
    const owner = p.el.id.split('#')[0];
    componentCurrent[`${owner}:${p.ta}`] = (componentCurrent[`${owner}:${p.ta}`] ?? 0) + i;
    componentCurrent[`${owner}:${p.tb}`] = (componentCurrent[`${owner}:${p.tb}`] ?? 0) - i;
  }
  const events: SimEvent[] = [];
  // Fuente en cortocircuito (sin resistencia que limite): se quema
  if (!solution.ok) {
    const acShort = !!acInfo && components.some((c) => defOf(c.type).model.kind === 'ACV' && nodesOf(c)[0] === nodesOf(c)[1]);
    const bad = solution.issues.some((i) => i.code === 'short-source' || i.code === 'voltage-loop') || acShort;
    if (bad) for (const c of components) if (['V', 'ACV'].includes(defOf(c.type).model.kind) && !runtime[c.id])
      events.push({ id: c.id, state: 'burnt', text: `¡CORTOCIRCUITO! ${c.label || c.id} se ha quemado: sus bornes quedaron unidos sin ninguna resistencia que limite la corriente.` });
  }
  const nm = (c: Component) => c.label || (c.id.length <= 4 ? c.id : defOf(c.type).name);
  for (const c of components) {
    const def = defOf(c.type);
    const m = def.model;
    if (m.kind === 'GND' || m.kind === 'JUNCTION') continue;
    const nd = nodesOf(c);
    const v = volt(nd[0]) - volt(nd[1]);
    const i = componentCurrent[`${c.id}:0`] ?? 0;
    componentVoltage[c.id] = v;
    const rt = runtime[c.id];
    const p = Math.abs(v * i);
    live[c.id] = { v, i, p, on: ds.get(c.id) === 'on', state: rt };
    const mainI = Math.abs(i);

    if (rt) {
      const txt = rt === 'blown' ? 'fundido' : rt === 'tripped' ? 'disparado' : 'quemado';
      messages.push({ level: 'error', ids: [c.id], text: `${nm(c)} (${def.name}) está ${txt}: el circuito queda abierto. Busca y corrige la causa y pulsa «Reponer averías».` });
      continue;
    }
    if (m.kind === 'FUSE' && mainI > m.rating(c.params) * m.factor)
      events.push({ id: c.id, state: 'blown', text: `${nm(c)} se ha fundido: circulaban ${fmt(mainI)} A y su nominal es ${fmt(m.rating(c.params))} A.` });
    if (m.kind === 'BREAKER') {
      const In = m.rating(c.params);
      if (mainI > In * m.mag(c.params))
        events.push({ id: c.id, state: 'tripped', text: `${nm(c)} ha disparado (magnético): ${fmt(mainI)} A superan ${fmt(In * m.mag(c.params))} A.` });
      else if (mainI > In * 1.45)
        messages.push({ level: 'warn', ids: [c.id], text: `${nm(c)} soporta ${fmt(mainI)} A (>1,45·In): sobrecarga. En la realidad el térmico acabaría disparando.` });
    }
    if (m.kind === 'RCD') {
      let leak = 0;
      if (acInfo) { let sum = cx(); for (let k = 0; k < m.poles; k++) sum = cadd(sum, acInfo.compI[`${c.id}:${2 * k}`] ?? cx()); leak = cabs(sum); }
      else for (let k = 0; k < m.poles; k++) leak += componentCurrent[`${c.id}:${2 * k}`] ?? 0;
      leak = Math.abs(leak);
      const ina = m.ina(c.params) / 1000;
      if (m.closed(c.params) && leak > ina)
        events.push({ id: c.id, state: 'tripped', text: `${nm(c)} ha disparado (diferencial): la corriente de fuga es ${fmt(leak * 1000)} mA y su sensibilidad ${fmt(ina * 1000)} mA.` });
      else if (m.rating && m.mag) {
        const In = m.rating(c.params), mi = Math.abs(componentCurrent[`${c.id}:0`] ?? 0);
        if (mi > In * m.mag(c.params)) events.push({ id: c.id, state: 'tripped', text: `${nm(c)} ha disparado (magnético): ${fmt(mi)} A superan ${fmt(In * m.mag(c.params))} A.` });
      }
    }
    if (m.kind === 'DIODE' && m.imax && ds.get(c.id) === 'on' && mainI > m.imax(c.params))
      events.push({ id: c.id, state: 'burnt', text: `${nm(c)} se ha quemado: ${fmt(mainI * 1000)} mA superan su máximo de ${fmt(m.imax(c.params) * 1000)} mA. Falta una resistencia limitadora.` });
    if (defOf(c.type).sym === 'lamp' || c.type === 'lamp') if (p > Number(c.params.pn) * 1.5)
      events.push({ id: c.id, state: 'burnt', text: `${nm(c)} se ha fundido: recibía ${fmt(p)} W y su nominal es ${fmt(+c.params.pn)} W.` });
    if (c.type === 'resistor' && p > Number(c.params.pmax))
      messages.push({ level: 'warn', ids: [c.id], text: `${nm(c)} disipa ${fmt(p)} W y su potencia máxima es ${fmt(+c.params.pmax)} W: se sobrecalienta. Usa una de más vatios.` });
    if (m.kind === 'V' && mainI > 0) {
      const rint = m.rint(c.params);
      if (rint > 0 && mainI * rint > 0.6 * m.value(c.params) && mainI <= Number(c.params.imax ?? 30))
        messages.push({ level: 'warn', ids: [c.id], text: `La pila pierde más del 60 % de su tensión en su resistencia interna (${fmt(mainI * rint)} V).` });
    }
    if ((m.kind === 'V' || m.kind === 'ACV') && mainI > Number(c.params.imax ?? (m.kind === 'ACV' ? 100 : 30)))
      events.push({ id: c.id, state: 'burnt', text: `¡CORTOCIRCUITO! ${c.label || c.id} entrega ${fmt(mainI)} A y su máximo es ${fmt(Number(c.params.imax ?? (m.kind === 'ACV' ? 100 : 30)))} A: se ha quemado. Revisa el cableado y añade una protección (fusible o magnetotérmico).` });
  }
  // Si una protección va a actuar, la fuente no llega a quemarse (la protección corta antes)
  if (events.some((e) => e.state === 'blown' || e.state === 'tripped')) {
    const isSrc = (id: string) => ['V', 'ACV'].includes(defOf(components.find((c) => c.id === id)!.type).model.kind);
    for (let i = events.length - 1; i >= 0; i--) if (events[i].state === 'burnt' && isSrc(events[i].id)) events.splice(i, 1);
  }
  if (acInfo) {
    for (const c of components) {
      const V = acInfo.compV[c.id], I = acInfo.compI[`${c.id}:0`];
      if (!V || !I || !live[c.id]) continue;
      // En CA el módulo de la tensión del componente es el del fasor (no la resta de módulos de los nudos)
      const vm = cabs(V); const sg = live[c.id].v < -1e-9 ? -1 : 1;
      live[c.id] = { ...live[c.id], v: vm * sg }; componentVoltage[c.id] = vm * sg;
      const kk = defOf(c.type).model.kind;
      if (kk === 'LOAD3' || kk === 'XFMR') for (const key of Object.keys(acInfo.compI)) if (key.startsWith(`${c.id}:`)) componentCurrent[key] = cabs(acInfo.compI[key]);
      if (kk === 'LOAD3' || kk === 'XFMR') live[c.id] = { ...live[c.id], i: cabs(I) };
      let S = mul(V, conj(I)); // potencia compleja absorbida por el terminal 0 → 1
      if (defOf(c.type).model.kind === 'LOAD3') {
        S = cx();
        for (const e of acInfo.problem.elements) if (e.kind === 'Z' && e.id.startsWith(`${c.id}#z`)) { const dv = csub(acInfo.nodeV[e.a] ?? cx(), acInfo.nodeV[e.b] ?? cx()); S = cadd(S, cdiv(cx(cabs(dv) ** 2, 0), cx(e.z.re, -e.z.im))); }
      }
      const sAbs = cabs(S);
      live[c.id] = { ...live[c.id], p: Math.abs(S.re), q: S.im, s: sAbs, pf: sAbs > 1e-12 ? Math.abs(S.re) / sAbs : 1 };
    }
  }
  // Un circuito abierto con fuente (para avisar al alumno)
  const hasSource = components.some((c) => ['V', 'ACV'].includes(defOf(c.type).model.kind));
  if (solution.ok && hasSource && !messages.some((x) => x.level === 'error')) {
    const maxI = Math.max(0, ...components.filter((c) => ['V', 'ACV'].includes(defOf(c.type).model.kind)).map((c) => Math.abs(componentCurrent[`${c.id}:0`] ?? 0)));
    if (maxI < 1e-9) messages.push({ level: 'warn', ids: [], text: 'Circuito abierto: la pila no entrega corriente. Comprueba interruptores, fusibles y que el lazo esté cerrado.' });
  }

  // 5) Corriente por cable (árbol de expansión por red; con fasores en CA)
  const wireCurrent: Record<string, number> = {};
  const injection = (key: string): Cx => {
    if (acInfo) { const i = acInfo.compI[key]; return i ? cx(-i.re, -i.im) : cx(); }
    return cx(-(componentCurrent[key] ?? 0), 0);
  };
  const refPh = acInfo && acSrc[0] ? carg(acInfo.compI[`${acSrc[0].id}:0`] ?? cx(1, 0)) + Math.PI : 0;
  const finish = (i: Cx) => (acInfo ? cabs(i) * (Math.cos(carg(i) - refPh) >= -1e-9 ? 1 : -1) : i.re);
  const adj = new Map<string, { w: string; to: string; sign: number }[]>();
  for (const w of wires) {
    const ka = tkey(w.a), kb = tkey(w.b);
    if (!adj.has(ka)) adj.set(ka, []);
    if (!adj.has(kb)) adj.set(kb, []);
    adj.get(ka)!.push({ w: w.id, to: kb, sign: 1 });
    adj.get(kb)!.push({ w: w.id, to: ka, sign: -1 });
    wireCurrent[w.id] = 0;
  }
  const seen = new Set<string>();
  for (const start of adj.keys()) {
    if (seen.has(start)) continue;
    const order: string[] = [];
    const via = new Map<string, { w: string; from: string; sign: number }>();
    const stack = [start];
    seen.add(start);
    while (stack.length) {
      const u = stack.pop()!;
      order.push(u);
      for (const e of adj.get(u)!) {
        if (seen.has(e.to)) continue;
        seen.add(e.to);
        via.set(e.to, { w: e.w, from: u, sign: e.sign });
        stack.push(e.to);
      }
    }
    // Acumula inyecciones desde las hojas hacia la raíz
    const acc = new Map<string, Cx>(order.map((k) => [k, injection(k)]));
    for (let i = order.length - 1; i > 0; i--) {
      const k = order[i];
      const v = via.get(k)!;
      const s0 = acc.get(k)!; // corriente que el subárbol de k inyecta hacia la raíz
      wireCurrent[v.w] = finish(cx(-s0.re * v.sign, -s0.im * v.sign));
      acc.set(v.from, cadd(acc.get(v.from)!, s0));
    }
  }

  return { solution, problem: { nodeCount: n, elements }, nodeOf, wireCurrent, componentCurrent, componentVoltage, live, messages, events, ac: acInfo };
}

/** Posición absoluta de un terminal (aplica rotación). */
export function termPos(c: Component, term: number): { x: number; y: number } {
  const t = defOf(c.type).terminals[term];
  const r = (c.rot * Math.PI) / 180;
  const cos = Math.round(Math.cos(r)), sin = Math.round(Math.sin(r));
  return { x: c.x + t.x * cos - t.y * sin, y: c.y + t.x * sin + t.y * cos };
}
