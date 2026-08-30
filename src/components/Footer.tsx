import type { Ruta } from '../types';

interface FooterProps {
  navegar: (destino: Ruta) => void;
}

export function Footer({ navegar }: FooterProps) {
  return (
    <footer className="no-print border-t border-border bg-surface mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <img src="/logo.svg" alt="" className="h-7 w-7" width={28} height={28} loading="lazy" />
              <span className="font-bold text-ink">OrientaFP</span>
            </div>
            <p className="text-[13px] text-txt-soft leading-relaxed">
              Una herramienta de orientación para entender la Formación Profesional y decidir con
              criterio. El resultado del test es una recomendación, no un veredicto: contrástalo
              siempre con el departamento de orientación de tu centro.
            </p>
          </div>

          <nav aria-label="Enlaces del pie" className="flex flex-col gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[.14em] font-bold text-txt-soft mb-1">
              Navegación
            </p>
            <button onClick={() => navegar('guia-fp')} className="text-[13px] text-txt hover:text-brand text-left transition-colors">
              Por qué estudiar FP
            </button>
            <button onClick={() => navegar('test')} className="text-[13px] text-txt hover:text-brand text-left transition-colors">
              Hacer el test vocacional
            </button>
            <button onClick={() => navegar('explorar')} className="text-[13px] text-txt hover:text-brand text-left transition-colors">
              Explorar el catálogo de ciclos
            </button>
            <button onClick={() => navegar('comparador')} className="text-[13px] text-txt hover:text-brand text-left transition-colors">
              Comparar ciclos cara a cara
            </button>
            <button onClick={() => navegar('gemas')} className="text-[13px] text-txt hover:text-brand text-left transition-colors">
              Gemas ocultas de la FP
            </button>
          </nav>
        </div>

        <p className="mt-8 pt-6 border-t border-border text-[12px] text-txt-soft">
          Datos orientativos basados en el catálogo de títulos de FP del sistema educativo español.
          La oferta concreta varía según comunidad autónoma y centro.
        </p>
      </div>
    </footer>
  );
}
