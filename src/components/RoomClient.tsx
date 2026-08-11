"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  MegaphoneOff,
  Play,
  RotateCcw,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useRoom } from "@/hooks/useRoom";
import { findWinningLine, FREE_INDEX } from "@/lib/bingo";
import {
  loadLastNickname,
  loadOrCreatePlayerId,
  loadRoomSession,
  saveLastNickname,
  saveRoomSession,
} from "@/lib/storage";
import { AnswerZone } from "./AnswerZone";
import { BingoCard } from "./BingoCard";
import { ConfigNotice } from "./ConfigNotice";
import { HostPanel } from "./HostPanel";
import { PlayersDrawer } from "./PlayersDrawer";
import { ShareRoom } from "./ShareRoom";
import { WinnerOverlay } from "./WinnerOverlay";
import type { ConnectionStatus } from "@/lib/types";

interface Identity {
  playerId: string;
  nickname: string;
  isHost: boolean;
}

interface RoomClientProps {
  roomCode: string;
}

/**
 * Punto de entrada de la sala. Si el jugador llega por enlace directo
 * sin sesión previa, primero le pide un apodo; después monta el juego.
 */
export function RoomClient({ roomCode }: RoomClientProps) {
  const [identity, setIdentity] = useState<Identity | null | undefined>(undefined);

  useEffect(() => {
    const session = loadRoomSession(roomCode);
    if (session) {
      setIdentity({
        playerId: session.playerId,
        nickname: session.nickname,
        isHost: session.isHost,
      });
    } else {
      setIdentity(null);
    }
  }, [roomCode]);

  if (identity === undefined) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="font-display text-lg italic text-kraft-600">Abriendo la sala…</p>
      </main>
    );
  }

  if (identity === null) {
    return (
      <JoinGate
        roomCode={roomCode}
        onJoin={(nickname) => {
          const playerId = loadOrCreatePlayerId();
          saveRoomSession(roomCode, {
            playerId,
            nickname,
            isHost: false,
            round: 1,
            phase: "lobby",
            markedCells: [],
            winner: null,
          });
          setIdentity({ playerId, nickname, isHost: false });
        }}
      />
    );
  }

  return <GameView roomCode={roomCode} identity={identity} />;
}

/** Formulario de apodo para quien entra con el enlace compartido. */
function JoinGate({ roomCode, onJoin }: { roomCode: string; onJoin: (nickname: string) => void }) {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNickname(loadLastNickname());
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = nickname.trim().slice(0, 20);
    if (clean.length < 2) {
      setError("Elige un apodo de al menos 2 caracteres.");
      return;
    }
    saveLastNickname(clean);
    onJoin(clean);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-5">
      <h1 className="text-center font-display text-3xl font-black text-ink">
        Sala <span className="ticket-code text-terracotta-600">{roomCode}</span>
      </h1>
      <form onSubmit={submit} className="paper-card w-full p-6 shadow-paper">
        <label htmlFor="join-nickname" className="block font-display text-sm font-bold uppercase tracking-widest text-kraft-700">
          Tu apodo
        </label>
        <input
          id="join-nickname"
          type="text"
          value={nickname}
          maxLength={20}
          autoFocus
          onChange={(e) => {
            setNickname(e.target.value);
            setError(null);
          }}
          placeholder="DJ de Vinilos"
          className="mt-2 w-full rounded-md border border-kraft-400 bg-kraft-50 px-4 py-3 font-serif text-lg text-ink placeholder:text-kraft-400 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
        />
        <button
          type="submit"
          className="btn-letterpress mt-5 w-full bg-sage-200 px-5 py-3 font-display text-lg font-bold text-sage-700"
        >
          Entrar a la sala
        </button>
        {error && (
          <p role="alert" className="mt-3 text-center text-sm font-semibold text-terracotta-600">
            {error}
          </p>
        )}
      </form>
    </main>
  );
}

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connecting: "Conectando…",
  connected: "En directo",
  reconnecting: "Reconectando…",
  offline: "Sin conexión",
};

