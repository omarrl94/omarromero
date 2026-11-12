// Fórmulas de evaluación (sección 6 del diseño). Sin valores normativos: solo pedagogía de nota.
// Los pesos de RA se leen de content/ra/ra.json y se pasan como parámetro.

export const FACTOR_NIVEL: Record<number, number> = { 1: 0.5, 2: 0.75, 3: 1, 4: 1.25, 5: 1.5 };
export const PENALIZACION_PISTA = 0.2;
export const PENALIZACION_SEGURIDAD = 0.1;
export const TOPE_PENALIZACION_SEGURIDAD = 0.3;
export const FACTOR_RESPUESTA_SIN_CITA = 0.7;

export const redondea = (x: number, d = 2): number => {
  const k = 10 ** d;
  return Math.round((x + Number.EPSILON) * k) / k;
};

export function peMaximo(i: { pe_base: number; dificultad: number; nivel: number }): number {
  return redondea(i.pe_base * i.dificultad * (FACTOR_NIVEL[i.nivel] ?? 1), 4);
}

export interface RespuestaEval {
  peMax: number;
  correcta: boolean;
  requiereCita: boolean;
  citaOk: boolean;
  pistas: number;
  errorSeguridad: boolean;
}

/** PE obtenidos por un ítem. */
export function peObtenido(r: RespuestaEval): number {
  if (r.errorSeguridad || !r.correcta) return 0; // cita correcta con respuesta incorrecta = 0 %
  const base = r.requiereCita && !r.citaOk ? FACTOR_RESPUESTA_SIN_CITA : 1;
  const conPistas = r.peMax * base - r.peMax * PENALIZACION_PISTA * r.pistas;
  return redondea(Math.max(0, conPistas), 4);
}

/** Penalización por errores de seguridad graves en un nivel: 10 % del PE máx. del nivel por error, tope 30 %. */
export function penalizacionSeguridad(erroresGraves: number, peMaxNivel: number): number {
  const frac = Math.min(TOPE_PENALIZACION_SEGURIDAD, PENALIZACION_SEGURIDAD * erroresGraves);
  return redondea(frac * peMaxNivel, 4);
}

export interface ResultadoItem { ra: string[]; peObtenido: number; peMax: number }

/** Nota de juego de un RA (0-10): mejor intento por ítem, ya resuelto por el llamador. */
export function raJuego(items: ResultadoItem[], ra: string): number | null {
  const mios = items.filter((i) => i.ra.includes(ra));
  const max = mios.reduce((s, i) => s + i.peMax, 0);
  if (max === 0) return null;
  const obt = mios.reduce((s, i) => s + i.peObtenido, 0);
  return redondea(Math.min(10, (obt / max) * 10));
}

/** Cobertura: fracción de ítems del RA completados. */
export function cobertura(completados: number, total: number): number {
  return total === 0 ? 0 : completados / total;
}

/** RA_final = a·juego + (1−a)·taller; sin nota de taller, RA_final = juego. */
export function raFinal(juego: number, taller: number | null, a: number): { nota: number; sinTaller: boolean } {
  if (taller === null) return { nota: redondea(juego), sinTaller: true };
  return { nota: redondea(a * juego + (1 - a) * taller), sinTaller: false };
}

export interface NotaRa { ra: string; nota: number; cobertura: number }

/** Nota final = Σ RA_i·peso_i; aprobado solo si final ≥ min y cada RA ≥ min y cobertura suficiente. */
export function notaFinal(
  notas: NotaRa[],
  pesos: Record<string, number>,
  cfg = { notaFinalMin: 5, notaRaMin: 5, coberturaMin: 0.8 },
) {
  const final = redondea(notas.reduce((s, n) => s + n.nota * (pesos[n.ra] ?? 0), 0));
  const pendientes = notas.filter((n) => n.nota < cfg.notaRaMin || n.cobertura < cfg.coberturaMin).map((n) => n.ra);
  return { final, aprobado: final >= cfg.notaFinalMin && pendientes.length === 0, pendientes };
}

/** Nivel superado con ≥ 50 % de los PE. */
export const nivelSuperado = (obt: number, max: number): boolean => max > 0 && obt / max >= 0.5;
