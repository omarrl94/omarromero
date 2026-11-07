// Pixel-art procedural: criaturas, personajes y casillas del mapa, sin un solo archivo de imagen.
// Las criaturas se dibujan con formas simples en una rejilla de 40×40, se binariza el alfa y se
// les añade contorno: al escalarlas con «vecino más cercano» quedan como sprites de 16 bits.

const S = 40;
const cache = new Map();

function canvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

const ell = (g, x, y, rx, ry, color) => { g.fillStyle = color; g.beginPath(); g.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2); g.fill(); };
const tri = (g, pts, color) => { g.fillStyle = color; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fill(); };
const line = (g, pts, color, w = 1.6) => { g.strokeStyle = color; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.stroke(); };

let probe = null;
const shadeCache = new Map();
/** Oscurece (amt < 0) o aclara (amt > 0) cualquier color CSS, en porcentaje. */
function shade(color, amt) {
  const key = color + amt;
  if (shadeCache.has(key)) return shadeCache.get(key);
  if (!probe) probe = canvas(1, 1).getContext('2d');
  probe.fillStyle = '#000';
  probe.fillStyle = color; // el navegador lo normaliza a #rrggbb
  const hex = String(probe.fillStyle);
  const n = parseInt(hex.slice(1), 16);
  const f = Math.abs(amt) / 100;
  const to = amt < 0 ? 0 : 255;
  const mix = (v) => Math.round(v + (to - v) * f);
  const out = `rgb(${mix((n >> 16) & 255)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
  shadeCache.set(key, out);
  return out;
}

/** Dibuja la criatura en vectorial sobre una rejilla de 40×40. */
function paintCreature(g, look) {
  const st = look.stage || 0;
  const r = 9 + st * 2.2;
  const cx = 20;
  let cy = 25 - st * 0.5;
  const { main, belly, accent } = look;
  const dark = shade(main, -45);
  let bw = r;
  let bh = r * 0.92;
  if (look.body === 'tall') { bw = r * 0.8; bh = r * 1.12; cy -= 1; }
  if (look.body === 'blob') { bw = r * 1.18; bh = r * 0.8; cy += 2; }
  if (look.body === 'bird') { bw = r * 0.95; bh = r * 0.95; }
  if (look.body === 'long') { bw = r * 0.78; bh = r * 0.78; cy -= 4; }
  if (look.body === 'bug') { bw = r * 0.8; bh = r * 0.75; cy -= 2; }
  const top = cy - bh;

  // ── detrás del cuerpo: cola, orejas, alas, patas de insecto
  const tail = look.tail;
  if (tail === 'curl') { line(g, [cx + bw - 2, cy + 4, cx + bw + 5, cy + 2, cx + bw + 6, cy - 4, cx + bw + 3, cy - 6], main, 3.2); ell(g, cx + bw + 3, cy - 6, 2, 2, accent); }
  if (tail === 'spiky') tri(g, [cx + bw - 3, cy, cx + bw + 8, cy - 5, cx + bw + 3, cy + 1, cx + bw + 9, cy + 3, cx + bw - 2, cy + 5], accent);
  if (tail === 'flame') { ell(g, cx + bw + 3, cy, 4, 3, main); ell(g, cx + bw + 6, cy - 3, 3, 4, accent); ell(g, cx + bw + 7, cy - 6, 1.6, 2.4, '#fff3b0'); }
  if (tail === 'zap') line(g, [cx + bw - 2, cy + 3, cx + bw + 5, cy + 1, cx + bw + 2, cy - 3, cx + bw + 9, cy - 7], accent, 2.6);
  if (tail === 'stinger') tri(g, [cx + bw - 2, cy + 2, cx + bw + 9, cy - 1, cx + bw - 1, cy + 6], dark);
  if (look.body === 'long') {
    // cuerpo de serpiente enroscado
    ell(g, cx + 4, cy + 13, r * 0.95, r * 0.42, main);
    ell(g, cx - 3, cy + 9, r * 0.7, r * 0.42, main);
    ell(g, cx + 4, cy + 13, r * 0.6, r * 0.18, belly);
  }
  if (look.body === 'bug' || look.legs) {
    for (let k = 0; k < 3; k++) {
      const ly = cy + 2 + k * 3;
      line(g, [cx - bw + 2, ly, cx - bw - 4, ly + 3 + k], dark, 1.4);
      line(g, [cx + bw - 2, ly, cx + bw + 4, ly + 3 + k], dark, 1.4);
    }
  }
  if (look.body === 'bug') ell(g, cx, cy + bh + 3, bw * 0.9, bh * 0.75, dark);
  if (look.body === 'bird') {
    tri(g, [cx - bw + 1, cy - 2, cx - bw - 7, cy + 4, cx - bw + 2, cy + 6], dark);
    tri(g, [cx + bw - 1, cy - 2, cx + bw + 7, cy + 4, cx + bw - 2, cy + 6], dark);
  }
  const ears = look.ears;
  if (ears === 'cat') { tri(g, [cx - bw + 1, top + 5, cx - bw + 3, top - 5, cx - 2, top + 2], main); tri(g, [cx + bw - 1, top + 5, cx + bw - 3, top - 5, cx + 2, top + 2], main); tri(g, [cx - bw + 3, top + 3, cx - bw + 4, top - 2, cx - 3, top + 2], accent); tri(g, [cx + bw - 3, top + 3, cx + bw - 4, top - 2, cx + 3, top + 2], accent); }
  if (ears === 'long') { ell(g, cx - 5, top - 3, 2.4, 6 + st, main); ell(g, cx + 5, top - 3, 2.4, 6 + st, main); ell(g, cx - 5, top - 6 - st, 2, 2.4, accent); ell(g, cx + 5, top - 6 - st, 2, 2.4, accent); }
  if (ears === 'horns') { tri(g, [cx - 6, top + 3, cx - 9, top - 5 - st, cx - 3, top + 1], accent); tri(g, [cx + 6, top + 3, cx + 9, top - 5 - st, cx + 3, top + 1], accent); }
  if (ears === 'antenna') { line(g, [cx - 3, top + 2, cx - 6, top - 6 - st], dark, 1.3); line(g, [cx + 3, top + 2, cx + 6, top - 6 - st], dark, 1.3); ell(g, cx - 6, top - 6 - st, 1.8, 1.8, accent); ell(g, cx + 6, top - 6 - st, 1.8, 1.8, accent); }
  if (ears === 'fin') tri(g, [cx - 4, top + 3, cx + 1, top - 7 - st, cx + 5, top + 3], accent);

  // ── cuerpo y vientre
  ell(g, cx, cy, bw, bh, main);
  // sombreado (abajo a la derecha)
  g.save();
  g.globalCompositeOperation = 'source-atop';
  ell(g, cx + bw * 0.55, cy + bh * 0.6, bw * 0.9, bh * 0.8, shade(main, -22));
  ell(g, cx - bw * 0.45, cy - bh * 0.5, bw * 0.35, bh * 0.25, shade(main, 30));
  // patrón
  if (look.pattern === 'spots') { ell(g, cx - bw * 0.55, cy - 1, 1.6, 1.6, accent); ell(g, cx + bw * 0.6, cy - bh * 0.35, 1.3, 1.3, accent); ell(g, cx + bw * 0.45, cy + 2, 1.2, 1.2, accent); }
  if (look.pattern === 'stripes') { for (let k = -1; k <= 1; k++) line(g, [cx + k * 5 - 1, top - 1, cx + k * 5 + 1, top + 5], dark, 1.6); }
  if (look.pattern === 'circuit') { line(g, [cx - bw, cy + 2, cx - bw * 0.4, cy + 2, cx - bw * 0.3, cy - 3], accent, 1); ell(g, cx - bw * 0.3, cy - 3, 1.1, 1.1, accent); line(g, [cx + bw, cy + 4, cx + bw * 0.5, cy + 4], accent, 1); }
  g.restore();
  if (look.body !== 'bug') ell(g, cx, cy + bh * 0.42, bw * 0.62, bh * 0.48, belly);

  // patitas
  if (look.body !== 'bug' && look.body !== 'long') { ell(g, cx - bw * 0.5, cy + bh - 1, 3, 2, dark); ell(g, cx + bw * 0.5, cy + bh - 1, 3, 2, dark); }

  // ── cara
  const ey = cy - bh * 0.25;
  const ex = Math.max(3.2, bw * 0.38);
  const eye = (x, y, s = 1) => { ell(g, x, y, 2.3 * s, 2.7 * s, '#ffffff'); ell(g, x + 0.4, y + 0.5, 1.3 * s, 1.7 * s, '#14121e'); ell(g, x - 0.4, y - 0.6, 0.6, 0.6, '#ffffff'); };
  switch (look.eyes) {
    case 'one': eye(cx, ey, 1.5); break;
    case 'sleepy': line(g, [cx - ex - 2, ey, cx - ex + 2, ey], '#14121e', 1.4); line(g, [cx + ex - 2, ey, cx + ex + 2, ey], '#14121e', 1.4); break;
    case 'angry': eye(cx - ex, ey); eye(cx + ex, ey); line(g, [cx - ex - 2.5, ey - 4, cx - ex + 2, ey - 2.5], '#14121e', 1.3); line(g, [cx + ex + 2.5, ey - 4, cx + ex - 2, ey - 2.5], '#14121e', 1.3); break;
    case 'many': eye(cx - ex, ey, 0.8); eye(cx + ex, ey, 0.8); eye(cx, ey - 3, 0.7); break;
    default: eye(cx - ex, ey); eye(cx + ex, ey);
  }
  if (look.body === 'bird') tri(g, [cx - 2, ey + 3, cx + 2, ey + 3, cx, ey + 6], '#ffb534');
  else line(g, [cx - 1.6, ey + 4.5, cx, ey + 5.4, cx + 1.6, ey + 4.5], '#14121e', 1);
  if (look.fangs) { tri(g, [cx - 2, ey + 4.6, cx - 1, ey + 4.6, cx - 1.5, ey + 6.5], '#fff'); tri(g, [cx + 1, ey + 4.6, cx + 2, ey + 4.6, cx + 1.5, ey + 6.5], '#fff'); }
  // corona de la fase final
  if (st === 2) tri(g, [cx - 4, top + 1, cx - 4, top - 3, cx - 2, top - 1, cx, top - 4, cx + 2, top - 1, cx + 4, top - 3, cx + 4, top + 1], '#ffd34d');
}

/** Binariza el alfa y añade un contorno oscuro de 1 píxel. */
function pixelize(c, outline = '#14121e') {
  const g = c.getContext('2d');
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const w = c.width;
  const h = c.height;
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const a = d[i * 4 + 3];
    solid[i] = a > 100 ? 1 : 0;
    d[i * 4 + 3] = solid[i] ? 255 : 0;
  }
  const [or, og, ob] = [parseInt(outline.slice(1, 3), 16), parseInt(outline.slice(3, 5), 16), parseInt(outline.slice(5, 7), 16)];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (solid[i]) continue;
      if ((x > 0 && solid[i - 1]) || (x < w - 1 && solid[i + 1]) || (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w])) {
        d[i * 4] = or; d[i * 4 + 1] = og; d[i * 4 + 2] = ob; d[i * 4 + 3] = 255;
      }
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** Sprite (40×40) de una criatura, cacheado por aspecto. */
export function creatureSprite(look) {
  const key = JSON.stringify(look);
  if (cache.has(key)) return cache.get(key);
  const c = canvas(S, S);
  const g = c.getContext('2d');
  paintCreature(g, look);
  pixelize(c);
  cache.set(key, c);
  return c;
}

/**
 * Dibuja una criatura escalada. Con glitch, algunas filas se desplazan y aparecen
 * píxeles de colores corruptos: así se reconoce un bug salvaje.
 */
export function drawCreature(ctx, look, x, y, scale, { glitch = 0, t = 0, flip = false, alpha = 1, white = false } = {}) {
  const sp = creatureSprite(look);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha;
  const bob = Math.round(Math.sin(t * 3) * 1) * scale;
  const W = S * scale;
  if (flip) { ctx.translate(x + W, 0); ctx.scale(-1, 1); x = 0; }
  if (white) ctx.filter = 'brightness(0) invert(1)';
  if (!glitch) {
    ctx.drawImage(sp, x, y + bob, W, W);
  } else {
    const band = 4;
    const seed = Math.floor(t * 8);
    for (let row = 0; row < S; row += band) {
      const n = Math.sin(seed * 12.9 + row * 78.2) * 43758.5;
      const f = n - Math.floor(n);
      const off = f < glitch * 0.35 ? Math.round((f * 6 - 1.5)) * scale : 0;
      ctx.drawImage(sp, 0, row, S, band, x + off, y + bob + row * scale, W, band * scale);
    }
    // píxeles corruptos
    ctx.globalAlpha = alpha * 0.85;
    for (let k = 0; k < 6 * glitch; k++) {
      const n = Math.sin(seed * 3.1 + k * 17.7) * 9999;
      const f = n - Math.floor(n);
      const px = Math.floor(f * 30) + 5;
      const py = Math.floor(((n * 7) % 1 + 1) % 1 * 30) + 6;
      ctx.fillStyle = k % 2 ? '#ff3df0' : '#3dffb0';
      ctx.fillRect(x + px * scale, y + bob + py * scale, scale * (1 + (k % 3)), scale);
    }
  }
  ctx.restore();
}

// ─────────────────────────── Personajes (16×16) ───────────────────────────
export const PEOPLE = {
  hero: { hair: '#2b1d14', skin: '#f2c49b', shirt: '#e5484d', pants: '#2d3a5c', hat: '#e5484d' },
  rival: { hair: '#d9a21b', skin: '#f6d3b3', shirt: '#2f7de1', pants: '#3a3a3a' },
  prof: { hair: '#d8dbe8', skin: '#efc6a0', shirt: '#f4f6ff', pants: '#5b6478', coat: true },
  aide: { hair: '#6b3e26', skin: '#e9b48a', shirt: '#f4f6ff', pants: '#5b6478', coat: true },
  nurse: { hair: '#ff8fb8', skin: '#f6d3b3', shirt: '#ffffff', pants: '#ff8fb8' },
  grunt: { hair: '#1b1b24', skin: '#d9b08c', shirt: '#2a2338', pants: '#2a2338', hat: '#ff3df0', mask: true },
  boss: { hair: '#e8e8f0', skin: '#c9a487', shirt: '#14101c', pants: '#14101c', hat: '#ff3df0', coat: true, mask: true },
  leader1: { hair: '#ff9d2e', skin: '#f2c49b', shirt: '#ffb534', pants: '#7a4a12' },
  leader2: { hair: '#1e1e1e', skin: '#a8754f', shirt: '#4cc94c', pants: '#24502a' },
  leader3: { hair: '#7b5cff', skin: '#f6d3b3', shirt: '#9d7bff', pants: '#3b2a7a' },
  leader4: { hair: '#ff3df0', skin: '#e9b48a', shirt: '#2b2b44', pants: '#ff3df0', coat: true },
  kid: { hair: '#5a3418', skin: '#f2c49b', shirt: '#4ecdc4', pants: '#335' },
  elder: { hair: '#cfcfcf', skin: '#e2b48c', shirt: '#8a6d4a', pants: '#4a3a2a' },
  girl: { hair: '#a8323e', skin: '#f6d3b3', shirt: '#ffcf4d', pants: '#6a4bb3' },
  mom: { hair: '#6b3e26', skin: '#f2c49b', shirt: '#8bd17c', pants: '#3b5b8a' },
  coder: { hair: '#222', skin: '#c48a5c', shirt: '#22e4ff', pants: '#223' },
};

/** Personaje en 16×16 lógicos. dir: down|up|left|right; step: 0|1 alterna los pies. */
export function drawPerson(g, look, x, y, dir = 'down', step = 0) {
  const p = (px, py, w, h, c) => { g.fillStyle = c; g.fillRect(x + px, y + py, w, h); };
  const O = '#14121e';
  // sombra
  g.fillStyle = 'rgba(0,0,0,.25)';
  g.fillRect(x + 3, y + 14, 10, 2);
  const legL = step ? 1 : 0;
  const legR = step ? 0 : 1;
  // piernas
  p(5, 12 - legL, 3, 3 + legL, look.pants); p(8, 12 - legR, 3, 3 + legR, look.pants);
  p(5, 14, 3, 1, O); p(8, 14, 3, 1, O);
  // cuerpo
  p(4, 8, 8, 5, look.shirt);
  if (look.coat) { p(4, 8, 2, 6, '#e8ecf8'); p(10, 8, 2, 6, '#e8ecf8'); }
  p(3, 8, 1, 4, look.skin); p(12, 8, 1, 4, look.skin);
  // cabeza
  p(4, 2, 8, 7, look.skin);
  p(3, 1, 10, 3, look.hair);
  if (dir === 'up') {
    p(4, 2, 8, 6, look.hair);
  } else if (dir === 'down') {
    p(3, 3, 1, 3, look.hair); p(12, 3, 1, 3, look.hair);
    p(6, 5, 1, 2, O); p(9, 5, 1, 2, O);
    if (look.mask) p(5, 7, 6, 2, '#2a2338');
  } else {
    const L = dir === 'left';
    p(L ? 8 : 4, 2, 4, 5, look.hair);
    p(L ? 5 : 10, 5, 1, 2, O);
    if (look.mask) p(L ? 4 : 6, 7, 6, 2, '#2a2338');
  }
  if (look.hat) { p(3, 0, 10, 2, look.hat); if (dir === 'down') p(4, 2, 8, 1, look.hat); if (dir === 'left') p(1, 1, 3, 1, look.hat); if (dir === 'right') p(12, 1, 3, 1, look.hat); }
  // contorno de la cabeza
  g.fillStyle = O;
  g.fillRect(x + 3, y + 0 + (look.hat ? 0 : 1), 10, 1);
}

// ─────────────────────────── Casillas (16×16) ───────────────────────────
const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };

export const ROOF = { R: ['#c94b3b', '#9c3328'], H: ['#3b7dd8', '#2a5aa0'], G: ['#8b5cf6', '#6233c4'], A: ['#2bb3a3', '#1d8276'], N: ['#3a2a4a', '#231830'] };

/** Casillas estáticas (se pintan una vez en el mapa precalculado). */
export function drawTile(g, ch, x, y, tx, ty) {
  const p = (px, py, w, h, c) => { g.fillStyle = c; g.fillRect(x + px, y + py, w, h); };
  const grass = () => {
    p(0, 0, 16, 16, '#5bbf5a');
    const h1 = hash(tx, ty);
    if (h1 > 0.5) { p(Math.floor(h1 * 12), Math.floor(h1 * 97) % 12 + 2, 1, 2, '#4aa24a'); p(Math.floor(h1 * 12) + 2, Math.floor(h1 * 97) % 12 + 3, 1, 2, '#4aa24a'); }
    if (h1 < 0.15) p(Math.floor(h1 * 80), 10, 2, 1, '#79d677');
  };
  switch (ch) {
    case '.': grass(); break;
    case '*': {
      grass();
      const cols = ['#ff6b8a', '#ffd34d', '#ffffff', '#9d7bff'];
      for (let k = 0; k < 3; k++) {
        const fx = 2 + Math.floor(hash(tx + k, ty) * 11);
        const fy = 2 + Math.floor(hash(tx, ty + k) * 11);
        p(fx, fy, 2, 2, cols[(tx + ty + k) % 4]); p(fx, fy + 2, 1, 1, '#2f7d32');
      }
      break;
    }
    case '=': case 'D0': {
      p(0, 0, 16, 16, '#e3c58f');
      if (hash(tx, ty) > 0.6) p(Math.floor(hash(ty, tx) * 13), Math.floor(hash(tx + 3, ty) * 13), 2, 1, '#cfae74');
      if (hash(tx + 1, ty) > 0.7) p(Math.floor(hash(ty + 2, tx) * 13), Math.floor(hash(tx, ty + 5) * 13), 1, 1, '#f3dcae');
      break;
    }
    case ':': p(0, 0, 16, 16, '#efd9a1'); if (hash(tx, ty) > 0.5) p(4, 6, 1, 1, '#d6bd80'); break;
    case 'c': p(0, 0, 16, 16, '#4a3f5c'); if (hash(tx, ty) > 0.5) p(Math.floor(hash(tx, ty) * 12), 7, 3, 1, '#3c3250'); break;
    case 'f': p(0, 0, 16, 16, '#3a3354'); p(0, 0, 16, 1, '#4a4268'); p(0, 0, 1, 16, '#4a4268'); break;
    case 'T': {
      grass();
      p(6, 11, 4, 5, '#7a4b2a');
      g.fillStyle = '#2f8f3f'; g.beginPath(); g.arc(x + 8, y + 7, 7, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3fae4f'; g.beginPath(); g.arc(x + 6, y + 5, 4, 0, Math.PI * 2); g.fill();
      p(5, 3, 2, 2, '#6fd27a');
      break;
    }
    case 'M': {
      p(0, 0, 16, 16, '#7d6b5a');
      p(0, 0, 16, 3, '#8f7c69');
      if (hash(tx, ty) > 0.4) p(3, 6, 6, 2, '#6a5a4b');
      if (hash(ty, tx) > 0.5) p(9, 11, 5, 2, '#6a5a4b');
      break;
    }
    case 'r': {
      p(0, 0, 16, 16, (ty < 12) ? '#4a3f5c' : '#efd9a1');
      g.fillStyle = '#8c8c99'; g.beginPath(); g.ellipse(x + 8, y + 9, 7, 6, 0, 0, Math.PI * 2); g.fill();
      p(4, 5, 4, 2, '#b4b4c2');
      p(2, 13, 12, 1, '#5c5c68');
      break;
    }
    case 'F': grass(); p(0, 5, 16, 2, '#e9e4d8'); p(0, 10, 16, 2, '#e9e4d8'); p(2, 3, 2, 11, '#fffaf0'); p(12, 3, 2, 11, '#fffaf0'); break;
    case 'S': grass(); p(7, 9, 2, 6, '#7a4b2a'); p(2, 3, 12, 7, '#a8713f'); p(3, 4, 10, 5, '#c98d50'); p(4, 5, 8, 1, '#7a4b2a'); p(4, 7, 6, 1, '#7a4b2a'); break;
    case 'W': p(0, 0, 16, 16, '#f1e6d2'); p(0, 15, 16, 1, '#b9a98c'); p(0, 0, 16, 1, '#d8c9ad'); break;
    case 'w': p(0, 0, 16, 16, '#f1e6d2'); p(3, 3, 10, 8, '#5b4a3a'); p(4, 4, 8, 6, '#9fd8ff'); p(4, 4, 3, 2, '#d8f1ff'); p(0, 15, 16, 1, '#b9a98c'); break;
    case 'D': p(0, 0, 16, 16, '#f1e6d2'); p(3, 2, 10, 14, '#6a3f22'); p(4, 3, 8, 13, '#8a5530'); p(10, 9, 1, 2, '#ffd34d'); break;
    case '#': p(0, 0, 16, 16, '#2a2440'); p(0, 0, 16, 2, '#3a3256'); p(0, 7, 16, 1, '#1f1a30'); p(7, 2, 1, 5, '#1f1a30'); p(3, 8, 1, 8, '#1f1a30'); p(12, 8, 1, 8, '#1f1a30'); break;
    case 'b': p(0, 0, 16, 16, '#3b8fd8'); p(0, 1, 16, 14, '#a8713f'); for (let k = 0; k < 16; k += 4) p(k, 1, 1, 14, '#7a4b2a'); p(0, 1, 16, 1, '#c98d50'); p(0, 14, 16, 1, '#7a4b2a'); break;
    default:
      if (ROOF[ch]) {
        const [a, b] = ROOF[ch];
        p(0, 0, 16, 16, a);
        for (let k = 2; k < 16; k += 5) p(0, k, 16, 1, b);
        p(0, 0, 16, 1, shade(a, 25));
        break;
      }
      grass();
  }
}

/** Casillas animadas: agua, hierba alta, cortafuegos y hierba corrupta. */
export function drawAnimTile(g, ch, x, y, tx, ty, t, open = false) {
  const p = (px, py, w, h, c) => { g.fillStyle = c; g.fillRect(x + px, y + py, w, h); };
  if (ch === '~') {
    p(0, 0, 16, 16, '#3b8fd8');
    const o = Math.floor((t * 4 + tx * 3 + ty * 5) % 16);
    p((o + 2) % 14, 4, 4, 1, '#7cc0f5');
    p((o + 9) % 14, 11, 3, 1, '#7cc0f5');
    if ((tx + ty) % 3 === 0) p((o * 2) % 14, 8, 2, 1, '#cfe9ff');
  } else if (ch === ',' || ch === 'k') {
    const corrupt = ch === 'k';
    p(0, 0, 16, 16, corrupt ? '#2a2440' : '#4aa24a');
    const sway = Math.round(Math.sin(t * 2.4 + tx * 0.8 + ty * 0.5) * 1);
    const dark = corrupt ? '#7a2d8a' : '#2f7d32';
    const light = corrupt ? '#d64fd4' : '#6fd27a';
    for (let k = 0; k < 4; k++) {
      const bx = 1 + k * 4;
      g.fillStyle = dark;
      g.beginPath(); g.moveTo(x + bx, y + 15); g.lineTo(x + bx + 1.5 + sway, y + 4 + (k % 2) * 2); g.lineTo(x + bx + 3, y + 15); g.fill();
      g.fillStyle = light;
      g.beginPath(); g.moveTo(x + bx + 0.5, y + 15); g.lineTo(x + bx + 1.5 + sway, y + 7 + (k % 2) * 2); g.lineTo(x + bx + 2, y + 15); g.fill();
    }
    if (corrupt && Math.floor(t * 6 + tx) % 9 === 0) p(Math.floor(hash(tx, ty) * 14), Math.floor(hash(ty, tx) * 14), 2, 1, '#3dffb0');
  } else if (ch === 'X') {
    if (open) { drawTile(g, '=', x, y, tx, ty); return; }
    drawTile(g, '=', x, y, tx, ty);
    const a = 0.55 + Math.sin(t * 6 + tx) * 0.25;
    g.fillStyle = `rgba(255,61,240,${a})`;
    for (let k = 0; k < 16; k += 3) g.fillRect(x, y + k, 16, 1);
    p(0, 0, 2, 16, '#5a1f63'); p(14, 0, 2, 16, '#5a1f63');
    p(0, Math.floor((t * 20) % 16), 16, 1, '#ffd6fb');
  }
}

export const ANIMATED = new Set(['~', ',', 'k', 'X']);
