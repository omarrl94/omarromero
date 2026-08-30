import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Clock, GraduationCap, X } from 'lucide-react';
import { Badge, BadgeGrado } from './ui/Badge';
import { CareerPathSimulator } from './CareerPathSimulator';
import { Icon } from './ui/Icon';
import { FAMILIAS_POR_ID, GRADOS } from '../data/fpData';
import { formatearHoras } from '../lib/format';
import type { Ciclo, SituacionId } from '../types';

interface CicloModalProps {
  ciclo: Ciclo;
  /** Porcentaje de encaje, si se abre desde los resultados del test. */
  encaje?: number;
  /** Situación declarada en el test, para dibujar el itinerario desde ella. */
  situacion?: SituacionId;
  onCerrar: () => void;
}

/** Elementos que pueden recibir el foco, para encerrarlo dentro del dialogo. */
const FOCUSABLES =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Ficha ampliada de un ciclo formativo.
 *
 * Se monta en un portal sobre `document.body` para que ninguna tarjeta con
 * `overflow` o `transform` recorte el dialogo. Mientras esta abierto bloquea el
 * scroll de la pagina, atrapa el foco y se cierra con Escape o clic fuera.
 */
export function CicloModal({ ciclo, encaje, situacion, onCerrar }: CicloModalProps) {
  const dialogo = useRef<HTMLDivElement>(null);
  const focoPrevio = useRef<HTMLElement | null>(null);

  const familia = FAMILIAS_POR_ID[ciclo.familia];
  const grado = GRADOS[ciclo.grado];
  const tituloId = `modal-titulo-${ciclo.id}`;

  const alPulsarTecla = useCallback(
    (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        onCerrar();
        return;
      }
      if (evento.key !== 'Tab' || !dialogo.current) return;

      const focusables = dialogo.current.querySelectorAll<HTMLElement>(FOCUSABLES);
      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];
      if (!primero || !ultimo) return;

      // El foco no debe escaparse del dialogo mientras esta abierto.
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    },
    [onCerrar],
  );

  useEffect(() => {
    focoPrevio.current = document.activeElement as HTMLElement | null;

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', alPulsarTecla);

    dialogo.current?.querySelector<HTMLElement>(FOCUSABLES)?.focus();

    return () => {
      document.removeEventListener('keydown', alPulsarTecla);
      document.body.style.overflow = overflowPrevio;
      // Devuelve el foco a la tarjeta desde la que se abrio.
      focoPrevio.current?.focus?.();
    };
  }, [alPulsarTecla]);

  return createPortal(
    <div
      className="no-print fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-ink/60 backdrop-blur-sm animate-fade-in-up"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div
        ref={dialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className="bg-surface w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] overflow-y-auto rounded-t-card sm:rounded-card border-[1.5px] border-border shadow-card-hover"
      >
        {/* Cabecera pegajosa: en móvil la ficha es larga y el cierre debe seguir a mano */}
        <div className={`h-1.5 w-full ${familia?.colorClass ?? 'bg-border'}`} aria-hidden="true" />

        <div className="sticky top-0 bg-surface border-b border-border px-5 sm:px-7 py-4 flex items-start justify-between gap-4 z-10">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <BadgeGrado grado={ciclo.grado} />
              <Badge tono="solido" className={familia?.colorClass ?? 'bg-border'}>
                {familia?.nombre ?? 'Sin familia'}
              </Badge>
              {typeof encaje === 'number' && <Badge tono="contorno">{encaje}% de encaje</Badge>}
            </div>
            <h2 id={tituloId} className="font-extrabold text-ink text-xl sm:text-2xl leading-tight">
              {ciclo.nombre || 'Ciclo sin nombre'}
              {ciclo.siglas && (
                <span className="text-txt-soft font-mono text-base font-bold ml-2">({ciclo.siglas})</span>
              )}
            </h2>
          </div>

          <button
            onClick={onCerrar}
            aria-label="Cerrar la ficha del ciclo"
            className="shrink-0 p-2.5 -m-1 rounded-lg text-txt-soft hover:text-ink hover:bg-surface-soft transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 sm:px-7 py-6 space-y-7">
          <p className="text-[14.5px] text-txt leading-relaxed">
            {ciclo.descripcion || 'Descripción no disponible.'}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-txt-soft">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span className="font-mono text-[12px]">{formatearHoras(ciclo.duracionHoras)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" aria-hidden="true" />
              <span className="font-mono text-[12px]">{grado?.titulo ?? ''}</span>
            </span>
          </div>

          {/* Asignaturas típicas */}
          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-[.12em] font-bold text-txt-soft mb-3">
              Asignaturas típicas
            </h3>
            <ul className="grid sm:grid-cols-2 gap-x-5 gap-y-2">
              {(ciclo.asignaturasTipicas ?? []).map((asignatura) => (
                <li key={asignatura} className="flex items-start gap-2 text-[13.5px] text-txt">
                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-brand shrink-0" aria-hidden="true" />
                  {asignatura}
                </li>
              ))}
              {(ciclo.asignaturasTipicas ?? []).length === 0 && (
                <li className="text-[13px] text-txt-soft">
                  Los módulos concretos varían según la comunidad autónoma.
                </li>
              )}
            </ul>
          </section>

          {/* Competencias */}
          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-[.12em] font-bold text-txt-soft mb-3">
              Qué vas a saber hacer
            </h3>
            <ul className="flex flex-wrap gap-1.5">
              {(ciclo.habilidadesClave ?? []).map((habilidad) => (
                <li key={habilidad}>
                  <Badge tono="contorno">{habilidad}</Badge>
                </li>
              ))}
            </ul>
          </section>

          {/* Salidas laborales */}
          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-[.12em] font-bold text-txt-soft mb-3">
              Dónde puedes acabar trabajando
            </h3>
            <ul className="space-y-2">
              {(ciclo.salidasLaborales ?? []).map((salida) => (
                <li key={salida} className="flex items-start gap-2 text-[13.5px] text-txt">
                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-accent-deep shrink-0" aria-hidden="true" />
                  {salida}
                </li>
              ))}
            </ul>
          </section>

          {/* Itinerario formativo completo */}
          <section className="bg-surface-soft rounded-card p-5">
            <h3 className="font-mono text-[10px] uppercase tracking-[.12em] font-bold text-txt-soft mb-4">
              Tu itinerario si eliges este ciclo
            </h3>
            <CareerPathSimulator ciclo={ciclo} situacion={situacion} compacto />
          </section>

          {/* Acceso */}
          <div className="flex items-start gap-2.5 border-t border-border pt-5">
            <Icon name={familia?.icono ?? 'Compass'} className="w-4 h-4 mt-0.5 text-txt-soft shrink-0" />
            <p className="text-[12.5px] text-txt-soft leading-relaxed">
              <strong className="text-txt font-semibold">Cómo se accede:</strong>{' '}
              {grado?.acceso ?? 'Consulta los requisitos en tu comunidad autónoma.'}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
