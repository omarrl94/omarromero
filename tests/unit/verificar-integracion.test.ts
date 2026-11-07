import { describe, expect, it } from 'vitest';
import { portalesDeEmpleo, verificar, type Dependencias } from '../../scripts/verificar-empresas';
import type { Pagina } from '../../scripts/lib/red';
import type { Candidata } from '../../shared/schemas';
import type { ResultadoBuzon } from '../../scripts/lib/smtp';

function webs(mapa: Record<string, string>): Dependencias['descargar'] {
  return async (url: string): Promise<Pagina> =>
    url in mapa ? { url, urlFinal: url, estado: 200, html: mapa[url] } : { url, urlFinal: url, estado: 404, html: '' };
}
const FORM_REAL = '<form action="/candidatura"><label for="n">Nombre</label><input id="n" name="nombre"><label for="e">Correo electrónico</label><input id="e" type="email" name="email"><label for="cv">CV</label><input id="cv" type="file" name="cv"><button>Enviar</button></form>';
const deps = (mapa: Record<string, string>, mx: Record<string, boolean> = {}, buzones: Record<string, ResultadoBuzon> = {}): Dependencias => ({
  descargar: webs(mapa),
  tieneMx: async (d) => mx[d] ?? true,
  hoy: () => '2026-11-05',
  comprobarBuzon: async (e) => ({ resultado: buzones[e] ?? 'existe', respuesta: buzones[e] === 'no-existe' ? '550 5.1.1 User unknown' : '250 OK' }),
});

const base: Candidata = {
  id: 'acme', nombre: 'Acme', web: 'https://www.acme.test', sector: 'Software', tamano: 'pyme', zona: 'madrid',
  perfiles: ['dam-web'], motivoEncaje: 'Desarrollo web para clientes.', paginasContacto: ['https://www.acme.test'], tipoContactoEsperado: 'general',
};

