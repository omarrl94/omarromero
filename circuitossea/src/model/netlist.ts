/**
 * Del cableado a la netlist del motor, y de los resultados a corrientes por cable.
 * Incluye los componentes no lineales (diodos) por iteración de estados y las protecciones/averías
 * (fusible, magnetotérmico, LED y lámpara que se funden) como estado de ejecución persistente.
 */
import type { Component, Project, TermRef } from './types';
import { defOf, fmt } from './library';
import { solveDC, type Element, type Problem, type Solution } from '../engine/dc';

export type RuntimeState = 'blown' | 'tripped' | 'burnt';
/** Estado de avería por componente (se conserva entre simulaciones hasta pulsar «Reponer»). */
export type Runtime = Record<string, RuntimeState>;

export interface SimEvent { id: string; state: RuntimeState; text: string }
export interface Live { v: number; i: number; p: number; on?: boolean; state?: RuntimeState }

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
  messages: { level: 'error' | 'warn'; text: string; ids: string[] }[];
  /** Averías nuevas que el llamador debe anotar en el `runtime` */
  events: SimEvent[];
}

export const tkey = (t: TermRef) => `${t.comp}:${t.term}`;

// Resistencias de los estados "cerrado" y "abierto" (equilibrio entre exactitud y condicionamiento numérico)
const R_CLOSED = 1e-4;
const R_OPEN = 1e8;

type DState = 'off' | 'on' | 'zener';
interface Part { el: Element; ta: number; tb: number }

function partsOf(c: Component, nd: number[], rt: Runtime, ds: Map<string, DState>): Part[] {
  const m = defOf(c.type).model;
  const id = c.id;
  const R = (v: number, a = 0, b = 1, sid = id): Part => ({ el: { id: sid, kind: 'R', a: nd[a], b: nd[b], value: v }, ta: a, tb: b });
  const bad = rt[id] !== undefined;
  switch (m.kind) {
    case 'R': return [R(bad ? R_OPEN : Math.max(m.value(c.params), 1e-9))];
    case 'V': return [{ el: { id, kind: 'V', a: nd[0], b: nd[1], value: m.value(c.params), rint: m.rint(c.params) }, ta: 0, tb: 1 }];
    case 'I': return [{ el: { id, kind: 'I', a: nd[0], b: nd[1], value: m.value(c.params) }, ta: 0, tb: 1 }];
    case 'SW': return [R(m.closed(c.params) ? R_CLOSED : R_OPEN)];
    case 'OPEN': return [R(R_OPEN)];
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
    default: return [];
  }
}

export function simulate(project: Project, runtime: Runtime = {}): SimResult {
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
    const bat = components.find((c) => defOf(c.type).model.kind === 'V');
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
  const diodes = components.filter((c) => defOf(c.type).model.kind === 'DIODE' && !runtime[c.id]);
  let parts: Part[] = [];
  let solution!: Solution;
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
  const elements = parts.map((p) => p.el);

  const messages: SimResult['messages'] = solution.issues.map((i) => ({
    level: i.code === 'floating' ? 'warn' : 'error', text: i.message,
    ids: [...new Set(i.elementIds.map((x) => x.split('#')[0]))],
  }));
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
    if (m.kind === 'DIODE' && m.imax && ds.get(c.id) === 'on' && mainI > m.imax(c.params))
      events.push({ id: c.id, state: 'burnt', text: `${nm(c)} se ha quemado: ${fmt(mainI * 1000)} mA superan su máximo de ${fmt(m.imax(c.params) * 1000)} mA. Falta una resistencia limitadora.` });
    if (c.type === 'lamp' && p > Number(c.params.pn) * 1.5)
      events.push({ id: c.id, state: 'burnt', text: `${nm(c)} se ha fundido: recibía ${fmt(p)} W y su nominal es ${fmt(+c.params.pn)} W.` });
    if (c.type === 'resistor' && p > Number(c.params.pmax))
      messages.push({ level: 'warn', ids: [c.id], text: `${nm(c)} disipa ${fmt(p)} W y su potencia máxima es ${fmt(+c.params.pmax)} W: se sobrecalienta. Usa una de más vatios.` });
    if (m.kind === 'V' && mainI > 0) {
      const rint = m.rint(c.params);
      if (rint > 0 && mainI * rint > 0.6 * m.value(c.params))
        messages.push({ level: 'warn', ids: [c.id], text: `La pila pierde más del 60 % de su tensión en su resistencia interna (${fmt(mainI * rint)} V).` });
      if (rint === 0 && mainI > 100)
        messages.push({ level: 'error', ids: [c.id], text: 'Cortocircuito: la pila ideal alimenta una resistencia casi nula. Añade una carga en serie.' });
    }
  }
  // Un circuito abierto con fuente (para avisar al alumno)
  const hasSource = components.some((c) => defOf(c.type).model.kind === 'V');
  if (solution.ok && hasSource && !messages.some((x) => x.level === 'error')) {
    const maxI = Math.max(0, ...components.filter((c) => defOf(c.type).model.kind === 'V').map((c) => Math.abs(componentCurrent[`${c.id}:0`] ?? 0)));
    if (maxI < 1e-9) messages.push({ level: 'warn', ids: [], text: 'Circuito abierto: la pila no entrega corriente. Comprueba interruptores, fusibles y que el lazo esté cerrado.' });
  }

  // 5) Corriente por cable (árbol de expansión por red)
  const wireCurrent: Record<string, number> = {};
  const injection = (key: string) => -(componentCurrent[key] ?? 0); // hacia la red
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
    // DFS iterativo -> orden y padres
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
    const sub = new Map<string, number>(order.map((k) => [k, injection(k)]));
    for (let i = order.length - 1; i > 0; i--) {
      const k = order[i];
      const v = via.get(k)!;
      const s = sub.get(k)!; // corriente que el subárbol de k inyecta hacia la raíz
      // Cable del padre (from) hacia k lleva -s hacia k. `sign` indica si a=from.
      wireCurrent[v.w] = -s * v.sign;
      sub.set(v.from, sub.get(v.from)! + s);
    }
  }

  return { solution, problem: { nodeCount: n, elements }, nodeOf, wireCurrent, componentCurrent, componentVoltage, live, messages, events };
}

/** Posición absoluta de un terminal (aplica rotación). */
export function termPos(c: Component, term: number): { x: number; y: number } {
  const t = defOf(c.type).terminals[term];
  const r = (c.rot * Math.PI) / 180;
  const cos = Math.round(Math.cos(r)), sin = Math.round(Math.sin(r));
  return { x: c.x + t.x * cos - t.y * sin, y: c.y + t.x * sin + t.y * cos };
}
