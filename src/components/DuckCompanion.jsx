import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, X, Lightbulb, Crosshair } from 'lucide-react';
import { askDuck, reflect } from '../core/duck.js';
import { play } from '../core/sound.js';

function Duck({ mood, size = 56 }) {
  const eye = mood === 'alert' ? '#ff4767' : mood === 'happy' ? '#a3ff3d' : '#22e4ff';
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id="duckBody" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#ffe36b" />
          <stop offset="100%" stopColor="#f2a516" />
        </radialGradient>
      </defs>
      <ellipse cx="34" cy="44" rx="22" ry="14" fill="url(#duckBody)" />
      <circle cx="26" cy="24" r="13" fill="url(#duckBody)" />
      <path d="M12 25 L2 28 L12 31 Z" fill="#ff7a2f" />
      <rect x="20" y="18" width="14" height="6" rx="2" fill="#0d1019" />
      <rect x="22" y="19.5" width="4" height="3" rx="1" fill={eye}>
        {mood === 'think' && <animate attributeName="x" values="22;28;22" dur="2.4s" repeatCount="indefinite" />}
      </rect>
      <path d="M44 40 q8 -2 12 -8" stroke="#f2a516" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Compañero socrático flotante. Nunca da la respuesta: pregunta.
 * Las preguntas más concretas (a partir de la segunda) cuentan como «pista profunda»
 * y cuestan la estrella de autonomía.
 */
export default function DuckCompanion({ ch, lang, code, evaluation, stuck, onDeepHint, onFocusLine, hintsUsed }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [talk, setTalk] = useState([]);
  const [draft, setDraft] = useState('');
  const advice = useMemo(() => askDuck({ ch, lang, code, evaluation }), [ch, lang, code, evaluation]);
  const signature = `${advice.title}|${advice.questions[0]}`;

  useEffect(() => { setStep(0); }, [signature]);
  useEffect(() => { setTalk([]); setStep(0); }, [ch.id, lang]);

  const reveal = () => {
    if (step + 1 >= advice.questions.length) return;
    setStep(step + 1);
    onDeepHint();
    play('duck');
  };

  const send = () => {
    if (!draft.trim()) return;
    const reply = reflect(draft, evaluation);
    setTalk((tk) => [...tk.slice(-6), { who: 'me', text: draft }, { who: 'duck', text: reply }]);
    setDraft('');
    play('duck');
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="glass w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-void-600/50 px-4 py-2.5">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon-amber">Rubber Duck AI</div>
                <div className="text-xs text-slate-300">{advice.title}</div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-slate-400 hover:text-white" aria-label="Cerrar pato">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[50vh] space-y-2 overflow-y-auto px-4 py-3 text-[13px] leading-relaxed">
              {advice.questions.slice(0, step + 1).map((q, i) => (
                <motion.div key={q} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className={`rounded-lg px-3 py-2 ${i === 0 ? 'bg-amber-400/10 text-amber-100' : 'bg-violet-400/10 text-violet-100'}`}>
                  <span className="mr-1 text-neon-amber">{i === 0 ? '🦆' : '›'}</span>
                  {q}
                </motion.div>
              ))}
              {talk.map((m, i) => (
                <div key={i} className={`rounded-lg px-3 py-2 ${m.who === 'me' ? 'ml-6 bg-cyan-400/10 text-cyan-100' : 'mr-6 bg-amber-400/10 text-amber-100'}`}>
                  {m.text}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-void-600/50 px-4 py-2">
              {step + 1 < advice.questions.length && (
                <button type="button" onClick={reveal} className="btn-neon border border-violet-400/40 text-violet-200 hover:bg-violet-400/10">
                  <Lightbulb size={13} /> Pregunta más concreta
                </button>
              )}
              {advice.focus && (
                <button type="button" onClick={() => onFocusLine(advice.focus)} className="btn-neon border border-red-400/40 text-red-200 hover:bg-red-400/10">
                  <Crosshair size={13} /> Ir a la línea {advice.focus}
                </button>
              )}
              <span className="ml-auto text-[10px] text-slate-500">{hintsUsed ? `${hintsUsed} pista(s) profunda(s)` : 'Sin pistas: ★ autonomía'}</span>
            </div>
            <form className="flex gap-2 border-t border-void-600/50 p-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Explícale tu código al pato…"
                className="min-w-0 flex-1 rounded-lg border border-void-600 bg-void-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-amber/60"
              />
              <button type="submit" className="rounded-lg bg-neon-amber/20 px-3 text-neon-amber hover:bg-neon-amber/30" aria-label="Enviar">
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        onClick={() => { setOpen(!open); play('duck'); }}
        whileHover={{ scale: 1.08, rotate: -6 }}
        whileTap={{ scale: 0.92 }}
        animate={stuck && !open ? { y: [0, -10, 0] } : { y: 0 }}
        transition={stuck && !open ? { repeat: Infinity, duration: 1.1 } : {}}
        className="relative grid h-16 w-16 place-items-center rounded-full border border-neon-amber/40 bg-void-900/90 shadow-[0_0_30px_-6px_rgba(255,181,52,0.6)]"
        aria-label="Abrir Rubber Duck AI"
      >
        <Duck mood={advice.mood} />
        {stuck && !open && (
          <span className="absolute -left-28 top-1 whitespace-nowrap rounded-full bg-neon-amber px-2 py-0.5 text-[10px] font-bold text-void-950">¿Atascado? Cuack</span>
        )}
      </motion.button>
    </div>
  );
}
