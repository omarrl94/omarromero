/**
 * Revisión con desconfianza total: elige N empresas al azar de data/empresas.json y vuelve
 * a comprobar desde cero su fuente (la URL responde, el correo aparece en ella y hay MX).
 *   npm run auditar:muestra            # 10 al azar
 *   npm run auditar:muestra -- --n=20
 */
import { readFile, writeFile } from 'node:fs/promises';
import { EmpresasSchema } from '../shared/schemas';
import { descargar, hayRed, tieneMx } from './lib/red';
import { correoApareceEn } from './lib/verificador';

const n = Number(process.argv.find((a) => a.startsWith('--n='))?.split('=')[1] ?? 10);

async function main() {
  const red = await hayRed();
  if (!red.ok) {
    console.error(`✖ Sin acceso a Internet o DNS (${red.detalle}). Auditoría no realizada.`);
    process.exit(2);
  }
  const empresas = EmpresasSchema.parse(JSON.parse(await readFile('data/empresas.json', 'utf8')));
  const muestra = [...empresas].sort(() => Math.random() - 0.5).slice(0, n);
  const filas: string[] = [];
  let fallos = 0;
  for (const e of muestra) {
    const web = await descargar(e.web);
    const fuente = await descargar(e.contacto.fuenteUrl);
    const problemas: string[] = [];
    if (web.estado < 200 || web.estado >= 400) problemas.push(`web ${web.estado || web.error}`);
    if (fuente.estado < 200 || fuente.estado >= 400) problemas.push(`fuente ${fuente.estado || fuente.error}`);
    if (e.contacto.tipo === 'email') {
      if (!correoApareceEn(fuente.html, e.contacto.email!)) problemas.push('el correo ya no aparece en la fuente');
      if ((await tieneMx(e.contacto.email!.split('@')[1])) !== true) problemas.push('sin MX');
    }
    if (problemas.length) fallos++;
    const contacto = e.contacto.tipo === 'email' ? e.contacto.email : 'formulario';
    console.log(`${problemas.length ? '✖' : '✔'} ${e.nombre} — ${contacto} — ${problemas.join(', ') || 'OK'}`);
    filas.push(`| ${e.nombre} | ${contacto} | ${e.contacto.fuenteUrl} | ${problemas.join(', ') || '✔ OK'} |`);
  }
  const md = [
    '# Auditoría de una muestra al azar',
    '',
    `Fecha: ${new Date().toISOString()} · Muestra: ${muestra.length} de ${empresas.length} · Con problemas: ${fallos}`,
    '',
    '| Empresa | Contacto | Fuente | Resultado |',
    '|---|---|---|---|',
    ...filas,
    '',
    'Si alguna falla: vuelve a ejecutar `npm run verificar:empresas -- --solo=<id>` o retírala.',
    '',
  ].join('\n');
  await writeFile('docs/AUDITORIA-MUESTRA.md', md);
  process.exit(fallos ? 1 : 0);
}

void main();
