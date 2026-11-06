import { describe, expect, it } from 'vitest';
import cuenta from '../../netlify/functions/cuenta.mts';
import diagnostico from '../../netlify/functions/diagnostico.mts';

for (const v of ['NETLIFY', 'SITE_ID', 'NETLIFY_BLOBS_CONTEXT', 'CONECTA_MODO', 'MAIL_MODE']) delete process.env[v];

describe('configuración de Firebase mal puesta', () => {
  it('la API explica el problema (503) en lugar de caerse con un 502', async () => {
    process.env.FIREBASE_PROJECT_ID = 'conecta-ffe-123';
    process.env.FIREBASE_CLIENT_EMAIL = 'firebase-adminsdk-x@conecta-ffe-123.iam.gserviceaccount.com';
    process.env.FIREBASE_PRIVATE_KEY = 'esto-no-es-una-clave';
    const r = await cuenta(new Request('https://conecta.test/api/cuenta', { headers: { authorization: 'Bearer token-real-cualquiera' } }), {} as never);
    expect(r.status).toBe(503);
    expect(((await r.json()) as { error: string }).error).toMatch(/FIREBASE_PRIVATE_KEY no es válida/);
  });

  it('el diagnóstico señala formato, proyecto, correo y variables sobrantes sin mostrar valores', async () => {
    process.env.VITE_FIREBASE_PROJECT_ID = 'otro-proyecto';
    process.env.FIREBASE_SERVICE_ACCOUNT = '{"a":1}';
    process.env.ACCESS_CODE = 'viejo';
    const r = (await (await diagnostico()).json()) as { ok: boolean; problemas: string[]; variables: Record<string, boolean> };
    expect(r.ok).toBe(false);
    const todo = r.problemas.join(' | ');
    expect(todo).toMatch(/FIREBASE_PRIVATE_KEY no empieza/);
    expect(todo).toMatch(/no coincide con VITE_FIREBASE_PROJECT_ID/);
    expect(todo).toMatch(/Sobra FIREBASE_SERVICE_ACCOUNT/);
    expect(todo).toMatch(/Sobra ACCESS_CODE/);
    expect(todo).toMatch(/Falta el correo del centro/);
    expect(JSON.stringify(r)).not.toContain('esto-no-es-una-clave');
    expect(JSON.stringify(r)).not.toContain('viejo');
    expect(r.variables.FIREBASE_CLIENT_EMAIL).toBe(true);
    for (const k of ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'VITE_FIREBASE_PROJECT_ID', 'FIREBASE_SERVICE_ACCOUNT', 'ACCESS_CODE']) delete process.env[k];
  });
});
