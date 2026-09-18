import type {
  Bar,
  BarConNota,
  CriterioKey,
  Review,
} from "./types";

/** Definición de las cuatro categorías, en el orden en que se muestran. */
export const CRITERIOS: ReadonlyArray<{
  key: CriterioKey;
  label: string;
  pregunta: string;
  emoji: string;
}> = [
  {
    key: "limpieza",
    label: "Limpieza",
    pregunta: "¿Se puede comer en el suelo o huele a muerte?",
    emoji: "🧼",
  },
  {
    key: "espacio",
    label: "Espacio",
    pregunta: "¿Caben las rodillas al cerrar la puerta?",
    emoji: "📏",
  },
  {
    key: "intimidad",
    label: "Intimidad",
    pregunta: "¿La puerta cierra bien y tiene pestillo de verdad?",
    emoji: "🔒",
  },
  {
    key: "suministros",
    label: "Suministros",
    pregunta: "¿Hay papel y jabón o toca improvisar?",
    emoji: "🧻",
  },
];

/** Nota global de una reseña: media de las cuatro categorías. */
export function notaGlobal(review: Review): number {
  const suma =
    review.limpieza + review.espacio + review.intimidad + review.suministros;
  return suma / CRITERIOS.length;
}

/** Media de las notas globales de un conjunto de reseñas. */
export function mediaDeReviews(reviews: readonly Review[]): number | null {
  if (reviews.length === 0) return null;
  const suma = reviews.reduce((acc, r) => acc + notaGlobal(r), 0);
  return suma / reviews.length;
}

/** Media por categoría (para las barras de la ficha del bar). */
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

/** Combina un bar con sus reseñas y las notas derivadas. */
export function componerBar(bar: Bar, reviews: readonly Review[]): BarConNota {
  const propias = reviews.filter((r) => r.place_id === bar.place_id);
  const media = mediaDeReviews(propias);
  return {
    bar,
    reviews: [...propias].sort((a, b) => b.fecha.localeCompare(a.fecha)),
    media,
    medias: mediasPorCategoria(propias),
    esRolloDeOro: media !== null && media >= 4.5 && propias.length >= 2,
  };
}

/** Los tres niveles de baño, del cielo al infierno. */
export type Tier = "excelente" | "pasable" | "catastrofica" | "sin-datos";

export interface TierInfo {
  tier: Tier;
  etiqueta: string;
  /** Color del pin del mapa (hex, se usa en SVG y en estilos inline). */
  color: string;
  /** Clases Tailwind para insignias dentro de la UI. */
  badge: string;
}

const TIERS: Record<Tier, TierInfo> = {
  excelente: {
    tier: "excelente",
    etiqueta: "Zona de confort",
    color: "#2E9E5B",
    badge: "bg-nota-verde/15 text-nota-verde ring-1 ring-nota-verde/30",
  },
  pasable: {
    tier: "pasable",
    etiqueta: "Pasable con prisa",
    color: "#E0A526",
    badge: "bg-nota-amarillo/20 text-[#8a6410] ring-1 ring-nota-amarillo/40",
  },
  catastrofica: {
    tier: "catastrofica",
    etiqueta: "Zona catastrófica",
    color: "#D64541",
    badge: "bg-nota-rojo/15 text-nota-rojo ring-1 ring-nota-rojo/30",
  },
  "sin-datos": {
    tier: "sin-datos",
    etiqueta: "Sin valorar",
    color: "#9B8B76",
    badge: "bg-carton-200 text-carton-700 ring-1 ring-carton-300",
  },
};

/**
 * Traduce una nota media al nivel correspondiente:
 * verde >= 3.5, amarillo >= 2.5, rojo por debajo.
 */
export function tierDeNota(media: number | null): TierInfo {
  if (media === null) return TIERS["sin-datos"];
  if (media >= 3.5) return TIERS.excelente;
  if (media >= 2.5) return TIERS.pasable;
  return TIERS.catastrofica;
}

/** Nota con un decimal, en formato español (4,3). */
export function formatearNota(media: number | null): string {
  if (media === null) return "—";
  return media.toFixed(1).replace(".", ",");
}

/** "hace 3 días", "hoy"… para los comentarios. */
export function fechaRelativa(iso: string): string {
  const dias = Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 30) return `hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
  const anios = Math.floor(meses / 12);
  return `hace ${anios} ${anios === 1 ? "año" : "años"}`;
}
