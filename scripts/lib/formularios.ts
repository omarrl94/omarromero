/**
 * ¿La página tiene un formulario REAL de contacto o candidatura?
 *
 * No basta con que exista <form>: buscadores, suscripciones al boletín, accesos y banners de cookies
 * también lo son. Un formulario vale si, una vez cargada la página (con JavaScript), tiene:
 *  - un campo de correo electrónico, y
 *  - un campo para escribir el mensaje (textarea) o para adjuntar el CV (input file), y
 *  - al menos 3 campos visibles, y
 *  - ninguna contraseña (no es un acceso) ni es un buscador.
 * También valen los formularios incrustados de proveedores conocidos (HubSpot, Typeform, Google Forms,
 * Microsoft Forms, Jotform…), que se cargan en un iframe.
 */

export interface Campo {
  etiqueta: string;
  tipo: string;
  nombre: string;
}

export interface FormularioEncontrado {
  /** URL del documento (o iframe) donde está el formulario. */
  url: string;
  campos: Campo[];
}

export interface ResultadoFormulario {
  valido: boolean;
  motivo: string;
  url: string;
  /** Campos del formulario válido (para el informe de evidencias). */
  campos?: string[];
  /** Enlaces de «candidatura espontánea» encontrados (se siguen un salto). */
  enlacesCandidatura?: string[];
}

export const RE_PROVEEDOR_FORMULARIO = /(hsforms\.(com|net)|share\.hsforms|typeform\.com\/to\/|form\.typeform\.com|docs\.google\.com\/forms|forms\.gle|forms\.office\.com|forms\.microsoft\.com|jotform\.com|cognitoforms\.com|tally\.so|formstack\.com|zoho\.(com|eu)\/forms|forms\.zohopublic)/i;

const RE_EMAIL = /(e-?mail|correo|mail)/i;
const RE_MENSAJE = /(mensaje|message|comentario|comment|consulta|motivo|observaciones|cu[ée]ntanos|cv|curr[ií]cul|resume|adjunt|carta|presentaci[oó]n)/i;
const RE_BUSCADOR = /(buscar|search|busqueda|búsqueda|^q$|^s$)/i;
const RE_BOLETIN = /(newsletter|bolet[ií]n|suscri|subscribe)/i;

export function esFormularioValido(f: FormularioEncontrado): { valido: boolean; motivo: string } {
  const visibles = f.campos.filter((c) => !['hidden', 'submit', 'button', 'reset', 'image'].includes(c.tipo));
  const texto = (c: Campo) => `${c.etiqueta} ${c.nombre}`;
  if (visibles.some((c) => c.tipo === 'password')) return { valido: false, motivo: 'es un formulario de acceso (tiene contraseña)' };
  if (visibles.length > 0 && visibles.every((c) => c.tipo === 'search' || RE_BUSCADOR.test(c.nombre) || RE_BUSCADOR.test(c.etiqueta))) return { valido: false, motivo: 'es un buscador' };
  const email = visibles.some((c) => c.tipo === 'email' || RE_EMAIL.test(texto(c)));
  const mensaje = visibles.some((c) => c.tipo === 'textarea' || c.tipo === 'file' || (c.tipo === 'text' && RE_MENSAJE.test(texto(c))));
  if (!email) return { valido: false, motivo: 'no pide el correo electrónico' };
  if (!mensaje) {
    if (visibles.length <= 3 && visibles.some((c) => RE_BOLETIN.test(texto(c)))) return { valido: false, motivo: 'es una suscripción al boletín' };
    return { valido: false, motivo: 'no tiene campo de mensaje ni para adjuntar el CV' };
  }
  if (visibles.length < 3) return { valido: false, motivo: `solo tiene ${visibles.length} campos` };
  return { valido: true, motivo: 'formulario con correo y mensaje o CV' };
}

/** Elige el mejor formulario de una lista (o explica por qué ninguno vale). */
export function elegirFormulario(url: string, formularios: FormularioEncontrado[], iframes: string[]): ResultadoFormulario {
  for (const f of formularios) {
    const v = esFormularioValido(f);
    if (v.valido) return { valido: true, motivo: v.motivo, url: f.url, campos: f.campos.filter((c) => !['hidden', 'submit', 'button'].includes(c.tipo)).map((c) => c.etiqueta || c.nombre || c.tipo).slice(0, 12) };
  }
  const proveedor = iframes.find((s) => RE_PROVEEDOR_FORMULARIO.test(s));
  if (proveedor) return { valido: true, motivo: `formulario incrustado (${new URL(proveedor).hostname})`, url, campos: [`iframe: ${proveedor.slice(0, 120)}`] };
  if (!formularios.length) return { valido: false, motivo: 'la página no tiene ningún formulario', url };
  const motivos = [...new Set(formularios.map((f) => esFormularioValido(f).motivo))];
  return { valido: false, motivo: `ningún formulario sirve (${motivos.join('; ')})`, url };
}

const decodificar = (s: string) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Análisis estático del HTML (sin JavaScript). Se usa sin navegador (pruebas y modo local) y como
 * primera criba; en GitHub Actions la decisión final la toma el navegador real.
 */
