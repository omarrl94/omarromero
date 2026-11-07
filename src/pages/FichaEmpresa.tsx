import { useEffect } from 'react';
import { perfilPorId, zonaPorId } from '../../config/ffe.config';
import { etiquetaEncaje, puntuarEncaje } from '../../shared/encaje';
import { ErrorCaja, Esqueleto, Vacio } from '../components/Estados';
import { AvisoEmpresa } from '../components/AvisoEmpresa';
import { GeneradorCorreo } from '../components/GeneradorCorreo';
import { useAlumno } from '../lib/alumno';
import { NOMBRE_TAMANO, NOMBRE_TIPO_CONTACTO, fecha } from '../lib/formato';
import { ESTADOS, NOMBRE_ESTADO, useSeguimiento } from '../lib/seguimiento';
import { useEmpresas } from '../lib/useEmpresas';

const NOMBRE_CONFIANZA = { alta: 'Alta', media: 'Media', baja: 'Baja' };

export function FichaEmpresa({ id, seccion }: { id: string; seccion?: string }) {
  const { estado, recargar } = useEmpresas();
  const [alumno] = useAlumno();
  const { seguimiento, actualizar } = useSeguimiento();
  const lista = estado.tipo === 'listo';

  // «Escribir correo» desde el listado: baja directamente al generador.
  useEffect(() => {
    if (lista && seccion === 'correo') document.getElementById('generador-correo')?.scrollIntoView({ block: 'start' });
  }, [lista, seccion, id]);

  if (estado.tipo === 'sin-acceso') return <ErrorCaja mensaje="Tu sesión ha caducado o no tienes acceso. Vuelve a entrar." reintentar={recargar} />;
  if (estado.tipo === 'cargando') return <Esqueleto filas={2} />;
  if (estado.tipo === 'error') return <ErrorCaja mensaje={estado.mensaje} reintentar={recargar} />;

  const e = estado.empresas.find((x) => x.id === id);
  if (!e) {
    return (
      <Vacio titulo="No encontramos esta empresa">
        Puede que se haya retirado del directorio. <a className="enlace" href="#/empresas">Volver al listado</a>
      </Vacio>
    );
  }
  const seg = seguimiento[e.id];
  const puntos = alumno.ciclo ? puntuarEncaje(e, { ciclo: alumno.ciclo, perfiles: alumno.perfiles, zona: alumno.zona }) : null;

  return (
    <div className="grid gap-6">
      <a href="#/empresas" className="enlace w-fit">← Todas las empresas</a>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <article className="grid gap-6">
          <header className="tarjeta p-5 sm:p-6">
            <div className="flex flex-wrap gap-1.5">
              {e.programaPracticas ? (
                <span className="chip border-tinta bg-amarillo">Programa de prácticas publicado</span>
              ) : (
                <span className="chip bg-hueso">Candidatura espontánea: no consta oferta de prácticas publicada</span>
              )}
              {puntos !== null && <span className="chip border-tinta bg-salvia-claro">Encaje {etiquetaEncaje(puntos)} ({puntos}/100)</span>}
            </div>
            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{e.nombre}</h1>
            <p className="mt-1 text-lg text-tinta-suave">{e.sector}</p>
            <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              <div><dt className="text-sm font-semibold text-tinta-suave">Tipo</dt><dd>{NOMBRE_TAMANO[e.tamano]}</dd></div>
              <div><dt className="text-sm font-semibold text-tinta-suave">Zona</dt><dd>{e.direccion ?? zonaPorId(e.zona)?.nombre}</dd></div>
              <div className="sm:col-span-2"><dt className="text-sm font-semibold text-tinta-suave">Por qué encaja</dt><dd>{e.motivoEncaje}</dd></div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-semibold text-tinta-suave">Perfiles recomendados</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {e.perfiles.map((p) => <span key={p} className={`chip ${p.startsWith('dam') ? 'bg-salvia-claro' : 'bg-terracota-claro'}`}>{perfilPorId(p)?.ciclo} · {perfilPorId(p)?.nombre}</span>)}
                </dd>
              </div>
            </dl>
            <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
              <a className="enlace" href={e.web} target="_blank" rel="noopener noreferrer">Web oficial<span className="sr-only"> (se abre en otra pestaña)</span></a>
              {e.empleoUrl && <a className="enlace" href={e.empleoUrl} target="_blank" rel="noopener noreferrer">Página de empleo<span className="sr-only"> (se abre en otra pestaña)</span></a>}
              {e.programaPracticas && <a className="enlace" href={e.programaPracticas.url} target="_blank" rel="noopener noreferrer">{e.programaPracticas.titulo}<span className="sr-only"> (se abre en otra pestaña)</span></a>}
            </p>
          </header>
          {/* La clave regenera el borrador si cambian los datos del alumno o la empresa. */}
          <div id="generador-correo" className="scroll-mt-20" />
          <GeneradorCorreo key={`${e.id}|${JSON.stringify(alumno)}`} empresa={e} alumno={alumno} />
        </article>

        <aside className="grid gap-4 lg:sticky lg:top-20">
          <section aria-labelledby="titulo-fuente" className="tarjeta p-5">
            <h2 id="titulo-fuente" className="text-lg font-bold">Contacto y fuente</h2>
            <dl className="mt-3 grid gap-2 text-sm">
              <div><dt className="font-semibold text-tinta-suave">{e.contacto.tipo === 'email' ? 'Correo público' : 'Formulario oficial'}</dt>
                <dd className="break-all">{e.contacto.tipo === 'email' ? e.contacto.email : <a className="enlace" href={e.contacto.formularioUrl} target="_blank" rel="noopener noreferrer">Abrir formulario</a>}</dd></div>
              <div><dt className="font-semibold text-tinta-suave">Tipo de contacto</dt><dd>{NOMBRE_TIPO_CONTACTO[e.contacto.tipoContacto]}</dd></div>
              <div><dt className="font-semibold text-tinta-suave">Dónde aparece</dt><dd className="break-all"><a className="enlace" href={e.contacto.fuenteUrl} target="_blank" rel="noopener noreferrer">{e.contacto.fuenteUrl}</a></dd></div>
              <div><dt className="font-semibold text-tinta-suave">Verificado</dt><dd>{fecha(e.verificacion.fecha)} · confianza {NOMBRE_CONFIANZA[e.verificacion.confianza].toLowerCase()}{e.verificacion.buzon === 'existe' ? ' · buzón confirmado por su servidor de correo' : e.verificacion.mx ? ' · dominio con correo activo (MX)' : ''}{e.contacto.tipo === 'formulario' ? ' · formulario comprobado (pide correo y mensaje o CV)' : ''}</dd></div>
            </dl>
            <div className="mt-3"><AvisoEmpresa empresaId={e.id} nombre={e.nombre} /></div>
            <p className="mt-3 text-xs text-tinta-suave">Si representas a la empresa, puedes <a className="enlace" href="#/privacidad">pedir la retirada</a>.</p>
          </section>
          <section aria-labelledby="titulo-seg" className="tarjeta p-5">
            <h2 id="titulo-seg" className="text-lg font-bold">Mi seguimiento</h2>
            <label htmlFor="estado-seg" className="etiqueta mt-3">Estado</label>
            <select id="estado-seg" className="campo" value={seg?.estado ?? ''} onChange={(ev) => actualizar(e.id, e.nombre, { estado: (ev.target.value || 'pendiente') as never })}>
              {!seg && <option value="">Sin empezar</option>}
              {ESTADOS.map((s) => <option key={s} value={s}>{NOMBRE_ESTADO[s]}</option>)}
            </select>
            <label htmlFor="notas-seg" className="etiqueta mt-3">Notas (solo en este dispositivo)</label>
            <textarea id="notas-seg" className="campo min-h-24" value={seg?.notas ?? ''} onChange={(ev) => actualizar(e.id, e.nombre, { notas: ev.target.value })} />
          </section>
        </aside>
      </div>
    </div>
  );
}
