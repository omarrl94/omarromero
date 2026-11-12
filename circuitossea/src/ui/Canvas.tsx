import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { defOf, fmtSI } from '../model/library';
import { termPos, tkey, type SimResult } from '../model/netlist';
import type { Component } from '../model/types';
import { Symbol } from './symbols';
import { beep } from './sound';

const GRID = 20;
const snap = (v: number) => Math.round(v / GRID) * GRID;

interface Props { sim: SimResult }

/** Ruta ortogonal entre dos puntos: horizontal y luego vertical. */
function route(a: { x: number; y: number }, b: { x: number; y: number }) {
  if (a.x === b.x || a.y === b.y) return `M${a.x} ${a.y}L${b.x} ${b.y}`;
  return `M${a.x} ${a.y}L${b.x} ${a.y}L${b.x} ${b.y}`;
}

export function Canvas({ sim }: Props) {
  const st = useStore();
  const { project, selection, wiring } = st;
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState({ x: 40, y: 20, k: 1 });
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const holdRef = useRef<{ id: string; key: string } | null>(null);
  const drag = useRef<null | { kind: 'comp' | 'pan'; lastX: number; lastY: number; moved: boolean; snapped: boolean; accX: number; accY: number }>(null);

  const toWorld = (cx: number, cy: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: (cx - r.left - view.x) / view.k, y: (cy - r.top - view.y) / view.k };
  };

  const compMap = useMemo(() => new Map(project.components.map((c) => [c.id, c])), [project.components]);

  // Teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const s = useStore.getState();
      if (e.key === 'Escape') { s.startWire(null); s.select([]); }
      else if (e.key === 'Delete' || e.key === 'Backspace') s.deleteSelection();
      else if (e.key.toLowerCase() === 'r' && !e.ctrlKey) s.rotateSelection();
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? s.redo() : s.undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); s.redo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); s.duplicateSelection(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const k = Math.min(3, Math.max(0.3, view.k * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
    setView({ k, x: px - ((px - view.x) / view.k) * k, y: py - ((py - view.y) / view.k) * k });
  };

  const onBgDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { kind: 'pan', lastX: e.clientX, lastY: e.clientY, moved: false, snapped: false, accX: 0, accY: 0 };
  };
  const onCompDown = (e: React.PointerEvent, c: Component) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const additive = e.shiftKey;
    if (!selection.includes(c.id)) st.select([c.id], additive);
    const inter = defOf(c.type).interactive;
    if (inter?.mode === 'hold') { st.setParam(c.id, inter.key, true); holdRef.current = { id: c.id, key: inter.key }; if (st.sound) beep(900, 30); }
    drag.current = { kind: 'comp', lastX: e.clientX, lastY: e.clientY, moved: false, snapped: false, accX: 0, accY: 0 };
  };
  const onMove = (e: React.PointerEvent) => {
    setMouse(toWorld(e.clientX, e.clientY));
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.lastX, dy = e.clientY - d.lastY;
    d.lastX = e.clientX; d.lastY = e.clientY;
    if (d.kind === 'pan') { setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy })); d.moved = true; return; }
    d.accX += dx / view.k; d.accY += dy / view.k;
    const sx = snap(d.accX), sy = snap(d.accY);
    if (sx || sy) {
      if (!d.snapped) { st.snapshot(); d.snapped = true; }
      st.moveComponents(useStore.getState().selection.filter((id) => compMap.has(id)), sx, sy);
      d.accX -= sx; d.accY -= sy; d.moved = true;
    }
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (holdRef.current) { useStore.getState().setParam(holdRef.current.id, holdRef.current.key, false); holdRef.current = null; }
    else if (d && d.kind === 'comp' && !d.moved) {
      // Clic simple sobre un interruptor/conmutador: lo acciona
      const sel = useStore.getState().selection;
      const c = compMap.get(sel[0]);
      const inter = c && defOf(c.type).interactive;
      if (c && inter?.mode === 'toggle' && sel.length === 1) {
        const cur = c.params[inter.key];
        st.snapshot();
        st.setParam(c.id, inter.key, typeof cur === 'boolean' ? !cur : Number(cur) < 0.5 ? 1 : 0);
        if (useStore.getState().sound) beep(500, 40);
      }
    }
    if (d && d.kind === 'pan' && !d.moved) { st.select([]); st.startWire(null); }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    if (!type) return;
    const p = toWorld(e.clientX, e.clientY);
    st.addComponent(type, p.x, p.y);
  };

  const onTermClick = (e: React.PointerEvent, ref: { comp: string; term: number }) => {
    e.stopPropagation();
    if (st.scopeArm) { st.setScopeTip(st.scopeArm, ref); return; }
    if (st.meter.armed) { st.setMeter({ [st.meter.armed]: ref, armed: null } as never); return; }
    if (!wiring) st.startWire(ref);
    else if (wiring.comp === ref.comp && wiring.term === ref.term) st.startWire(null);
    else st.addWire(wiring, ref);
  };
  const onTermUp = (e: React.PointerEvent, ref: { comp: string; term: number }) => {
    // Soporta arrastrar de un terminal a otro
    if (wiring && !(wiring.comp === ref.comp && wiring.term === ref.term)) { e.stopPropagation(); st.addWire(wiring, ref); }
  };

  // Mapa de calor: tensión relativa de cada cable
  const vmax = Math.max(1e-9, ...sim.solution.voltages.map(Math.abs));
  const heatColor = (v: number) => {
    const t = Math.max(-1, Math.min(1, v / vmax));
    return t >= 0 ? `hsl(${30 - 30 * t}, 80%, ${60 - 15 * t}%)` : `hsl(210, 70%, ${60 + 10 * t}%)`;
  };

  const maxI = Math.max(1e-9, ...Object.values(sim.wireCurrent).map(Math.abs));

  return (
    <svg
      ref={svgRef}
      className="canvas"
      onWheel={onWheel}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerDown={onBgDown}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      data-testid="canvas"
    >
      <defs>
        <pattern id="grid" width={GRID * view.k} height={GRID * view.k} patternUnits="userSpaceOnUse" x={view.x} y={view.y}>
          <circle cx={1} cy={1} r={1} fill="var(--grid)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
        {/* Cables */}
        {project.wires.map((w) => {
          const ca = compMap.get(w.a.comp), cb = compMap.get(w.b.comp);
          if (!ca || !cb) return null;
          const a = termPos(ca, w.a.term), b = termPos(cb, w.b.term);
          const d = route(a, b);
          const i = sim.wireCurrent[w.id] ?? 0;
          const sel = selection.includes(w.id);
          const v = sim.solution.voltages[sim.nodeOf[tkey(w.a)]] ?? 0;
          const active = Math.abs(i) > maxI * 1e-6 && Math.abs(i) > 1e-6;
          const dur = 1.6 / (0.25 + 1.75 * Math.sqrt(Math.abs(i) / maxI));
          return (
            <g key={w.id}>
              <path d={d} className="wire-hit" onPointerDown={(e) => { e.stopPropagation(); st.select([w.id], e.shiftKey); }} />
              <path d={d} className="wire" style={{ stroke: st.heat ? heatColor(v) : sel ? 'var(--accent)' : 'var(--wire)', strokeWidth: sel ? 4 : st.heat ? 4 : 3 }} />
              {st.animate && active && (
                <path
                  d={d}
                  className="flow"
                  style={{
                    animationDuration: `${dur}s`,
                    animationDirection: i >= 0 ? 'normal' : 'reverse',
                    strokeWidth: 2 + 4 * Math.min(1, Math.abs(i) / maxI),
                  }}
                />
              )}
            </g>
          );
        })}
        {/* Cable en curso */}
        {wiring && compMap.get(wiring.comp) && (
          <path d={route(termPos(compMap.get(wiring.comp)!, wiring.term), { x: snap(mouse.x), y: snap(mouse.y) })} className="wire ghost" />
        )}
        {/* Componentes */}
        {project.components.map((c) => {
          const def = defOf(c.type);
          const sel = selection.includes(c.id);
          const v = sim.componentVoltage[c.id];
          const i = sim.componentCurrent[`${c.id}:0`];
          const bad = sim.messages.some((m) => m.level === 'error' && m.ids.includes(c.id));
          const warn = sim.messages.some((m) => m.level === 'warn' && m.ids.includes(c.id));
          return (
            <g key={c.id}>
              <g transform={`translate(${c.x} ${c.y}) rotate(${c.rot})`} onPointerDown={(e) => onCompDown(e, c)} style={{ cursor: 'move' }}>
                <rect x={-def.w / 2} y={-def.h / 2} width={def.w} height={def.h} rx={6}
                  className={`hitbox ${sel ? 'sel' : ''} ${bad ? 'bad' : warn ? 'warn' : ''}`} />
                <Symbol c={c} live={sim.live[c.id]} />
              </g>
              {/* Texto sin girar */}
              {c.type !== 'junction' && (
                <g className="label" transform={`translate(${c.x} ${c.y})`} pointerEvents="none">
                  <text y={c.rot % 180 === 0 ? 34 : 4} x={c.rot % 180 === 0 ? 0 : 34} textAnchor={c.rot % 180 === 0 ? 'middle' : 'start'}>
                    {c.label || (c.id.length <= 4 ? c.id : '')} {def.tag?.(c.params) ?? ''}
                  </text>
                  {st.showLabels && v !== undefined && c.type !== 'ground' && (
                    <text className="measure" y={c.rot % 180 === 0 ? 50 : 20} x={c.rot % 180 === 0 ? 0 : 34} textAnchor={c.rot % 180 === 0 ? 'middle' : 'start'}>
                      {fmtSI(v, 'V')} · {fmtSI(Math.abs(i ?? 0), 'A')}
                    </text>
                  )}
                </g>
              )}
              {/* Terminales */}
              {def.terminals.map((_, ti) => {
                const p = termPos(c, ti);
                const active = wiring && wiring.comp === c.id && wiring.term === ti;
                return (
                  <g key={ti}>
                    <circle cx={p.x} cy={p.y} r={11} fill="transparent" className="term-hit"
                      onPointerDown={(e) => onTermClick(e, { comp: c.id, term: ti })}
                      onPointerUp={(e) => onTermUp(e, { comp: c.id, term: ti })} data-term={`${c.id}:${ti}`} />
                    <circle cx={p.x} cy={p.y} r={active ? 6 : 4} className={`term ${active ? 'active' : ''}`} pointerEvents="none" />
                  </g>
                );
              })}
            </g>
          );
        })}
        {(['c1', 'c2'] as const).map((k) => {
          const t = st.scopeTips[k];
          const cc = t && compMap.get(t.comp);
          if (!t || !cc) return null;
          const p = termPos(cc, t.term);
          const col = k === 'c1' ? '#f5d300' : '#29b6f6';
          return (
            <g key={k} pointerEvents="none">
              <path d={`M${p.x} ${p.y}L${p.x + 18} ${p.y - 34}`} stroke={col} strokeWidth={3} strokeLinecap="round" />
              <rect x={p.x + 10} y={p.y - 50} width={16} height={16} rx={3} fill={col} stroke="#222" />
              <text x={p.x + 18} y={p.y - 38} fontSize={10} fontWeight={800} textAnchor="middle" fill="#111">{k === 'c1' ? '1' : '2'}</text>
            </g>
          );
        })}
        {(['red', 'black'] as const).map((k) => {
          const t = st.meter[k];
          const cc = t && compMap.get(t.comp);
          if (!t || !cc) return null;
          const p = termPos(cc, t.term);
          const dx = k === 'red' ? -16 : 16;
          return (
            <g key={k} pointerEvents="none">
              <path d={`M${p.x} ${p.y}L${p.x + dx} ${p.y - 30}`} stroke={k === 'red' ? '#e53935' : '#111'} strokeWidth={4} strokeLinecap="round" />
              <circle cx={p.x + dx} cy={p.y - 32} r={7} fill={k === 'red' ? '#e53935' : '#111'} stroke="#fff" strokeWidth={1.5} />
              <circle cx={p.x} cy={p.y} r={7} fill="none" stroke={k === 'red' ? '#e53935' : '#555'} strokeWidth={2} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

