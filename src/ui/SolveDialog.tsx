/**
 * «Resolver valores»: solucionario paso a paso con el formato de clase (Enunciado → Resultado → métodos con
 * «Qué hago / Por qué / En la pizarra» → Comprobaciones, Interpretación y Reflexión). Vale para CC y CA (fasores).
 * Se guarda como PDF con el diálogo de impresión del navegador.
 */
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import type { SimResult } from '../model/netlist';
import { buildCNet, type DirMode, type CNet } from '../solve/cnet';
import { buildSolucionario, SMETHODS, type MId, type SBlock, type Sol } from '../solve/sol';
import { pretty, abs, deg, nf, subs, type C } from '../solve/cx';
import { multifilarDiagram, multifilarOffset, paperVars } from './diagrams';

function Arrow({ x1, y1, x2, y2, color = '#A84A24', w = 2 }: { x1: number; y1: number; x2: number; y2: number; color?: string; w?: number }) {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 7;
  const p = [[x2, y2], [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)], [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)]];
  return <g><line x1={x1} y1={y1} x2={x2 - 3 * Math.cos(a)} y2={y2 - 3 * Math.sin(a)} stroke={color} strokeWidth={w} strokeLinecap="round" /><polygon points={p.map((q) => q.join(',')).join(' ')} fill={color} /></g>;
}

function Figure({ block, net, sol, base, off }: { block: Extract<SBlock, { t: 'fig' }>; net: CNet; sol: Sol; base: ReturnType<typeof multifilarDiagram>; off: { ox: number; oy: number } }) {
  const project = useStore((s) => s.project);
  const nodes = net.nodePos.map((p, i) => (
    <g key={'n' + i}><circle cx={p.x} cy={p.y} r={5.5} fill="#A84A24" stroke="#fff" strokeWidth={1.5} />
      <text x={p.x + 9} y={p.y - 9} fontSize={15} fontWeight={800} fill="#A84A24" stroke="#fff" strokeWidth={3} paintOrder="stroke">{net.names[i]}</text></g>
  ));
  let extra: React.ReactNode = null;
  if (block.mark === 'currents') {
    extra = net.ramas.map((r, k) => {
      const cs = net.comps.filter((c) => c.rama === r.id);
      const isSrc = (id: string) => ['battery', 'acsource', 'dcsource', 'isource'].includes(project.components.find((q) => q.id === id)?.type ?? '');
      const c = cs.find((q) => !isSrc(q.id) && Math.abs(q.t0.x - q.t1.x) + Math.abs(q.t0.y - q.t1.y) > 1) ?? cs[0];
      if (!c) return null;
      const mx = (c.t0.x + c.t1.x) / 2, my = (c.t0.y + c.t1.y) / 2;
      let dx = (c.t1.x - c.t0.x) * c.dirAlong, dy = (c.t1.y - c.t0.y) * c.dirAlong; const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n;
      const ox = -dy * 26, oy = dx * 26; // desplazamiento lateral
      return <g key={'i' + k}><Arrow x1={mx + ox - dx * 15} y1={my + oy - dy * 15} x2={mx + ox + dx * 15} y2={my + oy + dy * 15} />
        <text x={mx + ox * 1.55} y={my + oy * 1.55 + 4} fontSize={13} fontWeight={800} fill="#A84A24" stroke="#fff" strokeWidth={3} paintOrder="stroke" textAnchor="middle">{`I${subs(r.name.slice(1))}`}</text></g>;
    });
  } else if (block.mark === 'meshes' && sol.graph) {
    extra = sol.graph.loops.map((l, i) => (
      <g key={'m' + i} transform={`translate(${l.cx} ${l.cy})`}>
        <path d="M -17 4 A 18 18 0 1 1 5 17" fill="none" stroke="#A84A24" strokeWidth={2} /><polygon points="5,17 -3,10 -2,22" fill="#A84A24" transform="rotate(0)" />
        <text y={4} textAnchor="middle" fontSize={13} fontWeight={800} fill="#A84A24">{`I${String.fromCharCode(97 + i)}`}</text>
      </g>
    ));
  }
  return (
    <figure className="sfig">
      <svg viewBox={`0 0 ${base.w + 20} ${base.h + 20}`} className="rdiagram" style={paperVars() as React.CSSProperties}>
        <g transform="translate(10 10)">{base.node}<g transform={`translate(${off.ox} ${off.oy})`}>{extra}{nodes}</g></g>
      </svg>
      <figcaption>{block.caption}</figcaption>
    </figure>
  );
}

