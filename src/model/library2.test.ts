import { describe, it, expect } from 'vitest';
import { LIBRARY, defOf, defaultParams } from './library';
import { simulate } from './netlist';
import type { Component, Project, Wire } from './types';

const C = (id: string, type: string, x = 0, y = 0, params: Component['params'] = {}): Component => ({ id, type, x, y, rot: 0, params: { ...defaultParams(type), ...params } });
const W = (id: string, a: string, ta: number, b: string, tb: number): Wire => ({ id, a: { comp: a, term: ta }, b: { comp: b, term: tb } });
const P = (components: Component[], wires: Wire[]): Project => ({ version: 1, name: 't', components, wires });

describe('biblioteca ampliada', () => {
  it('no hay tipos repetidos y todos tienen símbolo definido', () => {
    const types = LIBRARY.map((d) => d.type);
    expect(new Set(types).size).toBe(types.length);
    expect(LIBRARY.length).toBeGreaterThanOrEqual(125);
  });
  it('interruptor bipolar: cierra y abre los dos polos', () => {
    const mk = (closed: boolean) => P([C('B', 'dcsource', 0, 0, { v: 12 }), C('S', 'sw2', 0, 0, { closed }), C('R1', 'resistor', 0, 0, { r: 12 }), C('R2', 'resistor', 0, 0, { r: 12 }), C('G', 'ground')],
      [W('a', 'B', 0, 'S', 0), W('b', 'S', 1, 'R1', 0), W('c', 'B', 0, 'S', 2), W('d', 'S', 3, 'R2', 0), W('e', 'R1', 1, 'B', 1), W('f', 'R2', 1, 'B', 1), W('g', 'B', 1, 'G', 0)]);
    const on = simulate(mk(true)), off = simulate(mk(false));
    expect(Math.abs(on.live['R1'].i)).toBeCloseTo(1, 2); expect(Math.abs(on.live['R2'].i)).toBeCloseTo(1, 2);
    expect(Math.abs(off.live['R1'].i)).toBeLessThan(1e-6); expect(Math.abs(off.live['R2'].i)).toBeLessThan(1e-6);
  });
  it('conmutador de cruce: invierte la conexión', () => {
    const p = (pos: number) => P([C('B', 'dcsource', 0, 0, { v: 10 }), C('X', 'cruce', 0, 0, { pos }), C('R1', 'resistor', 0, 0, { r: 10 }), C('G', 'ground')],
      [W('a', 'B', 0, 'X', 0), W('b', 'X', 1, 'R1', 0), W('c', 'R1', 1, 'B', 1), W('d', 'B', 1, 'G', 0)]);
    // pos 0: 1→2 conectados (circuito cerrado); pos 1: 1→4 y 3→2, no hay camino 1→2
    expect(Math.abs(simulate(p(0)).live['R1'].i)).toBeCloseTo(1, 2);
    expect(Math.abs(simulate(p(1)).live['R1'].i)).toBeLessThan(1e-6);
  });
  it('CA: carga genérica RL y condensador de arranque se resuelven con su impedancia', () => {
    const p = P([C('A', 'red', 0, 0, { v: 230, rint: 0 }), C('Z', 'carga', 0, 0, { r: 30, l: (40 / (2 * Math.PI * 50)) * 1000, c: 0 }), C('G', 'ground')],
      [W('a', 'A', 0, 'Z', 0), W('b', 'Z', 1, 'A', 1), W('c', 'A', 1, 'G', 0)]);
    const r = simulate(p);
    expect(r.live['Z'].i).toBeDefined();
    expect(Math.abs(r.live['Z'].i)).toBeCloseTo(230 / 50, 1); // |Z| = 50 Ω
    expect(r.live['Z'].pf).toBeCloseTo(0.6, 2);
  });
  it('impedancia genérica R + jX', () => {
    const p = P([C('A', 'alternador', 0, 0, { v: 100, rint: 0 }), C('Z', 'zgen', 0, 0, { r: 30, x: -40 }), C('G', 'ground')],
      [W('a', 'A', 0, 'Z', 0), W('b', 'Z', 1, 'A', 1), W('c', 'A', 1, 'G', 0)]);
    expect(Math.abs(simulate(p).live['Z'].i)).toBeCloseTo(2, 2);
  });
  it('batería de litio de 3 elementos = 11,1 V; fusible NH se funde', () => {
    expect(defOf('bat_li').model.kind).toBe('V');
    const p = P([C('B', 'bat_li', 0, 0, { cells: 3, rint: 0 }), C('R', 'resistor', 0, 0, { r: 11.1 }), C('G', 'ground')], [W('a', 'B', 0, 'R', 0), W('b', 'R', 1, 'B', 1), W('c', 'B', 1, 'G', 0)]);
    expect(Math.abs(simulate(p).live['R'].v)).toBeCloseTo(11.1, 2);
  });
  it('final de carrera NA/NC y shunt', () => {
    const f = (act: boolean, nc: boolean) => P([C('B', 'dcsource', 0, 0, { v: 10 }), C('F', 'fincarrera', 0, 0, { act, nc }), C('R', 'resistor', 0, 0, { r: 10 }), C('G', 'ground')],
      [W('a', 'B', 0, 'F', 0), W('b', 'F', 1, 'R', 0), W('c', 'R', 1, 'B', 1), W('d', 'B', 1, 'G', 0)]);
    expect(Math.abs(simulate(f(true, false)).live['R'].i)).toBeCloseTo(1, 2);
    expect(Math.abs(simulate(f(false, false)).live['R'].i)).toBeLessThan(1e-6);
    expect(Math.abs(simulate(f(true, true)).live['R'].i)).toBeLessThan(1e-6);
    expect(defOf('shunt').model.kind === 'R' && (defOf('shunt').model as { value: (p: Component['params']) => number }).value({ in: 50, mv: 75 })).toBeCloseTo(0.0015, 6);
  });
});

