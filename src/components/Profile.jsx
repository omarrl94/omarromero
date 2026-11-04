import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Repeat, Loader2, Award, FileSpreadsheet, Download } from 'lucide-react';
import Avatar, { AvatarPicker } from './Avatar.jsx';
import { TEAMS, TEAM_ORDER, rankOf, RANK_XP } from '../core/teams.js';
import { teamXp, teamStars, completedCount, moduleDone, moduleGrade, courseGrade, formatNota } from '../core/progress.js';
import { MODULES, missionsFor } from '../campaign/index.js';
import { updateAccount, backend } from '../services/accounts.js';
import { MODULE_ICONS, TEAM_ICONS, TeamBadge } from './ui.jsx';

export default function Profile({ account, progress, onAccount, onSwitchTeam }) {
  const [nick, setNick] = useState(account.nick);
  const [avatar, setAvatar] = useState(account.avatar);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const team = progress.team;
  const T = TEAMS[team];
  const xp = teamXp(progress, team);
  const rank = rankOf(team, xp);

  const course = courseGrade(progress, team);
  const rows = MODULES.map((m) => ({ m, g: moduleGrade(progress, team, m.id) }));

  const downloadCsv = () => {
    const head = ['Tema', 'Título', 'Misiones', 'Puntos', 'Máximo', 'Nota', 'Calificación'];
    const lines = rows.map(({ m, g }) => [m.num, m.title, `${g.played}/${g.total}`, g.points, g.max, formatNota(g.nota), g.label]);
    lines.push(['', `MEDIA DE TEMAS EMPEZADOS (${course.started})`, '', '', '', formatNota(course.media), course.label]);
    lines.push(['', 'NOTA FINAL DEL CURSO (10 temas)', '', '', '', formatNota(course.final), course.finalGrade.label]);
    const csv = [`Boletín CyberOps · ${account.nick} · ${T.name}`, head.join(';'), ...lines.map((l) => l.join(';'))].join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `boletin-cyberops-${account.nick}-${team}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const save = async () => {
    setBusy(true);
    setMsg('');
    try {
      const acc = await updateAccount(account, { nick: nick.trim(), avatar });
      onAccount(acc);
      setMsg('Perfil guardado.');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative z-10 mx-auto max-w-5xl space-y-5 px-4 py-6">
      <div className="glass hud-corner flex flex-wrap items-center gap-5 rounded-2xl p-5" style={{ '--team': T.color }}>
        <Avatar id={avatar} size={88} ring={T.color} />
        <div className="min-w-0 flex-1">
          <div className="text-2xl font-extrabold text-white">{account.nick}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2"><TeamBadge team={team} size="md" /><span className="text-sm font-bold" style={{ color: T.color }}>{rank.name}</span></div>
          <div className="mt-1 text-xs text-slate-500">{account.email} · {backend === 'firebase' ? 'progreso en la nube' : 'modo local (este navegador)'}</div>
        </div>
        <button type="button" onClick={onSwitchTeam} className="btn-neon border border-void-600 text-slate-200 hover:border-slate-400"><Repeat size={14} /> Cambiar de equipo</button>
      </div>

      {/* Escalera de rangos */}
      <div className="glass rounded-2xl p-5">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Carrera en el {T.name}</div>
        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {T.ranks.map((r, k) => {
            const reached = k <= rank.index;
            return (
              <motion.div key={r} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.05 }}
                className="rounded-xl border p-2 text-center" style={{ borderColor: reached ? T.color : '#252c45', background: reached ? T.soft : 'transparent' }}>
                <div className="text-lg font-extrabold" style={{ color: reached ? T.color : '#4b5375' }}>{k + 1}</div>
                <div className={`text-[10px] leading-tight ${reached ? 'text-white' : 'text-slate-600'}`}>{r}</div>
                <div className="mt-1 text-[9px] text-slate-500">{RANK_XP[k]} XP</div>
              </motion.div>
            );
          })}
        </div>
        {rank.next != null && <p className="mt-3 text-xs text-slate-400">Te faltan <span className="font-bold text-white">{rank.next - xp} XP</span> para ser <span style={{ color: T.color }}>{rank.nextName}</span>.</p>}
      </div>

      {/* Insignias por módulo */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400"><Award size={14} /> Insignias del {T.name}</div>
        <div className="mt-4 grid grid-cols-5 gap-3 sm:grid-cols-10">
          {MODULES.map((m) => {
            const Icon = MODULE_ICONS[m.icon];
            const got = moduleDone(progress, team, m.id);
            return (
              <div key={m.id} className="flex flex-col items-center gap-1 text-center" title={m.title}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2" style={{ borderColor: got ? T.color : '#252c45', color: got ? T.color : '#3b4263', boxShadow: got ? `0 0 18px -4px ${T.color}` : 'none' }}><Icon size={20} /></div>
                <span className={`text-[9px] leading-tight ${got ? 'text-slate-200' : 'text-slate-600'}`}>{m.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Boletín de notas */}
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400"><FileSpreadsheet size={14} /> Boletín de notas · {T.name}</div>
          <div className="ml-auto flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2" title="Media de los temas que has empezado">
              <span className="text-xs text-slate-400">Media ({course.started} {course.started === 1 ? 'tema' : 'temas'})</span>
              <span className="text-2xl font-extrabold" style={{ color: course.color }}>{formatNota(course.media)}</span>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-void-950" style={{ background: course.color }}>{course.label}</span>
            </div>
            <div className="flex items-center gap-2" title="Nota final del curso: media de los 10 temas (los no empezados cuentan 0)">
              <span className="text-xs text-slate-400">Nota final del curso</span>
              <span className="text-2xl font-extrabold" style={{ color: course.finalGrade.color }}>{formatNota(course.final)}</span>
            </div>
          </div>
          <button type="button" onClick={downloadCsv} className="btn-neon border border-void-600 text-slate-200 hover:border-slate-400"><Download size={13} /> CSV</button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead><tr className="text-[10px] uppercase tracking-widest text-slate-500"><th className="py-1.5">Tema</th><th>Misiones</th><th>Puntos</th><th>Nota</th><th>Calificación</th></tr></thead>
            <tbody>
              {rows.map(({ m, g }) => (
                <tr key={m.id} className="border-t border-white/5">
                  <td className="py-2 text-white"><span className="mr-2 font-mono text-xs" style={{ color: T.color }}>{String(m.num).padStart(2, '0')}</span>{m.title}</td>
                  <td className="text-slate-400">{g.played}/{g.total}</td>
                  <td className="font-mono text-slate-300">{g.points}/{g.max}</td>
                  <td className="font-extrabold" style={{ color: g.color }}>{formatNota(g.nota)}</td>
                  <td><span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${g.color}22`, color: g.color }}>{g.label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Equipos */}
      <div className="grid gap-3 sm:grid-cols-3">
        {TEAM_ORDER.map((t) => {
          const Icon = TEAM_ICONS[t];
          const x = teamXp(progress, t);
          return (
            <div key={t} className="rounded-2xl border bg-void-900/70 p-4" style={{ borderColor: t === team ? TEAMS[t].color : '#252c45' }}>
              <div className="flex items-center gap-2 font-bold" style={{ color: TEAMS[t].color }}><Icon size={16} /> {TEAMS[t].name}</div>
              <div className="mt-2 text-sm text-slate-300">{rankOf(t, x).name}</div>
              <div className="mt-1 text-xs text-slate-500">{x} XP · {completedCount(progress, t)}/{missionsFor(t).length} misiones · {teamStars(progress, t)} ★</div>
            </div>
          );
        })}
      </div>

      <div className="glass space-y-3 rounded-2xl p-5">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Editar perfil</div>
        <label className="block max-w-xs">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Nick</span>
          <input value={nick} maxLength={16} onChange={(e) => setNick(e.target.value)} className="w-full rounded-lg border border-void-600 bg-void-950 px-3 py-2 text-sm text-white outline-none focus:border-neon-green" />
        </label>
        <AvatarPicker value={avatar} onChange={setAvatar} />
        <div className="flex items-center gap-3">
          <button type="button" onClick={save} disabled={busy} className="btn-neon text-void-950" style={{ background: T.color }}>{busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar</button>
          {msg && <span className="text-xs text-slate-300">{msg}</span>}
        </div>
      </div>
    </div>
  );
}
