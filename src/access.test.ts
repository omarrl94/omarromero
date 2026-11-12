import { describe, it, expect } from 'vitest';
import { levelOf, isAdminEmail, visitorAllows, VISITOR_LIMITS } from './access';

const u = (email: string, emailVerified: boolean) => ({ email, emailVerified }) as never;

describe('niveles de acceso', () => {
  it('sin sesión es visitante y solo puede usar pila y resistencia', () => {
    expect(levelOf(null, true, false)).toBe('visitor');
    expect(levelOf(null, false, false)).toBe('visitor');
    expect(visitorAllows('battery')).toBe(true);
    expect(visitorAllows('resistor')).toBe(true);
    expect(visitorAllows('led')).toBe(false);
    expect(visitorAllows('acsource')).toBe(false);
    expect(VISITOR_LIMITS).toEqual({ battery: 1, resistor: 1 });
  });
  it('un usuario con cuenta es usuario; el superadmin exige correo verificado', () => {
    expect(levelOf(u('alumno@correo.es', false), false, false)).toBe('user');
    expect(levelOf(u('omar.romero@jrotero.es', true), false, false)).toBe('admin');
    expect(levelOf(u('OMAR.ROMERO@jrotero.es', true), false, false)).toBe('admin');
    expect(levelOf(u('omar.romero@jrotero.es', false), false, false)).toBe('user'); // sin verificar: no hay privilegios
    expect(isAdminEmail('otro@jrotero.es')).toBe(false);
  });
  it('la demostración sin Firebase puede dar acceso completo solo si se pide', () => {
    expect(levelOf(null, true, true)).toBe('admin');
  });
});
