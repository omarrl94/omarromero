/**
 * Portada: explica de qué va CircuitosSEA con piezas del propio simulador funcionando en vivo
 * (polímetro, osciloscopio, vatímetro, panel real, plano del juego) y da acceso (Firebase Auth).
 */
import { useEffect, useMemo, useState } from 'react';
import { firebaseConfigured } from '../firebase';
import { useAuth } from '../auth';
import { saveGuard, useStore } from '../store';
import { simulate } from '../model/netlist';
import { rlcSerie } from '../model/examples';
import { cableReport } from '../model/cables';
import { defaultPanel, computePanel } from '../model/panel';
import { multifilarDiagram, panelEnclosure, unifilarDiagram } from './diagrams';
import { Multimeter, MeterInfo } from './Multimeter';
import { Scope } from './Scope';
import { Wattmeter } from './Wattmeter';
import { RealPanel } from './RealPanel';
import { Viewport } from './Viewport';
import { PlanSvg } from './PlanSvg';
import { Boom } from './Boom';
import './landing.css';

/* ───────── Circuito de la cabecera: se acciona, se cortocircuita y revienta ───────── */
function HeroCircuit() {
  const [on, setOn] = useState(true);
  const [dead, setDead] = useState(false);
  const [boomKey, setBoomKey] = useState(0);
  const lit = on && !dead;
  const loop = 'M120 110H600V270H120';
  const short = () => { if (dead) return; setDead(true); setBoomKey((k) => k + 1); };
  return (
    <figure className="hero-circuit">
      <svg viewBox="0 0 720 380" role="img" aria-label="Circuito con pila, interruptor y lámpara">
        <defs>
          <radialGradient id="hglow"><stop offset="0" stopColor="#fff2a8" stopOpacity="0.95" /><stop offset="0.5" stopColor="#ffcf40" stopOpacity="0.38" /><stop offset="1" stopColor="#ffcf40" stopOpacity="0" /></radialGradient>
        </defs>
        {/* cables */}
        <path d={`${loop}V190`} fill="none" stroke="#3a342e" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M120 110H300M390 110H600V150M600 230V270H120V232M120 148V110" fill="none" stroke="#e8e0d2" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        {lit && <path d="M120 148V110H300M390 110H600V150M600 230V270H120V232" fill="none" className="hflow" />}
        {/* pila */}
        <g transform="translate(120 190)">
          <rect x={-34} y={-44} width={68} height={88} rx={10} fill="#2a2622" stroke="#6b6358" />
          <rect x={-34} y={-44} width={68} height={22} rx={10} fill="#efcd2f" /><text y={-27} textAnchor="middle" fontSize={13} fontWeight={800} fill="#2a2622">12 V</text>
          <text y={14} textAnchor="middle" fontSize={11} fill="#a9cabb">PILA</text>
          {dead && <circle r={50} className="burnt-glow" />}
        </g>
        {/* interruptor */}
        <g transform="translate(345 110)">
          <circle cx={-45} r={6} fill="#e8e0d2" /><circle cx={45} r={6} fill="#e8e0d2" />
          <path d={on ? 'M-45 0H45' : 'M-45 0L35 -34'} stroke="#efcd2f" strokeWidth={8} strokeLinecap="round" style={{ transition: 'all .2s' }} />
          <rect x={-60} y={-46} width={120} height={92} fill="transparent" style={{ cursor: 'pointer' }} onClick={() => !dead && setOn(!on)} tabIndex={0} role="button" aria-label="Accionar interruptor" onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !dead && setOn(!on)} />
        </g>
        {/* lámpara */}
        <g transform="translate(600 190)">
          {lit && <circle r={120} fill="url(#hglow)" className="hpulse" />}
          <circle r={38} fill={lit ? '#fff4b8' : '#3a342e'} stroke="#e8e0d2" strokeWidth={4} style={{ transition: 'fill .2s' }} />
          <path d="M-18 -18L18 18M-18 18L18 -18" stroke={lit ? '#b8860b' : '#6b6358'} strokeWidth={4} strokeLinecap="round" />
        </g>
        {/* cable del cortocircuito */}
        {dead && <path d="M120 150C60 150 60 230 120 230" fill="none" stroke="#e53935" strokeWidth={7} strokeLinecap="round" />}
        {dead && <g transform="translate(120 190)" key={boomKey}><Boom big /></g>}
      </svg>
      <figcaption>
        <button className="chip-btn" onClick={() => !dead && setOn(!on)} disabled={dead}>{on ? 'Abrir interruptor' : 'Cerrar interruptor'}</button>
        {!dead ? <button className="chip-btn danger" onClick={short}>Provocar un cortocircuito</button> : <button className="chip-btn" onClick={() => { setDead(false); setOn(true); }}>Reponer la pila</button>}
        <span className="hint">{dead ? '¡Cortocircuito! La pila se ha quemado. Aquí se aprende por qué.' : 'Pruébalo: es un circuito de verdad.'}</span>
      </figcaption>
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
  if (!firebaseConfigured) {
    return (
      <div className="auth-card" id="acceso">
        <h3>Modo demostración</h3>
        <p>Esta copia no está conectada a Firebase, así que no hay cuentas. Puedes usar todo el simulador igualmente; tu trabajo se guarda solo en este navegador.</p>
        <button className="cta" onClick={() => a.continueGuest()}>Entrar al simulador</button>
        <p className="tiny">Para activar las cuentas, sigue la guía «Despliegue en Netlify con Firebase» del repositorio.</p>
      </div>
    );
  }
  return (
    <form className="auth-card" id="acceso" onSubmit={submit} noValidate>
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'crear'} className={mode === 'crear' ? 'on' : ''} onClick={() => { setMode('crear'); a.clear(); }}>Crear cuenta</button>
        <button type="button" role="tab" aria-selected={mode === 'entrar'} className={mode === 'entrar' ? 'on' : ''} onClick={() => { setMode('entrar'); a.clear(); }}>Ya tengo cuenta</button>
      </div>
      {mode === 'crear' && <label>Nombre<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Cómo quieres que te llamemos" /></label>}
      <label>Correo<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required placeholder="tu@correo.es" /></label>
      <label>Contraseña<input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete={mode === 'crear' ? 'new-password' : 'current-password'} required placeholder="Al menos 6 caracteres" /></label>
      {a.error && <p className="msg err" role="alert">{a.error}</p>}
      {a.info && <p className="msg ok" role="status">{a.info}</p>}
      <button className="cta" type="submit" disabled={a.busy}>{a.busy ? 'Un momento…' : mode === 'crear' ? 'Crear mi cuenta' : 'Entrar'}</button>
      <div className="or"><span>o</span></div>
      <button type="button" className="google" onClick={() => void a.google()} disabled={a.busy}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" /><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" /><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" /></svg>
        Continuar con Google
      </button>
      {mode === 'entrar' && <button type="button" className="link" onClick={() => void a.reset(email)}>He olvidado mi contraseña</button>}
      <p className="tiny">Tu progreso (proyectos y obras del juego) se guarda en tu cuenta y te sigue entre dispositivos.</p>
    </form>
  );
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

  const goto = (m: 'entrar' | 'crear') => { setModo(m); document.getElementById('acceso')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };

  return (
    <div className="landing">
      <header className="l-nav">
        <a className="l-logo" href="#top"><svg width="28" height="28" viewBox="0 0 32 32" aria-hidden><rect width="32" height="32" rx="7" fill="#2A2622" /><path d="M4 16h6l3-8 6 16 3-8h6" fill="none" stroke="#EFCD2F" strokeWidth="2.6" strokeLinejoin="round" /></svg> CircuitosSEA</a>
        <nav><a href="#instrumentos">Instrumentos</a><a href="#vistas">Vistas</a><a href="#juego">Juego</a><a href="#cuadro">Cuadro</a></nav>
        <button className="nav-btn" onClick={() => goto('entrar')}>Entrar</button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <h1>Equivócate aquí,<br />no en la obra.</h1>
          <p className="lede">Un taller de electricidad en el navegador. Monta circuitos, mídelos con un polímetro que te castiga como el de verdad y reforma la instalación de una casa entera.</p>
          <div className="hero-cta">
            <button className="cta" onClick={() => goto('crear')}>Crear cuenta gratis</button>
            <button className="cta-ghost" onClick={() => goto('entrar')}>Ya tengo cuenta</button>
          </div>
          <p className="fine">Funciona en el navegador, también en tablet. Hecho para el ciclo de Sistemas Electrotécnicos y Automatizados.</p>
        </div>
        <HeroCircuit />
      </section>

      <section className="band" id="instrumentos">
        <div className="band-copy">
          <h2>Un polímetro que no te perdona</h2>
          <p>Gira la rueda, arrastra las puntas hasta un borne y mide. Si pones intensidad en paralelo, se funde el fusible. Si mides ohmios con tensión, el aparato te avisa. Como en el taller, pero sin quemar el de clase.</p>
          <ul className="plain"><li>Polímetro, osciloscopio de dos canales y vatímetro.</li><li>Corriente continua y alterna con fasores.</li><li>Cada medida va a una hoja con su error frente al valor teórico.</li></ul>
        </div>
        <div className="instruments">
          {ready && <>
            <div className="inst-box"><Multimeter sim={sim} /><MeterInfo sim={sim} /></div>
            <div className="inst-box wide"><Scope sim={sim} demoComp="R1" /></div>
            <div className="inst-box"><Wattmeter sim={sim} demoId="A1" /></div>
          </>}
        </div>
      </section>

      <section className="views" id="vistas">
        <div className="views-head">
          <h2>El mismo circuito, dibujado de tres formas</h2>
          <p>Cambia entre el panel de montaje real, el esquema multifilar y el unifilar: es siempre el mismo circuito RLC de 230 V. Cada cable lleva su sección y se calcula su caída de tensión.</p>
          <div className="seg2" role="tablist">{([['real', 'Montaje real'], ['multifilar', 'Multifilar'], ['unifilar', 'Unifilar']] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={vista === k} className={vista === k ? 'on' : ''} onClick={() => setVista(k)}>{l}</button>)}</div>
        </div>
        <div className="view-stage">
          {ready && vista === 'real' && <RealPanel sim={sim} cables={cables} />}
          {vista === 'multifilar' && <Viewport d={mf} />}
          {vista === 'unifilar' && <Viewport d={uf} />}
        </div>
      </section>

      <section className="game-band" id="juego">
        <div className="order-mini">
          <span className="stamp">Encargo nuevo</span>
          <h2>Reforma una casa de verdad</h2>
          <p className="q">«Me muero de calor en verano: quiero aire acondicionado en el salón. Y que el pasillo se encienda desde los dos extremos.»</p>
          <p>Un cliente aleatorio te encarga la electricidad de su vivienda. Colocas los mecanismos, eliges calibres y secciones, y el inspector da tensión: si un cable no aguanta su protección, <b>arde</b>.</p>
          <ul className="plain"><li>Bases prohibidas a menos de 0,6 m de la bañera.</li><li>Diferencial, caída de tensión y cortocircuito comprobados.</li><li>Presupuesto, estrellas y cobro al terminar.</li></ul>
        </div>
        <div className="plan-peek">{ready && <PlanSvg mode="test" />}</div>
      </section>

      <section className="band reverse" id="cuadro">
        <div className="encl-box"><svg viewBox={`0 0 ${enclosure.w} ${enclosure.h}`}>{enclosure.node}</svg></div>
        <div className="band-copy">
          <h2>Calcula el cuadro y llévatelo impreso</h2>
          <p>Elige los circuitos y el simulador dimensiona protecciones y conductores paso a paso, con la fórmula a la vista. Después imprime el plano con su cajetín, o expórtalo a PDF, SVG o PNG.</p>
          <ul className="plain"><li>Electrificación básica con sus circuitos C1 a C5.</li><li>Cuadro de cargas, unifilar y aspecto real en carril DIN.</li><li>Datos normativos con su fuente y marcados «a verificar».</li></ul>
        </div>
      </section>

      <section className="access">
        <div className="access-copy">
          <h2>Entra y empieza a montar</h2>
          <p>Crea tu cuenta en un minuto. Tus circuitos, tus mediciones y tus obras del juego se guardan solos y te siguen a casa.</p>
        </div>
        <AuthCard initial={modo} />
      </section>

      <footer className="l-foot">CircuitosSEA · Taller virtual de electrotecnia. Los valores normativos son orientativos: verifícalos con el REBT.</footer>
    </div>
  );
}
