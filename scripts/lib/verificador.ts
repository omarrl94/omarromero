/**
 * Lógica pura de verificación de empresas (sin red), probada en tests/unit/verificador.test.ts.
 * La parte con red está en scripts/lib/red.ts.
 */
import { dominioCoincide, esCorreoGenerico, esCorreoGratuito, type TipoContacto } from '../../shared/schemas';

/** Prefijos de buzones que NO son para candidaturas: nunca se eligen. */
const NO_CANDIDATURAS = [
  'dpo', 'privacidad', 'privacy', 'lopd', 'rgpd', 'gdpr', 'dataprotection', 'protecciondedatos', 'protecciondatos',
  'datos.personales', 'legal', 'compliance', 'etica', 'ethics', 'canaletico', 'denuncias', 'whistleblowing', 'prensa',
  'press', 'comunicacion', 'media', 'marketing', 'facturacion', 'billing', 'invoices', 'facturas', 'sales', 'ventas',
  'soporte', 'support', 'helpdesk', 'abuse', 'noc', 'security', 'seguridad', 'cert', 'csirt', 'webmaster', 'noreply',
  'no-reply', 'donotreply', 'proveedores', 'suppliers', 'compras', 'purchasing', 'investor', 'inversores', 'ir',
  'accionistas', 'sat', 'pedidos', 'orders', 'reservas', 'bookings', 'partners', 'partner', 'alianzas',
];

const PALABRAS_PRACTICAS = ['practicas', 'becas', 'beca', 'becarios', 'intern', 'internship', 'internships', 'universidad', 'universidades', 'university', 'campus', 'fp', 'dual', 'graduates', 'junior', 'formacion'];
const PALABRAS_TALENTO = ['talento', 'talent', 'careers', 'career', 'carreras', 'jobs', 'job', 'empleo', 'empleos', 'trabajo', 'trabaja', 'trabajaconnosotros', 'people', 'personas', 'cv', 'cvs', 'curriculum', 'joinus', 'join', 'unete', 'recruiting', 'recruitment', 'recruit'];
const PALABRAS_RRHH = ['rrhh', 'rh', 'hr', 'seleccion', 'recursos', 'humanos'];

const RE_EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}/gi;

export function decodificarEntidades(html: string): string {
  return html
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&commat;|&#64;/gi, '@')
    .replace(/&period;/gi, '.')
    .replace(/&amp;/g, '&');
}

/** Decodifica la protección de correo de Cloudflare (data-cfemail): el correo sigue estando publicado. */
export function decodificarCfEmail(hex: string): string {
  const clave = parseInt(hex.slice(0, 2), 16);
  let r = '';
  for (let i = 2; i < hex.length; i += 2) r += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ clave);
  return r;
}

/** Correos que aparecen literalmente en el HTML (texto, mailto: o Cloudflare). En minúsculas y sin duplicados. */
export function extraerCorreos(html: string): string[] {
  const texto = decodificarEntidades(html);
  const encontrados = new Set<string>();
  for (const m of texto.matchAll(RE_EMAIL)) encontrados.add(m[0].toLowerCase().replace(/\.+$/, ''));
  for (const m of html.matchAll(/data-cfemail="([0-9a-f]+)"/gi)) {
    const e = decodificarCfEmail(m[1]).toLowerCase();
    if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(e)) encontrados.add(e);
  }
  // Descarta falsos positivos típicos (imágenes con @2x, etc.).
  return [...encontrados].filter((e) => !/\.(png|jpe?g|gif|svg|webp|css|js)$/.test(e) && !/@\d+x\./.test(e));
}

/** ¿El correo aparece literalmente en el HTML? Usado para la re-verificación de la fuente. */
export function correoApareceEn(html: string, email: string): boolean {
  return extraerCorreos(html).includes(email.toLowerCase());
}

export function tipoContactoDe(email: string): TipoContacto {
  const trozos = email.split('@')[0].toLowerCase().split(/[._+-]/);
  if (trozos.some((t) => PALABRAS_PRACTICAS.includes(t))) return 'practicas';
  if (trozos.some((t) => PALABRAS_TALENTO.includes(t))) return 'talento';
  if (trozos.some((t) => PALABRAS_RRHH.includes(t))) return 'rrhh';
  return 'general';
}

