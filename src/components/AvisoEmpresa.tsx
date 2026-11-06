import { useId, useState, type FormEvent } from 'react';
import { api, NOMBRE_INCIDENCIA, type TipoIncidencia } from '../lib/api';

/** «¿Algo no funciona?»: el alumnado y los tutores avisan de correos que fallan. */
export function AvisoEmpresa({ empresaId, nombre }: { empresaId: string; nombre: string }) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<TipoIncidencia>('rebote');
  const [comentario, setComentario] = useState('');
  const [estado, setEstado] = useState<'inicial' | 'enviando' | 'ok' | 'error'>('inicial');
  const [error, setError] = useState('');

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    setEstado('enviando');
    try {
      await api.incidencias.enviar(empresaId, tipo, comentario);
      setEstado('ok');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido enviar.');
      setEstado('error');
    }
  }

  if (estado === 'ok') {
    return <p role="status" className="rounded-xl bg-salvia-claro p-3 text-sm font-semibold">Gracias. La coordinación de FFE revisará {nombre} y la corregirá o la retirará del directorio.</p>;
  }
  if (!abierto) {
    return (
      <button type="button" className="enlace w-fit text-sm" onClick={() => setAbierto(true)}>
        ¿El correo ha rebotado o algo no funciona? Avísanos
      </button>
    );
  }
  return (
    <form onSubmit={enviar} className="grid gap-3 rounded-xl border-2 border-linea bg-hueso p-3">
      <fieldset>
        <legend className="etiqueta">¿Qué ha pasado con {nombre}?</legend>
        <div className="grid gap-1">
          {(Object.keys(NOMBRE_INCIDENCIA) as TipoIncidencia[]).map((t) => (
            <label key={t} className="flex min-h-11 items-center gap-2 text-sm">
              <input type="radio" name={`${id}-tipo`} className="size-5 accent-tinta" checked={tipo === t} onChange={() => setTipo(t)} />
              {NOMBRE_INCIDENCIA[t]}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor={`${id}-comentario`} className="etiqueta">Detalle (opcional)</label>
        <textarea id={`${id}-comentario`} className="campo min-h-20 text-sm" maxLength={500} value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Ej.: «Mail Delivery Subsystem: dirección no encontrada»" />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primario min-h-10 py-1 text-sm" disabled={estado === 'enviando'}>Enviar aviso</button>
        <button type="button" className="btn-secundario min-h-10 py-1 text-sm" onClick={() => setAbierto(false)}>Cancelar</button>
      </div>
      {estado === 'error' && <p role="alert" className="text-sm font-semibold text-peligro">{error}</p>}
    </form>
  );
}
