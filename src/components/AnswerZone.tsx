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
 * Zona blanca de escritura al estilo de la tarjeta física de Hitster:
 * rectángulo blanco separado del fondo kraft con el texto "Adivina:",
 * un campo de entrada grande y limpio, y el logo HITSTER en la base.
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
      className="w-full max-w-2xl rounded-xl border-[1.5px] border-black/80 bg-white px-5 pb-4 pt-5 shadow-card sm:px-8 sm:pb-5 sm:pt-6"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-xl font-bold text-black sm:text-2xl">Adivina:</p>
        {activeRound ? (
          <span
            className="rounded-md border-[1.5px] border-black/85 px-2.5 py-1 text-xs font-black uppercase tracking-wider"
            style={{
              backgroundColor: COLOR_HEX[activeRound.color],
              color: COLOR_ON[activeRound.color],
            }}
          >
            Ronda {COLOR_LABEL[activeRound.color]}
          </span>
        ) : (
          <span className="text-xs italic text-neutral-500">
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
          className="w-full rounded-lg border-2 border-neutral-300 bg-white px-4 py-3.5 font-serif text-xl text-black placeholder:text-neutral-400 focus:border-black focus:outline-none disabled:bg-neutral-100 disabled:text-neutral-400"
        />
        <button
          type="submit"
          disabled={!canWrite || !text.trim()}
          aria-label="Enviar respuesta"
          className="btn-letterpress shrink-0 bg-black p-3.5 text-white disabled:opacity-30"
          style={{ color: "#141414" }}
        >
          <Send className="h-5 w-5 text-white" aria-hidden />
        </button>
      </form>

      {/* Estado de la respuesta enviada */}
      <div className="mt-2 min-h-[1.25rem] text-sm">
        {guessStatus === "submitted" && (
          <p className="flex items-center gap-1.5 text-neutral-600">
            <Hourglass className="h-3.5 w-3.5" aria-hidden />
            Respuesta enviada — esperando validación del host…
          </p>
        )}
        {guessStatus === "approved" && (
          <p className="flex items-center gap-1.5 font-semibold text-sage-600">
            <Check className="h-4 w-4" aria-hidden />
            ¡Validada! X estampada en tu casilla{" "}
            {activeRound ? COLOR_LABEL[activeRound.color].toLowerCase() : ""}.
          </p>
        )}
        {guessStatus === "rejected" && (
          <p className="flex items-center gap-1.5 font-semibold text-terracotta-600">
            <X className="h-4 w-4" aria-hidden />
            El host la ha rechazado. A la próxima…
          </p>
        )}
      </div>

      <p className="mt-3 text-center font-display text-2xl font-black uppercase tracking-[0.35em] text-black">
        HITSTER
      </p>
    </motion.section>
  );
}
