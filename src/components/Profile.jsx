import { useState } from 'react';
import { ICONS as Icons } from './icons.js';
import { Star, Flame, Trash2, LogOut, Pencil, Check, X, Coins, Mail, Cloud, HardDrive } from 'lucide-react';
import Avatar, { AvatarPicker } from './Avatar.jsx';
import { updateAccount, backend, NICK_RE } from '../services/accounts.js';
import { MODULES } from '../curriculum/index.js';
import { LANGUAGES, LANG_ORDER } from '../core/languages.js';
import { useProgress, rankOf, RANKS, ACHIEVEMENTS, starsOf, worldXp, worldDone, goldOf, totalGold } from '../core/progress.js';
import RankBadge from './RankBadge.jsx';

/** Perfil: el rango y las misiones del mundo actual, tus mundos y tus logros. */
export default function Profile({ onOpen }) {
  const { state, dispatch, account, setAccount, signOut } = useProgress();
  const L = LANGUAGES[state.lang];
  const xp = worldXp(state);
  const rank = rankOf(xp);
  const [armed, setArmed] = useState(false);
  return (
    <div className="mx-auto grid w-full max-w-[1400px] gap-4 px-3 pb-24 lg:grid-cols-[360px_1fr] lg:px-4">
      <div className="space-y-4">
        <PilotCard account={account} onChange={setAccount} onSignOut={signOut} gold={totalGold(state)} />
        <section className="glass rounded-2xl p-5 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: L.color }}>Mundo {L.name}</div>
          <div className="mt-2 flex justify-center"><RankBadge rank={rank} size={96} /></div>
          <div className="mt-2 text-xl font-extrabold" style={{ color: rank.color }}>{rank.name}</div>
          <div className="text-xs text-slate-400">{xp} Neural XP{rank.next ? ` · ${rank.next.xp - xp} para ${rank.next.name}` : ' · rango máximo'}</div>
          <div className="mx-auto mt-3 h-2 max-w-[240px] overflow-hidden rounded-full bg-void-700">
            <div className="h-full rounded-full" style={{ width: `${rank.progress * 100}%`, background: rank.color, boxShadow: `0 0 10px ${rank.color}` }} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <Stat label="racha" value={state.streak.count} icon={<Flame size={14} className="text-orange-400" />} />
            <Stat label="ejecuciones" value={state.stats.runs} />
            <Stat label="bugs reparados" value={state.stats.bugsFixed} />
          </div>
          <div className="mt-2 text-[10px] text-slate-500">Mejor racha: {state.streak.best} día(s) · la racha y los logros son comunes a todos los mundos</div>
        </section>
        <section className="glass rounded-2xl p-4">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Escalafón de ingenieros</h3>
          <ol className="space-y-1">
            {RANKS.map((r) => (
              <li key={r.name} className={`flex items-center justify-between rounded px-2 py-1 text-xs ${r.name === rank.name ? 'bg-white/5' : ''}`}>
                <span style={{ color: xp >= r.xp ? r.color : '#4a5275' }} className="font-bold">{r.name}</span>
                <span className="text-slate-500">{r.xp} XP</span>
              </li>
            ))}
          </ol>
        </section>
        <button
          type="button"
          onClick={() => { if (armed) { dispatch({ type: 'reset' }); setArmed(false); } else setArmed(true); }}
          onBlur={() => setArmed(false)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-neon-red/30 py-2 text-xs text-neon-red/80 hover:bg-neon-red/5"
        >
          <Trash2 size={13} /> {armed ? 'Pulsa otra vez para borrar TODO el progreso' : 'Reiniciar progreso'}
        </button>
      </div>
      <div className="space-y-4">
        <section className="glass rounded-2xl p-4">
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Misiones en el mundo {L.name}</h3>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {MODULES.flatMap((m) => m.challenges.map((c) => ({ c, m }))).map(({ c, m }) => {
              const s = starsOf(state, c.id);
              return (
                <button key={c.id} type="button" onClick={() => onOpen(c.id)} className="flex items-center justify-between gap-2 rounded-lg border border-void-600/50 px-3 py-2 text-left text-xs hover:border-neon-cyan/50">
                  <span className="min-w-0">
                    <span className="block text-[9px] uppercase tracking-widest" style={{ color: m.color }}>{m.boss ? 'Boss' : `Módulo ${m.id}`}</span>
                    <span className="block truncate text-slate-200">{c.title}</span>
                  </span>
                  <span className="inline-flex shrink-0">{[1, 2, 3].map((i) => <Star key={i} size={11} className={i <= s ? 'fill-neon-amber text-neon-amber' : 'text-void-600'} />)}</span>
                </button>
              );
            })}
          </div>
        </section>
        <section className="glass rounded-2xl p-4">
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Tus mundos</h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-9">
            {LANG_ORDER.map((l) => {
              const W = LANGUAGES[l];
              return (
                <div key={l} className="rounded-lg border p-2 text-center" style={{ borderColor: `${W.color}${l === state.lang ? 'aa' : '33'}` }}>
                  <div className="text-xs font-extrabold" style={{ color: W.color }}>{W.name}</div>
                  <div className="text-[10px] text-slate-500">{worldDone(state, l)}/{MODULES.flatMap((m) => m.challenges).length} · {worldXp(state, l)} XP</div>
                  <div className="text-[10px] font-bold text-amber-200">{goldOf(state, l)} oro</div>
                </div>
              );
            })}
          </div>
        </section>
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

/** Tarjeta del piloto: avatar, nick, correo y sesión. */
function PilotCard({ account, onChange, onSignOut, gold }) {
  const [editing, setEditing] = useState(false);
  const [nick, setNick] = useState(account.nick);
  const [avatar, setAvatar] = useState(account.avatar);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async () => {
    setError('');
    if (!NICK_RE.test(nick)) { setError('El nick debe tener de 3 a 16 caracteres: letras, números, _ o -.'); return; }
    setBusy(true);
    try {
      const next = await updateAccount(account, { nick: nick !== account.nick ? nick : undefined, avatar });
      onChange(next);
      setEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex items-center gap-4">
        <Avatar id={editing ? avatar : account.avatar} size={72} />
        <div className="min-w-0 flex-1">
          {editing ? (
            <input value={nick} onChange={(e) => setNick(e.target.value)} maxLength={16} aria-label="Nick" id="edit-nick"
              className="w-full rounded-lg border border-void-600 bg-void-950 px-2 py-1 text-base font-bold text-white outline-none focus:border-neon-cyan" />
          ) : (
            <div className="truncate text-xl font-extrabold text-white">{account.nick}</div>
          )}
          <div className="mt-1 flex items-center gap-1 truncate text-xs text-slate-400"><Mail size={12} /> {account.email}</div>
          <div className="mt-1 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 font-bold text-amber-200"><Coins size={13} className="text-[#ffd34d]" /> {gold} oro</span>
            <span className="flex items-center gap-1 text-slate-500">{backend === 'firebase' ? <Cloud size={12} /> : <HardDrive size={12} />} {backend === 'firebase' ? 'cuenta en la nube' : 'cuenta local'}</span>
          </div>
        </div>
      </div>
      {backend === 'firebase' && account.emailVerified === false && (
        <p className="mt-3 text-[11px] text-slate-500">Te enviamos un correo para verificar tu dirección. Puedes jugar igualmente.</p>
      )}
      {editing && (
        <div className="mt-3 space-y-2">
          <AvatarPicker value={avatar} onChange={setAvatar} />
          {error && <div className="rounded-lg border border-neon-red/40 bg-neon-red/10 px-3 py-2 text-xs text-red-200">{error}</div>}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {editing ? (
          <>
            <button type="button" onClick={save} disabled={busy} className="btn-neon bg-neon-cyan/20 text-neon-cyan"><Check size={13} /> Guardar</button>
            <button type="button" onClick={() => { setEditing(false); setNick(account.nick); setAvatar(account.avatar); setError(''); }} className="btn-neon text-slate-300"><X size={13} /> Cancelar</button>
          </>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="btn-neon border border-void-600 text-slate-200 hover:border-neon-cyan/60"><Pencil size={13} /> Editar nick y avatar</button>
        )}
        <button type="button" onClick={onSignOut} className="btn-neon ml-auto border border-neon-red/40 text-red-200 hover:bg-neon-red/10"><LogOut size={13} /> Cerrar sesión</button>
      </div>
    </section>
  );
}
