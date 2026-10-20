import { ArrowRight, CalendarDays, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { backend } from '../services/backend';
import { courseOptions } from '../utils/calendar';
import { formatPin } from '../utils/ids';

/** «Mis salas» → Calendarios de clase: uno por aula o grupo, durante todo el curso. */
export default function ClassCalendars({ teacherId }) {
  const navigate = useNavigate();
  const courses = courseOptions();
  const [list, setList] = useState(null);
  const [form, setForm] = useState({ name: '', course: courses[0] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    backend.calendars.listByTeacher(teacherId).then(setList).catch((e) => setError(e.message));
  }, [teacherId]);
  useEffect(load, [load]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const cal = await backend.calendars.create({ name: form.name, course: form.course, teacherId });
      navigate(`/profesor/calendario/${cal.id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const remove = async (cal) => {
    if (!window.confirm(`¿Eliminar el calendario «${cal.name}» y todas sus fechas? El alumnado dejará de verlo.`)) return;
    try {
      await backend.calendars.remove(cal.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section aria-labelledby="calendars-title">
      <h2 id="calendars-title" className="section-title mb-1">Calendarios de clase</h2>
      <p className="mb-4 text-sm text-stone-600 dark:text-stone-400">
        Un calendario por aula o grupo para todo el curso: exámenes, entregas, avisos y festivos. El alumnado lo consulta con un código o QR, sin cuenta.
      </p>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <form onSubmit={create} className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[12rem] flex-1">
          <label className="label" htmlFor="cal-name">Aula o grupo</label>
          <input id="cal-name" className="input" required maxLength={80} placeholder="1º DAM · Programación" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="cal-course">Curso</label>
          <select id="cal-course" className="input" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}>
            {courses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary" disabled={busy || !form.name.trim()}>
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          {busy ? 'Creando…' : 'Crear calendario'}
        </button>
      </form>

      {list && list.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {list.map((cal) => (
            <li key={cal.id} className="card flex flex-col p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sun-100 text-sun-900 dark:bg-sun-400/15 dark:text-sun-200">
                  <CalendarDays className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold">{cal.name}</h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    Curso {cal.course} · {cal.event_count} {cal.event_count === 1 ? 'fecha' : 'fechas'} · código <span className="font-mono font-semibold">{formatPin(cal.code)}</span>
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2 border-t border-stone-100 pt-4 dark:border-ink-800">
                <Link to={`/profesor/calendario/${cal.id}`} className="btn-primary btn-sm flex-1">
                  Abrir calendario <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <button type="button" className="btn-danger btn-sm" onClick={() => remove(cal)} aria-label={`Eliminar el calendario ${cal.name}`} title="Eliminar calendario">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
