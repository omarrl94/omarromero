import { describe, expect, it } from 'vitest';
import { config, perfilesDe } from '../../config/ffe.config';
import { generarBorrador } from '../../shared/correo';
import { generarCorreoTutor } from '../../shared/correo-tutor';
import { enlacesParaPerfil } from '../../shared/enlaces';
import { detectarPerfiles, esDeLosCiclos } from '../../shared/ofertas';
import { coincidePerfil } from '../../src/components/FiltroPerfil';

const empresa = {
  nombre: 'Comercio Prueba',
  sector: 'Distribución minorista',
  motivoEncaje: 'x',
  perfiles: ['acom-venta', 'acom-ecommerce'],
  contacto: { tipo: 'email' as const, email: 'rrhh@comercio.test', tipoContacto: 'rrhh' },
};

describe('ciclo de Actividades Comerciales (grado medio)', () => {
  it('está en la configuración con sus perfiles, horas y tutor pendiente', () => {
    expect(config.ciclos.map((c) => c.id)).toEqual(['DAM', 'ASIR', 'ACOM']);
    expect(perfilesDe('ACOM').map((p) => p.id)).toContain('acom-marketing-digital');
    expect(perfilesDe('ACOM')).toHaveLength(8);
    expect(config.horasPendientesDeConfirmar.ACOM).toBe(true);
    expect(config.tutores.ACOM).toBeNull();
  });

  it('el correo del alumno lleva solo el bloque de Actividades Comerciales, en primera persona', () => {
    const b = generarBorrador(empresa, { nombre: 'Lucía Gómez', ciclo: 'ACOM', perfiles: ['acom-venta', 'acom-marketing-digital'], modalidad: 'A' });
    expect(b.para).toBe('rrhh@comercio.test');
    expect(b.cc).toBe('');
    expect(b.asunto).toBe('Candidatura espontánea para Formación en Empresa (FFE) · 2.º Actividades Comerciales');
    expect(b.cuerpo).toContain('Hola, equipo de Recursos Humanos:');
    expect(b.cuerpo).toContain('estoy cursando 2.º de Actividades Comerciales (ciclo de grado medio de Comercio y Marketing)');
    expect(b.cuerpo).toContain('ACTIVIDADES COMERCIALES (GRADO MEDIO)');
    expect(b.cuerpo).toContain('Llegaré a las prácticas preparado/a para vender');
    expect(b.cuerpo).toContain('- Comercio electrónico: mantenimiento de la web, la tienda online y el catálogo');
    expect(b.cuerpo).toContain('La utilizo para crear descripciones de producto');
    expect(b.cuerpo).toContain('equipos comerciales y de marketing más innovadores');
    expect(b.cuerpo).toContain('venta y atención en tienda');
    expect(b.cuerpo).toContain('2.º Actividades Comerciales · C.F.P. José Ramón Otero');
    expect(b.cuerpo).not.toMatch(/\bDAM\b|\bASIR\b|Kotlin|ciberseguridad/);
  });

  it('el correo del tutor lleva su bloque, su IA y su firma', () => {
    const c = generarCorreoTutor({ nombre: 'Tutor Comercio', email: 'tutor@jrotero.es', ciclo: 'ACOM' }, { nombre: 'Comercio Prueba' });
    expect(c.asunto).toBe('Colaboración en la Formación en Empresa de 2.º Actividades Comerciales · C.F.P. José Ramón Otero');
    expect(c.cuerpo).toContain('Hola, equipo de Comercio Prueba:');
    expect(c.cuerpo).toContain('Nuestro alumnado de Actividades Comerciales llegará a las prácticas');
    expect(c.cuerpo).toContain('- Almacén y logística: recepción, ubicación, preparación y expedición de pedidos');
    expect(c.cuerpo).toContain('En Actividades Comerciales la utilizan para crear descripciones de producto');
    expect(c.cuerpo).toContain('Llegarán a la empresa preparados para trabajar como lo hacen ya los equipos comerciales y de marketing más innovadores.');
    expect(c.cuerpo).toContain('- Duración total: 500 horas.');
    expect(c.cuerpo).toContain('Tutor/a de FFE · 2.º Actividades Comerciales');
    expect(c.cuerpo).not.toMatch(/\bDAM\b|\bASIR\b|equipos técnicos/);
  });

  it('las ofertas de comercio entran y se asignan a sus perfiles', () => {
    expect(esDeLosCiclos('Prácticas de dependiente/a en tienda de moda')).toBe(true);
    expect(esDeLosCiclos('Becario de marketing digital y redes sociales')).toBe(true);
    expect(esDeLosCiclos('Prácticas de enfermería')).toBe(false);
    expect(detectarPerfiles('Prácticas de community manager y redes sociales')).toContain('acom-marketing-digital');
    expect(detectarPerfiles('Prácticas de mozo de almacén y preparador de pedidos')).toContain('acom-logistica');
  });

  it('filtra por ciclo y no ofrece portales solo de informática', () => {
    const alumno = { ciclo: 'ACOM' as const, perfiles: [], zona: null, modalidad: 'A' as const };
    expect(coincidePerfil(['acom-venta'], 'ciclo:ACOM', alumno as never)).toBe(true);
    expect(coincidePerfil(['dam-web'], 'ciclo:ACOM', alumno as never)).toBe(false);
    expect(enlacesParaPerfil('acom-venta', { soloProbados: false }).map((e) => e.id)).not.toContain('tecnoempleo');
    expect(enlacesParaPerfil('dam-web', { soloProbados: false }).map((e) => e.id)).toContain('tecnoempleo');
  });
});
