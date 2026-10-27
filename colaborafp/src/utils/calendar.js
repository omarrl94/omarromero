/**
 * Calendario escolar: cursos (septiembre → junio), tipos de evento, festivos nacionales y .ics.
 */

export const EVENT_TYPES = {
  examen: { label: 'Examen', dot: 'bg-red-500', chip: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-200' },
  entrega: { label: 'Entrega de trabajo', dot: 'bg-brand-500', chip: 'bg-brand-100 text-brand-900 dark:bg-brand-400/15 dark:text-brand-200' },
  aviso: { label: 'Aviso o dato importante', dot: 'bg-sun-500', chip: 'bg-sun-100 text-sun-900 dark:bg-sun-400/15 dark:text-sun-200' },
  actividad: { label: 'Actividad o salida', dot: 'bg-accent-600', chip: 'bg-accent-100 text-accent-900 dark:bg-accent-300/15 dark:text-accent-200' },
  festivo: { label: 'Festivo o vacaciones', dot: 'bg-stone-400', chip: 'bg-stone-200 text-stone-800 dark:bg-ink-700 dark:text-stone-200' },
};
export const EVENT_TYPE_IDS = Object.keys(EVENT_TYPES);

export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
export const WEEKDAYS_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const pad = (n) => String(n).padStart(2, '0');
/** 'YYYY-MM-DD' en hora local. */
export const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseIso = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const todayIso = () => isoDate(new Date());
export const addDays = (iso, n) => {
  const d = parseIso(iso);
  d.setDate(d.getDate() + n);
  return isoDate(d);
};

// ---------- Cursos ----------
/** Año en que empieza el curso en vigor (a partir de agosto ya cuenta el siguiente). */
export const currentCourseStart = (now = new Date()) => (now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1);
export const courseLabel = (start) => `${start}-${start + 1}`;
export const courseStartOf = (label) => Number(String(label).slice(0, 4));
/** Cursos que se pueden crear: el actual y, desde mayo, también el siguiente. */
export const courseOptions = (now = new Date()) => {
  const start = currentCourseStart(now);
  const out = [start];
  if (now.getMonth() >= 4 && now.getMonth() < 7) out.push(start + 1);
  return out.map(courseLabel);
};
/** Primer y último mes visibles del curso: septiembre a julio. */
export const courseMonths = (label) => {
  const start = courseStartOf(label);
  return Array.from({ length: 11 }, (_, i) => new Date(start, 8 + i, 1));
};
/** El calendario y sus eventos se borran el 31 de julio al terminar el curso. */
export const courseExpiry = (label) => new Date(courseStartOf(label) + 1, 6, 31, 23, 59, 59).getTime();

// ---------- Festivos nacionales ----------
/** Domingo de Pascua (algoritmo de Meeus/Jones/Butcher). */
const easter = (y) => {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
};

/** Festivos nacionales de España que caen en el curso (septiembre → junio). */
export const nationalHolidays = (label) => {
  const s = courseStartOf(label), e = s + 1;
  const goodFriday = easter(e);
  goodFriday.setDate(goodFriday.getDate() - 2);
  return [
    [`${s}-10-12`, 'Fiesta Nacional de España'],
    [`${s}-11-01`, 'Todos los Santos'],
    [`${s}-12-06`, 'Día de la Constitución'],
    [`${s}-12-08`, 'Inmaculada Concepción'],
    [`${s}-12-25`, 'Navidad'],
    [`${e}-01-01`, 'Año Nuevo'],
    [`${e}-01-06`, 'Epifanía del Señor (Reyes)'],
    [isoDate(goodFriday), 'Viernes Santo'],
    [`${e}-05-01`, 'Día del Trabajo'],
  ].map(([date, title]) => ({ date, title, type: 'festivo', end_date: null, time: null, description: '' }));
};

// ---------- Eventos ----------
export const eventEnd = (ev) => ev.end_date || ev.date;
/** ¿El evento ocupa ese día? */
export const eventOn = (ev, iso) => ev.date <= iso && iso <= eventEnd(ev);
export const sortEvents = (list) =>
  [...list].sort((a, b) => a.date.localeCompare(b.date) || (a.time || '99').localeCompare(b.time || '99') || a.title.localeCompare(b.title));

export const formatEventDate = (ev) => {
  const fmt = (iso) => {
    const d = parseIso(iso);
    return `${WEEKDAYS_LONG[(d.getDay() + 6) % 7]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
  };
  const range = ev.end_date && ev.end_date !== ev.date ? `del ${fmt(ev.date)} al ${fmt(ev.end_date)}` : fmt(ev.date);
  return ev.time ? `${range} · ${ev.time} h` : range;
};

/** Valida un borrador de evento. Devuelve { event } o { error }. */
export const buildEvent = (draft) => {
  const title = String(draft.title || '').trim().slice(0, 120);
  if (!title) return { error: 'Escribe un título.' };
  if (!EVENT_TYPES[draft.type]) return { error: 'Elige el tipo.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date || '')) return { error: 'Elige la fecha.' };
  const end = draft.end_date && draft.end_date !== draft.date ? draft.end_date : null;
  if (end && end < draft.date) return { error: 'La fecha de fin no puede ser anterior a la de inicio.' };
  const time = /^\d{2}:\d{2}$/.test(draft.time || '') && !end ? draft.time : null;
  return { event: { title, type: draft.type, date: draft.date, end_date: end, time, description: String(draft.description || '').trim().slice(0, 1000) } };
};

// ---------- Exportar a .ics (Google Calendar, Outlook, móvil) y suscripción ----------
const icsText = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/[,;]/g, (c) => `\\${c}`);
/** Parte líneas de más de 75 octetos (RFC 5545) sin romper caracteres UTF-8. */
const fold = (line) => {
  const out = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = new TextEncoder().encode(ch).length;
    if (bytes + b > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join('\r\n ');
};

// Hora peninsular española (CET/CEST): así Outlook coloca bien los eventos con hora
const VTIMEZONE = [
  'BEGIN:VTIMEZONE', 'TZID:Europe/Madrid', 'X-LIC-LOCATION:Europe/Madrid',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE',
];

export const toIcs = (calendar, events) => {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ColaboraFP//Calendario de clase//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsText(calendar.name)}`,
    `X-WR-CALDESC:${icsText(`Calendario de clase · Curso ${calendar.course || ''} · ColaboraFP`)}`,
    'X-WR-TIMEZONE:Europe/Madrid',
    // Pide a Outlook y a Google que vuelvan a consultar cada hora (cada programa decide al final)
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H', 'X-PUBLISHED-TTL:PT1H',
    ...VTIMEZONE,
  ];
  for (const ev of sortEvents(events)) {
    const d = ev.date.replace(/-/g, '');
    lines.push('BEGIN:VEVENT', `UID:${ev.id}@colaborafp`, `DTSTAMP:${stamp}`);
    if (ev.time) {
      const [h, m] = ev.time.split(':').map(Number);
      const endH = pad((h + 1) % 24);
      lines.push(`DTSTART;TZID=Europe/Madrid:${d}T${pad(h)}${pad(m)}00`, `DTEND;TZID=Europe/Madrid:${d}T${endH}${pad(m)}00`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${addDays(eventEnd(ev), 1).replace(/-/g, '')}`, 'X-MICROSOFT-CDO-ALLDAYEVENT:TRUE');
    }
    lines.push(`SUMMARY:${icsText(`${EVENT_TYPES[ev.type]?.label || ''}: ${ev.title}`)}`);
    if (ev.description) lines.push(`DESCRIPTION:${icsText(ev.description)}`);
    lines.push(`CATEGORIES:${icsText(EVENT_TYPES[ev.type]?.label || '')}`, 'TRANSP:TRANSPARENT', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
};

export const downloadIcs = (calendar, events) => {
  const blob = new Blob([toIcs(calendar, events)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `calendario-${String(calendar.name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

export const calendarJoinUrl = (code) => `${window.location.origin}/calendario/${code}`;

// ---------- Suscripción (se actualiza sola) ----------
/** Dirección https del calendario en formato iCalendar (para «Suscribirse desde la web»). */
export const calendarFeedUrl = (code, origin = window.location.origin) => `${origin}/ics/${code}.ics`;
/** Outlook del centro (Microsoft 365): abre directamente «Suscribirse desde la web». */
export const outlookSubscribeUrl = (code, name) =>
  `https://outlook.office.com/calendar/0/addfromweb?url=${encodeURIComponent(calendarFeedUrl(code))}&name=${encodeURIComponent(name)}`;
/** Outlook de escritorio, calendario del iPhone/Mac, etc. */
export const webcalUrl = (code) => calendarFeedUrl(code).replace(/^https?:/, 'webcal:');
/** Google Calendar. */
export const googleSubscribeUrl = (code) => `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcalUrl(code))}`;
