import { expect, test } from '@playwright/test';
import { abrirFiltros, elegirPerfil, entrarComoAlumno, sinViolacionesGraves } from './ayudas';

test('muestra ofertas con fuente, fecha, ubicación, jornada, enlace y fuentes fallidas', async ({ page }) => {
  await entrarComoAlumno(page);
  await elegirPerfil(page, 'DAM', 'Desarrollo web');
  await page.goto('/#/ofertas');
  await expect(page.getByText(/Actualizado el/)).toBeVisible();
  await expect(page.getByText(/InfoJobs: ha fallado/)).toBeVisible();
  const tarjeta = page.getByRole('article').filter({ hasText: 'Prácticas desarrollo web' });
  await expect(tarjeta).toContainText('Madrid');
  await expect(tarjeta).toContainText('Jornada completa');
  await expect(tarjeta).toContainText('Publicada el');
  await expect(tarjeta).toContainText('Fuente: Adzuna');
  await expect(tarjeta.getByRole('link', { name: /Ver oferta original/ })).toHaveAttribute('href', 'https://empleo.example.com/f1');
  await expect(page.getByText('Técnico SOC junior')).toHaveCount(0); // otro ciclo
  await abrirFiltros(page);
  await page.getByLabel('Tipo').selectOption('junior');
  await expect(page.getByText('No hay ofertas con estos filtros')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Busca también en los portales' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Indeed/ }).first()).toHaveAttribute('href', /es\.indeed\.com\/jobs\?q=desarrollador%20web%20junior&l=Madrid/);
  await sinViolacionesGraves(page);
});

test('estado de error con reintento si falla la API', async ({ page }) => {
  let fallar = true;
  await entrarComoAlumno(page);
  await page.route('**/api/ofertas', (r) => (fallar ? r.fulfill({ status: 500, body: '{"error":"Fallo simulado"}', contentType: 'application/json' }) : r.continue()));
  await page.goto('/#/ofertas');
  await expect(page.getByRole('alert')).toContainText('Fallo simulado');
  fallar = false;
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByText(/Actualizado el/)).toBeVisible();
});

test('estado vacío cuando aún no hay ofertas', async ({ page }) => {
  await entrarComoAlumno(page);
  await page.route('**/api/ofertas', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ actualizado: null, fuentes: [], ofertas: [] }) }));
  await page.goto('/#/ofertas');
  await expect(page.getByText('Todavía no hay ofertas descargadas')).toBeVisible();
});

test('las ofertas se pueden ver de cualquier rama de DAM o ASIR', async ({ page }) => {
  await entrarComoAlumno(page);
  await elegirPerfil(page, 'DAM', 'Desarrollo web');
  await page.goto('/#/ofertas');
  await expect(page.getByRole('heading', { name: 'Técnico SOC junior (FICTICIA)', level: 3 })).toHaveCount(0);
  await abrirFiltros(page);
  await page.getByLabel('Perfil o rama').selectOption('todos');
  await expect(page.getByRole('heading', { name: 'Técnico SOC junior (FICTICIA)', level: 3 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Prácticas desarrollo web (FICTICIA)', level: 3 })).toBeVisible();
  await page.getByLabel('Perfil o rama').selectOption('ciclo:ASIR');
  await expect(page.getByRole('heading', { name: 'Prácticas desarrollo web (FICTICIA)', level: 3 })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Técnico SOC junior (FICTICIA)', level: 3 })).toBeVisible();
});
