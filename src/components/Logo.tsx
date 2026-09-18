"use client";

import { useId } from "react";

/**
 * Isotipo de Rollo Madrid.
 *
 * Un rollo de papel higiénico del que cae el papel: al desenrollarse
 * recorre el suelo y se levanta dibujando una "M" mayúscula de Madrid.
 * Todo es SVG, así que escala sin perder nitidez y se puede recolorear.
 */
export function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  const id = useId();
  const papel = `${id}-papel`;
  const rollo = `${id}-rollo`;

  return (
    <svg
      viewBox="0 0 128 68"
      className={className}
      role="img"
      aria-label="Rollo Madrid"
    >
      <defs>
        {/* El papel pasa del azul agua al rojo Madrid según se desenrolla */}
        <linearGradient id={papel} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#1E9FC6" />
          <stop offset="55%" stopColor="#2E86AB" />
          <stop offset="100%" stopColor="#D0202E" />
        </linearGradient>
        <linearGradient id={rollo} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EDE6D6" />
        </linearGradient>
      </defs>

      {/* ── Papel que cae y forma la M ── */}
      <path
        d="M30 49 C 33 60, 40 58, 52 57 L52 22 L68 43 L84 22 L84 57"
        fill="none"
        stroke={`url(#${papel})`}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Línea de perforado, para que se lea como papel y no como un trazo */}
      <path
        d="M30 49 C 33 60, 40 58, 52 57 L52 22 L68 43 L84 22 L84 57"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.55"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1.5 6"
      />

      {/* ── Rollo ── */}
      <path
        d="M9 20 h30 v28 a15 7 0 0 1 -30 0 z"
        fill={`url(#${rollo})`}
        stroke="#C2A17B"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <ellipse
        cx="24"
        cy="20"
        rx="15"
        ry="7"
        fill="#FFFFFF"
        stroke="#C2A17B"
        strokeWidth="2.4"
      />
      {/* Canuto de cartón */}
      <ellipse cx="24" cy="20" rx="5.2" ry="2.4" fill="#C9962F" />
      {/* Sombra interior del rollo, para darle volumen */}
      <path
        d="M34 24 a15 7 0 0 1 -20 0"
        fill="none"
        stroke="#EDE6D6"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Logo + nombre, para la barra superior. */
export function Logotipo({ compacto = false }: { compacto?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Logo className={compacto ? "h-8 w-auto" : "h-10 w-auto"} />
      <span className="leading-none">
        <span className="block font-display text-xl font-bold tracking-tight text-tinta">
          Rollo <span className="text-madrid-600">Madrid</span>
        </span>
        {!compacto && (
          <span className="mt-0.5 hidden text-[11px] font-medium uppercase tracking-[0.18em] text-carton-600 sm:block">
            El mapa de los baños
          </span>
        )}
      </span>
    </span>
  );
}
