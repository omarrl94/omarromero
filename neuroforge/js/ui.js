import { state, save } from './store.js';

// Mini "hyperscript": h('div.clase#id', {onclick}, hijos…). Los textos NUNCA se interpretan como HTML.
export function h(sel, attrs, ...kids) {
  const m = sel.match(/^([a-z0-9]*)((?:[.#][\w-]+)*)$/i);
  const el = document.createElement(m[1] || 'div');
  (m[2].match(/[.#][\w-]+/g) || []).forEach((t) => (t[0] === '.' ? el.classList.add(t.slice(1)) : (el.id = t.slice(1))));
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') String(v || '').split(/\s+/).filter(Boolean).forEach((c) => el.classList.add(c));
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;           // solo para contenido propio del juego
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (v === true) el.setAttribute(k, '');
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  (function add(list) {
    for (const k of list) {
      if (Array.isArray(k)) add(k);
      else if (k != null && k !== false) el.append(k instanceof Node ? k : document.createTextNode(String(k)));
    }
  })(kids);
  return el;
}
export const $ = (s, r = document) => r.querySelector(s);
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
export function shuffle(a, r = Math.random) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export const starsEl = (n, max = 3) => h('span.stars', '★'.repeat(n), h('span.off', '★'.repeat(max - n)));

/* ---- sonido (WebAudio, sin archivos) ---- */
let ac;
export function beep(kind = 'ok') {
  if (!state().sound) return;
  try {
    ac ||= new (window.AudioContext || window.webkitAudioContext)();
    const seq = { ok: [[660, .08], [880, .12]], bad: [[220, .16], [160, .2]], win: [[523, .1], [659, .1], [784, .1], [1047, .25]], tick: [[440, .04]], lvl: [[392, .1], [523, .1], [659, .1], [784, .1], [1047, .3]] }[kind] || [];
    let t = ac.currentTime;
    for (const [f, d] of seq) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = kind === 'bad' ? 'sawtooth' : 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(.06, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d); t += d * .9;
    }
  } catch { /* sin audio */ }
}
export function toggleSound() { state().sound = !state().sound; save(); }

/* ---- avisos y confeti ---- */
export function toast(text, ms = 3200) {
  let box = $('.toasts');
  if (!box) { box = h('div.toasts'); document.body.append(box); }
  const t = h('div.toast', text); box.append(t);
  setTimeout(() => t.remove(), ms);
}
export function confetti() {
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const cv = h('canvas.confetti'); cv.width = innerWidth; cv.height = innerHeight; document.body.append(cv);
  const c = cv.getContext('2d'), cols = ['#22e4ff', '#ff3df0', '#a3ff3d', '#ffb534', '#9d7bff'];
  const ps = Array.from({ length: 120 }, () => ({ x: cv.width / 2, y: cv.height * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 12 - 3, s: 4 + Math.random() * 6, c: cols[Math.floor(Math.random() * 5)], r: Math.random() * 6 }));
  let f = 0;
  (function loop() {
    c.clearRect(0, 0, cv.width, cv.height);
    ps.forEach((p) => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.r += .2; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.c; c.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); c.restore(); });
    if (++f < 110) requestAnimationFrame(loop); else cv.remove();
  })();
}
export function modal(content) {
  const m = h('div.modal', { onclick: (e) => { if (e.target === m) m.remove(); } }, h('div.glass.glow.box', content));
  document.body.append(m); return m;
}

/* ---- NEO, el compañero ---- */
const neoSvg = () => h('div', { html: `<svg viewBox="0 0 64 64" aria-label="NEO"><rect x="10" y="16" width="44" height="34" rx="12" fill="#121624" stroke="#22e4ff" stroke-width="2.5"/><circle cx="24" cy="32" r="5" fill="#a3ff3d"/><circle cx="40" cy="32" r="5" fill="#a3ff3d"/><path d="M26 42q6 4 12 0" stroke="#ff3df0" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M32 16V8" stroke="#22e4ff" stroke-width="2.5"/><circle cx="32" cy="6" r="3.5" fill="#ff3df0"/></svg>` }).firstChild;
let neoEl, neoTimer;
export function say(text, ms = 6500) {
  if (!neoEl) { neoEl = h('div.neo', { 'aria-live': 'polite' }); document.body.append(neoEl); }
  neoEl.replaceChildren(neoSvg(), h('div.bubble', text));
  clearTimeout(neoTimer); neoTimer = setTimeout(() => neoEl && neoEl.replaceChildren(neoSvg()), ms);
}
export function hideNeo() { neoEl && neoEl.remove(); neoEl = null; }

/* ---- utilidades de canvas ---- */
export function makeCanvas(w, h2, cls = '') {
  const cv = h('canvas' + cls); const dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = w * dpr; cv.height = h2 * dpr; cv.style.aspectRatio = `${w}/${h2}`;
  const c = cv.getContext('2d'); c.scale(dpr, dpr);
  return { cv, c, w, h: h2 };
}
export function canvasPos(cv, e, w, hh) {
  const r = cv.getBoundingClientRect();
  const t = e.touches ? e.touches[0] || e.changedTouches[0] : e;
  return { x: ((t.clientX - r.left) / r.width) * w, y: ((t.clientY - r.top) / r.height) * hh };
}
export const COL = { 0: '#22e4ff', 1: '#ff3df0', 2: '#a3ff3d', 3: '#ffb534', 4: '#9d7bff', 5: '#ff4767' };
export function slider(label, min, max, step, val, onInput, fmt = (v) => v) {
  const out = h('output', fmt(val));
  const inp = h('input', { type: 'range', min, max, step, value: val, 'aria-label': label, oninput: () => { out.textContent = fmt(+inp.value); onInput(+inp.value); } });
  return { el: h('div.sl', h('span', label), inp, out), inp, out, set(v) { inp.value = v; out.textContent = fmt(v); } };
}
