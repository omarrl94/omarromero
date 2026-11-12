import { describe, expect, it } from 'vitest';
import { normaNum } from '../data/content';
import { cumple, dictamenApta, evaluaActa, type Prueba } from './acta';
import { circuitoSano, diferencialDispara, inyecta, mideAislamiento, mideContinuidad, mideFuga, mideTension } from './averias';

const U = 230;
describe('instrumentos virtuales', () => {
  it('circuito sano: 230 V F-N y continuidad baja sin tensión', () => {
    const c = circuitoSano();
    expect(mideTension(c, 'F', 'N', U).valor).toBe(230);
    expect(mideContinuidad({ ...c, alimentado: false }, 'F').valor).toBeLessThan(1);
  });
  it('medir continuidad con tensión daña el equipo (error de seguridad)', () => {
    expect(mideContinuidad(circuitoSano(), 'F').danio).toBe(true);
    expect(mideAislamiento(circuitoSano()).danio).toBe(true);
  });
  it('fase abierta: sin tensión F-N y continuidad infinita en F', () => {
    const c = inyecta(circuitoSano(), 'fase_abierta');
    expect(mideTension(c, 'F', 'N', U).valor).toBe(0);
    expect(mideContinuidad({ ...c, alimentado: false }, 'F').valor).toBe(Infinity);
    expect(mideContinuidad({ ...c, alimentado: false }, 'N').valor).toBeLessThan(1);
  });
  it('neutro cortado: tensión N-PE = fase (neutro flotante)', () => {
    const c = inyecta(circuitoSano(), 'neutro_cortado');
    expect(mideTension(c, 'F', 'N', U).valor).toBe(0);
    expect(mideTension(c, 'N', 'PE', U).valor).toBe(230);
  });
  it('borna floja: resistencia de contacto elevada', () => {
    const c = { ...inyecta(circuitoSano(), 'borna_floja'), alimentado: false };
    expect(mideContinuidad(c, 'F').valor).toBeGreaterThan(10);
  });
  it('fuga a tierra: mide mA, aislamiento bajo y dispara el diferencial', () => {
    const c = inyecta(circuitoSano(), 'fuga_tierra');
    expect(mideFuga(c).valor).toBe(45);
    expect(mideAislamiento({ ...c, alimentado: false }).valor).toBeLessThan(0.5);
    expect(diferencialDispara(c)).toBe(true);
    expect(diferencialDispara(circuitoSano())).toBe(false);
  });
  it('inversión fase/neutro: F-PE = 0 y N-PE = 230', () => {
    const c = inyecta(circuitoSano(), 'inversion_fn');
    expect(mideTension(c, 'F', 'PE', U).valor).toBe(0);
    expect(mideTension(c, 'N', 'PE', U).valor).toBe(230);
  });
});

describe('acta de verificación', () => {
  const n = (id: string) => normaNum(id);
  const ais: Prueba = { id: 'a', nombre: 'Aislamiento', valor: 2, unidad: 'MΩ', regla: { tipo: 'min', norma: 'verificacion.aislamiento.min_mohm' } };
  const aisMal: Prueba = { ...ais, id: 'b', valor: 0.1 };
  const tierra: Prueba = { id: 't', nombre: 'Tierra', valor: 100, unidad: 'Ω', regla: { tipo: 'tierra_max', norma: 'verificacion.tierra.uc_humedo', sens_a: 0.03 } };
  const dif: Prueba = { id: 'd', nombre: 'Disparo diferencial', valor: 20, unidad: 'mA', regla: { tipo: 'rango_frac', norma: 'verificacion.diferencial.sens_min_frac', sens_a: 0.03 } };
  it('criterios de cumplimiento', () => {
    expect(cumple(ais, n)).toBe(true);
    expect(cumple(aisMal, n)).toBe(false);
    expect(cumple(tierra, n)).toBe(true); // 24 V / 0,03 A = 800 Ω
    expect(cumple({ ...tierra, valor: 900 }, n)).toBe(false);
    expect(cumple(dif, n)).toBe(true);
    expect(cumple({ ...dif, valor: 10 }, n)).toBe(false);
  });
  it('dictamen apta solo si todo cumple', () => {
    expect(dictamenApta([ais, tierra, dif], n)).toBe(true);
    expect(dictamenApta([ais, aisMal], n)).toBe(false);
  });
  it('puntuación del acta', () => {
    const ps = [ais, aisMal];
    expect(evaluaActa(ps, { a: 'cumple', b: 'no' }, 'no_apta', n).fraccion).toBe(1);
    expect(evaluaActa(ps, { a: 'cumple', b: 'cumple' }, 'apta', n).fraccion).toBeCloseTo(1 / 3);
  });
});
