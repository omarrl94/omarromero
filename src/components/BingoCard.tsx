"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { FREE_INDEX, type Card } from "@/lib/bingo";
import { COLOR_HEX, COLOR_ON } from "@/lib/colors";

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
        stroke="#141414"
        strokeWidth="13"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M86 14 C 60 36, 40 60, 12 86"
        stroke="#141414"
        strokeWidth="13"
        strokeLinecap="round"
        fill="none"
        opacity="0.92"
      />
    </motion.svg>
  );
}

/**
 * Cartón visual 5x5 estilo Hitster: fichas de color sólido con borde
 * negro fino. Sin marcado táctil — la X negra solo aparece cuando el
 * host valida una respuesta de la ronda de ese color.
 */
export const BingoCard = memo(function BingoCard({
  card,
  marked,
  winningLine,
}: BingoCardProps) {
  const winning = winningLine ? new Set(winningLine) : null;

  return (
    <div className="paper-card w-full max-w-2xl p-3 shadow-paper sm:p-4">
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2" role="grid" aria-label="Cartón de colores">
        {card.map((color, i) => {
          const isFree = i === FREE_INDEX;
          const isMarked = marked.has(i);
          const isWinning = winning?.has(i) ?? false;

          return (
            <div
              key={i}
              role="gridcell"
              aria-label={isFree ? "Comodín FREE, Pipa de Cobre" : `Ficha ${color}`}
              className={[
                "relative flex aspect-square select-none items-center justify-center overflow-hidden rounded-lg border-[1.5px] border-black/85",
                isWinning ? "ring-2 ring-black ring-offset-2 ring-offset-kraft-100" : "",
              ].join(" ")}
              style={{
                backgroundColor: COLOR_HEX[color],
                boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.14), inset 0 2px 0 rgba(255,255,255,0.18)",
              }}
            >
              {isFree && (
                <span
                  className="z-10 px-1 text-center font-display text-[8px] font-black uppercase leading-tight tracking-wide sm:text-[10px]"
                  style={{ color: COLOR_ON[color] }}
                >
                  FREE
                  <br />
                  <span className="font-serif text-[7px] font-semibold normal-case italic sm:text-[9px]">
                    Pipa de Cobre
                  </span>
                </span>
              )}

              {isMarked && !isFree && <CrossMark />}
            </div>
          );
        })}
      </div>
    </div>
  );
});
