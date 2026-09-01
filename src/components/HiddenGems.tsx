import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Quote, Shuffle, TrendingUp } from 'lucide-react';
import { BadgeGrado } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { CicloModal } from './CicloModal';
import { Icon } from './ui/Icon';
import { SectionHeader } from './ui/SectionHeader';
import { CICLOS, FAMILIAS, FAMILIAS_POR_ID } from '../data/fpData';
import { AVISO_DATOS_MERCADO, datosMercado, formatearSalario } from '../data/mercadoLaboral';
import type { Ciclo } from '../types';

const GEMAS: Ciclo[] = CICLOS.filter((c) => c.gemaOculta);

/** Cuántas encabezan la sección de mayor inserción. */
const DESTACADAS = 5;

/**
 * Las de mayor inserción estimada, calculadas y no escritas a mano: si mañana
 * se ajustan los datos de mercado, el ranking se recoloca solo.
 */
const MEJOR_INSERCION = [...GEMAS]
  .sort((a, b) => (datosMercado(b.id)?.insercion ?? 0) - (datosMercado(a.id)?.insercion ?? 0))
  .slice(0, DESTACADAS);

/** Una gema por familia, en el orden en que se listan las familias. */
const POR_RAMA = FAMILIAS.map((familia) => ({
  familia,
  ciclo: GEMAS.find((g) => g.familia === familia.id) ?? null,
})).filter((entrada): entrada is { familia: (typeof FAMILIAS)[number]; ciclo: Ciclo } =>
  entrada.ciclo !== null,
);

interface TarjetaGemaProps {
  ciclo: Ciclo;
  onAbrir: (ciclo: Ciclo) => void;
  /** Muestra el nombre de la familia como encabezado de la tarjeta. */
  conRama?: boolean;
}

