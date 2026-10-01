import { LoaderCircle } from 'lucide-react';

export default function Spinner({ label, fullPage = false, className = '' }) {
  const content = (
    <span className={`inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 ${className}`}>
      <LoaderCircle className="h-5 w-5 animate-spin text-brand-500" />
      {label}
    </span>
  );
  return fullPage ? <div className="flex min-h-[50vh] items-center justify-center">{content}</div> : content;
}
