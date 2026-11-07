// Dibujo del mundo con los tilesets de «Ninja Adventure» (CC0):
// suelo con autotiles (caminos y agua), objetos con profundidad (árboles, rocas, edificios)
// y personajes animados.
import { W, H, MAP, tileAt, BUILDINGS, BUILDING_TYPES, zoneAt, FIREWALLS, walkable } from './world.js';
import { ready, drawCell, DIR_COL } from './assets.js';

export const T = 16;
const FLOOR = 'tiles/TilesetFloor.png';
const NATURE = 'tiles/TilesetNature.png';
const HOUSE = 'tiles/TilesetHouse.png';
const WATER = 'tiles/TilesetWater.png';
const DUNGEON = 'tiles/TilesetDungeon.png';
export const TILE_PATHS = [FLOOR, NATURE, HOUSE, WATER, DUNGEON];

const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };

function blit(g, path, sx, sy, x, y, w = 1, h = 1) {
  const im = ready(path);
  if (!im) return;
  g.drawImage(im, sx * T, sy * T, w * T, h * T, Math.round(x), Math.round(y), w * T, h * T);
}

/**
 * Autotile de 4 vecinos con el esquema de los tilesets del pack: un bloque 3×3 (esquinas y
 * bordes), una tira vertical, una tira horizontal y una pieza aislada.
 * (ox, oy) es la esquina superior izquierda del bloque en el tileset.
 */
function autotile(n, e, s, w, ox, oy) {
  const k = (n ? 1 : 0) | (e ? 2 : 0) | (s ? 4 : 0) | (w ? 8 : 0);
  const map = {
    0: [3, 3], 1: [3, 2], 4: [3, 0], 5: [3, 1],
    2: [0, 3], 8: [2, 3], 10: [1, 3],
    6: [0, 0], 12: [2, 0], 3: [0, 2], 9: [2, 2],
    14: [1, 0], 7: [0, 1], 13: [2, 1], 11: [1, 2], 15: [1, 1],
  };
  const [cx, cy] = map[k];
  return [ox + cx, oy + cy];
}

const isPath = (ch) => ch === '=' || ch === 'D' || ch === 'X';
const isWater = (ch) => ch === '~' || ch === 'b';
const sandZone = (y) => zoneAt(y).id === 'peak';
const caveZone = (y) => zoneAt(y).id === 'cave';

/** Capa de suelo (se pinta una sola vez). */
export function buildGround() {
  const c = document.createElement('canvas');
  c.width = W * T;
  c.height = H * T;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ch = MAP[y][x];
      const px = x * T;
      const py = y * T;
      const sand = sandZone(y);
      const cave = caveZone(y);
      // base
      if (cave) blit(g, FLOOR, hash(x, y) > 0.85 ? 12 : 11, 19, px, py);
      else if (sand) blit(g, FLOOR, hash(x, y) > 0.8 ? 1 : 0, 5, px, py);
      else blit(g, FLOOR, hash(x, y) > 0.84 ? 1 + Math.floor(hash(y, x) * 4) : 0, 12, px, py);
      // caminos (autotile)
      if (isPath(ch) && !cave) {
        const same = (dx, dy) => isPath(tileAt(x + dx, y + dy)) || (tileAt(x + dx, y + dy) === 'b');
        const [tx, ty] = autotile(same(0, -1), same(1, 0), same(0, 1), same(-1, 0), 0, sand ? 0 : 7);
        blit(g, FLOOR, tx, ty, px, py);
      }
      // agua (autotile) y puentes
      if (isWater(ch)) {
        const same = (dx, dy) => { const t = tileAt(x + dx, y + dy); return isWater(t) || (x + dx < 1 || x + dx > W - 2); };
        const [tx, ty] = autotile(same(0, -1), same(1, 0), same(0, 1), same(-1, 0), 0, 6);
        blit(g, WATER, tx, ty, px, py);
        if (ch === 'b') blit(g, WATER, 1, 13, px, py);
      }
      // flores y detalles planos
      if (ch === '*') {
        const opts = [[0, 11], [3, 11], [6, 11], [2, 11]];
        const [fx, fy] = opts[Math.floor(hash(x + 3, y) * opts.length)];
        blit(g, NATURE, fx, fy, px, py);
      }
    }
  }
  return c;
}