/** Fragmentos que, en cualquier parte del buzón, indican que no es para candidaturas. */
const FRAGMENTOS_NO_CANDIDATURAS = ['help', 'ayuda', 'support', 'soporte', 'privacy', 'privacidad', 'dpo', 'dpd', 'rgpd', 'gdpr', 'lopd', 'compliance', 'factura', 'billing', 'invoice', 'reclamacion', 'incidencia', 'abuse', 'noreply', 'no-reply', 'accesibilidad', 'customer'];
/** Buzones de clientes, ventas o administración (no de candidaturas). */
const OTROS_NO_CANDIDATURAS = ['comercial', 'commercial', 'clientes', 'cliente', 'atencion', 'administracion', 'contabilidad', 'accounting', 'secretaria', 'secretariado', 'direccion', 'gerencia'];
/** Códigos de país distintos de España en el buzón (p. ej. careers.au@): buzones de otras filiales. */
const PAISES_EXTRANJEROS = ['au', 'uk', 'us', 'de', 'fr', 'it', 'pt', 'nl', 'be', 'mx', 'br', 'ar', 'cl', 'co', 'pe', 'in', 'ca', 'ie', 'pl', 'ch', 'at', 'se', 'no', 'dk', 'fi', 'emea', 'latam', 'apac', 'usa', 'global', 'international', 'intl', 'worldwide', 'europe'];

/** Siglas de dos letras que sí pueden aparecer en un buzón español. */
const DOS_LETRAS_PERMITIDAS = ['es', 'rh', 'hr', 'it', 'ti', 'cv', 'fp', 'rr', 'hh'];

export function esParaCandidaturas(email: string): boolean {
  const local = email.split('@')[0].toLowerCase();
  const trozos = local.split(/[._+-]/);
  if (NO_CANDIDATURAS.some((n) => local === n || trozos.includes(n) || local.startsWith(n))) return false;
  if (FRAGMENTOS_NO_CANDIDATURAS.some((f) => local.includes(f))) return false;
  if (OTROS_NO_CANDIDATURAS.some((n) => trozos.includes(n))) return false;
  if (trozos.length > 1 && trozos.some((t) => PAISES_EXTRANJEROS.includes(t))) return false;
  // Cualquier otro código de dos letras junto al buzón (careers.hk@, jobs.sg@…) también es de otra filial.
  if (trozos.length > 1 && trozos.some((t) => /^[a-z]{2}$/.test(t) && !DOS_LETRAS_PERMITIDAS.includes(t))) return false;
  return true;
}

export interface CorreoValorado {
  email: string;
  tipo: TipoContacto;
  motivoRechazo?: string;
}

/** Valora todos los correos encontrados para una empresa. */
export function valorarCorreos(correos: string[], web: string): CorreoValorado[] {
  return correos.map((email) => {
    const tipo = tipoContactoDe(email);
    if (esCorreoGratuito(email)) return { email, tipo, motivoRechazo: 'proveedor gratuito' };
    if (!dominioCoincide(email, web)) return { email, tipo, motivoRechazo: 'dominio distinto al de la web' };
    if (!esParaCandidaturas(email)) return { email, tipo, motivoRechazo: 'buzón no destinado a candidaturas' };
    if (!esCorreoGenerico(email)) return { email, tipo, motivoRechazo: 'posible correo personal' };
    return { email, tipo };
  });
}

const PRIORIDAD: Record<TipoContacto, number> = { practicas: 0, talento: 1, rrhh: 2, general: 3 };

/** El mejor correo aceptable: prácticas > talento > RR. HH. > general. */
export function elegirCorreo(valorados: CorreoValorado[]): CorreoValorado | null {
  const validos = valorados.filter((v) => !v.motivoRechazo);
  validos.sort((a, b) => PRIORIDAD[a.tipo] - PRIORIDAD[b.tipo] || a.email.localeCompare(b.email));
  return validos[0] ?? null;
}

const RE_ENLACE_INTERES = /(contact|contacto|empleo|trabaja|trabajar|careers|career|carreras|jobs|talent|talento|unete|join|aviso-legal|legal|rrhh|practicas|becas|people|personas|equipo)/i;

