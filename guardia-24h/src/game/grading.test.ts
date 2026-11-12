import { describe, expect, it } from 'vitest';
import {
  cobertura, nivelSuperado, notaFinal, peMaximo, peObtenido, penalizacionSeguridad, raFinal, raJuego,
} from './grading';

const base = { peMax: 3, correcta: true, requiereCita: true, citaOk: true, pistas: 0, errorSeguridad: false };

describe('PE de ítem', () => {
  it('pe_base × dificultad × factor de nivel', () => {
    expect(peMaximo({ pe_base: 2, dificultad: 1.5, nivel: 3 })).toBe(3);
    expect(peMaximo({ pe_base: 2, dificultad: 2, nivel: 5 })).toBe(6);
    expect(peMaximo({ pe_base: 2, dificultad: 1, nivel: 1 })).toBe(1);
  });
  it('cita correcta = 100 %, sin cita = 70 %, cita buena con respuesta mala = 0', () => {
    expect(peObtenido(base)).toBe(3);
    expect(peObtenido({ ...base, citaOk: false })).toBe(2.1);
    expect(peObtenido({ ...base, correcta: false })).toBe(0);
  });
  it('cada pista resta el 20 % del PE del ítem', () => {
    expect(peObtenido({ ...base, pistas: 1 })).toBe(2.4);
    expect(peObtenido({ ...base, pistas: 2 })).toBe(1.8);
    expect(peObtenido({ ...base, pistas: 9 })).toBe(0);
  });
  it('error de seguridad grave deja el ítem a 0', () => {
    expect(peObtenido({ ...base, errorSeguridad: true })).toBe(0);
  });
  it('penalización de seguridad: 10 % por error, tope 30 %', () => {
    expect(penalizacionSeguridad(1, 20)).toBe(2);
    expect(penalizacionSeguridad(2, 20)).toBe(4);
    expect(penalizacionSeguridad(7, 20)).toBe(6);
  });
});

describe('Nota por RA y final', () => {
  const items = [
    { ra: ['RA1'], peObtenido: 3, peMax: 4 },
    { ra: ['RA1', 'RA2'], peObtenido: 1, peMax: 4 },
  ];
  it('RA_juego = ΣPE obtenidos / ΣPE máx × 10 con ítems multietiqueta', () => {
    expect(raJuego(items, 'RA1')).toBe(5);
    expect(raJuego(items, 'RA2')).toBe(2.5);
    expect(raJuego(items, 'RA3')).toBeNull();
  });
  it('RA_final = a·juego + (1−a)·taller; sin taller = juego', () => {
    expect(raFinal(5, 8, 0.4)).toEqual({ nota: 6.8, sinTaller: false });
    expect(raFinal(5, null, 0.4)).toEqual({ nota: 5, sinTaller: true });
  });
  it('cobertura', () => {
    expect(cobertura(8, 10)).toBe(0.8);
  });
  const pesos = { RA1: 0.5, RA2: 0.5 };
  it('nota final = Σ RA × peso', () => {
    const r = notaFinal([{ ra: 'RA1', nota: 8, cobertura: 1 }, { ra: 'RA2', nota: 6, cobertura: 1 }], pesos);
    expect(r).toEqual({ final: 7, aprobado: true, pendientes: [] });
  });
  it('un RA < 5 deja el módulo pendiente aunque la media supere 5', () => {
    const r = notaFinal([{ ra: 'RA1', nota: 10, cobertura: 1 }, { ra: 'RA2', nota: 4, cobertura: 1 }], pesos);
    expect(r.final).toBe(7);
    expect(r.aprobado).toBe(false);
    expect(r.pendientes).toEqual(['RA2']);
  });
  it('cobertura < 80 % impide adquirir el RA', () => {
    const r = notaFinal([{ ra: 'RA1', nota: 9, cobertura: 0.7 }], { RA1: 1 });
    expect(r.aprobado).toBe(false);
  });
  it('nivel superado con ≥ 50 % de PE', () => {
    expect(nivelSuperado(5, 10)).toBe(true);
    expect(nivelSuperado(4.9, 10)).toBe(false);
  });
});
