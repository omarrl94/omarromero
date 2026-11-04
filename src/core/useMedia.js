import { useEffect, useState } from 'react';

const query = (q) => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q) : null);

/** true mientras se cumpla la media query (se actualiza al girar el móvil o redimensionar). */
export function useMedia(q) {
  const [match, setMatch] = useState(() => { const m = query(q); return m ? m.matches : false; });
  useEffect(() => {
    const m = query(q);
    if (!m) return undefined;
    const on = () => setMatch(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [q]);
  return match;
}

/** Pantallas de móvil (por debajo de «sm» de Tailwind). */
export const PHONE = '(max-width: 639px)';
/** Por debajo de «lg»: la arena se muestra en pestañas en lugar de en dos columnas. */
export const COMPACT = '(max-width: 1023px)';
export const isCompactNow = () => { const m = query(COMPACT); return m ? m.matches : false; };
