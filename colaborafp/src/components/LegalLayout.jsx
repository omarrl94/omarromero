import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { LEGAL_VERSION } from '../config/centro';

const NAV = [
  ['/aviso-legal', 'Aviso legal'],
  ['/privacidad', 'Privacidad'],
  ['/condiciones', 'Condiciones de uso'],
  ['/accesibilidad', 'Accesibilidad'],
];

/** Dato del titular: si falta, se muestra claramente como pendiente. */
export function Dato({ value, label }) {
  if (value) return <span className="font-semibold">{value}</span>;
  return (
    <mark className="rounded bg-sun-200 px-1.5 py-0.5 text-sm font-semibold text-sun-900">
      [{label}: pendiente de completar]
    </mark>
  );
}

export function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mt-10 text-xl font-extrabold tracking-tight text-ink-950 dark:text-white">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-stone-700 dark:text-stone-300">{children}</div>
    </section>
  );
}

export const List = ({ items }) => (
  <ul className="list-disc space-y-1.5 pl-6 marker:text-brand-500">
    {items.map((it, i) => (
      <li key={i}>{it}</li>
    ))}
  </ul>
);

export default function LegalLayout({ title, intro, children }) {
  useDocumentTitle(title);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <nav aria-label="Información legal" className="mb-8 flex flex-wrap gap-2">
        {NAV.map(([to, label]) => (
          <Link key={to} to={to} className="chip border border-stone-300 bg-white py-1 text-stone-700 hover:border-brand-400 dark:border-ink-700 dark:bg-ink-900 dark:text-stone-300">
            {label}
          </Link>
        ))}
      </nav>
      <p className="eyebrow">ColaboraFP · Información legal</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-950 dark:text-white sm:text-4xl">{title}</h1>
      {intro && <p className="mt-4 text-lg leading-relaxed text-stone-700 dark:text-stone-300">{intro}</p>}
      <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">Última actualización: {LEGAL_VERSION}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
