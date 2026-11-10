import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, ChevronDown, BookOpen, Zap, Star, ArrowLeft, Radio, GraduationCap, Eye, Code2, MonitorPlay } from 'lucide-react';
import LessonPanel from './LessonPanel.jsx';
import { ArenaTour, SolutionPanel, ConfirmBar } from './Guides.jsx';
import CodeEditor from './CodeEditor.jsx';
import LiveCanvas from './LiveCanvas.jsx';
import ConsolePanel, { Checks } from './ConsolePanel.jsx';
import DuckCompanion from './DuckCompanion.jsx';
import { evaluate } from '../core/engine.js';
import { LANGUAGES } from '../core/languages.js';
import { MODULES, sceneOf, objectiveOf, storyOf } from '../curriculum/index.js';
import { sourceFile } from '../core/transpiler.js';
import { useProgress, draftKey, starsOf } from '../core/progress.js';
import { play } from '../core/sound.js';
import { useMedia, COMPACT, isCompactNow } from '../core/useMedia.js';

/** IDE Arena: editor a la izquierda, mundo vivo a la derecha. */
export default function Arena({ ch, onBack }) {
  const { state, dispatch } = useProgress();
  const lang = state.lang;
  const key = draftKey(ch.id, lang);
  const initial = state.drafts[key] ?? ch.starter[lang];
  const [code, setCode] = useState(initial);
  const [evaluation, setEvaluation] = useState(null);
  const [runId, setRunId] = useState(0);
  const [focus, setFocus] = useState(null);
  // En el móvil el briefing empieza plegado para dejar sitio al editor (ya lo cuenta la lección).
  const [briefOpen, setBriefOpen] = useState(() => !isCompactNow());
  // Pestaña visible en pantallas estrechas: «code» (editor y checks) o «engine» (mundo y consola).
  const [pane, setPane] = useState('code');
  const compact = useMedia(COMPACT);
  const [failStreak, setFailStreak] = useState(0);
  const [lessonOpen, setLessonOpen] = useState(!(state.lessonsSeen || {})[draftKey(ch.id, state.lang)]);
  const [tourOpen, setTourOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const prevError = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const module = MODULES.find((m) => m.id === ch.module);

  // Cambiar de misión o de lenguaje carga el borrador correspondiente.
  useEffect(() => {
    setCode(stateRef.current.drafts[draftKey(ch.id, lang)] ?? ch.starter[lang]);
    setEvaluation(null);
    setFailStreak(0);
    prevError.current = false;
  }, [ch.id, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = useCallback((manual = false) => {
    const ev = evaluate(ch, code, lang);
    setEvaluation(ev);
    setRunId((r) => r + 1);
    const fixed = prevError.current && !ev.error;
    prevError.current = !!ev.error;
    dispatch({ type: 'run', fixed });
    setFailStreak((n) => (ev.passed ? 0 : n + 1));
    if (ev.passed) {
      const st = stateRef.current;
      const noHints = !(st.hints[draftKey(ch.id, lang)] > 0);
      const stars = 1 + (noHints ? 1 : 0) + (ev.lint.length === 0 ? 1 : 0);
      if (stars > starsOf(st, ch.id, lang)) {
        dispatch({ type: 'complete', id: ch.id, lang, clean: ev.lint.length === 0 });
      } else if (manual) play('pass');
    } else if (ev.error) {
      if (manual) play('error');
    } else if (manual) play('run');
  }, [ch, code, lang, dispatch]);

  // Ejecución en vivo (debounce) y guardado del borrador.
  useEffect(() => {
    const t = setTimeout(() => {
      dispatch({ type: 'draft', id: ch.id, lang, code });
      if (state.settings.autorun) run(false);
    }, 650);
    return () => clearTimeout(t);
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    dispatch({ type: 'resetDraft', id: ch.id, lang });
    setCode(ch.starter[lang]);
    setConfirmReset(false);
  };

  const closeLesson = () => {
    setLessonOpen(false);
    dispatch({ type: 'lessonSeen', id: ch.id, lang });
    if (!state.tourSeen) setTourOpen(true);
  };

  const jump = useCallback((line) => { setPane('code'); setFocus({ line, at: Date.now() }); }, []);
  // En el móvil, desplegar te lleva a ver el mundo reaccionar.
  const deploy = () => { run(true); if (compact) showPane('engine'); };
  // Al cambiar de pestaña en el móvil, vuelve arriba para ver la pestaña desde el principio.
  const showPane = (id) => { setPane(id); if (compact) window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const sceneData = useMemo(() => ({ ...(evaluation ? evaluation.scene : {}), passed: !!(evaluation && evaluation.passed) }), [evaluation]);
  const lintLines = useMemo(() => (evaluation ? evaluation.lint.map((w) => w.line) : []), [evaluation]);
  const stars = starsOf(state, ch.id, lang);
  const solvedHere = stars > 0;
  const L = LANGUAGES[lang];
  const status = !evaluation ? 'idle' : evaluation.error ? 'error' : evaluation.passed ? 'pass' : 'fail';

  return (
    <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col gap-3 px-3 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:px-4 lg:pb-3">
      {/* cabecera de misión */}
      <div className="glass rounded-xl px-3 py-2.5 lg:px-4 lg:py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <button type="button" onClick={onBack} className="rounded-lg border border-void-600 p-1.5 text-slate-400 hover:border-neon-cyan/50 hover:text-neon-cyan" aria-label="Volver al mapa">
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0 flex-1 lg:flex-none">
            <div className="truncate text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: module.color }}>
              Módulo {ch.module} · {module.name} · {ch.codename}
            </div>
            <h1 className="truncate text-base font-extrabold text-white lg:text-lg">{ch.title}</h1>
          </div>
          <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 lg:ml-auto lg:w-auto lg:flex-nowrap">
            <div className="flex items-center gap-0.5" title="★ superada · ★ sin pistas profundas · ★ estilo impecable">
              {[1, 2, 3].map((i) => (
                <Star key={i} size={16} className={i <= stars ? 'fill-neon-amber text-neon-amber' : 'text-void-600'} />
              ))}
            </div>
            <div className="flex items-center gap-1 whitespace-nowrap rounded-lg border border-neon-cyan/30 px-2 py-1 text-xs text-neon-cyan">
              <Zap size={13} /> {ch.xp} XP
            </div>
            <button type="button" onClick={() => { setLessonOpen(true); play('click'); }} className="btn-neon border border-neon-lime/40 text-neon-lime hover:bg-neon-lime/10">
              <GraduationCap size={14} /> Aprende
            </button>
            <button type="button" onClick={() => setBriefOpen(!briefOpen)} className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-white lg:ml-0">
              <BookOpen size={14} /> <span className="hidden min-[380px]:inline">Briefing</span> <ChevronDown size={14} className={`transition-transform ${briefOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
        <AnimatePresence initial={false}>
          {briefOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="grid gap-3 pt-3 text-[13px] leading-relaxed md:grid-cols-[1.4fr_1fr]">
                <div>
                  <p className="text-slate-300">{storyOf(ch, lang)}</p>
                  <p className="mt-2 rounded-lg border-l-2 border-neon-lime bg-neon-lime/5 px-3 py-2 text-lime-100">
                    <span className="font-bold text-neon-lime">Objetivo › </span>{objectiveOf(ch, lang)}
                  </p>
                </div>
                <div className="rounded-lg border border-violet-400/20 bg-violet-400/5 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-neon-violet">Concepto · {ch.concept.title}</div>
                  <p className="mt-1 text-slate-300">{ch.concept.text}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* vista dividida */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        <div className={`glass min-h-[420px] min-w-0 flex-col overflow-hidden rounded-xl lg:flex ${pane === 'code' ? 'flex' : 'hidden'}`}>
          <div className="flex items-center gap-2 border-b border-void-600/50 px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: L.color, boxShadow: `0 0 10px ${L.color}` }} />
            <span className="text-xs font-bold text-slate-200">{sourceFile(lang).replace('src/', '')}</span>
            <span className="hidden text-[10px] text-slate-500 sm:inline">{L.tagline}</span>
            <div className="ml-auto flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500" title="Compilar y ejecutar mientras escribes">
                <input type="checkbox" className="accent-cyan-400" checked={state.settings.autorun} onChange={(e) => dispatch({ type: 'setting', key: 'autorun', value: e.target.checked })} />
                <Radio size={12} /> vivo
              </label>
              <button type="button" onClick={() => setConfirmReset(true)} className="rounded-md p-1.5 text-slate-500 hover:text-white" title="Restaurar código inicial" aria-label="Restaurar código inicial">
                <RotateCcw size={14} />
              </button>
              {/* En el móvil este botón vive en la barra inferior. */}
              <span className="hidden lg:contents">
                <button
                  type="button"
                  onClick={() => run(true)}
                  className="btn-neon bg-neon-cyan/15 text-neon-cyan shadow-neon hover:bg-neon-cyan/25"
                  title="Ctrl + Enter"
                >
                  <Play size={13} className="fill-current" /> Desplegar
                </button>
              </span>
            </div>
          </div>
          {confirmReset && <ConfirmBar text="¿Volver al código inicial? Perderás tus cambios en este lenguaje." confirm="Restaurar" onConfirm={reset} onCancel={() => setConfirmReset(false)} />}
          <div className="h-[55dvh] min-h-[300px] p-1.5 lg:h-auto lg:min-h-0 lg:flex-1">
            <CodeEditor
              code={code}
              onChange={(c) => { setCode(c); if (briefOpen) setBriefOpen(false); }}
              lang={lang}
              errorLine={evaluation && evaluation.error ? evaluation.error.line : null}
              lintLines={lintLines}
              focus={focus}
              onRun={() => run(true)}
              keypad={compact}
            />
          </div>
          <div className="border-t border-void-600/50 px-3 py-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Checks de la misión</span>
              <StatusPill status={status} />
            </div>
            {evaluation && evaluation.error && evaluation.error.kind !== 'runtime' && (
              <div className="mb-2 rounded-md border border-neon-amber/30 bg-neon-amber/5 px-2 py-1.5 text-[11px] text-amber-100">
                El código aún no compila{evaluation.error.line ? ` (línea ${evaluation.error.line})` : ''}: arregla primero ese error y los objetivos se comprobarán de verdad.
              </div>
            )}
            {evaluation ? <Checks checks={evaluation.checks} lang={lang} /> : <div className="text-xs text-slate-500">Compilando…</div>}
            {status !== 'pass' && (
              <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-void-600/40 pt-2 text-[11px]">
                <span className="text-slate-500">¿Perdido?</span>
                <button type="button" onClick={() => setLessonOpen(true)} className="text-neon-lime hover:underline">repasa la lección</button>
                <span className="text-void-600">·</span>
                <span className="text-slate-500">pregunta al pato 🦆</span>
                <span className="text-void-600">·</span>
                <button type="button" onClick={() => setSolutionOpen(true)} className="flex items-center gap-1 text-slate-400 hover:text-white"><Eye size={12} /> ver la solución explicada</button>
              </div>
            )}
          </div>
        </div>

        <div className={`min-h-0 min-w-0 flex-col gap-3 lg:flex ${pane === 'engine' ? 'flex' : 'hidden'}`}>
          <div className="glass relative aspect-[4/3] max-h-[60dvh] min-h-[240px] overflow-hidden rounded-xl p-1.5 lg:aspect-auto lg:max-h-none lg:min-h-[260px] lg:flex-[3]">
            <LiveCanvas sceneName={sceneOf(ch, lang)} data={sceneData} error={evaluation ? evaluation.error : null} lang={lang} runId={runId} onJumpLine={jump} />
            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-void-950/70 px-2 py-0.5 text-[10px] uppercase tracking-widest text-slate-400">
              <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${status === 'error' ? 'bg-neon-red' : status === 'pass' ? 'bg-neon-lime' : 'bg-neon-cyan'}`} />
              live engine
            </div>
          </div>
          <div className="glass min-h-[260px] overflow-hidden rounded-xl lg:min-h-[200px] lg:flex-[2]">
            <ConsolePanel evaluation={evaluation} lang={lang} ch={ch} solved={solvedHere} onJumpLine={jump} />
          </div>
        </div>
      </div>

      <MobileArenaBar pane={pane} setPane={showPane} status={status} evaluation={evaluation} onDeploy={deploy} />

      <LessonPanel key={`${ch.id}-${lang}`} ch={ch} lang={lang} open={lessonOpen} onClose={closeLesson} />
      <ArenaTour open={tourOpen} onClose={() => { setTourOpen(false); dispatch({ type: 'tourSeen' }); }} />
      <SolutionPanel
        ch={ch}
        lang={lang}
        open={solutionOpen}
        onClose={() => setSolutionOpen(false)}
        onReveal={() => dispatch({ type: 'hint', id: ch.id, lang })}
        onLoad={(c) => { setCode(c); setSolutionOpen(false); }}
      />
      <DuckCompanion
        ch={ch}
        lang={lang}
        code={code}
        evaluation={evaluation}
        stuck={failStreak >= 4}
        hintsUsed={state.hints[key] || 0}
        onDeepHint={() => dispatch({ type: 'hint', id: ch.id, lang })}
        onFocusLine={jump}
      />
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    idle: ['bg-slate-500/20 text-slate-400', 'en espera'],
    error: ['bg-neon-red/15 text-neon-red', 'glitch'],
    fail: ['bg-neon-amber/15 text-neon-amber', 'en progreso'],
    pass: ['bg-neon-lime/15 text-neon-lime', 'operativo'],
  };
  const [cls, label] = map[status];
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls}`}>{label}</span>;
}

/** Barra inferior de la arena en el móvil: pestañas Código / Motor y el botón de desplegar al alcance del pulgar. */
function MobileArenaBar({ pane, setPane, status, evaluation, onDeploy }) {
  const checks = evaluation ? evaluation.checks : [];
  const ok = checks.filter((c) => c.ok).length;
  const dot = status === 'error' ? 'bg-neon-red' : status === 'pass' ? 'bg-neon-lime' : status === 'fail' ? 'bg-neon-amber' : 'bg-slate-500';
  const tab = (id, Icon, label, extra) => (
    <button
      type="button"
      onClick={() => { setPane(id); play('click'); }}
      aria-pressed={pane === id}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-bold uppercase tracking-wider ${pane === id ? 'bg-neon-cyan/10 text-neon-cyan' : 'text-slate-400'}`}
    >
      <span className="relative"><Icon size={18} />{extra}</span>
      {label}
    </button>
  );
  return (
    <nav className="kb-hide fixed inset-x-0 bottom-0 z-30 border-t border-void-600/50 bg-void-950/95 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-md lg:hidden" aria-label="Vistas de la arena">
      <div className="mx-auto flex max-w-xl items-stretch gap-2">
        {tab('code', Code2, checks.length ? `Código · ${ok}/${checks.length}` : 'Código')}
        {tab('engine', MonitorPlay, 'Motor', <span className={`absolute -right-1.5 -top-0.5 h-2 w-2 rounded-full ${dot}`} />)}
        <button type="button" onClick={onDeploy} className="btn-neon flex-[1.3] justify-center bg-neon-cyan/20 py-2.5 text-sm text-neon-cyan shadow-neon active:bg-neon-cyan/30">
          <Play size={15} className="fill-current" /> Desplegar
        </button>
      </div>
    </nav>
  );
}
