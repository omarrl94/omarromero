import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Award, ChevronRight, Languages } from 'lucide-react';
import RankBadge from './RankBadge.jsx';
import { ACHIEVEMENTS } from '../core/progress.js';
import { LANGUAGES } from '../core/languages.js';
import { play } from '../core/sound.js';

function Confetti() {
  const bits = Array.from({ length: 36 });
  const colors = ['#22e4ff', '#ff3df0', '#a3ff3d', '#ffb534', '#9d7bff'];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {bits.map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-2 w-1 rounded-sm"
          style={{ left: `${50 + (Math.random() - 0.5) * 20}%`, top: '45%', background: colors[i % colors.length] }}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
          animate={{ opacity: 0, x: (Math.random() - 0.5) * 700, y: (Math.random() - 0.7) * 500, rotate: Math.random() * 720 }}
          transition={{ duration: 1.6 + Math.random(), ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

/** Celebración al completar una misión: estrellas, desglose de XP y siguiente paso. */
export function RewardOverlay({ reward, onClose, onNext, onOtherLang, nextTitle }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!reward) return undefined;
    setShown(0);
    play('pass');
    const timers = [1, 2, 3].map((i) => setTimeout(() => { if (i <= reward.stars) { setShown(i); play('xp'); } }, 350 + i * 260));
    return () => timers.forEach(clearTimeout);
  }, [reward]);
  return (
    <AnimatePresence>
      {reward && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-void-950/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <Confetti />
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="glass relative w-full max-w-md rounded-2xl p-6 text-center neon-border"
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-neon-lime">Subsistema operativo</div>
            <h2 className="mt-1 text-2xl font-extrabold text-white">¡Misión completada!</h2>
            <div className="text-xs text-slate-400">en <span style={{ color: LANGUAGES[reward.lang].color }}>{LANGUAGES[reward.lang].name}</span></div>
            <div className="my-5 flex justify-center gap-3">
              {[1, 2, 3].map((i) => (
                <motion.div key={i} animate={i <= shown ? { scale: [0.4, 1.35, 1], rotate: [0, 20, 0] } : { scale: 1 }} transition={{ duration: 0.45 }}>
                  <Star size={44} className={i <= shown ? 'fill-neon-amber text-neon-amber drop-shadow-[0_0_12px_rgba(255,181,52,0.8)]' : 'text-void-600'} />
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-500">
              <span>superada</span><span>sin pistas</span><span>estilo limpio</span>
            </div>
            <div className="mt-4 space-y-1 rounded-xl border border-void-600/60 bg-void-950/50 p-3 text-left text-xs">
              {reward.breakdown.map((b) => (
                <div key={b.label} className="flex justify-between"><span className="text-slate-300">{b.label}</span><span className="font-bold text-neon-cyan">+{b.xp} XP</span></div>
              ))}
              {!reward.breakdown.length && <div className="text-slate-500">Ya tenías esta misión con estas estrellas.</div>}
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={onOtherLang} className="btn-neon border border-neon-violet/50 text-neon-violet hover:bg-neon-violet/10">
                <Languages size={13} /> Otro lenguaje (+50%)
              </button>
              {nextTitle ? (
                <button type="button" onClick={onNext} className="btn-neon bg-neon-cyan text-void-950 shadow-neon">
                  {nextTitle} <ChevronRight size={13} />
                </button>
              ) : (
                <button type="button" onClick={onClose} className="btn-neon bg-neon-cyan text-void-950 shadow-neon">Seguir</button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function RankUpOverlay({ rank, onClose }) {
  useEffect(() => { if (rank) play('rankup'); }, [rank]);
  return (
    <AnimatePresence>
      {rank && (
        <motion.div className="fixed inset-0 z-[55] grid place-items-center bg-void-950/80 p-4 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div initial={{ scale: 0.3, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 14 }} className="text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }} className="mx-auto w-fit">
              <RankBadge rank={rank} size={160} />
            </motion.div>
            <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.4em] text-slate-400">Nuevo rango de ingeniero</div>
            <div className="mt-1 text-4xl font-extrabold neon-text" style={{ color: rank.color }}>{rank.name}</div>
            <div className="mt-6 text-xs text-slate-500">toca para continuar</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AchievementToasts({ items, onDone }) {
  useEffect(() => {
    if (!items.length) return undefined;
    play('xp');
    const t = setTimeout(onDone, 4200);
    return () => clearTimeout(t);
  }, [items, onDone]);
  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-2">
      <AnimatePresence>
        {items.map((id) => {
          const a = ACHIEVEMENTS[id];
          return (
            <motion.div key={id} initial={{ x: -320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -320, opacity: 0 }} className="glass flex items-center gap-3 rounded-xl border-neon-amber/40 px-4 py-3 shadow-[0_0_30px_-8px_rgba(255,181,52,0.7)]">
              <Award className="text-neon-amber" size={22} />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-neon-amber">Logro desbloqueado</div>
                <div className="text-sm font-bold text-white">{a.name}</div>
                <div className="text-[11px] text-slate-400">{a.desc}</div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
