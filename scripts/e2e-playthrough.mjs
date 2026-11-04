// Prueba de extremo a extremo: juega TODAS las misiones de los tres equipos en un navegador real
// sobre preview/cyberops-preview.html, respondiendo cada reto a partir de los datos de la campaña.
// Comprueba que cada misión se completa con 3 estrellas (sin pistas ni errores), que los módulos
// se desbloquean en orden, que los apuntes se abren durante los retos y que no hay errores de JS.
// Uso: npm run preview:html && npm run test:e2e   (necesita Playwright con Chromium)
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { MISSIONS, MODULES, missionsFor, challengesOf } from '../src/campaign/index.js';
import { TEAMS } from '../src/core/teams.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const url = `file://${resolve('preview/cyberops-preview.html')}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
const jsErrors = [];
page.on('pageerror', (e) => jsErrors.push(e.message));
page.setDefaultTimeout(8000);

const SEED = 777;
const fails = [];
const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let played = 0;

async function playChallenge(c) {
  if (c.type === 'quiz') {
    for (const q of c.questions) {
      await page.getByRole('button', { name: new RegExp(`^[A-Z]?\\s*${esc(q.options[q.correct])}$`) }).click();
      await page.getByRole('button', { name: /^(Siguiente|Completar reto)/ }).click();
    }
    return;
  }
  if (c.type === 'classify') {
    for (const it of c.items) {
      const label = c.categories.find((x) => x.id === it.cat).label;
      await page.locator('div.rounded-xl.p-3').filter({ hasText: it.text }).getByRole('button', { name: label, exact: true }).click();
    }
  } else if (c.type === 'order') {
    await page.locator('ol li span.flex-1').first().waitFor();
    for (let k = 0; k < c.items.length; k++) {
      const texts = await page.locator('ol li span.flex-1').allTextContents();
      let j = texts.indexOf(c.items[k]);
      while (j > k) { await page.locator('ol li').nth(j).getByRole('button', { name: 'Subir' }).click(); j--; }
    }
    await page.getByRole('button', { name: 'Comprobar orden' }).click();
  } else if (c.type === 'code') {
    await page.locator('div.font-mono > button').nth(c.bad[0]).click();
    await page.getByRole('button').filter({ hasText: c.options.find((o) => o.correct).text }).click();
  } else if (c.type === 'logs') {
    for (const k of c.bad) await page.locator('button[aria-pressed]').nth(k).click();
    await page.getByRole('button', { name: /^Comprobar/ }).click();
  } else if (c.type === 'terminal') {
    const input = page.getByLabel('Línea de comandos');
    for (const cmd of c.solution) { await input.fill(cmd); await input.press('Enter'); }
    for (const o of c.objectives.filter((x) => x.answer)) {
      const li = page.locator('li').filter({ hasText: o.text });
      await li.locator('input').fill(o.answer[0]);
      await li.getByRole('button', { name: 'OK' }).click();
    }
  }
  await page.getByRole('button', { name: /^Completar reto/ }).click();
}

async function playMission(team, m, checkNotes) {
  const mod = MODULES.find((x) => x.id === m.module);
  const card = page.locator('div.group').filter({ has: page.getByRole('heading', { name: m.title, exact: true }) });
  if (!(await card.count())) await page.getByRole('button', { name: new RegExp(`Módulo ${mod.num} `) }).click();
  await card.getByRole('button', { name: /Jugar/ }).click();
  await page.getByRole('button', { name: /Abrir la lección/ }).click();
  for (let k = 0; k < m.lesson.length; k++) await page.getByRole('button', { name: /^Siguiente/ }).click();
  await page.getByText('Lo esencial antes de jugar').waitFor();
  await page.getByRole('button', { name: /A por los retos/ }).click();
  if (checkNotes) {
    await page.keyboard.press('a');
    await page.getByRole('dialog', { name: 'Apuntes de la lección' }).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'detached' });
  }
  const list = challengesOf(m, SEED, team);
  for (const [ci, c] of list.entries()) {
    // Espera a que el reto nuevo esté montado (hay una transición animada entre retos).
    await page.getByText(new RegExp(`^Reto ${ci + 1}/${list.length} ·`)).waitFor();
    await playChallenge(c);
  }
  await page.getByRole('button', { name: /Volver al mapa/ }).waitFor();
  const stars = await page.evaluate(([t, id]) => {
    const uid = localStorage.getItem('cyberops.session.v1');
    const p = JSON.parse(localStorage.getItem(`cyberops.progress.v1.${uid}`) || '{}');
    const rec = p.teams?.[t]?.[id];
    return rec ? `${rec.stars}/${rec.score}` : 'nada';
  }, [team, m.id]);
  if (stars !== '3/100') fails.push(`${team}/${m.id}: estrellas/puntos = ${stars} (se esperaba 3/100)`);
  await page.getByRole('button', { name: /Volver al mapa/ }).click();
  played++;
}

