/**
 * Juego «Parte de avería»: el cliente llama con un síntoma; el alumno diagnostica con el polímetro sobre el esquema
 * del circuito afectado, formula una hipótesis, repara, comprueba y entrega el parte (PDF).
 * Reutiliza el lienzo, el polímetro y el motor de siempre: la avería es un circuito simulado con un componente oculto.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore, saveGuard } from '../store';
import { Canvas } from './Canvas';
import { readMeter, pointName, type Dial } from '../model/meter';
import type { SimResult } from '../model/netlist';
import type { Project } from '../model/types';
import { houseOf } from '../game/houses';
import { rng } from '../game/clients';
import { FAULTS, REPAIRS, faultOf, pointsOf, repairOf, type Setup } from '../averias/catalog';
import { TOGGLEABLE, buildProject, clampOptions, clampReading, extraEvents, settle } from '../averias/model';
import { useAveria, averiaStash, type AStage } from '../averias/store';
import { PIA_RATINGS, SECTIONS_GAME } from '../game/data';
import { admissible } from '../model/cables';
import { Avatar } from './icons';
import './averias.css';

const eur = (v: number) => `${Math.round(v).toLocaleString('es-ES')} €`;
const hm = (m: number) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
const DIAL_LABEL: Record<Dial, string> = { off: 'OFF', V: 'V⎓', Vac: 'V~', A: 'A⎓', Aac: 'A~', ohm: 'Ω', cont: 'Continuidad' };
const STEPS: { id: AStage; label: string }[] = [{ id: 'aviso', label: 'Aviso' }, { id: 'diag', label: 'Diagnóstico' }, { id: 'hipotesis', label: 'Hipótesis' }, { id: 'reparacion', label: 'Reparación' }, { id: 'parte', label: 'Parte' }];
const ENERGIZED = (p: Project) => p.components.find((c) => c.id === 'IGA')?.params.closed !== false;

export function AveriaView({ sim }: { sim: SimResult }) {
  const av = useAveria();
  const st = useStore();
  const stash = useRef<{ project: Project; labels: boolean } | null>(null);
  const loaded = useRef<{ key: string; toggles: Record<string, unknown> } | null>(null);

  // Al entrar se guarda el circuito del alumno y se deja de autoguardar; al salir se restaura.
  useEffect(() => {
    const s = useStore.getState();
    stash.current = { project: s.project, labels: s.showLabels };
    averiaStash.project = s.project;
    saveGuard.suspended = true;
    useStore.setState({ showLabels: false });
    if (!s.inst.meter.open) s.toggleInst('meter');
    s.moveInst('meter', 12, 250);
    if (!useAveria.getState().sc) useAveria.getState().start();
    return () => {
      saveGuard.suspended = false;
      if (stash.current) { useStore.getState().load(averiaStash.project ?? stash.current.project); averiaStash.project = null; useStore.setState({ showLabels: stash.current.labels }); }
    };
  }, []);

  // Cada caso (o reparación) genera el circuito en el lienzo, conservando los interruptores accionados
  const caseKey = av.sc ? `${av.sc.seed}:${av.sc.level}:${JSON.stringify(av.case)}` : '';
  useEffect(() => {
    if (!av.sc || !av.case) return;
    const same = loaded.current?.key.split(':').slice(0, 2).join(':') === `${av.sc.seed}:${av.sc.level}`;
    const proj = buildProject(av.case, same ? useStore.getState().project : undefined);
    const s = useStore.getState();
    s.load(proj);
    useStore.setState({ runtime: settle(proj), showLabels: false });
    loaded.current = { key: caseKey, toggles: toggleSnapshot(proj) };
  }, [caseKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // IGA de dos polos: el neutro sigue a la fase. Cada maniobra cuesta un minuto.
  useEffect(() => {
    const iga = st.project.components.find((c) => c.id === 'IGA'), ign = st.project.components.find((c) => c.id === 'IGAN');
    if (iga && ign && iga.params.closed !== ign.params.closed) useStore.getState().setParam('IGAN', 'closed', Boolean(iga.params.closed));
    if (!loaded.current) return;
    const now = toggleSnapshot(st.project);
    const prev = loaded.current.toggles;
    const changed = Object.keys(now).some((k) => k in prev && prev[k] !== now[k] && k !== 'IGAN');
    if (changed) av.addMinutes(1);
    loaded.current.toggles = now;
  }, [st.project]); // eslint-disable-line react-hooks/exhaustive-deps

  // Protecciones que el motor no modela (térmico y diferencial)
  useEffect(() => {
    if (!av.sc) return;
    const ev = extraEvents(sim, st.project, st.runtime);
    if (ev.length) useStore.getState().applyEvents(ev);
  }, [sim]); // eslint-disable-line react-hooks/exhaustive-deps

  // Seguridad: continuidad con tensión y fusible del polímetro fundido
  const live = ENERGIZED(st.project);
  const m = st.meter;
  useEffect(() => {
    if (av.stage === 'parte' || !av.sc) return;
    if ((m.dial === 'ohm' || m.dial === 'cont') && m.red && m.black && live) av.flagUnsafe('Mediste resistencia o continuidad con la instalación en tensión.');
  }, [m.dial, m.red, m.black, live]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (m.fuseBlown && av.sc) av.flagUnsafe('Mediste intensidad en paralelo: se fundió el fusible del polímetro.'); }, [m.fuseBlown]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!av.sc) return <div className="game av"><p style={{ padding: 24 }}>Preparando el aviso…</p></div>;
  const sc = av.sc;
  const stage = av.stage ?? 'aviso';
  const solved = (av.attempts ?? []).some((a) => a.ok);
  const go = (s: AStage) => {
    if (s === 'reparacion' && !solved) return;
    if (s === 'parte' && !av.score) return;
    av.setStage(s);
  };

  return (
    <div className="game av" data-stage={stage}>
      <header className="g-head">
        <div className="who"><Avatar name={sc.clientName} /><div><b>{sc.clientName}</b><small>Parte de avería · nivel {sc.level}</small></div></div>
        <nav className="steps" aria-label="Fases del parte">
          {STEPS.map((s) => <button key={s.id} className={stage === s.id ? 'on' : ''} disabled={(s.id === 'reparacion' && !solved) || (s.id === 'parte' && !av.score)} onClick={() => go(s.id)}>{s.label}</button>)}
        </nav>
        <div className="grow" />
        {stage !== 'aviso' && <div className="av-meters"><span title="Tiempo de trabajo acumulado">⏱ {hm(av.minutes ?? 0)}</span><span title="Coste de las reparaciones">🔧 {eur((av.repairs ?? []).reduce((a, r) => a + r.cost, 0))}</span></div>}
      </header>
      {stage === 'aviso' && <Aviso />}
      {stage === 'parte' && <Parte />}
      {(stage === 'diag' || stage === 'hipotesis' || stage === 'reparacion') && (
        <div className="av-bench">
          <div className="av-canvas">
            <Canvas sim={sim} locked canToggle={TOGGLEABLE} />
            <div className="av-hint">Clic en el IGA, los enchufes y los conmutadores para accionarlos · arrastra las puntas del polímetro a los bornes · con el IGA abierto no hay tensión.</div>
          </div>
          <aside className="av-side">
            {stage === 'diag' && <Diag sim={sim} />}
            {stage === 'hipotesis' && <Hipotesis />}
            {stage === 'reparacion' && <Reparacion />}
          </aside>
        </div>
      )}
    </div>
  );
}

function toggleSnapshot(p: Project) {
  const o: Record<string, unknown> = {};
  for (const c of p.components) if (c.id === 'IGA' || c.id === 'IGAN' || /^P\d+$/.test(c.id) || c.id === 'S1' || c.id === 'S2') o[c.id] = c.params.closed ?? c.params.pos;
  return o;
}

/* ───────── Aviso ───────── */
function MiniPlan({ houseId }: { houseId: string }) {
  const h = houseOf(houseId);
  const x0 = h.ox - 0.5, y0 = h.oy - 0.5, W = h.w + 1, H = h.h + 1;
  return (
    <svg viewBox={`${x0} ${y0} ${W} ${H}`} className="av-mini" role="img" aria-label={`Plano de ${h.name}`}>
      {h.bg && <image href={h.bg.src} x={0} y={0} width={h.bg.w} height={h.bg.h} preserveAspectRatio="none" opacity={0.4} />}
      {h.rooms.map((r) => <g key={r.id}><rect x={r.x} y={r.y} width={r.w} height={r.h} fill="rgba(214,232,255,.07)" stroke="#d6e8ff" strokeWidth={0.08} strokeDasharray={r.outdoor ? '0.3 0.2' : undefined} /><text x={r.x + r.w / 2} y={r.y + r.h / 2} fontSize={0.38} textAnchor="middle" fill="#d6e8ff">{r.name.split(' ')[0]}</text></g>)}
    </svg>
  );
}

