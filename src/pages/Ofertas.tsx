import { useCallback, useEffect, useMemo, useState } from 'react';
import { perfilPorId, perfilesDe, config } from '../../config/ffe.config';
import { enlacesParaPerfil } from '../../shared/enlaces';
import type { CacheOfertas, Oferta } from '../../shared/schemas';
import { normalizar } from '../../shared/texto';
import { Aviso, ErrorCaja, Esqueleto, Vacio } from '../components/Estados';
import { useAlumno } from '../lib/alumno';
import { api } from '../lib/api';
import { NOMBRE_FUENTE, NOMBRE_JORNADA, NOMBRE_TIPO_OFERTA, fecha, fechaHora, haceDias } from '../lib/formato';

type Estado = { tipo: 'cargando' } | { tipo: 'error'; mensaje: string } | { tipo: 'listo'; datos: CacheOfertas };

export function Ofertas() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const obtener = useCallback(
    () =>
      api.ofertas().then(
        (datos) => setEstado({ tipo: 'listo', datos }),
        (e: unknown) => setEstado({ tipo: 'error', mensaje: e instanceof Error ? e.message : 'Error desconocido' }),
      ),
    [],
  );
  const cargar = () => {
    setEstado({ tipo: 'cargando' });
    void obtener();
  };
  useEffect(() => {
    void obtener();
  }, [obtener]);

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Ofertas de prácticas y primer empleo</h1>
        <p className="mt-2 max-w-3xl text-tinta-suave">
          Prácticas, becas, puestos junior y primer empleo del sector TIC en Madrid, de fuentes oficiales. Sin ofertas senior ni caducadas. Cada oferta enlaza a su publicación original.
        </p>
      </header>
      {estado.tipo === 'cargando' && (
        <>
          <p role="status" className="sr-only">Cargando ofertas…</p>
          <Esqueleto filas={3} />
        </>
      )}
      {estado.tipo === 'error' && <ErrorCaja titulo="No se han podido cargar las ofertas" mensaje={estado.mensaje} reintentar={cargar} />}
      {estado.tipo === 'listo' && <ListaOfertas datos={estado.datos} />}
      <EnlacesPortales />
    </div>
  );
}

function EstadoFuentes({ datos }: { datos: CacheOfertas }) {
  const fallidas = datos.fuentes.filter((f) => f.estado === 'error');
  return (
    <section aria-labelledby="titulo-fuentes" className="rounded-2xl border-2 border-linea bg-white p-4 text-sm">
      <h2 id="titulo-fuentes" className="font-bold">
        {datos.actualizado ? <>Actualizado el {fechaHora(datos.actualizado)} ({haceDias(datos.actualizado)})</> : 'Aún no se han descargado ofertas'}
      </h2>
      {datos.fuentes.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {datos.fuentes.map((f) => (
            <li key={f.id} className={`chip ${f.estado === 'ok' ? 'bg-salvia-claro' : f.estado === 'error' ? 'border-peligro bg-terracota-claro' : 'bg-hueso'}`}>
              {f.nombre}: {f.estado === 'ok' ? `${f.total} ofertas` : f.estado === 'error' ? `ha fallado${f.mensaje ? ` (${f.mensaje})` : ''}` : 'sin configurar'}
            </li>
          ))}
        </ul>
      )}
      {fallidas.length > 0 && (
        <p className="mt-2" role="note">
          {fallidas.map((f) => f.nombre).join(', ')} no {fallidas.length === 1 ? 'ha respondido' : 'han respondido'} en la última actualización: se muestran sus ofertas anteriores que siguen vigentes.
        </p>
      )}
    </section>
  );
}

