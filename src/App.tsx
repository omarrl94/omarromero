import { useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './components/Home';
import { GuiaFP } from './components/GuiaFP';
import { TestWizard } from './components/TestWizard';
import { ResultsView } from './components/ResultsView';
import { ExplorerView } from './components/ExplorerView';
import { CycleComparator } from './components/CycleComparator';
import { HiddenGems } from './components/HiddenGems';
import { useHashRoute } from './hooks/useHashRoute';
import { useTest } from './hooks/useTest';
import { useTheme } from './hooks/useTheme';
import type { Ruta } from './types';

/** Título del documento por vista: mejora el historial y los marcadores. */
const TITULOS: Record<Ruta, string> = {
  home: 'OrientaFP — Descubre qué Formación Profesional encaja contigo',
  'guia-fp': 'Guía de la FP: grados, mitos e itinerarios — OrientaFP',
  test: 'Test vocacional de Formación Profesional — OrientaFP',
  resultados: 'Tus resultados — OrientaFP',
  explorar: 'Catálogo de ciclos formativos — OrientaFP',
  comparador: 'Comparar ciclos cara a cara — OrientaFP',
  gemas: 'Gemas ocultas de la FP — OrientaFP',
};

export default function App() {
  const { ruta, navegar } = useHashRoute();
  const { tema, alternarTema } = useTheme();
  const test = useTest();

  useEffect(() => {
    document.title = TITULOS[ruta];
  }, [ruta]);

  return (
    <div className="min-h-full flex flex-col bg-cream">
      <a href="#contenido" className="skip-link no-print">
        Saltar al contenido principal
      </a>

      <Navbar
        ruta={ruta}
        navegar={navegar}
        tema={tema}
        alternarTema={alternarTema}
        hayResultado={Boolean(test.resultado)}
      />

      <main id="contenido" className="flex-1">
        {ruta === 'home' && <Home navegar={navegar} hayResultado={Boolean(test.resultado)} />}
        {ruta === 'guia-fp' && <GuiaFP navegar={navegar} />}
        {ruta === 'test' && <TestWizard test={test} navegar={navegar} />}
        {ruta === 'resultados' && (
          <ResultsView resultado={test.resultado} navegar={navegar} reiniciar={test.reiniciar} />
        )}
        {ruta === 'explorar' && <ExplorerView />}
        {ruta === 'comparador' && (
          <CycleComparator
            // Si ya hay test hecho, arranca comparando los dos mejores ciclos.
            inicial={(test.resultado?.ciclos ?? []).slice(0, 2).map((c) => c.ciclo.id)}
          />
        )}
        {ruta === 'gemas' && <HiddenGems />}
      </main>

      <Footer navegar={navegar} />
    </div>
  );
}
