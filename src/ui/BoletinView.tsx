/**
 * Juego «El boletín»: antes de entregar la obra, el alumno hace las verificaciones reglamentarias (continuidad, aislamiento,
 * tierra y disparo del diferencial) con instrumentos propios, decide si cada valor es apto y firma… o se niega a firmar.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBoletin, PREP_COST, type Pending } from '../boletin/store';
import { houseOf } from '../game/houses';
import { MANUAL } from '../boletin/manual';
import { defectOf } from '../boletin/catalog';
import { PAIR_LABEL, RULES, maxEarthOhm, type Pair, type TestKind } from '../boletin/rules';
import type { Prep } from '../boletin/instruments';
import './boletin.css';

const hm = (m: number) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
const fx = (n: number) => n.toFixed(1).replace('.', ',');
const mood = (ratio: number) => (ratio < 0.5 ? ['😊', 'Tranquilo'] : ratio < 0.8 ? ['🙂', 'Paciente'] : ratio < 1 ? ['😐', 'Mirando el reloj'] : ratio < 1.25 ? ['😠', 'Impaciente'] : ['🤬', 'Fuera de sí']) as [string, string];

export function BoletinView() {
  const bt = useBoletin();
  useEffect(() => { if (!useBoletin.getState().visit) useBoletin.getState().start(); }, []);
  const [manual, setManual] = useState(false);
  if (!bt.visit) return <div className="game bt"><p style={{ padding: 24 }}>Preparando la visita…</p></div>;
  const v = bt.visit;
  const stage = bt.stage ?? 'visita';
  const [face, mtext] = mood((bt.minutes ?? 0) / v.budgetMin);
  return (
    <div className="game bt" data-stage={stage}>
      <header className="g-head">
        <div className="who"><span className="face">{stage === 'visita' ? v.clientEmoji : face}</span><div><b>{v.clientName}</b><small>El boletín · nivel {v.level}{stage === 'obra' ? ` · ${mtext}` : ''}</small></div></div>
        <div className="grow" />
        {stage === 'obra' && <div className="av-meters"><span title="Tiempo gastado / tiempo que el cliente aguanta">⏱ {hm(bt.minutes ?? 0)} / {hm(v.budgetMin)}</span></div>}
        <button className="ghost" onClick={() => setManual(true)}>📖 Manual</button>
      </header>
      {manual && <Manual onClose={() => setManual(false)} />}
      {stage === 'visita' && <Visita />}
      {stage === 'obra' && <Obra />}
      {stage === 'fin' && <Fin />}
    </div>
  );
}

/* ───────── Visita ───────── */
function Visita() {
  const bt = useBoletin();
  const v = bt.visit!;
  const house = houseOf(v.houseId);
  return (
    <div className="brief">
      <section className="order" aria-label="Encargo">
        <div className="order-top"><span className="num">Visita {v.seed}</span><span className="lvl">Nivel {v.level}</span></div>
        <h1>{v.clientName}</h1>
        <p className="quote">«{v.intro}»</p>
        <p className="lead">Tu trabajo hoy:</p>
        <ul className="reqs">
          <li><i aria-hidden />Verificar la instalación de {house.name.split('·')[0].trim().toLowerCase()}: continuidad, aislamiento, tierra y diferencial.</li>
          <li><i aria-hidden />Decidir si cada medida es apta según el reglamento.</li>
          <li><i aria-hidden />Firmar el boletín… o negarte a firmarlo si hay algún defecto.</li>
        </ul>
        <p className="foot">El cliente aguanta unos <b>{hm(v.budgetMin)}</b> antes de perder la paciencia. Cada ensayo y cada preparación gastan tiempo. Algunas instalaciones llevan defectos y otras están perfectas.</p>
        <div className="actions">
          <button className="primary" onClick={() => bt.setStage('obra')}>Empezar la verificación</button>
          <button onClick={() => bt.start()}>Otra visita</button>
          <span className="seg" role="group" aria-label="Nivel">{[1, 2, 3].map((l) => <button key={l} className={bt.level === l ? 'on' : ''} onClick={() => bt.start(undefined, l)}>Nivel {l}</button>)}</span>
        </div>
        <p className="note">Nivel 1: un defecto claro y avisos de los aparatos · Nivel 2: hay que preparar bien los ensayos · Nivel 3: defectos escondidos, valores justos… o ninguno.</p>
      </section>
      <aside className="blueprint-peek">
        <div className="bt-cartoon" aria-hidden>📋🔌🔍</div>
        <dl className="career">
          <div><dt>Visitas</dt><dd>{bt.career.visitas}</dd></div>
          <div><dt>Mejor nota</dt><dd>{fx(bt.career.best)}</dd></div>
          <div><dt>Media</dt><dd>{bt.career.visitas ? fx(bt.career.sum / bt.career.visitas) : '—'}</dd></div>
          <div><dt>Estrellas</dt><dd>{bt.career.stars}</dd></div>
        </dl>
      </aside>
    </div>
  );
}

