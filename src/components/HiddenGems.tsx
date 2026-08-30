import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Quote, Shuffle, TrendingUp } from 'lucide-react';
import { BadgeGrado } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { CicloModal } from './CicloModal';
import { Icon } from './ui/Icon';
import { SectionHeader } from './ui/SectionHeader';
import { CICLOS, FAMILIAS_POR_ID } from '../data/fpData';
import { AVISO_DATOS_MERCADO, datosMercado, formatearSalario } from '../data/mercadoLaboral';
import type { Ciclo } from '../types';

const GEMAS: Ciclo[] = CICLOS.filter((c) => c.gemaOculta);

/**
 * Ciclos con muy buena insercion y pocas matriculas por desconocimiento.
 *
 * El boton "Sorpréndeme" existe porque el problema de estos ciclos no es que se
 * comparen mal, es que nadie sabe que existen: hace falta un empujon al azar
 * antes de que el estudiante pueda tener una opinion sobre ellos.
 */
export function HiddenGems() {
  const [destacada, setDestacada] = useState<Ciclo | null>(null);
  const [abierto, setAbierto] = useState<Ciclo | null>(null);

  const sorprender = useCallback(() => {
    if (GEMAS.length === 0) return;
    // Evita repetir la que ya se está mostrando.
    const candidatas = GEMAS.filter((g) => g.id !== destacada?.id);
    const pool = candidatas.length > 0 ? candidatas : GEMAS;
    const elegida = pool[Math.floor(Math.random() * pool.length)];
    setDestacada(elegida ?? null);
  }, [destacada]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <SectionHeader
        as="h1"
        eyebrow="Gemas ocultas"
        titulo="Los ciclos que casi nadie pide y las empresas se rifan"
        subtitulo="No están vacíos porque sean malos, sino porque casi nadie sabe que existen. Aquí es donde la relación entre esfuerzo y salida laboral es más favorable."
      />

      <div className="mt-7">
        <Button tamano="lg" onClick={sorprender}>
          <Shuffle className="w-4 h-4" aria-hidden="true" />
          Sorpréndeme
        </Button>
      </div>

      {/* ---------- Destacada al azar ---------- */}
      {destacada && (
        <motion.div
          key={destacada.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-6"
          aria-live="polite"
        >
          <Card padding="none" className="overflow-hidden">
            <div className={`h-2 w-full ${FAMILIAS_POR_ID[destacada.familia]?.colorClass ?? 'bg-border'}`} aria-hidden="true" />
            <div className="p-6 sm:p-8 grid lg:grid-cols-[1fr_auto] gap-6 items-start">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[.14em] font-bold text-txt-soft mb-2">
                  Quizá no lo conocías
                </p>
                <h2 className="font-extrabold text-ink text-2xl sm:text-3xl leading-tight">
                  {destacada.nombre}
                </h2>
                <p className="mt-3 text-[14.5px] text-txt leading-relaxed max-w-2xl">
                  {destacada.descripcion}
                </p>
                <div className="mt-5">
                  <Button variante="secondary" onClick={() => setAbierto(destacada)}>
                    Ver la ficha completa
                  </Button>
                </div>
              </div>

              {(() => {
                const m = datosMercado(destacada.id);
                if (!m) return null;
                return (
                  <div className="bg-surface-soft rounded-card p-5 lg:w-52 shrink-0">
                    <p className="font-extrabold text-4xl text-ink leading-none">{m.insercion}%</p>
                    <p className="font-mono text-[10px] uppercase tracking-[.12em] text-txt-soft mt-1.5">
                      inserción estimada
                    </p>
                    <p className="mt-4 pt-4 border-t border-border text-[12.5px] text-txt">
                      {formatearSalario(m.salarioMin, m.salarioMax)}
                    </p>
                  </div>
                );
              })()}
            </div>
          </Card>
        </motion.div>
      )}

      {/* ---------- Todas las gemas ---------- */}
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {GEMAS.map((ciclo) => {
          const familia = FAMILIAS_POR_ID[ciclo.familia];
          const m = datosMercado(ciclo.id);
          return (
            <Card key={ciclo.id} padding="none" interactiva className="overflow-hidden h-full flex flex-col">
              <div className={`h-1.5 w-full ${familia?.colorClass ?? 'bg-border'}`} aria-hidden="true" />
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <BadgeGrado grado={ciclo.grado} />
                  {m && m.demanda === 'muy-alta' && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[.1em] font-bold px-2.5 py-1 rounded-full bg-brand text-ink">
                      <TrendingUp className="w-3 h-3" aria-hidden="true" />
                      Alta demanda laboral
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-ink text-[16px] leading-snug">{ciclo.nombre}</h3>
                <p className="mt-2 text-[13.5px] text-txt-soft leading-relaxed">{ciclo.descripcion}</p>

                <div className="mt-3 flex items-center gap-2">
                  <Icon name={familia?.icono ?? 'Compass'} className="w-3.5 h-3.5 text-txt-soft" />
                  <span className="text-[12px] text-txt-soft">{familia?.nombre}</span>
                </div>

                {ciclo.diaEnElTrabajo && (
                  <figure className="mt-4 bg-surface-soft rounded-lg p-4">
                    <figcaption className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[.1em] font-bold text-txt-soft mb-2">
                      <Quote className="w-3 h-3" aria-hidden="true" />
                      Un día en el trabajo
                    </figcaption>
                    <blockquote className="text-[12.5px] text-txt leading-relaxed italic">
                      {ciclo.diaEnElTrabajo}
                    </blockquote>
                  </figure>
                )}

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-3">
                  {m ? (
                    <span className="text-[12.5px] text-txt-soft">
                      <strong className="text-ink font-bold">{m.insercion}%</strong> inserción ·{' '}
                      {formatearSalario(m.salarioMin, m.salarioMax)}
                    </span>
                  ) : (
                    <span />
                  )}
                </div>

                <div className="mt-3">
                  <Button variante="secondary" tamano="sm" onClick={() => setAbierto(ciclo)} className="w-full">
                    Ver ficha
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-[12.5px] text-txt-soft leading-relaxed max-w-3xl">
        {AVISO_DATOS_MERCADO} Los relatos de «Un día en el trabajo» son descripciones ilustrativas
        de la tarea, no testimonios de personas reales.
      </p>

      {abierto && <CicloModal ciclo={abierto} onCerrar={() => setAbierto(null)} />}
    </div>
  );
}
