import { rm } from 'node:fs/promises';
import { afterAll, describe, expect, it } from 'vitest';
import { actualizarOfertas, leerCache } from '../../server/actualizar-ofertas';
import { adzuna, urlAdzuna } from '../../server/fuentes/adzuna';
import { fuentesAts } from '../../server/fuentes/ats';
import { infojobs } from '../../server/fuentes/infojobs';
import fixtures from '../fixtures/empresas.ficticias.json';
import type { Empresa } from '../../shared/schemas';

for (const v of ["NETLIFY", "SITE_ID", "NETLIFY_BLOBS_CONTEXT"]) delete process.env[v];
afterAll(async () => rm('.blobs-local/ofertas', { recursive: true, force: true }));

const ahora = new Date('2026-11-05T06:00:00Z');

function fetchFalso(rutas: Record<string, unknown>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const clave = Object.keys(rutas).find((k) => url.includes(k));
    if (!clave) return new Response('no', { status: 404 });
    const v = rutas[clave];
    if (v instanceof Error) throw v;
    return new Response(JSON.stringify(v), { status: 200 });
  }) as typeof fetch;
}

describe('actualizarOfertas', () => {
  it('normaliza, marca fuentes y conserva la caché si una fuente falla', async () => {
    process.env.ADZUNA_APP_ID = 'id';
    process.env.ADZUNA_APP_KEY = 'secreta';
    delete process.env.INFOJOBS_CLIENT_ID;
    const empresas = [{ ...(fixtures[0] as Empresa), feedAts: { proveedor: 'greenhouse' as const, identificador: 'ficticia' } }];
    const fuentes = [adzuna, infojobs, ...fuentesAts(empresas)];
    const f = fetchFalso({
      'api.adzuna.com': {
        results: [
          { id: 1, title: 'Prácticas desarrollo web', created: '2026-11-01T10:00:00Z', redirect_url: 'https://www.adzuna.es/details/1', company: { display_name: 'Acme' }, location: { display_name: 'Madrid' }, contract_time: 'full_time' },
          { id: 2, title: 'Senior Java Developer', created: '2026-11-01T10:00:00Z', redirect_url: 'https://www.adzuna.es/details/2' },
        ],
      },
      'boards-api.greenhouse.io': {
        jobs: [
          { id: 9, title: 'Software Engineering Intern', updated_at: '2026-11-02T10:00:00Z', absolute_url: 'https://job-boards.greenhouse.io/f/9', location: { name: 'Madrid, Spain' } },
          { id: 10, title: 'Software Engineering Intern', updated_at: '2026-11-02T10:00:00Z', absolute_url: 'https://job-boards.greenhouse.io/f/10', location: { name: 'New York' } },
        ],
      },
      'api.lever.co': [],
    });
    const { cache } = await actualizarOfertas({ fuentes, fetchImpl: f, ahora });
    expect(cache.ofertas.map((o) => o.titulo).sort()).toEqual(['Prácticas desarrollo web', 'Software Engineering Intern']);
    const estado = Object.fromEntries(cache.fuentes.map((s) => [s.id, s.estado]));
    expect(estado).toMatchObject({ adzuna: 'ok', infojobs: 'sin-configurar', greenhouse: 'ok', lever: 'sin-configurar' });

    const f2 = fetchFalso({ 'api.adzuna.com': new Error('HTTP 500 app_key=secreta'), 'boards-api.greenhouse.io': { jobs: [] } });
    const { cache: c2 } = await actualizarOfertas({ fuentes, fetchImpl: f2, ahora });
    const ad = c2.fuentes.find((s) => s.id === 'adzuna')!;
    expect(ad.estado).toBe('error');
    expect(ad.mensaje).not.toContain('secreta');
    expect(c2.ofertas.some((o) => o.fuente === 'adzuna')).toBe(true);
    expect((await leerCache()).actualizado).toBe(ahora.toISOString());
  });

  it('construye la URL de Adzuna para España y Madrid', () => {
    const u = new URL(urlAdzuna(1, 'a', 'b'));
    expect(u.pathname).toBe('/v1/api/jobs/es/search/1');
    expect(u.searchParams.get('where')).toBe('Madrid');
  });
});
