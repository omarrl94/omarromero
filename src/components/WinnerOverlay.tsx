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

    // Confetti en la paleta neón de las fichas.
    const colors = ["#FFD60A", "#0A9BFF", "#00E572", "#FF453A", "#BF5AF2", "#22D3EE"];
    const end = Date.now() + 1800;

    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    confetti({ particleCount: 140, spread: 100, origin: { y: 0.6 }, colors });
    frame();
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="alertdialog"
      aria-label="Fin de la partida"
    >
      <motion.div
        className="glass-card w-full max-w-md p-8 text-center shadow-panel"
        initial={{ scale: 0.7, rotate: -4, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 20 }}
      >
        <PartyPopper className="mx-auto h-12 w-12 text-neon-yellow" aria-hidden />
        <h2 className="text-gradient mt-4 font-display text-5xl font-bold uppercase tracking-wide">
          ¡Bingo!
        </h2>
        <p className="mt-4 text-lg text-white/80">
          {isMe ? (
            <>
              Has completado la línea, <strong className="text-white">{winner.nickname}</strong>.
              <br />
              Eres oficialmente la estrella de la velada.
            </>
          ) : (
            <>
              <strong className="text-white">{winner.nickname}</strong> ha cantado línea de 5.
              <br />
              La partida queda congelada.
            </>
          )}
        </p>
        <div className="mx-auto mt-6 h-px w-32 bg-white/15" />
        {isHost ? (
          <button
            type="button"
            onClick={onReset}
            className="btn-primary mx-auto mt-6 flex items-center justify-center gap-2 px-6 py-3.5 font-display font-bold"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Nueva ronda (cartones nuevos)
          </button>
        ) : (
          <p className="mt-6 text-sm text-white/40">
            El host puede reiniciar con cartones nuevos.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
