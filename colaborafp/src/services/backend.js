/**
 * Punto único de acceso al backend. Prioridad:
 *   1. Firebase  (VITE_FIREBASE_CONFIG)                        — recomendado, plan gratuito sin tarjeta
 *   2. Supabase  (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
 *   3. Mock local (modo demo), con idéntica interfaz
 */
import { createFirebaseBackend, parseFirebaseConfig } from './firebaseBackend';
import { mockBackend } from './mockBackend';
import { createSupabaseBackend } from './supabaseBackend';

const env = import.meta.env;
const firebaseConfig = env.VITE_FIREBASE_CONFIG ? parseFirebaseConfig(env.VITE_FIREBASE_CONFIG) : null;

const pickBackend = () => {
  if (firebaseConfig) return createFirebaseBackend(firebaseConfig, { emulator: env.VITE_FIREBASE_EMULATOR_HOST });
  if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY)
    return createSupabaseBackend(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  return mockBackend;
};

export const backend = pickBackend();
export const isDemoMode = backend.mode === 'mock';
