import { MailCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { isTeacherEmail, TEACHER_EMAIL_DOMAINS } from '../utils/constants';

const DOMAINS = TEACHER_EMAIL_DOMAINS.map((d) => '@' + d).join(', ');

export default function Register() {
  useDocumentTitle('Registro profesorado');
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', accept: false });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState(null);
  const [sender, setSender] = useState(null);

  if (user) return <Navigate to="/profesor" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!isTeacherEmail(form.email)) return setError(`Usa tu correo del centro (${DOMAINS}).`);
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
      return setError('La contraseña debe tener al menos 8 caracteres e incluir letras y números.');
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden.');
    if (!form.accept) return setError('Debes aceptar las condiciones de uso y la política de privacidad.');
    setSubmitting(true);
    try {
      const result = await signUp({ name: form.name, email: form.email, password: form.password });
      if (result?.verificationSent) {
        setSender(result.sender || null);
        setSentTo(form.email.trim());
      }
      else navigate('/profesor', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (sentTo)
    return (
      <AuthCard
        title="Cuenta creada"
        subtitle="Solo falta un paso para activar tu cuenta."
        footer={
          <Link to="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            Ir a iniciar sesión
          </Link>
        }
      >
        <div className="flex gap-4 rounded-2xl bg-accent-100 p-5 text-ink-900 dark:bg-accent-300/15 dark:text-stone-100" role="status">
          <MailCheck className="h-7 w-7 shrink-0 text-accent-700 dark:text-accent-300" aria-hidden="true" />
          <p className="text-sm leading-relaxed">
            Tu cuenta <strong>{sentTo}</strong> está creada y pendiente de activación. Se activa de una de estas dos formas:
            <span className="mt-2 block">· Con el <strong>enlace del correo de verificación</strong>{sender && <> (remitente <strong className="break-all">{sender}</strong>)</>}.</span>
            <span className="block">· Cuando el <strong>administrador apruebe</strong> tu cuenta, si el correo del centro bloquea ese mensaje.</span>
            <span className="mt-2 block">Después, inicia sesión con tu correo y contraseña.</span>
          </p>
        </div>
      </AuthCard>
    );

  return (
    <AuthCard
      title="Crear cuenta de profesorado"
      subtitle={`Solo para el profesorado del centro, con correo ${DOMAINS}. El alumnado entra con PIN o QR, sin cuenta.`}
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="name">Nombre y apellidos</label>
          <input id="name" required autoComplete="name" className="input" value={form.name} onChange={set('name')} />
        </div>
        <div>
          <label className="label" htmlFor="email">Correo del centro</label>
          <input id="email" type="email" required autoComplete="email" className="input" placeholder={`nombre${TEACHER_EMAIL_DOMAINS[0] ? '@' + TEACHER_EMAIL_DOMAINS[0] : ''}`}
            aria-describedby="email-help" value={form.email} onChange={set('email')} />
          <p id="email-help" className="mt-1.5 text-xs text-stone-600 dark:text-stone-400">Te enviaremos un enlace para verificarlo.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="password">Contraseña</label>
            <input id="password" type="password" required minLength={8} autoComplete="new-password" className="input"
              aria-describedby="password-help" value={form.password} onChange={set('password')} />
          </div>
          <div>
            <label className="label" htmlFor="confirm">Repite la contraseña</label>
            <input id="confirm" type="password" required autoComplete="new-password" className="input"
              value={form.confirm} onChange={set('confirm')} />
          </div>
        </div>
        <p id="password-help" className="-mt-2 text-xs text-stone-600 dark:text-stone-400">Mínimo 8 caracteres, con letras y números.</p>

        <label className="flex items-start gap-3 rounded-xl border border-stone-200 p-3 text-sm dark:border-ink-700">
          <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-brand-700" checked={form.accept} onChange={set('accept')} required />
          <span>
            He leído y acepto las{' '}
            <Link to="/condiciones" target="_blank" className="font-semibold text-brand-700 underline dark:text-brand-300">condiciones de uso</Link>{' '}
            y la{' '}
            <Link to="/privacidad" target="_blank" className="font-semibold text-brand-700 underline dark:text-brand-300">política de privacidad</Link>.
          </span>
        </label>

        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          <UserRound className="h-4 w-4" aria-hidden="true" />
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </AuthCard>
  );
}
