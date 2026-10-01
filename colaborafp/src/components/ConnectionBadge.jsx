import { Wifi, WifiOff } from 'lucide-react';

export default function ConnectionBadge({ status }) {
  if (status === 'live')
    return (
      <span className="chip bg-accent-500/15 text-accent-600 dark:text-accent-400">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-500" />
        </span>
        En directo
      </span>
    );
  if (status === 'error')
    return (
      <span className="chip bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
        <WifiOff className="h-3.5 w-3.5" />
        Sin conexión
      </span>
    );
  return (
    <span className="chip bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-300">
      <Wifi className="h-3.5 w-3.5 animate-pulse" />
      Conectando…
    </span>
  );
}