function Aviso() {
  const av = useAveria();
  const sc = av.sc!;
  const house = houseOf(sc.houseId);
  return (
    <div className="brief">
      <section className="order" aria-label="Aviso del cliente">
        <div className="order-top"><span className="num">Aviso {sc.seed}</span><span className="lvl">Nivel {sc.level}</span></div>
        <h1>{sc.clientName}</h1>
        <p className="lead">Llama por teléfono y dice:</p>
        <p className="quote">{sc.symptom}</p>
        <p className="foot">Vivienda: {house.name}. La instalación la montasteis vosotros hace tiempo y estaba bien. Toca diagnosticar, reparar y entregar el parte.</p>
        <div className="actions">
          <button className="primary" onClick={() => av.setStage('diag')}>Ir a la vivienda</button>
          <button onClick={() => av.start()}>Otro aviso</button>
          <span className="seg" role="group" aria-label="Nivel">{[1, 2, 3].map((l) => <button key={l} className={av.level === l ? 'on' : ''} onClick={() => av.start(undefined, l)}>Nivel {l}</button>)}</span>
        </div>
        <p className="note">Nivel 1: síntoma evidente · Nivel 2: hay que medir · Nivel 3: la avería no da síntoma claro.</p>
      </section>
      <aside className="blueprint-peek">
        <div className="peek av-plan"><MiniPlan houseId={sc.houseId} /></div>
        <dl className="career">
          <div><dt>Partes</dt><dd>{av.career.partes}</dd></div>
          <div><dt>Mejor nota</dt><dd>{av.career.best.toFixed(1).replace('.', ',')}</dd></div>
          <div><dt>Media</dt><dd>{av.career.partes ? (av.career.sum / av.career.partes).toFixed(1).replace('.', ',') : '—'}</dd></div>
          <div><dt>Estrellas</dt><dd>{av.career.stars}</dd></div>
        </dl>
      </aside>
    </div>
  );
}

