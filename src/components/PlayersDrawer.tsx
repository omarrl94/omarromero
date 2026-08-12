"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crown, Users, X, WifiOff } from "lucide-react";
import { progressPercent } from "@/lib/bingo";
import type { PlayerPresence } from "@/lib/types";

interface PlayersDrawerProps {
  open: boolean;
  onClose: () => void;
  players: readonly PlayerPresence[];
  myPlayerId: string;
}

/**
 * Panel lateral con la lista de jugadores conectados y su % de
 * casillas marcadas. Solo muestra el progreso, nunca el cartón:
 * la intriga es parte del juego.
 */
export function PlayersDrawer({ open, onClose, players, myPlayerId }: PlayersDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-dvh w-80 max-w-[85vw] flex-col border-l border-white/10 bg-night-800/95 shadow-panel backdrop-blur-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            role="dialog"
            aria-label="Jugadores en la sala"
          >
            <header className="flex items-center justify-between border-b border-white/10 p-4">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
                <Users className="h-5 w-5 text-neon-cyan" aria-hidden />
                Jugadores ({players.length})
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar panel"
                className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </header>

            <ul className="flex-1 space-y-4 overflow-y-auto p-4">
              {players.length === 0 && (
                <li className="flex items-center gap-2 text-sm text-white/40">
                  <WifiOff className="h-4 w-4" aria-hidden />
                  Nadie conectado todavía…
                </li>
              )}
              {players.map((player) => {
                const pct = progressPercent(player.markedCount);
                const isMe = player.playerId === myPlayerId;
                return (
                  <li key={player.playerId}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 font-medium text-white/90">
                        {player.isHost && (
                          <Crown className="h-4 w-4 shrink-0 text-neon-yellow" aria-label="Host" />
                        )}
                        <span className="truncate">{player.nickname}</span>
                        {isMe && (
                          <span className="shrink-0 rounded-full bg-neon-cyan/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neon-cyan">
                            tú
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-mono text-xs font-bold text-white/50">
                        {pct}%
                      </span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-white/10"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progreso de ${player.nickname}`}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: isMe
                            ? "linear-gradient(90deg, #22D3EE, #8B5CF6)"
                            : "linear-gradient(90deg, #8B5CF6, #BF5AF2)",
                          boxShadow: "0 0 10px rgba(139, 92, 246, 0.5)",
                        }}
                        initial={false}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 20 }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            <footer className="border-t border-white/10 p-4 text-center text-xs text-white/35">
              El progreso es público; tu cartón, secreto.
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
