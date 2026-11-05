import { promises as dns } from 'node:dns';

export const AGENTE = 'ConectaFFE-verificador/1.0 (+https://www.jrotero.es; verificación de datos de contacto públicos para FP)';

export interface Pagina {
  url: string;
  urlFinal: string;
  estado: number;
  html: string;
  error?: string;
}

export async function descargar(url: string, timeoutMs = 20_000): Promise<Pagina> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': AGENTE, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'es-ES,es;q=0.9' },
    });
    const tipo = res.headers.get('content-type') ?? '';
    const html = /html|xml|text/.test(tipo) ? (await res.text()).slice(0, 3_000_000) : '';
    return { url, urlFinal: res.url || url, estado: res.status, html };
  } catch (e) {
    const err = e as Error & { cause?: { code?: string } };
    return { url, urlFinal: url, estado: 0, html: '', error: err.name === 'AbortError' ? 'tiempo agotado' : (err.cause?.code ?? err.message) };
  } finally {
    clearTimeout(t);
  }
}

/** Registros MX del dominio. Si no hay red o DNS, devuelve null (no se puede afirmar nada). */
export async function tieneMx(dominio: string): Promise<boolean | null> {
  try {
    const mx = await dns.resolveMx(dominio);
    return mx.length > 0;
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'ENODATA' || code === 'ENOTFOUND') {
      // ENOTFOUND también ocurre sin acceso a DNS: se comprueba con un dominio conocido.
      try {
        await dns.resolveMx('gmail.com');
        return false;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** ¿Hay acceso a Internet y DNS? Evita descartar empresas por un fallo de red local. */
export async function hayRed(): Promise<{ ok: boolean; detalle: string }> {
  const p = await descargar('https://www.boe.es/', 10_000);
  const mx = await tieneMx('gmail.com');
  return { ok: p.estado > 0 && p.estado < 500 && mx === true, detalle: `HTTP boe.es: ${p.estado || p.error}; MX gmail.com: ${mx}` };
}

export async function enSerie<T, R>(items: T[], concurrencia: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const res: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: concurrencia }, async () => {
      while (i < items.length) {
        const k = i++;
        res[k] = await fn(items[k], k);
      }
    }),
  );
  return res;
}
