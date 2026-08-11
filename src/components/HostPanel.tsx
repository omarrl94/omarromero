"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Megaphone, X } from "lucide-react";
import { COLOR_HEX, COLOR_LABEL, COLOR_ON, TILE_COLORS } from "@/lib/colors";
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
    <section className="paper-card w-full max-w-2xl p-4 shadow-card sm:p-5">
      <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
        <Megaphone className="h-4 w-4 text-terracotta-500" aria-hidden />
        Mesa del host — lanza una ronda de color
      </h2>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {TILE_COLORS.map((color) => {
          const isActive = activeRound?.color === color;
          return (
            <button
              key={color}
              type="button"
              onClick={() => onLaunchRound(color)}
              aria-pressed={isActive}
              className={[
                "rounded-lg border-[1.5px] border-black/85 px-3.5 py-2 text-sm font-black uppercase tracking-wide transition-transform hover:-translate-y-0.5",
                isActive ? "ring-2 ring-black ring-offset-2 ring-offset-kraft-50" : "",
              ].join(" ")}
              style={{ backgroundColor: COLOR_HEX[color], color: COLOR_ON[color] }}
            >
              {COLOR_LABEL[color]}
            </button>
          );
        })}
      </div>

      {activeRound && (
        <p className="mt-2 text-xs italic text-kraft-700">
          Ronda activa: <strong>{COLOR_LABEL[activeRound.color]}</strong>. Pon la
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
                className="flex items-center gap-3 rounded-lg border border-kraft-300 bg-white px-3 py-2"
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-sm border border-black/80"
                  style={{ backgroundColor: COLOR_HEX[guess.color] }}
                  aria-label={`Color ${COLOR_LABEL[guess.color]}`}
                />
                <span className="min-w-0 flex-1 truncate text-sm text-ink">
                  <strong>{guess.nickname}</strong>: “{guess.guess}”
                </span>
                <button
                  type="button"
                  onClick={() => onJudge(guess, true)}
                  aria-label={`Validar respuesta de ${guess.nickname}`}
                  className="rounded-md border-[1.5px] border-sage-600 bg-sage-200 p-1.5 text-sage-700 hover:bg-sage-300"
                >
                  <Check className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onJudge(guess, false)}
                  aria-label={`Rechazar respuesta de ${guess.nickname}`}
                  className="rounded-md border-[1.5px] border-terracotta-500 bg-terracotta-100 p-1.5 text-terracotta-600 hover:bg-terracotta-200"
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
