/**
 * Diagramas generados automáticamente a partir del modelo único del circuito:
 *  - multifilar (desarrollado) con designaciones de bornes y marcas de conductor,
 *  - unifilar de la instalación (acometida → protecciones → receptores) con cajetín por línea,
 *  - unifilar y aspecto real del cuadro eléctrico (vista «Cuadro»).
 * Cada función devuelve {w, h, node} para poder mostrarse con zoom o incrustarse en un plano.
 */
import type { ReactNode } from 'react';
import { defOf, fmt, fmtSI } from '../model/library';
import { termPos, tkey, type SimResult } from '../model/netlist';
import type { Component, Project } from '../model/types';
import { wireStyler } from '../model/wires';
import { wireData, type CableInfo } from '../model/cables';
import type { PanelConfig, PanelResult } from '../model/panel';
import { Symbol } from './symbols';

export interface Diagram { w: number; h: number; node: ReactNode }

export const TERM_LABELS: Record<string, string[]> = {
  breaker: ['1', '2'], fuse: ['1', '2'], switch: ['1', '2'], pushNO: ['3', '4'], pushNC: ['1', '2'], spdt: ['1', '2', '4'],
  lamp: ['X1', 'X2'], buzzer: ['X1', 'X2'], heater: ['1', '2'], motor: ['U1', 'V1'], battery: ['+', '−'], acsource: ['L', 'N'],
};

function route(a: { x: number; y: number }, b: { x: number; y: number }) {
  if (a.x === b.x || a.y === b.y) return `M${a.x} ${a.y}L${b.x} ${b.y}`;
  return `M${a.x} ${a.y}L${b.x} ${a.y}L${b.x} ${b.y}`;
}
const mid = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  a.x === b.x || a.y === b.y ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : { x: (a.x + b.x) / 2, y: a.y };

export function paperVars() {
  return { '--ink': '#14181d', '--panel': '#ffffff', '--accent': '#b3541e', '--fill-a': '#f6e3d6', '--fill-b': '#dcebe3', '--lamp': '#f0c020', '--terracota': '#E39F7D', '--mostaza': '#EFCD2F', '--err': '#b3261e', '--bg': '#ffffff', '--line': '#c8c8c8' } as Record<string, string>;
}

