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
 * casillas marcadas. Solo muestra el progreso, nunca las frases:
 * la intriga es parte del juego.
 */
export function PlayersDrawer({ open, onClose, players, myPlayerId }: PlayersDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-ink/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            className="paper-card fixed right-0 top-0 z-50 flex h-dvh w-80 max-w-[85vw] flex-col rounded-none border-y-0 border-r-0 shadow-paper"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            role="dialog"
            aria-label="Jugadores en la sala"
          >
            <header className="flex items-center justify-between border-b border-dashed border-kraft-400 p-4">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                <Users className="h-5 w-5 text-sage-600" aria-hidden />
                Jugadores ({players.length})
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar panel"
                className="rounded-md p-1.5 text-kraft-600 hover:bg-kraft-200"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </header>

            <ul className="flex-1 space-y-4 overflow-y-auto p-4">
              {players.length === 0 && (
                <li className="flex items-center gap-2 text-sm italic text-kraft-600">
                  <WifiOff className="h-4 w-4" aria-hidden />
                  Nadie conectado todavía…
                </li>
              )}
              {players.map((player) => {
                const pct = progressPercent(player.markedCount);
                const isMe = player.playerId === myPlayerId;
                return (
                  <li key={player.playerId}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 font-semibold text-ink">
                        {player.isHost && (
                          <Crown className="h-4 w-4 shrink-0 text-mustard-500" aria-label="Host" />
                        )}
                        <span className="truncate">{player.nickname}</span>
                        {isMe && (
                          <span className="shrink-0 rounded-full bg-sage-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sage-700">
                            tú
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-mono text-xs font-bold text-kraft-700">
                        {pct}%
                      </span>
                    </div>
                    <div
                      className="h-2.5 overflow-hidden rounded-full border border-kraft-300 bg-kraft-100"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progreso de ${player.nickname}`}
                    >
                      <motion.div
                        className={isMe ? "h-full bg-sage-500" : "h-full bg-terracotta-400"}
                        initial={false}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 20 }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            <footer className="border-t border-dashed border-kraft-400 p-4 text-center text-xs italic text-kraft-600">
              El progreso es público; tu cartón, secreto.
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
