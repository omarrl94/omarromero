import { describe, it, expect } from 'vitest';
import { simulate } from './netlist';
import { feeders } from '../ui/diagrams';
import { fusible, escalera, lampara230 } from './examples';

describe('unifilar automático', () => {
  it('agrupa los receptores por la cadena de protecciones que los alimenta', () => {
    const p = structuredClone(fusible);
    const { groups, source } = feeders(p, simulate(p));
    expect(source?.id).toBe('B1');
    expect(groups).toHaveLength(1);
    expect(groups[0].prots.map((c) => c.id)).toEqual(['F1']); // fusible → lámpara
    expect(groups[0].loads.map((c) => c.id)).toContain('L1');
  });
  it('conmutada: dos conmutadores en serie alimentan la lámpara', () => {
    const p = structuredClone(escalera);
    const { groups } = feeders(p, simulate(p));
    expect(groups[0].prots.length).toBeGreaterThanOrEqual(2);
    expect(groups[0].loads[0].id).toBe('L1');
  });
  it('interruptor + lámpara en CA', () => {
    const p = structuredClone(lampara230);
    const { groups, source } = feeders(p, simulate(p));
    expect(source?.type).toBe('acsource');
    expect(groups[0].prots[0].id).toBe('S1');
  });
});
