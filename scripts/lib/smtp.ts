import { promises as dns } from 'node:dns';
import net from 'node:net';
import { hostname } from 'node:os';

/**
 * Comprobación de buzón SIN enviar ningún mensaje: se conecta al servidor de correo del dominio,
 * se presenta (EHLO), indica remitente vacío (MAIL FROM:<>, como un aviso de entrega) y pregunta por el
 * destinatario (RCPT TO). Después cierra con QUIT. Nunca llega a DATA, así que no se envía nada.
 *
 * Para distinguir «el buzón existe» de «el servidor lo acepta todo», también pregunta por un buzón
 * inventado y aleatorio del mismo dominio.
 */
export type ResultadoBuzon = 'existe' | 'no-existe' | 'acepta-todo' | 'indeterminado';

export interface ComprobacionBuzon {
  resultado: ResultadoBuzon;
  /** Respuesta literal del servidor a RCPT TO (para el informe). */
  respuesta: string;
  servidor?: string;
}

/** Interpreta la respuesta a RCPT TO. Pura y probada. */
export function interpretarRcpt(codigo: number, texto: string): 'aceptado' | 'no-existe' | 'indeterminado' {
  if (codigo === 250 || codigo === 251) return 'aceptado';
  if (codigo >= 500) {
    const t = texto.toLowerCase();
    // Buzón inexistente: códigos ampliados 5.1.x, 5.4.1 de Microsoft 365 (bloqueo de destinatarios desconocidos)
    // o frases típicas. Los rechazos por reputación de IP, spam o política NO dicen nada del buzón.
    if (/\b5\.1\.[0-9]\b|\b5\.4\.1\b/.test(t)) return 'no-existe';
    if (/(user unknown|unknown user|no such user|does not exist|doesn'?t exist|not exist|mailbox unavailable|mailbox not found|address not found|invalid recipient|recipient not found|no mailbox|unknown recipient|recipient address rejected|no existe|desconocid)/.test(t)) {
      if (/(spamhaus|blocked|block list|blacklist|listed|reputation|policy|rbl|access denied - ip|client host)/.test(t) && !/\b5\.4\.1\b/.test(t)) return 'indeterminado';
      return 'no-existe';
    }
    if (codigo === 550 && /(5\.7\.|spam|block|policy|reputation|denied|rbl|listed)/.test(t)) return 'indeterminado';
    if (codigo === 550 || codigo === 551 || codigo === 553) return 'no-existe';
    return 'indeterminado';
  }
  return 'indeterminado';
}

/** Combina el resultado del buzón real con el del buzón aleatorio. */
export function combinar(real: ReturnType<typeof interpretarRcpt>, aleatorio: ReturnType<typeof interpretarRcpt> | null): ResultadoBuzon {
  if (real === 'no-existe') return 'no-existe';
  if (real === 'indeterminado') return 'indeterminado';
  if (aleatorio === 'aceptado') return 'acepta-todo';
  if (aleatorio === 'no-existe') return 'existe';
  return 'indeterminado';
}

class Sesion {
  private buffer = '';
  private esperando: ((r: { codigo: number; texto: string }) => void) | null = null;
  constructor(private socket: net.Socket) {
    socket.setEncoding('utf8');
    socket.on('data', (d: string) => {
      this.buffer += d;
      this.intentar();
    });
  }
  private intentar() {
    // Respuesta completa: última línea «NNN texto» (sin guion tras el código).
    const lineas = this.buffer.split(/\r?\n/);
    const idx = lineas.findIndex((l) => /^\d{3} /.test(l) || /^\d{3}$/.test(l));
    if (idx === -1 || !this.esperando) return;
    const bloque = lineas.slice(0, idx + 1);
    this.buffer = lineas.slice(idx + 1).join('\n');
    const codigo = Number(bloque[idx].slice(0, 3));
    const cb = this.esperando;
    this.esperando = null;
    cb({ codigo, texto: bloque.join(' ').trim() });
  }
  respuesta(timeoutMs: number): Promise<{ codigo: number; texto: string }> {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('tiempo agotado')), timeoutMs);
      this.esperando = (r) => {
        clearTimeout(t);
        resolve(r);
      };
      this.intentar();
    });
  }
  async comando(linea: string, timeoutMs = 15_000) {
    this.socket.write(`${linea}\r\n`);
    return this.respuesta(timeoutMs);
  }
}

