import { Shield, Star, GraduationCap, Terminal, Search, Network, Bug, Globe, KeyRound, Mail, Radar, Flame, Swords, ShieldCheck, Combine } from 'lucide-react';
import { TEAMS } from '../core/teams.js';

export const MODULE_ICONS = { GraduationCap, Terminal, Search, Network, Bug, Globe, KeyRound, Mail, Radar, Flame };
export const TEAM_ICONS = { red: Swords, blue: ShieldCheck, purple: Combine };

export function Logo({ small = false }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Shield size={small ? 22 : 28} className="text-neon-green" strokeWidth={2.2} />
        <span className="absolute inset-0 blur-md bg-neon-green/20 rounded-full" />
      </div>
      <div className="leading-none">
        <div className={`font-extrabold tracking-tight text-white ${small ? 'text-sm' : 'text-lg'}`}>Cyber<span className="text-neon-green">Ops</span></div>
        {!small && <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Operación Fénix</div>}
      </div>
    </div>
  );
}

export function TeamBadge({ team, size = 'sm' }) {
  const T = TEAMS[team];
  if (!T) return null;
  const Icon = TEAM_ICONS[team];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'}`}
      style={{ color: T.color, background: T.soft, boxShadow: `inset 0 0 0 1px ${T.color}55` }}>
      <Icon size={size === 'sm' ? 11 : 14} /> {T.name}
    </span>
  );
}

export function Stars({ n = 0, max = 3, size = 14 }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} de ${max} estrellas`}>
      {Array.from({ length: max }, (_, i) => (
        <Star key={i} size={size} className={i < n ? 'fill-neon-amber text-neon-amber' : 'text-slate-600'} />
      ))}
    </span>
  );
}

export function Panel({ children, className = '' }) {
  return <div className={`glass rounded-2xl ${className}`}>{children}</div>;
}

export function Feedback({ kind, children }) {
  const cls = kind === 'ok' ? 'border-neon-green/40 bg-neon-green/10 text-green-100' : kind === 'bad' ? 'border-neon-red/40 bg-neon-red/10 text-red-100' : 'border-neon-amber/40 bg-neon-amber/10 text-amber-100';
  return <div className={`rounded-lg border px-3 py-2 text-sm ${cls}`} role="status">{children}</div>;
}

export function PrimaryButton({ children, color = '#2bff88', className = '', ...props }) {
  return (
    <button type="button" className={`btn-neon justify-center py-2 text-void-950 ${className}`} style={{ background: color, boxShadow: `0 0 18px -4px ${color}` }} {...props}>
      {children}
    </button>
  );
}