export function analizarHtml(url: string, html: string): ResultadoFormulario {
  const formularios: FormularioEncontrado[] = [];
  for (const m of html.matchAll(/<form\b[\s\S]*?<\/form>/gi)) {
    const bloque = m[0];
    const etiquetas = new Map<string, string>();
    for (const l of bloque.matchAll(/<label\b[^>]*\bfor=["']([^"']+)["'][^>]*>([\s\S]*?)<\/label>/gi)) etiquetas.set(l[1], decodificar(l[2]));
    const campos: Campo[] = [];
    for (const c of bloque.matchAll(/<(input|textarea|select)\b([^>]*)>/gi)) {
      const atributos = c[2];
      const attr = (n: string) => atributos.match(new RegExp(`\\b${n}=["']([^"']*)["']`, 'i'))?.[1] ?? '';
      const tag = c[1].toLowerCase();
      const tipo = tag === 'input' ? (attr('type') || 'text').toLowerCase() : tag;
      const id = attr('id');
      campos.push({ tipo, nombre: attr('name') || id, etiqueta: etiquetas.get(id) || attr('placeholder') || attr('aria-label') });
    }
    formularios.push({ url, campos });
  }
  const iframes = [...html.matchAll(/<iframe\b[^>]*\bsrc=["']([^"']+)["']/gi)].map((m) => m[1]).filter((s) => /^https?:/i.test(s));
  // HubSpot y similares también se incrustan con <script> que crea el formulario al cargar.
  const scripts = [...html.matchAll(/(https?:\/\/[^"'\s]*(hsforms\.(net|com)|js\.hsforms|typeform\.com\/to|jotform\.com)[^"'\s]*)/gi)].map((m) => m[1]);
  const r = elegirFormulario(url, formularios, [...iframes, ...scripts]);
  r.enlacesCandidatura = enlacesDeCandidatura(html, url);
  return r;
}

const RE_CANDIDATURA = /(candidatura espont|autocandidatura|candidatura abierta|env[ií]anos tu (cv|curr[ií]culum)|d[eé]janos tu (cv|curr[ií]culum)|sube tu (cv|curr[ií]culum)|spontaneous application|open application|general application|bolsa de (empleo|talento|trabajo)|inscr[ií]bete)/i;

/** Enlaces cuyo texto invita a enviar una candidatura espontánea (se comprueban un salto más allá). */
export function enlacesDeCandidatura(html: string, base: string): string[] {
  const salida: string[] = [];
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    if (!RE_CANDIDATURA.test(decodificar(m[2]))) continue;
    try {
      const u = new URL(m[1].replace(/&amp;/g, '&'), base);
      if (/^https?:$/.test(u.protocol)) salida.push(u.href);
    } catch {
      /* enlace roto */
    }
  }
  return [...new Set(salida)].slice(0, 3);
}

/** Resuelve con `valor` si la promesa no termina en `ms` (ninguna comprobación puede colgar la verificación). */
export function conLimite<T>(promesa: Promise<T>, ms: number, valor: () => T): Promise<T> {
  let t: ReturnType<typeof setTimeout>;
  return Promise.race([promesa.finally(() => clearTimeout(t)), new Promise<T>((resolve) => (t = setTimeout(() => resolve(valor()), ms)))]);
}

/** Comprobador con navegador real (Playwright). Solo en GitHub Actions (necesita Chromium). */
export interface ComprobadorFormularios {
  comprobar(url: string): Promise<ResultadoFormulario>;
  cerrar(): Promise<void>;
}

export async function crearComprobadorNavegador(): Promise<ComprobadorFormularios> {
  const { chromium } = await import('playwright-core');
  const navegador = await chromium.launch({ headless: true });
  const contexto = await navegador.newContext({ locale: 'es-ES', userAgent: 'Mozilla/5.0 (compatible; ConectaFFE-verificador/1.2; +https://www.jrotero.es)' });
  const cache = new Map<string, Promise<ResultadoFormulario>>();
  const comprobarUna = async (url: string): Promise<ResultadoFormulario> => {
    const pagina = await contexto.newPage();
    try {
      const res = await pagina.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      if (!res || res.status() >= 400) return { valido: false, motivo: `la página responde ${res?.status() ?? 'sin respuesta'}`, url };
      await pagina.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
      await pagina.waitForTimeout(1_500);
      const formularios: FormularioEncontrado[] = [];
      const iframes: string[] = [];
      for (const frame of pagina.frames().slice(0, 8)) {
        if (frame !== pagina.mainFrame()) iframes.push(frame.url());
        try {
          const datos = await conLimite(frame.evaluate(() =>
            [...document.querySelectorAll('form')].map((f) => ({
              campos: [...f.querySelectorAll('input, textarea, select')].map((e) => {
                const el = e as HTMLInputElement;
                const visible = !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) || el.type === 'file';
                const etiqueta = (el.labels?.[0]?.innerText || el.placeholder || el.getAttribute('aria-label') || '').trim().slice(0, 60);
                return { tipo: visible ? (el.tagName === 'INPUT' ? (el.type || 'text').toLowerCase() : el.tagName.toLowerCase()) : 'hidden', nombre: el.name || el.id || '', etiqueta };
              }),
            })),
          ), 10_000, () => []);
          for (const d of datos) formularios.push({ url: frame.url(), campos: d.campos });
        } catch {
          /* iframe inaccesible */
        }
      }
      const r = elegirFormulario(pagina.url(), formularios, iframes);
      if (!r.valido) r.enlacesCandidatura = enlacesDeCandidatura(await conLimite(pagina.content(), 10_000, () => ''), pagina.url());
      return r;
    } catch (e) {
      return { valido: false, motivo: `no se pudo cargar (${(e as Error).message.split('\n')[0].slice(0, 80)})`, url };
    } finally {
      void conLimite(pagina.close().catch(() => undefined), 5_000, () => undefined);
    }
  };
  return {
    comprobar(url) {
      if (!cache.has(url)) cache.set(url, conLimite(comprobarUna(url), 60_000, () => ({ valido: false, motivo: 'la página no terminó de cargar en 60 s', url })));
      return cache.get(url)!;
    },
    async cerrar() {
      await navegador.close();
    },
  };
}
