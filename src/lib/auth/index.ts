import { proveedorFirebase, configFirebase } from './firebase';
import { proveedorPrueba } from './prueba';
import type { ProveedorAuth } from './tipos';

const sinConfigurar: ProveedorAuth = {
  tipo: 'sin-configurar',
  escuchar(cb) {
    queueMicrotask(() => cb(null));
    return () => undefined;
  },
  async registrar() {
    throw new Error('Las cuentas no están configuradas todavía (faltan las variables VITE_FIREBASE_*). Avisa a la coordinación de FFE.');
  },
  async entrar() {
    throw new Error('Las cuentas no están configuradas todavía (faltan las variables VITE_FIREBASE_*). Avisa a la coordinación de FFE.');
  },
  async salir() {},
  async token() {
    return null;
  },
  async verificacionFirebase() {},
};

/** Prueba en E2E y demo; Firebase si está configurado; si no, un aviso claro. */
export const auth: ProveedorAuth =
  import.meta.env.VITE_AUTH === 'prueba' || import.meta.env.VITE_DEMO === 'true' ? proveedorPrueba : configFirebase.apiKey ? proveedorFirebase : sinConfigurar;

export * from './tipos';
