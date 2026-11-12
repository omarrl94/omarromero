// Evaluación de las filas de un acta de verificación. Los umbrales se leen de content/norma.
export interface Prueba { id: string; nombre: string; valor: number; unidad: string; regla: { tipo: 'min' | 'max' | 'tierra_max' | 'rango_frac'; norma?: string; sens_a?: number } }
export type Norma = (id: string) => number;

/** ¿Cumple la prueba? */
export function cumple(p: Prueba, norma: Norma): boolean {
  const r = p.regla;
  switch (r.tipo) {
    case 'min': return p.valor >= norma(r.norma!);
    case 'max': return p.valor <= norma(r.norma!);
    case 'tierra_max': return p.valor <= norma(r.norma!) / (r.sens_a ?? 0.03); // R ≤ Uc / IΔn
    case 'rango_frac': return p.valor >= norma(r.norma!) * (r.sens_a ?? 0.03) * 1000 && p.valor <= (r.sens_a ?? 0.03) * 1000; // mA
  }
}
/** Dictamen global: apta solo si todas las pruebas cumplen. */
export const dictamenApta = (ps: Prueba[], norma: Norma): boolean => ps.every((p) => cumple(p, norma));

export function evaluaActa(ps: Prueba[], resp: Record<string, 'cumple' | 'no'>, dictamen: 'apta' | 'no_apta' | undefined, norma: Norma) {
  const filas = ps.map((p) => ({ id: p.id, ok: resp[p.id] === (cumple(p, norma) ? 'cumple' : 'no') }));
  const dictOk = dictamen === (dictamenApta(ps, norma) ? 'apta' : 'no_apta');
  const aciertos = filas.filter((f) => f.ok).length + (dictOk ? 1 : 0);
  return { filas, dictOk, fraccion: aciertos / (ps.length + 1) };
}
