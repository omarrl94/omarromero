import { describe, expect, it } from 'vitest';
import { items } from '../data/content';
import type { Intento, Respuesta } from '../data';
import { evalua } from './evaluar';
import { LOGROS, efectoIntento, nuevosLogros } from './logros';
import { CRITERIOS_RUBRICA, notaRubrica, overridesVacios } from './datos';

const at = (d: number, n: number, pe: number): Intento => ({ distrito: d, nivel: n, seed: 's', pe_obtained: pe, pe_max: 10, lives_lost: 0, consult_count: 0, time_s: 60, ts: 0 });

describe('capa de juego', () => {
  it('primera intervención y bloque completado', () => {
    const ctx = { respuestas: [] as Respuesta[], intentos: [1, 2, 3, 4, 5].map((n) => at(1, n, 8)), items, teoriaLeida: 0 };
    const ids = nuevosLogros(ctx, []).map((l) => l.id);
    expect(ids).toContain('primera');
    expect(ids).toContain('bloque');
    expect(nuevosLogros(ctx, ['primera', 'bloque']).map((l) => l.id)).not.toContain('primera');
  });
  it('detective: cuadro completo sin pistas', () => {
    const it = items.find((i) => i.tipo === 'hotspots')!;
    const def = it.escena!.elementos.filter((e) => e.defecto).map((e) => e.id);
    const r = evalua(it, { seleccion: def, pistas: 0 });
    expect(nuevosLogros({ respuestas: [r], intentos: [], items, teoriaLeida: 0 }, []).map((l) => l.id)).toContain('detective');
  });
  it('cero accidentes se pierde con un error de seguridad', () => {
    const it = items.find((i) => i.tipo === 'instrumento')!;
    const r = evalua(it, { opcion: 0, pistas: 0, seguridad: true });
    const ctx = { respuestas: [r], intentos: [at(1, 1, 8), at(1, 2, 8), at(1, 3, 8)], items, teoriaLeida: 0 };
    expect(nuevosLogros(ctx, []).map((l) => l.id)).not.toContain('cero-accidentes');
    expect(LOGROS.length).toBeGreaterThanOrEqual(9);
  });
  it('dinero y reputación: aprobar suma, fallar y accidentes restan', () => {
    expect(efectoIntento(8, 10, 0)).toEqual({ dinero: 24, reputacion: 2 });
    expect(efectoIntento(2, 10, 0)).toEqual({ dinero: 0, reputacion: -1 });
    expect(efectoIntento(8, 10, 2).reputacion).toBe(-6);
  });
  it('rúbrica RA9: media de excelente/adecuado/a reforzar', () => {
    const o = overridesVacios();
    expect(notaRubrica(o)).toBeNull();
    o.rubrica['1'] = { [CRITERIOS_RUBRICA[0]]: 'excelente', [CRITERIOS_RUBRICA[1]]: 'reforzar' };
    expect(notaRubrica(o)).toBe(7);
  });
});
