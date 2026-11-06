import { useMemo } from 'react';
import { useEstadoSesion, useRecordarScroll } from '../lib/estado-sesion';
import { config, perfilPorId, zonaPorId } from '../../config/ffe.config';
import { etiquetaEncaje, puntuarEncaje } from '../../shared/encaje';
import type { Empresa } from '../../shared/schemas';
import { normalizar } from '../../shared/texto';
import { BarraFiltros, ChipOpcion } from '../components/BarraFiltros';
import { coincidePerfil, FiltroPerfil, perfilesParaEncaje, valorInicial } from '../components/FiltroPerfil';
import { Aviso, ErrorCaja, Esqueleto, Vacio } from '../components/Estados';
import { useAlumno } from '../lib/alumno';
import { NOMBRE_TAMANO, NOMBRE_TIPO_CONTACTO, fecha } from '../lib/formato';
import { COLOR_ESTADO, NOMBRE_ESTADO, useSeguimiento, type Seguimiento } from '../lib/seguimiento';
import { useEmpresas } from '../lib/useEmpresas';

type Orden = 'encaje' | 'nombre' | 'verificacion';
type Contacto = '' | 'rrhh' | 'email' | 'formulario';

/** Correo de RR. HH., talento o prácticas: el mejor canal para una candidatura. */
const esCorreoRrhh = (e: Empresa) => e.contacto.tipo === 'email' && e.contacto.tipoContacto !== 'general';
/** Prioridad al ordenar: correo de RR. HH. > correo general > formulario. */
const bonusContacto = (e: Empresa) => (esCorreoRrhh(e) ? 15 : e.contacto.tipo === 'email' ? 5 : 0);

export function Empresas() {
  const { estado, recargar } = useEmpresas();
  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Empresas para tu FFE</h1>
        <p className="mt-2 max-w-3xl text-tinta-suave">
          Cada empresa tiene su fuente y su fecha de verificación. Si no ha publicado un programa de prácticas, aparece como <strong className="text-tinta">candidatura espontánea</strong>: escribes tú para preguntar.
        </p>
      </header>
      {estado.tipo === 'cargando' && (
        <>
          <p role="status" className="sr-only">Cargando empresas…</p>
          <Esqueleto filas={4} />
        </>
      )}
      {estado.tipo === 'error' && <ErrorCaja mensaje={estado.mensaje} reintentar={recargar} />}
      {estado.tipo === 'sin-acceso' && <ErrorCaja mensaje="Tu sesión ha caducado o no tienes acceso. Vuelve a entrar." reintentar={recargar} />}
      {estado.tipo === 'listo' && <ListaEmpresas empresas={estado.empresas} />}
    </div>
  );
}

