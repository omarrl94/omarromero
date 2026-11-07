import { useCallback, useEffect, useMemo, useRef } from 'react';
import { W, H, tileAt, walkable, NPCS, SIGNS, DOORS, CHARACTERS } from './world.js';
import { buildGround, buildObjects, drawCharacter, drawTallGrass, T } from './art.js';
import { drawCreatureSprite, ready } from './assets.js';

export const VW = 15;
export const VH = 11;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };

export const visibleNpcs = (g) => NPCS.filter((n) => (!n.hideIf || !g.flags[n.hideIf]) && (!n.showIf || g.flags[n.showIf]));

/**
 * Exploración del mundo: movimiento por casillas con interpolación suave, cámara, NPCs,
 * tu daemon siguiéndote y controles de teclado o táctiles.
 */
export default function Overworld({ game, locked, warp, followerSprite, onMoved, onAction, onMenu, controlsRef }) {
  const canvasRef = useRef(null);
  const ground = useMemo(() => buildGround(), []);
  const objects = useMemo(() => buildObjects(), []);
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
  const spriteRef = useRef(followerSprite);
  spriteRef.current = followerSprite;

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
      g.fillStyle = '#2b4a2b';
      g.fillRect(0, 0, VW * T, VH * T);
      g.drawImage(ground, camX, camY, VW * T, VH * T, 0, 0, VW * T, VH * T);
      // ── objetos y personajes ordenados por profundidad
      const x0 = camX / T - 3;
      const x1 = camX / T + VW + 3;
      const y0 = camY / T - 2;
      const y1 = camY / T + VH + 4;
      const list = [];
      for (const o of objects) if (o.x + (o.w || 1) >= x0 && o.x <= x1 && o.y >= y0 - 3 && o.y <= y1) list.push(o);
      const npcs = visibleNpcs(game);
      for (const n of npcs) list.push({ base: (n.y + 1) * T, draw: () => drawCharacter(g, CHARACTERS[n.look], n.x * T - camX, n.y * T - camY, npcFacing.current[n.id] || n.dir, 0), feet: [n.x, n.y] });
      const frame = p.moving ? (Math.floor(prog * 2) + (p.step ? 2 : 0)) : 0;
      list.push({ base: py + T + 0.5, draw: () => drawCharacter(g, CHARACTERS.hero, px - camX, py - camY, p.dir, frame), feet: [Math.round(px / T), Math.round(py / T)] });
      if (spriteRef.current && !f.hidden && !(f.x === p.x && f.y === p.y && !p.moving)) {
        const fdir = f.from ? (f.x > f.from.x ? 'right' : f.x < f.from.x ? 'left' : f.y > f.from.y ? 'down' : 'up') : (f.dir || 'down');
        if (f.from) f.dir = fdir;
        list.push({ base: fy + T + 0.4, draw: () => drawCreatureSprite(g, spriteRef.current, fx - camX + 8, fy - camY + 15, 1, { t: p.moving ? t : t * 0.4, dir: fdir }), feet: [Math.round(fx / T), Math.round(fy / T)] });
      }
      list.sort((a, b) => a.base - b.base);
      for (const o of list) {
        o.draw(g, camX, camY, t, game.flags);
        if (o.feet) {
          const ch = tileAt(o.feet[0], o.feet[1]);
          if (ch === ',' || ch === 'k') drawTallGrass(g, ch, o.feet[0] * T - camX, o.feet[1] * T - camY, 7);
        }
      }
      // «!» sobre los entrenadores cercanos que aún no has vencido
      const alert = ready('ui/emote-alert.png');
      for (const n of npcs) {
        if (alert && n.trainer && !game.flags[n.trainer] && Math.abs(n.x - p.x) + Math.abs(n.y - p.y) <= 3) {
          g.drawImage(alert, n.x * T - camX + 1, n.y * T - camY - 16 + Math.round(Math.sin(t * 6)));
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ground, objects, npcAt]);

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
        <button type="button" onClick={onMenu} className="pp-btn !rounded-full !px-4 !py-1 text-xs tracking-widest">MENÚ</button>
        <div className="flex items-end gap-3">
          <button type="button" aria-label="Correr (mantén pulsado)" className="ab-btn ab-b" onPointerDown={() => controlsRef.current?.run(true)} onPointerUp={() => controlsRef.current?.run(false)} onPointerCancel={() => controlsRef.current?.run(false)}>B</button>
          <button type="button" aria-label="Hablar o interactuar" className="ab-btn ab-a -translate-y-4" onClick={() => controlsRef.current?.a()}>A</button>
        </div>
      </div>
    </div>
  );
}
