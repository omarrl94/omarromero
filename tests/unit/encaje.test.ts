import { describe, expect, it } from 'vitest';
import { etiquetaEncaje, puntuarEncaje } from '../../shared/encaje';

describe('puntuarEncaje', () => {
  const empresa = { perfiles: ['dam-web', 'dam-backend'], zona: 'madrid' };
  it('da 0 a empresas sin perfiles del ciclo', () => {
    expect(puntuarEncaje(empresa, { ciclo: 'ASIR', perfiles: [], zona: null })).toBe(0);
  });
  it('premia la coincidencia de perfil y zona', () => {
    const alta = puntuarEncaje(empresa, { ciclo: 'DAM', perfiles: ['dam-web'], zona: 'madrid' });
    const sinZona = puntuarEncaje(empresa, { ciclo: 'DAM', perfiles: ['dam-web'], zona: 'sur' });
    const otroPerfil = puntuarEncaje(empresa, { ciclo: 'DAM', perfiles: ['dam-erp'], zona: 'madrid' });
    expect(alta).toBe(90);
    expect(sinZona).toBeLessThan(alta);
    expect(otroPerfil).toBeLessThan(sinZona);
    expect(etiquetaEncaje(alta)).toBe('alto');
  });
  it('suma por programa de prácticas sin pasar de 100', () => {
    expect(puntuarEncaje({ ...empresa, programaPracticas: {} }, { ciclo: 'DAM', perfiles: ['dam-web'], zona: 'madrid' })).toBe(100);
  });
});
