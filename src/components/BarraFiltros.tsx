import { useId, useState, type ReactNode } from 'react';

interface Props {
  etiqueta: string;
  /** Campo de búsqueda: siempre visible. */
  busqueda: ReactNode;
  /** Selects del filtro (se reparten en rejilla). */
  children: ReactNode;
  /** Opciones marcables (chips). */
  opciones?: ReactNode;
  activos: number;
  limpiar: () => void;
  /** Texto del botón que pliega el panel en móvil, p. ej. «Ver 12 empresas». */
  verResultados?: string;
  /** id de la lista de resultados, para llevar el foco a ella. */
  idResultados?: string;
}

/**
 * Barra de filtros a todo el ancho. En móvil el buscador queda a la vista y el resto
 * se despliega con «Filtros»; en escritorio todo está visible. Nunca queda cortada.
 */
export function BarraFiltros({ etiqueta, busqueda, children, opciones, activos, limpiar, verResultados, idResultados }: Props) {
  const [abierto, setAbierto] = useState(false);
  const id = useId();
  return (
    <form role="search" aria-label={etiqueta} className="tarjeta grid gap-4 p-4 sm:p-5" onSubmit={(e) => e.preventDefault()}>
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">{busqueda}</div>
        <button
          type="button"
          className="btn-secundario shrink-0 lg:hidden"
          aria-expanded={abierto}
          aria-controls={id}
          onClick={() => setAbierto(!abierto)}
        >
          Filtros{activos > 0 && <span className="grid size-6 place-items-center rounded-full bg-tinta text-xs text-papel">{activos}</span>}
          <span aria-hidden="true">{abierto ? '▲' : '▼'}</span>
        </button>
      </div>
      <div id={id} className={`${abierto ? 'grid' : 'hidden'} gap-4 lg:grid`}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(auto-fit,minmax(10.5rem,1fr))]">{children}</div>
        <div className="flex flex-wrap items-center gap-2 border-t-2 border-dashed border-linea pt-3">
          {opciones}
          <button type="button" className="enlace ml-auto min-h-11 px-1 text-sm disabled:opacity-50" onClick={limpiar} disabled={activos === 0}>
            Quitar filtros{activos > 0 ? ` (${activos})` : ''}
          </button>
        </div>
        {verResultados && (
          <button
            type="button"
            className="btn-primario w-full lg:hidden"
            onClick={() => {
              setAbierto(false);
              const destino = idResultados ? document.getElementById(idResultados) : null;
              destino?.scrollIntoView({ block: 'start' });
              destino?.focus({ preventScroll: true });
            }}
          >
            {verResultados}
          </button>
        )}
      </div>
    </form>
  );
}

/** Casilla con aspecto de chip, para opciones de sí/no. */
export function ChipOpcion({ marcado, cambiar, children }: { marcado: boolean; cambiar: (v: boolean) => void; children: ReactNode }) {
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-tinta ${marcado ? 'border-tinta bg-amarillo' : 'border-linea bg-white hover:border-tinta'}`}
    >
      <input type="checkbox" className="sr-only" checked={marcado} onChange={(e) => cambiar(e.target.checked)} />
      <span aria-hidden="true">{marcado ? '✓' : '+'}</span>
      {children}
    </label>
  );
}
