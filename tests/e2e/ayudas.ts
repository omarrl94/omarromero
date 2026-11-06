import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

/** IP simulada distinta por prueba para que el límite de intentos no se comparta. */
export async function ipUnica(page: Page) {
  await page.setExtraHTTPHeaders({ 'x-test-ip': `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` });
}

export const correoUnico = (prefijo: string, dominio = 'a.jrotero.es') => `${prefijo}-${Date.now()}-${randomBytes(3).toString('hex')}@${dominio}`;
export const CLAVE = 'contraseña-segura-1';

const uidPrueba = (email: string) => 'p' + createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 27);

/** Correos «enviados» por el servidor en modo de pruebas (MAIL_MODE=log). */
export async function esperarCorreo(para: string, patron: RegExp): Promise<{ asunto: string; texto: string }> {
  for (let i = 0; i < 40; i++) {
    try {
      const archivo = `.blobs-local/correos-enviados/para-${para.toLowerCase().replace(/[^a-z0-9._-]/gi, '_')}.json`;
      const lista = JSON.parse(await readFile(archivo, 'utf8')) as { para: string; asunto: string; texto: string }[];
      const c = lista.filter((x) => patron.test(x.asunto) || patron.test(x.texto)).at(-1);
      if (c) return c;
    } catch {
      /* todavía no existe */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`No ha llegado el correo esperado a ${para}`);
}

/** Crea en el servidor un usuario ya verificado con un rol (para probar secciones concretas). */
export async function sembrarUsuario(email: string, rol: 'alumno' | 'tutor' | 'superadmin' | 'pendiente', nombre = 'Persona de prueba') {
  const uid = uidPrueba(email);
  const ahora = new Date().toISOString();
  await mkdir('.blobs-local/usuarios', { recursive: true });
  await mkdir('.blobs-local/verificados-prueba', { recursive: true });
  const tipo = email.endsWith('@a.jrotero.es') ? 'alumno' : 'profesor';
  await writeFile(`.blobs-local/usuarios/u-${uid}.json`, JSON.stringify({ uid, email, nombre, tipo, rol, creado: ahora, actualizado: ahora }));
  await writeFile(`.blobs-local/verificados-prueba/${uid}.json`, 'true');
}

/** Registro por la interfaz. Con `verificar`, abre el enlace del correo de verificación. */
export async function registrar(page: Page, email: string, opciones: { tipo?: 'alumno' | 'profesor'; nombre?: string; verificar?: boolean } = {}) {
  const { tipo = 'alumno', nombre = 'Ana Pérez', verificar = true } = opciones;
  await page.goto('/#/entrar');
  await page.getByRole('tab', { name: 'Crear cuenta' }).click();
  await page.locator('label').filter({ hasText: tipo === 'alumno' ? 'Soy alumno/a' : 'Soy profesor/a tutor/a' }).click();
  await page.getByLabel('Nombre y apellidos').fill(nombre);
  await page.getByLabel('Correo del centro').fill(email);
  await page.getByLabel(/^Contraseña/).fill(CLAVE);
  await page.getByLabel(/He leído el/).check();
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  if (!verificar) return;
  await expect(page.getByRole('heading', { name: 'Confirma tu correo' })).toBeVisible();
  const correo = await esperarCorreo(email, /verificar=/);
  const enlace = correo.texto.match(/https?:\/\/\S+verificar=\S+/)![0];
  await page.goto(enlace.replace(/^https?:\/\/[^/]+/, ''));
}

/** Alumno/a nuevo, verificado y dentro del directorio. */
export async function entrarComoAlumno(page: Page, nombre = 'Ana Pérez'): Promise<string> {
  const email = correoUnico('alumno');
  await registrar(page, email, { nombre });
  await expect(page).toHaveURL(/#\/empresas/);
  return email;
}

/** Introduce el código de doble factor que llega por correo. */
export async function dobleFactor(page: Page, email: string) {
  await page.getByRole('button', { name: 'Enviarme el código' }).click();
  const correo = await esperarCorreo(email, /código de acceso/i);
  const codigo = correo.asunto.match(/(\d{6})/)![1];
  await page.getByLabel('Código de 6 cifras').fill(codigo);
  await page.getByRole('button', { name: 'Comprobar' }).click();
}

/** Tutor/a ya aprobado: se registra, pasa el doble factor y llega a su sección. */
export async function entrarComoTutor(page: Page): Promise<string> {
  const email = correoUnico('tutor', 'jrotero.es');
  await sembrarUsuario(email, 'tutor', 'Tutora de prueba');
  await registrar(page, email, { tipo: 'profesor', nombre: 'Tutora de prueba', verificar: false });
  await expect(page.getByRole('heading', { name: 'Verificación en dos pasos' })).toBeVisible();
  await dobleFactor(page, email);
  await expect(page).toHaveURL(/#\/tutores/);
  return email;
}

export async function elegirPerfil(page: Page, ciclo: 'DAM' | 'ASIR', perfil: string, modalidad: 'A' | 'B' = 'A') {
  await page.goto('/#/');
  await page.locator('label').filter({ hasText: new RegExp(`^${ciclo}`) }).click();
  await page.locator('label').filter({ hasText: perfil }).click();
  await page.locator('label').filter({ hasText: `Modalidad ${modalidad}` }).click();
}

export async function rellenarNombre(page: Page, nombre = 'Ana Pérez') {
  await page.goto('/#/perfil');
  await page.getByLabel('Nombre y apellidos').fill(nombre);
  await page.getByLabel('GitHub (opcional)').fill('github.com/ana');
}

/** En móvil los filtros están plegados: los despliega si hace falta. */
export async function abrirFiltros(page: Page) {
  const boton = page.getByRole('button', { name: /^Filtros/ });
  if ((await boton.isVisible()) && (await boton.getAttribute('aria-expanded')) === 'false') await boton.click();
}

export async function irAEmpresas(page: Page) {
  await page.goto('/#/empresas');
  await expect(page.getByRole('heading', { name: /empresas? *$/i, level: 2 })).toBeVisible();
}

export async function sinViolacionesGraves(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const graves = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(graves.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`)).toEqual([]);
}
