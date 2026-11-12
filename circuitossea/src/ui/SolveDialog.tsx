/**
 * «Resolver valores»: resuelve el circuito dibujado por los métodos que elijas (Ohm y serie/paralelo,
 * Kirchhoff, mallas, nudos, Millman, Thévenin, Norton, superposición), paso a paso y comparado con el simulador.
 * El informe se guarda como PDF con el diálogo de impresión del navegador («Guardar como PDF»).
 */
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import type { SimResult } from '../model/netlist';
import type { Project } from '../model/types';
import { defOf, fmt, fmtSI } from '../model/library';
import { buildNet, num } from '../solve/network';
import { METHODS, balance, runMethod, type Block, type MethodId } from '../solve/methods';
import { multifilarDiagram, paperVars } from './diagrams';

const nameOf = (p: Project, id: string) => { const c = p.components.find((x) => x.id === id); return c ? c.label || (c.id.length <= 4 ? c.id : defOf(c.type).name) : id; };

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.t === 'h') return <h4 key={i}>{b.text}</h4>;
        if (b.t === 'p') return <p key={i}>{b.text}</p>;
        if (b.t === 'note') return <p key={i} className="rnote">{b.text}</p>;
        if (b.t === 'warn') return <p key={i} className="rwarn">{b.text}</p>;
        if (b.t === 'ok') return <p key={i} className="rok">{b.text}</p>;
        if (b.t === 'eq') return <pre key={i} className="req">{b.lines.join('\n')}</pre>;
        if (b.t !== 'table') return null;
        return (
          <table key={i} className="rtab"><thead><tr>{b.head.map((h, j) => <th key={j}>{h}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table>
        );
      })}
    </>
  );
}

