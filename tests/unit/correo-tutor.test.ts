import { describe, expect, it } from 'vitest';
import { csvCombinacion, enLotes, generarCorreoTutor, LINEA_BAJA, urlGmailCco, urlMailtoCco, urlOutlookCco } from '../../shared/correo-tutor';

const tutor = { nombre: 'Omar Romero', email: 'omar.romero@jrotero.es', ciclo: 'DAM' as const, alumnos: '18' };

describe('correo del tutor', () => {
  it('genera el texto común con ciclo, modalidades, horas, firma y línea de baja', () => {
    const c = generarCorreoTutor(tutor);
    expect(c.asunto).toBe('Colaboración en la Formación en Empresa de 2.º DAM · C.F.P. José Ramón Otero');
    expect(c.cuerpo).toMatch(/^Hola:/);
    expect(c.cuerpo).toContain('Desarrollo de Aplicaciones Multiplataforma');
    expect(c.cuerpo).toContain('Modalidad A: del 1 de marzo de 2027');
    expect(c.cuerpo).toContain('Modalidad B: del 18 de febrero de 2027');
    expect(c.cuerpo).toContain('320 horas');
    expect(c.cuerpo).toContain('18 alumnos y alumnas');
    expect(c.cuerpo).toContain('omar.romero@jrotero.es');
    expect(c.cuerpo.trim().endsWith(LINEA_BAJA)).toBe(true);
  });
  it('personaliza el saludo y la presentación por empresa', () => {
    const c = generarCorreoTutor({ ...tutor, ciclo: 'ASIR' }, { nombre: 'Acme', sector: 'Ciberseguridad' });
    expect(c.cuerpo).toMatch(/^Hola, equipo de Acme:/);
    expect(c.cuerpo).toContain('por vuestra actividad en ciberseguridad');
    expect(c.cuerpo).toContain('420 horas');
  });

  it('cada ciclo lleva solo su bloque: DAM con lo de DAM y ASIR con lo de ASIR', () => {
    const dam = generarCorreoTutor(tutor).cuerpo;
    expect(dam).toContain('DESARROLLO DE APLICACIONES MULTIPLATAFORMA (DAM)');
    expect(dam).toContain('programan en Java, Kotlin, C#, Python y JavaScript');
    expect(dam).toContain('- Creación de aplicaciones Android con Kotlin y Jetpack Compose');
    expect(dam).toContain('INTELIGENCIA ARTIFICIAL EN TODO SU TRABAJO');
    expect(dam).toContain('En DAM la utilizan para programar más rápido');
    expect(dam).not.toContain('ADMINISTRACIÓN DE SISTEMAS INFORMÁTICOS EN RED (ASIR)');
    expect(dam).not.toContain('En ASIR se apoyan');
    expect(dam).toContain('podemos hablar diez minutos por teléfono');

    const asir = generarCorreoTutor({ ...tutor, ciclo: 'ASIR' }).cuerpo;
    expect(asir).toContain('ADMINISTRACIÓN DE SISTEMAS INFORMÁTICOS EN RED (ASIR)');
    expect(asir).toContain('CCNA, AWS Foundation y Cisco CyberOps');
    expect(asir).toContain('- Proteger la red corporativa con cortafuegos, VPN y proxies.');
    expect(asir).toContain('En ASIR se apoyan en ella para analizar registros');
    expect(asir).not.toContain('DESARROLLO DE APLICACIONES MULTIPLATAFORMA (DAM)');
    expect(asir).not.toContain('En DAM la utilizan');
    // Tratamiento de tú en todo el correo.
    expect(asir).not.toMatch(/ustedes|les enviaremos|respondan/);
  });
});

describe('envío por lotes en CCO', () => {
  it('divide en lotes del tamaño máximo', () => {
    expect(enLotes([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(enLotes(Array.from({ length: 85 }, (_, i) => i)).map((l) => l.length)).toEqual([40, 40, 5]);
  });
  it('pone al tutor en Para y a las empresas en CCO (nunca en Para)', () => {
    const b = { para: 'omar.romero@jrotero.es', cco: ['rrhh@a.test', 'talento@b.test'], asunto: 'Hola', cuerpo: 'Texto' };
    const o = new URL(urlOutlookCco(b));
    expect(o.searchParams.get('to')).toBe('omar.romero@jrotero.es');
    expect(o.searchParams.get('bcc')).toBe('rrhh@a.test;talento@b.test');
    const g = new URL(urlGmailCco(b));
    expect(g.searchParams.get('to')).toBe('omar.romero@jrotero.es');
    expect(g.searchParams.get('bcc')).toBe('rrhh@a.test,talento@b.test');
    expect(urlMailtoCco(b)).toMatch(/^mailto:omar\.romero@jrotero\.es\?bcc=rrhh%40a\.test%2Ctalento%40b\.test&subject=Hola/);
  });
  it('exporta CSV con BOM, «;» y comillas escapadas', () => {
    const csv = csvCombinacion([{ empresa: 'Acme "Labs"', email: 'rrhh@a.test', sector: 'Web', zona: 'Sur', perfiles: 'Desarrollo web' }]);
    expect(csv.startsWith('﻿empresa;email;sector;zona;perfiles;saludo\r\n')).toBe(true);
    expect(csv).toContain('"Acme ""Labs""";"rrhh@a.test"');
    expect(csv).toContain('"Hola, equipo de Acme ""Labs"":"');
  });
});
