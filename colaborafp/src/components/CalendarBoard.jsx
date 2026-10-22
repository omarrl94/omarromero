import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Clock, Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  courseMonths,
  downloadIcs,
  EVENT_TYPE_IDS,
  EVENT_TYPES,
  eventEnd,
  eventOn,
  formatEventDate,
  isoDate,
  MONTHS,
  todayIso,
  WEEKDAYS,
  WEEKDAYS_LONG,
} from '../utils/calendar';

/** Casillas de un mes empezando en lunes (null = hueco). */
const monthCells = (month) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= days; d++) cells.push(isoDate(new Date(month.getFullYear(), month.getMonth(), d)));
  while (cells.length % 7) cells.push(null);
  return cells;
};

function EventItem({ ev, onClick }) {
  const t = EVENT_TYPES[ev.type];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick ? () => onClick(ev) : undefined}
      className={`flex w-full gap-3 rounded-xl border border-stone-200 p-3 text-left dark:border-ink-700 ${onClick ? 'transition hover:border-brand-400' : ''}`}
    >
      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${t.dot}`} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-ink-950 dark:text-white">{ev.title}</span>
          <span className={`chip ${t.chip}`}>{t.label}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400">
          {ev.time && <Clock className="h-3 w-3" aria-hidden="true" />}
          {formatEventDate(ev)}
        </span>
        {ev.description && <span className="mt-1 block whitespace-pre-line text-sm text-stone-700 dark:text-stone-300">{ev.description}</span>}
        {onClick && ev.created_by_name && <span className="mt-1 block text-xs text-stone-600 dark:text-stone-400">Añadido por {ev.created_by_name}</span>}
      </span>
    </Tag>
  );
}

/**
 * Calendario escolar (septiembre → julio) con eventos.
 * editable: el profesor pulsa un día para añadir y un evento para editarlo.
 */
export default function CalendarBoard({ calendar, events, editable = false, onAddDay, onEditEvent }) {
  const months = useMemo(() => courseMonths(calendar.course), [calendar.course]);
  const today = todayIso();
  const [index, setIndex] = useState(() => {
    const now = new Date();
    const i = months.findIndex((m) => m.getFullYear() === now.getFullYear() && m.getMonth() === now.getMonth());
    return i >= 0 ? i : 0;
  });
  const [selected, setSelected] = useState(today);
  const [hidden, setHidden] = useState(() => new Set());

  const visible = events.filter((e) => !hidden.has(e.type));
  const month = months[index];
  const cells = monthCells(month);
  const upcoming = visible.filter((e) => eventEnd(e) >= today).slice(0, 8);
  const dayEvents = selected ? visible.filter((e) => eventOn(e, selected)) : [];

  const toggleType = (t) =>
    setHidden((h) => {
      const n = new Set(h);
      n.has(t) ? n.delete(t) : n.add(t);
      return n;
    });

  const pickDay = (iso) => setSelected(iso);

  const selectedLabel = (() => {
    if (!selected) return '';
    const d = new Date(`${selected}T12:00:00`);
    const text = `${WEEKDAYS_LONG[(d.getDay() + 6) % 7]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
    return text[0].toUpperCase() + text.slice(1);
  })();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <section className="card p-4 sm:p-5" aria-labelledby="cal-month">
        <div className="mb-4 flex items-center gap-2">
          <button type="button" className="btn-ghost btn-sm" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} aria-label="Mes anterior">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 id="cal-month" className="flex-1 text-center text-lg font-bold" aria-live="polite">
            {MONTHS[month.getMonth()][0].toUpperCase() + MONTHS[month.getMonth()].slice(1)} {month.getFullYear()}
          </h2>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setIndex((i) => Math.min(months.length - 1, i + 1))} disabled={index === months.length - 1} aria-label="Mes siguiente">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-stone-600 dark:text-stone-400" aria-hidden="true">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((iso, i) => {
            if (!iso) return <div key={`e${i}`} aria-hidden="true" />;
            const evs = visible.filter((e) => eventOn(e, iso));
            const weekend = i % 7 >= 5;
            const holiday = evs.some((e) => e.type === 'festivo');
            const isToday = iso === today;
            const isSel = iso === selected;
            const day = Number(iso.slice(8));
            return (
              <button
                key={iso}
                type="button"
                onClick={() => pickDay(iso)}
                aria-pressed={isSel}
                className={`flex min-h-[3.25rem] flex-col items-stretch rounded-lg border p-1 text-left transition sm:min-h-[5.5rem] sm:p-1.5 ${
                  isSel ? 'border-brand-500 ring-2 ring-brand-400/30' : 'border-stone-200 hover:border-brand-300 dark:border-ink-700'
                } ${holiday || weekend ? 'bg-stone-100 dark:bg-ink-850' : 'bg-white dark:bg-ink-900'}`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center self-start rounded-full text-xs font-bold ${
                    isToday ? 'bg-ink-950 text-white dark:bg-white dark:text-ink-950' : weekend || holiday ? 'text-stone-600 dark:text-stone-400' : 'text-ink-900 dark:text-stone-100'
                  }`}
                >
                  {day}
                </span>
                <span className="sr-only">
                  {` de ${MONTHS[month.getMonth()]}`}
                  {isToday && ', hoy'}
                  {evs.length ? `, ${evs.length} ${evs.length === 1 ? 'evento' : 'eventos'}` : ''}
                </span>
                {/* Escritorio: títulos; móvil: puntos */}
                <span className="mt-0.5 hidden space-y-0.5 sm:block">
                  {evs.slice(0, 2).map((e) => (
                    <span key={e.id} className={`block truncate rounded px-1 text-[11px] font-medium leading-4 ${EVENT_TYPES[e.type].chip}`}>
                      {e.title}
                    </span>
                  ))}
                  {evs.length > 2 && <span className="block text-[11px] text-stone-600 dark:text-stone-400">+{evs.length - 2} más</span>}
                </span>
                <span className="mt-auto flex flex-wrap gap-0.5 sm:hidden" aria-hidden="true">
                  {evs.slice(0, 4).map((e) => (
                    <span key={e.id} className={`h-1.5 w-1.5 rounded-full ${EVENT_TYPES[e.type].dot}`} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        <fieldset className="mt-4 flex flex-wrap gap-2">
          <legend className="sr-only">Mostrar tipos de evento</legend>
          {EVENT_TYPE_IDS.map((t) => (
            <label key={t} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${hidden.has(t) ? 'border-stone-200 text-stone-500 line-through dark:border-ink-700' : 'border-stone-300 dark:border-ink-600'}`}>
              <input type="checkbox" className="sr-only" checked={!hidden.has(t)} onChange={() => toggleType(t)} />
              <span className={`h-2 w-2 rounded-full ${EVENT_TYPES[t].dot}`} aria-hidden="true" />
              {EVENT_TYPES[t].label}
            </label>
          ))}
        </fieldset>
      </section>

      <div className="space-y-6">
        {selected && (
          <section className="card p-5" aria-labelledby="cal-day">
            <div className="mb-3 flex items-center gap-2">
              <h2 id="cal-day" className="flex-1 text-base font-bold">{selectedLabel}</h2>
              {editable && (
                <button type="button" className="btn-secondary btn-sm" onClick={() => onAddDay?.(selected)}>
                  <CalendarPlus className="h-4 w-4" aria-hidden="true" /> Añadir
                </button>
              )}
            </div>
            {dayEvents.length ? (
              <div className="space-y-2">{dayEvents.map((ev) => <EventItem key={ev.id} ev={ev} onClick={editable ? onEditEvent : undefined} />)}</div>
            ) : (
              <p className="text-sm text-stone-600 dark:text-stone-400">No hay nada este día.</p>
            )}
          </section>
        )}

        <section className="card p-5" aria-labelledby="cal-next">
          <h2 id="cal-next" className="mb-3 flex items-center gap-2 text-base font-bold">
            <CalendarDays className="h-4 w-4 text-brand-600 dark:text-brand-400" aria-hidden="true" /> Próximas fechas
          </h2>
          {upcoming.length ? (
            <div className="space-y-2">{upcoming.map((ev) => <EventItem key={ev.id} ev={ev} onClick={editable ? onEditEvent : undefined} />)}</div>
          ) : (
            <p className="text-sm text-stone-600 dark:text-stone-400">No hay fechas próximas.</p>
          )}
          {events.length > 0 && (
            <button type="button" className="btn-secondary mt-4 w-full" onClick={() => downloadIcs(calendar, events)}>
              <Download className="h-4 w-4" aria-hidden="true" /> Añadir a mi calendario (.ics)
            </button>
          )}
          {events.length > 0 && (
            <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">Se abre en Google Calendar, Outlook o el calendario del móvil.</p>
          )}
        </section>
      </div>
    </div>
  );
}
