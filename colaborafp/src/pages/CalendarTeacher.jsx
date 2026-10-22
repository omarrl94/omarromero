import { CalendarPlus, ChevronLeft, Flag, LogOut, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CalendarCollaborators from '../components/CalendarCollaborators';
import { useAuth } from '../hooks/useAuth';
import CalendarBoard from '../components/CalendarBoard';
import CalendarShare from '../components/CalendarShare';
import EmptyState from '../components/EmptyState';
import EventModal from '../components/EventModal';
import Spinner from '../components/Spinner';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { backend } from '../services/backend';
import { nationalHolidays, todayIso } from '../utils/calendar';
import { formatDay } from '../utils/format';

export default function CalendarTeacher() {
  const { calId } = useParams();
  const [calendar, setCalendar] = useState(undefined);
  const [events, setEvents] = useState([]);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle(calendar ? `Calendario · ${calendar.name}` : 'Calendario');

  useEffect(() => {
    let alive = true;
    backend.calendars.getById(calId).then((c) => alive && setCalendar(c));
    return () => {
      alive = false;
    };
  }, [calId]);

  useEffect(() => {
    if (!calendar) return undefined;
    return backend.calendars.subscribeEvents(calendar.id, setEvents, (e) => setError(e.message));
  }, [calendar?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (calendar === undefined) return <Spinner fullPage label="Cargando calendario…" />;
  if (!calendar)
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState icon={CalendarPlus} title="Calendario no encontrado">
          Puede que se haya borrado o que no sea tuyo. <Link to="/profesor" className="font-semibold text-brand-700 underline dark:text-brand-300">Volver a mis salas</Link>
        </EmptyState>
      </div>
    );

  const isOwner = calendar.teacher_id === user.id;

  const leave = async () => {
    if (!window.confirm(`¿Dejar de colaborar en «${calendar.name}»? Las fechas que añadiste se quedan en el calendario.`)) return;
    try {
      await backend.calendars.leave(calendar.id);
      navigate('/profesor');
    } catch (e) {
      setError(e.message);
    }
  };

  const rename = async () => {
    const name = window.prompt('Nombre del calendario', calendar.name);
    if (!name || !name.trim() || name.trim() === calendar.name) return;
    try {
      setCalendar(await backend.calendars.rename(calendar, name));
    } catch (e) {
      setError(e.message);
    }
  };

  const addHolidays = async () => {
    const existing = new Set(events.map((e) => `${e.date}|${e.title}`));
    const missing = nationalHolidays(calendar.course).filter((h) => !existing.has(`${h.date}|${h.title}`));
    if (!missing.length) return setNotice('Los festivos nacionales ya están en el calendario.');
    try {
      await backend.calendars.addEvents(calendar, missing);
      setNotice(`Añadidos ${missing.length} festivos nacionales. Añade los de tu comunidad, tu localidad y las vacaciones escolares.`);
    } catch (e) {
      setError(e.message);
    }
  };

  const save = async (event) => {
    if (modal?.id) await backend.calendars.updateEvent(calendar, modal.id, event);
    else await backend.calendars.addEvent(calendar, event);
    setModal(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link to="/profesor" className="btn-ghost btn-sm" aria-label="Volver a mis salas">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Calendario de clase · Curso {calendar.course}</p>
          <h1 className="flex items-center gap-2 truncate text-2xl font-extrabold sm:text-3xl">
            {calendar.name}
            {isOwner && (
              <button type="button" className="btn-ghost btn-sm" onClick={rename} aria-label="Cambiar el nombre del calendario">
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            {!isOwner && <>Colaboras en el calendario de {calendar.owner_name || 'otro profesor'} · </>}
            Se borrará automáticamente el {formatDay(calendar.expire_at)}, al acabar el curso.
          </p>
        </div>
        {!isOwner && (
          <button type="button" className="btn-ghost" onClick={leave}>
            <LogOut className="h-4 w-4" aria-hidden="true" /> Dejar de colaborar
          </button>
        )}
        <button type="button" className="btn-secondary" onClick={addHolidays}>
          <Flag className="h-4 w-4" aria-hidden="true" /> Añadir festivos nacionales
        </button>
        <button type="button" className="btn-primary" onClick={() => setModal({ date: todayIso() })}>
          <CalendarPlus className="h-4 w-4" aria-hidden="true" /> Nueva fecha
        </button>
      </div>

      <div className={`mb-6 grid gap-6 ${isOwner ? 'lg:grid-cols-[1fr_22rem]' : ''}`}>
        <CalendarShare calendar={calendar} />
        {isOwner && <CalendarCollaborators calendar={calendar} onChange={setCalendar} />}
      </div>
      {notice && (
        <p role="status" className="mb-4 rounded-xl bg-accent-100 px-4 py-3 text-sm text-accent-900 dark:bg-accent-300/15 dark:text-accent-200">{notice}</p>
      )}
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <CalendarBoard calendar={calendar} events={events} editable onAddDay={(date) => setModal({ date })} onEditEvent={(ev) => setModal(ev)} />

      {modal && (
        <EventModal
          initial={modal}
          onClose={() => setModal(null)}
          onSave={save}
          onDelete={async () => {
            await backend.calendars.removeEvent(calendar, modal.id);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}
