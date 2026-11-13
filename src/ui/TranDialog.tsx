/**
 * Análisis transitorio: simula el circuito en el tiempo (diodos, transistores, amplificadores, 555, puertas,
 * condensadores y bobinas…) y dibuja las formas de onda de los nudos que elijas.
 */
import { useMemo, useState } from 'react';
import { useStore } from '../store';
import type { SimResult } from '../model/netlist';
import { buildTran } from '../model/tranBuild';
import { simulateTran } from '../engine/tran';
import { defOf, fmt } from '../model/library';

const COLORS = ['#A84A24', '#1f5a8a', '#2f6f4f', '#8a6a12', '#7a3b8a', '#b3261e', '#3b6e8a', '#666'];
const DURS = [0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.04, 0.1, 0.2, 0.5, 1, 2];
const fmtT = (s: number) => (s >= 1 ? `${fmt(s)} s` : s >= 1e-3 ? `${fmt(s * 1e3)} ms` : `${fmt(s * 1e6)} µs`);
const fmtV = (v: number, u: string) => { const a = Math.abs(v); return a >= 1e3 ? `${fmt(v / 1e3)} k${u}` : a >= 1 || a === 0 ? `${fmt(v)} ${u}` : a >= 1e-3 ? `${fmt(v * 1e3)} m${u}` : `${fmt(v * 1e6)} µ${u}`; };

type Probe = { kind: 'v'; node: number } | { kind: 'i'; comp: string };

