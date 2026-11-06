import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, type Rol, type UsuarioAdmin } from '../lib/api';
import { normalizar } from '../../shared/texto';
import { AvisosAdmin } from '../components/AvisosAdmin';
import { Aviso, Cargando, ErrorCaja, Vacio } from '../components/Estados';
import { fecha } from '../lib/formato';

const NOMBRE_ROL: Record<Rol, string> = {
  alumno: 'Alumno/a',
  tutor: 'Tutor/a',
  superadmin: 'Superadmin',
  pendiente: 'Pendiente de aprobar',
  bloqueado: 'Bloqueado',
};
const COLOR_ROL: Record<Rol, string> = {
  alumno: 'bg-salvia-claro',
  tutor: 'bg-terracota-claro',
  superadmin: 'bg-tinta text-papel',
  pendiente: 'bg-amarillo',
  bloqueado: 'bg-hueso line-through',
};

export function Admin() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [filtro, setFiltro] = useState<'' | Rol>('');
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = useCallback(
    () =>
      api.admin.listar().then(
        (r) => {
          setUsuarios(r.usuarios);
          setError(null);
        },
        (e: unknown) => setError(e instanceof Error ? e.message : 'Error'),
      ),
    [],
  );
  useEffect(() => {
    void cargar();
  }, [cargar]);

  const lista = useMemo(() => {
    const q = normalizar(texto);
    const orden: Rol[] = ['pendiente', 'tutor', 'superadmin', 'alumno', 'bloqueado'];
    return (usuarios ?? [])
      .filter((u) => !filtro || u.rol === filtro)
      .filter((u) => !q || normalizar(`${u.nombre} ${u.email}`).includes(q))
      .sort((a, b) => orden.indexOf(a.rol) - orden.indexOf(b.rol) || a.email.localeCompare(b.email));
  }, [usuarios, texto, filtro]);

  const pendientes = (usuarios ?? []).filter((u) => u.rol === 'pendiente').length;

  const cambiar = async (u: UsuarioAdmin, rol: Rol) => {
    setMensaje(null);
    try {
      await api.admin.cambiarRol(u.uid, rol);
      setMensaje(`${u.nombre || u.email}: ahora es «${NOMBRE_ROL[rol]}».${rol === 'tutor' ? ' Le hemos avisado por correo.' : ''}`);
      await cargar();
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'No se ha podido cambiar el rol.');
    }
  };

  return (
    <div className="grid gap-6">
      <header>
        <p className="chip mb-3 border-tinta bg-tinta text-papel">Superadmin</p>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Usuarios y roles</h1>
        <p className="mt-2 max-w-3xl text-tinta-suave">
          El alumnado (@a.jrotero.es) entra solo al verificar su correo. El profesorado (@jrotero.es) queda pendiente hasta que le asignes el rol de tutor/a; te llega un aviso por correo con cada solicitud.
        </p>
      </header>
      {pendientes > 0 && (
        <Aviso tono="atencion" titulo={`${pendientes} ${pendientes === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}`}>
          Aparecen las primeras de la lista. Pulsa «Aprobar como tutor/a» para darles acceso.
        </Aviso>
      )}
      <div className="tarjeta grid gap-3 p-4 sm:grid-cols-[1fr_14rem]">
        <div>
          <label htmlFor="a-buscar" className="etiqueta">Buscar</label>
          <input id="a-buscar" type="search" className="campo" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nombre o correo…" />
        </div>
        <div>
          <label htmlFor="a-rol" className="etiqueta">Rol</label>
          <select id="a-rol" className="campo" value={filtro} onChange={(e) => setFiltro(e.target.value as '' | Rol)}>
            <option value="">Todos</option>
            {(Object.keys(NOMBRE_ROL) as Rol[]).map((r) => <option key={r} value={r}>{NOMBRE_ROL[r]}</option>)}
          </select>
        </div>
      </div>
      <p aria-live="polite" className="font-semibold">{mensaje}</p>
      {error && <ErrorCaja mensaje={error} reintentar={() => void cargar()} />}
      {!usuarios && !error && <Cargando texto="Cargando usuarios…" />}
      {usuarios && lista.length === 0 && <Vacio titulo="Ningún usuario con estos filtros" />}
      {usuarios && lista.length > 0 && (
        <ul className="grid gap-2">
          {lista.map((u) => (
            <li key={u.uid} className="tarjeta grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="min-w-0">
                <p className="font-bold">{u.nombre || '(sin nombre)'}</p>
                <p className="break-all text-sm text-tinta-suave">{u.email}</p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-tinta-suave">
                  <span className={`chip border-tinta ${COLOR_ROL[u.rol]}`}>{NOMBRE_ROL[u.rol]}</span>
                  <span>{u.tipo === 'profesor' ? 'Profesorado' : 'Alumnado'} · alta el {fecha(u.creado)}</span>
                </p>
              </div>
              {u.fijo ? (
                <p className="text-sm text-tinta-suave">Fijado en la configuración</p>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {u.rol === 'pendiente' && (
                    <button type="button" className="btn-amarillo min-h-10 py-1 text-sm" onClick={() => void cambiar(u, 'tutor')}>
                      Aprobar como tutor/a<span className="sr-only">: {u.email}</span>
                    </button>
                  )}
                  <label className="sr-only" htmlFor={`rol-${u.uid}`}>Rol de {u.email}</label>
                  <select id={`rol-${u.uid}`} className="campo min-h-10 w-auto py-1 text-sm" value={u.rol} onChange={(e) => void cambiar(u, e.target.value as Rol)}>
                    {(Object.keys(NOMBRE_ROL) as Rol[]).map((r) => <option key={r} value={r}>{NOMBRE_ROL[r]}</option>)}
                  </select>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <AvisosAdmin />
    </div>
  );
}