/* ───────── Instrumentos ───────── */
/** Medidor analógico con aguja (escala logarítmica). */
function Gauge({ value, min, max, unit, color, label }: { value: number | null; min: number; max: number; unit: string; color: string; label: string }) {
  const f = value === null ? 0 : Math.min(1, Math.max(0, (Math.log10(Math.max(value, min)) - Math.log10(min)) / (Math.log10(max) - Math.log10(min))));
  const ang = -70 + 140 * f;
  const ticks = Array.from({ length: 7 }, (_, i) => -70 + (140 * i) / 6);
  return (
    <svg viewBox="0 0 200 118" className="bt-gauge" role="img" aria-label={label}>
      <rect x="2" y="2" width="196" height="114" rx="14" fill={color} stroke="#1d1a17" strokeWidth="3" />
      <rect x="12" y="12" width="176" height="80" rx="8" fill="#f4ecd2" stroke="#1d1a17" strokeWidth="1.5" />
      {ticks.map((a, i) => <line key={i} x1={100 + 62 * Math.sin((a * Math.PI) / 180)} y1={96 - 62 * Math.cos((a * Math.PI) / 180)} x2={100 + 70 * Math.sin((a * Math.PI) / 180)} y2={96 - 70 * Math.cos((a * Math.PI) / 180)} stroke="#1d1a17" strokeWidth="1.6" />)}
      <text x="100" y="40" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1d1a17">{unit}</text>
      <g style={{ transform: `rotate(${ang}deg)`, transformOrigin: '100px 96px', transition: 'transform .9s cubic-bezier(.3,1.4,.5,1)' }}><line x1="100" y1="96" x2="100" y2="30" stroke="#c4271a" strokeWidth="2.4" strokeLinecap="round" /></g>
      <circle cx="100" cy="96" r="5" fill="#1d1a17" />
      <text x="100" y="110" textAnchor="middle" fontSize="8" fontWeight="800" letterSpacing="2" fill="#1d1a17">{label}</text>
    </svg>
  );
}

