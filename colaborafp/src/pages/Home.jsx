import { ArrowRight, CodeXml, GraduationCap, Inbox, QrCode } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { CENTER_NAME, PIN_LENGTH } from '../utils/constants';
import { normalizePin } from '../utils/ids';

export default function Home() {
  useDocumentTitle(null);
  const [params] = useSearchParams();
  const [pin, setPin] = useState(() => normalizePin(params.get('pin')));
  const navigate = useNavigate();
  const { user } = useAuth();
  const complete = pin.length === PIN_LENGTH;

  const join = (e) => {
    e.preventDefault();
    if (complete) navigate(`/sala/${pin}`);
  };

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 h-[32rem] bg-[radial-gradient(ellipse_at_top,theme(colors.brand.200/60%),transparent_65%)] dark:bg-[radial-gradient(ellipse_at_top,theme(colors.brand.900/45%),transparent_65%)]"
      />
      <div className="relative mx-auto flex max-w-xl flex-col items-center px-4 pb-16 pt-14 text-center sm:pt-20">
        <Logo size="lg" />
        <h1 className="mt-10 text-3xl font-extrabold tracking-tight sm:text-4xl">Únete a tu clase</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Introduce el PIN que aparece en la pizarra o escanea el código QR.
        </p>

        <form onSubmit={join} className="card mt-8 w-full p-6 sm:p-8">
          <label htmlFor="pin" className="sr-only">
            PIN de la sala
          </label>
          <input
            id="pin"
            value={pin}
            onChange={(e) => setPin(normalizePin(e.target.value))}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="000000"
            aria-describedby="pin-help"
            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-4 text-center font-mono text-4xl font-bold tracking-[0.4em] text-slate-900 placeholder-slate-300 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-850 dark:text-white dark:placeholder-ink-700 dark:focus:bg-ink-850 sm:text-5xl"
          />
          <p id="pin-help" className="mt-2 text-xs text-slate-500">
            {PIN_LENGTH} dígitos · no necesitas registrarte
          </p>
          <button type="submit" disabled={!complete} className="btn-primary mt-5 w-full py-3.5 text-base">
            Entrar a la sala
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>

        <div className="mt-8 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <GraduationCap className="h-4 w-4" />
          ¿Eres docente?
          <Link to={user ? '/profesor' : '/login'} className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            {user ? 'Ir a mis salas' : 'Accede al panel del profesorado'}
          </Link>
        </div>

        <ul className="mt-14 grid w-full gap-3 text-left sm:grid-cols-3">
          {[
            { icon: QrCode, title: 'Entra al instante', text: 'QR o PIN, sin cuentas para el alumnado.' },
            { icon: CodeXml, title: 'Código listo', text: 'Resaltado de sintaxis y botón de copiar.' },
            { icon: Inbox, title: 'Comparte', text: 'Propón tu código; el profesor lo modera.' },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-2xl border border-slate-200 bg-white/60 p-4 dark:border-ink-800 dark:bg-ink-900/60">
              <Icon className="mb-2 h-5 w-5 text-brand-600 dark:text-brand-400" />
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-xs text-slate-400">{CENTER_NAME}</p>
      </div>
    </div>
  );
}
