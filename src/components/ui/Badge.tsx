import type { ReactNode } from 'react';
import type { Grado } from '../../types';

interface BadgeProps {
  children: ReactNode;
  /** Clase de fondo (por ejemplo la de la familia) o variante neutra. */
  className?: string;
  tono?: 'solido' | 'suave' | 'contorno';
}

/**
 * Etiqueta corta. Siempre lleva texto: el color nunca es el unico portador
 * de informacion (requisito de accesibilidad).
 */
export function Badge({ children, className = '', tono = 'suave' }: BadgeProps) {
  const base =
    'inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[.1em] font-bold px-2.5 py-1 rounded-full whitespace-nowrap';

  const tonos = {
    solido: 'text-white',
    suave: 'bg-surface-soft text-txt-soft',
    contorno: 'border-[1.5px] border-border text-txt-soft',
  } as const;

  return <span className={`${base} ${tonos[tono]} ${className}`}>{children}</span>;
}

const ESTILO_GRADO: Record<Grado, string> = {
  basico: 'bg-warm/20 text-warm border-warm/40',
  medio: 'bg-accent-deep/15 text-accent-deep border-accent-deep/40',
  superior: 'bg-brand/25 text-ink border-brand/50',
};

const NOMBRE_GRADO: Record<Grado, string> = {
  basico: 'G. Básico',
  medio: 'G. Medio',
  superior: 'G. Superior',
};

/** Badge especifico de grado, con color propio y texto siempre visible. */
export function BadgeGrado({ grado }: { grado: Grado }) {
  return (
    <span
      className={`inline-flex items-center font-mono text-[10px] uppercase tracking-[.1em] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${ESTILO_GRADO[grado]}`}
    >
      {NOMBRE_GRADO[grado]}
    </span>
  );
}
