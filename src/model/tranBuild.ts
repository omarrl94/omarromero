/** Convierte el circuito dibujado en elementos del análisis transitorio (src/engine/tran.ts). */
import type { Project } from './types';
import type { SimResult } from './netlist';
import { defOf } from './library';
import type { TEl } from '../engine/tran';

const VT = 0.025852;
export interface TranBuild {
  nodeCount: number; els: TEl[]; unsupported: string[]; hasActive: boolean;
  /** nombres de cada nudo (terminales conectados) para elegir sondas */
  nodeLabels: string[]; elOf: Record<string, number>; f0: number | null; fmin: number | null;
}

export function buildTran(project: Project, sim: SimResult): TranBuild {
  let n = sim.problem.nodeCount;
  const alloc = () => n++;
  const els: TEl[] = [];
  const unsupported: string[] = [];
  const elOf: Record<string, number> = {};
  const push = (e: TEl, id?: string) => { els.push(e); if (id && elOf[id] === undefined) elOf[id] = els.length - 1; return els.length - 1; };
  const freqs: number[] = [];
  for (const c of project.components) { const m = defOf(c.type).model; if (m.kind === 'ACV') freqs.push(m.f(c.params)); const w = defOf(c.type).wave; if (w) freqs.push(Number(c.params.f) || 0); }
  const f0 = freqs.find((f) => f > 0) ?? null;
  const w0 = 2 * Math.PI * (f0 ?? 50);
  const handled = new Set<string>();
  let hasActive = false;
  const ndOf = (id: string, type: string) => defOf(type).terminals.map((_, i) => sim.nodeOf[`${id}:${i}`] ?? 0);
  const series = (a: number, b: number, z: { re: number; im: number }, id: string) => {
    // R en serie con L (X > 0) o C (X < 0) entre a y b
    const r = Math.max(z.re, 1e-6), x = z.im;
    if (Math.abs(x) < 1e-9) { push({ k: 'R', a, b, r }, id); return; }
    const m = alloc();
    push({ k: 'R', a, b: m, r }, id);
    if (x > 0) push({ k: 'L', a: m, b, l: x / w0 });
    else push({ k: 'C', a: m, b, c: -1 / (x * w0) });
  };
  const vsrc = (a: number, b: number, w: (t: number) => number, rint: number, id: string) => {
    if (rint > 0) { const m = alloc(); push({ k: 'V', a: m, b, w }, id); push({ k: 'R', a, b: m, r: rint }); } else push({ k: 'V', a, b, w }, id);
  };
  const isFor = (vf: number, nn: number) => 0.01 * Math.exp(-vf / (nn * VT));

  for (const c of project.components) {
    const def = defOf(c.type), m = def.model, p = c.params;
    if (m.kind === 'GND' || m.kind === 'JUNCTION') continue;
    const nd = ndOf(c.id, c.type);
    if (m.kind === 'ACV') {
      handled.add(c.id);
      const A = m.v(p), f = m.f(p), rint = m.rint(p);
      if (m.three) {
        const vph = m.three === 'star' ? A / Math.sqrt(3) : A;
        for (let k = 0; k < 3; k++) {
          const b = m.three === 'star' ? 3 : (k + 1) % 3;
          vsrc(nd[k], nd[b], (t) => vph * Math.SQRT2 * Math.sin(2 * Math.PI * f * t - (k * 2 * Math.PI) / 3), m.three === 'star' ? rint : Math.max(0.01, rint), k === 0 ? c.id : `${c.id}#${k}`);
        }
      } else vsrc(nd[0], nd[1], (t) => A * Math.SQRT2 * Math.sin(2 * Math.PI * f * t), rint, c.id);
    } else if (def.wave && m.kind === 'V') {
      handled.add(c.id); vsrc(nd[0], nd[1], def.wave(p), m.rint(p), c.id);
    } else if (m.kind === 'DIODE') {
      handled.add(c.id);
      const nn = c.type === 'led' ? 1.8 : 1, vf = m.vf(p);
      if (m.vz) push({ k: 'D', a: nd[0], b: nd[1], is: isFor(vf, nn), n: nn, vz: m.vz(p) }, c.id); else push({ k: 'D', a: nd[0], b: nd[1], is: isFor(vf, nn), n: nn }, c.id);
    } else if (m.kind === 'TRAN') {
      handled.add(c.id); hasActive = true;
      for (const e of m.build({ nd, p, id: c.id, alloc })) push(e, c.id);
    } else if (m.kind === 'XFMR') { handled.add(c.id); unsupported.push(`${c.label || c.id} (${def.name})`); }
    else if (m.kind === 'LOAD3') {
      handled.add(c.id);
      const zs = m.z(p, w0), dl = m.delta(p);
      const sp = nd.length > 3 ? nd[3] : alloc();
      for (let k = 0; k < 3; k++) series(nd[k], dl ? nd[(k + 1) % 3] : sp, zs[k], k === 0 ? c.id : `${c.id}#${k}`);
    } else if (def.acz) {
      handled.add(c.id);
      series(nd[0], nd[1], def.acz(p, w0), c.id);
    }
  }
  // Elementos lineales del problema estático (R, V, I) de los componentes no tratados arriba
  sim.problem.elements.forEach((e) => {
    const owner = e.id.split('#')[0];
    if (handled.has(owner)) return;
    if (e.kind === 'R') push({ k: 'R', a: e.a, b: e.b, r: e.value }, owner);
    else if (e.kind === 'V') vsrc(e.a, e.b, () => e.value, e.rint ?? 0, owner);
    else push({ k: 'I', a: e.a, b: e.b, w: () => e.value }, owner);
  });
  // Nombres de nudo
  const labels: string[][] = Array.from({ length: n }, () => []);
  for (const c of project.components) defOf(c.type).terminals.forEach((t, i) => { const nd = sim.nodeOf[`${c.id}:${i}`]; if (nd === undefined || defOf(c.type).model.kind === 'JUNCTION') return; const pn = project.pointNames?.[`${c.id}:${i}`]; labels[nd].push(pn ?? `${c.label || c.id}.${t.name}`); });
  const nodeLabels = labels.map((l, i) => (i === 0 ? 'masa (0 V)' : l.length ? l.slice(0, 3).join(' · ') : `nudo ${i}`));
  const fmin = freqs.filter((f) => f > 0).sort((a, b) => a - b)[0] ?? null;
  return { nodeCount: n, els, unsupported, hasActive, nodeLabels, elOf, f0, fmin };
}
