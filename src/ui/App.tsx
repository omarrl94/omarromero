import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { LIBRARY, defOf, fmt, fmtSI } from '../model/library';
import { simulate } from '../model/netlist';
import { EXAMPLES } from '../model/examples';
import { t } from '../i18n';
import { Canvas } from './Canvas';

export function App() {
  const st = useStore();
  const { project, selection, past, future } = st;
  const sim = useMemo(() => {
    try { return simulate(project); } catch (e) {
      return null as never;
    }
  }, [project]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');

  useEffect(() => { document.documentElement.dataset.theme = st.dark ? 'dark' : 'light'; }, [st.dark]);

  const selected = project.components.find((c) => selection[0] === c.id);
  const errors = sim.messages.filter((m) => m.level === 'error');

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
    <div className="app">
      <header className="top">
        <div className="brand"><span className="logo">⚡</span><b>{t.app}</b><small>{t.tagline}</small></div>
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
          <label><input type="checkbox" checked={st.showLabels} onChange={() => st.toggle('showLabels')} /> {t.labels}</label>
          <label><input type="checkbox" checked={st.heat} onChange={() => st.toggle('heat')} /> {t.heat}</label>
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
        <Canvas sim={sim} />
        <div className="hint-bar">{st.wiring ? t.wireHint : t.placeHint}</div>
      </main>

      <aside className="right">
        <h3>{t.props}</h3>
        {selected ? (
          <div className="props">
            <div className="ptitle">{defOf(selected.type).name} <code>{selected.id.length <= 6 ? selected.id : ''}</code></div>
            <label className="row">Etiqueta
              <input value={selected.label ?? ''} onChange={(e) => st.setLabel(selected.id, e.target.value)} />
            </label>
            {defOf(selected.type).params.map((p) => (
              <label className="row" key={p.key}>{p.label}{p.unit && ` (${p.unit})`}
                {p.bool ? (
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

        <h3>{t.checks}</h3>
        {sim.messages.length === 0 ? <p className="ok">✔ {t.allOk}</p> : (
          <ul className="msgs">
            {sim.messages.map((m, i) => (
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
  return <Symbol c={{ id: 'p', type, x: 0, y: 0, rot: 0, params: { closed: true } }} />;
}
