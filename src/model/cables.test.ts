import { describe, it, expect } from 'vitest';
import { dropSingle, sectionForDrop, nextSection, nextBreaker, wireResistance, cableReport } from './cables';
import { simulate } from './netlist';
import { lampara230 } from './examples';

describe('cables', () => {
  it('caída de tensión: 15 m, 10 A, 1,5 mm² Cu → 2·15·10/(48·1,5) = 4,17 V', () => {
    expect(dropSingle(15, 10, 1.5)).toBeCloseTo(300 / 72, 6);
  });
  it('sección por caída: 20 m, 2300 W, 3 % de 230 V → S = 2·20·2300/(48·6,9·230) ≈ 1,21 mm² → 1,5', () => {
    const s = sectionForDrop(20, 2300, 0.03 * 230, 230);
    expect(s).toBeCloseTo(92000 / (48 * 6.9 * 230), 6);
    expect(nextSection(s)).toBe(1.5);
  });
  it('resistencia de un conductor de 10 m y 2,5 mm²: 10/(48·2,5) = 0,0833 Ω', () => {
    expect(wireResistance(2.5, 10)).toBeCloseTo(1 / 12, 6);
  });
  it('calibre normalizado inmediatamente superior', () => {
    expect(nextBreaker(11.2)).toBe(16);
    expect(nextBreaker(10)).toBe(10);
  });
  it('informe de cables en el ejemplo de 230 V / 60 W: sin sobrecarga y caída mínima', () => {
    const p = structuredClone(lampara230);
    const r = cableReport(p, simulate(p));
    const any = Object.values(r.info)[0];
    expect(any.I).toBeCloseTo(60 / 230, 3);
    expect(any.overload).toBe(false);
    expect(r.messages).toHaveLength(0);
  });
  it('sobrecarga: 2000 W de calefactor por 1,5 mm² (≈ 8,7 A <15,5) ok; 4,6 kW (20 A) → error', () => {
    const p = structuredClone(lampara230);
    p.components.find((c) => c.id === 'L1')!.params.pn = 4600;
    const r = cableReport(p, simulate(p));
    expect(r.messages.some((m) => m.level === 'error')).toBe(true);
  });
});