function ListaOfertas({ datos }: { datos: CacheOfertas }) {
  const [alumno] = useAlumno();
  const [texto, setTexto] = useState('');
  const [perfil, setPerfil] = useState('');
  const [tipo, setTipo] = useState('');
  const [jornada, setJornada] = useState('');
  const [soloRemoto, setSoloRemoto] = useState(false);
  const [todasDelCiclo, setTodasDelCiclo] = useState(false);

  const lista = useMemo(() => {
    const q = normalizar(texto);
    const perfilesCiclo = alumno.ciclo ? perfilesDe(alumno.ciclo).map((p) => p.id as string) : [];
    const objetivo = perfil ? [perfil] : todasDelCiclo ? perfilesCiclo : alumno.perfiles;
    return datos.ofertas.filter((o) => {
      if (objetivo.length && !o.perfiles.some((p) => objetivo.includes(p))) return false;
      if (tipo && o.tipo !== tipo) return false;
      if (jornada && o.jornada !== jornada) return false;
      if (soloRemoto && !o.remoto) return false;
      if (q && !normalizar(`${o.titulo} ${o.empresa} ${o.ubicacion}`).includes(q)) return false;
      return true;
    });
  }, [datos.ofertas, texto, perfil, tipo, jornada, soloRemoto, todasDelCiclo, alumno.ciclo, alumno.perfiles]);

  return (
    <div className="grid gap-4">
      <EstadoFuentes datos={datos} />
      <form role="search" aria-label="Filtrar ofertas" className="tarjeta grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => e.preventDefault()}>
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="o-buscar" className="etiqueta">Buscar</label>
          <input id="o-buscar" type="search" className="campo" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Puesto, empresa…" />
        </div>
        <div>
          <label htmlFor="o-perfil" className="etiqueta">Perfil</label>
          <select id="o-perfil" className="campo" value={perfil} onChange={(e) => setPerfil(e.target.value)}>
            <option value="">{alumno.perfiles.length ? 'Mis perfiles' : 'Todos'}</option>
            {(alumno.ciclo ? perfilesDe(alumno.ciclo) : config.perfiles).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="o-tipo" className="etiqueta">Tipo</label>
          <select id="o-tipo" className="campo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(NOMBRE_TIPO_OFERTA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="o-jornada" className="etiqueta">Jornada</label>
          <select id="o-jornada" className="campo" value={jornada} onChange={(e) => setJornada(e.target.value)}>
            <option value="">Cualquiera</option>
            <option value="completa">Completa</option>
            <option value="parcial">Parcial</option>
          </select>
        </div>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" className="size-5 accent-tinta" checked={soloRemoto} onChange={(e) => setSoloRemoto(e.target.checked)} />
          Solo remoto o híbrido
        </label>
        {alumno.ciclo && !perfil && (
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" className="size-5 accent-tinta" checked={todasDelCiclo} onChange={(e) => setTodasDelCiclo(e.target.checked)} />
            Ver todos los perfiles de {alumno.ciclo}
          </label>
        )}
      </form>

      <h2 className="text-lg font-bold" aria-live="polite">{lista.length} {lista.length === 1 ? 'oferta' : 'ofertas'}</h2>
      {datos.ofertas.length === 0 ? (
        <Vacio titulo="Todavía no hay ofertas descargadas">
          Las ofertas se actualizan una vez al día desde las fuentes configuradas. Mientras tanto, usa las búsquedas en portales de abajo.
        </Vacio>
      ) : lista.length === 0 ? (
        <Vacio titulo="No hay ofertas con estos filtros">Prueba a quitar filtros o a ver todos los perfiles de tu ciclo.</Vacio>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {lista.map((o) => <li key={o.id}><TarjetaOferta o={o} /></li>)}
        </ul>
      )}
    </div>
  );
}

function TarjetaOferta({ o }: { o: Oferta }) {
  return (
    <article className="tarjeta flex h-full flex-col p-4">
      <div className="flex flex-wrap gap-1.5">
        <span className={`chip border-tinta ${o.tipo === 'practicas' || o.tipo === 'beca' ? 'bg-amarillo' : 'bg-salvia-claro'}`}>{NOMBRE_TIPO_OFERTA[o.tipo]}</span>
        {o.remoto && <span className="chip">Remoto / híbrido</span>}
      </div>
      <h3 className="mt-2 text-lg font-bold leading-snug">{o.titulo}</h3>
      <p className="font-semibold">{o.empresa}</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        <dt className="sr-only">Ubicación</dt><dd>📍 {o.ubicacion}</dd>
        <dt className="sr-only">Jornada</dt><dd>{NOMBRE_JORNADA[o.jornada]}</dd>
        <dt className="sr-only">Publicada</dt><dd>Publicada el {fecha(o.fechaPublicacion)}</dd>
        <dt className="sr-only">Fuente</dt><dd>Fuente: {NOMBRE_FUENTE[o.fuente] ?? o.fuente}</dd>
      </dl>
      {o.perfiles.length > 0 && <p className="mt-2 text-xs text-tinta-suave">{o.perfiles.map((p) => perfilPorId(p)?.nombre).join(' · ')}</p>}
      <div className="mt-auto pt-4">
        <a href={o.url} target="_blank" rel="noopener noreferrer nofollow" className="btn-secundario">
          Ver oferta original<span className="sr-only">: {o.titulo} (se abre en otra pestaña)</span>
        </a>
      </div>
    </article>
  );
}

function EnlacesPortales() {
  const [alumno] = useAlumno();
  const soloProbados = import.meta.env.PROD;
  const perfiles = alumno.perfiles.length ? alumno.perfiles : alumno.ciclo ? perfilesDe(alumno.ciclo).map((p) => p.id) : [];
  const conEnlaces = perfiles.map((p) => ({ p, enlaces: enlacesParaPerfil(p, { soloProbados }) })).filter((x) => x.enlaces.length);

  return (
    <section aria-labelledby="titulo-portales" className="grid gap-4">
      <div>
        <h2 id="titulo-portales" className="text-2xl font-extrabold">Busca también en los portales</h2>
        <p className="mt-1 max-w-3xl text-tinta-suave">
          LinkedIn, Indeed, Tecnoempleo y otros portales no permiten copiar sus ofertas. Te dejamos sus búsquedas ya filtradas por tu perfil y por Madrid.
        </p>
      </div>
      {perfiles.length === 0 ? (
        <Aviso tono="atencion">Elige tu ciclo y tus perfiles en la <a className="enlace" href="#/">portada</a> para ver las búsquedas.</Aviso>
      ) : conEnlaces.length === 0 ? (
        <Vacio titulo="Búsquedas pendientes de comprobar">El centro está comprobando que los enlaces a cada portal funcionan. Aparecerán aquí cuando estén revisados.</Vacio>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {conEnlaces.map(({ p, enlaces }) => (
            <div key={p} className="tarjeta p-4">
              <h3 className="font-bold">{perfilPorId(p)?.nombre}</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {enlaces.map((e) => (
                  <li key={e.id}>
                    <a className="chip min-h-11 border-tinta bg-white px-3 text-sm hover:bg-amarillo" href={e.url} target="_blank" rel="noopener noreferrer nofollow">
                      {e.nombre}{!e.probado && <span className="font-normal"> (sin comprobar)</span>}<span className="sr-only"> (se abre en otra pestaña)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
