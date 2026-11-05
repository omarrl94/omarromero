import { rm } from 'node:fs/promises';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import acceso from '../../netlify/functions/acceso.mts';
import empresas from '../../netlify/functions/empresas.mts';
import { crearToken, tokenValido } from '../../server/sesion';

process.env.SESSION_SECRET = 'x'.repeat(40);
process.env.ACCESS_CODE = 'codigo-de-prueba';
process.env.CONECTA_MODO = 'pruebas';
process.env.CONECTA_DATOS = 'ficticios';
for (const v of ["NETLIFY", "SITE_ID", "NETLIFY_BLOBS_CONTEXT"]) delete process.env[v];

const ctx = (ip: string) => ({ ip }) as never;
const post = (codigo: string) => new Request('https://conecta.test/api/acceso', { method: 'POST', body: JSON.stringify({ codigo }) });

beforeEach(async () => rm('.blobs-local/limites', { recursive: true, force: true }));
afterAll(async () => rm('.blobs-local/limites', { recursive: true, force: true }));

describe('sesión', () => {
  it('firma y caduca tokens', () => {
    const t = crearToken(Date.now());
    expect(tokenValido(t)).toBe(true);
    expect(tokenValido(t, Date.now() + 13 * 3600_000)).toBe(false);
    expect(tokenValido(t.slice(0, -2) + 'xx')).toBe(false);
    expect(tokenValido(undefined)).toBe(false);
  });
});

describe('API de acceso y empresas', () => {
  it('rechaza el directorio sin sesión', async () => {
    const r = await empresas(new Request('https://conecta.test/api/empresas'));
    expect(r.status).toBe(401);
    expect(await r.text()).not.toContain('@');
  });

  it('entrega el directorio con el código correcto y cookie segura', async () => {
    const r = await acceso(post('codigo-de-prueba'), ctx('1.1.1.1'));
    expect(r.status).toBe(200);
    const cookie = r.headers.get('set-cookie')!;
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Secure/);
    const valor = cookie.split(';')[0];
    const d = await empresas(new Request('https://conecta.test/api/empresas', { headers: { cookie: valor } }));
    expect(d.status).toBe(200);
    const datos = (await d.json()) as { total: number };
    expect(datos.total).toBe(4);
    expect(d.headers.get('x-robots-tag')).toContain('noindex');
  });

  it('limita los intentos fallidos por IP', async () => {
    for (let i = 0; i < 5; i++) expect((await acceso(post('mal'), ctx('2.2.2.2'))).status).toBe(401);
    const bloqueado = await acceso(post('codigo-de-prueba'), ctx('2.2.2.2'));
    expect(bloqueado.status).toBe(429);
    expect(bloqueado.headers.get('retry-after')).toBeTruthy();
    expect((await acceso(post('codigo-de-prueba'), ctx('3.3.3.3'))).status).toBe(200);
  });

  it('no deja entrar si falta ACCESS_CODE', async () => {
    const antes = process.env.ACCESS_CODE;
    delete process.env.ACCESS_CODE;
    expect((await acceso(post(''), ctx('4.4.4.4'))).status).toBe(503);
    process.env.ACCESS_CODE = antes;
  });

  it('explica el error si SESSION_SECRET es demasiado corto (en vez de un 502)', async () => {
    const antes = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = 'corto';
    const r = await acceso(post('codigo-de-prueba'), ctx('5.5.5.5'));
    expect(r.status).toBe(503);
    expect(((await r.json()) as { error: string }).error).toMatch(/SESSION_SECRET demasiado corto/);
    process.env.SESSION_SECRET = antes;
  });

  it('no usa datos ficticios si corre en Netlify', async () => {
    process.env.NETLIFY = 'true';
    const { cargarEmpresas } = await import('../../server/datos');
    const reales = await cargarEmpresas();
    expect(reales.some((e) => e.web.includes('.test') || e.id.startsWith('ficticia'))).toBe(false);
    delete process.env.NETLIFY;
  });
});
