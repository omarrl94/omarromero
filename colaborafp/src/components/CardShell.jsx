import { timeAgo, formatDate } from '../utils/format';
import AuthorBadge from './AuthorBadge';

/** Estructura común de las tarjetas: cabecera (tipo, autor, hora, acciones) + cuerpo. */
export default function CardShell({ resource, icon: Icon, typeLabel, headerExtra, actions, footer, children, accent = 'brand' }) {
  const bar = { brand: 'bg-brand-400', accent: 'bg-accent-300', sun: 'bg-sun-400' }[accent];
  return (
    <article className="card relative animate-fade-in-up overflow-hidden">
      <span className={`absolute inset-y-0 left-0 w-1.5 ${bar}`} aria-hidden="true" />
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-stone-100 px-4 py-3 pl-6 dark:border-ink-800">
        <span className="inline-flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
          <Icon className="h-4 w-4" />
          {typeLabel}
        </span>
        <AuthorBadge author={resource.author} />
        {headerExtra}
        <time className="text-xs text-stone-400" dateTime={new Date(resource.timestamp).toISOString()} title={formatDate(resource.timestamp)}>
          {timeAgo(resource.timestamp)}
        </time>
        {actions && <div className="ml-auto flex items-center gap-1.5">{actions}</div>}
      </header>
      {resource.title && (
        <h3 className="px-6 pt-4 text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100">{resource.title}</h3>
      )}
      {children}
      {footer && (
        <footer className="flex gap-2 border-t border-stone-100 bg-stone-50 p-3 pl-6 dark:border-ink-800 dark:bg-ink-850">{footer}</footer>
      )}
    </article>
  );
}
