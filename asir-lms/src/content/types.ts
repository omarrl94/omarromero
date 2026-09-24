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
};

export type Lab = Only & {
  title: string;
  goal: string;
  /** Material y entorno necesarios. */
  environment: string[];
  steps: LabStep[];
  /** Cómo comprobar que el laboratorio ha salido bien. */
  check: string;
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
