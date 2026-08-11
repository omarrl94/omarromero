"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  FREE_INDEX,
  generateCard,
  hasBingo,
  validateBingoClaim,
} from "@/lib/bingo";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { loadRoomSession, saveRoomSession } from "@/lib/storage";
import type {
  BingoClaimPayload,
  ConnectionStatus,
  GamePhase,
  GameStatePayload,
  PlayerPresence,
  WinnerInfo,
} from "@/lib/types";

interface UseRoomOptions {
  roomCode: string;
  playerId: string;
  nickname: string;
  isHost: boolean;
}

interface FalseClaim {
  nickname: string;
  at: number;
}

/**
 * Hook central de la sala: gestiona el canal Realtime (Presence +
 * Broadcast), la reconexión automática con backoff exponencial y todo
 * el estado de la partida (fase, ronda, marcas, ganador).
 *
 * Sincronización:
 *  - Presence lleva el estado vivo de cada jugador (apodo, progreso)
 *    y, en la presencia del host, la fase/ronda/ganador autoritativos,
 *    de modo que quien entra tarde o se reconecta queda sincronizado
 *    sin necesidad de historial.
 *  - Broadcast lleva los eventos instantáneos: cambios de estado del
 *    host y reclamaciones de bingo, que CADA cliente valida de forma
 *    independiente regenerando el cartón del reclamante (ver bingo.ts).
 */
