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

/**
 * Qué aseo se valoró. Un bar puede tener el de ellas impecable y el de
 * ellos arrasado, así que la nota cuelga del aseo, no del local.
 * "unico" es el baño sin distinción, el de toda la vida.
 */
export type TipoAseo = "femenino" | "masculino" | "unico";

/** Las cuatro categorías que se puntúan de 1 a 5. */
export type CriterioKey = "limpieza" | "espacio" | "intimidad" | "suministros";

/** Puntuación de 1 a 5 rollos. */
export type Puntuacion = 1 | 2 | 3 | 4 | 5;

/** Valoración de un baño. La nota global se calcula, no se guarda. */
export interface Review {
  id: string;
  /** FK → Bar.place_id */
  place_id: string;
  /** El aseo al que se refiere esta valoración. */
  aseo: TipoAseo;
  limpieza: Puntuacion;
  espacio: Puntuacion;
  intimidad: Puntuacion;
  suministros: Puntuacion;
  comentario: string;
  /** Alias visible de quien valora. */
  autor: string;
  /** Cuenta que la publicó; null en las reseñas de ejemplo. */
  user_id: string | null;
  /** Fecha ISO 8601. */
  fecha: string;
}

/** Valores del formulario antes de convertirse en Review. */
export type ReviewDraft = Pick<Review, CriterioKey | "comentario" | "aseo">;

/** Resumen de un aseo concreto de un bar. */
export interface NotaAseo {
  media: number | null;
  votos: number;
}

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
  /** Nota de cada aseo, para poder compararlos de un vistazo. */
  porAseo: Record<TipoAseo, NotaAseo>;
}
