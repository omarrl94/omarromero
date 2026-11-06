/**
 * API simulada SOLO para la versión de demostración (build con VITE_DEMO=true).
 * Usa los datos ficticios de tests/fixtures (dominios .test y example.com).
 * El build de producción no la incluye: lo comprueba `npm run comprobar:bundle`.
 */
import empresas from '../../tests/fixtures/empresas.ficticias.json';
import ofertas from '../../tests/fixtures/ofertas.ficticias.json';
import type { CacheOfertas, Empresa } from '../../shared/schemas';

export const CODIGO_DEMO = 'demo-ffe';
export const CODIGO_DEMO_TUTOR = 'demo-tutor';
const CLAVE = 'conecta-ffe-demo:sesion';
const espera = (ms = 350) => new Promise((r) => setTimeout(r, ms));

type RolDemo = 'alumno' | 'tutor';
function rolSesion(): RolDemo | null {
  try {
    const v = sessionStorage.getItem(CLAVE);
    return v === 'tutor' ? 'tutor' : v ? 'alumno' : null;
  } catch {
    return (globalThis as { __sesionDemo?: RolDemo | null }).__sesionDemo ?? null;
  }
}
const sesion = () => rolSesion() !== null;
function fijarSesion(rol: RolDemo | null) {
  (globalThis as { __sesionDemo?: RolDemo | null }).__sesionDemo = rol;
  try {
    if (rol) sessionStorage.setItem(CLAVE, rol);
    else sessionStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento: queda en memoria */
  }
}

export class ErrorDemo extends Error {
  constructor(mensaje: string, public estado: number) {
    super(mensaje);
  }
}

export const apiDemo = {
  async estadoAcceso() {
    const rol = rolSesion();
    return { autenticado: rol !== null, rol };
  },
  async entrar(codigo: string) {
    await espera();
    const rol: RolDemo | null = codigo.trim() === CODIGO_DEMO_TUTOR ? 'tutor' : codigo.trim() === CODIGO_DEMO ? 'alumno' : null;
    if (!rol) throw new ErrorDemo(`Código incorrecto. En la demostración: «${CODIGO_DEMO}» (alumnado) o «${CODIGO_DEMO_TUTOR}» (tutores).`, 401);
    fijarSesion(rol);
    return { autenticado: true, rol };
  },
  async salir() {
    fijarSesion(null);
    return { autenticado: false, rol: null };
  },
  async empresas() {
    await espera();
    if (!sesion()) throw new ErrorDemo('Necesitas el código de acceso del centro.', 401);
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
