"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  FREE_INDEX,
  firstUnmarkedOfColor,
  generateCard,
  hasBingo,
  validateBingoClaim,
} from "@/lib/bingo";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { loadRoomSession, saveRoomSession } from "@/lib/storage";
import type { TileColor } from "@/lib/colors";
import type {
  ActiveRound,
  BingoClaimPayload,
  ConnectionStatus,
  GamePhase,
  GameStatePayload,
  GuessPayload,
  GuessStatus,
  PlayerPresence,
  RoundLaunchPayload,
  VerdictPayload,
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

interface MyGuess {
  launchId: number;
  status: Exclude<GuessStatus, "idle">;
  text: string;
}

/**
 * Hook central de la sala: canal Realtime (Presence + Broadcast),
 * reconexión automática con backoff y todo el estado de la partida.
 *
 * Mecánica Hitster:
 *  1. El host lanza una ronda de un color ("round:launch").
 *  2. Cada jugador escribe su respuesta en la zona "Adivina:" y la
 *     envía ("guess:submit").
 *  3. El host valida o rechaza cada respuesta ("guess:verdict").
 *  4. Si es válida, el jugador estampa una X negra sobre su primera
 *     casilla libre de ese color. Con 5 X en línea → ¡BINGO!
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

  // Ronda de color activa + estado de mi respuesta + cola del host.
  const [activeRound, setActiveRound] = useState<ActiveRound | null>(null);
  const [myGuess, setMyGuess] = useState<MyGuess | null>(null);
  const [pendingGuesses, setPendingGuesses] = useState<GuessPayload[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryRef = useRef<{ attempt: number; timer: ReturnType<typeof setTimeout> | null }>(
    { attempt: 0, timer: null }
  );
  const closedRef = useRef(false);
  const joinedAtRef = useRef<number>(Date.now());

  // Refs espejo para leer el estado vigente dentro de callbacks del canal.
  const stateRef = useRef({
    phase,
    round,
    winner,
    marked,
    nickname,
    isHost,
    activeRound,
    myGuess,
  });
  stateRef.current = {
    phase,
    round,
    winner,
    marked,
    nickname,
    isHost,
    activeRound,
    myGuess,
  };

  /** Cartón de colores determinista del jugador para la ronda vigente. */
  const card = useMemo(
    () => generateCard(roomCode, playerId, round),
    [roomCode, playerId, round]
  );

  const iHaveBingo = useMemo(() => {
    const withFree = new Set(marked);
    withFree.add(FREE_INDEX);
    return hasBingo(withFree);
  }, [marked]);

  /** Estado de mi respuesta respecto a la ronda activa. */
  const guessStatus: GuessStatus = useMemo(() => {
    if (!activeRound || myGuess?.launchId !== activeRound.launchId) return "idle";
    return myGuess.status;
  }, [activeRound, myGuess]);

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
      activeRound: s.isHost ? s.activeRound : null,
    };
    void channel.track(presence);
  }, [playerId]);

  const applyGameState = useCallback((payload: GameStatePayload) => {
    const s = stateRef.current;
    if (payload.round !== s.round) {
      // Nueva ronda de juego: cartón nuevo, todo a cero.
      setRound(payload.round);
      setMarked(new Set());
      setActiveRound(null);
      setMyGuess(null);
      setPendingGuesses([]);
    }
    if (payload.phase !== s.phase) setPhase(payload.phase);
    const sameWinner =
      payload.winner?.playerId === s.winner?.playerId &&
      payload.winner?.round === s.winner?.round;
    if (!sameWinner) setWinner(payload.winner);
  }, []);

  const handleClaim = useCallback(
    (payload: BingoClaimPayload) => {
      const s = stateRef.current;
      if (s.phase === "finished") return; // partida ya congelada
      if (payload.round !== s.round) return; // reclamación de otra ronda

      // Validación independiente en cada cliente (misma función pura).
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

  const handleRoundLaunch = useCallback((payload: RoundLaunchPayload) => {
    setActiveRound({ color: payload.color, launchId: payload.launchId });
    setPendingGuesses([]);
  }, []);

  const handleGuessSubmit = useCallback((payload: GuessPayload) => {
    const s = stateRef.current;
    if (!s.isHost) return; // la cola de validación es cosa del host
    if (s.activeRound?.launchId !== payload.launchId) return;
    setPendingGuesses((prev) => {
      const withoutDupe = prev.filter(
        (g) => !(g.playerId === payload.playerId && g.launchId === payload.launchId)
      );
      return [...withoutDupe, payload];
    });
  }, []);

  const handleVerdict = useCallback(
    (payload: VerdictPayload) => {
      const s = stateRef.current;
      // Quitarla de la cola (en el host; en el resto es no-op).
      setPendingGuesses((prev) =>
        prev.filter(
          (g) => !(g.playerId === payload.playerId && g.launchId === payload.launchId)
        )
      );
      if (payload.playerId !== playerId) return;
      if (s.activeRound?.launchId !== payload.launchId) return;

      if (payload.approved) {
        // Estampar la X en la primera casilla libre de ese color.
        const target = firstUnmarkedOfColor(
          generateCard(roomCode, playerId, s.round),
          s.marked,
          payload.color
        );
        if (target !== null) {
          setMarked((prev) => new Set(prev).add(target));
        }
        setMyGuess((prev) =>
          prev && prev.launchId === payload.launchId
            ? { ...prev, status: "approved" }
            : prev
        );
      } else {
        setMyGuess((prev) =>
          prev && prev.launchId === payload.launchId
            ? { ...prev, status: "rejected" }
            : prev
        );
      }
    },
    [playerId, roomCode]
  );

  const connect = useCallback(() => {
    const supabase = getSupabaseClient();
    if (!supabase || closedRef.current) return;

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
            if (host.activeRound?.launchId !== s.activeRound?.launchId) {
              setActiveRound(host.activeRound ?? null);
            }
          }
        }
      })
      .on("broadcast", { event: "game:state" }, ({ payload }) => {
        applyGameState(payload as GameStatePayload);
      })
      .on("broadcast", { event: "round:launch" }, ({ payload }) => {
        handleRoundLaunch(payload as RoundLaunchPayload);
      })
      .on("broadcast", { event: "guess:submit" }, ({ payload }) => {
        handleGuessSubmit(payload as GuessPayload);
      })
      .on("broadcast", { event: "guess:verdict" }, ({ payload }) => {
        handleVerdict(payload as VerdictPayload);
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
  }, [
    roomCode,
    playerId,
    trackPresence,
    applyGameState,
    handleRoundLaunch,
    handleGuessSubmit,
    handleVerdict,
    handleClaim,
  ]);

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
  }, [marked, phase, round, nickname, activeRound, trackPresence]);

  const broadcast = useCallback((event: string, payload: unknown) => {
    void channelRef.current?.send({ type: "broadcast", event, payload });
  }, []);

  /** Solo host: lanza una ronda de un color concreto. */
  const launchRound = useCallback(
    (color: TileColor) => {
      const s = stateRef.current;
      if (!s.isHost || s.phase !== "playing") return;
      const payload: RoundLaunchPayload = { color, launchId: Date.now() };
      broadcast("round:launch", payload);
    },
    [broadcast]
  );

  /** Envía mi respuesta de la zona "Adivina:" para la ronda activa. */
  const submitGuess = useCallback(
    (text: string) => {
      const s = stateRef.current;
      const clean = text.trim().slice(0, 60);
      if (!clean || s.phase !== "playing" || !s.activeRound) return;
      if (s.myGuess?.launchId === s.activeRound.launchId) return; // ya enviada
      const payload: GuessPayload = {
        playerId,
        nickname: s.nickname,
        guess: clean,
        color: s.activeRound.color,
        launchId: s.activeRound.launchId,
      };
      setMyGuess({ launchId: s.activeRound.launchId, status: "submitted", text: clean });
      broadcast("guess:submit", payload);
    },
    [playerId, broadcast]
  );

  /** Solo host: valida o rechaza una respuesta pendiente. */
  const judgeGuess = useCallback(
    (guess: GuessPayload, approved: boolean) => {
      const s = stateRef.current;
      if (!s.isHost) return;
      const payload: VerdictPayload = {
        playerId: guess.playerId,
        color: guess.color,
        launchId: guess.launchId,
        approved,
      };
      broadcast("guess:verdict", payload);
    },
    [broadcast]
  );

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
    broadcast("bingo:claim", payload);
  }, [playerId, broadcast]);

  /** Solo host: arranca la partida. */
  const startGame = useCallback(() => {
    const s = stateRef.current;
    if (!s.isHost) return;
    setPhase("playing");
    setWinner(null);
    broadcast("game:state", {
      phase: "playing",
      round: s.round,
      winner: null,
    } satisfies GameStatePayload);
  }, [broadcast]);

  /** Solo host: reinicia con nueva ronda (cartones nuevos para todos). */
  const resetGame = useCallback(() => {
    const s = stateRef.current;
    if (!s.isHost) return;
    const nextRound = s.round + 1;
    setRound(nextRound);
    setPhase("lobby");
    setWinner(null);
    setMarked(new Set());
    setActiveRound(null);
    setMyGuess(null);
    setPendingGuesses([]);
    broadcast("game:state", {
      phase: "lobby",
      round: nextRound,
      winner: null,
    } satisfies GameStatePayload);
  }, [broadcast]);

  // El host con la partida "finished" refleja el ganador en broadcast
  // para clientes que se reconecten justo después (best-effort).
  useEffect(() => {
    if (isHost && phase === "finished" && winner) {
      broadcast("game:state", {
        phase: "finished",
        round,
        winner,
      } satisfies GameStatePayload);
    }
  }, [isHost, phase, winner, round, broadcast]);

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
    activeRound,
    guessStatus,
    pendingGuesses,
    launchRound,
    submitGuess,
    judgeGuess,
    claimBingo,
    startGame,
    resetGame,
  };
}