export function TranDialog({ sim, onClose }: { sim: SimResult; onClose: () => void }) {
  const project = useStore((s) => s.project);
  const build = useMemo(() => buildTran(project, sim), [project, sim]);
  const auto = build.fmin ? Math.min(...DURS.filter((d) => d >= 4 / build.fmin! * 0.99), 2) : build.hasActive ? 0.02 : 0.01;
  const [tEnd, setTEnd] = useState(DURS.includes(auto) ? auto : DURS.find((d) => d >= auto) ?? 0.02);
  const [quality, setQuality] = useState(4000);
  const res = useMemo(() => simulateTran(build.nodeCount, build.els, { tEnd, dt: tEnd / quality }), [build, tEnd, quality]);
  const nodes = useMemo(() => {
    if (!res.ok) return [];
    return res.v.map((vv, i) => ({ i, pp: Math.max(...vv) - Math.min(...vv) })).filter((x) => x.i > 0 && build.nodeLabels[x.i] && !build.nodeLabels[x.i].startsWith('nudo')).sort((a, b) => b.pp - a.pp);
  }, [res, build]);
  const [picked, setPicked] = useState<Probe[] | null>(null);
  const probes: Probe[] = picked ?? nodes.slice(0, 3).map((x) => ({ kind: 'v' as const, node: x.i }));
  const toggle = (pr: Probe) => {
    const key = (q: Probe) => (q.kind === 'v' ? `v${q.node}` : `i${q.comp}`);
    const cur = probes; const has = cur.some((q) => key(q) === key(pr));
    setPicked(has ? cur.filter((q) => key(q) !== key(pr)) : [...cur, pr].slice(0, 6));
  };
  const comps = project.components.filter((c) => build.elOf[c.id] !== undefined && res.i[build.elOf[c.id]]);
  const W = 860, LH = 120, ML = 62;

  const series = (pr: Probe): number[] => (pr.kind === 'v' ? res.v[pr.node] : res.i[build.elOf[pr.comp]] ?? []);
  const stats = (y: number[]) => {
    if (!y.length) return null;
    const tail = y.slice(Math.floor(y.length / 2));
    const mean = tail.reduce((a, b) => a + b, 0) / tail.length, rms = Math.sqrt(tail.reduce((a, b) => a + b * b, 0) / tail.length);
    let edges = 0, t1 = -1, tN = -1; for (let k = 1; k < y.length; k++) if (y[k - 1] < mean && y[k] >= mean) { edges++; if (t1 < 0) t1 = res.t[k]; tN = res.t[k]; }
    return { max: Math.max(...y), min: Math.min(...y), mean, rms, f: edges > 1 && tN > t1 ? (edges - 1) / (tN - t1) : null };
  };

  return (
    <div className="solve-overlay tran" role="dialog" aria-label="Análisis transitorio">
      <aside className="solve-side">
        <div className="side-head"><h2>Transitorio</h2><button className="x" onClick={onClose} aria-label="Cerrar">✕</button></div>
        <p className="muted small">Simula el circuito en el tiempo y dibuja las tensiones y corrientes que elijas. Úsalo con diodos, transistores, amplificadores, 555, puertas, condensadores y bobinas.</p>
        {build.unsupported.length > 0 && <p className="rwarn">No se simulan en el tiempo: {build.unsupported.join(', ')}.</p>}
        <label className="field">Duración
          <select value={tEnd} onChange={(e) => { setTEnd(+e.target.value); }}>{DURS.map((d) => <option key={d} value={d}>{fmtT(d)}</option>)}</select></label>
        <label className="field">Resolución
          <select value={quality} onChange={(e) => setQuality(+e.target.value)}><option value={1500}>Rápida</option><option value={4000}>Normal</option><option value={12000}>Fina (más lenta)</option></select></label>
        <h4 className="tran-h">Tensiones (respecto de masa)</h4>
        <ul className="plist">
          {nodes.map((x) => { const on = probes.some((q) => q.kind === 'v' && q.node === x.i); return <li key={x.i}><label><input type="checkbox" checked={on} onChange={() => toggle({ kind: 'v', node: x.i })} /> {build.nodeLabels[x.i]} <small>{fmtV(x.pp, 'V')} pp</small></label></li>; })}
        </ul>
        <h4 className="tran-h">Corrientes</h4>
        <ul className="plist">
          {comps.map((c) => { const on = probes.some((q) => q.kind === 'i' && q.comp === c.id); return <li key={c.id}><label><input type="checkbox" checked={on} onChange={() => toggle({ kind: 'i', comp: c.id })} /> {c.label || c.id} <small>{defOf(c.type).name}</small></label></li>; })}
        </ul>
      </aside>
      <main className="solve-main">
        <article className="report tranview">
          <header className="rhead"><div><h1>Análisis transitorio</h1><p>{project.name} · {fmtT(tEnd)}{build.f0 ? ` · f = ${fmt(build.f0)} Hz` : ''}</p></div><span className="rlogo">CircuitosSEA</span></header>
          {!res.ok ? <p className="rwarn">{res.message}</p> : probes.length === 0 ? <p className="rnote">Elige al menos una señal en la lista de la izquierda.</p> : (
            <svg viewBox={`0 0 ${W} ${probes.length * (LH + 26) + 24}`} className="tranplot">
              {probes.map((pr, k) => {
                const y = series(pr); if (!y.length) return null;
                const mn = Math.min(...y), mx = Math.max(...y); const pad = (mx - mn) * 0.12 || Math.max(0.5, Math.abs(mx) * 0.2);
                const lo = mn - pad, hi = mx + pad; const top = 12 + k * (LH + 26);
                const X = (i: number) => ML + (res.t[i] / tEnd) * (W - ML - 12), Y = (v: number) => top + LH - ((v - lo) / (hi - lo)) * LH;
                const step = Math.max(1, Math.floor(y.length / 1200));
                const d = y.filter((_, i) => i % step === 0).map((v, i) => `${i ? 'L' : 'M'}${X(i * step).toFixed(1)} ${Y(v).toFixed(1)}`).join('');
                const st = stats(y); const col = COLORS[k % COLORS.length];
                const label = pr.kind === 'v' ? build.nodeLabels[pr.node] : `I ${project.components.find((c) => c.id === pr.comp)?.label || pr.comp}`;
                return (
                  <g key={k}>
                    <rect x={ML} y={top} width={W - ML - 12} height={LH} fill="#fbf9f4" stroke="#c9c0b0" />
                    {[0.25, 0.5, 0.75].map((q) => <line key={q} x1={ML} x2={W - 12} y1={top + LH * q} y2={top + LH * q} stroke="#e6e0d3" />)}
                    {[0.2, 0.4, 0.6, 0.8].map((q) => <line key={q} y1={top} y2={top + LH} x1={ML + q * (W - ML - 12)} x2={ML + q * (W - ML - 12)} stroke="#eee8dc" />)}
                    {lo < 0 && hi > 0 && <line x1={ML} x2={W - 12} y1={Y(0)} y2={Y(0)} stroke="#9b9283" strokeDasharray="4 3" />}
                    <path d={d} fill="none" stroke={col} strokeWidth={1.8} />
                    <text x={ML - 6} y={top + 10} textAnchor="end" fontSize={10} fill="#555">{fmtV(hi, pr.kind === 'v' ? 'V' : 'A')}</text>
                    <text x={ML - 6} y={top + LH} textAnchor="end" fontSize={10} fill="#555">{fmtV(lo, pr.kind === 'v' ? 'V' : 'A')}</text>
                    <text x={ML + 6} y={top + 13} fontSize={11} fontWeight={700} fill={col}>{label}</text>
                    {st && <text x={W - 16} y={top + 13} textAnchor="end" fontSize={10} fill="#444">máx {fmtV(st.max, pr.kind === 'v' ? 'V' : 'A')} · mín {fmtV(st.min, pr.kind === 'v' ? 'V' : 'A')} · medio {fmtV(st.mean, pr.kind === 'v' ? 'V' : 'A')} · ef. {fmtV(st.rms, pr.kind === 'v' ? 'V' : 'A')}{st.f ? ` · f ≈ ${fmtV(st.f, 'Hz')}` : ''}</text>}
                    {k === probes.length - 1 && [0, 0.25, 0.5, 0.75, 1].map((q) => <text key={q} x={ML + q * (W - ML - 12)} y={top + LH + 14} textAnchor="middle" fontSize={10} fill="#555">{fmtT(q * tEnd)}</text>)}
                  </g>
                );
              })}
            </svg>
          )}
          <footer className="rfoot">Modelos simplificados (Ebers-Moll, MOSFET de ley cuadrática, amplificador con saturación, convertidores promediados). Los resultados son orientativos.</footer>
        </article>
      </main>
    </div>
  );
}
