import { CheckCircle2, KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import Spinner from '../components/Spinner';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { backend } from '../services/backend';

const validPassword = (p) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

// Un código solo se puede usar una vez: se procesa una sola vez aunque el efecto se repita
const checks = new Map();
const checkOnce = (mode, code) => {
  const key = `${mode}:${code}`;
  if (!checks.has(key))
    checks.set(
      key,
      mode === 'resetPassword'
        ? backend.auth.checkResetCode(code).then((email) => ({ status: 'form', email }))
        : mode === 'verifyEmail'
          ? backend.auth.applyVerifyCode(code).then(() => ({ status: 'verified' }))
          : Promise.reject(new Error('Este enlace no es válido.')),
    );
  return checks.get(key);
};

/** Destino de los enlaces de los correos: confirmar el correo o elegir una contraseña nueva. */
export default function AuthAction() {
  const [params] = useSearchParams();
  const mode = params.get('mode');
  const code = params.get('oobCode') || '';
  useDocumentTitle(mode === 'resetPassword' ? 'Nueva contraseña' : 'Confirmar correo');
  const [state, setState] = useState({ status: 'checking' });
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    checkOnce(mode, code).then((s) => alive && setState(s)).catch((e) => alive && setState({ status: 'error', message: e.message }));
    return () => {
      alive = false;
    };
  }, [mode, code]);

  const save = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validPassword(form.password)) return setError('La contraseña debe tener al menos 8 caracteres e incluir letras y números.');
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden.');
    setSaving(true);
    try {
      await backend.auth.confirmReset(code, form.password);
      setState({ status: 'changed', email: state.email });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const toLogin = (
    <Link to="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
      Ir a iniciar sesión
    </Link>
  );

  if (state.status === 'checking')
    return (
      <AuthCard title="Un momento…" subtitle="Comprobando el enlace.">
        <Spinner label="Comprobando el enlace…" />
      </AuthCard>
    );

  if (state.status === 'error')
    return (
      <AuthCard
        title="Enlace no válido"
        subtitle={state.message}
        footer={
          <Link to={mode === 'resetPassword' ? '/recuperar-contrasena' : '/login'} className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            {mode === 'resetPassword' ? 'Pedir un enlace nuevo' : 'Ir a iniciar sesión'}
          </Link>
        }
      >
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Los enlaces caducan y solo se pueden usar una vez. Si ya lo habías usado, inicia sesión con normalidad.
        </p>
      </AuthCard>
    );

  if (state.status === 'verified' || state.status === 'changed')
    return (
      <AuthCard title={state.status === 'verified' ? 'Correo confirmado' : 'Contraseña cambiada'} subtitle="Ya puedes entrar en ColaboraFP." footer={toLogin}>
        <div className="flex gap-4 rounded-2xl bg-accent-100 p-5 text-ink-900 dark:bg-accent-300/15 dark:text-stone-100" role="status">
          <CheckCircle2 className="h-7 w-7 shrink-0 text-accent-700 dark:text-accent-300" aria-hidden="true" />
          <p className="text-sm leading-relaxed">
            {state.status === 'verified'
              ? 'Tu cuenta de profesorado está activada. Inicia sesión con tu correo y tu contraseña.'
              : <>Hemos guardado tu nueva contraseña{state.email && <> para <strong className="break-all">{state.email}</strong></>}.</>}
          </p>
        </div>
      </AuthCard>
    );

  return (
    <AuthCard title="Elige una contraseña nueva" subtitle={<>Para <strong className="break-all">{state.email}</strong></>} footer={toLogin}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="label" htmlFor="new-password">Contraseña nueva</label>
          <input id="new-password" type="password" required autoComplete="new-password" className="input" aria-describedby="new-password-help"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <p id="new-password-help" className="mt-1.5 text-xs text-stone-600 dark:text-stone-400">Mínimo 8 caracteres, con letras y números.</p>
        </div>
        <div>
          <label className="label" htmlFor="new-confirm">Repite la contraseña</label>
          <input id="new-confirm" type="password" required autoComplete="new-password" className="input"
            value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">{error}</p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          {saving ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </AuthCard>
  );
}
