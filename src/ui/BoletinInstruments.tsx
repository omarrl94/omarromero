/**
 * Instrumentos y cuadro de «El boletín», dibujados con detalle (carcasas, escalas, terminales y módulos DIN),
 * sin emoji ni formas de juguete.
 */
import type { ReactElement, ReactNode } from 'react';
import { circuitDef } from '../game/data';
import type { Reading } from '../boletin/instruments';
import type { Visit } from '../boletin/game';
import type { Prep } from '../boletin/instruments';
import type { TestKind } from '../boletin/rules';

const MONO = "ui-monospace, 'SF Mono', Consolas, 'Courier New', monospace";
const rad = (a: number) => (a * Math.PI) / 180;

function Screws({ pts, r = 4.5 }: { pts: [number, number][]; r?: number }) {
  return <>{pts.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={r} fill="url(#screw)" stroke="#0007" strokeWidth={0.6} /><path d={`M${x - r * 0.6} ${y - r * 0.2}l${r * 1.2} ${r * 0.4}`} stroke="#0008" strokeWidth={0.9} /></g>)}</>;
}
function Defs() {
  return (
    <defs>
      <linearGradient id="screw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d5d9de" /><stop offset="1" stopColor="#7d858d" /></linearGradient>
      <linearGradient id="yel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd84a" /><stop offset="1" stopColor="#e0a900" /></linearGradient>
      <linearGradient id="ora" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffb13b" /><stop offset="1" stopColor="#d9780a" /></linearGradient>
      <linearGradient id="grn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a4a42" /><stop offset="1" stopColor="#1f2a25" /></linearGradient>
      <linearGradient id="gry" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e8ebee" /><stop offset="1" stopColor="#b9c0c8" /></linearGradient>
      <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f8f1d8" /><stop offset="1" stopColor="#e9dfb9" /></linearGradient>
      <linearGradient id="lcd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b9c9a0" /><stop offset="1" stopColor="#9fb386" /></linearGradient>
      <radialGradient id="knob" cx="0.35" cy="0.3" r="0.9"><stop offset="0" stopColor="#4b4a47" /><stop offset="1" stopColor="#0f0e0d" /></radialGradient>
      <radialGradient id="redb" cx="0.35" cy="0.3" r="0.9"><stop offset="0" stopColor="#ff6a58" /><stop offset="1" stopColor="#a31d12" /></radialGradient>
      <linearGradient id="mod" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#dfe3e7" /><stop offset="0.5" stopColor="#f4f6f8" /><stop offset="1" stopColor="#cfd5db" /></linearGradient>
      <linearGradient id="cop" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#b3622f" /><stop offset="0.5" stopColor="#e9a36b" /><stop offset="1" stopColor="#9a5224" /></linearGradient>
      <linearGradient id="encl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#eef1f4" /><stop offset="1" stopColor="#cdd3da" /></linearGradient>
    </defs>
  );
}

/** Posición de la aguja (0–1) en escala logarítmica. */
const frac = (v: number | null, min: number, max: number) => (v === null ? 0 : Math.min(1, Math.max(0, (Math.log10(Math.max(v, min)) - Math.log10(min)) / (Math.log10(max) - Math.log10(min)))));

