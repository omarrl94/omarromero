import { ICONS as Icons } from './icons.js';
import { Star, Flame, Trash2 } from 'lucide-react';
import { CHALLENGES } from '../curriculum/index.js';
import { LANGUAGES, LANG_ORDER } from '../core/languages.js';
import { useProgress, rankOf, RANKS, ACHIEVEMENTS, starsOf } from '../core/progress.js';
import RankBadge from './RankBadge.jsx';

export default function Profile({ onOpen }) {
  const { state, dispatch } = useProgress();
  const rank = rankOf(state.xp);
  return (
    <div className="mx-auto grid w-full max-w-[1400px] gap-4 px-3 pb-24 lg:grid-cols-[360px_1fr] lg:px-4">
      <div className="space-y-4">
        <section className="glass rounded-2xl p-5 text-center">
          <div className="flex justify-center"><RankBadge rank={rank} size={96} /></div>
          <div className="mt-2 text-xl font-extrabold" style={{ color: rank.color }}>{rank.name}</div>
          <div className="text-xs text-slate-400">{state.xp} Neural XP{rank.next ? ` · ${rank.next.xp - state.xp} para ${rank.next.name}` : ' · rango máximo'}</div>
          <div className="mx-auto mt-3 h-2 max-w-[240px] overflow-hidden rounded-full bg-void-700">
            <div className="h-full rounded-full" style={{ width: `${rank.progress * 100}%`, background: rank.color, boxShadow: `0 0 10px ${rank.color}` }} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <Stat label="racha" value={state.streak.count} icon={<Flame size={14} className="text-orange-400" />} />
            <Stat label="ejecuciones" value={state.stats.runs} />
            <Stat label="bugs reparados" value={state.stats.bugsFixed} />
          </div>
          <div className="mt-2 text-[10px] text-slate-500">Mejor racha: {state.streak.best} día(s)</div>
        </section>
        <section className="glass rounded-2xl p-4">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Escalafón de ingenieros</h3>
          <ol className="space-y-1">
            {RANKS.map((r) => (
              <li key={r.name} className={`flex items-center justify-between rounded px-2 py-1 text-xs ${r.name === rank.name ? 'bg-white/5' : ''}`}>
                <span style={{ color: state.xp >= r.xp ? r.color : '#4a5275' }} className="font-bold">{r.name}</span>
                <span className="text-slate-500">{r.xp} XP</span>
              </li>
            ))}
          </ol>
        </section>
        <button
          type="button"
          onClick={() => { if (window.confirm('¿Borrar TODO el progreso guardado en este navegador?')) dispatch({ type: 'reset' }); }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-neon-red/30 py-2 text-xs text-neon-red/80 hover:bg-neon-red/5"
        >
          <Trash2 size={13} /> Reiniciar progreso
        </button>
      </div>
      <div className="space-y-4">
        <section className="glass rounded-2xl p-4">
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Logros</h3>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {Object.entries(ACHIEVEMENTS).map(([id, a]) => {
              const got = state.achievements.includes(id);
              const Icon = Icons[a.icon] || Icons.Award;
              return (
                <div key={id} className={`flex items-center gap-3 rounded-xl border p-3 ${got ? 'border-neon-amber/40 bg-neon-amber/5' : 'border-void-600/50 opacity-50'}`}>
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${got ? 'bg-neon-amber/20 text-neon-amber' : 'bg-void-700 text-slate-500'}`}><Icon size={18} /></div>
                  <div>
                    <div className={`text-xs font-bold ${got ? 'text-amber-100' : 'text-slate-400'}`}>{a.name}</div>
                    <div className="text-[11px] text-slate-500">{a.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section className="glass overflow-x-auto rounded-2xl p-4">
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Matriz políglota</h3>
          <table className="w-full min-w-[560px] text-xs">
            <thead>
              <tr>
                <th className="pb-2 text-left font-normal text-slate-500">Misión</th>
                {LANG_ORDER.map((l) => <th key={l} className="pb-2 font-bold" style={{ color: LANGUAGES[l].color }}>{LANGUAGES[l].name}</th>)}
              </tr>
            </thead>
            <tbody>
              {CHALLENGES.map((c) => (
                <tr key={c.id} className="border-t border-void-600/40">
                  <td className="py-1.5">
                    <button type="button" onClick={() => onOpen(c.id)} className="text-left text-slate-200 hover:text-neon-cyan">{c.title}</button>
                  </td>
                  {LANG_ORDER.map((l) => {
                    const s = starsOf(state, c.id, l);
                    return (
                      <td key={l} className="text-center">
                        {s ? <span className="inline-flex">{[1, 2, 3].map((i) => <Star key={i} size={10} className={i <= s ? 'fill-neon-amber text-neon-amber' : 'text-void-600'} />)}</span> : <span className="text-void-600">·</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="rounded-lg border border-void-600/50 bg-void-950/40 p-2">
      <div className="flex items-center justify-center gap-1 text-lg font-extrabold text-white">{icon}{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}
