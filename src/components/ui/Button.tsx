import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variante = 'primary' | 'secondary' | 'ghost' | 'dark' | 'danger';
type Tamano = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-card transition-all duration-200 ' +
  'focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 disabled:opacity-50 disabled:cursor-not-allowed';

const VARIANTES: Record<Variante, string> = {
  primary: 'bg-brand text-ink hover:bg-brand-light hover:shadow-card-hover active:scale-[.98] shadow-card',
  secondary:
    'bg-surface text-txt border-[1.5px] border-border hover:border-warm hover:shadow-card-hover active:scale-[.98]',
  ghost: 'bg-transparent text-txt-soft hover:text-ink hover:bg-surface-soft',
  dark: 'bg-ink text-cream hover:opacity-90 active:scale-[.98] shadow-card',
  danger: 'bg-transparent text-error border-[1.5px] border-error/40 hover:bg-error/10 active:scale-[.98]',
};

const TAMANOS: Record<Tamano, string> = {
  // min-h garantiza el area tactil de 44px en movil.
  sm: 'text-[13px] px-3.5 py-2 min-h-[38px]',
  md: 'text-sm px-5 py-2.5 min-h-[44px]',
  lg: 'text-base px-7 py-3.5 min-h-[52px]',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  children: ReactNode;
}

export function Button({
  variante = 'primary',
  tamano = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={`${BASE} ${VARIANTES[variante]} ${TAMANOS[tamano]} ${className}`} {...props}>
      {children}
    </button>
  );
}
