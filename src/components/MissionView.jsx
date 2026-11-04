import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, FileText, Star, Lightbulb, Sparkles, Map } from 'lucide-react';
import { TEAMS, persp } from '../core/teams.js';
import { moduleById, challengesOf } from '../campaign/index.js';
import { xpFor, gradeLabel, formatNota } from '../core/progress.js';
import { PrimaryButton, Stars, TeamBadge } from './ui.jsx';
import { Confetti, GlitchText } from './fx.jsx';
import { LessonDeck, NotesDrawer } from './Lesson.jsx';
import Quiz from './challenges/Quiz.jsx';
import Classify from './challenges/Classify.jsx';
import Order from './challenges/Order.jsx';
import Code from './challenges/Code.jsx';
import Logs from './challenges/Logs.jsx';
import TerminalChallenge from './challenges/TerminalChallenge.jsx';

const COMPONENTS = { quiz: Quiz, classify: Classify, order: Order, code: Code, logs: Logs, terminal: TerminalChallenge };
const TYPE_LABEL = { quiz: 'Test', classify: 'Clasificar', order: 'Ordenar', code: 'Revisión de código', logs: 'Análisis de registros', terminal: 'Terminal' };

/** Semilla de los retos generados (fija si se define cyberops.seed, útil para pruebas). */
function newSeed() {
  try {
    const fixed = Number(localStorage.getItem('cyberops.seed'));
    if (fixed) return fixed;
  } catch { /* sin almacenamiento */ }
  return Math.floor(Math.random() * 2 ** 31);
}

/**
 * Estrellas (superada · sin pistas · como mucho un error) y puntos sobre 100:
 * cada reto vale lo mismo; cada error resta un 10 % y cada pista un 15 % de su valor (mínimo 40 %).
 */
export function starsFor(results) {
  const hints = results.reduce((s, r) => s + r.hints, 0);
  const mistakes = results.reduce((s, r) => s + r.mistakes, 0);
  const share = 100 / results.length;
  const score = Math.round(results.reduce((s, r) => s + share * Math.max(0.4, 1 - 0.1 * r.mistakes - 0.15 * r.hints), 0));
  return { stars: 1 + (hints === 0 ? 1 : 0) + (mistakes <= 1 ? 1 : 0), hints, mistakes, score };
}

