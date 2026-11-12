import { describe, expect, it } from 'vitest';
import { norma, normaNum } from '../data/content';
import { caidaTension, comprobarIbInIz, disparaDiferencial, intensidad, tiempoDisparo } from './circuito';
import { validaCuadro, type FilaTabla } from './cuadro';
import { basesEstancia, diferencialesNecesarios, puntosLuzEstancia, resumenVivienda, type ReglasPuntos } from './vivienda';

const reglas: ReglasPuntos = {
  baseCadaM2: normaNum('vivienda.regla.base_cada_m2'), basesMin: normaNum('vivienda.regla.bases_min'), luzDobleSobreM2: normaNum('vivienda.regla.luz_doble_sobre_m2'),
};

describe('circuito', () => {
  it('I = P/U', () => expect(intensidad(2300, 230)).toBeCloseTo(10));
  it('caída de tensión monofásica', () => {
    const r = caidaTension({ longitudM: 20, intensidadA: 10, seccionMm2: 2.5, conductividad: 56, tensionV: 230 });
    expect(r.voltios).toBeCloseTo(2.857, 2);
    expect(r.porcentaje).toBeCloseTo(1.242, 2);
  });
  it('IB ≤ In ≤ IZ', () => {
    expect(comprobarIbInIz({ ib: 10, in: 16, iz: 21 }).ok).toBe(true);
    expect(comprobarIbInIz({ ib: 18, in: 16, iz: 21 }).ok).toBe(false);
    expect(comprobarIbInIz({ ib: 10, in: 25, iz: 21 }).motivos[0]).toMatch(/no queda protegido/);
  });
  it('curva de disparo', () => {
    const c = { termicoK: 10, magneticoMin: 5, magneticoMax: 10 };
    expect(tiempoDisparo(10, 16, c)).toBeNull();
    expect(tiempoDisparo(32, 16, c)).toBeCloseTo(3.33, 1);
    expect(tiempoDisparo(160, 16, c)).toBe(0.01);
  });
  it('diferencial', () => { expect(disparaDiferencial(0.03, 0.03)).toBe(true); expect(disparaDiferencial(0.01, 0.03)).toBe(false); });
});

describe('vivienda de 70 m² (caso de referencia)', () => {
  const est = [{ nombre: 'Salón', superficie: 20 }, { nombre: 'Cocina', superficie: 8 }, { nombre: 'Baño', superficie: 4 }, { nombre: 'Dormitorio 1', superficie: 12 }, { nombre: 'Dormitorio 2', superficie: 9 }, { nombre: 'Vestíbulo', superficie: 3 }];
  it('bases y luz por estancia con las reglas de content/norma', () => {
    expect(basesEstancia(20, reglas)).toBe(4);
    expect(basesEstancia(8, reglas)).toBe(3);
    expect(puntosLuzEstancia(20, reglas)).toBe(2);
    expect(puntosLuzEstancia(9, reglas)).toBe(1);
    expect(resumenVivienda(est, reglas).find((e) => e.nombre === 'Dormitorio 1')).toMatchObject({ bases: 3, luz: 2 });
  });
  it('5 circuitos → 1 diferencial; 6 → 2', () => {
    const n = normaNum('vivienda.regla.diferencial_cada_n_circuitos');
    expect(diferencialesNecesarios(5, n)).toBe(1);
    expect(diferencialesNecesarios(6, n)).toBe(2);
  });
});

describe('validador de cuadro', () => {
  const tabla: Record<string, FilaTabla> = { C1: { pia: normaNum('vivienda.C1.pia'), seccion: normaNum('vivienda.C1.seccion'), tubo: normaNum('vivienda.C1.tubo') } };
  const cita = () => ({ doc: 'REBT', ref: 'ITC-BT-25 · Tabla 1' });
  it('acierta todo', () => expect(validaCuadro([{ circuito: 'C1', ...tabla.C1! }], tabla, cita)).toMatchObject({ aciertos: 3, total: 3, incumplimientos: [] }));
  it('explica y cita el fallo', () => {
    const r = validaCuadro([{ circuito: 'C1', pia: 25, seccion: tabla.C1!.seccion, tubo: tabla.C1!.tubo }], tabla, cita);
    expect(r.aciertos).toBe(2);
    expect(r.incumplimientos[0]).toMatchObject({ campo: 'pia', cita: { ref: 'ITC-BT-25 · Tabla 1' } });
  });
  it('toda la tabla de la vivienda viene de content y está sin verificar', () => {
    expect(norma.get('vivienda.C2.pia')?.verificado).toBe(false);
  });
});
