import { useEffect, useState } from 'react';
import { Trophy, Coins, Globe, Loader2, RefreshCw } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { fetchLeaderboard, backend } from '../services/accounts.js';

const MEDALS = ['#ffd34d', '#cfd6e6', '#cd7f32'];

/** Salón de la fama: los pilotos con más oro conquistado. */
export default function Leaderboard({ account, refreshKey }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setRows(null);
    setError('');
    fetchLeaderboard(25)
      .then((r) => { if (alive) setRows(r); })
      .catch((e) => { if (alive) { setError(e.message || 'No se pudo cargar el ranking.'); setRows([]); } });
    return () => { alive = false; };
  }, [tick, refreshKey]);

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-24 lg:px-4">
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <Trophy className="text-[#ffd34d]" size={26} />
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-white">Salón de la Fama</h1>
            <p className="text-xs text-slate-400">{backend === 'firebase' ? 'Todos los pilotos, ordenados por el oro conquistado en sus mundos.' : 'Modo local: aparecen los pilotos creados en este navegador.'}</p>
          </div>
          <button type="button" onClick={() => setTick((t) => t + 1)} className="rounded-lg p-2 text-slate-400 hover:text-white" aria-label="Actualizar ranking"><RefreshCw size={16} /></button>
        </div>
        <div className="mt-4">
          {!rows && <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={16} className="animate-spin" /> Cargando…</div>}
          {error && <div className="rounded-lg border border-neon-red/40 bg-neon-red/10 px-3 py-2 text-sm text-red-200">{error}</div>}
          {rows && !rows.length && !error && <div className="text-sm text-slate-500">Todavía no hay pilotos en el ranking. ¡Conquista tu primera misión!</div>}
          {rows && rows.length > 0 && (
            <ol className="space-y-1.5">
              {rows.map((r, i) => {
                const me = account && r.uid === account.uid;
                return (
                  <li key={r.uid} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${me ? 'border-neon-cyan/60 bg-neon-cyan/5' : 'border-void-600/50'}`}>
                    <span className="w-7 text-center text-sm font-extrabold tabular-nums" style={{ color: MEDALS[i] || '#7a83ad' }}>{i + 1}</span>
                    <Avatar id={r.avatar} size={36} ring={MEDALS[i] || null} />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-100">{r.nick}{me && <span className="ml-2 text-[10px] font-normal text-neon-cyan">tú</span>}</span>
                    <span className="hidden items-center gap-1 text-xs text-slate-400 sm:flex" title="Mundos completados"><Globe size={13} /> {r.worlds}</span>
                    <span className="hidden text-xs tabular-nums text-slate-400 sm:block">{r.xp} XP</span>
                    <span className="flex items-center gap-1 text-sm font-extrabold tabular-nums text-amber-200"><Coins size={15} className="text-[#ffd34d]" /> {r.gold}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}
