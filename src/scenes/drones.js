// Módulo 2: el dron centinela recorre la ruta que generan tus bucles y condicionales.
import { W, H, C, glow, noGlow, text, grid, Particles, banner } from './common.js';

export function drones() {
  const fx = new Particles();
  let d = { route: [], expected: [] };
  let t = 0;
  let pos = 0;
  let hits = 0;
  let lastShot = 0;
  return {
    setData(data) {
      d = { route: [], expected: [], ...data };
      t = 0;
      pos = 0;
      hits = 0;
      fx.list = [];
    },
    update(dt) {
      t += dt;
      fx.update(dt);
      if (d.route.length > 1) pos = (pos + dt * 1.6) % (d.route.length - 1);
      if (d.turret && !d.passed && t - lastShot > 0.9 && d.route.length) {
        lastShot = t;
        const p = pointAt(d.route, pos);
        fx.burst(p.x, p.y, { n: 18, color: C.red, speed: 90, life: 0.5 });
        hits++;
      }
    },
    draw(ctx) {
      grid(ctx);
      ctx.save();
      ctx.strokeStyle = 'rgba(163,255,61,0.35)';
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(8, 8, W - 16, H - 16);
      ctx.setLineDash([]);
      ctx.restore();
      text(ctx, 'ZONA SEGURA 640×360', 16, 24, { size: 9, color: C.lime, alpha: 0.7 });
      // ruta esperada (fantasma)
      for (const p of d.expected) {
        ctx.strokeStyle = 'rgba(122,131,173,0.45)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
      // ruta del usuario
      if (d.route.length) {
        glow(ctx, C.cyan, 10);
        ctx.strokeStyle = C.cyan;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        d.route.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.stroke();
        noGlow(ctx);
        d.route.forEach((p, i) => {
          const out = p.x < 0 || p.x > W || p.y < 0 || p.y > H;
          const col = out ? C.red : C.cyan;
          glow(ctx, col, 12);
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(Math.min(Math.max(p.x, 6), W - 6), Math.min(Math.max(p.y, 6), H - 6), out ? 6 + Math.sin(t * 10) * 2 : 4, 0, Math.PI * 2);
          ctx.fill();
          noGlow(ctx);
          text(ctx, out ? `#${i} (${p.x},${p.y}) FUERA` : `#${i}`, Math.min(p.x, W - 70), Math.min(Math.max(p.y - 12, 14), H - 8), { size: 9, color: col });
        });
        if (d.route.length > 1) {
          const p = pointAt(d.route, pos);
          const n = pointAt(d.route, Math.min(pos + 0.05, d.route.length - 1.001));
          const ang = Math.atan2(n.y - p.y, n.x - p.x);
          const outNow = p.x > W || p.x < 0;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(ang);
          if (outNow) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
          glow(ctx, outNow ? C.red : C.lime, 16);
          ctx.strokeStyle = outNow ? C.red : C.lime;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(10, 0); ctx.lineTo(-7, -7); ctx.lineTo(-3, 0); ctx.lineTo(-7, 7); ctx.closePath();
          ctx.stroke();
          ctx.restore();
          noGlow(ctx);
        }
      } else {
        text(ctx, 'Sin ruta: llama a waypoint(x, y)', W / 2, H / 2, { align: 'center', color: C.muted, size: 12 });
      }
      if (d.turret) {
        ctx.save();
        ctx.translate(W - 40, H - 30);
        glow(ctx, C.red, 14);
        ctx.fillStyle = C.red;
        ctx.fillRect(-14, -6, 28, 12);
        ctx.restore();
        noGlow(ctx);
        text(ctx, d.passed ? 'TORRETA: objetivo impredecible' : `TORRETA: ${hits} impactos`, W - 16, H - 46, { align: 'right', size: 9, color: d.passed ? C.lime : C.red });
      }
      fx.draw(ctx);
      if (d.passed && t > 1.5) banner(ctx, 'RUTA VALIDADA', C.lime, `${d.route.length} waypoints dentro de la zona`, t - 1.5);
    },
  };
}

function pointAt(route, f) {
  const i = Math.floor(f);
  const k = f - i;
  const a = route[i];
  const b = route[Math.min(i + 1, route.length - 1)];
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
}
