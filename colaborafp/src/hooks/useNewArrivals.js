import { useEffect, useRef, useState } from 'react';

/**
 * Detecta recursos nuevos en el muro mientras el alumno no está mirando:
 *  - `unseenBelow`: llegan mientras está desplazado hacia abajo → píldora "↑ N nuevos".
 *  - Pestaña en segundo plano → contador en el título: "(2) Sala…".
 */
export function useNewArrivals(resources, loading, baseTitle) {
  const seen = useRef(null);
  const [unseenBelow, setUnseenBelow] = useState(0);
  const [unseenHidden, setUnseenHidden] = useState(0);

  useEffect(() => {
    if (loading) return;
    const ids = resources.map((r) => r.id);
    if (seen.current === null) {
      seen.current = new Set(ids);
      return;
    }
    const fresh = ids.filter((id) => !seen.current.has(id));
    fresh.forEach((id) => seen.current.add(id));
    if (!fresh.length) return;
    if (document.visibilityState === 'hidden') setUnseenHidden((n) => n + fresh.length);
    if (window.scrollY > 240) setUnseenBelow((n) => n + fresh.length);
  }, [resources, loading]);

  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && setUnseenHidden(0);
    const onScroll = () => window.scrollY < 120 && setUnseenBelow(0);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (!unseenHidden) return undefined;
    const prev = document.title;
    document.title = `(${unseenHidden}) ${baseTitle} · ColaboraFP`;
    return () => {
      document.title = prev;
    };
  }, [unseenHidden, baseTitle]);

  const jumpToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setUnseenBelow(0);
  };

  return { unseenBelow, jumpToTop };
}
