import { useMemo, useState } from 'react';
import { Search as SearchIcon, SearchX, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { CicloCard } from './CicloCard';
import { Icon } from './ui/Icon';
import { SectionHeader } from './ui/SectionHeader';
import { CICLOS, FAMILIAS, GRADOS } from '../data/fpData';
import type { FamiliaId, Grado } from '../types';

type FiltroGrado = Grado | 'todos';
type FiltroFamilia = FamiliaId | 'todas';

const FILTROS_GRADO: { id: FiltroGrado; texto: string }[] = [
  { id: 'todos', texto: 'Todos los grados' },
  { id: 'basico', texto: GRADOS.basico.nombre },
  { id: 'medio', texto: GRADOS.medio.nombre },
  { id: 'superior', texto: GRADOS.superior.nombre },
];

/** Normaliza para buscar sin tildes ni mayúsculas. */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function ExplorerView() {
  const [busqueda, setBusqueda] = useState('');
  const [grado, setGrado] = useState<FiltroGrado>('todos');
  const [familia, setFamilia] = useState<FiltroFamilia>('todas');

  const resultados = useMemo(() => {
    const termino = normalizar(busqueda.trim());

    return CICLOS.filter((ciclo) => {
      if (grado !== 'todos' && ciclo.grado !== grado) return false;
      if (familia !== 'todas' && ciclo.familia !== familia) return false;
      if (!termino) return true;

      // Se busca en nombre, siglas, descripción, competencias y salidas.
      const indexable = normalizar(
        [
          ciclo.nombre,
          ciclo.siglas ?? '',
          ciclo.descripcion,
          ...(ciclo.habilidadesClave ?? []),
          ...(ciclo.salidasLaborales ?? []),
        ].join(' '),
      );

      return indexable.includes(termino);
    }).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [busqueda, grado, familia]);

  const hayFiltros = busqueda.trim() !== '' || grado !== 'todos' || familia !== 'todas';

  const limpiar = () => {
    setBusqueda('');
    setGrado('todos');
    setFamilia('todas');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <SectionHeader
        as="h1"
        eyebrow="Catálogo"
        titulo="Explora todos los ciclos, sin hacer el test"
        subtitulo={`${CICLOS.length} ciclos formativos de ${FAMILIAS.length} familias profesionales. Busca por nombre, por competencia o por la profesión que tienes en la cabeza.`}
      />

      {/* ---------- Buscador ---------- */}
      <div className="mt-8">
        <label htmlFor="buscador" className="sr-only">
          Buscar ciclos formativos
        </label>
        <div className="relative">
          <SearchIcon
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-txt-soft pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="buscador"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder='Prueba con "soldadura", "niños", "redes" o "cocina"'
            className="w-full bg-surface border-[1.5px] border-border rounded-card pl-11 pr-11 py-3.5 min-h-[52px] text-[15px] text-txt placeholder:text-txt-soft/70 shadow-card transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 focus:border-warm"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              aria-label="Borrar la búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-txt-soft hover:text-ink hover:bg-surface-soft transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* ---------- Filtro por grado ---------- */}
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filtrar por grado">
        {FILTROS_GRADO.map((item) => {
          const activo = grado === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setGrado(item.id)}
              aria-pressed={activo}
              className={`font-mono text-[11px] uppercase tracking-wider font-bold px-4 py-2.5 min-h-[44px] rounded-full border-[1.5px] transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 ${
                activo ? 'bg-ink text-cream border-ink' : 'bg-surface text-txt-soft border-border hover:border-warm'
              }`}
            >
              {item.texto}
            </button>
          );
        })}
      </div>

      {/* ---------- Filtro por familia ---------- */}
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar por familia profesional">
        <button
          onClick={() => setFamilia('todas')}
          aria-pressed={familia === 'todas'}
          className={`font-mono text-[11px] uppercase tracking-wider font-bold px-4 py-2.5 min-h-[44px] rounded-full border-[1.5px] transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 ${
            familia === 'todas'
              ? 'bg-ink text-cream border-ink'
              : 'bg-surface text-txt-soft border-border hover:border-warm'
          }`}
        >
          Todas las familias
        </button>

        {FAMILIAS.map((item) => {
          const activo = familia === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setFamilia(item.id)}
              aria-pressed={activo}
              className={`inline-flex items-center gap-2 text-[12.5px] font-semibold px-3.5 py-2.5 min-h-[44px] rounded-full border-[1.5px] transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 ${
                activo
                  ? 'border-transparent text-white shadow-card ' + item.colorClass
                  : 'bg-surface text-txt-soft border-border hover:border-warm'
              }`}
            >
              <Icon name={item.icono} className="w-3.5 h-3.5" />
              {item.nombre}
            </button>
          );
        })}
      </div>

      {/* ---------- Contador y limpieza ---------- */}
      <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
        <p className="font-mono text-[11px] uppercase tracking-wider text-txt-soft" aria-live="polite">
          {resultados.length} {resultados.length === 1 ? 'ciclo encontrado' : 'ciclos encontrados'}
        </p>
        {hayFiltros && (
          <Button variante="ghost" tamano="sm" onClick={limpiar}>
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            Quitar filtros
          </Button>
        )}
      </div>

      {/* ---------- Resultados ---------- */}
      {resultados.length === 0 ? (
        <Card className="mt-6 text-center py-14">
          <SearchX className="w-8 h-8 text-txt-soft mx-auto mb-4" aria-hidden="true" />
          <h2 className="font-bold text-ink text-lg">Nada por aquí</h2>
          <p className="mt-2 text-[14px] text-txt-soft max-w-sm mx-auto leading-relaxed">
            Ningún ciclo del catálogo coincide con esa búsqueda. Prueba con otra palabra o quita
            algún filtro.
          </p>
          <div className="mt-6">
            <Button variante="secondary" onClick={limpiar}>
              Ver todos los ciclos
            </Button>
          </div>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {resultados.map((ciclo) => (
            <CicloCard key={ciclo.id} ciclo={ciclo} />
          ))}
        </div>
      )}
    </div>
  );
}
