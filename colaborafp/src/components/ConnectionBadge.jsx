import { Wifi, WifiOff } from 'lucide-react';

export default function ConnectionBadge({ status }) {
  if (status === 'live')
    return (
      <span className="chip bg-accent-100 text-accent-800 dark:bg-accent-300/15 dark:text-accent-300">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-500 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-600" />
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
    <span className="chip bg-stone-100 text-stone-600 dark:bg-ink-800 dark:text-stone-300">
      <Wifi className="h-3.5 w-3.5 animate-pulse" />
      Conectando…
    </span>
  );
}
