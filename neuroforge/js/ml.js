// Núcleo de IA de NeuroForge: algoritmos reales, puros y sin dependencias.
// Todo lo que ves en los minijuegos se calcula con estas funciones.

export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function gauss(r) {
  const u = Math.max(r(), 1e-9), v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ---------- k-NN ---------- */
export function knnPredict(train, p, k) {
  const d = train.map((t) => ({ c: t.c, d: (t.x - p.x) ** 2 + (t.y - p.y) ** 2 }));
  d.sort((a, b) => a.d - b.d);
  const votes = {};
  for (let i = 0; i < Math.min(k, d.length); i++) votes[d[i].c] = (votes[d[i].c] || 0) + 1 + (-d[i].d) * 1e-9;
  return Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0] | 0;
}
export function knnAccuracy(train, test, k) {
  let ok = 0;
  for (const p of test) if (knnPredict(train, p, k) === p.c) ok++;
  return ok / test.length;
}
// Dos nubes que se solapan + ruido de etiquetas: k=1 memoriza el ruido.
export function monsterData(seed, n, noise) {
  const r = rng(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const c = i % 2;
    const cx = c ? 0.62 : 0.38, cy = c ? 0.58 : 0.42;
    let x = cx + gauss(r) * 0.15, y = cy + gauss(r) * 0.15;
    x = Math.min(0.98, Math.max(0.02, x)); y = Math.min(0.98, Math.max(0.02, y));
    const truth = (x + y) > 1 ? 1 : 0;           // frontera "real"
    const label = r() < noise ? 1 - truth : truth; // etiqueta con ruido
    pts.push({ x, y, c: label, truth });
  }
  return pts;
}

/* ---------- k-means ---------- */
export function kmAssign(points, cents) {
  return points.map((p) => {
    let best = 0, bd = Infinity;
    cents.forEach((c, i) => { const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2; if (d < bd) { bd = d; best = i; } });
    return best;
  });
}
export function kmUpdate(points, assign, cents) {
  return cents.map((c, i) => {
    const m = points.filter((_, j) => assign[j] === i);
    if (!m.length) return { ...c };
    return { x: m.reduce((s, p) => s + p.x, 0) / m.length, y: m.reduce((s, p) => s + p.y, 0) / m.length };
  });
}
export function kmInertia(points, assign, cents) {
  return points.reduce((s, p, j) => s + (p.x - cents[assign[j]].x) ** 2 + (p.y - cents[assign[j]].y) ** 2, 0);
}
export function blobs(seed, centers, n, spread = 0.07) {
  const r = rng(seed);
  const out = [];
  for (let i = 0; i < n; i++) {
    const c = centers[i % centers.length];
    out.push({ x: Math.min(.98, Math.max(.02, c.x + gauss(r) * spread)), y: Math.min(.98, Math.max(.02, c.y + gauss(r) * spread)), g: i % centers.length });
  }
  return out;
}

/* ---------- Descenso de gradiente ---------- */
export const LANDSCAPES = [
  { name: 'Valle liso', f: (x) => x * x, df: (x) => 2 * x, xmin: -3, xmax: 3, start: 2.6, best: 0 },
  { name: 'Valle estrecho', f: (x) => 4 * x * x, df: (x) => 8 * x, xmin: -3, xmax: 3, start: -2.4, best: 0 },
  { name: 'Montañas con trampa', f: (x) => 0.18 * x * x * x * x - 0.9 * x * x + 0.55 * x + 1.6, df: (x) => 0.72 * x ** 3 - 1.8 * x + 0.55, xmin: -3.4, xmax: 3.4, start: 2.7, best: -1.7 },
];
export function gdRun(land, lr, steps = 60, momentum = 0) {
  let x = land.start, v = 0;
  const path = [x];
  for (let i = 0; i < steps; i++) {
    v = momentum * v - lr * land.df(x);
    x += v;
    if (!isFinite(x) || Math.abs(x) > 1e6) { path.push(x > 0 ? 1e6 : -1e6); break; }
    path.push(x);
  }
  return path;
}

/* ---------- Neurona ---------- */
export const sigmoid = (z) => 1 / (1 + Math.exp(-z));
export function neuron(w1, w2, b, x, y) { return w1 * x + w2 * y + b > 0 ? 1 : 0; }
export function perceptronTrain(points, w, lr = 0.1, epochs = 1) {
  let [w1, w2, b] = w;
  for (let e = 0; e < epochs; e++) {
    for (const p of points) {
      const err = p.c - neuron(w1, w2, b, p.x, p.y);
      w1 += lr * err * p.x; w2 += lr * err * p.y; b += lr * err;
    }
  }
  return [w1, w2, b];
}
export const GATES = {
  AND: (a, b) => (a && b ? 1 : 0), OR: (a, b) => (a || b ? 1 : 0),
  NAND: (a, b) => (a && b ? 0 : 1), NOR: (a, b) => (a || b ? 0 : 1),
};
export function xorNet(h1, h2, out) {
  return [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => GATES[out](GATES[h1](a, b), GATES[h2](a, b)));
}

