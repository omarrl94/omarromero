/**
 * Portada: una «hoja de plano». Marco con referencias de zona, cajetín, designaciones de aparamenta (−Q1, −F1…),
 * colores normalizados de conductor y el propio simulador funcionando en vivo (instrumentos, vistas, juegos).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { firebaseConfigured } from '../firebase';
import { useAuth } from '../auth';
import { saveGuard, useStore } from '../store';
import { simulate } from '../model/netlist';
import { rlcSerie } from '../model/examples';
import { cableReport } from '../model/cables';
import { defaultPanel, computePanel } from '../model/panel';
import { IZ_SOURCE, GAMMA_SOURCE, DROP_SOURCE, ITC25_SOURCE } from '../data/rebt';
import { SOURCES as BT_SOURCES } from '../boletin/rules';
import { multifilarDiagram, panelEnclosure, unifilarDiagram } from './diagrams';
import { Multimeter, MeterInfo } from './Multimeter';
import { Scope } from './Scope';
import { Wattmeter } from './Wattmeter';
import { RealPanel } from './RealPanel';
import { Viewport } from './Viewport';
import { PlanSvg } from './PlanSvg';
import { Megger } from './BoletinInstruments';
import { Icon } from './icons';
import './landing.css';

/* ───────── Piezas de la hoja ───────── */
const SHEETS = [
  { id: 'top', n: 1, t: 'Esquema de principio' }, { id: 'instrumentos', n: 2, t: 'Instrumentos' }, { id: 'vistas', n: 3, t: 'Planos' },
  { id: 'juego', n: 4, t: 'Obras y partes' }, { id: 'norma', n: 5, t: 'Normativa y aula' }, { id: 'acceso', n: 6, t: 'Acceso' },
];

/** Cajetín normalizado: lo que lleva todo plano en la esquina inferior derecha. */
function Cajetin({ hoja, titulo }: { hoja: number; titulo: string }) {
  return (
    <div className="cajetin" aria-label={`Cajetín de la hoja ${hoja}`}>
      <div className="cj-wide"><small>Proyecto</small><b>CircuitosSEA</b></div>
      <div className="cj-wide"><small>Título</small><b>{titulo}</b></div>
      <div><small>Escala</small><b>1:1</b></div><div><small>Formato</small><b>A3</b></div><div><small>Hoja</small><b>{hoja}/6</b></div><div><small>Rev.</small><b>A</b></div>
    </div>
  );
}