function Obra() {
  const bt = useBoletin();
  const v = bt.visit!;
  const [tab, setTab] = useState<TestKind>('aislamiento');
  const [circ, setCirc] = useState(v.truth.circuits[0].id);
  const [pair, setPair] = useState<Pair>('LPE');
  const [volts, setVolts] = useState(500);
  const [dist, setDist] = useState(10);
  const [rcd, setRcd] = useState(v.truth.rcds[0].id);
  const [running, setRunning] = useState(false);
  const [confirm, setConfirm] = useState<null | 'firmar' | 'negarse'>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (!v.truth.circuits.some((c) => c.id === circ)) setCirc(v.truth.circuits[0].id); }, [v, circ]);
  const prep = bt.prep!, pending = bt.pending, log = bt.log ?? [];
  const hints = v.level === 1;
  const doneKeys = new Set(log.filter((e) => e.valid).map((e) => e.key));

  const run = () => {
    if (running) return;
    setRunning(true);
    timer.current = setTimeout(() => {
      bt.test(tab, { target: tab === 'diferencial' ? rcd : tab === 'tierra' ? 'tierra' : circ, pair: tab === 'aislamiento' ? pair : undefined, volts: tab === 'aislamiento' ? volts : undefined, distance: dist });
      setRunning(false);
    }, 900);
  };
  const prepRows: { k: keyof Prep; label: string; on: string; off: string; show: boolean }[] = [
    { k: 'igaOpen', label: 'Interruptor general (IGA)', on: 'Abierto · sin tensión', off: 'Cerrado · con tensión', show: true },
    { k: 'receptorsOff', label: 'Receptores', on: 'Desconectados', off: 'Conectados', show: true },
    { k: 'spdOff', label: 'Limitador de sobretensiones', on: 'Desconectado', off: 'Conectado', show: v.truth.spd },
    { k: 'leadsNulled', label: 'Puntas del medidor', on: 'Anuladas (cero)', off: 'Sin anular', show: tab === 'continuidad' },
    { k: 'earthLinkOpen', label: 'Pica de tierra', on: 'Separada de la instalación', off: 'Unida a la instalación', show: tab === 'tierra' },
  ];
  const tabs: { id: TestKind; label: string; icon: string }[] = [{ id: 'aislamiento', label: 'Aislamiento', icon: '🟡' }, { id: 'continuidad', label: 'Continuidad', icon: '〰' }, { id: 'tierra', label: 'Tierra', icon: '🟢' }, { id: 'diferencial', label: 'Diferencial', icon: '⚪' }];
  const color = tab === 'aislamiento' ? '#f2c21a' : tab === 'continuidad' ? '#e9a23b' : tab === 'tierra' ? '#6cc24a' : '#cfd6df';
  const r = pending?.reading;
  const needle = r && r.value !== null ? r.value : null;
  const range = tab === 'aislamiento' ? { min: 0.01, max: 1000, unit: 'MΩ' } : tab === 'continuidad' ? { min: 0.05, max: 200, unit: 'Ω' } : tab === 'tierra' ? { min: 1, max: 10000, unit: 'Ω' } : { min: 1, max: 100, unit: 'mA' };
  const chips = tab === 'diferencial' ? v.truth.rcds.map((x) => x.id) : v.truth.circuits.map((c) => c.id);

  return (
    <div className="bt-bench">
      <section className="bt-col bt-prep">
        <div className="paper"><h2>Preparación de la instalación</h2>
          <ul className="bt-toggles">{prepRows.filter((p) => p.show).map((p) => (
            <li key={p.k}><button className={`bt-sw ${prep[p.k] ? 'on' : ''}`} aria-pressed={prep[p.k]} onClick={() => bt.togglePrep(p.k)}><i /><span><b>{p.label}</b><small>{prep[p.k] ? p.on : p.off} · {PREP_COST[p.k]} min</small></span></button></li>
          ))}</ul>
          <p className="note">Cada ensayo pide unas condiciones. Si no sabes cuáles, abre el 📖 Manual.</p>
        </div>
        <div className="paper"><h2>Plan de verificación <span className="chip">{v.required.filter((q) => doneKeys.has(q.key)).length}/{v.required.length}</span></h2>
          <ul className="ticks bt-plan">{v.required.map((q) => <li key={q.key} className={doneKeys.has(q.key) ? 'ok' : ''}><i>{doneKeys.has(q.key) ? '✓' : ''}</i><span>{q.label}</span></li>)}</ul>
        </div>
      </section>

      <section className="bt-col bt-inst">
        <div className="bt-tabs" role="tablist" aria-label="Instrumento">{tabs.map((t) => <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => { setTab(t.id); bt.discard(); }}><span>{t.icon}</span> {t.label}</button>)}</div>
        <div className="paper bt-device">
          <Gauge value={needle} min={range.min} max={range.max} unit={range.unit} color={color} label={tab === 'aislamiento' ? 'MEGÓHMETRO' : tab === 'continuidad' ? 'CONTINUIDAD' : tab === 'tierra' ? 'TELURÓMETRO' : 'COMPROBADOR RCD'} />
          <div className="bt-lcd" aria-live="polite">{running ? '· · ·' : r ? (r.danger ? '⚠' : r.text) : '——'}<small>{r && !r.danger ? r.unit : ''}</small></div>
          {tab !== 'tierra' && <div className="bt-chips" role="group" aria-label={tab === 'diferencial' ? 'Diferencial' : 'Circuito'}>{chips.map((c) => <button key={c} className={(tab === 'diferencial' ? rcd : circ) === c ? 'on' : ''} onClick={() => { tab === 'diferencial' ? setRcd(c) : setCirc(c); bt.discard(); }}>{c}</button>)}</div>}
          {tab === 'aislamiento' && <>
            <div className="bt-chips" role="group" aria-label="Pareja de conductores">{(['LPE', 'NPE', 'LN'] as Pair[]).map((p) => <button key={p} className={pair === p ? 'on' : ''} onClick={() => setPair(p)}>{PAIR_LABEL[p]}</button>)}</div>
            <div className="bt-chips" role="group" aria-label="Tensión de ensayo">{[250, 500, 1000].map((x) => <button key={x} className={volts === x ? 'on' : ''} onClick={() => setVolts(x)}>{x} V</button>)}</div>
          </>}
          {tab === 'tierra' && <label className="bt-dist">Distancia de las picas auxiliares: <b>{dist} m</b><input type="range" min={5} max={40} step={1} value={dist} onChange={(e) => setDist(Number(e.target.value))} aria-label="Distancia de las picas" />
            <svg viewBox="0 0 220 40" aria-hidden><line x1="14" y1="20" x2="206" y2="20" stroke="#6b6358" strokeDasharray="3 3" /><circle cx="14" cy="20" r="6" fill="#6cc24a" /><circle cx={14 + (dist / 40) * 96} cy="20" r="5" fill="#2a2622" /><circle cx={14 + (dist / 40) * 192} cy="20" r="5" fill="#2a2622" /><text x="14" y="38" fontSize="9" textAnchor="middle">pica</text></svg></label>}
          <button className="bt-test" onClick={run} disabled={running} aria-label="Realizar el ensayo">{running ? 'Midiendo…' : '● TEST'}</button>
        </div>
        {pending && <Result p={pending} hints={hints} />}
      </section>

      <section className="bt-col bt-log">
        <div className="paper"><h2>Libro del boletín <span className="chip">{log.length}</span></h2>
          {!log.length && <p className="note">Aquí anotas cada medida con tu juicio: apto o no apto.</p>}
          <ul className="bt-entries">{log.map((e, i) => <li key={i} className={e.studentApto ? 'ok' : 'ko'}><b>{e.studentApto ? '✓ APTO' : '✗ NO APTO'}</b><span>{e.desc}</span><em>{e.text} {e.unit}</em></li>)}</ul>
        </div>
        <div className="paper bt-sign">
          <h2>La firma</h2>
          {!confirm ? (
            <div className="bt-signbtns"><button className="primary" onClick={() => setConfirm('firmar')}>🖊 Firmar el boletín</button><button className="bt-refuse" onClick={() => setConfirm('negarse')}>✋ Negarme a firmar</button></div>
          ) : (
            <div className="bt-confirm"><p><b>{confirm === 'firmar' ? '¿Firmas que la instalación es segura y cumple el reglamento?' : '¿Te niegas a firmar porque hay algún defecto?'}</b></p><div className="nextrow"><button onClick={() => setConfirm(null)}>Todavía no</button><button className="primary" onClick={() => bt.finish(confirm)}>{confirm === 'firmar' ? 'Sí, firmo' : 'Sí, me niego'}</button></div></div>
          )}
          <p className="note">Tienes {log.length} medida(s) anotada(s) y {v.required.filter((q) => !doneKeys.has(q.key)).length} verificación(es) por hacer bien.</p>
        </div>
      </section>
    </div>
  );
}

