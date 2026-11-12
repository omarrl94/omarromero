/**
 * Del cableado a la netlist del motor, y de los resultados a corrientes por cable.
 */
import type { Component, Project, TermRef } from './types';
import { defOf } from './library';
import { solveDC, type Element, type Solution } from '../engine/dc';

export interface SimResult {
  solution: Solution;
  /** Nudo de cada terminal "comp:term" */
  nodeOf: Record<string, number>;
  /** Corriente en cada cable (A), positiva de `a` hacia `b` */
  wireCurrent: Record<string, number>;
  /** Corriente que entra por cada terminal del componente hacia dentro del componente */
  componentCurrent: Record<string, number>;
  /** Tensión entre terminales 1 y 2 de cada componente */
  componentVoltage: Record<string, number>;
  /** Avisos / errores ya traducidos a mensajes con id de componente asociado */
  messages: { level: 'error' | 'warn'; text: string; ids: string[] }[];
}

export const tkey = (t: TermRef) => `${t.comp}:${t.term}`;

export function simulate(project: Project): SimResult {
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

  // 2) El nudo 0 es el de cualquier masa; si no hay, el del borne − de la primera pila.
  const groundRoots = new Set<string>();
  for (const c of components) if (defOf(c.type).model.kind === 'GND') groundRoots.add(find(`${c.id}:0`));
  let implicitGround = false;
  if (!groundRoots.size) {
    const bat = components.find((c) => defOf(c.type).model.kind === 'V');
    if (bat) { groundRoots.add(find(`${bat.id}:1`)); implicitGround = true; }
  }
  // Varias masas se funden en un solo nudo 0
  const first = [...groundRoots][0];
  for (const g of groundRoots) if (first) union(g, first);

  const nodeIndex = new Map<string, number>();
  let n = 1;
  const groundRoot = first ? find(first) : null;
  if (groundRoot) nodeIndex.set(groundRoot, 0);
  const nodeOfTerm = (c: string, t: number) => {
    const r = find(`${c}:${t}`);
    if (!nodeIndex.has(r)) nodeIndex.set(r, n++);
    return nodeIndex.get(r)!;
  };
  if (!groundRoot) n = 1;
  const nodeOf: Record<string, number> = {};
  for (const c of components) defOf(c.type).terminals.forEach((_, i) => (nodeOf[`${c.id}:${i}`] = nodeOfTerm(c.id, i)));
  if (!groundRoot) {
    // Sin fuentes: el nudo 0 es arbitrario; reservamos el índice 0.
    for (const k of Object.keys(nodeOf)) nodeOf[k] = nodeOf[k]; // todos >=1; nudo 0 sin usar
  }

  // 3) Elementos del motor
  const elements: Element[] = [];
  const byId = new Map<string, Component>();
  for (const c of components) {
    byId.set(c.id, c);
    const m = defOf(c.type).model;
    const a = nodeOf[`${c.id}:0`], b = nodeOf[`${c.id}:1`];
    if (m.kind === 'R') elements.push({ id: c.id, kind: 'R', a, b, value: m.value(c.params) });
    else if (m.kind === 'V') elements.push({ id: c.id, kind: 'V', a, b, value: m.value(c.params), rint: m.rint(c.params) });
    else if (m.kind === 'I') elements.push({ id: c.id, kind: 'I', a, b, value: m.value(c.params) });
    else if (m.kind === 'SW') elements.push({ id: c.id, kind: 'R', a, b, value: c.params.closed ? 1e-6 : 1e12 });
  }
  const solution = solveDC({ nodeCount: n, elements });

  const messages: SimResult['messages'] = solution.issues.map((i) => ({
    level: i.code === 'floating' ? 'warn' : 'error', text: i.message, ids: i.elementIds,
  }));
  if (implicitGround) messages.push({ level: 'warn', text: 'No hay símbolo de masa: se toma como 0 V el borne − de la primera pila.', ids: [] });
  if (!elements.some((e) => e.kind === 'V' || e.kind === 'I') && components.length)
    messages.push({ level: 'warn', text: 'El circuito no tiene ninguna fuente: no circula corriente.', ids: [] });

  // 4) Magnitudes por componente
  const componentCurrent: Record<string, number> = {};
  const componentVoltage: Record<string, number> = {};
  for (const c of components) {
    const m = defOf(c.type).model;
    if (m.kind === 'GND' || m.kind === 'JUNCTION') continue;
    const i = solution.currents[c.id] ?? 0;
    componentCurrent[`${c.id}:0`] = i; // entra por terminal 0
    componentCurrent[`${c.id}:1`] = -i;
    const va = solution.voltages[nodeOf[`${c.id}:0`]] ?? 0, vb = solution.voltages[nodeOf[`${c.id}:1`]] ?? 0;
    componentVoltage[c.id] = va - vb;
    if (m.kind === 'R' && c.type === 'lamp') {
      const p = (va - vb) ** 2 / m.value(c.params);
      if (p > Number(c.params.pn) * 1.5)
        messages.push({ level: 'warn', text: `La lámpara recibe ${p.toFixed(1).replace('.', ',')} W y su nominal es ${c.params.pn} W: se fundiría. Reduce la tensión.`, ids: [c.id] });
    }
    if (m.kind === 'V' && Math.abs(i) > 0) {
      const rint = m.rint(c.params);
      if (rint > 0 && Math.abs(i) * rint > 0.6 * m.value(c.params))
        messages.push({ level: 'warn', text: `La pila pierde más del 60 % de su tensión en su resistencia interna (${(Math.abs(i) * rint).toFixed(2).replace('.', ',')} V).`, ids: [c.id] });
    }
  }
  if (solution.ok) {
    for (const c of components) {
      const m = defOf(c.type).model;
      if (m.kind === 'V' && c.params.rint === 0) {
        const i = Math.abs(solution.currents[c.id] ?? 0);
        if (i > 100) messages.push({ level: 'error', text: 'Cortocircuito: la pila ideal alimenta una resistencia casi nula. Añade una carga en serie.', ids: [c.id] });
      }
    }
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

  return { solution, nodeOf, wireCurrent, componentCurrent, componentVoltage, messages };
}

/** Posición absoluta de un terminal (aplica rotación). */
export function termPos(c: Component, term: number): { x: number; y: number } {
  const t = defOf(c.type).terminals[term];
  const r = (c.rot * Math.PI) / 180;
  const cos = Math.round(Math.cos(r)), sin = Math.round(Math.sin(r));
  return { x: c.x + t.x * cos - t.y * sin, y: c.y + t.x * sin + t.y * cos };
}
