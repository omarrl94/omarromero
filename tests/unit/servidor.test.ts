import { rm } from 'node:fs/promises';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import admin from '../../netlify/functions/admin.mts';
import cuenta from '../../netlify/functions/cuenta.mts';
import empresas from '../../netlify/functions/empresas.mts';
import { correosPara } from '../../server/correo';
import { olvidarClaveEnMemoria } from '../../server/sesion';

for (const v of ['NETLIFY', 'SITE_ID', 'NETLIFY_BLOBS_CONTEXT']) delete process.env[v];
process.env.CONECTA_MODO = 'pruebas';
process.env.CONECTA_DATOS = 'ficticios';
process.env.MAIL_MODE = 'log';
process.env.SESSION_SECRET = 'x'.repeat(40);

const BASE = 'https://conecta.test';
const token = (email: string) => 'prueba.' + Buffer.from(JSON.stringify({ email })).toString('base64url');
const ctx = (ip = '1.1.1.1') => ({ ip }) as never;
function pet(ruta: string, email?: string, opciones: { metodo?: string; cuerpo?: unknown; cookie?: string } = {}) {
  const headers: Record<string, string> = {};
  if (email) headers.authorization = `Bearer ${token(email)}`;
  if (opciones.cookie) headers.cookie = opciones.cookie;
  return new Request(BASE + ruta, { method: opciones.metodo ?? (opciones.cuerpo ? 'POST' : 'GET'), headers, body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined });
}
const ultimoCorreo = async (para: string) => (await correosPara(para)).at(-1);

async function verificar(email: string) {
  expect((await cuenta(pet('/api/cuenta', email, { cuerpo: { accion: 'verificacion' } }), ctx())).status).toBe(200);
  const enlace = (await ultimoCorreo(email))!.texto.match(/https?:\/\/\S+verificar=\S+/)![0];
  const r = await cuenta(new Request(enlace.replace(/^https?:\/\/[^/]+/, BASE)), ctx());
  expect(r.status).toBe(302);
}

async function estado(email: string, cookie?: string) {
  return (await (await cuenta(pet('/api/cuenta', email, { cookie }), ctx())).json()) as { rol: string | null; verificado: boolean; necesitaDobleFactor: boolean; dobleFactorOk: boolean };
}

async function dobleFactor(email: string): Promise<string> {
  expect((await cuenta(pet('/api/cuenta', email, { cuerpo: { accion: 'enviar-codigo' } }), ctx())).status).toBe(200);
  const codigo = (await ultimoCorreo(email))!.asunto.match(/(\d{6})/)![1];
  const mal = await cuenta(pet('/api/cuenta', email, { cuerpo: { accion: 'verificar-codigo', codigo: codigo === '000000' ? '111111' : '000000' } }), ctx('9.9.9.9'));
  expect(mal.status).toBe(401);
  const r = await cuenta(pet('/api/cuenta', email, { cuerpo: { accion: 'verificar-codigo', codigo } }), ctx('9.9.9.9'));
  expect(r.status).toBe(200);
  return r.headers.get('set-cookie')!.split(';')[0];
}

beforeEach(async () => {
  await rm('.blobs-local', { recursive: true, force: true });
  olvidarClaveEnMemoria();
});
afterAll(async () => rm('.blobs-local', { recursive: true, force: true }));