function ListaEmpresas({ empresas }: { empresas: Empresa[] }) {
  const [alumno] = useAlumno();
  const { seguimiento } = useSeguimiento();
  const [texto, setTexto] = useEstadoSesion('empresas.texto', '');
  // null = «automático»: sigue el perfil del alumno hasta que lo cambie a mano.
  const [perfilElegido, setPerfil] = useEstadoSesion<string | null>('empresas.perfil', null);
  const perfil = perfilElegido ?? valorInicial(alumno);
  useRecordarScroll('empresas', empresas.length > 0);
  const [contacto, setContacto] = useEstadoSesion<Contacto>('empresas.contacto', '');
  const [tamano, setTamano] = useEstadoSesion('empresas.tamano', '');
  const [zona, setZona] = useEstadoSesion('empresas.zona', '');
  const [soloPracticas, setSoloPracticas] = useEstadoSesion('empresas.practicas', false);
  const [ocultarContactadas, setOcultarContactadas] = useEstadoSesion('empresas.ocultar', false);
  const [orden, setOrden] = useEstadoSesion<Orden>('empresas.orden', 'encaje');

  const ciclo = alumno.ciclo;

  const resultado = useMemo(() => {
    const q = normalizar(texto);
    const perfilesFiltro = perfilesParaEncaje(perfil, alumno);
    const cicloEncaje = perfilPorId(perfil)?.ciclo ?? ciclo;
    const lista = empresas
      .map((e) => ({ e, puntos: cicloEncaje ? puntuarEncaje(e, { ciclo: cicloEncaje, perfiles: perfilesFiltro, zona: zona || alumno.zona }) : 0 }))
      .filter(({ e }) => {
        if (!coincidePerfil(e.perfiles, perfil, alumno, true)) return false;
        if (contacto === 'rrhh' ? !esCorreoRrhh(e) : contacto && e.contacto.tipo !== contacto) return false;
        if (tamano && e.tamano !== tamano) return false;
        if (zona && e.zona !== zona) return false;
        if (soloPracticas && !e.programaPracticas) return false;
        if (ocultarContactadas && seguimiento[e.id]?.contactos.length) return false;
        if (q && !normalizar(`${e.nombre} ${e.sector} ${e.motivoEncaje}`).includes(q)) return false;
        return true;
      });
    lista.sort((a, b) => {
      if (orden === 'nombre') return a.e.nombre.localeCompare(b.e.nombre, 'es');
      if (orden === 'verificacion') return b.e.verificacion.fecha.localeCompare(a.e.verificacion.fecha);
      return b.puntos + bonusContacto(b.e) - (a.puntos + bonusContacto(a.e)) || a.e.nombre.localeCompare(b.e.nombre, 'es');
    });
    return lista;
  }, [empresas, ciclo, perfil, contacto, tamano, zona, soloPracticas, ocultarContactadas, texto, orden, seguimiento, alumno]);

  if (empresas.length === 0) {
    return (
      <Vacio titulo="Todavía no hay empresas verificadas">
        El directorio solo publica empresas cuya fuente se ha comprobado. Tu tutor/a lo está completando; vuelve a mirar en unos días o revisa mientras tanto las <a className="enlace" href="#/ofertas">ofertas</a>.
      </Vacio>
    );
  }

  const limpiar = () => {
    setTexto('');
    setPerfil('todos');
    setContacto('');
    setTamano('');
    setZona('');
    setSoloPracticas(false);
    setOcultarContactadas(false);
  };

  const activos = [perfil !== valorInicial(alumno), contacto, tamano, zona, soloPracticas, ocultarContactadas, texto].filter(Boolean).length;

  return (
    <div className="grid gap-6">
      {!ciclo && (
        <Aviso tono="atencion" titulo="Elige tu ciclo y tu perfil">
          Así podremos ordenar las empresas por encaje contigo. <a className="enlace" href="#/">Elegir perfil</a>
        </Aviso>
      )}
      <BarraFiltros
        etiqueta="Filtrar empresas"
        activos={activos}
        verResultados={`Ver ${resultado.length} ${resultado.length === 1 ? 'empresa' : 'empresas'}`}
        idResultados="titulo-resultados"
        limpiar={limpiar}
        busqueda={
          <>
            <label htmlFor="buscar" className="etiqueta">Buscar</label>
            <input id="buscar" type="search" className="campo" placeholder="Nombre, sector, tecnología…" value={texto} onChange={(e) => setTexto(e.target.value)} />
          </>
        }
        opciones={
          <>
            <ChipOpcion marcado={soloPracticas} cambiar={setSoloPracticas}>Con programa de prácticas</ChipOpcion>
            <ChipOpcion marcado={ocultarContactadas} cambiar={setOcultarContactadas}>Ocultar las ya contactadas</ChipOpcion>
          </>
        }
      >
        <FiltroPerfil id="f-perfil" valor={perfil} cambiar={setPerfil} alumno={alumno} />
        <div className="col-span-2 lg:col-span-1">
          <label htmlFor="f-contacto" className="etiqueta">Contacto</label>
          <select id="f-contacto" className="campo" value={contacto} onChange={(e) => setContacto(e.target.value as Contacto)}>
            <option value="">Correo o formulario</option>
            <option value="rrhh">Correo de RR. HH.</option>
            <option value="email">Cualquier correo</option>
            <option value="formulario">Solo formulario</option>
          </select>
        </div>
        <div>
          <label htmlFor="f-tamano" className="etiqueta">Tipo</label>
          <select id="f-tamano" className="campo" value={tamano} onChange={(e) => setTamano(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(NOMBRE_TAMANO).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-zona" className="etiqueta">Zona</label>
          <select id="f-zona" className="campo" value={zona} onChange={(e) => setZona(e.target.value)}>
            <option value="">Todas</option>
            {config.zonas.map((z) => (
              <option key={z.id} value={z.id}>{z.nombre}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2 lg:col-span-1">
          <label htmlFor="orden" className="etiqueta">Ordenar por</label>
          <select id="orden" className="campo" value={orden} onChange={(e) => setOrden(e.target.value as Orden)}>
            <option value="encaje">Recomendadas</option>
            <option value="nombre">Nombre</option>
            <option value="verificacion">Verificación más reciente</option>
          </select>
        </div>
      </BarraFiltros>

      <section aria-labelledby="titulo-resultados">
        <h2 id="titulo-resultados" tabIndex={-1} className="mb-3 scroll-mt-20 text-lg font-bold outline-none" aria-live="polite">
          {resultado.length} {resultado.length === 1 ? 'empresa' : 'empresas'}
        </h2>
        {resultado.length === 0 ? (
          <Vacio titulo="Ninguna empresa con estos filtros">
            <button type="button" className="enlace" onClick={limpiar}>Quitar filtros</button>
          </Vacio>
        ) : (
          <ul className="grid gap-3">
            {resultado.map(({ e, puntos }) => (
              <li key={e.id}>
                <TarjetaEmpresa empresa={e} puntos={puntos > 0 ? puntos : null} seguimiento={seguimiento} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TarjetaEmpresa({ empresa: e, puntos, seguimiento }: { empresa: Empresa; puntos: number | null; seguimiento: Seguimiento }) {
  const seg = seguimiento[e.id];
  const nivel = puntos !== null ? etiquetaEncaje(puntos) : null;
  const colorEncaje = { alto: 'bg-salvia', medio: 'bg-amarillo-claro', bajo: 'bg-hueso' };
  return (
    <article className="tarjeta relative p-4 transition hover:shadow-[5px_5px_0_var(--color-tinta)] sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold">
            <a href={`#/empresas/${e.id}`} className="after:absolute after:inset-0 hover:underline">{e.nombre}</a>
          </h3>
          <p className="text-tinta-suave">
            {e.sector} · {NOMBRE_TAMANO[e.tamano]} · {zonaPorId(e.zona)?.nombre}
          </p>
        </div>
        {nivel && puntos !== null && (
          <span className={`chip border-tinta text-sm ${colorEncaje[nivel]}`}>
            Encaje {nivel} <span className="sr-only">({puntos} sobre 100)</span>
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2">{e.motivoEncaje}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {e.programaPracticas ? (
          <span className="chip border-tinta bg-amarillo">Programa de prácticas publicado</span>
        ) : (
          <span className="chip bg-hueso">Candidatura espontánea</span>
        )}
        {esCorreoRrhh(e) ? (
          <span className="chip border-tinta bg-salvia">Correo de {NOMBRE_TIPO_CONTACTO[e.contacto.tipoContacto]}</span>
        ) : (
          <span className="chip">{e.contacto.tipo === 'email' ? 'Correo general' : 'Formulario oficial'}</span>
        )}
        {e.perfiles.slice(0, 3).map((p) => (
          <span key={p} className={`chip ${p.startsWith('dam') ? 'bg-salvia-claro' : 'bg-terracota-claro'}`}>{perfilPorId(p)?.nombre}</span>
        ))}
        {seg && <span className={`chip border-tinta ${COLOR_ESTADO[seg.estado]}`}>{NOMBRE_ESTADO[seg.estado]}</span>}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-tinta-suave">
          Verificada el {fecha(e.verificacion.fecha)}
          {seg?.contactos.length ? ` · Contactada ${seg.contactos.length} ${seg.contactos.length === 1 ? 'vez' : 'veces'} desde este dispositivo` : ''}
        </p>
        {/* z-10: por encima del enlace que cubre toda la tarjeta */}
        <div className="relative z-10 flex flex-wrap gap-2">
          {e.contacto.tipo === 'email' ? (
            <a href={`#/empresas/${e.id}/correo`} className="btn-amarillo min-h-10 py-1 text-sm">
              Escribir correo<span className="sr-only"> a {e.nombre}</span>
            </a>
          ) : (
            <>
              <a href={`#/empresas/${e.id}/correo`} className="btn-secundario min-h-10 py-1 text-sm">
                Preparar texto<span className="sr-only"> para {e.nombre}</span>
              </a>
              <a href={e.contacto.formularioUrl} target="_blank" rel="noopener noreferrer" className="btn-amarillo min-h-10 py-1 text-sm">
                Abrir formulario<span className="sr-only"> de {e.nombre} (se abre en otra pestaña)</span>
              </a>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
