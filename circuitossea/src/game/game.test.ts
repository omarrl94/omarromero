import { describe, it, expect } from 'vitest';
import { makeClient } from './clients';
import { autoSolve } from './solver';
import { evaluate, emptyState, analyze } from './logic';
import { houseOf } from './houses';

describe('modo juego', () => {
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
