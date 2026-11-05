import { describe, expect, it } from 'vitest';
import { verificar, type Dependencias } from '../../scripts/verificar-empresas';
import type { Pagina } from '../../scripts/lib/red';
import type { Candidata } from '../../shared/schemas';

function webs(mapa: Record<string, string>): Dependencias['descargar'] {
  return async (url: string): Promise<Pagina> =>
    url in mapa ? { url, urlFinal: url, estado: 200, html: mapa[url] } : { url, urlFinal: url, estado: 404, html: '' };
}
const deps = (mapa: Record<string, string>, mx: Record<string, boolean> = {}): Dependencias => ({
  descargar: webs(mapa),
  tieneMx: async (d) => mx[d] ?? true,
  hoy: () => '2026-11-05',
});

const base: Candidata = {
  id: 'acme', nombre: 'Acme', web: 'https://www.acme.test', sector: 'Software', tamano: 'pyme', zona: 'madrid',
  perfiles: ['dam-web'], motivoEncaje: 'Desarrollo web para clientes.', paginasContacto: ['https://www.acme.test'], tipoContactoEsperado: 'general',
};

describe('verificar (integración sin red)', () => {
  it('extrae el correo de la página de empleo y guarda la URL exacta', async () => {
    const { r, empresa } = await verificar(base, [], deps({
      'https://www.acme.test': '<a href="/trabaja-con-nosotros">Trabaja con nosotros</a><a href="/contacto">Contacto</a> info@acme.test',
      'https://www.acme.test/trabaja-con-nosotros': '<p>Envía tu CV a <a href="mailto:talento@acme.test">talento@acme.test</a></p><a href="https://jobs.lever.co/acme">ofertas</a>',
      'https://www.acme.test/contacto': '<p>Contacto: info@acme.test · Prensa: prensa@acme.test · Ana: ana.lopez@acme.test</p>',
      'https://api.lever.co/v0/postings/acme?mode=json': '[]',
    }));
    expect(r.estado).toBe('valida');
    expect(empresa?.contacto).toEqual({ tipo: 'email', email: 'talento@acme.test', fuenteUrl: 'https://www.acme.test/trabaja-con-nosotros', tipoContacto: 'talento' });
    expect(empresa?.verificacion).toMatchObject({ fecha: '2026-11-05', confianza: 'alta', mx: true });
    expect(empresa?.feedAts).toEqual({ proveedor: 'lever', identificador: 'acme' });
    expect(empresa?.empleoUrl).toBe('https://www.acme.test/trabaja-con-nosotros');
    expect(empresa?.programaPracticas).toBeUndefined();
  });

  it('rechaza correos sin MX y usa el formulario oficial', async () => {
    const { empresa } = await verificar(base, [], deps(
      {
        'https://www.acme.test': '<a href="/empleo">Empleo</a> rrhh@acme.test',
        'https://www.acme.test/empleo': '<form action="/candidatura"><input name="cv"></form>',
      },
      { 'acme.test': false },
    ));
    expect(empresa?.contacto).toMatchObject({ tipo: 'formulario', formularioUrl: 'https://www.acme.test/empleo' });
    expect(empresa?.verificacion.confianza).toBe('media');
  });

  it('descarta sin correo válido ni formulario, y si la web no responde', async () => {
    const sinNada = await verificar(base, [], deps({ 'https://www.acme.test': '<p>laura.garcia@acme.test · contacto@gmail.com</p>' }));
    expect(sinNada.r.estado).toBe('descartada');
    expect(sinNada.r.motivo).toMatch(/posible correo personal/);
    const caida = await verificar(base, [], deps({}));
    expect(caida.r.motivo).toMatch(/La web no responde/);
  });

  it('descarta webs que redirigen a otro dominio', async () => {
    const deps2 = deps({});
    deps2.descargar = async (url) => ({ url, urlFinal: 'https://www.otra-empresa.test/', estado: 200, html: 'talento@otra-empresa.test' });
    const { r } = await verificar(base, [], deps2);
    expect(r.motivo).toMatch(/redirige a otro dominio/);
  });

  it('respeta las retiradas', async () => {
    const { r } = await verificar(base, [{ dominio: 'acme.test', fecha: '2026-11-01' }], deps({}));
    expect(r.motivo).toMatch(/Retirada/);
  });

  it('solo marca programa de prácticas si la URL indicada lo menciona', async () => {
    const { empresa } = await verificar({ ...base, programaPracticasUrl: 'https://www.acme.test/becas' }, [], deps({
      'https://www.acme.test': '<a href="/contacto">Contacto</a>',
      'https://www.acme.test/contacto': 'empleo@acme.test',
      'https://www.acme.test/becas': '<title>Programa de Becas Acme | Acme</title><p>Becas para estudiantes de FP</p>',
    }));
    expect(empresa?.programaPracticas).toEqual({ titulo: 'Programa de Becas Acme', url: 'https://www.acme.test/becas', fechaComprobacion: '2026-11-05' });
  });
});
