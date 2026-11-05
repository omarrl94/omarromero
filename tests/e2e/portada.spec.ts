import { expect, test } from '@playwright/test';
import { elegirPerfil, sinViolacionesGraves } from './ayudas';

test('la portada lleva a elegir perfil en pocos pasos y lo recuerda', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Formación en Empresa');
  await expect(page.getByRole('link', { name: 'Ver empresas para mí' })).toHaveAttribute('aria-disabled', 'true');
  const inicio = Date.now();
  await elegirPerfil(page, 'ASIR', 'Ciberseguridad y SOC', 'B');
  await expect(page.getByText('Perfil: ASIR · Ciberseguridad y SOC')).toBeVisible();
  await page.getByRole('link', { name: 'Ver empresas para mí' }).click();
  await expect(page).toHaveURL(/#\/empresas$/);
  expect(Date.now() - inicio).toBeLessThan(60_000);
  await page.reload();
  await page.goto('/#/perfil');
  await expect(page.getByRole('radio', { name: /ASIR/ })).toBeChecked();
  await expect(page.getByRole('radio', { name: /Modalidad B/ })).toBeChecked();
});

test('portada, privacidad y página inexistente son accesibles', async ({ page }) => {
  await page.goto('/#/');
  await sinViolacionesGraves(page);
  await page.goto('/#/privacidad');
  await expect(page.getByRole('heading', { name: 'Solicitar la retirada de una empresa' })).toBeVisible();
  await sinViolacionesGraves(page);
  await page.goto('/#/no-existe');
  await expect(page.getByText('Página no encontrada')).toBeVisible();
});

test('noindex en la página', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('borrar mis datos limpia el dispositivo', async ({ page }) => {
  await elegirPerfil(page, 'DAM', 'Desarrollo web');
  await page.goto('/#/perfil');
  await page.getByRole('button', { name: 'Borrar todos mis datos' }).click();
  await page.getByRole('button', { name: 'Sí, borrar todo' }).click();
  await expect(page.getByText('Datos borrados')).toBeVisible();
  const claves = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('conecta-ffe:')));
  expect(claves).toEqual([]);
  await expect(page.getByRole('radio', { name: /DAM/ })).not.toBeChecked();
});
