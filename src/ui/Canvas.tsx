import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { defOf, fmtSI } from '../model/library';
import { termPos, tkey, type SimResult } from '../model/netlist';
import { wireStyler } from '../model/wires';
import type { Component } from '../model/types';
import { Symbol } from './symbols';
import { beep } from './sound';
import { beginProbeDrag } from './Floating';
import { Boom } from './Boom';
import { TERM_LABELS } from './diagrams';
import { isReturnWire } from '../model/unifilar';

const GRID = 20;
const snap = (v: number) => Math.round(v / GRID) * GRID;

export type CanvasMode = 'schematic' | 'multifilar' | 'unifilar';
interface Props { sim: SimResult; cables?: Record<string, import('../model/cables').CableInfo>; mode?: CanvasMode; /** Solo lectura: no se mueve, borra ni cablea; solo se accionan los componentes que `canToggle` permita (modo «Parte de avería»). */ locked?: boolean; canToggle?: (id: string) => boolean }

/** Ruta ortogonal entre dos puntos (horizontal y luego vertical) con esquina redondeada. */
function route(a: { x: number; y: number }, b: { x: number; y: number }) {
  if (a.x === b.x || a.y === b.y) return `M${a.x} ${a.y}L${b.x} ${b.y}`;
  const r = Math.min(14, Math.abs(b.x - a.x), Math.abs(b.y - a.y));
  const sx = Math.sign(b.x - a.x), sy = Math.sign(b.y - a.y);
  return `M${a.x} ${a.y}L${b.x - sx * r} ${a.y}Q${b.x} ${a.y} ${b.x} ${a.y + sy * r}L${b.x} ${b.y}`;
}

/** Ruta del retorno automático: por debajo del montaje, para que no se superponga a la línea de fase. */
function routeUnder(a: { x: number; y: number }, b: { x: number; y: number }) {
  const y = Math.max(a.y, b.y) + 70;
  return `M${a.x} ${a.y}V${y}H${b.x}V${b.y}`;
}

