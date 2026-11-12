import { expect, test } from '@playwright/test';

test('alumno: registro → mapa → distrito → biblioteca → Mi manual', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Código de clase').fill('SEA-2025');
  await page.getByLabel('Alias').fill('Chispas');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: /8 bloques/ })).toBeVisible();

  await page.getByRole('link', { name: /Bloque 1/ }).click();
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

test('alumno estudia la teoría del bloque 1', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Código de clase').fill('SEA-2025');
  await page.getByLabel('Alias').fill('Teoria1');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByRole('link', { name: /Teoría del bloque 1/ }).click();
  await expect(page.getByRole('heading', { name: 'Taller del instalador', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Marcar como leída' }).first().click();
  await expect(page.getByRole('button', { name: /Leída/ })).toBeVisible();
});

test('alumno juega N1 del distrito 1 y ve su nota', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Código de clase').fill('SEA-2025');
  await page.getByLabel('Alias').fill('Juego1');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByRole('link', { name: /Bloque 1/ }).click();
  await page.getByRole('link', { name: /Practicar/ }).first().click();
  await page.getByRole('button', { name: /Empezar/ }).click();
  for (let i = 0; i < 8; i++) {
    await page.getByRole('radio').first().check();
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await page.getByRole('button', { name: /Siguiente|Finalizar/ }).click();
  }
  await expect(page.getByRole('heading', { name: /Nivel (no )?superado/ })).toBeVisible();
  await page.getByRole('link', { name: /Notas/ }).click();
  await expect(page.getByRole('heading', { name: /Mis notas/ })).toBeVisible();
  await page.getByRole('link', { name: /Docente/ }).click();
  await expect(page.getByText('Juego1')).toBeVisible();
});

test('profesor: crea PIN, entra al panel y genera un código de taller', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Código de clase').fill('SEA-2025');
  await page.getByLabel('Alias').fill('Profe1');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByRole('link', { name: 'Docente' }).click();
  await page.getByLabel(/PIN/).fill('1234');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Profe1').first()).toBeVisible();
  await page.getByRole('tab', { name: /Aula/ }).click();
  await page.getByPlaceholder(/Cuadro de grupo/).fill('Cuadro montado');
  await page.getByRole('button', { name: 'Generar' }).click();
  await expect(page.getByText(/TALLER-/)).toBeVisible();
  await page.getByRole('link', { name: 'Mi empresa' }).click();
  const codigo = await page.evaluate(() => (JSON.parse(localStorage.getItem('g24-codigos') ?? '[]') as { codigo: string }[])[0]?.codigo ?? '');
  await page.getByLabel('Código de taller').fill(codigo);
  await page.getByRole('button', { name: 'Canjear' }).click();
  await expect(page.getByText(/Práctica de taller validada/)).toBeVisible();
});
