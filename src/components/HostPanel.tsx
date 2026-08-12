"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Megaphone, X } from "lucide-react";
import { COLOR_GLOW, COLOR_HEX, COLOR_LABEL, COLOR_ON, TILE_COLORS } from "@/lib/colors";
import type { ActiveRound, GuessPayload } from "@/lib/types";
import type { TileColor } from "@/lib/colors";

interface HostPanelProps {
  activeRound: ActiveRound | null;
  pendingGuesses: readonly GuessPayload[];
  onLaunchRound: (color: TileColor) => void;
  onJudge: (guess: GuessPayload, approved: boolean) => void;
}

/**
 * Mesa del host: lanzar rondas de un color y validar/rechazar las
 * respuestas que llegan a la cola. Solo se renderiza para el host.
 */
export function HostPanel({
  activeRound,
  pendingGuesses,
  onLaunchRound,
  onJudge,
}: HostPanelProps) {
  return (
    <section className="glass-card w-full max-w-2xl p-4 shadow-panel sm:p-5">
      <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-white/70">
        <Megaphone className="h-4 w-4 text-neon-cyan" aria-hidden />
        Mesa del host — lanza una ronda de color
      </h2>

      <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
        {TILE_COLORS.map((color) => {
          const isActive = activeRound?.color === color;
          return (
            <button
              key={color}
              type="button"
              onClick={() => onLaunchRound(color)}
              aria-pressed={isActive}
              className={[
                "rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition-transform hover:-translate-y-0.5",
                isActive ? "ring-2 ring-white/90 ring-offset-2 ring-offset-night-900" : "",
              ].join(" ")}
              style={{
                backgroundColor: COLOR_HEX[color],
                color: COLOR_ON[color],
                boxShadow: `0 0 16px ${COLOR_GLOW[color]}`,
              }}
            >
              {COLOR_LABEL[color]}
            </button>
          );
        })}
      </div>

      {activeRound && (
        <p className="mt-2.5 text-xs text-white/45">
          Ronda activa: <strong className="text-white/80">{COLOR_LABEL[activeRound.color]}</strong>. Pon la
          canción; valida las respuestas correctas según lleguen.
        </p>
      )}

      {/* Cola de validación */}
      <AnimatePresence initial={false}>
        {pendingGuesses.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2 overflow-hidden"
          >
            {pendingGuesses.map((guess) => (
              <motion.li
                key={`${guess.playerId}-${guess.launchId}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-md"
                  style={{
                    backgroundColor: COLOR_HEX[guess.color],
                    boxShadow: `0 0 10px ${COLOR_GLOW[guess.color]}`,
                  }}
                  aria-label={`Color ${COLOR_LABEL[guess.color]}`}
                />
                <span className="min-w-0 flex-1 truncate text-sm text-white/85">
                  <strong>{guess.nickname}</strong>: “{guess.guess}”
                </span>
                <button
                  type="button"
                  onClick={() => onJudge(guess, true)}
                  aria-label={`Validar respuesta de ${guess.nickname}`}
                  className="rounded-lg border border-emerald-400/40 bg-emerald-400/15 p-2 text-emerald-300 transition-colors hover:bg-emerald-400/30"
                >
                  <Check className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onJudge(guess, false)}
                  aria-label={`Rechazar respuesta de ${guess.nickname}`}
                  className="rounded-lg border border-red-400/40 bg-red-400/15 p-2 text-red-300 transition-colors hover:bg-red-400/30"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </section>
  );
}
