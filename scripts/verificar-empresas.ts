/**
 * Verifica las empresas candidatas (data/empresas.candidatas.json) contra sus webs oficiales
 * y genera data/empresas.json SOLO con las que superan todas las comprobaciones.
 *
 *   npm run verificar:empresas                 # todas
 *   npm run verificar:empresas -- --solo=a,b   # algunas
 *   npm run verificar:empresas -- --simular    # no escribe archivos
 *
 * Reglas (CLAUDE.md): el correo se EXTRAE de la web de la empresa; nunca se escribe a mano ni se deduce.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { CandidatasSchema, EmpresaSchema, EmpresasSchema, type Candidata, type Empresa } from '../shared/schemas';
import { descargar as descargarRed, enSerie, hayRed, tieneMx as tieneMxRed, type Pagina } from './lib/red';
import { pathToFileURL } from 'node:url';
import { detectarAts, enlacesDeInteres, esPaginaFormulario, extraerCorreos, leerSitemap, mencionaPracticas, paginasEmpleoDeSitemap, priorizarUrls, RANGO_FORMULARIO, rangoCorreo, RUTAS_HABITUALES, tipoPagina, tituloDe, valorarCorreos, type CorreoValorado, type TipoPagina } from './lib/verificador';

interface Retirada { id?: string; dominio?: string; fecha: string }

export interface ResultadoVerificacion {
  id: string;
  nombre: string;
  web: string;
  estado: 'valida' | 'descartada';
  motivo?: string;
  contacto?: string;
  confianza?: string;
  paginasRevisadas: { url: string; estado: number | string }[];
  correosEncontrados: CorreoValorado[];
  feedAts?: string;
}

const hoy = () => new Date().toISOString().slice(0, 10);
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? 'true']));

export interface Dependencias {
  descargar: typeof descargarRed;
  tieneMx: typeof tieneMxRed;
  hoy: () => string;
}

const DEPS: Dependencias = { descargar: descargarRed, tieneMx: tieneMxRed, hoy };

export async function verificar(c: Candidata, retiradas: Retirada[], deps: Dependencias = DEPS): Promise<{ r: ResultadoVerificacion; empresa?: Empresa }> {
  const { descargar, tieneMx } = deps;
  const r: ResultadoVerificacion = { id: c.id, nombre: c.nombre, web: c.web, estado: 'descartada', paginasRevisadas: [], correosEncontrados: [] };
  const host = new URL(c.web).hostname.replace(/^www\./, '');
  if (retiradas.some((x) => x.id === c.id || (x.dominio && host.endsWith(x.dominio)))) {
    r.motivo = 'Retirada a petición de la empresa';
    return { r };
  }

  // 1. La web responde.
  const raiz = await descargar(c.web);
  r.paginasRevisadas.push({ url: c.web, estado: raiz.estado || raiz.error || 'error' });
  if (raiz.estado < 200 || raiz.estado >= 400) {
    r.motivo = `La web no responde (${raiz.estado || raiz.error})`;
    return { r };
  }
  // Si la web redirige a otro dominio (p. ej. empresa absorbida), no es la misma empresa.
  const base = (u: string) => new URL(u).hostname.replace(/^www\./, '').split('.').slice(-2).join('.');
  if (base(raiz.urlFinal) !== base(c.web)) {
    r.motivo = `La web redirige a otro dominio (${new URL(raiz.urlFinal).hostname}): posible empresa absorbida o cambio de marca, revisar a mano`;
    return { r };
  }

  // 2. Páginas a revisar: las indicadas en la investigación, los enlaces de empleo/contacto/legal de la portada
  //    y las rutas habituales de empleo, empezando por las de empleo y RR. HH.
  const origen = new URL(raiz.urlFinal).origin;
  const revisadas = new Set<string>([c.web, raiz.urlFinal]);
  const paginas: Pagina[] = [raiz];
  const revisar = async (lista: string[], max: number) => {
    for (const u of priorizarUrls([...new Set(lista)]).filter((x) => !revisadas.has(x)).slice(0, max)) {
      revisadas.add(u);
      const p = await descargar(u);
      r.paginasRevisadas.push({ url: u, estado: p.estado || p.error || 'error' });
      if (p.estado >= 200 && p.estado < 400 && !revisadas.has(p.urlFinal + '#ok')) {
        revisadas.add(p.urlFinal + '#ok');
        paginas.push(p);
      }
    }
  };
  // Mapa del sitio: encuentra las páginas de empleo y RR. HH. aunque no estén enlazadas en la portada.
  const delSitemap: string[] = [];
  {
    const robots = await descargar(`${origen}/robots.txt`, 10_000);
    const mapas = [...robots.html.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1]);
    if (!mapas.length) mapas.push(`${origen}/sitemap.xml`, `${origen}/sitemap_index.xml`);
    const vistos = new Set<string>();
    const pendientesMapa = mapas.slice(0, 3);
    while (pendientesMapa.length && vistos.size < 6) {
      const m = pendientesMapa.shift()!;
      if (vistos.has(m)) continue;
      vistos.add(m);
      const pm = await descargar(m, 12_000);
      if (pm.estado !== 200) continue;
      const { urls, esIndice } = leerSitemap(pm.html);
      if (esIndice) pendientesMapa.push(...urls.filter((u) => /page|pagina|sitemap\.xml$|main|general/i.test(u)).slice(0, 3), ...urls.slice(0, 2));
      else delSitemap.push(...paginasEmpleoDeSitemap(urls, raiz.urlFinal));
    }
  }
  await revisar([...c.paginasContacto, ...(c.formularioUrl ? [c.formularioUrl] : []), ...(c.empleoUrl ? [c.empleoUrl] : []), ...delSitemap.slice(0, 6), ...enlacesDeInteres(raiz.html, raiz.urlFinal, 14)], 18);
  // Rutas habituales solo si en lo revisado no hay ya un buzón de RR. HH./talento.
  const hayRrhh = () => valorarCorreos(paginas.flatMap((p) => extraerCorreos(p.html)), c.web).some((v) => !v.motivoRechazo && v.tipo !== 'general');
  if (!hayRrhh()) await revisar(RUTAS_HABITUALES.map((ruta) => origen + ruta), 8);
  // Segundo nivel: enlaces que salen de las páginas de empleo encontradas.
  if (!hayRrhh()) {
    const deEmpleo = paginas.filter((p) => p !== raiz && /(trabaja|empleo|talent|career|jobs|unete|join|rrhh)/i.test(p.urlFinal));
    await revisar(deEmpleo.flatMap((p) => enlacesDeInteres(p.html, p.urlFinal, 8)), 6);
  }

  // 3. Correos publicados en esas páginas: dónde aparece cada uno y en qué tipo de página.
  const dondeAparece = new Map<string, { url: string; tipos: TipoPagina[] }>();
  const preferencia: TipoPagina[] = ['empleo', 'contacto', 'otra', 'legal'];
  for (const p of paginas) {
    const tipo = tipoPagina(p.urlFinal);
    for (const e of extraerCorreos(p.html)) {
      const previo = dondeAparece.get(e);
      if (!previo) dondeAparece.set(e, { url: p.urlFinal, tipos: [tipo] });
      else {
        previo.tipos.push(tipo);
        if (preferencia.indexOf(tipo) < preferencia.indexOf(tipoPagina(previo.url))) previo.url = p.urlFinal;
      }
    }
  }
  r.correosEncontrados = valorarCorreos([...dondeAparece.keys()], c.web);
  for (const v of r.correosEncontrados) {
    if (!v.motivoRechazo && rangoCorreo(v, dondeAparece.get(v.email)!.tipos) === null) {
      v.motivoRechazo = 'solo aparece en el aviso legal, la privacidad o las condiciones (no es el buzón de candidaturas)';
    }
  }

  // 4. Correos aceptables, del mejor al peor canal, con registros MX.
  const candidatosCorreo = r.correosEncontrados
    .map((v) => ({ v, rango: rangoCorreo(v, dondeAparece.get(v.email)!.tipos) }))
    .filter((x): x is { v: CorreoValorado; rango: number } => x.rango !== null)
    .sort((a, b) => a.rango - b.rango || a.v.email.localeCompare(b.v.email));
  let elegido: { v: CorreoValorado; rango: number } | null = null;
  let mx: boolean | null = null;
  for (const cand of candidatosCorreo) {
    mx = await tieneMx(cand.v.email.split('@')[1]);
    if (mx === true) {
      elegido = cand;
      break;
    }
    cand.v.motivoRechazo = mx === false ? 'el dominio no tiene registros MX' : 'no se pudo consultar MX';
  }

  // 5. Feeds ATS enlazados desde la propia web.
  let feedAts: Empresa['feedAts'];
  for (const f of paginas.flatMap((p) => detectarAts(p.html))) {
    const api = { greenhouse: `https://boards-api.greenhouse.io/v1/boards/${f.identificador}/jobs`, lever: `https://api.lever.co/v0/postings/${f.identificador}?mode=json`, ashby: `https://api.ashbyhq.com/posting-api/job-board/${f.identificador}` }[f.proveedor];
    const p = await descargar(api);
    if (p.estado === 200) {
      feedAts = f;
      r.feedAts = `${f.proveedor}:${f.identificador}`;
      break;
    }
  }

  const empleo = paginas.find((p) => p !== raiz && /(empleo|trabaja|careers|career|jobs|talent|talento|unete|join)/i.test(p.urlFinal));
  const empleoUrl = c.empleoUrl && paginas.some((p) => p.url === c.empleoUrl) ? c.empleoUrl : empleo?.urlFinal;

  let programaPracticas: Empresa['programaPracticas'];
  if (c.programaPracticasUrl) {
    const p = await descargar(c.programaPracticasUrl);
    r.paginasRevisadas.push({ url: c.programaPracticasUrl, estado: p.estado || p.error || 'error' });
    if (p.estado === 200 && mencionaPracticas(p.html)) {
      programaPracticas = { titulo: tituloDe(p.html)?.split(/[|–-]/)[0].trim() || 'Programa de prácticas', url: p.urlFinal, fechaComprobacion: deps.hoy() };
    }
  }

  // 6. Canal de contacto: el mejor entre correo y formulario (ver rangoCorreo y RANGO_FORMULARIO).
  const RE_URL_EMPLEO = /(empleo|trabaja|careers|career|jobs|talent|talento|unete|join|candidat)/i;
  const formEmpleo =
    paginas.find((p) => c.formularioUrl && p.url === c.formularioUrl && RE_URL_EMPLEO.test(p.urlFinal)) ??
    paginas.find((p) => p !== raiz && esPaginaFormulario(p.urlFinal, p.html) && RE_URL_EMPLEO.test(p.urlFinal));
  const formContacto =
    paginas.find((p) => c.formularioUrl && p.url === c.formularioUrl) ?? paginas.find((p) => p !== raiz && esPaginaFormulario(p.urlFinal, p.html));
  const opciones: { rango: number; tipo: 'email' | 'empleo' | 'contacto' }[] = [];
  if (elegido) opciones.push({ rango: elegido.rango, tipo: 'email' });
  if (formEmpleo) opciones.push({ rango: RANGO_FORMULARIO.empleo, tipo: 'empleo' });
  if (formContacto) opciones.push({ rango: RANGO_FORMULARIO.contacto, tipo: 'contacto' });
  opciones.sort((a, b) => a.rango - b.rango);
  const mejor = opciones[0];

  let contacto: Empresa['contacto'];
  let confianza: Empresa['verificacion']['confianza'];
  if (!mejor) {
    r.motivo = r.correosEncontrados.length
      ? `Sin correo válido para candidaturas (${r.correosEncontrados.map((x) => `${x.email}: ${x.motivoRechazo}`).join('; ')}) ni formulario oficial`
      : 'Sin correo publicado ni formulario oficial en las páginas revisadas';
    return { r };
  }
  if (mejor.tipo === 'email' && elegido) {
    contacto = { tipo: 'email', email: elegido.v.email, fuenteUrl: dondeAparece.get(elegido.v.email)!.url, tipoContacto: elegido.v.tipo };
    confianza = elegido.rango <= 2 ? 'alta' : 'media';
  } else {
    const formulario = (mejor.tipo === 'empleo' ? formEmpleo : formContacto)!;
    contacto = { tipo: 'formulario', fuenteUrl: formulario.urlFinal, formularioUrl: formulario.urlFinal, tipoContacto: mejor.tipo === 'empleo' ? 'talento' : 'general' };
    confianza = mejor.tipo === 'empleo' ? 'alta' : 'media';
    mx = null;
  }

  const empresa: Empresa = {
    id: c.id,
    nombre: c.nombre,
    web: c.web,
    sector: c.sector,
    tamano: c.tamano,
    zona: c.zona,
    ...(c.direccion ? { direccion: c.direccion } : {}),
    perfiles: c.perfiles,
    motivoEncaje: c.motivoEncaje,
    contacto,
    ...(empleoUrl ? { empleoUrl } : {}),
    ...(programaPracticas ? { programaPracticas } : {}),
    ...(feedAts ? { feedAts } : {}),
    verificacion: {
      fecha: deps.hoy(),
      confianza,
      mx,
      notas: `Verificación automática: ${paginas.length} páginas revisadas (incluido el mapa del sitio); ${contacto.tipo === 'email' ? `correo extraído literalmente de una página de ${tipoPagina(contacto.fuenteUrl)}` : `formulario oficial de ${contacto.tipoContacto === 'talento' ? 'empleo' : 'contacto'}`}.`,
    },
  };
  const val = EmpresaSchema.safeParse(empresa);
  if (!val.success) {
    r.motivo = `No supera el esquema: ${val.error.issues.map((i) => i.message).join('; ')}`;
    return { r };
  }
  r.estado = 'valida';
  r.contacto = contacto.tipo === 'email' ? `${contacto.email} (${contacto.fuenteUrl})` : `formulario: ${contacto.formularioUrl}`;
  r.confianza = confianza;
  return { r, empresa: val.data };
}

function informeMarkdown(resultados: ResultadoVerificacion[], fecha: string): string {
  const validas = resultados.filter((r) => r.estado === 'valida');
  const descartadas = resultados.filter((r) => r.estado === 'descartada');
  const esc = (s: string) => s.replace(/\|/g, '\\|');
  return [
    '# Informe de verificación de empresas',
    '',
    `Generado el ${fecha} con \`npm run verificar:empresas\`. Candidatas: ${resultados.length} · **válidas: ${validas.length}** · descartadas: ${descartadas.length}.`,
    '',
    'Criterios: la web responde; el correo aparece literalmente en la URL indicada, es corporativo (mismo dominio), genérico (no personal), destinado a candidaturas o contacto general y su dominio tiene registros MX. Sin correo válido se acepta el formulario oficial de empleo o contacto. Sin ninguno, se descarta.',
    '',
    '## Válidas',
    '',
    '| Empresa | Contacto (fuente) | Confianza | Feed ATS |',
    '|---|---|---|---|',
    ...validas.map((r) => `| ${esc(r.nombre)} | ${esc(r.contacto ?? '')} | ${r.confianza} | ${r.feedAts ?? '—'} |`),
    '',
    '## Descartadas',
    '',
    '| Empresa | Web | Motivo |',
    '|---|---|---|',
    ...descartadas.map((r) => `| ${esc(r.nombre)} | ${r.web} | ${esc(r.motivo ?? '')} |`),
    '',
  ].join('\n');
}

async function main() {
  const red = await hayRed();
  if (!red.ok) {
    console.error(`✖ Sin acceso a Internet o DNS (${red.detalle}).\n  No se ha modificado ningún archivo: verificar sin red descartaría empresas válidas.`);
    process.exit(2);
  }
  const candidatas = CandidatasSchema.parse(JSON.parse(await readFile('data/empresas.candidatas.json', 'utf8')));
  const retiradas = JSON.parse(await readFile('data/retiradas.json', 'utf8')) as Retirada[];
  const solo = args.solo ? String(args.solo).split(',') : null;
  const lista = solo ? candidatas.filter((c) => solo.includes(c.id)) : candidatas;

  console.log(`Verificando ${lista.length} candidatas…`);
  const salida = await enSerie(lista, Number(args.concurrencia ?? 4), async (c, i) => {
    const res = await verificar(c, retiradas);
    console.log(`${String(i + 1).padStart(3)}/${lista.length} ${res.r.estado === 'valida' ? '✔' : '✖'} ${c.nombre}${res.r.motivo ? ` — ${res.r.motivo}` : ` — ${res.r.contacto}`}`);
    return res;
  });

  // Con --solo se conservan las demás empresas ya verificadas.
  const previas = solo ? EmpresasSchema.parse(JSON.parse(await readFile('data/empresas.json', 'utf8'))).filter((e) => !solo.includes(e.id)) : [];
  const empresas = EmpresasSchema.parse([...previas, ...salida.flatMap((s) => (s.empresa ? [s.empresa] : []))].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
  const resultados = salida.map((s) => s.r);
  const fecha = new Date().toISOString();

  console.log(`\nVálidas: ${resultados.filter((r) => r.estado === 'valida').length} · Descartadas: ${resultados.filter((r) => r.estado === 'descartada').length}`);
  if (args.simular) return;
  await writeFile('data/empresas.json', JSON.stringify(empresas, null, 2) + '\n');
  await writeFile('data/informe-verificacion.json', JSON.stringify({ fecha, resultados }, null, 2) + '\n');
  await writeFile('docs/INFORME-VERIFICACION.md', informeMarkdown(resultados, fecha));
  console.log('Escritos data/empresas.json, data/informe-verificacion.json y docs/INFORME-VERIFICACION.md');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) void main();
