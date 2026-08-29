import { useState } from 'react';
import { ArrowUpRight, Clock } from 'lucide-react';
import { Badge, BadgeGrado } from './ui/Badge';
import { Card } from './ui/Card';
import { CicloModal } from './CicloModal';
import { FAMILIAS_POR_ID, GRADOS } from '../data/fpData';
import { formatearHoras } from '../lib/format';
import type { Ciclo } from '../types';

interface CicloCardProps {
  ciclo: Ciclo;
  /** Porcentaje de encaje. Se omite en el explorador, donde no hay test. */
  encaje?: number;
}

/**
 * Tarjeta de ciclo formativo, compartida por resultados y explorador.
 * Muestra lo justo para poder comparar de un vistazo; al pulsarla se abre la
 * ficha completa en un dialogo.
 */
export function CicloCard({ ciclo, encaje }: CicloCardProps) {
  const [abierta, setAbierta] = useState(false);

  const familia = FAMILIAS_POR_ID[ciclo.familia];
  const grado = GRADOS[ciclo.grado];

  return (
    <>
      <Card padding="none" interactiva className="overflow-hidden h-full">
        {/* La tarjeta entera es el control: area tactil grande y un solo destino. */}
        <button
          onClick={() => setAbierta(true)}
          aria-haspopup="dialog"
          className="w-full h-full text-left flex flex-col rounded-card focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
        >
          {/* Franja de color de la familia: refuerzo visual, nunca informacion unica */}
          <span className={`block h-1.5 w-full ${familia?.colorClass ?? 'bg-border'}`} aria-hidden="true" />

          <span className="block p-5 flex-1">
            <span className="flex items-start justify-between gap-3 mb-3">
              <span className="flex flex-wrap items-center gap-2">
                <BadgeGrado grado={ciclo.grado} />
                <Badge tono="solido" className={familia?.colorClass ?? 'bg-border'}>
                  {familia?.nombre ?? 'Sin familia'}
                </Badge>
              </span>

              {typeof encaje === 'number' && (
                <span className="block text-right shrink-0">
                  <span className="block font-extrabold text-xl text-ink leading-none">{encaje}%</span>
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-txt-soft mt-1">
                    encaje
                  </span>
                </span>
              )}
            </span>

            <span className="block font-extrabold text-ink text-[17px] leading-snug">
              {ciclo.nombre || 'Ciclo sin nombre'}
              {ciclo.siglas && (
                <span className="text-txt-soft font-mono text-[13px] font-bold ml-2">({ciclo.siglas})</span>
              )}
            </span>

            <span className="block mt-2 text-[14px] text-txt-soft leading-relaxed">
              {ciclo.descripcion || 'Descripción no disponible.'}
            </span>

            <span className="flex items-center gap-1.5 mt-3 text-txt-soft">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="font-mono text-[11px]">
                {formatearHoras(ciclo.duracionHoras)} · {grado?.titulo ?? ''}
              </span>
            </span>

            <span className="flex items-center gap-1.5 mt-4 pt-4 border-t border-border text-[13px] font-semibold text-txt">
              Ver la ficha completa
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </span>
          </span>
        </button>
      </Card>

      {abierta && <CicloModal ciclo={ciclo} encaje={encaje} onCerrar={() => setAbierta(false)} />}
    </>
  );
}
