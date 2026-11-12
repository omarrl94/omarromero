import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { defOf, fmt } from '../model/library';
import type { SimResult } from '../model/netlist';

/** Vatímetro / analizador monofásico: V, I, P, Q, S, cos φ, energía y coste. */
export function Wattmeter({ sim, demoId }: { sim: SimResult; demoId?: string }) {
  const st = useStore();
  const comps = st.project.components.filter((c) => !['ground', 'junction'].includes(c.type));
  const [id, setId] = useState<string>(demoId ?? '');
  const [kwh, setKwh] = useState(0);
  const [price, setPrice] = useState(0.15); // €/kWh orientativo, configurable
  const [fast, setFast] = useState(true);
  const live = id ? sim.live[id] : undefined;
  const pRef = useRef(0);
  pRef.current = live?.p ?? 0;
  useEffect(() => {
    const dt = 0.25;
    const h = setInterval(() => setKwh((k) => k + (pRef.current * dt * (fast ? 3600 : 1)) / 3.6e6), dt * 1000);
    return () => clearInterval(h);
  }, [fast]);
  const ac = !!sim.ac;
  const p = live?.p ?? 0, q = live?.q ?? 0, s = live?.s ?? (live ? live.v * Math.abs(live.i) : 0);
  const pf = live ? (ac ? live.pf ?? 1 : 1) : 0;
  const needle = Math.min(1, s ? p / Math.max(s, 1e-9) : 0); // aguja = cos φ
  const ang = -60 + needle * 120;

  return (
    <svg viewBox="0 0 240 400" className="instrument" role="group" aria-label="Vatímetro" data-testid="wattmeter">
      <rect x={6} y={4} width={228} height={392} rx={22} fill="#2A2622" />
      <rect x={14} y={12} width={212} height={376} rx={16} fill="#A9CABB" />
      <text x={120} y={32} textAnchor="middle" fontSize={11} fontWeight={800} letterSpacing={3} fill="#2A2622">VATÍMETRO</text>
      <text x={120} y={44} textAnchor="middle" fontSize={8} fill="#2A2622" opacity={0.7}>P · Q · S · cos φ · kWh</text>
      {/* esfera analógica (cos φ) */}
      <rect x={30} y={54} width={180} height={104} rx={8} fill="#2A2622" /><rect x={35} y={59} width={170} height={94} rx={5} fill="#F3EBD8" />
      <g transform="translate(120 140)">
        {Array.from({ length: 13 }, (_, k) => {
          const a = ((-60 + k * 10) * Math.PI) / 180;
          return <line key={k} x1={Math.sin(a) * 66} y1={-Math.cos(a) * 66} x2={Math.sin(a) * (k % 2 ? 72 : 78)} y2={-Math.cos(a) * (k % 2 ? 72 : 78)} stroke="#2A2622" strokeWidth={1.5} />;
        })}
        <text x={-52} y={-52} fontSize={9} fill="#2A2622">0</text><text x={46} y={-52} fontSize={9} fill="#2A2622">1</text>
        <text x={0} y={-38} fontSize={9} textAnchor="middle" fill="#2A2622">cos φ</text>
        <g style={{ transform: `rotate(${ang}deg)`, transition: 'transform .3s cubic-bezier(.3,1.5,.5,1)' }}>
          <line x1={0} y1={6} x2={0} y2={-70} stroke="#c62828" strokeWidth={2.5} strokeLinecap="round" />
        </g>
        <circle r={5} fill="#2A2622" />
      </g>
      {/* pantalla digital */}
      <rect x={30} y={166} width={180} height={150} rx={8} fill="#2A2622" /><rect x={35} y={171} width={170} height={140} rx={5} fill="url(#lcdGrad2)" />
      <defs><linearGradient id="lcdGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b9cdb0" /><stop offset="100%" stopColor="#97ad90" /></linearGradient></defs>
      <g fontFamily="ui-monospace, 'Courier New', monospace" fill="#1b2a1b" fontWeight={700}>
        {[['V', live ? live.v : 0, 'V'], ['I', live ? Math.abs(live.i) : 0, 'A'], ['P', p, 'W'], ['Q', q, 'var'], ['S', s, 'VA']].map(([lab, val, u], k) => (
          <g key={lab as string}>
            <text x={44} y={194 + k * 22} fontSize={11} opacity={0.7}>{lab as string}</text>
            <text x={172} y={194 + k * 22} fontSize={17} textAnchor="end">{live ? fmt(val as number, 4) : '—'}</text>
            <text x={198} y={194 + k * 22} fontSize={10} textAnchor="end">{u as string}</text>
          </g>
        ))}
        <text x={44} y={304} fontSize={11}>cos φ {live ? fmt(pf, 3) : '—'}</text>
        <text x={198} y={304} fontSize={10} textAnchor="end">{ac ? `${fmt(sim.ac!.freq)} Hz` : 'CC'}</text>
      </g>
      <foreignObject x={22} y={322} width={196} height={66}>
        <div className="watt-ctl">
          <select value={id} onChange={(e) => { setId(e.target.value); setKwh(0); }} aria-label="Receptor a medir">
            <option value="">Medir en…</option>
            {comps.map((c) => <option key={c.id} value={c.id}>{c.label || (c.id.length <= 4 ? c.id : defOf(c.type).name)}</option>)}
          </select>
          <div className="wrow"><b>{fmt(kwh, 3)} kWh</b><b>{fmt(kwh * price, 3)} €</b></div>
          <div className="wrow"><label><input type="checkbox" checked={fast} onChange={() => setFast(!fast)} /> 1 s = 1 h</label>
            <label>€/kWh <input value={String(price).replace('.', ',')} onChange={(e) => { const v = parseFloat(e.target.value.replace(',', '.')); if (isFinite(v)) setPrice(v); }} style={{ width: 42 }} /></label>
            <button onClick={() => setKwh(0)}>⟲</button></div>
        </div>
      </foreignObject>
    </svg>
  );
}
