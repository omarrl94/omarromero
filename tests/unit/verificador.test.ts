import { describe, expect, it } from 'vitest';
import { correoApareceEn, decodificarCfEmail, esRutaDeOtroPais, detectarAts, elegirCorreo, enlacesDeInteres, esPaginaFormulario, extraerCorreos, mencionaPracticas, tipoContactoDe, valorarCorreos } from '../../scripts/lib/verificador';

const WEB = 'https://www.acme.test';
const html = `
<html><head><title>Trabaja con nosotros | Acme</title></head><body>
<a href="mailto:Talento@acme.test">Escríbenos</a>
<p>Prensa: prensa@acme.test · Datos: dpo@acme.test · Laura: laura.garcia@acme.test</p>
<p>Otro: rrhh@gmail.com y empleo@otra.test · icono logo@2x.png</p>
<p>info&#64;acme.test</p>
<a class="__cf_email__" data-cfemail="${cf('practicas@acme.test')}">[email&#160;protected]</a>
<a href="/es/contacto">Contacto</a><a href="https://careers.acme.test/jobs">Empleo</a><a href="https://otra.test/contacto">Fuera</a>
<a href="/blog/post">Blog</a><a href="/aviso-legal">Aviso legal</a>
<iframe src="https://boards.greenhouse.io/embed/job_board?for=acme"></iframe>
<a href="https://jobs.lever.co/acme-labs/123">Lever</a>
</body></html>`;

function cf(email: string): string {
  const k = 0x2a;
  return k.toString(16).padStart(2, '0') + [...email].map((c) => (c.charCodeAt(0) ^ k).toString(16).padStart(2, '0')).join('');
}

describe('extracción de correos', () => {
  it('encuentra correos en texto, mailto, entidades y Cloudflare', () => {
    const c = extraerCorreos(html);
    expect(c).toEqual(expect.arrayContaining(['talento@acme.test', 'prensa@acme.test', 'info@acme.test', 'practicas@acme.test', 'laura.garcia@acme.test']));
    expect(c).not.toContain('logo@2x.png');
    expect(decodificarCfEmail(cf('a@b.es'))).toBe('a@b.es');
  });
  it('comprueba la presencia literal', () => {
    expect(correoApareceEn(html, 'TALENTO@acme.test')).toBe(true);
    expect(correoApareceEn(html, 'rrhh@acme.test')).toBe(false);
  });
});

describe('valoración y elección', () => {
  const v = valorarCorreos(extraerCorreos(html), WEB);
  const motivo = (e: string) => v.find((x) => x.email === e)?.motivoRechazo;
  it('rechaza personales, gratuitos, otro dominio y buzones no de candidaturas', () => {
    expect(motivo('laura.garcia@acme.test')).toBe('posible correo personal');
    expect(motivo('rrhh@gmail.com')).toBe('proveedor gratuito');
    expect(motivo('empleo@otra.test')).toBe('dominio distinto al de la web');
    expect(motivo('prensa@acme.test')).toBe('buzón no destinado a candidaturas');
    expect(motivo('dpo@acme.test')).toBe('buzón no destinado a candidaturas');
    expect(motivo('talento@acme.test')).toBeUndefined();
  });
  it('rechaza buzones de privacidad, clientes, ventas, administración y de otros países', () => {
    const r = valorarCorreos(['contacto.dpd@acme.test', 'careers.au@acme.test', 'careers.hk@acme.test', 'global.careers@acme.test', 'secretaria@acme.test', 'it.jobs@acme.test', 'contact_eahelp@acme.test', 'comercial@acme.test', 'administracion@acme.test', 'atencion.clientes@acme.test', 'careers.es@acme.test', 'talento@acme.test'], WEB);
    const aceptados = r.filter((x) => !x.motivoRechazo).map((x) => x.email);
    expect(aceptados).toEqual(['careers.es@acme.test', 'talento@acme.test']); // it.jobs@ es ambiguo (Italia): ante la duda, fuera
  });
  it('prioriza prácticas > talento > RR. HH. > general', () => {
    expect(elegirCorreo(v)?.email).toBe('practicas@acme.test');
    expect(elegirCorreo(v.filter((x) => x.email !== 'practicas@acme.test'))?.email).toBe('talento@acme.test');
    expect(tipoContactoDe('seleccion@x.es')).toBe('rrhh');
    expect(tipoContactoDe('info@x.es')).toBe('general');
    expect(elegirCorreo([])).toBeNull();
  });
});

