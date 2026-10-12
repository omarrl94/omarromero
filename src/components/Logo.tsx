/**
 * Isotipo de Rollo Madrid.
 *
 * Un rollo de papel del que cae el papel: al desenrollarse recorre el
 * suelo y se levanta dibujando una "M" mayúscula de Madrid. En esta
 * dirección el papel va en magenta rotulador con el perforado en verde
 * ácido, para que aguante sobre el asfalto.
 */
export function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 68" className={className} role="img" aria-label="Rollo Madrid">
      <path
        d="M30 49 C 33 60, 40 58, 52 57 L52 22 L68 43 L84 22 L84 57"
        fill="none"
        stroke="#FF2E88"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Perforado del papel */}
      <path
        d="M30 49 C 33 60, 40 58, 52 57 L52 22 L68 43 L84 22 L84 57"
        fill="none"
        stroke="#C6FF3D"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="2 8"
      />
      <path
        d="M9 20 h30 v28 a15 7 0 0 1 -30 0 z"
        fill="#F2ECDF"
        stroke="#000000"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse cx="24" cy="20" rx="15" ry="7" fill="#F2ECDF" stroke="#000000" strokeWidth="3" />
      {/* Canuto de cartón */}
      <ellipse cx="24" cy="20" rx="5" ry="2.3" fill="#FFB800" />
    </svg>
  );
}

/** Logo + nombre, para la barra superior. */
export function Logotipo() {
  return (
    <span className="flex items-center gap-2.5">
      <Logo className="h-10 w-auto" />
      <span className="leading-none">
        <span className="grito block text-xl text-papel">
          Rollo <span className="text-marca">Madrid</span>
        </span>
        <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.22em] text-papel-apagado">
          Mapa callejero de baños
        </span>
      </span>
    </span>
  );
}
