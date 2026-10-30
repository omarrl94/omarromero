// Módulo 5: el heap de C visualizado (malloc/free) y las sondas concurrentes.
import { W, H, C, glow, noGlow, text, panel, roundRect, banner, clamp, Particles } from './common.js';

export function heap() {
  const fx = new Particles();
  let d = { blocks: [], events: [] };
  let t = 0;
  let step = 0;
  return {
    setData(data) {
      d = { blocks: [], events: [], ...data };
      t = 0;
      step = 0;
      fx.list = [];
    },
    update(dt) {
      t += dt;
      fx.update(dt);
      step = Math.min(d.events.length, step + dt * Math.max(6, d.events.length / 3));
    },
    draw(ctx) {
      const shown = d.events.slice(0, Math.floor(step));
      const state = {};
      let fault = null;
      for (const e of shown) {
        if (e.op === 'malloc') state[e.id] = { alive: true, writes: new Set() };
        if (e.op === 'free' && state[e.id]) state[e.id].alive = false;
        if (e.op === 'write' && state[e.id]) state[e.id].writes.add(e.i);
        if (['overflow', 'uaf', 'doublefree'].includes(e.op)) fault = e;
      }
      const finished = step >= d.events.length;
      text(ctx, 'HEAP · 0x5000', 20, 36, { size: 11, color: C.magenta, weight: 700 });
      const x0 = 20;
      const y0 = 70;
      const wTotal = W - 40;
      const bytesTotal = Math.max(128, d.blocks.reduce((s, b) => s + Math.max(b.size, 16) + 16, 0));
      const scale = wTotal / bytesTotal;
      roundRect(ctx, x0, y0, wTotal, 110, 6);
      ctx.fillStyle = 'rgba(255,61,240,0.04)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,61,240,0.25)';
      ctx.stroke();
      let cx = x0 + 8;
      d.blocks.forEach((b) => {
        const st = state[b.id];
        const bw = Math.max(b.size, 16) * scale;
        if (st) {
          const leak = finished && st.alive && d.finished;
          const col = !st.alive ? C.muted : leak ? C.red : C.cyan;
          ctx.save();
          if (leak) ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 8);
          glow(ctx, col, st.alive ? 12 : 0);
          ctx.strokeStyle = col;
          ctx.fillStyle = st.alive ? 'rgba(34,228,255,0.1)' : 'rgba(122,131,173,0.08)';
          roundRect(ctx, cx, y0 + 14, bw - 6, 80, 4);
          ctx.fill();
          ctx.stroke();
          noGlow(ctx);
          const cells = Math.max(1, b.len);
          const cw = (bw - 10) / cells;
          for (let i = 0; i < cells; i++) {
            const written = st.writes.has(i);
            ctx.fillStyle = written ? (st.alive ? C.lime : C.muted) : 'rgba(255,255,255,0.05)';
            ctx.fillRect(cx + 2 + i * cw, y0 + 60, Math.max(1, cw - 2), 26);
            if (cells <= 16 && written) text(ctx, String(b.data[i] ?? ''), cx + 2 + i * cw + cw / 2, y0 + 77, { size: 8, align: 'center', color: '#05060a' });
          }
          if (!st.alive) {
            ctx.strokeStyle = 'rgba(122,131,173,0.4)';
            for (let k = 0; k < bw; k += 8) { ctx.beginPath(); ctx.moveTo(cx + k, y0 + 14); ctx.lineTo(cx + k + 20, y0 + 94); ctx.stroke(); }
          }
          ctx.restore();
          text(ctx, `#${b.id} · ${b.size} B`, cx + 4, y0 + 30, { size: 9, color: col, weight: 700 });
          text(ctx, `0x${b.addr.toString(16)}`, cx + 4, y0 + 44, { size: 8, color: C.muted });
          text(ctx, `${st.alive ? (leak ? 'FUGA' : 'vivo') : 'free'} · L${b.line}`, cx + 4, y0 + 108, { size: 8, color: col });
          if (fault && fault.id === b.id) {
            const fx0 = cx + bw - 6;
            ctx.save();
            ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 16);
            glow(ctx, C.red, 20);
            ctx.fillStyle = C.red;
            ctx.fillRect(fault.op === 'overflow' ? fx0 : cx, y0 + 14, fault.op === 'overflow' ? 24 : bw - 6, 80);
            ctx.restore();
            noGlow(ctx);
          }
        }
        cx += bw;
      });
      // registro de eventos
      panel(ctx, 20, 200, W - 40, 140, C.magenta);
      text(ctx, 'REGISTRO DEL ALLOCATOR', 32, 220, { size: 10, color: C.magenta, weight: 700 });
      const tail = shown.filter((e) => e.op !== 'write').slice(-7);
      tail.forEach((e, i) => {
        const col = { malloc: C.cyan, free: C.muted, overflow: C.red, uaf: C.red, doublefree: C.red }[e.op] || C.text;
        const msg = {
          malloc: `L${e.line}  malloc(${e.size}) → bloque #${e.id}`,
          free: `L${e.line}  free(#${e.id})`,
          overflow: `L${e.line}  ✖ heap-buffer-overflow en #${e.id}[${e.i}]`,
          uaf: `L${e.line}  ✖ use-after-free en #${e.id}`,
          doublefree: `L${e.line}  ✖ double free de #${e.id}`,
        }[e.op];
        text(ctx, msg, 32, 240 + i * 14, { size: 10, color: col });
      });
      const leaks = d.blocks.filter((b) => !b.freed);
      if (finished && d.finished) {
        text(ctx, leaks.length ? `${leaks.reduce((s, b) => s + b.size, 0)} bytes perdidos en ${leaks.length} bloque(s)` : 'Todos los bloques devueltos al sistema', W - 32, 220, { align: 'right', size: 10, color: leaks.length ? C.red : C.lime, weight: 700 });
      }
      fx.draw(ctx);
      if (d.passed && finished) banner(ctx, 'HEAP LIMPIO', C.lime, '0 fugas · 0 corrupciones', t - 1.5);
    },
  };
}

