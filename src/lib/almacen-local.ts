import { useCallback, useSyncExternalStore } from 'react';

export const PREFIJO = 'conecta-ffe:';
const oyentes = new Set<() => void>();
const cacheLectura = new Map<string, { crudo: string | null; valor: unknown }>();

function leerCrudo(clave: string): string | null {
  try {
    return localStorage.getItem(PREFIJO + clave);
  } catch {
    return null;
  }
}

export function leer<T>(clave: string, inicial: T): T {
  const crudo = leerCrudo(clave);
  const previo = cacheLectura.get(clave);
  if (previo && previo.crudo === crudo) return previo.valor as T;
  let valor: T = inicial;
  if (crudo) {
    try {
      valor = { ...(inicial as object), ...JSON.parse(crudo) } as T;
      if (Array.isArray(inicial)) valor = JSON.parse(crudo) as T;
    } catch {
      valor = inicial;
    }
  }
  cacheLectura.set(clave, { crudo, valor });
  return valor;
}

export function escribir(clave: string, valor: unknown): void {
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
  } catch {
    /* almacenamiento lleno o bloqueado: la app sigue funcionando sin persistir */
  }
  oyentes.forEach((o) => o());
}

/** Borra todos los datos de Conecta FFE de este dispositivo. */
export function borrarTodo(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIJO))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* nada que borrar */
  }
  cacheLectura.clear();
  oyentes.forEach((o) => o());
}

function suscribir(o: () => void) {
  oyentes.add(o);
  const alCambiar = (e: StorageEvent) => {
    if (!e.key || e.key.startsWith(PREFIJO)) o();
  };
  window.addEventListener('storage', alCambiar);
  return () => {
    oyentes.delete(o);
    window.removeEventListener('storage', alCambiar);
  };
}

/** Estado persistido en localStorage y sincronizado entre componentes y pestañas. */
export function useLocal<T>(clave: string, inicial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const valor = useSyncExternalStore(suscribir, () => leer(clave, inicial), () => inicial);
  const fijar = useCallback(
    (v: T | ((prev: T) => T)) => {
      const actual = leer(clave, inicial);
      escribir(clave, typeof v === 'function' ? (v as (p: T) => T)(actual) : v);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clave],
  );
  return [valor, fijar];
}
