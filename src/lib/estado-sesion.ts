import { useEffect, useLayoutEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { PREFIJO } from './almacen-local';

function leer<T>(clave: string, inicial: T | (() => T)): T {
  const porDefecto = () => (typeof inicial === 'function' ? (inicial as () => T)() : inicial);
  try {
    const crudo = sessionStorage.getItem(PREFIJO + clave);
    return crudo === null ? porDefecto() : (JSON.parse(crudo) as T);
  } catch {
    return porDefecto();
  }
}

/**
 * Como useState, pero se conserva mientras dure la sesión del navegador (sessionStorage).
 * Sirve para que los filtros no se pierdan al abrir una ficha y volver atrás.
 */
export function useEstadoSesion<T>(clave: string, inicial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [valor, setValor] = useState<T>(() => leer(clave, inicial));
  useEffect(() => {
    try {
      sessionStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
    } catch {
      /* almacenamiento bloqueado: el filtro funciona igual, solo no se recuerda */
    }
  }, [clave, valor]);
  return [valor, setValor];
}

/** Borra los filtros recordados (se usa desde «Borrar mis datos»). */
export function borrarEstadoSesion(): void {
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(PREFIJO))
      .forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* nada que borrar */
  }
}

/**
 * Recuerda la posición de scroll de una lista y la recupera al volver a ella.
 * `listo` indica que la lista ya está pintada (los datos han cargado).
 */
export function useRecordarScroll(clave: string, listo: boolean): void {
  useLayoutEffect(() => {
    if (!listo) return;
    let guardada = 0;
    try {
      guardada = Number(sessionStorage.getItem(`${PREFIJO}scroll.${clave}`) ?? 0);
    } catch {
      /* sin almacenamiento */
    }
    // Después del scroll al principio que hace el Layout al cambiar de página.
    const t = setTimeout(() => {
      if (guardada > 0) window.scrollTo({ top: guardada });
    }, 0);
    const guardar = () => {
      try {
        sessionStorage.setItem(`${PREFIJO}scroll.${clave}`, String(Math.round(window.scrollY)));
      } catch {
        /* sin almacenamiento */
      }
    };
    window.addEventListener('scroll', guardar, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener('scroll', guardar);
    };
  }, [clave, listo]);
}