/** Una sección de la página es una hoja: designación, título, contenido y cajetín. */
function Hoja({ id, n, eyebrow, title, children, className = '' }: { id: string; n: number; eyebrow: string; title: ReactNode; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el || typeof IntersectionObserver === 'undefined') { el?.classList.add('in'); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return (
    <section id={id} ref={ref} className={`hoja reveal ${className}`} data-sheet={n}>
      <header className="hoja-head"><span className="desig">−H{n}</span><span className="eyebrow">{eyebrow}</span></header>
      <h2 className="hoja-title">{title}</h2>
      {children}
    </section>
  );
}

/* ───────── Esquema unifilar interactivo de la cabecera ───────── */
const CIRC = [
  { id: 'C1', q: '−Q3', name: 'Alumbrado', cal: 10, sec: '1,5', amps: 1.3, x: 200 },
  { id: 'C2', q: '−Q4', name: 'Tomas', cal: 16, sec: '2,5', amps: 2.2, x: 350 },
  { id: 'C3', q: '−Q5', name: 'Cocina y horno', cal: 25, sec: '6', amps: 10.9, x: 500 },
  { id: 'C4', q: '−Q6', name: 'Lavadora', cal: 20, sec: '4', amps: 8.7, x: 650 },
];
function Breaker({ x, y, closed, tripped, label, rating, onToggle, rcd }: { x: number; y: number; closed: boolean; tripped?: boolean; label: string; rating: string; onToggle?: () => void; rcd?: boolean }) {
  const key = (e: React.KeyboardEvent) => { if (onToggle && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onToggle(); } };
  return (
    <g role={onToggle ? 'button' : undefined} tabIndex={onToggle ? 0 : undefined} aria-pressed={onToggle ? closed : undefined} aria-label={onToggle ? `${label} ${rating}: ${closed ? 'cerrado' : tripped ? 'disparado' : 'abierto'}. Pulsa para ${closed ? 'abrir' : 'cerrar'}` : undefined} onClick={onToggle} onKeyDown={key} className={onToggle ? 'brk hit' : 'brk'}>
      <rect x={x - 30} y={y - 34} width={60} height={68} fill="transparent" />
      <circle cx={x} cy={y - 20} r={3} className="term" /><circle cx={x} cy={y + 20} r={3} className="term" />
      <line x1={x} y1={y + 20} x2={closed ? x : x + 14} y2={closed ? y - 20 : y - 14} className={`arm ${tripped ? 'trip' : ''}`} style={{ transition: 'all .25s' }} />
      {!closed && <line x1={x} y1={y - 20} x2={x} y2={y - 8} className="wire dead" />}
      <path d={`M${x - 6} ${y - 6}l12 -10M${x - 6} ${y - 16}l12 10`} className="cross" />
      {rcd && <ellipse cx={x} cy={y + 4} rx={11} ry={6} className="toroid" />}
      <text x={x + 26} y={y - 4} className="tag">{label}</text><text x={x + 26} y={y + 14} className="tag-s">{rating}</text>
    </g>
  );
}

/** Conductor: tinta; si está en tensión, lleva encima los puntos de corriente. */
function W({ d, on }: { d: string; on: boolean }) {
  return <><path d={d} className={`wire ${on ? 'live' : 'dead'}`} />{on && <path d={d} className="flow" />}</>;
}

function HeroSheet() {
  const [closed, setClosed] = useState([true, true, true, true]);
  const [trip, setTrip] = useState<number | null>(null);
  const [spark, setSpark] = useState(0);
  const total = CIRC.reduce((a, c, i) => a + (closed[i] ? c.amps : 0), 0);
  const toggle = (i: number) => { if (trip === i) return; setClosed((c) => c.map((v, k) => (k === i ? !v : v))); };
  const short = () => {
    if (trip !== null) return;
    setSpark((k) => k + 1);
    window.setTimeout(() => { setClosed((c) => c.map((v, k) => (k === 1 ? false : v))); setTrip(1); }, 450);
  };
  const reset = () => { setTrip(null); setClosed([true, true, true, true]); };
  return (
    <figure className="sheet-frame">
      <div className="zones-top" aria-hidden>{['A', 'B', 'C', 'D', 'E', 'F'].map((z) => <span key={z}>{z}</span>)}</div>
      <div className="zones-left" aria-hidden>{[1, 2, 3, 4].map((z) => <span key={z}>{z}</span>)}</div>
      <svg viewBox="0 0 800 540" role="group" aria-label="Esquema unifilar interactivo de una vivienda: acometida, interruptor general, diferencial y cuatro circuitos">
        <defs>
          <linearGradient id="glowl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#efcd2f" stopOpacity="0.95" /><stop offset="1" stopColor="#efcd2f" stopOpacity="0" /></linearGradient>
          <radialGradient id="lampg"><stop offset="0" stopColor="#ffe680" stopOpacity="0.9" /><stop offset="1" stopColor="#efcd2f" stopOpacity="0" /></radialGradient>
        </defs>
        {/* red */}
        <g><circle cx={70} cy={64} r={22} className="sym" /><path d="M58 64c4-10 8-10 12 0s8 10 12 0" className="sine" /><text x={104} y={60} className="tag">−G1</text><text x={104} y={80} className="tag-s">Red 230 V · 50 Hz</text></g>
        <W d="M70 86V138" on={true} />
        <Breaker x={70} y={158} closed label="−Q1 IGA" rating="2P · 25 A" />
        <W d="M70 178V218" on={true} />
        <Breaker x={70} y={238} closed label="−Q2 ID" rating="2P · 30 mA · tipo A" rcd />
        <W d="M70 258V300" on={true} />
        {/* barra */}
        <path d="M40 300H700" className="bus" /><text x={712} y={304} className="tag-s">barra</text>
        {CIRC.map((c, i) => {
          const on = closed[i];
          return (
            <g key={c.id}>
              <W d={`M${c.x} 300V${on ? 330 : 330}`} on={true} />
              <Breaker x={c.x} y={350} closed={on} tripped={trip === i} label={c.q} rating={`${c.id} · ${c.cal} A`} onToggle={() => toggle(i)} />
              <W d={`M${c.x} 370V${i === 0 ? 440 : 450}`} on={on} />
              <text x={c.x + 10} y={412} className="tag-s">{c.sec} mm²</text>
              {/* receptores */}
              {i === 0 && <g transform={`translate(${c.x} 470)`}>{on && <circle r={46} fill="url(#lampg)" className="lamp-glow" />}<circle r={20} className={`sym ${on ? 'lit' : ''}`} /><path d="M-14 -14L14 14M-14 14L14 -14" className="sym-x" /></g>}
              {i === 1 && <g transform={`translate(${c.x} 470)`}><circle r={20} className="sym" /><path d="M-8 -10a14 14 0 0 1 0 20M8 -10a14 14 0 0 0 0 20" className="sym-x" fill="none" /><line x1={-8} y1={0} x2={8} y2={0} className="sym-x" /></g>}
              {i === 2 && <g transform={`translate(${c.x} 470)`}><rect x={-26} y={-18} width={52} height={36} className="sym" /><path d="M-18 0h6l3-8 6 16 6-16 6 16 3-8h6" className="sym-x" fill="none" /></g>}
              {i === 3 && <g transform={`translate(${c.x} 470)`}><circle r={22} className="sym" /><text y={6} textAnchor="middle" className="motor">M</text><circle r={22} className={on ? 'spin' : ''} fill="none" strokeDasharray="4 8" /></g>}
              <text x={c.x} y={522} textAnchor="middle" className="tag">{c.name}</text>
            </g>
          );
        })}
        {/* cortocircuito en la toma */}
        {spark > 0 && trip === null && <g key={spark} transform="translate(350 470)" className="spark"><path d="M-6 -30L6 -6L-4 -6L8 24" fill="none" stroke="#c4271a" strokeWidth={4} strokeLinejoin="round" /><circle r={30} fill="#efcd2f" opacity={0.5} /></g>}
      </svg>
      <figcaption className="sheet-ctrl">
        <div className="amp"><span>Intensidad total</span><b>{total.toFixed(1).replace('.', ',')} A</b><i>{total > 25 ? 'sobrecarga' : 'de 25 A'}</i></div>
        {trip === null ? <button className="btn-line danger" onClick={short}><Icon name="bolt" size={16} /> Provocar cortocircuito en la toma</button> : <button className="btn-line" onClick={reset}><Icon name="check" size={16} /> Rearmar −Q4</button>}
        <p className="cap-note" role="status">{trip !== null ? '−Q4 ha disparado: la corriente de cortocircuito superó su umbral magnético. El resto de circuitos sigue en servicio: eso es selectividad.' : 'Pulsa los magnetotérmicos para abrirlos y cerrarlos. Es el mismo modelo que usa el simulador.'}</p>
      </figcaption>
      <Cajetin hoja={1} titulo="Esquema unifilar" />
    </figure>
  );
}

/* ───────── Acceso ───────── */
function AuthCard({ initial }: { initial: 'entrar' | 'crear' }) {
  const a = useAuth();
  const [mode, setMode] = useState<'entrar' | 'crear'>(initial);
  useEffect(() => setMode(initial), [initial]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (mode === 'crear') void a.signup(name, email, pass); else void a.login(email, pass); };
  return (
    <form className="auth-card" id="acceso" onSubmit={submit} noValidate>
      {!firebaseConfigured && (
        <div className="msg err" role="alert">
          <b>Esta copia no tiene las claves de Firebase</b>, así que el inicio de sesión no funcionará. En Netlify: Site configuration → Environment variables → añade las seis <code>VITE_FIREBASE_*</code> y vuelve a desplegar (Deploys → Trigger deploy → Clear cache and deploy).
          <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
            <button type="button" className="link" onClick={() => a.continueGuest(true)}>Ver todo en modo demostración (sin cuentas)</button>
          </div>
        </div>
      )}
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'crear'} className={mode === 'crear' ? 'on' : ''} onClick={() => { setMode('crear'); a.clear(); }}>Crear cuenta</button>
        <button type="button" role="tab" aria-selected={mode === 'entrar'} className={mode === 'entrar' ? 'on' : ''} onClick={() => { setMode('entrar'); a.clear(); }}>Ya tengo cuenta</button>
      </div>
      {mode === 'crear' && <label>Nombre<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Cómo quieres que te llamemos" /></label>}
      <label>Correo<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required placeholder="tu@correo.es" /></label>
      <label>Contraseña<input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete={mode === 'crear' ? 'new-password' : 'current-password'} required placeholder="Al menos 6 caracteres" /></label>
      {a.error && <p className="msg err" role="alert">{a.error}</p>}
      {a.info && <p className="msg ok" role="status">{a.info}</p>}
      <button className="cta" type="submit" disabled={a.busy || !firebaseConfigured}>{a.busy ? 'Un momento…' : mode === 'crear' ? 'Crear mi cuenta' : 'Entrar'}</button>
      <div className="or"><span>o</span></div>
      <button type="button" className="google" onClick={() => void a.google()} disabled={a.busy || !firebaseConfigured}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" /><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" /><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" /></svg>
        Continuar con Google
      </button>
      {mode === 'entrar' && <button type="button" className="link" onClick={() => void a.reset(email)}>He olvidado mi contraseña</button>}
      <p className="tiny">Tu progreso (proyectos y obras del juego) se guarda en tu cuenta y te sigue entre dispositivos.</p>
      <button type="button" className="link" onClick={() => a.continueGuest(false)}>Probar sin cuenta (solo una pila, una resistencia y el polímetro)</button>
    </form>
  );
}


function Spine() {
  const [cur, setCur] = useState('top');
  useEffect(() => {
    const els = SHEETS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const root = document.querySelector('.landing');
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) setCur(e.target.id); }, { root, rootMargin: '-40% 0px -50% 0px' });
    els.forEach((e) => io.observe(e)); return () => io.disconnect();
  }, []);
  return (
    <nav className="spine" aria-label="Hojas de la página">
      <span className="spine-wire" aria-hidden><i className="c1" /><i className="c2" /><i className="c3" /></span>
      {SHEETS.map((s) => <a key={s.id} href={`#${s.id}`} className={cur === s.id ? 'on' : ''} aria-label={`Hoja ${s.n}: ${s.t}`} aria-current={cur === s.id ? 'true' : undefined}><b>{s.n}</b><span>{s.t}</span></a>)}
    </nav>
  );
}

