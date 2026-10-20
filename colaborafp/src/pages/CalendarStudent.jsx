import { CalendarX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
  useDocumentTitle(calendar ? `Calendario · ${calendar.name}` : 'Calendario de clase');

  useEffect(() => {
    let alive = true;
    backend.calendars.getByCode(code).then((c) => alive && setCalendar(c));
    return () => {
      alive = false;
    };
  }, [code]);

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
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      <CalendarBoard calendar={calendar} events={events} />
    </div>
  );
}
