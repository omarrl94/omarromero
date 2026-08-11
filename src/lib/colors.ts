/**
 * Paleta de fichas del cartón, fiel a las fichas físicas de Hitster:
 * cuadrados de color sólido y vibrante con borde negro fino.
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
  yellow: "#F5C63C",
  blue: "#3D9BD9",
  green: "#4FAE6C",
  red: "#E25440",
  purple: "#8A4FA8",
};

/** Color del texto/iconos que se pinta ENCIMA de cada ficha. */
export const COLOR_ON: Record<TileColor, string> = {
  yellow: "#1a1a1a",
  blue: "#ffffff",
  green: "#ffffff",
  red: "#ffffff",
  purple: "#ffffff",
};

export const COLOR_LABEL: Record<TileColor, string> = {
  yellow: "Amarillo",
  blue: "Azul",
  green: "Verde",
  red: "Rojo",
  purple: "Morado",
};
