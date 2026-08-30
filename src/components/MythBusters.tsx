import { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { Icon } from './ui/Icon';
import { MITOS } from '../data/guiaContent';

/**
 * Tarjetas giratorias de mitos.
 *
 * El giro es puramente decorativo, asi que la tarjeta se implementa como un
 * boton con `aria-pressed` y AMBAS caras viven en el DOM: quien use lector de
 * pantalla oye el mito y su refutacion sin depender de la animacion, y con
 * `prefers-reduced-motion` el cambio es instantaneo (lo aplica el CSS global).
 */
function TarjetaMito({ mito }: { mito: (typeof MITOS)[number] }) {
  const [girada, setGirada] = useState(false);

  return (
    <button
      onClick={() => setGirada((v) => !v)}
      aria-pressed={girada}
      aria-label={`${girada ? 'Ver el mito' : 'Ver la realidad'}: ${mito.mito}`}
      className="group relative w-full min-h-[16rem] text-left rounded-card focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
      style={{ perspective: '1200px' }}
    >
      <span
        className="relative block w-full h-full min-h-[16rem] transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: girada ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Cara del mito */}
        <span
          className="absolute inset-0 flex flex-col p-6 bg-surface border-[1.5px] border-border rounded-card shadow-card group-hover:shadow-card-hover transition-shadow"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[.12em] font-bold text-error mb-3">
            Mito
          </span>
          <span className="block font-extrabold text-ink text-lg leading-snug flex-1">
            «{mito.mito}»
          </span>
          <span className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-[12.5px] font-semibold text-txt-soft">
            <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
            Dale la vuelta
          </span>
        </span>

        {/* Cara de la realidad */}
        <span
          className="absolute inset-0 flex flex-col p-6 bg-surface border-[1.5px] border-accent-deep/40 rounded-card shadow-card"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-lg bg-accent/30 flex items-center justify-center shrink-0">
              <Icon name={mito.icono} className="w-4 h-4 text-accent-deep" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[.12em] font-bold text-accent-deep">
              La realidad
            </span>
          </span>
          <span className="block text-[13.5px] text-txt leading-relaxed">{mito.realidad}</span>
          <span className="block mt-3 text-[12.5px] text-txt-soft leading-relaxed flex-1">
            {mito.dato}
          </span>
          <span className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-[12.5px] font-semibold text-txt-soft">
            <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
            Volver al mito
          </span>
        </span>
      </span>
    </button>
  );
}

export function MythBusters() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {MITOS.map((mito) => (
        <TarjetaMito key={mito.id} mito={mito} />
      ))}
    </div>
  );
}