export function useRoom({ roomCode, playerId, nickname, isHost }: UseRoomOptions) {
  const configured = isSupabaseConfigured();

  const stored = useMemo(() => loadRoomSession(roomCode), [roomCode]);

  const [status, setStatus] = useState<ConnectionStatus>(
    configured ? "connecting" : "offline"
  );
  const [players, setPlayers] = useState<PlayerPresence[]>([]);
  const [phase, setPhase] = useState<GamePhase>(stored?.phase ?? "lobby");
  const [round, setRound] = useState<number>(stored?.round ?? 1);
  const [winner, setWinner] = useState<WinnerInfo | null>(stored?.winner ?? null);
  const [marked, setMarked] = useState<ReadonlySet<number>>(
    () => new Set(stored?.markedCells ?? [])
  );
  const [falseClaim, setFalseClaim] = useState<FalseClaim | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryRef = useRef<{ attempt: number; timer: ReturnType<typeof setTimeout> | null }>(
    { attempt: 0, timer: null }
  );
  const closedRef = useRef(false);

  // Refs espejo para leer el estado vigente dentro de callbacks del canal.
  const stateRef = useRef({ phase, round, winner, marked, nickname, isHost });
  stateRef.current = { phase, round, winner, marked, nickname, isHost };

  /** Cartón determinista del jugador para la ronda vigente. */
  const card = useMemo(
    () => generateCard(roomCode, playerId, round),
    [roomCode, playerId, round]
  );

  const iHaveBingo = useMemo(() => {
    const withFree = new Set(marked);
    withFree.add(FREE_INDEX);
    return hasBingo(withFree);
  }, [marked]);

  // Persistir la sesión: junto con la generación determinista del
  // cartón, esto restaura partida y marcas tras recarga o desconexión.
  useEffect(() => {
    saveRoomSession(roomCode, {
      playerId,
      nickname,
      isHost,
      round,
      phase,
      markedCells: [...marked],
      winner,
    });
  }, [roomCode, playerId, nickname, isHost, round, phase, marked, winner]);

  const trackPresence = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const s = stateRef.current;
    const presence: PlayerPresence = {
      playerId,
      nickname: s.nickname,
      isHost: s.isHost,
      joinedAt: joinedAtRef.current,
      markedCount: s.marked.size,
      phase: s.phase,
      round: s.round,
    };
    void channel.track(presence);
  }, [playerId]);

  const joinedAtRef = useRef<number>(Date.now());

  const applyGameState = useCallback(
    (payload: GameStatePayload) => {
      const s = stateRef.current;
      if (payload.round !== s.round) {
        // Nueva ronda: cartón nuevo, marcas a cero.
        setRound(payload.round);
        setMarked(new Set());
      }
      if (payload.phase !== s.phase) setPhase(payload.phase);
      const sameWinner =
        payload.winner?.playerId === s.winner?.playerId &&
        payload.winner?.round === s.winner?.round;
      if (!sameWinner) setWinner(payload.winner);
    },
    []
  );

  const handleClaim = useCallback(
    (payload: BingoClaimPayload) => {
      const s = stateRef.current;
      if (s.phase === "finished") return; // partida ya congelada
      if (payload.round !== s.round) return; // reclamación de otra ronda

      // Validación independiente en cada cliente: el cartón del
      // reclamante se regenera desde su semilla, imposible falsearlo.
      const verdict = validateBingoClaim(
        roomCode,
        payload.playerId,
        payload.round,
        payload.markedCells
      );

      if (verdict.valid && verdict.line) {
        const win: WinnerInfo = {
          playerId: payload.playerId,
          nickname: payload.nickname,
          line: verdict.line,
          round: payload.round,
        };
        setWinner(win);
        setPhase("finished");
      } else {
        setFalseClaim({ nickname: payload.nickname, at: Date.now() });
      }
    },
    [roomCode]
  );

  const connect = useCallback(() => {
    const supabase = getSupabaseClient();
    if (!supabase || closedRef.current) return;

    // Limpiar canal anterior si lo hubiera (reconexión manual).
    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase.channel(`room:${roomCode.toUpperCase()}`, {
      config: {
        presence: { key: playerId },
        broadcast: { self: true },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PlayerPresence>();
        const list: PlayerPresence[] = Object.values(state)
          .flatMap((metas) => (metas[0] ? [metas[0] as PlayerPresence] : []))
          .sort((a, b) => a.joinedAt - b.joinedAt);
        setPlayers(list);

        // Adoptar el estado autoritativo del host (sincroniza a quien
        // entra tarde o vuelve de una desconexión).
        const s = stateRef.current;
        if (!s.isHost) {
          const host = list.find((p) => p.isHost) ?? list[0];
          if (host && host.playerId !== playerId) {
            if (host.round !== s.round || host.phase !== s.phase) {
              applyGameState({
                phase: host.phase,
                round: host.round,
                winner: host.round === s.winner?.round ? s.winner : null,
              });
            }
          }
        }
      })
      .on("broadcast", { event: "game:state" }, ({ payload }) => {
        applyGameState(payload as GameStatePayload);
      })
      .on("broadcast", { event: "bingo:claim" }, ({ payload }) => {
        handleClaim(payload as BingoClaimPayload);
      })
      .subscribe((channelStatus) => {
        if (closedRef.current) return;
        if (channelStatus === "SUBSCRIBED") {
          retryRef.current.attempt = 0;
          setStatus("connected");
          trackPresence();
        } else if (
          channelStatus === "CHANNEL_ERROR" ||
          channelStatus === "TIMED_OUT" ||
          channelStatus === "CLOSED"
        ) {
          // Reconexión automática con backoff exponencial (1s → 15s).
          setStatus("reconnecting");
          const attempt = retryRef.current.attempt++;
          const delay = Math.min(1000 * 2 ** attempt, 15000);
          if (retryRef.current.timer) clearTimeout(retryRef.current.timer);
          retryRef.current.timer = setTimeout(() => connect(), delay);
        }
      });

    channelRef.current = channel;
  }, [roomCode, playerId, trackPresence, applyGameState, handleClaim]);

  // Ciclo de vida del canal + reconexión al recuperar red o foco.
  useEffect(() => {
    if (!configured) return;
    closedRef.current = false;
    setStatus("connecting");
    connect();

    const onOnline = () => {
      setStatus("reconnecting");
      connect();
    };
    window.addEventListener("online", onOnline);

    return () => {
      closedRef.current = true;
      window.removeEventListener("online", onOnline);
      if (retryRef.current.timer) clearTimeout(retryRef.current.timer);
      const supabase = getSupabaseClient();
      if (supabase && channelRef.current) {
        void supabase.removeChannel(channelRef.current);
      }
      channelRef.current = null;
    };
  }, [configured, connect]);

  // Re-publicar presencia cuando cambian progreso, fase o ronda.
  useEffect(() => {
    trackPresence();
  }, [marked, phase, round, nickname, trackPresence]);

  const broadcastState = useCallback(
    (payload: GameStatePayload) => {
      void channelRef.current?.send({
        type: "broadcast",
        event: "game:state",
        payload,
      });
    },
    []
  );

  /** Marca/desmarca una casilla (la FREE es fija; solo en juego). */
  const toggleCell = useCallback((index: number) => {
    const s = stateRef.current;
    if (index === FREE_INDEX) return;
    if (s.phase !== "playing") return;
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  /** Reclama bingo: se difunde y cada cliente valida por su cuenta. */
  const claimBingo = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== "playing") return;
    const payload: BingoClaimPayload = {
      playerId,
      nickname: s.nickname,
      round: s.round,
      markedCells: [...s.marked, FREE_INDEX],
    };
    // broadcast.self=true: nuestro propio cliente recibe y valida
    // igual que el resto, así el veredicto es idéntico para todos.
    void channelRef.current?.send({
      type: "broadcast",
      event: "bingo:claim",
      payload,
    });
  }, [playerId]);

  /** Solo host: arranca la partida. */
  const startGame = useCallback(() => {
    const s = stateRef.current;
    if (!s.isHost) return;
    setPhase("playing");
    setWinner(null);
    broadcastState({ phase: "playing", round: s.round, winner: null });
  }, [broadcastState]);

  /** Solo host: reinicia con nueva ronda (cartones nuevos para todos). */
  const resetGame = useCallback(() => {
    const s = stateRef.current;
    if (!s.isHost) return;
    const nextRound = s.round + 1;
    setRound(nextRound);
    setPhase("lobby");
    setWinner(null);
    setMarked(new Set());
    broadcastState({ phase: "lobby", round: nextRound, winner: null });
  }, [broadcastState]);

  // El host con la partida "finished" refleja el ganador en broadcast
  // para clientes que se reconecten justo después (best-effort).
  useEffect(() => {
    if (isHost && phase === "finished" && winner) {
      broadcastState({ phase: "finished", round, winner });
    }
  }, [isHost, phase, winner, round, broadcastState]);

  return {
    configured,
    status,
    players,
    phase,
    round,
    winner,
    card,
    marked,
    iHaveBingo,
    falseClaim,
    toggleCell,
    claimBingo,
    startGame,
    resetGame,
  };
}
