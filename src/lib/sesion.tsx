import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, ErrorApi, type EstadoCuenta } from './api';
import { auth, type UsuarioAuth } from './auth';
import { borrarTodo } from './almacen-local';
import { borrarEstadoSesion } from './estado-sesion';
import { olvidarEmpresas } from './useEmpresas';
import { detenerSincronizacion, iniciarSincronizacion } from './sincronizacion';

interface Sesion {
  /** Todavía no se sabe si hay sesión. */
  cargando: boolean;
  usuario: UsuarioAuth | null;
  estado: EstadoCuenta | null;
  error: string | null;
  refrescar: (forzarToken?: boolean) => Promise<EstadoCuenta | null>;
  salir: () => Promise<void>;
}

const Contexto = createContext<Sesion | null>(null);

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(null);
  const [estado, setEstado] = useState<EstadoCuenta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refrescar = useCallback(async (forzarToken = false) => {
    try {
      if (forzarToken) await auth.token(true);
      const e = await api.cuenta.estado();
      setEstado(e);
      setError(null);
      return e;
    } catch (err) {
      setEstado(null);
      setError(err instanceof ErrorApi && err.estado === 401 ? null : err instanceof Error ? err.message : 'Error');
      return null;
    }
  }, []);

  useEffect(
    () =>
      auth.escuchar((u) => {
        setUsuario(u);
        olvidarEmpresas();
        if (!u) {
          setEstado(null);
          setCargando(false);
          detenerSincronizacion();
          return;
        }
        void refrescar().then((e) => {
          setCargando(false);
          if (e?.verificado && e.rol && e.rol !== 'bloqueado') void iniciarSincronizacion(u.uid);
        });
      }),
    [refrescar],
  );

  const salir = useCallback(async () => {
    try {
      await api.cuenta.accion('salir');
    } catch {
      /* sin conexión: la cookie caduca sola */
    }
    detenerSincronizacion();
    await auth.salir();
    // En ordenadores compartidos del centro no deben quedar datos del alumno.
    borrarTodo();
    borrarEstadoSesion();
    olvidarEmpresas();
    location.hash = '#/';
  }, []);

  return <Contexto.Provider value={{ cargando, usuario, estado, error, refrescar, salir }}>{children}</Contexto.Provider>;
}

export function useSesion(): Sesion {
  const s = useContext(Contexto);
  if (!s) throw new Error('useSesion fuera de ProveedorSesion');
  return s;
}

export const ROLES_DIRECTORIO = ['alumno', 'tutor', 'superadmin'] as const;
