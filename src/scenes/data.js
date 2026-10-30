// Módulo 3: la bodega (ordenación animada por eventos reales) y el inventario (diccionario).
import { W, H, C, glow, noGlow, text, panel, banner, roundRect, Particles, clamp } from './common.js';

export function cargo() {
  let d = { initial: [], events: [], final: [] };
  let t = 0;
  let arr = [];
  let idx = 0;
  let acc = 0;
  let highlight = [];
  let oob = null;
  let swaps = 0;
  let speed = 30;
  return {
    setData(data) {
      d = { initial: [], events: [], final: [], ...data };
      arr = [...d.initial];
      idx = 0;
      acc = 0;
      t = 0;
      oob = null;
      swaps = 0;
      highlight = [];
      speed = clamp(d.events.length / 4, 12, 400);
    },
    update(dt) {
      t += dt;
      acc += dt * speed;
      while (acc >= 1 && idx < d.events.length) {
        acc -= 1;
        const e = d.events[idx++];
        if (e.op === 'get') highlight = [e.i, ...highlight].slice(0, 2);
        if (e.op === 'set') { arr[e.i] = e.v; swaps += 0.5; highlight = [e.i]; }
        if (e.op === 'oob') { oob = e.i; break; }
      }
    },
    draw(ctx) {
      const n = Math.max(arr.length, 1);
      const slot = (W - 120) / (n + 1);
      const baseY = 290;
      const max = Math.max(...d.initial, 1);
      // casco de la nave
      const done = idx >= d.events.length && !oob;
      const sorted = arr.every((x, i) => i === 0 || arr[i - 1] <= x);
      const tilt = done && sorted ? 0 : Math.sin(t * 2) * 0.03 * (sorted ? 0.3 : 1);
      ctx.save();
      ctx.translate(W / 2, baseY);
      ctx.rotate(tilt);
      ctx.translate(-W / 2, -baseY);
      ctx.strokeStyle = C.dim;
      ctx.lineWidth = 2;
      roundRect(ctx, 40, 70, W - 80, 240, 18);
      ctx.stroke();
      arr.forEach((v, i) => {
        const h = 20 + (v / max) * 170;
        const x = 70 + i * slot;
        const hl = highlight.includes(i);
        const col = done && sorted ? C.lime : hl ? C.magenta : C.amber;
        glow(ctx, col, hl ? 18 : 8);
        ctx.fillStyle = hl ? 'rgba(255,61,240,0.25)' : 'rgba(255,181,52,0.12)';
        ctx.strokeStyle = col;
        roundRect(ctx, x, baseY - h, slot - 10, h, 4);
        ctx.fill();
        ctx.stroke();
        noGlow(ctx);
        text(ctx, String(v), x + (slot - 10) / 2, baseY - h - 6, { align: 'center', size: 10, color: col });
        text(ctx, `[${i}]`, x + (slot - 10) / 2, baseY + 14, { align: 'center', size: 9, color: C.muted });
      });
      if (oob !== null) {
        const x = 70 + oob * slot;
        ctx.save();
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 14);
        ctx.setLineDash([4, 3]);
        glow(ctx, C.red, 20);
        ctx.strokeStyle = C.red;
        roundRect(ctx, x, baseY - 120, slot - 10, 120, 4);
        ctx.stroke();
        ctx.restore();
        noGlow(ctx);
        text(ctx, `[${oob}] ???`, x + (slot - 10) / 2, baseY - 128, { align: 'center', size: 10, color: C.red, weight: 700 });
      }
      ctx.restore();
      panel(ctx, 14, 12, 220, 46, C.amber);
      text(ctx, `eventos ${idx}/${d.events.length}`, 24, 30, { size: 10, color: C.amber });
      text(ctx, `escrituras ${Math.round(swaps * 2)}`, 24, 46, { size: 10, color: C.muted });
      if (done && sorted && arr.length) banner(ctx, 'BODEGA EQUILIBRADA', C.lime, 'Centro de masas estable', (t - d.events.length / speed) * 0.8);
      if (oob !== null) banner(ctx, 'FUERA DE LÍMITES', C.red, `Acceso al índice ${oob} de un array de ${arr.length}`, 1);
    },
  };
}

