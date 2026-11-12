/**
 * La escena de «El boletín»: la vivienda con su cuadro, sus receptores enchufados, el circuito que se está verificando,
 * las puntas del medidor y, para la tierra, el jardín con la pica y las picas auxiliares del telurómetro.
 */
import { useMemo } from 'react';
import { houseOf } from '../game/houses';
import { circuitDef } from '../game/data';
import { Glyph, FurnitureShape, PX } from './PlanSvg';
import type { Visit } from '../boletin/game';
import type { Prep } from '../boletin/instruments';
import type { TestKind } from '../boletin/rules';
import { defectOf } from '../boletin/catalog';

const M = 1.6, BG = '#123a6b', INK = '#d6e8ff';
const GARDEN_H = 230;
export interface SceneProps {
  visit: Visit; circuit: string; tab: TestKind; running: boolean; prep: Prep; dist: number;
  onPrep: (k: keyof Prep) => void; onPick: (circuit: string) => void;
  /** Defectos a marcar con ⚠ (los encontrados durante el juego, o todos al final). */
  marks: { defect: string; target: string }[];
  rcdId?: string;
}

export function BoletinScene({ visit, circuit, tab, running, prep, dist, onPrep, onPick, marks, rcdId }: SceneProps) {
  const house = houseOf(visit.houseId);
  const lay = visit.layout!;
  const garden = tab === 'tierra';
  const VW = (house.w + 2 * M) * PX, VH = (house.h + 2 * M) * PX + (garden ? GARDEN_H : 0);
  const sx = (mx: number) => (mx - house.ox + M) * PX, sy = (my: number) => (my - house.oy + M) * PX;
  const energized = !prep.igaOpen;
  const route = lay.routes[circuit];
  const color = circuitDef(circuit)?.color ?? '#ffd23f';
  const path = useMemo(() => (route ? route.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x)} ${sy(y)}`).join(' ') : ''), [route, house]); // eslint-disable-line react-hooks/exhaustive-deps
  const far = lay.far[circuit];
  const pc = { x: sx(lay.panel.x), y: sy(lay.panel.y) };
  const pica = { x: sx(house.ox + house.w + 0.6), y: sy(house.oy + house.h + 0.7) };
  const lit = (x: number, y: number) => energized && lay.devices.some((d) => d.kind === 'luz' && Math.abs(d.x - x) < 0.01 && Math.abs(d.y - y) < 0.01);
  const roomLit = (id: string) => energized && lay.devices.some((d) => (d.kind === 'luz' || d.kind === 'luzExt') && house.rooms.find((r) => r.id === id) && d.x >= house.rooms.find((r) => r.id === id)!.x && d.x <= house.rooms.find((r) => r.id === id)!.x + house.rooms.find((r) => r.id === id)!.w && d.y >= house.rooms.find((r) => r.id === id)!.y && d.y <= house.rooms.find((r) => r.id === id)!.y + house.rooms.find((r) => r.id === id)!.h);
  void lit;
  const pasillo = house.rooms.find((r) => r.id === 'pasillo') ?? house.rooms[0];
  const plugs = lay.devices.filter((d) => ['toma', 'tomaLav', 'tomaHorno', 'ac', 'ev'].includes(d.kind));
  const markPos = (m: { defect: string; target: string }) => {
    const d = defectOf(m.defect);
    if (d.scope === 'earth') return pica;
    if (d.scope === 'rcd') return { x: pc.x + 34, y: pc.y - 40 };
    const f = lay.far[m.target];
    return f ? { x: sx(f.x), y: sy(f.y) } : pc;
  };

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="bt-scene" role="img" aria-label="Vivienda en la que se hacen las verificaciones">
      <defs>
        <pattern id="bg1" width={PX} height={PX} patternUnits="userSpaceOnUse"><path d={`M${PX} 0H0V${PX}`} fill="none" stroke="#fff" strokeOpacity={0.1} /></pattern>
        <radialGradient id="bglow"><stop offset="0" stopColor="#fff2a8" stopOpacity={0.9} /><stop offset="1" stopColor="#ffd23f" stopOpacity={0} /></radialGradient>
        <pattern id="grass" width={14} height={14} patternUnits="userSpaceOnUse"><path d="M2 12l2-5 2 5M9 10l2-4 2 4" stroke="#6cc24a" strokeOpacity={0.35} fill="none" /></pattern>
      </defs>
      <rect width={VW} height={(house.h + 2 * M) * PX} fill={BG} /><rect width={VW} height={(house.h + 2 * M) * PX} fill="url(#bg1)" />
      {house.bg && <image href={house.bg.src} x={sx(0)} y={sy(0)} width={house.bg.w * PX} height={house.bg.h * PX} preserveAspectRatio="none" opacity={0.4} style={{ filter: 'invert(1) grayscale(1)', mixBlendMode: 'screen' }} />}
      {house.rooms.map((r) => (
        <g key={r.id}>
          <rect x={sx(r.x)} y={sy(r.y)} width={r.w * PX} height={r.h * PX} fill={energized ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.25)'} />
          {roomLit(r.id) && <rect x={sx(r.x)} y={sy(r.y)} width={r.w * PX} height={r.h * PX} fill="#ffd23f" opacity={0.12} />}
          <text x={sx(r.x) + 8} y={sy(r.y) + 16} fontSize={11} fill={INK} opacity={0.7} fontWeight={700}>{r.name}</text>
        </g>
      ))}
      {house.furniture.map((f, i) => <g key={i} opacity={0.8}><FurnitureShape f={{ ...f, x: sx(f.x) / PX, y: sy(f.y) / PX }} /></g>)}
      {house.rooms.map((r) => <rect key={r.id} x={sx(r.x)} y={sy(r.y)} width={r.w * PX} height={r.h * PX} fill="none" stroke={INK} strokeWidth={r.outdoor ? 2 : 6} strokeDasharray={r.outdoor ? '10 6' : undefined} />)}
      {house.windows.map((w, i) => (w.orient === 'h' ? <g key={i}><rect x={sx(w.x)} y={sy(w.y) - 5} width={w.len * PX} height={10} fill={BG} /><path d={`M${sx(w.x)} ${sy(w.y) - 3}h${w.len * PX}M${sx(w.x)} ${sy(w.y) + 3}h${w.len * PX}`} stroke={INK} strokeWidth={1.4} /></g> : null))}
      {house.doors.map((d, i) => {
        const x = sx(d.x), y = sy(d.y), L = d.len * PX;
        if (d.orient === 'h') { const dir = d.dir ?? (d.y <= pasillo.y + 0.01 ? -1 : 1); return <g key={i}><rect x={x} y={y - 5} width={L} height={10} fill={BG} /><path d={`M${x} ${y}v${dir * L}M${x} ${y + dir * L}A${L} ${L} 0 0 ${dir > 0 ? 0 : 1} ${x + L} ${y}`} fill="none" stroke={INK} strokeWidth={1.4} /></g>; }
        const dv = d.dir ?? 1;
        return <g key={i}><rect x={x - 5} y={y} width={10} height={L} fill={BG} /><path d={`M${x} ${y}h${dv * L}M${x + dv * L} ${y}A${L} ${L} 0 0 ${dv > 0 ? 1 : 0} ${x} ${y + L}`} fill="none" stroke={INK} strokeWidth={1.4} /></g>;
      })}

      {/* mecanismos de toda la casa; los del circuito elegido, a color */}
      {lay.devices.map((d, i) => {
        const mine = d.circuit === circuit;
        const cd = d.circuit ? circuitDef(d.circuit) : null;
        const pickable = !!d.circuit && !!lay.routes[d.circuit];
        return (
          <g key={i} transform={`translate(${sx(d.x)} ${sy(d.y)}) scale(${mine ? 0.9 : 0.62})`} opacity={mine ? 1 : pickable ? 0.8 : 0.4} style={{ cursor: pickable ? 'pointer' : 'default' }} onPointerDown={() => pickable && onPick(d.circuit!)}>
            <Glyph kind={d.kind as never} color={cd?.color ?? '#ffd23f'} />
            {pickable && <circle r={16} fill="transparent" />}
          </g>
        );
      })}
      {/* receptores: huellas en planta con símbolo técnico mientras estén conectados */}
      {plugs.map((d, i) => <Appliance key={i} kind={d.kind} x={sx(d.x)} y={sy(d.y)} on={!prep.receptorsOff} onToggle={() => onPrep('receptorsOff')} />)}

      {/* recorrido del circuito que se verifica */}
      {path && tab !== 'tierra' && tab !== 'diferencial' && <g>
        <path d={path} fill="none" stroke={color} strokeWidth={5} strokeOpacity={0.25} />
        <path d={path} fill="none" stroke={color} strokeWidth={3} strokeDasharray="10 7" className="bt-flow" />
        {running && <circle r={8} fill="#fff" stroke={color} strokeWidth={3}><animateMotion dur="0.9s" fill="freeze" path={path} /></circle>}
        {far && <Probe x={sx(far.x)} y={sy(far.y)} color="#15140f" dir={1} />}
        <Probe x={pc.x - 4} y={pc.y + 8} color="#d62b1f" dir={-1} />
      </g>}
      {tab === 'tierra' && <path d={`M${pc.x} ${pc.y + 40} L${pc.x} ${pica.y - 20} L${pica.x} ${pica.y - 20} L${pica.x} ${pica.y}`} fill="none" stroke="#6cc24a" strokeWidth={3} strokeDasharray="8 5" className="bt-flow" />}

      {/* ubicación del cuadro (el frontal se ve aparte) */}
      <g transform={`translate(${pc.x} ${pc.y})`}>
        <rect x={-15} y={-20} width={30} height={40} rx={3} fill="#e9ecef" stroke="#1d1a17" strokeWidth={2.5} /><rect x={-10} y={-14} width={20} height={5} fill="#9aa3ad" /><rect x={-10} y={-5} width={20} height={5} fill="#9aa3ad" /><rect x={-10} y={4} width={20} height={5} fill="#9aa3ad" />
        <circle cx={0} cy={14} r={2.4} fill={energized ? '#37d67a' : '#6b7480'} />
        <text y={-26} fontSize={9} fontWeight={800} fill={INK} textAnchor="middle" letterSpacing={1}>CGMP</text>
        {running && tab === 'aislamiento' && <circle r={26} fill="none" stroke="#ff6a58" strokeWidth={2.5} className="bt-ring" />}
        {running && tab === 'diferencial' && <circle r={26} fill="none" stroke="#ff9f1c" strokeWidth={2.5} className="bt-ring" />}
      </g>

      {/* la pica de tierra, junto a la casa (en planta) */}
      <g transform={`translate(${pica.x} ${pica.y})`}>
        <circle r={11} fill="none" stroke="#6cc24a" strokeWidth={2} /><circle r={3.5} fill="#e9a36b" stroke="#6b3a17" /><path d="M-18 0h-6M18 0h6M0 -18v-6M0 18v6" stroke="#6cc24a" strokeWidth={2} />
        <g onPointerDown={() => onPrep('earthLinkOpen')} style={{ cursor: 'pointer' }}><rect x={-30} y={-34} width={60} height={15} rx={3} fill={prep.earthLinkOpen ? '#cfd6df' : '#2f8f55'} stroke="#0008" /><text y={-23.5} fontSize={8} fontWeight={800} textAnchor="middle" fill={prep.earthLinkOpen ? '#1d1a17' : '#fff'}>{prep.earthLinkOpen ? 'PUENTE ABIERTO' : 'PUENTE CERRADO'}</text></g>
        <text y={34} fontSize={9} textAnchor="middle" fill={INK} fontWeight={700}>pica de tierra</text>
      </g>

      {/* hallazgos marcados */}
      {marks.map((m, i) => { const p = markPos(m); return <g key={i} transform={`translate(${p.x + 14} ${p.y - 22})`}><circle r={13} fill="#c4271a" stroke="#fff" strokeWidth={2} className="bt-pulse" /><text y={5} fontSize={15} textAnchor="middle" fill="#fff" fontWeight={900}>!</text></g>; })}

      {/* corte del terreno para el telurómetro */}
      {garden && <GroundSection x0={0} y0={(house.h + 2 * M) * PX} w={VW} h={GARDEN_H} dist={dist} running={running} linked={!prep.earthLinkOpen} />}
    </svg>
  );
}


/** Receptor en planta: símbolo técnico de cada tipo; si está conectado se dibuja con su clavija y cable. */
function Appliance({ kind, x, y, on, onToggle }: { kind: string; x: number; y: number; on: boolean; onToggle: () => void }) {
  const st = { fill: 'rgba(214,232,255,.10)', stroke: on ? '#e8f2ff' : '#7f9bc0', strokeWidth: 1.6 };
  const body = (() => {
    switch (kind) {
      case 'tomaLav': return <g transform="translate(-4 -34)"><rect width={36} height={34} rx={3} {...st} /><circle cx={18} cy={19} r={11} {...st} /><circle cx={18} cy={19} r={6} {...st} strokeDasharray="2 2" /><rect x={4} y={3} width={10} height={4} rx={1} {...st} /><circle cx={28} cy={5} r={2} {...st} /></g>;
      case 'tomaHorno': return <g transform="translate(-4 -34)"><rect width={38} height={34} rx={3} {...st} />{[[10, 9], [28, 9], [10, 23], [28, 23]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={5} {...st} />)}</g>;
      case 'ac': return <g transform="translate(-24 -22)"><rect width={52} height={14} rx={4} {...st} />{[10, 18, 26, 34, 42].map((lx) => <line key={lx} x1={lx} y1={8} x2={lx} y2={12} stroke={st.stroke} strokeWidth={1.2} />)}</g>;
      case 'ev': return <g transform="translate(-6 -30)"><rect width={22} height={30} rx={4} {...st} /><circle cx={11} cy={12} r={5} {...st} /><path d="M11 17v10" stroke={st.stroke} strokeWidth={1.4} /><path d="M22 20c14 4 14 18 0 20" fill="none" stroke={st.stroke} strokeWidth={1.6} /></g>;
      default: return null;
    }
  })();
  return (
    <g onPointerDown={onToggle} style={{ cursor: 'pointer' }} opacity={on ? 0.95 : 0.55}>
      {body}
      {kind === 'toma' && on && <g transform="translate(8 -16)"><rect width={14} height={9} rx={2} fill="#e8f2ff" stroke="#0a2142" strokeWidth={1} /><rect x={-4} y={1.5} width={4} height={1.8} fill="#e8f2ff" /><rect x={-4} y={5.7} width={4} height={1.8} fill="#e8f2ff" /><path d="M14 4.5c8 0 8 6 14 6" fill="none" stroke="#e8f2ff" strokeWidth={1.6} /></g>}
      {kind !== 'toma' && on && <path d={`M${kind === 'ac' ? 0 : 4} 0c0 6 6 8 12 8`} fill="none" stroke="#e8f2ff" strokeWidth={1.6} />}
    </g>
  );
}

/** Punta de prueba con mango aislado, punta metálica y cable en espiral. */
function Probe({ x, y, color, dir }: { x: number; y: number; color: string; dir: 1 | -1 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${dir > 0 ? -40 : 40})`} style={{ pointerEvents: 'none' }}>
      <path d={`M0 -34c${6 * dir} -12 ${-6 * dir} -22 ${4 * dir} -34`} fill="none" stroke={color === '#15140f' ? '#555' : '#e57a70'} strokeWidth={2.4} strokeLinecap="round" />
      <rect x={-4} y={-34} width={8} height={22} rx={3} fill={color} stroke="#000" strokeWidth={0.8} /><path d="M-4 -26h8M-4 -22h8M-4 -18h8" stroke="#ffffff44" strokeWidth={1} />
      <rect x={-1.6} y={-12} width={3.2} height={11} fill="#c9ced4" stroke="#6b7480" strokeWidth={0.6} /><path d="M-1.6 -1l1.6 3 1.6 -3z" fill="#9aa3ad" />
    </g>
  );
}