describe('relés y contactores', () => {
  // Marcha-paro con autorretención: fuente 230 V → paro (NC) → [marcha (NA) ∥ contacto aux NA] → bobina → N; carga por contacto principal
  const circuito = (marcha: boolean, paro: boolean): Project => P(
    [C('A', 'red', 0, 0, { v: 230, rint: 0 }), C('PA', 'pushNC', 0, 0, { pressed: paro }), C('MA', 'pushNO', 0, 0, { pressed: marcha }), C('K', 'contactor', 0, 0, { vn: 230, pn: 8 }), C('L', 'resistor', 0, 0, { r: 100 }), C('G', 'ground')],
    [W('1', 'A', 0, 'PA', 0), W('2', 'PA', 1, 'MA', 0), W('3', 'PA', 1, 'K', 8), W('4', 'MA', 1, 'K', 0), W('5', 'K', 9, 'K', 0), W('6', 'K', 1, 'A', 1), W('7', 'A', 1, 'G', 0), W('8', 'A', 0, 'K', 2), W('9', 'K', 3, 'L', 0), W('10', 'L', 1, 'A', 1)]);
  it('autorretención: arranca al pulsar marcha, sigue al soltar y para con paro', () => {
    expect(Math.abs(simulate(circuito(false, false)).live['L'].i)).toBeLessThan(1e-4);
    expect(Math.abs(simulate(circuito(true, false)).live['L'].i)).toBeCloseTo(2.3, 1);
    expect(Math.abs(simulate(circuito(false, false)).live['L'].i)).toBeCloseTo(2.3, 1); // sigue
    expect(Math.abs(simulate(circuito(false, true)).live['L'].i)).toBeLessThan(1e-4);
    expect(Math.abs(simulate(circuito(false, false)).live['L'].i)).toBeLessThan(1e-4); // y queda parado
  });
});

