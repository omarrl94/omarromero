import { CircleCheck, CircleX, Clock, X } from 'lucide-react';
import { useRoomFeed } from '../hooks/useRoomFeed';
import { RESOURCE_TYPES } from '../utils/constants';

const STATUS = {
  pending: { label: 'Esperando aprobación', icon: Clock, cls: 'text-sun-700 dark:text-sun-300' },
  approved: { label: 'Publicado en el muro', icon: CircleCheck, cls: 'text-accent-700 dark:text-accent-300' },
  rejected: { label: 'No aprobado', icon: CircleX, cls: 'text-red-600 dark:text-red-400' },
  removed: { label: 'Retirado del muro', icon: CircleX, cls: 'text-stone-500' },
};

export default function MySubmissions() {
  const { mySubmissions, dismissSubmission } = useRoomFeed();
  if (!mySubmissions.length) return null;

  return (
    <section className="card p-4">
      <h2 className="section-title mb-3">Mis aportaciones</h2>
      <ul className="space-y-2">
        {mySubmissions.map((s) => {
          const st = STATUS[s.status] ?? STATUS.pending;
          const Icon = st.icon;
          return (
            <li key={s.id} className="flex items-center gap-3 rounded-xl bg-stone-50 px-3 py-2 dark:bg-ink-850">
              <Icon className={`h-5 w-5 shrink-0 ${st.cls} ${s.status === 'pending' ? 'animate-pulse' : ''}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs text-stone-600 dark:text-stone-300">{s.preview}</p>
                <p className={`text-xs font-semibold ${st.cls}`}>
                  {RESOURCE_TYPES[s.type]?.label} · {st.label}
                </p>
              </div>
              {s.status !== 'pending' && (
                <button onClick={() => dismissSubmission(s.id)} className="btn-ghost btn-sm !p-1" aria-label="Ocultar">
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
