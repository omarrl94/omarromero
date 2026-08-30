import { useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import type { Ruta } from '../types';
import type { Tema } from '../hooks/useTheme';

interface NavbarProps {
  ruta: Ruta;
  navegar: (destino: Ruta) => void;
  tema: Tema;
  alternarTema: () => void;
  /** Habilita el enlace a resultados solo si ya hay un test hecho. */
  hayResultado: boolean;
}

const ENLACES: { ruta: Ruta; texto: string }[] = [
  { ruta: 'guia-fp', texto: 'Guía de la FP' },
  { ruta: 'test', texto: 'Test' },
  { ruta: 'explorar', texto: 'Explorar' },
  { ruta: 'comparador', texto: 'Comparar' },
  { ruta: 'gemas', texto: 'Gemas ocultas' },
];

export function Navbar({ ruta, navegar, tema, alternarTema, hayResultado }: NavbarProps) {
  const [abierto, setAbierto] = useState(false);

  const enlaces = hayResultado
    ? [...ENLACES, { ruta: 'resultados' as Ruta, texto: 'Mis resultados' }]
    : ENLACES;

  const ir = (destino: Ruta) => {
    navegar(destino);
    setAbierto(false);
  };

  const claseEnlace = (destino: Ruta) =>
    `text-[13px] font-semibold px-3 py-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 ${
      ruta === destino ? 'text-brand' : 'text-white/75 hover:text-white hover:bg-white/10'
    }`;

  return (
    <header className="no-print sticky top-0 z-40 bg-[rgb(var(--c-navbar))] border-b-2 border-warm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[58px] flex items-center justify-between gap-3">
        <button
          onClick={() => ir('home')}
          className="flex items-center gap-3 group rounded-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
        >
          <img
            src="/logo.svg"
            alt=""
            className="h-9 w-9 transition-transform group-hover:scale-105"
            width={36}
            height={36}
          />
          <span className="leading-tight text-left">
            <span className="block text-white font-bold text-[14px]">OrientaFP</span>
            <span className="hidden sm:block text-accent text-[10px] font-mono tracking-wide">
              Encuentra tu Formación Profesional
            </span>
          </span>
        </button>

        <nav aria-label="Navegación principal" className="hidden lg:flex items-center gap-1">
          {enlaces.map((enlace) => (
            <button key={enlace.ruta} onClick={() => ir(enlace.ruta)} className={claseEnlace(enlace.ruta)}>
              {enlace.texto}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            onClick={alternarTema}
            aria-label={tema === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
            className="p-2.5 rounded-lg text-white/75 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
          >
            {tema === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>

          <button
            onClick={() => setAbierto((v) => !v)}
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={abierto}
            className="lg:hidden p-2.5 rounded-lg text-white/75 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
          >
            {abierto ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
          </button>
        </div>
      </div>

      {abierto && (
        <nav
          aria-label="Navegación principal móvil"
          className="lg:hidden border-t border-white/10 bg-[rgb(var(--c-navbar))] px-4 pb-3 pt-2 flex flex-col gap-1"
        >
          {enlaces.map((enlace) => (
            <button
              key={enlace.ruta}
              onClick={() => ir(enlace.ruta)}
              className={`${claseEnlace(enlace.ruta)} text-left min-h-[44px]`}
            >
              {enlace.texto}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
