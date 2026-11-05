import { describe, expect, it } from 'vitest';
import { generarBorrador, textoParaCopiar, urlGmail, urlMailto, urlOutlook } from '../../shared/correo';

const empresa = {
  nombre: 'Empresa Prueba',
  sector: 'Desarrollo de software',
  motivoEncaje: 'x',
  perfiles: ['dam-web', 'dam-backend'],
  contacto: { tipo: 'email' as const, email: 'talento@empresa.test', tipoContacto: 'talento' },
};
const alumno = { nombre: 'Ana Pérez', ciclo: 'DAM' as const, perfiles: ['dam-web', 'dam-android'], modalidad: 'A' as const, github: 'https://github.com/ana' };

describe('generarBorrador', () => {
  it('incluye empresa, ciclo, modalidad, horas, enlaces y tutor en copia', () => {
    const b = generarBorrador(empresa, alumno);
    expect(b.para).toBe('talento@empresa.test');
    expect(b.cc).toBe('omar.romero@jrotero.es');
    expect(b.asunto).toMatch(/Candidatura espontánea/);
    expect(b.cuerpo).toContain('Empresa Prueba');
    expect(b.cuerpo).toContain('1 de marzo de 2027');
    expect(b.cuerpo).toContain('8 horas al día, 320 horas');
    expect(b.cuerpo).toContain('GitHub: https://github.com/ana');
    expect(b.cuerpo).toContain('desarrollo web');
    expect(b.cuerpo).toContain('Estimado equipo de Talento:');
  });
  it('no pone copia si el tutor está pendiente (ASIR)', () => {
    const b = generarBorrador(empresa, { ...alumno, ciclo: 'ASIR', perfiles: ['asir-cloud'], modalidad: 'B' });
    expect(b.cc).toBe('');
    expect(b.cuerpo).toContain('7 horas al día, 420 horas');
    expect(b.cuerpo).not.toContain('Pongo en copia');
  });
  it('usa el nombre del programa si la empresa lo publica', () => {
    const b = generarBorrador({ ...empresa, programaPracticas: { titulo: 'Programa Talento Joven' } }, alumno);
    expect(b.asunto).toContain('Programa Talento Joven');
  });
  it('genera URLs de Outlook, Gmail y mailto codificadas', () => {
    const b = generarBorrador(empresa, alumno);
    expect(urlOutlook(b)).toMatch(/^https:\/\/outlook\.office\.com\/mail\/deeplink\/compose\?to=talento%40empresa\.test&cc=omar\.romero%40jrotero\.es&subject=/);
    expect(urlGmail(b)).toMatch(/^https:\/\/mail\.google\.com\/mail\/\?view=cm&fs=1&to=talento%40empresa\.test&cc=/);
    expect(urlMailto(b)).toMatch(/^mailto:talento@empresa\.test\?cc=omar\.romero%40jrotero\.es&subject=/);
    expect(decodeURIComponent(urlGmail(b).split('body=')[1])).toBe(b.cuerpo);
    expect(textoParaCopiar(b)).toMatch(/^Para: talento@empresa\.test\nCC: omar\.romero@jrotero\.es\nAsunto: .*\n\nEstimado/);
  });
});
