"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { FREE_INDEX, type Card } from "@/lib/bingo";
import { COLOR_GLOW, COLOR_HEX, COLOR_ON } from "@/lib/colors";

interface BingoCardProps {
  card: Card;
  marked: ReadonlySet<number>;
  winningLine: readonly number[] | null;
}

/** X negra dibujada a mano (dos trazos con puntas redondeadas). */
function CrossMark({ delay = 0 }: { delay?: number }) {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className="absolute inset-0 h-full w-full p-[14%]"
      initial={{ scale: 1.9, rotate: -14, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 480, damping: 20, mass: 0.6, delay }}
      aria-hidden
    >
      <path
        d="M14 12 C 38 34, 62 62, 88 88"
        stroke="#0a0a10"
        strokeWidth="13"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M86 14 C 60 36, 40 60, 12 86"
        stroke="#0a0a10"
        strokeWidth="13"
        strokeLinecap="round"
        fill="none"
        opacity="0.92"
      />
    </motion.svg>
  );
}

/**
 * Cartón visual 5x5: fichas de color neón con halo luminoso sobre el
 * fondo oscuro. Sin marcado táctil — la X solo aparece cuando el host
 * valida una respuesta de la ronda de ese color.
 */
export const BingoCard = memo(function BingoCard({
  card,
  marked,
  winningLine,
}: BingoCardProps) {
  const winning = winningLine ? new Set(winningLine) : null;

  return (
    <div className="glass-card w-full max-w-2xl p-3 shadow-panel sm:p-4">
      <div className="grid grid-cols-5 gap-2 sm:gap-2.5" role="grid" aria-label="Cartón de colores">
        {card.map((color, i) => {
          const isFree = i === FREE_INDEX;
          const isMarked = marked.has(i);
          const isWinning = winning?.has(i) ?? false;

          return (
            <motion.div
              key={i}
              role="gridcell"
              aria-label={isFree ? "Comodín FREE, Pipa de Cobre" : `Ficha ${color}`}
              initial={false}
              animate={{ scale: isWinning ? 1.03 : 1 }}
              className={[
                "relative flex aspect-square select-none items-center justify-center overflow-hidden rounded-xl",
                isWinning ? "ring-2 ring-white/90" : "",
              ].join(" ")}
              style={{
                backgroundColor: COLOR_HEX[color],
                boxShadow: [
                  `0 0 18px ${COLOR_GLOW[color]}`,
                  "inset 0 -4px 0 rgba(0,0,0,0.22)",
                  "inset 0 2px 0 rgba(255,255,255,0.28)",
                ].join(", "),
              }}
            >
              {isFree && (
                <span
                  className="z-10 px-1 text-center font-display text-[9px] font-bold uppercase leading-tight tracking-widest sm:text-[11px]"
                  style={{ color: COLOR_ON[color] }}
                >
                  FREE
                  <br />
                  <span className="text-[7px] font-medium normal-case tracking-normal opacity-80 sm:text-[9px]">
                    Pipa de Cobre
                  </span>
                </span>
              )}

              {isMarked && !isFree && <CrossMark />}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});
