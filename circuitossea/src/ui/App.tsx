import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { LIBRARY, defOf, defaultParams, fmt, fmtSI } from '../model/library';
import { readMeter } from '../model/meter';
import { Multimeter, MeterInfo } from './Multimeter';
import { Scope } from './Scope';
import { Wattmeter } from './Wattmeter';
import { FloatingWin, ProbeDragLayer } from './Floating';
import { beep } from './sound';
import { simulate } from '../model/netlist';
import { EXAMPLES } from '../model/examples';
import { t } from '../i18n';
import { Canvas } from './Canvas';
import { RealPanel } from './RealPanel';
import { Viewport } from './Viewport';
import { CuadroView } from './CuadroView';
import { Plano } from './Plano';
import { multifilarDiagram, unifilarDiagram } from './diagrams';
import { cableReport, wireData, admissible, wireResistance } from '../model/cables';
import { SECTIONS, IZ_SOURCE } from '../data/rebt';

export function App() {
  const st = useStore();
  const { project, selection, past, future } = st;
  const sim = useMemo(() => simulate(project, st.runtime), [project, st.runtime]);
  // Las averías nuevas (fusible fundido, LED quemado…) se anotan una vez y quedan hasta «Reponer»
  useEffect(() => {
    if (sim.events.length) { st.applyEvents(sim.events); if (st.sound) beep(150, 350, 'sawtooth', 0.08); }
  }, [sim.events]); // eslint-disable-line react-hooks/exhaustive-deps
  const cableRep = useMemo(() => cableReport(project, sim), [project, sim]);
  const messages = useMemo(() => [...sim.messages, ...cableRep.messages], [sim, cableRep]);
  const mf = useMemo(() => multifilarDiagram(project, sim, cableRep.info, st.showCables), [project, sim, cableRep, st.showCables]);
  const uf = useMemo(() => unifilarDiagram(project, sim, cableRep.info), [project, sim, cableRep]);
  const wide = !['schematic', 'real'].includes(st.view);
  const selWire = project.wires.find((w) => selection[0] === w.id);
  const reading = useMemo(() => readMeter(sim, st.meter, project), [sim, st.meter, project]);
  useEffect(() => {
    if (reading.blowFuse) st.setMeter({ fuseBlown: true });
    if (reading.beep && st.sound) beep(1000, 150);
  }, [reading.blowFuse, reading.beep]); // eslint-disable-line react-hooks/exhaustive-deps
  const fileRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');

  useEffect(() => { document.documentElement.dataset.theme = st.dark ? 'dark' : 'light'; }, [st.dark]);

  const selected = project.components.find((c) => selection[0] === c.id);
  const errors = messages.filter((m) => m.level === 'error');

  const download = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${project.name.replace(/[^\w-]+/g, '_') || 'circuito'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const onFile = async (f?: File) => {
    if (!f) return;
    try { st.load(JSON.parse(await f.text())); } catch { alert('No se pudo abrir el archivo: no es un proyecto válido.'); }
  };

  const cats = [...new Set(LIBRARY.map((d) => d.category))];

  return (
    <div className={`app ${wide ? 'wide' : ''} ${st.leftOpen ? '' : 'noleft'} ${st.rightOpen ? '' : 'noright'}`}>
      <ProbeDragLayer />
      <header className="top">
        <div className="brand"><span className="logo">⚡</span><b>{t.app}</b><small>{t.tagline}</small></div>
        <div className="viewswitch" role="tablist" aria-label="Vista del circuito">
          {([['schematic', 'Esquema', '⎍'], ['multifilar', 'Multifilar', '☰'], ['unifilar', 'Unifilar', '╱'], ['real', 'Real', '🛠'], ['cuadro', 'Cuadro', '▦'], ['plano', 'Plano', '🖨']] as const).map(([v, l, ic]) => (
            <button key={v} role="tab" aria-selected={st.view === v} className={st.view === v ? 'on' : ''} onClick={() => st.setView(v)} data-view={v}><span>{ic}</span> {l}</button>
          ))}
        </div>
        <div className="tools">
          <button onClick={() => { if (confirm('¿Empezar un proyecto nuevo? Se perderán los cambios no guardados.')) st.load({ version: 1, name: 'Sin título', components: [], wires: [] }); }}>{t.newProject}</button>
          <button onClick={() => fileRef.current?.click()}>{t.open}</button>
          <button onClick={download}>{t.save}</button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
          <select value="" onChange={(e) => { if (e.target.value) st.load(structuredClone(EXAMPLES[Number(e.target.value)])); }} aria-label={t.examples}>
            <option value="">{t.examples}…</option>
            {EXAMPLES.map((e, i) => <option key={e.name} value={i}>{e.name}</option>)}
          </select>
          <span className="sep" />
          <button onClick={st.undo} disabled={!past.length} title="Ctrl+Z">↶ {t.undo}</button>
          <button onClick={st.redo} disabled={!future.length} title="Ctrl+Y">↷ {t.redo}</button>
          <button onClick={st.rotateSelection} disabled={!selection.length} title="R">⟳ {t.rotate}</button>
          <button onClick={st.duplicateSelection} disabled={!selection.length} title="Ctrl+D">⧉ {t.duplicate}</button>
          <button onClick={st.deleteSelection} disabled={!selection.length} title="Supr">🗑 {t.delete}</button>
          <span className="sep" />
          <label><input type="checkbox" checked={st.animate} onChange={() => st.toggle('animate')} /> {t.animate}</label>
          <label><input type="checkbox" checked={st.showCables} onChange={() => st.toggle('showCables')} /> Secciones</label>
          <label><input type="checkbox" checked={st.showLabels} onChange={() => st.toggle('showLabels')} /> {t.labels}</label>
          {!wide && (
            <span className="insts" role="group" aria-label="Instrumentos">
              {([['meter', '⚡ Polímetro'], ['scope', '〰 Osciloscopio'], ['watt', '◔ Vatímetro']] as const).map(([id, l]) => (
                <button key={id} className={st.inst[id].open ? 'on' : ''} onClick={() => st.toggleInst(id)} data-inst={id}>{l}</button>
              ))}
            </span>
          )}
          {st.view === 'schematic' && <button onClick={st.fit} title="F">⤢ Ajustar</button>}
          <button onClick={() => st.toggle('leftOpen')} className={st.leftOpen ? '' : 'on'} title="Mostrar u ocultar la paleta">◧</button>
          <button onClick={() => st.toggle('rightOpen')} className={st.rightOpen ? '' : 'on'} title="Mostrar u ocultar propiedades">◨</button>
          <label><input type="checkbox" checked={st.sound} onChange={() => st.toggle('sound')} /> Sonido</label>
          <label><input type="checkbox" checked={st.heat} onChange={() => st.toggle('heat')} /> {t.heat}</label>
          {Object.keys(st.runtime).length > 0 && <button className="warnbtn" onClick={st.resetRuntime}>🔧 Reponer averías</button>}
          <button onClick={() => st.toggle('dark')} aria-label={t.theme}>{st.dark ? '☀' : '☾'}</button>
        </div>
      </header>

      <aside className="left">
        <h3>{t.palette}</h3>
        <input className="search" placeholder={t.search} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t.search} />
        {cats.map((cat) => {
          const items = LIBRARY.filter((d) => d.category === cat && d.name.toLowerCase().includes(q.toLowerCase()));
          if (!items.length) return null;
          return (
            <div key={cat}>
              <h4>{cat}</h4>
              <div className="pal">
                {items.map((d) => (
                  <div key={d.type} className="pal-item" draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', d.type)}
                    onDoubleClick={() => st.addComponent(d.type, 300, 300)}
                    title="Arrastra al lienzo (o doble clic)" data-type={d.type}>
                    <svg width={64} height={32} viewBox="-44 -22 88 44">
                      <PaletteIcon type={d.type} />
                    </svg>
                    <span>{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </aside>

      <main className="center">
        <div className={`stage ${st.view}`} key={st.view}>
          {st.view === 'real' ? <RealPanel sim={sim} cables={cableRep.info} /> : st.view === 'schematic' ? <Canvas sim={sim} cables={cableRep.info} />
            : st.view === 'multifilar' ? <Viewport d={mf} /> : st.view === 'unifilar' ? <Viewport d={uf} />
            : st.view === 'cuadro' ? <CuadroView /> : <Plano sim={sim} cables={cableRep.info} />}
        </div>
        <div className="toasts">{st.notices.map((n) => (
          <div key={n.id} className="toast" role="alert"><span>💥</span><span>{n.text}</span><button onClick={() => st.dismiss(n.id)}>✕</button></div>
        ))}</div>
        {!wide && (
          <>
            <FloatingWin id="meter" title="Polímetro" width={236} order={0}><Multimeter sim={sim} /><MeterInfo sim={sim} /></FloatingWin>
            <FloatingWin id="scope" title="Osciloscopio" width={600} order={1}><Scope sim={sim} /></FloatingWin>
            <FloatingWin id="watt" title="Vatímetro" width={228} order={2}><Wattmeter sim={sim} /></FloatingWin>
          </>
        )}
        {!wide && <div className="hint-bar">{st.view === 'real' ? 'Modo real: clic en interruptores y pulsadores para accionarlos · rueda = zoom · arrastra para mover el panel · elige una punta y pulsa un borne para medir' : st.wiring ? t.wireHint : t.placeHint}</div>}
      </main>

      <aside className="right">
        <h3>{t.props}</h3>
        {selWire && (() => {
          const d = wireData(selWire); const ci = cableRep.info[selWire.id];
          return (
            <div className="props">
              <div className="ptitle">Cable <code>{selWire.a.comp}:{selWire.a.term + 1} → {selWire.b.comp}:{selWire.b.term + 1}</code></div>
              <label className="row">Sección (mm²)
                <select value={d.section} onChange={(e) => { st.snapshot(); st.setWire(selWire.id, { section: +e.target.value }); }}>
                  {SECTIONS.slice(0, 9).map((s) => <option key={s} value={s}>{fmt(s)}</option>)}</select></label>
              <label className="row">Longitud (m)
                <NumField value={d.length} min={0.1} onCommit={(v) => { st.snapshot(); st.setWire(selWire.id, { length: v }); }} /></label>
              <div className="readout">
                <div><span>I</span><b>{fmtSI(ci?.I ?? 0, 'A')}</b></div>
                <div><span>Iz</span><b>{fmt(admissible(d.section))} A</b></div>
                <div><span>ΔU</span><b>{fmtSI(ci?.dV ?? 0, 'V')}</b></div>
              </div>
              <p className="muted small">R = L/(γ·S) = {fmt(d.length)}/(48·{fmt(d.section)}) = {fmt(wireResistance(d.section, d.length), 3)} Ω · caída {ci?.pct != null ? fmt(ci.pct) + ' %' : '—'} (máx. {ci?.limit} %). Iz: {IZ_SOURCE.verified ? '' : 'valor orientativo (a verificar). '}Los cables no alteran la simulación: solo avisan.</p>
            </div>
          );
        })()}
        {selected ? (
          <div className="props">
            <div className="ptitle">{defOf(selected.type).name} <code>{selected.id.length <= 6 ? selected.id : ''}</code></div>
            <label className="row">Etiqueta
              <input value={selected.label ?? ''} onChange={(e) => st.setLabel(selected.id, e.target.value)} />
            </label>
            {defOf(selected.type).params.map((p) => (
              <label className="row" key={p.key}>{p.label}{p.unit && ` (${p.unit})`}
                {p.options ? (
                  <select value={Number(selected.params[p.key])} onChange={(e) => { st.snapshot(); st.setParam(selected.id, p.key, Number(e.target.value)); }}>
                    {p.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : p.bool ? (
                  <input type="checkbox" checked={Boolean(selected.params[p.key])} onChange={(e) => { st.snapshot(); st.setParam(selected.id, p.key, e.target.checked); }} />
                ) : (
                  <NumField value={Number(selected.params[p.key])} min={p.min} step={p.step}
                    onCommit={(v) => { st.snapshot(); st.setParam(selected.id, p.key, v); }} />
                )}
              </label>
            ))}
            {sim.componentVoltage[selected.id] !== undefined && (
              <div className="readout">
                <div><span>V</span><b>{fmtSI(sim.componentVoltage[selected.id], 'V')}</b></div>
                <div><span>I</span><b>{fmtSI(Math.abs(sim.componentCurrent[`${selected.id}:0`]), 'A')}</b></div>
                <div><span>P</span><b>{fmtSI(Math.abs(sim.solution.powers[selected.id] ?? 0), 'W')}</b></div>
              </div>
            )}
          </div>
        ) : <p className="muted">{t.nothingSelected}</p>}

        <MeasureLog />

        <h3>{t.checks}</h3>
        {messages.length === 0 ? <p className="ok">✔ {t.allOk}</p> : (
          <ul className="msgs">
            {messages.map((m, i) => (
              <li key={i} className={m.level} onClick={() => m.ids.length && st.select(m.ids)}>
                <b>{m.level === 'error' ? '⛔' : '⚠'}</b> {m.text}
              </li>
            ))}
          </ul>
        )}
        <p className="muted small">{fmt(project.components.length, 4)} componentes · {project.wires.length} cables{errors.length ? ' · con errores' : ''}</p>
      </aside>
    </div>
  );
}

function MeasureLog() {
  const st = useStore();
  const { log } = st;
  const csv = () => {
    const rows = [['n', 'hora', 'función', 'puntos', 'valor', 'unidad', 'teórico', 'error absoluto', 'error relativo %'],
      ...log.map((l) => [l.id, l.time, l.mode, l.points, l.text, l.unit, l.theory ?? '', ...(l.theory !== undefined && l.value !== null ? [l.value - l.theory, l.theory ? ((l.value - l.theory) / l.theory) * 100 : ''] : ['', ''])])];
    const blob = new Blob(['\ufeff' + rows.map((r) => r.map((x) => `"${String(x).replace('.', ',')}"`).join(';')).join('\n')], { type: 'text/csv' });
    const a2 = document.createElement('a'); a2.href = URL.createObjectURL(blob); a2.download = 'hoja_de_medidas.csv'; a2.click();
  };
  return (
    <section className="meter">
      <h3>Hoja de medidas</h3>
      {log.length === 0 ? <p className="muted small">Coloca las puntas, gira la rueda y pulsa «Anotar medida».</p> : (
        <>
          <div className="row"><button onClick={csv}>CSV</button><button onClick={st.clearLog}>Borrar</button></div>
          <table className="log"><thead><tr><th>#</th><th>Punto</th><th>Medida</th><th>Teórico</th><th>Error</th></tr></thead>
            <tbody>{log.map((l) => {
              const err = l.theory !== undefined && l.value !== null ? l.value - l.theory : null;
              return (<tr key={l.id}><td>{l.id}</td><td>{l.mode}<br /><small>{l.points}</small></td><td>{l.text} {l.unit}</td>
                <td><NumField value={l.theory ?? 0} onCommit={(v) => st.setTheory(l.id, v)} /></td>
                <td>{err === null ? '—' : <>{fmt(err, 3)}<br /><small>{l.theory ? fmt((err / l.theory) * 100, 3) + ' %' : ''}</small></>}</td></tr>);
            })}</tbody></table>
        </>
      )}
    </section>
  );
}

function NumField({ value, min, step, onCommit }: { value: number; min?: number; step?: number; onCommit: (v: number) => void }) {
  const [txt, setTxt] = useState(String(value).replace('.', ','));
  useEffect(() => setTxt(String(value).replace('.', ',')), [value]);
  const commit = () => {
    const v = parseFloat(txt.replace(',', '.'));
    if (isFinite(v) && (min === undefined || v >= min)) onCommit(v); else setTxt(String(value).replace('.', ','));
  };
  return <input inputMode="decimal" value={txt} step={step} onChange={(e) => setTxt(e.target.value)} onBlur={commit}
    onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} />;
}

import { Symbol } from './symbols';
function PaletteIcon({ type }: { type: string }) {
  return <Symbol c={{ id: 'p', type, x: 0, y: 0, rot: 0, params: { ...defaultParams(type) } }} live={type === 'led' || type === 'lamp' ? { v: 0, i: 0.02, p: 6, on: true } : undefined} />;
}
