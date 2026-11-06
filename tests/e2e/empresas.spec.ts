import { expect, test } from '@playwright/test';
import { abrirFiltros, elegirPerfil, entrarComoAlumno, ipUnica, irAEmpresas, rellenarNombre, sinViolacionesGraves } from './ayudas';

test.beforeEach(async ({ page }) => ipUnica(page));

test('el directorio exige iniciar sesión y no expone correos', async ({ page, request }) => {
  const r = await request.get('/api/empresas');
  expect(r.status()).toBe(401);
  expect(await r.text()).not.toContain('@');
  await page.goto('/#/empresas');
  await expect(page.getByRole('heading', { name: 'Entrar en Conecta FFE' })).toBeVisible();
  await sinViolacionesGraves(page);
});

test('filtra, busca y ordena por encaje con el perfil', async ({ page }) => {
  await entrarComoAlumno(page);
  await elegirPerfil(page, 'ASIR', 'Ciberseguridad y SOC');
  await irAEmpresas(page);
  const tarjetas = page.getByRole('main').getByRole('listitem').filter({ has: page.getByRole('heading', { level: 3 }) });
  await expect(tarjetas.first()).toContainText('Ficticia Ciberdefensa');
  await expect(page.getByRole('heading', { name: 'Ficticia ERP Consulting', level: 3 })).toHaveCount(0); // sin perfiles ASIR
  await expect(tarjetas.first()).toContainText('Programa de prácticas publicado');
  await expect(page.getByText('Candidatura espontánea').first()).toBeVisible();
  await page.getByLabel('Buscar').fill('nube');
  await expect(tarjetas).toHaveCount(1);
  await page.getByLabel('Buscar').fill('zzzz');
  await expect(page.getByText('Ninguna empresa con estos filtros')).toBeVisible();
  await page.getByRole('button', { name: 'Quitar filtros' }).first().click();
  await abrirFiltros(page);
  await page.locator('label').filter({ hasText: 'Con programa de prácticas' }).click();
  await expect(page.getByLabel('Con programa de prácticas')).toBeChecked();
  await expect(tarjetas).toHaveCount(1);
  await sinViolacionesGraves(page);
});

test('genera el correo, exige el aviso de CV, abre Outlook/Gmail y registra el seguimiento', async ({ page }) => {
  await entrarComoAlumno(page);
  await elegirPerfil(page, 'DAM', 'Desarrollo web');
  await rellenarNombre(page);
  await irAEmpresas(page);
  await page.getByRole('link', { name: 'Ficticia Web Studio', exact: true }).click();
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
  await expect(page.getByRole('link', { name: 'Ficticia Web Studio', exact: true })).toBeVisible();
  await expect(page.getByLabel('Estado de Ficticia Web Studio')).toHaveValue('enviado');
  await sinViolacionesGraves(page);
});

test('empresas solo con formulario: copiar texto y abrir el formulario oficial', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await entrarComoAlumno(page);
  await elegirPerfil(page, 'ASIR', 'Cloud y AWS');
  await rellenarNombre(page, 'Luis Gómez');
  await irAEmpresas(page);
  await page.getByRole('link', { name: 'Ficticia Nube', exact: true }).click();
  await expect(page.getByText('Esta empresa recibe candidaturas por formulario')).toBeVisible();
  await expect(page.getByText(/Tutor\/a de tu ciclo pendiente/)).toHaveCount(0); // sin campo CC en formularios
  await page.getByLabel(/adjuntaré mi CV en PDF/).check();
  await expect(page.getByRole('link', { name: /Abrir formulario oficial/ })).toHaveAttribute('href', 'https://www.ficticia-nube.test/empleo/candidatura');
  await page.getByRole('button', { name: 'Copiar texto' }).click();
  await expect(page.getByText('Copiado al portapapeles.')).toBeVisible();
  await sinViolacionesGraves(page);
});

test('ASIR sin tutor asignado: el correo avisa y no pone copia', async ({ page }) => {
  await entrarComoAlumno(page);
  await elegirPerfil(page, 'ASIR', 'Ciberseguridad y SOC', 'B');
  await rellenarNombre(page);
  await irAEmpresas(page);
  await page.getByRole('link', { name: 'Ficticia Ciberdefensa', exact: true }).click();
  await expect(page.getByLabel('CC (tutor/a de FFE)')).toHaveValue('');
  await expect(page.getByText(/Tutor\/a de tu ciclo pendiente de asignar/)).toBeVisible();
  await expect(page.getByLabel('Asunto')).toHaveValue(/Programa de prácticas SOC/);
  await expect(page.getByLabel(/Mensaje/)).toContainText('7 horas al día, 420 horas');
});

