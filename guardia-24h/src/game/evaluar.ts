import type { Item } from '../data/schemas';
import type { Respuesta } from '../data/repo';
import { citaValida, type Cita } from '../library/search';
import { peMaximo, peObtenido } from './grading';

export interface Entrada { opcion?: number; vf?: boolean; numero?: number; cita?: Cita | null; pistas: number; seguridad?: boolean }

/** ¿Es correcta la parte de contenido de la respuesta (sin cita)? */
export function esCorrecta(item: Item, e: Entrada): boolean {
  const s = item.solucion as Record<string, unknown>;
  switch (item.tipo) {
    case 'opcion_multiple': return e.opcion === s.correcta;
    case 'verdadero_falso': return e.vf === s.correcta;
    case 'numerico': {
      const tol = typeof s.tolerancia === 'number' ? s.tolerancia : 0;
      return e.numero !== undefined && Math.abs(e.numero - Number(s.valor)) <= tol;
    }
    case 'selector_cita': return Boolean(e.cita && citaValida(e.cita, item.citas_validas));
    default: return false;
  }
}

export function evalua(item: Item, e: Entrada, ts = Date.now()): Respuesta {
  const citaOk = Boolean(e.cita && citaValida(e.cita, item.citas_validas));
  const correct = esCorrecta(item, e);
  const peMax = peMaximo(item);
  const pe = peObtenido({
    peMax, correcta: correct, requiereCita: item.requiere_cita && item.tipo !== 'selector_cita',
    citaOk, pistas: e.pistas, errorSeguridad: Boolean(e.seguridad),
  });
  return {
    item_id: item.id, distrito: item.distrito, nivel: item.nivel, ra: item.ra, ce: item.ce,
    correct, cite_ok: citaOk, hint_used: e.pistas, pe_obtained: pe, pe_max: peMax, seguridad: Boolean(e.seguridad), ts,
  };
}
