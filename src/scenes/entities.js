// Módulo 4: el árbol de clases se dibuja y cada clase se instancia en la arena.
// El motor llama a update() de cada entidad: el polimorfismo se ve moverse.
import { W, H, C, glow, noGlow, text, panel, roundRect, banner, Particles } from './common.js';

const COLORS = { Entity: C.muted, Player: C.cyan, Enemy: C.red, Obstacle: '#9aa3c7' };

export function entities() {
  const fx = new Particles();
  let d = { tree: [] };
  let t = 0;
  let actors = [];
  const keys = new Set();
  const arena = { x: 230, y: 20, w: 396, h: 320 };
  const onKey = (e) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    if (e.target && /TEXTAREA|INPUT/.test(e.target.tagName)) return;
    if (e.type === 'keydown') keys.add(e.key);
    else keys.delete(e.key);
  };
  return {
    setData(data) {
      d = { tree: [], ...data };
      t = 0;
      fx.list = [];
      const kids = d.tree.filter((c) => c.parent);
      actors = kids.map((c, i) => ({
        cls: c,
        x: arena.x + 60 + (i % 3) * 120,
        y: arena.y + 80 + Math.floor(i / 3) * 100 + (c.name === 'Obstacle' ? 120 : 0),
        vx: c.overrides ? c.motion.vx * 40 : 0,
        vy: c.overrides ? c.motion.vy * 40 : 0,
      }));
    },
    mount() {
      window.addEventListener('keydown', onKey);
      window.addEventListener('keyup', onKey);
    },
    unmount() {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    },
    update(dt) {
      t += dt;
      fx.update(dt);
      for (const a of actors) {
        let vx = a.vx;
        let vy = a.vy;
        if (a.cls.name === 'Player') {
          if (keys.has('ArrowLeft')) vx -= 120;
          if (keys.has('ArrowRight')) vx += 120;
          if (keys.has('ArrowUp')) vy -= 120;
          if (keys.has('ArrowDown')) vy += 120;
        }
        a.x += vx * dt;
        a.y += vy * dt;
        if (a.x < arena.x + 12 || a.x > arena.x + arena.w - 12) { a.vx *= -1; a.x = Math.min(Math.max(a.x, arena.x + 12), arena.x + arena.w - 12); }
        if (a.y < arena.y + 12 || a.y > arena.y + arena.h - 12) { a.vy *= -1; a.y = Math.min(Math.max(a.y, arena.y + 12), arena.y + arena.h - 12); }
      }
      const p = actors.find((a) => a.cls.name === 'Player');
      for (const e of actors.filter((a) => a.cls.name === 'Enemy')) {
        if (p && Math.hypot(p.x - e.x, p.y - e.y) < 22 && Math.random() < 0.2) fx.burst((p.x + e.x) / 2, (p.y + e.y) / 2, { n: 12, color: C.magenta, speed: 80, life: 0.4 });
      }
    },
    draw(ctx) {
      // árbol de clases
      panel(ctx, 10, 20, 206, 320, C.violet);
      text(ctx, 'JERARQUÍA', 22, 40, { size: 10, color: C.violet, weight: 700 });
      const root = d.tree.find((c) => !c.parent) || null;
      const kids = d.tree.filter((c) => c.parent);
      const node = (c, x, y) => {
        const col = COLORS[c.name] || C.violet;
        glow(ctx, col, 8);
        ctx.strokeStyle = col;
        ctx.fillStyle = 'rgba(13,16,25,0.9)';
        roundRect(ctx, x - 50, y - 13, 100, 26, 6);
        ctx.fill();
        ctx.stroke();
        noGlow(ctx);
        text(ctx, c.name, x, y + 4, { align: 'center', size: 10, color: col, weight: 700 });
        if (c.parent) text(ctx, c.overrides ? '⟲ update()' : 'update() heredado', x, y + 24, { align: 'center', size: 8, color: c.overrides ? C.lime : C.muted });
      };
      if (root) {
        node(root, 113, 76);
        kids.forEach((c, i) => {
          const y = 136 + i * 50;
          ctx.strokeStyle = c.parent === root.name ? 'rgba(157,123,255,0.6)' : 'rgba(255,71,103,0.6)';
          ctx.beginPath();
          ctx.moveTo(113, 89);
          ctx.lineTo(113, y - 13);
          ctx.stroke();
          node(c, 113, y);
        });
      } else {
        text(ctx, 'Sin clase base Entity', 113, 90, { align: 'center', size: 10, color: C.red });
      }
      // arena
      ctx.strokeStyle = 'rgba(34,228,255,0.25)';
      roundRect(ctx, arena.x, arena.y, arena.w, arena.h, 10);
      ctx.stroke();
      text(ctx, 'ARENA · flechas para mover a Player', arena.x + 10, arena.y + 16, { size: 9, color: C.muted });
      for (const a of actors) {
        const col = COLORS[a.cls.name] || C.violet;
        ctx.save();
        ctx.translate(a.x, a.y);
        glow(ctx, col, 14);
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (a.cls.name === 'Player') { ctx.moveTo(12, 0); ctx.lineTo(-8, -8); ctx.lineTo(-8, 8); }
        else if (a.cls.name === 'Enemy') { ctx.rotate(t * 2); ctx.moveTo(0, -11); ctx.lineTo(11, 0); ctx.lineTo(0, 11); ctx.lineTo(-11, 0); }
        else if (a.cls.name === 'Obstacle') { ctx.rect(-14, -14, 28, 28); }
        else { ctx.arc(0, 0, 10, 0, Math.PI * 2); }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        noGlow(ctx);
        text(ctx, a.cls.name, a.x, a.y + 24, { align: 'center', size: 8, color: col });
      }
      fx.draw(ctx);
      if (d.passed) banner(ctx, 'POLIMORFISMO ACTIVO', C.lime, 'Un solo bucle: entity.update() para todos', t - 1);
      if (!d.tree.length) text(ctx, 'Define tus clases para verlas nacer aquí', arena.x + arena.w / 2, H / 2, { align: 'center', size: 11, color: C.muted });
      void W;
    },
  };
}
