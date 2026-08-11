import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase (solo Realtime: canales Broadcast + Presence).
 * Se crea de forma perezosa para que `next build` no exija las
 * variables de entorno; en runtime, si faltan, la UI muestra un
 * aviso de configuración en lugar de romper.
 */

let client: SupabaseClient | null = null;

export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client;
  const config = getSupabaseConfig();
  if (!config) return null;
  client = createClient(config.url, config.anonKey, {
    auth: { persistSession: false },
    realtime: {
      // Latido frecuente para detectar cortes y reconectar rápido.
      heartbeatIntervalMs: 15000,
      params: { eventsPerSecond: 10 },
    },
  });
  return client;
}
