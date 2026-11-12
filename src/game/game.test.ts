import { describe, it, expect } from 'vitest';
import { makeClient } from './clients';
import { autoSolve } from './solver';
import { evaluate, emptyState, analyze, buildBom } from './logic';
import { houseOf, HOUSES, finalizeHouse, registerHouse, validateHouse, type Room } from './houses';

describe('modo juego', () => {
  it('hay varios planos y salen todos al azar', () => {
    const ids = new Set<string>();
    for (let seed = 1; seed <= 80; seed++) ids.add(makeClient(seed).houseId);
    expect(ids.size).toBeGreaterThanOrEqual(4);
  });
  it('el profesional resuelve cada plano con nota alta y dentro de presupuesto', () => {
    for (const h of HOUSES) for (let seed = 1; seed <= 20; seed++) for (const level of [1, 3]) {
      const c = makeClient(seed, level, h.id);
      expect(c.houseId).toBe(h.id);
      const ev = evaluate(autoSolve(c.houseId, c), c.houseId, c);
      expect(ev.checks.filter((k) => !k.ok).map((k) => k.id), `${h.id} seed ${seed} L${level}`).toEqual([]);
      expect(ev.cost).toBeLessThanOrEqual(c.budget);
    }
  });
  it('la lista de materiales suma lo mismo que el coste', () => {
    const c = makeClient(11, 2);
    const st = autoSolve(c.houseId, c);
    const an = analyze(st, houseOf(c.houseId));
    const bom = buildBom(st, an);
    expect(bom.length).toBeGreaterThan(8);
    expect(bom.reduce((a, l) => a + l.total, 0)).toBeCloseTo(an.total, 1);
    expect(bom.every((l) => l.brand && l.unitPrice > 0)).toBe(true);
  });
  it('un plano propio con lo mínimo se puede jugar', () => {
    const r = (id: string, name: string, kind: Room['kind'], x: number, y: number, w: number, h: number, outdoor = false) => ({ id, name, kind, x, y, w, h, outdoor });
    const h = finalizeHouse('custom-t', 'Mi plano', [r('salon', 'Salón', 'salon', 0, 0, 4, 4), r('cocina', 'Cocina', 'cocina', 4, 0, 3, 4), r('bano', 'Baño', 'bano', 7, 0, 2.4, 4), r('pasillo', 'Pasillo', 'pasillo', 0, 4, 9.4, 1.1), r('d1', 'Dormitorio', 'dormitorio', 0, 5.1, 4.5, 3.2), r('d2', 'Dormitorio 2', 'dormitorio', 4.5, 5.1, 3.5, 3.2)], { x: 0.2, y: 4.5 });
    expect(validateHouse(h)).toEqual([]);
    registerHouse(h);
    for (let seed = 1; seed <= 10; seed++) {
      const c = makeClient(seed, 2, 'custom-t');
      expect(c.houseId).toBe('custom-t');
      const ev = evaluate(autoSolve(c.houseId, c), c.houseId, c);
      expect(ev.checks.filter((k) => !k.ok).map((k) => k.id), `seed ${seed}`).toEqual([]);
    }
  });
  it('el instalador automático resuelve cualquier cliente con nota alta', () => {
    const fails: string[] = [];
    for (let seed = 1; seed <= 60; seed++) for (const level of [1, 2, 3]) {
      const c = makeClient(seed, level);
      const ev = evaluate(autoSolve(c.houseId, c), c.houseId, c);
      const bad = ev.checks.filter((k) => !k.ok).map((k) => `${k.id}(${k.detail ?? ''})`);
      if (ev.score < 95 || bad.length) fails.push(`seed ${seed}/L${level}: ${ev.score} ${bad.join(', ')} coste ${Math.round(ev.cost)}/${c.budget}`);
    }
    expect(fails.slice(0, 8)).toEqual([]);
  });
  it('un plano vacío saca 0', () => {
    const c = makeClient(7);
    expect(evaluate(emptyState(houseOf(c.houseId)), c.houseId, c).score).toBe(0);
  });
  it('el cliente es reproducible con la misma semilla', () => {
    expect(makeClient(42, 2).reqs.map((r) => r.id)).toEqual(makeClient(42, 2).reqs.map((r) => r.id));
  });
  it('PIA de 25 A con 1,5 mm² provoca riesgo de incendio y limita la nota', () => {
    const c = makeClient(3);
    const st = autoSolve(c.houseId, c);
    st.choices.C1 = { inA: 25, section: 1.5, curve: 10 };
    const ev = evaluate(st, c.houseId, c);
    expect(ev.tests.find((t) => t.cid === 'C1')?.outcome).toBe('fire');
    expect(ev.score).toBeLessThanOrEqual(30);
  });
  it('una base a menos de 0,6 m de la bañera es peligrosa', () => {
    const c = makeClient(5);
    const h = houseOf(c.houseId);
    const st = autoSolve(c.houseId, c);
    st.devices.push({ id: 'x', kind: 'toma', x: h.tubZone!.x - 0.2, y: h.tubZone!.y + 0.5, circuit: 'C5' });
    const ev = evaluate(st, c.houseId, c);
    expect(ev.checks.find((k) => k.id === 'bath-zone')!.ok).toBe(false);
    expect(ev.score).toBeLessThanOrEqual(55);
  });
  it('longitudes del recorrido: salón + cuadro en la entrada dan longitudes razonables', () => {
    const c = makeClient(9);
    const a = analyze(autoSolve(c.houseId, c), houseOf(c.houseId));
    for (const ci of Object.values(a.circuits)) { expect(ci.ltotal).toBeGreaterThan(2); expect(ci.ltotal).toBeLessThan(150); }
  });
});
