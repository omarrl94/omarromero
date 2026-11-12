import { normaNum } from '../data/content';
import { caidaTension, intensidad } from '../engine/circuito';
import type { FilaTabla } from '../engine/cuadro';
import { basesEstancia, puntosLuzEstancia, diferencialesNecesarios, type ReglasPuntos } from '../engine/vivienda';

export const reglasPuntos = (): ReglasPuntos => ({
  baseCadaM2: normaNum('vivienda.regla.base_cada_m2'), basesMin: normaNum('vivienda.regla.bases_min'), luzDobleSobreM2: normaNum('vivienda.regla.luz_doble_sobre_m2'),
});

export const tablaVivienda = (circuitos: string[]): Record<string, FilaTabla> =>
  Object.fromEntries(circuitos.map((c) => [c, { pia: normaNum(`vivienda.${c}.pia`), seccion: normaNum(`vivienda.${c}.seccion`), tubo: normaNum(`vivienda.${c}.tubo`) }]));

/** Respuestas calculadas desde el motor y content/norma (nunca valores en el ítem ni en el código). */
export function calcula(c: { tipo: string; [k: string]: unknown }): number {
  const n = (k: string) => Number(c[k]);
  switch (c.tipo) {
    case 'bases_estancia': return basesEstancia(n('S'), reglasPuntos());
    case 'luz_estancia': return puntosLuzEstancia(n('S'), reglasPuntos());
    case 'diferenciales': return diferencialesNecesarios(n('circuitos'), normaNum('vivienda.regla.diferencial_cada_n_circuitos'));
    case 'intensidad': return intensidad(n('P'), normaNum('tension.monofasica'));
    case 'caida_pct': {
      const I = intensidad(n('P'), normaNum('tension.monofasica'));
      return caidaTension({ longitudM: n('L'), intensidadA: I, seccionMm2: n('S'), conductividad: normaNum('fisica.cobre.conductividad'), tensionV: normaNum('tension.monofasica') }).porcentaje;
    }
    case 'tubo_circuito': return normaNum(`vivienda.${String(c.c)}.tubo`);
    default: throw new Error(`Cálculo desconocido: ${c.tipo}`);
  }
}
