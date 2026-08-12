/**
 * Paleta neón de fichas del cartón: colores vivos de alta luminancia
 * pensados para brillar sobre el fondo negro de la interfaz.
 */

export type TileColor = "yellow" | "blue" | "green" | "red" | "purple";

export const TILE_COLORS: readonly TileColor[] = [
  "yellow",
  "blue",
  "green",
  "red",
  "purple",
] as const;

/** Color de relleno de cada ficha. */
export const COLOR_HEX: Record<TileColor, string> = {
  yellow: "#FFD60A",
  blue: "#0A9BFF",
  green: "#00E572",
  red: "#FF453A",
  purple: "#BF5AF2",
};

/** Color del texto/iconos que se pinta ENCIMA de cada ficha. */
export const COLOR_ON: Record<TileColor, string> = {
  yellow: "#0a0a10",
  blue: "#ffffff",
  green: "#06240f",
  red: "#ffffff",
  purple: "#ffffff",
};

/** Halo neón que proyecta cada ficha sobre el fondo oscuro. */
export const COLOR_GLOW: Record<TileColor, string> = {
  yellow: "rgba(255, 214, 10, 0.32)",
  blue: "rgba(10, 155, 255, 0.34)",
  green: "rgba(0, 229, 114, 0.30)",
  red: "rgba(255, 69, 58, 0.32)",
  purple: "rgba(191, 90, 242, 0.34)",
};

export const COLOR_LABEL: Record<TileColor, string> = {
  yellow: "Amarillo",
  blue: "Azul",
  green: "Verde",
  red: "Rojo",
  purple: "Morado",
};
