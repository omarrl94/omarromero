import type { Item } from '../data/schemas';

type Escena = NonNullable<Item['escena']>;

/** Escena con hotspots (Muro de la vergüenza): se marcan los defectos; accesible con teclado. */
export function Escena({ escena, seleccion, revelar, onChange }: { escena: Escena; seleccion: string[]; revelar: boolean; onChange: (s: string[]) => void }) {
  const alterna = (id: string) => { if (!revelar) onChange(seleccion.includes(id) ? seleccion.filter((x) => x !== id) : [...seleccion, id]); };
  return (
    <figure>
      <svg viewBox="0 0 600 320" role="group" aria-label={escena.titulo} className="w-full rounded-xl border-2 border-tinta bg-white">
        <rect x="0" y="0" width="600" height="320" fill="#f4f1e6" />
        {escena.elementos.map((el) => {
          const marcado = seleccion.includes(el.id);
          const fill = revelar ? (el.defecto ? '#E39F7D' : '#A9CABB') : marcado ? '#EFCD2F' : '#ffffff';
          return (
            <g key={el.id} role="button" tabIndex={0} aria-pressed={marcado} aria-label={`${el.etiqueta}${marcado ? ' (marcado)' : ''}`}
              onClick={() => alterna(el.id)} onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); alterna(el.id); } }} className="cursor-pointer outline-none focus-visible:[&>rect]:stroke-[4]">
              <rect x={el.x} y={el.y} width={el.w} height={el.h} rx="6" fill={fill} stroke="#1A1A1A" strokeWidth={marcado ? 4 : 2} />
              <text x={el.x + el.w / 2} y={el.y + el.h / 2} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#1A1A1A">{el.etiqueta}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="text-sm">{escena.titulo}. Marca todo lo que esté mal (los fallos marcados de más restan).</figcaption>
    </figure>
  );
}