/* ───────── Diagnóstico ───────── */
function Ficha({ s }: { s: Setup }) {
  return (
    <div className="paper">
      <h2>Ficha del circuito</h2>
      <dl className="av-ficha">
        <dt>Circuito</dt><dd>{s.circuit} · {s.circuitName}</dd>
        <dt>Magnetotérmico</dt><dd>{s.inA} A, curva C</dd>
        <dt>Diferencial</dt><dd>30 mA</dd>
        <dt>Línea</dt><dd>{s.length} m · {String(s.section).replace('.', ',')} mm² (admite {String(admissible(s.section)).replace('.', ',')} A)</dd>
        <dt>Receptores</dt><dd>{s.recs.map((r) => `${r.name} (${r.w} W)`).join(' · ')}</dd>
      </dl>
    </div>
  );
}

function Diag({ sim }: { sim: SimResult }) {
  const av = useAveria();
  const st = useStore();
  const reading = useMemo(() => readMeter(sim, st.meter, st.project), [sim, st.meter, st.project]);
  const mt = st.meter;
  const ready = mt.dial !== 'off' && !!mt.red && !!mt.black;
  const record = () => {
    if (!ready) return;
    av.record({ dial: DIAL_LABEL[mt.dial], from: pointName(st.project, mt.red), to: pointName(st.project, mt.black), text: reading.text, unit: reading.unit });
  };
  return (
    <>
      <div className="paper av-symptom"><h2>Síntoma</h2><p>{av.sc!.symptom}</p></div>
      <Ficha s={av.case!.setup} />
      <div className="paper">
        <h2>Medida actual</h2>
        <div className="av-read"><b>{ready ? `${reading.text} ${reading.unit}` : '—'}</b><span>{DIAL_LABEL[mt.dial]} · {pointName(st.project, mt.red)} → {pointName(st.project, mt.black)}</span></div>
        {reading.tips.slice(0, 2).map((t, i) => <p key={i} className={`av-tip ${t.level}`}>{t.text}</p>)}
        <div className="nextrow"><button className="primary" disabled={!ready} onClick={record}>Anotar medida (+3 min)</button></div>
        <p className="note">Solo cuentan las medidas que anotes: salen en el parte.</p>
      </div>
      <QuickMeter />
      <Pinza />
      <div className="paper">
        <h2>Medidas anotadas <span className="chip">{(av.measures ?? []).length}</span></h2>
        {!(av.measures ?? []).length && <p className="note">Todavía ninguna.</p>}
        <ul className="av-meas">{(av.measures ?? []).map((x, i) => <li key={i}><b>{x.text} {x.unit}</b><span>{x.dial} · {x.to ? `${x.from} → ${x.to}` : x.from}</span></li>)}</ul>
        <div className="nextrow">
          {Object.keys(st.runtime).length > 0 && <button onClick={() => { st.resetRuntime(); av.addMinutes(1); }}>Rearmar protecciones</button>}
          <button className="primary" onClick={() => av.setStage('hipotesis')}>Ya sé qué es</button>
        </div>
      </div>
    </>
  );
}

