import { describe, it, expect } from 'vitest';
import { simulate } from '../model/netlist';
import { ejercicio1, ejercicio2 } from '../model/ejercicios';
import { buildCNet } from './cnet';

const I = (net: ReturnType<typeof buildCNet>) => net.ramas.map((r) => +net.I[r.id].re.toFixed(6));
describe('red de ramas', () => {
  it('Ejercicio 1: I1 = 1 A, I2 = 2 A, I3 = 3 A, V_AB = 6 V', () => {
    const p = ejercicio1(); const net = buildCNet(p, simulate(p));
    expect(net.ok, net.reason).toBe(true);
    expect(net.n).toBe(2); expect(net.names).toEqual(['B', 'A']); // índice 0 = masa = B
    expect(I(net)).toEqual([1, 2, 3]);
    expect(+net.V[1].re.toFixed(6)).toBe(6);
  });
  it('Ejercicio 2 (todas hacia A): I1 = 4, I2 = −1, I3 = −3', () => {
    const p = ejercicio2(); const net = buildCNet(p, simulate(p), 'haciaA');
    expect(net.ok, net.reason).toBe(true);
    expect(I(net)).toEqual([4, -1, -3]);
    expect(+net.V[1].re.toFixed(6)).toBe(6);
  });
  it('Ejercicio 2 (modo cargas): la rama sin pila va de A a B', () => {
    const p = ejercicio2(); const net = buildCNet(p, simulate(p), 'cargas');
    expect(I(net).sort((a, b) => a - b)).toEqual([-3, 1, 4]);
  });
});
