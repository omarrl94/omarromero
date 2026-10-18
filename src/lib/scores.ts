import type {
  Bar,
  BarConNota,
  CriterioKey,
  NotaAseo,
  Review,
  TipoAseo,
} from "./types";

/** Las cuatro categorías, con la pregunta tal y como se hace en la barra. */
export const CRITERIOS: ReadonlyArray<{
  key: CriterioKey;
  label: string;
  /** Abreviatura para las etiquetas de las reseñas. */
  corto: string;
  pregunta: string;
}> = [
  {
    key: "limpieza",
    label: "Limpieza",
    corto: "LIMP",
    pregunta: "¿Se puede comer en el suelo o huele a muerte?",
  },
  {
    key: "espacio",
    label: "Espacio",
    corto: "ESPC",
    pregunta: "¿Caben las rodillas al cerrar la puerta?",
  },
  {
    key: "intimidad",
    label: "Intimidad",
    corto: "INTM",
    pregunta: "¿El pestillo es de verdad o es decorativo?",
  },
  {
    key: "suministros",
    label: "Suministros",
    corto: "SUMN",
    pregunta: "¿Hay papel y jabón o toca improvisar?",
  },
];

/** Los tres aseos posibles, con su etiqueta y su símbolo. */
export const ASEOS: ReadonlyArray<{
  key: TipoAseo;
  label: string;
  corto: string;
  simbolo: string;
  /** Lo que se pregunta al valorar. */
  pregunta: string;
}> = [
  {
    key: "femenino",
    label: "Femenino",
    corto: "Ellas",
    simbolo: "♀",
    pregunta: "El de mujeres",
  },
  {
    key: "masculino",
    label: "Masculino",
    corto: "Ellos",
    simbolo: "♂",
    pregunta: "El de hombres",
  },
  {
    key: "unico",
    label: "Único",
    corto: "Único",
    simbolo: "⚲",
    pregunta: "Uno solo para todo el mundo",
  },
];

/** Filtro activo del mapa: un aseo concreto o la media de todos. */
export type FiltroAseo = TipoAseo | "todos";

/** Cómo se llama cada puntuación suelta, de 1 a 5. */
export const GRADOS = ["Infierno", "Malo", "Justito", "Bien", "Gloria"] as const;

/** Nota global de una reseña: media de las cuatro categorías. */
export function notaGlobal(review: Review): number {
  const suma =
    review.limpieza + review.espacio + review.intimidad + review.suministros;
  return suma / CRITERIOS.length;
}

/** Media de las notas globales de un conjunto de reseñas. */
export function mediaDeReviews(reviews: readonly Review[]): number | null {
  if (reviews.length === 0) return null;
  return reviews.reduce((acc, r) => acc + notaGlobal(r), 0) / reviews.length;
}

/** Media por categoría, para el parte técnico de la ficha. */
export function mediasPorCategoria(
  reviews: readonly Review[],
): Record<CriterioKey, number> | null {
  if (reviews.length === 0) return null;
  const acc: Record<CriterioKey, number> = {
    limpieza: 0,
    espacio: 0,
    intimidad: 0,
    suministros: 0,
  };
  for (const review of reviews) {
    for (const { key } of CRITERIOS) acc[key] += review[key];
  }
  for (const { key } of CRITERIOS) acc[key] = acc[key] / reviews.length;
  return acc;
}

/** Resumen de cada aseo de un bar: media y número de votos. */
function resumenPorAseo(
  reviews: readonly Review[],
): Record<TipoAseo, NotaAseo> {
  const resumen = {} as Record<TipoAseo, NotaAseo>;
  for (const { key } of ASEOS) {
    const suyas = reviews.filter((r) => r.aseo === key);
    resumen[key] = { media: mediaDeReviews(suyas), votos: suyas.length };
  }
  return resumen;
}

/**
 * Combina un bar con sus reseñas y las notas derivadas.
 *
 * El filtro decide qué reseñas cuentan: con "femenino" el bar se
 * comporta como si solo existiera ese aseo, de modo que el mapa, el
 * ranking y la ficha hablan del baño que le importa a quien mira.
 */
export function componerBar(
  bar: Bar,
  reviews: readonly Review[],
  filtro: FiltroAseo = "todos",
): BarConNota {
  const delBar = reviews.filter((r) => r.place_id === bar.place_id);
  const contadas =
    filtro === "todos" ? delBar : delBar.filter((r) => r.aseo === filtro);
  const media = mediaDeReviews(contadas);
  return {
    bar,
    reviews: [...contadas].sort((a, b) => b.fecha.localeCompare(a.fecha)),
    media,
    medias: mediasPorCategoria(contadas),
    esRolloDeOro: media !== null && media >= 4.5 && contadas.length >= 2,
    porAseo: resumenPorAseo(delBar),
  };
}

export type VeredictoClave =
  | "sin-catar"
  | "via-libre"
  | "se-puede"
  | "aprieta"
  | "mal-asunto"
  | "ni-de-cona";

export interface Veredicto {
  clave: VeredictoClave;
  /** Lo que se lee en el pin y en la ficha. */
  texto: string;
  /** La recomendación, en una línea. */
  frase: string;
  /** Hex: se usa en estilos en línea, también sobre el mapa de Google. */
  color: string;
}

const VEREDICTOS: Record<VeredictoClave, Veredicto> = {
  "via-libre": {
    clave: "via-libre",
    texto: "Vía libre",
    frase: "Entra tranquilo, incluso con tiempo.",
    color: "#C6FF3D",
  },
  "se-puede": {
    clave: "se-puede",
    texto: "Se puede",
    frase: "Nada que objetar si no te paras a mirar.",
    color: "#9BE03A",
  },
  aprieta: {
    clave: "aprieta",
    texto: "Aprieta y reza",
    frase: "Entra con prisa y no toques nada.",
    color: "#FFB800",
  },
  "mal-asunto": {
    clave: "mal-asunto",
    texto: "Mal asunto",
    frase: "Solo si no queda otra en 500 metros.",
    color: "#FF7A2F",
  },
  "ni-de-cona": {
    clave: "ni-de-cona",
    texto: "Ni de coña",
    frase: "Aguanta hasta casa. Hazme caso.",
    color: "#FF3B30",
  },
  "sin-catar": {
    clave: "sin-catar",
    texto: "Sin catar",
    frase: "Nadie se ha atrevido todavía.",
    color: "#4A4A52",
  },
};

/** Traduce una nota media (1-5) al veredicto que se pinta por toda la app. */
export function veredictoDeNota(media: number | null): Veredicto {
  if (media === null) return VEREDICTOS["sin-catar"];
  if (media >= 4.2) return VEREDICTOS["via-libre"];
  if (media >= 3.5) return VEREDICTOS["se-puede"];
  if (media >= 2.5) return VEREDICTOS.aprieta;
  if (media >= 1.6) return VEREDICTOS["mal-asunto"];
  return VEREDICTOS["ni-de-cona"];
}

/** Por debajo de esto el pin del mapa late para que se vea desde lejos. */
export const UMBRAL_PELIGRO = 1.6;

/** Nota con un decimal y coma: 4,3. */
export function formatearNota(media: number | null): string {
  if (media === null) return "—";
  return media.toFixed(1).replace(".", ",");
}

/** "hace 3 días", "ayer", "hoy mismo"… */
export function fechaRelativa(iso: string): string {
  const dias = Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (dias <= 0) return "hoy mismo";
  if (dias === 1) return "ayer";
  if (dias < 30) return `hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
  const anios = Math.floor(meses / 12);
  return `hace ${anios} ${anios === 1 ? "año" : "años"}`;
}
