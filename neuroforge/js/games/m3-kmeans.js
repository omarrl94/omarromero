// Misión 3 · Agrupa la flota alienígena con k-means (aprendizaje no supervisado).
import { h, makeCanvas, canvasPos, COL, slider } from '../ui.js';
import { blobs, kmAssign, kmUpdate, kmInertia, rng } from '../ml.js';

const W = 560, H = 380;
const CENTERS = [
  [{ x: .2, y: .28 }, { x: .75, y: .3 }, { x: .5, y: .78 }],
  [{ x: .2, y: .25 }, { x: .78, y: .22 }, { x: .22, y: .75 }, { x: .78, y: .78 }],
  [{ x: .15, y: .2 }, { x: .5, y: .15 }, { x: .85, y: .22 }, { x: .3, y: .75 }, { x: .75, y: .8 }],
];

function draw(c, pts, cents, assign, trail) {
  c.clearRect(0, 0, W, H);
  c.strokeStyle = 'rgba(34,228,255,.06)'; for (let x = 0; x <= W; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
  pts.forEach((p, i) => { c.fillStyle = assign ? COL[assign[i]] : '#8089b0'; c.globalAlpha = .85; c.beginPath(); c.arc(p.x * W, p.y * H, 5, 0, 7); c.fill(); });
  c.globalAlpha = 1;
  (trail || []).forEach((t) => { c.strokeStyle = 'rgba(255,255,255,.25)'; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(t[0].x * W, t[0].y * H); c.lineTo(t[1].x * W, t[1].y * H); c.stroke(); c.setLineDash([]); });
  cents.forEach((k, i) => { c.fillStyle = '#05060a'; c.strokeStyle = COL[i]; c.lineWidth = 3; c.beginPath(); c.arc(k.x * W, k.y * H, 11, 0, 7); c.fill(); c.stroke(); c.fillStyle = COL[i]; c.font = 'bold 13px monospace'; c.textAlign = 'center'; c.fillText('✦', k.x * W, k.y * H + 4); });
  c.lineWidth = 1;
}

export default {
  id: 3, title: 'La flota alienígena', icon: '🛸', lesson: 3, color: '#ffb534',
  blurb: 'Nadie te ha dicho cuántas naves hay ni de qué tipo. Descúbrelo con k-means.',
  levels: [{ name: 'Coloca los centros', desc: 'k = 3' }, { name: 'El codo', desc: '¿Cuántos grupos hay?' }, { name: 'Mala semilla', desc: 'Inicialización' }],
  mount(root, li, api) {
    const { cv, c } = makeCanvas(W, H);
    const pts = blobs(40 + li, CENTERS[li], li === 0 ? 90 : 120, li === 2 ? .06 : .07);
    const out = h('div.stat'); const msg = h('div');
    let cents = [], assign = null, steps = 0, trail = null;
    const K = [3, 0, 5][li];
    const inertia = () => (assign ? kmInertia(pts, assign, cents) : 0);
    const refresh = () => {
      draw(c, pts, cents, assign, trail);
      out.replaceChildren(h('div', h('b', steps), 'iteraciones'), h('div', h('b', assign ? inertia().toFixed(2) : '—'), 'inercia (menos = mejor)'), h('div', h('b', cents.length), 'centros'));
    };
    const step = () => {
      if (!cents.length) return;
      assign = kmAssign(pts, cents);
      const nc = kmUpdate(pts, assign, cents);
      trail = cents.map((k, i) => [k, nc[i]]);
      cents = nc; steps++; api.sfx('tick'); refresh();
    };
    const runToEnd = () => { let g = 0; for (; g < 30; g++) { const a = kmAssign(pts, cents), nc = kmUpdate(pts, a, cents); const moved = nc.some((k, i) => Math.hypot(k.x - cents[i].x, k.y - cents[i].y) > 1e-4); assign = a; cents = nc; steps++; if (!moved) break; } assign = kmAssign(pts, cents); trail = null; refresh(); };
    const ctrl = h('div.row');
    root.append(h('div.two', h('div', cv), h('div', h('div.goal'), out, ctrl, msg)));
    const goal = root.querySelector('.goal');

    if (li === 0) {
      goal.replaceChildren('Haz clic en el mapa para colocar ', h('b', '3 centros'), ' y pulsa ', h('b', 'Paso'), ' hasta que dejen de moverse. Consigue ', h('b', 'inercia < 1.5'), ' en el menor número de pasos.');
      cv.addEventListener('pointerdown', (e) => { if (cents.length >= K) return; const p = canvasPos(cv, e, W, H); cents.push({ x: p.x / W, y: p.y / H }); assign = null; refresh(); });
      ctrl.append(h('button.btn', { onclick: step }, '▶ Paso'), h('button.btn.g', { onclick: () => { cents = []; assign = null; steps = 0; trail = null; refresh(); } }, '↺ Vaciar'),
        h('button.btn.l', { onclick: () => { if (cents.length < K || !assign) return msg.replaceChildren(h('p.am', `Coloca los ${K} centros y da al menos un paso.`)); const i = inertia(); const moved = false; void moved; if (i < 1.5) api.win(steps <= 3 ? 3 : steps <= 6 ? 2 : 1, `Inercia ${i.toFixed(2)} en ${steps} pasos.`); else { msg.replaceChildren(h('p.rd', `Inercia ${i.toFixed(2)}: aún hay centros en mal sitio. Sigue dando pasos o recoloca.`)); api.sfx('bad'); } } }, '✔ Comprobar'));
    } else if (li === 1) {
      let k = 2; const tried = {};
      goal.replaceChildren('No sabes cuántos tipos de nave hay. Prueba varios ', h('b', 'k'), ': la inercia siempre baja al aumentar k, pero hay un ', h('b', '«codo»'), ' donde deja de compensar. Elige el k del codo.');
      const chart = makeCanvas(300, 150);
      const ks = slider('k', 1, 7, 1, k, (v) => { k = v; }, (v) => v);
      const drawChart = () => {
        const cc = chart.c; cc.clearRect(0, 0, 300, 150); cc.strokeStyle = '#252c45'; cc.strokeRect(30, 10, 260, 110);
        const vals = Object.entries(tried).map(([kk, v]) => [+kk, v]); const mx = Math.max(...vals.map((v) => v[1]), 1);
        cc.fillStyle = '#8089b0'; cc.font = '11px monospace'; for (let i = 1; i <= 7; i++) cc.fillText(i, 30 + (i - 1) * 40 + 30 - 4, 136);
        cc.strokeStyle = '#22e4ff'; cc.beginPath(); vals.sort((a, b) => a[0] - b[0]).forEach(([kk, v], j) => { const x = 60 + (kk - 1) * 40, y = 120 - (v / mx) * 105; j ? cc.lineTo(x, y) : cc.moveTo(x, y); }); cc.stroke();
        vals.forEach(([kk, v]) => { cc.fillStyle = '#ff3df0'; cc.beginPath(); cc.arc(60 + (kk - 1) * 40, 120 - (v / mx) * 105, 4, 0, 7); cc.fill(); });
      };
      const run = () => {
        const r = rng(7 + k); cents = Array.from({ length: k }, () => { const p = pts[Math.floor(r() * pts.length)]; return { x: p.x, y: p.y }; });
        steps = 0; runToEnd(); tried[k] = inertia(); drawChart();
      };
      ctrl.append(ks.el, h('button.btn', { onclick: run }, '▶ Ejecutar k-means'), h('button.btn.l', { onclick: () => { if (tried[4] == null && !cents.length) return msg.replaceChildren(h('p.am', 'Prueba al menos tres valores de k.')); if (Object.keys(tried).length < 3) return msg.replaceChildren(h('p.am', 'Prueba al menos tres valores de k antes de decidir.')); if (k === 4) api.win(Object.keys(tried).length <= 4 ? 3 : 2, 'k = 4 era el codo: ¡cuatro tipos de nave!'); else { msg.replaceChildren(h('p.rd', `Con k=${k}: mira la gráfica. Hasta k=4 la inercia se desploma; después, solo mejora un poco.`)); api.sfx('bad'); } } }, '✔ Este es mi k'));
      root.querySelector('.two > div:last-child').append(chart.cv);
      drawChart();
    } else {
      let seed = 1, smart = false;
      goal.replaceChildren('Hay ', h('b', '5 grupos'), ' y k=5, pero k-means depende de dónde empiecen los centros: a veces dos centros caen en el mismo grupo y ',
        h('b', 'otro grupo se queda sin centro'), '. Consigue ', h('b', 'inercia < 1.5'), ' (la agrupación correcta).');
      const init = () => {
        const r = rng(seed * 977);
        if (smart) { cents = [pts[Math.floor(r() * pts.length)]].map((p) => ({ x: p.x, y: p.y })); while (cents.length < K) { const d = pts.map((p) => Math.min(...cents.map((k) => (p.x - k.x) ** 2 + (p.y - k.y) ** 2))); const tot = d.reduce((a, b) => a + b, 0); let t = r() * tot, j = 0; while (j < d.length - 1 && (t -= d[j]) > 0) j++; cents.push({ x: pts[j].x, y: pts[j].y }); } }
        else cents = Array.from({ length: K }, () => ({ x: .3 + r() * .4, y: .3 + r() * .4 }));  // todos apelotonados en el centro: mala idea
        steps = 0; runToEnd();
        const i = inertia();
        msg.replaceChildren(h('p', i < 1.5 ? h('b.li', '¡Agrupación correcta! 🎉') : h('b.rd', `Inercia ${i.toFixed(2)}: hay naves de grupos distintos mezcladas. Mira los centros.`)));
        if (i < 1.5) api.win(smart ? 3 : seed <= 3 ? 2 : 1, `Semilla ${seed}${smart ? ' con inicialización inteligente' : ''}.`); else api.sfx('bad');
      };
      ctrl.append(h('button.btn', { onclick: () => { seed++; init(); } }, '🎲 Nueva semilla'),
        h('label.sw', h('input', { type: 'checkbox', onchange: (e) => { smart = e.target.checked; } }), 'Inicialización inteligente (k-means++: centros lejos unos de otros)'));
      msg.append(h('p.mut.sm', 'Pulsa «Nueva semilla» hasta acertar… o activa k-means++ y verás por qué se inventó.'));
    }
    refresh();
  },
};
