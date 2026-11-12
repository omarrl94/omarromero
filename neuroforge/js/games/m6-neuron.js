// Misión 6 · Neuronas: ajusta una a mano, entrénala y cablea una red que resuelva XOR.
import { h, makeCanvas, COL, slider } from '../ui.js';
import { rng, gauss, neuron, perceptronTrain, GATES, xorNet } from '../ml.js';

const W = 460, H = 400;
function dataset(seed, n, margin) {
  const r = rng(seed), pts = [];
  while (pts.length < n) { const x = r(), y = r(); const d = (x + y - 1) / Math.SQRT2; if (Math.abs(d) < margin) continue; pts.push({ x, y, c: d > 0 ? 1 : 0 }); }
  return pts;
}
function paint(c, pts, w, show = true) {
  c.clearRect(0, 0, W, H);
  if (show) for (let gx = 0; gx < W; gx += 10) for (let gy = 0; gy < H; gy += 10) { const o = neuron(w[0], w[1], w[2], (gx + 5) / W, 1 - (gy + 5) / H); c.fillStyle = o ? 'rgba(255,61,240,.12)' : 'rgba(34,228,255,.12)'; c.fillRect(gx, gy, 10, 10); }
  pts.forEach((p) => { const ok = neuron(w[0], w[1], w[2], p.x, p.y) === p.c; c.fillStyle = COL[p.c]; c.beginPath(); c.arc(p.x * W, (1 - p.y) * H, 6, 0, 7); c.fill(); c.strokeStyle = ok ? 'rgba(0,0,0,.5)' : '#fff'; c.lineWidth = ok ? 1 : 2.5; c.stroke(); });
}

export default {
  id: 6, title: 'Neuronas y redes', icon: '🕸️', lesson: 6, color: '#22e4ff',
  blurb: 'Gira los pesos de una neurona, entrénala con el algoritmo del perceptrón y resuelve el problema XOR con una capa oculta.',
  levels: [{ name: 'A mano', desc: 'Ajusta w1, w2, b' }, { name: 'Entrénala', desc: 'Perceptrón' }, { name: 'XOR', desc: 'Capa oculta' }],
  mount(root, li, api) {
    if (li === 2) return xor(root, api);
    const pts = li === 0 ? dataset(5, 26, 0.09) : dataset(9, 40, 0.03);
    const { cv, c } = makeCanvas(W, H);
    let w = li === 0 ? [1, -1, 0] : [0.5, -0.8, 0.4];
    const acc = () => pts.filter((p) => neuron(w[0], w[1], w[2], p.x, p.y) === p.c).length / pts.length;
    const stat = h('div.stat'), msg = h('div'); let epochs = 0, lr = 0.2;
    const sl = [slider('peso w1', -5, 5, .1, w[0], (v) => { w[0] = v; ref(); }, (v) => v.toFixed(1)), slider('peso w2', -5, 5, .1, w[1], (v) => { w[1] = v; ref(); }, (v) => v.toFixed(1)), slider('sesgo b', -5, 5, .1, w[2], (v) => { w[2] = v; ref(); }, (v) => v.toFixed(1))];
    function ref() {
      paint(c, pts, w);
      const a = acc(); stat.replaceChildren(h('div', h('b.' + (a === 1 ? 'li' : 'cy'), (a * 100).toFixed(0) + '%'), 'aciertos'), li ? h('div', h('b', epochs), 'épocas') : '', h('div', h('b', `${w[0].toFixed(1)}x + ${w[1].toFixed(1)}y + ${w[2].toFixed(1)}`), 'z'));
      sl.forEach((s, i) => s.set(Math.max(-5, Math.min(5, w[i]))));
      return a;
    }
    root.append(h('div.two', h('div', cv), h('div', h('div.goal', li === 0 ? ['Mueve ', h('b', 'w1, w2 y b'), ' hasta que la línea de decisión separe los ', h('b.cy', 'cian'), ' de los ', h('b.ma', 'magenta'), ' (100 %). Los puntos mal clasificados tienen borde blanco.'] : ['Ahora no toques los pesos: pulsa ', h('b', '«Entrenar 1 época»'), '. El perceptrón ajusta los pesos tras cada error. Llega al ', h('b', '100 %'), ' en el mínimo número de épocas.']),
      li === 0 ? sl.map((s) => s.el) : [slider('Tasa aprendizaje', 0.01, 1, 0.01, lr, (v) => { lr = v; }, (v) => v.toFixed(2)).el,
        h('div.row', h('button.btn', { onclick: () => { w = perceptronTrain(pts, w, lr, 1); epochs++; api.sfx('tick'); ref(); check(); } }, '🏋 Entrenar 1 época'), h('button.btn.g', { onclick: () => { w = [0.5, -0.8, 0.4]; epochs = 0; msg.replaceChildren(); ref(); } }, '↺ Reiniciar'))],
      stat, li === 0 ? h('button.btn.l', { onclick: () => { const a = ref(); if (a === 1) api.win(3, 'Línea perfecta.'); else { msg.replaceChildren(h('p.rd', `Aún fallas ${Math.round((1 - a) * pts.length)} punto(s).`)); api.sfx('bad'); } } }, '✔ Comprobar') : '', msg)));
    function check() { if (acc() === 1) api.win(epochs <= 4 ? 3 : epochs <= 10 ? 2 : 1, `Perceptrón convergido en ${epochs} épocas.`); else if (epochs >= 40) msg.replaceChildren(h('p.am', 'Sigue sin converger: prueba otra tasa de aprendizaje o reinicia.')); }
    ref();
  },
};

