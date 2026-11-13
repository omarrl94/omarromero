/**
 * Vista REAL: el mismo circuito, montado sobre un panel de prácticas profesional.
 * Distribución automática (alimentación · protección y maniobra · mando y señalización · cargas),
 * aparamenta dibujada con materiales (plástico, metal, vidrio), bornes de tornillo y cables de colores
 * normalizados con terminal de punta. No cambia el modelo: solo cómo se dibuja.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { defOf, fmt, fmtOhm, fmtSI, nextToggle, symOf } from '../model/library';
import { tkey, type SimResult } from '../model/netlist';
import type { Component, TermRef } from '../model/types';
import { beep } from './sound';
import { beginProbeDrag } from './Floating';
import { Boom } from './Boom';

type Dir = 'up' | 'down';
interface Term { x: number; y: number; dir: Dir }
interface Dev { c: Component; x: number; y: number; w: number; h: number; terms: Term[]; row: number }

const GAP = 34;
const LED_HUE = ['#ff3b30', '#2ecc71', '#3b82f6', '#ffd60a'];

/** Tamaño y bornes (coordenadas locales) de cada aparato. */
const SHAPE: Record<string, { w: number; h: number; terms: Term[]; row: number }> = {
  battery: { w: 128, h: 150, row: 0, terms: [{ x: 34, y: 132, dir: 'down' }, { x: 94, y: 132, dir: 'down' }] },
  acsource: { w: 128, h: 150, row: 0, terms: [{ x: 34, y: 132, dir: 'down' }, { x: 94, y: 132, dir: 'down' }] },
  isource: { w: 128, h: 150, row: 0, terms: [{ x: 34, y: 132, dir: 'down' }, { x: 94, y: 132, dir: 'down' }] },
  breaker: { w: 40, h: 150, row: 1, terms: [{ x: 20, y: 14, dir: 'up' }, { x: 20, y: 136, dir: 'down' }] },
  fuse: { w: 40, h: 150, row: 1, terms: [{ x: 20, y: 14, dir: 'up' }, { x: 20, y: 136, dir: 'down' }] },
  switch: { w: 40, h: 150, row: 1, terms: [{ x: 20, y: 14, dir: 'up' }, { x: 20, y: 136, dir: 'down' }] },
  spdt: { w: 60, h: 150, row: 1, terms: [{ x: 30, y: 136, dir: 'down' }, { x: 16, y: 14, dir: 'up' }, { x: 44, y: 14, dir: 'up' }] },
  junction: { w: 36, h: 80, row: 1, terms: [{ x: 18, y: 14, dir: 'up' }] },
  ground: { w: 110, h: 46, row: 1, terms: [{ x: 55, y: 12, dir: 'up' }] },
  lamp: { w: 80, h: 128, row: 2, terms: [{ x: 24, y: 108, dir: 'down' }, { x: 56, y: 108, dir: 'down' }] },
  led: { w: 80, h: 128, row: 2, terms: [{ x: 24, y: 108, dir: 'down' }, { x: 56, y: 108, dir: 'down' }] },
  buzzer: { w: 80, h: 128, row: 2, terms: [{ x: 24, y: 108, dir: 'down' }, { x: 56, y: 108, dir: 'down' }] },
  pushNO: { w: 80, h: 128, row: 2, terms: [{ x: 24, y: 108, dir: 'down' }, { x: 56, y: 108, dir: 'down' }] },
  pushNC: { w: 80, h: 128, row: 2, terms: [{ x: 24, y: 108, dir: 'down' }, { x: 56, y: 108, dir: 'down' }] },
  resistor: { w: 160, h: 84, row: 3, terms: [{ x: 22, y: 72, dir: 'down' }, { x: 138, y: 72, dir: 'down' }] },
  heater: { w: 150, h: 96, row: 3, terms: [{ x: 22, y: 84, dir: 'down' }, { x: 128, y: 84, dir: 'down' }] },
  pot: { w: 110, h: 126, row: 3, terms: [{ x: 20, y: 114, dir: 'down' }, { x: 90, y: 114, dir: 'down' }, { x: 55, y: 114, dir: 'down' }] },
  capacitor: { w: 78, h: 126, row: 3, terms: [{ x: 24, y: 114, dir: 'down' }, { x: 54, y: 114, dir: 'down' }] },
  inductor: { w: 120, h: 110, row: 3, terms: [{ x: 26, y: 98, dir: 'down' }, { x: 94, y: 98, dir: 'down' }] },
  ntc: { w: 90, h: 100, row: 3, terms: [{ x: 24, y: 88, dir: 'down' }, { x: 66, y: 88, dir: 'down' }] },
  ptc: { w: 90, h: 100, row: 3, terms: [{ x: 24, y: 88, dir: 'down' }, { x: 66, y: 88, dir: 'down' }] },
  ldr: { w: 90, h: 100, row: 3, terms: [{ x: 24, y: 88, dir: 'down' }, { x: 66, y: 88, dir: 'down' }] },
  diode: { w: 100, h: 80, row: 3, terms: [{ x: 22, y: 68, dir: 'down' }, { x: 78, y: 68, dir: 'down' }] },
  zener: { w: 100, h: 80, row: 3, terms: [{ x: 22, y: 68, dir: 'down' }, { x: 78, y: 68, dir: 'down' }] },
  motor: { w: 170, h: 150, row: 3, terms: [{ x: 58, y: 16, dir: 'up' }, { x: 112, y: 16, dir: 'up' }] },
};
const ROW_NAMES = ['ALIMENTACIÓN', 'PROTECCIÓN Y MANIOBRA', 'MANDO Y SEÑALIZACIÓN', 'RECEPTORES Y COMPONENTES'];

/** Las variantes nuevas se dibujan con el aparato real más parecido. */
const REAL_AS: Record<string, string> = {
  vsrc: 'battery', pv: 'battery', usb: 'battery', polcap: 'capacitor', capvar: 'capacitor', capbank: 'capacitor',
  indcore: 'inductor', indvar: 'inductor', solenoid: 'inductor', zbox: 'inductor', load: 'inductor',
  rheo: 'resistor', trim: 'resistor', shunt: 'resistor', gauge: 'resistor', rnet: 'resistor',
  borne: 'switch', jumper: 'switch', connector: 'switch', socket: 'switch', plug: 'switch', disc: 'switch', estop: 'switch', sensor: 'switch',
  pica: 'ground', sel3: 'spdt', gang: 'multi', push2: 'multi', cross: 'multi', relay: 'multi', xfmr: 'multi', src3: 'multi', load3: 'multi', motor3: 'multi',
};
const shapeKey = (c: Component) => { const k = symOf(c.type); return SHAPE[k] ? k : REAL_AS[k] ?? 'resistor'; };
function shapeOf(c: Component) {
  if (shapeKey(c) === 'multi') {
    const k = defOf(c.type).terminals.length, pairs = Math.ceil(k / 2);
    return { w: 24 + pairs * 36, h: 150, row: 1, terms: Array.from({ length: k }, (_, i) => ({ x: 24 + Math.floor(i / 2) * 36, y: i % 2 === 0 ? 14 : 136, dir: (i % 2 === 0 ? 'up' : 'down') as Dir })) };
  }
  return SHAPE[shapeKey(c)];
}
/** Componente «disfrazado» del aparato real que lo representa, con los parámetros que ese dibujo espera. */
function realComp(c: Component): Component {
  const key = shapeKey(c);
  if (key === c.type) return c;
  const m = defOf(c.type).model;
  const params = { ...c.params } as Component['params'];
  if (m.kind === 'SW') params.closed = m.closed(c.params);
  if (m.kind === 'V') params.v = m.value(c.params);
  if (m.kind === 'R') { params.r = m.value(c.params); if (key === 'inductor') params.l = Number(c.params.l ?? 0); }
  if (m.kind === 'GANG') params.closed = m.closed(c.params, 0);
  if (m.kind === 'CROSS') params.closed = m.pos(c.params) < 0.5;
  return { ...c, type: key, params };
}