/** Corte del terreno: electrodo, picas auxiliares y zonas de influencia (se solapan si están cerca). */
function GroundSection({ x0, y0, w, h, dist, running, linked }: { x0: number; y0: number; w: number; h: number; dist: number; running: boolean; linked: boolean }) {
  const surf = y0 + 70;
  const xa = x0 + 60, xb = w - 50;
  const sc = (xb - xa) / 40; // px por metro (hasta 40 m)
  const xP = xa, x1 = xa + dist * 0.62 * sc, x2 = xa + dist * sc;
  const R = Math.min(70, Math.max(18, dist * sc * 0.34));
  const overlap = dist < 20;
  const stake = (x: number, c: string, l: string, deep = 62) => (
    <g key={l}><rect x={x - 3} y={surf - 14} width={6} height={deep + 14} rx={2} fill={c === 'cu' ? 'url(#cop)' : '#a9b1ba'} stroke="#0008" strokeWidth={0.8} /><rect x={x - 6} y={surf - 18} width={12} height={7} rx={2} fill="#4a4f55" /><text x={x} y={surf - 24} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fff">{l}</text></g>
  );
  return (
    <g>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0c2a50" /><stop offset="1" stopColor="#1b4a7e" /></linearGradient>
        <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6b4a2c" /><stop offset="0.45" stopColor="#4f361f" /><stop offset="1" stopColor="#33230f" /></linearGradient>
        <radialGradient id="zoneA" cx="0.5" cy="0" r="1"><stop offset="0" stopColor="#ffd23f" stopOpacity={0.55} /><stop offset="1" stopColor="#ffd23f" stopOpacity={0.05} /></radialGradient>
        <radialGradient id="zoneB" cx="0.5" cy="0" r="1"><stop offset="0" stopColor="#5aa0ff" stopOpacity={0.55} /><stop offset="1" stopColor="#5aa0ff" stopOpacity={0.05} /></radialGradient>
        <pattern id="grains" width={18} height={18} patternUnits="userSpaceOnUse"><circle cx={4} cy={5} r={1.2} fill="#ffffff22" /><circle cx={13} cy={12} r={1} fill="#00000033" /></pattern>
      </defs>
      <rect x={x0} y={y0} width={w} height={surf - y0} fill="url(#sky)" /><rect x={x0} y={surf} width={w} height={y0 + h - surf} fill="url(#soil)" /><rect x={x0} y={surf} width={w} height={y0 + h - surf} fill="url(#grains)" />
      <path d={`M${x0} ${surf}H${x0 + w}`} stroke="#8bc06a" strokeWidth={3} />
      <text x={12} y={y0 + 18} fontSize={11} fontWeight={800} fill="#bcd4f3" letterSpacing={1.2}>CORTE DEL TERRENO · MEDIDA A TRES POLOS (a {dist} m)</text>
      {/* zonas de influencia */}
      <path d={`M${xP - R} ${surf}A${R} ${R} 0 0 0 ${xP + R} ${surf}z`} fill="url(#zoneA)" stroke="#ffd23f" strokeOpacity={0.6} strokeDasharray="4 3" />
      <path d={`M${x1 - R} ${surf}A${R} ${R} 0 0 0 ${x1 + R} ${surf}z`} fill="url(#zoneB)" stroke="#5aa0ff" strokeOpacity={0.6} strokeDasharray="4 3" />
      {stake(xP, 'cu', 'pica', 78)}{stake(x1, 'st', 'P1')}{stake(x2, 'st', 'P2')}
      {/* cables al instrumento */}
      <g fill="none" strokeWidth={2.2} strokeLinecap="round"><path d={`M${xP} ${surf - 18}C${xP} ${surf - 52} ${(xP + xb) / 2 - 30} ${surf - 40} ${(xP + xb) / 2 - 10} ${surf - 40}`} stroke={linked ? '#6cc24a' : '#6cc24a88'} strokeDasharray={linked ? undefined : '3 4'} /><path d={`M${x1} ${surf - 18}C${x1} ${surf - 46} ${(xP + xb) / 2} ${surf - 44} ${(xP + xb) / 2} ${surf - 40}`} stroke="#ffd23f" /><path d={`M${x2} ${surf - 18}C${x2} ${surf - 52} ${(xP + xb) / 2 + 30} ${surf - 40} ${(xP + xb) / 2 + 12} ${surf - 40}`} stroke="#d62b1f" /></g>
      <g transform={`translate(${(xP + xb) / 2 - 12} ${surf - 54})`}><rect width={26} height={14} rx={3} fill="#2c3a32" stroke="#9fb4a6" /><rect x={3} y={3} width={13} height={8} rx={1} fill="#9fb386" /><circle cx={21} cy={7} r={2} fill={running ? '#37d67a' : '#6b7480'} /></g>
      {/* cotas */}
      <g stroke="#cfe9c7" strokeWidth={1.2} fill="#cfe9c7" fontSize={10} fontWeight={700}><line x1={xP} y1={surf + 90} x2={x1} y2={surf + 90} /><line x1={x1} y1={surf + 90} x2={x2} y2={surf + 90} /><line x1={xP} y1={surf + 84} x2={xP} y2={surf + 96} /><line x1={x1} y1={surf + 84} x2={x1} y2={surf + 96} /><line x1={x2} y1={surf + 84} x2={x2} y2={surf + 96} />
        <text x={(xP + x1) / 2} y={surf + 106} textAnchor="middle" stroke="none">{(dist * 0.62).toFixed(0)} m</text><text x={(x1 + x2) / 2} y={surf + 106} textAnchor="middle" stroke="none">{(dist * 0.38).toFixed(0)} m</text></g>
      {overlap && <g><rect x={w / 2 - 130} y={y0 + h - 30} width={260} height={20} rx={6} fill="#7a1d12" opacity={0.9} /><text x={w / 2} y={y0 + h - 16} textAnchor="middle" fontSize={11} fontWeight={800} fill="#ffd3cc">Las zonas de influencia se solapan</text></g>}
      {running && <circle r={6} fill="#fff"><animateMotion dur="0.9s" fill="freeze" path={`M${xP} ${surf + 4}A${R} ${R} 0 0 0 ${x1} ${surf + 4}`} /></circle>}
    </g>
  );
}
