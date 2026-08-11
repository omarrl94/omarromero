import { generatePlayerId } from "./bingo";
import type { GamePhase, WinnerInfo } from "./types";

/**
 * Persistencia local por sala. Junto con la generación determinista
 * del cartón, garantiza que un jugador que recarga la página o pierde
 * la conexión recupere exactamente el mismo cartón y sus marcas.
 */

const NS = "hipster-bingo";

interface RoomSession {
  playerId: string;
  nickname: string;
  isHost: boolean;
  round: number;
  phase: GamePhase;
  markedCells: number[];
  winner: WinnerInfo | null;
}

function key(roomCode: string): string {
  return `${NS}:room:${roomCode.toUpperCase()}`;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadRoomSession(roomCode: string): RoomSession | null {
  if (typeof window === "undefined") return null;
  return safeParse<RoomSession>(window.localStorage.getItem(key(roomCode)));
}

export function saveRoomSession(roomCode: string, session: RoomSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(roomCode), JSON.stringify(session));
  } catch {
    // almacenamiento lleno o bloqueado: la partida sigue en memoria
  }
}

export function clearRoomSession(roomCode: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key(roomCode));
}

/** Identidad global del dispositivo (apodo por defecto entre salas). */
export function loadOrCreatePlayerId(): string {
  if (typeof window === "undefined") return generatePlayerId();
  const k = `${NS}:player-id`;
  const existing = window.localStorage.getItem(k);
  if (existing) return existing;
  const id = generatePlayerId();
  try {
    window.localStorage.setItem(k, id);
  } catch {
    // sin persistencia: se usará un id efímero
  }
  return id;
}

export function loadLastNickname(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(`${NS}:nickname`) ?? "";
}

export function saveLastNickname(nickname: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${NS}:nickname`, nickname);
  } catch {
    // ignorar
  }
}

export type { RoomSession };