/* ───────── Polímetro rápido (móvil): la rueda y las puntas sin la ventana flotante ───────── */
const QUICK_DIALS: Dial[] = ['Vac', 'V', 'ohm', 'cont', 'Aac', 'A', 'off'];
function QuickMeter() {
  const st = useStore();
  const mt = st.meter;
  return (
    <div className="paper av-quick">
      <h2>Polímetro</h2>
      <label className="av-field">Función
        <select value={mt.dial} onChange={(e) => { const d = e.target.value as Dial; st.setMeter({ dial: d, jack: d === 'A' || d === 'Aac' ? '10A' : 'VOhm' }); }} aria-label="Función del polímetro">{QUICK_DIALS.map((d) => <option key={d} value={d}>{DIAL_LABEL[d]}</option>)}</select>
      </label>
      <div className="av-row">
        <button className={mt.armed === 'red' ? 'on' : ''} onClick={() => st.setMeter({ armed: mt.armed === 'red' ? null : 'red' })}>🔴 Punta roja</button>
        <button className={mt.armed === 'black' ? 'on' : ''} onClick={() => st.setMeter({ armed: mt.armed === 'black' ? null : 'black' })}>⚫ Punta negra</button>
      </div>
      <p className="note">{mt.armed ? 'Toca ahora un borne del esquema.' : `Roja: ${pointName(st.project, mt.red)} · Negra: ${pointName(st.project, mt.black)}`}</p>
    </div>
  );
}

