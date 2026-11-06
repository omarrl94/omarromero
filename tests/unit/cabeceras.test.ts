import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const toml = readFileSync('netlify.toml', 'utf8');
const csp = toml.match(/Content-Security-Policy = "([^"]+)"/)![1];
const directiva = (nombre: string) => csp.split(';').map((d) => d.trim()).find((d) => d.startsWith(nombre + ' ')) ?? '';

describe('cabeceras de seguridad de Netlify', () => {
  it('permiten conectar con Firebase (Auth y Firestore) y nada más externo', () => {
    const connect = directiva('connect-src');
    expect(connect).toContain("'self'");
    expect(connect).toContain('https://*.googleapis.com');
    expect(connect.split(' ').filter((x) => x.startsWith('http')).every((h) => /googleapis\.com$/.test(h))).toBe(true);
    expect(directiva('frame-src')).toContain('https://*.firebaseapp.com');
  });
  it('mantienen el resto cerrado y noindex', () => {
    expect(directiva('script-src')).toBe("script-src 'self'");
    expect(directiva('object-src')).toBe("object-src 'none'");
    expect(directiva('frame-ancestors')).toBe("frame-ancestors 'none'");
    expect(toml).toMatch(/X-Robots-Tag = "noindex/);
  });
});
