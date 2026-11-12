import { describe, it, expect } from 'vitest';
import { computePanel, defaultPanel } from './panel';

describe('cuadro eléctrico', () => {
  it('electrificación básica por defecto: calibres y secciones mínimas de ITC-BT-25', () => {
    const r = computePanel(defaultPanel());
    const get = (id: string) => r.circuits.find((c) => c.id === id)!;
    expect(get('C1').inA).toBeGreaterThanOrEqual(10); expect(get('C1').section).toBeGreaterThanOrEqual(1.5);
    expect(get('C2').inA).toBe(16); expect(get('C2').section).toBeGreaterThanOrEqual(2.5);
    expect(get('C3').inA).toBe(25); expect(get('C3').section).toBeGreaterThanOrEqual(6);
    expect(get('C4').inA).toBe(20); expect(get('C4').section).toBeGreaterThanOrEqual(4);
    expect(get('C5').inA).toBe(16);
    expect(r.circuits.every((c) => c.ok)).toBe(true);
  });
  it('Ib = P/(U·cosφ) y la sección cumple In ≤ Iz y la caída', () => {
    const cfg = defaultPanel(); cfg.circuits[0].p = 2300; cfg.circuits[0].length = 40;
    const c1 = computePanel(cfg).circuits[0];
    expect(c1.ib).toBeCloseTo(10, 6);
    expect(c1.iz).toBeGreaterThanOrEqual(c1.inA);
    expect(c1.dropPct).toBeLessThanOrEqual(3);
  });
  it('forzar una sección insuficiente genera aviso', () => {
    const cfg = defaultPanel(); cfg.circuits[2].forceSection = 1.5;
    const c3 = computePanel(cfg).circuits[2];
    expect(c3.ok).toBe(false);
    expect(c3.warnings.length).toBeGreaterThan(0);
  });
  it('IGA: previsión mínima de 5750 W de electrificación básica', () => {
    const r = computePanel(defaultPanel());
    expect(r.iga).toBeGreaterThanOrEqual(25);
  });
});
