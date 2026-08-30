import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { SectionHeader } from './ui/SectionHeader';
import { MythBusters } from './MythBusters';
import { FICHAS_GRADO, POR_QUE_FP } from '../data/guiaContent';
import type { Ruta } from '../types';

interface GuiaFPProps {
  navegar: (destino: Ruta) => void;
}

/** Itinerarios habituales, contados como recorridos y no como normativa. */
const ITINERARIOS: { desde: string; hacia: string; nota: string }[] = [
  {
    desde: 'Grado Básico',
    hacia: 'Grado Medio',
    nota: 'Acceso directo, y además sales con el título de ESO en la mano.',
  },
  {
    desde: 'Grado Medio',
    hacia: 'Grado Superior',
    nota: 'Sin prueba de acceso: el título de Técnico ya te abre la puerta.',
  },
  {
    desde: 'Grado Superior',
    hacia: 'Universidad',
    nota: 'Sin selectividad, y con créditos ECTS convalidados en muchas titulaciones.',
  },
  {
    desde: 'Grado Superior',
    hacia: 'Curso de especialización',
    nota: 'Los "másteres de la FP": ciberseguridad, IA y big data, digitalización industrial...',
  },
  {
    desde: 'Cualquier ciclo',
    hacia: 'Otra familia profesional',
    nota: 'Los módulos comunes convalidan. Cambiar de rama cuesta menos de lo que parece.',
  },
];

export function GuiaFP({ navegar }: GuiaFPProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <SectionHeader
          as="h1"
          eyebrow="Guía de la FP"
          titulo="Lo que nadie te explicó sobre la Formación Profesional"
          subtitulo="Sin artículos de ley ni palabras raras. Lo que de verdad necesitas saber antes de decidir qué vas a estudiar."
        />
      </motion.div>

      {/* ---------- Valor real ---------- */}
      <section className="mt-12" aria-labelledby="valor-real">
        <h2 id="valor-real" className="font-extrabold text-ink text-2xl sm:text-3xl">
          Por qué la FP se ha vuelto una decisión inteligente
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {POR_QUE_FP.map((bloque) => (
            <Card key={bloque.id} interactiva className="h-full">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/30 flex items-center justify-center shrink-0">
                  <Icon name={bloque.icono} className="w-5 h-5 text-accent-deep" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-[15px] leading-snug">{bloque.titulo}</h3>
                  <p className="mt-2 text-[13.5px] text-txt-soft leading-relaxed">{bloque.texto}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- Mitos ---------- */}
      <section className="mt-16" aria-labelledby="mitos">
        <p className="font-mono text-[11px] uppercase tracking-[.14em] font-bold text-txt-soft mb-3">
          Hablemos claro
        </p>
        <h2 id="mitos" className="font-extrabold text-ink text-2xl sm:text-3xl">
          Cuatro mitos que siguen circulando
        </h2>
        <p className="mt-4 text-[15px] text-txt-soft max-w-2xl leading-relaxed">
          Casi todos vienen de cómo era el sistema hace treinta años. Conviene actualizarlos antes de
          dejar que decidan por ti.
        </p>

        <div className="mt-6">
          <MythBusters />
        </div>
      </section>

      {/* ---------- Los tres grados en detalle ---------- */}
      <section className="mt-16" aria-labelledby="grados">
        <p className="font-mono text-[11px] uppercase tracking-[.14em] font-bold text-txt-soft mb-3">
          Lo que debes saber antes de elegir
        </p>
        <h2 id="grados" className="font-extrabold text-ink text-2xl sm:text-3xl">
          Los tres grados, uno por uno
        </h2>

        <div className="mt-6 space-y-4">
          {FICHAS_GRADO.map((ficha) => (
            <Card key={ficha.grado} padding="lg">
              <div className="grid gap-6 lg:grid-cols-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[.12em] font-bold text-txt-soft">
                    {ficha.duracion}
                  </p>
                  <h3 className="mt-2 font-extrabold text-ink text-2xl">{ficha.titulo}</h3>
                  <p className="mt-3 text-[13.5px] text-txt leading-relaxed">
                    <strong className="font-semibold">Sales con:</strong> {ficha.queConsigues}
                  </p>
                </div>

                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[.12em] font-bold text-txt-soft mb-2">
                    Es para ti si...
                  </p>
                  <p className="text-[13.5px] text-txt-soft leading-relaxed">{ficha.paraQuien}</p>
                </div>

                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[.12em] font-bold text-txt-soft mb-2">
                    Y después, ¿qué?
                  </p>
                  <ul className="space-y-2">
                    {ficha.yDespues.map((salida) => (
                      <li key={salida} className="flex items-start gap-2 text-[13px] text-txt">
                        <ArrowUpRight className="w-3.5 h-3.5 mt-1 text-accent-deep shrink-0" aria-hidden="true" />
                        {salida}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- Itinerarios ---------- */}
      <section className="mt-16" aria-labelledby="itinerarios">
        <p className="font-mono text-[11px] uppercase tracking-[.14em] font-bold text-txt-soft mb-3">
          Nada es definitivo
        </p>
        <h2 id="itinerarios" className="font-extrabold text-ink text-2xl sm:text-3xl">
          Cómo se salta de un sitio a otro
        </h2>
        <p className="mt-4 text-[15px] text-txt-soft max-w-2xl leading-relaxed">
          La FP está pensada como una escalera con muchos rellanos. Si cambias de idea a medio
          camino, casi siempre hay una forma de reconducirlo sin empezar de cero.
        </p>

        <ul className="mt-6 space-y-3">
          {ITINERARIOS.map((itinerario) => (
            <li key={`${itinerario.desde}-${itinerario.hacia}`}>
              <Card padding="sm" interactiva>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[11px] font-bold text-ink bg-surface-soft px-2.5 py-1.5 rounded-md">
                      {itinerario.desde}
                    </span>
                    <ArrowRight className="w-4 h-4 text-warm shrink-0" aria-hidden="true" />
                    <span className="font-mono text-[11px] font-bold text-ink bg-brand/25 px-2.5 py-1.5 rounded-md">
                      {itinerario.hacia}
                    </span>
                  </div>
                  <p className="text-[13.5px] text-txt-soft leading-relaxed">{itinerario.nota}</p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mt-16">
        <Card padding="lg" className="text-center">
          <h2 className="font-extrabold text-ink text-2xl sm:text-3xl leading-tight">
            Ya sabes cómo funciona. Ahora toca mirarte a ti.
          </h2>
          <p className="mt-4 text-[15px] text-txt-soft max-w-xl mx-auto leading-relaxed">
            El test tarda unos tres minutos y te devuelve tu familia profesional con porcentaje de
            afinidad, más los ciclos concretos que encajan con tu perfil.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Button tamano="lg" onClick={() => navegar('test')}>
              Hacer el test vocacional
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button tamano="lg" variante="secondary" onClick={() => navegar('explorar')}>
              Ver todos los ciclos
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