function Result({ p, hints }: { p: Pending; hints: boolean }) {
  const bt = useBoletin();
  const r = p.reading;
  if (r.danger) return <div className="paper bt-res danger" role="alert"><h2>⚠ ¡Cuidado!</h2><p>{r.danger}</p><div className="nextrow"><button className="primary" onClick={() => bt.discard()}>Entendido</button></div></div>;
  const limit = p.kind === 'aislamiento' ? `Mínimo reglamentario: ${String(RULES.iso.minMOhm).replace('.', ',')} MΩ a ${RULES.iso.testV} V.` : p.kind === 'continuidad' ? `Umbral del juego: ≤ ${RULES.pe.maxOhm} Ω.` : p.kind === 'tierra' ? `Máximo con 30 mA: ${Math.round(maxEarthOhm())} Ω.` : `Debe disparar entre ${RULES.rcd.inmA * RULES.rcd.minFrac} y ${RULES.rcd.inmA} mA, en ≤ ${RULES.rcd.maxT1} ms (IΔn) y ≤ ${RULES.rcd.maxT5} ms (5·IΔn).`;
  return (
    <div className="paper bt-res">
      <h2>Resultado</h2>
      <p className="bt-desc">{p.desc}</p>
      <div className="bt-big">{r.text} <small>{r.unit}</small></div>
      {r.extra && p.kind === 'diferencial' && <ul className="bt-extra"><li>Dispara con <b>{r.extra.dispara}</b></li><li>Tiempo con IΔn: <b>{r.extra.t1}</b></li><li>Tiempo con 5·IΔn: <b>{r.extra.t5}</b></li></ul>}
      {hints && <p className="av-tip">{limit}</p>}
      {hints && r.notes.map((n, i) => <p key={i} className="av-tip warn">⚠ {n}</p>)}
      <p className="note">¿Es apto según el reglamento?</p>
      <div className="bt-judge"><button className="bt-ok" onClick={() => bt.judge(true)}>✅ APTO</button><button className="bt-ko" onClick={() => bt.judge(false)}>❌ NO APTO</button><button onClick={() => bt.discard()}>Descartar y repetir</button></div>
    </div>
  );
}

