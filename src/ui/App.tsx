import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { LIBRARY, defOf, defaultParams, fmt, fmtSI } from '../model/library';
import { readMeter } from '../model/meter';
import { Multimeter, MeterInfo } from './Multimeter';
import { Scope } from './Scope';
import { Wattmeter } from './Wattmeter';
import { FloatingWin, ProbeDragLayer } from './Floating';
import { beep, boomSound } from './sound';
import { simulate } from '../model/netlist';
import { EXAMPLES } from '../model/examples';
import { t } from '../i18n';
import { Canvas } from './Canvas';
import { RealPanel } from './RealPanel';
import { Viewport } from './Viewport';
import { CuadroView } from './CuadroView';
import { Plano } from './Plano';
import { UNIFILAR_TYPES } from '../model/unifilar';
import { GameView } from './GameView';
import { SolveDialog } from './SolveDialog';
import { useAuth } from '../auth';
import { loadProfile, saveProfile } from '../cloud';
import { useGame } from '../game/store';
import { useLevel, visitorAllows, UPSELL, isAdminEmail } from '../access';
import { AdminPanel } from './AdminPanel';
import { saveGuard } from '../store';
import { multifilarDiagram, unifilarDiagram } from './diagrams';
import { cableReport, wireData, admissible, wireResistance } from '../model/cables';
import { SECTIONS, IZ_SOURCE } from '../data/rebt';

function UpsellModal() {
  const reason = useStore((s) => s.upsell);
  const close = () => useStore.getState().setUpsell(null);
  const auth = useAuth();
  if (!reason) return null;
  return (
    <div className="upsell" role="dialog" aria-label="Función para cuentas registradas" onClick={close}>
      <div className="upsell-box" onClick={(e) => e.stopPropagation()}>
        <span className="lockbig" aria-hidden>🔒</span>
        <h2>Esto es para cuentas registradas</h2>
        <p>{reason}</p>
        <ul>
          <li>Todos los componentes: LED, motor, fusibles, magnetotérmicos, condensadores, bobinas…</li>
          <li>Corriente alterna, osciloscopio, vatímetro y las cuatro vistas del circuito.</li>
          <li>Resolver circuitos paso a paso y descargar el informe en PDF.</li>
          <li>El juego de instalar una casa y tu progreso guardado en la nube.</li>
        </ul>
        <div className="upsell-actions">
          <button className="primary" onClick={() => auth.openSignup('crear')}>Crear cuenta gratis</button>
          <button onClick={() => auth.openSignup('entrar')}>Ya tengo cuenta</button>
          <button className="ghost" onClick={close}>Seguir de visitante</button>
        </div>
      </div>
    </div>
  );
}

function Welcome({ onClose }: { onClose: () => void }) {
  const st = useStore();
  const go = (i: number, view: 'schematic' | 'real' | 'cuadro') => { st.load(structuredClone(EXAMPLES[i])); st.setView(view); onClose(); };
  return (
    <div className="welcome" role="dialog" aria-label="Bienvenida">
      <div className="box">
        <h1>Circuitos<span>SEA</span></h1>
        <p>Tu taller virtual de electrotecnia: dibuja, monta, mide y calcula. El mismo circuito en esquema, multifilar, unifilar y montado en un panel real.</p>
        <div className="cards">
          <button className="cardbtn" onClick={() => go(4, 'schematic')}><span className="ic">💥</span><b>Provoca un cortocircuito</b><small>Pulsa el pulsador y mira cómo se funde el fusible. Mide con el polímetro.</small></button>
          <button className="cardbtn" onClick={() => go(5, 'real')}><span className="ic">🛠</span><b>Monta una conmutada</b><small>Una luz desde dos sitios, en el panel real con carril DIN y cables de colores.</small></button>
          <button className="cardbtn" onClick={() => go(8, 'schematic')}><span className="ic">〰</span><b>Mide corriente alterna</b><small>Circuito RLC a 230 V: osciloscopio, desfase y vatímetro.</small></button>
          <button className="cardbtn" onClick={() => { st.setView('juego'); onClose(); }}><span className="ic">🏠</span><b>Juega: instala una casa</b><small>Un cliente te encarga la electricidad de su vivienda. Mide, calcula y cumple el reglamento.</small></button>
          <button className="cardbtn" onClick={() => { st.setView('cuadro'); onClose(); }}><span className="ic">▦</span><b>Diseña un cuadro eléctrico</b><small>Circuitos C1–C5, protecciones y secciones con el cálculo paso a paso.</small></button>
        </div>
        <ul>
          <li>Arrastra componentes desde la paleta · pulsa un terminal para tirar un cable (en modo <b>Real</b>, arrastra de borne a borne).</li>
          <li>Abre los instrumentos con los botones ⚡ 〰 ◔ y <b>arrastra las puntas</b> hasta un borne.</li>
          <li>Interruptores y pulsadores se accionan con un clic · <b>R</b> gira · <b>Supr</b> borra · <b>F</b> encaja el circuito.</li>
        </ul>
        <button className="go" onClick={onClose}>Empezar a trastear</button>
      </div>
    </div>
  );
}