function layout(components: Component[], maxW: number): { devs: Dev[]; W: number; H: number; rows: { y: number; h: number }[] } {
  const devs: Dev[] = [];
  const rowsY: { y: number; h: number }[] = [];
  let y = 86;
  for (let r = 0; r < 4; r++) {
    const items = components.filter((c) => (shapeOf(c) ?? { row: 3 }).row === r);
    if (!items.length) { rowsY.push({ y, h: 0 }); continue; }
    let x = 96, rowTop = y, lineH = 0;
    for (const c of items) {
      const s = shapeOf(c) ?? SHAPE.resistor;
      if (x + s.w > maxW && x > 96) { x = 96; rowTop += lineH + 120; lineH = 0; }
      devs.push({ c, x, y: rowTop, w: s.w, h: s.h, terms: s.terms, row: r });
      x += s.w + GAP;
      lineH = Math.max(lineH, s.h);
    }
    rowsY.push({ y, h: rowTop + lineH - y });
    y = rowTop + lineH + 124;
  }
  const W = Math.max(maxW + 70, 640);
  return { devs, W, H: y - 20, rows: rowsY };
}

function Screw({ x, y, hot }: { x: number; y: number; hot?: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r={9.5} fill="#8b8f95" opacity={0.35} />
      <circle cx={x} cy={y} r={8} fill="url(#metal)" stroke="#5b5f66" strokeWidth={0.8} />
      <path d={`M${x - 5} ${y - 1}L${x + 5} ${y + 1}`} stroke="#3a3d42" strokeWidth={1.8} strokeLinecap="round" />
      {hot && <circle cx={x} cy={y} r={11} fill="none" stroke="#EFCD2F" strokeWidth={2} />}
    </g>
  );
}

