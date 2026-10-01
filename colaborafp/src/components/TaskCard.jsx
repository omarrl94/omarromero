import { FileText } from 'lucide-react';
import CardShell from './CardShell';
import CopyButton from './CopyButton';

/** Enunciados: texto plano con saltos de línea respetados y `código en línea` resaltado. */
const renderInline = (line, key) =>
  line.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith('`') && part.endsWith('`') && part.length > 2 ? (
      <code key={`${key}-${i}`} className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[0.85em] text-brand-800 dark:bg-ink-800 dark:text-brand-300">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  );

export default function TaskCard({ resource, actions, footer }) {
  const lines = resource.content.split('\n');
  return (
    <CardShell
      resource={resource}
      footer={footer}
      icon={FileText}
      typeLabel="Enunciado"
      accent={resource.author === 'teacher' ? 'sun' : 'accent'}
      actions={
        <>
          <CopyButton text={resource.content} label="Copiar texto" />
          {actions}
        </>
      }
    >
      <div className="space-y-1 px-6 pb-6 pt-3 text-[15px] leading-relaxed text-stone-700 dark:text-stone-300">
        {lines.map((line, i) =>
          line.trim() ? <p key={i}>{renderInline(line, i)}</p> : <div key={i} className="h-2" />,
        )}
      </div>
    </CardShell>
  );
}
