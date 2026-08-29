import { useState } from 'react';
import { ChevronDown, Clock } from 'lucide-react';
import { Badge, BadgeGrado } from './ui/Badge';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { FAMILIAS_POR_ID, GRADOS } from '../data/fpData';
import { formatearHoras } from '../lib/format';
import type { Ciclo } from '../types';

interface CicloCardProps {
  ciclo: Ciclo;
  /** Porcentaje de encaje. Se omite en el explorador, donde no hay test. */
  encaje?: number;
  /** Abre la tarjeta desplegada de inicio (util para el primer resultado). */
  inicialAbierta?: boolean;
}

/**
 * Tarjeta de ciclo formativo, compartida por resultados y explorador.
 * Colapsada muestra lo justo para comparar; desplegada, la ficha completa.
 */
export function CicloCard({ ciclo, encaje, inicialAbierta = false }: CicloCardProps) {
  const [abierta, setAbierta] = useState(inicialAbierta);

  const familia = FAMILIAS_POR_ID[ciclo.familia];
  const grado = GRADOS[ciclo.grado];
  const idDetalle = `detalle-${ciclo.id}`;

  const horas = formatearHoras(ciclo.duracionHoras);

  return (
    <Card padding="none" interactiva className="overflow-hidden">
      {/* Franja de color de la familia: refuerzo visual, nunca informacion unica */}
      <div className={`h-1.5 w-full ${familia?.colorClass ?? 'bg-border'}`} aria-hidden="true" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <BadgeGrado grado={ciclo.grado} />
            <Badge tono="solido" className={familia?.colorClass ?? 'bg-border'}>
              {familia?.nombre ?? 'Sin familia'}
            </Badge>
          </div>

          {typeof encaje === 'number' && (
            <div className="text-right shrink-0">
              <p className="font-extrabold text-xl text-ink leading-none">{encaje}%</p>
              <p className="font-mono text-[9px] uppercase tracking-wider text-txt-soft mt-1">encaje</p>
            </div>
          )}
        </div>

        <h3 className="font-extrabold text-ink text-[17px] leading-snug">
          {ciclo.nombre || 'Ciclo sin nombre'}
          {ciclo.siglas && <span className="text-txt-soft font-mono text-[13px] font-bold ml-2">({ciclo.siglas})</span>}
        </h3>

        <p className="mt-2 text-[14px] text-txt-soft leading-relaxed">
          {ciclo.descripcion || 'Descripción no disponible.'}
        </p>

        <div className="mt-3 flex items-center gap-1.5 text-txt-soft">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="font-mono text-[11px]">
            {horas} · {grado?.titulo ?? ''}
          </span>
        </div>

        <button
          onClick={() => setAbierta((v) => !v)}
          aria-expanded={abierta}
          aria-controls={idDetalle}
          className="mt-4 w-full flex items-center justify-center gap-1.5 text-[13px] font-semibold text-txt hover:text-brand min-h-[44px] rounded-lg transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
        >
          {abierta ? 'Ocultar detalles' : 'Ver competencias y salidas'}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${abierta ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {abierta && (
          <div id={idDetalle} className="mt-4 pt-4 border-t border-border grid gap-5 sm:grid-cols-2 animate-fade-in-up">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.12em] font-bold text-txt-soft mb-2.5">
                Qué vas a saber hacer
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {(ciclo.habilidadesClave ?? []).map((habilidad) => (
                  <li key={habilidad}>
                    <Badge tono="contorno">{habilidad}</Badge>
                  </li>
                ))}
                {(ciclo.habilidadesClave ?? []).length === 0 && (
                  <li className="text-[13px] text-txt-soft">Sin datos por ahora.</li>
                )}
              </ul>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.12em] font-bold text-txt-soft mb-2.5">
                Dónde puedes acabar trabajando
              </p>
              <ul className="space-y-1.5">
                {(ciclo.salidasLaborales ?? []).map((salida) => (
                  <li key={salida} className="flex items-start gap-2 text-[13px] text-txt">
                    <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-accent-deep shrink-0" aria-hidden="true" />
                    {salida}
                  </li>
                ))}
                {(ciclo.salidasLaborales ?? []).length === 0 && (
                  <li className="text-[13px] text-txt-soft">Sin datos por ahora.</li>
                )}
              </ul>
            </div>

            <div className="sm:col-span-2 flex items-start gap-2.5 bg-surface-soft rounded-lg p-3">
              <Icon name={familia?.icono ?? 'Compass'} className="w-4 h-4 mt-0.5 text-txt-soft shrink-0" />
              <p className="text-[12.5px] text-txt-soft leading-relaxed">
                <strong className="text-txt font-semibold">Cómo se accede:</strong> {grado?.acceso ?? 'Consulta los requisitos en tu comunidad autónoma.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
