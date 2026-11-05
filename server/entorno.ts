/** Detecta si el código corre en Netlify (producción o deploy preview). */
export function enNetlify(): boolean {
  return Boolean(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT || process.env.SITE_ID);
}

/**
 * Modo de pruebas: solo fuera de Netlify y con CONECTA_MODO=pruebas.
 * En Netlify nunca se activa, aunque alguien defina la variable: así es imposible
 * servir datos simulados en producción.
 */
export function modoPruebas(): boolean {
  return process.env.CONECTA_MODO === 'pruebas' && !enNetlify();
}

export function variable(nombre: string): string | undefined {
  const v = process.env[nombre];
  return v && v.trim() ? v.trim() : undefined;
}