test('filtra por tipo de contacto y por cualquier rama de DAM o ASIR, y escribe desde la tarjeta', async ({ page }) => {
  await entrarComoAlumno(page);
  await elegirPerfil(page, 'DAM', 'Desarrollo web');
  await rellenarNombre(page);
  await irAEmpresas(page);
  const tarjetas = page.getByRole('main').getByRole('listitem').filter({ has: page.getByRole('heading', { level: 3 }) });

  // Por defecto: mi ciclo (DAM). La de ciberseguridad (solo ASIR) no sale.
  await expect(page.getByRole('heading', { name: 'Ficticia Ciberdefensa', level: 3 })).toHaveCount(0);

  // Todos: las 4 empresas, de DAM y de ASIR.
  await abrirFiltros(page);
  await page.getByLabel('Perfil o rama').selectOption('todos');
  await expect(tarjetas).toHaveCount(4);

  // Cualquier rama de ASIR: las que tienen algún perfil de ASIR.
  await page.getByLabel('Perfil o rama').selectOption('ciclo:ASIR');
  await expect(tarjetas).toHaveCount(2);
  await expect(page.getByRole('heading', { name: 'Ficticia Ciberdefensa', level: 3 })).toBeVisible();

  // Una rama concreta del otro ciclo.
  await page.getByLabel('Perfil o rama').selectOption('asir-cloud');
  await expect(tarjetas).toHaveCount(1);
  await expect(tarjetas.first()).toContainText('Ficticia Nube');

  // Tipo de contacto.
  await page.getByLabel('Perfil o rama').selectOption('todos');
  await page.getByLabel('Contacto').selectOption('formulario');
  await expect(tarjetas).toHaveCount(1);
  await expect(tarjetas.first().getByRole('link', { name: /Abrir formulario/ })).toHaveAttribute('href', 'https://www.ficticia-nube.test/empleo/candidatura');
  await page.getByLabel('Contacto').selectOption('email');
  await expect(tarjetas).toHaveCount(3);
  await page.getByLabel('Contacto').selectOption('rrhh');
  await expect(tarjetas).toHaveCount(3); // talento@, rrhh@ y empleo@ (todos de RR. HH. o talento)
  await expect(tarjetas.first()).toContainText('Correo de');
  await page.getByLabel('Contacto').selectOption('email');

  // «Escribir correo» lleva directamente al generador de la empresa.
  await tarjetas.filter({ hasText: 'Ficticia ERP Consulting' }).getByRole('link', { name: /Escribir correo/ }).click();
  await expect(page).toHaveURL(/#\/empresas\/ficticia-erp\/correo$/);
  await expect(page.getByRole('heading', { name: 'Tu correo para Ficticia ERP Consulting' })).toBeInViewport();
  await expect(page.getByLabel('Para', { exact: true })).toHaveValue('empleo@ficticia-erp.test');
  await sinViolacionesGraves(page);
});

test('los filtros se mantienen al abrir una empresa y volver atrás', async ({ page }) => {
  await entrarComoAlumno(page);
  await elegirPerfil(page, 'DAM', 'Desarrollo web');
  await irAEmpresas(page);
  await abrirFiltros(page);
  await page.getByLabel('Perfil o rama').selectOption('ciclo:ASIR');
  await page.getByLabel('Contacto').selectOption('email');
  await page.getByLabel('Buscar').fill('ciber');
  const tarjetas = page.getByRole('main').getByRole('listitem').filter({ has: page.getByRole('heading', { level: 3 }) });
  await expect(tarjetas).toHaveCount(1);

  await page.getByRole('link', { name: 'Ficticia Ciberdefensa', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ficticia Ciberdefensa');
  await page.goBack();

  await expect(page.getByLabel('Buscar')).toHaveValue('ciber');
  await abrirFiltros(page);
  await expect(page.getByLabel('Perfil o rama')).toHaveValue('ciclo:ASIR');
  await expect(page.getByLabel('Contacto')).toHaveValue('email');
  await expect(tarjetas).toHaveCount(1);

  // También tras recargar la página dentro de la misma sesión.
  await page.reload();
  await expect(page.getByLabel('Buscar')).toHaveValue('ciber');
});
