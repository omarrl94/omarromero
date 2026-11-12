import { useEffect, useMemo, useState } from 'react';
import { normaNum } from '../data/content';
import { circuitoSano, inyecta, mideAislamiento, mideContinuidad, mideFuga, mideTension, type Averia, type Lectura, type Punto } from '../engine/averias';
import { DefsAparatos, DiferencialSvg, IgaSvg, PiaSvg } from './sim/Aparatos';

type PuntoId = 'sF' | 'sN' | 'sPE' | 'cF' | 'cN' | 'cPE';
const COND = (p: PuntoId): Punto => p.slice(1) as Punto;
const EXTREMO = (p: PuntoId) => p[0] as 's' | 'c';
const PUNTOS: Record<PuntoId, { x: number; y: number; txt: string; c: string }> = {
  cF: { x: 84, y: 156, txt: 'F', c: '#8b5a2b' }, cN: { x: 134, y: 156, txt: 'N', c: '#2a73c8' }, cPE: { x: 184, y: 156, txt: 'PE', c: '#a9c92d' },
  sF: { x: 106, y: 340, txt: 'F', c: '#8b5a2b' }, sN: { x: 162, y: 340, txt: 'N', c: '#2a73c8' }, sPE: { x: 134, y: 306, txt: 'PE', c: '#a9c92d' },
};
const DIAL = ['OFF', 'V~', 'Ω'] as const;

function Hot({ id, activo, color, onClick, disabled }: { id: PuntoId; activo: boolean; color: string; onClick: () => void; disabled: boolean }) {
  const p = PUNTOS[id];
  return (
    <g role="button" tabIndex={0} aria-label={`Punto de prueba ${id.startsWith('c') ? 'cuadro' : 'base'} ${p.txt}${activo ? ' (punta colocada)' : ''}`} className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-white"
      onClick={() => !disabled && onClick()} onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) { e.preventDefault(); onClick(); } }}>
      <circle cx={p.x} cy={p.y} r="11" fill="#12171a" stroke={activo ? color : '#8d999e'} strokeWidth={activo ? 3 : 1.5} />
      <circle cx={p.x} cy={p.y} r="5" fill={p.c} />
      <text x={p.x} y={p.y + 25} textAnchor="middle" fontSize="10" fontWeight="700" fill="#222" fontFamily="Arial, sans-serif">{p.txt}</text>
    </g>
  );
}

