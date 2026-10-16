import { MAX_RETENTION_DAYS, RETENTION_DAYS } from './constants';

const DAY = 24 * 3600 * 1000;

/** Fin del día (23:59:59) de una fecha. */
export const endOfDay = (ms) => {
  const d = new Date(ms);
  d.setHours(23, 59, 59, 0);
  return d.getTime();
};

/** Próximo 30 de junio (fin de curso). */
const endOfCourse = (now) => {
  const d = new Date(now);
  let year = d.getFullYear();
  if (d.getMonth() > 5 || (d.getMonth() === 5 && d.getDate() >= 30)) year += 1;
  return endOfDay(new Date(year, 5, 30).getTime());
};

export const RETENTION_PRESETS = [
  { id: '7', label: '1 semana', at: (now) => endOfDay(now + 7 * DAY) },
  { id: '30', label: '1 mes', at: (now) => endOfDay(now + 30 * DAY) },
  { id: String(RETENTION_DAYS), label: `${RETENTION_DAYS} días (recomendado)`, at: (now) => endOfDay(now + RETENTION_DAYS * DAY) },
  { id: '90', label: '3 meses', at: (now) => endOfDay(now + 90 * DAY) },
  { id: 'curso', label: 'Fin de curso (30 de junio)', at: endOfCourse },
  { id: '365', label: '1 año (máximo)', at: () => maxExpiry() },
];

export const defaultExpiry = (now = Date.now()) => endOfDay(now + RETENTION_DAYS * DAY);
/** Límite superior con 1 h de margen respecto a la regla de Firestore. */
export const maxExpiry = (now = Date.now()) => now + MAX_RETENTION_DAYS * DAY - 3600 * 1000;
export const minExpiry = (now = Date.now()) => now + 3600 * 1000;

/** Ajusta una fecha de borrado a los límites permitidos. */
export const clampExpiry = (ms, now = Date.now()) => Math.min(Math.max(ms, minExpiry(now)), maxExpiry(now));

/** yyyy-mm-dd local para <input type="date">. */
export const toDateInput = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const fromDateInput = (value) => {
  const [y, m, d] = value.split('-').map(Number);
  return endOfDay(new Date(y, m - 1, d).getTime());
};