describe('páginas', () => {
  it('extrae enlaces de interés del mismo dominio', () => {
    const e = enlacesDeInteres(html, WEB + '/');
    expect(e).toEqual(expect.arrayContaining(['https://www.acme.test/es/contacto', 'https://careers.acme.test/jobs', 'https://www.acme.test/aviso-legal']));
    expect(e.some((u) => u.includes('otra.test'))).toBe(false);
    expect(e.some((u) => u.includes('/blog/'))).toBe(false);
  });
  it('descodifica &amp; en los enlaces', () => {
    expect(enlacesDeInteres('<a href="/empleo?a=1&amp;b=2">Empleo</a>', WEB + '/')).toEqual(['https://www.acme.test/empleo?a=1&b=2']);
  });
  it('detecta feeds ATS enlazados', () => {
    expect(detectarAts(html)).toEqual([
      { proveedor: 'greenhouse', identificador: 'acme' },
      { proveedor: 'lever', identificador: 'acme-labs' },
    ]);
  });
  it('reconoce formularios y menciones de prácticas', () => {
    expect(esPaginaFormulario('https://www.acme.test/trabaja-con-nosotros', '<form action="/enviar"></form>')).toBe(true);
    expect(esPaginaFormulario('https://www.acme.test/blog', '<form></form>')).toBe(false);
    expect(mencionaPracticas('<p>Programa de <b>becas</b> para estudiantes</p>')).toBe(true);
    expect(mencionaPracticas('<p>Sobre nosotros</p>')).toBe(false);
  });
});

describe('priorizarUrls', () => {
  it('revisa primero empleo y RR. HH., luego contacto y por último el resto', async () => {
    const { priorizarUrls } = await import('../../scripts/lib/verificador');
    expect(priorizarUrls(['https://a.test/aviso-legal', 'https://a.test/contacto', 'https://a.test/trabaja-con-nosotros'])).toEqual([
      'https://a.test/trabaja-con-nosotros',
      'https://a.test/contacto',
      'https://a.test/aviso-legal',
    ]);
  });
});

describe('tipo de página y rango del canal', () => {
  it('clasifica páginas', async () => {
    const { tipoPagina } = await import('../../scripts/lib/verificador');
    expect(tipoPagina('https://a.test/aviso-legal')).toBe('legal');
    expect(tipoPagina('https://a.test/legal/terms_en.html')).toBe('legal');
    expect(tipoPagina('https://a.test/politica-de-privacidad')).toBe('legal');
    expect(tipoPagina('https://a.test/trabaja-con-nosotros')).toBe('empleo');
    expect(tipoPagina('https://careers.a.test/')).toBe('empleo');
    expect(tipoPagina('https://a.test/contacto')).toBe('contacto');
    expect(tipoPagina('https://a.test/')).toBe('otra');
    expect(tipoPagina('https://keepler.io/2022/03/29/it-job-opportunities')).toBe('articulo');
    expect(tipoPagina('https://a.test/blog/practicas-seo')).toBe('articulo');
    expect(tipoPagina('https://a.test/actualidad-es/entrevista-a-x')).toBe('articulo');
  });
  it('ordena: RR. HH. > formulario de empleo > general en empleo > general de contacto > formulario de contacto', async () => {
    const { rangoCorreo, RANGO_FORMULARIO } = await import('../../scripts/lib/verificador');
    expect(rangoCorreo({ email: 'rrhh@a.test', tipo: 'rrhh' }, ['empleo'])).toBe(0);
    expect(rangoCorreo({ email: 'rrhh@a.test', tipo: 'rrhh' }, ['legal'])).toBe(5);
    expect(rangoCorreo({ email: 'info@a.test', tipo: 'general' }, ['otra'])).toBeNull();
    expect(rangoCorreo({ email: 'info@a.test', tipo: 'general' }, ['articulo'])).toBeNull();
    expect(RANGO_FORMULARIO.empleo).toBe(1);
    expect(rangoCorreo({ email: 'info@a.test', tipo: 'general' }, ['empleo', 'legal'])).toBe(2);
    expect(rangoCorreo({ email: 'info@a.test', tipo: 'general' }, ['contacto'])).toBe(3);
    expect(RANGO_FORMULARIO.contacto).toBe(4);
    expect(rangoCorreo({ email: 'info@a.test', tipo: 'general' }, ['legal'])).toBeNull();
  });
});

