import type { Pregunta } from '../types';

/**
 * Cuestionario vocacional: 12 preguntas repartidas en cuatro bloques.
 *
 * Los bloques 1-3 puntuan `pesos` sobre las siete dimensiones vocacionales y
 * deciden la familia profesional. El bloque 4 puntua `metas` y solo influye en
 * que grado se sugiere como punto de entrada.
 *
 * Regla de redaccion: preguntas de la vida real, cero jerga academica.
 */
export const PREGUNTAS: Pregunta[] = [
  /* ---------- Bloque 1: entorno de trabajo ---------- */
  {
    id: 'q1',
    bloque: 'entorno',
    bloqueEtiqueta: 'Dónde quieres estar',
    enunciado: 'Imagina un martes cualquiera dentro de unos años. ¿Dónde te ves trabajando?',
    ayuda: 'No pienses en el sueldo. Piensa en el sitio físico donde estarías a gusto.',
    opciones: [
      {
        id: 'a',
        texto: 'Delante de una pantalla, con mis auriculares y mi café',
        icono: 'Monitor',
        pesos: { analitico: 3, tecnico: 1, organizativo: 1, creativo: 1 },
      },
      {
        id: 'b',
        texto: 'En un taller o una nave, con herramientas y máquinas',
        icono: 'Wrench',
        pesos: { tecnico: 3, analitico: 1 },
      },
      {
        id: 'c',
        texto: 'En un hospital, una clínica o un laboratorio',
        icono: 'Stethoscope',
        pesos: { cientifico: 3, asistencial: 2 },
      },
      {
        id: 'd',
        texto: 'Rodeado de gente: aula, tienda, sala, calle',
        icono: 'Users',
        pesos: { social: 3, asistencial: 1 },
      },
    ],
  },
  {
    id: 'q2',
    bloque: 'entorno',
    bloqueEtiqueta: 'Dónde quieres estar',
    enunciado: 'Te dejan elegir dónde hacer las prácticas. ¿Cuál pides?',
    opciones: [
      {
        id: 'a',
        texto: 'Una empresa que desarrolla software o gestiona redes',
        icono: 'Code2',
        pesos: { analitico: 3, tecnico: 1 },
      },
      {
        id: 'b',
        texto: 'Una fábrica con líneas de producción y robots',
        icono: 'Factory',
        pesos: { tecnico: 3, cientifico: 1 },
      },
      {
        id: 'c',
        texto: 'Una residencia, un cole o una asociación del barrio',
        icono: 'HeartHandshake',
        pesos: { asistencial: 3, social: 2 },
      },
      {
        id: 'd',
        texto: 'Una productora, un plató o un estudio de sonido',
        icono: 'Clapperboard',
        pesos: { creativo: 3, tecnico: 1 },
      },
      {
        id: 'e',
        texto: 'Una oficina o una gestoría con clientes y papeleo',
        icono: 'Building2',
        pesos: { organizativo: 3, social: 1 },
      },
      {
        id: 'f',
        texto: 'Un hospital, un laboratorio de análisis o una farmacia',
        icono: 'Microscope',
        pesos: { cientifico: 3, asistencial: 2 },
      },
    ],
  },
  {
    id: 'q3',
    bloque: 'entorno',
    bloqueEtiqueta: 'Dónde quieres estar',
    enunciado: '¿Qué relación quieres tener con el "estar quieto"?',
    opciones: [
      {
        id: 'a',
        texto: 'Mesa fija, mi sitio, mis cosas ordenadas',
        icono: 'ClipboardList',
        pesos: { organizativo: 2, analitico: 2 },
      },
      {
        id: 'b',
        texto: 'De pie casi todo el día, moviéndome por el taller o la cocina',
        icono: 'Hammer',
        pesos: { tecnico: 2, creativo: 2 },
      },
      {
        id: 'c',
        texto: 'Cambiando de sitio: domicilios, centros, visitas',
        icono: 'Map',
        pesos: { asistencial: 2, social: 2 },
      },
      {
        id: 'd',
        texto: 'Me da igual, mientras el día no sea siempre idéntico',
        icono: 'Shuffle',
        pesos: { social: 1, creativo: 1, tecnico: 1 },
      },
    ],
  },

  /* ---------- Bloque 2: estilo de pensamiento ---------- */
  {
    id: 'q4',
    bloque: 'pensamiento',
    bloqueEtiqueta: 'Cómo funciona tu cabeza',
    enunciado: 'El wifi de casa deja de ir. ¿Qué haces?',
    ayuda: 'Sé sincero, aquí no puntúa quedar bien.',
    opciones: [
      {
        id: 'a',
        texto: 'Me pongo a investigar hasta encontrar exactamente qué falla',
        icono: 'Search',
        pesos: { analitico: 3, tecnico: 1, cientifico: 1 },
      },
      {
        id: 'b',
        texto: 'Abro el router, miro cables y pruebo cosas con las manos',
        icono: 'Wrench',
        pesos: { tecnico: 3 },
      },
      {
        id: 'c',
        texto: 'Llamo a la compañía y me organizo para no perder la tarde',
        icono: 'Phone',
        pesos: { organizativo: 2, social: 2 },
      },
      {
        id: 'd',
        texto: 'Le pido ayuda a alguien y de paso charlamos un rato',
        icono: 'MessageCircle',
        pesos: { social: 3 },
      },
    ],
  },
  {
    id: 'q5',
    bloque: 'pensamiento',
    bloqueEtiqueta: 'Cómo funciona tu cabeza',
    enunciado: 'Tarde libre y ganas de hacer algo. ¿Qué te sale de forma natural?',
    opciones: [
      {
        id: 'a',
        texto: 'Montar, arreglar o construir algo físico',
        icono: 'Hammer',
        pesos: { tecnico: 3 },
      },
      {
        id: 'b',
        texto: 'Grabar, editar, diseñar, dibujar o hacer música',
        icono: 'Palette',
        pesos: { creativo: 3 },
      },
      {
        id: 'c',
        texto: 'Trastear con el ordenador o resolver un reto de lógica',
        icono: 'Puzzle',
        pesos: { analitico: 3 },
      },
      {
        id: 'd',
        texto: 'Quedar con gente y acabar organizando el plan yo',
        icono: 'CalendarDays',
        pesos: { social: 2, organizativo: 2 },
      },
      {
        id: 'e',
        texto: 'Ver documentales o leer sobre cómo funciona el cuerpo o la naturaleza',
        icono: 'Microscope',
        pesos: { cientifico: 3 },
      },
    ],
  },
  {
    id: 'q6',
    bloque: 'pensamiento',
    bloqueEtiqueta: 'Cómo funciona tu cabeza',
    enunciado: 'Alguien cercano te cuenta que lo está pasando mal. Tu primer impulso es...',
    opciones: [
      {
        id: 'a',
        texto: 'Escuchar y quedarme con esa persona el tiempo que haga falta',
        icono: 'Ear',
        pesos: { asistencial: 3, social: 1 },
      },
      {
        id: 'b',
        texto: 'Buscar una solución práctica y ponerme a ello',
        icono: 'ListChecks',
        pesos: { organizativo: 2, analitico: 2 },
      },
      {
        id: 'c',
        texto: 'Montar un plan para animarle y sacarle de casa',
        icono: 'Sparkles',
        pesos: { social: 2, creativo: 2 },
      },
      {
        id: 'd',
        texto: 'Entender bien qué le pasa antes de decir nada',
        icono: 'Brain',
        pesos: { analitico: 2, cientifico: 2, asistencial: 1 },
      },
    ],
  },
  {
    id: 'q7',
    bloque: 'pensamiento',
    bloqueEtiqueta: 'Cómo funciona tu cabeza',
    enunciado: 'Trabajo en grupo. ¿Qué papel acabas cogiendo sin darte cuenta?',
    opciones: [
      {
        id: 'a',
        texto: 'El que reparte tareas y vigila que lleguemos a tiempo',
        icono: 'ClipboardList',
        pesos: { organizativo: 3, social: 1 },
      },
      {
        id: 'b',
        texto: 'El que resuelve la parte difícil que nadie quiere',
        icono: 'Puzzle',
        pesos: { analitico: 3, cientifico: 1 },
      },
      {
        id: 'c',
        texto: 'El que le da forma bonita y lo presenta',
        icono: 'Palette',
        pesos: { creativo: 3 },
      },
      {
        id: 'd',
        texto: 'El que se asegura de que nadie se quede fuera',
        icono: 'HeartHandshake',
        pesos: { asistencial: 2, social: 2 },
      },
      {
        id: 'e',
        texto: 'El que hace la parte práctica y la deja terminada',
        icono: 'Hammer',
        pesos: { tecnico: 3 },
      },
    ],
  },

  /* ---------- Bloque 3: dinámica de trabajo ---------- */
  {
    id: 'q8',
    bloque: 'dinamica',
    bloqueEtiqueta: 'Cómo te gusta trabajar',
    enunciado: '¿Cuándo rindes de verdad?',
    opciones: [
      {
        id: 'a',
        texto: 'Solo, con mi tarea clara y sin que me interrumpan',
        icono: 'User',
        pesos: { analitico: 2, tecnico: 2 },
      },
      {
        id: 'b',
        texto: 'En equipo, hablando las cosas y repartiendo el trabajo',
        icono: 'Users',
        pesos: { social: 2, organizativo: 1, asistencial: 1 },
      },
      {
        id: 'c',
        texto: 'Depende del día: a veces necesito silencio y a veces gente',
        icono: 'Repeat',
        pesos: { creativo: 1, analitico: 1, social: 1 },
      },
    ],
  },
  {
    id: 'q9',
    bloque: 'dinamica',
    bloqueEtiqueta: 'Cómo te gusta trabajar',
    enunciado: 'Un imprevisto gordo a media jornada. ¿Cómo lo llevas?',
    opciones: [
      {
        id: 'a',
        texto: 'Bien: los días de adrenalina son los que más me gustan',
        icono: 'Zap',
        pesos: { asistencial: 2, social: 2, tecnico: 1 },
      },
      {
        id: 'b',
        texto: 'Lo asumo, pero prefiero un plan y unos pasos claros',
        icono: 'ListChecks',
        pesos: { organizativo: 3, analitico: 1 },
      },
      {
        id: 'c',
        texto: 'Me centro en el problema técnico y lo saco adelante',
        icono: 'Cog',
        pesos: { tecnico: 2, analitico: 2, cientifico: 1 },
      },
    ],
  },

  /* ---------- Bloque 4: metas a corto y medio plazo ---------- */
  {
    id: 'q10',
    bloque: 'metas',
    bloqueEtiqueta: 'A dónde quieres llegar',
    enunciado: '¿Para cuándo te gustaría estar cobrando tu primer sueldo?',
    opciones: [
      {
        id: 'a',
        texto: 'Cuanto antes. Quiero independencia pronto',
        icono: 'Rocket',
        metas: { trabajarPronto: 3 },
      },
      {
        id: 'b',
        texto: 'No corre prisa si eso me da un puesto mejor',
        icono: 'TrendingUp',
        metas: { especializarse: 3 },
      },
      {
        id: 'c',
        texto: 'Me da igual esperar: quiero llegar lejos en formación',
        icono: 'GraduationCap',
        metas: { universidad: 3 },
      },
    ],
  },
  {
    id: 'q11',
    bloque: 'metas',
    bloqueEtiqueta: 'A dónde quieres llegar',
    enunciado: 'Cuando termines el ciclo, ¿qué te gustaría estar haciendo?',
    opciones: [
      {
        id: 'a',
        texto: 'Trabajando ya del oficio que he aprendido',
        icono: 'Briefcase',
        metas: { trabajarPronto: 3 },
      },
      {
        id: 'b',
        texto: 'Encadenando otro ciclo o una especialización para ser el que más sabe',
        icono: 'Award',
        metas: { especializarse: 3 },
      },
      {
        id: 'c',
        texto: 'Entrando en la universidad con parte del camino hecho',
        icono: 'GraduationCap',
        metas: { universidad: 3 },
      },
      {
        id: 'd',
        texto: 'Montando algo mío, aunque sea pequeño',
        icono: 'Store',
        metas: { trabajarPronto: 2, especializarse: 1 },
      },
    ],
  },
  {
    id: 'q12',
    bloque: 'metas',
    bloqueEtiqueta: 'A dónde quieres llegar',
    enunciado: 'Sobre estudiar y trabajar a la vez, ¿qué te suena mejor?',
    ayuda: 'En FP Dual pasas gran parte del ciclo en una empresa, y cobrando.',
    opciones: [
      {
        id: 'a',
        texto: 'FP Dual: aprender dentro de la empresa desde el principio',
        icono: 'Handshake',
        metas: { trabajarPronto: 2, especializarse: 1 },
      },
      {
        id: 'b',
        texto: 'Prefiero centrarme en clase y luego hacer las prácticas',
        icono: 'BookOpen',
        metas: { especializarse: 2, universidad: 1 },
      },
      {
        id: 'c',
        texto: 'Lo que sea, con tal de que la teoría no sea todo el rato',
        icono: 'Hammer',
        metas: { trabajarPronto: 2 },
      },
    ],
  },
];

/** Numero total de preguntas del cuestionario. */
export const TOTAL_PREGUNTAS = PREGUNTAS.length;
