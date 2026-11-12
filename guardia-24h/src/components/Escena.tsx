import type { Item } from '../data/schemas';
import { AparatoSvg, DefsAparatos, type Aparato, type Visual } from './sim/Aparatos';

type Escena = NonNullable<Item['escena']>;
const ELECTRICOS = new Set(['pia', 'diferencial', 'iga', 'sobretension', 'regleta', 'borna']);

/** Inspección visual: el alumno observa aparatos reales dibujados y marca los defectos. Accesible por teclado. */
export function Escena({ escena, seleccion, revelar, onChange }: { escena: Escena; seleccion: string[]; revelar: boolean; onChange: (s: string[]) => void }) {
  const alterna = (id: string) => { if (!revelar) onChange(seleccion.includes(id) ? seleccion.filter((x) => x !== id) : [...seleccion, id]); };
  const filas = [...new Set(escena.elementos.map((e) => e.y))];
  const cuadro = escena.elementos.filter((e) => ELECTRICOS.has(e.aparato ?? '')).length >= escena.elementos.length / 2;
  const alto = filas.length * 172 + 12;
  return (
    <figure>
      <svg viewBox={`0 0 600 ${alto}`} role="group" aria-label={escena.titulo} className="w-full rounded-lg border border-line">
        <DefsAparatos />
        <defs>
          <linearGradient id="fondoCuadro" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#8e999e" /><stop offset=".5" stopColor="#b4bdc1" /><stop offset="1" stopColor="#8a959a" /></linearGradient>
          <linearGradient id="fondoPared" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d9d3c6" /><stop offset="1" stopColor="#bdb6a6" /></linearGradient>
          <linearGradient id="carril" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#e8ecef" /><stop offset="1" stopColor="#7e888e" /></linearGradient>
        </defs>
        <rect width="600" height={alto} fill={cuadro ? 'url(#fondoCuadro)' : 'url(#fondoPared)'} />
        {cuadro && <rect x="3" y="3" width="594" height={alto - 6} rx="6" fill="none" stroke="#5c676d" strokeWidth="3" />}
        {cuadro && filas.map((y) => <g key={y}><rect x="6" y={y + 40} width="588" height="14" fill="url(#carril)" stroke="#5c676d" /><rect x="6" y={y + 22} width="588" height="6" fill="#6a757b" opacity=".35" /><rect x="6" y={y + 118} width="588" height="6" fill="#6a757b" opacity=".35" /></g>)}
        {escena.elementos.map((el) => {
          const marcado = seleccion.includes(el.id);
          const malo = revelar && el.defecto, falso = revelar && marcado && !el.defecto, bien = revelar && !el.defecto && !marcado;
          const borde = malo ? '#e5534b' : falso ? '#E39F7D' : marcado ? '#EFCD2F' : bien ? '#3fb27f' : 'transparent';
          return (
            <g key={el.id} role="button" tabIndex={0} aria-pressed={marcado} aria-label={`${el.etiqueta}${marcado ? ' (marcado)' : ''}`}
              onClick={() => alterna(el.id)} onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); alterna(el.id); } }}
              className="cursor-pointer outline-none [&:focus-visible>rect:first-of-type]:stroke-info [&:focus-visible>rect:first-of-type]:stroke-[3]">
              <rect x={el.x} y={el.y} width={el.w} height={el.h} rx="6" fill={marcado && !revelar ? 'rgba(239,205,47,.18)' : malo ? 'rgba(229,83,75,.16)' : 'rgba(0,0,0,0)'} stroke={borde} strokeWidth="2.5" />
              <AparatoSvg tipo={(el.aparato ?? 'etiqueta') as Aparato} visual={el.visual as Visual | undefined} cx={el.x + el.w / 2} y={el.y + 6} calibre={el.calibre} />
              <foreignObject x={el.x + 2} y={el.y + 108} width={el.w - 4} height="40">
                <div className={`flex h-full items-center justify-center rounded px-1 text-center text-[10px] font-semibold leading-tight ${cuadro ? 'bg-[#12171a]/85 text-white' : 'bg-[#12171a]/80 text-white'}`}>{el.etiqueta}</div>
              </foreignObject>
              {revelar && (el.defecto || falso) && <text x={el.x + el.w - 4} y={el.y + 14} textAnchor="end" fontSize="9" fontFamily="monospace" fontWeight="700" fill={el.defecto ? '#e5534b' : '#E39F7D'}>{el.defecto ? 'DEFECTO' : 'SIN DEFECTO'}</text>}
              {marcado && !revelar && <path d={`M${el.x + 8} ${el.y + 6}v16l12-5z`} fill="#EFCD2F" stroke="#1A1A1A" />}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1.5 text-sm text-mute">{escena.titulo}. Inspecciona los aparatos y marca los que presenten un defecto; marcar elementos correctos resta puntuación.</figcaption>
    </figure>
  );
}