describe('esRutaDeOtroPais', () => {
  it('descarta las webs de filiales de otros países', () => {
    expect(esRutaDeOtroPais('https://www.bechtle.com/de-en/career/contact')).toBe(true);
    expect(esRutaDeOtroPais('https://www.acme.test/fr-fr/carrieres')).toBe(true);
    expect(esRutaDeOtroPais('https://www.acme.test/mx/empleo')).toBe(true);
  });
  it('acepta las páginas de España y las de solo idioma', () => {
    expect(esRutaDeOtroPais('https://www.bechtle.com/es-es/carrera')).toBe(false);
    expect(esRutaDeOtroPais('https://www.acme.test/en-es/careers')).toBe(false);
    expect(esRutaDeOtroPais('https://www.acme.test/en/careers')).toBe(false);
    expect(esRutaDeOtroPais('https://www.acme.test/trabaja-con-nosotros')).toBe(false);
  });
});

describe('buzones de regiones extranjeras', () => {
  it('rechaza buzones de América, Oriente Medio y otras regiones', () => {
    for (const e of ['hr.direct.americas@acme.test', 'career.mena@acme.test', 'info-uae@acme.test', 'info-chile@acme.test']) {
      expect(valorarCorreos([e], 'https://www.acme.test')[0].motivoRechazo).toBeTruthy();
    }
  });
});

describe('página de empleo: el segmento entero, no una palabra dentro de un título', () => {
  it('no confunde artículos ni páginas de producto con la página de empleo', async () => {
    const { tipoPagina, esOfertaConcreta } = await import('../../scripts/lib/verificador');
    expect(tipoPagina('https://ackcent.com/ackcent-joins-cybersecurity-awareness-month/')).toBe('otra');
    expect(tipoPagina('https://a.test/trabajar-con-una-wifi-publica-segura/')).toBe('otra');
    expect(tipoPagina('https://a.test/seo-local-y-buenas-practicas/')).toBe('otra');
    expect(tipoPagina('https://a.test/control-horario-trabajadores/')).toBe('otra');
    expect(tipoPagina('https://a.test/rrhh-20/')).toBe('otra');
    expect(tipoPagina('https://a.test/ebook/guia-recursos-humanos/')).toBe('articulo');
    expect(tipoPagina('https://careers.a.test/cookie-policy')).toBe('legal');
    expect(tipoPagina('https://a.test/unete-a-nuestro-ecosistema/')).toBe('empleo');
    expect(tipoPagina('https://a.test/join_our_team.html')).toBe('empleo');
    expect(tipoPagina('https://a.test/buscamos-talento/')).toBe('empleo');
    expect(esOfertaConcreta('https://a.test/ofertas-de-empleo/vp-of-design')).toBe(true);
    expect(esOfertaConcreta('https://a.test/jobs/apply/comercial-odoo-outbound-6')).toBe(true);
    expect(esOfertaConcreta('https://a.test/trabaja-en-econocom/candidatura-espontanea')).toBe(false);
    expect(esOfertaConcreta('https://a.test/jobs/')).toBe(false);
  });
});
