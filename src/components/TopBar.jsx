import { motion } from 'framer-motion';
import { Flame, Star, Volume2, VolumeX, Keyboard, Map as MapIcon, Orbit, Trophy, Coins, Cloud, CloudOff, Loader2, HardDrive, UserRound } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { LANGUAGES } from '../core/languages.js';
import { useProgress, rankOf, totalStars, worldXp, totalGold } from '../core/progress.js';
import RankBadge from './RankBadge.jsx';
import { play } from '../core/sound.js';

export function Logo({ compact = false, responsive = false }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M14 44 32 12l18 32H14z" fill="none" stroke="#22e4ff" strokeWidth="4" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 6px #22e4ff)' }} />
        <circle cx="32" cy="34" r="5" fill="#ff3df0" style={{ filter: 'drop-shadow(0 0 6px #ff3df0)' }} />
      </svg>
      {!compact && (
        <div className={`leading-none ${responsive ? 'hidden sm:block' : ''}`}>
          <div className="text-sm font-extrabold tracking-tight text-white">Code<span className="text-neon-cyan">Forge</span></div>
          <div className="text-[9px] uppercase tracking-[0.3em] text-neon-magenta">The Living Engine</div>
        </div>
      )}
    </div>
  );
}

/** Barra superior: el mundo en el que estás, su rango y su progreso. */
const SYNC = {
  loading: [Loader2, 'cargando de la nube…', 'text-slate-400 animate-spin'],
  saving: [Loader2, 'guardando…', 'text-slate-400 animate-spin'],
  saved: [Cloud, 'guardado en la nube', 'text-neon-lime'],
  error: [CloudOff, 'sin conexión: se guarda en este navegador y se sincronizará luego', 'text-neon-red'],
  local: [HardDrive, 'modo local: guardado en este navegador', 'text-slate-500'],
};

export default function TopBar({ view, onMap, onProfile, onWorlds, onRanking }) {
  const { state, dispatch, account, sync } = useProgress();
  const [SyncIcon, syncLabel, syncCls] = SYNC[sync] || SYNC.local;
  const L = LANGUAGES[state.lang];
  const xp = worldXp(state);
  const rank = rankOf(xp);
  const toggle = (key) => { dispatch({ type: 'setting', key, value: !state.settings[key] }); play('click'); };
  return (
    <header className="sticky top-0 z-30 border-b border-void-600/40 bg-void-950/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] flex-nowrap items-center gap-x-2.5 gap-y-2 px-3 py-2 sm:flex-wrap sm:gap-x-4 lg:px-4">
        <button type="button" onClick={onMap} className="shrink-0" aria-label="Mapa del mundo">
          <Logo responsive />
        </button>

        {L && (
          <button
            type="button"
            onClick={onMap}
            className="flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left sm:px-3"
            style={{ borderColor: `${L.color}66`, background: `${L.color}12`, boxShadow: `0 0 18px -8px ${L.color}` }}
            title="Estás en este mundo"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: L.color, boxShadow: `0 0 10px ${L.color}` }} />
            <span className="leading-none">
              <span className="block text-[9px] uppercase tracking-[0.25em] text-slate-400">Mundo</span>
              <span className="block truncate text-sm font-extrabold" style={{ color: L.color }}>{L.name}</span>
            </span>
          </button>
        )}

        <nav className="hidden items-center gap-1 sm:flex">
          {L && <button type="button" onClick={onMap} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${view === 'map' ? 'text-neon-cyan' : 'text-slate-400 hover:text-white'}`}>
            <MapIcon size={14} /> <span className="hidden sm:inline">Misiones</span>
          </button>}
          <button type="button" onClick={onRanking} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${view === 'ranking' ? 'text-neon-cyan' : 'text-slate-400 hover:text-white'}`}>
            <Trophy size={14} /> <span className="hidden sm:inline">Ranking</span>
          </button>
          <button type="button" onClick={onWorlds} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${view === 'worlds' ? 'text-neon-cyan' : 'text-slate-400 hover:text-white'}`} title="Salir a la galaxia de mundos">
            <Orbit size={14} /> <span className="hidden sm:inline">Mundos</span>
          </button>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2.5 sm:gap-3">
          <div className="hidden items-center gap-1 text-xs text-orange-300 sm:flex" title={`Racha: ${state.streak.count} día(s) · récord ${state.streak.best}`}>
            <Flame size={16} className={state.streak.count ? 'fill-orange-400 text-orange-400' : 'text-void-600'} /> {state.streak.count}
          </div>
          {L && (
            <div className="flex items-center gap-1 text-xs text-neon-amber" title="Estrellas en este mundo">
              <Star size={15} className="fill-neon-amber" /> {totalStars(state)}
            </div>
          )}
          <div className="flex items-center gap-1 text-xs font-bold text-amber-200" title="Oro conquistado en todos tus mundos">
            <Coins size={15} className="text-[#ffd34d]" /> {totalGold(state)}
          </div>
          <span title={syncLabel} aria-label={syncLabel}><SyncIcon size={15} className={syncCls} /></span>
          {L && <span className="hidden sm:block"><RankBadge rank={rank} size={30} /></span>}
          <button type="button" onClick={onProfile} className={`flex items-center gap-2 rounded-xl px-1.5 py-1 ${view === 'profile' ? 'bg-white/5' : 'hover:bg-white/5'}`} title={`Perfil de ${account ? account.nick : ''}`}>
            {account && <Avatar id={account.avatar} size={32} />}
            <div className="hidden w-32 text-left sm:block">
              <div className="truncate text-xs font-bold text-white">{account ? account.nick : ''}</div>
              <div className="flex justify-between text-[10px]">
                <span className="font-bold" style={{ color: rank.color }}>{rank.name}</span>
                <span className="text-slate-500">{xp} XP</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-void-700">
                <motion.div className="h-full rounded-full" style={{ background: rank.color, boxShadow: `0 0 8px ${rank.color}` }} animate={{ width: `${Math.round(rank.progress * 100)}%` }} transition={{ type: 'spring', stiffness: 80, damping: 18 }} />
              </div>
            </div>
          </button>
          <button type="button" onClick={() => toggle('sound')} className="text-slate-400 hover:text-white" aria-label="Sonido" title="Sonidos">
            {state.settings.sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button type="button" onClick={() => toggle('keys')} className={`hidden sm:block ${state.settings.keys ? 'text-neon-cyan' : 'text-slate-600 hover:text-white'}`} aria-label="Sonido de teclas" title="Clic táctil al teclear">
            <Keyboard size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

/** Navegación inferior en el móvil: las secciones principales al alcance del pulgar. */
export function MobileNav({ view, onMap, onProfile, onWorlds, onRanking }) {
  const { state } = useProgress();
  const items = [
    state.lang && { id: 'map', label: 'Misiones', Icon: MapIcon, on: onMap },
    { id: 'worlds', label: 'Mundos', Icon: Orbit, on: onWorlds },
    { id: 'ranking', label: 'Ranking', Icon: Trophy, on: onRanking },
    state.lang && { id: 'profile', label: 'Perfil', Icon: UserRound, on: onProfile },
  ].filter(Boolean);
  return (
    <nav className="kb-hide fixed inset-x-0 bottom-0 z-30 border-t border-void-600/50 bg-void-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden" aria-label="Navegación principal">
      <div className="flex">
        {items.map(({ id, label, Icon, on }) => (
          <button
            key={id}
            type="button"
            onClick={() => { play('click'); on(); }}
            aria-current={view === id ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-bold uppercase tracking-wider ${view === id ? 'text-neon-cyan' : 'text-slate-500'}`}
          >
            <Icon size={19} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
