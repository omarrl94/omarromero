import { expect, test } from '@playwright/test';
import { correoUnico, dobleFactor, entrarComoAlumno, esperarCorreo, ipUnica, registrar, sinViolacionesGraves } from './ayudas';

test.beforeEach(async ({ page }) => ipUnica(page));

test('alumnado: solo con @a.jrotero.es; al verificar el correo entra en el directorio', async ({ page }) => {
  // Dominio incorrecto: no deja crear la cuenta.
  await registrar(page, correoUnico('alumno', 'gmail.com'), { verificar: false });
  await expect(page.getByRole('alert')).toContainText('@a.jrotero.es');

  const email = correoUnico('alumno');
  await registrar(page, email, { verificar: false });
  await expect(page.getByRole('heading', { name: 'Confirma tu correo' })).toBeVisible();
  await sinViolacionesGraves(page);
  // Sin verificar no hay directorio.
  await page.goto('/#/empresas');
  await expect(page.getByRole('heading', { name: 'Confirma tu correo' })).toBeVisible();

  await page.goto('/#/entrar');
  await page.getByRole('main').getByRole('button', { name: 'Salir', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Crear cuenta o entrar' })).toBeVisible();
  await registrar(page, correoUnico('otro'), { verificar: true });
  await expect(page).toHaveURL(/#\/empresas/);
  await expect(page.getByRole('heading', { name: 'Ficticia Web Studio', level: 3 })).toBeVisible();
  // Navegación de alumno: sin Tutores ni Admin.
  await expect(page.getByRole('link', { name: 'Seguimiento' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Admin' })).toHaveCount(0);
});

test('profesorado: queda pendiente; el superadmin lo aprueba con doble factor y entra como tutor', async ({ browser }, info) => {
  test.setTimeout(90_000);
  const profe = correoUnico('profe', 'jrotero.es');
  const ctxProfe = await browser.newContext({ ...info.project.use });
  const pProfe = await ctxProfe.newPage();
  await registrar(pProfe, profe, { tipo: 'profesor', nombre: 'Laura Tutora' });
  await expect(pProfe.getByRole('heading', { name: 'Solicitud enviada' })).toBeVisible();

  // Superadmin (en pruebas: jefa-<proyecto>@jrotero.es, vía SUPERADMIN_EMAILS).
  const jefa = `jefa-${info.project.name}@jrotero.es`;
  const ctxJefa = await browser.newContext({ ...info.project.use });
  const pJefa = await ctxJefa.newPage();
  await registrar(pJefa, jefa, { tipo: 'profesor', nombre: 'Jefa de estudios' });
  await expect(pJefa.getByRole('heading', { name: 'Verificación en dos pasos' })).toBeVisible();
  // Primero un código incorrecto; después, el que llega por correo.
  await pJefa.getByRole('button', { name: 'Enviarme el código' }).click();
  const codigo = (await esperarCorreo(jefa, /código de acceso/i)).asunto.match(/(\d{6})/)![1];
  await pJefa.getByLabel('Código de 6 cifras').fill(codigo === '000000' ? '111111' : '000000');
  await pJefa.getByRole('button', { name: 'Comprobar' }).click();
  await expect(pJefa.getByRole('alert')).toContainText('Código incorrecto');
  await pJefa.getByLabel('Código de 6 cifras').fill(codigo);
  await pJefa.getByRole('button', { name: 'Comprobar' }).click();
  await expect(pJefa).toHaveURL(/#\/admin/);
  await expect(pJefa.getByRole('heading', { name: 'Usuarios y roles' })).toBeVisible();
  await sinViolacionesGraves(pJefa);
  await pJefa.getByLabel('Buscar').fill(profe);
  await pJefa.getByRole('listitem').filter({ hasText: profe }).getByRole('button', { name: /Aprobar como tutor/ }).click();
  await expect(pJefa.getByText(/ahora es «Tutor\/a»/)).toBeVisible();

  // El profesor comprueba de nuevo: ahora pide el doble factor y entra en Tutores.
  await pProfe.getByRole('button', { name: 'Comprobar de nuevo' }).click();
  await expect(pProfe.getByRole('heading', { name: 'Verificación en dos pasos' })).toBeVisible();
  await dobleFactor(pProfe, profe);
  await pProfe.goto('/#/tutores');
  await expect(pProfe.getByRole('heading', { name: 'Escribir a las empresas de tu ciclo' })).toBeVisible();
  await ctxProfe.close();
  await ctxJefa.close();
});

test('borrar la cuenta cierra la sesión y elimina el acceso', async ({ page }) => {
  await entrarComoAlumno(page);
  await page.goto('/#/perfil');
  await page.getByRole('button', { name: 'Borrar mi cuenta y mis datos' }).click();
  await page.getByRole('button', { name: 'Sí, borrar mi cuenta' }).click();
  await expect(page.getByRole('link', { name: 'Crear cuenta o entrar' })).toBeVisible();
  const claves = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('conecta-ffe:')));
  expect(claves).toEqual([]);
});