export function App() {
  const auth = useAuth();
  const uid = auth.user?.uid;
  const proj = useStore((s) => s.project);
  const career = useGame((s) => s.career);
  // Nube: al entrar se carga el último proyecto y el progreso del juego; después se guardan solos
  const [synced, setSynced] = useState(false);
  useEffect(() => {
    if (!uid) return;
    let alive = true;
    loadProfile(uid).then((p) => {
      if (!alive) return;
      if (p?.project) { try { useStore.getState().load(JSON.parse(p.project)); } catch { /* proyecto en la nube no válido: se ignora */ } }
      if (p?.career) { const c = useGame.getState().career; useGame.getState().setCareer({ jobs: Math.max(c.jobs, p.career.jobs), money: Math.max(c.money, p.career.money), best: Math.max(c.best, p.career.best), stars: Math.max(c.stars, p.career.stars) }); }
      setSynced(true);
    });
    return () => { alive = false; };
  }, [uid]);
  useEffect(() => { if (!uid || !synced) return; const h = setTimeout(() => void saveProfile(uid, { project: proj, name: auth.user?.displayName ?? undefined }), 2500); return () => clearTimeout(h); }, [proj, uid, synced]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!uid || !synced) return; const h = setTimeout(() => void saveProfile(uid, { career }), 1000); return () => clearTimeout(h); }, [career, uid, synced]);
  const level = useLevel();
  const visitor = level === 'visitor';
  const lock = (reason: string) => () => useStore.getState().setUpsell(reason);
  const [showAdmin, setShowAdmin] = useState(false);
  // El visitante parte de un lienzo vacío y no guarda nada (no pisa el trabajo guardado de ninguna cuenta)
  useEffect(() => {
    if (!visitor) return;
    saveGuard.suspended = true;
    useStore.getState().load({ version: 1, name: 'Visitante', components: [], wires: [] });
    return () => { saveGuard.suspended = false; };
  }, [visitor]);
  const unverifiedAdmin = !!auth.user && isAdminEmail(auth.user.email) && !auth.user.emailVerified;
  const [showSolve, setShowSolve] = useState(false);
  const [welcome, setWelcome] = useState(() => { try { return !localStorage.getItem('circuitossea:welcome'); } catch { return true; } });
  const closeWelcome = () => { try { localStorage.setItem('circuitossea:welcome', '1'); } catch { /* ignorar */ } setWelcome(false); };
  const st = useStore();
  const { project, selection, past, future } = st;
  const sim = useMemo(() => simulate(project, st.runtime), [project, st.runtime]);
  // Las averías nuevas (fusible fundido, LED quemado…) se anotan una vez y quedan hasta «Reponer»
  useEffect(() => {
    if (sim.events.length) { st.applyEvents(sim.events); if (st.sound) boomSound(); }
  }, [sim.events]); // eslint-disable-line react-hooks/exhaustive-deps
  const cableRep = useMemo(() => cableReport(project, sim), [project, sim]);
  const messages = useMemo(() => [...sim.messages, ...cableRep.messages], [sim, cableRep]);
  const mf = useMemo(() => multifilarDiagram(project, sim, cableRep.info, st.showCables), [project, sim, cableRep, st.showCables]);
  const uf = useMemo(() => unifilarDiagram(project, sim, cableRep.info), [project, sim, cableRep]);
  const wide = ['cuadro', 'plano', 'juego'].includes(st.view);
  const [doc, setDoc] = useState(false);
  const uniLocked = (type: string) => st.view === 'unifilar' && !UNIFILAR_TYPES.has(type);
  const [shake, setShake] = useState(false);
  const nBooms = st.booms.length;
  useEffect(() => { if (nBooms > 0) { setShake(true); const h = setTimeout(() => setShake(false), 520); return () => clearTimeout(h); } }, [nBooms]);
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
      {showSolve && <SolveDialog sim={sim} onClose={() => setShowSolve(false)} />}
      {welcome && !visitor && <Welcome onClose={closeWelcome} />}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
      <UpsellModal />
      <header className="top">
        {visitor && (
          <div className="visitor-bar" role="status">
            <span><b>Modo visitante.</b> Una pila, una resistencia y el polímetro. Con una cuenta gratis desbloqueas todo: más de 25 componentes, corriente alterna, osciloscopio, vistas reales, el cuadro, el juego y los informes en PDF.</span>
            <button onClick={() => auth.openSignup('crear')}>Crear cuenta gratis</button>
            <button className="ghost" onClick={() => auth.openSignup('entrar')}>Ya tengo cuenta</button>
          </div>
        )}
        {unverifiedAdmin && (
          <div className="visitor-bar admin" role="status">
            <span><b>Falta un paso para activar el superadmin:</b> verifica tu correo (te lo enviamos al registrarte). Mientras tanto tienes acceso de usuario normal.</span>
            <button onClick={() => void auth.resendVerification()}>Reenviar correo</button>
            <button className="ghost" onClick={() => window.location.reload()}>Ya lo he verificado</button>
          </div>
        )}
        <div className="brand"><span className="logo">⚡</span><b>{t.app}</b><small>{t.tagline}</small></div>
        <div className="viewswitch" role="tablist" aria-label="Vista del circuito">
          {([['schematic', 'Esquema', '⎍'], ['multifilar', 'Multifilar', '☰'], ['unifilar', 'Unifilar', '╱'], ['real', 'Real', '🛠'], ['cuadro', 'Cuadro', '▦'], ['plano', 'Plano', '🖨'], ['juego', 'Juego', '🏠']] as const).map(([v, l, ic]) => (
            <button key={v} role="tab" aria-selected={st.view === v} onClick={() => st.setView(v)} data-view={v} className={`${st.view === v ? 'on' : ''} ${visitor && v !== 'schematic' ? 'locked' : ''}`}><span>{visitor && v !== 'schematic' ? '🔒' : ic}</span> {l}</button>
          ))}
        </div>
        <div className="tools">
          <button onClick={() => setWelcome(true)} title="Inicio rápido">❓</button>
          <button onClick={() => { if (confirm('¿Empezar un proyecto nuevo? Se perderán los cambios no guardados.')) st.load({ version: 1, name: 'Sin título', components: [], wires: [] }); }}>{t.newProject}</button>
          <button className={visitor ? 'locked' : ''} onClick={visitor ? lock(UPSELL.files) : () => fileRef.current?.click()}>{visitor && '🔒 '}{t.open}</button>
          <button className={visitor ? 'locked' : ''} onClick={visitor ? lock(UPSELL.files) : download}>{visitor && '🔒 '}{t.save}</button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
          <select value="" onChange={(e) => { if (visitor) { st.setUpsell(UPSELL.files); return; } if (e.target.value) st.load(structuredClone(EXAMPLES[Number(e.target.value)])); }} aria-label={t.examples} className={visitor ? 'locked' : ''}>
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
                <button key={id} className={`${st.inst[id].open ? 'on' : ''} ${visitor && id !== 'meter' ? 'locked' : ''}`} onClick={() => st.toggleInst(id)} data-inst={id}>{visitor && id !== 'meter' ? '🔒 ' : ''}{l}</button>
              ))}
            </span>
          )}
          {['schematic', 'multifilar', 'unifilar', 'real'].includes(st.view) && <button className={`solvebtn ${visitor ? 'locked' : ''}`} onClick={() => (visitor ? st.setUpsell(UPSELL.solve) : setShowSolve(true))} title="Resolver el circuito por Kirchhoff, mallas, nudos, Millman, Thévenin, Norton…">{visitor ? '🔒 ' : '🧮 '}Resolver valores</button>}
          {st.view === 'schematic' && <button onClick={st.fit} title="F">⤢ Ajustar</button>}
          <button onClick={() => st.toggle('leftOpen')} className={st.leftOpen ? '' : 'on'} title="Mostrar u ocultar la paleta">◧</button>
          <button onClick={() => st.toggle('rightOpen')} className={st.rightOpen ? '' : 'on'} title="Mostrar u ocultar propiedades">◨</button>
          <label><input type="checkbox" checked={st.sound} onChange={() => st.toggle('sound')} /> Sonido</label>
          <label><input type="checkbox" checked={st.heat} onChange={() => st.toggle('heat')} /> {t.heat}</label>
          {Object.keys(st.runtime).length > 0 && <button className="warnbtn" onClick={st.resetRuntime}>🔧 Reponer averías</button>}
          {level === 'admin' && auth.user && <button className="adminbtn" onClick={() => setShowAdmin(true)}>👥 Usuarios</button>}
          <span className="usr" title={auth.user?.email ?? 'Modo visitante'}>
            <i>{visitor ? '?' : (auth.user?.displayName ?? auth.user?.email ?? 'D').slice(0, 1).toUpperCase()}</i>
            <span>{visitor ? 'Visitante' : auth.user ? (auth.user.displayName ?? auth.user.email) : 'Demostración'}</span>
            {level === 'admin' && <em className="badge-admin">Superadmin</em>}
            {visitor ? <button className="signup" onClick={() => auth.openSignup('crear')}>Registrarse</button> : <button onClick={() => void auth.logout()}>Salir</button>}
          </span>
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
                  <div key={d.type} className={`pal-item ${(visitor && !visitorAllows(d.type)) || uniLocked(d.type) ? 'locked' : ''}`} draggable={!((visitor && !visitorAllows(d.type)) || uniLocked(d.type))}
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', d.type)}
                    onClick={() => { if (visitor && !visitorAllows(d.type)) st.setUpsell(UPSELL.components); }}
                    onDoubleClick={() => st.addComponent(d.type, 300, 300)}
                    title={uniLocked(d.type) ? 'No se representa en unifilar' : visitor && !visitorAllows(d.type) ? 'Regístrate para usar este componente' : 'Arrastra al lienzo (o doble clic)'} data-type={d.type}>
                    <svg width={64} height={32} viewBox="-44 -22 88 44">
                      <PaletteIcon type={d.type} />
                    </svg>
                    <span>{d.name}</span>{visitor && !visitorAllows(d.type) && <i className="lock" aria-hidden>🔒</i>}{uniLocked(d.type) && <i className="lock" aria-hidden title="No se representa en unifilar">∅</i>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </aside>

      <main className="center">
        <div className={`stage ${st.view} ${shake ? 'shake' : ''}`} key={st.view}>
          {st.view === 'real' ? <RealPanel sim={sim} cables={cableRep.info} /> : st.view === 'schematic' ? <Canvas sim={sim} cables={cableRep.info} />
            : st.view === 'multifilar' || st.view === 'unifilar' ? (
              <>
                <div className="docswitch" role="tablist" aria-label="Montar o ver el documento">
                  <button role="tab" aria-selected={!doc} className={!doc ? 'on' : ''} onClick={() => setDoc(false)}>Montar</button>
                  <button role="tab" aria-selected={doc} className={doc ? 'on' : ''} onClick={() => setDoc(true)}>Documento</button>
                </div>
                {doc ? <Viewport d={st.view === 'multifilar' ? mf : uf} /> : <Canvas sim={sim} cables={cableRep.info} mode={st.view} />}
              </>
            )
            : st.view === 'cuadro' ? <CuadroView /> : st.view === 'juego' ? <GameView onExit={() => st.setView('schematic')} /> : <Plano sim={sim} cables={cableRep.info} />}
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
        {!wide && <div className="hint-bar">{st.view === 'unifilar' ? 'Unifilar: dibuja solo la línea (fuente → aparamenta → receptor). El retorno se añade solo y se ve en las demás vistas.' : st.view === 'multifilar' ? 'Multifilar: monta con todos los conductores. Cada borne lleva su designación y cada cable su color y sección.' : st.view === 'real' ? 'Modo real: arrastra de borne a borne para cablear · clic en un cable y Supr lo quita · clic en interruptores y pulsadores para accionarlos · rueda = zoom' : st.wiring ? t.wireHint : t.placeHint}</div>}
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
