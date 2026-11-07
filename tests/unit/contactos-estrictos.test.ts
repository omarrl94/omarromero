import { describe, expect, it } from 'vitest';
import { analizarHtml, esFormularioValido } from '../../scripts/lib/formularios';
import { combinar, interpretarRcpt } from '../../scripts/lib/smtp';

describe('comprobación de buzón (RCPT TO, sin enviar nada)', () => {
  it('reconoce los rechazos reales que nos llegaron', () => {
    // Microsoft 365 con bloqueo de destinatarios desconocidos (rrhh@sothis.tech, talento@grupoica.com)
    expect(interpretarRcpt(550, '550 5.4.1 Recipient address rejected: Access denied. For more information see https://aka.ms/EXOSmtpErrors')).toBe('no-existe');
    // Gmail (hola@cobee.io)
    expect(interpretarRcpt(550, "550-5.1.1 The email account that you tried to reach does not exist.")).toBe('no-existe');
    expect(interpretarRcpt(550, '550 5.1.1 <info@x.test>... User unknown')).toBe('no-existe');
  });
  it('no confunde un bloqueo por reputación o política con un buzón inexistente', () => {
    expect(interpretarRcpt(550, '550 5.7.1 Service unavailable; client host [1.2.3.4] blocked using Spamhaus')).toBe('indeterminado');
    expect(interpretarRcpt(554, '554 5.7.1 Rejected by policy')).toBe('indeterminado');
    expect(interpretarRcpt(451, '451 4.7.1 Greylisted, try again later')).toBe('indeterminado');
  });
  it('distingue «existe» de «el servidor acepta cualquier dirección»', () => {
    expect(combinar('aceptado', 'no-existe')).toBe('existe');
    expect(combinar('aceptado', 'aceptado')).toBe('acepta-todo');
    expect(combinar('no-existe', null)).toBe('no-existe');
    expect(combinar('indeterminado', null)).toBe('indeterminado');
  });
});

describe('formulario real (no una página genérica)', () => {
  const campo = (tipo: string, etiqueta: string, nombre = '') => ({ tipo, etiqueta, nombre });
  it('acepta contacto (nombre, correo, mensaje) y candidatura (correo, CV)', () => {
    expect(esFormularioValido({ url: 'u', campos: [campo('text', 'Nombre'), campo('email', 'Correo'), campo('textarea', 'Mensaje')] }).valido).toBe(true);
    expect(esFormularioValido({ url: 'u', campos: [campo('text', 'Nombre'), campo('text', 'Email', 'email'), campo('file', 'Adjunta tu CV')] }).valido).toBe(true);
  });
  it('rechaza buscadores, boletines, accesos y formularios sin mensaje', () => {
    expect(esFormularioValido({ url: 'u', campos: [campo('search', 'Buscar', 'q')] }).motivo).toMatch(/buscador/);
    expect(esFormularioValido({ url: 'u', campos: [campo('email', 'Suscríbete a nuestra newsletter')] }).motivo).toMatch(/boletín/);
    expect(esFormularioValido({ url: 'u', campos: [campo('email', 'Usuario'), campo('password', 'Contraseña')] }).motivo).toMatch(/acceso/);
    expect(esFormularioValido({ url: 'u', campos: [campo('text', 'Nombre'), campo('email', 'Correo'), campo('tel', 'Teléfono')] }).motivo).toMatch(/mensaje/);
  });
  it('analiza el HTML: etiquetas, iframes de proveedores y enlaces de candidatura espontánea', () => {
    const html = '<form><label for="a">Nombre</label><input id="a"><label for="b">Correo</label><input id="b" type="email"><textarea name="mensaje"></textarea></form>';
    expect(analizarHtml('https://a.test/contacto', html).valido).toBe(true);
    expect(analizarHtml('https://a.test/contacto', '<iframe src="https://share.hsforms.com/abc"></iframe>').valido).toBe(true);
    const r = analizarHtml('https://a.test/empleo', '<p>Únete</p><a href="/empleo/candidatura">Envía tu candidatura espontánea</a>');
    expect(r.valido).toBe(false);
    expect(r.enlacesCandidatura).toEqual(['https://a.test/empleo/candidatura']);
  });
});
