/** Punto en el mapa: lo que devuelve el navegador y lo que guardamos de un bar. */
export interface Punto {
  lat: number;
  lng: number;
}

const RADIO_TIERRA_M = 6_371_000;
const aRadianes = (grados: number) => (grados * Math.PI) / 180;

/**
 * Distancia en línea recta entre dos puntos, en metros (haversine).
 * A escala de barrio basta de sobra: nadie va a notar los metros que
 * se pierden por no seguir las calles.
 */
export function metrosEntre(a: Punto, b: Punto): number {
  const dLat = aRadianes(b.lat - a.lat);
  const dLng = aRadianes(b.lng - a.lng);
  const lat1 = aRadianes(a.lat);
  const lat2 = aRadianes(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(h));
}

/** "320 m" hasta el kilómetro, "1,2 km" a partir de ahí. */
export function formatearDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros / 10) * 10} m`;
  return `${(metros / 1000).toFixed(1).replace(".", ",")} km`;
}

/** Cuánto se tarda andando, a paso de quien tiene prisa (5,5 km/h). */
export function minutosAndando(metros: number): number {
  return Math.max(1, Math.round(metros / 91));
}
