import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { Knob, KnobDefs, type KnobPos } from './Knob';
import { beginProbeDrag } from './Floating';
import { defOf, fmt, fmtSI } from '../model/library';
import type { SimResult } from '../model/netlist';
import { currentThrough, phaseDiff, probeVoltage, rmsOf, sample, type Signal } from '../model/signals';
import { abs as cabs } from '../engine/ac';

const TDIVS = [0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05];
const VDIVS = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];
const spread = (n: number): KnobPos[] => Array.from({ length: n }, (_, i) => ({ angle: -135 + (270 * i) / (n - 1), label: '' }));
const fmtT = (s: number) => (s >= 1 ? `${fmt(s)} s` : s >= 1e-3 ? `${fmt(s * 1e3)} ms` : `${fmt(s * 1e6)} µs`);
type Coupling = 'DC' | 'AC' | 'GND';
interface Ch { on: boolean; mode: 'V' | 'I'; comp: string | null; vdiv: number; pos: number; coupling: Coupling }

const W = 400, H = 320;

/** Osciloscopio de 2 canales con base de tiempos, sensibilidad, acoplamiento, disparo y medidas automáticas. */
export function Scope({ sim, demoComp }: { sim: SimResult; demoComp?: string }) {
  const st = useStore();
  const [tdiv, setTdiv] = useState(5);
  const [ch, setCh] = useState<[Ch, Ch]>([
    { on: true, mode: 'V', comp: null, vdiv: 100, pos: 0, coupling: 'DC' },
    { on: true, mode: 'I', comp: demoComp ?? null, vdiv: 1, pos: 0, coupling: 'DC' },
  ]);
  const [level, setLevel] = useState(0);
  const upd = (i: 0 | 1, p: Partial<Ch>) => setCh((c) => (i === 0 ? [{ ...c[0], ...p }, c[1]] : [c[0], { ...c[1], ...p }]));

  const omega = sim.ac?.omega ?? 0;
  const loads = st.project.components.filter((c) => !['ground', 'junction'].includes(c.type));
  const sig = (i: 0 | 1): Signal => {
    const c = ch[i];
    const raw = c.mode === 'V' ? probeVoltage(sim, st.scopeTips[i === 0 ? 'c1' : 'c2']) : currentThrough(sim, c.comp);
    if (c.coupling === 'GND') return { dc: 0, ph: null };
    if (c.coupling === 'AC') return { dc: 0, ph: raw.ph };
    return raw;
  };
  const s0 = sig(0), s1 = sig(1);
  const T = sim.ac ? 1 / sim.ac.freq : 0;
  const timeDiv = TDIVS[tdiv];

  // Disparo en flanco ascendente sobre el canal 1 (o el 2 si el 1 está apagado)
  const trigSrc = ch[0].on ? s0 : s1;
  const t0 = useMemo(() => {
    if (!sim.ac || !trigSrc.ph) return 0;
    const N = 800;
    let prev = sample(trigSrc, omega, 0);
    for (let k = 1; k <= N; k++) {
      const t = (k / N) * T, v = sample(trigSrc, omega, t);
      if (prev < level && v >= level) return t;
      prev = v;
    }
    return 0;
  }, [sim, trigSrc, level, omega, T]);
  const trigLost = !!sim.ac && !!trigSrc.ph && Math.abs(level) > Math.SQRT2 * cabs(trigSrc.ph);

  const path = (s: Signal, c: Ch) => {
    const pts: string[] = [];
    for (let x = 0; x <= W; x += 2) {
      const t = t0 + (x / W) * 10 * timeDiv;
      const v = sample(s, omega, t);
      const y = H / 2 - (v / c.vdiv) * 40 - c.pos * 40;
      pts.push(`${x},${Math.max(-20, Math.min(H + 20, y)).toFixed(1)}`);
    }
    return 'M' + pts.join('L');
  };
  const meas = (s: Signal, c: Ch) => {
    const amp = s.ph ? Math.SQRT2 * cabs(s.ph) : 0;
    return { vpp: 2 * amp, vrms: rmsOf(s), f: sim.ac && s.ph ? sim.ac.freq : null, unit: c.mode === 'V' ? 'V' : 'A' };
  };
  const m0 = meas(s0, ch[0]), m1 = meas(s1, ch[1]);
  const dphi = ch[0].on && ch[1].on ? phaseDiff(s0, s1) : null;
  const cols = ['#f5d300', '#29b6f6'];

  return (
    <svg viewBox="0 0 620 400" className="instrument scope" role="group" aria-label="Osciloscopio" data-testid="scope">
      <KnobDefs />
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="2.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <clipPath id="scr"><rect x={0} y={0} width={W} height={H} /></clipPath>
      </defs>
      <rect x={2} y={2} width={616} height={396} rx={14} fill="#2A2622" /><rect x={8} y={8} width={604} height={384} rx={10} fill="#3a352f" />
      <text x={20} y={26} fontSize={11} fontWeight={800} letterSpacing={2} fill="#EFCD2F">CIRCUITOS·SEA</text>
      <text x={150} y={26} fontSize={9} fill="#A9CABB">OSCILOSCOPIO 2 CANALES</text>
      {/* pantalla */}
      <g transform="translate(18 34) scale(0.78)">
        <rect x={-8} y={-8} width={W + 16} height={H + 16} rx={14} fill="#111" />
        <rect width={W} height={H} fill="#0a1a10" />
        {Array.from({ length: 11 }, (_, i) => <line key={'v' + i} x1={i * 40} y1={0} x2={i * 40} y2={H} stroke="#2e6b45" strokeWidth={i === 5 ? 1.6 : 0.7} opacity={0.8} />)}
        {Array.from({ length: 9 }, (_, i) => <line key={'h' + i} x1={0} y1={i * 40} x2={W} y2={i * 40} stroke="#2e6b45" strokeWidth={i === 4 ? 1.6 : 0.7} opacity={0.8} />)}
        {Array.from({ length: 51 }, (_, i) => <line key={'tx' + i} x1={i * 8} y1={H / 2 - 3} x2={i * 8} y2={H / 2 + 3} stroke="#2e6b45" />)}
        <g clipPath="url(#scr)" filter="url(#glow)" fill="none" strokeWidth={2.4} strokeLinejoin="round">
          {ch[0].on && <path d={path(s0, ch[0])} stroke={cols[0]} />}
          {ch[1].on && <path d={path(s1, ch[1])} stroke={cols[1]} />}
        </g>
        {ch.map((c, i) => c.on && <path key={i} d={`M0 ${H / 2 - c.pos * 40} l9 -6 v12 z`} fill={cols[i]} />)}
        <text x={10} y={H - 10} fontSize={15} fill="#8fe3a8" fontFamily="ui-monospace, monospace">
          {fmtT(timeDiv)}/div {trigLost ? ' · TRIG? (nivel fuera de señal)' : ''}
        </text>
        <text x={W - 8} y={H - 10} fontSize={15} fill="#8fe3a8" textAnchor="end" fontFamily="ui-monospace, monospace">T' ↑ {fmt(level)} V</text>
        {ch.map((c, i) => c.on && <text key={i} x={10 + i * 190} y={22} fontSize={15} fill={cols[i]} fontFamily="ui-monospace, monospace">CH{i + 1} {fmt(c.vdiv)} {c.mode === 'V' ? 'V' : 'A'}/div {c.coupling}</text>)}
      </g>
      {/* medidas automáticas */}
      <g transform="translate(18 300)" fontFamily="ui-monospace, monospace" fontSize={10.5}>
        {[m0, m1].map((m, i) => (ch[i].on &&
          <g key={i} transform={`translate(${i * 130} 0)`}>
            <text fill={cols[i]} fontWeight={700}>CH{i + 1}</text>
            <text y={13} fill="#ddd">Vpp {fmt(m.vpp, 4)} {m.unit}</text>
            <text y={26} fill="#ddd">Vrms {fmt(m.vrms, 4)} {m.unit}</text>
            <text y={39} fill="#ddd">f {m.f ? fmt(m.f) + ' Hz' : '—'}  T {m.f ? fmtT(1 / m.f) : '—'}</text>
          </g>))}
        {dphi !== null && (
          <text y={58} fill="#EFCD2F" fontWeight={700}>Δφ = {fmt((dphi * 180) / Math.PI, 3)}° {Math.abs(dphi) < 0.005 ? '· en fase' : dphi < 0 ? '· CH2 atrasa a CH1' : '· CH2 adelanta a CH1'}</text>
        )}
      </g>
      {/* mandos */}
      <g transform="translate(352 80)">
        <text x={-10} y={-22} fontSize={9} fontWeight={700} fill="#ddd">BASE DE TIEMPOS</text>
        <g transform="translate(36 22)"><Knob r={26} positions={spread(TDIVS.length)} index={tdiv} onChange={setTdiv} accent="#EFCD2F" label="Base de tiempos" /></g>
        <text x={36} y={72} fontSize={10} textAnchor="middle" fill="#EFCD2F">{fmtT(timeDiv)}/div</text>
      </g>
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${442 + i * 82} 80)`}>
          <text x={-10} y={-22} fontSize={9} fontWeight={700} fill={cols[i]}>CH{i + 1} {ch[i].mode === 'V' ? 'V/div' : 'A/div'}</text>
          <g transform="translate(36 22)"><Knob r={26} positions={spread(VDIVS.length)} index={Math.max(0, VDIVS.findIndex((v) => v >= ch[i as 0 | 1].vdiv))} onChange={(k) => upd(i as 0 | 1, { vdiv: VDIVS[k] })} accent={cols[i]} label={`Sensibilidad canal ${i + 1}`} /></g>
          <text x={36} y={72} fontSize={10} textAnchor="middle" fill={cols[i]}>{fmt(ch[i as 0 | 1].vdiv)}</text>
        </g>
      ))}
      <foreignObject x={346} y={170} width={266} height={222}>
        <div className="scope-ctl">
          {[0, 1].map((i) => {
            const c = ch[i as 0 | 1];
            return (
              <div key={i} className="chrow" style={{ borderColor: cols[i] }}>
                <b style={{ color: cols[i] }}>CH{i + 1}</b>
                <button className={c.on ? 'on' : ''} onClick={() => upd(i as 0 | 1, { on: !c.on })}>{c.on ? 'ON' : 'OFF'}</button>
                <button onClick={() => upd(i as 0 | 1, { coupling: c.coupling === 'DC' ? 'AC' : c.coupling === 'AC' ? 'GND' : 'DC' })}>{c.coupling}</button>
                <select value={c.mode} onChange={(e) => upd(i as 0 | 1, { mode: e.target.value as 'V' | 'I' })}>
                  <option value="V">Sonda V</option><option value="I">Pinza A</option>
                </select>
                {c.mode === 'V' ? (
                  <button className={`probebtn ${st.scopeArm === (i === 0 ? 'c1' : 'c2') ? 'armed' : ''}`} style={{ touchAction: 'none', cursor: 'grab' }} onPointerDown={(e) => beginProbeDrag(i === 0 ? 'c1' : 'c2', e)}>
                    {st.scopeArm === (i === 0 ? 'c1' : 'c2') ? 'Pulsa terminal…' : st.scopeTips[i === 0 ? 'c1' : 'c2'] ? `● ${st.scopeTips[i === 0 ? 'c1' : 'c2']!.comp.slice(0, 4)}:${st.scopeTips[i === 0 ? 'c1' : 'c2']!.term + 1}` : '⬤ Arrastra la sonda'}
                  </button>
                ) : (
                  <select value={c.comp ?? ''} onChange={(e) => upd(i as 0 | 1, { comp: e.target.value || null })}>
                    <option value="">— elegir —</option>
                    {loads.map((l) => <option key={l.id} value={l.id}>{l.label || (l.id.length <= 4 ? l.id : defOf(l.type).name)}</option>)}
                  </select>
                )}
                <label className="vpos">▲▼<input type="range" min={-3} max={3} step={0.1} value={c.pos} onChange={(e) => upd(i as 0 | 1, { pos: +e.target.value })} /></label>
              </div>
            );
          })}
          <label className="vpos">Nivel de disparo <input type="range" min={-300} max={300} step={1} value={level} onChange={(e) => setLevel(+e.target.value)} /> {fmtSI(level, 'V')}</label>
          <small>Sonda: tensión respecto a masa. Pinza: intensidad del terminal 1 → 2 del componente.</small>
        </div>
      </foreignObject>
    </svg>
  );
}
