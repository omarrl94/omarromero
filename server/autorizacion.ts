/** Quién es el usuario de la petición y qué puede hacer. */
import { dobleFactorValido } from './doble-factor';
import { identificar, type Identidad } from './identidad';
import { guardarUsuario, obtenerUsuario, rolEfectivo, rolInicial, tipoPorCorreo, type Rol, type Usuario } from './usuarios';

export interface Contexto {
  identidad: Identidad;
  usuario: Usuario | null;
  rol: Rol | null;
  /** Tutores y superadmin necesitan el segundo factor; el alumnado no. */
  necesitaDobleFactor: boolean;
  dobleFactorOk: boolean;
}

export const ROLES_CON_DOBLE_FACTOR: Rol[] = ['tutor', 'superadmin'];

/**
 * Crea o actualiza el usuario de una identidad verificada (alta automática por dominio).
 * Devuelve null si el correo no está verificado o el dominio no se admite.
 */
export async function asegurarUsuario(id: Identidad, nombre?: string): Promise<{ usuario: Usuario; creado: boolean } | null> {
  const existente = await obtenerUsuario(id.uid);
  if (existente) return { usuario: existente, creado: false };
  if (!id.verificado) return null;
  const tipo = tipoPorCorreo(id.email);
  const rol = rolInicial(id.email);
  if (!tipo || !rol) return null;
  const ahora = new Date().toISOString();
  const u: Usuario = { uid: id.uid, email: id.email, nombre: (nombre ?? id.nombre ?? '').slice(0, 120), tipo, rol, creado: ahora, actualizado: ahora };
  await guardarUsuario(u);
  return { usuario: u, creado: true };
}

export async function contexto(req: Request): Promise<Contexto | null> {
  const identidad = await identificar(req);
  if (!identidad) return null;
  let usuario = identidad.verificado ? await obtenerUsuario(identidad.uid) : null;
  // Alta automática del alumnado y de los superadmin desde cualquier ruta. El profesorado se da de
  // alta en /api/cuenta, que además avisa al superadmin de la solicitud.
  if (identidad.verificado && !usuario && rolInicial(identidad.email) !== 'pendiente') usuario = (await asegurarUsuario(identidad))?.usuario ?? null;
  const rol = usuario ? rolEfectivo(usuario) : null;
  const necesitaDobleFactor = rol !== null && ROLES_CON_DOBLE_FACTOR.includes(rol);
  return { identidad, usuario, rol, necesitaDobleFactor, dobleFactorOk: necesitaDobleFactor ? await dobleFactorValido(req, identidad.uid) : true };
}

/** ¿Puede ver el directorio de empresas? */
export function puedeVerDirectorio(c: Contexto | null): boolean {
  return Boolean(c && c.rol && ['alumno', 'tutor', 'superadmin'].includes(c.rol) && c.dobleFactorOk);
}

export function esTutor(c: Contexto | null): boolean {
  return Boolean(c && (c.rol === 'tutor' || c.rol === 'superadmin') && c.dobleFactorOk);
}

export function esSuperadmin(c: Contexto | null): boolean {
  return Boolean(c && c.rol === 'superadmin' && c.dobleFactorOk);
}
