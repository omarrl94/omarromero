import { useState } from 'react';
import { SelectorPerfil } from '../components/SelectorPerfil';
import { Aviso } from '../components/Estados';
import { borrarTodo } from '../lib/almacen-local';
import { borrarEstadoSesion } from '../lib/estado-sesion';
import { useAlumno, type Alumno } from '../lib/alumno';
import { api } from '../lib/api';
import { auth, mensajeAuth } from '../lib/auth';
import { useSesion } from '../lib/sesion';
import { borrarDatosRemotos } from '../lib/sincronizacion';
import { olvidarEmpresas } from '../lib/useEmpresas';

const CAMPOS: { k: keyof Alumno; etiqueta: string; tipo: string; auto: string; ayuda?: string }[] = [
  { k: 'nombre', etiqueta: 'Nombre y apellidos', tipo: 'text', auto: 'name' },
  { k: 'telefono', etiqueta: 'Teléfono (opcional)', tipo: 'tel', auto: 'tel' },
  { k: 'github', etiqueta: 'GitHub (opcional)', tipo: 'url', auto: 'url', ayuda: 'Ej.: github.com/tu-usuario' },
  { k: 'portfolio', etiqueta: 'Portfolio (opcional)', tipo: 'url', auto: 'url' },
  { k: 'linkedin', etiqueta: 'LinkedIn (opcional)', tipo: 'url', auto: 'url', ayuda: 'Ej.: linkedin.com/in/tu-perfil' },
];

const NOMBRE_ROL: Record<string, string> = { alumno: 'Alumno/a', tutor: 'Tutor/a', superadmin: 'Superadmin', pendiente: 'Pendiente de aprobación', bloqueado: 'Sin acceso' };

export function Perfil() {
  const [alumno, setAlumno] = useAlumno();
  const { usuario, estado, salir } = useSesion();
  const [borrado, setBorrado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esAlumno = estado?.rol === 'alumno';
  const cambiar = (c: Partial<Alumno>) => {
    setBorrado(false);
    setAlumno((prev) => ({ ...prev, ...c }));
  };

  /** Borra la cuenta: datos sincronizados, usuario y rol en el servidor y datos del navegador. */
  async function borrar() {
    setConfirmando(false);
    setError(null);
    try {
      if (usuario) await borrarDatosRemotos(usuario.uid);
      await api.cuenta.accion('borrar-cuenta');
    } catch (e) {
      setError(mensajeAuth(e));
      return;
    }
    borrarTodo();
    borrarEstadoSesion();
    olvidarEmpresas();
    await auth.salir().catch(() => undefined);
    setBorrado(true);
    location.hash = '#/';
  }

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Mis datos</h1>
        <p className="mt-2 max-w-2xl text-tinta-suave">Se usan para rellenar tus correos y se guardan en tu cuenta, para verlos desde cualquier dispositivo.</p>
      </header>
      {borrado && <Aviso tono="info" titulo="Cuenta borrada">Hemos borrado tu cuenta y todos tus datos.</Aviso>}
      {estado && (
        <section aria-labelledby="titulo-cuenta" className="tarjeta flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
          <div className="min-w-0">
            <h2 id="titulo-cuenta" className="text-lg font-extrabold">Tu cuenta</h2>
            <p className="break-all">{estado.email}</p>
            <p className="text-sm text-tinta-suave">{NOMBRE_ROL[estado.rol ?? ''] ?? '—'}</p>
          </div>
          <button type="button" className="btn-secundario" onClick={() => void salir()}>Cerrar sesión</button>
        </section>
      )}

      {esAlumno && (
      <>
      <section aria-labelledby="titulo-contacto" className="tarjeta p-5 sm:p-8">
        <h2 id="titulo-contacto" className="mb-4 text-2xl font-extrabold">Tus datos para el correo</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {CAMPOS.map((c) => (
            <div key={c.k}>
              <label htmlFor={`campo-${c.k}`} className="etiqueta">{c.etiqueta}</label>
              <input id={`campo-${c.k}`} type={c.tipo === 'url' ? 'text' : c.tipo} inputMode={c.tipo === 'url' ? 'url' : undefined} autoComplete={c.auto} className="campo" value={String(alumno[c.k] ?? '')} onChange={(e) => cambiar({ [c.k]: e.target.value })} aria-describedby={c.ayuda ? `ayuda-${c.k}` : undefined} />
              {c.ayuda && <p id={`ayuda-${c.k}`} className="mt-1 text-sm text-tinta-suave">{c.ayuda}</p>}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="titulo-perfil" className="tarjeta p-5 sm:p-8">
        <h2 id="titulo-perfil" className="mb-4 text-2xl font-extrabold">Ciclo, perfiles, zona y modalidad</h2>
        <SelectorPerfil alumno={alumno} cambiar={cambiar} />
      </section>

      </>
      )}

      {estado?.rol !== 'superadmin' && (
      <section id="borrar" aria-labelledby="titulo-borrar" className="rounded-2xl border-2 border-peligro bg-terracota-claro p-5 sm:p-8">
        <h2 id="titulo-borrar" className="text-2xl font-extrabold">Borrar mi cuenta</h2>
        <p className="mt-2">Elimina tu cuenta y todos tus datos (perfil, enlaces y seguimiento), en el servidor y en este dispositivo.</p>
        {error && <p role="alert" className="mt-2 font-semibold text-peligro">{error}</p>}
        {confirmando ? (
          <div className="mt-4 flex flex-wrap items-center gap-3" role="group" aria-label="Confirmar borrado">
            <p className="font-semibold">Se borrarán tu cuenta, tu perfil, tus enlaces y todo tu seguimiento. ¿Continuar?</p>
            <button type="button" className="btn border-peligro bg-peligro text-white hover:bg-[#8a1f16]" onClick={borrar}>Sí, borrar mi cuenta</button>
            <button type="button" className="btn-secundario" onClick={() => setConfirmando(false)}>Cancelar</button>
          </div>
        ) : (
          <button type="button" className="btn mt-4 border-peligro bg-peligro text-white hover:bg-[#8a1f16]" onClick={() => setConfirmando(true)}>
            Borrar mi cuenta y mis datos
          </button>
        )}
      </section>
      )}
    </div>
  );
}
