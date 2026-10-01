import { ExternalLink, Globe, Link2 } from 'lucide-react';
import { safeUrl } from '../utils/format';
import CardShell from './CardShell';
import CopyButton from './CopyButton';

export default function LinkCard({ resource, actions, footer }) {
  const url = safeUrl(resource.content);
  const host = url ? new URL(url).hostname.replace(/^www\./, '') : null;
  return (
    <CardShell
      resource={resource}
      footer={footer}
      icon={Link2}
      typeLabel="Enlace"
      accent={resource.author === 'teacher' ? 'brand' : 'accent'}
      actions={
        <>
          <CopyButton text={resource.content} label="Copiar enlace" />
          {actions}
        </>
      }
    >
      <div className="px-6 pb-6 pt-3">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 transition hover:border-brand-300 hover:bg-brand-50 dark:border-ink-700 dark:bg-ink-850 dark:hover:border-brand-400 dark:hover:bg-ink-800"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-800 dark:bg-brand-400/15 dark:text-brand-300">
              <Globe className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-stone-900 group-hover:text-brand-800 dark:text-stone-100 dark:group-hover:text-brand-300">
                {host}
              </span>
              <span className="block truncate font-mono text-xs text-stone-500">{url}</span>
            </span>
            <ExternalLink className="h-4 w-4 shrink-0 text-stone-400 group-hover:text-brand-500" />
          </a>
        ) : (
          <p className="text-sm text-red-500">Enlace no válido</p>
        )}
      </div>
    </CardShell>
  );
}