/* ───────── Pinza amperimétrica ───────── */
function Pinza() {
  const av = useAveria();
  const st = useStore();
  const opts = clampOptions(av.case!);
  const [id, setId] = useState('LL');
  const sel = opts.find((o) => o.id === id) ?? opts[0];
  const amps = useMemo(() => clampReading(st.project, sel.id), [st.project, sel.id]);
  const text = amps >= 1 ? `${amps.toFixed(amps >= 100 ? 0 : 2).replace('.', ',')} A` : `${(amps * 1000).toFixed(amps * 1000 >= 100 ? 0 : 1).replace('.', ',')} mA`;
  return (
    <div className="paper">
      <h2>Pinza amperimétrica</h2>
      <svg viewBox="0 0 120 56" className="av-clamp" role="img" aria-label="Pinza amperimétrica"><rect x="2" y="2" width="116" height="52" rx="10" fill="#f2c21a" stroke="#2a2622" strokeWidth="2" /><circle cx="36" cy="26" r="15" fill="#fff" stroke="#2a2622" strokeWidth="3" /><rect x="56" y="12" width="52" height="22" rx="4" fill="#0f1d12" /><text x="82" y="29" textAnchor="middle" fontSize="13" fontFamily="ui-monospace,monospace" fill="#9be58a">{text.length > 8 ? text.replace(' ', '') : text}</text></svg>
      <label className="av-field">Rodea con la pinza
        <select value={sel.id} onChange={(e) => setId(e.target.value)} aria-label="Dónde poner la pinza">{opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select>
      </label>
      <div className="av-read"><b>{text}</b><span>Pinza · {sel.label}</span></div>
      <p className="note">No toca el circuito, no hay fusible que fundir. Mide como si acabaras de rearmar las protecciones (instante inicial). Con el IGA abierto no circula nada.</p>
      <div className="nextrow"><button className="primary" onClick={() => av.record({ dial: 'Pinza', from: sel.label, to: '', text: text.replace(/ (m?A)$/, ''), unit: /mA$/.test(text) ? 'mA' : 'A' })}>Anotar medida (+3 min)</button></div>
    </div>
  );
}

/* ───────── Hipótesis ───────── */
function Hipotesis() {
  const av = useAveria();
  const sc = av.sc!;
  const causes = useMemo(() => {
    const r = rng(sc.seed + 31);
    const others = FAULTS.filter((f) => f.id !== sc.faultId).map((f) => ({ f, k: r() })).sort((a, b) => a.k - b.k).slice(0, 5).map((x) => x.f);
    return [...others, faultOf(sc.faultId)].map((f) => ({ f, k: r() })).sort((a, b) => a.k - b.k).map((x) => x.f);
  }, [sc.seed, sc.faultId]);
  const points = pointsOf(av.case!.setup);
  const [cause, setCause] = useState('');
  const [point, setPoint] = useState('');
  const last = (av.attempts ?? []).slice(-1)[0];
  return (
    <>
      <div className="paper"><h2>¿Cuál es la causa?</h2>
        <div className="av-radios" role="radiogroup" aria-label="Causa">{causes.map((f) => <label key={f.id} className={cause === f.id ? 'on' : ''}><input type="radio" name="cause" checked={cause === f.id} onChange={() => setCause(f.id)} />{f.cause}</label>)}</div>
      </div>
      <div className="paper"><h2>¿Dónde está?</h2>
        <select value={point} onChange={(e) => setPoint(e.target.value)} aria-label="Punto de la instalación" className="av-select"><option value="">Elige un punto…</option>{points.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
        {last && !last.ok && <p className="alert">No concuerda con lo que se ve en la instalación. Revisa tus medidas (cuesta 5 min).</p>}
        <div className="nextrow"><button onClick={() => av.setStage('diag')}>Volver a medir</button><button className="primary" disabled={!cause || !point} onClick={() => av.guess(cause, point)}>Comprobar hipótesis</button></div>
        <p className="note">Intentos: {(av.attempts ?? []).length}. Acertar a la primera da más nota.</p>
      </div>
    </>
  );
}

/* ───────── Reparación ───────── */
function Reparacion() {
  const av = useAveria();
  const st = useStore();
  const s = av.case!.setup;
  const points = pointsOf(s);
  const energized = ENERGIZED(st.project);
  const [sel, setSel] = useState<Record<string, { target?: string; param?: number }>>({});
  const done = av.repairs ?? [];
  return (
    <>
      {energized && <p className="alert">El IGA está cerrado: abre el IGA antes de tocar conexiones o piezas (si no, cuenta como manipular con tensión).</p>}
      <div className="paper"><h2>Reparaciones</h2>
        <ul className="av-rep">{REPAIRS.map((r) => {
          const tg = points.filter((p) => r.targets(p.id));
          if (!tg.length) return null;
          const cur = sel[r.id] ?? {};
          const target = cur.target ?? tg[0].id;
          const param = cur.param ?? (r.param === 'calibre' ? s.inA : r.param === 'seccion' ? s.section : undefined);
          return (
            <li key={r.id}>
              <b>{r.name}</b><small>{r.help}</small>
              <div className="av-row">
                {tg.length > 1 && <select value={target} onChange={(e) => setSel({ ...sel, [r.id]: { ...cur, target: e.target.value } })} aria-label={`Dónde: ${r.name}`}>{tg.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select>}
                {r.param === 'calibre' && <select value={param} onChange={(e) => setSel({ ...sel, [r.id]: { ...cur, param: Number(e.target.value) } })} aria-label="Calibre">{PIA_RATINGS.map((v) => <option key={v} value={v}>{v} A</option>)}</select>}
                {r.param === 'seccion' && <select value={param} onChange={(e) => setSel({ ...sel, [r.id]: { ...cur, param: Number(e.target.value) } })} aria-label="Sección">{SECTIONS_GAME.map((v) => <option key={v} value={v}>{String(v).replace('.', ',')} mm²</option>)}</select>}
                <button onClick={() => av.repair(r.id, target, param, energized)}>Aplicar · {eur(r.cost(s, param))} · {r.minutes} min</button>
              </div>
            </li>
          );
        })}</ul>
      </div>
      <div className="paper"><h2>Hecho hasta ahora <span className="chip">{done.length}</span></h2>
        {!done.length && <p className="note">Nada todavía.</p>}
        <ul className="av-meas">{done.map((d, i) => <li key={i}><b>{repairOf(d.repair).name}</b><span>{points.find((p) => p.id === d.target)?.label ?? d.target}{d.param ? ` · ${d.param}` : ''} · {eur(d.cost)}</span></li>)}</ul>
        {(av.failed ?? []).length > 0 && <div className="alert"><b>Todavía no está bien:</b><ul>{(av.failed ?? []).map((p, i) => <li key={i}>{p}</li>)}</ul></div>}
        <div className="nextrow"><button onClick={() => av.setStage('diag')}>Volver a medir</button><button className="primary" onClick={() => av.check()}>Comprobar la instalación (+5 min)</button></div>
      </div>
    </>
  );
}

/* ───────── Parte ───────── */
function Parte() {
  const av = useAveria();
  const sc = av.sc!;
  const f = faultOf(sc.faultId);
  const sco = av.score!;
  const points = pointsOf(sc.case.setup);
  const total = (av.repairs ?? []).reduce((a, r) => a + r.cost, 0);
  const fx = (n: number) => n.toFixed(1).replace('.', ',');
  const print = () => { document.body.classList.add('print-parte'); window.print(); setTimeout(() => document.body.classList.remove('print-parte'), 500); };
  return (
    <div className="av-parte-wrap">
      <article className="parte" aria-label="Parte de avería">
        <header><div><small>CircuitosSEA · Sistemas Electrotécnicos y Automatizados</small><h1>Parte de avería</h1></div><div className="nota"><b>{fx(sco.total)}</b><span>/ 10</span><i>{'★'.repeat(sco.stars)}{'☆'.repeat(3 - sco.stars)}</i></div></header>
        <label className="p-name no-print">Nombre del alumno <input value={av.student ?? ''} onChange={(e) => av.setStudent(e.target.value)} placeholder="Nombre y apellidos" /></label>
        <dl className="p-grid">
          <dt>Alumno</dt><dd>{av.student || '—'}</dd>
          <dt>Fecha</dt><dd>{new Date().toLocaleDateString('es-ES')}</dd>
          <dt>Cliente</dt><dd>{sc.clientName}</dd>
          <dt>Vivienda</dt><dd>{houseOf(sc.houseId).name}</dd>
          <dt>Circuito</dt><dd>{sc.case.setup.circuit} · {sc.case.setup.circuitName}</dd>
          <dt>Nivel</dt><dd>{sc.level}</dd>
        </dl>
        <h2>Síntoma</h2><p className="p-q">{sc.symptom}</p>
        <h2>Medidas realizadas ({(av.measures ?? []).length})</h2>
        {(av.measures ?? []).length ? <table className="p-t"><thead><tr><th>Función</th><th>Entre</th><th>Lectura</th></tr></thead><tbody>{(av.measures ?? []).map((m, i) => <tr key={i}><td>{m.dial}</td><td>{m.to ? `${m.from} → ${m.to}` : m.from}</td><td>{m.text} {m.unit}</td></tr>)}</tbody></table> : <p>Ninguna.</p>}
        <h2>Causa y reparación</h2>
        <p><b>Causa:</b> {f.cause} — <b>punto:</b> {points.find((p) => p.id === sc.point)?.label ?? sc.point}.</p>
        <p><b>Intentos de hipótesis:</b> {(av.attempts ?? []).length}.</p>
        <table className="p-t"><thead><tr><th>Reparación</th><th>Dónde</th><th>Coste</th></tr></thead><tbody>
          {(av.repairs ?? []).map((r, i) => <tr key={i}><td>{repairOf(r.repair).name}{r.param ? ` (${r.param})` : ''}</td><td>{points.find((p) => p.id === r.target)?.label ?? r.target}</td><td>{eur(r.cost)}</td></tr>)}
          <tr className="tot"><td colSpan={2}>Total reparaciones</td><td>{eur(total)}</td></tr></tbody></table>
        <p><b>Tiempo de trabajo:</b> {hm(av.minutes ?? 0)}.</p>
        <h2>Valoración</h2>
        <table className="p-t"><tbody>
          <tr><td>Diagnóstico</td><td>{fx(sco.diag)} / 4</td></tr><tr><td>Eficiencia</td><td>{fx(sco.efic)} / 2</td></tr><tr><td>Coste</td><td>{fx(sco.coste)} / 2</td></tr><tr><td>Seguridad</td><td>{fx(sco.seg)} / 2</td></tr>
        </tbody></table>
        <ul className="p-notes">{sco.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
        <h2>Por qué ocurría</h2>
        <p>{f.explain}</p>
        <p><b>La medida que la habría localizado antes:</b> {f.evidence}</p>
      </article>
      <div className="av-parte-actions no-print">
        <button className="primary" onClick={print}>Descargar PDF</button>
        <button onClick={() => av.start()}>Siguiente aviso</button>
        <button onClick={() => av.start(sc.seed, sc.level)}>Repetir esta avería</button>
      </div>
    </div>
  );
}
