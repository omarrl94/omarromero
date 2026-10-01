import { Check, Copy } from 'lucide-react';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

export default function CopyButton({ text, label = 'Copiar código' }) {
  const { copied, copy } = useCopyToClipboard();
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      className={`btn btn-sm ${
        copied
          ? 'bg-accent-500 text-ink-950'
          : 'bg-slate-900 text-white hover:bg-slate-700 dark:bg-ink-800 dark:hover:bg-ink-700'
      }`}
      aria-live="polite"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? '¡Copiado!' : label}
    </button>
  );
}
