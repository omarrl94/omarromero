import { ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Modal from './Modal';

/** Mi cuenta: datos básicos y derecho de supresión (borra la cuenta y todas sus salas). */
export default function AccountPanel() {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await deleteAccount(password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <section className="card p-6" aria-labelledby="account-title">
      <h2 id="account-title" className="mb-3 flex items-center gap-2 text-lg font-bold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-100 text-accent-800 dark:bg-accent-300/15 dark:text-accent-300">
          <UserRound className="h-4 w-4" aria-hidden="true" />
        </span>
        Mi cuenta
      </h2>
      <p className="text-sm text-stone-700 dark:text-stone-300">{user.name}</p>
      <p className="text-sm text-stone-600 dark:text-stone-400">{user.email}</p>
      <p className="mt-3 flex items-start gap-2 text-xs text-stone-600 dark:text-stone-400">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent-700 dark:text-accent-300" aria-hidden="true" />
        <span>
          Tus datos se tratan según la <Link to="/privacidad" className="underline">política de privacidad</Link>.
        </span>
      </p>
      <button type="button" className="btn-danger btn-sm mt-4 w-full" onClick={() => setOpen(true)}>
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Eliminar mi cuenta y mis datos
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Eliminar mi cuenta" size="md">
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-stone-700 dark:text-stone-300">
            Se borrarán <strong>tu cuenta y todas tus salas</strong>, con sus recursos, archivos y aportaciones. Esta acción no se puede deshacer.
          </p>
          <div>
            <label className="label" htmlFor="delete-password">Tu contraseña</label>
            <input id="delete-password" type="password" className="input" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="delete-confirm">Escribe ELIMINAR para confirmar</label>
            <input id="delete-confirm" className="input" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
          <button type="submit" className="btn w-full bg-red-700 text-white hover:bg-red-800" disabled={busy || !password || confirm.trim().toUpperCase() !== 'ELIMINAR'}>
            {busy ? 'Eliminando…' : 'Eliminar definitivamente'}
          </button>
        </form>
      </Modal>
    </section>
  );
}
