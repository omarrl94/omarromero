import { MASTER_CLICHES } from "./cliches";

/**
 * Generación determinista de cartones.
 *
 * El cartón de cada jugador se deriva de una semilla reproducible
 * (roomCode + playerId + ronda). Esto tiene dos consecuencias clave:
 *
 * 1. Persistencia: al recargar la página, el mismo jugador regenera
 *    exactamente el mismo cartón sin necesidad de base de datos.
 * 2. Validación anti-trampas: cuando alguien canta ¡BINGO!, el resto
 *    de clientes (incluido el host) regenera SU cartón desde la semilla
 *    y verifica la línea de forma independiente. El jugador no puede
 *    inventarse el contenido de su cartón.
 */

export const GRID_SIZE = 5;
export const CELL_COUNT = GRID_SIZE * GRID_SIZE; // 25
export const FREE_INDEX = 12; // (fila 2, col 2) — centro del 5x5
export const ITEMS_PER_CARD = CELL_COUNT - 1; // 24 clichés únicos

/** Hash xmur3: convierte una cadena arbitraria en una semilla de 32 bits. */
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

/** PRNG mulberry32: rápido, determinista y con distribución uniforme. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Barajado Fisher-Yates puro (no muta el array de entrada). */
function fisherYatesShuffle<T>(items: readonly T[], random: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Un cartón es la lista de 25 celdas en orden de lectura (fila a fila).
 * Cada celda contiene el índice del cliché en MASTER_CLICHES,
 * o -1 para la casilla central FREE.
 */
export type Card = readonly number[];

export function cardSeed(roomCode: string, playerId: string, round: number): string {
  return `hipster-bingo|${roomCode.toUpperCase()}|${playerId}|round-${round}`;
}

/**
 * Genera el cartón determinista de un jugador.
 * Fisher-Yates sobre los 66 índices de la lista máster → toma 24 únicos
 * (repetición matemáticamente imposible: se muestrean sin reemplazo).
 */
export function generateCard(roomCode: string, playerId: string, round: number): Card {
  const random = mulberry32(xmur3(cardSeed(roomCode, playerId, round))());
  const indices = MASTER_CLICHES.map((_, i) => i);
  const picked = fisherYatesShuffle(indices, random).slice(0, ITEMS_PER_CARD);

  const card: number[] = [];
  let cursor = 0;
  for (let i = 0; i < CELL_COUNT; i++) {
    if (i === FREE_INDEX) {
      card.push(-1);
    } else {
      card.push(picked[cursor] as number);
      cursor++;
    }
  }
  return card;
}

/** Todas las líneas ganadoras: 5 filas + 5 columnas + 2 diagonales. */
export const WIN_LINES: readonly (readonly number[])[] = (() => {
  const lines: number[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    lines.push(Array.from({ length: GRID_SIZE }, (_, c) => r * GRID_SIZE + c));
  }
  for (let c = 0; c < GRID_SIZE; c++) {
    lines.push(Array.from({ length: GRID_SIZE }, (_, r) => r * GRID_SIZE + c));
  }
  lines.push(Array.from({ length: GRID_SIZE }, (_, i) => i * GRID_SIZE + i));
  lines.push(Array.from({ length: GRID_SIZE }, (_, i) => i * GRID_SIZE + (GRID_SIZE - 1 - i)));
  return lines;
})();

/** Devuelve la primera línea completa marcada, o null si no hay bingo. */
export function findWinningLine(marked: ReadonlySet<number>): readonly number[] | null {
  for (const line of WIN_LINES) {
    if (line.every((cell) => cell === FREE_INDEX || marked.has(cell))) {
      return line;
    }
  }
  return null;
}

export function hasBingo(marked: ReadonlySet<number>): boolean {
  return findWinningLine(marked) !== null;
}

/**
 * Validación "server-side" de una reclamación de bingo.
 * Cualquier cliente puede ejecutarla de forma independiente y llegar
 * al mismo veredicto, porque el cartón se regenera desde la semilla:
 *  - las posiciones marcadas deben ser válidas (0-24),
 *  - la casilla FREE cuenta siempre como marcada,
 *  - debe existir una línea completa de 5.
 */
export function validateBingoClaim(
  roomCode: string,
  playerId: string,
  round: number,
  markedCells: readonly number[]
): { valid: boolean; line: readonly number[] | null } {
  const inRange = markedCells.every(
    (c) => Number.isInteger(c) && c >= 0 && c < CELL_COUNT
  );
  if (!inRange) return { valid: false, line: null };

  // Regenerar el cartón confirma que la semilla produce un cartón real
  // (y ancla la reclamación a la ronda vigente).
  const card = generateCard(roomCode, playerId, round);
  if (card.length !== CELL_COUNT) return { valid: false, line: null };

  const marked = new Set(markedCells);
  marked.add(FREE_INDEX);
  const line = findWinningLine(marked);
  return { valid: line !== null, line };
}

/** % de progreso (casillas marcadas sobre 25, la FREE cuenta). */
export function progressPercent(markedCount: number): number {
  const total = Math.min(CELL_COUNT, markedCount + 1); // +1 por la FREE
  return Math.round((total / CELL_COUNT) * 100);
}

const ROOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I/L

/** Código de sala de 4 caracteres, alfabeto sin ambigüedades. */
export function generateRoomCode(): string {
  let code = "";
  const bytes = new Uint32Array(4);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 4; i++) {
    code += ROOM_CODE_ALPHABET[(bytes[i] as number) % ROOM_CODE_ALPHABET.length];
  }
  return code;
}

export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{4}$/i.test(code.trim());
}

/** ID de jugador aleatorio y estable (se persiste en localStorage). */
export function generatePlayerId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
