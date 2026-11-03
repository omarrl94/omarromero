import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, LogIn, KeyRound, Loader2, Cloud, HardDrive, Check } from 'lucide-react';
import { Logo } from './TopBar.jsx';
import Avatar, { AvatarPicker, AVATARS } from './Avatar.jsx';
import { register, login, resetPassword, nickAvailable, backend, NICK_RE } from '../services/accounts.js';
import { play } from '../core/sound.js';

const TABS = [
  { id: 'register', label: 'Crear cuenta', icon: UserPlus },
  { id: 'login', label: 'Entrar', icon: LogIn },
];

function Field({ id, label, hint, error, ...props }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      <input
        id={id}
        className={`w-full rounded-lg border bg-void-950 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-neon-cyan ${error ? 'border-neon-red/70' : 'border-void-600'}`}
        {...props}
      />
      {(error || hint) && <span className={`mt-1 block text-[11px] ${error ? 'text-red-300' : 'text-slate-500'}`}>{error || hint}</span>}
    </label>
  );
}

/** Registro con nick, correo, contraseña y avatar; acceso; recuperación de contraseña. */
export default function AuthScreen({ onAccount }) {
  const [tab, setTab] = useState('register');
  const [nick, setNick] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[Math.floor(Math.random() * AVATARS.length)].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [nickState, setNickState] = useState(null); // null | 'checking' | 'free' | 'taken'

  const checkNick = async () => {
    if (!NICK_RE.test(nick)) { setNickState(null); return; }
    setNickState('checking');
    try {
      setNickState((await nickAvailable(nick)) ? 'free' : 'taken');
    } catch {
      setNickState(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const acc = tab === 'register'
        ? await register({ nick: nick.trim(), email: email.trim(), password, avatar })
        : await login({ email: email.trim(), password });
      play('rankup');
      onAccount(acc);
    } catch (err) {
      setError(err.message);
      play('error');
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    setError('');
    setNotice('');
    try {
      await resetPassword(email.trim());
      setNotice(`Te hemos enviado un correo a ${email.trim()} para elegir una contraseña nueva.`);
    } catch (err) {
      setError(err.message);
    }
  };

  const nickError = nick && !NICK_RE.test(nick) ? 'De 3 a 16 caracteres: letras, números, _ o -.' : nickState === 'taken' ? 'Ese nick ya está cogido.' : '';

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass w-full max-w-xl rounded-2xl p-5 neon-border sm:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Logo />
          <span className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${backend === 'firebase' ? 'bg-neon-lime/10 text-neon-lime' : 'bg-neon-amber/10 text-neon-amber'}`}
            title={backend === 'firebase' ? 'Tu cuenta y tu progreso se guardan en la nube (Firebase).' : 'Sin servidor configurado: la cuenta se guarda solo en este navegador.'}>
            {backend === 'firebase' ? <Cloud size={12} /> : <HardDrive size={12} />} {backend === 'firebase' ? 'en la nube' : 'modo local'}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-white" style={{ textWrap: 'balance' }}>
          {tab === 'register' ? 'Únete a la tripulación' : 'Bienvenido de vuelta, piloto'}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {tab === 'register' ? 'Crea tu piloto para guardar tus mundos, tu oro y tus estrellas, y aparecer en el ranking.' : 'Entra con tu correo y tu contraseña para seguir conquistando.'}
        </p>

        <div className="mt-4 flex gap-1 rounded-xl border border-void-600/60 bg-void-950/60 p-1" role="tablist">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} type="button" role="tab" aria-selected={active} onClick={() => { setTab(t.id); setError(''); setNotice(''); }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold uppercase tracking-wider ${active ? 'bg-neon-cyan/15 text-neon-cyan' : 'text-slate-500 hover:text-slate-200'}`}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        <form className="mt-4 space-y-3" onSubmit={submit} noValidate>
          <AnimatePresence initial={false}>
            {tab === 'register' && (
              <motion.div key="reg" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden">
                <div className="flex items-end gap-3">
                  <Avatar id={avatar} size={64} />
                  <div className="min-w-0 flex-1">
                    <Field
                      id="nick"
                      label="Nick"
                      value={nick}
                      maxLength={16}
                      autoComplete="nickname"
                      placeholder="p. ej. NovaRider"
                      onChange={(e) => { setNick(e.target.value); setNickState(null); }}
                      onBlur={checkNick}
                      error={nickError}
                      hint={nickState === 'free' ? '✓ Disponible' : nickState === 'checking' ? 'Comprobando…' : 'Es tu nombre en el ranking.'}
                    />
                  </div>
                </div>
                <div>
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-400">Avatar</span>
                  <AvatarPicker value={avatar} onChange={(a) => { setAvatar(a); play('click'); }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <Field id="email" label="Correo electrónico" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
          <Field id="password" label="Contraseña" type="password" autoComplete={tab === 'register' ? 'new-password' : 'current-password'} value={password}
            onChange={(e) => setPassword(e.target.value)} hint={tab === 'register' ? 'Mínimo 6 caracteres.' : ''} />

          {error && <div className="rounded-lg border border-neon-red/40 bg-neon-red/10 px-3 py-2 text-sm text-red-200" role="alert">{error}</div>}
          {notice && <div className="flex items-start gap-2 rounded-lg border border-neon-lime/40 bg-neon-lime/10 px-3 py-2 text-sm text-lime-100"><Check size={16} className="mt-0.5 shrink-0" /> {notice}</div>}

          <button type="submit" disabled={busy || (tab === 'register' && (!!nickError || nickState === 'checking'))}
            className="btn-neon w-full justify-center bg-neon-cyan py-2.5 text-sm text-void-950 shadow-neon">
            {busy ? <Loader2 size={16} className="animate-spin" /> : tab === 'register' ? <UserPlus size={16} /> : <LogIn size={16} />}
            {tab === 'register' ? 'Crear mi piloto' : 'Entrar'}
          </button>
          {tab === 'login' && (
            <button type="button" onClick={forgot} className="flex w-full items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white">
              <KeyRound size={13} /> He olvidado mi contraseña
            </button>
          )}
        </form>
        {backend === 'local' && (
          <p className="mt-4 text-[11px] leading-snug text-slate-500">
            Modo local: no hay un servidor Firebase configurado, así que la cuenta y el progreso se guardan solo en este navegador. Con Firebase configurado, todo se sincroniza en la nube.
          </p>
        )}
      </motion.div>
    </div>
  );
}