function Phasors({ title, items }: { title: string; items: { label: string; v: C }[] }) {
  const max = Math.max(1e-9, ...items.map((i) => abs(i.v)));
  const R = 120;
  const colors = ['#A84A24', '#2f6f4f', '#1f5a8a', '#8a6a12', '#7a3b8a'];
  return (
    <figure className="sfig">
      <svg viewBox="-150 -150 300 300" className="phasor">
        <circle r={R} fill="none" stroke="#c8c0b0" strokeDasharray="3 4" /><line x1={-R} x2={R} stroke="#c8c0b0" /><line y1={-R} y2={R} stroke="#c8c0b0" />
        {items.map((it, i) => { const k = (abs(it.v) / max) * R; const a = (-deg(it.v) * Math.PI) / 180; const x = k * Math.cos(a), y = k * Math.sin(a); return <g key={i}><Arrow x1={0} y1={0} x2={x} y2={y} color={colors[i % colors.length]} /><text x={x * 1.1 + 4} y={y * 1.1 + 4} fontSize={11} fontWeight={700} fill={colors[i % colors.length]}>{it.label}</text></g>; })}
      </svg>
      <figcaption>{title} · escala: {nf(max)} {title.includes("tensiones") ? "V" : "A"} = radio</figcaption>
    </figure>
  );
}

function Blocks({ blocks, net, sol, base, off }: { blocks: SBlock[]; net: CNet; sol: Sol; base: ReturnType<typeof multifilarDiagram>; off: { ox: number; oy: number } }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.t) {
          case 'p': return <p key={i}>{b.text}</p>;
          case 'band': return <h4 key={i} className="sband">{b.text}</h4>;
          case 'step': return (
            <div key={i} className="sstep">
              <h5><span>Paso {b.n}</span> {b.title}</h5>
              <p><b>Qué hago:</b> {b.que}</p>
              {b.porque && <p><b>Por qué:</b> {b.porque}</p>}
              <pre className="pizarra"><i>En la pizarra</i>{'\n'}{b.pizarra.join('\n')}</pre>
            </div>
          );
          case 'box': return <div key={i} className={`sbox ${b.kind}`}><h5>{b.title}</h5><pre>{b.lines.join('\n')}</pre></div>;
          case 'table': return <table key={i} className="rtab"><thead><tr>{b.head.map((h, j) => <th key={j}>{h}</th>)}</tr></thead><tbody>{b.rows.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table>;
          case 'phasors': return <Phasors key={i} title={b.title} items={b.items} />;
          case 'fig': return <Figure key={i} block={b} net={net} sol={sol} base={base} off={off} />;
        }
      })}
    </>
  );
}

