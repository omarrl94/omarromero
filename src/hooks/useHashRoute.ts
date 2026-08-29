import { useCallback, useEffect, useState } from 'react';
import type { Ruta } from '../types';

const RUTAS: Ruta[] = ['home', 'guia-fp', 'test', 'resultados', 'explorar'];

function leerHash(): Ruta {
  if (typeof window === 'undefined') return 'home';

  const limpio = window.location.hash.replace(/^#\/?/, '').split('?')[0] ?? '';
  const encontrada = RUTAS.find((r) => r === limpio);
  return encontrada ?? 'home';
}

/**
 * Enrutado por hash sin dependencias: la app tiene cinco vistas, no compensa
 * traerse un router entero. Da URLs compartibles (#/guia-fp) y hace que el
 * boton "atras" del navegador funcione como el usuario espera.
 */
export function useHashRoute() {
  const [ruta, setRutaState] = useState<Ruta>(leerHash);

  useEffect(() => {
    const alCambiar = () => setRutaState(leerHash());
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  const navegar = useCallback((destino: Ruta) => {
    const nuevoHash = destino === 'home' ? '#/' : `#/${destino}`;
    if (window.location.hash === nuevoHash) {
      setRutaState(destino);
    } else {
      window.location.hash = nuevoHash;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return { ruta, navegar };
}
