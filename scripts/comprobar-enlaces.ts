/**
 * Comprueba los enlaces del directorio (web, fuente, empleo, formulario, programa de prácticas)
 * y las plantillas de enlaces profundos a portales. Genera docs/COMPROBACION-ENLACES.md.
 * Los portales que bloquean robots (LinkedIn, Indeed…) hay que probarlos a mano en un navegador:
 * después, marca `probado: true` y la fecha en config/ffe.config.ts.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { config } from '../config/ffe.config';
import { construirEnlace } from '../shared/enlaces';
import { EmpresasSchema } from '../shared/schemas';
import { descargar, enSerie, hayRed } from './lib/red';

async function main() {
  const red = await hayRed();
  if (!red.ok) {
    console.error(`✖ Sin acceso a Internet o DNS (${red.detalle}). Comprobación no realizada.`);
    process.exit(2);
  }
  const empresas = EmpresasSchema.parse(JSON.parse(await readFile('data/empresas.json', 'utf8')));
  const enlaces = empresas.flatMap((e) =>
    [
      ['web', e.web],
      ['fuente', e.contacto.fuenteUrl],
      ['formulario', e.contacto.formularioUrl],
      ['empleo', e.empleoUrl],
      ['prácticas', e.programaPracticas?.url],
    ]
      .filter(([, u]) => u)
      .map(([tipo, url]) => ({ empresa: e.nombre, tipo: tipo!, url: url! })),
  );
  const unicos = [...new Map(enlaces.map((x) => [x.url, x])).values()];
  const res = await enSerie(unicos, 6, async (x) => ({ ...x, p: await descargar(x.url) }));
  const rotos = res.filter((r) => r.p.estado < 200 || r.p.estado >= 400);

  const portales = await enSerie(config.enlacesProfundos, 2, async (e) => {
    const url = construirEnlace(e, 'desarrollador junior', config.lugarBusqueda);
    const p = await descargar(url);
    const login = /(login|signin|authwall|checkpoint|captcha)/i.test(p.urlFinal);
    return { e, url, estado: p.estado || p.error, final: p.urlFinal, login };
  });

  const md = [
    '# Comprobación de enlaces',
    '',
    `Fecha: ${new Date().toISOString()} · Enlaces de empresas: ${unicos.length} · rotos: ${rotos.length}`,
    '',
    '## Enlaces rotos del directorio',
    '',
    rotos.length ? '| Empresa | Tipo | URL | Estado |\n|---|---|---|---|\n' + rotos.map((r) => `| ${r.empresa} | ${r.tipo} | ${r.url} | ${r.p.estado || r.p.error} |`).join('\n') : 'Ninguno.',
    '',
    '## Portales (enlaces profundos)',
    '',
    'Un 403/999 o una redirección a login es habitual con robots: pruébalos a mano en un navegador antes de marcar `probado: true`.',
    '',
    '| Portal | URL de prueba | Estado | Redirige a login | probado en config |',
    '|---|---|---|---|---|',
    ...portales.map((p) => `| ${p.e.nombre} | ${p.url} | ${p.estado} | ${p.login ? 'sí' : 'no'} | ${p.e.probado ? p.e.fechaPrueba : 'no'} |`),
    '',
  ].join('\n');
  await writeFile('docs/COMPROBACION-ENLACES.md', md);
  console.log(md);
  process.exit(rotos.length ? 1 : 0);
}

void main();
