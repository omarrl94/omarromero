import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Circle, Lightbulb, ArrowRight, CornerDownLeft, Target } from 'lucide-react';
import { createShell, run, commandNames, HELP } from '../../core/shell.js';
import { objectiveDone, answerOk } from '../../campaign/helpers.js';
import { Feedback, PrimaryButton } from '../ui.jsx';

const BANNER = (st) => [
  { text: `Conectado a ${st.host} · laboratorio simulado de JROTERO (nada de esto toca sistemas reales)`, dim: true },
  { text: 'Escribe «help» para ver los comandos. Tab autocompleta, ↑ recupera órdenes.', dim: true },
];

/** Reto de terminal: shell simulada + panel de objetivos con respuestas y pistas. */
export default function TerminalChallenge({ challenge, color, onDone }) {
  const shell = useMemo(() => createShell(challenge.scenario), [challenge]);
  const [out, setOut] = useState(() => BANNER(shell));
  const [input, setInput] = useState('');
  const [hIdx, setHIdx] = useState(null);
  const [tick, setTick] = useState(0);
  const [answers, setAnswers] = useState({});
  const [bad, setBad] = useState({});
  const [mistakes, setMistakes] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [howOpen, setHowOpen] = useState({});
  const scroller = useRef(null);
  const inputRef = useRef(null);

  const status = challenge.objectives.map((o) => objectiveDone(o, shell));
  const doneCount = status.filter(Boolean).length;
  const allDone = doneCount === challenge.objectives.length;
  const prompt = `${shell.user}@${shell.host}:${shell.cwd.replace(shell.home, '~') || '/'}$`;

  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight }); }, [out]);

  const exec = (line) => {
    const res = run(shell, line);
    setOut((o) => (res.clear ? [] : [...o, { text: `${prompt} ${line}`, cmd: true }, ...res.lines]));
    setInput('');
    setHIdx(null);
    setTick((t) => t + 1);
  };

  const onKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); exec(input); }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!shell.history.length) return;
      const i = hIdx === null ? shell.history.length - 1 : Math.max(0, hIdx - 1);
      setHIdx(i);
      setInput(shell.history[i]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hIdx === null) return;
      const i = hIdx + 1;
      if (i >= shell.history.length) { setHIdx(null); setInput(''); } else { setHIdx(i); setInput(shell.history[i]); }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setInput(complete(shell, input));
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setOut([]);
    }
  };

  const submitAnswer = (o) => {
    const v = answers[o.id] || '';
    if (!v.trim()) return;
    if (answerOk(o, v)) {
      shell.answers[o.id] = v;
      setBad((b) => ({ ...b, [o.id]: false }));
    } else {
      setBad((b) => ({ ...b, [o.id]: true }));
      setMistakes((m) => m + 1);
    }
    setTick((t) => t + 1);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]" data-tick={tick}>
      {/* Terminal con efecto CRT */}
      <div className="crt relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-neon-green/25 bg-[#020604] shadow-[0_0_40px_-12px_rgba(43,255,136,.45)]" onClick={() => inputRef.current?.focus()}>
        <div className="flex items-center gap-2 border-b border-neon-green/15 bg-black/40 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-neon-red/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-neon-amber/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-neon-green/80" />
          <span className="ml-2 truncate text-[11px] text-green-300/60">{shell.user}@{shell.host} — terminal segura</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-widest text-green-300/50"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-green" /> en vivo</span>
        </div>
        <div ref={scroller} className="term relative z-10 flex-1 overflow-y-auto px-4 py-3 text-green-100" style={{ maxHeight: 520 }}>
          {out.map((l, k) => (
            <pre key={k} className={l.cmd ? 'text-neon-green' : l.err ? 'text-red-300' : l.dim ? 'text-green-300/50' : 'text-green-50/90'}>{l.text}</pre>
          ))}
          <div className="flex gap-2">
            <span className="shrink-0 text-neon-green">{prompt}</span>
            <input ref={inputRef} className="term-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
              autoFocus spellCheck={false} autoComplete="off" autoCapitalize="off" aria-label="Línea de comandos" />
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 border-t border-neon-green/15 bg-black/40 px-3 py-1.5 sm:hidden">
          <button type="button" className="btn-neon border border-neon-green/40 text-neon-green" onClick={() => exec(input)}><CornerDownLeft size={12} /> Ejecutar</button>
        </div>
      </div>

      {/* Objetivos */}
      <div className="space-y-3">
        <div className="glass rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-2">
            <Target size={16} style={{ color }} />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Objetivos</span>
            <span className="ml-auto text-xs font-bold" style={{ color }}>{doneCount}/{challenge.objectives.length}</span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-void-700">
            <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: `${(doneCount / challenge.objectives.length) * 100}%` }} />
          </div>
          <ul className="space-y-2.5">
            {challenge.objectives.map((o, k) => (
              <li key={o.id} className="text-sm">
                <div className="flex items-start gap-2">
                  <motion.span animate={status[k] ? { scale: [1, 1.4, 1] } : {}} className="mt-0.5 shrink-0">
                    {status[k] ? <Check size={16} className="text-neon-green" /> : <Circle size={16} className="text-slate-600" />}
                  </motion.span>
                  <span className={status[k] ? 'text-slate-400 line-through decoration-neon-green/40' : 'text-slate-100'}>{o.text}</span>
                </div>
                {o.answer && !status[k] && (
                  <form className="ml-6 mt-1.5 flex gap-1.5" onSubmit={(e) => { e.preventDefault(); submitAnswer(o); }}>
                    <input value={answers[o.id] || ''} onChange={(e) => setAnswers((a) => ({ ...a, [o.id]: e.target.value }))} placeholder={o.placeholder || 'respuesta'}
                      className={`min-w-0 flex-1 rounded-lg border bg-void-950 px-2 py-1 font-mono text-xs text-white outline-none focus:border-neon-green ${bad[o.id] ? 'border-neon-red/70' : 'border-void-600'}`} />
                    <button type="submit" className="rounded-lg border border-void-600 px-2 text-xs font-bold text-slate-200 hover:border-neon-green">OK</button>
                  </form>
                )}
                {o.answer && bad[o.id] && !status[k] && <p className="ml-6 mt-1 text-[11px] text-red-300">No es correcto. Revisa la salida de la terminal.</p>}
                {o.how && !status[k] && (
                  <button type="button" className="ml-6 mt-1 text-[11px] text-slate-500 hover:text-slate-300" onClick={() => setHowOpen((h) => ({ ...h, [o.id]: true }))}>
                    {howOpen[o.id] ? <span className="font-mono text-neon-amber">{o.how}</span> : '¿Cómo? (cuenta como pista)'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
        {challenge.hints?.length > 0 && !allDone && (
          <div className="glass rounded-2xl p-4">
            <button type="button" onClick={() => setHintLevel((n) => n + 1)} disabled={hintLevel >= challenge.hints.length}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neon-amber disabled:opacity-40">
              <Lightbulb size={14} /> Pedir pista
            </button>
            <AnimatePresence>
              {challenge.hints.slice(0, hintLevel).map((h) => (
                <motion.p key={h} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-xs text-amber-100/90">💡 {h}</motion.p>
              ))}
            </AnimatePresence>
          </div>
        )}
        {allDone && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-2">
            <Feedback kind="ok">Todos los objetivos cumplidos.</Feedback>
            <div className="glass rounded-2xl p-4">
              <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color }}>Así lo resolvería un profesional</div>
              <p className="mt-1 text-[11px] text-slate-400">Compáralo con lo que has hecho tú: hay muchas formas, esta es una de las más directas.</p>
              <ol className="mt-2 space-y-2">
                {challenge.solution.map((line) => {
                  const t = line.trim().split(/\s+/);
                  const name = t[0] === 'sudo' ? t[1] : t[0];
                  return (
                    <li key={line} className="text-xs">
                      <code className="block break-all rounded-md bg-[#020604] px-2 py-1 font-mono text-[11px] text-green-200">$ {line}</code>
                      {HELP[name] && <span className="mt-0.5 block text-slate-400">{t[0] === 'sudo' ? 'Con sudo (como administrador). ' : ''}{HELP[name]}</span>}
                    </li>
                  );
                })}
              </ol>
            </div>
            <PrimaryButton color={color} className="w-full" onClick={() => onDone({ mistakes, hints: hintLevel + Object.keys(howOpen).length })}>Completar reto <ArrowRight size={14} /></PrimaryButton>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/** Autocompletado de comandos y rutas. */
function complete(st, input) {
  const parts = input.split(' ');
  const last = parts[parts.length - 1];
  if (parts.length === 1) {
    const m = commandNames().filter((c) => c.startsWith(last));
    return m.length === 1 ? `${m[0]} ` : input;
  }
  const slash = last.lastIndexOf('/');
  const dirPart = slash >= 0 ? last.slice(0, slash + 1) : '';
  const base = last.slice(slash + 1);
  const dirAbs = dirPart ? (dirPart.startsWith('/') ? dirPart : `${st.cwd}/${dirPart}`).replace('~', st.home) : st.cwd;
  let node = st.fs;
  for (const p of dirAbs.split('/').filter(Boolean)) { node = node?.children?.[p]; }
  if (!node || node.type !== 'dir') return input;
  const m = Object.keys(node.children).filter((n) => n.startsWith(base));
  if (m.length !== 1) return input;
  const child = node.children[m[0]];
  parts[parts.length - 1] = dirPart + m[0] + (child.type === 'dir' ? '/' : '');
  return parts.join(' ');
}
