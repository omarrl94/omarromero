import { useState, type FormEvent } from 'react';
import { api, ErrorApi } from '../lib/api';

interface PropsAcceso {
  alEntrar: (rol: 'alumno' | 'tutor' | null) => void;
  titulo?: string;
  descripcion?: string;
  ayuda?: string;
}

export function Acceso({
  alEntrar,
  titulo = 'Directorio protegido',
  descripcion = 'Los datos de contacto de las empresas solo están disponibles para el alumnado del centro.',
  ayuda = 'Te lo da tu tutor/a de FFE. Se pide una vez cada 12 horas en este navegador.',
}: PropsAcceso) {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) {
      setError('Escribe el código que te ha dado tu tutor/a.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const r = await api.entrar(codigo);
      alEntrar(r.rol ?? null);
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : 'No se ha podido comprobar el código.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="tarjeta overflow-hidden">
        <div className="bg-salvia px-6 py-5">
          <h1 className="text-2xl font-extrabold">{titulo}</h1>
          <p className="mt-1">{descripcion}</p>
        </div>
        <form onSubmit={enviar} className="grid gap-4 p-6" noValidate>
          <div>
            <label htmlFor="codigo" className="etiqueta">Código de acceso</label>
            <input
              id="codigo"
              name="codigo"
              type="password"
              autoComplete="current-password"
              className="campo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'codigo-error codigo-ayuda' : 'codigo-ayuda'}
            />
            <p id="codigo-ayuda" className="mt-1 text-sm text-tinta-suave">{ayuda}</p>
            {error && (
              <p id="codigo-error" role="alert" className="mt-2 font-semibold text-peligro">
                {error}
              </p>
            )}
          </div>
          <button type="submit" className="btn-primario" disabled={enviando}>
            {enviando ? 'Comprobando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
