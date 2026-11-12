/**
 * Análisis nodal modificado (MNA) en corriente continua.
 *
 * Convenio: el nudo 0 es la referencia (tierra/masa).
 * La corriente de un elemento es la que circula DENTRO de él del terminal `a` al `b`.
 * Por tanto una pila que entrega potencia (a = positivo) tiene corriente NEGATIVA.
 */
import { solveLinear } from './solver';

export type ElementKind = 'R' | 'V' | 'I';

export interface Element {
  id: string;
  kind: ElementKind;
  a: number; // nudo del terminal 1
  b: number; // nudo del terminal 2
  /** R: ohmios · V: voltios (a es el +) · I: amperios (de a hacia b por dentro del elemento) */
  value: number;
  /** Solo V: resistencia interna en serie (Ω). */
  rint?: number;
}

export interface Problem {
  nodeCount: number; // incluye el nudo 0
  elements: Element[];
}

export interface Issue {
  code: 'voltage-loop' | 'singular' | 'floating' | 'short-source';
  message: string; // en español, para el alumno
  elementIds: string[];
}

export interface Solution {
  ok: boolean;
  voltages: number[]; // por nudo
  currents: Record<string, number>; // por elemento
  powers: Record<string, number>; // P absorbida (W). Negativa = entrega
  issues: Issue[];
}

const R_MIN = 1e-9; // evita conductancias infinitas

export function solveDC(p: Problem): Solution {
  const issues: Issue[] = [];
  const empty: Solution = {
    ok: false, voltages: new Array(p.nodeCount).fill(0), currents: {}, powers: {}, issues,
  };

  // 1) Expandir fuentes con resistencia interna en V + R mediante un nudo interno.
  let nodes = p.nodeCount;
  const els: Element[] = [];
  const parent = new Map<string, string>(); // id sintético -> id real
  for (const e of p.elements) {
    if (e.kind === 'V' && (e.rint ?? 0) > 0) {
      const m = nodes++;
      els.push({ id: e.id, kind: 'V', a: e.a, b: m, value: e.value });
      const rid = e.id + '#rint';
      parent.set(rid, e.id);
      els.push({ id: rid, kind: 'R', a: m, b: e.b, value: e.rint! });
    } else els.push(e);
  }

  // 2) Diagnóstico: lazos de fuentes de tensión ideales.
  const uf = Array.from({ length: nodes }, (_, i) => i);
  const find = (x: number): number => (uf[x] === x ? x : (uf[x] = find(uf[x])));
  for (const e of els) {
    if (e.kind !== 'V') continue;
    const ra = find(e.a), rb = find(e.b);
    if (ra === rb) {
      const ids = els.filter((x) => x.kind === 'V').map((x) => x.id);
      issues.push({
        code: e.a === e.b ? 'short-source' : 'voltage-loop',
        message:
          e.a === e.b
            ? 'Una fuente de tensión ideal tiene sus dos bornes unidos por un cable: es un cortocircuito. Separa los bornes o añade una resistencia.'
            : 'Hay un lazo formado solo por fuentes de tensión ideales (o fuentes en paralelo con distinta tensión). Añade una resistencia interna o una resistencia en serie.',
        elementIds: ids,
      });
      return empty;
    }
    uf[ra] = rb;
  }

  // 3) Nudos sin camino conductor a tierra (flotantes): se fijan a 0 V con aviso.
  const cond = Array.from({ length: nodes }, (_, i) => i);
  const cf = (x: number): number => (cond[x] === x ? x : (cond[x] = cf(cond[x])));
  for (const e of els) if (e.kind !== 'I') cond[cf(e.a)] = cf(e.b);
  const floating = new Set<number>();
  for (let n = 1; n < nodes; n++) if (cf(n) !== cf(0)) floating.add(n);
  if (floating.size) {
    const ids = els.filter((e) => floating.has(e.a) || floating.has(e.b)).map((e) => parent.get(e.id) ?? e.id);
    issues.push({
      code: 'floating',
      message:
        'Una parte del circuito no está conectada a la referencia (tierra/masa): sus tensiones quedan indeterminadas. Conéctala con un cable o añade el símbolo de masa. Se muestra con 0 V.',
      elementIds: [...new Set(ids)],
    });
  }

  // 4) Montar el sistema. Incógnitas: tensiones de nudos 1..n-1 y corrientes de fuentes V.
  const vs = els.filter((e) => e.kind === 'V');
  const n = nodes - 1;
  const size = n + vs.length;
  const A: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
  const z: number[] = new Array(size).fill(0);
  const idx = (node: number) => node - 1; // nudo 0 no tiene fila

  for (const e of els) {
    if (e.kind === 'R') {
      const g = 1 / Math.max(Math.abs(e.value), R_MIN);
      if (e.a) A[idx(e.a)][idx(e.a)] += g;
      if (e.b) A[idx(e.b)][idx(e.b)] += g;
      if (e.a && e.b) {
        A[idx(e.a)][idx(e.b)] -= g;
        A[idx(e.b)][idx(e.a)] -= g;
      }
    } else if (e.kind === 'I') {
      if (e.a) z[idx(e.a)] -= e.value;
      if (e.b) z[idx(e.b)] += e.value;
    }
  }
  vs.forEach((e, k) => {
    const row = n + k;
    if (e.a) { A[idx(e.a)][row] += 1; A[row][idx(e.a)] += 1; }
    if (e.b) { A[idx(e.b)][row] -= 1; A[row][idx(e.b)] -= 1; }
    z[row] = e.value;
  });
  // Nudos flotantes: conductancia mínima a tierra para que la matriz sea regular.
  floating.forEach((f) => (A[idx(f)][idx(f)] += 1e-12));

  const x = solveLinear(A, z);
  if (!x) {
    issues.push({
      code: 'singular',
      message:
        'No se puede resolver el circuito: hay una fuente de corriente sin camino de retorno o una conexión incompatible. Revisa que cada fuente de corriente tenga una resistencia a la que alimentar.',
      elementIds: p.elements.map((e) => e.id),
    });
    return empty;
  }

  // 5) Resultados.
  const voltages = new Array<number>(nodes).fill(0);
  for (let i = 1; i < nodes; i++) voltages[i] = floating.has(i) ? 0 : x[idx(i)];
  const currents: Record<string, number> = {};
  const powers: Record<string, number> = {};
  const vOf = (nd: number) => voltages[nd];
  els.forEach((e) => {
    let i = 0;
    if (e.kind === 'R') i = (vOf(e.a) - vOf(e.b)) / Math.max(Math.abs(e.value), R_MIN);
    else if (e.kind === 'I') i = e.value;
    else i = x[n + vs.indexOf(e)];
    currents[e.id] = i;
  });
  for (const e of p.elements) {
    const real = els.find((x) => x.id === e.id)!;
    const i = currents[e.id];
    // Para pilas con rint, el elemento "visible" va de e.a a e.b originales.
    const vab = voltages[e.a] - voltages[e.b];
    void real;
    powers[e.id] = vab * i;
  }
  return { ok: true, voltages: voltages.slice(0, p.nodeCount), currents, powers, issues };
}
