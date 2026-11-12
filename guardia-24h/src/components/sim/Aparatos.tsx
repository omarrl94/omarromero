// Aparatos de instalación dibujados en SVG con volumen y detalle (vista frontal).
// Se usan en las escenas de inspección y en el banco de pruebas.
export type Aparato = 'pia' | 'diferencial' | 'iga' | 'sobretension' | 'regleta' | 'cable' | 'tapa' | 'tubo' | 'caja' | 'bandeja' | 'etiqueta' | 'borna';
export type Visual = 'quemado' | 'puenteado' | 'suelto' | 'sinTapa' | 'sinAislante' | 'sinTierra' | 'invertido' | 'aplastado' | 'sinSellar' | 'curva' | 'cruzado' | 'sinRegistro' | 'mal300' | 'sinMarcar';

/** Degradados y filtros compartidos. Se incluye una vez por SVG. */
export function DefsAparatos() {
  return (
    <defs>
      <linearGradient id="gPlas" x1="0" x2="1"><stop offset="0" stopColor="#f2f4f5" /><stop offset=".5" stopColor="#dde1e4" /><stop offset="1" stopColor="#b9c0c5" /></linearGradient>
      <linearGradient id="gNegro" x1="0" x2="1"><stop offset="0" stopColor="#4a4f54" /><stop offset=".5" stopColor="#25282b" /><stop offset="1" stopColor="#101214" /></linearGradient>
      <linearGradient id="gMetal" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#f4f4f4" /><stop offset="1" stopColor="#8d949a" /></linearGradient>
      <linearGradient id="gLaton" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f3d98a" /><stop offset="1" stopColor="#a8822a" /></linearGradient>
      <linearGradient id="gAzul" x1="0" x2="1"><stop offset="0" stopColor="#6da8ff" /><stop offset="1" stopColor="#2257b8" /></linearGradient>
      <linearGradient id="gTubo" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#e6e9ec" /><stop offset=".5" stopColor="#aeb5bb" /><stop offset="1" stopColor="#6c757c" /></linearGradient>
      <linearGradient id="gCaja" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#c8cdd1" /></linearGradient>
      <radialGradient id="gQuemado" cx=".5" cy=".5" r=".6"><stop offset="0" stopColor="#1a0d05" stopOpacity=".95" /><stop offset=".6" stopColor="#5b2c10" stopOpacity=".7" /><stop offset="1" stopColor="#5b2c10" stopOpacity="0" /></radialGradient>
      <filter id="sombra" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx="1.5" dy="3" stdDeviation="2" floodColor="#000" floodOpacity=".55" /></filter>
    </defs>
  );
}

