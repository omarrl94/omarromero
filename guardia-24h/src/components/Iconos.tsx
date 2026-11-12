export const ICONO_DISTRITO: Record<number, string> = { 1: '🛠️', 2: '🔌', 3: '🏠', 4: '🧰', 5: '🏭', 6: '⚙️', 7: '📏', 8: '📋' };

/** Cuadro eléctrico ilustrado con luces parpadeantes (portada). */
export function CuadroHero() {
  return (
    <svg viewBox="0 0 220 200" role="img" aria-label="Cuadro eléctrico ilustrado" className="mx-auto w-48 animate-floaty drop-shadow-[0_8px_0_rgba(0,0,0,.5)] sm:w-56">
      <rect x="10" y="10" width="200" height="180" rx="14" fill="#b9c2c4" stroke="#1A1A1A" strokeWidth="6" />
      <rect x="24" y="24" width="172" height="152" rx="8" fill="#e9eef0" stroke="#1A1A1A" strokeWidth="4" />
      {[0, 1].map((r) => (
        <g key={r} transform={`translate(0 ${r * 66})`}>
          <rect x="32" y="62" width="156" height="8" fill="#7d8a8d" stroke="#1A1A1A" strokeWidth="2" />
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i} transform={`translate(${34 + i * 31} 28)`}>
              <rect width="26" height="46" rx="3" fill={i === 0 && r === 0 ? '#EFCD2F' : '#2b3235'} stroke="#1A1A1A" strokeWidth="3" />
              <rect x="7" y="8" width="12" height="16" rx="2" fill="#e9eef0" />
              <circle cx="13" cy="36" r="3" fill={(i + r) % 3 === 0 ? '#2FB872' : '#E39F7D'} className="animate-flicker" style={{ animationDelay: `${i * 0.4}s` }} />
            </g>
          ))}
        </g>
      ))}
      <path d="M118 2 100 30h14l-6 22 24-32h-14z" fill="#EFCD2F" stroke="#1A1A1A" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}
