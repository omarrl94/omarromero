import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Anade elevacion y desplazamiento al pasar el raton. */
  interactiva?: boolean;
  /** Relleno interno. `none` para tarjetas que gestionan su propio padding. */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDINGS = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
} as const;

/** Tarjeta base: un unico radio, borde y sombra para todo el producto. */
export function Card({
  children,
  interactiva = false,
  padding = 'md',
  className = '',
  ...props
}: CardProps) {
  const hover = interactiva
    ? 'transition-all duration-200 hover:shadow-card-hover hover:border-warm hover:-translate-y-0.5'
    : '';

  return (
    <div
      className={`print-card bg-surface border-[1.5px] border-border rounded-card shadow-card ${PADDINGS[padding]} ${hover} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