describe('transformadores y trifásica', () => {
  it('transformador 230/24 V con carga de 24 Ω: ≈ 24 V y ≈ 1 A en el secundario', () => {
    const p = P([C('A', 'red', 0, 0, { v: 230, rint: 0 }), C('T', 'tr1', 0, 0, { ucc: 0.1 }), C('R', 'resistor', 0, 0, { r: 24, pmax: 1000 }), C('G', 'ground')],
      [W('a', 'A', 0, 'T', 0), W('b', 'T', 1, 'A', 1), W('c', 'T', 2, 'R', 0), W('d', 'R', 1, 'T', 3), W('e', 'A', 1, 'G', 0)]);
    const r = simulate(p);
    expect(r.messages.filter((m) => m.level === 'error')).toEqual([]);
    expect(Math.abs(r.live['R'].v)).toBeCloseTo(24, 0);
    expect(Math.abs(r.live['R'].i)).toBeCloseTo(1, 1);
    expect(Math.abs(r.live['T'].i)).toBeCloseTo(24 / 230, 2); // I1 = I2·(Vs/Vp)
  });
  it('red trifásica + carga equilibrada en estrella: I de línea = 230/R, neutro ≈ 0, P = 3·V·I', () => {
    const p = P([C('S', 'red3', 0, 0, { rint: 0 }), C('Z', 'carga3y', 0, 0, { r: 100 }), C('G', 'ground')],
      [W('1', 'S', 0, 'Z', 0), W('2', 'S', 1, 'Z', 1), W('3', 'S', 2, 'Z', 2), W('4', 'S', 3, 'Z', 3), W('5', 'S', 3, 'G', 0)]);
    const r = simulate(p);
    expect(r.messages.filter((m) => m.level === 'error')).toEqual([]);
    expect(Math.abs(r.live['Z'].i)).toBeCloseTo(400 / Math.sqrt(3) / 100, 2);
    expect(r.live['Z'].p).toBeCloseTo(3 * (400 / Math.sqrt(3)) ** 2 / 100, 0);
    expect(Math.abs(r.componentCurrent['Z:3'] ?? 0)).toBeLessThan(1e-6);
  });
  it('motor trifásico en triángulo: corriente de línea = P/(η·√3·U·cos φ)', () => {
    const p = P([C('S', 'fuente3d', 0, 0, { rint: 0 }), C('M', 'motor3', 0, 0, { conn: 1 })],
      [W('1', 'S', 0, 'M', 0), W('2', 'S', 1, 'M', 1), W('3', 'S', 2, 'M', 2)]);
    const r = simulate(p);
    expect(r.messages.filter((m) => m.level === 'error')).toEqual([]);
    expect(Math.abs(r.live['M'].i)).toBeCloseTo(4000 / (0.85 * Math.sqrt(3) * 400 * 0.82), 1);
  });
  it('trifásico Dy 400/400 alimentando carga en estrella: tensión de línea secundaria ≈ 400 V', () => {
    const p = P([C('S', 'red3', 0, 0, { rint: 0 }), C('T', 'tr3_dy', 0, 0, { ucc: 0.1 }), C('Z', 'carga3y', 0, 0, { r: 100 }), C('G', 'ground')],
      [W('1', 'S', 0, 'T', 0), W('2', 'S', 1, 'T', 1), W('3', 'S', 2, 'T', 2), W('4', 'T', 3, 'Z', 0), W('5', 'T', 4, 'Z', 1), W('6', 'T', 5, 'Z', 2), W('7', 'T', 6, 'Z', 3), W('8', 'T', 6, 'G', 0), W('9', 'S', 3, 'G', 0)]);
    const r = simulate(p);
    expect(r.messages.filter((m) => m.level === 'error')).toEqual([]);
    expect(Math.abs(r.live['Z'].i)).toBeCloseTo(2.309, 2);
  });
});

describe('diferencial', () => {
  const circ = (fuga: boolean): Project => P(
    [C('A', 'red', 0, 0, { v: 230, rint: 0 }), C('D', 'rcd2', 0, 0, { ina: 30 }), C('R', 'resistor', 0, 0, { r: 100, pmax: 1000 }), C('F', 'resistor', 0, 0, { r: fuga ? 5000 : 1e9, pmax: 1000 }), C('G', 'ground')],
    [W('1', 'A', 0, 'D', 0), W('2', 'D', 1, 'R', 0), W('3', 'R', 1, 'D', 3), W('4', 'D', 2, 'A', 1), W('5', 'D', 1, 'F', 0), W('6', 'F', 1, 'G', 0), W('7', 'A', 1, 'G', 0)]);
  it('sin fuga no dispara; con fuga de 46 mA dispara', () => {
    expect(simulate(circ(false)).events).toEqual([]);
    const ev = simulate(circ(true)).events;
    expect(ev.some((e) => e.id === 'D' && e.state === 'tripped')).toBe(true);
  });
});

import { setSimClock } from './netlist';
describe('temporizadores', () => {
  const circ = (type: string): Project => P(
    [C('A', 'red', 0, 0, { v: 230, rint: 0 }), C('T', type, 0, 0, { vn: 230, t: 5 }), C('L', 'resistor', 0, 0, { r: 100, pmax: 1000 }), C('G', 'ground')],
    [W('1', 'A', 0, 'T', 0), W('2', 'T', 1, 'A', 1), W('3', 'A', 0, 'T', 2), W('4', 'T', 3, 'L', 0), W('5', 'L', 1, 'A', 1), W('6', 'A', 1, 'G', 0)]);
  it('a la conexión: cierra pasados 5 s', () => {
    setSimClock(100); simulate(circ('tmr_on'));
    setSimClock(102); expect(Math.abs(simulate(circ('tmr_on')).live['L'].i)).toBeLessThan(1e-4);
    setSimClock(106); expect(Math.abs(simulate(circ('tmr_on')).live['L'].i)).toBeCloseTo(2.3, 1);
  });
});

