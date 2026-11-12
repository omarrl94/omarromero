import type { Item } from '../data/schemas';

type Escena = NonNullable<Item['escena']>;

/** Cuadro eléctrico ilustrado (Muro de la vergüenza). Cada módulo es un botón accesible por teclado. */
export function Escena({ escena, seleccion, revelar, onChange }: { escena: Escena; seleccion: string[]; revelar: boolean; onChange: (s: string[]) => void }) {
  const alterna = (id: string) => { if (!revelar) onChange(seleccion.includes(id) ? seleccion.filter((x) => x !== id) : [...seleccion, id]); };
  const filas = [...new Set(escena.elementos.map((e) => e.y))];
  return (
    <figure>
      <svg viewBox="0 0 600 320" role="group" aria-label={escena.titulo} className="w-full rounded-2xl border-[3px] border-tinta shadow-[0_6px_0_#000]">
        <defs>
          <linearGradient id="chapa" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#dfe5e7" /><stop offset="1" stopColor="#b5bfc2" /></linearGradient>
          <filter id="brillo"><feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#EFCD2F" /></filter>
        </defs>
        <rect width="600" height="320" fill="url(#chapa)" />
        <rect x="6" y="6" width="588" height="308" rx="10" fill="none" stroke="#7d8a8d" strokeWidth="4" strokeDasharray="1 9" strokeLinecap="round" />
        {filas.map((y) => <rect key={y} x="8" y={y + 84} width="584" height="8" fill="#8d999c" stroke="#1A1A1A" strokeWidth="2" />)}
        {escena.elementos.map((el) => {
          const marcado = seleccion.includes(el.id);
          const malo = revelar && el.defecto, falso = revelar && marcado && !el.defecto, bien = revelar && !el.defecto && !marcado;
          const borde = malo ? '#E5484D' : marcado && !revelar ? '#EFCD2F' : '#1A1A1A';
          return (
            <g key={el.id} role="button" tabIndex={0} aria-pressed={marcado} aria-label={`${el.etiqueta}${marcado ? ' (marcado)' : ''}`}
              onClick={() => alterna(el.id)} onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); alterna(el.id); } }}
              className="cursor-pointer outline-none [&:focus-visible>rect:first-of-type]:stroke-[6]" filter={marcado && !revelar ? 'url(#brillo)' : undefined} opacity={bien || falso ? 0.7 : 1}>
              <rect x={el.x} y={el.y} width={el.w} height={el.h} rx="8" fill={malo ? '#4a1f21' : '#2b3235'} stroke={borde} strokeWidth={marcado || malo ? 5 : 3} />
              <foreignObject x={el.x + 6} y={el.y + 6} width={el.w - 12} height={el.h * 0.5}>
                <div className="flex h-full items-center justify-center rounded bg-crema px-1 text-center text-[11px] font-bold leading-tight text-tinta">{el.etiqueta}</div>
              </foreignObject>
              <rect x={el.x + el.w / 2 - 9} y={el.y + el.h * 0.62} width="18" height={el.h * 0.28} rx="3" fill="#e9eef0" stroke="#1A1A1A" strokeWidth="2" />
              <circle cx={el.x + el.w - 14} cy={el.y + el.h - 12} r="4" fill={malo ? '#E5484D' : '#2FB872'} className={malo ? 'animate-flicker' : ''} />
              {malo && <text x={el.x + el.w - 6} y={el.y + 8} textAnchor="end" fontSize="18" className="animate-pop">⚠️</text>}
              {falso && <text x={el.x + el.w - 6} y={el.y + 8} textAnchor="end" fontSize="18">✗</text>}
              {bien && <text x={el.x + el.w - 6} y={el.y + 8} textAnchor="end" fontSize="16">✓</text>}
              {marcado && !revelar && <text x={el.x + 6} y={el.y + 6} fontSize="18">🚩</text>}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1 text-sm text-menta">{escena.titulo}. Toca los módulos defectuosos para marcarlos (los marcados de más restan).</figcaption>
    </figure>
  );
}