/* ---------- Sobreajuste ---------- */
export function polyFit(xs, ys, deg, lambda = 1e-7) {
  const n = deg + 1;
  const A = Array.from({ length: n }, () => new Array(n + 1).fill(0));
  for (let i = 0; i < xs.length; i++) {
    const pw = [1];
    for (let j = 1; j <= 2 * deg; j++) pw[j] = pw[j - 1] * xs[i];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) A[r][c] += pw[r + c];
      A[r][n] += pw[r] * ys[i];
    }
  }
  for (let r = 0; r < n; r++) A[r][r] += lambda;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = c + 1; r < n; r++) {
      const f = A[r][c] / A[c][c];
      for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k];
    }
  }
  const w = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = A[r][n];
    for (let k = r + 1; k < n; k++) s -= A[r][k] * w[k];
    w[r] = s / A[r][r];
  }
  return w;
}
export const polyEval = (w, x) => w.reduce((s, c, i) => s + c * x ** i, 0);
export const mse = (w, xs, ys) => xs.reduce((s, x, i) => s + (polyEval(w, x) - ys[i]) ** 2, 0) / xs.length;
export function curveData(seed, kind, n, noise) {
  const r = rng(seed);
  const f = kind === 'sin' ? (x) => Math.sin(2.2 * x) : kind === 'quad' ? (x) => 1.4 * x * x - 0.6 : (x) => 0.9 * x + 0.1;
  const xs = [], ys = [];
  for (let i = 0; i < n; i++) { const x = -1 + 2 * r(); xs.push(x); ys.push(f(x) + gauss(r) * noise); }
  return { xs, ys, f };
}

/* ---------- Sesgo (regresión logística) ---------- */
export function biasData(seed = 7, n = 600) {
  const r = rng(seed);
  const rows = [];
  for (let i = 0; i < n; i++) {
    const g = r() < 0.35 ? 1 : 0;
    const income = 50 + gauss(r) * 15;
    const zip = r() < 0.88 ? g : 1 - g;                  // código postal: proxy del grupo
    const skill = income + gauss(r) * 7;                  // capacidad real de pago
    const fair = skill > 50 ? 1 : 0;
    const hist = (skill - (g ? 11 : 0)) > 50 ? 1 : 0;     // decisión histórica sesgada
    rows.push({ g, zip, income, fair, hist });
  }
  return rows;
}
export function logisticTrain(X, y, w, epochs = 300, lr = 0.5) {
  const d = X[0].length;
  let th = new Array(d + 1).fill(0);
  const sw = w || y.map(() => 1);
  const W = sw.reduce((a, b) => a + b, 0);
  for (let e = 0; e < epochs; e++) {
    const g = new Array(d + 1).fill(0);
    for (let i = 0; i < X.length; i++) {
      let z = th[d];
      for (let j = 0; j < d; j++) z += th[j] * X[i][j];
      const err = (sigmoid(z) - y[i]) * sw[i];
      for (let j = 0; j < d; j++) g[j] += err * X[i][j];
      g[d] += err;
    }
    for (let j = 0; j <= d; j++) th[j] -= (lr * g[j]) / W;
  }
  return th;
}
export function biasRun(rows, opt) {
  const feats = (r) => {
    const f = [(r.income - 50) / 15];
    if (opt.useZip) f.push(r.zip * 2 - 1);
    if (opt.useGroup) f.push(r.g * 2 - 1);
    return f;
  };
  const X = rows.map(feats);
  const y = rows.map((r) => (opt.fixLabels ? r.fair : r.hist));
  const w = opt.reweight ? rows.map((r) => (r.g ? 1.9 : 1)) : null;
  const th = logisticTrain(X, y, w);
  const d = X[0].length;
  const score = X.map((x) => { let z = th[d]; for (let j = 0; j < d; j++) z += th[j] * x[j]; return sigmoid(z); });
  const thr = [0.5, 0.5];
  if (opt.equalize) {
    // Umbral por grupo: busca el umbral del grupo 1 que iguala la tasa de aprobación del grupo 0
    const s0 = score.filter((_, i) => !rows[i].g).sort((a, b) => a - b);
    const s1 = score.filter((_, i) => rows[i].g).sort((a, b) => a - b);
    const rate0 = score.filter((s, i) => !rows[i].g && s > 0.5).length / s0.length;
    thr[1] = s1[Math.min(s1.length - 1, Math.max(0, Math.floor((1 - rate0) * s1.length)))] - 1e-9;
  }
  const pred = score.map((s, i) => (s > thr[rows[i].g] ? 1 : 0));
  const rate = (g) => { const ix = rows.map((r, i) => i).filter((i) => rows[i].g === g); return ix.filter((i) => pred[i]).length / ix.length; };
  const acc = pred.filter((p, i) => p === rows[i].fair).length / rows.length;
  const accHist = pred.filter((p, i) => p === rows[i].hist).length / rows.length;
  return { rate0: rate(0), rate1: rate(1), gap: Math.abs(rate(0) - rate(1)), acc, accHist };
}

