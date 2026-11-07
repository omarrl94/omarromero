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
import { detectarAts, enlacesDeInteres, extraerCorreos, leerSitemap, mencionaPracticas, paginasEmpleoDeSitemap, PENALIZACION_BUZON_NO_CONFIRMADO, priorizarUrls, RANGO_FORMULARIO, rangoCorreo, RE_PORTAL_EMPLEO, RUTAS_HABITUALES, tipoPagina, tituloDe, esRutaDeOtroPais, valorarCorreos, type CorreoValorado, type TipoPagina } from './lib/verificador';
import { analizarHtml, crearComprobadorNavegador, type ResultadoFormulario } from './lib/formularios';
import { comprobarBuzon as comprobarBuzonRed, type ComprobacionBuzon } from './lib/smtp';

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
  buzones?: ({ email: string } & ComprobacionBuzon)[];
  formulariosRevisados?: { url: string; valido: boolean; motivo: string; campos?: string[] }[];
  /** Pruebas del canal elegido, para la revisión manual (docs/AUDITORIA-CONTACTOS.md). */
  evidencia?: { url: string; titulo: string; fragmento?: string; buzon?: string; campos?: string[] };
}

/** Decisiones de la revisión manual (data/revision-manual.json). */
export interface Revision {
  descartar?: boolean;
  correosRechazados?: string[];
  formulariosRechazados?: string[];
  motivo: string;
  fecha: string;
}

/** Correos que han rebotado de verdad al escribirles (data/correos-rebotados.json). */
export interface Rebote {
  email: string;
  fecha: string;
  respuesta: string;
}

/** Fragmento de texto alrededor del correo, para comprobar a mano qué dice la página. */
export function fragmentoCon(html: string, email: string): string {
  const texto = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
  const i = texto.toLowerCase().indexOf(email.toLowerCase());
  return i === -1 ? '(el correo está en un enlace mailto, no en el texto visible)' : texto.slice(Math.max(0, i - 140), i + email.length + 80).trim();
}

const hoy = () => new Date().toISOString().slice(0, 10);
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? 'true']));

export interface Dependencias {
  descargar: typeof descargarRed;
  tieneMx: typeof tieneMxRed;
  hoy: () => string;
  /** Pregunta al servidor de correo si el buzón existe (sin enviar nada). Por defecto, sin comprobar. */
  comprobarBuzon?: (email: string) => Promise<ComprobacionBuzon>;
  /** Carga la página (con navegador en GitHub Actions) y decide si tiene un formulario real. */
  comprobarFormulario?: (url: string, html?: string) => Promise<ResultadoFormulario>;
}

export interface DatosExtra {
  revision?: Record<string, Revision>;
  rebotes?: Rebote[];
}

const sinComprobar = async (): Promise<ComprobacionBuzon> => ({ resultado: 'indeterminado', respuesta: 'no comprobado (sin --smtp)' });

const DEPS: Dependencias = { descargar: descargarRed, tieneMx: tieneMxRed, hoy };

/** Portales de empleo que se prueban si la portada no responde: el de la investigación y subdominios habituales. */
export function portalesDeEmpleo(c: Pick<Candidata, 'web' | 'empleoUrl'>): string[] {
  const dominio = new URL(c.web).hostname.replace(/^www\./, '');
  return [...new Set([...(c.empleoUrl ? [c.empleoUrl] : []), ...['empleo', 'trabajaconnosotros', 'careers', 'jobs', 'talento'].map((s) => `https://${s}.${dominio}/`)])];
}