/* ───────── Manual ───────── */
function Manual({ onClose }: { onClose: () => void }) {
  const [id, setId] = useState(MANUAL[0].id);
  const page = MANUAL.find((m) => m.id === id)!;
  return createPortal(
    <div className="modal-back" role="dialog" aria-modal="true" aria-label="Manual del instalador">
      <div className="bt-manual">
        <header><h2>📖 Manual del instalador</h2><button className="ghost" onClick={onClose}>Cerrar</button></header>
        <div className="bt-mbody">
          <nav aria-label="Capítulos">{MANUAL.map((m) => <button key={m.id} className={m.id === id ? 'on' : ''} onClick={() => setId(m.id)}><span>{m.icon}</span> {m.title}</button>)}</nav>
          <article>
            <h3>{page.icon} {page.title}</h3>
            {page.paras.map((t, i) => <p key={i}>{t}</p>)}
            {page.checklist && <ul className="bt-mlist">{page.checklist.map((c, i) => <li key={i}>{c}</li>)}</ul>}
            {page.values && <dl className="bt-mvals">{page.values.map((x) => <div key={x.label}><dt>{x.label}</dt><dd>{x.value}</dd></div>)}</dl>}
            {page.source && <p className="note">⚠ Valores del juego, sin verificar con el BOE: {page.source}</p>}
          </article>
        </div>
      </div>
    </div>, document.body);
}

