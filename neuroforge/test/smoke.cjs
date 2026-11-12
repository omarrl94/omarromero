// Prueba de humo en navegador real: recorre la app y falla ante cualquier error de consola.
// Uso: node test/smoke.cjs [carpeta_capturas]   (requiere Playwright)
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
  const ctx = await b.newContext({ viewport: { width: 1100, height: 800 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  const shot = process.argv[2];
  await p.goto(url); await p.fill('input.txt', 'Test'); await p.click('text=Empezar');
  if (shot) await p.screenshot({ path: shot + '/home.png' });
  for (let id = 1; id <= 10; id++) {
    await p.goto(url + '#/leccion/' + id);
    for (let guard = 0; guard < 20; guard++) {
      if (await p.$('.quiz')) {
        const opts = await p.$$('.quiz .opt');
        for (const o of opts) { if (await o.isDisabled()) continue; await o.click(); if (await p.$('.why')) break; }
      }
      const nx = await p.$('.nav-bottom .btn:not(.g)');
      if (!nx) break;
      const label = await nx.textContent();
      if (shot && id === 6 && guard === 0) await p.screenshot({ path: shot + '/lesson.png' });
      await nx.click();
      if (label.includes('Terminar')) { await p.waitForSelector('.modal'); break; }
    }
  }
  const st = await p.evaluate(() => JSON.parse(localStorage.getItem('neuroforge:v1')));
  console.log('lecciones completadas:', Object.keys(st.lessons).length);
  const counts = [3, 3, 3, 3, 3, 3, 3, 3, 3, 4];
  for (let m = 1; m <= 10; m++) {
    for (let l = 0; l < counts[m - 1]; l++) {
      await p.evaluate((o) => { const s = JSON.parse(localStorage.getItem('neuroforge:v1')); for (let i = 0; i < o.l; i++) s.stars[o.m + ':' + i] = 1; localStorage.setItem('neuroforge:v1', JSON.stringify(s)); }, { m, l });
      await p.goto(url + '#/mision/' + m); await p.reload(); await p.waitForTimeout(150);
      try { await p.click(`.lvls .lv:nth-child(${l + 1})`, { timeout: 4000 }); } catch (e) { console.log(String(e.message).slice(0, 700)); console.log('FALLA mision', m, 'nivel', l, (await p.innerText('body')).slice(0, 200), errs.join('|')); process.exit(1); }
      await p.waitForTimeout(250);
      if (shot) await p.screenshot({ path: `${shot}/m${m}-${l}.png` });
    }
  }
  await p.goto(url + '#/codex'); await p.goto(url + '#/certificado');
  console.log(errs.length ? errs.join('\n') : 'SIN ERRORES');
  await b.close(); srv.close(); process.exit(errs.length ? 1 : 0);
})();
