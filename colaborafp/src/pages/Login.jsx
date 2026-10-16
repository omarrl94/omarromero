import { LogIn, MailCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Login() {
  useDocumentTitle('Acceso profesorado');
  const { signIn, resendVerification, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const redirectTo = location.state?.from?.pathname || '/profesor';

  if (user) return <Navigate to={redirectTo} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setUnverified(false);
    setResent(false);
    try {
      await signIn(form);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
      setUnverified(err.code === 'unverified');
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setResent(false);
    try {
      const from = await resendVerification(form);
      setError(null);
      setResent(from || true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthCard
      title="Acceso profesorado"
      subtitle="Gestiona tus salas de clase y modera las aportaciones."
      footer={
        <>
          ¿Aún no tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            Regístrate con tu correo del centro
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Correo del centro</label>
          <input id="email" type="email" required autoComplete="email" className="input"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <label className="label" htmlFor="password">Contraseña</label>
            <Link to="/recuperar-contrasena" state={{ email: form.email }} className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300">
              ¿Has olvidado tu contraseña?
            </Link>
          </div>
          <input id="password" type="password" required autoComplete="current-password" className="input"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {error && (
          <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">
            <p>{error}</p>
            {unverified && !resent && (
              <button type="button" onClick={resend} className="mt-2 font-semibold underline">
                Reenviar el correo de verificación
              </button>
            )}
          </div>
        )}
        {resent && (
          <p role="status" className="flex items-start gap-2 rounded-lg bg-accent-100 px-3 py-2 text-sm text-accent-800 dark:bg-accent-300/15 dark:text-accent-300">
            <MailCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Te hemos reenviado el enlace de verificación{typeof resent === 'string' && <> desde <strong className="break-all">{resent}</strong></>}. Puede
              tardar unos minutos; no lo pidas otra vez enseguida.
            </span>
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {submitting ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>
    </AuthCard>
  );
}