export function Canvas({ sim, cables, mode = 'schematic', locked = false, canToggle }: Props) {
  const uni = mode === 'unifilar', mf = mode === 'multifilar';
  const st = useStore();
  const { project, selection, wiring } = st;
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState({ x: 40, y: 20, k: 1 });
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const holdRef = useRef<{ id: string; key: string } | null>(null);
  // Pellizco con dos dedos para hacer zoom (tablet y móvil)
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; k: number } | null>(null);
  const onTouchDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.current.size === 2) { const [a, b] = [...touches.current.values()]; pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), k: view.k }; drag.current = null; }
  };
  const onTouchMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch' || !touches.current.has(e.pointerId)) return;
    touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.current.size === 2 && pinch.current) {
      e.stopPropagation();
      const [a, b] = [...touches.current.values()];
      const r = svgRef.current!.getBoundingClientRect();
      const mx = (a.x + b.x) / 2 - r.left, my = (a.y + b.y) / 2 - r.top;
      const k = Math.min(3, Math.max(0.2, pinch.current.k * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.d)));
      setView((v) => ({ k, x: mx - ((mx - v.x) / v.k) * k, y: my - ((my - v.y) / v.k) * k }));
    }
  };
  const onTouchUp = (e: React.PointerEvent) => { touches.current.delete(e.pointerId); if (touches.current.size < 2) pinch.current = null; };
  const drag = useRef<null | { kind: 'comp' | 'pan'; lastX: number; lastY: number; moved: boolean; snapped: boolean; accX: number; accY: number }>(null);

  const toWorld = (cx: number, cy: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: (cx - r.left - view.x) / view.k, y: (cy - r.top - view.y) / view.k };
  };

  // Ajustar el circuito a la ventana al cargar un ejemplo o al pulsar «Ajustar»
  const fitTick = st.fitTick;
  useEffect(() => {
    const el = svgRef.current;
    const comps = useStore.getState().project.components;
    if (!el || !comps.length) return;
    const r = el.getBoundingClientRect();
    const xs = comps.map((c) => c.x), ys = comps.map((c) => c.y);
    const minX = Math.min(...xs) - 90, maxX = Math.max(...xs) + 130, minY = Math.min(...ys) - 80, maxY = Math.max(...ys) + 100;
    const k = Math.min(1.7, Math.max(0.4, Math.min(r.width / (maxX - minX), r.height / (maxY - minY))));
    setView({ k, x: (r.width - (maxX - minX) * k) / 2 - minX * k, y: (r.height - (maxY - minY) * k) / 2 - minY * k });
  }, [fitTick]); // eslint-disable-line react-hooks/exhaustive-deps

  // Componentes ocultos (averías que el alumno debe descubrir midiendo): se simulan pero no se dibujan
  const hiddenIds = useMemo(() => new Set(project.components.filter((c) => c.hidden).map((c) => c.id)), [project.components]);
  const compMap = useMemo(() => new Map(project.components.map((c) => [c.id, c])), [project.components]);

  // Teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (locked) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const s = useStore.getState();
      if (e.key === 'Escape') { s.startWire(null); s.select([]); }
      else if (e.key === 'Delete' || e.key === 'Backspace') s.deleteSelection();
      else if (e.key.toLowerCase() === 'r' && !e.ctrlKey) s.rotateSelection();
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? s.redo() : s.undo(); }
      else if (e.key.toLowerCase() === 'f' && !e.ctrlKey) s.fit();
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
    try { (e.target as Element).setPointerCapture?.(e.pointerId); } catch { /* puntero ya liberado */ }
    drag.current = { kind: 'pan', lastX: e.clientX, lastY: e.clientY, moved: false, snapped: false, accX: 0, accY: 0 };
  };
  const onCompDown = (e: React.PointerEvent, c: Component) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    if (locked) {
      const li = defOf(c.type).interactive;
      if (li?.mode === 'toggle' && canToggle?.(c.id)) {
        const cur = c.params[li.key];
        st.setParam(c.id, li.key, typeof cur === 'boolean' ? !cur : Number(cur) < 0.5 ? 1 : 0);
        if (useStore.getState().sound) beep(500, 40);
      }
      return;
    }
    try { (e.currentTarget as Element).setPointerCapture?.(e.pointerId); } catch { /* puntero ya liberado */ }
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
    if (locked) return;
    const type = e.dataTransfer.getData('text/plain');
    if (!type) return;
    const p = toWorld(e.clientX, e.clientY);
    st.addComponent(type, p.x, p.y);
  };

  const onTermClick = (e: React.PointerEvent, ref: { comp: string; term: number }, _ti?: number) => {
    e.stopPropagation();
    if (st.scopeArm) { st.setScopeTip(st.scopeArm, ref); return; }
    if (st.meter.armed) { st.setMeter({ [st.meter.armed]: ref, armed: null } as never); return; }
    if (locked) return;
    if (!wiring) { st.startWire(ref); startPt.current = { x: e.clientX, y: e.clientY }; }
    else if (wiring.comp === ref.comp && wiring.term === ref.term) st.startWire(null);
    else st.addWire(wiring, ref);
  };
  // Cableado arrastrando: se suelta sobre otro terminal (con imán). Un clic simple deja el cable «pendiente».
  const startPt = useRef<{ x: number; y: number } | null>(null);
  const nearestTermW = (x: number, y: number, max: number) => {
    let best: { t: { comp: string; term: number }; d: number } | null = null;
    for (const cc of project.components) defOf(cc.type).terminals.forEach((_, i) => {
      const p = termPos(cc, i); const d = Math.hypot(p.x - x, p.y - y);
      if (d < max && (!best || d < best.d)) best = { t: { comp: cc.id, term: i }, d };
    });
    return (best as { t: { comp: string; term: number } } | null)?.t ?? null;
  };
  const wiringKey = wiring ? `${wiring.comp}:${wiring.term}` : '';
  useEffect(() => {
    if (!wiringKey) return;
    const up = (e: PointerEvent) => {
      if (!startPt.current) return;
      const moved = Math.hypot(e.clientX - startPt.current.x, e.clientY - startPt.current.y) > 8;
      startPt.current = null;
      if (!moved) return;
      const w = toWorld(e.clientX, e.clientY);
      const s = useStore.getState();
      const hit = nearestTermW(w.x, w.y, 28 / view.k);
      if (hit && s.wiring && !(hit.comp === s.wiring.comp && hit.term === s.wiring.term)) s.addWire(s.wiring, hit);
      else s.startWire(null);
    };
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }); // se reengancha en cada render para ver la vista actual
  const snapT = wiring ? nearestTermW(mouse.x, mouse.y, 28 / view.k) : null;

  // Mapa de calor: tensión relativa de cada cable
  const vmax = Math.max(1e-9, ...sim.solution.voltages.map(Math.abs));
  const heatColor = (v: number) => {
    const t = Math.max(-1, Math.min(1, v / vmax));
    return t >= 0 ? `hsl(${30 - 30 * t}, 80%, ${60 - 15 * t}%)` : `hsl(210, 70%, ${60 + 10 * t}%)`;
  };

  const roleStyle = useMemo(() => wireStyler(project, sim), [project, sim]);
  const roleColor = (n: number) => { const s = roleStyle(n); return s.role === 'pos' ? (sim.ac ? '#b87a4b' : '#e5484d') : s.role === 'neg' ? (sim.ac ? '#4a8fe0' : 'var(--wire)') : sim.ac ? 'var(--wire)' : '#e8892b'; };
  const maxI = Math.max(1e-9, ...Object.values(sim.wireCurrent).map(Math.abs));

  return (
    <svg
      ref={svgRef}
      className="canvas"
      onWheel={onWheel}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerDownCapture={onTouchDown}
      onPointerMoveCapture={onTouchMove}
      onPointerUpCapture={onTouchUp}
      onPointerCancel={onTouchUp}
      onPointerDown={onBgDown}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      data-testid="canvas"
    >
      <defs>
        <pattern id="grid" width={GRID * view.k} height={GRID * view.k} patternUnits="userSpaceOnUse" x={view.x} y={view.y}>
          <circle cx={1} cy={1} r={1} fill="var(--grid)" />
        </pattern>
        <pattern id="gridmajor" width={GRID * 5 * view.k} height={GRID * 5 * view.k} patternUnits="userSpaceOnUse" x={view.x} y={view.y}>
          <path d={`M0 0H${GRID * 5 * view.k}M0 0V${GRID * 5 * view.k}`} stroke="var(--grid)" strokeWidth={0.8} opacity={0.35} fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#gridmajor)" />
      <rect width="100%" height="100%" fill="url(#grid)" />
      <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
        {/* Cables */}
        {project.wires.filter((w) => !hiddenIds.has(w.a.comp) && !hiddenIds.has(w.b.comp)).map((w) => {
          const ca = compMap.get(w.a.comp), cb = compMap.get(w.b.comp);
          if (!ca || !cb) return null;
          if (uni && isReturnWire(project, w)) return null; // en unifilar el retorno va implícito
          const a = termPos(ca, w.a.term), b = termPos(cb, w.b.term);
          const d = w.auto ? routeUnder(a, b) : route(a, b);
          const i = sim.wireCurrent[w.id] ?? 0;
          const sel = selection.includes(w.id);
          const v = sim.solution.voltages[sim.nodeOf[tkey(w.a)]] ?? 0;
          const active = Math.abs(i) > maxI * 1e-6 && Math.abs(i) > 1e-6;
          const dur = 1.6 / (0.25 + 1.75 * Math.sqrt(Math.abs(i) / maxI));
          return (
            <g key={w.id}>
              <path d={d} className="wire-hit" onPointerDown={(e) => { e.stopPropagation(); st.select([w.id], e.shiftKey); }} />
              {mf && <path d={d} className="wire" style={{ stroke: roleColor(sim.nodeOf[tkey(w.a)] ?? 0), strokeWidth: 8, opacity: 0.3 }} />}
              <path d={d} className={`wire ${cables?.[w.id]?.overload ? 'hot' : ''}`} style={{ stroke: st.heat ? heatColor(v) : sel ? 'var(--accent)' : mf ? 'var(--ink)' : uni ? 'var(--ink)' : roleColor(sim.nodeOf[tkey(w.a)] ?? 0), strokeWidth: sel ? 4.5 : st.heat ? 4.5 : uni ? 5.2 : mf ? 2.4 : 3.4 }} />
              {uni && (() => {
                const horiz = Math.abs(a.y - b.y) < 1 || Math.abs(a.x - b.x) >= 1;
                const mm = Math.abs(a.x - b.x) < 1 || Math.abs(a.y - b.y) < 1 ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : { x: (a.x + b.x) / 2, y: a.y };
                const n = sim.ac ? 3 : 2;
                return (
                  <g pointerEvents="none" stroke="var(--ink)" strokeWidth={2.2} strokeLinecap="round">
                    {Array.from({ length: n }, (_, k) => { const o = (k - (n - 1) / 2) * 8; return horiz ? <path key={k} d={`M${mm.x + o - 4} ${mm.y + 8}L${mm.x + o + 4} ${mm.y - 8}`} /> : <path key={k} d={`M${mm.x - 8} ${mm.y + o - 4}L${mm.x + 8} ${mm.y + o + 4}`} />; })}
                  </g>
                );
              })()}
              {st.showCables && cables?.[w.id] && (() => {
                const m = w.auto ? { x: (a.x + b.x) / 2, y: Math.max(a.y, b.y) + 70 } : Math.abs(a.x - b.x) < 1 || Math.abs(a.y - b.y) < 1 ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : { x: (a.x + b.x) / 2, y: a.y };
                const ci = cables[w.id];
                const bad = ci.overload || (ci.pct != null && ci.pct > ci.limit);
                const sec = `${String(ci.section).replace('.', ',')} mm²`;
                const tag = mf ? roleStyle(sim.nodeOf[tkey(w.a)] ?? 0).tag : '';
                const label = mf ? `${tag} · ${sec}` : sec;
                const wpx = label.length * 5.4 + 14;
                return (
                  <g pointerEvents="none" transform={`translate(${m.x} ${m.y + (uni ? 20 : mf ? -16 : 0)})`}>
                    <rect x={-wpx / 2} y={-7} width={wpx} height={13} rx={6} fill="var(--panel)" stroke={bad ? 'var(--err)' : mf ? roleColor(sim.nodeOf[tkey(w.a)] ?? 0) : 'var(--line)'} strokeWidth={mf ? 1.4 : 1} />
                    <text y={3} fontSize={8.5} textAnchor="middle" fill={bad ? 'var(--err)' : 'var(--muted)'} fontWeight={700}>{label}</text>
                  </g>
                );
              })()}
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
        {wiring && compMap.get(wiring.comp) && (() => {
          const a = termPos(compMap.get(wiring.comp)!, wiring.term);
          const tgt = snapT && compMap.get(snapT.comp) ? termPos(compMap.get(snapT.comp)!, snapT.term) : null;
          return (
            <g pointerEvents="none">
              <path d={route(a, tgt ?? { x: snap(mouse.x), y: snap(mouse.y) })} className="wire ghost" style={tgt ? { stroke: '#4caf50', strokeDasharray: 'none', strokeWidth: 3.5 } : undefined} />
              {tgt && <circle cx={tgt.x} cy={tgt.y} r={13} fill="#4caf5033" stroke="#4caf50" strokeWidth={3} className="pulse" />}
            </g>
          );
        })()}
        {/* Componentes */}
        {project.components.filter((c) => !c.hidden).map((c) => {
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
                    (() => {
                      const txt = `${fmtSI(v, 'V')} · ${fmtSI(Math.abs(i ?? 0), 'A')}`;
                      const wpx = txt.length * 6.3 + 14, mx = c.rot % 180 === 0 ? -wpx / 2 : 34, my = c.rot % 180 === 0 ? 40 : 7;
                      return (
                        <g className="pill">
                          <rect x={mx} y={my} width={wpx} height={17} rx={8.5} />
                          <text x={mx + wpx / 2} y={my + 12} textAnchor="middle">{txt}</text>
                        </g>
                      );
                    })()
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
                      onPointerDown={(e) => onTermClick(e, { comp: c.id, term: ti }, ti)} data-term={`${c.id}:${ti}`} />
                    <circle cx={p.x} cy={p.y} r={active ? 6 : 4} className={`term ${active ? 'active' : ''}`} pointerEvents="none" />
                    {mf && c.type !== 'junction' && c.type !== 'ground' && (() => {
                      const vx = p.x - c.x, vy = p.y - c.y, nn = Math.hypot(vx, vy) || 1;
                      return <text x={p.x + (vx / nn) * 13 - (vy / nn) * 8} y={p.y + (vy / nn) * 13 + (vx / nn) * 8 + 3} fontSize={9} fontWeight={700} textAnchor="middle" fill="var(--muted)" pointerEvents="none">{(TERM_LABELS[c.type] ?? def.terminals.map((t) => t.name))[ti] ?? ''}</text>;
                    })()}
                  </g>
                );
              })}
            </g>
          );
        })}
        {st.booms.map((b) => { const cc = compMap.get(b.comp); return cc ? <g key={b.id} transform={`translate(${cc.x} ${cc.y})`}><Boom big={['battery', 'acsource'].includes(cc.type)} /></g> : null; })}
        {(['c1', 'c2'] as const).map((k) => {
          const t = st.scopeTips[k];
          const cc = t && compMap.get(t.comp);
          if (!t || !cc) return null;
          const p = termPos(cc, t.term);
          const col = k === 'c1' ? '#f5d300' : '#29b6f6';
          return (
            <g key={k} style={{ cursor: 'grab' }} onPointerDown={(e) => beginProbeDrag(k, e)}>
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
            <g key={k} style={{ cursor: 'grab' }} onPointerDown={(e) => beginProbeDrag(k, e)}>
              <circle cx={p.x + dx} cy={p.y - 32} r={14} fill="transparent" />
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

