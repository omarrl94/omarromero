import { describe, expect, it } from 'vitest';
import { correoApareceEn, decodificarCfEmail, detectarAts, elegirCorreo, enlacesDeInteres, esPaginaFormulario, extraerCorreos, mencionaPracticas, tipoContactoDe, valorarCorreos } from '../../scripts/lib/verificador';

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
