import { CircleAlert, X } from 'lucide-react';
import { useEffect } from 'react';
import { useRoomFeed } from '../hooks/useRoomFeed';

/** Aviso flotante (p. ej. una publicación que el servidor ha rechazado). Se cierra solo. */
export default function RoomNotice() {
  const { notice, clearNotice } = useRoomFeed();

  useEffect(() => {
    if (!notice) return undefined;
    const id = setTimeout(clearNotice, 7000);
    return () => clearTimeout(id);
  }, [notice, clearNotice]);

  if (!notice) return null;
  return (
    <div role="alert" className="fixed inset-x-4 bottom-6 z-40 mx-auto flex max-w-md animate-fade-in-up items-start gap-3 rounded-2xl bg-ink-900 p-4 text-sm text-white shadow-lift dark:bg-ink-800">
      <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-brand-300" />
      <p className="flex-1">{notice.message}</p>
      <button onClick={clearNotice} className="text-stone-400 hover:text-white" aria-label="Cerrar aviso">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
