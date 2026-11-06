import type { Ciclo } from '../config/ffe.config';
import { config } from '../config/ffe.config';
import { cierreIa, cortoCiclo, fechaLarga, NOMBRE_CICLO } from './correo';

export interface DatosTutor {
  nombre: string;
  email: string;
  telefono?: string;
  ciclo: Ciclo;
  /** Plazas o alumnos aproximados (opcional). */
  alumnos?: string;
}

export interface CorreoTutor {
  asunto: string;
  cuerpo: string;
}

/** Línea de baja: obligatoria en la sección de tutores. */
export const LINEA_BAJA = 'Si prefieres no recibir más comunicaciones del centro sobre la Formación en Empresa, responde a este correo con la palabra «BAJA» y no volveremos a escribirte.';

/** Saludo de los correos personalizados (también es la columna «saludo» del CSV). */
export const saludoEmpresa = (empresa: string) => `Hola, equipo de ${empresa}:`;

/**
 * Correo del tutor/a a empresas para pedir plazas de FFE.
 * Sin `empresa`: texto común para el envío en CCO. Con `empresa`: personalizado (envío uno a uno).
 */
export function generarCorreoTutor(t: DatosTutor, empresa?: { nombre: string; sector?: string }): CorreoTutor {
  const ciclo = t.ciclo;
  const textos = config.textosCorreoTutor;
  const bloque = textos.ciclos[ciclo];
  const horas = config.horas[ciclo];
  const nombre = t.nombre.trim() || '[tu nombre]';

  const lineas = [
    empresa ? saludoEmpresa(empresa.nombre) : 'Hola:',
    '',
    `Me llamo ${nombre} y soy tutor/a de Formación en Empresa (FFE) de 2.º de ${NOMBRE_CICLO[ciclo]} en el ${config.centro.nombre} (${config.centro.ciudad}).`,
    '',
    empresa
      ? `Me pongo en contacto con ${empresa.nombre}${empresa.sector ? `, por vuestra actividad en ${empresa.sector.toLowerCase()},` : ''} para preguntarte si podríais acoger a alumnado de nuestro ciclo durante su periodo de Formación en Empresa, la formación práctica obligatoria del ciclo.`
      : 'Me pongo en contacto contigo para preguntarte si podríais acoger a alumnado de nuestro ciclo durante su periodo de Formación en Empresa, la formación práctica obligatoria del ciclo.',
    ...(t.alumnos?.trim() ? ['', `Este curso buscamos plaza para ${t.alumnos.trim()} alumnos y alumnas.`] : []),
    '',
    bloque.titulo,
    '',
    bloque.intro,
    '',
    ...bloque.tareas.map((x) => `- ${x}`),
    '',
    textos.iaTitulo,
    '',
    `${textos.iaIntro} ${bloque.ia}`,
    '',
    cierreIa(bloque, textos.iaCierre),
    '',
    'Periodos de formación:',
    ...config.modalidades.map((m) => `- ${m.nombre}: del ${fechaLarga(m.inicio)} al ${fechaLarga(m.fin)}, ${m.horasDia} horas al día.`),
    `- Duración total: ${horas} horas.`,
    '',
    'Cómo funciona:',
    '- No tiene coste para la empresa y no supone relación laboral.',
    '- Se firma un convenio con el centro, y el alumnado está cubierto por el seguro escolar y la póliza del centro.',
    '- El centro asigna un tutor/a que hace el seguimiento junto con la persona de la empresa que acompañe al alumno.',
    '- El plan de actividades se adapta a vuestros proyectos.',
    '',
    textos.llamada,
    '',
    'También puedes responder a este correo indicando cuántas plazas podríais ofrecer y en qué áreas, y te enviaré los currículos del alumnado y la documentación del convenio.',
    '',
    'Muchas gracias por tu atención. Un saludo,',
    '',
    nombre,
    `Tutor/a de FFE · 2.º ${cortoCiclo(ciclo)} · ${config.centro.nombre}`,
    ...(t.email.trim() ? [t.email.trim()] : []),
    ...(t.telefono?.trim() ? [`Tel.: ${t.telefono.trim()}`] : []),
    '',
    '—',
    LINEA_BAJA,
  ];
  return {
    asunto: `Colaboración en la Formación en Empresa de 2.º ${cortoCiclo(ciclo)} · ${config.centro.nombre}`,
    cuerpo: lineas.join('\n'),
  };
}

/** Divide la lista en lotes de como máximo `tamano` elementos. */
export function enLotes<T>(lista: T[], tamano: number = config.tutores_envio.maxDestinatariosPorLote): T[][] {
  const n = Math.max(1, Math.floor(tamano));
  const salida: T[][] = [];
  for (let i = 0; i < lista.length; i += n) salida.push(lista.slice(i, i + n));
  return salida;
}

export interface BorradorCco {
  /** Normalmente el propio correo del tutor. */
  para: string;
  cco: string[];
  asunto: string;
  cuerpo: string;
}

const enc = encodeURIComponent;

export function urlOutlookCco(b: BorradorCco): string {
  const p = [`to=${enc(b.para)}`, `bcc=${enc(b.cco.join(';'))}`, `subject=${enc(b.asunto)}`, `body=${enc(b.cuerpo)}`];
  return `https://outlook.office.com/mail/deeplink/compose?${p.join('&')}`;
}

export function urlGmailCco(b: BorradorCco): string {
  const p = ['view=cm', 'fs=1', `to=${enc(b.para)}`, `bcc=${enc(b.cco.join(','))}`, `su=${enc(b.asunto)}`, `body=${enc(b.cuerpo)}`];
  return `https://mail.google.com/mail/?${p.join('&')}`;
}

export function urlMailtoCco(b: BorradorCco): string {
  return `mailto:${enc(b.para).replace(/%40/g, '@')}?bcc=${enc(b.cco.join(','))}&subject=${enc(b.asunto)}&body=${enc(b.cuerpo)}`;
}

/** CSV (separado por «;», con BOM para Excel) para combinar correspondencia en Outlook o Word. */
export function csvCombinacion(filas: { empresa: string; email: string; sector: string; zona: string; perfiles: string }[]): string {
  const celda = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const cabecera = ['empresa', 'email', 'sector', 'zona', 'perfiles', 'saludo'];
  const cuerpo = filas.map((f) => [f.empresa, f.email, f.sector, f.zona, f.perfiles, saludoEmpresa(f.empresa)].map(celda).join(';'));
  return '﻿' + [cabecera.join(';'), ...cuerpo].join('\r\n');
}
