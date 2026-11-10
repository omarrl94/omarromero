// Escena de los niveles de práctica: cada caso de prueba es una cápsula que entra en
// la máquina (tu función) y sale con su resultado; se ilumina en verde o en rojo.
import { W, H, C, glow, noGlow, text, roundRect, banner, ease, Particles } from './common.js';

export function tests() {
  const fx = new Particles();
  let d = { cases: [], fnName: 'f' };
  let t = 0;
  let burst = new Set();
  return {
    setData(data) {
      d = { cases: [], fnName: 'f', ...data };
      t = 0;
      burst = new Set();
      fx.list = [];
    },
    update(dt) {
      t += dt;
      fx.update(dt);
    },
    draw(ctx) {
      const cases = d.cases.slice(0, 6);
      const n = Math.max(cases.length, 1);
      const rowH = Math.min(54, (H - 90) / n);
      const top = 70 + (H - 90 - rowH * n) / 2;
      // máquina central
      const mx = W / 2 - 70;
      const pulse = 0.5 + 0.5 * Math.sin(t * 4);
      glow(ctx, C.violet, 16 + pulse * 8);
      ctx.strokeStyle = C.violet;
      ctx.fillStyle = 'rgba(157,123,255,0.08)';
      roundRect(ctx, mx, top - 14, 140, rowH * n + 10, 12);
      ctx.fill();
      ctx.stroke();
      noGlow(ctx);
      text(ctx, `${d.fnName}( )`, W / 2, 38, { align: 'center', size: 19, weight: 800, color: C.violet });
      text(ctx, 'entrada', 110, 60, { align: 'center', size: 11, color: C.muted });
      text(ctx, 'esperado · tu resultado', W - 125, 60, { align: 'center', size: 11, color: C.muted });
      let passed = 0;
      cases.forEach((c, i) => {
        const y = top + i * rowH + rowH / 2 - 6;
        const k = ease((t - i * 0.35) / 0.6);
        if (k <= 0) return;
        if (c.ok) passed++;
        // cápsula de entrada
        const inX = 20 + (mx - 190) * Math.min(1, k);
        roundRect(ctx, inX, y - 16, 170, 32, 16);
        ctx.fillStyle = 'rgba(34,228,255,0.08)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(34,228,255,0.5)';
        ctx.stroke();
        text(ctx, clip(c.input, 18), inX + 85, y + 5, { align: 'center', size: 14, weight: 700, color: C.cyan });
        // flujo dentro de la máquina
        if (k >= 1) {
          const flow = ((t * 120 + i * 40) % 140);
          ctx.fillStyle = c.ok ? C.lime : c.ran ? C.red : C.muted;
          ctx.fillRect(mx + flow, y - 1, 6, 2);
        }
        // resultado
        const k2 = ease((t - i * 0.35 - 0.6) / 0.5);
        if (k2 <= 0) return;
        const ox = mx + 160;
        const col = c.ok ? C.lime : c.ran ? C.red : C.muted;
        ctx.globalAlpha = k2;
        glow(ctx, col, 10);
        roundRect(ctx, ox, y - 16, W - ox - 20, 32, 16);
        ctx.fillStyle = c.ok ? 'rgba(163,255,61,0.1)' : 'rgba(255,71,103,0.1)';
        ctx.fill();
        ctx.strokeStyle = col;
        ctx.stroke();
        noGlow(ctx);
        text(ctx, clip(c.expected, 9), ox + 14, y + 5, { size: 14, color: C.text });
        text(ctx, c.ok ? '✓' : '✗', ox + 128, y + 5, { size: 16, weight: 800, color: col, align: 'center' });
        text(ctx, clip(c.got, 9), W - 34, y + 5, { size: 14, color: col, align: 'right', weight: 700 });
        ctx.globalAlpha = 1;
        if (k2 >= 1 && !burst.has(i)) {
          burst.add(i);
          fx.burst(W - 60, y, { n: c.ok ? 14 : 6, color: col, speed: 80, life: 0.6 });
        }
      });
      fx.draw(ctx);
      const done = t > cases.length * 0.35 + 1.2;
      const allOk = cases.length > 0 && cases.every((c) => c.ok);
      if (done) {
        text(ctx, `${passed}/${cases.length} casos superados`, W / 2, H - 14, { align: 'center', size: 14, weight: 700, color: allOk ? C.lime : C.amber });
      }
      if (done && allOk && d.passed) banner(ctx, 'FUNCIÓN OPERATIVA', C.lime, 'Todos los casos de prueba en verde', (t - cases.length * 0.35 - 1.2) * 1.5);
      if (!cases.length) text(ctx, 'Escribe tu función: el motor la probará aquí', W / 2, H / 2, { align: 'center', size: 12, color: C.muted });
    },
  };
}

const clip = (s, n) => (String(s).length > n ? `${String(s).slice(0, n - 1)}…` : String(s));
