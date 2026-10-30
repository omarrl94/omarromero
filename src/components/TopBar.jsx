import { motion } from 'framer-motion';
import { Flame, Star, Volume2, VolumeX, Keyboard, Map as MapIcon, User } from 'lucide-react';
import { LANGUAGES, LANG_ORDER } from '../core/languages.js';
import { useProgress, rankOf, totalStars } from '../core/progress.js';
import RankBadge from './RankBadge.jsx';
import { play } from '../core/sound.js';

export function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M14 44 32 12l18 32H14z" fill="none" stroke="#22e4ff" strokeWidth="4" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 6px #22e4ff)' }} />
        <circle cx="32" cy="34" r="5" fill="#ff3df0" style={{ filter: 'drop-shadow(0 0 6px #ff3df0)' }} />
      </svg>
      {!compact && (
        <div className="leading-none">
          <div className="text-sm font-extrabold tracking-tight text-white">Code<span className="text-neon-cyan">Forge</span></div>
          <div className="text-[9px] uppercase tracking-[0.3em] text-neon-magenta">The Living Engine</div>
        </div>
      )}
    </div>
  );
}

export default function TopBar({ view, onMap, onProfile }) {
  const { state, dispatch } = useProgress();
  const rank = rankOf(state.xp);
  const toggle = (key) => { dispatch({ type: 'setting', key, value: !state.settings[key] }); play('click'); };
  return (
    <header className="sticky top-0 z-30 border-b border-void-600/40 bg-void-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 lg:px-4">
        <button type="button" onClick={onMap} className="shrink-0" aria-label="Mapa del motor">
          <Logo />
        </button>

        {/* Polyglot Core: selector de lenguaje */}
        <div className="order-3 flex w-full items-center gap-1 overflow-x-auto rounded-xl border border-void-600/50 bg-void-900/60 p-1 sm:order-none sm:w-auto" role="radiogroup" aria-label="Lenguaje">
          {LANG_ORDER.map((l) => {
            const L = LANGUAGES[l];
            const active = state.lang === l;
            return (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => { dispatch({ type: 'setLang', lang: l }); play('click'); }}
                className={`relative whitespace-nowrap rounded-lg px-3 py-1 text-xs font-bold transition-colors ${active ? 'text-void-950' : 'text-slate-400 hover:text-slate-100'}`}
              >
                {active && <motion.span layoutId="lang-pill" className="absolute inset-0 rounded-lg" style={{ background: L.color, boxShadow: `0 0 16px ${L.color}` }} transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                <span className="relative">{L.name}</span>
              </button>
            );
          })}
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          <button type="button" onClick={onMap} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${view === 'map' ? 'text-neon-cyan' : 'text-slate-400 hover:text-white'}`}>
            <MapIcon size={14} /> Motor
          </button>
          <button type="button" onClick={onProfile} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${view === 'profile' ? 'text-neon-cyan' : 'text-slate-400 hover:text-white'}`}>
            <User size={14} /> Perfil
          </button>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-orange-300" title={`Racha: ${state.streak.count} día(s) · récord ${state.streak.best}`}>
            <Flame size={16} className={state.streak.count ? 'fill-orange-400 text-orange-400' : 'text-void-600'} /> {state.streak.count}
          </div>
          <div className="flex items-center gap-1 text-xs text-neon-amber" title="Estrellas">
            <Star size={15} className="fill-neon-amber" /> {totalStars(state)}
          </div>
          <button type="button" onClick={onProfile} className="flex items-center gap-2" title={`${state.xp} Neural XP`}>
            <RankBadge rank={rank} size={34} />
            <div className="hidden w-36 text-left sm:block">
              <div className="flex justify-between text-[10px]">
                <span className="font-bold" style={{ color: rank.color }}>{rank.name}</span>
                <span className="text-slate-500">{state.xp} XP</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-void-700">
                <motion.div className="h-full rounded-full" style={{ background: rank.color, boxShadow: `0 0 8px ${rank.color}` }} animate={{ width: `${Math.round(rank.progress * 100)}%` }} transition={{ type: 'spring', stiffness: 80, damping: 18 }} />
              </div>
            </div>
          </button>
          <button type="button" onClick={() => toggle('sound')} className="text-slate-400 hover:text-white" aria-label="Sonido" title="Sonidos">
            {state.settings.sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button type="button" onClick={() => toggle('keys')} className={state.settings.keys ? 'text-neon-cyan' : 'text-slate-600 hover:text-white'} aria-label="Sonido de teclas" title="Clic táctil al teclear">
            <Keyboard size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
