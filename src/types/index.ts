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
  | 'cientifico';

/** Vector de puntuacion por dimension. Siempre completo, nunca parcial. */
export type DimensionScores = Record<Dimension, number>;

/**
 * Segundo eje del test: hacia donde mira el estudiante a medio plazo.
 * No decide la familia, sino que ordena los grados recomendados.
 */
export type Meta = 'trabajarPronto' | 'especializarse' | 'universidad';

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
  | 'comercio';

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
  /** Duracion oficial en horas del ciclo completo. */
  duracionHoras: number;
}

/** Una opcion de respuesta dentro de una pregunta del test. */
export interface Opcion {
  id: string;
  texto: string;
  icono: string;
  /** Puntos que suma a cada dimension (parcial: solo lo que aporta). */
  pesos?: Partial<DimensionScores>;
  /** Puntos que suma al eje de metas (solo en las preguntas del bloque 4). */
  metas?: Partial<MetaScores>;
}

export type BloquePregunta = 'entorno' | 'pensamiento' | 'dinamica' | 'metas';

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
export type Ruta = 'home' | 'guia-fp' | 'test' | 'resultados' | 'explorar';