function SourceRow({ s }: { s: { ref: string; note: string; verified: boolean } }) {
  return <li><span className={`vtag ${s.verified ? 'ok' : 'pend'}`}>{s.verified ? 'Verificado' : 'A verificar'}</span><div><b>{s.ref}</b><small>{s.note}</small></div></li>;
}

export function Landing() {
  const [ready, setReady] = useState(false);
  const [vista, setVista] = useState<'real' | 'multifilar' | 'unifilar'>('real');
  const [modo, setModo] = useState<'entrar' | 'crear'>('crear');
  const demo = useMemo(() => structuredClone(rlcSerie), []);
  const sim = useMemo(() => simulate(demo), [demo]);
  const cables = useMemo(() => cableReport(demo, sim).info, [demo, sim]);
  const mf = useMemo(() => multifilarDiagram(demo, sim, cables, true), [demo, sim, cables]);
  const uf = useMemo(() => unifilarDiagram(demo, sim, cables), [demo, sim, cables]);
  const cfg = useMemo(() => defaultPanel(), []);
  const enclosure = useMemo(() => panelEnclosure(cfg, computePanel(cfg)), [cfg]);

  // Las piezas de la portada leen del estado del simulador: se carga un circuito de demostración
  // SIN guardarlo y se restaura el trabajo real del alumno al salir.
  useEffect(() => {
    const st = useStore.getState();
    const prev = st.project;
    saveGuard.suspended = true;
    st.load(structuredClone(rlcSerie));
    st.setMeter({ dial: 'Vac', red: { comp: 'R1', term: 0 }, black: { comp: 'R1', term: 1 }, armed: null });
    st.setScopeTip('c1', { comp: 'A1', term: 0 });
    setReady(true);
    return () => { saveGuard.suspended = false; useStore.getState().load(prev); };
  }, []);

  useEffect(() => {
    try { const g = sessionStorage.getItem('circuitossea:goto'); if (g) { sessionStorage.removeItem('circuitossea:goto'); setModo(g === 'entrar' ? 'entrar' : 'crear'); setTimeout(() => document.getElementById('acceso')?.scrollIntoView({ block: 'center' }), 60); } } catch { /* ignorar */ }
  }, []);
  const goto = (m: 'entrar' | 'crear') => { setModo(m); document.getElementById('acceso')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };

  return (
    <div className="landing">
      <a className="skip" href="#top">Saltar al contenido</a>
      <Spine />
      <header className="l-nav">
        <a className="l-logo" href="#top" aria-label="CircuitosSEA, inicio">
          <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden><rect x="1" y="1" width="30" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M16 4v7M16 21v7" stroke="currentColor" strokeWidth="2" /><circle cx="16" cy="16" r="5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M13.5 18.5l5-5" stroke="#A84A24" strokeWidth="2" /></svg>
          <span>Circuitos<b>SEA</b></span>
        </a>
        <nav aria-label="Secciones"><a href="#instrumentos">Instrumentos</a><a href="#vistas">Planos</a><a href="#juego">Obras y partes</a><a href="#norma">Normativa</a></nav>
        <button className="nav-btn" onClick={() => goto('entrar')}>Entrar</button>
      </header>

      <main>
        <section className="hoja hero reveal in" id="top" data-sheet={1}>
          <div className="hero-copy">
            <p className="eyebrow"><span className="desig">−H1</span> Taller virtual de electrotecnia · CFGS Sistemas Electrotécnicos y Automatizados</p>
            <h1><span>Equivócate aquí.</span><span className="rev">No en la obra.<svg viewBox="0 0 320 70" preserveAspectRatio="none" aria-hidden className="cloud-svg"><path d="M10 38C2 24 16 8 34 14c6-12 28-12 36 0 10-12 34-10 40 4 12-10 36-6 40 8 12-8 34-4 38 10 12-4 30 4 26 18 14 6 14 22-2 24-4 12-26 14-34 4-12 10-32 6-36-4-12 8-32 4-36-6-14 6-34-2-34-14-12 2-22-8-14-18z" /></svg><i className="rev-tri" aria-hidden>B</i></span></h1>
            <p className="lede">Simula circuitos, mide con instrumentos que fallan como los de verdad, dimensiona el cuadro y verifica la instalación antes de firmar. Con el REBT delante y sin quemar nada de clase.</p>
            <div className="hero-cta">
              <button className="btn primary" onClick={() => goto('crear')}>Crear cuenta gratis</button>
              <button className="btn ghost" onClick={() => goto('entrar')}>Ya tengo cuenta</button>
              <button className="btn link" onClick={() => useAuth.getState().continueGuest(false)}>Probar sin cuenta</button>
            </div>
            <dl className="datasheet" aria-label="Características">
              <div><dt>Sistema</dt><dd>Monofásico 230 V · 50 Hz</dd></div>
              <div><dt>Cálculo</dt><dd>Fasores y nudos (MNA)</dd></div>
              <div><dt>Referencia</dt><dd>REBT · ITC-BT-10 a 25</dd></div>
              <div><dt>Acceso</dt><dd>Navegador, PC, tablet y móvil</dd></div>
            </dl>
          </div>
          <HeroSheet />
        </section>

        <Hoja id="instrumentos" n={2} eyebrow="Banco de medida" title={<>Instrumentos que <em>no te perdonan</em></>}>
          <div className="split">
            <div className="prose">
              <p>Gira la rueda, arrastra las puntas hasta un borne y mide. Si pones intensidad en paralelo, <b>se funde el fusible</b>. Si mides ohmios con tensión, el aparato te avisa. Es el mismo error que cuesta un polímetro en el taller, sin el coste.</p>
              <ul className="spec">
                <li><Icon name="bolt" size={18} /><span><b>Polímetro, osciloscopio de dos canales y vatímetro</b> en continua y en alterna, con fasores.</span></li>
                <li><Icon name="wave" size={18} /><span><b>Megóhmetro, telurómetro y comprobador de diferenciales</b> para las verificaciones del boletín.</span></li>
                <li><Icon name="clipboard" size={18} /><span><b>Hoja de medidas</b> con el error de cada lectura frente al valor teórico.</span></li>
              </ul>
            </div>
            <div className="bench">
              {ready && <><div className="inst-box"><Multimeter sim={sim} /><MeterInfo sim={sim} /></div><div className="inst-box wide"><Scope sim={sim} demoComp="R1" /></div><div className="inst-box"><Wattmeter sim={sim} demoId="A1" /></div></>}
            </div>
          </div>
          <Cajetin hoja={2} titulo="Banco de instrumentos" />
        </Hoja>

        <Hoja id="vistas" n={3} eyebrow="Un circuito, varios planos" title={<>La misma instalación, <em>dibujada como en el taller</em></>}>
          <p className="sub">Cambia entre el montaje real en carril DIN, el esquema multifilar y el unifilar. Es siempre el mismo circuito RLC de 230 V: cada cable lleva su color normalizado, su sección y su caída de tensión.</p>
          <div className="seg2" role="tablist" aria-label="Tipo de plano">{([['real', 'Montaje real'], ['multifilar', 'Multifilar'], ['unifilar', 'Unifilar']] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={vista === k} className={vista === k ? 'on' : ''} onClick={() => setVista(k)}>{l}</button>)}</div>
          <figure className="sheet-frame wide-frame">
            <div className="view-stage">{ready && vista === 'real' && <RealPanel sim={sim} cables={cables} />}{vista === 'multifilar' && <Viewport d={mf} />}{vista === 'unifilar' && <Viewport d={uf} />}</div>
            <Cajetin hoja={3} titulo={vista === 'real' ? 'Montaje en carril DIN' : vista === 'multifilar' ? 'Esquema multifilar' : 'Esquema unifilar'} />
          </figure>
        </Hoja>

        <Hoja id="juego" n={4} eyebrow="Tres documentos de obra" title={<>Reformas, averías y boletines: <em>el trabajo de verdad</em></>}>
          <div className="docs">
            <article className="doc">
              <header><span>Orden de trabajo</span><i>Nº 0417</i></header>
              <div className="doc-art plan">{ready && <PlanSvg mode="test" />}</div>
              <h3>Reforma</h3>
              <p className="q">«Quiero aire acondicionado en el salón y el pasillo encendido desde los dos extremos.»</p>
              <ul><li>Cinco planos de serie, o sube el tuyo.</li><li>Materiales reales con marca, precio y enlace.</li><li>Si un cable no aguanta su protección, arde.</li></ul>
            </article>
            <article className="doc">
              <header><span>Parte de avería</span><i>Nº 0213</i></header>
              <div className="doc-art fault"><svg viewBox="0 0 380 210" role="img" aria-label="Circuito con la corriente medida con una pinza amperimétrica y un diferencial disparado">
                <path d="M20 120H96M146 120H210M262 120H336" className="wire live" /><path d="M20 120H96M146 120H210M262 120H336" className="flow" />
                <g><rect x="96" y="96" width="50" height="48" className="sym" /><path d="M110 104l22 32M110 136l22-32" className="sym-x" /><text x="121" y="162" textAnchor="middle" className="tag-s">−Q2 ID</text><path d="M148 100l-8 10 10 4-8 12" fill="none" stroke="#c4271a" strokeWidth="2.6" strokeLinejoin="round" /></g>
                <g transform="translate(236 120)"><circle r="26" fill="none" stroke="#A84A24" strokeWidth="5" /><path d="M-8 -26h16v-14h-16z" fill="#A84A24" /><rect x="-22" y="-84" width="44" height="46" rx="5" fill="#EFCD2F" stroke="#2A2622" strokeWidth="2" /><rect x="-16" y="-78" width="32" height="18" rx="2" fill="#9fb386" /><text x="0" y="-65" textAnchor="middle" className="tag" style={{ fontSize: 13 }}>6,2 A</text><text y="52" textAnchor="middle" className="tag-s">pinza</text></g>
                <g transform="translate(352 120)"><circle r="20" className="sym" /><path d="M-14 -14L14 14M-14 14L14 -14" className="sym-x" /></g>
                <text x="26" y="40" className="tag" style={{ fill: '#c4271a' }}>salta el diferencial</text><text x="26" y="62" className="tag-s">síntoma → hipótesis → medida</text>
              </svg></div>
              <h3>Avería</h3>
              <p className="q">«Salta el diferencial cuando pongo la lavadora.»</p>
              <ul><li>Ocho averías por niveles, una por partida.</li><li>Diagnóstico con polímetro y pinza: síntoma, hipótesis, medida, reparación.</li><li>Parte en PDF con la causa y la medida que la habría localizado.</li></ul>
            </article>
            <article className="doc">
              <header><span>Boletín de verificación</span><i>Nº 0098</i></header>
              <div className="doc-art meg"><Megger kind="aislamiento" reading={null} running={false} volts={500} pair="Fase – tierra" band /><span className="stamp-doc">APTO</span></div>
              <h3>Boletín</h3>
              <p className="q">«Fírmame el boletín, que tengo prisa.»</p>
              <ul><li>Aislamiento, continuidad, tierra y disparo del diferencial.</li><li>Las condiciones de ensayo importan: una medida mal hecha no vale.</li><li>Algunas instalaciones llevan defectos: hay que negarse a firmar.</li></ul>
            </article>
          </div>
          <Cajetin hoja={4} titulo="Orden, parte y boletín" />
        </Hoja>

        <Hoja id="norma" n={5} eyebrow="Rigor y aula" title={<>Cada dato, <em>con su fuente</em>. Y listo para clase</>}>
          <div className="split norma">
            <div>
              <p className="sub">Los valores normativos viven en un único archivo de datos, con la ITC de la que salen y una marca honesta: <b>verificado</b> o <b>a verificar</b>. Si un valor no se ha podido contrastar con el texto oficial, la aplicación lo dice.</p>
              <ul className="sources">
                <SourceRow s={GAMMA_SOURCE} /><SourceRow s={DROP_SOURCE} /><SourceRow s={ITC25_SOURCE} /><SourceRow s={IZ_SOURCE} /><SourceRow s={BT_SOURCES.iso} />
              </ul>
            </div>
            <div className="encl-wrap">
              <div className="encl-box"><svg viewBox={`0 0 ${enclosure.w} ${enclosure.h}`} role="img" aria-label="Cuadro de vivienda en carril DIN">{enclosure.node}</svg></div>
              <ul className="spec tight">
                <li><Icon name="cuadro" size={18} /><span><b>Dimensiona el cuadro</b> con las fórmulas a la vista y llévatelo impreso con cajetín.</span></li>
                <li><Icon name="book" size={18} /><span><b>Comparte con la clase</b>: archivos <code>.omi</code>, planos propios y partes en PDF.</span></li>
                <li><Icon name="plano" size={18} /><span><b>También en móvil</b>: pensado para el ordenador, usable con el dedo.</span></li>
              </ul>
            </div>
          </div>
          <Cajetin hoja={5} titulo="Normativa y cuadro" />
        </Hoja>

        <Hoja id="acceso" n={6} eyebrow="Registro de usuarios" title={<>Entra y <em>empieza a montar</em></>} className="access">
          <div className="split access-grid">
            <div className="prose"><p>Crea tu cuenta en un minuto. Tus circuitos, tus mediciones y tus obras se guardan solos y te siguen entre dispositivos. Sin cuenta puedes probar con una pila, una resistencia y el polímetro.</p>
              <ul className="spec tight"><li><Icon name="check" size={18} /><span>Gratis para el alumnado.</span></li><li><Icon name="check" size={18} /><span>Tu progreso en la nube, sin instalar nada.</span></li></ul></div>
            <AuthCard initial={modo} />
          </div>
          <Cajetin hoja={6} titulo="Acceso y registro" />
        </Hoja>
      </main>

      <footer className="l-foot"><span>CircuitosSEA · Taller virtual de electrotecnia</span><span>Los valores normativos son orientativos: verifícalos con el REBT.</span></footer>
    </div>
  );
}