export function concurrency() {
  let d = { concurrent: false, tasks: 3 };
  let t = 0;
  return {
    setData(data) {
      d = { concurrent: false, tasks: 3, ...data };
      t = 0;
    },
    update(dt) {
      t += dt;
    },
    draw(ctx) {
      const lanes = 3;
      const dur = 1;
      const total = d.concurrent ? dur : dur * lanes;
      const sim = Math.min(t * 0.8, total + 0.3);
      text(ctx, d.concurrent ? 'EJECUCIÓN CONCURRENTE' : 'EJECUCIÓN EN SERIE', 20, 30, { size: 11, weight: 700, color: d.concurrent ? C.lime : C.amber });
      text(ctx, `reloj ${Math.min(sim, total).toFixed(2)} s`, W - 20, 30, { align: 'right', size: 11, color: C.text });
      for (let i = 0; i < lanes; i++) {
        const y = 70 + i * 70;
        const start = d.concurrent ? 0 : i * dur;
        const k = clamp((sim - start) / dur, 0, 1);
        panel(ctx, 20, y - 22, W - 40, 52, C.cyan);
        text(ctx, `sector ${i}`, 32, y - 4, { size: 10, color: C.muted });
        const x = 120 + k * (W - 240);
        ctx.strokeStyle = 'rgba(34,228,255,0.2)';
        ctx.beginPath();
        ctx.moveTo(120, y + 4);
        ctx.lineTo(W - 120, y + 4);
        ctx.stroke();
        const col = k >= 1 ? C.lime : k > 0 ? C.cyan : C.dim;
        glow(ctx, col, 14);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(x, y + 4, 7, 0, Math.PI * 2);
        ctx.fill();
        noGlow(ctx);
        text(ctx, k >= 1 ? `+${i * 10} minerales` : k > 0 ? 'escaneando…' : 'en cola', W - 40, y + 8, { align: 'right', size: 10, color: col });
      }
      // línea de tiempo
      const tx = 60;
      const tw = W - 120;
      const ty = 300;
      ctx.strokeStyle = C.dim;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + tw, ty);
      ctx.stroke();
      for (let s = 0; s <= 3; s++) text(ctx, `${s}s`, tx + (tw * s) / 3, ty + 16, { size: 9, align: 'center', color: C.muted });
      for (let i = 0; i < lanes; i++) {
        const start = d.concurrent ? 0 : i * dur;
        ctx.fillStyle = [C.cyan, C.magenta, C.amber][i];
        ctx.globalAlpha = 0.7;
        ctx.fillRect(tx + (tw * start) / 3, ty - 26 + i * 7, (tw * dur) / 3, 5);
        ctx.globalAlpha = 1;
      }
      const done = sim >= total;
      if (done) {
        const val = d.race ? 20 : 30;
        text(ctx, `total = ${val}${d.race ? '  (¡se perdió una suma!)' : ''}`, W / 2, 262, { align: 'center', size: 12, weight: 700, color: d.race ? C.red : C.lime });
      }
      if (d.passed && done) banner(ctx, `${total.toFixed(0)} s · ×3 MÁS RÁPIDO`, C.lime, 'Tres sondas, un solo segundo', (sim - total) * 2);
    },
  };
}
