/**
 * Proveedor de pruebas (E2E y demostración). El servidor solo acepta sus tokens fuera de Netlify.
 * Nunca se usa en producción: se activa con VITE_AUTH=prueba o en la demo.
 */
import type { ProveedorAuth, UsuarioAuth } from './tipos';
import { ErrorAuth } from './tipos';

const CUENTAS = 'conecta-ffe-prueba:cuentas';
const ACTUAL = 'conecta-ffe-prueba:actual';
const oyentes = new Set<(u: UsuarioAuth | null) => void>();

const leerCuentas = (): Record<string, { clave: string; nombre: string }> => {
  try {
    return JSON.parse(localStorage.getItem(CUENTAS) ?? '{}');
  } catch {
    return {};
  }
};
const actual = (): UsuarioAuth | null => {
  try {
    return JSON.parse(sessionStorage.getItem(ACTUAL) ?? 'null');
  } catch {
    return null;
  }
};
function fijar(u: UsuarioAuth | null) {
  try {
    if (u) sessionStorage.setItem(ACTUAL, JSON.stringify(u));
    else sessionStorage.removeItem(ACTUAL);
  } catch {
    /* sin almacenamiento */
  }
  oyentes.forEach((o) => o(u));
}
// Huella sencilla: solo para pruebas, nunca para contraseñas reales.
const huella = (s: string) => btoa(unescape(encodeURIComponent(s))).split('').reverse().join('');

export const proveedorPrueba: ProveedorAuth = {
  tipo: 'prueba',
  escuchar(cb) {
    oyentes.add(cb);
    queueMicrotask(() => cb(actual()));
    return () => oyentes.delete(cb);
  },
  async registrar(email, password, nombre) {
    const e = email.trim().toLowerCase();
    const c = leerCuentas();
    if (c[e]) throw new ErrorAuth('Ya hay una cuenta con ese correo. Inicia sesión o restablece la contraseña.');
    if (password.length < 8) throw new ErrorAuth('La contraseña es demasiado débil: usa al menos 8 caracteres.');
    c[e] = { clave: huella(password), nombre };
    localStorage.setItem(CUENTAS, JSON.stringify(c));
    fijar({ uid: e, email: e, nombre });
  },
  async entrar(email, password) {
    const e = email.trim().toLowerCase();
    const c = leerCuentas()[e];
    if (!c || c.clave !== huella(password)) throw new ErrorAuth('Correo o contraseña incorrectos.');
    fijar({ uid: e, email: e, nombre: c.nombre });
  },
  async salir() {
    fijar(null);
  },
  async token() {
    const u = actual();
    if (!u) return null;
    const json = JSON.stringify({ email: u.email, nombre: u.nombre });
    const b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `prueba.${b64}`;
  },
  async verificacionFirebase() {
    /* no aplica */
  },
};
