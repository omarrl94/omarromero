import { describe, expect, it } from 'vitest';
import { config, perfilesDe } from '../../config/ffe.config';
import { generarBorrador } from '../../shared/correo';
import { generarCorreoTutor } from '../../shared/correo-tutor';
import { detectarPerfiles, esDeLosCiclos } from '../../shared/ofertas';

const empresa = {
  nombre: 'Instalaciones Prueba',
  sector: 'Instalaciones eléctricas',
  motivoEncaje: 'x',
  perfiles: ['sea-instalaciones', 'sea-domotica'],
  contacto: { tipo: 'email' as const, email: 'rrhh@instalaciones.test', tipoContacto: 'rrhh' },
};

describe('ciclo de Sistemas Electrotécnicos y Automatizados (SEA)', () => {
  it('está en la configuración con FFE en 1.º y 2.º, 8 perfiles y horas por confirmar', () => {
    const sea = config.ciclos.find((c) => c.id === 'SEA');
    expect(sea).toMatchObject({ grado: 'superior', familia: 'Electricidad y Electrónica', cursosFFE: [1, 2] });
    expect(perfilesDe('SEA')).toHaveLength(8);
    expect(config.horasPorCurso.SEA).toEqual({ 1: null, 2: null });
    expect(config.tutores.SEA).toBeNull();
  });

  it('el correo del alumno indica su curso (1.º o 2.º) y solo el bloque de SEA', () => {
    const primero = generarBorrador(empresa, { nombre: 'Ana', ciclo: 'SEA', curso: 1, perfiles: ['sea-domotica'], modalidad: 'A' });
    expect(primero.asunto).toBe('Candidatura espontánea para Formación en Empresa (FFE) · 1.º SEA');
    expect(primero.cuerpo).toContain('estoy cursando 1.º de Sistemas Electrotécnicos y Automatizados (SEA)');
    expect(primero.cuerpo).toContain('SISTEMAS ELECTROTÉCNICOS Y AUTOMATIZADOS (SEA)');
    expect(primero.cuerpo).toContain('certificaciones KNX Basic y KNX Advanced');
    expect(primero.cuerpo).toContain('- Instalación, programación y puesta en marcha de sistemas domóticos e inmóticos (KNX).');
    expect(primero.cuerpo).toContain('- Horario: 8 horas al día.');
    expect(primero.cuerpo).not.toMatch(/horas en total/);
    expect(primero.cuerpo).toContain('1.º SEA · C.F.P. José Ramón Otero');
    expect(primero.cuerpo).not.toMatch(/\bDAM\b|\bASIR\b|Kotlin|comercio electrónico/);
    const segundo = generarBorrador(empresa, { nombre: 'Ana', ciclo: 'SEA', perfiles: [], modalidad: 'B' });
    expect(segundo.asunto).toContain('2.º SEA');
  });

  it('el correo del tutor habla de 1.º y 2.º y no inventa la duración', () => {
    const c = generarCorreoTutor({ nombre: 'Tutor SEA', email: 'tutor@jrotero.es', ciclo: 'SEA' }, { nombre: 'Instalaciones Prueba' });
    expect(c.asunto).toBe('Colaboración en la Formación en Empresa de 1.º y 2.º SEA · C.F.P. José Ramón Otero');
    expect(c.cuerpo).toContain('tutor/a de Formación en Empresa (FFE) de 1.º y 2.º de Sistemas Electrotécnicos y Automatizados (SEA)');
    expect(c.cuerpo).toContain('- La Formación en Empresa se realiza en 1.º y 2.º curso.');
    expect(c.cuerpo).not.toMatch(/Duración total/);
    expect(c.cuerpo).toContain('Tutor/a de FFE · 1.º y 2.º SEA');
  });

  it('las ofertas del sector eléctrico entran y se asignan a sus perfiles', () => {
    expect(esDeLosCiclos('Prácticas de técnico electricista en baja tensión')).toBe(true);
    expect(detectarPerfiles('Instalador fotovoltaico de autoconsumo')).toContain('sea-fotovoltaica');
    expect(detectarPerfiles('Técnico de automatización PLC y SCADA')).toContain('sea-automatizacion');
    expect(detectarPerfiles('Integrador domótica KNX')).toContain('sea-domotica');
  });
});
