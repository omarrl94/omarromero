import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export const CODIGO = 'codigo-e2e';

/** IP simulada distinta por prueba para que el límite de intentos no se comparta. */
export async function ipUnica(page: Page) {
  await page.setExtraHTTPHeaders({ 'x-test-ip': `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` });
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

export async function entrar(page: Page) {
  await page.goto('/#/empresas');
  await page.getByLabel('Código de acceso').fill(CODIGO);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: /empresas? *$/i, level: 2 })).toBeVisible();
}

export async function sinViolacionesGraves(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const graves = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(graves.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`)).toEqual([]);
}

/** En móvil los filtros están plegados: los despliega si hace falta. */
export async function abrirFiltros(page: Page) {
  const boton = page.getByRole('button', { name: /^Filtros/ });
  if ((await boton.isVisible()) && (await boton.getAttribute('aria-expanded')) === 'false') await boton.click();
}
