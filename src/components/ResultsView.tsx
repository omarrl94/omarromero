import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, Printer, RotateCcw, Scale, Search, Trophy } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { CicloCard } from './CicloCard';
import { Icon } from './ui/Icon';
import { SectionHeader } from './ui/SectionHeader';
import { FichaImprimible } from './FichaImprimible';
import { CareerPathSimulator } from './CareerPathSimulator';
import { GRADOS, SITUACIONES } from '../data/fpData';
import { ETIQUETA_DIMENSION, ETIQUETA_META, porcentajesDimension } from '../lib/scoring';
import type { Grado, Meta, Resultado, Ruta } from '../types';

interface ResultsViewProps {
  resultado: Resultado | null;
  navegar: (destino: Ruta) => void;
  reiniciar: () => void;
}

type FiltroGrado = Grado | 'todos';

const FILTROS: { id: FiltroGrado; texto: string }[] = [
  { id: 'todos', texto: 'Todos' },
  { id: 'basico', texto: 'Grado Básico' },
  { id: 'medio', texto: 'Grado Medio' },
  { id: 'superior', texto: 'Grado Superior' },
];

/** Cuántos ciclos se muestran por defecto antes de "ver más". */
const CICLOS_VISIBLES = 6;

export function ResultsView({ resultado, navegar, reiniciar }: ResultsViewProps) {
  const [filtro, setFiltro] = useState<FiltroGrado>('todos');
  const [verTodos, setVerTodos] = useState(false);

  const perfil = useMemo(
    () => (resultado ? porcentajesDimension(resultado.dimensiones) : []),
    [resultado],
  );

  const ciclosFiltrados = useMemo(() => {
    if (!resultado) return [];
    return resultado.ciclos.filter((m) => filtro === 'todos' || m.ciclo.grado === filtro);
  }, [resultado, filtro]);

  // Estado vacío: se llega aquí por URL directa sin haber hecho el test.
  if (!resultado || resultado.familias.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-surface-soft flex items-center justify-center mx-auto mb-6">
          <Compass className="w-7 h-7 text-txt-soft" aria-hidden="true" />
        </div>
        <h1 className="font-extrabold text-ink text-2xl sm:text-3xl">Aún no hay resultados</h1>
        <p className="mt-4 text-[15px] text-txt-soft leading-relaxed">
          Haz el test y aquí verás tu familia profesional, tu porcentaje de afinidad y los ciclos que
          mejor encajan contigo.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button tamano="lg" onClick={() => navegar('test')}>
            Hacer el test
          </Button>
          <Button tamano="lg" variante="secondary" onClick={() => navegar('explorar')}>
            Explorar ciclos sin test
          </Button>
        </div>
      </div>
    );
  }

  const principal = resultado.familias[0];
  const secundarias = resultado.familias.slice(1, 3);
  const gradoSugerido = GRADOS[resultado.gradoSugerido];
  const situacion = SITUACIONES.find((s) => s.id === resultado.situacion);

  const metaDominante = (Object.entries(resultado.metas) as [Meta, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0];

  const visibles = verTodos ? ciclosFiltrados : ciclosFiltrados.slice(0, CICLOS_VISIBLES);

  const fechaLegible = (() => {
    const parsed = new Date(resultado.fecha);
    return Number.isNaN(parsed.getTime())
      ? ''
      : parsed.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Al imprimir se oculta toda la pantalla y solo sale la ficha de abajo. */}
      <div className="no-print">
        {/* ---------- Arquetipo vocacional ---------- */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-5"
          aria-labelledby="arquetipo"
        >
          <Card padding="none" className="overflow-hidden">
            <div className={`h-2 w-full ${resultado.arquetipo.arquetipo.colorClass}`} aria-hidden="true" />
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
              <div
                className={`w-16 h-16 rounded-card flex items-center justify-center shrink-0 ${resultado.arquetipo.arquetipo.colorClass}`}
              >
                <Icon name={resultado.arquetipo.arquetipo.icono} className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-mono text-[11px] uppercase tracking-[.14em] font-bold text-txt-soft mb-2">
                  Tu arquetipo vocacional
                </p>
                <h2 id="arquetipo" className="font-extrabold text-ink text-2xl sm:text-3xl leading-tight">
                  {resultado.arquetipo.arquetipo.nombre}
                </h2>
                <p className="mt-1 font-mono text-[12px] text-txt-soft">
                  «{resultado.arquetipo.arquetipo.lema}»
                </p>
                <p className="mt-4 text-[14.5px] text-txt leading-relaxed max-w-2xl">
                  {resultado.arquetipo.arquetipo.descripcion}
                </p>
              </div>
            </div>
          </Card>
        </motion.section>

        {/* ---------- Match principal ---------- */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          aria-labelledby="match-principal"
        >
          <Card padding="none" className="overflow-hidden">
            <div className={`h-2 w-full ${principal?.familia.colorClass ?? 'bg-border'}`} aria-hidden="true" />

            <div className="p-6 sm:p-9">
              <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                <div className="flex-1">
                  <p className="font-mono text-[11px] uppercase tracking-[.14em] font-bold text-txt-soft mb-3">
                    Tu familia profesional
                  </p>

                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-card flex items-center justify-center shrink-0 ${
                        principal?.familia.colorClass ?? 'bg-border'
                      }`}
                    >
                      <Icon name={principal?.familia.icono ?? 'Compass'} className="w-7 h-7 text-white" />
                    </div>
                    <h1 id="match-principal" className="font-extrabold text-ink text-2xl sm:text-4xl leading-[1.1]">
                      {principal?.familia.nombre ?? 'Sin resultado'}
                    </h1>
                  </div>

                  <p className="mt-5 text-[15px] text-txt leading-relaxed max-w-2xl">
                    {principal?.explicacion}
                  </p>

                  <ul className="mt-5 flex flex-wrap gap-2">
                    {(principal?.dimensionesClave ?? []).map((dim) => (
                      <li key={dim}>
                        <Badge tono="contorno">{ETIQUETA_DIMENSION[dim]}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Marcador de afinidad */}
                <div className="lg:w-56 shrink-0">
                  <div className="bg-surface-soft rounded-card p-6 text-center">
                    <Trophy className="w-5 h-5 text-warm mx-auto mb-2" aria-hidden="true" />
                    <p className="font-extrabold text-5xl text-ink leading-none">
                      {principal?.afinidad ?? 0}
                      <span className="text-2xl">%</span>
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[.12em] text-txt-soft mt-2">
                      de afinidad
                    </p>

                    <div className="mt-4 pt-4 border-t border-border text-left space-y-2">
                      <p className="text-[12px] text-txt-soft">
                        <strong className="text-txt font-semibold block">Punto de entrada</strong>
                        {gradoSugerido?.nombre ?? 'Grado Medio'}
                      </p>
                      {metaDominante && metaDominante[1] > 0 && (
                        <p className="text-[12px] text-txt-soft">
                          <strong className="text-txt font-semibold block">Tu meta</strong>
                          {ETIQUETA_META[metaDominante[0]]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {situacion && (
                <p className="mt-6 pt-5 border-t border-border text-[12.5px] text-txt-soft">
                  Calculado el {fechaLegible} a partir de tu situación: «{situacion.titulo}». Es una
                  recomendación orientativa, no una etiqueta: úsala para abrir puertas, no para
                  cerrarlas.
                </p>
              )}
            </div>
          </Card>
        </motion.section>

        {/* ---------- Acciones ---------- */}
        <div className="no-print mt-5 flex flex-wrap gap-2.5">
          <Button variante="secondary" onClick={() => window.print()}>
            <Printer className="w-4 h-4" aria-hidden="true" />
            Descargar ficha en PDF
          </Button>
          <Button variante="secondary" onClick={() => navegar('comparador')}>
            <Scale className="w-4 h-4" aria-hidden="true" />
            Comparar mis ciclos
          </Button>
          <Button variante="secondary" onClick={() => navegar('explorar')}>
            <Search className="w-4 h-4" aria-hidden="true" />
            Explorar el catálogo
          </Button>
          <Button
            variante="danger"
            onClick={() => {
              reiniciar();
              navegar('test');
            }}
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Repetir el test
          </Button>
      </div>

      {/* ---------- Perfil por dimensiones ---------- */}
      <section className="mt-12" aria-labelledby="tu-perfil">
        <h2 id="tu-perfil" className="font-extrabold text-ink text-2xl">
          Cómo ha salido tu perfil
        </h2>
        <p className="mt-3 text-[14.5px] text-txt-soft max-w-2xl leading-relaxed">
          Cada barra es una forma de trabajar. No hay barras buenas ni malas: lo interesante es ver
          en qué reparte tu energía.
        </p>

        <Card className="mt-5">
          <ul className="space-y-3.5">
            {perfil.map((item) => (
              <li key={item.dimension} className="flex items-center gap-4">
                <span className="w-40 sm:w-48 shrink-0 text-[13px] font-medium text-txt">
                  {ETIQUETA_DIMENSION[item.dimension]}
                </span>
                <div className="flex-1 h-2.5 bg-surface-soft rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand to-warm rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${item.porcentaje}%` }}
                  />
                </div>
                <span className="w-11 text-right font-mono text-[11px] text-txt-soft shrink-0">
                  {item.porcentaje}%
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* ---------- Familias secundarias ---------- */}
      {secundarias.length > 0 && (
        <section className="mt-12" aria-labelledby="secundarias">
          <h2 id="secundarias" className="font-extrabold text-ink text-2xl">
            Otras dos que también te pegan
          </h2>
          <p className="mt-3 text-[14.5px] text-txt-soft max-w-2xl leading-relaxed">
            Si la primera no te convence del todo, estas son tus siguientes mejores opciones. A veces
            la segunda es la buena.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {secundarias.map((match, indice) => (
              <Card key={match.familia.id} interactiva padding="none" className="overflow-hidden h-full">
                <div className={`h-1.5 w-full ${match.familia.colorClass}`} aria-hidden="true" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${match.familia.colorClass}`}
                      >
                        <Icon name={match.familia.icono} className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-txt-soft">
                          {indice === 0 ? '2ª opción' : '3ª opción'}
                        </p>
                        <h3 className="font-bold text-ink text-[15px] leading-snug">
                          {match.familia.nombre}
                        </h3>
                      </div>
                    </div>
                    <p className="font-extrabold text-xl text-ink shrink-0">{match.afinidad}%</p>
                  </div>
                  <p className="mt-3 text-[13.5px] text-txt-soft leading-relaxed">
                    {match.familia.descripcion}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ---------- Ciclos recomendados ---------- */}
      <section className="mt-14" aria-labelledby="ciclos-recomendados">
        <SectionHeader
          eyebrow="Tus ciclos"
          titulo="Los que más encajan contigo, uno a uno"
          subtitulo="Ordenados por encaje. Filtra por grado para ver solo lo que puedes cursar ahora o lo que te espera después."
        />

        <div className="no-print mt-6 flex flex-wrap gap-2" role="group" aria-label="Filtrar ciclos por grado">
          {FILTROS.map((item) => {
            const activo = filtro === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setFiltro(item.id);
                  setVerTodos(false);
                }}
                aria-pressed={activo}
                className={`font-mono text-[11px] uppercase tracking-wider font-bold px-4 py-2.5 min-h-[44px] rounded-full border-[1.5px] transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 ${
                  activo
                    ? 'bg-ink text-cream border-ink'
                    : 'bg-surface text-txt-soft border-border hover:border-warm'
                }`}
              >
                {item.texto}
              </button>
            );
          })}
        </div>

        {visibles.length === 0 ? (
          <Card className="mt-6 text-center py-10">
            <p className="text-[14px] text-txt-soft">
              No hay ciclos de ese grado en el catálogo. Prueba con otro filtro.
            </p>
          </Card>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibles.map((match) => (
              <CicloCard
                  key={match.ciclo.id}
                  ciclo={match.ciclo}
                  encaje={match.encaje}
                  situacion={resultado.situacion}
                />
            ))}
          </div>
        )}

        {!verTodos && ciclosFiltrados.length > CICLOS_VISIBLES && (
          <div className="no-print mt-6 text-center">
            <Button variante="secondary" onClick={() => setVerTodos(true)}>
              Ver los {ciclosFiltrados.length - CICLOS_VISIBLES} ciclos restantes
            </Button>
          </div>
        )}
      </section>

        {/* ---------- Hoja de ruta del ciclo recomendado ---------- */}
        {resultado.ciclos[0] && (
          <section className="mt-14" aria-labelledby="hoja-ruta">
            <SectionHeader
              eyebrow="Hoja de ruta"
              titulo="Tu recorrido si eliges el primero"
              subtitulo={`De dónde partes, qué cursas y qué puertas te quedan abiertas después de ${resultado.ciclos[0].ciclo.nombre}.`}
            />
            <Card className="mt-6">
              <CareerPathSimulator
                ciclo={resultado.ciclos[0].ciclo}
                situacion={resultado.situacion}
              />
            </Card>
          </section>
        )}
      </div>

      {/* Versión compacta que sustituye a la pantalla al imprimir. */}
      <FichaImprimible resultado={resultado} />
    </div>
  );
}
