import type { Item } from '../data/schemas';
import type { Respuesta } from '../data/repo';
import { citaValida, type Cita } from '../library/search';
import { validaCuadro, type Propuesta } from '../engine/cuadro';
import { calcula, tablaVivienda } from './calculos';
import { evaluaActa } from '../engine/acta';
import { evaluaEscenarios, type Cable } from '../engine/automatismo';
import { normaNum } from '../data/content';
import { peMaximo, peObtenido, redondea } from './grading';

export interface Entrada { opcion?: number; vf?: boolean; numero?: number; cita?: Cita | null; seleccion?: string[]; cables?: Cable[]; puntos?: { x: number; y: number }[]; campos?: Record<string, string>; acta?: Record<string, 'cumple' | 'no'>; dictamen?: 'apta' | 'no_apta'; dim?: Propuesta[]; pistas: number; seguridad?: boolean }

/** ¿Es correcta la parte de contenido de la respuesta (sin cita)? */
export function esCorrecta(item: Item, e: Entrada): boolean {
  const s = item.solucion as Record<string, unknown>;
  switch (item.tipo) {
    case 'instrumento':
    case 'opcion_multiple': return e.opcion === s.correcta;
    case 'verdadero_falso': return e.vf === s.correcta;
    case 'numerico': {
      const tol = typeof s.tolerancia === 'number' ? s.tolerancia : 0;
      const valor = s.calculo ? calcula(s.calculo as { tipo: string }) : Number(s.valor);
      return e.numero !== undefined && Math.abs(e.numero - valor) <= tol;
    }
    case 'plano':
    case 'formulario':
    case 'texto_errores':
    case 'automatismo':
    case 'acta':
    case 'dimensionado':
    case 'hotspots': return fraccion(item, e) === 1;
    case 'selector_cita': return Boolean(e.cita && citaValida(e.cita, item.citas_validas));
    default: return false;
  }
}

/** Plano de luminarias: cada zona exige una luminaria a menos de su radio; el exceso sobre el máximo resta. */
export function fraccionPlano(pl: NonNullable<Item['plano']>, puntos: { x: number; y: number }[]): number {
  const cubiertas = pl.zonas.filter((z) => puntos.some((p) => Math.hypot(p.x - z.x, p.y - z.y) <= z.r)).length;
  const exceso = Math.max(0, puntos.length - pl.maxPuntos);
  return pl.zonas.length ? Math.max(0, (cubiertas - exceso * 0.5) / pl.zonas.length) : 0;
}

/** Fracción de acierto para tipos con puntuación parcial; null si el tipo no es parcial. */
export function fraccion(item: Item, e: Entrada): number | null {
  if (item.tipo === 'plano' && item.plano) return fraccionPlano(item.plano, e.puntos ?? []);
  if (item.tipo === 'formulario' && item.formulario) {
    const cs = item.formulario.campos;
    const ok = cs.filter((c) => { const v = e.campos?.[c.id]; if (v === undefined || v === '') return false; return typeof c.correcta === 'number' ? Math.abs(Number(String(v).replace(',', '.')) - c.correcta) <= (c.tolerancia ?? 0) : v === c.correcta; }).length;
    return cs.length ? ok / cs.length : 0;
  }
  if (item.tipo === 'texto_errores' && item.texto) {
    const defectos = item.texto.fragmentos.filter((x) => x.defecto), sel = new Set(e.seleccion ?? []);
    const hits = defectos.filter((x) => sel.has(x.id)).length, falsos = [...sel].filter((id) => !defectos.some((x) => x.id === id)).length;
    return defectos.length ? Math.max(0, (hits - falsos) / defectos.length) : 0;
  }
  if (item.tipo === 'hotspots') {
    const els = item.escena?.elementos ?? [];
    const defectos = els.filter((x) => x.defecto), sel = new Set(e.seleccion ?? []);
    const hits = defectos.filter((x) => sel.has(x.id)).length, falsos = [...sel].filter((id) => !defectos.some((x) => x.id === id)).length;
    return defectos.length ? Math.max(0, (hits - falsos) / defectos.length) : 0;
  }
  if (item.tipo === 'automatismo' && item.automatismo) return evaluaEscenarios(item.automatismo.componentes, [...item.automatismo.cablesFijos, ...(e.cables ?? [])], item.automatismo.escenarios).fraccion;
  if (item.tipo === 'acta') return evaluaActa(item.pruebas ?? [], e.acta ?? {}, e.dictamen, normaNum).fraccion;
  if (item.tipo === 'dimensionado') {
    const circ = ((item.solucion as { circuitos?: string[] }).circuitos ?? []);
    const r = validaCuadro(e.dim ?? [], tablaVivienda(circ), () => ({ doc: 'REBT', ref: '' }));
    const total = circ.length * 3;
    return total ? r.aciertos / total : 0;
  }
  return null;
}

export function evalua(item: Item, e: Entrada, ts = Date.now()): Respuesta {
  const citaOk = Boolean(e.cita && citaValida(e.cita, item.citas_validas));
  const correct = esCorrecta(item, e);
  const peMax = peMaximo(item);
  const fr = fraccion(item, e);
  const pe = redondea(
    peObtenido({
      peMax, correcta: fr === null ? correct : fr > 0, requiereCita: item.requiere_cita && item.tipo !== 'selector_cita',
      citaOk, pistas: e.pistas, errorSeguridad: Boolean(e.seguridad),
    }) * (fr ?? 1), 4);
  return {
    item_id: item.id, distrito: item.distrito, nivel: item.nivel, ra: item.ra, ce: item.ce,
    correct, cite_ok: citaOk, hint_used: e.pistas, pe_obtained: pe, pe_max: peMax, seguridad: Boolean(e.seguridad), ts,
  };
}