export function RealPanel({ sim, cables }: { sim: SimResult; cables?: Record<string, import('../model/cables').CableInfo> }) {
  const st = useStore();
  const { project, selection, runtime } = st;
  const svgRef = useRef<SVGSVGElement>(null);
  const { devs, W, H, rows } = useMemo(() => layout(project.components, 1020), [project.components]);
  const [vb, setVb] = useState<{ x: number; y: number; k: number } | null>(null);
  const view = vb ?? { x: 0, y: 0, k: 1 };
  const vw = W / view.k, vh = H / view.k;
  const byId = new Map(devs.map((d) => [d.c.id, d]));
  const dragRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  // Cableado arrastrando de borne a borne
  const [wd, setWd] = useState<{ from: TermRef; x: number; y: number } | null>(null);
  const wdFrom = wd?.from;
  useEffect(() => {
    if (!wdFrom) return;
    const move = (e: PointerEvent) => { const p = toSvgRef.current(e.clientX, e.clientY); setWd({ from: wdFrom, x: p.x, y: p.y }); };
    const up = (e: PointerEvent) => {
      const p = toSvgRef.current(e.clientX, e.clientY);
      const hit = nearestTerm(p.x, p.y, 26 / Math.max(0.3, p.s));
      if (hit && !(hit.comp === wdFrom.comp && hit.term === wdFrom.term)) useStore.getState().addWire(wdFrom, hit);
      setWd(null);
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [wdFrom]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const s = useStore.getState();
      if (e.key === 'Delete' || e.key === 'Backspace') s.deleteSelection();
      else if (e.key === 'Escape') { setWd(null); s.select([]); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? s.redo() : s.undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); s.redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const holdRef = useRef<{ id: string; key: string } | null>(null);

  const termXY = (t: TermRef) => {
    const d = byId.get(t.comp);
    if (!d) return null;
    const tt = d.terms[t.term];
    return tt ? { x: d.x + tt.x, y: d.y + tt.y, dir: tt.dir } : null;
  };

  // Color del cable según la función del conductor
  const ac = !!sim.ac;
  const posNodes = useMemo(() => {
    const s = new Set<number>();
    for (const c of project.components) if (['battery', 'acsource', 'isource', 'vsrc', 'pv', 'usb'].includes(symOf(c.type))) s.add(sim.nodeOf[`${c.id}:0`]);
    return s;
  }, [project.components, sim.nodeOf]);
  const wireColor = (n: number) => {
    if (n === 0) return ac ? { c: '#1565c0', hi: '#6fa8ee', name: 'neutro · azul' } : { c: '#1b1b1b', hi: '#6a6a6a', name: 'negativo · negro' };
    if (posNodes.has(n)) return ac ? { c: '#7a4a24', hi: '#c08a5e', name: 'fase · marrón' } : { c: '#c62828', hi: '#ef7b7b', name: 'positivo · rojo' };
    return ac ? { c: '#2b2b2b', hi: '#7a7a7a', name: 'fase conmutada · negro' } : { c: '#ef6c00', hi: '#ffb067', name: 'conductor intermedio · naranja' };
  };

  const maxI = Math.max(1e-9, ...Object.values(sim.wireCurrent).map(Math.abs));
  const nearestTerm = (x: number, y: number, max: number): TermRef | null => {
    let best: { t: TermRef; d: number } | null = null;
    for (const dv of devs) dv.terms.forEach((t, i) => { const d = Math.hypot(dv.x + t.x - x, dv.y + t.y - y); if (d < max && (!best || d < best.d)) best = { t: { comp: dv.c.id, term: i }, d }; });
    return (best as { t: TermRef } | null)?.t ?? null;
  };

  const toSvgRef = useRef<(cx: number, cy: number) => { x: number; y: number; s: number }>(() => ({ x: 0, y: 0, s: 1 }));
  const toSvg = (cx: number, cy: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    const s = Math.min(r.width / vw, r.height / vh);
    const ox = (r.width - vw * s) / 2, oy = (r.height - vh * s) / 2;
    return { x: view.x + (cx - r.left - ox) / s, y: view.y + (cy - r.top - oy) / s, s };
  };
  toSvgRef.current = toSvg;
  const onWheel = (e: React.WheelEvent) => {
    const p = toSvg(e.clientX, e.clientY);
    const k = Math.min(3, Math.max(0.5, view.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
    const nw = W / k, nh = H / k;
    const fx = (p.x - view.x) / vw, fy = (p.y - view.y) / vh;
    setVb({ k, x: p.x - fx * nw, y: p.y - fy * nh });
  };
  const onBgDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const s = toSvg(0, 0).s;
    const dx = (e.clientX - d.x) / s, dy = (e.clientY - d.y) / s;
    if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true;
    if (d.moved) { d.x = e.clientX; d.y = e.clientY; setVb({ k: view.k, x: view.x - dx, y: view.y - dy }); }
  };
  const onUp = () => {
    const d = dragRef.current; dragRef.current = null;
    if (holdRef.current) { useStore.getState().setParam(holdRef.current.id, holdRef.current.key, false); holdRef.current = null; }
    if (d && !d.moved) st.select([]);
  };
  const onDevDown = (e: React.PointerEvent, c: Component) => {
    e.stopPropagation();
    st.select([c.id], e.shiftKey);
    const inter = defOf(c.type).interactive;
    if (!inter) return;
    if (inter.mode === 'hold') { st.setParam(c.id, inter.key, true); holdRef.current = { id: c.id, key: inter.key }; if (st.sound) beep(900, 30); }
    else {
      const cur = c.params[inter.key];
      st.snapshot();
      st.setParam(c.id, inter.key, nextToggle(defOf(c.type), cur));
      if (st.sound) beep(500, 40);
    }
  };
  const onTerm = (e: React.PointerEvent, ref: TermRef) => {
    e.stopPropagation();
    if (st.scopeArm) st.setScopeTip(st.scopeArm, ref);
    else if (st.meter.armed) st.setMeter({ [st.meter.armed]: ref, armed: null } as never);
    else { const t = termXY(ref); if (t) setWd({ from: ref, x: t.x, y: t.y }); }
  };

  return (
    <svg ref={svgRef} className="realpanel" viewBox={`${view.x} ${view.y} ${vw} ${vh}`} onWheel={onWheel} onPointerDown={onBgDown} onPointerMove={onMove} onPointerUp={onUp}
      onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const t = e.dataTransfer.getData('text/plain'); if (t) st.addComponent(t, 0, 0); }}
      data-testid="realpanel">
      <Defs />
      {/* Chapa de fondo */}
      <rect x={0} y={0} width={W} height={H} rx={18} fill="url(#plate)" />
      <rect x={0} y={0} width={W} height={H} rx={18} fill="url(#plateNoise)" opacity={0.5} />
      <rect x={3} y={3} width={W - 6} height={H - 6} rx={16} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={2} />
      {/* taladros de montaje */}
      {Array.from({ length: Math.floor(W / 120) }, (_, i) => Array.from({ length: Math.floor(H / 120) }, (_, j) => (
        <circle key={`${i}-${j}`} cx={60 + i * 120} cy={50 + j * 120} r={3.2} fill="#7c8189" opacity={0.28} />
      )))}
      {[[26, 26], [W - 26, 26], [26, H - 26], [W - 26, H - 26]].map(([x, y], i) => (
        <g key={i}><circle cx={x} cy={y} r={9} fill="#9aa0a8" /><circle cx={x} cy={y} r={7} fill="url(#metal)" /><path d={`M${x - 4.5} ${y - 4.5}L${x + 4.5} ${y + 4.5}M${x + 4.5} ${y - 4.5}L${x - 4.5} ${y + 4.5}`} stroke="#444" strokeWidth={1.6} /></g>
      ))}
      <text x={W / 2} y={44} textAnchor="middle" fontSize={15} fontWeight={800} letterSpacing={6} fill="#3d434b">PANEL DE PRÁCTICAS · CIRCUITOSSEA</text>
      <text x={W / 2} y={62} textAnchor="middle" fontSize={10} letterSpacing={3} fill="#6b727b">{project.name.toUpperCase()}</text>

      {/* Carriles y frontales por fila */}
      {rows.map((r, i) => r.h > 0 && (
        <g key={i}>
          <text x={96} y={r.y - 24} fontSize={9.5} fontWeight={700} letterSpacing={2.4} fill="#7a828c">{ROW_NAMES[i]}</text>
          {i <= 1 && <DinRail x={52} y={r.y + r.h / 2 - 17} w={W - 104} />}
          {i === 2 && <Faceplate x={60} y={r.y - 12} w={W - 120} h={r.h + 24} />}
          {i === 3 && <rect x={60} y={r.y - 12} width={W - 120} height={r.h + 24} rx={10} fill="#000" opacity={0.04} />}
        </g>
      ))}

      {/* Aparatos */}
      {devs.map((d) => (
        <g key={d.c.id} transform={`translate(${d.x} ${d.y})`} onPointerDown={(e) => onDevDown(e, d.c)} style={{ cursor: defOf(d.c.type).interactive ? 'pointer' : 'default' }} data-dev={d.c.id}>
          <Device c={d.c} sim={sim} dead={runtime[d.c.id]} />
          {selection.includes(d.c.id) && <rect x={-6} y={-6} width={d.w + 12} height={d.h + 12} rx={10} fill="none" stroke="#D9722E" strokeWidth={2.4} strokeDasharray="6 4" />}
          <Plate c={d.c} w={d.w} y={d.h + 6} />
        </g>
      ))}

      {/* Cables */}
      {project.wires.map((w, wi) => {
        const a = termXY(w.a), b = termXY(w.b);
        if (!a || !b) return null;
        const n = sim.nodeOf[tkey(w.a)] ?? 0;
        const col = wireColor(n);
        const lane = ((wi % 7) - 3) * 5;
        const k = Math.min(140, Math.max(36, Math.hypot(b.x - a.x, b.y - a.y) / 2.2));
        const sa = a.dir === 'up' ? -1 : 1, sb = b.dir === 'up' ? -1 : 1;
        const d = `M${a.x} ${a.y}C${a.x + lane} ${a.y + sa * k},${b.x + lane} ${b.y + sb * k},${b.x} ${b.y}`;
        const i = sim.wireCurrent[w.id] ?? 0;
        const active = Math.abs(i) > 1e-6 && Math.abs(i) > maxI * 1e-6;
        const sel = selection.includes(w.id);
        return (
          <g key={w.id} onPointerDown={(e) => { e.stopPropagation(); st.select([w.id]); }} style={{ cursor: 'pointer' }}>
            <path d={d} fill="none" stroke="#000" strokeOpacity={0.22} strokeWidth={9} strokeLinecap="round" transform="translate(2 4)" />
            <path d={d} fill="none" stroke={col.c} strokeWidth={(sel ? 2 : 0) + 3.2 + 1.6 * Math.sqrt(cables?.[w.id]?.section ?? 1.5)} strokeLinecap="round" />
            <path d={d} fill="none" stroke={col.hi} strokeOpacity={0.55} strokeWidth={1.6} strokeLinecap="round" transform="translate(-1.2 -1.6)" />
            {cables?.[w.id]?.overload && <path d={d} fill="none" className="hotwire" strokeWidth={9} strokeLinecap="round" />}
            {st.animate && active && <path d={d} fill="none" className="flow" style={{ animationDuration: `${1.6 / (0.25 + 1.75 * Math.sqrt(Math.abs(i) / maxI))}s`, animationDirection: i >= 0 ? 'normal' : 'reverse', strokeWidth: 3.2 }} />}
            {st.showCables && cables?.[w.id] && (
              <g pointerEvents="none" transform={`translate(${(a.x + b.x) / 2 + lane * 0.75} ${(a.y + b.y) / 2})`}>
                <rect x={-24} y={-7.5} width={48} height={15} rx={4} fill="#fff" stroke={cables[w.id].overload ? '#c62828' : col.c} strokeWidth={1.4} />
                <text y={3.4} fontSize={9} fontWeight={800} textAnchor="middle" fill="#222">{String(cables[w.id].section).replace('.', ',')} mm²</text>
              </g>
            )}
            <Ferrule x={a.x} y={a.y} dir={a.dir} color={col.c} />
            <Ferrule x={b.x} y={b.y} dir={b.dir} color={col.c} />
            <title>{col.name}</title>
          </g>
        );
      })}

      {/* Cable en curso */}
      {wd && (() => {
        const a = termXY(wd.from); if (!a) return null;
        const snap = nearestTerm(wd.x, wd.y, 26 / Math.max(0.3, toSvg(0, 0).s));
        const tgt = snap ? termXY(snap) : null;
        const col = wireColor(sim.nodeOf[tkey(wd.from)] ?? 0);
        const ex = tgt?.x ?? wd.x, ey = tgt?.y ?? wd.y;
        const sa = a.dir === 'up' ? -1 : 1;
        const k = Math.min(140, Math.max(30, Math.hypot(ex - a.x, ey - a.y) / 2.2));
        const d = `M${a.x} ${a.y}C${a.x} ${a.y + sa * k},${ex} ${ey + (tgt?.dir === 'up' ? -k : tgt ? k : 0)},${ex} ${ey}`;
        return (
          <g pointerEvents="none">
            <path d={d} fill="none" stroke="#000" strokeOpacity={0.2} strokeWidth={9} strokeLinecap="round" transform="translate(2 4)" />
            <path d={d} fill="none" stroke={col.c} strokeWidth={6.5} strokeLinecap="round" strokeDasharray={snap ? undefined : '10 6'} />
            <Ferrule x={a.x} y={a.y} dir={a.dir} color={col.c} />
            {tgt && <circle cx={tgt.x} cy={tgt.y} r={16} fill="#4caf5033" stroke="#4caf50" strokeWidth={3} className="pulse" />}
          </g>
        );
      })()}

      {/* Bornes encima de los cables (para poder colocar puntas) */}
      {devs.map((d) => d.terms.map((t, ti) => (
        <g key={`${d.c.id}${ti}`}>
          <circle cx={d.x + t.x} cy={d.y + t.y} r={14} fill="transparent" data-term={`${d.c.id}:${ti}`} style={{ cursor: 'crosshair' }}
            onPointerDown={(e) => onTerm(e, { comp: d.c.id, term: ti })} />
          <text x={d.x + t.x} y={d.y + t.y + (t.dir === 'down' ? 28 : -16)} fontSize={8.5} textAnchor="middle" fill="#59616b" fontWeight={700} pointerEvents="none">
            {termName(d.c, ti)}
          </text>
        </g>
      )))}

      {/* Puntas de los instrumentos */}
      {(['red', 'black'] as const).map((k) => {
        const t = st.meter[k]; const p = t && termXY(t); if (!p) return null;
        const dx = k === 'red' ? -26 : 26;
        return (<g key={k} style={{ cursor: 'grab' }} onPointerDown={(e) => beginProbeDrag(k, e)}><circle cx={p.x + dx * 1.5} cy={p.y - 70} r={20} fill="transparent" /><path d={`M${p.x} ${p.y}Q${p.x + dx} ${p.y - 20} ${p.x + dx * 1.5} ${p.y - 70}`} stroke={k === 'red' ? '#e53935' : '#111'} strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d={`M${p.x - 3} ${p.y + 2}L${p.x} ${p.y - 8}L${p.x + 3} ${p.y + 2}Z`} fill="#d8d8d8" stroke="#555" /><circle cx={p.x} cy={p.y} r={11} fill="none" stroke={k === 'red' ? '#e53935' : '#333'} strokeWidth={2.4} /></g>);
      })}
      {(['c1', 'c2'] as const).map((k) => {
        const t = st.scopeTips[k]; const p = t && termXY(t); if (!p) return null;
        const col = k === 'c1' ? '#f5d300' : '#29b6f6';
        return (<g key={k} style={{ cursor: 'grab' }} onPointerDown={(e) => beginProbeDrag(k, e)}><path d={`M${p.x} ${p.y}L${p.x + 22} ${p.y - 56}`} stroke={col} strokeWidth={4} strokeLinecap="round" /><rect x={p.x + 12} y={p.y - 76} width={20} height={20} rx={4} fill={col} stroke="#222" /><text x={p.x + 22} y={p.y - 62} fontSize={12} fontWeight={800} textAnchor="middle">{k === 'c1' ? '1' : '2'}</text></g>);
      })}

      {st.booms.map((b) => { const dv = byId.get(b.comp); return dv ? <g key={b.id} transform={`translate(${dv.x + dv.w / 2} ${dv.y + dv.h / 2})`}><Boom big={['battery', 'acsource'].includes(dv.c.type)} /></g> : null; })}

      {/* Leyenda */}
      <g transform={`translate(${W - 330} ${H - 54})`} fontSize={9.5} fill="#4a525b" fontWeight={600}>
        <rect x={-10} y={-12} width={300} height={36} rx={8} fill="#fff" opacity={0.55} />
        {(ac ? [['#7a4a24', 'Fase'], ['#2b2b2b', 'Conmutada'], ['#1565c0', 'Neutro']] : [['#c62828', '+'], ['#ef6c00', 'Intermedio'], ['#1b1b1b', '−']]).map(([c, l], i) => (
          <g key={l} transform={`translate(${i * 94} 0)`}><rect width={22} height={7} y={2} rx={3.5} fill={c} /><text x={28} y={9.5}>{l}</text></g>
        ))}
      </g>
    </svg>
  );
}

function termName(c: Component, i: number) {
  const n = defOf(c.type).terminals[i]?.name ?? '';
  if (c.type === 'breaker' || c.type === 'fuse' || c.type === 'switch') return i === 0 ? '1' : '2';
  return n;
}

function Ferrule({ x, y, dir, color }: { x: number; y: number; dir: Dir; color: string }) {
  const s = dir === 'up' ? -1 : 1;
  return (
    <g pointerEvents="none">
      <rect x={x - 4.6} y={s > 0 ? y - 2 : y - 15} width={9.2} height={17} rx={1.8} fill="url(#metal)" stroke="#6a6e75" strokeWidth={0.6} />
      <rect x={x - 5.4} y={s > 0 ? y + 9 : y - 22} width={10.8} height={13} rx={2.5} fill={color} />
      <rect x={x - 3.5} y={s > 0 ? y + 10 : y - 21} width={2} height={11} rx={1} fill="#fff" opacity={0.35} />
    </g>
  );
}

function Plate({ c, w, y }: { c: Component; w: number; y: number }) {
  const d = defOf(c.type);
  const name = c.label || (c.id.length <= 4 ? c.id : '');
  return (
    <g pointerEvents="none" transform={`translate(${w / 2} ${y + 22})`}>
      <rect x={-Math.max(30, w / 2)} y={-1} width={Math.max(60, w)} height={d.tag ? 30 : 17} rx={4} fill="#fafafa" stroke="#c9ced4" />
      <text y={11} textAnchor="middle" fontSize={10.5} fontWeight={800} fill="#222">{name || d.name}</text>
      {d.tag && <text y={24} textAnchor="middle" fontSize={8.8} fill="#555">{d.tag(c.params)}</text>}
    </g>
  );
}

function DinRail({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <g>
      <rect x={x} y={y + 3} width={w} height={36} fill="#000" opacity={0.18} transform="translate(0 4)" />
      <rect x={x} y={y} width={w} height={35} fill="url(#rail)" />
      <rect x={x} y={y + 8} width={w} height={19} fill="#7d838b" opacity={0.25} />
      {Array.from({ length: Math.floor(w / 40) }, (_, i) => <rect key={i} x={x + 14 + i * 40} y={y + 13} width={22} height={9} rx={4.5} fill="#3b3f45" />)}
      <rect x={x} y={y} width={w} height={2} fill="#fff" opacity={0.7} />
    </g>
  );
}

function Faceplate({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y + 4} width={w} height={h} rx={12} fill="#000" opacity={0.18} />
      <rect x={x} y={y} width={w} height={h} rx={12} fill="url(#face)" stroke="#a9afb7" />
      {[x + 14, x + w - 14].map((cx, i) => [y + 14, y + h - 14].map((cy, j) => <circle key={`${i}${j}`} cx={cx} cy={cy} r={3.4} fill="url(#metal)" />))}
    </g>
  );
}

/** Dibujo de cada aparato (origen en la esquina superior izquierda). */
function Device({ c: c0, sim, dead }: { c: Component; sim: SimResult; dead?: string }) {
  const c = realComp(c0);
  const live = sim.live[c.id];
  const p = c.params;
  const s = shapeOf(c0) ?? SHAPE.resistor;
  const sw = (cx: number, cy: number) => <Screw x={cx} y={cy} />;
  const termScrews = s.terms.map((t, i) => <g key={i}>{sw(t.x, t.y)}</g>);
  const body = { stroke: '#9aa0a8', strokeWidth: 1 };

  switch (c.type) {
    case 'battery': case 'acsource': case 'isource': {
      const isAc = c.type === 'acsource', isI = c.type === 'isource';
      const val = isAc ? `${fmt(+p.v)} V~` : isI ? `${fmt(+p.i)} A` : `${fmt(+p.v)} V⎓`;
      const on = !!live && Math.abs(live.i) > 1e-9 || !!live;
      return (
        <g>
          <rect x={4} y={8} width={s.w} height={s.h} rx={9} fill="#000" opacity={0.25} />
          <rect x={0} y={0} width={s.w} height={s.h} rx={9} fill="url(#psu)" stroke="#111" />
          <rect x={8} y={8} width={s.w - 16} height={30} rx={4} fill="#0c0f12" />
          <text x={s.w / 2} y={30} textAnchor="middle" fontSize={19} fontWeight={700} fontFamily="ui-monospace,monospace" fill={dead ? '#ff6b5e' : '#8fe3a8'}>{dead ? 'ERROR' : val}</text>
          <text x={s.w / 2} y={58} textAnchor="middle" fontSize={9.5} letterSpacing={2} fontWeight={800} fill="#c9d1da">{isAc ? 'RED MONOFÁSICA' : isI ? 'FUENTE DE CORRIENTE' : 'FUENTE CC'}</text>
          <text x={s.w / 2} y={72} textAnchor="middle" fontSize={8} fill="#8a939e">{isAc ? `${fmt(+p.f)} Hz` : isI ? 'LIMITADA' : 'SALIDA REGULADA'}</text>
          <circle cx={20} cy={92} r={4.5} fill={dead ? '#ff3b30' : on ? '#33e06b' : '#274'} style={{ filter: on || dead ? `drop-shadow(0 0 5px ${dead ? '#ff3b30' : '#33e06b'})` : 'none' }} />
          {dead && <g><rect x={0} y={0} width={s.w} height={s.h} rx={9} fill="#000" opacity={0.45} /><circle cx={s.w / 2} cy={50} r={46} className="burnt-glow" /></g>}
          <text x={30} y={95.5} fontSize={8} fill="#aab3bd">POWER</text>
          {Array.from({ length: 9 }, (_, i) => <rect key={i} x={26 + i * 8} y={106} width={4} height={10} rx={2} fill="#0b0d10" />)}
          <rect x={14} y={120} width={s.w - 28} height={26} rx={4} fill="#1a1d21" />
          <text x={34} y={113.5} fontSize={9} fontWeight={800} textAnchor="middle" fill={isAc ? '#c08a5e' : '#ef7b7b'}>{isAc ? 'L' : isI ? 'IN' : '+'}</text>
          <text x={94} y={113.5} fontSize={9} fontWeight={800} textAnchor="middle" fill={isAc ? '#6fa8ee' : '#bbb'}>{isAc ? 'N' : isI ? 'OUT' : '−'}</text>
          {termScrews}
        </g>
      );
    }
    case 'breaker': case 'fuse': case 'switch': {
      const isBr = c.type === 'breaker', isFu = c.type === 'fuse';
      const closed = isBr || isFu ? !dead : Boolean(p.closed);
      return (
        <g>
          <rect x={3} y={6} width={s.w} height={s.h} rx={4} fill="#000" opacity={0.22} />
          <rect x={0} y={0} width={s.w} height={s.h} rx={4} fill="url(#plastic)" {...body} />
          <rect x={0} y={0} width={s.w} height={30} rx={4} fill="#d7dadf" />
          <rect x={0} y={s.h - 30} width={s.w} height={30} rx={4} fill="#d7dadf" />
          {isFu ? (
            <g>
              <rect x={6} y={34} width={28} height={80} rx={6} fill="#1d2126" />
              <rect x={9} y={37} width={22} height={74} rx={4} fill="url(#glass)" opacity={dead ? 0.55 : 0.9} />
              {dead ? (<><path d="M20 40V68M20 84V108" stroke="#555" strokeWidth={1.6} /><path d="M17 70Q20 76 23 82" stroke="#222" strokeWidth={4} opacity={0.8} fill="none" /></>) : <path d="M20 40V108" stroke="#c9ccd1" strokeWidth={1.6} />}
              <rect x={9} y={37} width={22} height={7} fill="#b7873a" /><rect x={9} y={104} width={22} height={7} fill="#b7873a" />
              {dead && [0, 1, 2].map((k) => <circle key={k} cx={20 + k * 3} cy={30} r={5} className="smoke" style={{ animationDelay: `${k * 0.5}s` }} />)}
              <text x={20} y={76} textAnchor="middle" fontSize={9} fontWeight={800} fill="#fff" transform="rotate(-90 20 76)">{fmt(+p.in)} A gG</text>
            </g>
          ) : (
            <g>
              <rect x={7} y={42} width={26} height={66} rx={4} fill="#202327" />
              <g style={{ transform: `translateY(${closed ? 0 : 28}px)`, transition: 'transform .18s cubic-bezier(.3,1.6,.5,1)' }}>
                <rect x={10} y={46} width={20} height={34} rx={4} fill="url(#lever)" stroke="#000" />
                <rect x={13} y={49} width={14} height={4} rx={2} fill="#fff" opacity={0.25} />
              </g>
              <circle cx={20} cy={36} r={3.2} fill={isBr && dead ? '#e53935' : closed ? '#2ecc71' : '#7a7f86'} style={{ filter: closed || dead ? 'drop-shadow(0 0 3px currentColor)' : 'none' }} />
              <text x={20} y={118} textAnchor="middle" fontSize={8.5} fontWeight={800} fill="#222">{closed ? 'I' : '0'}</text>
              {isBr && <text x={20} y={76} textAnchor="middle" fontSize={9} fontWeight={800} fill="#fff" transform="rotate(-90 20 76)" opacity={0}>.</text>}
              {isBr && <text x={20} y={141} textAnchor="middle" fontSize={0}>.</text>}
            </g>
          )}
          {isBr && <text x={31} y={s.h / 2 + 24} fontSize={7.6} fontWeight={800} fill="#333" textAnchor="middle" transform={`rotate(-90 31 ${s.h / 2 + 24})`} />}
          {isBr && <rect x={3} y={116} width={34} height={12} fill="#fff" opacity={0.85} />}
          {isBr && <text x={20} y={125.5} textAnchor="middle" fontSize={8.6} fontWeight={900} fill="#b3261e">{c.type === 'breaker' ? `${p.curve === 5 ? 'B' : p.curve === 20 ? 'D' : 'C'}${p.in}` : ''}</text>}
          {termScrews}
        </g>
      );
    }
    case 'spdt': {
      const up = Number(p.pos) < 0.5;
      return (
        <g>
          <rect x={3} y={6} width={s.w} height={s.h} rx={4} fill="#000" opacity={0.22} />
          <rect x={0} y={0} width={s.w} height={s.h} rx={4} fill="url(#plastic)" {...body} />
          <rect x={0} y={0} width={s.w} height={30} rx={4} fill="#d7dadf" /><rect x={0} y={s.h - 30} width={s.w} height={30} rx={4} fill="#d7dadf" />
          <rect x={10} y={42} width={40} height={66} rx={5} fill="#202327" />
          <g style={{ transform: `translateX(${up ? -8 : 8}px) rotate(${up ? -14 : 14}deg)`, transformOrigin: '30px 75px', transition: 'transform .2s cubic-bezier(.3,1.5,.5,1)' }}>
            <rect x={23} y={48} width={14} height={54} rx={5} fill="url(#lever)" stroke="#000" />
          </g>
          <text x={16} y={124} textAnchor="middle" fontSize={8} fontWeight={800} fill="#222">1</text><text x={44} y={124} textAnchor="middle" fontSize={8} fontWeight={800} fill="#222">2</text>
          {termScrews}
        </g>
      );
    }
    case 'junction':
      return (
        <g>
          <rect x={2} y={5} width={s.w} height={s.h} rx={3} fill="#000" opacity={0.2} />
          <rect x={0} y={0} width={s.w} height={s.h} rx={3} fill="#e08a1e" stroke="#9c5a05" />
          <rect x={0} y={0} width={s.w} height={26} rx={3} fill="#cf7a12" />
          <rect x={7} y={34} width={22} height={30} rx={3} fill="#3a3d42" opacity={0.85} />
          <path d="M11 44H25M11 52H25" stroke="#e08a1e" strokeWidth={2} />
          {termScrews}
        </g>
      );
    case 'ground':
      return (
        <g>
          <rect x={2} y={5} width={s.w} height={s.h} rx={3} fill="#000" opacity={0.2} />
          <rect x={0} y={0} width={s.w} height={s.h} rx={3} fill="#2e8b3d" />
          {Array.from({ length: 11 }, (_, i) => <path key={i} d={`M${i * 14 - 6} ${s.h}L${i * 14 + 8} 0L${i * 14 + 15} 0L${i * 14 + 1} ${s.h}Z`} fill="#f4d300" opacity={0.95} />)}
          <rect x={0} y={0} width={s.w} height={s.h} rx={3} fill="none" stroke="#1b5e24" />
          <text x={s.w / 2} y={34} textAnchor="middle" fontSize={10} fontWeight={900} fill="#143d1a" stroke="#fff" strokeWidth={2.5} paintOrder="stroke">MASA · 0 V</text>
          {termScrews}
        </g>
      );
    case 'lamp': case 'led': case 'buzzer': case 'pushNO': case 'pushNC': {
      const isBtn = c.type === 'pushNO' || c.type === 'pushNC';
      const pressed = Boolean(p.pressed);
      let lens = '#d9d2c3', glow = 0, hue = '#ffd96a';
      if (c.type === 'lamp') { const k = dead ? 0 : Math.min(1.2, (live?.p ?? 0) / Number(p.pn)); glow = k; hue = '#fff1a8'; lens = k > 0.03 ? '#fff4b8' : '#d9d2c3'; }
      if (c.type === 'led') { const imax = Number(p.imax) / 1000; glow = live?.on && !dead ? Math.min(1, Math.abs(live.i) / (imax * 0.6)) : 0; hue = LED_HUE[Number(p.color)] ?? '#f33'; lens = glow > 0.02 ? hue : `color-mix(in srgb, ${hue} 35%, #3a3a3a)`; }
      if (c.type === 'buzzer') { glow = !dead && (live?.p ?? 0) > 0.2 * Number(p.pn) ? 1 : 0; hue = '#EFCD2F'; lens = '#1b1b1b'; }
      if (isBtn) { hue = c.type === 'pushNO' ? '#2ecc71' : '#e53935'; lens = hue; }
      return (
        <g>
          <rect x={14} y={70} width={52} height={50} rx={6} fill="url(#plasticDark)" stroke="#111" />
          <rect x={14} y={70} width={52} height={6} rx={3} fill="#fff" opacity={0.12} />
          {termScrews}
          {glow > 0.02 && <circle cx={40} cy={38} r={34 + 14 * glow} fill={hue} opacity={0.18 + 0.4 * Math.min(1, glow)} style={{ filter: 'blur(10px)' }} />}
          <circle cx={40} cy={38} r={33} fill="url(#chrome)" stroke="#6b7078" />
          <circle cx={40} cy={38} r={27} fill="#15171a" />
          {isBtn ? (
            <g style={{ transform: `translateY(${pressed ? 3 : 0}px)`, transition: 'transform .08s' }}>
              <circle cx={40} cy={38} r={22} fill={lens} stroke="#0006" strokeWidth={1.2} />
              <circle cx={40} cy={38} r={22} fill="url(#lensShine)" />
              <text x={40} y={43} textAnchor="middle" fontSize={15} fontWeight={900} fill="#fff" opacity={0.95}>{c.type === 'pushNO' ? 'I' : '0'}</text>
            </g>
          ) : c.type === 'buzzer' ? (
            <g>
              <circle cx={40} cy={38} r={22} fill="#1b1b1b" />
              {Array.from({ length: 5 }, (_, i) => <circle key={i} cx={40} cy={38} r={5 + i * 4} fill="none" stroke="#3b3b3b" strokeWidth={1.6} />)}
              {glow > 0 && [0, 1, 2].map((k) => <circle key={k} cx={40} cy={38} r={24 + k * 7} fill="none" stroke="#EFCD2F" strokeWidth={2} className="wave" style={{ animationDelay: `${k * 0.2}s` }} />)}
            </g>
          ) : (
            <g>
              <circle cx={40} cy={38} r={22} fill={dead ? '#3a3632' : lens} className={glow > 1.15 ? 'flicker' : ''} style={{ transition: 'fill .15s' }} />
              {dead && <circle cx={40} cy={38} r={30} className="burnt-glow" />}
              <circle cx={40} cy={38} r={22} fill="url(#lensShine)" />
              {c.type === 'lamp' && <path d="M30 46Q40 22 50 46M32 41H48" stroke={glow > 0.03 ? '#ff9d00' : '#8a8472'} strokeWidth={1.6} fill="none" opacity={0.9} />}
              {dead && <path d="M28 26L52 50M52 26L28 50" stroke="#222" strokeWidth={3} />}
            </g>
          )}
          <circle cx={40} cy={38} r={27} fill="none" stroke="#fff" strokeOpacity={0.18} />
        </g>
      );
    }
    case 'resistor': case 'heater': {
      const isHeater = c.type === 'heater';
      const k = isHeater ? Math.min(1, (live?.p ?? 0) / Number(p.pn)) : 0;
      const hot = !isHeater && (live?.p ?? 0) > Number(p.pmax);
      return (
        <g>
          <rect x={4} y={10} width={s.w - 8} height={s.h - 14} rx={6} fill="#000" opacity={0.22} />
          <rect x={0} y={s.h - 28} width={s.w} height={22} rx={5} fill="url(#plasticDark)" stroke="#111" />
          {isHeater ? (
            <g>
              {k > 0.02 && <rect x={6} y={0} width={s.w - 12} height={s.h - 26} rx={10} fill="#ff5a1f" opacity={0.15 + 0.45 * k} style={{ filter: 'blur(9px)' }} />}
              <rect x={14} y={4} width={s.w - 28} height={s.h - 34} rx={6} fill={`color-mix(in srgb, #ff5a1f ${Math.round(100 * k)}%, #6a6f77)`} stroke="#444" />
              {Array.from({ length: 9 }, (_, i) => <rect key={i} x={24 + i * 12} y={8} width={5} height={s.h - 42} rx={2} fill="#000" opacity={0.28} />)}
            </g>
          ) : (
            <g>
              <rect x={16} y={6} width={s.w - 32} height={s.h - 36} rx={7} fill="url(#alu)" stroke="#6b7078" />
              {Array.from({ length: 12 }, (_, i) => <rect key={i} x={26 + i * 9.4} y={8} width={2.6} height={s.h - 40} fill="#000" opacity={0.16} />)}
              <rect x={22} y={14} width={s.w - 44} height={s.h - 52} rx={3} fill={hot ? '#c62828' : '#f4f1ea'} className={hot ? 'pulse' : ''} opacity={0.96} />
              <text x={s.w / 2} y={(s.h - 36) / 2 + 12} textAnchor="middle" fontSize={13} fontWeight={800} fill="#222" fontFamily="ui-monospace,monospace">{fmtOhm(+p.r)}</text>
            </g>
          )}
          {termScrews}
        </g>
      );
    }
    case 'pot': {
      const a = -135 + Number(p.pos) * 270;
      return (
        <g>
          <rect x={4} y={10} width={s.w - 8} height={s.h - 10} rx={8} fill="#000" opacity={0.22} />
          <rect x={0} y={s.h - 32} width={s.w} height={26} rx={5} fill="url(#plasticDark)" stroke="#111" />
          <circle cx={55} cy={50} r={44} fill="#101214" /><circle cx={55} cy={50} r={40} fill="url(#knobGrad)" stroke="#000" />
          {Array.from({ length: 24 }, (_, i) => <line key={i} transform={`rotate(${i * 15} 55 50)`} x1={55} y1={11} x2={55} y2={17} stroke="#0008" strokeWidth={2} />)}
          <g style={{ transform: `rotate(${a}deg)`, transformOrigin: '55px 50px', transition: 'transform .2s' }}><rect x={52.5} y={14} width={5} height={20} rx={2.5} fill="#EFCD2F" /></g>
          <circle cx={55} cy={50} r={9} fill="#222" />
          {termScrews}
        </g>
      );
    }
    case 'capacitor':
      return (
        <g>
          <ellipse cx={39} cy={s.h - 18} rx={34} ry={7} fill="#000" opacity={0.2} />
          <rect x={0} y={s.h - 32} width={s.w} height={26} rx={5} fill="url(#plasticDark)" stroke="#111" />
          <rect x={10} y={8} width={58} height={s.h - 40} rx={8} fill="url(#can)" stroke="#0b2a55" />
          <ellipse cx={39} cy={10} rx={29} ry={5} fill="#c8ccd2" stroke="#7a7f86" />
          <path d="M33 10H45M39 5V15" stroke="#6b7078" />
          <rect x={52} y={20} width={9} height={s.h - 58} rx={3} fill="#e6e8ee" opacity={0.85} />
          <text x={34} y={58} textAnchor="middle" fontSize={12} fontWeight={800} fill="#fff" transform="rotate(0)">{fmt(+p.c)}µF</text>
          <text x={34} y={72} textAnchor="middle" fontSize={8.5} fill="#cfe0ff">50 V · 105 °C</text>
          {termScrews}
        </g>
      );
    case 'inductor':
      return (
        <g>
          <rect x={4} y={10} width={s.w - 8} height={s.h - 10} rx={8} fill="#000" opacity={0.22} />
          <rect x={0} y={s.h - 30} width={s.w} height={24} rx={5} fill="url(#plasticDark)" stroke="#111" />
          <ellipse cx={60} cy={44} rx={50} ry={34} fill="#2b2e33" stroke="#111" />
          <ellipse cx={60} cy={44} rx={21} ry={14} fill="#15171a" />
          {Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * Math.PI * 2; return <ellipse key={i} cx={60 + Math.cos(a) * 36} cy={44 + Math.sin(a) * 23} rx={7} ry={11} transform={`rotate(${(a * 180) / Math.PI + 90} ${60 + Math.cos(a) * 36} ${44 + Math.sin(a) * 23})`} fill="url(#copper)" stroke="#6b3d12" strokeWidth={0.6} />; })}
          {termScrews}
        </g>
      );
    case 'ntc': case 'ptc': case 'ldr': {
      const col = c.type === 'ntc' ? '#2a62c9' : c.type === 'ptc' ? '#c94a2a' : '#b8862d';
      return (
        <g>
          <rect x={4} y={8} width={s.w - 8} height={s.h - 8} rx={8} fill="#000" opacity={0.2} />
          <rect x={0} y={s.h - 28} width={s.w} height={22} rx={5} fill="url(#plasticDark)" stroke="#111" />
          <path d="M26 66V50M64 66V50" stroke="#c9ccd1" strokeWidth={2.4} />
          <circle cx={45} cy={30} r={c.type === 'ldr' ? 24 : 18} fill={col} stroke="#000" strokeOpacity={0.5} />
          {c.type === 'ldr' ? <path d="M30 22Q45 14 60 22T60 36T30 44M30 30H60" stroke="#fff" strokeOpacity={0.5} fill="none" strokeWidth={2} /> : <ellipse cx={40} cy={24} rx={6} ry={4} fill="#fff" opacity={0.4} />}
          <text x={45} y={34} textAnchor="middle" fontSize={9} fontWeight={800} fill="#fff" opacity={c.type === 'ldr' ? 0 : 1}>{c.type.toUpperCase()}</text>
          {termScrews}
        </g>
      );
    }
    case 'diode': case 'zener': {
      const on = !!live?.on;
      return (
        <g>
          <rect x={4} y={8} width={s.w - 8} height={s.h - 8} rx={8} fill="#000" opacity={0.2} />
          <rect x={0} y={s.h - 26} width={s.w} height={20} rx={5} fill="url(#plasticDark)" stroke="#111" />
          <path d="M22 52V44M78 52V44" stroke="#c9ccd1" strokeWidth={2.4} />
          <rect x={26} y={20} width={48} height={22} rx={8} fill={c.type === 'zener' ? '#5a3d1a' : '#17191c'} stroke="#000" />
          <rect x={62} y={20} width={9} height={22} rx={2} fill="#d7dadf" />
          <rect x={30} y={23} width={20} height={3} rx={1.5} fill="#fff" opacity={0.25} />
          {on && <circle cx={50} cy={31} r={30} fill="#EFCD2F" opacity={0.18} style={{ filter: 'blur(8px)' }} />}
          {termScrews}
        </g>
      );
    }
    case 'motor': {
      const k = Math.min(1.5, Math.abs(live?.v ?? 0) / Number(p.vn));
      return (
        <g>
          <ellipse cx={85} cy={s.h - 6} rx={72} ry={7} fill="#000" opacity={0.22} />
          <rect x={44} y={0} width={82} height={34} rx={6} fill="url(#plasticDark)" stroke="#111" />
          {termScrews}
          <rect x={20} y={38} width={110} height={86} rx={16} fill="url(#motorBody)" stroke="#12304f" />
          {Array.from({ length: 9 }, (_, i) => <rect key={i} x={34 + i * 10.4} y={42} width={3} height={78} rx={1.5} fill="#000" opacity={0.22} />)}
          <rect x={130} y={58} width={22} height={46} rx={3} fill="url(#metal)" stroke="#555" />
          <rect x={130} y={77} width={22} height={7} fill="#444" opacity={0.5} />
          <rect x={8} y={56} width={14} height={50} rx={4} fill="#c9ced6" stroke="#6b7078" />
          <g className={k > 0.03 ? 'spin' : ''} style={{ animationDuration: `${Math.max(0.12, 1.2 / Math.max(0.05, k))}s`, animationDirection: (live?.i ?? 0) >= 0 ? 'normal' : 'reverse', transformOrigin: '15px 81px', transformBox: 'view-box' }}>
            <circle cx={15} cy={81} r={11} fill="#e8ebf0" stroke="#888" /><path d="M15 71V91M5 81H25" stroke="#555" strokeWidth={2.4} />
          </g>
          <rect x={48} y={118} width={60} height={8} rx={3} fill="#0c2036" /><text x={78} y={96} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fff" opacity={0.9}>MOTOR CC</text>
          <text x={78} y={110} textAnchor="middle" fontSize={8.5} fill="#cfe0ff">{fmt(+p.vn)} V</text>
        </g>
      );
    }
    case 'multi': {
      const k = defOf(c0.type).terminals.length, pairs = Math.ceil(k / 2);
      const mm = defOf(c0.type).model;
      return (
        <g>
          <rect x={3} y={6} width={s.w} height={s.h} rx={4} fill="#000" opacity={0.22} />
          <rect x={0} y={0} width={s.w} height={s.h} rx={4} fill="url(#plastic)" {...body} />
          <rect x={0} y={0} width={s.w} height={30} rx={4} fill="#d7dadf" /><rect x={0} y={s.h - 30} width={s.w} height={30} rx={4} fill="#d7dadf" />
          {Array.from({ length: pairs }, (_, i) => { const rl = !!sim.live[c0.id]?.on; const on = mm.kind === 'GANG' ? mm.closed(c0.params, i) : mm.kind === 'CROSS' ? mm.pos(c0.params) < 0.5 : mm.kind === 'RCD' ? Boolean(c0.params.closed) : mm.kind === 'RELAY' ? (i === 0 ? rl : i - 1 < mm.nNO ? rl : !rl) : true; return (
            <g key={i} transform={`translate(${24 + i * 36 - 13} 0)`}><rect x={0} y={42} width={26} height={66} rx={4} fill="#202327" />
              <g style={{ transform: `translateY(${on ? 0 : 28}px)`, transition: 'transform .18s' }}><rect x={3} y={46} width={20} height={34} rx={4} fill="url(#lever)" stroke="#000" /></g></g>); })}
          <text x={s.w / 2} y={125} textAnchor="middle" fontSize={8.5} fontWeight={800} fill="#222">{defOf(c0.type).name.split(' ').slice(-1)[0]}</text>
          {termScrews}
        </g>
      );
    }
    default:
      return <rect width={s.w} height={s.h} rx={6} fill="#ddd" />;
  }
}