/** Vista principal del juego una vez identificado el jugador. */
function GameView({ roomCode, identity }: { roomCode: string; identity: Identity }) {
  const {
    configured,
    status,
    players,
    phase,
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
  } = useRoom({
    roomCode,
    playerId: identity.playerId,
    nickname: identity.nickname,
    isHost: identity.isHost,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showFalseClaim, setShowFalseClaim] = useState(false);

  // Toast efímero cuando alguien canta bingo en falso.
  useEffect(() => {
    if (!falseClaim) return;
    setShowFalseClaim(true);
    const t = setTimeout(() => setShowFalseClaim(false), 4000);
    return () => clearTimeout(t);
  }, [falseClaim]);

  // Resaltar mi línea ganadora sobre el cartón.
  const myWinningLine = useMemo(() => {
    if (winner?.playerId !== identity.playerId) return null;
    return winner.line;
  }, [winner, identity.playerId]);

  const liveLine = useMemo(() => {
    if (myWinningLine) return myWinningLine;
    if (!iHaveBingo) return null;
    const withFree = new Set(marked);
    withFree.add(FREE_INDEX);
    return findWinningLine(withFree);
  }, [myWinningLine, iHaveBingo, marked]);

  const connected = status === "connected";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center gap-5 px-4 py-6">
      {/* Barra de herramientas superior */}
      <header className="flex w-full flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-semibold text-kraft-700 hover:text-terracotta-600"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Salir
        </Link>
        <h1 className="font-display text-2xl font-black text-ink">Hipster Bingo</h1>
        <div className="flex items-center gap-2">
          <span
            className={[
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
              connected
                ? "border-sage-400 bg-sage-100 text-sage-700"
                : "border-mustard-400 bg-mustard-100 text-mustard-600",
            ].join(" ")}
            role="status"
          >
            {connected ? (
              <Wifi className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <WifiOff className="h-3.5 w-3.5" aria-hidden />
            )}
            {STATUS_LABEL[status]}
          </span>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Ver jugadores"
            className="btn-letterpress flex items-center gap-1.5 bg-kraft-100 px-3 py-1.5 text-sm font-bold text-kraft-700"
          >
            <Users className="h-4 w-4" aria-hidden />
            {players.length}
          </button>
          {/* Perfil de usuario */}
          <span
            className="flex items-center gap-1.5 rounded-full border border-kraft-400 bg-kraft-100 py-1 pl-1 pr-3 text-xs font-bold text-kraft-700"
            title={identity.nickname}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-terracotta-400 font-display text-xs font-black text-white">
              {identity.nickname.charAt(0).toUpperCase()}
            </span>
            <span className="max-w-24 truncate">{identity.nickname}</span>
          </span>
        </div>
      </header>

      {!configured && <ConfigNotice />}

      <ShareRoom roomCode={roomCode} />

      {/* Estado de la partida + controles del host */}
      <section className="flex w-full flex-col items-center gap-3">
        {phase === "lobby" && (
          <div className="paper-card w-full max-w-2xl p-4 text-center">
            <p className="font-display text-lg font-bold text-ink">Sala de espera</p>
            <p className="mt-1 text-sm italic text-kraft-700">
              {identity.isHost
                ? "Comparte el código y arranca cuando estéis todos."
                : "Esperando a que el host arranque la partida…"}
            </p>
            {identity.isHost && (
              <button
                type="button"
                onClick={startGame}
                disabled={!connected}
                className="btn-letterpress mx-auto mt-4 flex items-center gap-2 bg-terracotta-100 px-6 py-3 font-display text-lg font-bold text-terracotta-600"
              >
                <Play className="h-5 w-5" aria-hidden />
                Empezar partida
              </button>
            )}
          </div>
        )}

        {/* Interruptor de reinicio (solo host, en partida) */}
        {phase === "playing" && identity.isHost && (
          <button
            type="button"
            role="switch"
            aria-checked={false}
            onClick={resetGame}
            className="group flex items-center gap-2.5 text-xs font-semibold text-kraft-600 hover:text-terracotta-600"
          >
            <span className="relative inline-flex h-5 w-9 items-center rounded-full border border-kraft-500 bg-kraft-200 transition-colors group-hover:bg-terracotta-100">
              <span className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-kraft-50 shadow-sm transition-transform group-hover:translate-x-4">
                <RotateCcw className="h-2.5 w-2.5 text-kraft-600" aria-hidden />
              </span>
            </span>
            Reiniciar partida (cartones nuevos)
          </button>
        )}

        {phase === "playing" && identity.isHost && (
          <HostPanel
            activeRound={activeRound}
            pendingGuesses={pendingGuesses}
            onLaunchRound={launchRound}
            onJudge={judgeGuess}
          />
        )}
      </section>

      <BingoCard card={card} marked={marked} winningLine={liveLine} />

      <AnswerZone
        phase={phase}
        activeRound={activeRound}
        guessStatus={guessStatus}
        onSubmit={submitGuess}
      />

      {/* Botón ¡BINGO!: solo se activa con 5 en línea */}
      {phase === "playing" && (
        <motion.button
          type="button"
          onClick={claimBingo}
          disabled={!iHaveBingo || !connected}
          animate={iHaveBingo ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={iHaveBingo ? { repeat: Infinity, duration: 1.1 } : undefined}
          className={[
            "btn-letterpress flex items-center gap-2 px-10 py-4 font-display text-2xl font-black uppercase tracking-widest",
            iHaveBingo
              ? "bg-mustard-300 text-terracotta-700"
              : "bg-kraft-200 text-kraft-500",
          ].join(" ")}
        >
          <Award className="h-6 w-6" aria-hidden />
          ¡Bingo!
        </motion.button>
      )}

      {phase === "playing" && !iHaveBingo && (
        <p className="text-xs italic text-kraft-600">
          Acierta canciones para ganar X — 5 en línea y podrás cantar bingo.
        </p>
      )}

      {/* Toast de bingo en falso */}
      <AnimatePresence>
        {showFalseClaim && falseClaim && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="paper-card fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 border-terracotta-300 px-4 py-3 text-sm font-semibold text-terracotta-600 shadow-paper"
            role="status"
          >
            <MegaphoneOff className="h-4 w-4" aria-hidden />
            {falseClaim.nickname} cantó bingo… sin tener línea. Turno de pagar la ronda.
          </motion.div>
        )}
      </AnimatePresence>

      <PlayersDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        players={players}
        myPlayerId={identity.playerId}
      />

      <AnimatePresence>
        {phase === "finished" && winner && (
          <WinnerOverlay
            winner={winner}
            isMe={winner.playerId === identity.playerId}
            isHost={identity.isHost}
            onReset={resetGame}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
