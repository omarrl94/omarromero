import { UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import AuthCard from '../components/AuthCard';

export default function Register() {
  useDocumentTitle('Registro profesorado');
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/profesor" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden.');
    setSubmitting(true);
    try {
      await signUp({ name: form.name, email: form.email, password: form.password });
      navigate('/profesor', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Crear cuenta de profesorado"
      subtitle="Solo el profesorado necesita cuenta. El alumnado entra con PIN o QR."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">Nombre y apellidos</label>
          <input id="name" required autoComplete="name" className="input" value={form.name} onChange={set('name')} />
        </div>
        <div>
          <label className="label" htmlFor="email">Correo electrónico</label>
          <input id="email" type="email" required autoComplete="email" className="input" placeholder="nombre@centro.es"
            value={form.email} onChange={set('email')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="password">Contraseña</label>
            <input id="password" type="password" required minLength={8} autoComplete="new-password" className="input"
              value={form.password} onChange={set('password')} />
          </div>
          <div>
            <label className="label" htmlFor="confirm">Repite la contraseña</label>
            <input id="confirm" type="password" required autoComplete="new-password" className="input"
              value={form.confirm} onChange={set('confirm')} />
          </div>
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          <UserRound className="h-4 w-4" />
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </AuthCard>
  );
}
