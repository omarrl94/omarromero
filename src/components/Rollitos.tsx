"use client";

import { GRADOS } from "@/lib/scores";
import type { Puntuacion } from "@/lib/types";

/** Rollo de papel en monolínea: el icono de la escala de puntuación. */
export function RolloIcono({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor">
      <path
        d="M4.2 8.2 h12 v7.4 a6 2.8 0 0 1 -12 0 z"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <ellipse cx="10.2" cy="8.2" rx="6" ry="2.8" strokeWidth="1.8" />
      {/* Hoja que cuelga */}
      <path
        d="M16.2 9.8 h3.6 v7.8 l-1.8 -1.3 -1.8 1.3 z"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PUNTUACIONES: readonly Puntuacion[] = [1, 2, 3, 4, 5];

/**
 * Escala de 1 a 5 rollos. Cada grado tiene nombre propio ("Infierno",
 * "Gloria"), que es lo que se lee al puntuar.
 */
export function EscalaRollos({
  valor,
  onChange,
  etiqueta,
  colorDe,
}: {
  valor: Puntuacion | null;
  onChange: (valor: Puntuacion) => void;
  etiqueta: string;
  /** Color del grado elegido; lo decide el veredicto de esa nota. */
  colorDe: (puntuacion: Puntuacion) => string;
}) {
  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label={etiqueta}>
      {PUNTUACIONES.map((n) => {
        const activo = valor === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={activo}
            aria-label={`${n} de 5 en ${etiqueta} (${GRADOS[n - 1]})`}
            onClick={() => onChange(n)}
            style={activo ? { backgroundColor: colorDe(n) } : undefined}
            className={`grid aspect-square max-h-[60px] flex-1 place-items-center gap-0.5 border-2 transition-colors ${
              activo
                ? "border-black text-asfalto-900 shadow-dura-s"
                : "border-borde bg-asfalto-700 text-papel-apagado hover:border-papel hover:text-papel"
            }`}
          >
            <RolloIcono className="h-5 w-5" />
            <span className="font-mono text-[10px]">{n}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Fila de rollos de solo lectura, para listados compactos. */
export function RollosEstaticos({
  valor,
  color,
}: {
  valor: number;
  color: string;
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {PUNTUACIONES.map((n) => (
        <RolloIcono
          key={n}
          className={`h-3.5 w-3.5 ${n <= Math.round(valor) ? "" : "opacity-25"}`}
        />
      ))}
      <span className="sr-only">{valor} sobre 5</span>
      <span aria-hidden="true" className="sr-only" style={{ color }} />
    </span>
  );
}
