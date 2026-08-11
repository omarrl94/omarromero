import type { TileColor } from "./colors";

/** Fases de la partida, propagadas por el host vía Presence. */
export type GamePhase = "lobby" | "playing" | "finished";

/** Ronda de color lanzada por el host (launchId la hace única). */
export interface ActiveRound {
  color: TileColor;
  launchId: number;
}

/** Estado que cada jugador publica en el canal Presence de la sala. */
export interface PlayerPresence {
  playerId: string;
  nickname: string;
  isHost: boolean;
  joinedAt: number;
  /** Nº de casillas marcadas (sin contar la FREE). No revela cuáles. */
  markedCount: number;
  /** Solo relevante en la presencia del host: estado autoritativo. */
  phase: GamePhase;
  round: number;
  activeRound: ActiveRound | null;
}

export interface WinnerInfo {
  playerId: string;
  nickname: string;
  line: readonly number[];
  round: number;
}

/** Payloads de los eventos Broadcast de la sala. */
export interface BingoClaimPayload {
  playerId: string;
  nickname: string;
  round: number;
  markedCells: number[];
}

export interface GameStatePayload {
  phase: GamePhase;
  round: number;
  winner: WinnerInfo | null;
}

/** El host lanza una ronda de un color concreto. */
export interface RoundLaunchPayload {
  color: TileColor;
  launchId: number;
}

/** Un jugador envía su respuesta de la zona "Adivina:". */
export interface GuessPayload {
  playerId: string;
  nickname: string;
  guess: string;
  color: TileColor;
  launchId: number;
}

/** Veredicto del host sobre una respuesta. */
export interface VerdictPayload {
  playerId: string;
  color: TileColor;
  launchId: number;
  approved: boolean;
}

/** Estado de mi respuesta en la ronda activa. */
export type GuessStatus = "idle" | "submitted" | "approved" | "rejected";

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "offline";
