import { describe, expect, it } from 'vitest';
import type { Respuesta } from '../data/repo';
import type { Item } from '../data/schemas';
import { evalua } from './evaluar';
import { estadoNivel, mejoresPorItem, nivelAbierto, notasPorRa, seleccionaItems } from './progreso';

const item = (id: string, nivel = 3, ra = ['RA1'], extra: Partial<Item> = {}): Item => ({
  id, estado: 'borrador', distrito: 1, ra, ce: [], nivel, tipo: 'opcion_multiple', dificultad: 1, pe_base: 2,
  enunciado: '?', opciones: ['a', 'b'], solucion: { correcta: 1 }, requiere_cita: false, citas_validas: [{ doc: 'REBT', ref: 'ITC-BT-21' }],
  pistas: ['p'], explicacion: '', fuente: { documento: 'REBT', ref: 'x' }, verificado: false, ...extra,
});
const pesos = { RA1: 1 };
const run = (rs: Respuesta[], its: Item[]) => notasPorRa(rs, its, ['RA1'], {}, 0.4, pesos);

describe('evaluación de ítems', () => {
  it('acierto, fallo y pista', () => {
    const i = item('a');
    expect(evalua(i, { opcion: 1, pistas: 0 }).pe_obtained).toBe(2);
    expect(evalua(i, { opcion: 1, pistas: 1 }).pe_obtained).toBe(1.6);
    expect(evalua(i, { opcion: 0, pistas: 0 }).pe_obtained).toBe(0);
  });
  it('con cita requerida: 100 % / 70 % / 0 %', () => {
    const i = item('c', 3, ['RA1'], { requiere_cita: true });
    const cita = { doc: 'REBT', ref: 'ITC-BT-21' };
    expect(evalua(i, { opcion: 1, cita, pistas: 0 }).pe_obtained).toBe(2);
    expect(evalua(i, { opcion: 1, pistas: 0 }).pe_obtained).toBe(1.4);
    expect(evalua(i, { opcion: 0, cita, pistas: 0 }).pe_obtained).toBe(0);
  });
  it('selector_cita puntúa solo por la cita', () => {
    const i = item('s', 3, ['RA1'], { tipo: 'selector_cita', requiere_cita: true, solucion: {} });
    expect(evalua(i, { cita: { doc: 'REBT', ref: 'ITC-BT-21' }, pistas: 0 }).pe_obtained).toBe(2);
    expect(evalua(i, { cita: { doc: 'REBT', ref: 'ITC-BT-24' }, pistas: 0 }).pe_obtained).toBe(0);
  });
  it('numérico con tolerancia', () => {
    const i = item('n', 3, ['RA1'], { tipo: 'numerico', solucion: { valor: 10, tolerancia: 0.1 } });
    expect(evalua(i, { numero: 10.05, pistas: 0 }).correct).toBe(true);
    expect(evalua(i, { numero: 10.5, pistas: 0 }).correct).toBe(false);
  });
});

describe('progreso y notas', () => {
  it('mejor intento por ítem: la nota nunca baja', () => {
    const i = item('a');
    const bueno = evalua(i, { opcion: 1, pistas: 0 }), malo = evalua(i, { opcion: 0, pistas: 0 });
    expect(mejoresPorItem([bueno, malo]).get('a')?.pe_obtained).toBe(2);
  });
  it('RA con denominador de todos los ítems y cobertura', () => {
    const its = [item('a'), item('b'), item('c'), item('d'), item('e')];
    const rs = ['a', 'b', 'c', 'd'].map((id) => evalua(its.find((x) => x.id === id)!, { opcion: 1, pistas: 0 }));
    const r = run(rs, its);
    expect(r.detalle[0]).toMatchObject({ juego: 8, cobertura: 0.8, adquirido: true });
    expect(r.global.final).toBe(8);
  });
  it('cobertura < 80 % no adquiere el RA', () => {
    const its = [item('a'), item('b')];
    const r = run([evalua(its[0]!, { opcion: 1, pistas: 0 })], its);
    expect(r.detalle[0]?.adquirido).toBe(false);
    expect(r.global.aprobado).toBe(false);
  });
  it('niveles: 3 intentos, superado ≥ 50 %, apertura secuencial', () => {
    const at = (pe: number) => ({ distrito: 1, nivel: 1, seed: 's', pe_obtained: pe, pe_max: 10, lives_lost: 0, consult_count: 0, time_s: 1, ts: 0 });
    expect(estadoNivel([at(4)], 1, 1)).toMatchObject({ superado: false, bloqueadoPorIntentos: false });
    expect(estadoNivel([at(4), at(5)], 1, 1).superado).toBe(true);
    expect(estadoNivel([at(1), at(1), at(1)], 1, 1).bloqueadoPorIntentos).toBe(true);
    expect(estadoNivel([at(1), at(1), at(1)], 1, 1, 1).bloqueadoPorIntentos).toBe(false);
    expect(nivelAbierto([], 1, 2)).toBe(false);
    expect(nivelAbierto([at(6)], 1, 2)).toBe(true);
  });
  it('selección determinista por semilla y prioriza ítems no vistos', () => {
    const banco = Array.from({ length: 12 }, (_, k) => item(`i${k}`));
    expect(seleccionaItems(banco, new Set(), 'x').map((i) => i.id)).toEqual(seleccionaItems(banco, new Set(), 'x').map((i) => i.id));
    const vistos = new Set(banco.slice(0, 5).map((i) => i.id));
    const sel = seleccionaItems(banco, vistos, 'y', 7);
    expect(sel.every((i) => !vistos.has(i.id))).toBe(true);
  });
});

