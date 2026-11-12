// Contrato de la capa de datos. Dos implementaciones: local (IndexedDB) y Firebase.
export interface Sesion { uid: string; alias: string; claseCodigo: string; rol: 'alumno' | 'profesor' }

export interface EstadoJuego {
  xp: number; dinero: number; reputacion: number; inventario: string[]; logros: string[]; vidas: number;
}
export const ESTADO_INICIAL: EstadoJuego = { xp: 0, dinero: 0, reputacion: 50, inventario: [], logros: [], vidas: 3 };

export interface Intento {
  distrito: number; nivel: number; seed: string; pe_obtained: number; pe_max: number;
  lives_lost: number; consult_count: number; time_s: number; ts: number;
}

export interface Respuesta {
  item_id: string; distrito: number; nivel: number; ra: string[]; ce: string[];
  correct: boolean; cite_ok: boolean; hint_used: number; pe_obtained: number; pe_max: number;
  seguridad: boolean; ts: number;
}

export interface Repo {
  readonly modo: 'local' | 'nube';
  sesionActual(): Promise<Sesion | null>;
  entrarComoAlumno(claseCodigo: string, alias: string): Promise<Sesion>;
  salir(): Promise<void>;
  cargarEstado(uid: string): Promise<EstadoJuego>;
  guardarEstado(uid: string, e: EstadoJuego): Promise<void>;
  registrarIntento(uid: string, i: Intento): Promise<void>;
  intentos(uid: string): Promise<Intento[]>;
  guardarRespuestas(uid: string, r: Respuesta[]): Promise<void>;
  respuestas(uid: string): Promise<Respuesta[]>;
  /** Ajustes del profesor (solo en la nube): se leen al iniciar sesión. */
  cargarOverrides?(uid: string): Promise<unknown>;
  registrarEvento(uid: string, tipo: string, datos?: Record<string, unknown>): Promise<void>;
}

export const normalizaCodigo = (c: string) => c.trim().toUpperCase().replace(/\s+/g, '');
export const normalizaAlias = (a: string) => a.trim().replace(/\s+/g, ' ').slice(0, 24);
export function validaEntrada(codigo: string, alias: string): string | null {
  if (!/^[A-Z0-9-]{4,16}$/.test(normalizaCodigo(codigo))) return 'El código de clase debe tener entre 4 y 16 letras o números.';
  if (normalizaAlias(alias).length < 2) return 'El alias debe tener al menos 2 caracteres.';
  return null;
}
