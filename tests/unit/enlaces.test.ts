import { describe, expect, it } from 'vitest';
import { enlacesParaPerfil } from '../../shared/enlaces';

describe('enlaces profundos', () => {
  it('codifica términos y lugar', () => {
    const e = enlacesParaPerfil('dam-web', { soloProbados: false });
    const indeed = e.find((x) => x.id === 'indeed')!;
    expect(indeed.url).toBe('https://es.indeed.com/jobs?q=desarrollador%20web%20junior&l=Madrid');
  });
  it('en modo producción solo devuelve los probados', () => {
    const todos = enlacesParaPerfil('asir-cloud', { soloProbados: false });
    const probados = enlacesParaPerfil('asir-cloud', { soloProbados: true });
    expect(probados.every((x) => x.probado)).toBe(true);
    expect(probados.length).toBeLessThanOrEqual(todos.length);
  });
});
