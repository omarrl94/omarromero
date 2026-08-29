import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Compass, Search } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { SectionHeader } from './ui/SectionHeader';
import { DATOS_CLAVE, FICHAS_GRADO, POR_QUE_FP } from '../data/guiaContent';
import { CICLOS, FAMILIAS } from '../data/fpData';
import type { Ruta } from '../types';

interface HomeProps {
  navegar: (destino: Ruta) => void;
  hayResultado: boolean;
}

const aparecer = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export function Home({ navegar, hayResultado }: HomeProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* ---------- Hero ---------- */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={aparecer}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-card bg-gradient-to-br from-brand to-brand-light border-[1.5px] border-border shadow-card"
      >
        <div className="absolute inset-0 bg-noise" aria-hidden="true" />
        <div
          className="absolute -top-10 -right-10 w-40 h-40 sm:w-56 sm:h-56 rounded-full bg-white/20"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full bg-warm/30"
          aria-hidden="true"
        />

        <div className="relative p-8 sm:p-10 lg:p-14">
          <p className="font-mono text-[11px] uppercase tracking-[.14em] font-bold text-[#1a1a1a]/70 mb-3">
            Orientación de Formación Profesional
          </p>
          <h1 className="font-extrabold text-[#1a1a1a] leading-[1.08] text-3xl sm:text-5xl max-w-3xl">
            Deja de elegir a ciegas. Descubre qué FP encaja contigo.
          </h1>
          <p className="mt-5 text-[15px] sm:text-lg text-[#1a1a1a]/75 max-w-2xl leading-relaxed">
            Doce preguntas sobre cómo eres y cómo trabajas. Al final, tu familia profesional con
            porcentaje de afinidad y los ciclos concretos —Básico, Medio o Superior— que mejor te
            pegan, con sus salidas laborales reales.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button tamano="lg" variante="dark" onClick={() => navegar('test')}>
              {hayResultado ? 'Repetir el test' : 'Empezar el test'}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button
              tamano="lg"
              variante="secondary"
              onClick={() => navegar('guia-fp')}
              className="!bg-white/85 !border-transparent hover:!bg-white"
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              Antes, cuéntame qué es la FP
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap gap-2">
            {['12 preguntas · 3 minutos', 'Gratis y sin registro', `${CICLOS.length} ciclos reales`].map(
              (pill) => (
                <li
                  key={pill}
                  className="font-mono text-[11px] font-bold text-[#1a1a1a]/70 bg-white/50 px-3 py-1.5 rounded-full"
                >
                  {pill}
                </li>
              ),
            )}
          </ul>
        </div>
      </motion.section>

      {/* ---------- Datos clave ---------- */}
      <section className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="Datos del sistema de FP">
        {DATOS_CLAVE.map((dato) => (
          <Card key={dato.etiqueta} padding="sm" className="text-center">
            <p className="font-extrabold text-2xl sm:text-3xl text-ink">{dato.valor}</p>
            <p className="mt-1 text-[12px] text-txt-soft leading-snug">{dato.etiqueta}</p>
          </Card>
        ))}
      </section>

      {/* ---------- Por qué la FP ---------- */}
      <section className="mt-16 sm:mt-20">
        <SectionHeader
          eyebrow="¿Por qué estudiar FP?"
          titulo="La formación que te pone a trabajar mientras aprendes"
          subtitulo="Seis motivos concretos, sin lenguaje de folleto ni artículos de ley."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {POR_QUE_FP.map((bloque, indice) => (
            <motion.div
              key={bloque.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: Math.min(indice * 0.05, 0.25) }}
            >
              <Card interactiva className="h-full">
                <div className="w-10 h-10 rounded-lg bg-brand/20 flex items-center justify-center mb-4">
                  <Icon name={bloque.icono} className="w-5 h-5 text-ink" />
                </div>
                <h3 className="font-bold text-ink text-[15px] leading-snug">{bloque.titulo}</h3>
                <p className="mt-2 text-[13.5px] text-txt-soft leading-relaxed">{bloque.texto}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-6">
          <Button variante="secondary" onClick={() => navegar('guia-fp')}>
            Ver la guía completa: grados, mitos e itinerarios
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </section>

      {/* ---------- Los tres grados ---------- */}
      <section className="mt-16 sm:mt-20">
        <SectionHeader
          eyebrow="Antes de elegir"
          titulo="Básico, Medio y Superior: qué son en una frase"
          subtitulo="Tres puertas de entrada distintas al mismo sistema. Ninguna cierra las otras."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {FICHAS_GRADO.map((ficha) => (
            <Card key={ficha.grado} interactiva className="h-full flex flex-col">
              <p className="font-mono text-[10px] uppercase tracking-[.12em] font-bold text-txt-soft">
                {ficha.duracion}
              </p>
              <h3 className="mt-2 font-extrabold text-ink text-xl">{ficha.titulo}</h3>
              <p className="mt-3 text-[13.5px] text-txt-soft leading-relaxed">{ficha.paraQuien}</p>
              <p className="mt-3 text-[13.5px] text-txt leading-relaxed">
                <strong className="font-semibold">Sales con:</strong> {ficha.queConsigues}
              </p>
              <ul className="mt-4 pt-4 border-t border-border space-y-2">
                {ficha.yDespues.map((salida) => (
                  <li key={salida} className="flex items-start gap-2 text-[13px] text-txt">
                    <ArrowRight className="w-3.5 h-3.5 mt-1 text-accent-deep shrink-0" aria-hidden="true" />
                    {salida}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- Familias ---------- */}
      <section className="mt-16 sm:mt-20">
        <SectionHeader
          eyebrow="El mapa"
          titulo={`${FAMILIAS.length} familias profesionales para empezar a mirar`}
          subtitulo="Cada familia agrupa los ciclos de un mismo sector. El test te dice cuál es la tuya; el explorador te deja curiosear todas."
        />

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FAMILIAS.map((familia) => (
            <li key={familia.id}>
              <Card interactiva className="h-full">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${familia.colorClass}`}
                  >
                    <Icon name={familia.icono} className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink text-[14.5px] leading-snug">{familia.nombre}</h3>
                    <p className="mt-1 text-[13px] text-txt-soft leading-relaxed">{familia.claim}</p>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- CTA final ---------- */}
      <section className="mt-16 sm:mt-20">
        <Card padding="lg" className="text-center">
          <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center mx-auto mb-5">
            <Compass className="w-6 h-6 text-ink" aria-hidden="true" />
          </div>
          <h2 className="font-extrabold text-ink text-2xl sm:text-3xl leading-tight">
            Tres minutos ahora, dos años bien elegidos después
          </h2>
          <p className="mt-4 text-[15px] text-txt-soft max-w-xl mx-auto leading-relaxed">
            No hay respuestas buenas ni malas: solo se trata de mirarte con honestidad. Puedes parar
            a mitad y retomarlo cuando quieras, se guarda en tu navegador.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Button tamano="lg" onClick={() => navegar('test')}>
              Empezar ahora
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button tamano="lg" variante="secondary" onClick={() => navegar('explorar')}>
              <Search className="w-4 h-4" aria-hidden="true" />
              Explorar el catálogo
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
