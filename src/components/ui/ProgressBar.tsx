interface ProgressBarProps {
  /** Porcentaje 0-100. Se recorta por seguridad. */
  valor: number;
  etiqueta?: string;
  className?: string;
}

/** Barra de progreso accesible: expone su valor por ARIA, no solo por color. */
export function ProgressBar({ valor, etiqueta, className = '' }: ProgressBarProps) {
  const seguro = Math.max(0, Math.min(100, Math.round(valor)));

  return (
    <div
      className={`h-1.5 w-full bg-surface-soft rounded-full overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={seguro}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={etiqueta ?? 'Progreso del test'}
    >
      <div
        className="h-full bg-gradient-to-r from-brand to-warm rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${seguro}%` }}
      />
    </div>
  );
}