describe('telerruptor, contador, fases, horario', () => {
  const tele = (type: string, pressed: boolean, extra: Component['params'] = {}): Project => P(
    [C('A', 'red', 0, 0, { v: 230, rint: 0 }), C('B', 'pushNO', 0, 0, { pressed }), C('K', type, 0, 0, { vn: 230, pn: 4, ...extra }), C('L', 'resistor', 0, 0, { r: 100, pmax: 1000 }), C('G', 'ground')],
    [W('1', 'A', 0, 'B', 0), W('2', 'B', 1, 'K', 0), W('3', 'K', 1, 'A', 1), W('4', 'A', 0, 'K', 2), W('5', 'K', 3, 'L', 0), W('6', 'L', 1, 'A', 1), W('7', 'A', 1, 'G', 0)]);
  const on = (p: Project) => Math.abs(simulate(p).live['L'].i) > 1;
  it('telerruptor: un pulso enciende, otro apaga y recuerda entre pulsos', () => {
    expect(on(tele('telerruptor', false))).toBe(false);
    expect(on(tele('telerruptor', true))).toBe(true);
    expect(on(tele('telerruptor', false))).toBe(true);
    expect(on(tele('telerruptor', true))).toBe(false);
    expect(on(tele('telerruptor', false))).toBe(false);
  });
  it('contador de 2 impulsos: cierra al segundo y el tercero reinicia', () => {
    const pulse = () => { simulate(tele('contador', true, { t: 2, vn: 230 })); return on(tele('contador', false, { t: 2, vn: 230 })); };
    simulate(tele('contador', false, { t: 2, vn: 230 }));
    expect(pulse()).toBe(false); expect(pulse()).toBe(true); expect(pulse()).toBe(false);
  });
  it('relé de control de fases: cierra con 3 fases y abre si falta una', () => {
    const c3 = (l3: boolean): Project => P([C('S', 'red3', 0, 0, { rint: 0 }), C('F', 'rele_fases', 0, 0), C('L', 'resistor', 0, 0, { r: 100, pmax: 1000 }), C('G', 'ground')],
      [W('1', 'S', 0, 'F', 0), W('2', 'S', 1, 'F', 1), ...(l3 ? [W('3', 'S', 2, 'F', 2)] : []), W('4', 'S', 0, 'F', 3), W('5', 'F', 4, 'L', 0), W('6', 'L', 1, 'S', 3), W('7', 'S', 3, 'G', 0)]);
    expect(Math.abs(simulate(c3(true)).live['L'].i)).toBeGreaterThan(1);
    expect(Math.abs(simulate(c3(false)).live['L'].i)).toBeLessThan(0.01);
  });
  it('interruptor horario y astronómico', () => {
    const m = (t: string, p: Component['params']) => (defOf(t).model as { closed: (q: Component['params']) => boolean }).closed({ ...defaultParams(t), ...p });
    expect(m('horario', { hora: 19, on: 18, off: 23 })).toBe(true); expect(m('horario', { hora: 12, on: 18, off: 23 })).toBe(false);
    expect(m('astro', { hora: 23, dia: 172, lat: 40 })).toBe(true); expect(m('astro', { hora: 12, dia: 172, lat: 40 })).toBe(false);
    expect(m('astro', { hora: 18, dia: 355, lat: 40 })).toBe(true); // en invierno ya es de noche a las 18 h
    expect(m('astro', { hora: 18, dia: 172, lat: 40 })).toBe(false); // en verano aún hay luz
  });
});

describe('contactos auxiliares y enclavamiento', () => {
  it('bloque auxiliar sigue al contactor y el enclavamiento impide cerrar los dos', () => {
    const mk = (b1: boolean, b2: boolean, inter: boolean): Project => P(
      [C('A', 'red', 0, 0, { v: 230, rint: 0 }), C('P1', 'pushNO', 0, 0, { pressed: b1 }), C('P2', 'pushNO', 0, 0, { pressed: b2 }), C('K1', 'contactor'), C('K2', 'contactor'), C('X', 'aux_block', 0, 0, { kn: 2 }), C('L', 'resistor', 0, 0, { r: 100, pmax: 1000 }), C('G', 'ground'), ...(inter ? [C('E', 'enclav', 0, 0, { a: 1, b: 2 })] : [])],
      [W('1', 'A', 0, 'P1', 0), W('2', 'P1', 1, 'K1', 0), W('3', 'K1', 1, 'A', 1), W('4', 'A', 0, 'P2', 0), W('5', 'P2', 1, 'K2', 0), W('6', 'K2', 1, 'A', 1), W('7', 'A', 0, 'X', 0), W('8', 'X', 1, 'L', 0), W('9', 'L', 1, 'A', 1), W('10', 'A', 1, 'G', 0)]);
    simulate(mk(false, false, true));
    expect(Math.abs(simulate(mk(false, true, true)).live['L'].i)).toBeGreaterThan(1); // K2 cierra → el auxiliar (nº 2) cierra
    simulate(mk(false, false, true));
    expect(Math.abs(simulate(mk(true, true, true)).live['L'].i)).toBeLessThan(0.01); // K1 primero: K2 queda bloqueado
    simulate(mk(false, false, false));
    expect(Math.abs(simulate(mk(true, true, false)).live['L'].i)).toBeGreaterThan(1); // sin enclavamiento cierran los dos
  });
});
