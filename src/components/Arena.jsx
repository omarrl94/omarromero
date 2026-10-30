import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, ChevronDown, BookOpen, Zap, Star, ArrowLeft, Radio } from 'lucide-react';
import CodeEditor from './CodeEditor.jsx';
import LiveCanvas from './LiveCanvas.jsx';
import ConsolePanel, { Checks } from './ConsolePanel.jsx';
import DuckCompanion from './DuckCompanion.jsx';
import { evaluate } from '../core/engine.js';
import { LANGUAGES } from '../core/languages.js';
import { MODULES, sceneOf, objectiveOf } from '../curriculum/index.js';
import { useProgress, draftKey, starsOf } from '../core/progress.js';
import { play } from '../core/sound.js';

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
  const [briefOpen, setBriefOpen] = useState(true);
  const [failStreak, setFailStreak] = useState(0);
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
    if (!window.confirm('¿Restaurar el código inicial de la misión? Perderás tu borrador en este lenguaje.')) return;
    dispatch({ type: 'resetDraft', id: ch.id, lang });
    setCode(ch.starter[lang]);
  };

  const jump = useCallback((line) => setFocus({ line, at: Date.now() }), []);
  const switchLang = (l) => { dispatch({ type: 'setLang', lang: l }); play('click'); };

  const sceneData = useMemo(() => ({ ...(evaluation ? evaluation.scene : {}), passed: !!(evaluation && evaluation.passed) }), [evaluation]);
  const lintLines = useMemo(() => (evaluation ? evaluation.lint.map((w) => w.line) : []), [evaluation]);
  const stars = starsOf(state, ch.id, lang);
  const solvedAny = Object.keys(state.completed[ch.id] || {}).length > 0;
  const L = LANGUAGES[lang];
  const status = !evaluation ? 'idle' : evaluation.error ? 'error' : evaluation.passed ? 'pass' : 'fail';

  return (
    <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col gap-3 px-3 pb-3 lg:px-4">
      {/* cabecera de misión */}
      <div className="glass rounded-xl px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={onBack} className="rounded-lg border border-void-600 p-1.5 text-slate-400 hover:border-neon-cyan/50 hover:text-neon-cyan" aria-label="Volver al mapa">
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: module.color }}>
              Módulo {ch.module} · {module.name} · {ch.codename}
            </div>
            <h1 className="truncate text-lg font-extrabold text-white">{ch.title}</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-0.5" title="★ superada · ★ sin pistas profundas · ★ estilo impecable">
              {[1, 2, 3].map((i) => (
                <Star key={i} size={16} className={i <= stars ? 'fill-neon-amber text-neon-amber' : 'text-void-600'} />
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-neon-cyan/30 px-2 py-1 text-xs text-neon-cyan">
              <Zap size={13} /> {ch.xp} XP
            </div>
            <button type="button" onClick={() => setBriefOpen(!briefOpen)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
              <BookOpen size={14} /> Briefing <ChevronDown size={14} className={`transition-transform ${briefOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
        <AnimatePresence initial={false}>
          {briefOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="grid gap-3 pt-3 text-[13px] leading-relaxed md:grid-cols-[1.4fr_1fr]">
                <div>
                  <p className="text-slate-300">{ch.story}</p>
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
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <div className="glass flex min-h-[420px] flex-col overflow-hidden rounded-xl">
          <div className="flex items-center gap-2 border-b border-void-600/50 px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: L.color, boxShadow: `0 0 10px ${L.color}` }} />
            <span className="text-xs font-bold text-slate-200">{ { python: 'main.py', java: 'Main.java', kotlin: 'Main.kt', swift: 'main.swift', c: 'main.c' }[lang] }</span>
            <span className="hidden text-[10px] text-slate-500 sm:inline">{L.tagline}</span>
            <div className="ml-auto flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500" title="Compilar y ejecutar mientras escribes">
                <input type="checkbox" className="accent-cyan-400" checked={state.settings.autorun} onChange={(e) => dispatch({ type: 'setting', key: 'autorun', value: e.target.checked })} />
                <Radio size={12} /> vivo
              </label>
              <button type="button" onClick={reset} className="rounded-md p-1.5 text-slate-500 hover:text-white" title="Restaurar código inicial" aria-label="Restaurar código inicial">
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={() => run(true)}
                className="btn-neon bg-neon-cyan/15 text-neon-cyan shadow-neon hover:bg-neon-cyan/25"
                title="Ctrl + Enter"
              >
                <Play size={13} className="fill-current" /> Desplegar
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 p-1.5">
            <CodeEditor
              code={code}
              onChange={(c) => { setCode(c); if (briefOpen) setBriefOpen(false); }}
              lang={lang}
              errorLine={evaluation && evaluation.error ? evaluation.error.line : null}
              lintLines={lintLines}
              focus={focus}
              onRun={() => run(true)}
            />
          </div>
          <div className="border-t border-void-600/50 px-3 py-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Checks de la misión</span>
              <StatusPill status={status} />
            </div>
            {evaluation ? <Checks checks={evaluation.checks} /> : <div className="text-xs text-slate-500">Compilando…</div>}
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          <div className="glass relative min-h-[260px] flex-[3] overflow-hidden rounded-xl p-1.5">
            <LiveCanvas sceneName={sceneOf(ch, lang)} data={sceneData} error={evaluation ? evaluation.error : null} lang={lang} runId={runId} onJumpLine={jump} />
            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-void-950/70 px-2 py-0.5 text-[10px] uppercase tracking-widest text-slate-400">
              <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${status === 'error' ? 'bg-neon-red' : status === 'pass' ? 'bg-neon-lime' : 'bg-neon-cyan'}`} />
              live engine
            </div>
          </div>
          <div className="glass min-h-[200px] flex-[2] overflow-hidden rounded-xl">
            <ConsolePanel evaluation={evaluation} lang={lang} ch={ch} solved={solvedAny} onSwitchLang={switchLang} onJumpLine={jump} />
          </div>
        </div>
      </div>

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
