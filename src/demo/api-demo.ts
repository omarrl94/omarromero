/**
 * API simulada SOLO para la demostración (build con VITE_DEMO=true): cuentas, roles, doble factor
 * y panel de administración en el navegador, con los datos ficticios de tests/fixtures.
 * El build de producción no la incluye: lo comprueba `npm run comprobar:bundle`.
 */
import empresas from '../../tests/fixtures/empresas.ficticias.json';
import ofertas from '../../tests/fixtures/ofertas.ficticias.json';
import { config } from '../../config/ffe.config';
import type { CacheOfertas, Empresa } from '../../shared/schemas';
import { auth } from '../lib/auth';

export const CODIGO_DEMO_2FA = '123456';
type Rol = 'alumno' | 'tutor' | 'superadmin' | 'pendiente' | 'bloqueado';
interface UsuarioDemo {
  uid: string;
  email: string;
  nombre: string;
  tipo: 'alumno' | 'profesor';
  rol: Rol;
  creado: string;
  actualizado: string;
}

const CLAVE_USUARIOS = 'conecta-ffe-demo:usuarios';
const CLAVE_VERIFICADOS = 'conecta-ffe-demo:verificados';
const CLAVE_2FA = 'conecta-ffe-demo:2fa';
const espera = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const leer = <T,>(clave: string, defecto: T, s: Storage = localStorage): T => {
  try {
    return JSON.parse(s.getItem(clave) ?? 'null') ?? defecto;
  } catch {
    return defecto;
  }
};
const guardar = (clave: string, v: unknown, s: Storage = localStorage) => {
  try {
    s.setItem(clave, JSON.stringify(v));
  } catch {
    /* sin almacenamiento */
  }
};

export class ErrorDemo extends Error {
  constructor(mensaje: string, public estado: number, public datos: Record<string, unknown> = {}) {
    super(mensaje);
  }
}

async function actual(): Promise<{ email: string; nombre: string } | null> {
  const t = await auth.token();
  if (!t) return null;
  const b64 = t.slice(7).replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(decodeURIComponent(escape(atob(b64))));
}

const tipoDe = (email: string): 'alumno' | 'profesor' | null => (email.endsWith('@' + config.cuentas.dominioAlumnado) ? 'alumno' : email.endsWith('@' + config.cuentas.dominioProfesorado) ? 'profesor' : null);

function usuario(email: string, nombre: string): UsuarioDemo | null {
  const usuarios = leer<Record<string, UsuarioDemo>>(CLAVE_USUARIOS, {});
  if (usuarios[email]) return usuarios[email];
  const verificados = leer<string[]>(CLAVE_VERIFICADOS, []);
  const tipo = tipoDe(email);
  if (!verificados.includes(email) || !tipo) return null;
  const ahora = new Date().toISOString();
  const rol: Rol = (config.cuentas.superadmins as readonly string[]).includes(email) ? 'superadmin' : tipo === 'alumno' ? 'alumno' : 'pendiente';
  const u = { uid: email, email, nombre, tipo, rol, creado: ahora, actualizado: ahora } as UsuarioDemo;
  guardar(CLAVE_USUARIOS, { ...usuarios, [email]: u });
  return u;
}

async function estado() {
  const yo = await actual();
  if (!yo) throw new ErrorDemo('Inicia sesión.', 401);
  const verificado = leer<string[]>(CLAVE_VERIFICADOS, []).includes(yo.email);
  const u = usuario(yo.email, yo.nombre);
  const rol = u?.rol ?? null;
  const necesita = rol === 'tutor' || rol === 'superadmin';
  return {
    email: yo.email,
    verificado,
    tipo: tipoDe(yo.email),
    rol,
    nombre: u?.nombre ?? yo.nombre,
    necesitaDobleFactor: necesita,
    dobleFactorOk: necesita ? leer<string | null>(CLAVE_2FA, null, sessionStorage) === yo.email : true,
    correoConfigurado: true,
  };
}

export const apiDemo = {
  estado: async () => {
    await espera();
    return estado();
  },
  async accion(accion: string, datos: Record<string, unknown>) {
    await espera();
    const yo = await actual();
    if (accion === 'restablecer') return { ok: true };
    if (!yo) throw new ErrorDemo('Inicia sesión.', 401);
    if (accion === 'verificacion') {
      if (!tipoDe(yo.email)) throw new ErrorDemo(`Solo se admiten correos @${config.cuentas.dominioAlumnado} o @${config.cuentas.dominioProfesorado}.`, 403);
      return { ok: true, demo: true };
    }
    if (accion === 'demo-verificar') {
      guardar(CLAVE_VERIFICADOS, [...new Set([...leer<string[]>(CLAVE_VERIFICADOS, []), yo.email])]);
      return { ok: true };
    }
    if (accion === 'enviar-codigo') return { ok: true, codigoDemo: CODIGO_DEMO_2FA };
    if (accion === 'verificar-codigo') {
      if (String(datos.codigo ?? '') !== CODIGO_DEMO_2FA) throw new ErrorDemo('Código incorrecto.', 401);
      guardar(CLAVE_2FA, yo.email, sessionStorage);
      return { ok: true };
    }
    if (accion === 'salir') {
      guardar(CLAVE_2FA, null, sessionStorage);
      return { ok: true };
    }
    if (accion === 'borrar-cuenta') {
      const usuarios = leer<Record<string, UsuarioDemo>>(CLAVE_USUARIOS, {});
      delete usuarios[yo.email];
      guardar(CLAVE_USUARIOS, usuarios);
      guardar(CLAVE_VERIFICADOS, leer<string[]>(CLAVE_VERIFICADOS, []).filter((e) => e !== yo.email));
      return { ok: true };
    }
    return { ok: true };
  },
  async listarUsuarios() {
    const e = await estado();
    if (e.rol !== 'superadmin' || !e.dobleFactorOk) throw new ErrorDemo('Solo para superadmin.', 403);
    const usuarios = Object.values(leer<Record<string, UsuarioDemo>>(CLAVE_USUARIOS, {}));
    return { usuarios: usuarios.map((u) => ({ ...u, fijo: (config.cuentas.superadmins as readonly string[]).includes(u.email) })) };
  },
  async cambiarRol(uid: string, rol: Rol) {
    const e = await estado();
    if (e.rol !== 'superadmin' || !e.dobleFactorOk) throw new ErrorDemo('Solo para superadmin.', 403);
    const usuarios = leer<Record<string, UsuarioDemo>>(CLAVE_USUARIOS, {});
    if (!usuarios[uid]) throw new ErrorDemo('Usuario no encontrado', 404);
    if ((config.cuentas.superadmins as readonly string[]).includes(uid) || uid === e.email) throw new ErrorDemo('No se puede cambiar este rol.', 403);
    usuarios[uid] = { ...usuarios[uid], rol, actualizado: new Date().toISOString() };
    guardar(CLAVE_USUARIOS, usuarios);
    return { ok: true };
  },
  async empresas() {
    await espera();
    const e = await estado().catch(() => null);
    if (!e) throw new ErrorDemo('Inicia sesión para ver las empresas.', 401);
    if (!e.rol || !['alumno', 'tutor', 'superadmin'].includes(e.rol) || !e.dobleFactorOk) throw new ErrorDemo('No tienes acceso al directorio.', 403);
    return { empresas: empresas as Empresa[], total: empresas.length };
  },
  async ofertas() {
    await espera();
    return ofertas as CacheOfertas;
  },
  async retirada() {
    await espera();
  },
};
