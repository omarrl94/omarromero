import type { Arquetipo, ArquetipoId, ArquetipoMatch, DimensionScores } from '../types';
import { DIMENSIONES } from '../lib/scoring';

/**
 * Arquetipos vocacionales.
 *
 * Son una lectura en lenguaje humano del mismo vector de dimensiones que ya
 * calcula el test: no anaden una medida nueva, la traducen. Sirven para que el
 * resultado se pueda contar en una frase ("eres un Maestro de Engranajes") en
 * lugar de con ocho barras, que es lo que un estudiante recuerda y comparte.
 */
export const ARQUETIPOS: Arquetipo[] = [
  {
    id: 'creadorDigital',
    nombre: 'El Creador Digital',
    lema: 'Lo que imaginas, lo construyes',
    descripcion:
      'Se te da bien pasar de la idea a la cosa terminada: un programa que funciona, un vídeo que engancha, un diseño que se entiende a la primera. Mezclas cabeza analítica y ojo estético, y esa combinación es exactamente lo que buscan los sectores digitales.',
    icono: 'Palette',
    colorClass: 'bg-arquetipo-creador',
    perfil: { analitico: 4, creativo: 5, asistencial: 0, tecnico: 3, organizativo: 2, social: 1, cientifico: 1, fisico: 0 },
    familias: ['informatica', 'imagen', 'textil'],
  },
  {
    id: 'guardianAsistencial',
    nombre: 'El Guardián Asistencial',
    lema: 'Estar cuando de verdad hace falta',
    descripcion:
      'Tienes el instinto de acercarte cuando alguien lo está pasando mal, y además el estómago para hacerlo bien bajo presión. Es una combinación menos común de lo que parece, y sostiene la sanidad y los servicios sociales de este país.',
    icono: 'HeartPulse',
    colorClass: 'bg-arquetipo-guardian',
    perfil: { analitico: 1, creativo: 1, asistencial: 5, tecnico: 1, organizativo: 2, social: 4, cientifico: 4, fisico: 2 },
    familias: ['sanidad', 'sociocultural'],
  },
  {
    id: 'maestroEngranajes',
    nombre: 'El Maestro de Engranajes',
    lema: 'Si tiene piezas, lo entiendes',
    descripcion:
      'No te fías de una explicación hasta que abres la tapa y lo ves por dentro. Diagnosticas por descarte, arreglas con las manos y disfrutas cuando algo vuelve a funcionar. La industria española lleva años buscando gente así y no la encuentra.',
    icono: 'Cog',
    colorClass: 'bg-arquetipo-engranajes',
    perfil: { analitico: 3, creativo: 1, asistencial: 0, tecnico: 5, organizativo: 2, social: 0, cientifico: 3, fisico: 4 },
    familias: ['electricidad', 'mecanica', 'automocion', 'instalacion', 'quimica'],
  },
  {
    id: 'estrategaOrganizador',
    nombre: 'El Estratega Organizador',
    lema: 'Que todo cuadre y llegue a tiempo',
    descripcion:
      'Ves el desorden antes que nadie y no descansas hasta ponerle estructura. Manejas números, plazos y personas a la vez, que es justo lo que separa a quien ejecuta de quien coordina. Por eso este perfil asciende rápido.',
    icono: 'ClipboardList',
    colorClass: 'bg-arquetipo-estratega',
    perfil: { analitico: 3, creativo: 1, asistencial: 1, tecnico: 1, organizativo: 5, social: 4, cientifico: 1, fisico: 0 },
    familias: ['administracion', 'comercio', 'hosteleria'],
  },
  {
    id: 'exploradorCampo',
    nombre: 'El Explorador de Campo',
    lema: 'Tu oficina no tiene techo',
    descripcion:
      'Ocho horas sentado te destrozan, y lo sabes. Necesitas movimiento, gente y aire, y rindes cuando el día no se parece al anterior. Hay sectores enteros —deporte, medio natural, emergencias— construidos alrededor de perfiles como el tuyo.',
    icono: 'Dumbbell',
    colorClass: 'bg-arquetipo-explorador',
    perfil: { analitico: 1, creativo: 2, asistencial: 3, tecnico: 1, organizativo: 2, social: 4, cientifico: 2, fisico: 5 },
    familias: ['deportes', 'hosteleria'],
  },
];

export const ARQUETIPOS_POR_ID: Record<ArquetipoId, Arquetipo> = ARQUETIPOS.reduce(
  (acc, arquetipo) => {
    acc[arquetipo.id] = arquetipo;
    return acc;
  },
  {} as Record<ArquetipoId, Arquetipo>,
);

/** Similitud del coseno, la misma medida que usa la afinidad de familia. */
function similitud(a: DimensionScores, b: DimensionScores): number {
  const magA = Math.sqrt(DIMENSIONES.reduce((acc, d) => acc + a[d] * a[d], 0));
  const magB = Math.sqrt(DIMENSIONES.reduce((acc, d) => acc + b[d] * b[d], 0));
  if (magA === 0 || magB === 0) return 0;
  return DIMENSIONES.reduce((acc, d) => acc + a[d] * b[d], 0) / (magA * magB);
}

/**
 * Asigna el arquetipo mas proximo al perfil del estudiante.
 *
 * Se reescala igual que la afinidad de familia (suelo 0,4, techo 97) para que
 * el porcentaje se lea con el mismo criterio en toda la aplicacion.
 */
export function asignarArquetipo(dimensiones: DimensionScores): ArquetipoMatch {
  const ordenados = ARQUETIPOS.map((arquetipo) => {
    const coseno = similitud(dimensiones, arquetipo.perfil);
    const ajuste = Math.round(Math.max(0, Math.min(1, (coseno - 0.4) / 0.6)) * 97);
    return { arquetipo, ajuste };
  }).sort((a, b) => b.ajuste - a.ajuste);

  // Siempre hay cinco arquetipos, pero el fallback evita un `!` en el tipo.
  return ordenados[0] ?? { arquetipo: ARQUETIPOS[0]!, ajuste: 0 };
}
