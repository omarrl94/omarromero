import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { HAY_SUPABASE, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * Cliente de Supabase para el navegador, creado una sola vez.
 *
 * Devuelve null cuando no hay proyecto configurado: la app funciona
 * igual, con las cuentas en modo local.
 */
let cliente: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!HAY_SUPABASE) return null;
  cliente ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return cliente;
}
