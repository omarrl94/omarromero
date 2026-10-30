// Boss Fight: la velocidad de la simulación depende de la complejidad MEDIDA de tu código.
import { W, H, C, glow, noGlow, text, panel, banner, Particles, makeStars, drawStars } from './common.js';

const SPEED = { n3: 0.05, n2: 0.14, nlogn: 0.85, n: 1, o1: 1 };

export function boss() {
  const stars = makeStars(80, 11);
  const fx = new Particles();
  let d = { samples: [], fit: { cls: 'n2', label: 'O(n²)', slope: 2 } };
  let t = 0;
  let simT = 0;
  let frameSkip = 0;
  let swarm = [];
  let hp = 1;
  let defeated = false;
  const spawn = () => Array.from({ length: 140 }, (_, i) => ({
    x: 330 + (i % 14) * 20 + Math.random() * 10,
    y: 40 + Math.floor(i / 14) * 28 + Math.random() * 10,
    ph: Math.random() * 6,
    alive: true,
  }));
  return {
    setData(data) {
      d = { samples: [], fit: { cls: 'n2', label: 'O(n²)', slope: 2 }, ...data };
      t = 0;
      simT = 0;
      swarm = spawn();
      hp = 1;
      defeated = false;
      fx.list = [];
    },
    update(dt) {
      t += dt;
      fx.update(dt);
      const speed = d.correct ? SPEED[d.fit.cls] ?? 0.14 : 0.1;
      // O(n²): la simulación «se atasca» y avanza a saltos (frames perdidos).
      frameSkip += dt;
      const step = speed < 0.5 ? 0.2 : 0;
      if (frameSkip < step) return;
      const sdt = (step || dt) * speed;
      frameSkip = 0;
      simT += sdt;
      for (const e of swarm) {
        if (!e.alive) continue;
        e.x -= 40 * sdt;
        e.y += Math.sin(simT * 3 + e.ph) * 0.6;
        if (e.x < 90) e.x = W + 40;
      }
      if (d.passed) {
        const targets = swarm.filter((e) => e.alive && e.x < W - 10);
        if (targets.length && Math.random() < 0.9) {
          const e = targets[Math.floor(Math.random() * targets.length)];
          e.alive = false;
          fx.burst(e.x, e.y, { n: 10, color: C.magenta, speed: 90, life: 0.5 });
        }
        hp = Math.max(0, hp - dt * 0.25);
        if (hp === 0 && !defeated) {
          defeated = true;
          fx.burst(W - 70, H / 2, { n: 300, color: C.red, speed: 260, life: 1.8, size: 3 });
        }
      }
    },
    draw(ctx) {
      drawStars(ctx, stars, simT * 4, 6);
      // nave del jugador
      ctx.save();
      ctx.translate(60, H / 2);
      glow(ctx, C.cyan, 16);
      ctx.strokeStyle = C.cyan;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(18, 0); ctx.lineTo(-12, -12); ctx.lineTo(-6, 0); ctx.lineTo(-12, 12); ctx.closePath();
      ctx.stroke();
      ctx.restore();
      noGlow(ctx);
      // enjambre
      for (const e of swarm) {
        if (!e.alive || e.x > W + 5) continue;
        ctx.fillStyle = C.red;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(e.x - 3, e.y - 3, 6, 6);
      }
      ctx.globalAlpha = 1;
      // reina
      if (!defeated) {
        ctx.save();
        ctx.translate(W - 70, H / 2 + Math.sin(t) * 10);
        glow(ctx, C.red, 30);
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + t * 0.4; ctx.lineTo(Math.cos(a) * 34, Math.sin(a) * 34); }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        noGlow(ctx);
      }
      fx.draw(ctx);
      // barra de vida
      panel(ctx, W - 230, 12, 218, 34, C.red);
      text(ctx, 'REINA DEL ENJAMBRE', W - 220, 26, { size: 9, color: C.red, weight: 700 });
      ctx.fillStyle = '#2a1018';
      ctx.fillRect(W - 220, 32, 198, 6);
      ctx.fillStyle = C.red;
      ctx.fillRect(W - 220, 32, 198 * hp, 6);
      // gráfica de operaciones medidas
      chart(ctx, d.samples, d.fit);
      const fps = d.correct ? Math.round(60 * (SPEED[d.fit.cls] ?? 0.14)) : 6;
      text(ctx, `simulación: ${fps} fps`, 20, H - 14, { size: 10, color: fps < 30 ? C.red : C.lime });
      if (defeated) banner(ctx, 'ENJAMBRE DESTRUIDO', C.lime, `${d.fit.label}: tu código escala`, t - 4.5);
      else if (!d.passed && t > 1) text(ctx, d.correct ? `${d.fit.label} · cámara lenta` : 'resultados incorrectos', W / 2, H - 14, { align: 'center', size: 10, color: C.red });
    },
  };
}

function chart(ctx, samples, fit) {
  const x0 = 14;
  const y0 = 12;
  const w = 210;
  const h = 120;
  panel(ctx, x0, y0, w, h, C.violet);
  text(ctx, `ops vs n · ${fit.label}`, x0 + 10, y0 + 16, { size: 9, color: C.violet, weight: 700 });
  if (!samples.length) return;
  const maxN = 1600;
  const maxOps = Math.max(1600 * 1600 / 2, ...samples.map((s) => s.ops));
  const px = (n) => x0 + 16 + (n / maxN) * (w - 32);
  const py = (ops) => y0 + h - 14 - (Math.log10(ops + 1) / Math.log10(maxOps + 1)) * (h - 36);
  const ref = (f, col) => {
    ctx.strokeStyle = col;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    for (let n = 50; n <= maxN; n += 50) { const y = py(f(n)); if (n === 50) ctx.moveTo(px(n), y); else ctx.lineTo(px(n), y); }
    ctx.stroke();
    ctx.setLineDash([]);
  };
  ref((n) => n, 'rgba(163,255,61,0.4)');
  ref((n) => n * Math.log2(n), 'rgba(255,181,52,0.4)');
  ref((n) => (n * n) / 2, 'rgba(255,71,103,0.4)');
  const col = { n2: C.red, n3: C.red, nlogn: C.amber, n: C.lime, o1: C.lime }[fit.cls] || C.cyan;
  glow(ctx, col, 10);
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.beginPath();
  samples.forEach((s, i) => (i ? ctx.lineTo(px(s.n), py(s.ops)) : ctx.moveTo(px(s.n), py(s.ops))));
  ctx.stroke();
  samples.forEach((s) => { ctx.beginPath(); ctx.arc(px(s.n), py(s.ops), 2.5, 0, Math.PI * 2); ctx.fill(); });
  noGlow(ctx);
  text(ctx, 'n  n·log n  n²', x0 + w - 12, y0 + h - 4, { size: 8, color: C.muted, align: 'right' });
}
