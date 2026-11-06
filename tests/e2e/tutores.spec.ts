import { expect, test } from '@playwright/test';
import { abrirFiltros, CODIGO, ipUnica, sinViolacionesGraves } from './ayudas';

test.beforeEach(async ({ page }) => ipUnica(page));

test('la sección de tutores pide su propio código (el del alumnado no sirve)', async ({ page }) => {
  await page.goto('/#/tutores');
  await expect(page.getByRole('heading', { name: 'Acceso para tutores' })).toBeVisible();
  await sinViolacionesGraves(page);
  await page.getByLabel('Código de acceso').fill(CODIGO);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Has entrado con el código del alumnado')).toBeVisible();
  await page.getByLabel('Código de acceso').fill('tutor-e2e');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Escribir a las empresas de tu ciclo' })).toBeVisible();
});

test('el tutor selecciona empresas de su ciclo y prepara el envío en CCO, uno a uno y CSV', async ({ page }) => {
  await page.goto('/#/tutores');
  await page.getByLabel('Código de acceso').fill('tutor-e2e');
  await page.getByRole('button', { name: 'Entrar' }).click();

  // Ciclo DAM: se rellenan nombre y correo del tutor oficial.
  await page.locator('label').filter({ hasText: /^DAM$/ }).click();
  await expect(page.getByLabel('Nombre y apellidos')).toHaveValue('Omar Romero');
  await expect(page.getByLabel('Tu correo del centro')).toHaveValue('omar.romero@jrotero.es');

  // Empresas de DAM con correo: Web Studio y ERP Consulting (Nube solo tiene formulario).
  await expect(page.getByText('2 de 2 empresas con correo seleccionadas')).toBeVisible();
  await expect(page.getByText('1 empresa solo admite formulario')).toBeVisible();
  await page.getByLabel(/Ficticia ERP Consulting/).uncheck();
  await expect(page.getByText('1 de 2 empresas con correo seleccionadas')).toBeVisible();
  await page.getByRole('button', { name: 'Seleccionar todas' }).click();

  await expect(page.getByLabel('Texto (editable)')).toContainText('Desarrollo de Aplicaciones Multiplataforma');
  await expect(page.getByLabel('Texto (editable)')).toContainText('BAJA');

  // CCO: deshabilitado hasta confirmar; tutor en Para y empresas en CCO.
  const outlook = page.getByRole('link', { name: /Abrir en Outlook web/ });
  await expect(outlook).toHaveAttribute('aria-disabled', 'true');
  await page.getByLabel(/He revisado el texto y los destinatarios/).check();
  const url = new URL((await outlook.getAttribute('href'))!);
  expect(url.searchParams.get('to')).toBe('omar.romero@jrotero.es');
  expect(url.searchParams.get('bcc')).toBe('empleo@ficticia-erp.test;talento@ficticia-web.test');
  await page.getByRole('button', { name: 'Marcar lote como enviado' }).click();
  await expect(page.getByText('2 empresas marcadas como contactadas')).toBeVisible();

  // Las contactadas se ocultan por defecto durante 30 días.
  await expect(page.getByText('Ninguna empresa con correo con estos filtros')).toBeVisible();
  await abrirFiltros(page);
  await page.locator('label').filter({ hasText: /Ocultar contactadas/ }).click();
  await expect(page.getByText(/contactada el/).first()).toBeVisible();

  // Uno a uno: saludo personalizado.
  await page.locator('label').filter({ hasText: 'Uno a uno, personalizado' }).click();
  const fila = page.getByRole('listitem').filter({ hasText: 'talento@ficticia-web.test' });
  const outlookUno = fila.getByRole('link', { name: /^Outlook/ });
  const cuerpo = new URL((await outlookUno.getAttribute('href'))!).searchParams.get('body')!;
  expect(cuerpo).toMatch(/^Estimado equipo de Ficticia Web Studio:/);

  // CSV
  await page.locator('label').filter({ hasText: 'Combinación de correspondencia' }).click();
  const descarga = page.waitForEvent('download');
  await page.getByRole('button', { name: /Descargar CSV/ }).click();
  expect((await descarga).suggestedFilename()).toMatch(/^empresas-ffe-dam-\d{4}-\d{2}-\d{2}\.csv$/);
  await sinViolacionesGraves(page);
});
