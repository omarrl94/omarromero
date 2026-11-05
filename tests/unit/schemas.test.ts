import { describe, expect, it } from 'vitest';
import { dominioCoincide, EmpresaSchema, esCorreoGenerico, esCorreoGratuito } from '../../shared/schemas';

const base = {
  id: 'empresa-prueba',
  nombre: 'Empresa de Prueba',
  web: 'https://www.empresa.test',
  sector: 'Consultoría tecnológica',
  tamano: 'pyme',
  zona: 'madrid',
  perfiles: ['dam-web'],
  motivoEncaje: 'Desarrolla aplicaciones web para clientes.',
  contacto: { tipo: 'email', email: 'rrhh@empresa.test', fuenteUrl: 'https://www.empresa.test/contacto', tipoContacto: 'rrhh' },
  verificacion: { fecha: '2026-11-05', confianza: 'alta', mx: true },
};

describe('correos', () => {
  it('distingue buzones genéricos de personales', () => {
    expect(esCorreoGenerico('rrhh@empresa.es')).toBe(true);
    expect(esCorreoGenerico('talento.madrid@empresa.es')).toBe(true);
    expect(esCorreoGenerico('jobs@empresa.com')).toBe(true);
    expect(esCorreoGenerico('laura.garcia@empresa.es')).toBe(false);
    expect(esCorreoGenerico('jperez@empresa.es')).toBe(false);
  });
  it('detecta proveedores gratuitos', () => {
    expect(esCorreoGratuito('info@gmail.com')).toBe(true);
    expect(esCorreoGratuito('info@empresa.es')).toBe(false);
  });
  it('compara dominios de correo y web', () => {
    expect(dominioCoincide('rrhh@empresa.es', 'https://www.empresa.es/')).toBe(true);
    expect(dominioCoincide('jobs@es.empresa.com', 'https://empresa.com')).toBe(true);
    expect(dominioCoincide('rrhh@otra.es', 'https://www.empresa.es')).toBe(false);
  });
});

describe('EmpresaSchema', () => {
  it('acepta una empresa válida', () => {
    expect(EmpresaSchema.safeParse(base).success).toBe(true);
  });
  it('rechaza correos personales', () => {
    const r = EmpresaSchema.safeParse({ ...base, contacto: { ...base.contacto, email: 'laura.garcia@empresa.test' } });
    expect(r.success).toBe(false);
  });
  it('rechaza correos gratuitos', () => {
    const r = EmpresaSchema.safeParse({ ...base, contacto: { ...base.contacto, email: 'rrhh@gmail.com' }, verificacion: { ...base.verificacion, notas: 'dominio distinto' } });
    expect(r.success).toBe(false);
  });
  it('exige formulario cuando no hay correo', () => {
    const r = EmpresaSchema.safeParse({ ...base, contacto: { tipo: 'formulario', fuenteUrl: 'https://www.empresa.test/empleo', tipoContacto: 'general' } });
    expect(r.success).toBe(false);
  });
  it('exige explicar dominios distintos', () => {
    const c = { ...base, contacto: { ...base.contacto, email: 'rrhh@grupo.test' } };
    expect(EmpresaSchema.safeParse(c).success).toBe(false);
    expect(EmpresaSchema.safeParse({ ...c, verificacion: { ...base.verificacion, notas: 'El dominio grupo.test es el de su matriz, publicado en su web.' } }).success).toBe(true);
  });
  it('rechaza perfiles inexistentes', () => {
    expect(EmpresaSchema.safeParse({ ...base, perfiles: ['inventado'] }).success).toBe(false);
  });
});
