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
const GARDEN_H = 170;
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
  const plugs = lay.devices.filter((d) => d.kind === 'toma' || d.kind === 'tomaLav' || d.kind === 'tomaHorno' || d.kind === 'ac' || d.kind === 'ev');
  const APPL: Record<string, string> = { toma: '💡', tomaLav: '🧺', tomaHorno: '🍳', ac: '❄️', ev: '🚗' };
  const markPos = (m: { defect: string; target: string }) => {
    const d = defectOf(m.defect);
    if (d.scope === 'earth') return pica;
    if (d.scope === 'rcd') return { x: pc.x + 34, y: pc.y - 40 };
    const f = lay.far[m.target];
    return f ? { x: sx(f.x), y: sy(f.y) } : pc;
  };
  const gx0 = 30, gx1 = VW - 40;
  const gscale = (gx1 - gx0 - 40) / 40; // px por metro en el jardín (hasta 40 m)

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
      {/* receptores enchufados: se ven mientras no se desconecten */}
      {!prep.receptorsOff && plugs.map((d, i) => <text key={i} x={sx(d.x) + 12} y={sy(d.y) - 8} fontSize={15} opacity={0.95} onPointerDown={() => onPrep('receptorsOff')} style={{ cursor: 'pointer' }}>{APPL[d.kind]}</text>)}
      {prep.receptorsOff && plugs.map((d, i) => <text key={i} x={sx(d.x) + 10} y={sy(d.y) - 8} fontSize={12} opacity={0.5} onPointerDown={() => onPrep('receptorsOff')} style={{ cursor: 'pointer' }}>⌁</text>)}

      {/* recorrido del circuito que se verifica */}
      {path && tab !== 'tierra' && tab !== 'diferencial' && <g>
        <path d={path} fill="none" stroke={color} strokeWidth={5} strokeOpacity={0.25} />
        <path d={path} fill="none" stroke={color} strokeWidth={3} strokeDasharray="10 7" className="bt-flow" />
        {running && <circle r={8} fill="#fff" stroke={color} strokeWidth={3}><animateMotion dur="0.9s" fill="freeze" path={path} /></circle>}
        {far && <g transform={`translate(${sx(far.x)} ${sy(far.y)})`}><circle r={13} fill="none" stroke="#fff" strokeWidth={2.5} strokeDasharray="4 3" /><path d="M0 -13v-16" stroke="#111" strokeWidth={4} strokeLinecap="round" /><circle cy={-31} r={5} fill="#111" stroke="#fff" /></g>}
        <g transform={`translate(${pc.x - 26} ${pc.y + 46})`}><path d="M0 0v14" stroke="#e53935" strokeWidth={4} strokeLinecap="round" /><circle cy={16} r={5} fill="#e53935" stroke="#fff" /></g>
      </g>}
      {tab === 'tierra' && <path d={`M${pc.x} ${pc.y + 40} L${pc.x} ${pica.y - 20} L${pica.x} ${pica.y - 20} L${pica.x} ${pica.y}`} fill="none" stroke="#6cc24a" strokeWidth={3} strokeDasharray="8 5" className="bt-flow" />}

      {/* el cuadro */}
      <g transform={`translate(${pc.x} ${pc.y})`}>
        <rect x={-30} y={-42} width={78} height={92} rx={6} fill="#cfd6df" stroke="#1d1a17" strokeWidth={3} />
        <text x={9} y={-46} fontSize={10} fontWeight={800} fill={INK} textAnchor="middle">CUADRO</text>
        {/* IGA: palanca */}
        <g onPointerDown={() => onPrep('igaOpen')} style={{ cursor: 'pointer' }}>
          <rect x={-24} y={-34} width={30} height={28} rx={3} fill="#2a2622" /><rect x={-20} y={prep.igaOpen ? -12 : -30} width={22} height={14} rx={2} fill={prep.igaOpen ? '#c4271a' : '#23a26d'} />
          <text x={-9} y={-1} fontSize={7} fontWeight={800} fill="#fff" textAnchor="middle">IGA</text>
          <rect x={-30} y={-42} width={78} height={92} fill="transparent" style={{ pointerEvents: 'none' }} />
        </g>
        {/* diferenciales */}
        {visit.truth.rcds.map((r, i) => <g key={r.id}><rect x={12} y={-34 + i * 22} width={30} height={18} rx={3} fill={tab === 'diferencial' && rcdId === r.id ? '#ffd23f' : '#f4f4f4'} stroke="#1d1a17" strokeWidth={1.5} className={tab === 'diferencial' && rcdId === r.id ? 'bt-pulse' : ''} /><text x={27} y={-21 + i * 22} fontSize={8} fontWeight={800} textAnchor="middle" fill="#1d1a17">{r.id}</text></g>)}
        {/* PIAs de los circuitos */}
        {Object.keys(lay.routes).map((id, i) => <g key={id} onPointerDown={() => onPick(id)} style={{ cursor: 'pointer' }}><rect x={-24 + i * 16} y={8} width={13} height={22} rx={2} fill={id === circuit ? circuitDef(id).color : '#fff'} stroke="#1d1a17" strokeWidth={1.5} /><text x={-17.5 + i * 16} y={42} fontSize={7} fontWeight={800} textAnchor="middle" fill="#1d1a17">{id}</text></g>)}
        {visit.truth.spd && <g><rect x={30} y={8} width={14} height={22} rx={2} fill={prep.spdOff ? '#8d96a3' : '#7e57c2'} stroke="#1d1a17" strokeWidth={1.5} /><text x={37} y={42} fontSize={6} fontWeight={800} textAnchor="middle" fill="#1d1a17">SPD</text></g>}
        <text x={9} y={64} fontSize={11} textAnchor="middle" fill={energized ? '#ffd23f' : '#9dbbe0'} fontWeight={800}>{energized ? '⚡ con tensión' : '○ sin tensión'}</text>
        {running && tab === 'aislamiento' && <text x={9} y={-60} fontSize={13} textAnchor="middle" fontWeight={900} fill="#ff6a58" className="bt-pulse">⚡ ensayo</text>}
        {running && tab === 'diferencial' && <circle cx={27} cy={-25} r={26} fill="none" stroke="#ffd23f" strokeWidth={3} className="bt-ring" />}
      </g>

      {/* la pica de tierra, junto a la casa */}
      <g transform={`translate(${pica.x} ${pica.y})`}>
        <path d="M0 0v22M-9 22h18M-6 27h12M-3 32h6" stroke="#6cc24a" strokeWidth={3} strokeLinecap="round" fill="none" />
        <rect x={-18} y={-16} width={36} height={14} rx={3} fill={prep.earthLinkOpen ? '#cfd6df' : '#6cc24a'} onPointerDown={() => onPrep('earthLinkOpen')} style={{ cursor: 'pointer' }} />
        <text y={-5} fontSize={8} fontWeight={800} textAnchor="middle" fill="#1d1a17" pointerEvents="none">{prep.earthLinkOpen ? 'SEPARADA' : 'UNIDA'}</text>
        <text y={46} fontSize={10} textAnchor="middle" fill={INK}>pica de tierra</text>
      </g>

      {/* hallazgos marcados */}
      {marks.map((m, i) => { const p = markPos(m); return <g key={i} transform={`translate(${p.x + 14} ${p.y - 22})`}><circle r={13} fill="#c4271a" stroke="#fff" strokeWidth={2} className="bt-pulse" /><text y={5} fontSize={15} textAnchor="middle" fill="#fff" fontWeight={900}>!</text></g>; })}

      {/* jardín del telurómetro */}
      {garden && (() => {
        const y0 = (house.h + 2 * M) * PX;
        const gy = y0 + 62, rad = dist * gscale * 0.32;
        const xP = gx0 + 10, x1 = xP + (dist * gscale) * 0.62, x2 = xP + dist * gscale;
        const bad = dist < 20;
        return (
          <g>
            <rect x={0} y={y0} width={VW} height={GARDEN_H} fill="#1d4d2b" /><rect x={0} y={y0} width={VW} height={GARDEN_H} fill="url(#grass)" />
            <text x={10} y={y0 + 16} fontSize={11} fontWeight={800} fill="#bfe9b0">JARDÍN · el telurómetro necesita dos picas auxiliares en línea (a {dist} m)</text>
            <ellipse cx={xP} cy={gy} rx={rad} ry={rad * 0.55} fill="#ffd23f" opacity={0.18} /><ellipse cx={x1} cy={gy} rx={rad} ry={rad * 0.55} fill="#5aa0ff" opacity={0.18} />
            <line x1={xP} y1={gy} x2={x2} y2={gy} stroke="#cfe9c7" strokeDasharray="4 4" />
            {[[xP, '#6cc24a', 'pica'], [x1, '#ffd23f', 'P1'], [x2, '#5aa0ff', 'P2']].map(([x, c, l]) => <g key={String(l)} transform={`translate(${x} ${gy})`}><path d="M0 -4v26" stroke={String(c)} strokeWidth={4} strokeLinecap="round" /><circle r={5} fill={String(c)} /><text y={38} fontSize={10} textAnchor="middle" fill="#fff" fontWeight={700}>{String(l)}</text></g>)}
            <text x={(xP + x2) / 2} y={gy - 12} fontSize={12} textAnchor="middle" fill="#fff" fontWeight={800}>{dist} m</text>
            {bad && <text x={VW / 2} y={y0 + GARDEN_H - 8} fontSize={11} textAnchor="middle" fill="#ffb4a8" fontWeight={700}>Las zonas de influencia se solapan</text>}
            {running && <circle r={7} fill="#fff"><animateMotion dur="0.9s" fill="freeze" path={`M${xP} ${gy}L${x2} ${gy}`} /></circle>}
          </g>
        );
      })()}
    </svg>
  );
}
