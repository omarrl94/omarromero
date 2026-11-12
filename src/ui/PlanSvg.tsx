/**
 * Plano de obra: la vivienda como un plano cianotipo (líneas blancas sobre azul),
 * con mecanismos, canalizaciones por circuito y la zona prohibida junto a la bañera.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { analyze, inBathZone, roomAt } from '../game/logic';
import { circuitDef, dev, type DevKind } from '../game/data';
import { houseOf, area, type Furn } from '../game/houses';
import { Boom } from './Boom';

export const PX = 64;
const M = 1.5;
const BG = '#123a6b';
const INK = '#d6e8ff';
const PENCIL = '#ffd23f';
export type Status = 'on' | 'tripped' | 'fire' | 'slow';
const fm = (v: number) => v.toFixed(1).replace('.', ',');

export function Glyph({ kind, color, ghost = false }: { kind: DevKind; color: string; ghost?: boolean }) {
  const st = { stroke: INK, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round' as const };
  const fill = { fill: color, fillOpacity: ghost ? 0.3 : 0.95, stroke: '#0b2347', strokeWidth: 1.4 };
  switch (kind) {
    case 'luz': return <g><circle r={11} {...fill} /><path d="M-6 -6L6 6M-6 6L6 -6" stroke="#0b2347" strokeWidth={2} strokeLinecap="round" /></g>;
    case 'luzExt': return <g><circle r={13} fill="none" stroke={color} strokeWidth={2} strokeDasharray="3 3" /><circle r={9} {...fill} /><path d="M-5 -5L5 5M-5 5L5 -5" stroke="#0b2347" strokeWidth={2} strokeLinecap="round" /></g>;
    case 'int': return <g><circle r={6.5} {...fill} /><path d="M5 -5L12 -12M9 -14L15 -8" stroke={INK} strokeWidth={2} strokeLinecap="round" /></g>;
    case 'conm': return <g><circle r={6.5} {...fill} /><path d="M5 -5L12 -12M9 -14L15 -8M2 -7L9 -14" stroke={INK} strokeWidth={2} strokeLinecap="round" /></g>;
    case 'detector': return <g><circle r={8} {...fill} /><path d="M-4 -9a8 8 0 0 1 8 0M-8 -13a13 13 0 0 1 16 0" {...st} stroke={color} /></g>;
    case 'toma': return <g><circle r={9} {...fill} /><path d="M-4 -3v5M4 -3v5M-5 5h10" stroke="#0b2347" strokeWidth={1.8} strokeLinecap="round" /></g>;
    case 'tomaHorno': return <g><rect x={-11} y={-9} width={22} height={18} rx={3} {...fill} /><text y={4.5} textAnchor="middle" fontSize={11} fontWeight={800} fill="#0b2347">25</text></g>;
    case 'tomaLav': return <g><circle r={10} {...fill} /><text y={4} textAnchor="middle" fontSize={11} fontWeight={800} fill="#0b2347">L</text></g>;
    case 'tomaTV': return <g><rect x={-10} y={-7} width={20} height={14} rx={2} fill="none" stroke={ghost ? color : INK} strokeWidth={1.8} /><text y={4} textAnchor="middle" fontSize={9.5} fontWeight={800} fill={INK}>TV</text></g>;
    case 'ac': return <g><rect x={-18} y={-8} width={36} height={16} rx={4} {...fill} /><path d="M-12 3h24" stroke="#0b2347" strokeWidth={1.6} /><text y={-0.5} textAnchor="middle" fontSize={9} fontWeight={800} fill="#0b2347">AC</text></g>;
    case 'ev': return <g><rect x={-15} y={-12} width={30} height={24} rx={5} {...fill} /><path d="M2 -8l-6 9h5l-2 7 7-10h-5z" fill="#0b2347" /></g>;
  }
}

function FurnitureShape({ f }: { f: Furn }) {
  const x = f.x * PX, y = f.y * PX, w = f.w * PX, h = f.h * PX;
  const s = { fill: 'rgba(214,232,255,.06)', stroke: 'rgba(214,232,255,.5)', strokeWidth: 1.3 };
  switch (f.kind) {
    case 'cama': return <g><rect x={x} y={y} width={w} height={h} rx={4} {...s} /><rect x={x + 6} y={y + h - 22} width={w / 2 - 9} height={16} rx={5} {...s} /><rect x={x + w / 2 + 3} y={y + h - 22} width={w / 2 - 9} height={16} rx={5} {...s} /></g>;
    case 'sofa': return <g><rect x={x} y={y} width={w} height={h} rx={8} {...s} /><rect x={x + 6} y={y + 6} width={w - 12} height={h * 0.4} rx={5} {...s} /></g>;
    case 'banera': return <g><rect x={x} y={y} width={w} height={h} rx={10} {...s} /><rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} rx={14} {...s} /><circle cx={x + w / 2} cy={y + 18} r={3} {...s} /></g>;
    case 'inodoro': return <g><rect x={x} y={y} width={w} height={h * 0.35} rx={3} {...s} /><ellipse cx={x + w / 2} cy={y + h * 0.65} rx={w / 2} ry={h * 0.33} {...s} /></g>;
    case 'lavabo': return <g><rect x={x} y={y} width={w} height={h} rx={5} {...s} /><ellipse cx={x + w / 2} cy={y + h / 2} rx={w * 0.3} ry={h * 0.3} {...s} /></g>;
    case 'encimera': return <g><rect x={x} y={y} width={w} height={h} {...s} /><circle cx={x + w * 0.2} cy={y + h / 2} r={7} {...s} /><circle cx={x + w * 0.2 + 22} cy={y + h / 2} r={7} {...s} /><rect x={x + w * 0.55} y={y + 6} width={46} height={h - 12} rx={3} {...s} /></g>;
    case 'coche': return <g><rect x={x} y={y} width={w} height={h} rx={26} {...s} /><rect x={x + 10} y={y + h * 0.18} width={w - 20} height={h * 0.2} rx={8} {...s} /><rect x={x + 10} y={y + h * 0.62} width={w - 20} height={h * 0.2} rx={8} {...s} /></g>;
    case 'tv': return <rect x={x} y={y} width={w} height={h} rx={3} {...s} />;
    default: return <g><rect x={x} y={y} width={w} height={h} rx={3} {...s} />{f.kind === 'mesa' && <circle cx={x + w / 2} cy={y + h / 2} r={Math.min(w, h) * 0.18} {...s} />}</g>;
  }
}

export function PlanSvg({ mode, status = {}, fireKey = 0 }: { mode: 'obra' | 'test'; status?: Record<string, Status>; fireKey?: number }) {
  const g = useGame();
  const { client, state, tool, selected, linkFrom } = g;
  const house = houseOf(client.houseId);
  const svgRef = useRef<SVGSVGElement>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ id: string; panel?: boolean } | null>(null);
  const an = useMemo(() => analyze(state, house), [state, house]);
  const VW = (house.w + 2 * M) * PX, VH = (house.h + 2 * M) * PX;
  const sx = (mx: number) => (mx - house.ox + M) * PX, sy = (my: number) => (my - house.oy + M) * PX;
  const toM = (cx: number, cy: number) => {
    const el = svgRef.current!; const pt = el.createSVGPoint(); pt.x = cx; pt.y = cy;
    const p = pt.matrixTransform(el.getScreenCTM()!.inverse());
    return { x: Math.round((p.x / PX - M + house.ox) * 20) / 20, y: Math.round((p.y / PX - M + house.oy) * 20) / 20 };
  };
  const editing = mode === 'obra';
  const pasillo = house.rooms.find((r) => r.kind === 'pasillo') ?? house.rooms[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tg = (e.target as HTMLElement).tagName;
      if (tg === 'INPUT' || tg === 'SELECT') return;
      const s = useGame.getState();
      if (e.key === 'Escape') { s.setTool(null); s.select(null); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && s.selected) s.removeDev(s.selected);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!drag.current || !svgRef.current) return;
      const p = toM(e.clientX, e.clientY);
      if (!roomAt(house, p.x, p.y)) return;
      if (drag.current.panel) useGame.getState().setPanelPos(p.x, p.y); else useGame.getState().moveDev(drag.current.id, p.x, p.y);
    };
    const up = () => (drag.current = null);
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  });

  const lit = (cid: string | null) => !!cid && status[cid] === 'on';
  const roomLit = (id: string) => state.devices.some((d) => (d.kind === 'luz' || d.kind === 'luzExt') && lit(d.circuit) && roomAt(house, d.x, d.y)?.id === id);
  const kindTool = tool && !['move', 'delete', 'link', 'panel'].includes(tool) ? (tool as DevKind) : null;

  return (
    <svg ref={svgRef} className="plan" viewBox={`0 0 ${VW} ${VH}`} data-testid="plan"
      onPointerMove={(e) => setMouse(toM(e.clientX, e.clientY))} onPointerLeave={() => setMouse(null)}
      onPointerDown={(e) => { if (!editing) return; if (e.target === e.currentTarget || (e.target as Element).getAttribute('data-bg')) { const p = toM(e.clientX, e.clientY); if (tool && !['move', 'delete', 'link'].includes(tool)) g.place(p.x, p.y); else { g.select(null); } } }}>
      <defs>
        <pattern id="g1" width={PX / 2} height={PX / 2} patternUnits="userSpaceOnUse" patternTransform={`translate(${sx(0) % (PX / 2)} ${sy(0) % (PX / 2)})`}><path d={`M${PX / 2} 0H0V${PX / 2}`} fill="none" stroke="#fff" strokeOpacity={0.06} /></pattern>
        <pattern id="g2" width={PX} height={PX} patternUnits="userSpaceOnUse" patternTransform={`translate(${sx(0) % PX} ${sy(0) % PX})`}><path d={`M${PX} 0H0V${PX}`} fill="none" stroke="#fff" strokeOpacity={0.14} /></pattern>
        <pattern id="tile" width={16} height={16} patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="#fff" strokeOpacity={0.09} /></pattern>
        <pattern id="hatch" width={9} height={9} patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V9" stroke="#ff5d4a" strokeWidth={2.4} strokeOpacity={0.55} /></pattern>
        <radialGradient id="glow"><stop offset="0" stopColor="#fff2a8" stopOpacity={0.95} /><stop offset="0.45" stopColor="#ffd23f" stopOpacity={0.4} /><stop offset="1" stopColor="#ffd23f" stopOpacity={0} /></radialGradient>
      </defs>
      <rect data-bg="1" width={VW} height={VH} fill={BG} />
      {house.bg && <image href={house.bg.src} x={sx(0)} y={sy(0)} width={house.bg.w * PX} height={house.bg.h * PX} preserveAspectRatio="none" opacity={0.55} style={{ filter: "invert(1) grayscale(1) contrast(1.1)", mixBlendMode: "screen" }} pointerEvents="none" />}
      <rect data-bg="1" width={VW} height={VH} fill="url(#g1)" /><rect data-bg="1" width={VW} height={VH} fill="url(#g2)" />

      {/* estancias */}
      {house.rooms.map((r) => (
        <g key={r.id}>
          <rect x={sx(r.x)} y={sy(r.y)} width={r.w * PX} height={r.h * PX} fill={r.outdoor ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.05)'} data-bg="1" />
          {(r.kind === 'cocina' || r.kind === 'bano') && <rect x={sx(r.x)} y={sy(r.y)} width={r.w * PX} height={r.h * PX} fill="url(#tile)" pointerEvents="none" />}
          {roomLit(r.id) && <rect x={sx(r.x)} y={sy(r.y)} width={r.w * PX} height={r.h * PX} fill="#ffd23f" opacity={0.16} pointerEvents="none" />}
        </g>
      ))}
      {house.furniture.map((f, i) => <g key={i} pointerEvents="none"><FurnitureShape f={{ ...f, x: sx(f.x) / PX, y: sy(f.y) / PX }} /></g>)}
      {(house.tubZones ?? (house.tubZone ? [house.tubZone] : [])).map((t, ti) => { const m = 0.6; return (
        <g key={ti} pointerEvents="none" opacity={kindTool === 'toma' ? 1 : 0.55}>
          <rect x={sx(t.x - m)} y={sy(t.y - m)} width={(t.w + 2 * m) * PX} height={(t.h + 2 * m) * PX} rx={14} fill="url(#hatch)" stroke="#ff5d4a" strokeWidth={1.6} strokeDasharray="6 4" />
          <text x={sx(t.x - m) + 6} y={sy(t.y + t.h + m) + 14} fontSize={10.5} fill="#ff9a8c" fontWeight={700}>sin bases a menos de 0,6 m</text>
        </g>); })}

      {/* muros */}
      {house.rooms.map((r) => <rect key={r.id} x={sx(r.x)} y={sy(r.y)} width={r.w * PX} height={r.h * PX} fill="none" stroke={INK} strokeWidth={r.outdoor ? 2 : 6} strokeDasharray={r.outdoor ? '10 6' : undefined} strokeLinejoin="miter" pointerEvents="none" />)}
      {house.windows.map((w, i) => w.orient === 'h' ? <g key={i} pointerEvents="none"><rect x={sx(w.x)} y={sy(w.y) - 5} width={w.len * PX} height={10} fill={BG} /><path d={`M${sx(w.x)} ${sy(w.y) - 3}h${w.len * PX}M${sx(w.x)} ${sy(w.y) + 3}h${w.len * PX}`} stroke={INK} strokeWidth={1.4} /></g> : null)}
      {house.doors.map((d, i) => {
        const x = sx(d.x), y = sy(d.y), L = d.len * PX;
        if (d.orient === 'h') {
          const dir = d.dir ?? (d.y <= pasillo.y + 0.01 ? -1 : 1);
          return <g key={i} pointerEvents="none"><rect x={x} y={y - 5} width={L} height={10} fill={BG} /><path d={`M${x} ${y}v${dir * L}M${x} ${y + dir * L}A${L} ${L} 0 0 ${dir > 0 ? 0 : 1} ${x + L} ${y}`} fill="none" stroke={INK} strokeWidth={1.4} /></g>;
        }
        const dv = d.dir ?? 1;
        return <g key={i} pointerEvents="none"><rect x={x - 5} y={y} width={10} height={L} fill={BG} /><path d={`M${x} ${y}h${dv * L}M${x + dv * L} ${y}A${L} ${L} 0 0 ${dv > 0 ? 1 : 0} ${x} ${y + L}`} fill="none" stroke={INK} strokeWidth={1.4} />{d.entry && <text x={x - dv * 10} y={y + L / 2 + 4} textAnchor={dv > 0 ? 'end' : 'start'} fontSize={11} fontWeight={800} fill={PENCIL}>{dv > 0 ? 'ENTRADA ▸' : '◂ ENTRADA'}</text>}</g>;
      })}

      {/* etiquetas de estancia */}
      {house.rooms.map((r) => (
        (() => {
          const low = r.kind === 'dormitorio' || r.kind === 'garaje'; // las puertas y ventanas ocupan el borde superior
          const lx = sx(r.x) + (r.kind === 'pasillo' ? 150 : 10), ly = low ? sy(r.y + r.h) - 24 : sy(r.y) + 19;
          return (
            <g key={r.id} pointerEvents="none" className="rlabel">
              <text x={lx} y={ly} fontSize={14} fontWeight={800} fill={INK}>{r.name}</text>
              {!r.outdoor && <text x={lx} y={ly + 15} fontSize={11} fill="#9dbbe0">{fm(area(r))} m²</text>}
            </g>
          );
        })()
      ))}
      {/* cotas */}
      <g pointerEvents="none" fontSize={11} fill="#9dbbe0" stroke="#9dbbe0" strokeWidth={1}>
        <path d={`M${sx(house.ox)} ${sy(house.oy + house.h) + 26}H${sx(house.ox + house.w)}M${sx(house.ox)} ${sy(house.oy + house.h) + 20}v12M${sx(house.ox + house.w)} ${sy(house.oy + house.h) + 20}v12`} />
        <text x={(sx(house.ox) + sx(house.ox + house.w)) / 2} y={sy(house.oy + house.h) + 44} textAnchor="middle" stroke="none">{fm(house.w)} m</text>
      </g>

      {/* canalizaciones */}
      {g.showRoutes && Object.values(an.circuits).map((ci) => {
        const d = ci.points.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x)} ${sy(y)}`).join('');
        const st = status[ci.id];
        return <path key={ci.id} d={d} fill="none" stroke={st === 'fire' ? '#ff3b30' : circuitDef(ci.id).color} strokeWidth={st === 'fire' ? 4.5 : 2.6} strokeDasharray={st === 'fire' ? undefined : '9 5'} opacity={st === 'tripped' ? 0.25 : 0.85} strokeLinejoin="round" pointerEvents="none" className={st === 'fire' ? 'hotwire' : ''} />;
      })}
      {/* vínculos mando → luz */}
      {g.showLinks && state.links.map((l, i) => {
        const a = state.devices.find((d) => d.id === l.sw), b = state.devices.find((d) => d.id === l.light);
        if (!a || !b) return null;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 0.35;
        const hot = selected === a.id || selected === b.id || linkFrom === a.id;
        return <path key={i} d={`M${sx(a.x)} ${sy(a.y)}Q${sx(mx)} ${sy(my)} ${sx(b.x)} ${sy(b.y)}`} fill="none" stroke={PENCIL} strokeWidth={hot ? 2.2 : 1.2} strokeDasharray="3 4" opacity={hot ? 0.95 : 0.4} pointerEvents="none" />;
      })}

      {/* cuadro */}
      <g transform={`translate(${sx(state.panel.x)} ${sy(state.panel.y)})`} style={{ cursor: editing ? 'grab' : 'default' }}
        onPointerDown={(e) => { if (!editing) return; e.stopPropagation(); drag.current = { id: 'panel', panel: true }; }}>
        <rect x={-14} y={-20} width={28} height={40} rx={3} fill="#0b2347" stroke={PENCIL} strokeWidth={2.2} />
        <rect x={-9} y={-14} width={18} height={9} fill={PENCIL} opacity={0.9} /><rect x={-9} y={-2} width={18} height={9} fill={PENCIL} opacity={0.55} />
        <text y={32} textAnchor="middle" fontSize={10} fontWeight={800} fill={PENCIL}>CUADRO</text>
        {Object.values(status).includes('tripped') && <circle r={26} fill="none" stroke="#ff5d4a" strokeWidth={3} className="pulse" />}
      </g>

      {/* dispositivos */}
      {state.devices.map((d) => {
        const c = d.circuit ? circuitDef(d.circuit).color : '#8aa7cf';
        const st = d.circuit ? status[d.circuit] : undefined;
        const sel = selected === d.id || linkFrom === d.id;
        const bad = d.kind === 'toma' && inBathZone(house, d);
        return (
          <g key={d.id} transform={`translate(${sx(d.x)} ${sy(d.y)})`} style={{ cursor: editing ? (tool === 'delete' ? 'not-allowed' : 'grab') : 'default' }}
            onPointerDown={(e) => { if (!editing) return; e.stopPropagation(); if (tool && ['delete', 'link'].includes(tool)) { g.click(d.id); return; } g.click(d.id); drag.current = { id: d.id }; }}>
            {(d.kind === 'luz' || d.kind === 'luzExt') && lit(d.circuit) && <circle r={PX * 1.1} fill="url(#glow)" pointerEvents="none" className="flicker-soft" />}
            <circle r={19} fill="transparent" />
            {sel && <circle r={19} fill="none" stroke={PENCIL} strokeWidth={2} strokeDasharray="4 3" />}
            {bad && <circle r={19} fill="none" stroke="#ff5d4a" strokeWidth={2.4} className="pulse" />}
            <g opacity={st === 'tripped' ? 0.35 : 1}><Glyph kind={d.kind} color={c} /></g>
            {st === 'slow' && <text y={-14} textAnchor="middle" fontSize={13}>⚠</text>}
          </g>
        );
      })}

      {/* fantasma al colocar */}
      {editing && mouse && kindTool && (() => { const ok = !!roomAt(house, mouse.x, mouse.y); const bad = kindTool === 'toma' && inBathZone(house, mouse); return (
        <g transform={`translate(${sx(mouse.x)} ${sy(mouse.y)})`} pointerEvents="none" opacity={0.9}><Glyph kind={kindTool} color={ok && !bad ? PENCIL : '#ff5d4a'} ghost />{(!ok || bad) && <text y={-18} textAnchor="middle" fontSize={11} fill="#ff9a8c" fontWeight={700}>{bad ? 'zona prohibida' : 'fuera de la vivienda'}</text>}</g>); })()}
      {editing && mouse && tool === 'panel' && <rect x={sx(mouse.x) - 14} y={sy(mouse.y) - 20} width={28} height={40} rx={3} fill="none" stroke={PENCIL} strokeDasharray="4 3" pointerEvents="none" />}

      {/* explosión del incendio */}
      {Object.entries(status).filter(([, s]) => s === 'fire').map(([cid]) => (
        <g key={`${cid}-${fireKey}`} transform={`translate(${sx(state.panel.x)} ${sy(state.panel.y)})`}><Boom big /></g>
      ))}
    </svg>
  );
}

export { dev };
