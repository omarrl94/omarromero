import { expect, test } from '@playwright/test';
import { elegirPerfil, sinViolacionesGraves } from './ayudas';

test('la portada lleva a crear cuenta y a elegir perfil en pocos pasos', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Formación en Empresa');
  await expect(page.getByRole('link', { name: 'Crear cuenta o entrar' })).toBeVisible();
  const inicio = Date.now();
  await elegirPerfil(page, 'ASIR', 'Ciberseguridad y SOC', 'B');
  await expect(page.getByText('Perfil: ASIR · Ciberseguridad y SOC')).toBeVisible();
  expect(Date.now() - inicio).toBeLessThan(60_000);
  await page.reload();
  await expect(page.getByRole('radio', { name: /ASIR/ })).toBeChecked();
  await page.getByRole('link', { name: 'Crear cuenta o entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Entrar en Conecta FFE' })).toBeVisible();
});

test('portada, entrar, privacidad y página inexistente son accesibles', async ({ page }) => {
  await page.goto('/#/');
  await sinViolacionesGraves(page);
  await page.goto('/#/entrar');
  await sinViolacionesGraves(page);
  await page.getByRole('tab', { name: 'Crear cuenta' }).click();
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
