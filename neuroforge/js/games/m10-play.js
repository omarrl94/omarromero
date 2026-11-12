// Misión 10 · IA que juega: minimax en el tres en raya y Q-learning con un robot.
import { h, makeCanvas, slider } from '../ui.js';
import { bestMove, winner, minimax, rng, parseGrid, qTrain, qPolicyRun, gridStep } from '../ml.js';

const MAZE = ['S..#....', '.#.#.##.', '.#...#..', '.####.#.', '......#G'];
const HACK = ['#######', '#CS...#', '#.###.#', '#.....#', '#.###L#', '#....G#'];
const ARROW = ['↑', '→', '↓', '←'];

export default {
  id: 10, title: 'IA que juega', icon: '🎮', lesson: 10, color: '#ff4767',
  blurb: 'Derrota (o empata con) una IA minimax y entrena a un robot con Q-learning… sin que haga trampas.',
  levels: [{ name: 'Tres en raya · novata', desc: 'Gana a una IA con fallos' }, { name: 'Tres en raya · imbatible', desc: 'Minimax + poda α-β' }, { name: 'Robot en el laberinto', desc: 'Q-learning' }, { name: 'El robot tramposo', desc: 'Reward hacking' }],
  mount(root, li, api) { return li < 2 ? ttt(root, li, api) : rl(root, li, api); },
};

function ttt(root, li, api) {
  const r = rng(Date.now() % 100000);
  let b = Array(9).fill(null), over = false, cmpDone = false;
  const board = h('div.ttt'), msg = h('div'), info = h('div.stat');
  const finish = (w) => {
    over = true;
    if (w === 'X') return api.win(3, '¡Le ganaste a la máquina!');
    if (w === 'T') { if (li === 0) { msg.replaceChildren(h('p.am', 'Empate. Contra la novata puedes ganar: inténtalo otra vez.'), h('button.btn', { onclick: reset }, '↺ Otra partida')); return; } return api.win(cmpDone ? 3 : 2, cmpDone ? 'Empate: lo máximo posible contra minimax, y has comparado la poda.' : 'Empate: contra minimax es el mejor resultado posible.'); }
    msg.replaceChildren(h('p.rd', 'Ha ganado la IA.'), h('button.btn', { onclick: reset }, '↺ Revancha')); api.sfx('bad');
  };
  const paint = () => board.replaceChildren(...b.map((v, i) => h('button', { class: v || '', disabled: !!v || over, onclick: () => play(i) }, v || '')));
  function play(i) {
    if (over || b[i]) return;
    b[i] = 'X'; api.sfx('tick'); let w = winner(b); paint(); if (w) return finish(w);
    const bm = bestMove(b, 'O', true, r, li === 0 ? 0.4 : 0);
    b[bm.move] = 'O'; w = winner(b); paint();
    info.replaceChildren(h('div', h('b', bm.nodes.toLocaleString('es-ES')), 'posiciones evaluadas (α-β)'), h('div', h('b', li === 0 ? '40 %' : '0 %'), 'prob. de fallo de la IA'));
    if (w) finish(w);
  }
  function reset() { b = Array(9).fill(null); over = false; msg.replaceChildren(); info.replaceChildren(); paint(); }
  function compare() {
    const e = b.map((v) => v); const turn = e.filter(Boolean).length % 2 === 0 ? 'X' : 'O';
    const a = { nodes: 0 }, c2 = { nodes: 0 };
    minimax(e.slice(), turn, turn, false, a); minimax(e.slice(), turn, turn, true, c2);
    cmpDone = true;
    msg.replaceChildren(h('div.glass', h('p', 'Desde el tablero actual, la IA tendría que explorar:'), h('p', h('b.rd', a.nodes.toLocaleString('es-ES')), ' posiciones con ', h('b', 'minimax puro'), ' vs. ', h('b.li', c2.nodes.toLocaleString('es-ES')), ' con ', h('b', 'poda alfa-beta'), ` (${(a.nodes / Math.max(1, c2.nodes)).toFixed(1)}× menos), con exactamente el mismo resultado.`)));
  }
  root.append(h('div.goal', li === 0 ? ['Juegas con ', h('b.cy', 'X'), '. La IA (O) es minimax, pero ', h('b', 'falla el 40 % de las veces'), ' a propósito. ¡Gana la partida!'] : ['La IA ahora es ', h('b', 'minimax perfecto'), ': explora TODAS las partidas posibles. Ganar es matemáticamente imposible: ', h('b', 'consigue el empate'), ' (y compara la poda alfa-beta para la 3ª estrella).']),
    board, info, li === 1 ? h('div.row', { style: { justifyContent: 'center' } }, h('button.btn.m', { onclick: compare }, '✂ Comparar con poda α-β'), h('button.btn.g', { onclick: reset }, '↺ Reiniciar')) : '', msg);
  paint();
}

