import { Flag, Trash2, X } from 'lucide-react';
import { useRoomFeed } from '../hooks/useRoomFeed';
import { timeAgo } from '../utils/format';
import { REPORT_REASONS } from './ReportButton';

/** Avisos de contenido recibidos en la sala (solo profesor). */
export default function ReportsPanel() {
  const { reports, dismissReport, publishedResources, pendingRequests, remove } = useRoomFeed();
  if (!reports.length) return null;
  const all = [...publishedResources, ...pendingRequests];

  return (
    <section aria-labelledby="reports-title" className="mb-6 rounded-2xl border-2 border-red-300 bg-red-50 p-4 dark:border-red-900/70 dark:bg-red-950/30">
      <h2 id="reports-title" className="section-title !text-red-800 dark:!text-red-300">
        <Flag className="h-4 w-4" aria-hidden="true" />
        Contenido notificado ({reports.length})
      </h2>
      <ul className="mt-3 space-y-2">
        {reports.map((rep) => {
          const res = all.find((r) => r.id === rep.resource_id);
          return (
            <li key={rep.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 text-sm dark:bg-ink-900">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-900 dark:text-white">{REPORT_REASONS[rep.reason] ?? rep.reason}</p>
                <p className="truncate text-stone-700 dark:text-stone-300">
                  {res ? `Recurso: ${res.title || res.content.slice(0, 70)}` : 'El recurso ya no está publicado.'}
                </p>
                {rep.details && <p className="mt-1 text-stone-600 dark:text-stone-400">«{rep.details}»</p>}
                <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">{timeAgo(rep.created_at)}</p>
              </div>
              {res && (
                <button
                  className="btn-danger btn-sm"
                  onClick={async () => {
                    if (!window.confirm('¿Retirar este recurso del muro?')) return;
                    await remove(res.id);
                    dismissReport(rep.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Retirar recurso
                </button>
              )}
              <button className="btn-secondary btn-sm" onClick={() => dismissReport(rep.id)}>
                <X className="h-3.5 w-3.5" aria-hidden="true" /> Descartar aviso
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
