/**
 * Del cableado a la netlist del motor, y de los resultados a corrientes por cable.
 * Incluye los componentes no lineales (diodos) por iteración de estados y las protecciones/averías
 * (fusible, magnetotérmico, LED y lámpara que se funden) como estado de ejecución persistente.
 */
import type { Component, Project, TermRef } from './types';
import { defOf, fmt } from './library';
import { solveDC, type Element, type Problem, type Solution } from '../engine/dc';
import { solveAC, type AcProblem, abs as cabs, arg as carg, conj, mul, cx, sub as csub, add as cadd, type AcElement, type Cx } from '../engine/ac';

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
  for (const c of components) {
    const nd = nodesOf(c);
    const m = defOf(c.type).model;
    const push = (e: AcElement, ta = 0, tb = 1) => { els.push(e); owner.push({ id: e.id, ta, tb }); };
    if (runtime[c.id]) push({ id: c.id, kind: 'Z', a: nd[0], b: nd[1], z: cx(1e8, 0) });
    else if (m.kind === 'ACV') push({ id: c.id, kind: 'V', a: nd[0], b: nd[1], v: cx(m.v(c.params), 0), rint: m.rint(c.params) });
    else if (defOf(c.type).acz) { const z = defOf(c.type).acz!(c.params, omega); push({ id: c.id, kind: 'Z', a: nd[0], b: nd[1], z: cx(z.re, z.im) }); }
    else if (m.kind === 'V') { dcIgnored = true; push({ id: c.id, kind: 'V', a: nd[0], b: nd[1], v: cx(0, 0), rint: m.rint(c.params) }); }
    else if (m.kind === 'I') dcIgnored = true;
    else if (m.kind === 'DIODE') nonlinear = true;
    if (m.kind === 'ACV' || defOf(c.type).acz || m.kind === 'V' || m.kind === 'I') continue;
    for (const p of partsOf(c, nd, runtime, new Map())) {
      if (p.el.kind === 'R') { els.push({ id: p.el.id, kind: 'Z', a: p.el.a, b: p.el.b, z: cx(p.el.value, 0) }); owner.push({ id: p.el.id, ta: p.ta, tb: p.tb }); }
    }
  }
  if (dcIgnored) warnings.push('Hay pilas o fuentes de CC en un circuito de CA: se ignoran (se toman como 0 V). La mezcla CC + CA no está soportada.');
  if (nonlinear) warnings.push('Los diodos y LED no se simulan en CA (rectificación): llegan con el análisis transitorio. Aquí se comportan como circuito abierto.');
  const s = solveAC({ nodeCount: n, elements: els });
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
    const el = els.find((e) => e.id === o.id)!;
    parts.push({ el: { id: o.id, kind: 'R', a: el.a, b: el.b, value: 1 }, ta: o.ta, tb: o.tb });
    compI[`${comp}:${o.ta}`] = cadd(compI[`${comp}:${o.ta}`] ?? cx(), i);
    compI[`${comp}:${o.tb}`] = csub(compI[`${comp}:${o.tb}`] ?? cx(), i);
  }
  for (const c of components) {
    const nd = nodesOf(c);
    if (nd.length >= 2) compV[c.id] = csub(s.nodeV[nd[0]] ?? cx(), s.nodeV[nd[1]] ?? cx());
  }
  return { parts, solution, info: { freq, omega, nodeV: s.nodeV, compV, compI, problem: { nodeCount: n, elements: els } }, warnings };
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
      const S = mul(V, conj(I)); // potencia compleja absorbida por el terminal 0 → 1
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
