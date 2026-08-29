import type { ReactNode } from 'react';

interface SectionHeaderProps {
  eyebrow: string;
  titulo: string;
  subtitulo?: string;
  /** Nivel semantico del titular. La portada usa h1; el resto, h2. */
  as?: 'h1' | 'h2';
  centrado?: boolean;
  children?: ReactNode;
}

/**
 * Patron eyebrow -> titular -> subtitulo. Repetido en todas las secciones
 * para que el ritmo tipografico sea el mismo en todo el producto.
 */
export function SectionHeader({
  eyebrow,
  titulo,
  subtitulo,
  as: Titulo = 'h2',
  centrado = false,
  children,
}: SectionHeaderProps) {
  const alineacion = centrado ? 'text-center mx-auto' : '';

  return (
    <div className={`${alineacion} max-w-3xl`}>
      <p className="font-mono text-[11px] uppercase tracking-[.14em] font-bold text-txt-soft mb-3">
        {eyebrow}
      </p>
      <Titulo
        className={`font-extrabold text-ink leading-[1.12] ${
          Titulo === 'h1' ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-3xl'
        }`}
      >
        {titulo}
      </Titulo>
      {subtitulo && (
        <p className={`mt-4 text-[15px] sm:text-base text-txt-soft leading-relaxed ${centrado ? 'mx-auto' : ''} max-w-2xl`}>
          {subtitulo}
        </p>
      )}
      {children}
    </div>
  );
}