/* ─────────────────────────── MULTIFILAR ─────────────────────────── */
export function multifilarDiagram(project: Project, sim: SimResult, cables: Record<string, CableInfo>, showCables: boolean): Diagram {
  const comps = project.components;
  if (!comps.length) return { w: 600, h: 300, node: <text x={300} y={150} textAnchor="middle" fill="var(--ink)">Circuito vacío</text> };
  const pts = comps.flatMap((c) => defOf(c.type).terminals.map((_, i) => termPos(c, i)));
  const minX = Math.min(...pts.map((p) => p.x)) - 110, maxX = Math.max(...pts.map((p) => p.x)) + 140;
  const minY = Math.min(...pts.map((p) => p.y)) - 100, maxY = Math.max(...pts.map((p) => p.y)) + 120;
  const w = Math.max(640, maxX - minX), h = Math.max(340, maxY - minY);
  const ox = -minX + (w - (maxX - minX)) / 2, oy = -minY + (h - (maxY - minY)) / 2;
  const byId = new Map(comps.map((c) => [c.id, c]));
  const style = wireStyler(project, sim);
  return {
    w, h,
    node: (
      <g>
        <g transform={`translate(${ox} ${oy})`}>
          {project.wires.map((wr) => {
            const ca = byId.get(wr.a.comp), cb = byId.get(wr.b.comp);
            if (!ca || !cb) return null;
            const a = termPos(ca, wr.a.term), b = termPos(cb, wr.b.term);
            const st = style(sim.nodeOf[tkey(wr.a)] ?? 0);
            const m = mid(a, b);
            const d = wireData(wr);
            return (
              <g key={wr.id}>
                <path d={route(a, b)} fill="none" stroke="var(--ink)" strokeWidth={1.8} strokeLinejoin="round" />
                <path d={route(a, b)} fill="none" stroke={st.color} strokeWidth={4} strokeOpacity={0.28} strokeLinejoin="round" />
                <g transform={`translate(${m.x - 20} ${m.y - 17})`}>
                  <rect x={-3} y={-7} width={showCables ? 68 : 24} height={14} rx={4} fill="#fff" stroke={st.color} strokeWidth={1.4} />
                  <circle cx={5} cy={0} r={3.2} fill={st.color} />
                  <text x={11} y={3.6} fontSize={8.5} fontWeight={700} fill="var(--ink)">{st.tag}</text>
                  {showCables && <text x={27} y={3.6} fontSize={7.5} fill="#444">{fmt(d.section)}mm²</text>}
                </g>
              </g>
            );
          })}
          {comps.map((c) => {
            const def = defOf(c.type);
            const labels = TERM_LABELS[c.type] ?? def.terminals.map((t) => t.name);
            return (
              <g key={c.id}>
                <g transform={`translate(${c.x} ${c.y}) rotate(${c.rot})`}><Symbol c={c} live={sim.live[c.id]} /></g>
                {c.type !== 'junction' && (
                  <g>
                    <text x={c.x} y={c.y + (c.rot % 180 === 0 ? 36 : 4)} dx={c.rot % 180 === 0 ? 0 : 36} textAnchor={c.rot % 180 === 0 ? 'middle' : 'start'} fontSize={12} fontWeight={800} fill="var(--ink)">{c.label || (c.id.length <= 4 ? c.id : '')}</text>
                    <text x={c.x} y={c.y + (c.rot % 180 === 0 ? 50 : 18)} dx={c.rot % 180 === 0 ? 0 : 36} textAnchor={c.rot % 180 === 0 ? 'middle' : 'start'} fontSize={9.5} fill="#444">{def.tag?.(c.params) ?? ''}</text>
                  </g>
                )}
                {def.terminals.map((_, i) => {
                  const p = termPos(c, i);
                  const vx = p.x - c.x, vy = p.y - c.y;
                  const n = Math.hypot(vx, vy) || 1;
                  const tx = p.x + (vx / n) * 11 - (vy / n) * 7, ty = p.y + (vy / n) * 11 + (vx / n) * 7;
                  return (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r={2.6} fill="#fff" stroke="var(--ink)" strokeWidth={1.2} />
                      {c.type !== 'junction' && c.type !== 'ground' && <text x={tx} y={ty + 3} fontSize={8.5} textAnchor="middle" fontWeight={600} fill="#555">{labels[i] ?? ''}</text>}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </g>
      </g>
    ),
  };
}

/* ─────────────────────────── UNIFILAR DEL CIRCUITO ─────────────────────────── */
const PROT = new Set(['breaker', 'fuse', 'switch', 'pushNO', 'pushNC', 'spdt']);
const SKIP = new Set(['ground', 'junction', 'battery', 'acsource', 'isource']);

interface Feeder { key: string; prots: Component[]; loads: Component[] }

/** Agrupa los receptores por la cadena de protecciones que los alimenta desde la fuente. */
export function feeders(project: Project, sim: SimResult): { groups: Feeder[]; source: Component | null } {
  const source = project.components.find((c) => ['acsource', 'battery'].includes(c.type)) ?? null;
  if (!source) return { groups: [], source };
  const start = sim.nodeOf[`${source.id}:0`];
  const edges = new Map<number, { to: number; comp: Component }[]>();
  const add = (a: number, b: number, comp: Component) => { if (!edges.has(a)) edges.set(a, []); edges.get(a)!.push({ to: b, comp }); };
  for (const c of project.components) {
    if (!PROT.has(c.type)) continue;
    const t = defOf(c.type).terminals.length;
    const n = (i: number) => sim.nodeOf[`${c.id}:${i}`];
    if (t === 3) { add(n(0), n(1), c); add(n(1), n(0), c); add(n(0), n(2), c); add(n(2), n(0), c); }
    else { add(n(0), n(1), c); add(n(1), n(0), c); }
  }
  const path = new Map<number, Component[]>([[start, []]]);
  const q = [start];
  while (q.length) {
    const u = q.shift()!;
    for (const e of edges.get(u) ?? []) if (!path.has(e.to)) { path.set(e.to, [...path.get(u)!, e.comp]); q.push(e.to); }
  }
  const map = new Map<string, Feeder>();
  const orphan: Component[] = [];
  for (const c of project.components) {
    if (PROT.has(c.type) || SKIP.has(c.type)) continue;
    const nodes = defOf(c.type).terminals.map((_, i) => sim.nodeOf[`${c.id}:${i}`]);
    const hit = nodes.find((n) => path.has(n) && n !== 0);
    if (hit === undefined) { orphan.push(c); continue; }
    const prots = path.get(hit)!;
    const key = prots.map((p) => p.id).join('>');
    if (!map.has(key)) map.set(key, { key, prots, loads: [] });
    map.get(key)!.loads.push(c);
  }
  const groups = [...map.values()];
  if (orphan.length) groups.push({ key: '#', prots: [], loads: orphan });
  return { groups, source };
}

const loadPower = (sim: SimResult, c: Component) => sim.live[c.id]?.p ?? 0;

export function unifilarDiagram(project: Project, sim: SimResult, cables: Record<string, CableInfo>): Diagram {
  const { groups, source } = feeders(project, sim);
  if (!source) return { w: 700, h: 260, node: <text x={350} y={130} textAnchor="middle" fill="var(--ink)">El unifilar necesita una fuente (pila o red de CA).</text> };
  const U = Number(source.params.v);
  const ac = source.type === 'acsource';
  const maxProt = Math.max(1, ...groups.map((g) => g.prots.length));
  const xBar = 190, x0 = 300, step = 120;
  const xHash = x0 + maxProt * step - 30, xLoad = xHash + 150;
  const rowH = (g: Feeder) => Math.max(150, g.loads.length * 90 + 40);
  let y = 120;
  const rows = groups.map((g, i) => { const r = { g, y: y + rowH(g) / 2, h: rowH(g), i }; y += rowH(g); return r; });
  const w = xLoad + 420, h = Math.max(420, y + 80);
  const wireOfLoad = (c: Component) => project.wires.find((wr) => (wr.a.comp === c.id) || (wr.b.comp === c.id));
  const nConductors = ac ? 3 : 2;
  const ticks = (x: number, yy: number) => Array.from({ length: nConductors }, (_, k) => <path key={k} d={`M${x + k * 7 - 3} ${yy + 8}L${x + k * 7 + 3} ${yy - 8}`} stroke="var(--ink)" strokeWidth={1.8} />);
  return {
    w, h,
    node: (
      <g fill="none" stroke="var(--ink)" strokeWidth={2} strokeLinecap="round">
        {/* fuente */}
        <g transform={`translate(110 ${h / 2})`}>
          <circle r={34} fill="var(--fill-b)" />
          <path d="M-16 0q8 -18 16 0t16 0" stroke="var(--accent)" strokeWidth={3} />
          {!ac && <text y={6} textAnchor="middle" fontSize={22} fontWeight={800} stroke="none" fill="var(--ink)">⎓</text>}
          <text y={56} textAnchor="middle" fontSize={12} fontWeight={800} stroke="none" fill="var(--ink)">{ac ? 'ACOMETIDA' : 'ALIMENTACIÓN'}</text>
          <text y={72} textAnchor="middle" fontSize={11} stroke="none" fill="#444">{fmtSI(U, 'V')}{ac ? ` ${fmt(Number(source.params.f))} Hz` : ' CC'}</text>
          <path d="M34 0H80" />
        </g>
        <path d={`M${xBar} ${rows[0]?.y ?? 200}V${rows[rows.length - 1]?.y ?? 200}`} strokeWidth={5} />
        <path d={`M190 ${h / 2}H${xBar}`} />
        {rows.map(({ g, y: ry, i }) => {
          const wl = wireOfLoad(g.loads[0]);
          const ci = wl ? cables[wl.id] : undefined;
          const wd = wl ? wireData(wl) : { section: 1.5, length: 2 };
          const P = g.loads.reduce((a, l) => a + loadPower(sim, l), 0);
          const pName = g.prots.length ? g.prots.map((p) => `${defOf(p.type).name}${defOf(p.type).tag ? ' ' + defOf(p.type).tag!(p.params) : ''}`).join(' + ') : 'Sin protección';
          return (
            <g key={g.key}>
              <path d={`M${xBar} ${ry}H${xHash + 50}`} />
              {g.prots.map((p, k) => (
                <g key={p.id} transform={`translate(${x0 + k * step} ${ry})`}>
                  <rect x={-40} y={-20} width={80} height={40} fill="var(--panel)" stroke="none" />
                  <Symbol c={{ ...p, rot: 0 }} live={sim.live[p.id]} />
                  <text y={-30} textAnchor="middle" fontSize={11} fontWeight={800} stroke="none" fill="var(--ink)">{p.label || (p.id.length <= 4 ? p.id : '')}</text>
                  <text y={42} textAnchor="middle" fontSize={9.5} stroke="none" fill="#444">{defOf(p.type).tag?.(p.params) ?? defOf(p.type).name}</text>
                </g>
              ))}
              {ticks(xHash, ry)}
              <text x={xHash + 6} y={ry + 26} textAnchor="middle" fontSize={9} stroke="none" fill="#444">{fmt(wd.section)} mm² Cu</text>
              <path d={`M${xHash + 50} ${ry}H${xLoad - 60}`} />
              {g.loads.length > 1 && <path d={`M${xLoad - 60} ${ry - (g.loads.length - 1) * 45}V${ry + (g.loads.length - 1) * 45}`} />}
              {g.loads.map((l, k) => {
                const ly = ry + (k - (g.loads.length - 1) / 2) * 90;
                return (
                  <g key={l.id}>
                    <path d={`M${xLoad - 60} ${ly}H${xLoad - 40}`} />
                    <g transform={`translate(${xLoad} ${ly})`}><Symbol c={{ ...l, rot: 0 }} live={sim.live[l.id]} /></g>
                    <text x={xLoad} y={ly + 36} textAnchor="middle" fontSize={11} fontWeight={800} stroke="none" fill="var(--ink)">{l.label || (l.id.length <= 4 ? l.id : defOf(l.type).name)}</text>
                    <text x={xLoad} y={ly + 49} textAnchor="middle" fontSize={9.5} stroke="none" fill="#444">{defOf(l.type).tag?.(l.params) ?? ''}</text>
                  </g>
                );
              })}
              {/* cajetín de la línea */}
              <g transform={`translate(${xLoad + 70} ${ry - 56})`}>
                <rect width={300} height={112} rx={4} fill="var(--panel)" stroke="var(--ink)" strokeWidth={1.4} />
                <rect width={300} height={22} rx={4} fill="var(--ink)" stroke="none" />
                <text x={10} y={15} fontSize={11.5} fontWeight={800} fill="#fff" stroke="none">Línea {i + 1} · {g.prots.length ? g.prots[g.prots.length - 1].label || g.prots[g.prots.length - 1].id : '—'}</text>
                {[['Protección', pName], ['Conductor', `${fmt(wd.section)} mm² · ${fmt(wd.length)} m`], ['Tensión', `${fmtSI(U, 'V')}${ac ? ' ~' : ' ⎓'}`], ['Potencia', fmtSI(P, 'W')], ['Intensidad', ci ? fmtSI(ci.I, 'A') : '—'], ['Caída', ci?.pct != null ? `${fmt(ci.pct)} % (máx. ${ci.limit} %)` : '—']].map(([k, v], j) => (
                  <g key={k}><text x={10} y={38 + j * 14} fontSize={9.5} fontWeight={700} fill="#444" stroke="none">{k}</text><text x={92} y={38 + j * 14} fontSize={9.5} fill="var(--ink)" stroke="none">{v.length > 40 ? v.slice(0, 38) + '…' : v}</text></g>
                ))}
              </g>
            </g>
          );
        })}
        <text x={40} y={50} fontSize={18} fontWeight={800} letterSpacing={3} stroke="none" fill="var(--ink)">ESQUEMA UNIFILAR</text>
        <text x={40} y={70} fontSize={11} stroke="none" fill="#555">{project.name} · conductores por línea: {nConductors}{ac ? ' (fase + neutro + protección)' : ' (+ y −)'}</text>
      </g>
    ),
  };
}

/* ─────────────────────────── CUADRO: UNIFILAR ─────────────────────────── */
export function panelUnifilar(cfg: PanelConfig, res: PanelResult): Diagram {
  const on = res.circuits.filter((c) => c.enabled);
  const w = 1180, h = 330 + on.length * 74 + 80;
  const y0 = 140;
  const items: { name: string; sub: string }[] = [
    { name: 'IGA', sub: `${res.iga} A · 2P` },
    ...(cfg.spd ? [{ name: 'SPD', sub: 'Sobretensiones' }] : []),
    { name: 'ID', sub: `${cfg.difA} A / ${cfg.difMa} mA tipo ${cfg.difType}` },
  ];
  const busY = y0;
  const ticks = (x: number, yy: number, n = 3) => Array.from({ length: n }, (_, k) => <path key={k} d={`M${x + k * 7 - 3} ${yy + 8}L${x + k * 7 + 3} ${yy - 8}`} stroke="var(--ink)" strokeWidth={1.8} />);
  return {
    w, h,
    node: (
      <g fill="none" stroke="var(--ink)" strokeWidth={2} strokeLinecap="round">
        <text x={40} y={40} fontSize={18} fontWeight={800} letterSpacing={3} stroke="none" fill="var(--ink)">ESQUEMA UNIFILAR · {cfg.nombre.toUpperCase()}</text>
        <text x={40} y={60} fontSize={11} stroke="none" fill="#555">{fmt(cfg.voltage)} V ~ 50 Hz · monofásica · P prevista {fmtSI(res.totalSim, 'W')} (instalada {fmtSI(res.totalConnected, 'W')})</text>
        <g transform={`translate(70 ${busY})`}><circle r={26} fill="var(--fill-b)" /><path d="M-12 0q6 -14 12 0t12 0" stroke="var(--accent)" strokeWidth={2.5} /><text y={46} textAnchor="middle" fontSize={10.5} fontWeight={800} stroke="none" fill="var(--ink)">ACOMETIDA</text></g>
        <path d={`M96 ${busY}H150`} />
        {items.map((it, i) => (
          <g key={it.name} transform={`translate(${190 + i * 150} ${busY})`}>
            <path d="M-40 0H-26M26 0H40" />
            <rect x={-26} y={-18} width={52} height={36} fill="var(--panel)" /><path d="M-18 8L10 -14M-18 -14L-10 -6" strokeWidth={1.8} />
            <rect x={-26} y={-18} width={52} height={36} />
            <text y={-28} textAnchor="middle" fontSize={11} fontWeight={800} stroke="none" fill="var(--ink)">{it.name}</text>
            <text y={34} textAnchor="middle" fontSize={9} stroke="none" fill="#444">{it.sub}</text>
          </g>
        ))}
        <path d={`M${190 + items.length * 150 - 110} ${busY}H${190 + items.length * 150 - 60}`} />
        {ticks(190 + items.length * 150 - 80, busY)}
        {/* barra de circuitos */}
        {(() => {
          const xb = 190 + items.length * 150 - 40;
          return (
            <g>
              <path d={`M${xb} ${busY}V${y0 + 110 + (on.length - 1) * 74}`} strokeWidth={6} />
              {on.map((c, i) => {
                const yy = y0 + 110 + i * 74;
                return (
                  <g key={c.id}>
                    <path d={`M${xb} ${yy}H${xb + 80}`} />
                    <g transform={`translate(${xb + 120} ${yy})`}>
                      <path d="M-40 0H-26M26 0H40" /><rect x={-26} y={-16} width={52} height={32} fill="var(--panel)" />
                      <path d="M-16 6L10 -12M-16 -12L-8 -4" strokeWidth={1.8} /><rect x={-26} y={-16} width={52} height={32} />
                      <text y={-24} textAnchor="middle" fontSize={11} fontWeight={800} stroke="none" fill="var(--ink)">{c.id}</text>
                      <text y={30} textAnchor="middle" fontSize={9} stroke="none" fill="#444">{c.inA} A</text>
                    </g>
                    <path d={`M${xb + 160} ${yy}H${xb + 340}`} />
                    {ticks(xb + 220, yy, 3)}
                    <text x={xb + 244} y={yy - 10} fontSize={9.5} stroke="none" fill="#444">{fmt(c.section)} mm² Cu</text>
                    <g transform={`translate(${xb + 350} ${yy - 28})`}>
                      <rect width={470} height={56} rx={4} fill="var(--panel)" strokeWidth={1.3} />
                      <text x={8} y={16} fontSize={11} fontWeight={800} stroke="none" fill="var(--ink)">{c.id} · {c.name}</text>
                      <text x={8} y={32} fontSize={9.5} stroke="none" fill="#444">P {fmtSI(c.p, 'W')} · Ib {fmt(c.ib)} A · L {fmt(c.length)} m · U {fmt(cfg.voltage)} V</text>
                      <text x={8} y={46} fontSize={9.5} stroke="none" fill={c.ok ? '#2e6b50' : '#b3261e'} fontWeight={700}>
                        PIA {c.inA} A · {fmt(c.section)} mm² (Iz {fmt(c.iz)} A) · caída {fmt(c.dropPct)} % (máx. {c.dropLimit} %) {c.ok ? '✔' : '✖'}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          );
        })()}
      </g>
    ),
  };
}

/* ─────────────────────────── CUADRO: ASPECTO REAL (carril DIN) ─────────────────────────── */
export function panelEnclosure(cfg: PanelConfig, res: PanelResult): Diagram {
  const MOD = 38; // anchura de un módulo (18 mm)
  const on = res.circuits.filter((c) => c.enabled);
  type Item = { kind: 'iga' | 'spd' | 'id' | 'pia'; w: number; label: string; sub: string; on?: boolean; r?: typeof on[number] };
  const items: Item[] = [
    { kind: 'iga', w: 2, label: 'IGA', sub: `${res.iga} A` },
    ...(cfg.spd ? [{ kind: 'spd' as const, w: 2, label: 'SPD', sub: 'Tipo 2' }] : []),
    { kind: 'id', w: 2, label: 'ID', sub: `${cfg.difA} A ${cfg.difMa} mA ${cfg.difType}` },
    ...on.map((r) => ({ kind: 'pia' as const, w: 2, label: r.id, sub: r.name, r })),
  ];
  const perRow = 10;
  const rows: Item[][] = [];
  let cur: Item[] = [], used = 0;
  for (const it of items) { if (used + it.w > perRow * 2 && cur.length) { rows.push(cur); cur = []; used = 0; } cur.push(it); used += it.w; }
  if (cur.length) rows.push(cur);
  const rowH = 250;
  const W = perRow * 2 * MOD + 140, H = rows.length * rowH + 120;
  return {
    w: W, h: H,
    node: (
      <g>
        <defs>
          <linearGradient id="encl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f7f8fa" /><stop offset="1" stopColor="#dfe3e8" /></linearGradient>
          <linearGradient id="pia" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f4f5f7" /><stop offset="0.5" stopColor="#e6e8ec" /><stop offset="1" stopColor="#cdd1d8" /></linearGradient>
          <linearGradient id="dinrail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#eceff2" /><stop offset="0.5" stopColor="#b3b9c1" /><stop offset="1" stopColor="#8d939b" /></linearGradient>
          <linearGradient id="levr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6c7078" /><stop offset="0.5" stopColor="#2a2d32" /><stop offset="1" stopColor="#15171a" /></linearGradient>
          <linearGradient id="screw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f2f3f5" /><stop offset="1" stopColor="#6e737b" /></linearGradient>
        </defs>
        <rect x={0} y={0} width={W} height={H} rx={14} fill="#0e1013" opacity={0.35} transform="translate(5 8)" />
        <rect x={0} y={0} width={W} height={H} rx={14} fill="url(#encl)" stroke="#b6bcc4" strokeWidth={2} />
        <rect x={14} y={14} width={W - 28} height={H - 28} rx={9} fill="none" stroke="#c9ced5" strokeWidth={2} />
        <text x={W / 2} y={44} textAnchor="middle" fontSize={13} fontWeight={800} letterSpacing={4} fill="#3d434b">{cfg.nombre.toUpperCase()}</text>
        {rows.map((row, ri) => {
          const top = 70 + ri * rowH;
          const rowW = perRow * 2 * MOD;
          const x0 = 70;
          let x = x0;
          return (
            <g key={ri}>
              {/* carril */}
              <rect x={x0 - 24} y={top + 74} width={rowW + 48} height={35} fill="#000" opacity={0.15} transform="translate(0 4)" />
              <rect x={x0 - 24} y={top + 70} width={rowW + 48} height={35} fill="url(#dinrail)" />
              {Array.from({ length: perRow * 2 }, (_, i) => <rect key={i} x={x0 - 10 + i * MOD} y={top + 83} width={22} height={9} rx={4.5} fill="#3b3f45" />)}
              {/* peines de conexión */}
              <rect x={x0} y={top + 6} width={rowW} height={6} rx={3} fill="url(#screw)" opacity={0.9} />
              {row.map((it, i) => {
                const wpx = it.w * MOD - 4;
                const xx = x;
                x += it.w * MOD;
                const isId = it.kind === 'id', isIga = it.kind === 'iga', isSpd = it.kind === 'spd';
                const ok = it.r ? it.r.ok : true;
                return (
                  <g key={i} transform={`translate(${xx} ${top})`}>
                    <rect x={3} y={14} width={wpx} height={176} rx={5} fill="#000" opacity={0.2} />
                    <rect x={0} y={12} width={wpx} height={176} rx={5} fill="url(#pia)" stroke="#9aa0a8" />
                    <rect x={0} y={12} width={wpx} height={34} rx={5} fill="#d7dadf" /><rect x={0} y={154} width={wpx} height={34} rx={5} fill="#d7dadf" />
                    {[wpx * 0.28, wpx * 0.72].map((cx, k) => [30, 170].map((cy, j) => (
                      <g key={`${k}${j}`}><circle cx={cx} cy={cy} r={7.5} fill="url(#screw)" stroke="#5b5f66" /><path d={`M${cx - 4.5} ${cy}H${cx + 4.5}`} stroke="#333" strokeWidth={1.6} /></g>
                    )))}
                    {isSpd ? (
                      <g><rect x={7} y={56} width={wpx - 14} height={84} rx={5} fill="#2d3138" /><rect x={12} y={64} width={wpx - 24} height={20} rx={3} fill="#2ecc71" /><text x={wpx / 2} y={78} textAnchor="middle" fontSize={9} fontWeight={800} fill="#073">OK</text><text x={wpx / 2} y={108} textAnchor="middle" fontSize={9} fontWeight={800} fill="#fff">SPD</text></g>
                    ) : (
                      <g>
                        <rect x={7} y={56} width={wpx - 14} height={isId ? 50 : 84} rx={5} fill="#202327" />
                        {[0, 1].map((k) => (
                          <g key={k}>
                            <rect x={11 + k * ((wpx - 22) / 2)} y={60} width={(wpx - 22) / 2 - 4} height={isId ? 42 : 76} rx={4} fill="url(#levr)" stroke="#000" />
                            <rect x={14 + k * ((wpx - 22) / 2)} y={63} width={(wpx - 22) / 2 - 10} height={4} rx={2} fill="#fff" opacity={0.25} />
                          </g>
                        ))}
                        {isId && <g><rect x={11} y={110} width={wpx - 22} height={26} rx={4} fill="#f3d94b" /><text x={wpx / 2} y={122} textAnchor="middle" fontSize={8} fontWeight={900} fill="#333">TEST</text><text x={wpx / 2} y={132} textAnchor="middle" fontSize={7} fill="#333">{cfg.difMa} mA</text></g>}
                        {!isId && <circle cx={wpx / 2} cy={50} r={3} fill={ok ? '#2ecc71' : '#e53935'} style={{ filter: 'drop-shadow(0 0 3px currentColor)' }} />}
                      </g>
                    )}
                    {/* rótulo del calibre */}
                    <rect x={4} y={138} width={wpx - 8} height={14} fill="#fff" opacity={0.9} />
                    <text x={wpx / 2} y={149} textAnchor="middle" fontSize={9} fontWeight={900} fill="#b3261e">{isIga ? `IGA ${res.iga}` : isId ? `${cfg.difA}A` : isSpd ? 'SPD' : `C${it.r!.inA}`}</text>
                    {/* etiqueta */}
                    <rect x={-1} y={198} width={wpx + 2} height={42} rx={3} fill="#fff" stroke="#c4c9cf" />
                    <text x={wpx / 2} y={212} textAnchor="middle" fontSize={11} fontWeight={800} fill="#222">{it.label}</text>
                    <text x={wpx / 2} y={225} textAnchor="middle" fontSize={7.5} fill="#555">{it.sub.length > 16 ? it.sub.slice(0, 15) + '…' : it.sub}</text>
                    {it.r && <text x={wpx / 2} y={236} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#555">{fmt(it.r.section)} mm²</text>}
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
    ),
  };
}
