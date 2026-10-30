// Módulo 1: la lanzadera (gravedad y tipos) y el reactor (overflow).
import { W, H, C, glow, noGlow, text, makeStars, drawStars, Particles, panel, banner, clamp, ease, fmtNum, roundRect } from './common.js';

export function lander() {
  const stars = makeStars(110, 3);
  const fx = new Particles();
  let d = {};
  let t = 0;
  let y = 40;
  let vy = 0;
  let state = 'falling';
  let shake = 0;
  const ground = 300;
  const terrain = Array.from({ length: 33 }, (_, i) => ground + Math.sin(i * 1.7) * 6 + Math.sin(i * 0.6) * 9);
  return {
    setData(data) {
      d = data;
      t = 0;
      y = 40;
      vy = 0;
      state = 'falling';
      fx.list = [];
    },
    update(dt) {
      t += dt;
      fx.update(dt);
      shake = Math.max(0, shake - dt * 2);
      if (state !== 'falling') return;
      if (d.gravityBroken && d.gravity === null) {
        // Tipo incorrecto: la física no puede integrarse → la nave tiembla congelada.
        y = 120 + Math.sin(t * 40) * 2;
        return;
      }
      const g = (d.gravity || 0) * 9;
      const retro = d.passed && y > 200 ? -g * 1.9 : 0;
      vy += (g + retro) * dt;
      if (d.passed && vy < 20 && y > 200) vy = 20;
      y += vy * dt;
      if (y >= ground - 14) {
        y = ground - 14;
        if (d.passed) {
          state = 'landed';
          fx.burst(W / 2, ground, { n: 40, color: '#8c7a5c', speed: 70, life: 1.2, dir: -Math.PI / 2, spread: Math.PI, gravity: 60 });
        } else {
          state = 'crashed';
          shake = 1;
          fx.burst(W / 2, ground - 10, { n: 120, color: C.amber, speed: 220, life: 1.4, size: 3, gravity: 120 });
          fx.burst(W / 2, ground - 10, { n: 60, color: C.red, speed: 150, life: 1.1, size: 2 });
        }
      }
    },
    draw(ctx) {
      ctx.save();
      if (shake) ctx.translate((Math.random() - 0.5) * 10 * shake, (Math.random() - 0.5) * 10 * shake);
      drawStars(ctx, stars, t, 2);
      // planeta
      const grad = ctx.createLinearGradient(0, ground - 20, 0, H);
      grad.addColorStop(0, '#1d1530');
      grad.addColorStop(1, '#0a0812');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, H);
      terrain.forEach((ty, i) => ctx.lineTo(i * 20, ty));
      ctx.lineTo(W, H);
      ctx.fill();
      glow(ctx, C.violet, 10);
      ctx.strokeStyle = C.violet;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      terrain.forEach((ty, i) => (i ? ctx.lineTo(i * 20, ty) : ctx.moveTo(0, ty)));
      ctx.stroke();
      noGlow(ctx);
      // plataforma
      ctx.fillStyle = C.lime;
      glow(ctx, C.lime, 12);
      ctx.fillRect(W / 2 - 40, ground - 2, 80, 3);
      noGlow(ctx);
      if (state !== 'crashed') {
        ctx.save();
        ctx.translate(W / 2, y);
        if (d.gravityBroken) ctx.translate((Math.random() - 0.5) * 4, 0);
        glow(ctx, C.cyan, 14);
        ctx.strokeStyle = C.cyan;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(12, 8);
        ctx.lineTo(-12, 8);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-10, 8); ctx.lineTo(-15, 15);
        ctx.moveTo(10, 8); ctx.lineTo(15, 15);
        ctx.stroke();
        if (d.passed && y > 200 && state === 'falling') {
          ctx.fillStyle = C.amber;
          glow(ctx, C.amber, 18);
          ctx.beginPath();
          ctx.moveTo(-5, 10);
          ctx.lineTo(5, 10);
          ctx.lineTo(0, 22 + Math.random() * 10);
          ctx.fill();
        }
        if (d.shields) {
          ctx.strokeStyle = `rgba(163,255,61,${0.35 + 0.2 * Math.sin(t * 5)})`;
          glow(ctx, C.lime, 16);
          ctx.beginPath();
          ctx.arc(0, -2, 26, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
      fx.draw(ctx);
      ctx.restore();
      // HUD
      panel(ctx, 12, 12, 196, 82);
      text(ctx, 'NOVA · TELEMETRÍA', 22, 30, { color: C.cyan, size: 10, weight: 700 });
      text(ctx, `g      ${d.gravity === null || d.gravity === undefined ? 'NaN' : d.gravity} m/s²`, 22, 48, { color: d.gravityBroken ? C.red : C.text, size: 10 });
      text(ctx, `masa   ${fmtNum(d.mass || 0)} kg`, 22, 62, { size: 10 });
      text(ctx, `escudo ${d.shields ? 'ON' : 'OFF'}`, 22, 76, { color: d.shields ? C.lime : C.muted, size: 10 });
      text(ctx, `piloto ${d.pilot || '???'}`, 22, 88, { color: C.magenta, size: 10 });
      text(ctx, `v = ${vy.toFixed(1)} px/s`, W - 16, 28, { align: 'right', size: 10, color: C.muted });
      if (state === 'landed') banner(ctx, 'TOUCHDOWN', C.lime, `Bienvenido a Kepler-9, ${d.pilot}`, t - 1.5);
      if (state === 'crashed') banner(ctx, 'IMPACTO', C.red, 'Las leyes de tu mundo no son coherentes', t - 1.2);
      if (d.gravityBroken && d.gravity === null) banner(ctx, 'FÍSICA CORRUPTA', C.red, 'gravity no es un número: no se puede integrar', 1);
    },
  };
}

export function reactor() {
  const fx = new Particles();
  let d = {};
  let t = 0;
  let exploded = false;
  const INT_MAX = 2147483647;
  return {
    setData(data) {
      d = data;
      t = 0;
      exploded = false;
      fx.list = [];
    },
    update(dt) {
      t += dt;
      fx.update(dt);
      const prog = ease(t / 2.5);
      if (d.overflow && prog > 0.75 && !exploded) {
        exploded = true;
        fx.burst(W / 2, 175, { n: 220, color: C.magenta, speed: 260, life: 1.6, size: 3 });
        fx.burst(W / 2, 175, { n: 140, color: C.amber, speed: 180, life: 1.3, size: 2 });
      }
    },
    draw(ctx) {
      const prog = ease(t / 2.5);
      const target = d.overflow ? 3e9 : d.total || 0;
      const shown = target * prog;
      ctx.save();
      if (exploded && t < 3.5) ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
      // motores
      for (let i = 0; i < 4; i++) {
        const x = 110 + i * 140;
        const fill = prog;
        panel(ctx, x - 26, 60, 52, 150, C.cyan);
        const hgt = 130 * fill;
        const col = exploded ? C.red : C.cyan;
        const g = ctx.createLinearGradient(0, 200 - hgt, 0, 200);
        g.addColorStop(0, col);
        g.addColorStop(1, 'rgba(34,228,255,0.05)');
        ctx.fillStyle = g;
        glow(ctx, col, 16);
        ctx.fillRect(x - 18, 200 - hgt, 36, hgt);
        noGlow(ctx);
        text(ctx, `M${i + 1}`, x, 225, { align: 'center', size: 10, color: C.muted });
        text(ctx, '750M N', x, 240, { align: 'center', size: 9, color: C.muted });
      }
      // núcleo
      if (!exploded) {
        const pulse = 18 + Math.sin(t * 6) * 3 + prog * 10;
        glow(ctx, d.overflow && prog > 0.6 ? C.red : C.magenta, 30);
        ctx.fillStyle = d.overflow && prog > 0.6 ? C.red : C.magenta;
        ctx.beginPath();
        ctx.arc(W / 2, 135, pulse, 0, Math.PI * 2);
        ctx.fill();
        noGlow(ctx);
      }
      ctx.restore();
      fx.draw(ctx);
      // medidor de rango de 32 bits
      const barX = 60;
      const barW = W - 120;
      const y0 = 285;
      panel(ctx, barX - 10, y0 - 26, barW + 20, 70, C.violet);
      text(ctx, `totalThrust : ${d.typeName || '?'}`, barX, y0 - 10, { size: 10, color: C.violet, weight: 700 });
      roundRect(ctx, barX, y0, barW, 10, 4);
      ctx.fillStyle = '#151a2b';
      ctx.fill();
      const lim = barX + barW * (INT_MAX / 3.5e9);
      ctx.strokeStyle = C.red;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(lim, y0 - 6);
      ctx.lineTo(lim, y0 + 16);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'INT_MAX 2.147.483.647', lim, y0 + 28, { size: 9, align: 'center', color: C.red });
      let display = shown;
      if (d.overflow && shown > INT_MAX) display = shown - 2 ** 32;
      const px = display >= 0 ? barW * clamp(display / 3.5e9, 0, 1) : 0;
      ctx.fillStyle = display < 0 ? C.red : C.lime;
      glow(ctx, ctx.fillStyle, 10);
      roundRect(ctx, barX, y0, Math.max(2, px), 10, 4);
      ctx.fill();
      noGlow(ctx);
      text(ctx, `${fmtNum(display)} N`, W - barX, y0 - 10, { align: 'right', size: 11, weight: 700, color: display < 0 ? C.red : C.lime });
      if (d.fuel) {
        panel(ctx, 14, 14, 210, 40, C.amber);
        text(ctx, `celdas/motor: ${d.fuel.perEngine}`, 24, 30, { size: 10, color: Number.isInteger(d.fuel.perEngine) ? C.amber : C.red });
        text(ctx, `reserva: ${d.fuel.reserve}`, 24, 44, { size: 10, color: C.amber });
      }
      if (exploded) banner(ctx, 'OVERFLOW', C.red, 'El empuje dio la vuelta y se volvió negativo', t - 2.2);
      else if (d.passed && prog > 0.98) banner(ctx, 'REACTOR ESTABLE', C.lime, '3.000.000.000 N en 64 bits', t - 2.6);
    },
  };
}
