/** Puerta del Sol, kilómetro 0: el centro por defecto del mapa. */
export const MADRID_CENTRO = { lat: 40.4168, lng: -3.7038 } as const;

export const ZOOM_INICIAL = 14;
/** Zoom al que se acerca el mapa cuando eliges un bar concreto. */
export const ZOOM_DETALLE = 17;

/**
 * Clave de la API de Google Maps. Se lee en tiempo de compilación, así
 * que hay que declararla en `.env.local` (y en el panel de Netlify).
 */
export const GOOGLE_MAPS_API_KEY =
  process.env["NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"] ?? "";

/**
 * Map ID de Cloud Console: obligatorio para los marcadores avanzados.
 * `DEMO_MAP_ID` funciona en desarrollo (con marca de agua); para
 * producción crea uno propio y personaliza el estilo del mapa.
 */
export const GOOGLE_MAPS_MAP_ID =
  process.env["NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID"] ?? "DEMO_MAP_ID";

export const HAY_API_KEY = GOOGLE_MAPS_API_KEY.length > 0;
