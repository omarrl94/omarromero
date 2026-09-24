/**
 * Normaliza la región del pooler de Supabase en las cadenas de conexión.
 *
 * El host del pooler es `aws-0-<REGION>.pooler.supabase.com`. Si en las variables
 * de entorno se configuró una región equivocada, aquí se corrige a la real del
 * proyecto (por defecto `eu-central-1`, o la que indique SUPABASE_REGION).
 */
export function normalizeRegion(url: string | undefined): string | undefined {
  if (!url) return url;
  const region = process.env.SUPABASE_REGION || "eu-central-1";
  return url.replace(/aws-0-[a-z0-9-]+\.pooler\.supabase\.com/gi, `aws-0-${region}.pooler.supabase.com`);
}

/**
 * Prepara las variables de entorno de conexión (idempotente):
 *  - Si falta DATABASE_URL pero hay DIRECT_URL, usa DIRECT_URL (o viceversa).
 *  - Corrige la región del pooler en ambas.
 */
export function fixSupabaseEnv(): void {
  if (!process.env.DATABASE_URL && process.env.DIRECT_URL) {
    process.env.DATABASE_URL = process.env.DIRECT_URL;
  }
  if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
  }
  if (process.env.DATABASE_URL) process.env.DATABASE_URL = normalizeRegion(process.env.DATABASE_URL);
  if (process.env.DIRECT_URL) process.env.DIRECT_URL = normalizeRegion(process.env.DIRECT_URL);
}
