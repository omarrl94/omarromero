// Misión 7 · Encuentra la complejidad justa: ni memorizar ni quedarse corto.
import { h, makeCanvas, slider } from '../ui.js';
import { curveData, polyFit, polyEval, mse } from '../ml.js';

const W = 560, H = 340;
const LV = [
  { kind: 'sin', n: 14, noise: .25, seed: 5, label: 'Grado del polinomio', max: 12, reg: false },
  { kind: 'quad', n: 10, noise: .3, seed: 21, label: 'Grado del polinomio', max: 9, reg: false },
  { kind: 'sin', n: 14, noise: .25, seed: 5, label: 'Regularización λ', max: 12, reg: true },
];

export default {
  id: 7, title: 'Memorizar vs. aprender', icon: '📈', lesson: 7, color: '#a3ff3d',
  blurb: 'Ajusta una curva a puntos con ruido. Más complejidad baja el error de entrenamiento… hasta que el examen te hunde.',
  levels: [{ name: 'La U del error', desc: 'Elige el grado' }, { name: 'Pocos datos', desc: 'Menos puntos, más peligro' }, { name: 'Regularización', desc: 'Domar un modelo enorme' }],
  mount(root, li, api) {
    const L = LV[li];
    const tr = curveData(L.seed, L.kind, L.n, L.noise), te = curveData(L.seed + 1, L.kind, 300, L.noise);
    const { cv, c } = makeCanvas(W, H);
    const lams = [1e-7, 1e-5, 1e-3, 1e-2, 3e-2, 0.1, 0.3, 1, 3];
    let deg = L.reg ? 12 : 1, lam = L.reg ? 0 : 1e-7;
    const stat = h('div.stat'), msg = h('div');
    const fit = () => polyFit(tr.xs, tr.ys, deg, lam);
    const best = (() => { let b = Infinity; if (L.reg) lams.forEach((l) => { b = Math.min(b, mse(polyFit(tr.xs, tr.ys, 12, l), te.xs, te.ys)); }); else for (let d = 1; d <= L.max; d++) b = Math.min(b, mse(polyFit(tr.xs, tr.ys, d), te.xs, te.ys)); return b; })();
    const sx = (x) => ((x + 1) / 2) * W, sy = (y) => H / 2 - (y * H) / 4.2;
    function redraw() {
      const w = fit();
      c.clearRect(0, 0, W, H);
      c.strokeStyle = 'rgba(37,44,69,.9)'; c.beginPath(); c.moveTo(0, sy(0)); c.lineTo(W, sy(0)); c.stroke();
      te.xs.forEach((x, i) => { if (i % 4) return; c.fillStyle = 'rgba(255,181,52,.35)'; c.beginPath(); c.arc(sx(x), sy(te.ys[i]), 3, 0, 7); c.fill(); });
      c.strokeStyle = 'rgba(163,255,61,.6)'; c.setLineDash([5, 5]); c.beginPath(); for (let i = 0; i <= 100; i++) { const x = -1 + i / 50; i ? c.lineTo(sx(x), sy(te.f(x))) : c.moveTo(sx(x), sy(te.f(x))); } c.stroke(); c.setLineDash([]);
      c.strokeStyle = '#ff3df0'; c.lineWidth = 3; c.beginPath(); for (let i = 0; i <= 200; i++) { const x = -1 + i / 100, y = Math.max(-1.6, Math.min(1.6, polyEval(w, x))); i ? c.lineTo(sx(x), sy(y)) : c.moveTo(sx(x), sy(y)); } c.stroke(); c.lineWidth = 1;
      tr.xs.forEach((x, i) => { c.fillStyle = '#22e4ff'; c.beginPath(); c.arc(sx(x), sy(tr.ys[i]), 6, 0, 7); c.fill(); });
      const e1 = mse(w, tr.xs, tr.ys), e2 = mse(w, te.xs, te.ys);
      const diag = e2 > best * 2.5 && e1 < e2 / 3 ? ['SOBREAJUSTE', 'rd'] : e1 > best * 1.8 ? ['INFRAAJUSTE', 'am'] : ['buen ajuste', 'li'];
      stat.replaceChildren(h('div', h('b', e1.toFixed(3)), 'error entrenamiento'), h('div', h('b.' + diag[1], e2 > 50 ? '>50' : e2.toFixed(3)), 'error examen'), h('div', h('b.' + diag[1], diag[0]), 'diagnóstico'));
      return e2;
    }
    const sl = L.reg ? slider(L.label + ' (modelo fijo: grado 12)', 0, lams.length - 1, 1, 0, (v) => { lam = lams[v]; redraw(); }, (v) => lams[v].toExponential(0))
                     : slider(L.label, 1, L.max, 1, deg, (v) => { deg = v; redraw(); }, (v) => v);
    root.append(h('div.two', h('div', cv, h('p.sm.mut', h('span.cy', '● entrenamiento'), '  ', h('span.am', '● examen (datos nuevos)'), '  ', h('span.li', '┄ realidad'), '  ', h('span.ma', '━ tu modelo'))),
      h('div', h('div.goal', L.reg ? 'El modelo tiene 13 parámetros para 14 puntos: se vuelve loco. Sube la regularización λ para penalizar pesos enormes y suavizar la curva.' : 'Elige la complejidad del modelo para minimizar el ', h('b', 'error en el examen'), ', no el de entrenamiento.'), sl.el, stat,
        h('button.btn.l', { onclick: () => { const e2 = redraw(); const r = e2 / best; if (r <= 1.25) api.win(3, `Error de examen ${e2.toFixed(3)}: casi el óptimo.`); else if (r <= 1.8) api.win(2, `Error ${e2.toFixed(3)}: bien, pero se puede afinar.`); else if (r <= 3) api.win(1, `Error ${e2.toFixed(3)}: pasable.`); else { msg.replaceChildren(h('p.rd', 'Mucho error en el examen. Mira la curva rosa frente a la línea verde de la realidad.')); api.sfx('bad'); } } }, '🎓 Entregar modelo'), msg)));
    redraw();
  },
};
