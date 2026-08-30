import { motion } from 'framer-motion';
import { ArrowDown, Check, GraduationCap } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Icon } from './ui/Icon';
import { FAMILIAS_POR_ID, GRADOS, SITUACIONES } from '../data/fpData';
import type { Ciclo, Grado, SituacionId } from '../types';

/**
 * Créditos ECTS que suelen reconocerse al pasar de un Grado Superior a un grado
 * universitario afín. Es una horquilla, no una cifra fija: cada universidad
 * publica su propia tabla de convalidaciones.
 */
const ECTS_MIN = 30;
const ECTS_MAX = 60;

interface PasoItinerario {
  id: string;
  etiqueta: string;
  titulo: string;
  descripcion: string;
  icono: string;
  /** Un paso opcional se dibuja con borde discontinuo. */
  opcional: boolean;
  detalles?: string[];
  /** Clase de color del punto del itinerario. */
  colorPunto: string;
}

/** Qué grado toca cursar antes del elegido, si es que hace falta alguno. */
function pasoPrevio(situacion: SituacionId | undefined, grado: Grado): string | null {
  if (grado === 'basico') return null;
  if (grado === 'medio') {
    return situacion === 'sinEso'
      ? 'Antes necesitas el título de ESO, un Grado Básico o la prueba de acceso a Grado Medio.'
      : null;
  }
  // Grado Superior
  if (situacion === 'conBachillerato') return null;
  return 'Antes necesitas Bachillerato, un Grado Medio o la prueba de acceso a Grado Superior.';
}

function construirPasos(ciclo: Ciclo, situacion: SituacionId | undefined): PasoItinerario[] {
  const familia = FAMILIAS_POR_ID[ciclo.familia];
  const info = SITUACIONES.find((s) => s.id === situacion);
  const pasos: PasoItinerario[] = [];

  // --- Punto de partida ---
  pasos.push({
    id: 'partida',
    etiqueta: 'Punto de partida',
    titulo: info?.titulo ?? 'Tu situación actual',
    descripcion:
      pasoPrevio(situacion, ciclo.grado) ??
      'Cumples el requisito de acceso, así que puedes solicitar plaza directamente.',
    icono: 'Compass',
    opcional: false,
    colorPunto: 'bg-txt-soft',
  });

  // --- El ciclo elegido ---
  pasos.push({
    id: 'ciclo',
    etiqueta: `Paso 1 · ${GRADOS[ciclo.grado]?.nombre ?? ''}`,
    titulo: ciclo.nombre,
    descripcion: `${GRADOS[ciclo.grado]?.titulo ?? ''}. Dos cursos, ${ciclo.duracionHoras.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} horas con prácticas en empresa incluidas.`,
    icono: familia?.icono ?? 'Compass',
    opcional: false,
    detalles: (ciclo.asignaturasTipicas ?? []).slice(0, 4),
    colorPunto: familia?.colorClass ?? 'bg-brand',
  });

  // --- Especialización (opcional) ---
  const especializacion = ciclo.continuidad?.especializacion ?? [];
  if (especializacion.length > 0) {
    const esCursoEspecializacion = ciclo.grado === 'superior';
    pasos.push({
      id: 'especializacion',
      etiqueta: 'Paso 2 · Opcional',
      titulo: esCursoEspecializacion ? 'Curso de especialización' : 'Seguir subiendo de grado',
      descripcion: esCursoEspecializacion
        ? 'Los llamados «másteres de la FP»: formaciones cortas para ser la persona que más sabe de algo muy concreto.'
        : 'El siguiente escalón dentro de la FP, con acceso directo desde este título.',
      icono: 'Award',
      opcional: true,
      detalles: especializacion,
      colorPunto: 'bg-warm',
    });
  }

  // --- Universidad (opcional, solo desde Grado Superior) ---
  const universidad = ciclo.continuidad?.universidad ?? [];
  if (universidad.length > 0) {
    pasos.push({
      id: 'universidad',
      etiqueta: 'Paso 3 · Opcional',
      titulo: 'Grado universitario',
      descripcion: `Acceso sin selectividad desde el Grado Superior, y con reconocimiento habitual de ${ECTS_MIN} a ${ECTS_MAX} créditos ECTS según la titulación: entre medio curso y un curso ya hecho.`,
      icono: 'GraduationCap',
      opcional: true,
      detalles: universidad,
      colorPunto: 'bg-accent-deep',
    });
  } else if (ciclo.grado !== 'superior') {
    pasos.push({
      id: 'universidad-indirecta',
      etiqueta: 'Más adelante',
      titulo: 'La universidad sigue abierta',
      descripcion:
        'Desde este título no se accede directamente, pero encadenando un Grado Superior entras en la universidad sin selectividad.',
      icono: 'GraduationCap',
      opcional: true,
      colorPunto: 'bg-accent-deep',
    });
  }

  return pasos;
}

interface CareerPathSimulatorProps {
  ciclo: Ciclo;
  /** Situación declarada en el test, si la hay. */
  situacion?: SituacionId;
  /** Compacto para el interior de la ficha modal. */
  compacto?: boolean;
}

/**
 * Dibuja el recorrido académico completo a partir de un ciclo: de dónde vienes,
 * qué cursas, y qué puertas quedan abiertas después.
 */
export function CareerPathSimulator({ ciclo, situacion, compacto = false }: CareerPathSimulatorProps) {
  const pasos = construirPasos(ciclo, situacion);

  return (
    <ol className="relative">
      {pasos.map((paso, indice) => {
        const ultimo = indice === pasos.length - 1;
        return (
          <motion.li
            key={paso.id}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.3, delay: Math.min(indice * 0.08, 0.32) }}
            className="relative pl-11 pb-6 last:pb-0"
          >
            {/* Línea vertical que une los pasos */}
            {!ultimo && (
              <span
                className="absolute left-[15px] top-9 bottom-0 w-px bg-border"
                aria-hidden="true"
              />
            )}

            {/* Punto */}
            <span
              className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center ${paso.colorPunto}`}
              aria-hidden="true"
            >
              <Icon name={paso.icono} className="w-4 h-4 text-white" />
            </span>

            <div
              className={`rounded-card p-4 ${
                paso.opcional
                  ? 'border border-dashed border-border bg-transparent'
                  : 'border-[1.5px] border-border bg-surface shadow-card'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[.12em] font-bold text-txt-soft">
                  {paso.etiqueta}
                </span>
                {paso.opcional && <Badge tono="contorno">Opcional</Badge>}
              </div>

              <p className={`font-bold text-ink ${compacto ? 'text-[14px]' : 'text-[15px]'} leading-snug`}>
                {paso.titulo}
              </p>
              <p className="mt-1.5 text-[13px] text-txt-soft leading-relaxed">{paso.descripcion}</p>

              {paso.detalles && paso.detalles.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {paso.detalles.map((detalle) => (
                    <li key={detalle} className="flex items-start gap-2 text-[12.5px] text-txt">
                      {paso.id === 'universidad' ? (
                        <GraduationCap className="w-3.5 h-3.5 mt-0.5 text-accent-deep shrink-0" aria-hidden="true" />
                      ) : (
                        <Check className="w-3.5 h-3.5 mt-0.5 text-accent-deep shrink-0" aria-hidden="true" />
                      )}
                      {detalle}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {!ultimo && (
              <ArrowDown className="absolute left-[10px] -bottom-1 w-4 h-4 text-border" aria-hidden="true" />
            )}
          </motion.li>
        );
      })}
    </ol>
  );
}
