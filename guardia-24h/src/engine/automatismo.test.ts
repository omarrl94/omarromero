import { describe, expect, it } from 'vitest';
import { aplica, avanza, evaluaEscenarios, lee, newSim, type Cable, type Comp, type Escenario } from './automatismo';

const G: Comp = { id: 'G', tipo: 'fuente', etiqueta: 'Red' };
const F1: Comp = { id: 'F1', tipo: 'termico', etiqueta: 'F1' };
const S1: Comp = { id: 'S1', tipo: 'pulsador_nc', etiqueta: 'S1 paro' };
const S2: Comp = { id: 'S2', tipo: 'pulsador_na', etiqueta: 'S2 marcha' };
const KM1: Comp = { id: 'KM1', tipo: 'contactor', etiqueta: 'KM1' };

export const MARCHA_PARO: Cable[] = [['G.L', 'F1.95'], ['F1.96', 'S1.11'], ['S1.12', 'S2.13'], ['S1.12', 'KM1.13'], ['S2.14', 'KM1.14'], ['S2.14', 'KM1.A1'], ['KM1.A2', 'G.N']];
const ESC_MP: Escenario[] = [
  { nombre: 'Arranque', pasos: [{ acc: 'pulse:S2', esperado: { KM1: true } }] },
  { nombre: 'Sin orden no arranca', pasos: [{ acc: 'wait:1', esperado: { KM1: false } }] },
  { nombre: 'Autorretención', pasos: [{ acc: 'press:S2' }, { acc: 'release:S2', esperado: { KM1: true } }, { acc: 'wait:2', esperado: { KM1: true } }] },
  { nombre: 'Paro', pasos: [{ acc: 'pulse:S2', esperado: { KM1: true } }, { acc: 'pulse:S1', esperado: { KM1: false } }, { acc: 'wait:1', esperado: { KM1: false } }] },
  { nombre: 'Protección térmica', pasos: [{ acc: 'pulse:S2' }, { acc: 'trip:F1', esperado: { KM1: false } }, { acc: 'reset:F1', esperado: { KM1: false } }] },
];

describe('marcha-paro con enlace', () => {
  const comps = [G, F1, S1, S2, KM1];
  it('el cableado correcto supera todos los escenarios', () => {
    const r = evaluaEscenarios(comps, MARCHA_PARO, ESC_MP);
    expect(r.fraccion).toBe(1);
  });
  it('sin cables no puntúa aunque los escenarios negativos pasen', () => {
    expect(evaluaEscenarios(comps, [], ESC_MP).fraccion).toBe(0);
  });
  it('sin contacto de enlace funciona por impulso: falla la retención', () => {
    const sin = MARCHA_PARO.filter((c) => !(c[0] === 'S1.12' && c[1] === 'KM1.13') && !(c[0] === 'S2.14' && c[1] === 'KM1.14'));
    const r = evaluaEscenarios(comps, sin, ESC_MP);
    expect(r.resultados.find((x) => x.nombre === 'Autorretención')?.ok).toBe(false);
    expect(r.resultados.find((x) => x.nombre === 'Paro')?.ok).toBe(false);
  });
  it('un cortocircuito directo se detecta', () => {
    const r = evaluaEscenarios(comps, [['G.L', 'S2.13'], ['S2.14', 'G.N']], [{ nombre: 'Corto', pasos: [{ acc: 'press:S2' }] }]);
    expect(r.resultados[0]?.motivo).toMatch(/Cortocircuito/);
  });
});