function conectar(host: string, timeoutMs: number): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const s = net.connect({ host, port: 25 });
    const t = setTimeout(() => {
      s.destroy();
      reject(new Error('tiempo agotado al conectar'));
    }, timeoutMs);
    s.once('connect', () => {
      clearTimeout(t);
      resolve(s);
    });
    s.once('error', (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

const cache = new Map<string, Promise<ComprobacionBuzon>>();

/**
 * Nombre con el que se presenta la comprobación (EHLO). Muchos servidores exigen un nombre de dominio completo:
 * se usa el nombre inverso (PTR) de la IP pública de la máquina o, si no tiene, la IP entre corchetes (RFC 5321).
 */
let helo: Promise<string> | null = null;
export function nombreHelo(): Promise<string> {
  helo ??= (async () => {
    if (process.env.SMTP_HELO) return process.env.SMTP_HELO;
    try {
      const ip = (await (await fetch('https://api.ipify.org', { signal: AbortSignal.timeout(10_000) })).text()).trim();
      if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip)) throw new Error('IP no válida');
      const ptr = await dns.reverse(ip).catch(() => [] as string[]);
      return ptr[0]?.includes('.') ? ptr[0] : `[${ip}]`;
    } catch {
      return hostname().includes('.') ? hostname() : 'localhost.localdomain';
    }
  })();
  return helo;
}

/** Comprueba un buzón (con caché por dirección). Requiere salida al puerto 25 (GitHub Actions la tiene). */
export function comprobarBuzon(email: string): Promise<ComprobacionBuzon> {
  const clave = email.toLowerCase();
  if (!cache.has(clave)) {
    const limite = new Promise<ComprobacionBuzon>((resolve) => setTimeout(() => resolve({ resultado: 'indeterminado', respuesta: 'el servidor de correo no respondió en 60 s' }), 60_000).unref());
    cache.set(clave, Promise.race([comprobarSinCache(clave), limite]));
  }
  return cache.get(clave)!;
}

/** Una sesión SMTP que pregunta por UNA dirección (EHLO, MAIL FROM:<>, RCPT TO, QUIT). Nunca llega a DATA. */
async function preguntar(email: string, mx: { exchange: string }[]): Promise<{ v: ReturnType<typeof interpretarRcpt>; texto: string; servidor?: string }> {
  let ultimoError = '';
  for (const { exchange } of mx.slice(0, 2)) {
    let socket: net.Socket | null = null;
    try {
      socket = await conectar(exchange, 15_000);
      const s = new Sesion(socket);
      const saludo = await s.respuesta(20_000);
      if (saludo.codigo !== 220) {
        ultimoError = saludo.texto;
        continue;
      }
      const nombre = await nombreHelo();
      const ehlo = await s.comando(`EHLO ${nombre}`);
      if (ehlo.codigo !== 250) await s.comando(`HELO ${nombre}`);
      const from = await s.comando('MAIL FROM:<>');
      if (from.codigo !== 250) return { v: 'indeterminado', texto: `MAIL FROM rechazado: ${from.texto}`, servidor: exchange };
      const r = await s.comando(`RCPT TO:<${email}>`);
      await s.comando('QUIT', 5_000).catch(() => undefined);
      return { v: interpretarRcpt(r.codigo, r.texto), texto: r.texto.slice(0, 300), servidor: exchange };
    } catch (e) {
      ultimoError = (e as Error).message;
    } finally {
      socket?.destroy();
    }
  }
  return { v: 'indeterminado', texto: `sin respuesta del servidor de correo (${ultimoError})` };
}

const aleatorios = new Map<string, Promise<ReturnType<typeof interpretarRcpt>>>();

async function comprobarSinCache(email: string): Promise<ComprobacionBuzon> {
  const dominio = email.split('@')[1];
  let mx: { exchange: string; priority: number }[];
  try {
    mx = (await dns.resolveMx(dominio)).sort((a, b) => a.priority - b.priority);
  } catch {
    return { resultado: 'indeterminado', respuesta: 'sin registros MX consultables' };
  }
  if (!mx.length || mx[0].exchange === '' || mx[0].exchange === '.') return { resultado: 'no-existe', respuesta: 'el dominio declara que no recibe correo (MX nulo)' };
  const real = await preguntar(email, mx);
  if (real.v !== 'aceptado') return { resultado: combinar(real.v, null), respuesta: real.texto, servidor: real.servidor };
  // Buzón inventado del mismo dominio, en otra conexión (una por dominio): ¿el servidor lo acepta todo?
  if (!aleatorios.has(dominio)) aleatorios.set(dominio, preguntar(`no-existe-${Math.random().toString(36).slice(2, 10)}@${dominio}`, mx).then((x) => x.v));
  return { resultado: combinar(real.v, await aleatorios.get(dominio)!), respuesta: real.texto, servidor: real.servidor };
}
