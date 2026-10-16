const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

export const timeAgo = (timestamp, now = Date.now()) => {
  const diff = Math.round((timestamp - now) / 1000);
  const abs = Math.abs(diff);
  if (abs < 45) return 'ahora mismo';
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  return rtf.format(Math.round(diff / 86400), 'day');
};

export const formatDate = (timestamp) =>
  new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp);

export const authorLabel = (author) => (author === 'teacher' ? 'Profesor' : `Alumno: ${author}`);

/** Solo permitimos http(s) para evitar enlaces javascript: o data: en el muro. */
export const safeUrl = (raw) => {
  try {
    const url = new URL(String(raw).trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

export const roomJoinUrl = (pin) => `${window.location.origin}/sala/${pin}`;

/** Una sala está abierta si está activa y no ha llegado su hora de cierre automático. */
export const isRoomOpen = (room) => !!room && room.is_active !== false && (!room.closes_at || room.closes_at > Date.now());

export const formatTime = (timestamp) =>
  new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(timestamp);

export const formatDay = (timestamp) =>
  new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(timestamp);
