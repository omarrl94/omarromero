/**
 * Punto único de acceso al backend:
 *   · Firebase (VITE_FIREBASE_CONFIG) — producción, plan gratuito Spark.
 *   · Mock local (modo demo) si no hay configuración, con idéntica interfaz.
 */
import { createFirebaseBackend, parseFirebaseConfig } from './firebaseBackend';
import { mockBackend } from './mockBackend';

// import.meta.env.X se sustituye al compilar: el backend no usado sale del paquete
const firebaseConfig = import.meta.env.VITE_FIREBASE_CONFIG ? parseFirebaseConfig(import.meta.env.VITE_FIREBASE_CONFIG) : null;

export const backend = firebaseConfig
  ? createFirebaseBackend(firebaseConfig, { emulator: import.meta.env.VITE_FIREBASE_EMULATOR_HOST })
  : mockBackend;
export const isDemoMode = backend.mode === 'mock';
