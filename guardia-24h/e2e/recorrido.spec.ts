import { expect, test } from '@playwright/test';

test('alumno: registro → mapa → distrito → biblioteca → Mi manual', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Código de clase').fill('SEA-2025');
  await page.getByLabel('Alias').fill('Chispas');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: /8 distritos/ })).toBeVisible();

  await page.getByRole('link', { name: 'Ver niveles' }).first().click();
  await expect(page.getByRole('heading', { name: /Taller del instalador/ })).toBeVisible();

  await page.getByRole('link', { name: /Biblioteca/ }).click();
  await page.getByPlaceholder(/Buscar/).fill('biblioteca');
  await expect(page.getByText('Cómo usar la biblioteca')).toBeVisible();

  await page.getByPlaceholder('Escribe una nota…').fill('Mi nota privada sobre tubos');
  await page.getByRole('button', { name: 'Guardar nota' }).click();
  await expect(page.getByText('Mi nota privada sobre tubos').first()).toBeVisible();

  await page.reload();
  await expect(page.getByText('Chispas · SEA-2025 · local')).toBeVisible(); // la sesión persiste
});

test('alumno juega N1 del distrito 1 y ve su nota', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Código de clase').fill('SEA-2025');
  await page.getByLabel('Alias').fill('Juego1');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByRole('link', { name: 'Ver niveles' }).first().click();
  await page.getByRole('link', { name: 'Jugar' }).first().click();
  await page.getByRole('button', { name: /Empezar/ }).click();
  for (let i = 0; i < 8; i++) {
    await page.getByRole('radio').first().check();
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await page.getByRole('button', { name: /Siguiente|Terminar/ }).click();
  }
  await expect(page.getByText(/Resultado:/)).toBeVisible();
  await page.getByRole('link', { name: /Notas/ }).click();
  await expect(page.getByRole('heading', { name: /Mis notas/ })).toBeVisible();
  await page.getByRole('link', { name: /Docente/ }).click();
  await expect(page.getByText('Juego1')).toBeVisible();
});
