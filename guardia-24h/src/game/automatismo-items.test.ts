import { describe, expect, it } from 'vitest';
import { items } from '../data/content';
import { evalua } from './evaluar';

const autos = items.filter((i) => i.tipo === 'automatismo');

describe('ítems de automatismos (bloque 6)', () => {
  it('hay ítems de cableado de N3 a N5', () => {
    expect(autos.length).toBeGreaterThanOrEqual(7);
    expect(new Set(autos.map((i) => i.nivel))).toEqual(new Set([3, 4, 5]));
  });
  it.each(autos.map((i) => [i.id, i] as const))('%s: el cableado de referencia puntúa el 100 %%', (_id, item) => {
    const cables = (item.solucion as { cables: [string, string][] }).cables;
    const r = evalua(item, { cables, pistas: 0 });
    expect(r.pe_obtained).toBe(r.pe_max);
  });
  it.each(autos.map((i) => [i.id, i] as const))('%s: sin cables no puntúa', (_id, item) => {
    expect(evalua(item, { cables: [], pistas: 0 }).pe_obtained).toBe(0);
  });
});
