import { UserMinus, Users } from 'lucide-react';
import { useState } from 'react';
import { backend } from '../services/backend';

/** Dueño del calendario: profesores colaboradores y si admite que se unan más. */
export default function CalendarCollaborators({ calendar, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const people = Object.entries(calendar.editor_info || {}).filter(([uid]) => calendar.editors.includes(uid));

  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      onChange(await fn());
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card p-5" aria-labelledby="collab-title">
      <h2 id="collab-title" className="mb-1 flex items-center gap-2 text-base font-bold">
        <Users className="h-4 w-4 text-brand-600 dark:text-brand-400" aria-hidden="true" /> Profesores colaboradores
      </h2>
      <p className="mb-3 text-xs text-stone-600 dark:text-stone-400">
        Otro profesor del centro se une abriendo este calendario con su código (desde la portada o el QR) y pulsando «Colaborar como profesor».
        Podrá añadir, editar y borrar fechas.
      </p>
      <label className="mb-3 flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-brand-600"
          checked={calendar.open_to_teachers}
          disabled={busy}
          onChange={async (e) => {
            // Cambio inmediato en pantalla; si el servidor lo rechaza, se deshace
            const open = e.target.checked;
            onChange({ ...calendar, open_to_teachers: open });
            setError(null);
            try {
              await backend.calendars.setOpenToTeachers(calendar, open);
            } catch (err) {
              onChange({ ...calendar, open_to_teachers: !open });
              setError(err.message);
            }
          }}
        />
        <span>Permitir que se unan más profesores</span>
      </label>
      {people.length ? (
        <ul className="divide-y divide-stone-100 dark:divide-ink-800">
          {people.map(([uid, info]) => (
            <li key={uid} className="flex items-center gap-2 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{info.name}</span>
                <span className="block truncate text-xs text-stone-600 dark:text-stone-400">{info.email}</span>
              </span>
              <button
                type="button"
                className="btn-ghost btn-sm"
                disabled={busy}
                aria-label={`Quitar a ${info.name} como colaborador`}
                title="Quitar colaborador"
                onClick={() => window.confirm(`¿Quitar a ${info.name}? Dejará de poder editar este calendario.`) && run(() => backend.calendars.removeEditor(calendar, uid))}
              >
                <UserMinus className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-stone-600 dark:text-stone-400">Aún no colabora nadie.</p>
      )}
      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
    </section>
  );
}
