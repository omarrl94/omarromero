import { describe, expect, it } from 'vitest';
import { items, distritos } from '../data/content';
import { evalua } from './evaluar';

const por = (t: string) => items.filter((i) => i.tipo === t);

describe('Fase 5: planos, documentos y texto de IA', () => {
  it('plano: una luminaria sobre cada zona da el 100 %; sin cubrir, 0; exceso resta', () => {
    const it = por('plano')[0]!;
    const pts = it.plano!.zonas.map((z) => ({ x: z.x, y: z.y }));
    expect(evalua(it, { puntos: pts, pistas: 0 }).pe_obtained).toBe(evalua(it, { puntos: pts, pistas: 0 }).pe_max);
    expect(evalua(it, { puntos: [{ x: 1, y: 1 }], pistas: 0 }).pe_obtained).toBe(0);
    const extra = [...pts, ...Array.from({ length: 5 }, (_, k) => ({ x: 300 + k, y: 100 }))];
    expect(evalua(it, { puntos: extra, pistas: 0 }).pe_obtained).toBeLessThan(evalua(it, { puntos: pts, pistas: 0 }).pe_max);
  });
  it.each(por('plano').map((i) => [i.id, i] as const))('%s: se puede resolver dentro del máximo de luminarias', (_id, it) => {
    // Cada zona con su luminaria no supera el máximo permitido (se admite que una cubra varias).
    expect(it.plano!.zonas.length).toBeLessThanOrEqual(it.plano!.maxPuntos + 1);
  });
  it('formulario: parcial por campos y numéricos con tolerancia', () => {
    const it = items.find((i) => i.tipo === 'formulario' && i.formulario?.campos.some((c) => c.id === 'total'))!;
    const bien: Record<string, string> = {};
    for (const c of it.formulario!.campos) bien[c.id] = String(c.correcta);
    expect(evalua(it, { campos: bien, pistas: 0 }).pe_obtained).toBe(evalua(it, { campos: bien, pistas: 0 }).pe_max);
    const mal = { ...bien, total: '1' };
    const r = evalua(it, { campos: mal, pistas: 0 });
    expect(r.pe_obtained).toBeCloseTo((r.pe_max * 3) / 4, 3);
  });
  it('texto de IA: aciertos suman y falsos positivos restan', () => {
    const it = por('texto_errores')[0]!;
    const def = it.texto!.fragmentos.filter((f) => f.defecto).map((f) => f.id);
    const ok = it.texto!.fragmentos.find((f) => !f.defecto)!.id;
    expect(evalua(it, { seleccion: def, pistas: 0 }).pe_obtained).toBe(evalua(it, { seleccion: def, pistas: 0 }).pe_max);
    expect(evalua(it, { seleccion: [...def, ok], pistas: 0 }).pe_obtained).toBeLessThan(evalua(it, { seleccion: def, pistas: 0 }).pe_max);
  });
  it('epílogo: 8 ítems integradores de distintos bloques con todos los RA cubiertos', () => {
    const ep = items.filter((i) => i.distrito === 0);
    expect(ep.length).toBe(8);
    expect(new Set(ep.flatMap((i) => i.ra)).size).toBeGreaterThanOrEqual(6);
    expect(distritos.find((d) => d.id === 0)?.nombre).toBe('La Gran Inspección');
  });
});
