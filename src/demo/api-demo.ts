/**
 * API simulada SOLO para la versión de demostración (build con VITE_DEMO=true).
 * Usa los datos ficticios de tests/fixtures (dominios .test y example.com).
 * El build de producción no la incluye: lo comprueba `npm run comprobar:bundle`.
 */
import empresas from '../../tests/fixtures/empresas.ficticias.json';
import ofertas from '../../tests/fixtures/ofertas.ficticias.json';
import type { CacheOfertas, Empresa } from '../../shared/schemas';

export const CODIGO_DEMO = 'demo-ffe';
const CLAVE = 'conecta-ffe-demo:sesion';
const espera = (ms = 350) => new Promise((r) => setTimeout(r, ms));

function sesion(): boolean {
  try {
    return sessionStorage.getItem(CLAVE) === '1';
  } catch {
    return (globalThis as { __sesionDemo?: boolean }).__sesionDemo === true;
  }
}
function fijarSesion(v: boolean) {
  (globalThis as { __sesionDemo?: boolean }).__sesionDemo = v;
  try {
    if (v) sessionStorage.setItem(CLAVE, '1');
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
    return { autenticado: sesion() };
  },
  async entrar(codigo: string) {
    await espera();
    if (codigo.trim() !== CODIGO_DEMO) throw new ErrorDemo(`Código incorrecto. En la demostración es «${CODIGO_DEMO}».`, 401);
    fijarSesion(true);
    return { autenticado: true };
  },
  async salir() {
    fijarSesion(false);
    return { autenticado: false };
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
