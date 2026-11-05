const fmtFecha = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtFechaHora = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const fecha = (iso: string) => fmtFecha.format(new Date(iso.length === 10 ? `${iso}T12:00:00` : iso));
export const fechaHora = (iso: string) => fmtFechaHora.format(new Date(iso));

export function haceDias(iso: string, ahora = new Date()): string {
  const dias = Math.floor((ahora.getTime() - new Date(iso).getTime()) / 864e5);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  return `hace ${dias} días`;
}

export const NOMBRE_TAMANO: Record<string, string> = {
  pyme: 'Pyme',
  consultora: 'Consultora',
  startup: 'Startup',
  'gran-empresa': 'Gran empresa',
};

export const NOMBRE_TIPO_CONTACTO: Record<string, string> = {
  rrhh: 'RR. HH.',
  talento: 'Talento',
  practicas: 'Prácticas',
  general: 'General',
};

export const NOMBRE_TIPO_OFERTA: Record<string, string> = {
  practicas: 'Prácticas',
  beca: 'Beca',
  junior: 'Junior',
  'primer-empleo': 'Primer empleo',
};

export const NOMBRE_JORNADA: Record<string, string> = {
  completa: 'Jornada completa',
  parcial: 'Jornada parcial',
  desconocida: 'Jornada no indicada',
};

/** Normaliza un enlace introducido por el alumno: añade https:// si falta. */
export function enlaceUsuario(v: string): string {
  const t = v.trim();
  if (!t) return '';
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

export const NOMBRE_FUENTE: Record<string, string> = {
  adzuna: 'Adzuna',
  infojobs: 'InfoJobs',
  greenhouse: 'Web de empleo de la empresa (Greenhouse)',
  lever: 'Web de empleo de la empresa (Lever)',
  ashby: 'Web de empleo de la empresa (Ashby)',
};
