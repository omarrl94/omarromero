/** Usuarios y roles (solo servidor). Se guardan en Netlify Blobs (o en disco en desarrollo). */
import { config } from '../config/ffe.config';
import { almacen } from './almacen';
import { variable } from './entorno';

export type Rol = 'alumno' | 'tutor' | 'superadmin' | 'pendiente' | 'bloqueado';
export type Tipo = 'alumno' | 'profesor';

export interface Usuario {
  uid: string;
  email: string;
  nombre: string;
  tipo: Tipo;
  rol: Rol;
  creado: string;
  actualizado: string;
}

const a = () => almacen('usuarios');

export function superadmins(): string[] {
  const extra = (variable('SUPERADMIN_EMAILS') ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return [...new Set([...config.cuentas.superadmins.map((e) => e.toLowerCase()), ...extra])];
}

export function dominio(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? '';
}

/** Tipo de cuenta según el dominio del correo, o null si no se admite. */
export function tipoPorCorreo(email: string): Tipo | null {
  const d = dominio(email);
  if (d === config.cuentas.dominioAlumnado) return 'alumno';
  if (d === config.cuentas.dominioProfesorado) return 'profesor';
  return null;
}

/** Rol con el que empieza una cuenta verificada. */
export function rolInicial(email: string): Rol | null {
  const e = email.toLowerCase();
  if (superadmins().includes(e)) return 'superadmin';
  const t = tipoPorCorreo(e);
  if (t === 'alumno') return 'alumno';
  if (t === 'profesor') return 'pendiente';
  return null;
}

export async function obtenerUsuario(uid: string): Promise<Usuario | null> {
  return a().leer<Usuario>(`u-${uid}`);
}

export async function guardarUsuario(u: Usuario): Promise<void> {
  await a().guardar(`u-${u.uid}`, { ...u, actualizado: new Date().toISOString() });
}

export async function borrarUsuario(uid: string): Promise<void> {
  await a().guardar(`u-${uid}`, null);
}

/** Todos los usuarios (una clave por usuario: sin índice compartido que pueda pisarse). */
export async function listarUsuarios(): Promise<Usuario[]> {
  const claves = await a().claves('u-');
  const lista = await Promise.all(claves.map((k) => a().leer<Usuario>(k)));
  return lista.filter((u): u is Usuario => Boolean(u));
}

/** Los superadmin de la configuración siempre lo son (aunque alguien edite su rol). */
export function rolEfectivo(u: Usuario): Rol {
  return superadmins().includes(u.email.toLowerCase()) ? 'superadmin' : u.rol;
}
