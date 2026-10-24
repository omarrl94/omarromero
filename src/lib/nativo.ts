import { Capacitor } from "@capacitor/core";

/**
 * Dónde se está ejecutando la app.
 *
 * El mismo código corre en el navegador y dentro de la app de iOS y
 * Android; estas dos funciones deciden cuándo usar la pieza nativa y
 * cuándo la del navegador.
 */
export const esNativo = (): boolean => Capacitor.isNativePlatform();

export const plataforma = (): "ios" | "android" | "web" =>
  Capacitor.getPlatform() as "ios" | "android" | "web";
