import { motion } from 'framer-motion';
import { Star, ChevronRight } from 'lucide-react';
import { LANGUAGES, LANG_ORDER } from '../core/languages.js';
import { CHALLENGES } from '../curriculum/index.js';
import { useProgress, rankOf, worldXp, worldDone, totalStars, goldOf } from '../core/progress.js';
import RankBadge from './RankBadge.jsx';
import { GalaxyMap } from './ConquestMaps.jsx';
import { play } from '../core/sound.js';

/**
 * Galaxia de mundos: cada lenguaje es un mundo completo e independiente,
 * con su propio motor que construir, su XP, su rango y sus estrellas.
 */
export default function WorldHub({ onEnter, intro = false }) {
  const { state, account } = useProgress();
  return (
    <div className="mx-auto w-full max-w-[1400px] px-3 pb-24 lg:px-4">
      <section className="mb-5 pt-2 text-center">
        <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-neon-cyan">{intro ? 'Elige tu primer mundo' : 'Galaxia de mundos'}</div>
        <h1 className="mx-auto mt-2 max-w-3xl text-2xl font-extrabold text-white md:text-3xl" style={{ textWrap: 'balance' }}>
          Cada lenguaje es un <span className="text-neon-magenta neon-text">mundo propio</span>
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400">
          Cada planeta es un lenguaje. Conquista sus misiones y se irá cubriendo de oro; complétalo y ganará una corona. Dentro de un mundo, todo se explica en su lenguaje.
        </p>
      </section>
      <GalaxyMap onEnter={onEnter} avatar={account ? account.avatar : 'nova'} />
      <h2 className="mb-3 mt-8 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Todos los mundos</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {LANG_ORDER.map((l, i) => {
          const L = LANGUAGES[l];
          const done = worldDone(state, l);
          const xp = worldXp(state, l);
          const rank = rankOf(xp);
          const started = done > 0 || Object.keys(state.drafts).some((k) => k.endsWith(`:${l}`));
          const current = state.lang === l;
          return (
            <motion.button
              key={l}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -3 }}
              onClick={() => { play('run'); onEnter(l); }}
              className="glass group relative overflow-hidden rounded-2xl p-4 text-left"
              style={{ boxShadow: `0 0 0 1px ${L.color}${current ? 'aa' : '33'}, 0 0 30px -14px ${L.color}` }}
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl" style={{ background: `${L.color}26` }} />
              <div className="relative flex items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg font-extrabold" style={{ background: `${L.color}1f`, color: L.color, boxShadow: `inset 0 0 0 1px ${L.color}66` }}>
                  {L.name === 'JavaScript' ? 'JS' : L.name.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-extrabold" style={{ color: L.color }}>Mundo {L.name}</h2>
                    {L.trending && <span className="rounded-full bg-orange-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-300">🔥 en auge</span>}
                    {current && <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-200">aquí estás</span>}
                  </div>
                  <p className="mt-1 text-[12px] leading-snug text-slate-300">{L.tagline}</p>
                </div>
              </div>
              <p className="relative mt-3 text-[11px] leading-snug text-slate-500">{L.paradigm}</p>
              <div className="relative mt-3 flex items-center gap-3">
                <RankBadge rank={rank} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-[10px]">
                    <span style={{ color: rank.color }} className="font-bold">{rank.name}</span>
                    <span className="text-slate-500">{done}/{CHALLENGES.length} · <Star size={10} className="inline fill-neon-amber text-neon-amber" /> {totalStars(state, l)} · <span className="text-amber-200">{goldOf(state, l)} oro</span></span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-void-700">
                    <div className="h-full rounded-full" style={{ width: `${(done / CHALLENGES.length) * 100}%`, background: L.color }} />
                  </div>
                </div>
                <span className="flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: L.color }}>
                  {started ? 'Entrar' : 'Empezar'} <ChevronRight size={14} />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
