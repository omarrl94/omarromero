/** Grado al que va dirigido un elemento. Sin `only`, el elemento es común a ambos grados. */
export type Audience = "MEDIO" | "SUPERIOR";
type Only = { only?: Audience };

export type TheorySection = Only & {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LabStep = {
  title: string;
  detail: string;
  /** Comandos o configuración a copiar (opcional). */
  code?: string;
  /** Qué debe observar el alumno al terminar el paso (opcional). */
  expected?: string;
};

export type Lab = Only & {
  title: string;
  /** Objetivo del laboratorio: qué se va a conseguir. */
  goal: string;
  /** Relación con el tema: por qué esta práctica ilustra el contenido teórico. */
  relation?: string;
  /** Duración estimada (opcional). */
  duration?: string;
  /** Material y entorno necesarios. */
  environment: string[];
  steps: LabStep[];
  /** Cómo comprobar que el laboratorio ha salido bien. */
  check: string;
  /** Qué debe contener el documento de entrega (además de los puntos estándar). */
  evidence?: string[];
};

export type Activity = Only & {
  title: string;
  description: string;
};

export type Project = Only & {
  title: string;
  description: string;
  deliverables: string[];
  evaluation: string[];
};

export type QuizQuestion = Only & {
  question: string;
  options: string[];
  /** Índice de la opción correcta. */
  answer: number;
  explanation: string;
};

export type TopicContent = {
  theory: TheorySection[];
  labs: Lab[];
  activities: Activity[];
  projects: Project[];
  quiz: QuizQuestion[];
};
