import { describe, expect, it } from 'vitest';
import { aniosExperiencia, clasificarTipo, esSenior, normalizarOfertas, type OfertaBruta } from '../../shared/ofertas';

const ahora = new Date('2026-11-05T10:00:00Z');
const bruta = (o: Partial<OfertaBruta>): OfertaBruta => ({
  fuente: 'prueba',
  idFuente: Math.random().toString(36).slice(2),
  titulo: 'Desarrollador web junior',
  empresa: 'Empresa Prueba S.L.',
  ubicacion: 'Madrid',
  url: 'https://empleo.example.com/1',
  fechaPublicacion: '2026-11-01T00:00:00Z',
  ...o,
});

describe('clasificación', () => {
  it('reconoce prácticas, becas, junior y primer empleo', () => {
    expect(clasificarTipo({ titulo: 'Becario/a de desarrollo' })).toBe('practicas');
    expect(clasificarTipo({ titulo: 'Prácticas SOC' })).toBe('practicas');
    expect(clasificarTipo({ titulo: 'Software Engineering Intern' })).toBe('practicas');
    expect(clasificarTipo({ titulo: 'Beca TIC' })).toBe('beca');
    expect(clasificarTipo({ titulo: 'Técnico de sistemas Jr.' })).toBe('junior');
    expect(clasificarTipo({ titulo: 'Técnico helpdesk', experiencia: 'No Requerida' })).toBe('primer-empleo');
    expect(clasificarTipo({ titulo: 'Desarrollador Java' })).toBeNull();
  });
  it('detecta senior y años de experiencia', () => {
    expect(esSenior('Senior Backend Engineer')).toBe(true);
    expect(esSenior('Tech Lead Frontend')).toBe(true);
    expect(esSenior('Desarrollador junior', 'Se requieren al menos 4 años de experiencia')).toBe(true);
    expect(esSenior('Desarrollador junior')).toBe(false);
    expect(aniosExperiencia('5+ years of experience')).toBe(5);
  });
});

describe('normalizarOfertas', () => {
  it('excluye senior, caducadas, no TIC y duplicadas', () => {
    const r = normalizarOfertas(
      [
        bruta({ titulo: 'Desarrollador web junior', fechaPublicacion: '2026-11-01T00:00:00Z' }),
        bruta({ titulo: 'Desarrollador Web Junior', empresa: 'Empresa Prueba', fechaPublicacion: '2026-11-03T00:00:00Z', fuente: 'otra' }),
        bruta({ titulo: 'Senior Developer' }),
        bruta({ titulo: 'Prácticas de ciberseguridad', fechaPublicacion: '2026-08-01T00:00:00Z' }),
        bruta({ titulo: 'Prácticas de ciberseguridad', fechaCaducidad: '2026-11-02T00:00:00Z' }),
        bruta({ titulo: 'Camarero en prácticas' }),
        bruta({ titulo: 'Prácticas cloud AWS', jornada: 'part_time' }),
        bruta({ titulo: 'Sin url', url: 'ftp://x' }),
      ],
      ahora,
    );
    expect(r.ofertas.map((o) => o.titulo)).toEqual(['Desarrollador Web Junior', 'Prácticas cloud AWS']);
    expect(r.ofertas[0].fuente).toBe('otra');
    expect(r.descartadas).toMatchObject({ senior: 1, caducadas: 2, noTic: 1, duplicadas: 1, invalidas: 1 });
    const cloud = r.ofertas[1];
    expect(cloud.jornada).toBe('parcial');
    expect(cloud.tipo).toBe('practicas');
    expect(cloud.perfiles).toContain('asir-cloud');
  });
});
