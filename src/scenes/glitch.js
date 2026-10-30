// Bug Visualizer: cada error corrompe el mundo. Los fragmentos corruptos son los
// frames del stack trace: al pulsarlos, el editor salta a la línea culpable.
import { W, H, C, text } from './common.js';

export function createGlitch() {
  let err = null;
  let t = 0;
  let level = 0;
  let fragments = [];
  return {
    set(error, file) {
      if (error) {
        const frames = error.frames && error.frames.length ? error.frames : [{ fn: null, line: error.line }];
        fragments = frames.slice(0, 4).map((f, i) => ({
          label: `${file}:${f.line ?? '?'}${f.fn ? ` · ${f.fn}()` : ''}`,
          line: f.line,
          x: 120 + ((i * 157) % 380),
          y: 90 + ((i * 83) % 180),
          w: 170,
          h: 34,
          ph: Math.random() * 6,
        }));
      }
      err = error;
    },
    get active() {
      return level > 0.02;
    },
    update(dt) {
      t += dt;
      level += ((err ? 1 : 0) - level) * Math.min(1, dt * (err ? 6 : 3));
    },
    /** Se dibuja después de la escena: desplaza bandas del propio canvas y superpone ruido. */
    draw(ctx, canvas, scale) {
      if (level < 0.02) return;
      const L = level;
      ctx.save();
      // separación RGB y desgarros horizontales
      const bands = 6;
      for (let i = 0; i < bands; i++) {
        if (Math.random() > 0.55 * L) continue;
        const y = Math.random() * H;
        const h = 4 + Math.random() * 24;
        const dx = (Math.random() - 0.5) * 40 * L;
        try {
          ctx.globalAlpha = 0.85;
          ctx.drawImage(canvas, scale.ox, y * scale.s + scale.oy, W * scale.s, h * scale.s, dx, y, W, h);
        } catch {
          /* canvas aún sin contenido */
        }
      }
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.18 * L;
      ctx.fillStyle = C.red;
      ctx.fillRect(Math.sin(t * 30) * 3, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      // bloques corruptos
      ctx.globalAlpha = 0.5 * L;
      for (let i = 0; i < 14; i++) {
        ctx.fillStyle = [C.red, C.magenta, C.cyan][i % 3];
        ctx.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 30, 2 + Math.random() * 6);
      }
      // scanlines
      ctx.globalAlpha = 0.12 * L;
      ctx.fillStyle = '#000';
      for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
      ctx.restore();
      if (!err) return;
      // fragmentos del stack trace (interactivos)
      for (const f of fragments) {
        const jx = Math.sin(t * 9 + f.ph) * 2;
        const jy = Math.cos(t * 7 + f.ph) * 2;
        ctx.save();
        ctx.globalAlpha = L;
        ctx.fillStyle = 'rgba(30,6,14,0.92)';
        ctx.strokeStyle = C.red;
        ctx.shadowColor = C.red;
        ctx.shadowBlur = 16;
        ctx.fillRect(f.x + jx, f.y + jy, f.w, f.h);
        ctx.strokeRect(f.x + jx + 0.5, f.y + jy + 0.5, f.w, f.h);
        ctx.restore();
        text(ctx, '⚠ FRAGMENTO CORRUPTO', f.x + jx + 8, f.y + jy + 13, { size: 8, color: C.magenta, weight: 700, alpha: L });
        text(ctx, f.label, f.x + jx + 8, f.y + jy + 27, { size: 10, color: '#ffd1da', alpha: L });
      }
      text(ctx, 'Pulsa un fragmento para saltar a la línea del stack trace', W / 2, H - 10, { align: 'center', size: 9, color: '#ffd1da', alpha: L * (0.6 + 0.4 * Math.sin(t * 4)) });
    },
    hit(x, y) {
      if (!err) return null;
      const f = fragments.find((fr) => x >= fr.x - 4 && x <= fr.x + fr.w + 4 && y >= fr.y - 4 && y <= fr.y + fr.h + 4);
      return f ? f.line : null;
    },
  };
}
