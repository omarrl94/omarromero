import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Info, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { ProgressBar } from './ui/ProgressBar';
import { SITUACIONES } from '../data/fpData';
import { TOTAL_PREGUNTAS } from '../data/questions';
import type { useTest } from '../hooks/useTest';
import type { Ruta } from '../types';

interface TestWizardProps {
  test: ReturnType<typeof useTest>;
  navegar: (destino: Ruta) => void;
}

const transicion = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

export function TestWizard({ test, navegar }: TestWizardProps) {
  const {
    situacion,
    respuestas,
    paso,
    preguntaActual,
    respondidas,
    completo,
    progreso,
    hayProgresoGuardado,
    elegirSituacion,
    responder,
    avanzar,
    retroceder,
    finalizar,
    reiniciar,
    retomarProgreso,
    descartarProgreso,
  } = test;

  const esUltima = paso === TOTAL_PREGUNTAS;
  const respuestaActual = preguntaActual ? respuestas[preguntaActual.id] : undefined;

  const alFinalizar = () => {
    if (finalizar()) navegar('resultados');
  };

  const alResponder = (preguntaId: string, opcionId: string) => {
    responder(preguntaId, opcionId);
    // Pequeña pausa para que se vea la opción marcada antes de pasar de pantalla.
    if (paso < TOTAL_PREGUNTAS) {
      window.setTimeout(avanzar, 260);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* ---------- Cabecera con progreso ---------- */}
      <div className="mb-8">
        <div className="flex items-end justify-between gap-4 mb-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[.14em] font-bold text-txt-soft">
              {paso === 0 ? 'Punto de partida' : preguntaActual?.bloqueEtiqueta ?? 'Test vocacional'}
            </p>
            <p className="mt-1 font-bold text-ink text-[15px]">
              {paso === 0 ? 'Paso 1 de 2' : `Pregunta ${paso} de ${TOTAL_PREGUNTAS}`}
            </p>
          </div>
          <p className="font-mono text-[11px] text-txt-soft shrink-0">{progreso}%</p>
        </div>
        <ProgressBar valor={progreso} etiqueta="Progreso del test vocacional" />
      </div>

      {/* ---------- Aviso de test a medias ---------- */}
      {hayProgresoGuardado && paso === 0 && (
        <Card className="mb-6 border-brand/50 bg-brand/10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <RotateCcw className="w-5 h-5 text-ink mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-[13.5px] text-txt leading-relaxed">
                Tenías un test a medias guardado en este navegador. ¿Lo retomamos donde lo dejaste?
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button tamano="sm" onClick={retomarProgreso}>
                Retomar
              </Button>
              <Button tamano="sm" variante="ghost" onClick={descartarProgreso}>
                Empezar de cero
              </Button>
            </div>
          </div>
        </Card>
      )}

      <AnimatePresence mode="wait">
        {/* ---------- Paso 0: situación de partida ---------- */}
        {paso === 0 && (
          <motion.section
            key="situacion"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={transicion}
            aria-labelledby="pregunta-situacion"
          >
            <h1 id="pregunta-situacion" className="font-extrabold text-ink text-2xl sm:text-3xl leading-tight">
              ¿En qué punto estás ahora mismo?
            </h1>
            <p className="mt-3 text-[14.5px] text-txt-soft leading-relaxed">
              Esto sirve para enfocarte los ciclos a los que puedes acceder hoy. Si no lo tienes
              claro, elige la última opción y te enseñamos de todo.
            </p>

            <ul className="mt-7 space-y-3">
              {SITUACIONES.map((item) => {
                const seleccionada = situacion === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => elegirSituacion(item.id)}
                      aria-pressed={seleccionada}
                      className={`w-full text-left rounded-card border-[1.5px] p-5 transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 ${
                        seleccionada
                          ? 'border-brand bg-brand/10 shadow-card-hover'
                          : 'border-border bg-surface shadow-card hover:border-warm hover:shadow-card-hover hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-ink text-[15px]">{item.titulo}</p>
                          <p className="mt-1.5 text-[13.5px] text-txt-soft leading-relaxed">
                            {item.descripcion}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-txt-soft mt-1 shrink-0" aria-hidden="true" />
                      </div>

                      {item.nota && (
                        <p className="mt-3 pt-3 border-t border-border flex items-start gap-2 text-[12.5px] text-txt-soft">
                          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                          {item.nota}
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.section>
        )}

        {/* ---------- Pasos 1..N: preguntas ---------- */}
        {preguntaActual && (
          <motion.section
            key={preguntaActual.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={transicion}
            aria-labelledby={`enunciado-${preguntaActual.id}`}
          >
            <h1
              id={`enunciado-${preguntaActual.id}`}
              className="font-extrabold text-ink text-2xl sm:text-[28px] leading-tight"
            >
              {preguntaActual.enunciado}
            </h1>
            {preguntaActual.ayuda && (
              <p className="mt-3 text-[13.5px] text-txt-soft leading-relaxed">{preguntaActual.ayuda}</p>
            )}

            <ul className="mt-7 space-y-2.5">
              {preguntaActual.opciones.map((opcion) => {
                const seleccionada = respuestaActual === opcion.id;
                return (
                  <li key={opcion.id}>
                    <button
                      onClick={() => alResponder(preguntaActual.id, opcion.id)}
                      aria-pressed={seleccionada}
                      className={`w-full text-left rounded-card border-[1.5px] p-4 min-h-[64px] flex items-center gap-4 transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 ${
                        seleccionada
                          ? 'border-brand bg-brand/10 shadow-card-hover'
                          : 'border-border bg-surface shadow-card hover:border-warm hover:shadow-card-hover hover:-translate-y-0.5'
                      }`}
                    >
                      <span
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          seleccionada ? 'bg-brand text-ink' : 'bg-surface-soft text-txt-soft'
                        }`}
                      >
                        <Icon name={opcion.icono} className="w-5 h-5" />
                      </span>

                      <span className="flex-1 text-[14.5px] text-txt font-medium leading-snug">
                        {opcion.texto}
                      </span>

                      {seleccionada && (
                        <Check className="w-5 h-5 text-ink shrink-0" aria-label="Opción seleccionada" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ---------- Controles ---------- */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Button variante="ghost" onClick={paso === 0 ? () => navegar('home') : retroceder}>
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {paso === 0 ? 'Volver al inicio' : 'Atrás'}
        </Button>

        <div className="flex items-center gap-2">
          {paso > 0 && (
            <Button variante="ghost" tamano="sm" onClick={reiniciar}>
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Reiniciar
            </Button>
          )}

          {esUltima && (
            <Button onClick={alFinalizar} disabled={!completo}>
              {completo ? 'Ver mis resultados' : `Faltan ${TOTAL_PREGUNTAS - respondidas} respuestas`}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}

          {!esUltima && paso > 0 && respuestaActual && (
            <Button variante="secondary" onClick={avanzar}>
              Siguiente
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {paso > 0 && (
        <p className="mt-4 text-center text-[12px] text-txt-soft">
          Puedes volver atrás sin perder nada: tus respuestas se guardan en este navegador.
        </p>
      )}
    </div>
  );
}
