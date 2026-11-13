/**
 * Análisis en régimen permanente senoidal con fasores (impedancias complejas), por MNA.
 * Los fasores se expresan en valor EFICAZ (RMS). Módulo puro.
 * Convenio de corriente igual que en dc.ts: dentro del elemento, de `a` a `b`.
 */
export interface Cx { re: number; im: number }
export const cx = (re = 0, im = 0): Cx => ({ re, im });
export const add = (a: Cx, b: Cx): Cx => ({ re: a.re + b.re, im: a.im + b.im });
export const sub = (a: Cx, b: Cx): Cx => ({ re: a.re - b.re, im: a.im - b.im });
export const mul = (a: Cx, b: Cx): Cx => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
export const conj = (a: Cx): Cx => ({ re: a.re, im: -a.im });
export const abs = (a: Cx) => Math.hypot(a.re, a.im);
export const arg = (a: Cx) => Math.atan2(a.im, a.re);
export const div = (a: Cx, b: Cx): Cx => {
  const d = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};

export type AcElement =
  | { id: string; kind: 'Z'; a: number; b: number; z: Cx } // impedancia
  | { id: string; kind: 'V'; a: number; b: number; v: Cx; rint?: number } // fuente (a = +)
  | { id: string; kind: 'I'; a: number; b: number; i: Cx }
  | { id: string; kind: 'T'; a: number; b: number; c: number; d: number; n: number }; // transformador ideal: V(a,b) = n·V(c,d), n·I(a→b) + I(c→d) = 0 (aislado: no une los dos lados)

export interface AcProblem { nodeCount: number; elements: AcElement[] }
export interface AcSolution {
  ok: boolean;
  nodeV: Cx[];
  current: Record<string, Cx>; // por elemento, de a → b
  message?: string;
}

function solveComplex(A: Cx[][], z: Cx[]): Cx[] | null {
  const n = z.length;
  const M = A.map((r, i) => [...r.map((c) => ({ ...c })), { ...z[i] }]);
  let scale = 0;
  for (const r of A) for (const c of r) scale = Math.max(scale, abs(c));
  const tol = Math.max(scale, 1) * 1e-13;
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (abs(M[r][col]) > abs(M[piv][col])) piv = r;
    if (abs(M[piv][col]) < tol) return null;
    [M[piv], M[col]] = [M[col], M[piv]];
    for (let r = col + 1; r < n; r++) {
      const f = div(M[r][col], M[col][col]);
      if (f.re === 0 && f.im === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] = sub(M[r][c], mul(f, M[col][c]));
    }
  }
  const x = new Array<Cx>(n).fill(cx());
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let c = i + 1; c < n; c++) s = sub(s, mul(M[i][c], x[c]));
    x[i] = div(s, M[i][i]);
  }
  return x;
}

export function solveAC(p: AcProblem): AcSolution {
  const fail = (message: string): AcSolution => ({ ok: false, nodeV: new Array(p.nodeCount).fill(cx()), current: {}, message });
  let nodes = p.nodeCount;
  const els: AcElement[] = [];
  for (const e of p.elements) {
    if (e.kind === 'V' && (e.rint ?? 0) > 0) {
      const m = nodes++;
      els.push({ id: e.id, kind: 'V', a: e.a, b: m, v: e.v });
      els.push({ id: e.id + '#rint', kind: 'Z', a: m, b: e.b, z: cx(e.rint!, 0) });
    } else els.push(e);
  }
  // Nudos sin camino a tierra: se fijan a 0 con gmin
  const cond = Array.from({ length: nodes }, (_, i) => i);
  const f = (x: number): number => (cond[x] === x ? x : (cond[x] = f(cond[x])));
  for (const e of els) if (e.kind !== 'I' && e.kind !== 'T') cond[f(e.a)] = f(e.b);
  for (const e of els) if (e.kind === 'T') { cond[f(e.a)] = f(e.b); cond[f(e.c)] = f(e.d); }
  const n = nodes - 1;
  const vs = els.filter((e) => e.kind === 'V');
  const ts = els.filter((e) => e.kind === 'T');
  const size = n + vs.length + 2 * ts.length;
  const A: Cx[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => cx()));
  const z: Cx[] = Array.from({ length: size }, () => cx());
  const ix = (k: number) => k - 1;
  for (const e of els) {
    if (e.kind === 'Z') {
      const y = div(cx(1), e.z.re === 0 && e.z.im === 0 ? cx(1e-9) : e.z);
      if (e.a) A[ix(e.a)][ix(e.a)] = add(A[ix(e.a)][ix(e.a)], y);
      if (e.b) A[ix(e.b)][ix(e.b)] = add(A[ix(e.b)][ix(e.b)], y);
      if (e.a && e.b) {
        A[ix(e.a)][ix(e.b)] = sub(A[ix(e.a)][ix(e.b)], y);
        A[ix(e.b)][ix(e.a)] = sub(A[ix(e.b)][ix(e.a)], y);
      }
    } else if (e.kind === 'I') {
      if (e.a) z[ix(e.a)] = sub(z[ix(e.a)], e.i);
      if (e.b) z[ix(e.b)] = add(z[ix(e.b)], e.i);
    }
  }
  vs.forEach((e, k) => {
    const row = n + k;
    if (e.kind !== 'V') return;
    if (e.a) { A[ix(e.a)][row] = add(A[ix(e.a)][row], cx(1)); A[row][ix(e.a)] = add(A[row][ix(e.a)], cx(1)); }
    if (e.b) { A[ix(e.b)][row] = sub(A[ix(e.b)][row], cx(1)); A[row][ix(e.b)] = sub(A[row][ix(e.b)], cx(1)); }
    z[row] = e.v;
  });
  ts.forEach((e, k) => {
    if (e.kind !== 'T') return;
    const r1 = n + vs.length + 2 * k, r2 = r1 + 1;
    const stamp = (node: number, col: number, v: number) => { if (node) A[ix(node)][col] = add(A[ix(node)][col], cx(v)); };
    stamp(e.a, r1, 1); stamp(e.b, r1, -1); stamp(e.c, r2, 1); stamp(e.d, r2, -1);
    const row = (node: number, v: number) => { if (node) A[r1][ix(node)] = add(A[r1][ix(node)], cx(v)); };
    row(e.a, 1); row(e.b, -1); row(e.c, -e.n); row(e.d, e.n);
    A[r2][r1] = cx(e.n); A[r2][r2] = cx(1);
  });
  for (let k = 1; k < nodes; k++) if (f(k) !== f(0)) A[ix(k)][ix(k)] = add(A[ix(k)][ix(k)], cx(1e-6));
  const x = solveComplex(A, z);
  if (!x) return fail('No se puede resolver el circuito de CA: revisa lazos de fuentes de tensión o fuentes de corriente sin retorno.');
  const nodeV: Cx[] = [cx(), ...Array.from({ length: nodes - 1 }, (_, i) => (f(i + 1) !== f(0) ? cx() : x[i]))];
  const current: Record<string, Cx> = {};
  for (const e of els) {
    if (e.kind === 'Z') current[e.id] = div(sub(nodeV[e.a], nodeV[e.b]), e.z.re === 0 && e.z.im === 0 ? cx(1e-9) : e.z);
    else if (e.kind === 'I') current[e.id] = e.i;
    else if (e.kind === 'T') { const k = ts.indexOf(e); current[e.id] = x[n + vs.length + 2 * k]; current[e.id + '#s'] = x[n + vs.length + 2 * k + 1]; }
    else current[e.id] = x[n + vs.indexOf(e)];
  }
  return { ok: true, nodeV: nodeV.slice(0, p.nodeCount), current, };
}
