import { describe, it, expect } from 'vitest';
import { simulate } from './netlist';
import { luzSimple, divisor } from './examples';
import { readMeter, initialMeter, type MeterState } from './meter';

const m = (o: Partial<MeterState>): MeterState => ({ ...initialMeter, ...o });

describe('polímetro', () => {
  it('V en un divisor 1k/2k con 9 V: 6,000 V (carga de 10 MΩ casi inapreciable)', () => {
    const r = readMeter(simulate(divisor), m({ dial: 'V', red: { comp: 'R2', term: 0 }, black: { comp: 'R2', term: 1 } }), divisor);
    expect(r.value!).toBeCloseTo(6, 2);
  });
  it('A en paralelo sobre la pila: cortocircuito y fusible fundido', () => {
    const r = readMeter(simulate(luzSimple), m({ dial: 'A', jack: '10A', red: { comp: 'L1', term: 0 }, black: { comp: 'L1', term: 1 } }), luzSimple);
    expect(r.blowFuse).toBe(true);
  });
  it('A en serie (interruptor abierto → puntas en sus bornes): mide la intensidad de la lámpara', () => {
    const p = structuredClone(luzSimple);
    p.components.find((c) => c.id === 'S1')!.params.closed = false;
    const r = readMeter(simulate(p), m({ dial: 'A', jack: '10A', red: { comp: 'S1', term: 0 }, black: { comp: 'S1', term: 1 } }), p);
    expect(r.value!).toBeCloseTo(12 / (12.2 + 0.05), 3);
  });
  it('Ω con tensión entre puntas → protegido (OL + error)', () => {
    const r = readMeter(simulate(luzSimple), m({ dial: 'ohm', red: { comp: 'L1', term: 0 }, black: { comp: 'L1', term: 1 } }), luzSimple);
    expect(r.text).toBe('OL');
    expect(r.tips[0].level).toBe('error');
  });
  it('Ω de la lámpara con la pila retirada de la medida (puntas en un componente sin tensión)', () => {
    const p = structuredClone(luzSimple);
    p.components.find((c) => c.id === 'S1')!.params.closed = false;
    const r = readMeter(simulate(p), m({ dial: 'cont', red: { comp: 'S1', term: 0 }, black: { comp: 'S1', term: 1 } }), p);
    expect(r.beep).toBe(false); // interruptor abierto: sin continuidad
  });
});
