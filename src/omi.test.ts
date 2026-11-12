import { describe, it, expect } from 'vitest';
import { makeOmi, parseOmi, serializeOmi, applyGame } from './omi';
import { EXAMPLES } from './model/examples';
import { useGame } from './game/store';
import { makeClient } from './game/clients';
import { autoSolve } from './game/solver';

describe('formato .omi', () => {
  it('guarda y recupera el circuito', () => {
    const o = parseOmi(serializeOmi(makeOmi(structuredClone(EXAMPLES[0]), false)));
    expect(o.format).toBe('omi');
    expect(o.project.components.length).toBe(EXAMPLES[0].components.length);
    expect(o.game).toBeUndefined();
  });
  it('acepta un .json antiguo de proyecto', () => {
    expect(parseOmi(JSON.stringify(EXAMPLES[1])).project.wires.length).toBe(EXAMPLES[1].wires.length);
  });
  it('rechaza basura con un mensaje claro', () => {
    expect(() => parseOmi('nada')).toThrow(/omi/);
    expect(() => parseOmi('{"a":1}')).toThrow(/proyecto/);
  });
  it('restaura la obra del juego', () => {
    const c = makeClient(77, 2);
    const st = autoSolve(c.houseId, c);
    applyGame({ seed: 77, level: 2, plan: 'random', stage: 'cuadro', state: st });
    const g = useGame.getState();
    expect(g.seed).toBe(77); expect(g.stage).toBe('cuadro'); expect(g.state.devices.length).toBe(st.devices.length);
  });
});
