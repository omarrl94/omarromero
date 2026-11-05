import { useCallback, useEffect, useState } from 'react';
import type { Empresa } from '../../shared/schemas';
import { api, ErrorApi } from './api';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'sin-acceso' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; empresas: Empresa[] };

let cache: Empresa[] | null = null;

/** Carga el directorio desde el servidor (requiere sesión). Se guarda en memoria, nunca en localStorage. */
export function useEmpresas() {
  const [estado, setEstado] = useState<Estado>(cache ? { tipo: 'listo', empresas: cache } : { tipo: 'cargando' });

  const obtener = useCallback(
    () =>
      api.empresas().then(
        (r) => {
          cache = r.empresas;
          setEstado({ tipo: 'listo', empresas: r.empresas });
        },
        (e: unknown) => {
          if (e instanceof ErrorApi && e.estado === 401) setEstado({ tipo: 'sin-acceso' });
          else setEstado({ tipo: 'error', mensaje: e instanceof Error ? e.message : 'Error desconocido' });
        },
      ),
    [],
  );

  const cargar = useCallback(() => {
    setEstado({ tipo: 'cargando' });
    void obtener();
  }, [obtener]);

  useEffect(() => {
    if (!cache) void obtener();
  }, [obtener]);

  return { estado, recargar: cargar };
}

export function olvidarEmpresas() {
  cache = null;
}
