import { useCallback, useEffect, useState } from 'react';
import { cargarTema, guardarTema } from '../lib/storage';

export type Tema = 'light' | 'dark';

function temaInicial(): Tema {
  const guardado = cargarTema();
  if (guardado) return guardado;

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * Modo claro/oscuro. El script inline de index.html ya aplica la clase antes
 * del primer pintado; este hook solo mantiene el estado y lo persiste.
 */
export function useTheme() {
  const [tema, setTema] = useState<Tema>(temaInicial);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark');
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', tema === 'dark' ? '#141518' : '#f7f4f0');
    guardarTema(tema);
  }, [tema]);

  const alternarTema = useCallback(() => {
    setTema((actual) => (actual === 'dark' ? 'light' : 'dark'));
  }, []);

  return { tema, alternarTema };
}
