import { useMemo, useState } from 'react';
import { Plus, Scale, X } from 'lucide-react';
import { Badge, BadgeGrado } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { SectionHeader } from './ui/SectionHeader';
import { CICLOS, FAMILIAS_POR_ID, GRADOS } from '../data/fpData';
import {
  AVISO_DATOS_MERCADO,
  ETIQUETA_DEMANDA,
  ETIQUETA_MODALIDAD,
  datosMercado,
  formatearSalario,
} from '../data/mercadoLaboral';
import { formatearHoras } from '../lib/format';
import type { Ciclo } from '../types';

/** Máximo de ciclos que caben en la tabla sin que deje de leerse. */
const MAXIMO = 3;

/** Barra de 1 a 5 para las cargas lógica y práctica. */
function Escala({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  const seguro = Math.max(0, Math.min(5, valor));
  return (
    <div className="flex items-center gap-2">
      <span className="flex gap-0.5" role="img" aria-label={`${etiqueta}: ${seguro} de 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`w-3 h-1.5 rounded-full ${n <= seguro ? 'bg-brand' : 'bg-surface-soft'}`}
            aria-hidden="true"
          />
        ))}
      </span>
      <span className="font-mono text-[11px] text-txt-soft">{seguro}/5</span>
    </div>
  );
}

/** Fila de la tabla. Se pinta como grid para poder apilarla en móvil. */
function Fila({
  etiqueta,
  children,
  columnas,
}: {
  etiqueta: string;
  children: React.ReactNode;
  columnas: number;
}) {
  return (
    <div
      className="grid gap-4 py-4 border-b border-border last:border-0"
      style={{ gridTemplateColumns: `minmax(9rem, 1fr) repeat(${columnas}, minmax(11rem, 1fr))` }}
    >
      <div className="font-mono text-[10px] uppercase tracking-[.12em] font-bold text-txt-soft self-center">
        {etiqueta}
      </div>
      {children}
    </div>
  );
}

interface CycleComparatorProps {
  /** Ciclos preseleccionados, por ejemplo los recomendados por el test. */
  inicial?: string[];
}

/**
 * Comparador cara a cara de 2 o 3 ciclos.
 *
 * La tabla se construye con CSS grid y no con <table> porque tiene que poder
 * desplazarse en horizontal dentro de su propio contenedor en movil, sin que la
 * pagina entera se mueva de lado.
 */
export function CycleComparator({ inicial = [] }: CycleComparatorProps) {
  const [seleccion, setSeleccion] = useState<string[]>(() => inicial.slice(0, MAXIMO));
  const [buscando, setBuscando] = useState(false);
  const [filtro, setFiltro] = useState('');

  const ciclos = useMemo(
    () => seleccion.map((id) => CICLOS.find((c) => c.id === id)).filter((c): c is Ciclo => Boolean(c)),
    [seleccion],
  );

  const candidatos = useMemo(() => {
    const termino = filtro.trim().toLowerCase();
    return CICLOS.filter((c) => !seleccion.includes(c.id))
      .filter((c) => !termino || c.nombre.toLowerCase().includes(termino) || (c.siglas ?? '').toLowerCase().includes(termino))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      .slice(0, 40);
  }, [seleccion, filtro]);

  const anadir = (id: string) => {
    setSeleccion((actual) => (actual.length >= MAXIMO ? actual : [...actual, id]));
    setBuscando(false);
    setFiltro('');
  };

  const quitar = (id: string) => setSeleccion((actual) => actual.filter((x) => x !== id));

  const columnas = Math.max(ciclos.length, 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <SectionHeader
        as="h1"
        eyebrow="Cara a cara"
        titulo="Compara dos o tres ciclos y decide con datos"
        subtitulo="Cuando dudas entre opciones parecidas, verlas una al lado de otra aclara más que cualquier descripción."
      />

      {/* ---------- Selección ---------- */}
      <div className="mt-8 flex flex-wrap gap-2.5">
        {ciclos.map((ciclo) => (
          <span
            key={ciclo.id}
            className="inline-flex items-center gap-2 bg-surface border-[1.5px] border-border rounded-full pl-4 pr-2 py-2 shadow-card"
          >
            <span className="text-[13px] font-semibold text-ink">{ciclo.siglas || ciclo.nombre}</span>
            <button
              onClick={() => quitar(ciclo.id)}
              aria-label={`Quitar ${ciclo.nombre} de la comparación`}
              className="p-1.5 rounded-full text-txt-soft hover:text-ink hover:bg-surface-soft transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}

        {seleccion.length < MAXIMO && (
          <Button variante="secondary" onClick={() => setBuscando((v) => !v)} aria-expanded={buscando}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            Añadir ciclo
          </Button>
        )}
      </div>

      {buscando && (
        <Card className="mt-4">
          <label htmlFor="buscar-comparador" className="sr-only">
            Buscar un ciclo para comparar
          </label>
          <input
            id="buscar-comparador"
            type="search"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Escribe el nombre del ciclo…"
            autoFocus
            className="w-full bg-cream border-[1.5px] border-border rounded-card px-4 py-3 min-h-[48px] text-[14px] text-txt placeholder:text-txt-soft/70 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 focus:border-warm"
          />
          <ul className="mt-3 max-h-64 overflow-y-auto divide-y divide-border">
            {candidatos.map((ciclo) => {
              const familia = FAMILIAS_POR_ID[ciclo.familia];
              return (
                <li key={ciclo.id}>
                  <button
                    onClick={() => anadir(ciclo.id)}
                    className="w-full text-left py-3 px-2 flex items-center gap-3 hover:bg-surface-soft rounded-lg transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
                  >
                    <span className={`w-2 h-8 rounded-full shrink-0 ${familia?.colorClass ?? 'bg-border'}`} aria-hidden="true" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] font-semibold text-ink truncate">{ciclo.nombre}</span>
                      <span className="block text-[12px] text-txt-soft">{familia?.nombre}</span>
                    </span>
                    <BadgeGrado grado={ciclo.grado} />
                  </button>
                </li>
              );
            })}
            {candidatos.length === 0 && (
              <li className="py-4 text-center text-[13px] text-txt-soft">Ningún ciclo coincide.</li>
            )}
          </ul>
        </Card>
      )}

      {/* ---------- Tabla ---------- */}
      {ciclos.length < 2 ? (
        <Card className="mt-8 text-center py-14">
          <Scale className="w-8 h-8 text-txt-soft mx-auto mb-4" aria-hidden="true" />
          <h2 className="font-bold text-ink text-lg">Elige al menos dos ciclos</h2>
          <p className="mt-2 text-[14px] text-txt-soft max-w-sm mx-auto leading-relaxed">
            Puedes comparar hasta {MAXIMO} a la vez. Añádelos con el botón de arriba.
          </p>
        </Card>
      ) : (
        <>
          <Card className="mt-8" padding="none">
            {/* El desbordamiento se queda dentro de la tarjeta, nunca en el body */}
            <div className="overflow-x-auto">
              <div className="min-w-[42rem] px-5 sm:px-6">
                <Fila etiqueta="Ciclo" columnas={columnas}>
                  {ciclos.map((ciclo) => {
                    const familia = FAMILIAS_POR_ID[ciclo.familia];
                    return (
                      <div key={ciclo.id}>
                        <div className={`h-1.5 w-full rounded-full mb-2.5 ${familia?.colorClass ?? 'bg-border'}`} aria-hidden="true" />
                        <p className="font-extrabold text-ink text-[15px] leading-snug">{ciclo.nombre}</p>
                        <p className="mt-1 text-[12px] text-txt-soft">{familia?.nombre}</p>
                      </div>
                    );
                  })}
                </Fila>

                <Fila etiqueta="Grado y horas" columnas={columnas}>
                  {ciclos.map((ciclo) => (
                    <div key={ciclo.id} className="space-y-2">
                      <BadgeGrado grado={ciclo.grado} />
                      <p className="font-mono text-[12px] text-txt-soft">
                        {formatearHoras(ciclo.duracionHoras)} · {GRADOS[ciclo.grado]?.titulo}
                      </p>
                    </div>
                  ))}
                </Fila>

                <Fila etiqueta="Inserción laboral" columnas={columnas}>
                  {ciclos.map((ciclo) => {
                    const m = datosMercado(ciclo.id);
                    return (
                      <div key={ciclo.id}>
                        {m ? (
                          <>
                            <p className="font-extrabold text-2xl text-ink leading-none">{m.insercion}%</p>
                            <div className="mt-2 h-1.5 w-full bg-surface-soft rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-brand to-warm rounded-full" style={{ width: `${m.insercion}%` }} />
                            </div>
                          </>
                        ) : (
                          <p className="text-[13px] text-txt-soft">Sin estimación</p>
                        )}
                      </div>
                    );
                  })}
                </Fila>

                <Fila etiqueta="Demanda" columnas={columnas}>
                  {ciclos.map((ciclo) => {
                    const m = datosMercado(ciclo.id);
                    return (
                      <div key={ciclo.id}>
                        {m ? <Badge tono="contorno">{ETIQUETA_DEMANDA[m.demanda]}</Badge> : <span className="text-[13px] text-txt-soft">—</span>}
                      </div>
                    );
                  })}
                </Fila>

                <Fila etiqueta="Sueldo de entrada" columnas={columnas}>
                  {ciclos.map((ciclo) => {
                    const m = datosMercado(ciclo.id);
                    return (
                      <p key={ciclo.id} className="text-[13.5px] text-txt font-semibold">
                        {m ? formatearSalario(m.salarioMin, m.salarioMax) : '—'}
                      </p>
                    );
                  })}
                </Fila>

                <Fila etiqueta="Modalidad" columnas={columnas}>
                  {ciclos.map((ciclo) => {
                    const m = datosMercado(ciclo.id);
                    return (
                      <ul key={ciclo.id} className="flex flex-wrap gap-1.5">
                        {(m?.modalidades ?? []).map((mod) => (
                          <li key={mod}>
                            <Badge tono="suave">{ETIQUETA_MODALIDAD[mod]}</Badge>
                          </li>
                        ))}
                        {!m && <li className="text-[13px] text-txt-soft">—</li>}
                      </ul>
                    );
                  })}
                </Fila>

                <Fila etiqueta="Tipo de esfuerzo" columnas={columnas}>
                  {ciclos.map((ciclo) => {
                    const m = datosMercado(ciclo.id);
                    return (
                      <div key={ciclo.id} className="space-y-2">
                        {m ? (
                          <>
                            <div>
                              <p className="text-[11.5px] text-txt-soft mb-1">Carga lógica</p>
                              <Escala valor={m.cargaLogica} etiqueta="Carga lógica" />
                            </div>
                            <div>
                              <p className="text-[11.5px] text-txt-soft mb-1">Carga práctica</p>
                              <Escala valor={m.cargaPractica} etiqueta="Carga práctica" />
                            </div>
                          </>
                        ) : (
                          <span className="text-[13px] text-txt-soft">—</span>
                        )}
                      </div>
                    );
                  })}
                </Fila>

                <Fila etiqueta="Módulos clave" columnas={columnas}>
                  {ciclos.map((ciclo) => (
                    <ul key={ciclo.id} className="space-y-1.5">
                      {(ciclo.asignaturasTipicas ?? []).slice(0, 5).map((asig) => (
                        <li key={asig} className="flex items-start gap-2 text-[12.5px] text-txt">
                          <span className="mt-[6px] w-1 h-1 rounded-full bg-brand shrink-0" aria-hidden="true" />
                          {asig}
                        </li>
                      ))}
                    </ul>
                  ))}
                </Fila>

                <Fila etiqueta="Salidas principales" columnas={columnas}>
                  {ciclos.map((ciclo) => (
                    <ul key={ciclo.id} className="space-y-1.5">
                      {(ciclo.salidasLaborales ?? []).slice(0, 4).map((s) => (
                        <li key={s} className="flex items-start gap-2 text-[12.5px] text-txt">
                          <span className="mt-[6px] w-1 h-1 rounded-full bg-accent-deep shrink-0" aria-hidden="true" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  ))}
                </Fila>
              </div>
            </div>
          </Card>

          <p className="mt-4 flex items-start gap-2 text-[12.5px] text-txt-soft leading-relaxed">
            <Icon name="Info" className="w-4 h-4 mt-0.5 shrink-0" />
            {AVISO_DATOS_MERCADO}
          </p>
        </>
      )}
    </div>
  );
}