describe('verificar (integración sin red)', () => {
  it('si la portada bloquea a los robots, verifica desde el portal de empleo del mismo dominio', async () => {
    expect(portalesDeEmpleo({ web: 'https://www.acme.test' })[0]).toBe('https://empleo.acme.test/');
    const { r, empresa } = await verificar(base, [], deps({
      'https://empleo.acme.test/': '<p>Envía tu candidatura a <a href="mailto:seleccion@acme.test">seleccion@acme.test</a></p>',
    }));
    expect(r.estado).toBe('valida');
    expect(empresa?.contacto).toMatchObject({ tipo: 'email', email: 'seleccion@acme.test', tipoContacto: 'rrhh', fuenteUrl: 'https://empleo.acme.test/' });
  });

  it('no toma correos de la web de otro país ni buzones de filiales extranjeras', async () => {
    const { empresa } = await verificar(base, [], deps({
      'https://www.acme.test': '<a href="/en-us/contact">Contact</a><a href="/contacto">Contacto</a> info-chile@acme.test',
      'https://www.acme.test/en-us/contact': 'jobs@acme.test',
      'https://www.acme.test/contacto': '<form action="/enviar"><input name="nombre"><textarea name="mensaje"></textarea><button>Enviar</button></form>',
    }));
    expect(empresa?.contacto.tipo).not.toBe('email');
  });

  it('extrae el correo de la página de empleo y guarda la URL exacta', async () => {
    const { r, empresa } = await verificar(base, [], deps({
      'https://www.acme.test': '<a href="/trabaja-con-nosotros">Trabaja con nosotros</a><a href="/contacto">Contacto</a> info@acme.test',
      'https://www.acme.test/trabaja-con-nosotros': '<p>Envía tu CV a <a href="mailto:talento@acme.test">talento@acme.test</a></p><a href="https://jobs.lever.co/acme">ofertas</a>',
      'https://www.acme.test/contacto': '<p>Contacto: info@acme.test · Prensa: prensa@acme.test · Ana: ana.lopez@acme.test</p>',
      'https://api.lever.co/v0/postings/acme?mode=json': '[]',
    }));
    expect(r.estado).toBe('valida');
    expect(empresa?.contacto).toEqual({ tipo: 'email', email: 'talento@acme.test', fuenteUrl: 'https://www.acme.test/trabaja-con-nosotros', tipoContacto: 'talento' });
    expect(empresa?.verificacion).toMatchObject({ fecha: '2026-11-05', confianza: 'alta', mx: true, buzon: 'existe' });
    expect(empresa?.feedAts).toEqual({ proveedor: 'lever', identificador: 'acme' });
    expect(empresa?.empleoUrl).toBe('https://www.acme.test/trabaja-con-nosotros');
    expect(empresa?.programaPracticas).toBeUndefined();
  });

  it('rechaza correos sin MX y usa el formulario oficial', async () => {
    const { empresa } = await verificar(base, [], deps(
      {
        'https://www.acme.test': '<a href="/empleo">Empleo</a> rrhh@acme.test',
        'https://www.acme.test/empleo': FORM_REAL,
      },
      { 'acme.test': false },
    ));
    expect(empresa?.contacto).toMatchObject({ tipo: 'formulario', formularioUrl: 'https://www.acme.test/empleo', tipoContacto: 'talento' });
    expect(empresa?.verificacion.confianza).toBe('alta');
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

  it('nunca usa un correo que solo aparece en el aviso legal: prefiere el formulario de empleo', async () => {
    const { empresa, r } = await verificar(base, [], deps({
      'https://www.acme.test': '<a href="/aviso-legal">Aviso legal</a><a href="/trabaja-con-nosotros">Trabaja con nosotros</a>',
      'https://www.acme.test/aviso-legal': 'Contacto: info@acme.test',
      'https://www.acme.test/trabaja-con-nosotros': FORM_REAL,
    }));
    expect(r.correosEncontrados.find((c) => c.email === 'info@acme.test')?.motivoRechazo).toMatch(/aviso legal/);
    expect(empresa?.contacto).toMatchObject({ tipo: 'formulario', formularioUrl: 'https://www.acme.test/trabaja-con-nosotros' });
  });

  it('el formulario de empleo va por delante de un info@ de la portada', async () => {
    const { empresa } = await verificar(base, [], deps({
      'https://www.acme.test': '<p>info@acme.test</p><a href="/empleo">Empleo</a>',
      'https://www.acme.test/empleo': FORM_REAL,
    }));
    expect(empresa?.contacto.tipo).toBe('formulario');
  });

  it('no acepta como formulario un buscador, un boletín ni una página sin formulario', async () => {
    const { r, empresa } = await verificar(base, [], deps({
      'https://www.acme.test': '<a href="/empleo">Empleo</a><a href="/contacto">Contacto</a>',
      'https://www.acme.test/empleo': '<form role="search"><input type="search" name="q"><button>Buscar</button></form>',
      'https://www.acme.test/contacto': '<p>Escríbenos</p><form><input type="email" name="email" placeholder="Suscríbete a la newsletter"><button>Enviar</button></form>',
    }));
    expect(empresa).toBeUndefined();
    expect(r.motivo).toMatch(/buscador|boletín|mensaje/);
  });

  it('descarta el correo si el servidor dice que el buzón no existe, y usa el formulario', async () => {
    const { r, empresa } = await verificar(base, [], deps(
      {
        'https://www.acme.test': '<a href="/empleo">Empleo</a>',
        'https://www.acme.test/empleo': `rrhh@acme.test ${FORM_REAL}`,
      },
      {},
      { 'rrhh@acme.test': 'no-existe' },
    ));
    expect(r.correosEncontrados[0].motivoRechazo).toMatch(/no existe/);
    expect(empresa?.contacto.tipo).toBe('formulario');
  });

  it('no usa correos que ya rebotaron ni los rechazados en la revisión manual', async () => {
    const mapa = { 'https://www.acme.test': '<a href="/empleo">Empleo</a>', 'https://www.acme.test/empleo': 'rrhh@acme.test talento@acme.test' };
    const { r } = await verificar(base, [], deps(mapa), {
      rebotes: [{ email: 'rrhh@acme.test', fecha: '2026-11-06', respuesta: '550 5.4.1' }],
      revision: { acme: { correosRechazados: ['talento@acme.test'], motivo: 'buzón antiguo', fecha: '2026-11-07' } },
    });
    expect(r.estado).toBe('descartada');
    expect(r.motivo).toMatch(/rebotó/);
    expect(r.motivo).toMatch(/revisión manual/);
  });

  it('no usa correos citados en un artículo del blog, salvo que el buzón de RR. HH. esté confirmado', async () => {
    const mapa = { 'https://www.acme.test': '<a href="/blog/2022/03/trabaja-con-nosotros">Trabaja con nosotros</a>', 'https://www.acme.test/blog/2022/03/trabaja-con-nosotros': 'info@acme.test y people@acme.test' };
    const confirmado = await verificar(base, [], deps(mapa));
    expect(confirmado.empresa?.contacto).toMatchObject({ email: 'people@acme.test' });
    const sinConfirmar = await verificar(base, [], deps(mapa, {}, { 'people@acme.test': 'acepta-todo' }));
    expect(sinConfirmar.empresa).toBeUndefined();
  });

  it('acepta un correo general si la empresa lo publica en su página de empleo', async () => {
    const { empresa } = await verificar(base, [], deps({
      'https://www.acme.test': '<a href="/unete">Únete</a>',
      'https://www.acme.test/unete': '<p>Envía tu CV a info@acme.test</p>',
    }));
    expect(empresa?.contacto).toMatchObject({ tipo: 'email', email: 'info@acme.test', tipoContacto: 'general', fuenteUrl: 'https://www.acme.test/unete' });
    expect(empresa?.verificacion.confianza).toBe('alta');
  });

  it('encuentra la página de RR. HH. en el mapa del sitio aunque no esté enlazada', async () => {
    const { empresa } = await verificar(base, [], deps({
      'https://www.acme.test': '<p>Bienvenidos</p>',
      'https://www.acme.test/robots.txt': 'User-agent: *\nSitemap: https://www.acme.test/sitemap.xml',
      'https://www.acme.test/sitemap.xml': '<urlset><url><loc>https://www.acme.test/blog/x</loc></url><url><loc>https://www.acme.test/es/rrhh/seleccion</loc></url></urlset>',
      'https://www.acme.test/es/rrhh/seleccion': 'Candidaturas: seleccion@acme.test',
    }));
    expect(empresa?.contacto).toMatchObject({ tipo: 'email', email: 'seleccion@acme.test', tipoContacto: 'rrhh' });
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
