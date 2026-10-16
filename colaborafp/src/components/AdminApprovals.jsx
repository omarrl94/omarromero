import { Check, RotateCcw, Trash2, UserCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { backend } from '../services/backend';
import { formatDate } from '../utils/format';

/**
 * Solo administradores: aprobar las cuentas del profesorado.
 * Sustituye al correo de verificación cuando el correo del centro bloquea los mensajes externos.
 */
export default function AdminApprovals() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    backend.approvals.list().then(setItems).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const act = async (id, fn) => {
    setBusy(id);
    setError(null);
    try {
      await fn();
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const pending = (items || []).filter((i) => !i.approved);
  const approved = (items || []).filter((i) => i.approved);

  const Row = ({ item }) => (
    <li className="flex flex-wrap items-center gap-2 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{item.name || 'Sin nombre'}</p>
        <p className="truncate text-xs text-stone-600 dark:text-stone-400">
          {item.email} · {formatDate(item.created_at)}
        </p>
      </div>
      {item.approved ? (
        <button className="btn-secondary btn-sm" disabled={busy === item.id} onClick={() => act(item.id, () => backend.approvals.setApproved(item.id, false))}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Retirar
        </button>
      ) : (
        <>
          <button className="btn-primary btn-sm" disabled={busy === item.id} onClick={() => act(item.id, () => backend.approvals.setApproved(item.id, true))}>
            <Check className="h-3.5 w-3.5" aria-hidden="true" /> Aprobar
          </button>
          <button
            className="btn-danger btn-sm"
            disabled={busy === item.id}
            aria-label={`Descartar la solicitud de ${item.email}`}
            onClick={() => window.confirm(`¿Descartar la solicitud de ${item.email}?`) && act(item.id, () => backend.approvals.remove(item.id))}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </>
      )}
    </li>
  );

  return (
    <section className="card p-6" aria-labelledby="approvals-title">
      <h2 id="approvals-title" className="mb-1 flex items-center gap-2 text-lg font-bold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sun-100 text-sun-900 dark:bg-sun-400/15 dark:text-sun-200">
          <UserCheck className="h-4 w-4" aria-hidden="true" />
        </span>
        Altas del profesorado
        {pending.length > 0 && <span className="ml-auto rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">{pending.length}</span>}
      </h2>
      <p className="mb-3 text-xs text-stone-600 dark:text-stone-400">
        Aprueba solo a personas que conozcas: la aprobación sustituye a la verificación por correo.
      </p>
      {error && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      {items === null ? (
        <p className="text-sm text-stone-600 dark:text-stone-400">Cargando…</p>
      ) : (
        <>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">Pendientes</h3>
          {pending.length ? (
            <ul className="divide-y divide-stone-100 dark:divide-ink-800">{pending.map((i) => <Row key={i.id} item={i} />)}</ul>
          ) : (
            <p className="py-2 text-sm text-stone-600 dark:text-stone-400">No hay solicitudes pendientes.</p>
          )}
          {approved.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Aprobadas ({approved.length})
              </summary>
              <ul className="divide-y divide-stone-100 dark:divide-ink-800">{approved.map((i) => <Row key={i.id} item={i} />)}</ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}
