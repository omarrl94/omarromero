import { CalendarX, PencilLine, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import CalendarBoard from '../components/CalendarBoard';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { backend } from '../services/backend';
import { normalizePin } from '../utils/ids';

/** Vista del alumnado: el calendario de su clase, en tiempo real y sin cuenta. */
export default function CalendarStudent() {
  const code = normalizePin(useParams().code);
  const [calendar, setCalendar] = useState(undefined);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  // Profesorado: ¿ya gestiona este calendario (dueño o colaborador)?
  const [canEdit, setCanEdit] = useState(null);
  const [joining, setJoining] = useState(false);
  useDocumentTitle(calendar ? `Calendario · ${calendar.name}` : 'Calendario de clase');

  useEffect(() => {
    let alive = true;
    backend.calendars.getByCode(code).then((c) => alive && setCalendar(c));
    return () => {
      alive = false;
    };
  }, [code]);

  useEffect(() => {
    if (!calendar || !user) return;
    backend.calendars.getById(calendar.id).then((c) => setCanEdit(!!c)).catch(() => setCanEdit(false));
  }, [calendar, user]);

  const join = async () => {
    setJoining(true);
    setError(null);
    try {
      await backend.calendars.join(calendar.id);
      navigate(`/profesor/calendario/${calendar.id}`);
    } catch (e) {
      setError(e.message);
      setJoining(false);
    }
  };

  useEffect(() => {
    if (!calendar) return undefined;
    return backend.calendars.subscribeEvents(calendar.id, setEvents, (e) => setError(e.message));
  }, [calendar?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (calendar === undefined) return <Spinner fullPage label="Abriendo el calendario…" />;
  if (!calendar)
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState icon={CalendarX} title="Calendario no encontrado">
          Revisa el código o pídeselo a tu profesor. Los calendarios se borran al acabar el curso.{' '}
          <Link to="/" className="font-semibold text-brand-700 underline dark:text-brand-300">Volver al inicio</Link>
        </EmptyState>
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <p className="eyebrow">Calendario de clase · Curso {calendar.course}</p>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{calendar.name}</h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">Exámenes, entregas y fechas importantes que publica tu profesor. Se actualiza solo.</p>
      </div>
      {user && canEdit !== null && (
        <div className="card mb-6 flex flex-wrap items-center gap-3 border-brand-200 p-4 dark:border-brand-400/30">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800 dark:bg-brand-400/15 dark:text-brand-300">
            {canEdit ? <PencilLine className="h-5 w-5" aria-hidden="true" /> : <Users className="h-5 w-5" aria-hidden="true" />}
          </span>
          <p className="min-w-0 flex-1 text-sm">
            {canEdit ? (
              <>Gestionas este calendario. Ábrelo en modo profesor para añadir o cambiar fechas.</>
            ) : (
              <>
                <strong>Eres profesor/a.</strong> Puedes colaborar en este calendario y añadir tus exámenes, entregas y avisos para este grupo.
              </>
            )}
          </p>
          {canEdit ? (
            <Link to={`/profesor/calendario/${calendar.id}`} className="btn-primary btn-sm">Abrir en modo profesor</Link>
          ) : (
            <button type="button" className="btn-primary btn-sm" onClick={join} disabled={joining}>
              <Users className="h-4 w-4" aria-hidden="true" />
              {joining ? 'Uniéndome…' : 'Colaborar como profesor'}
            </button>
          )}
        </div>
      )}
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      <CalendarBoard calendar={calendar} events={events} />
    </div>
  );
}
