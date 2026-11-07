import { useEffect, useRef } from 'react';
import { ready, drawFx } from './assets.js';
import { drawCreatureFit } from './ui.jsx';

const W = 256;
const H = 150;
const T = 16;

/** Fondo del combate pintado con los tilesets: prado con arboleda o cueva para el jefe. */
function paintBackground(g, boss) {
  const floor = ready('tiles/TilesetFloor.png');
  const nature = ready('tiles/TilesetNature.png');
  if (!floor || !nature) return false;
  g.imageSmoothingEnabled = false;
  for (let y = 0; y < H; y += T) {
    for (let x = 0; x < W; x += T) {
      const n = Math.sin(x * 12.9 + y * 78.2) * 43758.5;
      const v = n - Math.floor(n);
      if (boss) g.drawImage(floor, (v > 0.8 ? 12 : 11) * T, 19 * T, T, T, x, y, T, T);
      else g.drawImage(floor, (v > 0.85 ? 1 : 0) * T, 12 * T, T, T, x, y, T, T);
    }
  }
  // arboleda o rocas al fondo
  for (let x = -8; x < W; x += 22) {
    const n = Math.sin(x * 3.3) * 999;
    const v = n - Math.floor(n);
    const [sx, sy] = boss ? [16, 8] : v > 0.5 ? [0, 0] : v > 0.25 ? [2, 0] : [16, 0];
    g.drawImage(nature, sx * T, sy * T, 32, 32, x, -12 + Math.round(v * 6), 32, 32);
  }
  for (let x = 4; x < W; x += 26) {
    const n = Math.sin(x * 7.1) * 999;
    const v = n - Math.floor(n);
    const [sx, sy] = boss ? [16, 8] : v > 0.5 ? [16, 0] : [0, 0];
    g.drawImage(nature, sx * T, sy * T, 32, 32, x, 6 + Math.round(v * 4), 32, 32);
  }
  // matas y flores
  if (!boss) {
    [[20, 60], [228, 44], [118, 40], [200, 128], [12, 120], [150, 136]].forEach(([x, y], i) => {
      const t = [[7, 11], [0, 11], [3, 11], [10, 10], [6, 11], [7, 11]][i];
      g.drawImage(nature, t[0] * T, t[1] * T, T, T, x, y, T, T);
    });
  }
  // claros donde se colocan las criaturas
  const pad = (cx, cy, rx, ry) => {
    g.fillStyle = boss ? 'rgba(20,10,30,0.35)' : 'rgba(60,90,30,0.35)';
    g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = boss ? 'rgba(120,80,140,0.25)' : 'rgba(230,210,140,0.35)';
    g.beginPath(); g.ellipse(cx, cy - 1, rx - 4, ry - 2, 0, 0, Math.PI * 2); g.fill();
  };
  pad(184, 80, 38, 9);
  pad(70, 138, 46, 10);
  return true;
}

/**
 * Escena del combate en canvas. fx = { enemy, me, purify } son contadores: cada vez que
 * cambian se lanza un efecto (tajo sobre el bug, chispazo sobre tu daemon, explosión al depurar).
 */
export default function BattleScene({ enemy, mine, fx, boss = false, enemyGone = false }) {
  const ref = useRef(null);
  const bg = useRef(null);
  const props = useRef({});
  props.current = { enemy, mine, fx, enemyGone };
  const anims = useRef([]);
  const last = useRef({ enemy: 0, me: 0, purify: false, mine: null });

  useEffect(() => {
    const now = performance.now();
    if (fx.enemy !== last.current.enemy) anims.current.push({ kind: 'slash', at: 'enemy', t0: now, dur: 420 }, { kind: 'shakeE', t0: now, dur: 450 });
    if (fx.me !== last.current.me) anims.current.push({ kind: 'spark', at: 'me', t0: now, dur: 500 }, { kind: 'shakeM', t0: now, dur: 450 });
    if (fx.purify && !last.current.purify) anims.current.push({ kind: 'explosion', at: 'enemy', t0: now, dur: 800 }, { kind: 'flash', t0: now, dur: 700 });
    if (mine && last.current.mine && mine.uid !== last.current.mine) anims.current.push({ kind: 'smoke', at: 'me', t0: now, dur: 500 });
    last.current = { enemy: fx.enemy, me: fx.me, purify: fx.purify, mine: mine ? mine.uid : null };
  }, [fx, mine]);

  useEffect(() => {
    const c = ref.current;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    let raf = 0;
    const t0 = performance.now();
    const offs = [];
    const canv = (i, size) => {
      if (!offs[i]) { offs[i] = document.createElement('canvas'); offs[i].width = size; offs[i].height = size; }
      return offs[i];
    };
    const loop = (now) => {
      const t = (now - t0) / 1000;
      if (!bg.current) {
        const b = document.createElement('canvas');
        b.width = W;
        b.height = H;
        if (paintBackground(b.getContext('2d'), boss)) bg.current = b;
      }
      g.clearRect(0, 0, W, H);
      if (bg.current) g.drawImage(bg.current, 0, 0);
      const { enemy: e, mine: m, fx: f, enemyGone: gone } = props.current;
      anims.current = anims.current.filter((a) => now - a.t0 < a.dur);
      const active = (k) => anims.current.find((a) => a.kind === k);
      const shake = (k) => { const a = active(k); return a ? Math.round(Math.sin((now - a.t0) / 22) * 4 * (1 - (now - a.t0) / a.dur)) : 0; };
      const blink = (k) => { const a = active(k); return a && Math.floor((now - a.t0) / 70) % 2 === 0; };

      // bug (de frente)
      if (e && !gone) {
        const off = canv(0, 80);
        const og = off.getContext('2d');
        og.clearRect(0, 0, 80, 80);
        drawCreatureFit(og, e, 80, 80, { t, dir: 'down', glitch: !f.purify, scale: e.kind === 'boss' ? 0 : 4 });
        if (!blink('shakeE')) g.drawImage(off, 184 - 40 + shake('shakeE'), 82 - 80 + Math.round(Math.sin(t * 2) * 1));
      }
      // tu daemon (de espaldas)
      if (m) {
        const off = canv(1, 100);
        const og = off.getContext('2d');
        og.clearRect(0, 0, 100, 100);
        drawCreatureFit(og, m, 100, 100, { t: t * 0.8, dir: 'up', scale: m.kind === 'boss' ? 0 : 5 });
        if (!blink('shakeM')) g.drawImage(off, 70 - 50 + shake('shakeM'), 140 - 100);
      }
      // efectos
      for (const a of anims.current) {
        const k = (now - a.t0) / a.dur;
        const [x, y] = a.at === 'enemy' ? [184, 54] : [70, 104];
        if (a.kind === 'slash') drawFx(g, 'slash', k, x, y, 1);
        if (a.kind === 'spark') drawFx(g, 'spark', k, x, y, 1.5);
        if (a.kind === 'explosion') drawFx(g, 'explosion', k, x, y, 1.8);
        if (a.kind === 'smoke') drawFx(g, 'smoke', k, x, y, 2);
        if (a.kind === 'flash') { g.fillStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; g.fillRect(0, 0, W, H); }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [boss]);

  return <canvas ref={ref} width={W} height={H} className="pixelated block h-full w-full" style={{ objectFit: 'cover' }} aria-hidden="true" />;
}
