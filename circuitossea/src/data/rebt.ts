/**
 * TABLAS NORMATIVAS (REBT, RD 842/2002). Archivo de DATOS separado y fácilmente actualizable.
 *
 * IMPORTANTE: los valores marcados con `verified: false` están transcritos de memoria y de la
 * bibliografía habitual de FP; el proyecto NO tiene acceso a las tablas oficiales. Comprueba cada
 * valor con la ITC indicada antes de usarlo en un proyecto real. Son editables aquí.
 */

export interface Source { ref: string; note: string; verified: boolean }

/** Secciones normalizadas de conductor (mm²). */
export const SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120];

/** Calibres normalizados de interruptores automáticos (A). */
export const BREAKER_RATINGS = [6, 10, 16, 20, 25, 32, 40, 50, 63];

/**
 * Intensidad admisible (A) de conductores de cobre con aislamiento PVC, 2 conductores cargados,
 * instalación empotrada en tubo en pared (método B1 de UNE-HD 60364-5-52 / ITC-BT-19 tabla 1).
 */
export const IZ_CU_PVC_B1: Record<number, number> = {
  1.5: 15.5, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 68, 25: 89, 35: 110, 50: 134, 70: 171, 95: 207, 120: 239,
};
export const IZ_SOURCE: Source = {
  ref: 'ITC-BT-19 tabla 1 / UNE-HD 60364-5-52 (método B1, Cu, PVC, 2 conductores cargados)',
  note: 'Valores orientativos de bibliografía; verifica con la tabla oficial. Para otros métodos de instalación o agrupamientos hay que aplicar factores de corrección (no incluidos).',
  verified: false,
};

/** Conductividad del cobre a la temperatura máxima de servicio del aislamiento (m/(Ω·mm²)). */
export const GAMMA_CU = { at20: 56, at70: 48, at90: 44 };
export const GAMMA_SOURCE: Source = { ref: 'ITC-BT-19 §2.2.2 (conductividad del cobre: 56 a 20 °C, 48 a 70 °C, 44 a 90 °C)', note: 'Se usa 48 (PVC, 70 °C).', verified: true };

/** Caídas de tensión máximas admisibles respecto a la tensión nominal (%). */
export const DROP_LIMITS = { alumbrado: 3, resto: 5 };
export const DROP_SOURCE: Source = { ref: 'ITC-BT-19 §2.2.2 (instalaciones interiores en viviendas: 3 % alumbrado, 5 % resto)', note: 'La derivación individual tiene su propio límite (ITC-BT-15), no incluido aquí.', verified: true };

/** Circuitos de electrificación básica (ITC-BT-25). */
export interface CircuitType {
  id: string; name: string; example: string;
  inA: number; // calibre del magnetotérmico (A)
  section: number; // sección mínima (mm²)
  cs: number; cu: number; // coeficientes de simultaneidad y utilización
  pn: number; // potencia máxima de cálculo del circuito (W) = In · 230 V
}
export const ELECTRIFICATION_BASIC: CircuitType[] = [
  { id: 'C1', name: 'Alumbrado', example: 'puntos de luz', inA: 10, section: 1.5, cs: 0.75, cu: 0.5, pn: 2300 },
  { id: 'C2', name: 'Tomas de uso general y frigorífico', example: 'bases de 16 A 2p+T', inA: 16, section: 2.5, cs: 0.2, cu: 0.25, pn: 3680 },
  { id: 'C3', name: 'Cocina y horno', example: 'base de 25 A', inA: 25, section: 6, cs: 0.5, cu: 0.75, pn: 5750 },
  { id: 'C4', name: 'Lavadora, lavavajillas y termo eléctrico', example: 'bases de 16 A en cocina', inA: 20, section: 4, cs: 0.66, cu: 0.75, pn: 4600 },
  { id: 'C5', name: 'Baño y cuarto de cocina', example: 'bases de 16 A', inA: 16, section: 2.5, cs: 0.4, cu: 0.5, pn: 3680 },
];
export const ITC25_SOURCE: Source = {
  ref: 'ITC-BT-25 tablas 1 y 2 (electrificación básica)',
  note: 'Calibres y secciones mínimas por circuito; coeficientes Cs/Cu y potencias a verificar con la tabla oficial.',
  verified: false,
};
export const ELECTRIFICATION_BASIC_MIN_W = 5750; // ITC-BT-10: previsión mínima electrificación básica