const ITEM = {
  ore: { color: C.amber, label: 'ORE' },
  fuel: { color: C.lime, label: 'FUEL' },
  chip: { color: C.violet, label: 'CHIP' },
};

export function inventory() {
  const fx = new Particles();
  let d = { pickups: [], counts: {} };
  let t = 0;
  const slots = { ore: 150, fuel: 320, chip: 490 };
  return {
    setData(data) {
      d = { pickups: [], counts: {}, ...data };
      t = 0;
      fx.list = [];
    },
    update(dt) {
      t += dt;
      fx.update(dt);
    },
    draw(ctx) {
      const per = 0.45;
      // rayo tractor
      glow(ctx, C.cyan, 20);
      ctx.strokeStyle = 'rgba(34,228,255,0.25)';
      ctx.lineWidth = 30;
      ctx.beginPath();
      ctx.moveTo(0, 90);
      ctx.lineTo(W, 90);
      ctx.stroke();
      noGlow(ctx);
      ctx.lineWidth = 1;
      text(ctx, 'RAYO TRACTOR', 14, 72, { size: 9, color: C.cyan });
      const arrived = { ore: 0, fuel: 0, chip: 0 };
      d.pickups.forEach((p, i) => {
        const start = i * per;
        const k = clamp((t - start) / 1.1, 0, 1);
        if (k <= 0) return;
        const slotX = slots[p];
        if (k < 1) {
          const x = -20 + (slotX + 20) * k;
          const y = 90 + Math.max(0, k - 0.6) / 0.4 * 120;
          drawItem(ctx, x, y, p, 1);
        } else {
          arrived[p]++;
        }
      });
      Object.entries(slots).forEach(([name, x]) => {
        const it = ITEM[name];
        const want = d.pickups.filter((p) => p === name).length;
        const got = d.counts[name];
        const ok = got === want;
        panel(ctx, x - 60, 190, 120, 130, it.color);
        text(ctx, it.label, x, 210, { align: 'center', color: it.color, size: 11, weight: 700 });
        // apila los que han llegado; si el contador está mal, solo «sobreviven» los contados
        const visible = Math.min(arrived[name], typeof got === 'number' ? got : 0);
        for (let k = 0; k < visible; k++) drawItem(ctx, x - 36 + (k % 4) * 24, 290 - Math.floor(k / 4) * 24, name, 0.9);
        if (arrived[name] > visible && Math.sin(t * 20) > 0) {
          text(ctx, 'sobrescrito', x, 250, { align: 'center', size: 9, color: C.red });
        }
        const done = t > d.pickups.length * per + 1.2;
        text(ctx, `${got ?? '—'}`, x + 46, 214, { align: 'right', size: 14, weight: 800, color: done ? (ok ? C.lime : C.red) : C.text });
      });
      fx.draw(ctx);
      text(ctx, `counts = ${JSON.stringify(d.counts)}`, W / 2, 345, { align: 'center', size: 10, color: C.muted });
      if (d.passed && t > d.pickups.length * per + 1.4) banner(ctx, 'INVENTARIO SINCRONIZADO', C.lime, 'Tabla hash O(1) operativa', 1);
    },
  };
}

function drawItem(ctx, x, y, kind, s) {
  const it = ITEM[kind];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  glow(ctx, it.color, 10);
  ctx.strokeStyle = it.color;
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (kind === 'ore') { for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9); } }
  else if (kind === 'fuel') { ctx.rect(-6, -9, 12, 18); }
  else { ctx.moveTo(0, -9); ctx.lineTo(9, 0); ctx.lineTo(0, 9); ctx.lineTo(-9, 0); }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
