import { useMemo } from 'react';
import { useStore } from '../store';
import { Knob, KnobDefs, type KnobPos } from './Knob';
import { pointName, readMeter, type Dial } from '../model/meter';
import type { SimResult } from '../model/netlist';

const DIALS: { v: Dial; label: string }[] = [
  { v: 'off', label: 'OFF' }, { v: 'Vac', label: 'V~' }, { v: 'V', label: 'V⎓' }, { v: 'ohm', label: 'Ω' },
  { v: 'cont', label: '•))' }, { v: 'A', label: 'A⎓' }, { v: 'Aac', label: 'A~' },
];
const POS: KnobPos[] = DIALS.map((d, i) => ({ angle: -135 + i * 45, label: d.label }));

/** Polímetro digital de mano: rueda, pantalla, bornes con clavijas y puntas de prueba. */
export function Multimeter({ sim }: { sim: SimResult }) {
  const st = useStore();
  const { meter, project } = st;
  const reading = useMemo(() => readMeter(sim, meter, project), [sim, meter, project]);
  const off = meter.dial === 'off';
  const idx = DIALS.findIndex((d) => d.v === meter.dial);
  const isAc = meter.dial === 'Vac' || meter.dial === 'Aac';
  // Posición X de la clavija roja
  const redX = meter.jack === '10A' ? 52 : 188;

  return (
    <svg viewBox="0 0 240 400" className="instrument" role="group" aria-label="Polímetro digital" data-testid="multimeter">
      <KnobDefs />
      {/* carcasa */}
      <rect x={6} y={4} width={228} height={392} rx={26} fill="#2A2622" />
      <rect x={14} y={12} width={212} height={376} rx={20} fill="url(#caseGrad)" />
      <text x={120} y={32} textAnchor="middle" fontSize={11} fontWeight={800} letterSpacing={3} fill="#2A2622">CIRCUITOS·SEA</text>
      <text x={120} y={44} textAnchor="middle" fontSize={7.5} fill="#2A2622" opacity={0.7}>TRUE RMS · AUTO RANGE · 10 MΩ</text>
      {/* pantalla */}
      <rect x={30} y={52} width={180} height={82} rx={8} fill="#2A2622" />
      <rect x={35} y={57} width={170} height={72} rx={5} fill={off ? '#6f7c6c' : 'url(#lcdGrad)'} />
      {!off && (
        <>
          <text x={176} y={110} textAnchor="end" fontSize={44} fontFamily="ui-monospace, 'Courier New', monospace" fontWeight={700} fill="#1b2a1b" opacity={0.08} letterSpacing={2}>8888</text>
          <text x={176} y={110} textAnchor="end" fontSize={44} fontFamily="ui-monospace, 'Courier New', monospace" fontWeight={700} fill="#1b2a1b" letterSpacing={2} data-testid="lcd">{reading.text}</text>
          <text x={198} y={110} textAnchor="end" fontSize={17} fontWeight={800} fill="#1b2a1b">{reading.unit}</text>
          <text x={42} y={72} fontSize={9} fontWeight={700} fill="#1b2a1b">{isAc ? 'AC' : meter.dial === 'V' || meter.dial === 'A' ? 'DC' : ''}</text>
          <text x={74} y={72} fontSize={9} fontWeight={700} fill="#1b2a1b">AUTO</text>
          {reading.beep && <text x={196} y={72} fontSize={13} textAnchor="end">🔔</text>}
          {meter.fuseBlown && <text x={42} y={124} fontSize={8} fontWeight={700} fill="#8b1a1a">FUSE!</text>}
        </>
      )}
      {/* rueda */}
      <g transform="translate(120 224)">
        <Knob r={46} positions={POS} index={idx} onChange={(i) => st.setMeter({ dial: DIALS[i].v })} label="Selector de función" />
      </g>
      {/* bornes */}
      {[{ x: 52, name: '10A', jack: '10A' as const, ring: '#c62828' }, { x: 120, name: 'COM', jack: null, ring: '#222' }, { x: 188, name: 'VΩ', jack: 'VOhm' as const, ring: '#c62828' }].map((j) => (
        <g key={j.name} onClick={() => j.jack && st.setMeter({ jack: j.jack })} style={{ cursor: j.jack ? 'pointer' : 'default' }}>
          <circle cx={j.x} cy={316} r={15} fill="#2A2622" /><circle cx={j.x} cy={316} r={11} fill="#111" stroke={j.ring} strokeWidth={3} />
          <text x={j.x} y={345} fontSize={10} fontWeight={800} textAnchor="middle" fill="#2A2622">{j.name}</text>
          {j.name === '10A' && <text x={j.x} y={296} fontSize={7} textAnchor="middle" fill="#2A2622">MAX 10A</text>}
          {j.name === 'VΩ' && <text x={j.x} y={296} fontSize={7} textAnchor="middle" fill="#2A2622">1000V MAX</text>}
        </g>
      ))}
      {/* clavijas enchufadas */}
      <g style={{ transform: `translateX(${redX - 52}px)`, transition: 'transform .25s' }}>
        <rect x={46} y={300} width={12} height={32} rx={4} fill="#e53935" stroke="#7f0000" />
      </g>
      <rect x={114} y={300} width={12} height={32} rx={4} fill="#222" stroke="#000" />
      {/* cables hacia las puntas */}
      <path d={`M${redX} 332 C ${redX} 370, 70 350, 70 372`} stroke="#e53935" strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M120 332 C 120 372, 170 350, 170 372" stroke="#222" strokeWidth={4} fill="none" strokeLinecap="round" />
      {/* puntas */}
      {(['red', 'black'] as const).map((k) => {
        const x = k === 'red' ? 70 : 170;
        const armed = meter.armed === k;
        const placed = meter[k];
        return (
          <g key={k} style={{ cursor: 'pointer' }} onClick={() => st.setMeter({ armed: armed ? null : k })} data-probe={k}>
            <path d={`M${x - 5} 372 L${x} 392 L${x + 5} 372 Z`} fill="#cfcfcf" stroke="#555" />
            <rect x={x - 7} y={362} width={14} height={14} rx={3} fill={k === 'red' ? '#e53935' : '#222'} className={armed ? 'pulse' : ''} stroke={armed ? '#fff' : 'none'} strokeWidth={2} />
            {placed && <circle cx={x} cy={392} r={3} fill="#4caf50" />}
          </g>
        );
      })}
    </svg>
  );
}

