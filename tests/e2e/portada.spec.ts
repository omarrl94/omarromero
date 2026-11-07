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

test('el alumnado de Actividades Comerciales elige su ciclo y sus perfiles de comercio', async ({ page }) => {
  await elegirPerfil(page, 'Actividades Comerciales', 'Marketing digital y redes sociales');
  await expect(page.getByText('Perfil: Actividades Comerciales · Marketing digital y redes sociales')).toBeVisible();
  await expect(page.getByText('FFE de Actividades Comerciales: 500 horas (pendiente de confirmar).')).toBeVisible();
  await expect(page.locator('label').filter({ hasText: 'Desarrollo web' })).toHaveCount(0);
  await sinViolacionesGraves(page);
});

test('el alumnado de SEA elige su curso (FFE en 1.º y 2.º) y sus perfiles', async ({ page }) => {
  await page.goto('/#/');
  await page.locator('label').filter({ hasText: /^SEA/ }).click();
  await expect(page.getByText('¿En qué curso estás?')).toBeVisible();
  await page.locator('label').filter({ hasText: '1.º curso' }).click();
  await expect(page.getByRole('radio', { name: '1.º curso' })).toBeChecked();
  await page.locator('label').filter({ hasText: 'Domótica e inmótica (KNX)' }).click();
  await page.locator('label').filter({ hasText: 'Modalidad A' }).click();
  await expect(page.getByText('Perfil: SEA · Domótica e inmótica (KNX)')).toBeVisible();
  await expect(page.getByText('FFE de SEA: en 1.º y 2.º curso (horas pendientes de confirmar).')).toBeVisible();
  await sinViolacionesGraves(page);
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
