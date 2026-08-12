"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Hourglass, Send, X } from "lucide-react";
import { COLOR_HEX, COLOR_LABEL, COLOR_ON } from "@/lib/colors";
import type { ActiveRound, GamePhase, GuessStatus } from "@/lib/types";

interface AnswerZoneProps {
  phase: GamePhase;
  activeRound: ActiveRound | null;
  guessStatus: GuessStatus;
  onSubmit: (text: string) => void;
}

/**
 * Zona de escritura al estilo de la tarjeta física de Hitster: tarjeta
 * blanca que destaca sobre el fondo oscuro, con el texto "Adivina:",
 * un campo de entrada grande y limpio y el logo HITSTER en la base.
 */
export function AnswerZone({ phase, activeRound, guessStatus, onSubmit }: AnswerZoneProps) {
  const [text, setText] = useState("");

  // Al lanzarse una nueva ronda, el campo se vacía para la siguiente.
  useEffect(() => {
    setText("");
  }, [activeRound?.launchId]);

  const canWrite = phase === "playing" && activeRound !== null && guessStatus === "idle";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite || !text.trim()) return;
    onSubmit(text);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl rounded-2xl bg-white px-5 pb-4 pt-5 shadow-[0_10px_50px_rgba(255,255,255,0.08)] sm:px-8 sm:pb-5 sm:pt-6"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-xl font-bold text-neutral-900 sm:text-2xl">
          Adivina:
        </p>
        {activeRound ? (
          <span
            className="rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: COLOR_HEX[activeRound.color],
              color: COLOR_ON[activeRound.color],
              boxShadow: `0 0 14px ${COLOR_HEX[activeRound.color]}55`,
            }}
          >
            Ronda {COLOR_LABEL[activeRound.color]}
          </span>
        ) : (
          <span className="text-xs font-medium text-neutral-400">
            {phase === "playing" ? "Esperando ronda del host…" : "Sin ronda activa"}
          </span>
        )}
      </div>

      <form onSubmit={submit} className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={text}
          maxLength={60}
          disabled={!canWrite}
          onChange={(e) => setText(e.target.value)}
          placeholder={canWrite ? "'90, Dua Lipa, Nirvana…" : "—"}
          aria-label="Tu respuesta"
          className="w-full rounded-xl border-2 border-neutral-200 bg-white px-4 py-3.5 text-xl text-neutral-900 placeholder:text-neutral-300 focus:border-neutral-900 focus:outline-none disabled:bg-neutral-100 disabled:text-neutral-400"
        />
        <button
          type="submit"
          disabled={!canWrite || !text.trim()}
          aria-label="Enviar respuesta"
          className="shrink-0 rounded-xl bg-neutral-900 p-4 text-white transition-transform hover:-translate-y-0.5 hover:bg-neutral-800 disabled:opacity-25 disabled:hover:translate-y-0"
        >
          <Send className="h-5 w-5" aria-hidden />
        </button>
      </form>

      {/* Estado de la respuesta enviada */}
      <div className="mt-2 min-h-[1.25rem] text-sm">
        {guessStatus === "submitted" && (
          <p className="flex items-center gap-1.5 text-neutral-500">
            <Hourglass className="h-3.5 w-3.5" aria-hidden />
            Respuesta enviada — esperando validación del host…
          </p>
        )}
        {guessStatus === "approved" && (
          <p className="flex items-center gap-1.5 font-semibold text-emerald-600">
            <Check className="h-4 w-4" aria-hidden />
            ¡Validada! X estampada en tu casilla{" "}
            {activeRound ? COLOR_LABEL[activeRound.color].toLowerCase() : ""}.
          </p>
        )}
        {guessStatus === "rejected" && (
          <p className="flex items-center gap-1.5 font-semibold text-red-500">
            <X className="h-4 w-4" aria-hidden />
            El host la ha rechazado. A la próxima…
          </p>
        )}
      </div>

      <p className="mt-3 text-center font-display text-2xl font-bold uppercase tracking-[0.35em] text-neutral-900">
        HITSTER
      </p>
    </motion.section>
  );
}