export default function MissionView({ mission, team, previous, onExit, onComplete, onNext }) {
  const T = TEAMS[team];
  const mod = moduleById(mission.module);
  const [phase, setPhase] = useState('brief'); // brief | lesson | ch | done
  const [ci, setCi] = useState(0);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [seed] = useState(newSeed);
  const challenges = useMemo(() => challengesOf(mission, seed), [mission, seed]);

  const finishChallenge = (r) => {
    const next = [...results, r];
    setResults(next);
    if (ci + 1 < challenges.length) setCi(ci + 1);
    else {
      const s = starsFor(next);
      setSummary(s);
      setPhase('done');
      onComplete(s.stars, s.score);
    }
  };

  const steps = [{ id: 'brief', label: 'Briefing' }, { id: 'lesson', label: 'Aprende' }, ...challenges.map((c, k) => ({ id: `ch${k}`, label: `Reto ${k + 1}` })), { id: 'done', label: 'Informe' }];
  const activeId = phase === 'ch' ? `ch${ci}` : phase;
  const activeIdx = steps.findIndex((s) => s.id === activeId);
  const ch = challenges[ci];
  const Comp = ch && COMPONENTS[ch.type];

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-5" style={{ '--team': T.color }}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onExit} className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white"><ArrowLeft size={14} /> Operaciones</button>
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Módulo {mod.num} · {mod.title}</span>
        <span className="ml-auto"><TeamBadge team={team} /></span>
      </div>
      <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{mission.title}</h1>

      {/* Progreso de la misión */}
      <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-1">
        {steps.map((s, k) => (
          <div key={s.id} className="flex items-center gap-1">
            <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${k === activeIdx ? 'text-void-950' : k < activeIdx ? 'text-white' : 'text-slate-600'}`}
              style={k === activeIdx ? { background: T.color, boxShadow: `0 0 14px -2px ${T.color}` } : k < activeIdx ? { background: T.soft } : { background: 'rgba(255,255,255,.03)' }}>
              {s.label}
            </span>
            {k < steps.length - 1 && <span className="h-px w-4 shrink-0" style={{ background: k < activeIdx ? T.color : '#252c45' }} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={`${phase}-${ci}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }} className="mt-5">
          {phase === 'brief' && (
            <div className="glass hud-corner relative overflow-hidden rounded-2xl p-6">
              <div className="absolute right-4 top-4 font-mono text-[10px] uppercase tracking-widest text-slate-600">Clasificación: uso formativo</div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: T.color }}><FileText size={14} /> Expediente de la misión</div>
              {mission.kind && <span className="mt-3 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-void-950" style={{ background: mission.kind === 'exam' ? '#ffb534' : T.color }}>{mission.kind === 'exam' ? 'Examen · preguntas al azar' : 'Entrenamiento · datos nuevos en cada partida'}</span>}
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-100">{persp(mission.story, team)}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {challenges.map((c, k) => <span key={k} className="rounded-lg border border-void-600 bg-void-950/70 px-2.5 py-1 text-xs text-slate-300">Reto {k + 1}: <span className="font-bold text-white">{c.title}</span> <span className="text-slate-500">· {TYPE_LABEL[c.type]}</span></span>)}
              </div>
              {previous && <p className="mt-4 text-xs text-slate-500">Ya la superaste con <Stars n={previous.stars} size={11} />. Rejuega para mejorar tu marca.</p>}
              <PrimaryButton color={T.color} className="mt-6 px-5" onClick={() => setPhase('lesson')}>Abrir la lección <ArrowRight size={14} /></PrimaryButton>
            </div>
          )}

          {phase === 'lesson' && <LessonDeck mission={mission} challenges={challenges} team={team} color={T.color} onFinish={() => setPhase('ch')} />}

          {phase === 'ch' && Comp && (
            <div>
              <div className="mb-4 flex flex-wrap items-baseline gap-3">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: T.color }}>Reto {ci + 1}/{challenges.length} · {TYPE_LABEL[ch.type]}</span>
                <h2 className="text-xl font-extrabold text-white">{ch.title}</h2>
              </div>
              {ch.type === 'terminal' && <p className="mb-4 max-w-3xl text-sm text-slate-300">{ch.prompt}</p>}
              <div className={ch.type === 'terminal' ? '' : 'glass max-w-3xl rounded-2xl p-5'}>
                <Comp key={`${mission.id}-${ci}`} challenge={ch} color={T.color} onDone={finishChallenge} />
              </div>
            </div>
          )}

          {phase === 'done' && summary && (
            <div className="glass hud-corner relative overflow-hidden rounded-3xl p-6 sm:p-8">
              <Confetti colors={[T.color, '#ffb534', '#ffffff', '#2bff88']} />
              <div className="relative text-center">
                <div className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: T.color }}>Informe de la misión</div>
                <GlitchText as="h2" text="¡Misión cumplida!" className="mt-2 text-4xl font-extrabold text-white" />
                <div className="mt-5 flex justify-center gap-3">
                  {[0, 1, 2].map((k) => (
                    <motion.div key={k} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3 + k * 0.25, type: 'spring' }}>
                      <Star size={48} className={k < summary.stars ? 'fill-neon-amber text-neon-amber drop-shadow-[0_0_12px_rgba(255,181,52,.8)]' : 'text-slate-700'} />
                    </motion.div>
                  ))}
                </div>
                <div className="mx-auto mt-4 grid max-w-md grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-void-950/70 p-2 text-neon-green">★ Superada</div>
                  <div className={`rounded-lg bg-void-950/70 p-2 ${summary.hints === 0 ? 'text-neon-green' : 'text-slate-500'}`}>★ Sin pistas{summary.hints ? ` (${summary.hints})` : ''}</div>
                  <div className={`rounded-lg bg-void-950/70 p-2 ${summary.mistakes <= 1 ? 'text-neon-green' : 'text-slate-500'}`}>★ Precisión ({summary.mistakes} err.)</div>
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <span className="text-3xl font-extrabold" style={{ color: T.color }}>+{xpFor(mission, summary.stars)} XP</span>
                  <span className="rounded-xl border border-void-600 bg-void-950/70 px-3 py-1.5 text-sm">
                    <span className="font-extrabold text-white">{summary.score}</span><span className="text-slate-500">/100 puntos</span>
                    <span className="mx-2 text-slate-600">→</span>
                    <span className="font-extrabold" style={{ color: gradeLabel(summary.score / 10).color }}>{formatNota(summary.score / 10)} · {gradeLabel(summary.score / 10).label}</span>
                  </span>
                </motion.div>
                {previous && previous.score > summary.score && <p className="mt-2 text-xs text-slate-500">Para la nota del tema se guarda tu mejor marca ({previous.score} puntos).</p>}
              </div>
              <div className="relative mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-void-600 bg-void-950/60 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300"><Sparkles size={14} style={{ color: T.color }} /> Lo que has aprendido</div>
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-200">{mission.learned.map((l) => <li key={l} className="flex gap-2"><span style={{ color: T.color }}>✓</span>{l}</li>)}</ul>
                </div>
                <div className="rounded-2xl border p-4" style={{ borderColor: `${T.color}55`, background: T.soft }}>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: T.color }}><Lightbulb size={14} /> Consejo del {T.name}</div>
                  <p className="mt-2 text-sm text-slate-100">{persp(mission.tip, team)}</p>
                </div>
              </div>
              <div className="relative mt-6 flex flex-wrap justify-center gap-2">
                <button type="button" onClick={onExit} className="btn-neon border border-void-600 text-slate-300"><Map size={14} /> Volver al mapa</button>
                {onNext && <PrimaryButton color={T.color} onClick={onNext}>Siguiente misión <ArrowRight size={14} /></PrimaryButton>}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {phase === 'ch' && <NotesDrawer mission={mission} team={team} color={T.color} />}
    </div>
  );
}
