import { motion } from 'framer-motion';
import { ICONS as Icons } from './icons.js';
import { Lock, Star, ChevronRight } from 'lucide-react';
import { MODULES } from '../curriculum/index.js';
import { LANGUAGES, LANG_ORDER } from '../core/languages.js';
import { useProgress, moduleUnlocked, bestStars, isDone } from '../core/progress.js';
import { play } from '../core/sound.js';

/** Mapa del motor: cada módulo es un subsistema del Engine Loop que vas construyendo. */
export default function EngineMap({ onOpen }) {
  const { state } = useProgress();
  const next = MODULES.flatMap((m) => m.challenges.map((c) => ({ c, m }))).find(({ c, m }) => moduleUnlocked(state, m.id) && !isDone(state, c.id));
  const builtPct = Math.round((MODULES.flatMap((m) => m.challenges).filter((c) => isDone(state, c.id)).length / MODULES.flatMap((m) => m.challenges).length) * 100);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-3 pb-24 lg:px-4">
      <section className="glass relative mb-5 overflow-hidden rounded-2xl p-5 md:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-neon-magenta/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-neon-cyan">The Engine Loop</div>
            <h1 className="mt-1 text-2xl font-extrabold text-white md:text-3xl">Construye el motor, <span className="text-neon-magenta neon-text">pieza a pieza</span>.</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              No hay ejercicios sueltos: cada misión programa una parte real del mundo —física, IA de drones, memoria, entidades—. Cambia de lenguaje cuando quieras: el mismo problema, otro paradigma, bonus políglota.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-extrabold text-neon-lime neon-text">{builtPct}%</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">motor construido</div>
            </div>
            {next && (
              <button
                type="button"
                onClick={() => { play('run'); onOpen(next.c.id); }}
                className="btn-neon bg-neon-cyan text-void-950 shadow-neon hover:brightness-110"
              >
                Continuar: {next.c.title} <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="relative grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((m, mi) => {
          const unlocked = moduleUnlocked(state, m.id);
          const Icon = Icons[m.icon] || Icons.Box;
          const done = m.challenges.filter((c) => isDone(state, c.id)).length;
          return (
            <motion.section
              key={m.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: mi * 0.06 }}
              className={`glass relative overflow-hidden rounded-2xl p-4 ${m.boss ? 'md:col-span-2 xl:col-span-3' : ''} ${unlocked ? '' : 'opacity-60'}`}
              style={{ boxShadow: unlocked ? `0 0 0 1px ${m.color}33, 0 0 30px -12px ${m.color}` : undefined }}
            >
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: `${m.color}1a`, color: m.color, boxShadow: `inset 0 0 0 1px ${m.color}55` }}>
                  <Icon size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: m.color }}>{m.boss ? 'Boss Fight' : `Módulo ${m.id}`}</div>
                  <h2 className="text-base font-extrabold text-white">{m.name}</h2>
                  <p className="text-xs text-slate-400">{m.subtitle}</p>
                </div>
                <div className="text-right text-xs text-slate-500">{done}/{m.challenges.length}</div>
              </div>
              <div className="mt-3 space-y-2">
                {m.challenges.map((c) => {
                  const stars = bestStars(state, c.id);
                  const langs = Object.keys(state.completed[c.id] || {});
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => { play('click'); onOpen(c.id); }}
                      className="group flex w-full items-center gap-3 rounded-xl border border-void-600/50 bg-void-950/40 px-3 py-2.5 text-left transition-all hover:border-neon-cyan/50 hover:bg-neon-cyan/5 disabled:cursor-not-allowed disabled:hover:border-void-600/50 disabled:hover:bg-transparent"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-slate-100 group-hover:text-white">{c.title}</div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-500">{c.codename} · {c.xp} XP</div>
                      </div>
                      <div className="flex gap-1" title="Lenguajes completados">
                        {LANG_ORDER.map((l) => (
                          <span key={l} className="h-1.5 w-1.5 rounded-full" style={{ background: langs.includes(l) ? LANGUAGES[l].color : '#252c45', boxShadow: langs.includes(l) ? `0 0 6px ${LANGUAGES[l].color}` : 'none' }} />
                        ))}
                      </div>
                      <div className="flex">
                        {[1, 2, 3].map((i) => <Star key={i} size={12} className={i <= stars ? 'fill-neon-amber text-neon-amber' : 'text-void-600'} />)}
                      </div>
                      {unlocked ? <ChevronRight size={16} className="text-slate-600 group-hover:text-neon-cyan" /> : <Lock size={14} className="text-slate-600" />}
                    </button>
                  );
                })}
              </div>
              {!unlocked && <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500"><Lock size={12} /> Completa el módulo anterior para desbloquear.</div>}
            </motion.section>
          );
        })}
      </div>
    </div>
  );
}
