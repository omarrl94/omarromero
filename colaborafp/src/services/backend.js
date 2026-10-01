/**
 * Punto único de acceso al backend.
 * Con credenciales de Supabase en el entorno → backend real.
 * Sin ellas → mock local (modo demo), con idéntica interfaz.
 */
import { mockBackend } from './mockBackend';
import { createSupabaseBackend } from './supabaseBackend';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const backend = url && key ? createSupabaseBackend(url, key) : mockBackend;
export const isDemoMode = backend.mode === 'mock';
