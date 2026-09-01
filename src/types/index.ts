/**
 * Contratos de datos de OrientaFP.
 * Todo el dominio (catalogo, test y resultados) se apoya en estos tipos.
 */

/** Los tres niveles del sistema de FP espanol. */
export type Grado = 'basico' | 'medio' | 'superior';

/**
 * Dimensiones vocacionales que mide el test. Cada familia profesional tiene un
 * perfil sobre estas siete dimensiones y cada respuesta suma puntos a algunas.
 */
export type Dimension =
  | 'analitico'
  | 'creativo'
  | 'asistencial'
  | 'tecnico'
  | 'organizativo'
  | 'social'
  | 'cientifico'
  /** Gusto por el movimiento, el aire libre y el esfuerzo corporal. */
  | 'fisico';

/** Vector de puntuacion por dimension. Siempre completo, nunca parcial. */
export type DimensionScores = Record<Dimension, number>;

/**
 * Segundo eje del test: hacia donde mira el estudiante a medio plazo.
 * No decide la familia, sino que ordena los grados recomendados.
 */
export type Meta = 'trabajarPronto' | 'especializarse' | 'universidad' | 'emprender';

export type MetaScores = Record<Meta, number>;

/** Situacion academica de partida, elegida en el paso 1 del test. */
export type SituacionId = 'sinEso' | 'conEso' | 'conBachillerato' | 'explorar';

export interface Situacion {
  id: SituacionId;
  titulo: string;
  descripcion: string;
  /** Grados que se priorizan al puntuar los ciclos. */
  gradosPreferidos: Grado[];
  /** Aviso honesto sobre requisitos de acceso, si aplica. */
  nota?: string;
}

/** Identificadores estables de familia profesional. */
export type FamiliaId =
  | 'informatica'
  | 'sanidad'
  | 'administracion'
  | 'electricidad'
  | 'imagen'
  | 'hosteleria'
  | 'sociocultural'
  | 'mecanica'
  | 'comercio'
  | 'automocion'
  | 'deportes'
  | 'quimica'
  | 'instalacion'
  | 'textil';

export interface Familia {
  id: FamiliaId;
  nombre: string;
  /** Frase corta para tarjetas y badges. */
  claim: string;
  descripcion: string;
  /** Peso 0-5 de la familia en cada dimension. Base del calculo de afinidad. */
  perfil: DimensionScores;
  /** Clase Tailwind del color categorico de la familia (bg-familia-*). */
  colorClass: string;
  /** Nombre del icono de lucide-react usado en la UI. */
  icono: string;
}

/** Un ciclo formativo concreto del catalogo. */
export interface Ciclo {
  id: string;
  nombre: string;
  /** Siglas de uso comun (DAM, SMR, ASIR...). Opcional: no todos las tienen. */
  siglas?: string;
  familia: FamiliaId;
  grado: Grado;
  descripcion: string;
  habilidadesClave: string[];
  salidasLaborales: string[];
  /** Dimensiones que mejor describen a quien encaja en el ciclo. */
  perfilIdeal: Dimension[];
  /**
   * Vector de etiquetas de afinidad. Las respuestas del test acumulan estas
   * mismas etiquetas, y su coincidencia afina el orden dentro de una familia:
   * dos ciclos de la misma familia pueden pedir perfiles muy distintos.
   */
  tagsAfinidad: Tag[];
  /** Modulos representativos del ciclo, para la ficha ampliada. */
  asignaturasTipicas: string[];
  /** Que se puede cursar al terminar. */
  continuidad: Continuidad;
  /** Duracion oficial en horas del ciclo completo. */
  duracionHoras: number;
  /**
   * Ciclo con muy buena insercion pero pocas matriculas por desconocimiento.
   * Alimenta la seccion "Gemas ocultas".
   */
  gemaOculta?: boolean;
  /** Por que este ciclo pasa desapercibido pese a su salida. Solo en gemas. */
  porQueOculta?: string;
  /** Relato ilustrativo de una jornada, para las gemas ocultas. */
  diaEnElTrabajo?: string;
}

/* ==========================================================================
   Datos de mercado laboral
   Viven aparte del catalogo (ver src/data/mercadoLaboral.ts) porque son
   ESTIMACIONES ORIENTATIVAS, no datos oficiales: separarlos deja claro que
   caducan y que hay que actualizarlos contra las fuentes reales.
   ========================================================================== */

export type Demanda = 'media' | 'alta' | 'muy-alta';

export type Modalidad = 'presencial' | 'dual' | 'teletrabajo';

export interface DatosMercado {
  /** Insercion laboral estimada, en porcentaje. Orientativa. */
  insercion: number;
  /** Banda salarial de entrada estimada, en euros brutos anuales. */
  salarioMin: number;
  salarioMax: number;
  demanda: Demanda;
  modalidades: Modalidad[];
  /** Carga logica y practica percibidas, de 1 a 5. Sirven para comparar. */
  cargaLogica: number;
  cargaPractica: number;
}

/* ==========================================================================
   Arquetipos vocacionales
   ========================================================================== */

export type ArquetipoId =
  | 'creadorDigital'
  | 'guardianAsistencial'
  | 'maestroEngranajes'
  | 'estrategaOrganizador'
  | 'exploradorCampo';

