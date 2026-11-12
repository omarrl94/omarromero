import { describe, it, expect } from 'vitest';
import { solveAC, abs, arg, cx } from './ac';

const w = 2 * Math.PI * 50;
const close = (a: number, b: number, tol = 1e-6) => expect(Math.abs(a - b)).toBeLessThan(tol);

describe('CA con fasores', () => {
  it('RLC serie 230 V / 50 Hz: R=10 Ω, L=50 mH, C=470 µF → |Z|, I y desfase', () => {
    const XL = w * 0.05, XC = 1 / (w * 470e-6);
    const s = solveAC({ nodeCount: 4, elements: [
      { id: 'V', kind: 'V', a: 1, b: 0, v: cx(230, 0) },
      { id: 'R', kind: 'Z', a: 1, b: 2, z: cx(10, 0) },
      { id: 'L', kind: 'Z', a: 2, b: 3, z: cx(0, XL) },
      { id: 'C', kind: 'Z', a: 3, b: 0, z: cx(0, -XC) },
    ] });
    expect(s.ok).toBe(true);
    const Z = Math.hypot(10, XL - XC);
    close(abs(s.current.R), 230 / Z);
    // la corriente va retrasada si XL > XC (inductivo): fase de I respecto de V = −atan((XL−XC)/R)
    // (la corriente "a→b" de R, cuyo sentido es el de V positivo hacia carga)
    close(arg(s.current.R), -Math.atan2(XL - XC, 10), 1e-6);
  });
  it('divisor RC: |Vc/Vin| = 1/√(1+(ωRC)²)', () => {
    const R = 1000, C = 1e-6;
    const s = solveAC({ nodeCount: 3, elements: [
      { id: 'V', kind: 'V', a: 1, b: 0, v: cx(10, 0) },
      { id: 'R', kind: 'Z', a: 1, b: 2, z: cx(R, 0) },
      { id: 'C', kind: 'Z', a: 2, b: 0, z: cx(0, -1 / (w * C)) },
    ] });
    close(abs(s.nodeV[2]) / 10, 1 / Math.sqrt(1 + (w * R * C) ** 2), 1e-9);
  });
  it('potencia: P = Re(V·I*), Q = Im(V·I*) en carga R+L', () => {
    const s = solveAC({ nodeCount: 3, elements: [
      { id: 'V', kind: 'V', a: 1, b: 0, v: cx(230, 0) },
      { id: 'Z', kind: 'Z', a: 1, b: 0, z: cx(30, 40) },
    ] });
    const I = abs(s.current.Z);
    close(I, 230 / 50);
    close(I * I * 30, 230 * I * 0.6, 1e-6); // P = V·I·cosφ con cosφ = 0,6
  });
  it('resonancia: con XL = XC la corriente es V/R y está en fase', () => {
    const L = 0.1, C = 1 / (w * w * L);
    const s = solveAC({ nodeCount: 4, elements: [
      { id: 'V', kind: 'V', a: 1, b: 0, v: cx(100, 0) },
      { id: 'R', kind: 'Z', a: 1, b: 2, z: cx(20, 0) },
      { id: 'L', kind: 'Z', a: 2, b: 3, z: cx(0, w * L) },
      { id: 'C', kind: 'Z', a: 3, b: 0, z: cx(0, -1 / (w * C)) },
    ] });
    close(abs(s.current.R), 5, 1e-6);
    close(arg(s.current.R), 0, 1e-6);
  });
  it('corrección del factor de potencia: un condensador en paralelo reduce la corriente de línea', () => {
    const base = (withC: boolean) => solveAC({ nodeCount: 2, elements: [
      { id: 'V', kind: 'V', a: 1, b: 0, v: cx(230, 0) },
      { id: 'Z', kind: 'Z', a: 1, b: 0, z: cx(30, 40) },
      ...(withC ? [{ id: 'C', kind: 'Z' as const, a: 1, b: 0, z: cx(0, -1 / (w * 100e-6)) }] : []),
    ] });
    const a = base(false), b = base(true);
    expect(abs(b.current.V)).toBeLessThan(abs(a.current.V));
  });
});
