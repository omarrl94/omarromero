"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { PartyPopper, RotateCcw } from "lucide-react";
import type { WinnerInfo } from "@/lib/types";

interface WinnerOverlayProps {
  winner: WinnerInfo;
  isMe: boolean;
  isHost: boolean;
  onReset: () => void;
}

/** Alerta global de victoria: congela la partida y lanza confetti. */
export function WinnerOverlay({ winner, isMe, isHost, onReset }: WinnerOverlayProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    // Paleta craft: salvia, mostaza y terracota.
    const colors = ["#6f8a5c", "#d4a72c", "#b45c3d", "#f4ebd9"];
    const end = Date.now() + 1800;

    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    confetti({ particleCount: 120, spread: 100, origin: { y: 0.6 }, colors });
    frame();
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="alertdialog"
      aria-label="Fin de la partida"
    >
      <motion.div
        className="paper-card w-full max-w-md p-8 text-center shadow-paper"
        initial={{ scale: 0.7, rotate: -4, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 20 }}
      >
        <PartyPopper className="mx-auto h-12 w-12 text-mustard-500" aria-hidden />
        <h2 className="mt-4 font-display text-4xl font-black uppercase tracking-wide text-terracotta-600">
          ¡Bingo!
        </h2>
        <p className="mt-3 text-lg text-ink">
          {isMe ? (
            <>
              Has completado la línea, <strong>{winner.nickname}</strong>.
              <br />
              Eres oficialmente el hipster de la velada.
            </>
          ) : (
            <>
              <strong>{winner.nickname}</strong> ha cantado línea de 5.
              <br />
              La partida queda congelada.
            </>
          )}
        </p>
        <div className="mx-auto mt-5 h-px w-32 bg-kraft-400" />
        {isHost ? (
          <button
            type="button"
            onClick={onReset}
            className="btn-letterpress mx-auto mt-6 flex items-center justify-center gap-2 bg-sage-200 px-6 py-3 font-display font-bold text-sage-700"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Nueva ronda (cartones nuevos)
          </button>
        ) : (
          <p className="mt-6 text-sm italic text-kraft-600">
            El host puede reiniciar con cartones nuevos.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
