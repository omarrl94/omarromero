/**
 * Base de datos máster de clichés hipsters.
 * 66 tópicos únicos, categorizados. La posición en el array es el ID
 * canónico de cada cliché: los cartones se serializan como índices,
 * por lo que ESTE ORDEN NO DEBE ALTERARSE (solo añadir al final).
 */

export type ClicheCategory =
  | "Moda"
  | "Gastronomía"
  | "Cerveza & Café"
  | "Postureo & Tecnología"
  | "Estilo de Vida";

export interface Cliche {
  readonly text: string;
  readonly category: ClicheCategory;
}

export const MASTER_CLICHES: readonly Cliche[] = [
  // ─── Moda ───────────────────────────────────────────────
  { text: "Gafas de pasta sin graduación", category: "Moda" },
  { text: "Camisa de franela a cuadros", category: "Moda" },
  { text: "Barba cuidada con aceite artesanal", category: "Moda" },
  { text: "Gorro de lana en pleno verano", category: "Moda" },
  { text: "Tatuaje botánico minimalista", category: "Moda" },
  { text: "Tote bag de librería independiente", category: "Moda" },
  { text: "Pantalones de pana vintage", category: "Moda" },
  { text: "Botas de cuero \"hechas a mano\"", category: "Moda" },
  { text: "Calcetines estampados visibles", category: "Moda" },
  { text: "Chaqueta de segunda mano \"con historia\"", category: "Moda" },
  { text: "Bigote encerado con las puntas curvadas", category: "Moda" },
  { text: "Camiseta de banda que nunca ha escuchado", category: "Moda" },
  { text: "Riñonera cruzada al pecho", category: "Moda" },

  // ─── Gastronomía ────────────────────────────────────────
  { text: "Tostada de aguacate con masa madre", category: "Gastronomía" },
  { text: "Bowl de açaí con superalimentos", category: "Gastronomía" },
  { text: "Kombucha fermentada en casa", category: "Gastronomía" },
  { text: "Brunch de 3 horas un martes", category: "Gastronomía" },
  { text: "Pan de masa madre con nombre propio", category: "Gastronomía" },
  { text: "Miel cruda de apicultor local", category: "Gastronomía" },
  { text: "Hummus de remolacha casero", category: "Gastronomía" },
  { text: "Tacos \"de autor\" fusión", category: "Gastronomía" },
  { text: "Queso vegano de anacardos", category: "Gastronomía" },
  { text: "Granola artesanal en tarro de cristal", category: "Gastronomía" },
  { text: "Restaurante km 0 con menú ciego", category: "Gastronomía" },
  { text: "Fotografiar el plato antes de comer", category: "Gastronomía" },
  { text: "Mercado de agricultores del barrio", category: "Gastronomía" },

  // ─── Cerveza & Café ─────────────────────────────────────
  { text: "Café de especialidad con leche de avena", category: "Cerveza & Café" },
  { text: "IPA artesanal de microcervecería", category: "Cerveza & Café" },
  { text: "Cold brew en botella de vidrio retro", category: "Cerveza & Café" },
  { text: "V60 vertido a mano con báscula", category: "Cerveza & Café" },
  { text: "Cata de cervezas con libreta de notas", category: "Cerveza & Café" },
  { text: "Latte art con forma de helecho", category: "Cerveza & Café" },
  { text: "Granos de café de origen único etíope", category: "Cerveza & Café" },
  { text: "Aeropress de viaje en la mochila", category: "Cerveza & Café" },
  { text: "\"Este café tiene notas a frutos rojos\"", category: "Cerveza & Café" },
  { text: "Cerveza sour de frambuesa", category: "Cerveza & Café" },
  { text: "Matcha ceremonial batido con bambú", category: "Cerveza & Café" },
  { text: "Molinillo de café manual de madera", category: "Cerveza & Café" },
  { text: "Chai latte \"como el de la India\"", category: "Cerveza & Café" },

  // ─── Postureo & Tecnología ──────────────────────────────
  { text: "Cámara analógica colgada al cuello", category: "Postureo & Tecnología" },
  { text: "Vinilo de edición limitada", category: "Postureo & Tecnología" },
  { text: "Tocadiscos en la maleta", category: "Postureo & Tecnología" },
  { text: "Newsletter propia \"sobre cultura\"", category: "Postureo & Tecnología" },
  { text: "Máquina de escribir como decoración", category: "Postureo & Tecnología" },
  { text: "Podcast propio con dos oyentes", category: "Postureo & Tecnología" },
  { text: "Móvil \"dumb phone\" por desintoxicación digital", category: "Postureo & Tecnología" },
  { text: "Foto en blanco y negro \"por la estética\"", category: "Postureo & Tecnología" },
  { text: "Playlist de lo-fi para trabajar", category: "Postureo & Tecnología" },
  { text: "Kindle lleno pero compra libros en papel", category: "Postureo & Tecnología" },
  { text: "Presume de no tener televisión", category: "Postureo & Tecnología" },
  { text: "Carrete revelado en laboratorio artesanal", category: "Postureo & Tecnología" },
  { text: "Setup con teclado mecánico custom", category: "Postureo & Tecnología" },

  // ─── Estilo de Vida ─────────────────────────────────────
  { text: "Bicicleta de piñón fijo (fixie)", category: "Estilo de Vida" },
  { text: "Manta de lana merino sobre el sofá", category: "Estilo de Vida" },
  { text: "Yoga al amanecer en la azotea", category: "Estilo de Vida" },
  { text: "Plantas con nombre y cuenta de Instagram", category: "Estilo de Vida" },
  { text: "Mudanza a un pueblo \"para desconectar\"", category: "Estilo de Vida" },
  { text: "Cerámica hecha en taller de barrio", category: "Estilo de Vida" },
  { text: "Velas de soja aromáticas artesanales", category: "Estilo de Vida" },
  { text: "Club de lectura de autores nórdicos", category: "Estilo de Vida" },
  { text: "Huerto urbano en el balcón", category: "Estilo de Vida" },
  { text: "Diario de gratitud con pluma estilográfica", category: "Estilo de Vida" },
  { text: "Furgoneta camper restaurada", category: "Estilo de Vida" },
  { text: "Mercadillo vintage de domingo", category: "Estilo de Vida" },
  { text: "Incienso de palo santo \"para la energía\"", category: "Estilo de Vida" },
  { text: "Apicultura urbana como hobby", category: "Estilo de Vida" },
] as const;

/** Texto de la casilla central fija, siempre marcada. */
export const FREE_CELL_TEXT = "FREE · Pipa de Cobre";
