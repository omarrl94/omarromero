import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Loader2, Crown } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { fetchLeaderboard, backend } from '../services/accounts.js';
import { TEAMS } from '../core/teams.js';
import { TeamBadge } from './ui.jsx';
import { GlitchText } from './fx.jsx';

export default function Leaderboard({ account }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetchLeaderboard(25).then(setRows).catch((e) => { setError(e.message || 'No se pudo cargar el ranking.'); setRows([]); });
  }, []);

  const byTeam = (rows || []).reduce((acc, r) => { acc[r.team] = (acc[r.team] || 0) + r.xp; return acc; }, {});
  const maxTeam = Math.max(1, ...Object.values(byTeam));

  return (
    <div className="relative z-10 mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center gap-3"><Trophy className="text-neon-amber" /><GlitchText text="Salón de agentes" className="text-3xl font-extrabold text-white" /></div>
      <p className="mt-1 text-sm text-slate-400">{backend === 'firebase' ? 'Ranking de la academia por XP total.' : 'Modo local: ranking de los agentes de este navegador.'}</p>

      <div className="glass mt-5 rounded-2xl p-4">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Guerra de equipos (XP acumulada)</div>
        <div className="mt-3 space-y-2">
          {['red', 'blue', 'purple'].map((t) => (
            <div key={t} className="flex items-center gap-3">
              <span className="w-28 text-xs font-bold" style={{ color: TEAMS[t].color }}>{TEAMS[t].name}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-void-700">
                <motion.div className="h-full rounded-full" style={{ background: TEAMS[t].color, boxShadow: `0 0 12px ${TEAMS[t].color}` }} initial={{ width: 0 }} animate={{ width: `${((byTeam[t] || 0) / maxTeam) * 100}%` }} transition={{ duration: 1 }} />
              </div>
              <span className="w-16 text-right text-xs text-slate-400">{byTeam[t] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass mt-4 overflow-hidden rounded-2xl">
        {rows === null ? (
          <div className="flex items-center gap-2 p-6 text-sm text-slate-400"><Loader2 size={16} className="animate-spin" /> Cargando…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-slate-400">{error || 'Todavía no hay agentes en el ranking.'}</div>
        ) : (
          <ol>
            {rows.map((r, k) => (
              <motion.li key={r.uid} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: k * 0.03 }}
                className={`flex items-center gap-3 border-b border-white/5 px-4 py-2.5 ${r.uid === account.uid ? 'bg-white/5' : ''}`}>
                <span className="w-7 text-center font-extrabold text-slate-400">{k === 0 ? <Crown size={18} className="mx-auto text-neon-amber" /> : k + 1}</span>
                <Avatar id={r.avatar} size={32} ring={TEAMS[r.team]?.color} />
                <span className="min-w-0 flex-1 truncate font-bold text-white">{r.nick}</span>
                <span className="hidden sm:inline"><TeamBadge team={r.team} /></span>
                <span className="w-20 text-right text-xs text-slate-400">{r.stars} ★</span>
                <span className="w-20 text-right font-bold" style={{ color: TEAMS[r.team]?.color }}>{r.xp} XP</span>
              </motion.li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
