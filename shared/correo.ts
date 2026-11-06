import type { Ciclo, ModalidadId } from '../config/ffe.config';
import { config, modalidadPorId, perfilPorId } from '../config/ffe.config';

export interface DatosAlumno {
  nombre: string;
  ciclo: Ciclo;
  perfiles: string[];
  modalidad: ModalidadId;
  github?: string;
  portfolio?: string;
  linkedin?: string;
  telefono?: string;
}

export interface EmpresaCorreo {
  nombre: string;
  sector: string;
  motivoEncaje: string;
  perfiles: string[];
  contacto: { tipo: 'email' | 'formulario'; email?: string; tipoContacto: string };
  programaPracticas?: { titulo: string };
}

export interface Borrador {
  para: string;
  cc: string;
  asunto: string;
  cuerpo: string;
}

export const NOMBRE_CICLO: Record<Ciclo, string> = {
  DAM: 'Desarrollo de Aplicaciones Multiplataforma (DAM)',
  ASIR: 'Administración de Sistemas Informáticos en Red (ASIR)',
};

export function fechaLarga(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${d} de ${meses[m - 1]} de ${a}`;
}

export function listaNatural(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`;
}

function saludo(tipoContacto: string): string {
  switch (tipoContacto) {
    case 'rrhh':
      return 'Estimado equipo de Recursos Humanos:';
    case 'talento':
      return 'Estimado equipo de Talento:';
    case 'practicas':
      return 'Estimado equipo de prácticas:';
    default:
      return 'Buenos días:';
  }
}

/** Genera el borrador de correo. Es un punto de partida: el alumno lo revisa y edita siempre. */
export function generarBorrador(empresa: EmpresaCorreo, alumno: DatosAlumno): Borrador {
  const modalidad = modalidadPorId(alumno.modalidad);
  const horas = config.horas[alumno.ciclo];
  const tutor = config.tutores[alumno.ciclo];
  const perfilesAlumno = alumno.perfiles.map((p) => perfilPorId(p)?.nombre.toLowerCase()).filter(Boolean) as string[];
  const comunes = alumno.perfiles.filter((p) => empresa.perfiles.includes(p)).map((p) => perfilPorId(p)?.nombre.toLowerCase()).filter(Boolean) as string[];
  const intereses = comunes.length ? comunes : perfilesAlumno;

  const asunto = empresa.programaPracticas
    ? `Candidatura a ${empresa.programaPracticas.titulo} · Alumno/a de 2.º ${alumno.ciclo}`
    : `Candidatura espontánea para Formación en Empresa (FFE) · 2.º ${alumno.ciclo}`;

  const enlaces = [
    alumno.github && `GitHub: ${alumno.github}`,
    alumno.portfolio && `Portfolio: ${alumno.portfolio}`,
    alumno.linkedin && `LinkedIn: ${alumno.linkedin}`,
  ].filter(Boolean) as string[];

  const lineas = [
    saludo(empresa.contacto.tipoContacto),
    '',
    `Me llamo ${alumno.nombre || '[tu nombre]'} y estoy cursando 2.º de ${NOMBRE_CICLO[alumno.ciclo]} en el ${config.centro.nombre} (${config.centro.ciudad}).`,
    '',
    empresa.programaPracticas
      ? `He visto que ${empresa.nombre} ofrece «${empresa.programaPracticas.titulo}» y me gustaría presentar mi candidatura para realizar allí mi periodo de Formación en Empresa (FFE).`
      : `Me pongo en contacto con ${empresa.nombre} para preguntar si sería posible realizar con ustedes mi periodo de Formación en Empresa (FFE), la formación práctica obligatoria del ciclo.`,
    '',
    `Me interesa especialmente su actividad en ${empresa.sector.toLowerCase()}${intereses.length ? ` y me encantaría aprender en áreas como ${listaNatural(intereses)}` : ''}. [Añade aquí en una o dos frases por qué te interesa esta empresa en concreto.]`,
    '',
    'Datos del periodo de formación:',
    `· Fechas: del ${fechaLarga(modalidad.inicio)} al ${fechaLarga(modalidad.fin)} (${modalidad.nombre}).`,
    `· Horario: ${modalidad.horasDia} horas al día, ${horas} horas en total.`,
    '· Es una formación sin coste para la empresa, con convenio con el centro y seguimiento de un tutor o tutora.',
    '',
    ...(enlaces.length ? ['Pueden ver algunos de mis proyectos aquí:', ...enlaces.map((e) => `· ${e}`), ''] : []),
    'Adjunto mi currículum en PDF. Quedo a su disposición para una entrevista o para ampliar cualquier información.',
    '',
    ...(tutor ? [`Pongo en copia a mi tutor/a de FFE, ${tutor.nombre}, por si necesitan información sobre el convenio.`, ''] : []),
    'Un saludo,',
    '',
    alumno.nombre || '[tu nombre]',
    `2.º ${alumno.ciclo} · ${config.centro.nombre}`,
    ...(alumno.telefono ? [`Tel.: ${alumno.telefono}`] : []),
  ];

  return {
    para: empresa.contacto.tipo === 'email' ? empresa.contacto.email ?? '' : '',
    cc: tutor?.email ?? '',
    asunto,
    cuerpo: lineas.join('\n'),
  };
}

const enc = encodeURIComponent;

export function urlOutlook(b: Borrador): string {
  const p = [`to=${enc(b.para)}`, b.cc && `cc=${enc(b.cc)}`, `subject=${enc(b.asunto)}`, `body=${enc(b.cuerpo)}`].filter(Boolean);
  return `https://outlook.office.com/mail/deeplink/compose?${p.join('&')}`;
}

export function urlGmail(b: Borrador): string {
  const p = ['view=cm', 'fs=1', `to=${enc(b.para)}`, b.cc && `cc=${enc(b.cc)}`, `su=${enc(b.asunto)}`, `body=${enc(b.cuerpo)}`].filter(Boolean);
  return `https://mail.google.com/mail/?${p.join('&')}`;
}

export function urlMailto(b: Borrador): string {
  const p = [b.cc && `cc=${enc(b.cc)}`, `subject=${enc(b.asunto)}`, `body=${enc(b.cuerpo)}`].filter(Boolean);
  return `mailto:${enc(b.para).replace(/%40/g, '@')}?${p.join('&')}`;
}

export function textoParaCopiar(b: Borrador): string {
  const cabecera = [b.para && `Para: ${b.para}`, b.cc && `CC: ${b.cc}`, `Asunto: ${b.asunto}`].filter(Boolean);
  return `${cabecera.join('\n')}\n\n${b.cuerpo}`;
}