function rl(root, li, api) {
  const hack = li === 3;
  const g = parseGrid(hack ? HACK : MAZE);
  const CW = 56, W = g.w * CW, H = g.h * CW;
  const { cv, c } = makeCanvas(W, H);
  const P = hack ? { episodes: 400, eps: .2, alpha: .5, gamma: .95, coin: 6 } : { episodes: 10, eps: 0, alpha: .5, gamma: .95, coin: 0 };
  let Q = null, trained = 0, anim = null, path = null, pi = 0;
  const msg = h('div'), info = h('div.stat');
  const rewards = () => ({ step: -1, wall: -2, goal: 50, lava: -50, coin: P.coin });
  function draw() {
    c.clearRect(0, 0, W, H);
    const maxQ = Q ? Math.max(1, ...Object.values(Q).map((q) => Math.max(...q))) : 1;
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const ch = g.cells[y][x]; const px = x * CW, py = y * CW;
      c.fillStyle = ch === '#' ? '#252c45' : ch === 'L' ? 'rgba(255,71,103,.4)' : ch === 'G' ? 'rgba(163,255,61,.35)' : '#0d1019';
      if (Q && Q[x + ',' + y] && ch !== '#') { const m = Math.max(...Q[x + ',' + y]); c.fillStyle = `rgba(34,228,255,${Math.max(0, Math.min(.45, m / maxQ * .45))})`; }
      c.fillRect(px + 1, py + 1, CW - 2, CW - 2);
      c.font = '26px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      if (ch === 'L') c.fillText('🔥', px + CW / 2, py + CW / 2); if (ch === 'G') c.fillText('🏁', px + CW / 2, py + CW / 2); if (ch === 'C') c.fillText('🪙', px + CW / 2, py + CW / 2);
      if (Q && Q[x + ',' + y] && ch !== '#' && ch !== 'G' && ch !== 'L') { const q = Q[x + ',' + y]; c.fillStyle = '#d6dcff'; c.font = '16px monospace'; c.fillText(ARROW[q.indexOf(Math.max(...q))], px + CW / 2, py + CW / 2 + (ch === 'C' ? 18 : 0)); }
    }
    if (path) { const [rx, ry] = path[Math.min(pi, path.length - 1)]; c.font = '30px serif'; c.fillText('🤖', rx * CW + CW / 2, ry * CW + CW / 2); }
    else { c.font = '30px serif'; c.fillText('🤖', g.start[0] * CW + CW / 2, g.start[1] * CW + CW / 2); }
  }
  function train() {
    cancelAnimationFrame(anim); path = null;
    Q = qTrain(g, rewards(), { episodes: P.episodes, alpha: P.alpha, gamma: P.gamma, eps: P.eps, seed: 3 }); trained = P.episodes;
    const run = qPolicyRun(g, Q, rewards(), 40);
    info.replaceChildren(h('div', h('b', trained), 'episodios entrenados'), h('div', h('b', Object.keys(Q).length), 'estados con conocimiento'));
    msg.replaceChildren(h('p.mut', 'Entrenado. Pulsa «Ver al robot» para que ejecute lo aprendido (siempre la mejor acción).')); draw(); return run;
  }
  function watch() {
    if (!Q) return msg.replaceChildren(h('p.am', 'Primero entrena al robot.'));
    const run = qPolicyRun(g, Q, rewards(), 40); path = run.path; pi = 0; let last = 0;
    const tick = (t) => { if (t - last > 180) { last = t; draw(); if (pi >= path.length - 1) return end(run); pi++; } anim = requestAnimationFrame(tick); };
    anim = requestAnimationFrame(tick);
  }
  function end(run) {
    if (run.outcome === 'goal') {
      if (hack && run.coins > 0 && P.coin > 2) { msg.replaceChildren(h('p.am', 'Llegó, pero pasando por la moneda… ¡y casi se queda!')); }
      const s = hack ? (P.coin <= 0 ? 3 : 2) : trained <= 60 ? 3 : trained <= 150 ? 2 : 1;
      return api.win(s, hack ? `El robot termina el nivel (recompensa de moneda: ${P.coin}).` : `Robot en la meta tras ${trained} episodios.`);
    }
    api.sfx('bad');
    if (run.outcome === 'lava') msg.replaceChildren(h('p.rd', '🔥 Cayó en la lava. Aún no ha aprendido bien: más episodios o más exploración.'));
    else if (hack && run.coins > 3) msg.replaceChildren(h('p.rd', `🪙 Cogió la moneda ${run.coins} veces y NUNCA fue a la meta. ¡Reward hacking! Está maximizando tu recompensa, no tu intención. Baja la recompensa de la moneda.`));
    else msg.replaceChildren(h('p.am', '⏱ Se quedó vagando sin llegar. Necesita más episodios y exploración (ε) para descubrir el camino.'));
  }
  const sls = [
    !hack ? slider('Episodios', 10, 600, 10, P.episodes, (v) => { P.episodes = v; }, (v) => v) : null,
    !hack ? slider('Exploración ε', 0, 0.6, 0.05, P.eps, (v) => { P.eps = v; }, (v) => v.toFixed(2)) : null,
    slider('Tasa α', 0.1, 1, 0.1, P.alpha, (v) => { P.alpha = v; }, (v) => v.toFixed(1)),
    slider('Futuro γ', 0, 0.99, 0.01, P.gamma, (v) => { P.gamma = v; }, (v) => v.toFixed(2)),
    hack ? slider('Recompensa 🪙 por moneda', -3, 10, 1, P.coin, (v) => { P.coin = v; }, (v) => (v > 0 ? '+' : '') + v) : null,
  ].filter(Boolean);
  root.append(h('div.two', h('div', cv, h('p.sm.mut', 'Recompensas: paso −1 · pared −2 · 🏁 meta +50 · 🔥 lava −50' + (hack ? ' · 🪙 la que elijas' : '') + '. Flechas = mejor acción aprendida.')),
    h('div', h('div.goal', hack ? [h('b', 'El robot tramposo: '), 'hay una moneda a su lado y el valor por defecto es tentador. Entrena y mira qué hace; luego ', h('b', 'corrige la recompensa'), ' para que haga lo que TÚ quieres: llegar a la meta.'] : [h('b', 'Entrena al robot '), 'para que encuentre 🏁 sin caer en 🔥. Con pocos episodios y sin exploración no sabe nada. Menos episodios = más estrellas.']),
      sls.map((s) => s.el), info, h('div.row', h('button.btn', { onclick: train }, '🏋 Entrenar'), h('button.btn.l', { onclick: watch }, '👁 Ver al robot')), msg)));
  draw();
  return () => cancelAnimationFrame(anim);
}
