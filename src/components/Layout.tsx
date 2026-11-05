import { useEffect, useRef, type ReactNode } from 'react';
import { useRuta } from '../lib/ruta';

const NAV = [
  { ruta: 'empresas', texto: 'Empresas' },
  { ruta: 'ofertas', texto: 'Ofertas' },
  { ruta: 'seguimiento', texto: 'Seguimiento' },
  { ruta: 'perfil', texto: 'Mis datos' },
];

export function Layout({ children }: { children: ReactNode }) {
  const ruta = useRuta();
  const principal = useRef<HTMLElement>(null);
  const actual = ruta[0] ?? '';

  // Al cambiar de página, el foco va al contenido principal (lectores de pantalla).
  useEffect(() => {
    if (actual || ruta.length) principal.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [ruta.join('/')]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#contenido" onClick={(e) => { e.preventDefault(); principal.current?.focus(); }} className="sr-only z-50 rounded-lg bg-tinta px-4 py-2 text-papel focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-40 border-b-2 border-tinta bg-papel/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <a href="#/" className="flex shrink-0 items-center gap-2.5 rounded-lg">
            <span className="grid size-9 place-items-center rounded-lg bg-amarillo font-display text-lg font-extrabold" aria-hidden="true">
              C
            </span>
            <span className="font-display text-lg leading-none font-extrabold">
              Conecta <span className="rounded bg-tinta px-1 text-amarillo">FFE</span>
              <span className="sr-only"> (inicio)</span>
            </span>
          </a>
          <nav aria-label="Principal" className="ml-auto hidden md:block">
            <ul className="flex gap-1">
              {NAV.map((n) => (
                <li key={n.ruta}>
                  <a href={`#/${n.ruta}`} aria-current={actual === n.ruta ? 'page' : undefined} className={`rounded-lg px-3 py-2 font-semibold hover:bg-hueso ${actual === n.ruta ? 'bg-amarillo hover:bg-amarillo' : ''}`}>
                    {n.texto}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <img src="/logo-jrotero.png" alt="Formación Profesional José Ramón Otero" width={154} height={33} className="ml-auto hidden h-7 w-auto sm:block md:ml-4" />
        </div>
      </header>

      <main id="contenido" ref={principal} tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 outline-none md:pb-12">
        {children}
      </main>

      <footer className="border-t-2 border-tinta bg-hueso">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 pb-24 text-sm md:flex-row md:items-center md:justify-between md:pb-6">
          <p>
            <strong>Conecta FFE</strong> · C.F.P. José Ramón Otero (Madrid). Sin registro, sin analítica: tus datos se quedan en este dispositivo.
          </p>
          <p className="flex gap-4">
            <a className="enlace" href="#/privacidad">Privacidad y retirada</a>
            <a className="enlace" href="#/perfil">Borrar mis datos</a>
          </p>
        </div>
      </footer>

      {/* Navegación inferior en móvil */}
      <nav aria-label="Principal (móvil)" className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-tinta bg-papel md:hidden">
        <ul className="grid grid-cols-4">
          {NAV.map((n) => (
            <li key={n.ruta}>
              <a href={`#/${n.ruta}`} aria-current={actual === n.ruta ? 'page' : undefined} className={`flex min-h-14 items-center justify-center px-1 text-center text-sm font-semibold ${actual === n.ruta ? 'bg-amarillo' : ''}`}>
                {n.texto}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
