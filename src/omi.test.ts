import { describe, it, expect } from 'vitest';
import { makeOmi, parseOmi, serializeOmi, applyGame } from './omi';
import { EXAMPLES } from './model/examples';
import { useGame } from './game/store';
import { makeClient } from './game/clients';
import { autoSolve } from './game/solver';
import { applyAveria } from './averias/store';
import { useAveria } from './averias/store';
import { makeScenario } from './averias/game';

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
  it('guarda y restaura el parte de avería en curso', () => {
    const sc = makeScenario(9, 2, 'piso3', 'derivacion');
    useAveria.setState({ sc, case: sc.case, stage: 'diag', minutes: 17, measures: [{ dial: 'Pinza', from: 'x', to: '', text: '0,19', unit: 'A', minute: 5 }], attempts: [], repairs: [], unsafe: [], checks: 0, failed: [], student: 'Ana', score: null, level: 2 });
    const o = parseOmi(serializeOmi(makeOmi(structuredClone(EXAMPLES[0]), false, true)));
    expect(o.averia?.sc?.faultId).toBe('derivacion');
    useAveria.setState({ sc: undefined, minutes: 0, measures: [] });
    applyAveria(o.averia!);
    const a = useAveria.getState();
    expect(a.sc?.seed).toBe(9); expect(a.minutes).toBe(17); expect(a.measures?.length).toBe(1); expect(a.student).toBe('Ana');
  });
  it('rechaza un .omi con la partida de avería incompleta', () => {
    expect(() => parseOmi(JSON.stringify({ format: 'omi', version: 1, name: 'x', project: EXAMPLES[0], averia: { level: 1 } }))).toThrow(/avería/);
  });
});
