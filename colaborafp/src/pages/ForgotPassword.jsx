import { KeyRound, MailCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { isTeacherEmail, TEACHER_EMAIL_DOMAINS } from '../utils/constants';

/** Pide un enlace para elegir una contraseña nueva. No revela si la cuenta existe. */
export default function ForgotPassword() {
  useDocumentTitle('Recuperar contraseña');
  const { resetPassword } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!isTeacherEmail(email)) return setError(`Escribe tu correo del centro (${TEACHER_EMAIL_DOMAINS.map((d) => '@' + d).join(', ')}).`);
    setSending(true);
    try {
      setSent({ to: email.trim(), from: (await resetPassword(email)) || null });
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthCard
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace para elegir una contraseña nueva."
      footer={
        <Link to="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
          Volver a iniciar sesión
        </Link>
      }
    >
      {sent ? (
        <div className="flex gap-4 rounded-2xl bg-accent-100 p-5 text-ink-900 dark:bg-accent-300/15 dark:text-stone-100" role="status">
          <MailCheck className="h-7 w-7 shrink-0 text-accent-700 dark:text-accent-300" aria-hidden="true" />
          <div className="space-y-2 text-sm leading-relaxed">
            <p>
              Si existe una cuenta con <strong className="break-all">{sent.to}</strong>, te hemos enviado un enlace para elegir una contraseña
              nueva{sent.from && <> desde <strong className="break-all">{sent.from}</strong></>}.
            </p>
            <p>Puede tardar unos minutos. Revisa también el correo no deseado. El enlace caduca en una hora.</p>
            <button type="button" className="font-semibold underline" onClick={() => setSent(null)}>
              Enviar a otro correo
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="reset-email">Correo del centro</label>
            <input id="reset-email" type="email" required autoComplete="email" className="input" autoFocus
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">{error}</p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={sending}>
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            {sending ? 'Enviando…' : 'Enviarme el enlace'}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