const Tornillo = ({ cx, cy, flojo = false }: { cx: number; cy: number; flojo?: boolean }) => (
  <g transform={flojo ? `translate(${cx + 3} ${cy - 5}) rotate(35)` : `translate(${cx} ${cy})`}>
    <circle r="4.6" fill="url(#gMetal)" stroke="#6b7278" strokeWidth=".8" /><path d="M-3 0H3" stroke="#555b60" strokeWidth="1.2" />
  </g>
);
const Hilo = ({ d, c, w = 3.2 }: { d: string; c: string; w?: number }) => (<g><path d={d} stroke="#000" strokeOpacity=".35" strokeWidth={w + 1.5} fill="none" strokeLinecap="round" transform="translate(1 1.5)" /><path d={d} stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" /></g>);

function Modulo({ cx, y, ancho, alto, calibre, curva, visual, palanca = 'negro', rotulo }: { cx: number; y: number; ancho: number; alto: number; calibre: string; curva?: string; visual?: Visual; palanca?: string; rotulo?: string }) {
  const x = cx - ancho / 2;
  return (
    <g filter="url(#sombra)">
      <rect x={x} y={y} width={ancho} height={alto} rx="3" fill="url(#gPlas)" stroke="#8a949a" />
      <rect x={x + 3} y={y} width={ancho - 6} height="15" fill="url(#gNegro)" /><rect x={x + 3} y={y + alto - 15} width={ancho - 6} height="15" fill="url(#gNegro)" />
      <Tornillo cx={cx} cy={y + 8} /><Tornillo cx={cx} cy={y + alto - 8} flojo={visual === 'suelto'} />
      <rect x={x + 5} y={y + 21} width={ancho - 10} height="26" rx="1.5" fill="#f8f8f3" stroke="#b5b5ac" />
      <text x={cx} y={y + 36} fontSize="10.5" fontWeight="700" textAnchor="middle" fill="#1b1b1b" fontFamily="Arial, sans-serif">{curva ?? 'C'}{calibre}</text>
      <text x={cx} y={y + 44} fontSize="5" textAnchor="middle" fill="#666" fontFamily="Arial, sans-serif">{rotulo ?? '230 V ~ 6000'}</text>
      <rect x={cx - 7} y={y + 52} width="14" height="28" rx="2.5" fill={`url(#${palanca === 'azul' ? 'gAzul' : 'gNegro'})`} stroke="#000" strokeOpacity=".5" />
      <path d={`M${cx - 4} ${y + 56}H${cx + 4}`} stroke="#fff" strokeOpacity=".5" />
      <text x={cx} y={y + 90} fontSize="6" textAnchor="middle" fill="#444" fontFamily="Arial, sans-serif">I</text>
      {visual === 'quemado' && (<g><ellipse cx={cx} cy={y + alto - 6} rx="22" ry="17" fill="url(#gQuemado)" /><path d={`M${cx - 6} ${y + alto - 20}q3 -9 6 0t6 0`} stroke="#ff7a1a" strokeWidth="1.4" fill="none" opacity=".9" /></g>)}
      {visual === 'suelto' && (<g><Hilo d={`M${cx + 3} ${y + alto - 6}q12 12 4 24q-4 6 -2 12`} c="#2a73c8" /><rect x={cx + 2} y={y + alto + 26} width="6" height="7" fill="#b87333" /></g>)}
    </g>
  );
}

export function PiaSvg({ cx, y, calibre = '16', visual }: { cx: number; y: number; calibre?: string; visual?: Visual }) {
  return (
    <g>
      <Modulo cx={cx} y={y} ancho={36} alto={96} calibre={calibre} curva="C" visual={visual} />
      {visual === 'puenteado' && (<g><Hilo d={`M${cx - 4} ${y + 8}q-14 -18 -2 -22q40 -8 44 20q2 8 -6 8`} c="#c8742a" w={3.6} /><Hilo d={`M${cx + 2} ${y + 8}q-4 -9 10 -10`} c="#c8742a" w={3.6} /></g>)}
    </g>
  );
}

export function DiferencialSvg({ cx, y, sens = '30', visual }: { cx: number; y: number; sens?: string; visual?: Visual }) {
  const mal = visual === 'mal300';
  return (
    <g filter="url(#sombra)">
      <rect x={cx - 24} y={y} width="48" height="96" rx="3" fill="url(#gPlas)" stroke="#8a949a" />
      <rect x={cx - 21} y={y} width="42" height="15" fill="url(#gNegro)" /><rect x={cx - 21} y={y + 81} width="42" height="15" fill="url(#gNegro)" />
      {[-11, 11].map((o) => <g key={o}><Tornillo cx={cx + o} cy={y + 8} /><Tornillo cx={cx + o} cy={y + 88} /></g>)}
      <rect x={cx - 20} y={y + 20} width="40" height="30" rx="1.5" fill="#f8f8f3" stroke="#b5b5ac" />
      <text x={cx} y={y + 31} fontSize="6.5" fontWeight="700" textAnchor="middle" fill="#1b1b1b" fontFamily="Arial, sans-serif">2P 40 A</text>
      <text x={cx} y={y + 42} fontSize="10" fontWeight="800" textAnchor="middle" fill={mal ? '#c0392b' : '#1b1b1b'} fontFamily="Arial, sans-serif">{sens} mA</text>
      <rect x={cx - 17} y={y + 55} width="16" height="12" rx="2" fill="url(#gAzul)" stroke="#12356e" /><text x={cx - 9} y={y + 64} fontSize="8" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="Arial, sans-serif">T</text>
      <rect x={cx + 3} y={y + 55} width="14" height="26" rx="2.5" fill="url(#gNegro)" stroke="#000" strokeOpacity=".5" />
      <text x={cx} y={y + 76} fontSize="5" textAnchor="middle" fill="#555" fontFamily="Arial, sans-serif">AC · tipo A</text>
      {visual === 'puenteado' && <Hilo d={`M${cx - 11} ${y + 8}q-16 -20 -2 -24q46 -8 48 22q2 8 -8 8`} c="#c8742a" w={3.6} />}
    </g>
  );
}

export function IgaSvg({ cx, y, on = true }: { cx: number; y: number; on?: boolean }) {
  return (
    <g filter="url(#sombra)">
      <rect x={cx - 22} y={y} width="44" height="96" rx="3" fill="url(#gPlas)" stroke="#8a949a" />
      <rect x={cx - 19} y={y} width="38" height="15" fill="url(#gNegro)" /><rect x={cx - 19} y={y + 81} width="38" height="15" fill="url(#gNegro)" />
      {[-10, 10].map((o) => <g key={o}><Tornillo cx={cx + o} cy={y + 8} /><Tornillo cx={cx + o} cy={y + 88} /></g>)}
      <rect x={cx - 18} y={y + 20} width="36" height="26" rx="1.5" fill="#f8f8f3" stroke="#b5b5ac" />
      <text x={cx} y={y + 32} fontSize="7" fontWeight="700" textAnchor="middle" fill="#1b1b1b" fontFamily="Arial, sans-serif">IGA</text>
      <text x={cx} y={y + 42} fontSize="9.5" fontWeight="800" textAnchor="middle" fill="#1b1b1b" fontFamily="Arial, sans-serif">2P 40 A</text>
      <rect x={cx - 9} y={on ? y + 50 : y + 60} width="18" height="26" rx="3" fill="url(#gNegro)" stroke="#000" strokeOpacity=".5" />
      <rect x={cx - 7} y={on ? y + 52 : y + 62} width="14" height="4" fill="#fff" opacity=".4" />
      <rect x={cx - 11} y={y + 80} width="22" height="5" rx="1" fill={on ? '#c0392b' : '#3fb27f'} /><text x={cx} y={y + 91} fontSize="5.5" textAnchor="middle" fill="#555" fontFamily="Arial, sans-serif">{on ? 'I · ON' : 'O · OFF'}</text>
    </g>
  );
}

export function SobretensionSvg({ cx, y }: { cx: number; y: number }) {
  return (
    <g filter="url(#sombra)">
      <rect x={cx - 20} y={y} width="40" height="96" rx="3" fill="url(#gPlas)" stroke="#8a949a" />
      <rect x={cx - 17} y={y} width="34" height="15" fill="url(#gNegro)" /><rect x={cx - 17} y={y + 81} width="34" height="15" fill="url(#gNegro)" />
      <Tornillo cx={cx} cy={y + 8} /><Tornillo cx={cx} cy={y + 88} />
      <text x={cx} y={y + 32} fontSize="7" fontWeight="700" textAnchor="middle" fill="#222" fontFamily="Arial, sans-serif">SPD · T2</text>
      <rect x={cx - 9} y={y + 40} width="18" height="14" rx="2" fill="#0f2a14" stroke="#000" /><circle cx={cx} cy={y + 47} r="4" fill="#3fe27a" />
      <text x={cx} y={y + 66} fontSize="5.5" textAnchor="middle" fill="#555" fontFamily="Arial, sans-serif">verde = OK</text>
    </g>
  );
}

export function RegletaSvg({ cx, y, visual }: { cx: number; y: number; visual?: Visual }) {
  return (
    <g filter="url(#sombra)">
      <rect x={cx - 40} y={y + 22} width="80" height="48" rx="3" fill="url(#gPlas)" stroke="#8a949a" />
      <rect x={cx - 36} y={y + 26} width="72" height="14" fill="url(#gLaton)" stroke="#7a5d1a" />
      {[-28, -14, 0, 14, 28].map((o) => <g key={o}><Tornillo cx={cx + o} cy={y + 33} /><rect x={cx + o - 5} y={y + 46} width="10" height="18" fill="#2257b8" opacity=".9" /></g>)}
      {visual === 'sinTierra' ? <text x={cx} y={y + 82} fontSize="8" textAnchor="middle" fill="#e5534b" fontFamily="Arial, sans-serif">PE sin conectar</text> : <Hilo d={`M${cx + 28} ${y + 64}v28`} c="#7ac142" w={3.4} />}
      <text x={cx - 28} y={y + 20} fontSize="7" fill="#ddd" fontFamily="Arial, sans-serif">N</text>
    </g>
  );
}

export function CableSvg({ cx, y, visual }: { cx: number; y: number; visual?: Visual }) {
  const hilos: [string, number][] = [['#8b5a2b', -12], ['#2a73c8', 0], [visual === 'sinTierra' ? '#2a73c8' : '#a9c92d', 12]];
  return (
    <g>
      {hilos.map(([c, o], i) => (
        <g key={i}>
          <Hilo d={`M${cx + o} ${y + 6}v${visual === 'suelto' && i === 0 ? 36 : 82}`} c={c} w={5} />
          {visual === 'sinAislante' && i === 1 ? <rect x={cx + o - 3} y={y + 40} width="6" height="18" fill="url(#gLaton)" /> : null}
          <rect x={cx + o - 3.5} y={y + 84} width="7" height="12" fill="url(#gLaton)" stroke="#7a5d1a" />
        </g>
      ))}
      {visual === 'quemado' && <ellipse cx={cx} cy={y + 50} rx="26" ry="30" fill="url(#gQuemado)" />}
      {visual === 'sinMarcar' && <text x={cx} y={y + 20} fontSize="7" textAnchor="middle" fill="#bbb" fontFamily="Arial, sans-serif">¿?</text>}
      {visual === 'invertido' && <text x={cx} y={y + 20} fontSize="7" textAnchor="middle" fill="#e5534b" fontFamily="Arial, sans-serif">F↔N</text>}
    </g>
  );
}

export function TapaSvg({ cx, y, visual }: { cx: number; y: number; visual?: Visual }) {
  if (visual === 'sinTapa') {
    return (
      <g filter="url(#sombra)">
        <rect x={cx - 38} y={y + 6} width="76" height="80" rx="3" fill="#202428" stroke="#000" />
        {[0, 1, 2].map((i) => <rect key={i} x={cx - 30} y={y + 18 + i * 22} width="60" height="7" fill="url(#gLaton)" stroke="#7a5d1a" />)}
        <path d={`M${cx - 38} ${y + 6}l76 80M${cx + 38} ${y + 6}l-76 80`} stroke="#e5534b" strokeOpacity=".35" strokeWidth="2" />
      </g>
    );
  }
  return (
    <g filter="url(#sombra)">
      <rect x={cx - 38} y={y + 6} width="76" height="80" rx="3" fill="url(#gPlas)" stroke="#8a949a" />
      <rect x={cx - 32} y={y + 14} width="64" height="26" rx="2" fill="#12171a" stroke="#555" /><rect x={cx - 29} y={y + 17} width="58" height="4" fill="#fff" opacity=".12" />
      {[-30, 30].map((o) => <Tornillo key={o} cx={cx + o} cy={y + 76} />)}
      <rect x={cx - 14} y={y + 56} width="28" height="12" rx="2" fill="#f8f8f3" stroke="#b5b5ac" /><path d={`M${cx - 10} ${y + 62}h20`} stroke="#999" />
    </g>
  );
}

export function BornaSvg({ cx, y, visual }: { cx: number; y: number; visual?: Visual }) {
  return (
    <g filter="url(#sombra)">
      <rect x={cx - 30} y={y + 20} width="60" height="54" rx="4" fill="url(#gPlas)" stroke="#8a949a" />
      <rect x={cx - 24} y={y + 28} width="48" height="16" fill="url(#gNegro)" /><Tornillo cx={cx} cy={y + 36} flojo={visual === 'suelto'} />
      <Hilo d={`M${cx} ${y + 52}v38`} c="#8b5a2b" w={5} />
      {visual === 'quemado' && <ellipse cx={cx} cy={y + 44} rx="28" ry="22" fill="url(#gQuemado)" />}
    </g>
  );
}

export function TuboSvg({ cx, y, visual }: { cx: number; y: number; visual?: Visual }) {
  const nervios = Array.from({ length: 9 }, (_, i) => i);
  if (visual === 'curva') {
    return (<g filter="url(#sombra)"><path d={`M${cx - 40} ${y + 70}H${cx - 6}Q${cx + 4} ${y + 70} ${cx + 4} ${y + 60}V${y + 10}`} stroke="url(#gTubo)" strokeWidth="14" fill="none" strokeLinejoin="miter" /><path d={`M${cx - 40} ${y + 70}H${cx - 6}Q${cx + 4} ${y + 70} ${cx + 4} ${y + 60}V${y + 10}`} stroke="#fff" strokeOpacity=".3" strokeWidth="2" fill="none" /><text x={cx} y={y + 90} fontSize="7" textAnchor="middle" fill="#ccc" fontFamily="Arial, sans-serif">radio muy cerrado</text></g>);
  }
  if (visual === 'cruzado') {
    return (<g filter="url(#sombra)"><rect x={cx - 40} y={y + 38} width="80" height="13" rx="6" fill="url(#gTubo)" /><rect x={cx - 7} y={y + 6} width="14" height="80" rx="6" fill="#8a4b2a" opacity=".92" /><rect x={cx - 7} y={y + 6} width="14" height="80" rx="6" fill="url(#gTubo)" opacity=".25" /></g>);
  }
  return (
    <g filter="url(#sombra)">
      <rect x={cx - 42} y={y + 36} width="84" height={visual === 'aplastado' ? 8 : 16} rx="7" fill="url(#gTubo)" />
      {nervios.map((i) => <path key={i} d={`M${cx - 36 + i * 9} ${y + 37}v${visual === 'aplastado' ? 6 : 14}`} stroke="#fff" strokeOpacity=".35" />)}
      {visual === 'aplastado' && <path d={`M${cx - 10} ${y + 30}l20 20`} stroke="#222" strokeWidth="2" />}
      {visual === 'sinSellar' && (<g><rect x={cx + 24} y={y + 28} width="20" height="32" fill="url(#gCaja)" stroke="#8a949a" /><rect x={cx + 20} y={y + 38} width="8" height="12" fill="#000" opacity=".5" />{[0, 1, 2].map((i) => <path key={i} d={`M${cx + 12 + i * 6} ${y + 56}q2 6 0 10q-2 -4 0 -10`} fill="#6fb3ff" />)}</g>)}
    </g>
  );
}

export function CajaSvg({ cx, y, visual }: { cx: number; y: number; visual?: Visual }) {
  return (
    <g filter="url(#sombra)">
      <rect x={cx - 34} y={y + 12} width="68" height="64" rx="4" fill="url(#gCaja)" stroke="#9aa2a8" />
      {[[-27, 19], [27, 19], [-27, 69], [27, 69]].map(([a, b], i) => <Tornillo key={i} cx={cx + a!} cy={y + b!} />)}
      <rect x={cx - 16} y={y + 32} width="32" height="24" rx="3" fill="#e5e8ea" stroke="#9aa2a8" />
      {visual === 'sinSellar' ? <g><rect x={cx - 3} y={y + 74} width="6" height="14" fill="#8a949a" />{[0, 1].map((i) => <path key={i} d={`M${cx - 12 + i * 22} ${y + 78}q2 6 0 10q-2 -4 0 -10`} fill="#6fb3ff" />)}</g> : <rect x={cx - 3} y={y + 74} width="6" height="12" fill="#6c757c" />}
    </g>
  );
}

export function BandejaSvg({ cx, y, visual }: { cx: number; y: number; visual?: Visual }) {
  return (
    <g filter="url(#sombra)">
      <rect x={cx - 42} y={y + 30} width="84" height="40" rx="2" fill="url(#gTubo)" stroke="#5c666c" />
      {Array.from({ length: 5 }, (_, r) => Array.from({ length: 12 }, (_, c) => <rect key={`${r}${c}`} x={cx - 38 + c * 6.6} y={y + 34 + r * 7} width="3.4" height="3.4" fill="#222" opacity=".75" />))}
      <path d={`M${cx - 36} ${y + 36}q36 12 72 0`} stroke="#8b5a2b" strokeWidth="4" fill="none" /><path d={`M${cx - 36} ${y + 46}q36 12 72 0`} stroke="#2a73c8" strokeWidth="4" fill="none" />
      {visual === 'sinTierra' && <text x={cx} y={y + 88} fontSize="7" textAnchor="middle" fill="#e5534b" fontFamily="Arial, sans-serif">sin puesta a tierra</text>}
    </g>
  );
}

export function EtiquetaSvg({ cx, y }: { cx: number; y: number }) {
  return (<g filter="url(#sombra)"><rect x={cx - 36} y={y + 30} width="72" height="34" rx="2" fill="#f8f8f3" stroke="#b5b5ac" />{[0, 1, 2].map((i) => <path key={i} d={`M${cx - 30} ${y + 40 + i * 8}H${cx + 30 - i * 8}`} stroke="#8a8a80" />)}</g>);
}

/** Dibuja un aparato en una celda de 90×~104 px. */
export function AparatoSvg({ tipo, visual, cx, y, calibre, sens }: { tipo: Aparato; visual?: Visual; cx: number; y: number; calibre?: string; sens?: string }) {
  switch (tipo) {
    case 'pia': return <PiaSvg cx={cx} y={y} visual={visual} calibre={calibre} />;
    case 'diferencial': return <DiferencialSvg cx={cx} y={y} visual={visual} sens={sens ?? (visual === 'mal300' ? '300' : '30')} />;
    case 'iga': return <IgaSvg cx={cx} y={y} />;
    case 'sobretension': return <SobretensionSvg cx={cx} y={y} />;
    case 'regleta': return <RegletaSvg cx={cx} y={y} visual={visual} />;
    case 'cable': return <CableSvg cx={cx} y={y} visual={visual} />;
    case 'tapa': return <TapaSvg cx={cx} y={y} visual={visual} />;
    case 'borna': return <BornaSvg cx={cx} y={y} visual={visual} />;
    case 'tubo': return <TuboSvg cx={cx} y={y} visual={visual} />;
    case 'caja': return <CajaSvg cx={cx} y={y} visual={visual} />;
    case 'bandeja': return <BandejaSvg cx={cx} y={y} visual={visual} />;
    default: return <EtiquetaSvg cx={cx} y={y} />;
  }
}
