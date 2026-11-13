/**
 * Análisis transitorio (en el tiempo) por MNA con Newton–Raphson y Euler implícito.
 * Admite R, C, L, fuentes con forma de onda, diodos, BJT, MOSFET, amplificador operacional, interruptores con estado
 * y fuentes «de comportamiento» (555, puertas, biestables, reguladores, convertidores…) que leen el paso anterior.
 * Módulo puro: nudo 0 = masa.
 */
export type Wave = (t: number) => number;
export type Read = (node: number) => number;
export type TEl =
  | { k: 'R'; a: number; b: number; r: number }
  | { k: 'RT'; a: number; b: number; r: (t: number) => number } // resistencia variable en el tiempo
  | { k: 'C'; a: number; b: number; c: number; v0?: number }
  | { k: 'L'; a: number; b: number; l: number; r?: number }
  | { k: 'V'; a: number; b: number; w: Wave } // a = polo +
  | { k: 'I'; a: number; b: number; w: Wave } // corriente de a → b por la fuente
  | { k: 'D'; a: number; b: number; is?: number; n?: number; vz?: number }
  | { k: 'Q'; c: number; b: number; e: number; pnp?: boolean; bf?: number; br?: number; is?: number }
  | { k: 'M'; d: number; g: number; s: number; pch?: boolean; kp?: number; vt?: number; lam?: number }
  | { k: 'OA'; p: number; n: number; o: number; vp: number; vn: number; vpv?: number; vnv?: number; gain?: number; rout?: number; head?: number }
  | { k: 'SW'; a: number; b: number; on: (t: number, vab: number, iab: number, read: Read) => boolean; ron?: number; roff?: number }
  | { k: 'B'; o: number; ref: number; f: (read: Read, t: number, dt: number) => number; rout?: number }
  | { k: 'BI'; a: number; b: number; f: (read: Read, t: number, dt: number) => number };

export interface TranOptions { tEnd: number; dt: number; every?: number }
export interface TranResult { ok: boolean; message?: string; t: number[]; v: number[][]; /** v[nodo][muestra] */ i: Record<number, number[]> }

const VT = 0.025852;
const expl = (x: number) => (x > 40 ? Math.exp(40) * (1 + (x - 40)) : Math.exp(x));
const dexpl = (x: number) => (x > 40 ? Math.exp(40) : Math.exp(x));
/** pnjlim de SPICE: limita el salto de la tensión de una unión entre iteraciones. */
function pnjlim(vnew: number, vold: number, vt: number, vcrit: number): number {
  if (vnew > vcrit && Math.abs(vnew - vold) > 2 * vt) {
    if (vold > 0) { const arg = 1 + (vnew - vold) / vt; return arg > 0 ? vold + vt * Math.log(arg) : vcrit; }
    return vt * Math.log(vnew / vt);
  }
  return vnew;
}

function gauss(A: number[][], z: number[]): number[] | null {
  const n = z.length;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < 1e-18) return null;
    if (p !== c) { [A[p], A[c]] = [A[c], A[p]]; [z[p], z[c]] = [z[c], z[p]]; }
    for (let r = c + 1; r < n; r++) {
      const f = A[r][c] / A[c][c];
      if (f === 0) continue;
      for (let k = c; k < n; k++) A[r][k] -= f * A[c][k];
      z[r] -= f * z[c];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = z[i]; for (let k = i + 1; k < n; k++) s -= A[i][k] * x[k]; x[i] = s / A[i][i]; }
  return x;
}

