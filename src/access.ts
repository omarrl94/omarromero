/**
 * Niveles de acceso:
 *  - visitante (sin cuenta): casi nada, solo una pila, una resistencia y el polímetro;
 *  - usuario (con cuenta): todo el simulador y el juego, con guardado en la nube;
 *  - superadmin: todo + panel de usuarios. Exige correo verificado (si no, cualquiera podría registrarse con ese correo).
 * Aviso: los límites se aplican en el navegador. La seguridad real de los datos son las reglas de Firestore.
 */
import type { User } from 'firebase/auth';
import { useAuth } from './auth';

export const ADMIN_EMAILS = ['omar.romero@jrotero.es'];
export type Level = 'visitor' | 'user' | 'admin';

export const isAdminEmail = (email?: string | null) => !!email && ADMIN_EMAILS.includes(email.toLowerCase());

export function levelOf(user: User | null, guest: boolean, demoFull: boolean): Level {
  if (user) return isAdminEmail(user.email) && user.emailVerified ? 'admin' : 'user';
  if (guest && demoFull) return 'admin';
  return 'visitor';
}

/** Lo único que puede usar un visitante. */
export const VISITOR_LIMITS: Record<string, number> = { battery: 1, resistor: 1 };
export const visitorAllows = (type: string) => type in VISITOR_LIMITS;

export const currentLevel = (): Level => { const a = useAuth.getState(); return levelOf(a.user, a.guest, a.demoFull); };
export function useLevel(): Level { const a = useAuth(); return levelOf(a.user, a.guest, a.demoFull); }

export const UPSELL = {
  components: 'En modo visitante solo puedes usar una pila y una resistencia.',
  limit: 'En modo visitante solo cabe una pila y una resistencia.',
  views: 'Las vistas multifilar, unifilar, real, el cuadro y el plano son para cuentas registradas.',
  instruments: 'El osciloscopio y el vatímetro son para cuentas registradas.',
  solve: 'Resolver el circuito por Kirchhoff, mallas, Thévenin… y generar el PDF es para cuentas registradas.',
  files: 'Guardar, abrir y los ejemplos son para cuentas registradas.',
  game: 'El modo juego «Instalador» es para cuentas registradas.',
  log: 'La hoja de medidas con exportación es para cuentas registradas.',
  extras: 'Esta función es para cuentas registradas.',
} as const;
