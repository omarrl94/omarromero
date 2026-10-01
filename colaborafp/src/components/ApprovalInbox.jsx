import { Check, CheckCheck, Inbox, X } from 'lucide-react';
import { useState } from 'react';
import { useRoomFeed } from '../hooks/useRoomFeed';
import EmptyState from './EmptyState';
import ResourceCard from './ResourceCard';

/** Bandeja de Aprobación: peticiones de alumnos en tiempo real, con previsualización. */
export default function ApprovalInbox() {
  const { pendingRequests, approve, reject } = useRoomFeed();
  const [busy, setBusy] = useState({});
  const [error, setError] = useState(null);

  const run = async (id, action) => {
    setBusy((b) => ({ ...b, [id]: true }));
    setError(null);
    try {
      await action(id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(({ [id]: _done, ...rest }) => rest);
    }
  };

  const approveAll = () => Promise.all(pendingRequests.map((r) => run(r.id, approve)));

  return (
    <section aria-labelledby="inbox-title">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="inbox-title" className="section-title">
          <Inbox className="h-4 w-4" />
          Bandeja de aprobación
          {pendingRequests.length > 0 && (
            <span className="chip bg-amber-500 text-ink-950">{pendingRequests.length}</span>
          )}
        </h2>
        {pendingRequests.length > 1 && (
          <button className="btn-ghost btn-sm" onClick={approveAll}>
            <CheckCheck className="h-4 w-4" />
            Aprobar todo
          </button>
        )}
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      {pendingRequests.length === 0 ? (
        <EmptyState icon={Inbox} title="No hay peticiones pendientes">
          Cuando un alumno pulse «Compartir recurso», su aportación aparecerá aquí para que la revises.
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {pendingRequests.map((r) => (
            <li key={r.id} className="rounded-2xl ring-2 ring-amber-400/60">
              <ResourceCard
                resource={r}
                maxHeight="16rem"
                footer={
                  <>
                <button className="btn-accent flex-1" disabled={busy[r.id]} onClick={() => run(r.id, approve)}>
                  <Check className="h-4 w-4" />
                  Aprobar
                </button>
                <button className="btn-danger flex-1" disabled={busy[r.id]} onClick={() => run(r.id, reject)}>
                  <X className="h-4 w-4" />
                  Rechazar
                </button>
                  </>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
