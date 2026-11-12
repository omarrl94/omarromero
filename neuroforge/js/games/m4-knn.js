// Misión 4 · Monstruos k-NN: elige k y supera el examen con datos nuevos.
import { h, makeCanvas, canvasPos, slider } from '../ui.js';
import { monsterData, knnPredict, knnAccuracy } from '../ml.js';

const W = 480, H = 400;
const LV = [
  { n: 60, noise: 0.1, target: 0.88, seed: 11, hint: 'Pocos errores de etiquetado: casi cualquier k decente sirve.' },
  { n: 80, noise: 0.22, target: 0.87, seed: 21, hint: 'Muchas etiquetas erróneas: k=1 las copia todas. Necesitas votar entre más vecinos.' },
  { n: 36, noise: 0.2, target: 0.8, seed: 31, hint: 'Pocos datos y ruido: ¡cuidado con pasarte de k, también hay infraajuste!' },
];

export default {
  id: 4, title: 'Monstruos k-NN', icon: '👾', lesson: 4, color: '#ff3df0',
  blurb: 'Dos especies de monstruos con datos sucios. Elige el número de vecinos que mejor generaliza.',
  levels: [{ name: 'Territorio limpio', desc: 'Poco ruido' }, { name: 'Datos ruidosos', desc: 'Etiquetas erróneas' }, { name: 'Pocos datos', desc: 'Equilibrio fino' }],
  mount(root, li, api) {
    const L = LV[li];
    const train = monsterData(L.seed, L.n, L.noise);
    const test = monsterData(L.seed + 500, 400, 0).map((p) => ({ ...p, c: p.truth }));   // examen: etiquetas verdaderas
    const { cv, c } = makeCanvas(W, H);
    let k = 1, probe = null;
    const stat = h('div.stat'), msg = h('div');
    const COLS = ['34,228,255', '255,61,240'];
    const redraw = () => {
      c.clearRect(0, 0, W, H);
      const cell = 12;
      for (let gx = 0; gx < W; gx += cell) for (let gy = 0; gy < H; gy += cell) {
        const cls = knnPredict(train, { x: (gx + cell / 2) / W, y: (gy + cell / 2) / H }, k);
        c.fillStyle = `rgba(${COLS[cls]},.13)`; c.fillRect(gx, gy, cell, cell);
      }
      train.forEach((p) => { c.fillStyle = `rgb(${COLS[p.c]})`; c.beginPath(); c.arc(p.x * W, p.y * H, 5.5, 0, 7); c.fill(); c.strokeStyle = p.c !== p.truth ? '#ffb534' : 'rgba(0,0,0,.5)'; c.lineWidth = p.c !== p.truth ? 2 : 1; c.stroke(); });
      if (probe) {
        const near = [...train].sort((a, b) => (a.x - probe.x) ** 2 + (a.y - probe.y) ** 2 - ((b.x - probe.x) ** 2 + (b.y - probe.y) ** 2)).slice(0, k);
        c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1; near.forEach((p) => { c.beginPath(); c.moveTo(probe.x * W, probe.y * H); c.lineTo(p.x * W, p.y * H); c.stroke(); });
        const cls = knnPredict(train, probe, k);
        c.fillStyle = '#fff'; c.beginPath(); c.arc(probe.x * W, probe.y * H, 9, 0, 7); c.fill(); c.fillStyle = `rgb(${COLS[cls]})`; c.beginPath(); c.arc(probe.x * W, probe.y * H, 6, 0, 7); c.fill();
      }
      const tr = knnAccuracy(train, train, k) * 100, te = knnAccuracy(train, test, k) * 100;
      stat.replaceChildren(h('div', h('b', k), 'vecinos (k)'), h('div', h('b', tr.toFixed(0) + '%'), 'acierto en entrenamiento'), h('div', h('b.' + (te >= L.target * 100 ? 'li' : 'rd'), te.toFixed(0) + '%'), `acierto en examen (meta ${L.target * 100}%)`));
      return te;
    };
    cv.addEventListener('pointerdown', (e) => { const p = canvasPos(cv, e, W, H); probe = { x: p.x / W, y: p.y / H }; redraw(); });
    const s = slider('k', 1, Math.min(31, L.n - 1), 1, k, (v) => { k = v; redraw(); }, (v) => v);
    root.append(h('div.two', h('div', cv), h('div',
      h('div.goal', 'Los círculos con borde ', h('b.am', 'naranja'), ' son monstruos mal etiquetados (ruido). Ajusta ', h('b', 'k'), ' para que el modelo acierte en el examen (400 monstruos nuevos). ', h('i.mut', L.hint)),
      s.el, stat, h('p.sm.mut', '💡 Toca el mapa para lanzar un monstruo nuevo y ver qué vecinos votan.'),
      h('button.btn.l', { onclick: () => { const te = redraw() / 100; if (te >= L.target) { const best = Math.max(...Array.from({ length: Math.min(31, L.n - 1) }, (_, i) => knnAccuracy(train, test, i + 1))); api.win(te >= best - 0.01 ? 3 : te >= L.target + 0.03 ? 2 : 1, `Examen: ${(te * 100).toFixed(0)} % con k=${k}.`); } else { msg.replaceChildren(h('p.rd', `Solo ${(te * 100).toFixed(0)} %. ${k < 4 ? 'Con tan pocos vecinos memorizas el ruido.' : 'Con tantos vecinos la frontera se vuelve demasiado simple.'}`)); api.sfx('bad'); } } }, '📝 Presentarme al examen'), msg)));
    redraw();
  },
};
