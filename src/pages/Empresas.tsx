import { useMemo, useState } from 'react';
import { config, perfilPorId, perfilesDe, zonaPorId } from '../../config/ffe.config';
import { etiquetaEncaje, puntuarEncaje } from '../../shared/encaje';
import type { Empresa } from '../../shared/schemas';
import { normalizar } from '../../shared/texto';
import { Acceso } from '../components/Acceso';
import { Aviso, ErrorCaja, Esqueleto, Vacio } from '../components/Estados';
import { useAlumno } from '../lib/alumno';
import { NOMBRE_TAMANO, fecha } from '../lib/formato';
import { COLOR_ESTADO, NOMBRE_ESTADO, useSeguimiento, type Seguimiento } from '../lib/seguimiento';
import { useEmpresas } from '../lib/useEmpresas';

type Orden = 'encaje' | 'nombre' | 'verificacion';

export function Empresas() {
  const { estado, recargar } = useEmpresas();
  if (estado.tipo === 'sin-acceso') return <Acceso alEntrar={recargar} />;
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
      {estado.tipo === 'listo' && <ListaEmpresas empresas={estado.empresas} />}
    </div>
  );
}

function ListaEmpresas({ empresas }: { empresas: Empresa[] }) {
  const [alumno] = useAlumno();
  const { seguimiento } = useSeguimiento();
  const [texto, setTexto] = useState('');
  const [perfil, setPerfil] = useState('');
  const [tamano, setTamano] = useState('');
  const [zona, setZona] = useState('');
  const [soloPracticas, setSoloPracticas] = useState(false);
  const [ocultarContactadas, setOcultarContactadas] = useState(false);
  const [orden, setOrden] = useState<Orden>('encaje');

  const ciclo = alumno.ciclo;
  const perfilesFiltro = useMemo(() => (perfil ? [perfil] : alumno.perfiles), [perfil, alumno.perfiles]);

  const resultado = useMemo(() => {
    const q = normalizar(texto);
    const lista = empresas
      .map((e) => ({ e, puntos: ciclo ? puntuarEncaje(e, { ciclo, perfiles: perfilesFiltro, zona: zona || alumno.zona }) : 50 }))
      .filter(({ e, puntos }) => {
        if (ciclo && puntos === 0) return false;
        if (perfil && !e.perfiles.includes(perfil)) return false;
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
      return b.puntos - a.puntos || a.e.nombre.localeCompare(b.e.nombre, 'es');
    });
    return lista;
  }, [empresas, ciclo, perfilesFiltro, perfil, tamano, zona, soloPracticas, ocultarContactadas, texto, orden, seguimiento, alumno.zona]);

  if (empresas.length === 0) {
    return (
      <Vacio titulo="Todavía no hay empresas verificadas">
        El directorio solo publica empresas cuya fuente se ha comprobado. Tu tutor/a lo está completando; vuelve a mirar en unos días o revisa mientras tanto las <a className="enlace" href="#/ofertas">ofertas</a>.
      </Vacio>
    );
  }

  const limpiar = () => {
    setTexto('');
    setPerfil('');
    setTamano('');
    setZona('');
    setSoloPracticas(false);
    setOcultarContactadas(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-start">
      {!ciclo && (
        <div className="lg:col-span-2">
          <Aviso tono="atencion" titulo="Elige tu ciclo y tu perfil">
            Así podremos ordenar las empresas por encaje contigo. <a className="enlace" href="#/">Elegir perfil</a>
          </Aviso>
        </div>
      )}
      <form className="tarjeta grid gap-4 p-4 lg:sticky lg:top-20" role="search" aria-label="Filtrar empresas" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="buscar" className="etiqueta">Buscar</label>
          <input id="buscar" type="search" className="campo" placeholder="Nombre, sector, tecnología…" value={texto} onChange={(e) => setTexto(e.target.value)} />
        </div>
        <div>
          <label htmlFor="f-perfil" className="etiqueta">Perfil</label>
          <select id="f-perfil" className="campo" value={perfil} onChange={(e) => setPerfil(e.target.value)}>
            <option value="">{alumno.perfiles.length ? 'Mis perfiles' : 'Todos'}</option>
            {(ciclo ? perfilesDe(ciclo) : config.perfiles).map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
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
        </div>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" className="size-5 accent-tinta" checked={soloPracticas} onChange={(e) => setSoloPracticas(e.target.checked)} />
          Solo con programa de prácticas publicado
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" className="size-5 accent-tinta" checked={ocultarContactadas} onChange={(e) => setOcultarContactadas(e.target.checked)} />
          Ocultar las que ya he contactado
        </label>
        <div>
          <label htmlFor="orden" className="etiqueta">Ordenar por</label>
          <select id="orden" className="campo" value={orden} onChange={(e) => setOrden(e.target.value as Orden)}>
            <option value="encaje">Encaje con mi perfil</option>
            <option value="nombre">Nombre</option>
            <option value="verificacion">Verificación más reciente</option>
          </select>
        </div>
        <button type="button" className="btn-secundario" onClick={limpiar}>Quitar filtros</button>
      </form>

      <section aria-labelledby="titulo-resultados">
        <h2 id="titulo-resultados" className="mb-3 text-lg font-bold" aria-live="polite">
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
                <TarjetaEmpresa empresa={e} puntos={ciclo ? puntos : null} seguimiento={seguimiento} />
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
        <span className="chip">{e.contacto.tipo === 'email' ? 'Correo verificado' : 'Formulario oficial'}</span>
        {e.perfiles.slice(0, 3).map((p) => (
          <span key={p} className={`chip ${p.startsWith('dam') ? 'bg-salvia-claro' : 'bg-terracota-claro'}`}>{perfilPorId(p)?.nombre}</span>
        ))}
        {seg && <span className={`chip border-tinta ${COLOR_ESTADO[seg.estado]}`}>{NOMBRE_ESTADO[seg.estado]}</span>}
      </div>
      <p className="mt-3 text-xs text-tinta-suave">
        Verificada el {fecha(e.verificacion.fecha)}
        {seg?.contactos.length ? ` · Contactada ${seg.contactos.length} ${seg.contactos.length === 1 ? 'vez' : 'veces'} desde este dispositivo` : ''}
      </p>
    </article>
  );
}
