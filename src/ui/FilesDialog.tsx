/** Abrir y guardar archivos .omi: en el ordenador o en la biblioteca de este navegador. */
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { useAveria, applyAveria, averiaStash } from '../averias/store';
import { applyGame, downloadOmi, makeOmi, parseOmi, readLib, removeFromLib, saveToLib, type Omi } from '../omi';

export function openOmi(o: Omi) {
  const s = useStore.getState();
  const inAv = s.view === 'averias';
  // Dentro de «Parte de avería» el lienzo muestra el circuito de la avería: el circuito del alumno va a la reserva
  const put = () => { if (inAv) averiaStash.project = o.project; else s.load(o.project); };
  put();
  if (o.averia) { applyAveria(o.averia); if (!inAv) s.setView('averias'); }
  else if (o.game) { applyGame(o.game); s.setView('juego'); }
  else if (inAv) s.setView('schematic');
}

export function FilesDialog({ mode, onClose }: { mode: 'abrir' | 'guardar'; onClose: () => void }) {
  const st = useStore();
  const [, force] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [name, setName] = useState(st.project.name === 'Sin título' ? '' : st.project.name);
  const [withGame, setWithGame] = useState(st.view === 'juego');
  const hasAv = !!useAveria.getState().sc;
  const [withAv, setWithAv] = useState(st.view === 'averias');
  const file = useRef<HTMLInputElement>(null);
  const lib = readLib();

  const open = (text: string) => {
    try { openOmi(parseOmi(text)); onClose(); } catch (e) { setMsg({ ok: false, t: (e as Error).message }); }
  };
  const build = () => { const base = st.view === 'averias' && averiaStash.project ? averiaStash.project : st.project; const p = { ...base, name: name.trim() || 'Sin título' }; return makeOmi(p, withGame, withAv && hasAv); };
  const fmt = (d: string) => { try { return new Date(d).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }); } catch { return ''; } };

  return createPortal(
    <div className="modal-back" role="dialog" aria-modal="true" aria-label={mode === 'abrir' ? 'Abrir' : 'Guardar'}>
      <div className="omi-box">
        <header><h2>{mode === 'abrir' ? 'Abrir un archivo .omi' : 'Guardar como archivo .omi'}</h2><button className="ghost" onClick={onClose}>Cerrar</button></header>
        {mode === 'guardar' ? (
          <div className="omi-body">
            <label className="pe-field">Nombre<input value={name} onChange={(e) => setName(e.target.value)} placeholder="p. ej. Conmutada del salón" maxLength={60} autoFocus /></label>
            <label className="omi-chk"><input type="checkbox" checked={withGame} onChange={(e) => setWithGame(e.target.checked)} /> Incluir también la obra del juego «Instalador» en curso (cliente, plano e instalación)</label>
            {hasAv && <label className="omi-chk"><input type="checkbox" checked={withAv} onChange={(e) => setWithAv(e.target.checked)} /> Incluir también el parte de avería en curso (aviso, medidas, reparaciones y tiempo)</label>}
            <div className="omi-actions">
              <button className="pe-primary" onClick={() => { const o = build(); if (st.view !== 'averias') st.load({ ...st.project, name: o.name }); downloadOmi(o); setMsg({ ok: true, t: `Descargado «${o.name}.omi» en tu ordenador.` }); }}>Descargar en mi ordenador</button>
              <button className="pe-btn" onClick={() => { const o = build(); const ok = saveToLib(o); setMsg(ok ? { ok: true, t: 'Guardado en este navegador. Lo verás en «Abrir».' } : { ok: false, t: 'No cabe en el almacenamiento del navegador: descárgalo al ordenador.' }); force((n) => n + 1); }}>Guardar en el navegador</button>
            </div>
            <p className="pe-hint">El archivo .omi lleva el circuito, el cuadro y el cajetín del plano. Puedes abrirlo en cualquier ordenador con CircuitosSEA.</p>
          </div>
        ) : (
          <div className="omi-body">
            <button className="pe-primary" onClick={() => file.current?.click()}>Abrir un archivo de mi ordenador</button>
            <input ref={file} type="file" accept=".omi,.json,application/json" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) open(await f.text()); }} />
            <p className="pe-hint">También puedes arrastrar un archivo .omi encima de la página.</p>
            <h3>Guardados en este navegador</h3>
            {!lib.length && <p className="pe-hint">Todavía no hay nada guardado aquí.</p>}
            <ul className="omi-list">{lib.map((it) => (
              <li key={it.id}><b>{it.name}</b><span>{fmt(it.date)}{it.hasGame ? ' · con juego' : ''}</span>
                <button onClick={() => open(it.text)}>Abrir</button>
                <button onClick={() => { try { downloadOmi(parseOmi(it.text)); } catch { /* ignorar */ } }}>Descargar</button>
                <button className="danger" onClick={() => { if (confirm(`¿Borrar «${it.name}»?`)) { removeFromLib(it.id); force((n) => n + 1); } }}>Borrar</button></li>
            ))}</ul>
          </div>
        )}
        {msg && <p className={`omi-msg ${msg.ok ? 'ok' : 'err'}`} role="status">{msg.t}</p>}
      </div>
    </div>, document.body);
}
