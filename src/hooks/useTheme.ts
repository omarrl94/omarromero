import { useCallback, useEffect, useState } from 'react';
import { cargarTema, guardarTema } from '../lib/storage';

export type Tema = 'light' | 'dark';

/**
 * Tema impuesto por el contenedor que incrusta la app, si lo hay.
 * Algunos anfitriones (por ejemplo una vista previa incrustada) marcan la raiz
 * con data-theme="dark" | "light" para forzar el tema del visor.
 */
function temaDelContenedor(): Tema | null {
  if (typeof document === 'undefined') return null;
  const valor = document.documentElement.getAttribute('data-theme');
  return valor === 'dark' || valor === 'light' ? valor : null;
}

function temaDelSistema(): Tema {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Prioridad: lo que el usuario haya elegido con el interruptor, luego lo que
 * imponga el contenedor y, por ultimo, la preferencia del sistema operativo.
 */
function resolverTemaAutomatico(): Tema {
  return temaDelContenedor() ?? temaDelSistema();
}

function temaInicial(): Tema {
  return cargarTema() ?? resolverTemaAutomatico();
}

/**
 * Modo claro/oscuro.
 *
 * Solo se persiste cuando el usuario pulsa el interruptor. Mientras no lo haga,
 * la app sigue al contenedor y al sistema: si se guardase el tema en cada
 * arranque, la primera visita fijaria una preferencia que el usuario nunca ha
 * elegido y a partir de ahi el tema del visor dejaria de aplicarse.
 */
export function useTheme() {
  const [tema, setTema] = useState<Tema>(temaInicial);
  const [elegidoPorUsuario, setElegidoPorUsuario] = useState(() => cargarTema() !== null);

  // Refleja el tema en el DOM.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark');
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', tema === 'dark' ? '#141518' : '#f7f4f0');
  }, [tema]);

  // Mientras no haya eleccion explicita, se sigue al contenedor y al sistema.
  useEffect(() => {
    if (elegidoPorUsuario) return;

    const sincronizar = () => setTema(resolverTemaAutomatico());

    // Solo se observa data-theme, no la clase que escribe el efecto anterior:
    // observar todos los atributos crearia un bucle.
    const observador = new MutationObserver(sincronizar);
    observador.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const consulta = window.matchMedia?.('(prefers-color-scheme: dark)');
    consulta?.addEventListener?.('change', sincronizar);

    return () => {
      observador.disconnect();
      consulta?.removeEventListener?.('change', sincronizar);
    };
  }, [elegidoPorUsuario]);

  const alternarTema = useCallback(() => {
    setTema((actual) => {
      const siguiente: Tema = actual === 'dark' ? 'light' : 'dark';
      guardarTema(siguiente);
      return siguiente;
    });
    setElegidoPorUsuario(true);
  }, []);

  return { tema, alternarTema };
}
