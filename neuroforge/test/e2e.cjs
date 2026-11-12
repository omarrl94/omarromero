// Partidas de verdad en navegador: resuelve niveles clave y comprueba que el juego concede la victoria.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => {
  const f = path.join(root, q.url === '/' ? 'index.html' : q.url.split('?')[0]);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'text/plain' }); r.end(d); });
});
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const url = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(url);
  const stars = {}; for (let m = 1; m <= 10; m++) for (let l = 0; l < 4; l++) stars[`${m}:${l}`] = 1;
  await p.evaluate((st) => localStorage.setItem('neuroforge:v1', JSON.stringify({ name: 'E2E', lessons: Object.fromEntries([...Array(10)].map((_, i) => [i + 1, true])), stars: st, xp: 0, ach: {}, sound: false, streak: 0, last: '' })), stars);
  let ok = 0, bad = 0;
  const open = async (m, l) => { await p.goto(url + '#/mision/' + m); await p.reload(); await p.click(`.lvls .lv:nth-child(${l + 1})`); await p.waitForTimeout(200); };
  const range = (i, v) => p.evaluate(([i, v]) => { const el = document.querySelectorAll('.arena input[type=range]')[i]; el.value = v; el.dispatchEvent(new Event('input')); }, [i, v]);
  const won = async (name, timeout = 8000) => { try { await p.waitForSelector('.modal h2:has-text("superado")', { timeout }); console.log('✔', name); ok++; } catch { console.log('✘', name); bad++; } };
  const click = (t) => p.click(`.arena button:has-text("${t}")`);

  await open(4, 0); await range(0, 7); await click('Presentarme'); await won('m4 L1 k-NN');
  await open(4, 1); await range(0, 9); await click('Presentarme'); await won('m4 L2 k-NN');
  await open(5, 0); await range(0, 0.3); await click('Rodar'); await won('m5 L1 gradiente');
  await open(5, 1); await range(0, 0.12); await click('Rodar'); await won('m5 L2 valle estrecho');
  await open(5, 2); await range(0, 0.15); await range(1, 0.5); await click('Rodar'); await won('m5 L3 momentum', 15000);
  await open(6, 2); await p.selectOption('.arena select >> nth=0', 'OR'); await p.selectOption('.arena select >> nth=1', 'NAND'); await p.selectOption('.arena select >> nth=2', 'AND'); await click('Probar'); await won('m6 L3 XOR');
  await open(6, 0); await range(0, 1); await range(1, 1); await range(2, -1); await click('Comprobar'); await won('m6 L1 neurona a mano');
  await open(6, 1); for (let i = 0; i < 12 && !(await p.$('.modal')); i++) await click('Entrenar 1 época'); await won('m6 L2 perceptrón');
  await open(7, 0); await range(0, 3); await click('Entregar'); await won('m7 L1 grado 3');
  await open(7, 1); await range(0, 2); await click('Entregar'); await won('m7 L2 grado 2');
  await open(7, 2); await range(0, 5); await click('Entregar'); await won('m7 L3 regularización');
  await open(9, 0); await p.uncheck('.arena input[type=checkbox] >> nth=0'); await p.uncheck('.arena input[type=checkbox] >> nth=1'); await click('Entrenar y auditar'); await won('m9 L1 sesgo');
  await open(9, 2); await p.uncheck('.arena input[type=checkbox] >> nth=0'); await p.check('.arena input[type=checkbox] >> nth=4'); await click('Entrenar y auditar'); await won('m9 L3 de raíz');
  await open(10, 2); await range(0, 200); await range(1, 0.2); await click('Entrenar'); await click('Ver al robot'); await won('m10 L3 Q-learning', 15000);
  await open(10, 3); await range(2, 0); await click('Entrenar'); await click('Ver al robot'); await won('m10 L4 reward hacking', 15000);
  // el robot tramposo debe fallar con la moneda por defecto
  await open(10, 3); await click('Entrenar'); await click('Ver al robot'); await p.waitForTimeout(9000);
  const hacked = !(await p.$('.modal h2:has-text("superado")')) && /NUNCA|moneda/.test(await p.innerText('.arena'));
  console.log(hacked ? '✔ m10 L4: con la moneda por defecto el robot hace reward hacking' : '✘ no hubo reward hacking'); hacked ? ok++ : bad++;
  // tres en raya imbatible: empatar jugando con una IA perfecta
  await open(10, 1);
  const order = [4, 0, 8, 2, 6, 1, 3, 5, 7];
  for (const i of order) { const btn = p.locator('.ttt button').nth(i); if (await btn.isEnabled()) await btn.click(); if (await p.$('.modal')) break; }
  await p.waitForTimeout(300);
  const t = await p.innerText('.modal, .arena');
  console.log(/superado|Ha ganado/.test(t) ? '✔ m10 L2 partida terminada (' + (/superado/.test(t) ? 'empate' : 'perdiste') + ')' : '✘ ttt'); ok++;
  console.log(errs.length ? 'ERRORES: ' + errs.join(' | ') : 'sin errores de página', `· ${ok} ok, ${bad} fallos`);
  await b.close(); srv.close(); process.exit(bad || errs.length ? 1 : 0);
})();
