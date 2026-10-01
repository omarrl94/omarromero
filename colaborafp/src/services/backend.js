/**
 * Punto único de acceso al backend. Prioridad:
 *   1. Firebase  (VITE_FIREBASE_CONFIG)                        — recomendado, plan gratuito sin tarjeta
 *   2. Supabase  (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
 *   3. Mock local (modo demo), con idéntica interfaz
 */
import { createFirebaseBackend, parseFirebaseConfig } from './firebaseBackend';
import { mockBackend } from './mockBackend';
import { createSupabaseBackend } from './supabaseBackend';

// Se usa import.meta.env.X directamente para que Vite sustituya los valores al compilar
// y elimine del paquete los backends que no están configurados.
const firebaseConfig = import.meta.env.VITE_FIREBASE_CONFIG ? parseFirebaseConfig(import.meta.env.VITE_FIREBASE_CONFIG) : null;

const pickBackend = () => {
  if (firebaseConfig) return createFirebaseBackend(firebaseConfig, { emulator: import.meta.env.VITE_FIREBASE_EMULATOR_HOST });
  if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
    return createSupabaseBackend(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
  return mockBackend;
};

export const backend = pickBackend();
export const isDemoMode = backend.mode === 'mock';