export function SolveDialog({ sim, onClose }: { sim: SimResult; onClose: () => void }) {
  const project = useStore((s) => s.project);
  const [dirMode, setDirMode] = useState<DirMode>('cargas');
  const net = useMemo(() => buildCNet(project, sim, dirMode), [project, sim, dirMode]);
  const [loadId, setLoadId] = useState('');
  const sol = useMemo(() => buildSolucionario(net, { load: loadId }), [net, loadId]);
  const store = (k: string, d = '') => { try { return localStorage.getItem('circuitossea:' + k) ?? d; } catch { return d; } };
  const [alumno, setAlumno] = useState(() => store('alumno'));
  const [asig, setAsig] = useState(() => store('asignatura', 'Electrotecnia'));
  const [tema, setTema] = useState(() => store('tema'));
  const [picked, setPicked] = useState<Set<MId> | null>(null);
  const defaults = useMemo(() => new Set(sol.methods.filter((m) => m.applicable && (m.id !== 'ohm' || net.n < 2)).map((m) => m.id)), [sol, net.n]);
  const chosen = picked ?? defaults;
  const toggle = (id: MId) => { const s = new Set(chosen); if (s.has(id)) s.delete(id); else s.add(id); setPicked(s); };
  const base = useMemo(() => multifilarDiagram(project, sim, {}, false), [project, sim]);
  const off = useMemo(() => multifilarOffset(project), [project]);
  const date = new Date().toLocaleDateString('es-ES');

  useEffect(() => {
    const after = () => document.body.classList.remove('print-report');
    window.addEventListener('afterprint', after);
    return () => window.removeEventListener('afterprint', after);
  }, []);
  const print = () => { try { localStorage.setItem('circuitossea:alumno', alumno); localStorage.setItem('circuitossea:asignatura', asig); localStorage.setItem('circuitossea:tema', tema); } catch { /* ignorar */ } document.body.classList.add('print-report'); setTimeout(() => window.print(), 50); };
  const used = sol.methods.filter((m) => chosen.has(m.id) && m.applicable);

  return (
    <div className="solve-overlay" role="dialog" aria-label="Resolver valores">
      <aside className="solve-side">
        <div className="side-head"><h2>Resolver valores</h2><button className="x" onClick={onClose} aria-label="Cerrar">✕</button></div>
        <p className="muted small">Solucionario paso a paso, como en la pizarra. Elige los métodos; el resultado se comprueba con el simulador.{net.ok && net.ac ? ' Circuito de alterna: se resuelve con fasores e impedancias complejas.' : ''}</p>
        {!net.ok ? <p className="rwarn">{net.reason}</p> : (
          <>
            <label className="field">Sentido de las corrientes
              <select value={dirMode} onChange={(e) => { setDirMode(e.target.value as DirMode); setPicked(null); }}>
                <option value="cargas">Las fuentes empujan hacia A; las cargas, de A a B</option>
                <option value="haciaA">Todas las corrientes hacia A</option>
              </select></label>
            <ul className="mlist">
              {SMETHODS.map((sm) => {
                const m = sol.methods.find((x) => x.id === sm.id);
                if (!m) return null;
                if (sm.ac && !net.ac) return null;
                return (
                  <li key={sm.id} className={m.applicable ? '' : 'off'}>
                    <label><input type="checkbox" disabled={!m.applicable} checked={m.applicable && chosen.has(sm.id)} onChange={() => toggle(sm.id)} /> <b>{sm.short}</b></label>
                    {!m.applicable && <small>No aplicable: {m.why}</small>}
                  </li>
                );
              })}
            </ul>
            <label className="field">Rama que se estudia en Thévenin / Norton
              <select value={sol.loadId} onChange={(e) => setLoadId(e.target.value)}>
                {net.ramas.map((r, k) => <option key={r.id} value={r.id}>I{subs(k + 1)} · {r.parts.filter((p) => !p.internal || p.kind === 'Z').map((p) => pretty(p.label)).join(' + ')}</option>)}
              </select></label>
          </>
        )}
        <label className="field">Asignatura<input value={asig} onChange={(e) => setAsig(e.target.value)} /></label>
        <label className="field">Tema / ejercicio<input value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Tema 3 · Ejercicio 1" /></label>
        <label className="field">Alumno<input value={alumno} onChange={(e) => setAlumno(e.target.value)} placeholder="Opcional" /></label>
        <div className="solve-actions">
          <button className="primary" onClick={print} disabled={!net.ok}>Guardar como PDF</button>
          <small className="muted">Se abre el diálogo de impresión: elige «Guardar como PDF».</small>
        </div>
      </aside>

      <main className="solve-main">
        <article className="report solucionario">
          <header className="rhead">
            <div><h1>{asig || 'Solucionario'}{tema ? ` · ${tema}` : ''}</h1><p>{project.name} · {date}{alumno ? ` · ${alumno}` : ''}</p></div>
            <span className="rlogo">CircuitosSEA</span>
          </header>
          {!sol.ok ? <p className="rwarn">{sol.reason}</p> : (
            <>
              <section className="rsec">
                <h2>Enunciado</h2>
                {sol.enunciado.map((l, i) => <p key={i}>{l}</p>)}
                <Figure block={{ t: 'fig', mark: 'nodes', caption: `Circuito con los puntos ${net.names.join(', ')}` }} net={net} sol={sol} base={base} off={off} />
                {net.notes.map((n, i) => <p key={i} className="rnote">{n}</p>)}
              </section>
              <section className="rsec"><Blocks blocks={sol.resultado} net={net} sol={sol} base={base} off={off} /></section>
              {used.map((m) => (
                <section className="rsec method" key={m.id}>
                  <h3 className="mband">{m.title}</h3>
                  <Blocks blocks={m.blocks} net={net} sol={sol} base={base} off={off} />
                </section>
              ))}
              <section className="rsec"><Blocks blocks={sol.cierre} net={net} sol={sol} base={base} off={off} /></section>
            </>
          )}
          <footer className="rfoot">Generado con CircuitosSEA. Valores ideales (cables sin resistencia). Verifica siempre los resultados.</footer>
        </article>
      </main>
    </div>
  );
}