function Defs() {
  return (
    <defs>
      <linearGradient id="plate" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e9edf1" /><stop offset="1" stopColor="#c8cfd7" /></linearGradient>
      <pattern id="plateNoise" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.6" fill="#7c8189" opacity="0.35" /><circle cx="4" cy="4" r="0.5" fill="#fff" opacity="0.6" /></pattern>
      <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f2f3f5" /><stop offset="0.5" stopColor="#aeb3ba" /><stop offset="1" stopColor="#6e737b" /></linearGradient>
      <linearGradient id="rail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#eceff2" /><stop offset="0.5" stopColor="#b3b9c1" /><stop offset="1" stopColor="#8d939b" /></linearGradient>
      <linearGradient id="face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6f7f9" /><stop offset="1" stopColor="#d5d9df" /></linearGradient>
      <linearGradient id="plastic" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f4f5f7" /><stop offset="0.5" stopColor="#e7e9ed" /><stop offset="1" stopColor="#cfd3d9" /></linearGradient>
      <linearGradient id="plasticDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4a4f57" /><stop offset="1" stopColor="#25282d" /></linearGradient>
      <linearGradient id="psu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a3f47" /><stop offset="1" stopColor="#1d2025" /></linearGradient>
      <linearGradient id="lever" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6c7078" /><stop offset="0.5" stopColor="#2a2d32" /><stop offset="1" stopColor="#15171a" /></linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f5fbff" stopOpacity="0.9" /><stop offset="0.5" stopColor="#bfd7e6" stopOpacity="0.55" /><stop offset="1" stopColor="#8fb0c4" stopOpacity="0.8" /></linearGradient>
      <radialGradient id="chrome" cx="0.35" cy="0.3" r="0.9"><stop offset="0" stopColor="#ffffff" /><stop offset="0.5" stopColor="#b9bec6" /><stop offset="1" stopColor="#70757d" /></radialGradient>
      <radialGradient id="lensShine" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#fff" stopOpacity="0.65" /><stop offset="0.5" stopColor="#fff" stopOpacity="0.08" /><stop offset="1" stopColor="#000" stopOpacity="0.25" /></radialGradient>
      <linearGradient id="alu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e9ecef" /><stop offset="0.5" stopColor="#bcc2c9" /><stop offset="1" stopColor="#868c94" /></linearGradient>
      <linearGradient id="can" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#0d3a82" /><stop offset="0.45" stopColor="#2f6fd0" /><stop offset="1" stopColor="#0a2c63" /></linearGradient>
      <linearGradient id="copper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f1a65a" /><stop offset="1" stopColor="#8a4a14" /></linearGradient>
      <linearGradient id="motorBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b78b8" /><stop offset="0.5" stopColor="#245b94" /><stop offset="1" stopColor="#14385d" /></linearGradient>
      <radialGradient id="knobGrad" cx="0.35" cy="0.3" r="0.85"><stop offset="0" stopColor="#5b5650" /><stop offset="0.6" stopColor="#2f2b27" /><stop offset="1" stopColor="#171513" /></radialGradient>
    </defs>
  );
}

export { fmtSI };
