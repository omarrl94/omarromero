import { Vacio } from '../components/Estados';
import { fecha } from '../lib/formato';
import { COLOR_ESTADO, ESTADOS, NOMBRE_ESTADO, useSeguimiento, type EstadoSeguimiento } from '../lib/seguimiento';

export function Seguimiento() {
  const { seguimiento, actualizar, quitar } = useSeguimiento();
  const entradas = Object.entries(seguimiento).sort((a, b) => b[1].actualizado.localeCompare(a[1].actualizado));
  const cuenta = (s: EstadoSeguimiento) => entradas.filter(([, e]) => e.estado === s).length;

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Mi seguimiento</h1>
        <p className="mt-2 text-tinta-suave">Solo se guarda en este dispositivo. Si cambias de móvil u ordenador, no se copia.</p>
      </header>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Resumen por estado">
        {ESTADOS.map((s) => (
          <li key={s} className={`rounded-xl border-2 border-tinta p-3 ${COLOR_ESTADO[s]}`}>
            <span className="block font-display text-2xl font-extrabold">{cuenta(s)}</span>
            <span className="text-sm font-semibold">{NOMBRE_ESTADO[s]}</span>
          </li>
        ))}
      </ul>
      {entradas.length === 0 ? (
        <Vacio titulo="Aún no has contactado con ninguna empresa">
          Entra en una <a className="enlace" href="#/empresas">empresa</a>, prepara tu correo y aparecerá aquí.
        </Vacio>
      ) : (
        <ul className="grid gap-3">
          {entradas.map(([id, e]) => (
            <li key={id} className="tarjeta grid gap-3 p-4 sm:grid-cols-[1fr_12rem_auto] sm:items-center">
              <div>
                <a href={`#/empresas/${id}`} className="enlace text-lg">{e.nombre}</a>
                <p className="text-sm text-tinta-suave">
                  {e.contactos.length ? `${e.contactos.length} contacto${e.contactos.length > 1 ? 's' : ''} · último el ${fecha(e.contactos.at(-1)!)}` : 'Sin contactos registrados'}
                  {e.notas && ` · ${e.notas.slice(0, 60)}${e.notas.length > 60 ? '…' : ''}`}
                </p>
              </div>
              <div>
                <label htmlFor={`estado-${id}`} className="sr-only">Estado de {e.nombre}</label>
                <select id={`estado-${id}`} className="campo" value={e.estado} onChange={(ev) => actualizar(id, e.nombre, { estado: ev.target.value as EstadoSeguimiento })}>
                  {ESTADOS.map((s) => <option key={s} value={s}>{NOMBRE_ESTADO[s]}</option>)}
                </select>
              </div>
              <button type="button" className="btn-secundario" onClick={() => { if (confirm(`¿Quitar ${e.nombre} de tu seguimiento?`)) quitar(id); }}>
                Quitar<span className="sr-only"> {e.nombre}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
