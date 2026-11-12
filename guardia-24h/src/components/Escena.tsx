import type { Item } from '../data/schemas';

type Escena = NonNullable<Item['escena']>;

/** Cuadro eléctrico en vista técnica (Muro de la vergüenza). Cada módulo es un botón accesible por teclado. */
export function Escena({ escena, seleccion, revelar, onChange }: { escena: Escena; seleccion: string[]; revelar: boolean; onChange: (s: string[]) => void }) {
  const alterna = (id: string) => { if (!revelar) onChange(seleccion.includes(id) ? seleccion.filter((x) => x !== id) : [...seleccion, id]); };
  const filas = [...new Set(escena.elementos.map((e) => e.y))];
  return (
    <figure>
      <svg viewBox="0 0 600 320" role="group" aria-label={escena.titulo} className="w-full rounded-lg border border-line bg-[#0b0f11]">
        <defs><pattern id="rej" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#1b2428" strokeWidth="1" /></pattern></defs>
        <rect width="600" height="320" fill="url(#rej)" />
        {filas.map((y) => <rect key={y} x="8" y={y + 84} width="584" height="6" fill="#2b363c" />)}
        {escena.elementos.map((el) => {
          const marcado = seleccion.includes(el.id);
          const malo = revelar && el.defecto, falso = revelar && marcado && !el.defecto, bien = revelar && !el.defecto && !marcado;
          const borde = malo ? '#e5534b' : falso ? '#E39F7D' : marcado ? '#EFCD2F' : bien ? '#3fb27f' : '#3a4850';
          return (
            <g key={el.id} role="button" tabIndex={0} aria-pressed={marcado} aria-label={`${el.etiqueta}${marcado ? ' (marcado)' : ''}`}
              onClick={() => alterna(el.id)} onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); alterna(el.id); } }}
              className="cursor-pointer outline-none [&:focus-visible>rect:first-of-type]:stroke-[3]">
              <rect x={el.x} y={el.y} width={el.w} height={el.h} rx="4" fill={marcado && !revelar ? '#2a2610' : malo ? '#2a1514' : '#161c20'} stroke={borde} strokeWidth={marcado || malo ? 2.5 : 1.5} />
              <foreignObject x={el.x + 6} y={el.y + 6} width={el.w - 12} height={el.h * 0.5}>
                <div className="flex h-full items-center justify-center text-center text-[11px] font-medium leading-tight text-tx">{el.etiqueta}</div>
              </foreignObject>
              <rect x={el.x + el.w / 2 - 8} y={el.y + el.h * 0.62} width="16" height={el.h * 0.26} rx="2" fill="#2b363c" stroke="#566872" />
              <circle cx={el.x + el.w - 12} cy={el.y + el.h - 12} r="3" fill={malo ? '#e5534b' : '#3fb27f'} className={malo ? 'animate-pulse2' : ''} />
              {(malo || falso || bien || marcado) && <text x={el.x + 8} y={el.y + el.h - 8} fontSize="10" fontFamily="monospace" fill={borde}>{malo ? (marcado ? 'DEFECTO ✓' : 'DEFECTO') : falso ? 'SIN DEFECTO' : bien ? 'CORRECTO' : 'MARCADO'}</text>}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1.5 text-sm text-mute">{escena.titulo}. Selecciona los módulos defectuosos; marcar elementos correctos resta puntuación.</figcaption>
    </figure>
  );
}