export interface Arquetipo {
  id: ArquetipoId;
  nombre: string;
  /** Frase corta que acompana al nombre en el badge. */
  lema: string;
  descripcion: string;
  icono: string;
  /** Clase Tailwind del color tematico del arquetipo. */
  colorClass: string;
  /** Perfil de referencia sobre las ocho dimensiones. */
  perfil: DimensionScores;
  /** Familias que suelen caer bajo este arquetipo. */
  familias: FamiliaId[];
}

/** Arquetipo asignado tras el test, con su grado de ajuste. */
export interface ArquetipoMatch {
  arquetipo: Arquetipo;
  /** Ajuste 0-100 con el perfil del estudiante. */
  ajuste: number;
}

/** Itinerarios que abre un ciclo al terminarlo. */
export interface Continuidad {
  /** Otros ciclos o cursos de especializacion (los "masteres de la FP"). */
  especializacion: string[];
  /** Grados universitarios afines. Vacio cuando el grado no da acceso directo. */
  universidad: string[];
}

/**
 * Etiquetas de afinidad compartidas entre las respuestas del test y los ciclos.
 * Son mas concretas que las dimensiones: describen el "sabor" del trabajo, no
 * el rasgo de la persona. Un mismo perfil analitico puede encajar en
 * `programacion` o en `laboratorio`, y estas etiquetas los separan.
 */
export type Tag =
  | 'programacion'
  | 'redes'
  | 'hardware'
  | 'diseno'
  | 'audiovisual'
  | 'videojuegos'
  | 'cuidadoPersonas'
  | 'urgencias'
  | 'laboratorio'
  | 'ensenanza'
  | 'gestion'
  | 'numeros'
  | 'ventas'
  | 'idiomas'
  | 'taller'
  | 'maquinaria'
  | 'electricidad'
  | 'vehiculos'
  | 'construccion'
  | 'cocina'
  | 'atencionPublico'
  | 'deporte'
  | 'aireLibre'
  | 'precision'
  | 'liderazgo'
  | 'emprender';

/** Puntuacion acumulada por etiqueta. Parcial: solo las que han salido. */
export type TagScores = Partial<Record<Tag, number>>;

/** Una opcion de respuesta dentro de una pregunta del test. */
export interface Opcion {
  id: string;
  texto: string;
  icono: string;
  /** Puntos que suma a cada dimension (parcial: solo lo que aporta). */
  pesos?: Partial<DimensionScores>;
  /** Etiquetas de afinidad que refuerza esta respuesta. */
  tags?: Tag[];
  /** Puntos que suma al eje de metas (solo en las preguntas del bloque 4). */
  metas?: Partial<MetaScores>;
}

/** Los cuatro bloques tematicos del cuestionario de 20 preguntas. */
export type BloquePregunta = 'tecnica' | 'situaciones' | 'gustos' | 'metas';

export interface Pregunta {
  id: string;
  bloque: BloquePregunta;
  /** Etiqueta corta del bloque, mostrada como eyebrow sobre la pregunta. */
  bloqueEtiqueta: string;
  enunciado: string;
  ayuda?: string;
  opciones: Opcion[];
}

/** Respuestas del cuestionario: id de pregunta -> id de opcion. */
export type Respuestas = Record<string, string>;

/** Resultado de afinidad de una familia, ya normalizado a porcentaje. */
export interface FamiliaMatch {
  familia: Familia;
  /** Afinidad 0-100. */
  afinidad: number;
  /** Dimensiones que mas han contribuido a este encaje, de mayor a menor. */
  dimensionesClave: Dimension[];
  /** Explicacion en lenguaje natural de por que encaja. */
  explicacion: string;
}

/** Un ciclo recomendado con su puntuacion de encaje. */
export interface CicloMatch {
  ciclo: Ciclo;
  /** Encaje 0-100 combinando familia, perfil del ciclo y grado preferido. */
  encaje: number;
}

/** Resultado completo del test, listo para pintar y para persistir. */
export interface Resultado {
  /** Marca temporal ISO en la que se completo el test. */
  fecha: string;
  situacion: SituacionId;
  respuestas: Respuestas;
  dimensiones: DimensionScores;
  metas: MetaScores;
  /** Etiquetas de afinidad acumuladas por las respuestas. */
  tags: TagScores;
  /** Arquetipo vocacional asignado. */
  arquetipo: ArquetipoMatch;
  /** Familias ordenadas por afinidad descendente. */
  familias: FamiliaMatch[];
  /** Ciclos ordenados por encaje descendente. */
  ciclos: CicloMatch[];
  /** Grado que el algoritmo considera el punto de entrada mas razonable. */
  gradoSugerido: Grado;
}

/** Estado persistido del test en curso, para poder retomarlo. */
export interface TestProgreso {
  situacion: SituacionId | null;
  respuestas: Respuestas;
  /** Indice de la pregunta en la que se quedo el usuario. */
  paso: number;
}

/** Rutas de la aplicacion (hash routing, sin dependencias externas). */
export type Ruta =
  | 'home'
  | 'guia-fp'
  | 'test'
  | 'resultados'
  | 'explorar'
  | 'comparador'
  | 'gemas';