await page.goto(url);
await page.evaluate((seed) => localStorage.setItem('cyberops.seed', String(seed)), SEED);
await page.reload();
await page.getByText('Saltar').click();
await page.getByText('Empezar la misión').click();
await page.fill('#nick', 'Tester_E2E');
await page.fill('#email', 'e2e@lab.dev');
await page.fill('#password', 'secreto123');
await page.getByRole('button', { name: 'Crear mi agente' }).click();

const TEAM_LIST = (process.env.E2E_TEAMS || 'blue,red,purple').split(',');
for (const [ti, team] of TEAM_LIST.entries()) {
  if (ti === 0) {
    await page.getByRole('radio').filter({ hasText: TEAMS[team].name }).first().click();
    await page.getByRole('checkbox').check();
  } else {
    await page.getByRole('button', { name: /Perfil/ }).first().click();
    await page.getByRole('button', { name: /Cambiar de equipo/ }).click();
    await page.getByRole('radio').filter({ hasText: TEAMS[team].name }).first().click();
  }
  await page.getByRole('button', { name: new RegExp(`Unirme al ${TEAMS[team].name}`) }).click();
  // El módulo 2 debe estar bloqueado al empezar.
  if (!(await page.getByText('Completa el módulo anterior para desbloquearlo.').first().isVisible())) fails.push(`${team}: el módulo 2 no aparece bloqueado`);
  const start = Date.now();
  let list = missionsFor(team);
  if (process.env.E2E_ONLY) {
    // Depuración: marca como superado todo lo anterior a la misión indicada y juega solo esa.
    const idx = list.findIndex((m) => m.id === process.env.E2E_ONLY);
    await page.evaluate(([t, ids]) => {
      const uid = localStorage.getItem('cyberops.session.v1');
      const key = `cyberops.progress.v1.${uid}`;
      const p = JSON.parse(localStorage.getItem(key));
      ids.forEach((id) => { p.teams[t][id] = { stars: 3, score: 100, at: 1 }; });
      localStorage.setItem(key, JSON.stringify(p));
    }, [team, list.slice(0, idx).map((m) => m.id)]);
    await page.reload();
    list = [list[idx]];
  }
  for (const [k, m] of list.entries()) {
    try {
      await playMission(team, m, k === 0);
    } catch (e) {
      fails.push(`${team}/${m.id}: ${process.env.E2E_DEBUG ? e.message : e.message.split('\n')[0]}`); if (process.env.E2E_ONE) break;
      await page.screenshot({ path: `e2e-fallo-${team}-${m.id}.png` }).catch(() => {});
      await page.getByRole('button', { name: /Operaciones/ }).first().click().catch(() => {});
    }
  }
  console.log(`${fails.length ? '…' : '✓'} ${TEAMS[team].name}: ${list.length} misiones jugadas en ${Math.round((Date.now() - start) / 1000)} s`);
}

// Perfil y ranking al final.
await page.getByRole('button', { name: /Perfil/ }).first().click();
const lastRank = TEAMS.purple.ranks[7];
if (TEAM_LIST.includes('purple') && !(await page.getByText(lastRank).first().isVisible())) fails.push('perfil: no aparece el rango final del Equipo Morado');
await page.getByRole('button', { name: /Ranking/ }).first().click();
await page.getByText('Tester_E2E').waitFor().catch(() => fails.push('ranking: no aparece el agente'));

await browser.close();
if (jsErrors.length) fails.push(...jsErrors.map((e) => `error JS: ${e}`));
if (fails.length) {
  console.log(fails.map((f) => `✗ ${f}`).join('\n'));
  process.exit(1);
}
console.log(`✓ ${played} partidas completadas con 3 estrellas y 100 puntos (${MISSIONS.length} misiones distintas), sin errores de JavaScript`);