function xor(root, api) {
  const names = Object.keys(GATES);
  let h1 = 'AND', h2 = 'AND', out = 'AND', tries = 0;
  const sel = (val, on) => h('select', { onchange: (e) => on(e.target.value) }, names.map((n) => h('option', { value: n, selected: n === val }, n)));
  const tbl = h('div'), msg = h('div');
  const update = () => {
    const res = xorNet(h1, h2, out);
    tbl.replaceChildren(h('table.t', h('tr', ['x1', 'x2', 'objetivo (XOR)', 'tu red'].map((t) => h('th', t))), ...[[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b], i) => h('tr', h('td', a), h('td', b), h('td', (a ^ b)), h('td', { style: { color: res[i] === (a ^ b) ? '#a3ff3d' : '#ff4767', fontWeight: 700 } }, res[i] + (res[i] === (a ^ b) ? ' ✔' : ' ✘'))))));
    return res.join() === '0,1,1,0';
  };
  root.append(h('div.goal', 'Una sola neurona NO puede resolver ', h('b', 'XOR'), ' (1 si las entradas son distintas). Pero una red con ', h('b', 'capa oculta'), ' sí. Cada neurona calcula una puerta lógica. Elige las dos neuronas ocultas y la de salida para que la red dé 0,1,1,0.'),
    h('div.glass', h('div.row', { style: { justifyContent: 'center' } },
      h('div.c', h('div.mut.sm', 'Entradas'), h('div', 'x1  x2'), h('div', '⟶')),
      h('div.c', h('div.mut.sm', 'Capa oculta'), h('div', 'neurona A: ', sel(h1, (v) => { h1 = v; update(); })), h('div', { style: { marginTop: '6px' } }, 'neurona B: ', sel(h2, (v) => { h2 = v; update(); }))),
      h('div.c', '⟶'), h('div.c', h('div.mut.sm', 'Salida'), h('div', 'neurona S: ', sel(out, (v) => { out = v; update(); }))))),
    tbl, h('button.btn.l', { onclick: () => { tries++; if (update()) api.win(tries <= 2 ? 3 : tries <= 5 ? 2 : 1, `¡Red XOR cableada! A=${h1}, B=${h2}, S=${out}.`); else { msg.replaceChildren(h('p.rd', 'Todavía no. Pista: XOR = «(x1 OR x2) pero NO (x1 AND x2)». ¿Qué puerta es «NO AND»?')); api.sfx('bad'); } } }, '⚡ Probar red'), msg);
  update();
}
