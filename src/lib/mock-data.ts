import type { Bar, Review } from "./types";

/**
 * Datos simulados para arrancar el MVP.
 *
 * Los `place_id` son INVENTADOS (llevan el prefijo `mock-`) para poder
 * probar sin gastar cuota de la API. Cuando un usuario busque el mismo
 * bar en Google Places se adoptará con su Place ID real ("ChIJ…") y
 * convivirán ambos hasta que se limpie la base de datos.
 */
export const BARES_MOCK: readonly Bar[] = [
  {
    place_id: "mock-la-venencia",
    nombre: "La Venencia",
    direccion: "C. de Echegaray, 7, Centro, 28014 Madrid",
    lat: 40.4152,
    lng: -3.6995,
  },
  {
    place_id: "mock-casa-camacho",
    nombre: "Casa Camacho",
    direccion: "C. de San Andrés, 4, Centro, 28004 Madrid",
    lat: 40.4258,
    lng: -3.7037,
  },
  {
    place_id: "mock-bodega-ardosa",
    nombre: "La Ardosa",
    direccion: "C. de Colón, 13, Centro, 28004 Madrid",
    lat: 40.4245,
    lng: -3.7009,
  },
  {
    place_id: "mock-el-tigre",
    nombre: "El Tigre",
    direccion: "C. de las Infantas, 30, Centro, 28004 Madrid",
    lat: 40.4211,
    lng: -3.6979,
  },
  {
    place_id: "mock-casa-labra",
    nombre: "Casa Labra",
    direccion: "C. de Tetuán, 12, Centro, 28013 Madrid",
    lat: 40.4180,
    lng: -3.7044,
  },
];

/** Reseñas de ejemplo: una de cada color para ver los tres tipos de pin. */
export const REVIEWS_MOCK: readonly Review[] = [
  {
    id: "mock-review-1",
    place_id: "mock-la-venencia",
    limpieza: 5,
    espacio: 4,
    intimidad: 5,
    suministros: 5,
    comentario:
      "Baño de manzanilla y madera noble. Papel de sobra, pestillo firme y cero olor. Se puede ir con confianza.",
    autor: "Rollo Anónimo",
    fecha: "2026-08-12T19:40:00.000Z",
  },
  {
    id: "mock-review-2",
    place_id: "mock-la-venencia",
    limpieza: 4,
    espacio: 4,
    intimidad: 5,
    suministros: 5,
    comentario: "Impecable a las ocho, ya veremos a las doce.",
    autor: "Chule",
    fecha: "2026-09-02T17:10:00.000Z",
  },
  {
    id: "mock-review-3",
    place_id: "mock-casa-camacho",
    limpieza: 2,
    espacio: 1,
    intimidad: 2,
    suministros: 1,
    comentario:
      "Cabina del tamaño de un ascensor de finca antigua. Si cierras la puerta saludas a tus rodillas. Lleva papel de casa.",
    autor: "Vermutero",
    fecha: "2026-09-05T20:05:00.000Z",
  },
  {
    id: "mock-review-4",
    place_id: "mock-bodega-ardosa",
    limpieza: 3,
    espacio: 3,
    intimidad: 2,
    suministros: 4,
    comentario:
      "El pestillo va y viene: canta algo mientras estás dentro. Jabón sí, secamanos no.",
    autor: "Kike",
    fecha: "2026-08-28T21:30:00.000Z",
  },
  {
    id: "mock-review-5",
    place_id: "mock-el-tigre",
    limpieza: 1,
    espacio: 2,
    intimidad: 1,
    suministros: 1,
    comentario:
      "Zona catastrófica confirmada. Entra solo en caso de emergencia nivel 5 y sin respirar.",
    autor: "Superviviente",
    fecha: "2026-09-09T22:15:00.000Z",
  },
];