function ArcScale({ min, max, unit, band, cx, cy, R }: { min: number; max: number; unit: string; band?: [number, number]; cx: number; cy: number; R: number }) {
  const A0 = -58, A1 = 58;
  const pos = (f: number, r: number) => { const a = rad(A0 + (A1 - A0) * f); return [cx + r * Math.sin(a), cy - r * Math.cos(a)] as const; };
  const decs = Math.round(Math.log10(max / min));
  const out: ReactElement[] = [];
  for (let d = 0; d < decs; d++) for (let m = 1; m < 10; m++) {
    const v = min * Math.pow(10, d) * m;
    if (v > max * 1.0001) continue;
    const f = frac(v, min, max); const major = m === 1;
    const [x1, y1] = pos(f, R), [x2, y2] = pos(f, R - (major ? 14 : m === 5 ? 10 : 6));
    out.push(<line key={`${d}-${m}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2a2622" strokeWidth={major ? 1.8 : 1} />);
    if (major || m === 5) { const [tx, ty] = pos(f, R - 25); out.push(<text key={`t${d}-${m}`} x={tx} y={ty + 3} textAnchor="middle" fontSize={major ? 10 : 8} fontWeight={700} fill="#2a2622" fontFamily="Georgia, serif">{String(+v.toPrecision(2)).replace('.', ',')}</text>); }
  }
  const [ex, ey] = pos(1, R - 25);
  const arc = (f0: number, f1: number, r: number) => { const [a, b] = pos(f0, r), [c, d] = pos(f1, r); return `M${a} ${b}A${r} ${r} 0 0 1 ${c} ${d}`; };
  return (
    <g>
      {band && <path d={arc(frac(band[0], min, max), frac(band[1], min, max), R + 5)} stroke="#c4271a" strokeWidth={5} fill="none" opacity={0.85} />}
      {band && <path d={arc(frac(band[1], min, max), 1, R + 5)} stroke="#23a26d" strokeWidth={5} fill="none" opacity={0.85} />}
      <path d={arc(0, 1, R)} stroke="#2a2622" strokeWidth={1.6} fill="none" />
      {out}
      <text x={ex + 2} y={ey + 3} textAnchor="middle" fontSize={11} fill="#2a2622" fontFamily="Georgia, serif">∞</text>
      <text x={cx} y={cy - R * 0.52} textAnchor="middle" fontSize={15} fontWeight={800} fill="#2a2622" fontFamily="Georgia, serif">{unit}</text>
    </g>
  );
}

function Needle({ f, cx, cy, len }: { f: number; cx: number; cy: number; len: number }) {
  const ang = -58 + 116 * f;
  return (
    <g style={{ transform: `rotate(${ang}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: 'transform 1.1s cubic-bezier(.25,1.5,.45,1)' }}>
      <line x1={cx + 2} y1={cy} x2={cx + 2} y2={cy - len} stroke="#0003" strokeWidth={3} strokeLinecap="round" />
      <path d={`M${cx - 1.2} ${cy + 16}L${cx - 1.2} ${cy - len}L${cx + 1.2} ${cy - len}L${cx + 1.2} ${cy + 16}z`} fill="#b3201a" />
      <circle cx={cx} cy={cy + 12} r={4.5} fill="#2a2622" />
    </g>
  );
}

function Lcd({ x, y, w, h, top, big, unit, small, dim }: { x: number; y: number; w: number; h: number; top?: string; big: string; unit?: string; small?: string; dim?: boolean }) {
  return (
    <g>
      <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={8} fill="#1b1a18" />
      <rect x={x} y={y} width={w} height={h} rx={5} fill="url(#lcd)" />
      <text x={x + w - 12} y={y + h - 12} textAnchor="end" fontSize={h * 0.58} fontWeight={800} fontFamily={MONO} fill="#1f2a18" opacity={dim ? 0.35 : 1}>{big}</text>
      <text x={x + w - 12} y={y + h - 12} textAnchor="end" fontSize={h * 0.58} fontWeight={800} fontFamily={MONO} fill="#1f2a18" opacity={0.06}>{'8'.repeat(Math.max(3, big.length))}</text>
      {unit && <text x={x + 10} y={y + h - 12} fontSize={11} fontWeight={800} fontFamily={MONO} fill="#1f2a18">{unit}</text>}
      {top && <text x={x + 10} y={y + 14} fontSize={9} fontWeight={700} fontFamily={MONO} fill="#1f2a18">{top}</text>}
      {small && <text x={x + w - 12} y={y + 14} textAnchor="end" fontSize={9} fontWeight={700} fontFamily={MONO} fill="#1f2a18">{small}</text>}
    </g>
  );
}

function Jack({ x, y, color, label }: { x: number; y: number; color: string; label: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={13} fill="#14130f" /><circle cx={x} cy={y} r={10} fill="none" stroke={color} strokeWidth={3} /><circle cx={x} cy={y} r={4.5} fill="#000" stroke="#555" />
      <text x={x} y={y + 27} textAnchor="middle" fontSize={8} fontWeight={800} fill="#14130f" letterSpacing={0.6}>{label}</text>
    </g>
  );
}
function Lead({ d, color }: { d: string; color: string }) {
  return <g fill="none" strokeLinecap="round"><path d={d} stroke="#0004" strokeWidth={5} transform="translate(2 3)" /><path d={d} stroke={color} strokeWidth={4} /></g>;
}

function Knob({ cx, cy, r, labels, index }: { cx: number; cy: number; r: number; labels: string[]; index: number }) {
  const step = 56 / Math.max(1, labels.length - 1);
  const a0 = -28 - (labels.length - 1) * 0 ;
  const angle = (i: number) => (i - (labels.length - 1) / 2) * step * 1.0 + 0 * a0;
  return (
    <g>
      {labels.map((l, i) => { const a = rad(angle(i)); return <g key={l}><line x1={cx + (r + 4) * Math.sin(a)} y1={cy - (r + 4) * Math.cos(a)} x2={cx + (r + 10) * Math.sin(a)} y2={cy - (r + 10) * Math.cos(a)} stroke="#14130f" strokeWidth={1.6} /><text x={cx + (r + 20) * Math.sin(a)} y={cy - (r + 20) * Math.cos(a) + 3} textAnchor="middle" fontSize={8.5} fontWeight={800} fill="#14130f">{l}</text></g>; })}
      <circle cx={cx} cy={cy} r={r + 2} fill="#0006" transform="translate(1.5 2.5)" /><circle cx={cx} cy={cy} r={r} fill="url(#knob)" stroke="#000" strokeWidth={1.2} />
      {Array.from({ length: 24 }, (_, i) => <line key={i} x1={cx + (r - 1) * Math.sin(rad(i * 15))} y1={cy - (r - 1) * Math.cos(rad(i * 15))} x2={cx + (r - 5) * Math.sin(rad(i * 15))} y2={cy - (r - 5) * Math.cos(rad(i * 15))} stroke="#ffffff22" strokeWidth={1.2} />)}
      <g style={{ transform: `rotate(${angle(index)}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: 'transform .4s ease' }}><rect x={cx - 2.2} y={cy - r + 3} width={4.4} height={r * 0.55} rx={2} fill="#f4f4f4" /></g>
    </g>
  );
}

/* ───────── Megóhmetro y medidor de continuidad ───────── */
export function Megger({ kind, reading, running, volts, pair, band }: { kind: 'aislamiento' | 'continuidad'; reading: Reading | null; running: boolean; volts: number; pair: string; band: boolean }) {
  const iso = kind === 'aislamiento';
  const min = iso ? 0.01 : 0.05, max = iso ? 1000 : 200;
  const f = running ? 0.82 : reading && reading.value !== null ? frac(iso ? reading.value : reading.value, min, max) : 0;
  const bandRange: [number, number] | undefined = band ? (iso ? [min, 0.5] : [2, max]) : undefined;
  const vIdx = [250, 500, 1000].indexOf(volts);
  return (
    <svg viewBox="0 0 360 300" className="bt-inst-svg" role="img" aria-label={iso ? 'Medidor de aislamiento' : 'Medidor de continuidad'}>
      <Defs />
      <rect x={3} y={3} width={354} height={294} rx={30} fill="#1d1b18" />
      <rect x={10} y={10} width={340} height={280} rx={24} fill={iso ? 'url(#yel)' : 'url(#ora)'} />
      <rect x={10} y={10} width={340} height={280} rx={24} fill="none" stroke="#ffffff55" strokeWidth={1.5} />
      <Screws pts={[[26, 26], [334, 26], [26, 274], [334, 274]]} />
      <rect x={34} y={26} width={292} height={134} rx={10} fill="#14130f" /><rect x={38} y={30} width={284} height={126} rx={7} fill="url(#paper)" />
      <clipPath id="mg-win"><rect x={38} y={30} width={284} height={126} rx={7} /></clipPath>
      <g clipPath="url(#mg-win)"><ArcScale min={min} max={max} unit={iso ? 'MΩ' : 'Ω'} band={bandRange} cx={180} cy={196} R={138} /><Needle f={f} cx={180} cy={196} len={128} /></g>
      <rect x={38} y={30} width={284} height={126} rx={7} fill="none" stroke="#0003" />
      <path d="M44 36h130" stroke="#ffffff66" strokeWidth={6} strokeLinecap="round" opacity={0.4} />
      <text x={46} y={172} fontSize={8.5} fontWeight={800} letterSpacing={1.8} fill="#14130f">{iso ? 'INSULATION TESTER · MIT-500' : 'CONTINUITY TESTER · 200 mA'}</text>
      <Lcd x={42} y={180} w={190} h={46} top={iso ? `${volts} V DC · ${pair}` : 'CONTINUIDAD · 200 mA'} big={running ? '- - -' : reading ? (reading.danger ? 'HI-V' : reading.text) : '—'} unit={reading && !reading.danger ? reading.unit : undefined} small={running ? 'TEST' : undefined} dim={!reading && !running} />
      {iso ? <Knob cx={290} cy={214} r={21} labels={['250', '500', '1000']} index={Math.max(0, vIdx)} /> : <g><rect x={262} y={186} width={56} height={40} rx={6} fill="#1b1a18" /><text x={290} y={204} textAnchor="middle" fontSize={9} fontWeight={800} fill="#ffb13b">AUTO</text><text x={290} y={219} textAnchor="middle" fontSize={9} fontWeight={800} fill="#ffb13b">ZERO</text></g>}
      <Jack x={112} y={246} color="#d62b1f" label="LINE" /><Jack x={180} y={246} color="#2a2a2a" label="EARTH" /><Jack x={248} y={246} color="#2a6fd6" label="GUARD" />
      <Lead d="M99 246C70 246 56 276 28 290" color="#d62b1f" /><Lead d="M261 246C290 246 304 276 332 290" color="#2a2a2a" />
    </svg>
  );
}

/* ───────── Telurómetro ───────── */
export function EarthTester({ reading, running, dist }: { reading: Reading | null; running: boolean; dist: number }) {
  const v = reading && reading.value !== null ? reading.value : null;
  const bars = v === null ? 0 : Math.round(frac(v, 1, 10000) * 20);
  return (
    <svg viewBox="0 0 360 300" className="bt-inst-svg" role="img" aria-label="Telurómetro">
      <Defs />
      <rect x={3} y={3} width={354} height={294} rx={26} fill="#0f1713" /><rect x={10} y={10} width={340} height={280} rx={20} fill="url(#grn)" />
      <rect x={10} y={10} width={340} height={280} rx={20} fill="none" stroke="#ffffff22" />
      <Screws pts={[[26, 26], [334, 26], [26, 274], [334, 274]]} />
      <Lcd x={44} y={34} w={272} h={78} top={`3 POLOS · ${dist} m`} big={running ? '- - - -' : reading ? reading.text : '—'} unit={reading && !reading.danger ? reading.unit : 'Ω'} small={running ? 'MIDIENDO' : 'Ra'} dim={!reading && !running} />
      <g transform="translate(44 126)">{Array.from({ length: 20 }, (_, i) => <rect key={i} x={i * 13.6} y={0} width={10.6} height={14} rx={2} fill={i < bars ? (i < 12 ? '#6cc24a' : i < 16 ? '#ffd23f' : '#ff5d4a') : '#ffffff1a'} />)}<text x={0} y={28} fontSize={8} fill="#9fb4a6" fontWeight={700}>1</text><text x={136} y={28} fontSize={8} fill="#9fb4a6" fontWeight={700}>100 Ω</text><text x={272} y={28} textAnchor="end" fontSize={8} fill="#9fb4a6" fontWeight={700}>10 kΩ</text></g>
      <text x={46} y={184} fontSize={8.5} fontWeight={800} letterSpacing={1.8} fill="#9fb4a6">EARTH RESISTANCE TESTER · ET-3P</text>
      <Knob cx={78} cy={238} r={20} labels={['2P', '3P', 'ρ']} index={1} />
      <g fill="#cfd6df" fontSize={8} fontWeight={800}><rect x={122} y={226} width={76} height={24} rx={5} fill="#2c3a32" stroke="#ffffff22" /><text x={160} y={241} textAnchor="middle" fill="#cfd6df">HOLD</text></g>
      <rect x={210} y={206} width={96} height={50} rx={8} fill="#0f1713" /><Jack x={232} y={226} color="#6cc24a" label="E" /><Jack x={258} y={226} color="#ffd23f" label="S" /><Jack x={284} y={226} color="#d62b1f" label="H" />
      <Lead d="M232 240C232 275 150 282 70 292" color="#6cc24a" /><Lead d="M258 240C258 280 220 286 190 294" color="#ffd23f" /><Lead d="M284 240C284 280 320 286 340 294" color="#d62b1f" />
    </svg>
  );
}

/* ───────── Comprobador de diferenciales ───────── */
export function RcdTester({ reading, running }: { reading: Reading | null; running: boolean }) {
  const ex = reading?.extra;
  return (
    <svg viewBox="0 0 360 300" className="bt-inst-svg" role="img" aria-label="Comprobador de diferenciales">
      <Defs />
      <rect x={3} y={3} width={354} height={294} rx={28} fill="#2a2d31" /><rect x={10} y={10} width={340} height={280} rx={22} fill="url(#gry)" />
      <rect x={10} y={10} width={340} height={46} rx={22} fill="url(#ora)" /><rect x={10} y={40} width={340} height={16} fill="url(#ora)" />
      <text x={30} y={40} fontSize={13} fontWeight={900} letterSpacing={2} fill="#2a2622">RCD TESTER · RT-30</text>
      <Screws pts={[[26, 74], [334, 74], [26, 274], [334, 274]]} />
      <rect x={38} y={72} width={284} height={112} rx={8} fill="#1b1a18" /><rect x={43} y={77} width={274} height={102} rx={5} fill="url(#lcd)" />
      <g fontFamily={MONO} fontWeight={800} fill="#1f2a18">
        <text x={52} y={94} fontSize={9}>IΔn 30 mA · TIPO A/AC</text>
        <text x={308} y={94} textAnchor="end" fontSize={9}>{running ? 'RAMPA…' : reading && !reading.danger ? 'FIN' : 'LISTO'}</text>
        <text x={52} y={124} fontSize={10}>I disp.</text><text x={308} y={126} textAnchor="end" fontSize={22}>{running ? '···' : reading && !reading.danger ? ex?.dispara ?? reading.text : '—'}</text>
        <text x={52} y={148} fontSize={10}>t IΔn</text><text x={308} y={149} textAnchor="end" fontSize={15}>{running ? '···' : reading && !reading.danger && ex ? ex.t1 : '—'}</text>
        <text x={52} y={168} fontSize={10}>t 5·IΔn</text><text x={308} y={169} textAnchor="end" fontSize={15}>{running ? '···' : reading && !reading.danger && ex ? ex.t5 : '—'}</text>
      </g>
      <g transform="translate(46 196)">{[['×½', '15 mA'], ['×1', '30 mA'], ['×5', '150 mA'], ['RAMPA', 'auto']].map(([a, b], i) => <g key={a} transform={`translate(${i * 70} 0)`}><rect width={62} height={36} rx={7} fill="#f4f6f8" stroke="#8b939c" /><rect x={0} y={28} width={62} height={8} rx={4} fill="#c4cad1" opacity={0.7} /><text x={31} y={15} textAnchor="middle" fontSize={11} fontWeight={900} fill="#14130f">{a}</text><text x={31} y={26} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#5d6b7e">{b}</text></g>)}</g>
      <rect x={38} y={244} width={284} height={36} rx={8} fill="#1b1a18" /><text x={60} y={266} fontSize={9} fontWeight={800} fill="#d6dde4" letterSpacing={1.2}>L</text><text x={150} y={266} fontSize={9} fontWeight={800} fill="#d6dde4" letterSpacing={1.2}>N</text><text x={240} y={266} fontSize={9} fontWeight={800} fill="#d6dde4" letterSpacing={1.2}>PE</text>
      {[[70, '#8a5a2b'], [160, '#2a6fd6'], [250, '#e0c200']].map(([x, c]) => <g key={String(x)}><circle cx={Number(x)} cy={262} r={9} fill="#0a0a0a" stroke={String(c)} strokeWidth={3} /><circle cx={Number(x)} cy={262} r={3.5} fill="#000" /></g>)}
    </svg>
  );
}

/* ───────── Frontal del cuadro con módulos DIN ───────── */
function Module({ x, y, w, h, children, lit }: { x: number; y: number; w: number; h: number; children?: ReactNode; lit?: string }) {
  return (
    <g>
      <rect x={x + 1} y={y + 2} width={w} height={h} rx={3} fill="#0003" />
      <rect x={x} y={y} width={w} height={h} rx={3} fill="url(#mod)" stroke={lit ?? '#98a1ab'} strokeWidth={lit ? 2.2 : 1} />
      <rect x={x} y={y} width={w} height={11} rx={3} fill="#c4cad1" /><rect x={x} y={y + h - 11} width={w} height={11} rx={3} fill="#c4cad1" />
      {[x + w * 0.5].map((cx) => <g key={cx}><circle cx={cx} cy={y + 5.5} r={3.4} fill="url(#screw)" stroke="#0007" strokeWidth={0.5} /><circle cx={cx} cy={y + h - 5.5} r={3.4} fill="url(#screw)" stroke="#0007" strokeWidth={0.5} /></g>)}
      {children}
    </g>
  );
}
function Lever({ x, y, on, red }: { x: number; y: number; on: boolean; red?: boolean }) {
  return <g><rect x={x - 7} y={y - 14} width={14} height={28} rx={3} fill="#15140f" /><rect x={x - 5} y={on ? y - 13 : y + 1} width={10} height={12} rx={2} fill={red ? '#d9351f' : '#f2f2f2'} stroke="#0007" strokeWidth={0.6} /></g>;
}

export function PanelFront({ visit, prep, tab, circuit, rcdId, onPrep, onPickCircuit, onPickRcd }: { visit: Visit; prep: Prep; tab: TestKind; circuit: string; rcdId?: string; onPrep: (k: keyof Prep) => void; onPickCircuit: (c: string) => void; onPickRcd: (id: string) => void }) {
  const lay = visit.layout;
  const ids = lay ? Object.keys(lay.routes) : visit.truth.circuits.map((c) => c.id);
  const energized = !prep.igaOpen;
  const rcds = visit.truth.rcds;
  return (
    <svg viewBox="0 0 560 270" className="bt-panel-svg" role="group" aria-label="Frontal del cuadro eléctrico">
      <Defs />
      <rect x={4} y={4} width={552} height={262} rx={12} fill="url(#encl)" stroke="#7d858d" strokeWidth={2} /><rect x={14} y={14} width={532} height={242} rx={7} fill="none" stroke="#aab2bb" />
      <text x={280} y={29} textAnchor="middle" fontSize={9} fontWeight={800} letterSpacing={3} fill="#5d6b7e">CUADRO GENERAL DE MANDO Y PROTECCIÓN</text>
      <circle cx={532} cy={28} r={5} fill={energized ? '#37d67a' : '#6b7480'} stroke="#0006" /><text x={520} y={31} textAnchor="end" fontSize={8} fontWeight={700} fill="#5d6b7e">{energized ? 'TENSIÓN' : 'SIN TENSIÓN'}</text>
      {/* carriles DIN */}
      {[[40, 98], [150, 98]].map(([y], i) => <g key={i}><rect x={24} y={y + 36} width={512} height={14} rx={2} fill="#a7afb8" opacity={0.0} /><rect x={24} y={y + 28} width={512} height={7} fill="#9aa3ad" opacity={0.0} /></g>)}
      <rect x={24} y={76} width={512} height={7} fill="#c0c7cf" /><rect x={24} y={186} width={512} height={7} fill="#c0c7cf" />
      {/* IGA */}
      <g onPointerDown={() => onPrep('igaOpen')} style={{ cursor: 'pointer' }} role="button" aria-label="Interruptor general">
        <Module x={30} y={46} w={58} h={86}><Lever x={59} y={89} on={!prep.igaOpen} red={prep.igaOpen} /><text x={59} y={72} textAnchor="middle" fontSize={8} fontWeight={800} fill="#14130f">IGA</text><text x={59} y={118} textAnchor="middle" fontSize={7} fontWeight={700} fill="#14130f">2P 40 A</text><circle cx={59} cy={80} r={3} fill={prep.igaOpen ? '#d9351f' : '#23a26d'} /></Module>
      </g>
      {/* diferenciales */}
      {rcds.map((r, i) => {
        const sel = tab === 'diferencial' && rcdId === r.id;
        return (
          <g key={r.id} onPointerDown={() => onPickRcd(r.id)} style={{ cursor: 'pointer' }} role="button" aria-label={`Diferencial ${r.id}`}>
            <Module x={96 + i * 66} y={46} w={58} h={86} lit={sel ? '#ff9f1c' : undefined}>
              <Lever x={125 + i * 66} y={99} on={!prep.igaOpen} />
              <rect x={102 + i * 66} y={62} width={46} height={13} rx={2} fill="#fff" stroke="#8b939c" /><text x={125 + i * 66} y={72} textAnchor="middle" fontSize={7.5} fontWeight={800} fill="#14130f">{r.id} · 30 mA</text>
              <circle cx={140 + i * 66} cy={118} r={4.2} fill="#f2c21a" stroke="#0007" strokeWidth={0.6} /><text x={140 + i * 66} y={120.5} textAnchor="middle" fontSize={5.5} fontWeight={900} fill="#14130f">T</text>
              
            </Module>
          </g>
        );
      })}
      {/* limitador de sobretensiones: cartucho extraíble */}
      {visit.truth.spd && (
        <g onPointerDown={() => onPrep('spdOff')} style={{ cursor: 'pointer' }} role="button" aria-label="Limitador de sobretensiones">
          <Module x={96 + rcds.length * 66} y={46} w={40} h={86}>
            <rect x={101 + rcds.length * 66} y={prep.spdOff ? 84 : 60} width={30} height={46} rx={3} fill="#6a3fb5" stroke="#0007" strokeWidth={0.8} style={{ transition: 'y .35s' }} />
            <rect x={107 + rcds.length * 66} y={prep.spdOff ? 92 : 68} width={18} height={8} rx={1.5} fill={prep.spdOff ? '#d9351f' : '#37d67a'} /><text x={116 + rcds.length * 66} y={prep.spdOff ? 118 : 94} textAnchor="middle" fontSize={7} fontWeight={800} fill="#fff">SPD</text>
          </Module>
        </g>
      )}
      <text x={59} y={147} textAnchor="middle" fontSize={7} fontWeight={700} fill="#5d6b7e">GENERAL</text>
      {/* PIAs */}
      {ids.map((id, i) => {
        const c = circuitDef(id); const sel = tab !== 'tierra' && tab !== 'diferencial' && circuit === id; const x = 30 + i * 38;
        return (
          <g key={id} onPointerDown={() => onPickCircuit(id)} style={{ cursor: 'pointer' }} role="button" aria-label={`Circuito ${id}`}>
            <Module x={x} y={156} w={32} h={74} lit={sel ? c.color : undefined}>
              <Lever x={x + 16} y={193} on={!prep.igaOpen || true} />
              <text x={x + 16} y={171} textAnchor="middle" fontSize={7.5} fontWeight={800} fill="#14130f">C{c.inA}</text>
            </Module>
            <rect x={x - 1} y={236} width={34} height={12} rx={2} fill="#fff" stroke="#8b939c" /><rect x={x - 1} y={236} width={34} height={3} rx={1} fill={c.color} /><text x={x + 16} y={246} textAnchor="middle" fontSize={7.5} fontWeight={800} fill="#14130f">{id}</text>
          </g>
        );
      })}
      {/* barra de tierra */}
      <g transform="translate(400 160)"><rect x={0} y={8} width={130} height={14} rx={2} fill="url(#cop)" stroke="#6b3a17" />{Array.from({ length: 9 }, (_, i) => <circle key={i} cx={8 + i * 14} cy={15} r={3.4} fill="url(#screw)" stroke="#0007" strokeWidth={0.5} />)}<text x={65} y={38} textAnchor="middle" fontSize={8} fontWeight={800} fill="#5d6b7e">BARRA DE TIERRA (PE)</text></g>
      <g transform="translate(400 206)"><rect x={0} y={0} width={130} height={14} rx={2} fill="#b9c0c8" stroke="#6b7480" />{Array.from({ length: 9 }, (_, i) => <circle key={i} cx={8 + i * 14} cy={7} r={3.4} fill="url(#screw)" stroke="#0007" strokeWidth={0.5} />)}<text x={65} y={30} textAnchor="middle" fontSize={8} fontWeight={800} fill="#5d6b7e">BARRA DE NEUTRO (N)</text></g>
    </svg>
  );
}
