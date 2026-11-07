import { useCallback, useEffect, useMemo, useRef } from 'react';
import { W, H, MAP, tileAt, walkable, NPCS, SIGNS, DOORS } from './world.js';
import { drawTile, drawAnimTile, drawPerson, drawCreature, ANIMATED, PEOPLE } from './sprites.js';

export const VW = 15;
export const VH = 11;
const T = 16;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };

export const visibleNpcs = (g) => NPCS.filter((n) => (!n.hideIf || !g.flags[n.hideIf]) && (!n.showIf || g.flags[n.showIf]));

/** Mapa estático precalculado (las casillas animadas se pintan en cada frame). */
function buildMapCanvas() {
  const c = document.createElement('canvas');
  c.width = W * T;
  c.height = H * T;
  const g = c.getContext('2d');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) drawTile(g, MAP[y][x], x * T, y * T, x, y);
  return c;
}

/**
 * Exploración del mundo: movimiento por casillas con interpolación suave, cámara, NPCs,
 * tu daemon siguiéndote y controles de teclado o táctiles.
 */
export default function Overworld({ game, locked, warp, followerLook, onMoved, onAction, onMenu, controlsRef }) {
  const canvasRef = useRef(null);
  const mapCanvas = useMemo(() => buildMapCanvas(), []);
  const me = useRef({ x: game.pos.x, y: game.pos.y, dir: game.pos.dir || 'down', moving: null, step: 0 });
  const follower = useRef({ x: game.pos.x, y: game.pos.y + 1, from: null });
  const held = useRef([]);
  const run = useRef(false);
  const turnAt = useRef(0);
  const npcFacing = useRef({});
  const gameRef = useRef(game);
  gameRef.current = game;
  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  const cb = useRef({ onMoved, onAction, onMenu });
  cb.current = { onMoved, onAction, onMenu };
  const lookRef = useRef(followerLook);
  lookRef.current = followerLook;

  // Teletransporte (reaparecer en un centro, nueva partida...).
  useEffect(() => {
    me.current = { x: game.pos.x, y: game.pos.y, dir: game.pos.dir || 'down', moving: null, step: 0 };
    follower.current = { x: game.pos.x, y: Math.min(H - 1, game.pos.y + 1), from: null, hidden: true };
    npcFacing.current = {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warp]);

  useEffect(() => { if (locked) held.current = []; }, [locked]);

  const npcAt = useCallback((x, y) => visibleNpcs(gameRef.current).find((n) => n.x === x && n.y === y), []);

  const interact = useCallback(() => {
    if (lockedRef.current || me.current.moving) return;
    const { x, y, dir } = me.current;
    const [dx, dy] = DIRS[dir];
    const tx = x + dx;
    const ty = y + dy;
    const npc = npcAt(tx, ty);
    if (npc) {
      npcFacing.current[npc.id] = { up: 'down', down: 'up', left: 'right', right: 'left' }[dir];
      cb.current.onAction({ type: 'npc', npc });
      return;
    }
    const key = `${tx},${ty}`;
    if (SIGNS[key]) { cb.current.onAction({ type: 'sign', lines: SIGNS[key] }); return; }
    if (DOORS[key]) { cb.current.onAction({ type: 'door', door: DOORS[key] }); return; }
    if (tileAt(tx, ty) === 'X') cb.current.onAction({ type: 'firewall', x: tx, y: ty });
  }, [npcAt]);

  // Controles expuestos para los botones táctiles.
  useEffect(() => {
    if (!controlsRef) return;
    controlsRef.current = {
      press: (d) => { if (!held.current.includes(d)) held.current = [...held.current, d]; turnAt.current = performance.now(); },
      release: (d) => { held.current = held.current.filter((k) => k !== d); },
      a: interact,
      run: (on) => { run.current = on; },
    };
  }, [controlsRef, interact]);

  useEffect(() => {
    const typing = () => { const t = document.activeElement && document.activeElement.tagName; return t === 'INPUT' || t === 'TEXTAREA'; };
    const down = (e) => {
      if (typing()) return;
      const d = KEYS[e.key];
      if (d) {
        e.preventDefault();
        if (lockedRef.current) return;
        if (!held.current.includes(d)) { held.current = [...held.current, d]; turnAt.current = performance.now(); }
        return;
      }
      if (e.key === 'Shift') run.current = true;
      if (lockedRef.current) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') { e.preventDefault(); interact(); }
      if (e.key === 'Escape' || e.key === 'x' || e.key === 'X' || e.key === 'm' || e.key === 'M') { e.preventDefault(); cb.current.onMenu(); }
    };
    const up = (e) => {
      const d = KEYS[e.key];
      if (d) held.current = held.current.filter((k) => k !== d);
      if (e.key === 'Shift') run.current = false;
    };
    const blur = () => { held.current = []; run.current = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, [interact]);

  // Bucle principal: lógica de movimiento + dibujo.
  useEffect(() => {
    const c = canvasRef.current;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    let raf = 0;
    let bumpAt = 0;
    const loop = (now) => {
      const t = now / 1000;
      const p = me.current;
      const game = gameRef.current;
      // ── lógica
      if (p.moving) {
        const k = (now - p.moving.t0) / p.moving.ms;
        if (k >= 1) {
          p.x = p.moving.tx;
          p.y = p.moving.ty;
          p.moving = null;
          p.step ^= 1;
          follower.current.from = null;
          cb.current.onMoved(p.x, p.y, p.dir);
        }
      }
      if (!p.moving && !lockedRef.current && held.current.length) {
        const d = held.current[held.current.length - 1];
        if (p.dir !== d && now - turnAt.current < 90) {
          p.dir = d;
        } else {
          p.dir = d;
          const [dx, dy] = DIRS[d];
          const tx = p.x + dx;
          const ty = p.y + dy;
          if (walkable(tx, ty, game.flags) && !npcAt(tx, ty)) {
            const f = follower.current;
            f.from = { x: f.x, y: f.y };
            f.x = p.x;
            f.y = p.y;
            f.hidden = false;
            p.moving = { tx, ty, fx: p.x, fy: p.y, t0: now, ms: run.current ? 95 : 165 };
          } else if (now - bumpAt > 400) {
            bumpAt = now;
            const key = `${tx},${ty}`;
            if (DOORS[key]) { held.current = []; cb.current.onAction({ type: 'door', door: DOORS[key] }); }
            else if (tileAt(tx, ty) === 'X') { held.current = []; cb.current.onAction({ type: 'firewall', x: tx, y: ty }); }
          }
        }
      }
      // posición interpolada
      let px = p.x * T;
      let py = p.y * T;
      let prog = 0;
      if (p.moving) {
        prog = Math.min(1, (now - p.moving.t0) / p.moving.ms);
        px = (p.moving.fx + (p.moving.tx - p.moving.fx) * prog) * T;
        py = (p.moving.fy + (p.moving.ty - p.moving.fy) * prog) * T;
      }
      const f = follower.current;
      let fx = f.x * T;
      let fy = f.y * T;
      if (p.moving && f.from) {
        fx = (f.from.x + (f.x - f.from.x) * prog) * T;
        fy = (f.from.y + (f.y - f.from.y) * prog) * T;
      }
      // ── cámara
      const camX = Math.round(Math.max(0, Math.min(W * T - VW * T, px - (VW * T) / 2 + T / 2)));
      const camY = Math.round(Math.max(0, Math.min(H * T - VH * T, py - (VH * T) / 2 + T / 2)));
      g.drawImage(mapCanvas, camX, camY, VW * T, VH * T, 0, 0, VW * T, VH * T);
      const x0 = Math.floor(camX / T);
      const y0 = Math.floor(camY / T);
      for (let y = y0; y <= y0 + VH; y++) {
        for (let x = x0; x <= x0 + VW; x++) {
          const ch = tileAt(x, y);
          if (ANIMATED.has(ch) && x < W && y < H) {
            const open = ch === 'X' && walkable(x, y, game.flags);
            drawAnimTile(g, ch, x * T - camX, y * T - camY, x, y, t, open);
          }
        }
      }
      // ── entidades ordenadas por profundidad
      const ents = visibleNpcs(game).map((n) => ({ y: n.y * T, draw: () => drawPerson(g, PEOPLE[n.look], n.x * T - camX, n.y * T - camY - 2, npcFacing.current[n.id] || n.dir, 0), tx: n.x, ty: n.y }));
      const walking = p.moving ? (prog < 0.5 ? p.step : p.step ^ 1) : 0;
      ents.push({ y: py, draw: () => drawPerson(g, PEOPLE.hero, Math.round(px) - camX, Math.round(py) - camY - 2, p.dir, p.moving ? walking : 0), tx: Math.round(px / T), ty: Math.round(py / T) });
      if (lookRef.current && !f.hidden && !(f.x === p.x && f.y === p.y && !p.moving)) {
        ents.push({ y: fy - 1, draw: () => drawCreature(g, lookRef.current, Math.round(fx) - camX - 2, Math.round(fy) - camY - 6, 0.5, { t }), tx: Math.round(fx / T), ty: Math.round(fy / T) });
      }
      ents.sort((a, b) => a.y - b.y).forEach((e) => {
        e.draw();
        // la hierba alta tapa los pies
        const ch = tileAt(e.tx, e.ty);
        if (ch === ',' || ch === 'k') {
          g.save();
          g.beginPath();
          g.rect(e.tx * T - camX, e.ty * T - camY + 10, T, 6);
          g.clip();
          drawAnimTile(g, ch, e.tx * T - camX, e.ty * T - camY, e.tx, e.ty, t);
          g.restore();
        }
      });
      // marcas de «!» sobre los entrenadores que aún no has vencido y están cerca
      for (const n of visibleNpcs(game)) {
        if (n.trainer && !game.flags[n.trainer] && Math.abs(n.x - p.x) + Math.abs(n.y - p.y) <= 3) {
          const bx = n.x * T - camX + 5;
          const by = n.y * T - camY - 12 + Math.round(Math.sin(t * 6));
          g.fillStyle = '#fff'; g.fillRect(bx, by, 6, 8);
          g.fillStyle = '#e5484d'; g.fillRect(bx + 2, by + 1, 2, 4); g.fillRect(bx + 2, by + 6, 2, 1);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mapCanvas, npcAt]);

  return <canvas ref={canvasRef} width={VW * T} height={VH * T} className="pixelated block h-auto w-full" aria-label="Mapa de Bitlandia" />;
}

/** Controles táctiles: cruceta + A (hablar) + B (correr) + menú. */
export function TouchPad({ controlsRef, onMenu }) {
  const btn = (d, label, cls) => (
    <button
      type="button"
      aria-label={label}
      className={`dpad-btn ${cls}`}
      onPointerDown={(e) => { e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sin captura */ } controlsRef.current?.press(d); }}
      onPointerUp={() => controlsRef.current?.release(d)}
      onPointerCancel={() => controlsRef.current?.release(d)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {{ up: '▲', down: '▼', left: '◀', right: '▶' }[d]}
    </button>
  );
  return (
    <div className="flex select-none items-center justify-between px-4 py-3 sm:hidden">
      <div className="dpad">
        {btn('up', 'Arriba', 'dpad-up')}
        {btn('left', 'Izquierda', 'dpad-left')}
        {btn('right', 'Derecha', 'dpad-right')}
        {btn('down', 'Abajo', 'dpad-down')}
      </div>
      <div className="flex flex-col items-center gap-3">
        <button type="button" onClick={onMenu} className="rounded-full bg-slate-700 px-4 py-1.5 text-[10px] font-bold tracking-widest text-slate-200">MENÚ</button>
        <div className="flex items-end gap-3">
          <button type="button" aria-label="Correr (mantén pulsado)" className="ab-btn bg-slate-600" onPointerDown={() => controlsRef.current?.run(true)} onPointerUp={() => controlsRef.current?.run(false)} onPointerCancel={() => controlsRef.current?.run(false)}>B</button>
          <button type="button" aria-label="Hablar o interactuar" className="ab-btn -translate-y-4 bg-rose-500" onClick={() => controlsRef.current?.a()}>A</button>
        </div>
      </div>
    </div>
  );
}