import { items as contenido } from '../data/content';

describe('tipos nuevos con contenido real', () => {
  const por = (id: string) => contenido.find((i) => i.id === id)!;
  it('numérico con cálculo desde el motor y la norma', () => {
    const it = contenido.find((i) => (i.solucion as { calculo?: { tipo: string; S: number } }).calculo?.tipo === 'bases_estancia' && (i.solucion as { calculo: { S: number } }).calculo.S === 20)!;
    expect(evalua(it, { numero: 4, pistas: 0, cita: { doc: 'REBT', ref: 'ITC-BT-25' } }).pe_obtained).toBeGreaterThan(0);
    expect(evalua(it, { numero: 3, pistas: 0 }).pe_obtained).toBe(0);
  });
  it('dimensionado: puntuación parcial por campo acertado', () => {
    const it = por('d3-n3-0001');
    const ok = evalua(it, { dim: [{ circuito: 'C1', pia: 10, seccion: 1.5, tubo: 16 }], pistas: 0 });
    expect(ok.pe_obtained).toBe(ok.pe_max);
    const parcial = evalua(it, { dim: [{ circuito: 'C1', pia: 10, seccion: 1.5, tubo: 99 }], pistas: 0 });
    expect(parcial.pe_obtained).toBeCloseTo((ok.pe_max * 2) / 3, 3);
  });
  it('hotspots: aciertos suman, falsos positivos restan', () => {
    const it = por('d4-n3-0001');
    const def = it.escena!.elementos.filter((x) => x.defecto).map((x) => x.id);
    const bueno = it.escena!.elementos.find((x) => !x.defecto)!.id;
    const todo = evalua(it, { seleccion: def, pistas: 0 });
    expect(todo.pe_obtained).toBe(todo.pe_max);
    const con1falso = evalua(it, { seleccion: [...def, bueno], pistas: 0 });
    expect(con1falso.pe_obtained).toBeCloseTo(todo.pe_max * (1 - 1 / def.length), 3);
    expect(evalua(it, { seleccion: [], pistas: 0 }).pe_obtained).toBe(0);
  });
});

describe('Fase 3: instrumento y acta con contenido real', () => {
  const por = (id: string) => contenido.find((i) => i.id === id)!;
  it('acta: dictamen correcto da el 100 %; dictamen erróneo, parcial', () => {
    const it = por('d7-n3-0002'); // aislamiento 0,2 MΩ → no cumple → NO APTA
    const bien = evalua(it, { acta: { ais: 'no', tie: 'cumple', dif: 'cumple' }, dictamen: 'no_apta', pistas: 0 });
    expect(bien.pe_obtained).toBe(bien.pe_max);
    const mal = evalua(it, { acta: { ais: 'cumple', tie: 'cumple', dif: 'cumple' }, dictamen: 'apta', pistas: 0 });
    expect(mal.pe_obtained).toBeCloseTo((bien.pe_max * 2) / 4, 3);
  });
  it('instrumento: diagnóstico correcto puntúa; error de seguridad deja el ítem a 0', () => {
    const it = por('d7-n2-0001');
    expect(evalua(it, { opcion: 0, pistas: 0 }).pe_obtained).toBeGreaterThan(0);
    expect(evalua(it, { opcion: 0, pistas: 0, seguridad: true }).pe_obtained).toBe(0);
  });
  it('numérico de tubo sale de la norma de la vivienda', () => {
    const it = contenido.find((i) => (i.solucion as { calculo?: { tipo: string; c: string } }).calculo?.c === 'C3')!;
    expect(evalua(it, { numero: 25, pistas: 0, cita: { doc: 'REBT', ref: 'ITC-BT-21' } }).pe_obtained).toBeGreaterThan(0);
  });
});
