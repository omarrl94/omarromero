import { describe, it, expect } from 'vitest';
import { useStore } from '../store';
import { useAuth } from '../auth';
import { beforeAll } from 'vitest';
import { simulate } from './netlist';
import { defaultParams } from './library';
import type { Project } from './types';

beforeAll(() => { useAuth.setState({ guest: true, demoFull: true }); }); // nivel «administrador de demostración»: sin límites de visitante
const comp = (id: string, type: string, x: number, y: number, rot: 0 | 90 | 180 | 270 = 0, params = {}) => ({ id, type, x, y, rot, params: { ...defaultParams(type), ...params } });
/** Pila de 10 V → R1 y, en paralelo, R2 conectada a MITAD del cable superior. */
const base = (): Project => ({
  version: 1, name: 't',
  components: [comp('B', 'battery', 100, 200, 90, { v: 10 }), comp('R1', 'resistor', 300, 200, 90, { r: 100 }), comp('R2', 'resistor', 200, 300, 90, { r: 100 }), comp('G', 'ground', 100, 400)],
  wires: [
    { id: 'wt', a: { comp: 'B', term: 0 }, b: { comp: 'R1', term: 0 } }, // arriba (vertical-horizontal)
    { id: 'wb', a: { comp: 'B', term: 1 }, b: { comp: 'R1', term: 1 } },
    { id: 'wg', a: { comp: 'B', term: 1 }, b: { comp: 'G', term: 0 } },
    { id: 'w2b', a: { comp: 'R2', term: 1 }, b: { comp: 'B', term: 1 } },
  ],
});

describe('cable conectado a mitad de otro', () => {
  it('crea un empalme, divide el cable y la red queda conectada', () => {
    useStore.getState().load(base());
    const s0 = useStore.getState();
    const w = s0.project.wires.find((x) => x.id === 'wt')!;
    expect(w).toBeTruthy();
    // R2 término 0 → sobre el cable superior, en un punto intermedio (x = 200)
    const ok = useStore.getState().connectToWire({ comp: 'R2', term: 0 }, 'wt', { x: 200, y: 162 });
    const p = useStore.getState().project;
    expect(ok).toBe(true);
    const J = p.components.filter((c) => c.type === 'junction');
    expect(J.length).toBe(1);
    // el cable original está dividido: ninguno une ya B con R1 directamente
    expect(p.wires.some((x) => x.a.comp === 'B' && x.b.comp === 'R1' && x.a.term === 0)).toBe(false);
    const ends = p.wires.filter((x) => x.a.comp === J[0].id || x.b.comp === J[0].id);
    expect(ends.length).toBe(3); // dos mitades + el cable nuevo
    // eléctricamente: R2 queda a 10 V (en paralelo con R1)
    const sim = simulate(p);
    const v = (id: string) => sim.componentVoltage[id];
    expect(Math.abs(v('R1'))).toBeCloseTo(10, 3); expect(Math.abs(v('R2'))).toBeCloseTo(10, 3);
  });
  it('deshacer devuelve el cable entero', () => {
    useStore.getState().load(base());
    useStore.getState().connectToWire({ comp: 'R2', term: 0 }, 'wt', { x: 200, y: 162 });
    useStore.getState().undo();
    const p = useStore.getState().project;
    expect(p.components.some((c) => c.type === 'junction')).toBe(false);
    expect(p.wires.filter((x) => x.id === 'wt').length).toBe(1);
  });
  it('sobre un extremo no se crea empalme (para eso está el terminal)', () => {
    useStore.getState().load(base());
    expect(useStore.getState().connectToWire({ comp: 'R2', term: 0 }, 'wt', { x: 102, y: 160 })).toBe(false);
    expect(useStore.getState().project.components.some((c) => c.type === 'junction')).toBe(false);
  });
});

describe('copiar, cortar y pegar', () => {
  it('copia con sus cables internos y pega en la posición del cursor', () => {
    useStore.getState().load(base());
    useStore.getState().select(['B', 'R1']);
    useStore.getState().copySelection();
    const n0 = useStore.getState().project.components.length;
    useStore.getState().paste({ x: 600, y: 100 });
    const p = useStore.getState().project;
    expect(p.components.length).toBe(n0 + 2);
    const newOnes = p.components.slice(n0);
    expect(Math.min(...newOnes.map((c) => c.x))).toBe(600);
    expect(p.wires.filter((w) => newOnes.some((c) => c.id === w.a.comp) && newOnes.some((c) => c.id === w.b.comp)).length).toBe(2);
  });
  it('cortar quita y deja en el portapapeles', () => {
    useStore.getState().load(base());
    useStore.getState().select(['R2']);
    useStore.getState().cutSelection();
    expect(useStore.getState().project.components.some((c) => c.id === 'R2')).toBe(false);
    expect(useStore.getState().clipboard?.components[0].type).toBe('resistor');
  });
  it('girar con la rueda: ±90° y se agrupa en un solo «deshacer»', () => {
    useStore.getState().load(base());
    useStore.getState().rotateBy(['R2'], 1); useStore.getState().rotateBy(['R2'], 1); useStore.getState().rotateBy(['R2'], -1);
    expect(useStore.getState().project.components.find((c) => c.id === 'R2')!.rot).toBe(180);
    useStore.getState().undo();
    expect(useStore.getState().project.components.find((c) => c.id === 'R2')!.rot).toBe(90);
  });
  it('seleccionar todo y mover con las flechas', () => {
    useStore.getState().load(base());
    useStore.getState().selectAll(); expect(useStore.getState().selection.length).toBe(4);
    useStore.getState().nudge(20, 0);
    expect(useStore.getState().project.components.find((c) => c.id === 'R1')!.x).toBe(320);
  });
});