/* ---------- Minimax (tres en raya) ---------- */
export const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
export function winner(b) {
  for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return b.every(Boolean) ? 'T' : null;
}
export function minimax(b, player, ai, alphaBeta, stats, alpha = -Infinity, beta = Infinity, depth = 0) {
  stats.nodes++;
  const w = winner(b);
  if (w === ai) return 10 - depth;
  if (w && w !== 'T') return depth - 10;
  if (w === 'T') return 0;
  const me = player === ai;
  let best = me ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = player;
    const s = minimax(b, player === 'X' ? 'O' : 'X', ai, alphaBeta, stats, alpha, beta, depth + 1);
    b[i] = null;
    if (me) { best = Math.max(best, s); alpha = Math.max(alpha, best); } else { best = Math.min(best, s); beta = Math.min(beta, best); }
    if (alphaBeta && beta <= alpha) break;
  }
  return best;
}
export function bestMove(b, ai, alphaBeta = true, rand = null, mistake = 0) {
  const stats = { nodes: 0 };
  const moves = [];
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = ai;
    const s = minimax(b, ai === 'X' ? 'O' : 'X', ai, alphaBeta, stats);
    b[i] = null;
    moves.push({ i, s });
  }
  moves.sort((a, c) => c.s - a.s);
  let pick = moves[0];
  if (rand && mistake && rand() < mistake) pick = moves[Math.floor(rand() * moves.length)];
  return { move: pick.i, nodes: stats.nodes, moves };
}

/* ---------- Q-learning en una rejilla ---------- */
// Mapa: '.' vacío, '#' muro, 'S' inicio, 'G' meta, 'L' lava, 'C' moneda
export function parseGrid(rows) {
  const h = rows.length, w = rows[0].length;
  const cells = rows.map((r) => r.split(''));
  let start = [0, 0];
  cells.forEach((r, y) => r.forEach((c, x) => { if (c === 'S') start = [x, y]; }));
  return { w, h, cells, start };
}
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
export function gridStep(g, pos, a, rewards, coinState) {
  const [x, y] = pos;
  const nx = x + DIRS[a][0], ny = y + DIRS[a][1];
  if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h || g.cells[ny][nx] === '#') return { pos, r: rewards.wall, done: false };
  const c = g.cells[ny][nx];
  if (c === 'G') return { pos: [nx, ny], r: rewards.goal, done: true };
  if (c === 'L') return { pos: [nx, ny], r: rewards.lava, done: true };
  if (c === 'C') return { pos: [nx, ny], r: rewards.coin, done: false, coin: true };
  return { pos: [nx, ny], r: rewards.step, done: false };
}
export function qTrain(g, rewards, { episodes = 400, alpha = 0.5, gamma = 0.95, eps = 0.2, seed = 1, maxSteps = 60 } = {}) {
  const r = rng(seed);
  const Q = {};
  const q = (x, y) => (Q[x + ',' + y] ||= [0, 0, 0, 0]);
  for (let e = 0; e < episodes; e++) {
    let pos = [...g.start];
    for (let s = 0; s < maxSteps; s++) {
      const qs = q(pos[0], pos[1]);
      const a = r() < eps ? Math.floor(r() * 4) : qs.indexOf(Math.max(...qs));
      const res = gridStep(g, pos, a, rewards);
      const nq = res.done ? 0 : Math.max(...q(res.pos[0], res.pos[1]));
      qs[a] += alpha * (res.r + gamma * nq - qs[a]);
      pos = res.pos;
      if (res.done) break;
    }
  }
  return Q;
}
export function qPolicyRun(g, Q, rewards, maxSteps = 40) {
  let pos = [...g.start];
  const path = [pos];
  let outcome = 'timeout', coins = 0;
  for (let s = 0; s < maxSteps; s++) {
    const qs = Q[pos[0] + ',' + pos[1]] || [0, 0, 0, 0];
    const a = qs.indexOf(Math.max(...qs));
    const res = gridStep(g, pos, a, rewards);
    if (res.coin) coins++;
    pos = res.pos; path.push(pos);
    if (res.done) { outcome = g.cells[pos[1]][pos[0]] === 'G' ? 'goal' : 'lava'; break; }
  }
  return { path, outcome, coins };
}
