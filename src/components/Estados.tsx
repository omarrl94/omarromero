import type { ReactNode } from 'react';

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-linea p-6 text-tinta-suave">
      <span className="size-5 animate-spin rounded-full border-[3px] border-linea border-t-tinta" aria-hidden="true" />
      {texto}
    </div>
  );
}

export function Esqueleto({ filas = 3 }: { filas?: number }) {
  return (
    <div aria-hidden="true" className="grid gap-3">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-hueso" />
      ))}
    </div>
  );
}

export function Vacio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-linea bg-white/60 p-6 text-center">
      <p className="font-display text-lg font-bold">{titulo}</p>
      {children && <div className="mt-2 text-tinta-suave">{children}</div>}
    </div>
  );
}

export function ErrorCaja({ titulo = 'Algo ha fallado', mensaje, reintentar }: { titulo?: string; mensaje: string; reintentar?: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border-2 border-peligro bg-terracota-claro p-5">
      <p className="font-display text-lg font-bold text-peligro">{titulo}</p>
      <p className="mt-1">{mensaje}</p>
      {reintentar && (
        <button type="button" className="btn-secundario mt-3" onClick={reintentar}>
          Reintentar
        </button>
      )}
    </div>
  );
}

export function Aviso({ tono = 'info', children, titulo }: { tono?: 'info' | 'atencion' | 'peligro'; titulo?: string; children: ReactNode }) {
  const estilos = {
    info: 'border-salvia-oscuro bg-salvia-claro',
    atencion: 'border-tinta bg-amarillo-claro',
    peligro: 'border-peligro bg-terracota-claro',
  }[tono];
  return (
    <div className={`rounded-xl border-l-[6px] p-4 ${estilos}`} role={tono === 'peligro' ? 'alert' : undefined}>
      {titulo && <p className="font-bold">{titulo}</p>}
      <div className={titulo ? 'mt-1' : ''}>{children}</div>
    </div>
  );
}