export async function verificar(c: Candidata, retiradas: Retirada[], deps: Dependencias = DEPS, extra: DatosExtra = {}): Promise<{ r: ResultadoVerificacion; empresa?: Empresa }> {
  const { descargar, tieneMx } = deps;
  const comprobarBuzon = deps.comprobarBuzon ?? sinComprobar;
  const comprobarFormulario =
    deps.comprobarFormulario ??
    (async (url: string, html?: string) => {
      const h = html ?? (await descargar(url)).html;
      return analizarHtml(url, h);
    });
  const r: ResultadoVerificacion = { id: c.id, nombre: c.nombre, web: c.web, estado: 'descartada', paginasRevisadas: [], correosEncontrados: [] };
  const host = new URL(c.web).hostname.replace(/^www\./, '');
  if (retiradas.some((x) => x.id === c.id || (x.dominio && host.endsWith(x.dominio)))) {
    r.motivo = 'Retirada a petición de la empresa';
    return { r };
  }

  // 1. La web responde. Si la portada bloquea a los robots (403, tiempo agotado…), se prueba su portal oficial
  //    de empleo: el indicado en la investigación o un subdominio de empleo del MISMO dominio.
  let raiz = await descargar(c.web);
  r.paginasRevisadas.push({ url: c.web, estado: raiz.estado || raiz.error || 'error' });
  if (raiz.estado < 200 || raiz.estado >= 400) {
    const fallo = raiz.estado || raiz.error;
    for (const alternativa of portalesDeEmpleo(c)) {
      const p = await descargar(alternativa);
      r.paginasRevisadas.push({ url: alternativa, estado: p.estado || p.error || 'error' });
      if (p.estado >= 200 && p.estado < 400) {
        raiz = p;
        break;
      }
    }
    if (raiz.estado < 200 || raiz.estado >= 400) {
      r.motivo = `La web no responde (${fallo})`;
      return { r };
    }
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
    for (const u of priorizarUrls([...new Set(lista)]).filter((x) => !revisadas.has(x) && !esRutaDeOtroPais(x)).slice(0, max)) {
      revisadas.add(u);
      const p = await descargar(u);
      r.paginasRevisadas.push({ url: u, estado: p.estado || p.error || 'error' });
      if (p.estado >= 200 && p.estado < 400 && !esRutaDeOtroPais(p.urlFinal) && !revisadas.has(p.urlFinal + '#ok')) {
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
  const preferencia: TipoPagina[] = ['empleo', 'contacto', 'otra', 'legal', 'articulo'];
  for (const p of paginas) {
    // Las páginas de filiales de otros países (p. ej. la portada redirigida a /en-us) no cuentan.
    if (esRutaDeOtroPais(p.urlFinal)) continue;
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
  const revision = extra.revision?.[c.id];
  for (const v of r.correosEncontrados) {
    if (v.motivoRechazo) continue;
    const rebote = extra.rebotes?.find((x) => x.email.toLowerCase() === v.email.toLowerCase());
    if (rebote) v.motivoRechazo = `rebotó al escribirle (${rebote.fecha}: ${rebote.respuesta})`;
    else if (revision?.correosRechazados?.includes(v.email)) v.motivoRechazo = `rechazado en la revisión manual: ${revision.motivo}`;
    else if (rangoCorreo(v, dondeAparece.get(v.email)!.tipos) === null) {
      v.motivoRechazo = 'solo aparece en la portada, un artículo o el aviso legal (no es el canal de candidaturas)';
    }
  }

  // 4. Correos aceptables, del mejor al peor canal: MX y, después, el propio servidor de correo
  //    confirma (sin enviar nada) si el buzón existe.
  const candidatosCorreo = r.correosEncontrados
    .map((v) => ({ v, rango: rangoCorreo(v, dondeAparece.get(v.email)!.tipos) }))
    .filter((x): x is { v: CorreoValorado; rango: number } => x.rango !== null)
    .sort((a, b) => a.rango - b.rango || a.v.email.localeCompare(b.v.email));
  let elegido: { v: CorreoValorado; rango: number; buzon: ComprobacionBuzon } | null = null;
  let mx: boolean | null = null;
  for (const cand of candidatosCorreo.slice(0, 4)) {
    mx = await tieneMx(cand.v.email.split('@')[1]);
    if (mx !== true) {
      cand.v.motivoRechazo = mx === false ? 'el dominio no tiene registros MX' : 'no se pudo consultar MX';
      continue;
    }
    const buzon = await comprobarBuzon(cand.v.email);
    r.buzones = [...(r.buzones ?? []), { email: cand.v.email, ...buzon }];
    if (buzon.resultado === 'no-existe') {
      cand.v.motivoRechazo = `el servidor de correo dice que el buzón no existe (${buzon.respuesta.slice(0, 120)})`;
      continue;
    }
    if (cand.rango === 5 && buzon.resultado !== 'existe') {
      cand.v.motivoRechazo = 'no está en la página de empleo ni de contacto y el servidor no confirma el buzón';
      continue;
    }
    elegido = { v: cand.v, rango: cand.rango + (buzon.resultado === 'existe' ? 0 : PENALIZACION_BUZON_NO_CONFIRMADO), buzon };
    break;
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

  // 6. Formularios: solo cuentan los que, cargada la página, tienen correo + mensaje o CV
  //    (ver scripts/lib/formularios.ts). Se prueban primero los de empleo; si una página invita a
  //    enviar la «candidatura espontánea», se sigue ese enlace un salto.
  const RE_URL_EMPLEO = /(empleo|trabaja|careers|career|jobs|talent|talento|unete|join|candidat|rrhh|seleccion)/i;
  const dominioBase = (u: string) => new URL(u).hostname.replace(/^www\./, '').split('.').slice(-2).join('.');
  const propioOAts = (u: string) => {
    try {
      return dominioBase(u) === dominioBase(c.web) || RE_PORTAL_EMPLEO.test(new URL(u).hostname);
    } catch {
      return false;
    }
  };
  const posibles = paginas
    .filter((p) => !esRutaDeOtroPais(p.urlFinal) && propioOAts(p.urlFinal) && !['legal', 'articulo'].includes(tipoPagina(p.urlFinal)))
    .filter((p) => (c.formularioUrl && p.url === c.formularioUrl) || /<form\b|<iframe\b|hsforms|typeform|jotform/i.test(p.html) || analizarHtml(p.urlFinal, p.html).enlacesCandidatura?.length)
    .filter((p) => p !== raiz || c.formularioUrl === p.url || RE_URL_EMPLEO.test(p.urlFinal) || /contact/i.test(p.urlFinal))
    .sort((a, b) => Number(!RE_URL_EMPLEO.test(b.urlFinal)) - Number(!RE_URL_EMPLEO.test(a.urlFinal)) || 0);
  const rechazadosRevision = new Set(revision?.formulariosRechazados ?? []);
  let formEmpleo: { url: string; campos: string[] } | undefined;
  let formContacto: { url: string; campos: string[] } | undefined;
  r.formulariosRevisados = [];
  const probarFormulario = async (url: string, html?: string) => {
    if (rechazadosRevision.has(url)) {
      r.formulariosRevisados!.push({ url, valido: false, motivo: `rechazado en la revisión manual: ${revision?.motivo}` });
      return null;
    }
    const res = await comprobarFormulario(url, html);
    r.formulariosRevisados!.push({ url: res.url, valido: res.valido, motivo: res.motivo, campos: res.campos });
    return res;
  };
  for (const p of posibles.slice(0, 6)) {
    if (formEmpleo) break;
    const esEmpleo = RE_URL_EMPLEO.test(p.urlFinal);
    if (!esEmpleo && formContacto) continue;
    const res = await probarFormulario(p.urlFinal, p.html);
    if (!res) continue;
    let valido = res.valido ? res : null;
    let empleoReal = esEmpleo;
    if (!valido) {
      for (const enlace of (res.enlacesCandidatura ?? []).filter(propioOAts).slice(0, 2)) {
        const sig = await probarFormulario(enlace);
        if (sig?.valido) {
          valido = sig;
          empleoReal = true;
          break;
        }
      }
    }
    if (!valido || !propioOAts(valido.url)) continue;
    const encontrado = { url: valido.url, campos: valido.campos ?? [] };
    if (empleoReal || RE_URL_EMPLEO.test(valido.url)) formEmpleo = encontrado;
    else formContacto ??= encontrado;
  }

  const opciones: { rango: number; tipo: 'email' | 'empleo' | 'contacto' }[] = [];
  if (elegido) opciones.push({ rango: elegido.rango, tipo: 'email' });
  if (formEmpleo) opciones.push({ rango: RANGO_FORMULARIO.empleo, tipo: 'empleo' });
  if (formContacto) opciones.push({ rango: RANGO_FORMULARIO.contacto, tipo: 'contacto' });
  opciones.sort((a, b) => a.rango - b.rango);
  const mejor = revision?.descartar ? undefined : opciones[0];

  let contacto: Empresa['contacto'];
  let confianza: Empresa['verificacion']['confianza'];
  let buzon: Empresa['verificacion']['buzon'];
  if (!mejor) {
    const motivosForm = r.formulariosRevisados.length ? `; formularios: ${r.formulariosRevisados.map((f) => `${f.url} → ${f.motivo}`).join('; ')}` : '';
    r.motivo = revision?.descartar
      ? `Descartada en la revisión manual: ${revision.motivo}`
      : r.correosEncontrados.length
        ? `Sin correo válido para candidaturas (${r.correosEncontrados.map((x) => `${x.email}: ${x.motivoRechazo ?? 'no elegido'}`).join('; ')}) ni formulario real${motivosForm}`
        : `Sin correo publicado ni formulario real en las páginas revisadas${motivosForm}`;
    return { r };
  }
  if (mejor.tipo === 'email' && elegido) {
    contacto = { tipo: 'email', email: elegido.v.email, fuenteUrl: dondeAparece.get(elegido.v.email)!.url, tipoContacto: elegido.v.tipo };
    confianza = elegido.buzon.resultado === 'existe' && elegido.rango <= 2 ? 'alta' : 'media';
    buzon = elegido.buzon.resultado === 'existe' ? 'existe' : elegido.buzon.resultado === 'acepta-todo' ? 'acepta-todo' : 'sin-confirmar';
    const pagina = paginas.find((p) => p.urlFinal === contacto.fuenteUrl);
    r.evidencia = { url: contacto.fuenteUrl, titulo: pagina ? tituloDe(pagina.html) ?? '' : '', fragmento: pagina ? fragmentoCon(pagina.html, elegido.v.email) : '', buzon: `${elegido.buzon.resultado}: ${elegido.buzon.respuesta}` };
  } else {
    const formulario = (mejor.tipo === 'empleo' ? formEmpleo : formContacto)!;
    contacto = { tipo: 'formulario', fuenteUrl: formulario.url, formularioUrl: formulario.url, tipoContacto: mejor.tipo === 'empleo' ? 'talento' : 'general' };
    confianza = mejor.tipo === 'empleo' ? 'alta' : 'media';
    mx = null;
    const pagina = paginas.find((p) => p.urlFinal === formulario.url);
    r.evidencia = { url: formulario.url, titulo: pagina ? tituloDe(pagina.html) ?? '' : '', campos: formulario.campos };
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
      ...(buzon ? { buzon } : {}),
      notas: `Verificación automática: ${paginas.length} páginas revisadas (incluido el mapa del sitio); ${contacto.tipo === 'email' ? `correo extraído literalmente de una página de ${tipoPagina(contacto.fuenteUrl)}; buzón ${buzon === 'existe' ? 'confirmado por su servidor de correo' : buzon === 'acepta-todo' ? 'no confirmable (el servidor acepta cualquier dirección)' : 'sin confirmar'}` : `formulario de ${contacto.tipoContacto === 'talento' ? 'empleo' : 'contacto'} comprobado en el navegador (campos: ${(r.evidencia?.campos ?? []).slice(0, 6).join(', ')})`}.`,
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

/** Pruebas de cada contacto publicado, para revisarlas a mano (docs/AUDITORIA-CONTACTOS.md). */
function auditoriaMarkdown(resultados: ResultadoVerificacion[], fecha: string): string {
  const validas = resultados.filter((r) => r.estado === 'valida' && r.evidencia).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const esc = (t: string) => t.replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const correos = validas.filter((r) => r.evidencia?.fragmento !== undefined);
  const formularios = validas.filter((r) => r.evidencia?.campos);
  return [
    '# Auditoría de contactos (pruebas para la revisión manual)',
    '',
    `Generado el ${fecha}. Cada contacto publicado con la prueba de por qué se acepta. Si alguno no sirve, añádelo a \`data/revision-manual.json\` (correo o formulario rechazado, o empresa descartada) y se excluirá en la siguiente verificación.`,
    '',
    `## Correos (${correos.length})`,
    '',
    'El buzón se comprueba preguntando al servidor de correo (RCPT TO), sin enviar ningún mensaje: **existe** = confirmado; **acepta-todo** = el servidor acepta cualquier dirección y no se puede confirmar; **indeterminado** = no respondió o bloqueó la consulta.',
    '',
    '| Empresa | Correo | Página | Buzón | Texto de la página |',
    '|---|---|---|---|---|',
    ...correos.map((r) => `| ${esc(r.nombre)} | ${esc((r.contacto ?? '').split(' ')[0])} | ${r.evidencia!.url} | ${esc(r.evidencia!.buzon ?? '')} | ${esc(r.evidencia!.fragmento ?? '')} |`),
    '',
    `## Formularios (${formularios.length})`,
    '',
    'Comprobados en un navegador real tras cargar la página: tienen campo de correo y de mensaje o CV, y no son buscadores, boletines ni accesos.',
    '',
    '| Empresa | Formulario | Título de la página | Campos |',
    '|---|---|---|---|',
    ...formularios.map((r) => `| ${esc(r.nombre)} | ${r.evidencia!.url} | ${esc(r.evidencia!.titulo)} | ${esc((r.evidencia!.campos ?? []).join(', '))} |`),
    '',
  ].join('\n');
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
    'Criterios: la web responde; el correo aparece literalmente en una página de empleo o de contacto de la propia empresa (no en la portada, un artículo ni el aviso legal), es corporativo (mismo dominio), genérico (no personal), destinado a candidaturas o contacto, su dominio tiene registros MX, su servidor de correo no dice que el buzón no exista y no ha rebotado nunca. Sin correo válido se acepta un formulario real (correo + mensaje o CV, comprobado en un navegador). Sin ninguno, se descarta. Pruebas de cada contacto: docs/AUDITORIA-CONTACTOS.md.',
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
  const extra: DatosExtra = {
    revision: JSON.parse(await readFile('data/revision-manual.json', 'utf8')) as Record<string, Revision>,
    rebotes: JSON.parse(await readFile('data/correos-rebotados.json', 'utf8')) as Rebote[],
  };
  // En GitHub Actions: --smtp pregunta a los servidores de correo y --navegador carga los formularios en Chromium.
  const navegador = args.navegador ? await crearComprobadorNavegador() : null;
  const deps: Dependencias = {
    ...DEPS,
    ...(args.smtp ? { comprobarBuzon: comprobarBuzonRed } : {}),
    ...(navegador ? { comprobarFormulario: (url: string) => navegador.comprobar(url) } : {}),
  };
  const solo = args.solo ? String(args.solo).split(',') : null;
  const lista = solo ? candidatas.filter((c) => solo.includes(c.id)) : candidatas;

  console.log(`Verificando ${lista.length} candidatas…`);
  const salida = await enSerie(lista, Number(args.concurrencia ?? 4), async (c, i) => {
    const res = await verificar(c, retiradas, deps, extra);
    console.log(`${String(i + 1).padStart(3)}/${lista.length} ${res.r.estado === 'valida' ? '✔' : '✖'} ${c.nombre}${res.r.motivo ? ` — ${res.r.motivo}` : ` — ${res.r.contacto}`}`);
    return res;
  });

  // Con --solo se conservan las demás empresas ya verificadas.
  const previas = solo ? EmpresasSchema.parse(JSON.parse(await readFile('data/empresas.json', 'utf8'))).filter((e) => !solo.includes(e.id)) : [];
  const empresas = EmpresasSchema.parse([...previas, ...salida.flatMap((s) => (s.empresa ? [s.empresa] : []))].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
  await navegador?.cerrar();
  const resultados = salida.map((s) => s.r);
  const fecha = new Date().toISOString();

  console.log(`\nVálidas: ${resultados.filter((r) => r.estado === 'valida').length} · Descartadas: ${resultados.filter((r) => r.estado === 'descartada').length}`);
  if (args.simular) return;
  await writeFile('data/empresas.json', JSON.stringify(empresas, null, 2) + '\n');
  await writeFile('data/informe-verificacion.json', JSON.stringify({ fecha, resultados }, null, 2) + '\n');
  await writeFile('docs/INFORME-VERIFICACION.md', informeMarkdown(resultados, fecha));
  await writeFile('docs/AUDITORIA-CONTACTOS.md', auditoriaMarkdown(resultados, fecha));
  console.log('Escritos data/empresas.json, data/informe-verificacion.json y docs/INFORME-VERIFICACION.md');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) void main();