/** Enlaces del mismo dominio que pueden contener el correo o el formulario. */
export function enlacesDeInteres(html: string, base: string, max = 10): string[] {
  const salida = new Set<string>();
  const hostBase = new URL(base).hostname.replace(/^www\./, '');
  const raiz = hostBase.split('.').slice(-2).join('.');
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const texto = m[2];
    const href = decodificarEntidades(m[1]);
    if (/^(mailto|tel|javascript):/i.test(href)) continue;
    let url: URL;
    try {
      url = new URL(href, base);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(url.protocol)) continue;
    const host = url.hostname.replace(/^www\./, '');
    if (!(host === hostBase || host.endsWith('.' + raiz) || host === raiz)) continue;
    if (/\.(pdf|jpe?g|png|zip|docx?)$/i.test(url.pathname)) continue;
    if (RE_ENLACE_INTERES.test(url.pathname) || RE_ENLACE_INTERES.test(texto.replace(/<[^>]+>/g, ''))) {
      url.hash = '';
      salida.add(url.toString());
    }
    if (salida.size >= max) break;
  }
  return [...salida];
}

export interface FeedDetectado {
  proveedor: 'greenhouse' | 'lever' | 'ashby';
  identificador: string;
}

/** Feeds ATS enlazados desde la propia web de la empresa (nunca se adivinan). */
export function detectarAts(html: string): FeedDetectado[] {
  const r = new Map<string, FeedDetectado>();
  const add = (proveedor: FeedDetectado['proveedor'], id: string) => {
    const identificador = id.toLowerCase();
    if (!['embed', 'js', 'v1', 'jobs', 'api'].includes(identificador)) r.set(`${proveedor}:${identificador}`, { proveedor, identificador });
  };
  for (const m of html.matchAll(/(?:boards|job-boards)(?:\.eu)?\.greenhouse\.io\/(?:embed\/job_board\?for=)?([a-z0-9-]+)/gi)) add('greenhouse', m[1]);
  for (const m of html.matchAll(/jobs\.lever\.co\/([a-z0-9-]+)/gi)) add('lever', m[1]);
  for (const m of html.matchAll(/jobs\.ashbyhq\.com\/([a-z0-9-]+)/gi)) add('ashby', m[1]);
  return [...r.values()];
}

const RE_PORTAL_EMPLEO = /(greenhouse\.io|lever\.co|ashbyhq\.com|myworkdayjobs\.com|smartrecruiters\.com|teamtailor\.com|personio\.(?:de|com|es)|successfactors\.(?:com|eu)|bamboohr\.com|recruitee\.com|join\.com|factorialhr\.com|jobs\.|careers\.|empleo\.|trabajaen|kenjo\.io|talentclue\.com|softgarden|icims\.com|taleo\.net|eightfold\.ai|csod\.com)/i;

/** ¿La página es un portal o formulario oficial de empleo/contacto? */
export function esPaginaFormulario(url: string, html: string): boolean {
  const ruta = new URL(url).pathname + new URL(url).hostname;
  const esEmpleo = /(empleo|trabaja|careers|career|jobs|talent|talento|unete|join|candidat|practicas|contact)/i.test(ruta);
  const tieneFormulario = /<form\b/i.test(html) || RE_PORTAL_EMPLEO.test(html) || RE_PORTAL_EMPLEO.test(url);
  return esEmpleo && tieneFormulario;
}

const RE_PRACTICAS = /(pr[aá]cticas|becari[oa]s?|becas|internships?|fp dual|formaci[oó]n en empresa|programa de talento joven|graduate program)/i;

export function mencionaPracticas(html: string): boolean {
  return RE_PRACTICAS.test(decodificarEntidades(html.replace(/<[^>]+>/g, ' ')));
}

export function tituloDe(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodificarEntidades(m[1]).replace(/\s+/g, ' ').trim().slice(0, 120) : null;
}

/** Rutas habituales de empleo y contacto en webs españolas (se prueban en el propio dominio; si no existen, 404). */
export const RUTAS_HABITUALES = [
  '/trabaja-con-nosotros', '/trabaja-con-nosotros/', '/empleo', '/talento', '/careers', '/unete', '/unete-al-equipo',
  '/rrhh', '/recursos-humanos', '/es/trabaja-con-nosotros', '/es/empleo', '/es/talento', '/es/careers', '/contacto', '/es/contacto', '/aviso-legal',
];

const RE_EMPLEO = /(trabaja|empleo|talent|career|jobs|unete|join|rrhh|recursos-humanos|seleccion|practicas|becas|people|personas)/i;

/** Ordena las URL para revisar primero las de empleo y RR. HH. (donde suele estar el correo de candidaturas). */
export function priorizarUrls(urls: string[]): string[] {
  const puntos = (u: string) => (RE_EMPLEO.test(u) ? 0 : /contact/i.test(u) ? 1 : 2);
  return [...urls].sort((a, b) => puntos(a) - puntos(b));
}