describe('temporizador y estrella-triángulo', () => {
  const KM2: Comp = { id: 'KM2', tipo: 'contactor', etiqueta: 'KM2 estrella' };
  const KM3: Comp = { id: 'KM3', tipo: 'contactor', etiqueta: 'KM3 triángulo' };
  const KT1: Comp = { id: 'KT1', tipo: 'temporizador', etiqueta: 'KT1', retardo: 5 };
  const cables: Cable[] = [...MARCHA_PARO.slice(0, 5), ['S2.14', 'KM1.A1'], ['KM1.A2', 'G.N'], ['S2.14', 'KT1.A1'], ['KT1.A2', 'G.N'], ['S2.14', 'KT1.15'], ['KT1.16', 'KM3.21'], ['KM3.22', 'KM2.A1'], ['KM2.A2', 'G.N'], ['S2.14', 'KT1.17'], ['KT1.18', 'KM2.21'], ['KM2.22', 'KM3.A1'], ['KM3.A2', 'G.N']];
  const comps = [G, F1, S1, S2, KM1, KM2, KT1, KM3];
  it('arranca en estrella y pasa a triángulo tras el retardo, sin solape', () => {
    const s = newSim(comps, cables);
    aplica(s, 'pulse:S2');
    expect([lee(s, 'KM1'), lee(s, 'KM2'), lee(s, 'KM3')]).toEqual([true, true, false]);
    avanza(s, 4);
    expect(lee(s, 'KM2')).toBe(true);
    avanza(s, 1.5);
    expect([lee(s, 'KM1'), lee(s, 'KM2'), lee(s, 'KM3')]).toEqual([true, false, true]);
    aplica(s, 'pulse:S1');
    expect([lee(s, 'KM1'), lee(s, 'KM2'), lee(s, 'KM3')]).toEqual([false, false, false]);
  });
  it('escenarios con estado prohibido KM2+KM3', () => {
    const esc: Escenario[] = [{ nombre: 'Secuencia', nunca: [['KM2', 'KM3']], pasos: [{ acc: 'pulse:S2', esperado: { KM2: true } }, { acc: 'wait:6', esperado: { KM3: true, KM2: false } }] }];
    expect(evaluaEscenarios(comps, cables, esc).fraccion).toBe(1);
  });
});

describe('inversión de giro con enclavamiento', () => {
  const KM2: Comp = { id: 'KM2', tipo: 'contactor', etiqueta: 'KM2' };
  const S3: Comp = { id: 'S3', tipo: 'pulsador_na', etiqueta: 'S3' };
  const cables: Cable[] = [['G.L', 'F1.95'], ['F1.96', 'S1.11'], ['S1.12', 'S2.13'], ['S1.12', 'KM1.13'], ['S2.14', 'KM1.14'], ['S2.14', 'KM2.21'], ['KM2.22', 'KM1.A1'], ['KM1.A2', 'G.N'], ['S1.12', 'S3.13'], ['S1.12', 'KM2.13'], ['S3.14', 'KM2.14'], ['S3.14', 'KM1.21'], ['KM1.22', 'KM2.A1'], ['KM2.A2', 'G.N']];
  const comps = [G, F1, S1, S2, S3, KM1, KM2];
  const esc: Escenario[] = [
    { nombre: 'Sentido 1', nunca: [['KM1', 'KM2']], pasos: [{ acc: 'pulse:S2', esperado: { KM1: true, KM2: false } }] },
    { nombre: 'Enclavamiento', nunca: [['KM1', 'KM2']], pasos: [{ acc: 'pulse:S2' }, { acc: 'pulse:S3', esperado: { KM1: true, KM2: false } }] },
    { nombre: 'Inversión tras paro', nunca: [['KM1', 'KM2']], pasos: [{ acc: 'pulse:S2' }, { acc: 'pulse:S1', esperado: { KM1: false } }, { acc: 'pulse:S3', esperado: { KM2: true, KM1: false } }] },
    { nombre: 'Pulsación simultánea', nunca: [['KM1', 'KM2']], pasos: [{ acc: 'press:S2' }, { acc: 'press:S3', esperado: {} }, { acc: 'wait:1' }] },
  ];
  it('el cableado de referencia cumple todos los escenarios', () => {
    expect(evaluaEscenarios(comps, cables, esc).fraccion).toBe(1);
  });
  it('sin enclavamiento se activan ambos contactores (estado prohibido)', () => {
    const sin = cables.filter((c) => !(c[0] === 'S2.14' && c[1] === 'KM2.21') && !(c[0] === 'S3.14' && c[1] === 'KM1.21'));
    void sin;
    const sinEncl: Cable[] = [['G.L', 'F1.95'], ['F1.96', 'S1.11'], ['S1.12', 'S2.13'], ['S1.12', 'KM1.13'], ['S2.14', 'KM1.14'], ['S2.14', 'KM1.A1'], ['KM1.A2', 'G.N'], ['S1.12', 'S3.13'], ['S1.12', 'KM2.13'], ['S3.14', 'KM2.14'], ['S3.14', 'KM2.A1'], ['KM2.A2', 'G.N']];
    expect(evaluaEscenarios(comps, sinEncl, esc).resultados.find((r) => r.nombre === 'Enclavamiento')?.ok).toBe(false);
  });
});