export function MeterInfo({ sim }: { sim: SimResult }) {
  const st = useStore();
  const { meter, project } = st;
  const reading = useMemo(() => readMeter(sim, meter, project), [sim, meter, project]);
  const mode = DIALS.find((d) => d.v === meter.dial)!.label;
  return (
    <div className="meterinfo">
      <div className="probeline"><span className="dot red" /> {meter.armed === 'red' ? 'Pulsa un terminal del circuito…' : pointName(project, meter.red)}</div>
      <div className="probeline"><span className="dot black" /> {meter.armed === 'black' ? 'Pulsa un terminal del circuito…' : pointName(project, meter.black)}</div>
      {meter.fuseBlown && <button onClick={() => st.setMeter({ fuseBlown: false })}>🔧 Cambiar fusible de 10 A</button>}
      <ul className="msgs tips">{reading.tips.map((t, i) => <li key={i} className={t.level === 'info' ? '' : t.level}>{t.text}</li>)}</ul>
      <button disabled={meter.dial === 'off' || !meter.red || !meter.black || reading.text === ''}
        onClick={() => st.addLog({ mode, points: `${pointName(project, meter.red)} → ${pointName(project, meter.black)}`, value: reading.value, text: reading.text, unit: reading.unit })}>📝 Anotar medida</button>
    </div>
  );
}
