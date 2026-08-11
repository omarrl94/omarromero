import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase (solo Realtime: canales Broadcast + Presence).
 *
 * Las variables se leen de process.env, que Next.js rellena en build
 * a partir de `.env.local` / `.env` (prefijo NEXT_PUBLIC_ para que
 * lleguen al navegador). Se sanean (comillas, espacios) y se validan
 * antes de inicializar el cliente: si algo falta o es inválido, la UI
 * muestra el aviso de configuración en lugar de romper.
 */

let client: SupabaseClient | null = null;

/** Limpia valores pegados con comillas o espacios en el .env. */
function sanitize(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']|["']$/g, "");
}

export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) return null;
  // Descarta placeholders del .env.example y URLs malformadas.
  if (!/^https:\/\/.+/.test(url) || url.includes("TU-PROYECTO")) return null;
  if (anonKey.length < 30 || anonKey.includes("tu-anon-key")) return null;

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
