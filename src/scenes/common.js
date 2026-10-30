// Utilidades de dibujo compartidas por todas las escenas (mundo lógico 640×360).
export const W = 640;
export const H = 360;

export const C = {
  cyan: '#22e4ff', magenta: '#ff3df0', lime: '#a3ff3d', amber: '#ffb534', red: '#ff4767', violet: '#9d7bff',
  dim: '#3a4266', grid: 'rgba(34,228,255,0.06)', text: '#d6dcff', muted: '#7a83ad', bg: '#070910',
};

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => 1 - (1 - clamp(t, 0, 1)) ** 3;

export function glow(ctx, color, blur = 12) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}
export function noGlow(ctx) {
  ctx.shadowBlur = 0;
}

export function text(ctx, str, x, y, { color = C.text, size = 11, align = 'left', weight = 500, base = 'alphabetic', alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  ctx.fillText(str, x, y);
  ctx.restore();
}

export function grid(ctx, step = 32, color = C.grid) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= W; x += step) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
  for (let y = 0; y <= H; y += step) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
  ctx.stroke();
  ctx.restore();
}

/** Campo de estrellas determinista con paralaje suave. */
export function makeStars(n = 90, seed = 7) {
  const stars = [];
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) stars.push({ x: rnd() * W, y: rnd() * H, z: rnd() * 0.8 + 0.2, tw: rnd() * 6 });
  return stars;
}
export function drawStars(ctx, stars, time, speed = 6) {
  ctx.save();
  for (const st of stars) {
    const x = (st.x - time * speed * st.z) % W;
    const a = 0.35 + 0.35 * Math.sin(time * 2 + st.tw);
    ctx.fillStyle = `rgba(200,220,255,${a * st.z})`;
    ctx.fillRect(x < 0 ? x + W : x, st.y, st.z * 1.6, st.z * 1.6);
  }
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r = 6) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function panel(ctx, x, y, w, h, color = C.cyan, alpha = 0.08) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = `rgba(13,16,25,0.82)`;
  ctx.fill();
  ctx.globalAlpha = alpha * 4;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/** Sistema de partículas mínimo (explosiones, polvo, chispas). */
export class Particles {
  constructor() { this.list = []; }
  burst(x, y, { n = 30, color = C.amber, speed = 120, life = 1, size = 2, gravity = 0, spread = Math.PI * 2, dir = 0 } = {}) {
    for (let i = 0; i < n; i++) {
      const a = dir + (Math.random() - 0.5) * spread;
      const v = speed * (0.3 + Math.random() * 0.7);
      this.list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: life * (0.5 + Math.random() * 0.5), max: life, color, size: size * (0.5 + Math.random()), gravity });
    }
    if (this.list.length > 900) this.list.splice(0, this.list.length - 900);
  }
  update(dt) {
    for (const p of this.list) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.vx *= 0.985;
      p.life -= dt;
    }
    this.list = this.list.filter((p) => p.life > 0);
  }
  draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.list) {
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.restore();
  }
}

export function ship(ctx, x, y, angle = 0, color = C.cyan, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  glow(ctx, color, 14);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-10, -9);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-10, 9);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = 'rgba(34,228,255,0.15)';
  ctx.fill();
  ctx.restore();
}

export function banner(ctx, str, color, sub = '', t = 1) {
  const a = ease(t);
  ctx.save();
  ctx.globalAlpha = a;
  glow(ctx, color, 20);
  text(ctx, str, W / 2, H / 2 - 4, { color, size: 26, align: 'center', weight: 800, base: 'middle' });
  noGlow(ctx);
  if (sub) text(ctx, sub, W / 2, H / 2 + 22, { color: C.text, size: 11, align: 'center', base: 'middle', alpha: 0.85 });
  ctx.restore();
}

export const fmtNum = (n) => (Number.isFinite(n) ? Math.trunc(n).toLocaleString('es-ES') : String(n));
