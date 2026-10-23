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

/**
 * Firebase: cuentas (Authentication) y datos (Cloud Firestore).
 *
 * Los cuatro valores salen de la consola de Firebase → Configuración del
 * proyecto → Tus apps → Web. Son públicos por diseño: viajan al
 * navegador. Lo que protege los datos son las reglas de seguridad de
 * Firestore, no el secreto de estas claves.
 *
 * Si falta alguno, la app arranca en modo local: cuentas con alias y
 * datos en este navegador.
 */
export const FIREBASE_CONFIG = {
  apiKey: process.env["NEXT_PUBLIC_FIREBASE_API_KEY"] ?? "",
  authDomain: process.env["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"] ?? "",
  projectId: process.env["NEXT_PUBLIC_FIREBASE_PROJECT_ID"] ?? "",
  appId: process.env["NEXT_PUBLIC_FIREBASE_APP_ID"] ?? "",
} as const;

export const HAY_FIREBASE =
  FIREBASE_CONFIG.apiKey.length > 0 &&
  FIREBASE_CONFIG.authDomain.length > 0 &&
  FIREBASE_CONFIG.projectId.length > 0 &&
  FIREBASE_CONFIG.appId.length > 0;
