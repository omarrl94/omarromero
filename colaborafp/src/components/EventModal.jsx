import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { buildEvent, EVENT_TYPE_IDS, EVENT_TYPES } from '../utils/calendar';
import Modal from './Modal';

/** Crear o editar un evento del calendario de clase. */
export default function EventModal({ initial, onSave, onDelete, onClose }) {
  const editing = !!initial?.id;
  const [draft, setDraft] = useState({
    title: initial?.title || '',
    type: initial?.type || 'examen',
    date: initial?.date || '',
    end_date: initial?.end_date || '',
    time: initial?.time || '',
    description: initial?.description || '',
  });
  const [multi, setMulti] = useState(!!initial?.end_date);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const { event, error: err } = buildEvent({ ...draft, end_date: multi ? draft.end_date : null, time: multi ? null : draft.time });
    if (err) return setError(err);
    setBusy(true);
    setError(null);
    try {
      await onSave(event);
    } catch (e2) {
      setError(e2.message);
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`¿Borrar «${initial.title}» del calendario?`)) return;
    setBusy(true);
    try {
      await onDelete();
    } catch (e2) {
      setError(e2.message);
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={editing ? 'Editar fecha' : 'Nueva fecha en el calendario'} size="md">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="ev-title">Título</label>
          <input id="ev-title" className="input" required maxLength={120} autoFocus placeholder="Examen tema 3 · Redes" value={draft.title} onChange={set('title')} />
        </div>
        <div>
          <label className="label" htmlFor="ev-type">Tipo</label>
          <select id="ev-type" className="input" value={draft.type} onChange={set('type')}>
            {EVENT_TYPE_IDS.map((t) => (
              <option key={t} value={t}>{EVENT_TYPES[t].label}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="ev-date">{multi ? 'Desde' : 'Fecha'}</label>
            <input id="ev-date" type="date" className="input" required value={draft.date} onChange={set('date')} />
          </div>
          {multi ? (
            <div>
              <label className="label" htmlFor="ev-end">Hasta</label>
              <input id="ev-end" type="date" className="input" required min={draft.date} value={draft.end_date} onChange={set('end_date')} />
            </div>
          ) : (
            <div>
              <label className="label" htmlFor="ev-time">Hora (opcional)</label>
              <input id="ev-time" type="time" className="input" value={draft.time} onChange={set('time')} />
            </div>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={multi} onChange={(e) => setMulti(e.target.checked)} />
          Dura varios días (vacaciones, semana de exámenes…)
        </label>
        <div>
          <label className="label" htmlFor="ev-desc">Detalles (opcional)</label>
          <textarea id="ev-desc" className="input min-h-[5rem]" maxLength={1000} placeholder="Temas que entran, aula, qué hay que entregar…" value={draft.description} onChange={set('description')} />
          <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">Lo verá todo el grupo. No pongas datos personales del alumnado.</p>
        </div>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        <div className="flex flex-wrap items-center gap-2">
          {editing && (
            <button type="button" className="btn-danger" onClick={remove} disabled={busy}>
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Borrar
            </button>
          )}
          <span className="flex-1" />
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Añadir al calendario'}</button>
        </div>
      </form>
    </Modal>
  );
}
