"use client";

import { useState } from "react";
import type { Puntuacion } from "@/lib/types";

/** Rollito de papel: el icono con el que se puntúa (1 a 5). */
export function RolloIcono({
  relleno,
  className = "h-6 w-6",
}: {
  relleno: boolean;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {/* Cuerpo del rollo */}
      <path
        d="M3.5 8 h13 v7.5 a6.5 3 0 0 1 -13 0 z"
        fill={relleno ? "#FFFDF8" : "#F1EADA"}
        stroke={relleno ? "#C9962F" : "#D6C3A3"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <ellipse
        cx="10"
        cy="8"
        rx="6.5"
        ry="3"
        fill={relleno ? "#FFFDF8" : "#F1EADA"}
        stroke={relleno ? "#C9962F" : "#D6C3A3"}
        strokeWidth="1.5"
      />
      {/* Canuto de cartón */}
      <ellipse
        cx="10"
        cy="8"
        rx="2.2"
        ry="1"
        fill={relleno ? "#E0B252" : "#E3D9C3"}
      />
      {/* Hoja que cuelga */}
      <path
        d="M16.5 9.5 h4 v8.4 l-2 -1.4 -2 1.4 z"
        fill={relleno ? "#FFFDF8" : "#F1EADA"}
        stroke={relleno ? "#C9962F" : "#D6C3A3"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PUNTUACIONES: readonly Puntuacion[] = [1, 2, 3, 4, 5];

/** Fila de rollitos de solo lectura. */
export function RollitosEstaticos({
  valor,
  className = "h-4 w-4",
}: {
  valor: number;
  className?: string;
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {PUNTUACIONES.map((n) => (
        <RolloIcono key={n} relleno={n <= Math.round(valor)} className={className} />
      ))}
    </span>
  );
}

/** Fila de rollitos pulsables, para el formulario de valoración. */
export function RollitosInput({
  valor,
  onChange,
  etiqueta,
}: {
  valor: Puntuacion | null;
  onChange: (valor: Puntuacion) => void;
  etiqueta: string;
}) {
  const [hover, setHover] = useState<Puntuacion | null>(null);
  const activo = hover ?? valor ?? 0;

  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label={etiqueta}
      onMouseLeave={() => setHover(null)}
    >
      {PUNTUACIONES.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={valor === n}
          aria-label={`${n} de 5 en ${etiqueta}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(null)}
          className="rounded-lg p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-agua-400 active:scale-95"
        >
          <RolloIcono relleno={n <= activo} className="h-8 w-8 sm:h-7 sm:w-7" />
        </button>
      ))}
    </div>
  );
}