describe('cuentas y roles', () => {
  it('el directorio exige iniciar sesión', async () => {
    const r = await empresas(pet('/api/empresas'));
    expect(r.status).toBe(401);
    expect(await r.text()).not.toContain('@ficticia');
  });

  it('alumnado @a.jrotero.es: tras verificar el correo entra directamente', async () => {
    const email = 'ana.perez@a.jrotero.es';
    expect(await estado(email)).toMatchObject({ verificado: false, rol: null });
    expect((await empresas(pet('/api/empresas', email))).status).toBe(403);
    await verificar(email);
    expect(await estado(email)).toMatchObject({ verificado: true, rol: 'alumno', necesitaDobleFactor: false });
    const r = await empresas(pet('/api/empresas', email));
    expect(r.status).toBe(200);
    expect(((await r.json()) as { total: number }).total).toBe(4);
  });

  it('rechaza correos de otros dominios', async () => {
    const r = await cuenta(pet('/api/cuenta', 'alguien@gmail.com', { cuerpo: { accion: 'verificacion' } }), ctx());
    expect(r.status).toBe(403);
  });

  it('profesorado @jrotero.es queda pendiente, avisa al superadmin y el superadmin lo aprueba con doble factor', async () => {
    const profe = 'laura.tutora@jrotero.es';
    await verificar(profe);
    expect(await estado(profe)).toMatchObject({ rol: 'pendiente' });
    const aviso = await ultimoCorreo('omar.romero@jrotero.es');
    expect(aviso?.asunto).toContain('Nueva solicitud de tutor');
    const sinAcceso = await empresas(pet('/api/empresas', profe));
    expect(await sinAcceso.json()).toMatchObject({ motivo: 'pendiente' });

    const omar = 'omar.romero@jrotero.es';
    await verificar(omar);
    expect(await estado(omar)).toMatchObject({ rol: 'superadmin', necesitaDobleFactor: true, dobleFactorOk: false });
    expect((await admin(pet('/api/admin', omar))).status).toBe(403);
    const cookie = await dobleFactor(omar);
    expect(await estado(omar, cookie)).toMatchObject({ dobleFactorOk: true });

    const lista = (await (await admin(pet('/api/admin', omar, { cookie }))).json()) as { usuarios: { uid: string; email: string; rol: string }[] };
    const laura = lista.usuarios.find((u) => u.email === profe)!;
    expect(laura.rol).toBe('pendiente');
    const yo = lista.usuarios.find((u) => u.email === omar)!;
    expect((await admin(pet('/api/admin', omar, { cookie, cuerpo: { uid: yo.uid, rol: 'alumno' } }))).status).toBe(403);
    expect((await admin(pet('/api/admin', omar, { cookie, cuerpo: { uid: laura.uid, rol: 'jefe' } }))).status).toBe(400);
    expect((await admin(pet('/api/admin', omar, { cookie, cuerpo: { uid: laura.uid, rol: 'tutor' } }))).status).toBe(200);
    expect((await ultimoCorreo(profe))?.asunto).toContain('Tu acceso de tutor/a está activo');

    // El tutor necesita su propio doble factor para ver el directorio.
    expect(await (await empresas(pet('/api/empresas', profe))).json()).toMatchObject({ motivo: 'doble-factor' });
    const cookieTutor = await dobleFactor(profe);
    expect((await empresas(pet('/api/empresas', profe, { cookie: cookieTutor }))).status).toBe(200);
    // La cookie de doble factor de otra persona no sirve.
    expect((await empresas(pet('/api/empresas', profe, { cookie }))).status).toBe(403);
  });

  it('un alumno no puede usar el panel de administración', async () => {
    const email = 'luis@a.jrotero.es';
    await verificar(email);
    expect((await admin(pet('/api/admin', email))).status).toBe(403);
  });

  it('borrar la cuenta elimina el acceso', async () => {
    const email = 'borrar@a.jrotero.es';
    await verificar(email);
    expect((await cuenta(pet('/api/cuenta', email, { cuerpo: { accion: 'borrar-cuenta' } }), ctx())).status).toBe(200);
    expect(await estado(email)).toMatchObject({ verificado: false, rol: null });
  });

  it('los tokens de prueba no valen en Netlify', async () => {
    const email = 'ana@a.jrotero.es';
    await verificar(email);
    process.env.NETLIFY = 'true';
    try {
      expect((await cuenta(pet('/api/cuenta', email), ctx())).status).toBe(401);
    } finally {
      delete process.env.NETLIFY;
    }
  });
});