export function SolveDialog({ sim, onClose }: { sim: SimResult; onClose: () => void }) {
  const project = useStore((s) => s.project);
  const net = useMemo(() => buildNet(project, sim), [project, sim]);
  const loads = net.branches.filter((b) => b.kind === 'R' && !b.internal);
  const [loadId, setLoadId] = useState<string>('');
  const [alumno, setAlumno] = useState(() => { try { return localStorage.getItem('circuitossea:alumno') ?? ''; } catch { return ''; } });
  const results = useMemo(() => (net.ok ? METHODS.map((m) => runMethod(m.id, net, loadId || undefined)) : []), [net, loadId]);
  const [picked, setPicked] = useState<Set<MethodId> | null>(null);
  const chosen = picked ?? new Set(results.filter((r) => r.applicable).map((r) => r.id));
  const toggle = (id: MethodId) => { const s = new Set(chosen); if (s.has(id)) s.delete(id); else s.add(id); setPicked(s); };
  const mf = useMemo(() => multifilarDiagram(project, sim, {}, false), [project, sim]);
  const date = new Date().toLocaleDateString('es-ES');

  useEffect(() => {
    const after = () => document.body.classList.remove('print-report');
    window.addEventListener('afterprint', after);
    return () => window.removeEventListener('afterprint', after);
  }, []);
  const print = () => { try { localStorage.setItem('circuitossea:alumno', alumno); } catch { /* ignorar */ } document.body.classList.add('print-report'); setTimeout(() => window.print(), 50); };

  const used = results.filter((r) => chosen.has(r.id) && r.applicable);
  const full = used.find((r) => r.scope === 'todo' && r.I);
  const maxErr = (r: (typeof used)[number]) => Math.max(0, ...Object.entries(r.I ?? {}).map(([id, I]) => Math.abs(I - (net.truth.I[id] ?? 0))));

  return (
    <div className="solve-overlay" role="dialog" aria-label="Resolver valores">
      <aside className="solve-side">
        <div className="side-head"><h2>Resolver valores</h2><button className="x" onClick={onClose} aria-label="Cerrar">✕</button></div>
        <p className="muted small">Elige los métodos con los que quieres ver resuelto tu circuito. Cada uno se comprueba con el simulador.</p>
        {!net.ok ? <p className="rwarn">{net.reason}</p> : (
          <>
            <ul className="mlist">
              {METHODS.map((m, i) => {
                const r = results[i];
                return (
                  <li key={m.id} className={r.applicable ? '' : 'off'}>
                    <label><input type="checkbox" disabled={!r.applicable} checked={r.applicable && chosen.has(m.id)} onChange={() => toggle(m.id)} /> <b>{m.short}</b></label>
                    {!r.applicable && <small title={r.why}>No aplicable: {r.why}</small>}
                    {r.applicable && r.scope === 'carga' && <small>Solo calcula la carga elegida</small>}
                  </li>
                );
              })}
            </ul>
            <label className="field">Carga para Thévenin / Norton
              <select value={loadId} onChange={(e) => setLoadId(e.target.value)}>
                <option value="">(la última resistencia)</option>
                {loads.map((b) => <option key={b.id} value={b.id}>{b.label} · {num(b.v)} Ω</option>)}
              </select></label>
          </>
        )}
        <label className="field">Nombre del alumno (para el PDF)<input value={alumno} onChange={(e) => setAlumno(e.target.value)} placeholder="Opcional" /></label>
        <div className="solve-actions">
          <button className="primary" onClick={print} disabled={!net.ok}>Guardar como PDF</button>
          <small className="muted">Se abre el diálogo de impresión: elige «Guardar como PDF» como destino.</small>
        </div>
      </aside>

      <main className="solve-main">
        <article className="report">
          <header className="rhead">
            <div><h1>Resolución del circuito</h1><p>{project.name} · {date}{alumno ? ` · ${alumno}` : ''}</p></div>
            <span className="rlogo">CircuitosSEA</span>
          </header>

          <section className="rsec">
            <h2>1 · El circuito</h2>
            <svg viewBox={`0 0 ${mf.w + 48} ${mf.h + 48}`} className="rdiagram" style={paperVars() as React.CSSProperties}><g transform="translate(24 24)">{mf.node}</g></svg>
            <table className="rtab"><thead><tr><th>Componente</th><th>Tipo</th><th>Valor</th><th>V (V)</th><th>I (A)</th><th>P (W)</th></tr></thead>
              <tbody>{project.components.filter((c) => !['ground', 'junction'].includes(c.type)).map((c) => {
                const l = sim.live[c.id];
                return <tr key={c.id}><td>{nameOf(project, c.id)}</td><td>{defOf(c.type).name}</td><td>{defOf(c.type).tag?.(c.params) ?? '—'}</td><td>{l ? num(l.v) : '—'}</td><td>{l ? num(Math.abs(l.i)) : '—'}</td><td>{l ? num(l.p) : '—'}</td></tr>;
              })}</tbody></table>
            <p className="rnote">V, I y P: valores calculados por el simulador (sirven para comprobar el resultado de cada método).</p>
          </section>

          {!net.ok ? <section className="rsec"><h2>2 · Métodos</h2><p className="rwarn">{net.reason}</p></section> : (
            <>
              <section className="rsec">
                <h2>2 · Red y convenio de signos</h2>
                <p>Se toma el nudo 0 como referencia de tensión. A cada rama se le asigna un sentido de referencia (de un nudo a otro): una corriente positiva circula en ese sentido; una negativa, al contrario. En las fuentes de tensión el polo positivo es el primer nudo.</p>
                <div className="two-col">
                  <table className="rtab"><thead><tr><th>Nudo</th><th>Elementos conectados</th></tr></thead><tbody>{net.names.map((n, i) => <tr key={n}><td>{n}{i === 0 ? ' (masa)' : ''}</td><td>{net.desc[i]}</td></tr>)}</tbody></table>
                  <table className="rtab"><thead><tr><th>Rama</th><th>Tipo</th><th>Valor</th><th>Sentido</th></tr></thead><tbody>{net.branches.map((b) => <tr key={b.id}><td>{b.label}</td><td>{b.kind === 'R' ? 'Resistencia' : b.kind === 'E' ? 'Fuente de tensión' : 'Fuente de corriente'}</td><td>{num(b.v)} {b.kind === 'R' ? 'Ω' : b.kind === 'E' ? 'V' : 'A'}</td><td>{net.names[b.a]} → {net.names[b.b]}</td></tr>)}</tbody></table>
                </div>
                {net.notes.map((n, i) => <p key={i} className="rnote">{n}</p>)}
              </section>

              {used.map((r, i) => (
                <section className="rsec" key={r.id}>
                  <h2>{i + 3} · {r.title}</h2>
                  <Blocks blocks={r.blocks} />
                  {r.scope === 'todo' && <p className="rok">Comprobación con el simulador: diferencia máxima en las corrientes = {num(maxErr(r), 3)} A.</p>}
                </section>
              ))}

              {used.length > 0 && (
                <section className="rsec">
                  <h2>{used.length + 3} · Comparación de métodos</h2>
                  <table className="rtab"><thead><tr><th>Rama (A)</th>{used.map((r) => <th key={r.id}>{METHODS.find((m) => m.id === r.id)!.short}</th>)}<th>Simulador</th></tr></thead>
                    <tbody>{net.branches.map((b) => <tr key={b.id}><td>{b.label}</td>{used.map((r) => <td key={r.id}>{r.I && b.id in r.I ? num(r.I[b.id]) : '—'}</td>)}<td>{num(net.truth.I[b.id])}</td></tr>)}</tbody></table>
                  <p className="rnote">Los métodos que solo resuelven la carga (Thévenin, Norton) aparecen únicamente en su rama.</p>
                  <h4>Balance de potencias</h4>
                  <Blocks blocks={balance(net, full?.I ?? net.truth.I)} />
                </section>
              )}
            </>
          )}
          <footer className="rfoot">Generado con CircuitosSEA. Cálculo de corriente continua con valores ideales (cables sin resistencia). Verifica siempre los resultados.</footer>
        </article>
      </main>
    </div>
  );
}
export { fmt, fmtSI };
