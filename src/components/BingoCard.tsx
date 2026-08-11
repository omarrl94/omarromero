"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { FREE_INDEX, type Card } from "@/lib/bingo";
import { FREE_CELL_TEXT, MASTER_CLICHES } from "@/lib/cliches";

interface BingoCardProps {
  card: Card;
  marked: ReadonlySet<number>;
  winningLine: readonly number[] | null;
  disabled: boolean;
  onToggle: (index: number) => void;
}

/** Cartón 5x5 en papel craft con sellos de tinta animados. */
export const BingoCard = memo(function BingoCard({
  card,
  marked,
  winningLine,
  disabled,
  onToggle,
}: BingoCardProps) {
  const winning = winningLine ? new Set(winningLine) : null;

  return (
    <div className="paper-card w-full max-w-2xl p-3 shadow-paper sm:p-4">
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2" role="grid" aria-label="Cartón de bingo">
        {card.map((clicheIndex, i) => {
          const isFree = i === FREE_INDEX;
          const isMarked = isFree || marked.has(i);
          const isWinning = winning?.has(i) ?? false;
          const text = isFree
            ? FREE_CELL_TEXT
            : MASTER_CLICHES[clicheIndex]?.text ?? "";

          return (
            <button
              key={i}
              type="button"
              role="gridcell"
              aria-pressed={isMarked}
              disabled={disabled || isFree}
              onClick={() => onToggle(i)}
              className={[
                "relative flex aspect-square select-none items-center justify-center overflow-hidden rounded-md border p-1 text-center leading-tight transition-colors sm:p-1.5",
                isFree
                  ? "border-mustard-400 bg-mustard-100"
                  : "border-kraft-300 bg-kraft-50 hover:border-terracotta-300 hover:bg-kraft-100",
                isWinning ? "ring-2 ring-sage-500 ring-offset-1 ring-offset-kraft-100" : "",
                disabled && !isFree ? "cursor-default opacity-90" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "z-10 hyphens-auto text-[9px] font-medium sm:text-[11px] md:text-xs",
                  isFree ? "font-display font-black uppercase tracking-wide text-mustard-600" : "text-ink",
                  isMarked && !isFree ? "opacity-70" : "",
                ].join(" ")}
                lang="es"
              >
                {text}
              </span>

              {isMarked && (
                <motion.span
                  className="ink-stamp"
                  initial={isFree ? false : { scale: 2.4, rotate: -18, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22, mass: 0.6 }}
                  aria-hidden
                >
                  <span
                    className={[
                      "ink-stamp-ring",
                      isWinning ? "ink-stamp-ring--winner" : "",
                    ].join(" ")}
                  />
                </motion.span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});