/** Hierba alta normal y corrupta (la corrupta se tiñe de violeta una vez). */
let corruptTile = null;
function corrupt() {
  if (corruptTile) return corruptTile;
  const im = ready(NATURE);
  if (!im) return null;
  const c = document.createElement('canvas');
  c.width = T;
  c.height = T;
  const g = c.getContext('2d');
  g.filter = 'hue-rotate(210deg) saturate(1.6) brightness(0.85)';
  g.drawImage(im, 3 * T, 10 * T, T, T, 0, 0, T, T);
  corruptTile = c;
  return c;
}
export function drawTallGrass(g, ch, x, y, clipBottom = 0) {
  if (clipBottom) { g.save(); g.beginPath(); g.rect(x, y + T - clipBottom, T, clipBottom); g.clip(); }
  const v = hash(Math.round(x / T) + 7, Math.round(y / T));
  if (ch === 'k') { const c = corrupt(); if (c) g.drawImage(c, x, y); } else blit(g, NATURE, v > 0.5 ? 4 : 3, 10, x, y);
  if (clipBottom) g.restore();
}

/**
 * Objetos con profundidad: se ordenan por su base junto con los personajes.
 * Devuelve [{ base, draw(g, camX, camY, t, flags) }].
 */
export function buildObjects() {
  const out = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ch = MAP[y][x];
      const z = zoneAt(y).id;
      if (ch === 'T') {
        const v = hash(x, y);
        const kind = z === 'rec' ? [14, 0] : z === 'forest' ? (v > 0.35 ? [2, 0] : [0, 0]) : z === 'lake' ? (v > 0.6 ? [16, 0] : [0, 0]) : (v > 0.75 ? [2, 0] : v > 0.4 ? [16, 0] : [0, 0]);
        out.push({ base: (y + 1) * T, x, y, draw: (g, cx, cy) => blit(g, NATURE, kind[0], kind[1], x * T - 8 - cx, y * T - 16 - cy, 2, 2) });
      } else if (ch === 'M') {
        const brown = z === 'peak';
        out.push({ base: (y + 1) * T, x, y, draw: (g, cx, cy) => blit(g, NATURE, brown ? 13 : 16, 8, x * T - 8 - cx, y * T - 16 - cy, 2, 2) });
      } else if (ch === 'r') {
        out.push({ base: (y + 1) * T, x, y, draw: (g, cx, cy) => blit(g, NATURE, caveZone(y) ? 18 : 13, 9, x * T - cx, y * T - cy) });
      } else if (ch === 'S') {
        out.push({ base: (y + 1) * T, x, y, draw: (g, cx, cy) => blit(g, NATURE, 5, 8, x * T - cx, y * T - cy) });
      } else if (ch === 'F') {
        out.push({ base: (y + 1) * T, x, y, draw: (g, cx, cy) => blit(g, HOUSE, 10, 4, x * T - cx, y * T - cy) });
      } else if (ch === ',' || ch === 'k') {
        out.push({ base: y * T + 2, x, y, draw: (g, cx, cy) => drawTallGrass(g, ch, x * T - cx, y * T - cy) });
      } else if (ch === 'X') {
        const flag = FIREWALLS[`${x},${y}`];
        out.push({
          base: (y + 1) * T, x, y,
          draw: (g, cx, cy, t, flags) => {
            if (flags[flag]) return;
            blit(g, DUNGEON, 4, 1, x * T - cx, y * T - cy);
            g.fillStyle = `rgba(190,80,255,${0.18 + Math.sin(t * 5 + x) * 0.12})`;
            g.fillRect(x * T - cx, y * T - cy, T, T);
          },
        });
      }
    }
  }
  for (const b of BUILDINGS) {
    const tp = BUILDING_TYPES[b.type];
    out.push({ base: (b.y + 3) * T, x: b.x, y: b.y, w: tp.w, draw: (g, cx, cy) => blit(g, HOUSE, tp.sx, 0, b.x * T - cx, b.y * T - cy, tp.w, 3) });
  }
  return out;
}

/** Personaje del pack (16×16): fila de animación según el paso. */
export function drawCharacter(g, sheet, x, y, dir = 'down', frame = 0) {
  g.fillStyle = 'rgba(0,0,0,0.22)';
  g.beginPath();
  g.ellipse(Math.round(x) + 8, Math.round(y) + 15, 5, 2, 0, 0, Math.PI * 2);
  g.fill();
  drawCell(g, `char/${sheet}.png`, DIR_COL[dir], frame % 4, x, y - 2, 1);
}

export { walkable };