/** Banco de pruebas realista: cuadro con IGA, base de enchufe con puntos de prueba y multímetro, megóhmetro y pinza. */
export function Instrumento({ averia, alimentadoInicial, bloqueado, onSeguridad }: { averia: string; alimentadoInicial: boolean; bloqueado: boolean; onSeguridad: () => void }) {
  const [alimentado, setAlimentado] = useState(alimentadoInicial);
  const [tab, setTab] = useState<'mm' | 'meg' | 'pinza'>('mm');
  const [dial, setDial] = useState(0);
  const [rojo, setRojo] = useState<PuntoId | null>(null);
  const [negro, setNegro] = useState<PuntoId | null>(null);
  const [test, setTest] = useState<Lectura | null>(null);
  const [pinza, setPinza] = useState<Lectura | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [dano, setDano] = useState(false);
  const circuito = useMemo(() => ({ ...inyecta(circuitoSano(), averia as Averia), alimentado }), [averia, alimentado]);
  const U = normaNum('tension.monofasica');
  const anota = (t: string) => setLog((x) => (x[x.length - 1] === t ? x : [...x.slice(-5), t]));

  const lecturaMM = useMemo<{ txt: string; danio?: boolean }>(() => {
    if (dial === 0) return { txt: '' };
    if (!rojo || !negro) return { txt: dial === 1 ? '---- V' : '---- Ω' };
    const a = COND(rojo), b = COND(negro);
    if (dial === 1) { const l = mideTension(circuito, a, b, U); return { txt: a === b ? '0 V' : l.texto }; }
    if (alimentado) return { txt: 'ERR', danio: true };
    if (a === b && EXTREMO(rojo) !== EXTREMO(negro)) return { txt: mideContinuidad(circuito, a).texto };
    return { txt: a === b ? '0.00 Ω' : 'OL' };
  }, [dial, rojo, negro, circuito, alimentado, U]);

  useEffect(() => {
    if (tab === 'mm' && dial > 0 && rojo && negro) anota(`Multímetro ${DIAL[dial]} ${rojo}→${negro}: ${lecturaMM.txt}`);
  }, [lecturaMM, tab, dial, rojo, negro]);
  useEffect(() => {
    if (tab === 'mm' && lecturaMM.danio && !dano) { setDano(true); onSeguridad(); anota('Multímetro dañado: se midió continuidad con tensión.'); }
  }, [lecturaMM.danio, tab, dano, onSeguridad]);

  const punto = (id: PuntoId) => {
    if (!rojo || (rojo && negro)) { setRojo(id); setNegro(null); } else { setNegro(id); }
  };
  const ensaya = () => {
    if (!rojo || !negro) { setTest({ valor: NaN, unidad: 'MΩ', texto: 'Coloca las puntas' }); return; }
    const l = mideAislamiento(circuito);
    setTest(l); anota(`Megóhmetro 500 V ${rojo}→${negro}: ${l.texto}`);
    if (l.danio && !dano) { setDano(true); onSeguridad(); }
  };
  const abraza = () => { const l = mideFuga(circuito); setPinza(l); anota(`Pinza de fugas (F+N): ${l.texto}`); };
  const alterna = () => { if (bloqueado) return; setAlimentado((a) => !a); setTest(null); setPinza(null); anota(alimentado ? 'IGA abierto. Ausencia de tensión comprobada.' : 'IGA cerrado: instalación con tensión.'); };

  const jacks = tab === 'mm' ? { com: { x: 500, y: 372 }, v: { x: 570, y: 372 } } : { com: { x: 500, y: 372 }, v: { x: 570, y: 372 } };
  const lead = (j: { x: number; y: number }, p: PuntoId | null, c: string, idx: number) => {
    const t = p ? PUNTOS[p] : { x: 340 + idx * 14, y: 410 };
    return <g><path d={`M${j.x} ${j.y} C ${j.x} ${j.y + 60}, ${t.x + 110} ${t.y + 70}, ${t.x} ${t.y}`} fill="none" stroke="#000" strokeOpacity=".35" strokeWidth="6" transform="translate(1.5 2)" /><path d={`M${j.x} ${j.y} C ${j.x} ${j.y + 60}, ${t.x + 110} ${t.y + 70}, ${t.x} ${t.y}`} fill="none" stroke={c} strokeWidth="4.5" strokeLinecap="round" />{p && <g><circle cx={t.x} cy={t.y} r="3.5" fill="#d8d8d8" stroke="#333" /></g>}</g>;
  };

  return (
    <section className="grid gap-3 rounded-lg border border-line bg-panel p-3" aria-label="Banco de pruebas">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="Instrumento" className="flex gap-1">
          {([['mm', 'Multímetro'], ['meg', 'Megóhmetro'], ['pinza', 'Pinza de fugas']] as const).map(([k, t]) => (
            <button key={k} role="tab" aria-selected={tab === k} type="button" disabled={bloqueado} onClick={() => setTab(k)} className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${tab === k ? 'border-acc bg-acc/10 text-acct' : 'border-line text-mute hover:text-tx'}`}>{t}</button>
          ))}
        </div>
        <span className={`chip ${alimentado ? 'border-bad/50 text-bad' : 'border-ok/50 text-ok'}`}>{alimentado ? 'INSTALACIÓN CON TENSIÓN' : 'INSTALACIÓN SIN TENSIÓN'}</span>
      </div>
      <svg viewBox="0 0 720 440" className="w-full rounded-md border border-line" role="group" aria-label="Instalación e instrumento">
        <DefsAparatos />
        <defs>
          <linearGradient id="pared" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d6cfbf" /><stop offset="1" stopColor="#b9b2a2" /></linearGradient>
          <linearGradient id="cuadro" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#9aa5aa" /><stop offset="1" stopColor="#7d888d" /></linearGradient>
          <linearGradient id="amarillo" x1="0" x2="1"><stop offset="0" stopColor="#f6cf3c" /><stop offset="1" stopColor="#c99a14" /></linearGradient>
          <linearGradient id="naranja" x1="0" x2="1"><stop offset="0" stopColor="#f3873b" /><stop offset="1" stopColor="#b9531a" /></linearGradient>
          <linearGradient id="lcd" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#b6c9ae" /><stop offset="1" stopColor="#97ad8f" /></linearGradient>
        </defs>
        <rect width="720" height="440" fill="#1a2024" />
        <rect x="0" y="0" width="380" height="440" fill="url(#pared)" />
        {/* Cuadro */}
        <rect x="14" y="14" width="250" height="196" rx="8" fill="url(#cuadro)" stroke="#4d575c" strokeWidth="3" filter="url(#sombra)" />
        <rect x="24" y="64" width="230" height="9" fill="#cfd5d9" stroke="#5c676d" />
        <g transform="translate(56 40) scale(.72)"><g role="button" tabIndex={0} aria-label={alimentado ? 'IGA cerrado. Pulsa para abrir' : 'IGA abierto. Pulsa para cerrar'} className="cursor-pointer outline-none" onClick={alterna} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alterna(); } }}><rect x="-30" y="-6" width="60" height="108" fill="transparent" /><IgaSvg cx={0} y={0} on={alimentado} /></g></g>
        <g transform="translate(112 40) scale(.72)"><DiferencialSvg cx={0} y={0} /></g>
        <g transform="translate(166 40) scale(.72)"><PiaSvg cx={0} y={0} calibre="10" /></g>
        <g transform="translate(206 40) scale(.72)"><PiaSvg cx={0} y={0} calibre="16" /></g>
        <rect x="28" y="130" width="212" height="42" rx="4" fill="#e3e7ea" stroke="#5c676d" /><text x="34" y="143" fontSize="8" fill="#555" fontFamily="Arial, sans-serif">Bornas de salida del circuito</text>
        <circle cx="236" cy="30" r="6" fill={alimentado ? '#3fe27a' : '#2a3a2e'} stroke="#222" /><text x="236" y="50" textAnchor="middle" fontSize="7" fill="#222" fontFamily="Arial, sans-serif">tensión</text>
        {/* Conductores hasta la base */}
        {(['cF', 'cN', 'cPE'] as const).map((c, i) => { const s = (['sF', 'sN', 'sPE'] as const)[i]!; const a = PUNTOS[c], b = PUNTOS[s]; return <path key={c} d={`M${a.x} ${a.y + 14} C ${a.x} ${a.y + 110}, ${b.x} ${b.y - 80}, ${b.x} ${b.y - 12}`} fill="none" stroke={a.c} strokeWidth="5" strokeLinecap="round" opacity=".95" />; })}
        {/* Base de enchufe */}
        <g filter="url(#sombra)"><rect x="70" y="276" width="128" height="140" rx="10" fill="#f4f1ea" stroke="#b9b3a3" strokeWidth="2" /><circle cx="134" cy="346" r="48" fill="#e7e3d8" stroke="#bdb7a7" /><circle cx="134" cy="346" r="42" fill="#d4cfc2" stroke="#a9a393" /><circle cx="106" cy="346" r="6" fill="#1b1b1b" /><circle cx="162" cy="346" r="6" fill="#1b1b1b" /><rect x="125" y="304" width="18" height="6" rx="2" fill="url(#gMetal)" stroke="#777" /><rect x="125" y="382" width="18" height="6" rx="2" fill="url(#gMetal)" stroke="#777" /></g>
        {(Object.keys(PUNTOS) as PuntoId[]).map((id) => <Hot key={id} id={id} activo={rojo === id || negro === id} color={rojo === id ? '#e5534b' : '#222'} onClick={() => punto(id)} disabled={bloqueado} />)}
        {/* Instrumento */}
        {tab === 'mm' && (
          <g filter="url(#sombra)">
            <rect x="430" y="14" width="190" height="400" rx="22" fill="#2a2f33" stroke="#111" strokeWidth="2" /><rect x="438" y="22" width="174" height="384" rx="16" fill="url(#amarillo)" stroke="#8d6b0b" />
            <rect x="454" y="40" width="142" height="74" rx="6" fill="url(#lcd)" stroke="#333" strokeWidth="3" />
            <text x="590" y="94" textAnchor="end" fontSize={lecturaMM.txt.length > 7 ? 22 : 30} fontFamily="'Courier New', monospace" fontWeight="700" fill="#1d2a1d" aria-live="polite">{lecturaMM.txt || ''}</text>
            <text x="460" y="58" fontSize="9" fill="#2d3b2d" fontFamily="Arial, sans-serif">{dial === 1 ? 'AC' : dial === 2 ? 'CONT' : ''}</text>
            <g role="button" tabIndex={0} aria-label={`Selector del multímetro, posición ${DIAL[dial]}. Pulsa para cambiar`} className="cursor-pointer outline-none" onClick={() => !bloqueado && setDial((d) => (d + 1) % 3)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!bloqueado) setDial((d) => (d + 1) % 3); } }}>
              <circle cx="525" cy="235" r="62" fill="#1d2124" stroke="#000" strokeWidth="2" />
              {Array.from({ length: 24 }, (_, i) => <line key={i} x1={525 + 54 * Math.cos((i * Math.PI) / 12)} y1={235 + 54 * Math.sin((i * Math.PI) / 12)} x2={525 + 60 * Math.cos((i * Math.PI) / 12)} y2={235 + 60 * Math.sin((i * Math.PI) / 12)} stroke="#444" strokeWidth="2" />)}
              <circle cx="525" cy="235" r="46" fill="url(#gNegro)" stroke="#555" />
              <g transform={`rotate(${-60 + dial * 60} 525 235)`}><path d="M520 235L525 192L530 235z" fill="#EFCD2F" /></g>
              {DIAL.map((t, i) => <text key={t} x={525 + 78 * Math.cos(((-150 + i * 60) * Math.PI) / 180)} y={235 + 78 * Math.sin(((-150 + i * 60) * Math.PI) / 180) + 4} fontSize="12" fontWeight="700" textAnchor="middle" fill="#2a2f33" fontFamily="Arial, sans-serif">{t}</text>)}
            </g>
            <text x="500" y="352" textAnchor="middle" fontSize="9" fill="#2a2f33" fontFamily="Arial, sans-serif">COM</text><text x="570" y="352" textAnchor="middle" fontSize="9" fill="#2a2f33" fontFamily="Arial, sans-serif">V Ω</text>
            <circle cx="500" cy="372" r="11" fill="#111" stroke="#555" strokeWidth="3" /><circle cx="570" cy="372" r="11" fill="#c0392b" stroke="#555" strokeWidth="3" />
          </g>
        )}
        {tab === 'meg' && (
          <g filter="url(#sombra)">
            <rect x="430" y="14" width="190" height="400" rx="22" fill="#2a2f33" stroke="#111" strokeWidth="2" /><rect x="438" y="22" width="174" height="384" rx="16" fill="url(#naranja)" stroke="#7a3510" />
            <text x="525" y="46" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1d1d1d" fontFamily="Arial, sans-serif">MEDIDOR DE AISLAMIENTO</text>
            <rect x="454" y="58" width="142" height="74" rx="6" fill="url(#lcd)" stroke="#333" strokeWidth="3" />
            <text x="590" y="108" textAnchor="end" fontSize="26" fontFamily="'Courier New', monospace" fontWeight="700" fill="#1d2a1d" aria-live="polite">{test ? test.texto : '---- MΩ'}</text>
            <text x="460" y="76" fontSize="9" fill="#2d3b2d" fontFamily="Arial, sans-serif">ENSAYO 500 V</text>
            <g role="button" tabIndex={0} aria-label="Pulsador TEST 500 V" className="cursor-pointer outline-none" onClick={() => !bloqueado && ensaya()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!bloqueado) ensaya(); } }}>
              <circle cx="525" cy="240" r="48" fill="#8a1f16" stroke="#000" strokeWidth="3" /><circle cx="525" cy="240" r="40" fill="#c0392b" stroke="#6b130d" /><text x="525" y="245" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">TEST</text>
            </g>
            <circle cx="500" cy="372" r="11" fill="#111" stroke="#555" strokeWidth="3" /><circle cx="570" cy="372" r="11" fill="#c0392b" stroke="#555" strokeWidth="3" />
          </g>
        )}
        {tab === 'pinza' && (
          <g filter="url(#sombra)">
            <path d="M470 20h110v170h-110z" fill="#2a2f33" /><rect x="460" y="150" width="130" height="260" rx="22" fill="#2a2f33" stroke="#111" strokeWidth="2" /><rect x="468" y="158" width="114" height="244" rx="16" fill="url(#amarillo)" stroke="#8d6b0b" />
            <path d="M440 120a85 85 0 0 1 170 0v50h-36v-50a49 49 0 0 0-98 0v50h-36z" fill="#2a2f33" stroke="#111" strokeWidth="2" /><path d="M452 120a73 73 0 0 1 146 0v40h-14v-40a59 59 0 0 0-118 0v40h-14z" fill="#454b50" />
            <rect x="484" y="176" width="82" height="52" rx="5" fill="url(#lcd)" stroke="#333" strokeWidth="3" /><text x="560" y="214" textAnchor="end" fontSize="22" fontFamily="'Courier New', monospace" fontWeight="700" fill="#1d2a1d" aria-live="polite">{pinza ? pinza.texto : '---- mA'}</text>
            <g role="button" tabIndex={0} aria-label="Abrazar fase y neutro con la pinza" className="cursor-pointer outline-none" onClick={() => !bloqueado && abraza()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!bloqueado) abraza(); } }}>
              <rect x="486" y="260" width="78" height="46" rx="8" fill="#12171a" stroke="#555" /><text x="525" y="288" textAnchor="middle" fontSize="11" fontWeight="700" fill="#EFCD2F" fontFamily="Arial, sans-serif">MEDIR FUGA</text>
            </g>
          </g>
        )}
        {tab !== 'pinza' && <>{lead(jacks.com, negro, '#1b1b1b', 0)}{lead(jacks.v, rojo, '#c0392b', 1)}</>}
        <text x="14" y="428" fontSize="10" fill="#444" fontFamily="Arial, sans-serif">{tab === 'pinza' ? 'La pinza abraza fase y neutro juntos: mide la corriente de fuga a tierra.' : 'Pulsa un punto: 1.ª punta roja, 2.ª negra. Pulsa el IGA para abrir o cerrar.'}</text>
      </svg>
      <div className="flex flex-wrap items-center gap-2 text-xs text-mute">
        <button type="button" className="btn btn-ghost !px-2.5 !py-1 !text-xs" disabled={bloqueado} onClick={() => { setRojo(null); setNegro(null); setTest(null); }}>Quitar puntas</button>
        <span>Punta roja: <b className="text-tx">{rojo ?? '—'}</b> · Punta negra: <b className="text-tx">{negro ?? '—'}</b></span>
        {tab === 'mm' && <span>Selector: <b className="text-tx">{DIAL[dial]}</b></span>}
      </div>
      <ol className="min-h-[3rem] rounded-md bg-ink p-2 font-mono text-xs text-mute">
        {log.length ? log.map((l, i) => <li key={i}>› {l}</li>) : <li>Sin medidas todavía.</li>}
      </ol>
    </section>
  );
}
