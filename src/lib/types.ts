/**
 * Modelo de datos de Rollo Madrid.
 *
 * El identificador universal de un local es el `place_id` de Google:
 * los bares no se crean a mano, se "adoptan" desde Google Places al
 * buscarlos. Así nunca hay duplicados ni nombres mal escritos.
 */

/** Local adoptado desde Google Places. */
export interface Bar {
  /** Clave primaria: Place ID oficial de Google. */
  place_id: string;
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
}

/** Las cuatro categorías que se puntúan de 1 a 5. */
export type CriterioKey = "limpieza" | "espacio" | "intimidad" | "suministros";

/** Puntuación de 1 a 5 rollos. */
export type Puntuacion = 1 | 2 | 3 | 4 | 5;

/** Valoración de un baño. La nota global se calcula, no se guarda. */
export interface Review {
  id: string;
  /** FK → Bar.place_id */
  place_id: string;
  limpieza: Puntuacion;
  espacio: Puntuacion;
  intimidad: Puntuacion;
  suministros: Puntuacion;
  comentario: string;
  /** Alias de quien valora; vacío = anónimo. */
  autor: string;
  /** Fecha ISO 8601. */
  fecha: string;
}

/** Valores del formulario antes de convertirse en Review. */
export type ReviewDraft = Pick<
  Review,
  CriterioKey | "comentario" | "autor"
>;

/** Un bar junto a las notas derivadas de sus reseñas. */
export interface BarConNota {
  bar: Bar;
  reviews: Review[];
  /** Media global (1-5) o null si todavía no tiene reseñas. */
  media: number | null;
  /** Medias por categoría, null si no hay reseñas. */
  medias: Record<CriterioKey, number> | null;
  /** Media >= 4.5 con al menos 2 reseñas → Rollo de Oro. */
  esRolloDeOro: boolean;
}