/* ───────── Boletín final ───────── */
function Fin() {
  const bt = useBoletin();
  const v = bt.visit!, sc = bt.score!;
  const house = houseOf(v.houseId);
  const log = bt.log ?? [];
  const signed = bt.decision === 'firmar';
  const correct = signed === (v.defects.length === 0);
  const print = () => { document.body.classList.add('print-parte'); window.print(); setTimeout(() => document.body.classList.remove('print-parte'), 500); };
  const defectRows = useMemo(() => v.defects.map((d) => ({ d, def: defectOf(d.defect), found: sc.found.includes(d.defect) })), [v, sc]);
  return (
    <div className="av-parte-wrap">
      <article className="parte bt-bol" aria-label="Boletín de verificación">
        <header><div><small>CircuitosSEA · Sistemas Electrotécnicos y Automatizados</small><h1>Boletín de verificación</h1></div><div className="nota"><b>{fx(sc.total)}</b><span>/ 10</span><i>{'★'.repeat(sc.stars)}{'☆'.repeat(3 - sc.stars)}</i></div></header>
        <label className="p-name no-print">Nombre del alumno <input value={bt.student ?? ''} onChange={(e) => bt.setStudent(e.target.value)} placeholder="Nombre y apellidos" /></label>
        <div className={`bt-stamp ${signed ? 'sig' : 'ref'}`} aria-label={signed ? 'Firmado' : 'No firmado'}>{signed ? 'FIRMADO' : 'NO FIRMADO'}</div>
        <dl className="p-grid"><dt>Alumno</dt><dd>{bt.student || '—'}</dd><dt>Fecha</dt><dd>{new Date().toLocaleDateString('es-ES')}</dd><dt>Cliente</dt><dd>{v.clientName}</dd><dt>Vivienda</dt><dd>{house.name}</dd><dt>Nivel</dt><dd>{v.level}</dd><dt>Tiempo</dt><dd>{hm(bt.minutes ?? 0)}</dd></dl>
        <h2>Veredicto</h2>
        <p className={correct ? 'bt-verd ok' : 'bt-verd ko'}>{correct ? (signed ? '✅ Instalación correcta: has firmado con razón.' : '✅ Había defectos y te has negado a firmar. Bien hecho.') : (signed ? '❌ Firmaste una instalación con defectos.' : '❌ La instalación estaba bien y te negaste a firmar.')}</p>
        <h2>Lo que había en la instalación</h2>
        {!defectRows.length ? <p>Estaba <b>perfecta</b>: ningún defecto.</p> : <ul className="bt-defs">{defectRows.map(({ d, def, found }) => <li key={d.defect + d.target} className={found ? 'found' : 'missed'}><b>{found ? '🔎 Lo encontraste' : '🙈 Se te escapó'} · {def.title}</b> <small>({d.target === 'tierra' ? 'puesta a tierra' : d.target})</small><span><b>Causa:</b> {def.cause}</span><span>{def.explain}</span><span><b>Arreglo:</b> {def.fix}</span></li>)}</ul>}
        <h2>Medidas anotadas ({log.length})</h2>
        {log.length ? <table className="p-t"><thead><tr><th>Ensayo</th><th>Lectura</th><th>Tu juicio</th><th>Condiciones</th></tr></thead><tbody>{log.map((e, i) => <tr key={i}><td>{e.desc}</td><td>{e.text} {e.unit}</td><td>{e.studentApto ? 'Apto' : 'No apto'}</td><td>{e.valid ? <span className={e.truthApto === e.studentApto ? 'ok' : 'bad'}>{e.truthApto === e.studentApto ? 'válida · juicio correcto' : 'válida · juicio erróneo'}</span> : <span className="bad" title={e.notes.join(' ')}>⚠ inválida</span>}</td></tr>)}</tbody></table> : <p>Ninguna.</p>}
        {log.some((e) => !e.valid) && <ul className="p-notes">{[...new Set(log.filter((e) => !e.valid).flatMap((e) => e.notes))].map((n, i) => <li key={i}>{n}</li>)}</ul>}
        <h2>Valoración</h2>
        <table className="p-t"><tbody><tr><td>Decisión</td><td>{fx(sc.decision)} / 3</td></tr><tr><td>Hallazgos</td><td>{fx(sc.findings)} / 2</td></tr><tr><td>Juicio de las medidas</td><td>{fx(sc.judgment)} / 2</td></tr><tr><td>Cobertura de verificaciones</td><td>{fx(sc.coverage)} / 1,5</td></tr><tr><td>Seguridad</td><td>{fx(sc.safety)} / 1</td></tr><tr><td>Tiempo</td><td>{fx(sc.time)} / 0,5</td></tr></tbody></table>
        <ul className="p-notes">{sc.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
      </article>
      <div className="av-parte-actions no-print"><button className="primary" onClick={print}>Descargar PDF</button><button onClick={() => bt.start()}>Siguiente visita</button><button onClick={() => bt.start(v.seed, v.level)}>Repetir esta visita</button></div>
    </div>
  );
}
