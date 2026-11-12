// Puntos de utilización por estancia. Las reglas llegan por parámetro (content/norma/vivienda.json).
export interface ReglasPuntos { baseCadaM2: number; basesMin: number; luzDobleSobreM2: number }

export const basesEstancia = (superficie: number, r: ReglasPuntos): number => Math.max(r.basesMin, Math.ceil(superficie / r.baseCadaM2));
export const puntosLuzEstancia = (superficie: number, r: ReglasPuntos): number => (superficie > r.luzDobleSobreM2 ? 2 : 1);

export interface Estancia { nombre: string; superficie: number }
export function resumenVivienda(estancias: Estancia[], r: ReglasPuntos) {
  return estancias.map((e) => ({ ...e, bases: basesEstancia(e.superficie, r), luz: puntosLuzEstancia(e.superficie, r) }));
}

/** Un diferencial por cada N circuitos (redondeo hacia arriba). */
export const diferencialesNecesarios = (circuitos: number, cadaN: number): number => Math.ceil(circuitos / cadaN);
