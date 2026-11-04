import { Map, Trophy, User, LogOut, Flame, Wrench } from 'lucide-react';
import { Logo, TeamBadge } from './ui.jsx';
import Avatar from './Avatar.jsx';
import { rankOf, TEAMS } from '../core/teams.js';
import { teamXp } from '../core/progress.js';

export default function TopBar({ account, progress, view, onNav, onLogout }) {
  const team = progress.team;
  const T = TEAMS[team];
  const xp = teamXp(progress, team);
  const rank = rankOf(team, xp);
  const NAV = [['map', 'Operaciones', Map], ['arsenal', 'Arsenal', Wrench], ['ranking', 'Ranking', Trophy], ['profile', 'Perfil', User]];
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-void-950/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        <button type="button" onClick={() => onNav('map')} aria-label="Inicio"><Logo small /></button>
        <nav className="ml-2 hidden gap-1 md:flex">
          {NAV.map(([id, label, Icon]) => (
            <button key={id} type="button" onClick={() => onNav(id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${view === id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {progress.streak?.days > 0 && <span className="hidden items-center gap-1 text-xs font-bold text-neon-amber sm:flex" title="Racha de días seguidos"><Flame size={14} /> {progress.streak.days}</span>}
          <div className="hidden w-[210px] sm:block">
            <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider">
              <span className="truncate" style={{ color: T.color }}>{rank.name}</span>
              <span className="shrink-0 text-slate-500">{xp} XP</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-void-700">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(rank.pct * 100)}%`, background: T.color, boxShadow: `0 0 10px ${T.color}` }} />
            </div>
          </div>
          <TeamBadge team={team} />
          <button type="button" onClick={() => onNav('profile')} aria-label="Perfil"><Avatar id={account.avatar} size={34} ring={T.color} /></button>
          <button type="button" onClick={onLogout} className="text-slate-500 hover:text-white" aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut size={16} /></button>
        </div>
      </div>
      <nav className="flex justify-around border-t border-white/5 md:hidden">
        {NAV.map(([id, label, Icon]) => (
          <button key={id} type="button" onClick={() => onNav(id)} className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-bold uppercase ${view === id ? 'text-white' : 'text-slate-500'}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
