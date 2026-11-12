// Motor de circuitos monofásicos básicos. Puro y determinista: ningún valor normativo aquí;
// tensión, conductividad y límites llegan como parámetros (salen de content/norma).

export const intensidad = (potenciaW: number, tensionV: number, cosfi = 1): number => potenciaW / (tensionV * cosfi);

/** Caída de tensión monofásica: e = 2·L·I·cosφ / (γ·S). Devuelve voltios y porcentaje. */
export function caidaTension(p: { longitudM: number; intensidadA: number; seccionMm2: number; conductividad: number; tensionV: number; cosfi?: number }) {
  const v = (2 * p.longitudM * p.intensidadA * (p.cosfi ?? 1)) / (p.conductividad * p.seccionMm2);
  return { voltios: v, porcentaje: (v / p.tensionV) * 100 };
}

export interface Dimensionado { ib: number; in: number; iz: number }
export interface ResultadoDim { ok: boolean; motivos: string[] }

/** Criterio de protección contra sobrecargas: IB ≤ In ≤ IZ. */
export function comprobarIbInIz(d: Dimensionado): ResultadoDim {
  const motivos: string[] = [];
  if (d.ib > d.in) motivos.push(`IB (${d.ib}) supera In (${d.in}): el PIA saltaría en servicio normal.`);
  if (d.in > d.iz) motivos.push(`In (${d.in}) supera IZ (${d.iz}): el cable no queda protegido.`);
  return { ok: motivos.length === 0, motivos };
}

/** Curva de disparo simplificada y parametrizable: múltiplo de In → tiempo de disparo (s). */
export interface CurvaParams { termicoK: number; magneticoMin: number; magneticoMax: number }
export function tiempoDisparo(i: number, inA: number, c: CurvaParams): number | null {
  const m = i / inA;
  if (m <= 1) return null; // no dispara
  if (m >= c.magneticoMax) return 0.01;
  if (m >= c.magneticoMin) return 0.1;
  return c.termicoK / (m * m - 1); // zona térmica: tiempo inverso
}

export interface Aislado { fase: boolean; neutro: boolean; pe: boolean }
/** Interruptor diferencial: dispara si la fuga a tierra supera su sensibilidad. */
export const disparaDiferencial = (fugaA: number, sensibilidadA: number): boolean => fugaA >= sensibilidadA;
