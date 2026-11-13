import { describe, it, expect } from 'vitest';
import { salon } from '../model/examples';
import { simulate } from '../model/netlist';
import { buildBom } from './bom';
import { PROVIDERS, fetchQuotes, itemsFor, baseOf } from './catalog';

const bom = () => { const p = structuredClone(salon); return buildBom(p, simulate(p)); };
const qty = (k: string) => bom().lines.find((l) => l.key === k)?.qty ?? 0;

describe('lista de material del salón', () => {
  it('protecciones, mecanismos y lámparas', () => {
    expect(qty('mt:1pn:10:C')).toBe(1); expect(qty('mt:1pn:16:C')).toBe(1);
    expect(bom().lines.some((l) => l.key.startsWith('dif:25:30'))).toBe(true);
    expect(qty('mec:interruptor')).toBe(2); expect(qty('mec:schuko')).toBe(5);
    expect(qty('caja')).toBe(7); expect(qty('placa')).toBe(7);
    expect(qty('led:9')).toBe(3);
  });
  it('metros de cable por sección con un 10 % de sobrante', () => {
    // C1: 6 cables de 1,5 mm² de 7 m + 2 de 4 m (alimentación) ; C2: 15 de 8 m (2,5 mm²) + 4 m
    const p = structuredClone(salon);
    const sum = (s: number) => p.wires.filter((w) => w.section === s).reduce((a, w) => a + (w.length ?? 0), 0);
    expect(qty('cable:1.5')).toBeGreaterThanOrEqual(Math.ceil(sum(1.5) * 1.1));
    expect(qty('cable:2.5')).toBeGreaterThanOrEqual(Math.ceil(sum(2.5) * 1.1));
  });
  it('los aparatos del cliente no se presupuestan', () => {
    expect(bom().customer.some((c) => /Radiador/.test(c.name))).toBe(true);
    expect(bom().lines.some((l) => l.key.includes('radiador'))).toBe(false);
  });
});

describe('catálogo y precios simulados', () => {
  it('cada línea tiene tres gamas con precio creciente', () => {
    for (const l of bom().lines) { const it = itemsFor(l.key); expect(it.length, l.key).toBe(3); expect(it[0].price).toBeLessThan(it[2].price); }
    expect(baseOf('cable:1.5')?.unit).toBe('m');
  });
  it('la consulta es determinista, positiva y distinta entre proveedores', async () => {
    const items = bom().lines.flatMap((l) => itemsFor(l.key));
    const a = await fetchQuotes(PROVIDERS[0], items, { fast: true, day: 100 }), a2 = await fetchQuotes(PROVIDERS[0], items, { fast: true, day: 100 }), b = await fetchQuotes(PROVIDERS[1], items, { fast: true, day: 100 });
    expect(a).toEqual(a2);
    const total = (q: typeof a) => items.reduce((s, it) => s + q[it.ref].price, 0);
    expect(total(a)).toBeGreaterThan(0); expect(total(b)).toBeLessThan(total(a));
    expect(Object.values(a).every((q) => q.price > 0 && q.stock >= 0)).toBe(true);
  });
});
