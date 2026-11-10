// Escena de las misiones de programa: la pantalla de la nave. Cada línea que escribe
// tu programa aparece tecleada en el monitor; si coincide con lo que pide la misión
// se ilumina en verde, y si no, en ámbar.
import { W, H, C, glow, noGlow, text, roundRect, makeStars, drawStars, Particles } from './common.js';

const clip = (s, n) => (String(s).length > n ? `${String(s).slice(0, n - 1)}…` : String(s));

export function screen() {
  const stars = makeStars(60, 21);
  const fx = new Particles();
  let d = { lines: [], missing: 0, title: 'PANTALLA' };
  let t = 0;
  let celebrated = false;
  return {
    setData(data) {
      d = { lines: [], missing: 0, title: 'PANTALLA', ...data };
      t = 0;
      celebrated = false;
      fx.list = [];
    },
    update(dt) {
      t += dt;
      fx.update(dt);
    },
    draw(ctx) {
      drawStars(ctx, stars, t, 4);
      const x0 = 70;
      const y0 = 34;
      const w = W - 140;
      const h = H - 84;
      // monitor
      const allOk = d.lines.length > 0 && d.lines.every((l) => l.ok) && !d.missing;
      const frame = d.passed ? C.lime : C.cyan;
      glow(ctx, frame, 18);
      roundRect(ctx, x0, y0, w, h, 14);
      ctx.fillStyle = 'rgba(8,12,22,0.94)';
      ctx.fill();
      ctx.strokeStyle = frame;
      ctx.lineWidth = 2;
      ctx.stroke();
      noGlow(ctx);
      ctx.lineWidth = 1;
      // peana
      ctx.fillStyle = C.dim;
      ctx.fillRect(W / 2 - 34, y0 + h, 68, 10);
      roundRect(ctx, W / 2 - 80, y0 + h + 10, 160, 8, 4);
      ctx.fill();
      // cabecera
      text(ctx, `▚ ${d.title}`, x0 + 16, y0 + 22, { size: 11, weight: 700, color: frame });
      ctx.fillStyle = 'rgba(34,228,255,0.18)';
      ctx.fillRect(x0 + 12, y0 + 30, w - 24, 1);
      [C.red, C.amber, C.lime].forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(x0 + w - 20 - i * 14, y0 + 18, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      const total = d.lines.length + d.missing;
      const two = total > 8;
      const perCol = two ? Math.ceil(total / 2) : Math.max(total, 1);
      const rowH = Math.min(30, (h - 56) / Math.max(perCol, 4));
      const size = two ? 13 : rowH >= 28 ? 17 : 15;
      const colW = two ? (w - 40) / 2 : w - 40;
      const max = two ? 16 : 34;
      const SPEED = 38; // caracteres por segundo
      let budget = t * SPEED;
      const place = (i) => ({ x: x0 + 22 + (two && i >= perCol ? colW : 0), y: y0 + 56 + (two && i >= perCol ? i - perCol : i) * rowH });
      d.lines.forEach((line, i) => {
        if (budget <= 0) return;
        const { x, y } = place(i);
        const full = clip(line.text, max);
        const shown = full.slice(0, Math.floor(budget));
        budget -= full.length + 6;
        const done = shown.length === full.length;
        const col = !done ? C.text : line.ok ? C.lime : C.amber;
        text(ctx, '>', x, y, { size, color: C.muted });
        if (done && line.ok) glow(ctx, C.lime, 8);
        text(ctx, shown, x + size, y, { size, weight: 700, color: col });
        noGlow(ctx);
        if (done) text(ctx, line.ok ? '✓' : '≠', x + colW - 24, y, { size, weight: 800, color: col, align: 'right' });
      });
      const typed = budget > 0;
      // huecos de las líneas que faltan
      if (typed) {
        for (let k = 0; k < d.missing; k++) {
          const { x, y } = place(d.lines.length + k);
          text(ctx, '>', x, y, { size, color: C.dim });
          ctx.strokeStyle = C.dim;
          ctx.setLineDash([4, 4]);
          roundRect(ctx, x + size, y - size + 2, Math.min(colW - 60, 150), size + 2, 4);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      // cursor parpadeante en la pantalla vacía
      if (!d.lines.length && Math.sin(t * 7) > 0) {
        const p0 = place(0);
        ctx.fillStyle = C.cyan;
        ctx.fillRect(p0.x + size, p0.y - size + 3, size * 0.55, size);
      }
      if (!d.lines.length) text(ctx, 'La pantalla está vacía: tu programa aún no ha escrito nada', W / 2, y0 + h - 16, { align: 'center', size: 10, color: C.muted });
      else if (typed && d.missing) text(ctx, d.missing === 1 ? 'Falta 1 línea' : `Faltan ${d.missing} líneas`, W / 2, y0 + h - 16, { align: 'center', size: 11, color: C.amber, weight: 700 });
      else if (typed && !allOk) text(ctx, 'Las líneas en ámbar no dicen lo que pide la misión', W / 2, y0 + h - 16, { align: 'center', size: 10, color: C.amber });

      if (typed && d.passed) {
        if (!celebrated) {
          celebrated = true;
          fx.burst(W / 2, H / 2, { n: 70, color: C.lime, speed: 190, life: 1.1 });
          fx.burst(W / 2, H / 2, { n: 40, color: C.cyan, speed: 120, life: 0.9 });
        }
        text(ctx, '● PROGRAMA CORRECTO', W / 2, H - 14, { align: 'center', size: 13, weight: 800, color: C.lime });
      }
      fx.draw(ctx);
    },
  };
}
