import type { Grado } from '../types';

/** Bloque de contenido de la guía "¿Por qué estudiar FP?". */
export interface BloqueGuia {
  id: string;
  icono: string;
  titulo: string;
  texto: string;
}

/** Mito frecuente sobre la FP y la realidad que lo desmonta. */
export interface Mito {
  mito: string;
  realidad: string;
}

/** Ficha resumen de un grado, para la sección "antes de elegir". */
export interface FichaGrado {
  grado: Grado;
  titulo: string;
  paraQuien: string;
  queConsigues: string;
  duracion: string;
  yDespues: string[];
}

export const POR_QUE_FP: BloqueGuia[] = [
  {
    id: 'practica',
    icono: 'Hammer',
    titulo: 'Se aprende haciendo, desde el primer día',
    texto:
      'En FP no te pasas dos años esperando a "la parte práctica": el taller, el aula-clínica o el laboratorio son la clase. Sales sabiendo usar las herramientas reales del sector, no solo hablar de ellas.',
  },
  {
    id: 'empleo',
    icono: 'Briefcase',
    titulo: 'Las empresas buscan estos perfiles y no los encuentran',
    texto:
      'Hay ciclos en los que las ofertas superan a las personas tituladas: electricidad, mecanizado, informática, sanidad o dependencia. Salir con un título de FP en esos sectores casi siempre significa salir con opciones.',
  },
  {
    id: 'dual',
    icono: 'Handshake',
    titulo: 'La FP Dual te mete en la empresa mientras estudias',
    texto:
      'En la modalidad dual buena parte del ciclo se hace dentro de una empresa, con un tutor asignado y, en muchos casos, cobrando. Terminas con experiencia real en el currículum y, muy a menudo, con una oferta encima de la mesa.',
  },
  {
    id: 'especializacion',
    icono: 'Award',
    titulo: 'Existen los "másteres de la FP"',
    texto:
      'Los cursos de especialización son formaciones cortas después de un ciclo: ciberseguridad, inteligencia artificial y big data, digitalización industrial, panadería artesanal... Sirven para ser la persona que más sabe de algo muy concreto, que es justo lo que se paga.',
  },
  {
    id: 'puertas',
    icono: 'DoorOpen',
    titulo: 'Ningún camino se cierra',
    texto:
      'Del Grado Medio pasas al Superior sin prueba de acceso. Del Superior entras a la universidad sin selectividad y con créditos ya convalidados. La FP no es un desvío: es otra carretera, y tiene enlaces.',
  },
  {
    id: 'prestigio',
    icono: 'TrendingUp',
    titulo: 'La foto ha cambiado, aunque el prejuicio tarde',
    texto:
      'La idea de que la FP es "para quien no vale" viene de hace treinta años. Hoy hay ingenieros que vuelven a hacer un ciclo por la parte práctica, y titulados de Grado Superior con condiciones de entrada que ya querrían muchos graduados.',
  },
];

export const MITOS: Mito[] = [
  {
    mito: '"La FP es para quien no vale para estudiar"',
    realidad:
      'Es para quien aprende mejor haciendo. Un ciclo de Grado Superior exige tanto como un curso de universidad; lo que cambia es el método, no el nivel.',
  },
  {
    mito: '"Con FP se cobra poco"',
    realidad:
      'Depende del sector, igual que en cualquier carrera. Un técnico superior en automatización, mecanizado o sistemas entra en la industria con sueldos que muchos titulados universitarios tardan años en alcanzar.',
  },
  {
    mito: '"Si hago FP ya no puedo ir a la universidad"',
    realidad:
      'Con un Grado Superior accedes a la universidad sin selectividad, y muchas titulaciones te convalidan créditos ECTS. Empiezas la carrera con parte del camino hecho.',
  },
  {
    mito: '"Si me equivoco de familia, he perdido dos años"',
    realidad:
      'Los módulos comunes convalidan entre ciclos y muchas competencias son transversales. Cambiar de rama cuesta menos de lo que parece, y siempre menos que quedarse donde no encajas.',
  },
];

export const FICHAS_GRADO: FichaGrado[] = [
  {
    grado: 'basico',
    titulo: 'Grado Básico',
    paraQuien:
      'Tienes entre 15 y 17 años, la ESO se te está atragantando y aprendes mucho mejor con las manos que con un libro delante.',
    queConsigues:
      'Un Título Profesional Básico con un oficio real, y además el título de ESO al terminar el ciclo.',
    duracion: '2 cursos · 2.000 horas',
    yDespues: [
      'Acceso directo a un Grado Medio',
      'Empleo como ayudante o auxiliar del oficio',
      'Título de ESO para lo que quieras hacer después',
    ],
  },
  {
    grado: 'medio',
    titulo: 'Grado Medio',
    paraQuien:
      'Tienes la ESO (o la prueba de acceso) y quieres formarte como técnico o técnica en un sector concreto sin dar diez vueltas.',
    queConsigues:
      'El título de Técnico/a: una cualificación profesional reconocida, con prácticas en empresa incluidas.',
    duracion: '2 cursos · 2.000 horas',
    yDespues: [
      'Paso directo a Grado Superior, sin prueba de acceso',
      'Empleo cualificado en el sector desde el primer día',
      'En varios ciclos, carné profesional o habilitación para trabajar por tu cuenta',
    ],
  },
  {
    grado: 'superior',
    titulo: 'Grado Superior',
    paraQuien:
      'Vienes de Bachillerato o de un Grado Medio y quieres especializarte de verdad, con capacidad de organizar el trabajo de otras personas.',
    queConsigues:
      'El título de Técnico/a Superior: alta especialización, más responsabilidad y mejores condiciones de entrada.',
    duracion: '2 cursos · 2.000 horas',
    yDespues: [
      'Universidad sin selectividad, con convalidación de créditos ECTS',
      'Cursos de especialización, los "másteres de la FP"',
      'Puestos de mando intermedio, coordinación y gestión de equipos',
    ],
  },
];

/** Datos que se muestran como prueba social en la portada. */
export const DATOS_CLAVE: { valor: string; etiqueta: string }[] = [
  { valor: '26', etiqueta: 'familias profesionales en el sistema español' },
  { valor: '3', etiqueta: 'grados: Básico, Medio y Superior' },
  { valor: '2.000 h', etiqueta: 'de formación por ciclo, prácticas incluidas' },
  { valor: '0', etiqueta: 'euros de matrícula en la FP pública' },
];
