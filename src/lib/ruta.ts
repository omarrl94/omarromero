import { useSyncExternalStore } from 'react';

function suscribir(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

/** Ruta actual basada en el hash: «#/empresas/abc» → ['empresas', 'abc']. */
export function useRuta(): string[] {
  const hash = useSyncExternalStore(suscribir, () => window.location.hash, () => '');
  return hash.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean).map(decodeURIComponent);
}

export function ir(ruta: string) {
  window.location.hash = ruta.startsWith('#') ? ruta : `#${ruta}`;
}

/** Parámetros tras «?» en el hash: «#/entrar?verificado=1» → verificado=1. */
export function useParametros(): URLSearchParams {
  const hash = useSyncExternalStore(suscribir, () => window.location.hash, () => '');
  return new URLSearchParams(hash.split('?')[1] ?? '');
}
