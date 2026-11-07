// Recursos gráficos y de audio de Bitlandia.
// Arte: «Ninja Adventure» de Pixel-boy & AAA (CC0, dominio público). Ver public/game/LICENSE-NinjaAdventure.txt.

const BASE = `${import.meta.env.BASE_URL || './'}game/`;
export const url = (p) => `${BASE}${p}`;

const images = new Map();

/** Carga (o devuelve de la caché) una imagen. */
export function img(path) {
  let e = images.get(path);
  if (!e) {
    const im = new Image();
    e = { im, ready: false, promise: null };
    e.promise = new Promise((res) => {
      im.onload = () => { e.ready = true; res(im); };
      im.onerror = () => res(im);
    });
    im.src = url(path);
    images.set(path, e);
  }
  return e;
}
/** Imagen lista para dibujar, o null mientras carga. */
export const ready = (path) => { const e = img(path); return e.ready ? e.im : null; };

export function preload(paths, onProgress) {
  let done = 0;
  return Promise.all(paths.map((p) => img(p).promise.then(() => { done++; if (onProgress) onProgress(done / paths.length); })));
}

// ───────────────────────── Sprites ─────────────────────────
// Personajes y monstruos: hojas de 16×16 con 4 columnas (abajo, arriba, izquierda, derecha)
// y filas de animación de caminar.
export const DIR_COL = { down: 0, up: 1, left: 2, right: 3 };

/** Monstruos finales (jefes): una tira horizontal de fotogramas de reposo. */
export const BOSS_FRAMES = {
  GiantSlime: 5, GiantRacoonGold: 6, GiantBamboo2: 6, TenguBlue: 6, GiantFlam: 5,
  TenguRed: 6, DemonCyclop2: 5, DemonCyclop: 5, GiantRacoon: 6, SquidRed: 4,
};

/** Dibuja un fotograma de una hoja 16×16 (personaje o monstruo). */
export function drawCell(g, path, col, row, x, y, scale = 1) {
  const im = ready(path);
  if (!im) return false;
  g.drawImage(im, col * 16, row * 16, 16, 16, Math.round(x), Math.round(y), 16 * scale, 16 * scale);
  return true;
}

/**
 * Dibuja una criatura. sprite = { kind: 'mon' | 'boss', key }.
 * Los monstruos pequeños se animan con su ciclo de 4 pasos; los jefes con su tira de reposo.
 * (x, y) es el centro de los pies; size es la altura deseada aproximada en píxeles.
 */
export function drawCreatureSprite(g, sprite, cx, footY, scale, { t = 0, dir = 'down', alpha = 1, flash = 0 } = {}) {
  g.save();
  g.imageSmoothingEnabled = false;
  g.globalAlpha = alpha;
  if (sprite.kind === 'boss') {
    const im = ready(`boss/${sprite.key}.png`);
    if (im) {
      const n = BOSS_FRAMES[sprite.key] || 4;
      const fw = im.width / n;
      const fh = im.height;
      const f = Math.floor(t * 7) % n;
      const s = scale * 0.42; // los jefes ya son grandes
      g.drawImage(im, f * fw, 0, fw, fh, Math.round(cx - (fw * s) / 2), Math.round(footY - fh * s), fw * s, fh * s);
    }
  } else {
    const path = `mon/${sprite.key}.png`;
    const row = Math.floor(t * 5) % 4;
    drawCell(g, path, DIR_COL[dir], row, cx - 8 * scale, footY - 16 * scale, scale);
  }
  if (flash) {
    g.globalCompositeOperation = 'source-atop';
    g.globalAlpha = flash;
    g.fillStyle = '#fff';
    g.fillRect(cx - 200, footY - 400, 400, 420);
  }
  g.restore();
}

/** Efectos animados (tiras horizontales). */
export const FX = {
  slash: { path: 'fx/slash.png', frames: 6 },
  explosion: { path: 'fx/explosion.png', frames: 9 },
  spark: { path: 'fx/spark.png', frames: 6 },
  smoke: { path: 'fx/smoke.png', frames: 6 },
};
export function drawFx(g, name, k, cx, cy, scale) {
  const fx = FX[name];
  const im = ready(fx.path);
  if (!im || k < 0 || k >= 1) return;
  const fw = im.width / fx.frames;
  const f = Math.min(fx.frames - 1, Math.floor(k * fx.frames));
  g.drawImage(im, f * fw, 0, fw, im.height, Math.round(cx - (fw * scale) / 2), Math.round(cy - (im.height * scale) / 2), fw * scale, im.height * scale);
}

// ───────────────────────── Audio ─────────────────────────
let musicOn = true;
let sfxOn = true;
let current = null; // { name, el }
let wanted = null;
let unlocked = false;
const sfxCache = new Map();

export function setAudio({ music, sound }) {
  musicOn = music;
  sfxOn = sound;
  if (!musicOn && current) { current.el.pause(); }
  if (musicOn && wanted) { const w = wanted; wanted = null; playMusic(w, true); }
}

function fade(el, to, ms, done) {
  const from = el.volume;
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / ms);
    el.volume = Math.max(0, Math.min(1, from + (to - from) * k));
    if (k < 1) requestAnimationFrame(step);
    else if (done) done();
  };
  requestAnimationFrame(step);
}

const VOL = 0.45;
export function playMusic(name, force = false) {
  if (!force && wanted === name && current && current.name === name && !current.el.paused) return;
  wanted = name;
  if (!musicOn || !unlocked) return;
  if (current && current.name === name) { if (current.el.paused) current.el.play().catch(() => {}); return; }
  const old = current;
  if (old) fade(old.el, 0, 450, () => old.el.pause());
  if (!name) { current = null; return; }
  const el = new Audio(url(`music/${name}.mp3`));
  el.loop = name !== 'ending';
  el.volume = 0;
  el.play().then(() => fade(el, VOL, 700)).catch(() => {});
  current = { name, el };
}

/** Los navegadores solo dejan sonar audio tras un gesto del usuario. */
export function unlockAudio() {
  if (unlocked) return;
  unlocked = true;
  if (wanted) { const w = wanted; wanted = null; playMusic(w, true); }
}

export function sfx(name, vol = 0.6) {
  if (!sfxOn || !unlocked) return;
  let base = sfxCache.get(name);
  if (!base) { base = new Audio(url(`sfx/${name}.mp3`)); sfxCache.set(name, base); }
  const el = base.cloneNode();
  el.volume = vol;
  el.play().catch(() => {});
}