export function simulateTran(nodeCount: number, els: TEl[], opt: TranOptions): TranResult {
  const N = nodeCount, size = N - 1;
  const { tEnd, dt } = opt;
  const every = opt.every ?? 1;
  const fail = (message: string): TranResult => ({ ok: false, message, t: [], v: [], i: {} });
  if (size < 1) return fail('El circuito no tiene nudos.');
  // Estado
  let vprev = new Array<number>(N).fill(0);
  const iL = els.map(() => 0);
  const vlast = els.map(() => [0, 0] as [number, number]); // última tensión de unión (limitación) por elemento
  els.forEach((e, k) => { if (e.k === 'C' && e.v0) { vprev[e.a] += e.v0; } void k; });
  const t: number[] = [];
  const v: number[][] = Array.from({ length: N }, () => []);
  const ii: Record<number, number[]> = {};
  els.forEach((e, k) => { if (e.k === 'R' || e.k === 'RT' || e.k === 'L' || e.k === 'V' || e.k === 'D' || e.k === 'SW' || e.k === 'C') ii[k] = []; });
  const steps = Math.round(tEnd / dt);
  const idx = (n: number) => n - 1;

  for (let step = 0; step <= steps; step++) {
    const time = step * dt;
    const read: Read = (n) => vprev[n] ?? 0;
    // Valores de comportamiento (se fijan una vez por paso, con los valores del paso anterior)
    const bval = els.map((e) => (e.k === 'B' ? e.f(read, time, dt) : e.k === 'BI' ? e.f(read, time, dt) : 0));
    let x = vprev.slice(1);
    let ok = false;
    for (let it = 0; it < 80; it++) {
      const A: number[][] = Array.from({ length: size }, () => new Array<number>(size).fill(0));
      const z = new Array<number>(size).fill(0);
      const vn = (n: number) => (n === 0 ? 0 : x[idx(n)]);
      const G = (a: number, b: number, g: number) => { if (a) A[idx(a)][idx(a)] += g; if (b) A[idx(b)][idx(b)] += g; if (a && b) { A[idx(a)][idx(b)] -= g; A[idx(b)][idx(a)] -= g; } };
      /** Fuente de corriente constante i de a → b dentro del elemento */
      const Is = (a: number, b: number, i: number) => { if (a) z[idx(a)] -= i; if (b) z[idx(b)] += i; };
      for (let n = 1; n < N; n++) A[idx(n)][idx(n)] += 1e-12;
      els.forEach((e, k) => {
        switch (e.k) {
          case 'R': G(e.a, e.b, 1 / Math.max(e.r, 1e-9)); break;
          case 'RT': G(e.a, e.b, 1 / Math.max(e.r(time), 1e-6)); break;
          case 'C': { const g = e.c / dt; G(e.a, e.b, g); Is(e.b, e.a, g * (vprev[e.a] - vprev[e.b])); break; }
          case 'L': { const r = e.r ?? 0, g = 1 / (r + e.l / dt); G(e.a, e.b, g); Is(e.a, e.b, g * (e.l / dt) * iL[k]); break; }
          case 'V': { G(e.a, e.b, 1e3); Is(e.b, e.a, e.w(time) * 1e3); break; }
          case 'I': Is(e.a, e.b, e.w(time)); break;
          case 'SW': { const st = iL[k] > 0.5; G(e.a, e.b, 1 / (st ? e.ron ?? 0.01 : e.roff ?? 1e8)); break; }
          case 'D': {
            const isat = e.is ?? 1e-14, nn = (e.n ?? 1) * VT;
            const vcrit = nn * Math.log(nn / (Math.SQRT2 * isat));
            const vd = pnjlim(vn(e.a) - vn(e.b), vlast[k][0], nn, vcrit); vlast[k][0] = vd;
            let i = isat * (expl(vd / nn) - 1), g = (isat / nn) * dexpl(vd / nn);
            if (e.vz) { const nz = 0.04, ve = -vd - e.vz; i -= 1e-3 * expl(Math.min(ve, 0.5) / nz); g += (1e-3 / nz) * dexpl(Math.min(ve, 0.5) / nz); }
            g += 1e-12;
            G(e.a, e.b, g); Is(e.a, e.b, i - g * vd);
            break;
          }
          case 'Q': {
            const sg = e.pnp ? -1 : 1, isat = e.is ?? 1e-14, bf = e.bf ?? 100, br = e.br ?? 2;
            const vcrit = VT * Math.log(VT / (Math.SQRT2 * isat));
            const vbe = pnjlim(sg * (vn(e.b) - vn(e.e)), vlast[k][0], VT, vcrit), vbc = pnjlim(sg * (vn(e.b) - vn(e.c)), vlast[k][1], VT, vcrit);
            vlast[k] = [vbe, vbc];
            const ef = expl(vbe / VT), er = expl(vbc / VT), def = dexpl(vbe / VT), der = dexpl(vbc / VT);
            const ic = isat * (ef - er) - (isat / br) * (er - 1), ib = (isat / bf) * (ef - 1) + (isat / br) * (er - 1);
            const icE = (isat / VT) * def, icC = -(isat / VT) * der - (isat / br / VT) * der; // ∂ic/∂vbe, ∂ic/∂vbc
            const ibE = (isat / bf / VT) * def, ibC = (isat / br / VT) * der;
            // Corrientes que ENTRAN en cada terminal (en polaridad NPN): c: ic, b: ib, e: -(ic+ib). Se multiplican por sg para PNP.
            const lin = (node: number, i0: number, dE: number, dC: number) => {
              if (!node) return;
              // i(vbe, vbc) ≈ i0 + dE·(Δvbe) + dC·(Δvbc); vbe = sg·(Vb−Ve), vbc = sg·(Vb−Vc)
              const r = idx(node);
              const coefB = sg * (dE + dC) * sg, coefE = -sg * dE * sg, coefC = -sg * dC * sg; // entrada = sg·i
              if (e.b) A[r][idx(e.b)] += coefB; if (e.e) A[r][idx(e.e)] += coefE; if (e.c) A[r][idx(e.c)] += coefC;
              z[r] -= sg * (i0 - dE * vbe - dC * vbc); // la corriente que entra en el nudo sale del circuito: va al lado derecho con signo opuesto
            };
            // Convención del sistema: A·x = z con z = corriente inyectada al nudo. Una corriente que ENTRA en el dispositivo se resta.
            lin(e.c, ic, icE, icC);
            lin(e.b, ib, ibE, ibC);
            lin(e.e, -(ic + ib), -(icE + ibE), -(icC + ibC));
            break;
          }
          case 'M': {
            const sg = e.pch ? -1 : 1, kp = e.kp ?? 0.05, vt = e.vt ?? 2, lam = e.lam ?? 0.01;
            let dn = e.d, sn = e.s;
            let vds = sg * (vn(dn) - vn(sn));
            if (vds < 0) { [dn, sn] = [sn, dn]; vds = -vds; }
            const vgs = sg * (vn(e.g) - vn(sn));
            let id = 0, gm = 0, gds = 1e-12;
            if (vgs > vt) {
              const vov = vgs - vt;
              if (vds < vov) { id = kp * (vov * vds - (vds * vds) / 2); gm = kp * vds; gds = kp * (vov - vds); }
              else { id = (kp / 2) * vov * vov * (1 + lam * vds); gm = kp * vov * (1 + lam * vds); gds = (kp / 2) * vov * vov * lam; }
            }
            gds += 1e-9;
            // id entra por d (polaridad), sale por s. Linealización: id ≈ id0 + gm·Δvgs + gds·Δvds
            const i0 = id - gm * vgs - gds * vds;
            const put = (node: number, sign: number) => {
              if (!node) return; const r = idx(node);
              if (e.g) A[r][idx(e.g)] += sign * sg * gm * sg; if (sn) A[r][idx(sn)] += sign * sg * (-gm - gds) * sg; if (dn) A[r][idx(dn)] += sign * sg * gds * sg;
              z[r] -= sign * sg * i0;
            };
            put(dn, 1); put(sn, -1);
            break;
          }
          case 'OA': {
            const gain = e.gain ?? 5e4, rout = e.rout ?? 50;
            const vP = e.vpv ?? vn(e.vp), vN = e.vnv ?? vn(e.vn), vm = (vP + vN) / 2, vh = Math.max(0.2, (vP - vN) / 2 - (e.head ?? 1.2));
            const vd = vn(e.p) - vn(e.n);
            const th = Math.tanh((gain * vd) / vh);
            const target = vm + vh * th, dT = gain * (1 - th * th);
            // corriente hacia fuera del nudo de salida: (target − vo)/rout ; la inyectamos al nudo
            const g1 = dT / rout; const gi = 1 / rout;
            const r = idx(e.o);
            if (e.o) {
              A[r][r] += gi;
              if (e.p) A[r][idx(e.p)] -= g1; if (e.n) A[r][idx(e.n)] += g1;
              z[r] += (target - dT * vd) / rout;
            }
            break;
          }
          case 'B': { const g = 1 / (e.rout ?? 50); G(e.o, e.ref, g); Is(e.ref, e.o, bval[k] * g); break; }
          case 'BI': Is(e.a, e.b, bval[k]); break;
        }
      });
      const xn = gauss(A, z);
      if (!xn) return fail('El sistema no tiene solución (¿hay un nudo flotante o un lazo de fuentes?).');
      let dmax = 0;
      for (let q = 0; q < size; q++) dmax = Math.max(dmax, Math.abs(xn[q] - x[q]));
      x = xn;
      if (dmax < 1e-6 + 1e-6 * Math.max(...x.map(Math.abs))) { ok = true; break; }
    }
    if (!ok && step === 0) { /* continuar con la mejor estimación */ }
    const vcur = [0, ...x];
    // Actualizar estados y corrientes
    els.forEach((e, k) => {
      if (e.k === 'L') iL[k] = (vcur[e.a] - vcur[e.b] + (e.l / dt) * iL[k]) / ((e.r ?? 0) + e.l / dt);
      if (e.k === 'SW') { const vab = vcur[e.a] - vcur[e.b]; const cur = vab / (iL[k] > 0.5 ? e.ron ?? 0.01 : e.roff ?? 1e8); iL[k] = e.on(time, vab, cur, (n) => vcur[n] ?? 0) ? 1 : 0; }
    });
    if (step % every === 0) {
      t.push(time);
      for (let n = 0; n < N; n++) v[n].push(vcur[n]);
      els.forEach((e, k) => {
        if (!ii[k]) return;
        let cur = 0;
        const vab = vcur[(e as { a: number }).a] - vcur[(e as { b: number }).b];
        if (e.k === 'R') cur = vab / Math.max(e.r, 1e-9);
        else if (e.k === 'RT') cur = vab / Math.max(e.r(time), 1e-6);
        else if (e.k === 'C') cur = (e.c / dt) * (vab - (vprev[e.a] - vprev[e.b]));
        else if (e.k === 'L') cur = iL[k];
        else if (e.k === 'V') cur = (e.w(time) - vab) * 1e3;
        else if (e.k === 'SW') cur = vab / (iL[k] > 0.5 ? e.ron ?? 0.01 : e.roff ?? 1e8);
        else if (e.k === 'D') { const nn = (e.n ?? 1) * VT; cur = (e.is ?? 1e-14) * (expl(vab / nn) - 1); }
        ii[k].push(cur);
      });
    }
    vprev = vcur;
  }
  return { ok: true, t, v, i: ii };
}
