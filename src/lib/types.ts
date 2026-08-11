/** Fases de la partida, propagadas por el host vía Presence. */
export type GamePhase = "lobby" | "playing" | "finished";

/** Estado que cada jugador publica en el canal Presence de la sala. */
export interface PlayerPresence {
  playerId: string;
  nickname: string;
  isHost: boolean;
  joinedAt: number;
  /** Nº de casillas marcadas (sin contar la FREE). No revela cuáles. */
  markedCount: number;
  /** Solo relevante en la presencia del host: fase y ronda vigentes. */
  phase: GamePhase;
  round: number;
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

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "offline";
