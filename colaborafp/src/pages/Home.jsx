import { ArrowRight, Check, CodeXml, GraduationCap, Inbox, QrCode } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BrandMark } from '../components/Logo';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PIN_LENGTH } from '../utils/constants';
import { normalizePin } from '../utils/ids';

const STEPS = [
  { icon: QrCode, title: 'Entra al instante', text: 'Escanea el QR de la pizarra o escribe el PIN. Sin cuentas ni contraseñas.', tone: 'bg-brand-100 text-brand-800 dark:bg-brand-400/15 dark:text-brand-300' },
  { icon: CodeXml, title: 'Código listo para usar', text: 'Ejemplos con resaltado de sintaxis y botón de copiar en un clic.', tone: 'bg-accent-100 text-accent-800 dark:bg-accent-300/15 dark:text-accent-300' },
  { icon: Inbox, title: 'Comparte con tu clase', text: 'Propón tu solución; el profesor la revisa y la publica en el muro.', tone: 'bg-sun-100 text-sun-800 dark:bg-sun-400/15 dark:text-sun-300' },
];

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
    <div className="overflow-hidden">
      <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24 lg:pt-20">
        {/* Columna de acceso */}
        <div className="min-w-0 animate-fade-in-up">
          <p className="eyebrow">Formación Profesional · Todos los ciclos</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink-950 dark:text-white sm:text-5xl lg:text-[3.6rem]">
            Tu clase,
            <br />
            <span className="relative inline-block">
              <span className="relative z-10">sincronizada.</span>
              <span className="absolute inset-x-0 bottom-1 z-0 h-3 rounded-sm bg-sun-400/60 sm:bottom-2 sm:h-4" aria-hidden="true" />
            </span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-stone-600 dark:text-stone-400">
            Recibe en tiempo real el código, los enunciados y los enlaces de tu profesor, y comparte tus soluciones con el grupo.
          </p>

          <form onSubmit={join} className="card mt-8 max-w-lg p-5 sm:p-6">
            <label htmlFor="pin" className="label">
              PIN de la sala
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="pin"
                value={pin}
                onChange={(e) => setPin(normalizePin(e.target.value))}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                placeholder="000000"
                aria-describedby="pin-help"
                className="min-w-0 flex-1 rounded-xl border-2 border-stone-200 bg-stone-50 px-4 py-3 text-center font-mono text-3xl font-bold tracking-[0.35em] text-ink-950 placeholder-stone-300 transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-400/20 dark:border-ink-700 dark:bg-ink-850 dark:text-white dark:placeholder-ink-700"
              />
              <button type="submit" disabled={!complete} className="btn-primary px-6 py-3.5 text-base">
                Entrar
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <p id="pin-help" className="mt-3 flex items-center gap-1.5 text-xs text-stone-500">
              <Check className="h-3.5 w-3.5 text-accent-600" />
              {PIN_LENGTH} dígitos · No necesitas registrarte
            </p>
          </form>

          <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-600 dark:text-stone-400">
            <GraduationCap className="h-4 w-4" />
            ¿Eres docente?
            <Link to={user ? '/profesor' : '/login'} className="font-semibold text-brand-700 underline-offset-4 hover:underline dark:text-brand-400">
              {user ? 'Ir a mis salas' : 'Accede al panel del profesorado'}
            </Link>
          </p>
        </div>

        {/* Composición de marca */}
        <div className="relative mx-auto hidden aspect-square w-full max-w-[34rem] lg:block" aria-hidden="true">
          <BrandMark className="absolute inset-[6%] h-[88%] w-[88%] drop-shadow-sm" />
          <span className="absolute right-[2%] top-[4%] h-28 w-28 rounded-full bg-sun-400" />
          <span className="absolute bottom-[6%] left-[0%] h-36 w-36 rounded-full bg-accent-300" />

          <div className="absolute bottom-[16%] right-[-2%] w-[19rem] rotate-[1.5deg] overflow-hidden rounded-2xl bg-white shadow-lift dark:bg-ink-900">
            <div className="flex items-center gap-2 border-b border-stone-100 px-4 py-2.5 dark:border-ink-800">
              <span className="chip bg-brand-100 text-brand-800">Profesor</span>
              <span className="chip bg-stone-100 font-mono text-stone-600 dark:bg-ink-800 dark:text-stone-300">Python</span>
              <span className="ml-auto chip bg-ink-900 text-white dark:bg-ink-700">Copiar</span>
            </div>
            <pre className="bg-[#1e1b19] px-4 py-3 font-mono text-[12.5px] leading-6 text-stone-200">
              <span className="text-[#c678dd]">for</span> i <span className="text-[#c678dd]">in</span> <span className="text-[#61afef]">range</span>(<span className="text-[#d19a66]">5</span>):{'\n'}
              {'    '}<span className="text-[#61afef]">print</span>(<span className="text-[#98c379]">f"Paso </span><span className="text-[#d19a66]">{'{i}'}</span><span className="text-[#98c379]">"</span>)
            </pre>
          </div>

          <div className="absolute left-[-4%] top-[22%] flex w-[15rem] -rotate-2 items-center gap-3 rounded-2xl bg-white p-3.5 shadow-lift dark:bg-ink-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-300 font-display text-sm font-bold text-ink-950">L</span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink-900 dark:text-white">Lucía ha compartido</span>
              <span className="block text-xs text-stone-500">Aprobado por el profesor ✓</span>
            </span>
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200/70 bg-white dark:border-ink-800 dark:bg-ink-900/50">
        <ol className="mx-auto grid max-w-7xl grid-cols-1 gap-px px-4 sm:px-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text, tone }, i) => (
            <li key={title} className="flex gap-4 py-8 md:px-6 md:first:pl-0">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="font-mono text-xs text-stone-400">0{i + 1}</span>
                <span className="block font-display text-base font-bold text-ink-900 dark:text-white">{title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-stone-600 dark:text-stone-400">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