function TarjetaGema({ ciclo, onAbrir, conRama = false }: TarjetaGemaProps) {
  const familia = FAMILIAS_POR_ID[ciclo.familia];
  const m = datosMercado(ciclo.id);

  return (
    <Card padding="none" interactiva className="overflow-hidden h-full flex flex-col">
      <div className={`h-1.5 w-full ${familia?.colorClass ?? 'bg-border'}`} aria-hidden="true" />
      <div className="p-5 flex-1 flex flex-col">
        {conRama && (
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${familia?.colorClass ?? 'bg-border'}`}
            >
              <Icon name={familia?.icono ?? 'Compass'} className="w-3.5 h-3.5 text-white" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[.1em] font-bold text-txt-soft">
              {familia?.nombre}
            </span>
          </div>
        )}

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

        {ciclo.porQueOculta && (
          <div className="mt-4 flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 mt-0.5 text-warm shrink-0" aria-hidden="true" />
            <p className="text-[12.5px] text-txt leading-relaxed">
              <strong className="font-semibold">Por qué pasa desapercibido:</strong>{' '}
              {ciclo.porQueOculta}
            </p>
          </div>
        )}

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

        <div className="mt-auto pt-4">
          {m && (
            <p className="text-[12.5px] text-txt-soft mb-3 pt-4 border-t border-border">
              <strong className="text-ink font-bold">{m.insercion}%</strong> de inserción ·{' '}
              {formatearSalario(m.salarioMin, m.salarioMax)}
            </p>
          )}
          <Button variante="secondary" tamano="sm" onClick={() => onAbrir(ciclo)} className="w-full">
            Ver ficha
          </Button>
        </div>
      </div>
    </Card>
  );
}

/**
 * Ciclos con muy buena salida y pocas matrículas por desconocimiento.
 *
 * Dos lecturas del mismo conjunto. Primero las de mayor inserción, que es el
 * gancho. Después una por cada rama, porque a quien ya sabe que le tira la
 * sanidad o la industria no le sirve un ranking general: necesita saber cuál es
 * la puerta menos concurrida de SU sector.
 */
export function HiddenGems() {
  const [destacada, setDestacada] = useState<Ciclo | null>(null);
  const [abierto, setAbierto] = useState<Ciclo | null>(null);

  const sorprender = useCallback(() => {
    if (GEMAS.length === 0) return;
    // Evita repetir la que ya se está mostrando.
    const candidatas = GEMAS.filter((g) => g.id !== destacada?.id);
    const pool = candidatas.length > 0 ? candidatas : GEMAS;
    setDestacada(pool[Math.floor(Math.random() * pool.length)] ?? null);
  }, [destacada]);

  const insercionMaxima = useMemo(
    () => Math.max(...GEMAS.map((g) => datosMercado(g.id)?.insercion ?? 0)),
    [],
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <SectionHeader
        as="h1"
        eyebrow="Gemas ocultas"
        titulo="Los ciclos que casi nadie pide y las empresas se rifan"
        subtitulo={`No están vacíos porque sean malos, sino porque casi nadie sabe que existen. Hay ${GEMAS.length}, una por cada familia profesional.`}
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
            <div
              className={`h-2 w-full ${FAMILIAS_POR_ID[destacada.familia]?.colorClass ?? 'bg-border'}`}
              aria-hidden="true"
            />
            <div className="p-6 sm:p-8 grid lg:grid-cols-[1fr_auto] gap-6 items-start">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[.14em] font-bold text-txt-soft mb-2">
                  Quizá no lo conocías · {FAMILIAS_POR_ID[destacada.familia]?.nombre}
                </p>
                <h2 className="font-extrabold text-ink text-2xl sm:text-3xl leading-tight">
                  {destacada.nombre}
                </h2>
                <p className="mt-3 text-[14.5px] text-txt leading-relaxed max-w-2xl">
                  {destacada.descripcion}
                </p>
                {destacada.porQueOculta && (
                  <p className="mt-3 text-[13.5px] text-txt-soft leading-relaxed max-w-2xl">
                    {destacada.porQueOculta}
                  </p>
                )}
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

      {/* ---------- Las de mayor inserción ---------- */}
      <section className="mt-14" aria-labelledby="mejor-insercion">
        <SectionHeader
          eyebrow={`Hasta un ${insercionMaxima} % de inserción estimada`}
          titulo="Las de mayor salida laboral"
          subtitulo="Si lo que buscas es la vía más rápida a un empleo cualificado, empieza por aquí."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {MEJOR_INSERCION.map((ciclo) => (
            <TarjetaGema key={ciclo.id} ciclo={ciclo} onAbrir={setAbierto} conRama />
          ))}
        </div>
      </section>

      {/* ---------- Una por cada rama ---------- */}
      <section className="mt-16" aria-labelledby="por-rama">
        <SectionHeader
          eyebrow="Una por cada rama"
          titulo="La puerta menos concurrida de cada familia"
          subtitulo="Si ya sabes que te tira un sector, esta es la opción de ese sector que casi nadie mira. Mismo mundo, mucha menos competencia."
        />

        <div className="mt-6 space-y-10">
          {POR_RAMA.map(({ familia, ciclo }) => (
            <div key={familia.id}>
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${familia.colorClass}`}
                >
                  <Icon name={familia.icono} className="w-4.5 h-4.5 text-white" />
                </span>
                <div>
                  <h3 className="font-extrabold text-ink text-[16px] leading-tight">
                    {familia.nombre}
                  </h3>
                  <p className="text-[12.5px] text-txt-soft">{familia.claim}</p>
                </div>
              </div>

              {/* items-start: el bloque de cifras se ajusta a su contenido en vez
                  de estirarse hasta la altura de la tarjeta y quedar hueco. */}
              <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 items-start">
                <TarjetaGema ciclo={ciclo} onAbrir={setAbierto} />

                <Card>
                  {(() => {
                    const m = datosMercado(ciclo.id);
                    if (!m) return <p className="text-[13px] text-txt-soft">Sin estimación.</p>;
                    return (
                      <>
                        <p className="font-mono text-[10px] uppercase tracking-[.12em] font-bold text-txt-soft mb-3">
                          Cifras orientativas
                        </p>
                        <p className="font-extrabold text-3xl text-ink leading-none">
                          {m.insercion}%
                        </p>
                        <p className="text-[12px] text-txt-soft mt-1">de inserción estimada</p>
                        <div className="mt-4 h-2 w-full bg-surface-soft rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand to-warm rounded-full"
                            style={{ width: `${m.insercion}%` }}
                          />
                        </div>
                        <p className="mt-4 pt-4 border-t border-border text-[13px] text-txt">
                          {formatearSalario(m.salarioMin, m.salarioMax)}
                        </p>
                      </>
                    );
                  })()}
                </Card>
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-10 text-[12.5px] text-txt-soft leading-relaxed max-w-3xl">
        {AVISO_DATOS_MERCADO} Los relatos de «Un día en el trabajo» son descripciones ilustrativas
        de la tarea, no testimonios de personas reales.
      </p>

      {abierto && <CicloModal ciclo={abierto} onCerrar={() => setAbierto(null)} />}
    </div>
  );
}
