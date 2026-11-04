import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Swords, ShieldCheck, Combine, Layers, Trophy, Terminal } from 'lucide-react';
import { Logo } from './ui.jsx';
import { GlitchText, Radar } from './fx.jsx';
import { TEAMS } from '../core/teams.js';
import { MODULES } from '../campaign/index.js';

const BOOT = [
  '[ OK ] Iniciando núcleo de Otero OS 10.0',
  '[ OK ] Montando laboratorio aislado (sin conexión a sistemas reales)',
  '[ OK ] Cargando escenario: Nébula Logística S.L. (empresa ficticia)',
  '[ OK ] 10 módulos · 40 misiones · 3 equipos',
  '[ OK ] Cifrado de la sesión del agente',
  '>> Sistema listo. Bienvenida/o, agente.',
];

/** Secuencia de arranque + portada. */
export default function Intro({ onStart }) {
  const [lines, setLines] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setLines(BOOT.length); setReady(true); return undefined; }
    const id = setInterval(() => setLines((n) => {
      if (n + 1 >= BOOT.length) { clearInterval(id); setTimeout(() => setReady(true), 450); }
      return n + 1;
    }), 260);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative z-10 mx-auto flex min-h-full max-w-6xl flex-col px-4 py-8">
      <AnimatePresence mode="wait">
        {!ready ? (
          <motion.div key="boot" exit={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }} className="m-auto w-full max-w-xl font-mono text-sm">
            {BOOT.slice(0, lines).map((l) => (
              <motion.div key={l} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className={l.startsWith('>>') ? 'mt-2 text-neon-green' : 'text-green-200/70'}>
                {l.startsWith('[ OK ]') ? <><span className="text-neon-green">[ OK ]</span>{l.slice(6)}</> : l}
              </motion.div>
            ))}
            <span className="inline-block h-4 w-2 animate-pulse bg-neon-green align-middle" />
            <button type="button" onClick={() => setReady(true)} className="mt-6 block text-xs text-slate-500 hover:text-slate-300">Saltar ›</button>
          </motion.div>
        ) : (
          <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-1 flex-col">
            <div className="flex items-center justify-between"><Logo /><span className="hidden text-[11px] uppercase tracking-[0.3em] text-slate-500 sm:block">Academia de ciberseguridad</span></div>

            <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-neon-green/30 bg-neon-green/5 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-neon-green">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-green" /> De cero a experto, jugando
                </span>
                <GlitchText text="Operación Otero" className="text-5xl font-extrabold leading-none tracking-tight text-white sm:text-7xl" />
                <p className="mt-5 max-w-xl text-base text-slate-300">
                  Entras en JROTERO Ciberseguridad y te asignan a un equipo. Diez módulos, desde la ética y la terminal hasta la respuesta a un incidente en vivo.
                  Todo pasa en un laboratorio simulado: aprendes haciendo, sin riesgo.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={onStart} className="group btn-neon bg-neon-green px-6 py-3 text-sm text-void-950 shadow-[0_0_30px_-6px_#2bff88]">
                    Empezar la misión <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </button>
                  <span className="text-xs text-slate-500">Gratis · sin instalar nada · en castellano</span>
                </div>
              </div>
              <div className="relative flex justify-center">
                <div className="absolute inset-0 m-auto h-64 w-64 rounded-full bg-neon-green/10 blur-3xl" />
                <Radar color="#2bff88" size={260} />
                {[['red', Swords, '8%', '12%'], ['blue', ShieldCheck, '72%', '20%'], ['purple', Combine, '40%', '78%']].map(([t, Icon, l, tp], i) => (
                  <motion.div key={t} className="absolute flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold backdrop-blur"
                    style={{ left: l, top: tp, color: TEAMS[t].color, borderColor: `${TEAMS[t].color}66`, background: `${TEAMS[t].color}14` }}
                    animate={{ y: [0, -8, 0] }} transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}>
                    <Icon size={13} /> {TEAMS[t].name}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="mt-14 grid gap-3 sm:grid-cols-3">
              {[
                [Layers, 'Elige tu perspectiva', 'Rojo (ataque autorizado), Azul (defensa) o Morado (los dos a la vez). El mismo temario, visto desde tu lado.'],
                [Terminal, 'Juega de verdad', 'Terminal simulada, revisión de código, análisis de registros, clasificación de amenazas e incidentes en vivo.'],
                [Trophy, 'Sube de rango', 'XP, 3 estrellas por misión, 8 rangos por equipo, rachas diarias y ranking con tu clase.'],
              ].map(([Icon, t, d], i) => (
                <motion.div key={t} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 * i }} className="glass hud-corner rounded-2xl p-4" style={{ '--team': '#2bff88' }}>
                  <Icon size={20} className="text-neon-green" />
                  <h3 className="mt-2 font-bold text-white">{t}</h3>
                  <p className="mt-1 text-sm text-slate-400">{d}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-10">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-slate-500">El camino del agente</h2>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {MODULES.map((m, i) => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                    className="min-w-[150px] rounded-xl border border-void-600 bg-void-900/70 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-neon-green/80">{String(m.num).padStart(2, '0')} · {m.level}</div>
                    <div className="mt-1 text-sm font-bold text-white">{m.title}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">{m.subtitle}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
