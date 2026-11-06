import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, NOMBRE_INCIDENCIA, type Incidencia } from '../lib/api';
import { fecha } from '../lib/formato';
import { olvidarEmpresas } from '../lib/useEmpresas';
import { ErrorCaja, Vacio } from './Estados';

type Datos = { incidencias: Incidencia[]; ocultas: string[]; empresas: Record<string, { nombre: string; contacto: string }> };

/** Superadmin: avisos de correos que fallan y empresas ocultas. */
export function AvisosAdmin() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = useCallback(
    () =>
      api.incidencias.listar().then(
        (d) => {
          setDatos(d);
          setError(null);
        },
        (e: unknown) => setError(e instanceof Error ? e.message : 'Error'),
      ),
    [],
  );
  useEffect(() => {
    void cargar();
  }, [cargar]);

  const porEmpresa = useMemo(() => {
    const m = new Map<string, Incidencia[]>();
    for (const i of datos?.incidencias ?? []) m.set(i.empresaId, [...(m.get(i.empresaId) ?? []), i]);
    const ids = new Set([...m.keys(), ...(datos?.ocultas ?? [])]);
    return [...ids].map((id) => ({ id, avisos: m.get(id) ?? [], oculta: datos?.ocultas.includes(id) ?? false })).sort((a, b) => Number(a.oculta) - Number(b.oculta) || b.avisos.length - a.avisos.length);
  }, [datos]);

  const cambiar = async (id: string, ocultar: boolean) => {
    try {
      await api.incidencias.ocultar(id, ocultar);
      olvidarEmpresas();
      setMensaje(`${datos?.empresas[id]?.nombre ?? id}: ${ocultar ? 'oculta en el directorio' : 'visible de nuevo'}.`);
      await cargar();
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'No se ha podido cambiar.');
    }
  };

  const pendientes = porEmpresa.filter((x) => !x.oculta && x.avisos.length).length;

  return (
    <section aria-labelledby="t-avisos" className="grid gap-3">
      <h2 id="t-avisos" className="text-2xl font-extrabold">
        Avisos de empresas{pendientes ? ` (${pendientes} por revisar)` : ''}
      </h2>
      <p className="max-w-3xl text-tinta-suave">
        El alumnado y los tutores avisan aquí si un correo rebota o la empresa no acepta prácticas. «Ocultar» la quita del directorio al momento. Para retirarla del todo, añádela a <code>data/retiradas.json</code>.
      </p>
      <p aria-live="polite" className="font-semibold">{mensaje}</p>
      {error && <ErrorCaja mensaje={error} reintentar={() => void cargar()} />}
      {datos && porEmpresa.length === 0 && <Vacio titulo="Sin avisos por ahora" />}
      {porEmpresa.length > 0 && (
        <ul className="grid gap-2">
          {porEmpresa.map(({ id, avisos, oculta }) => (
            <li key={id} className={`tarjeta grid gap-2 p-4 md:grid-cols-[1fr_auto] md:items-start ${oculta ? 'opacity-70' : ''}`}>
              <div className="min-w-0">
                <p className="font-bold">
                  {datos?.empresas[id]?.nombre ?? id} {oculta && <span className="chip ml-1 bg-hueso">Oculta</span>}
                </p>
                <p className="break-all text-sm text-tinta-suave">{datos?.empresas[id]?.contacto}</p>
                <ul className="mt-2 grid gap-1 text-sm">
                  {avisos.map((a, n) => (
                    <li key={n}>
                      <strong>{NOMBRE_INCIDENCIA[a.tipo]}</strong> · {fecha(a.fecha)} · {a.email}
                      {a.comentario && <span className="block text-tinta-suave">«{a.comentario}»</span>}
                    </li>
                  ))}
                </ul>
              </div>
              <button type="button" className={oculta ? 'btn-secundario min-h-10 py-1 text-sm' : 'btn border-peligro bg-peligro min-h-10 py-1 text-sm text-white'} onClick={() => void cambiar(id, !oculta)}>
                {oculta ? 'Volver a mostrar' : 'Ocultar del directorio'}
                <span className="sr-only">: {datos?.empresas[id]?.nombre ?? id}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
