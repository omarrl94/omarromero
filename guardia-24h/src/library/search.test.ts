import { describe, expect, it } from 'vitest';
import { citaValida, construirIndice } from './search';

const docs = [{ id: 'm', titulo: 'Manual', tipo: 'manual' as const, estado: 'borrador' as const,
  secciones: [{ id: 'a', titulo: 'Tubos', texto: 'Diámetro de los tubos protectores' }, { id: 'b', titulo: 'Tierra', texto: 'Resistencia de la toma de tierra' }] }];

describe('biblioteca', () => {
  it('busca por texto completo sin acentos y por prefijo', () => {
    const { buscar } = construirIndice(docs);
    expect(buscar('diametro')[0]?.seccionId).toBe('a');
    expect(buscar('resist')[0]?.seccionId).toBe('b');
    expect(buscar('')).toEqual([]);
  });
  it('valida citas ignorando formato', () => {
    const v = [{ doc: 'REBT', ref: 'ITC-BT-25 · Tabla 1' }];
    expect(citaValida({ doc: 'rebt', ref: 'ITC-BT-25 Tabla 1' }, v)).toBe(true);
    expect(citaValida({ doc: 'REBT', ref: 'ITC-BT-24' }, v)).toBe(false);
  });
});
