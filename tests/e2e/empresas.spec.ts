import { expect, test } from '@playwright/test';
import { CODIGO, elegirPerfil, entrar, ipUnica, rellenarNombre, sinViolacionesGraves } from './ayudas';

test.beforeEach(async ({ page }) => ipUnica(page));

test('el directorio exige código y no expone correos sin sesión', async ({ page, request }) => {
  const r = await request.get('/api/empresas');
  expect(r.status()).toBe(401);
  expect(await r.text()).not.toContain('@');
  await page.goto('/#/empresas');
  await expect(page.getByRole('heading', { name: 'Directorio protegido' })).toBeVisible();
  await sinViolacionesGraves(page);
  await page.getByLabel('Código de acceso').fill('incorrecto');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('alert')).toContainText('Código incorrecto');
  await page.getByLabel('Código de acceso').fill(CODIGO);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Ficticia Web Studio')).toBeVisible();
});

test('limita los intentos fallidos', async ({ page }) => {
  await page.goto('/#/empresas');
  for (let i = 0; i < 5; i++) {
    await page.getByLabel('Código de acceso').fill(`mal-${i}`);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('alert')).toContainText(/Código incorrecto/);
  }
  await page.getByLabel('Código de acceso').fill(CODIGO);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('alert')).toContainText('Demasiados intentos');
});

test('filtra, busca y ordena por encaje con el perfil', async ({ page }) => {
  await elegirPerfil(page, 'ASIR', 'Ciberseguridad y SOC');
  await entrar(page);
  const tarjetas = page.getByRole('main').getByRole('listitem').filter({ has: page.getByRole('heading', { level: 3 }) });
  await expect(tarjetas.first()).toContainText('Ficticia Ciberdefensa');
  await expect(page.getByText('Ficticia ERP Consulting')).toHaveCount(0); // sin perfiles ASIR
  await expect(tarjetas.first()).toContainText('Programa de prácticas publicado');
  await expect(page.getByText('Candidatura espontánea').first()).toBeVisible();
  await page.getByLabel('Buscar').fill('nube');
  await expect(tarjetas).toHaveCount(1);
  await page.getByLabel('Buscar').fill('zzzz');
  await expect(page.getByText('Ninguna empresa con estos filtros')).toBeVisible();
  await page.getByRole('button', { name: 'Quitar filtros' }).first().click();
  await page.getByLabel('Solo con programa de prácticas publicado').check();
  await expect(tarjetas).toHaveCount(1);
  await sinViolacionesGraves(page);
});

test('genera el correo, exige el aviso de CV, abre Outlook/Gmail y registra el seguimiento', async ({ page }) => {
  await elegirPerfil(page, 'DAM', 'Desarrollo web');
  await rellenarNombre(page);
  await entrar(page);
  await page.getByRole('link', { name: 'Ficticia Web Studio' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ficticia Web Studio');
  await expect(page.getByText('https://www.ficticia-web.test/empleo').first()).toBeVisible();
  await expect(page.getByText(/Verificado/)).toBeVisible();

  const cuerpo = page.getByLabel(/Mensaje/);
  await expect(cuerpo).toContainText('Me llamo Ana Pérez');
  await expect(cuerpo).toContainText('320 horas');
  await expect(cuerpo).toContainText('GitHub: https://github.com/ana');
  await expect(page.getByLabel('CC (tutor/a de FFE)')).toHaveValue('omar.romero@jrotero.es');
  await cuerpo.fill('Texto editado por la alumna.');

  const outlook = page.getByRole('link', { name: /Abrir en Outlook web/ });
  await expect(outlook).toHaveAttribute('aria-disabled', 'true');
  await page.getByLabel(/adjuntaré mi CV en PDF/).check();
  const gmail = page.getByRole('link', { name: /Abrir en Gmail/ });
  const abiertas = [await outlook.getAttribute('href'), await gmail.getAttribute('href')] as string[];
  await expect(outlook).toHaveAttribute('target', '_blank');
  await expect(page.getByRole('link', { name: /Abrir en mi app de correo/ })).toHaveAttribute('href', /^mailto:talento@ficticia-web\.test\?cc=/);
  // Al pulsar se registra el contacto (se evita abrir la pestaña externa en la prueba).
  await page.route('https://outlook.office.com/**', (r) => r.abort());
  await outlook.click();
  expect(abiertas[0]).toMatch(/^https:\/\/outlook\.office\.com\/mail\/deeplink\/compose\?to=talento%40ficticia-web\.test&cc=omar\.romero%40jrotero\.es/);
  expect(decodeURIComponent(abiertas[0])).toContain('Texto editado por la alumna.');
  expect(abiertas[1]).toMatch(/^https:\/\/mail\.google\.com\/mail\/\?view=cm/);

  await page.getByRole('button', { name: 'Sí, marcar como enviado' }).click();
  await expect(page.getByLabel('Estado')).toHaveValue('enviado');
  await page.reload();
  await expect(page.getByText('Ya has contactado con esta empresa desde este dispositivo')).toBeVisible();

  await page.goto('/#/seguimiento');
  await expect(page.getByRole('link', { name: 'Ficticia Web Studio' })).toBeVisible();
  await expect(page.getByLabel('Estado de Ficticia Web Studio')).toHaveValue('enviado');
  await sinViolacionesGraves(page);
});

test('empresas solo con formulario: copiar texto y abrir el formulario oficial', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await elegirPerfil(page, 'ASIR', 'Cloud y AWS');
  await rellenarNombre(page, 'Luis Gómez');
  await entrar(page);
  await page.getByRole('link', { name: 'Ficticia Nube' }).click();
  await expect(page.getByText('Esta empresa recibe candidaturas por formulario')).toBeVisible();
  await expect(page.getByText(/Tutor\/a de tu ciclo pendiente/)).toHaveCount(0); // sin campo CC en formularios
  await page.getByLabel(/adjuntaré mi CV en PDF/).check();
  await expect(page.getByRole('link', { name: /Abrir formulario oficial/ })).toHaveAttribute('href', 'https://www.ficticia-nube.test/empleo/candidatura');
  await page.getByRole('button', { name: 'Copiar texto' }).click();
  await expect(page.getByText('Copiado al portapapeles.')).toBeVisible();
  await sinViolacionesGraves(page);
});

test('ASIR sin tutor asignado: el correo avisa y no pone copia', async ({ page }) => {
  await elegirPerfil(page, 'ASIR', 'Ciberseguridad y SOC', 'B');
  await rellenarNombre(page);
  await entrar(page);
  await page.getByRole('link', { name: 'Ficticia Ciberdefensa' }).click();
  await expect(page.getByLabel('CC (tutor/a de FFE)')).toHaveValue('');
  await expect(page.getByText(/Tutor\/a de tu ciclo pendiente de asignar/)).toBeVisible();
  await expect(page.getByLabel('Asunto')).toHaveValue(/Programa de prácticas SOC/);
  await expect(page.getByLabel(/Mensaje/)).toContainText('7 horas al día, 420 horas');
});
