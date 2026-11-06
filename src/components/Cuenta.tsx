import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { config } from '../../config/ffe.config';
import { api, ErrorApi, MODO_DEMO, type Rol } from '../lib/api';
import { auth, mensajeAuth } from '../lib/auth';
import { useSesion } from '../lib/sesion';
import { Aviso, Cargando, ErrorCaja } from './Estados';

type Tipo = 'alumno' | 'profesor';
const DOMINIO: Record<Tipo, string> = { alumno: config.cuentas.dominioAlumnado, profesor: config.cuentas.dominioProfesorado };

function Tarjeta({ titulo, color = 'bg-salvia', children }: { titulo: string; color?: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="tarjeta overflow-hidden">
        <div className={`${color} px-6 py-5`}>
          <h1 className="text-2xl font-extrabold">{titulo}</h1>
        </div>
        <div className="grid gap-4 p-6">{children}</div>
      </div>
    </div>
  );
}

/** Registro e inicio de sesión. */
export function FormularioCuenta() {
  const [modo, setModo] = useState<'entrar' | 'registro' | 'olvido'>('entrar');
  const [tipo, setTipo] = useState<Tipo>('alumno');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acepto, setAcepto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const dominioOk = (e: string) => e.trim().toLowerCase().endsWith('@' + DOMINIO[tipo]);

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    setError(null);
    setAviso(null);
    const e = email.trim().toLowerCase();
    if (modo === 'olvido') {
      setEnviando(true);
      try {
        await api.cuenta.accion('restablecer', { email: e });
        setAviso('Si hay una cuenta con ese correo, te hemos enviado un enlace para cambiar la contraseña. Revisa también el correo no deseado.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se ha podido enviar.');
      } finally {
        setEnviando(false);
      }
      return;
    }
    if (modo === 'registro') {
      if (!nombre.trim()) return setError('Escribe tu nombre y apellidos.');
      if (!dominioOk(e)) return setError(`Usa tu correo del centro @${DOMINIO[tipo]}.`);
      if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
      if (!acepto) return setError('Debes aceptar el aviso de privacidad.');
    }
    setEnviando(true);
    try {
      if (modo === 'registro') {
        await auth.registrar(e, password, nombre.trim());
        await enviarVerificacion(nombre.trim());
      } else {
        await auth.entrar(e, password);
      }
    } catch (err) {
      setError(mensajeAuth(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tarjeta titulo={modo === 'registro' ? 'Crear cuenta' : modo === 'olvido' ? 'Cambiar la contraseña' : 'Entrar en Conecta FFE'}>
      {modo !== 'olvido' && (
        <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Entrar o crear cuenta">
          {(
            [
              ['entrar', 'Iniciar sesión'],
              ['registro', 'Crear cuenta'],
            ] as const
          ).map(([m, t]) => (
            <button key={m} type="button" role="tab" aria-selected={modo === m} className={modo === m ? 'btn-primario' : 'btn-secundario'} onClick={() => setModo(m)}>
              {t}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={enviar} className="grid gap-4" noValidate>
        {modo === 'registro' && (
          <>
            <fieldset>
              <legend className="etiqueta">¿Quién eres?</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ['alumno', 'Soy alumno/a', `Correo @${DOMINIO.alumno}`],
                    ['profesor', 'Soy profesor/a tutor/a', `Correo @${DOMINIO.profesor}`],
                  ] as const
                ).map(([t, titulo, desc]) => (
                  <label key={t} className={`flex cursor-pointer gap-3 rounded-xl border-2 p-3 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-tinta ${tipo === t ? 'border-tinta bg-amarillo-claro' : 'border-linea bg-white'}`}>
                    <input type="radio" name="tipo-cuenta" className="mt-1 size-5 shrink-0 accent-tinta" checked={tipo === t} onChange={() => setTipo(t)} />
                    <span>
                      <strong>{titulo}</strong>
                      <span className="block text-sm text-tinta-suave">{desc}</span>
                    </span>
                  </label>
                ))}
              </div>
              {tipo === 'profesor' && <p className="mt-2 text-sm text-tinta-suave">La coordinación de FFE revisará tu solicitud antes de activar la sección de tutores.</p>}
            </fieldset>
            <div>
              <label htmlFor="c-nombre" className="etiqueta">Nombre y apellidos</label>
              <input id="c-nombre" className="campo" autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
          </>
        )}
        <div>
          <label htmlFor="c-email" className="etiqueta">Correo del centro</label>
          <input
            id="c-email"
            type="email"
            className="campo"
            autoComplete="email"
            placeholder={modo === 'registro' ? `nombre@${DOMINIO[tipo]}` : `nombre@${DOMINIO.alumno}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {modo !== 'olvido' && (
          <div>
            <label htmlFor="c-password" className="etiqueta">Contraseña{modo === 'registro' ? ' (mínimo 8 caracteres)' : ''}</label>
            <input id="c-password" type="password" className="campo" autoComplete={modo === 'registro' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        )}
        {modo === 'registro' && (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-tinta" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} />
            <span>
              He leído el <a className="enlace" href="#/privacidad">aviso de privacidad</a>: mi perfil y mi seguimiento se guardan en mi cuenta para verlos desde cualquier dispositivo.
            </span>
          </label>
        )}
        {error && (
          <p role="alert" className="font-semibold text-peligro">
            {error}
          </p>
        )}
        {aviso && (
          <p role="status" className="rounded-xl bg-salvia-claro p-3 font-semibold">
            {aviso}
          </p>
        )}
        <button type="submit" className="btn-primario" disabled={enviando}>
          {enviando ? 'Un momento…' : modo === 'registro' ? 'Crear cuenta' : modo === 'olvido' ? 'Enviar enlace' : 'Entrar'}
        </button>
        <button type="button" className="enlace w-fit text-sm" onClick={() => setModo(modo === 'olvido' ? 'entrar' : 'olvido')}>
          {modo === 'olvido' ? 'Volver a iniciar sesión' : '¿Has olvidado la contraseña?'}
        </button>
      </form>
      {auth.tipo === 'sin-configurar' && <Aviso tono="atencion">Las cuentas todavía no están configuradas en este sitio. Avisa a la coordinación de FFE.</Aviso>}
    </Tarjeta>
  );
}

/** Envía el correo de verificación desde el buzón del centro (o, si no está configurado, desde Firebase). */
async function enviarVerificacion(nombre?: string): Promise<{ demo?: boolean }> {
  try {
    const r = await api.cuenta.accion('verificacion', nombre ? { nombre } : {});
    return { demo: Boolean(r.demo) };
  } catch (e) {
    if (e instanceof ErrorApi && e.datos.usarFirebase) {
      await auth.verificacionFirebase();
      return {};
    }
    throw e;
  }
}

function PanelVerificar() {
  const { estado, refrescar, salir } = useSesion();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const yaVerificado = async () => {
    setOcupado(true);
    const e = await refrescar(true);
    setOcupado(false);
    if (!e?.verificado) setError('Todavía no consta como verificado. Abre el enlace del correo y vuelve a pulsar.');
  };

  return (
    <Tarjeta titulo="Confirma tu correo" color="bg-amarillo">
      <p>
        Te hemos enviado un enlace a <strong className="break-all">{estado?.email}</strong>. Ábrelo para activar tu cuenta y vuelve aquí. Si no lo ves, mira en el correo no deseado.
      </p>
      {MODO_DEMO && (
        <Aviso tono="info" titulo="Demostración">
          No se envía ningún correo.{' '}
          <button
            type="button"
            className="enlace"
            onClick={async () => {
              await api.cuenta.accion('demo-verificar');
              await refrescar();
            }}
          >
            Simular que abro el enlace
          </button>
        </Aviso>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primario" disabled={ocupado} onClick={yaVerificado}>
          Ya lo he verificado
        </button>
        <button
          type="button"
          className="btn-secundario"
          onClick={async () => {
            setError(null);
            try {
              await enviarVerificacion();
              setMensaje('Correo reenviado.');
            } catch (e) {
              setError(e instanceof Error ? e.message : 'No se ha podido reenviar.');
            }
          }}
        >
          Reenviar el correo
        </button>
        <button type="button" className="btn-secundario" onClick={() => void salir()}>
          Salir
        </button>
      </div>
      <p aria-live="polite" className="font-semibold">{mensaje}</p>
      {error && <p role="alert" className="font-semibold text-peligro">{error}</p>}
    </Tarjeta>
  );
}

function PanelCodigo() {
  const { estado, refrescar, salir } = useSesion();
  const [codigo, setCodigo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [pista, setPista] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const pedirCodigo = async () => {
    setError(null);
    setOcupado(true);
    try {
      const r = await api.cuenta.accion('enviar-codigo');
      setEnviado(true);
      if (r.codigoDemo) setPista(`Demostración: el código es ${String(r.codigoDemo)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido enviar el código.');
      if (e instanceof ErrorApi && e.estado === 429) setEnviado(true);
    } finally {
      setOcupado(false);
    }
  };

  const comprobar = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);
    setOcupado(true);
    try {
      await api.cuenta.accion('verificar-codigo', { codigo: codigo.trim() });
      await refrescar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Código incorrecto.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Tarjeta titulo="Verificación en dos pasos" color="bg-terracota">
      <p>
        Por seguridad, {estado?.rol === 'superadmin' ? 'la administración' : 'la sección de tutores'} pide un código que te enviamos a <strong className="break-all">{estado?.email}</strong>. Dura {config.cuentas.horasDobleFactor} horas en este navegador.
      </p>
      {!enviado ? (
        <button type="button" className="btn-primario" disabled={ocupado} onClick={pedirCodigo}>
          Enviarme el código
        </button>
      ) : (
        <form onSubmit={comprobar} className="grid gap-3">
          <div>
            <label htmlFor="c-codigo" className="etiqueta">Código de 6 cifras</label>
            <input id="c-codigo" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="campo font-mono text-xl tracking-[0.4em]" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))} />
          </div>
          <button type="submit" className="btn-primario" disabled={ocupado || codigo.length !== 6}>
            Comprobar
          </button>
          <button type="button" className="enlace w-fit text-sm" onClick={pedirCodigo}>
            Enviarme otro código
          </button>
        </form>
      )}
      {pista && <Aviso tono="info">{pista}</Aviso>}
      {error && <p role="alert" className="font-semibold text-peligro">{error}</p>}
      <button type="button" className="enlace w-fit text-sm" onClick={() => void salir()}>
        Salir
      </button>
    </Tarjeta>
  );
}

/**
 * Paso pendiente de la cuenta (entrar, verificar, aprobación, doble factor) o null si está lista.
 */
export function usePasoCuenta(): ReactNode {
  const { cargando, usuario, estado, error, refrescar, salir } = useSesion();
  if (cargando) return <Cargando texto="Comprobando tu sesión…" />;
  if (!usuario) return <FormularioCuenta />;
  if (!estado) return <ErrorCaja mensaje={error ?? 'No se ha podido comprobar tu cuenta.'} reintentar={() => void refrescar()} />;
  if (!estado.verificado) return <PanelVerificar />;
  if (!estado.rol) {
    return (
      <Tarjeta titulo="Correo no admitido" color="bg-terracota">
        <p>Solo pueden usar Conecta FFE el alumnado (@{config.cuentas.dominioAlumnado}) y el profesorado (@{config.cuentas.dominioProfesorado}) del centro.</p>
        <button type="button" className="btn-secundario w-fit" onClick={() => void salir()}>Salir</button>
      </Tarjeta>
    );
  }
  if (estado.rol === 'pendiente') {
    return (
      <Tarjeta titulo="Solicitud enviada" color="bg-amarillo">
        <p>Tu cuenta de profesor/a está creada. La coordinación de FFE revisará tu solicitud y te avisaremos por correo cuando esté activa la sección de tutores.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secundario" onClick={() => void refrescar()}>Comprobar de nuevo</button>
          <button type="button" className="btn-secundario" onClick={() => void salir()}>Salir</button>
        </div>
      </Tarjeta>
    );
  }
  if (estado.rol === 'bloqueado') {
    return (
      <Tarjeta titulo="Cuenta sin acceso" color="bg-terracota">
        <p>Tu cuenta no tiene acceso ahora mismo. Si crees que es un error, escribe a {config.centro.contactoPrivacidad}.</p>
        <button type="button" className="btn-secundario w-fit" onClick={() => void salir()}>Salir</button>
      </Tarjeta>
    );
  }
  if (estado.necesitaDobleFactor && !estado.dobleFactorOk) return <PanelCodigo />;
  return null;
}

/** Protege una sección: muestra el paso de cuenta pendiente o comprueba el rol. */
export function Puerta({ roles, children }: { roles: Rol[]; children: ReactNode }) {
  const paso = usePasoCuenta();
  const { estado } = useSesion();
  if (paso) return <>{paso}</>;
  if (!estado?.rol || !roles.includes(estado.rol)) {
    return (
      <Aviso tono="atencion" titulo="Sección no disponible para tu cuenta">
        {roles.includes('tutor') ? 'Es para el profesorado tutor aprobado.' : 'Es solo para la administración.'} <a className="enlace" href="#/">Volver al inicio</a>
      </Aviso>
    );
  }
  return <>{children}</>;
}

/** Pantalla #/entrar: lleva a cada uno a su sitio cuando la cuenta está lista. */
export function Entrar({ verificado }: { verificado: boolean }) {
  const { estado, refrescar } = useSesion();
  const paso = usePasoCuenta();

  useEffect(() => {
    if (verificado) void refrescar(true);
  }, [verificado, refrescar]);

  useEffect(() => {
    if (paso || !estado?.rol) return;
    const destino = estado.rol === 'superadmin' ? '#/admin' : estado.rol === 'tutor' ? '#/tutores' : '#/empresas';
    location.hash = destino;
  }, [paso, estado]);

  return paso ?? <Cargando texto="Entrando…" />;
}
