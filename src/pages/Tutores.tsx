import { useMemo, useState } from 'react';
import { config, perfilPorId, perfilesDe, zonaPorId, type Ciclo } from '../../config/ffe.config';
import { csvCombinacion, enLotes, generarCorreoTutor, LINEA_BAJA, urlGmailCco, urlMailtoCco, urlOutlookCco, type BorradorCco } from '../../shared/correo-tutor';
import { urlGmail, urlMailto, urlOutlook } from '../../shared/correo';
import type { Empresa } from '../../shared/schemas';
import { normalizar } from '../../shared/texto';
import { BarraFiltros, ChipOpcion } from '../components/BarraFiltros';
import { Aviso, Cargando, ErrorCaja, Vacio } from '../components/Estados';
import { useLocal } from '../lib/almacen-local';
import { useEstadoSesion } from '../lib/estado-sesion';
import { fecha, NOMBRE_TAMANO, NOMBRE_TIPO_CONTACTO } from '../lib/formato';
import { useEmpresas } from '../lib/useEmpresas';

interface DatosTutorLocal {
  nombre: string;
  email: string;
  telefono: string;
  ciclo: Ciclo | null;
  alumnos: string;
}

const TUTOR_VACIO: DatosTutorLocal = { nombre: '', email: '', telefono: '', ciclo: null, alumnos: '' };

/** Registro local de envíos del tutor: empresa → fechas (ISO) en que se le escribió. */
type RegistroEnvios = Record<string, { nombre: string; fechas: string[] }>;

type Modo = 'cco' | 'uno' | 'csv';

const esCorreoRrhh = (e: Empresa) => e.contacto.tipo === 'email' && e.contacto.tipoContacto !== 'general';
const diasDesde = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);

export function Tutores() {
  const { estado, recargar } = useEmpresas();

  return (
    <div className="grid gap-6">
      <header>
        <p className="chip mb-3 border-tinta bg-salvia">Zona de tutores</p>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Escribir a las empresas de tu ciclo</h1>
        <p className="mt-2 max-w-3xl text-tinta-suave">
          Prepara un correo para pedir plazas de FFE y envíalo <strong className="text-tinta">desde tu propia cuenta</strong>: en copia oculta y por lotes, uno a uno personalizado, o con combinación de correspondencia. Conecta FFE no envía nada por su cuenta.
        </p>
      </header>
      {estado.tipo === 'cargando' && <Cargando texto="Cargando empresas…" />}
      {estado.tipo === 'error' && <ErrorCaja mensaje={estado.mensaje} reintentar={recargar} />}
      {estado.tipo === 'sin-acceso' && <ErrorCaja mensaje="Tu sesión ha caducado. Vuelve a entrar." reintentar={recargar} />}
      {estado.tipo === 'listo' && <PanelTutor empresas={estado.empresas} />}
    </div>
  );
}

function PanelTutor({ empresas }: { empresas: Empresa[] }) {
  const [tutor, setTutor] = useLocal<DatosTutorLocal>('tutor', TUTOR_VACIO);
  const [registro, setRegistro] = useLocal<RegistroEnvios>('tutor-envios', {});
  const cambiarTutor = (c: Partial<DatosTutorLocal>) => setTutor((prev) => ({ ...prev, ...c }));

  const elegirCiclo = (ciclo: Ciclo) => {
    const oficial = config.tutores[ciclo];
    setTutor((prev) => ({
      ...prev,
      ciclo,
      nombre: prev.nombre || oficial?.nombre || '',
      email: prev.email || oficial?.email || '',
    }));
  };

  return (
    <div className="grid gap-6">
      <section aria-labelledby="t-datos" className="tarjeta p-5 sm:p-6">
        <h2 id="t-datos" className="text-xl font-extrabold">1. Tus datos</h2>
        <fieldset className="mt-4">
          <legend className="etiqueta">Ciclo que tutorizas</legend>
          <div className="flex flex-wrap gap-2">
            {(['DAM', 'ASIR'] as Ciclo[]).map((c) => (
              <label key={c} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-2 px-4 py-2 font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-tinta ${tutor.ciclo === c ? (c === 'DAM' ? 'border-tinta bg-salvia' : 'border-tinta bg-terracota') : 'border-linea bg-white'}`}>
                <input type="radio" name="ciclo-tutor" className="sr-only" checked={tutor.ciclo === c} onChange={() => elegirCiclo(c)} />
                {c}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="t-nombre" className="etiqueta">Nombre y apellidos</label>
            <input id="t-nombre" className="campo" autoComplete="name" value={tutor.nombre} onChange={(e) => cambiarTutor({ nombre: e.target.value })} />
          </div>
          <div>
            <label htmlFor="t-email" className="etiqueta">Tu correo del centro</label>
            <input id="t-email" type="email" className="campo" autoComplete="email" value={tutor.email} onChange={(e) => cambiarTutor({ email: e.target.value })} />
          </div>
          <div>
            <label htmlFor="t-tel" className="etiqueta">Teléfono (opcional)</label>
            <input id="t-tel" type="tel" className="campo" autoComplete="tel" value={tutor.telefono} onChange={(e) => cambiarTutor({ telefono: e.target.value })} />
          </div>
          <div>
            <label htmlFor="t-alumnos" className="etiqueta">Alumnos que buscan plaza (opcional)</label>
            <input id="t-alumnos" inputMode="numeric" className="campo" value={tutor.alumnos} onChange={(e) => cambiarTutor({ alumnos: e.target.value })} />
          </div>
        </div>
      </section>

      {!tutor.ciclo ? (
        <Aviso tono="atencion">Elige el ciclo que tutorizas para ver sus empresas.</Aviso>
      ) : (
        <Envio empresas={empresas} tutor={{ ...tutor, ciclo: tutor.ciclo }} registro={registro} setRegistro={setRegistro} />
      )}
    </div>
  );
}

function Envio({
  empresas,
  tutor,
  registro,
  setRegistro,
}: {
  empresas: Empresa[];
  tutor: DatosTutorLocal & { ciclo: Ciclo };
  registro: RegistroEnvios;
  setRegistro: (f: (prev: RegistroEnvios) => RegistroEnvios) => void;
}) {
  const ciclo = tutor.ciclo;
  const [texto, setTexto] = useEstadoSesion('tutor.texto', '');
  const [rama, setRama] = useEstadoSesion('tutor.rama', 'todas');
  const [zona, setZona] = useEstadoSesion('tutor.zona', '');
  const [tamano, setTamano] = useEstadoSesion('tutor.tamano', '');
  const [soloRrhh, setSoloRrhh] = useEstadoSesion('tutor.rrhh', false);
  const [ocultarRecientes, setOcultarRecientes] = useEstadoSesion('tutor.ocultar', true);
  const [excluidas, setExcluidas] = useEstadoSesion<string[]>(`tutor.excluidas.${ciclo}`, []);
  const [modo, setModo] = useEstadoSesion<Modo>('tutor.modo', 'cco');
  const [confirmado, setConfirmado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const base = useMemo(() => generarCorreoTutor(tutor), [tutor]);
  const [asunto, setAsunto] = useEstadoSesion(`tutor.asunto.${ciclo}`, base.asunto);
  const [cuerpo, setCuerpo] = useEstadoSesion(`tutor.cuerpo.${ciclo}`, base.cuerpo);

  const reciente = (id: string) => {
    const ultima = registro[id]?.fechas.at(-1);
    return ultima ? diasDesde(ultima) < config.tutores_envio.diasEntreEnvios : false;
  };

  const delCiclo = useMemo(() => empresas.filter((e) => e.perfiles.some((p) => perfilPorId(p)?.ciclo === ciclo)), [empresas, ciclo]);

  const filtradas = useMemo(() => {
    const q = normalizar(texto);
    return delCiclo
      .filter((e) => (rama === 'todas' ? true : e.perfiles.includes(rama)))
      .filter((e) => !zona || e.zona === zona)
      .filter((e) => !tamano || e.tamano === tamano)
      .filter((e) => !soloRrhh || esCorreoRrhh(e))
      .filter((e) => !ocultarRecientes || !reciente(e.id))
      .filter((e) => !q || normalizar(`${e.nombre} ${e.sector}`).includes(q))
      .sort((a, b) => Number(esCorreoRrhh(b)) - Number(esCorreoRrhh(a)) || a.nombre.localeCompare(b.nombre, 'es'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delCiclo, texto, rama, zona, tamano, soloRrhh, ocultarRecientes, registro]);

  const conCorreo = filtradas.filter((e) => e.contacto.tipo === 'email');
  const soloFormulario = filtradas.filter((e) => e.contacto.tipo === 'formulario');
  const seleccionadas = conCorreo.filter((e) => !excluidas.includes(e.id));
  const lotes = enLotes(seleccionadas);

  const alternar = (id: string) => setExcluidas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const marcarEnviadas = (lista: Empresa[]) => {
    const ahora = new Date().toISOString();
    setRegistro((prev) => {
      const nuevo = { ...prev };
      for (const e of lista) nuevo[e.id] = { nombre: e.nombre, fechas: [...(prev[e.id]?.fechas ?? []), ahora] };
      return nuevo;
    });
    setMensaje(`${lista.length} ${lista.length === 1 ? 'empresa marcada' : 'empresas marcadas'} como contactadas el ${fecha(ahora)}.`);
  };

  const borradorLote = (lote: Empresa[]): BorradorCco => ({ para: tutor.email.trim(), cco: lote.map((e) => e.contacto.email!), asunto, cuerpo });

  const copiar = async (textoCopiar: string, ok: string) => {
    try {
      await navigator.clipboard.writeText(textoCopiar);
      setMensaje(ok);
    } catch {
      setMensaje('No se ha podido copiar. Selecciona el texto y cópialo a mano.');
    }
  };

  const descargarCsv = () => {
    const csv = csvCombinacion(
      seleccionadas.map((e) => ({
        empresa: e.nombre,
        email: e.contacto.email!,
        sector: e.sector,
        zona: zonaPorId(e.zona)?.nombre ?? '',
        perfiles: e.perfiles.map((p) => perfilPorId(p)?.nombre).filter(Boolean).join(', '),
      })),
    );
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `empresas-ffe-${ciclo.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMensaje('CSV descargado. Sigue las instrucciones de abajo para la combinación de correspondencia.');
  };

  const faltaEmail = !tutor.email.trim();
  const activos = [rama !== 'todas', zona, tamano, soloRrhh, !ocultarRecientes, texto].filter(Boolean).length;

  return (
    <>
      <section aria-labelledby="t-empresas" className="grid gap-4">
        <h2 id="t-empresas" className="text-xl font-extrabold">2. Empresas de {ciclo}</h2>
        <BarraFiltros
          etiqueta="Filtrar empresas para el envío"
          activos={activos}
          limpiar={() => {
            setTexto('');
            setRama('todas');
            setZona('');
            setTamano('');
            setSoloRrhh(false);
            setOcultarRecientes(true);
          }}
          verResultados={`Ver ${seleccionadas.length} seleccionadas`}
          idResultados="t-lista"
          busqueda={
            <>
              <label htmlFor="t-buscar" className="etiqueta">Buscar</label>
              <input id="t-buscar" type="search" className="campo" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nombre o sector…" />
            </>
          }
          opciones={
            <>
              <ChipOpcion marcado={soloRrhh} cambiar={setSoloRrhh}>Solo correo de RR. HH.</ChipOpcion>
              <ChipOpcion marcado={ocultarRecientes} cambiar={setOcultarRecientes}>Ocultar contactadas hace menos de {config.tutores_envio.diasEntreEnvios} días</ChipOpcion>
            </>
          }
        >
          <div className="col-span-2 lg:col-span-1">
            <label htmlFor="t-rama" className="etiqueta">Rama</label>
            <select id="t-rama" className="campo" value={rama} onChange={(e) => setRama(e.target.value)}>
              <option value="todas">Cualquier rama de {ciclo}</option>
              {perfilesDe(ciclo).map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="t-tamano" className="etiqueta">Tipo</label>
            <select id="t-tamano" className="campo" value={tamano} onChange={(e) => setTamano(e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(NOMBRE_TAMANO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="t-zona" className="etiqueta">Zona</label>
            <select id="t-zona" className="campo" value={zona} onChange={(e) => setZona(e.target.value)}>
              <option value="">Todas</option>
              {config.zonas.map((z) => <option key={z.id} value={z.id}>{z.nombre}</option>)}
            </select>
          </div>
        </BarraFiltros>

        <div id="t-lista" tabIndex={-1} className="tarjeta scroll-mt-20 p-4 outline-none sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-bold" aria-live="polite">
              {seleccionadas.length} de {conCorreo.length} empresas con correo seleccionadas
            </p>
            <div className="flex gap-2">
              <button type="button" className="btn-secundario min-h-10 py-1 text-sm" onClick={() => setExcluidas((prev) => prev.filter((id) => !conCorreo.some((e) => e.id === id)))}>
                Seleccionar todas
              </button>
              <button type="button" className="btn-secundario min-h-10 py-1 text-sm" onClick={() => setExcluidas((prev) => [...new Set([...prev, ...conCorreo.map((e) => e.id)])])}>
                Quitar selección
              </button>
            </div>
          </div>
          {conCorreo.length === 0 ? (
            <div className="mt-3"><Vacio titulo="Ninguna empresa con correo con estos filtros" /></div>
          ) : (
            <ul className="mt-3 grid max-h-[28rem] gap-1 overflow-y-auto pr-1 sm:grid-cols-2">
              {conCorreo.map((e) => {
                const ultima = registro[e.id]?.fechas.at(-1);
                return (
                  <li key={e.id}>
                    <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-hueso">
                      <input type="checkbox" className="mt-1 size-5 shrink-0 accent-tinta" checked={!excluidas.includes(e.id)} onChange={() => alternar(e.id)} />
                      <span className="min-w-0">
                        <span className="font-semibold">{e.nombre}</span>
                        <span className="block truncate text-sm text-tinta-suave">
                          {e.contacto.email} · {esCorreoRrhh(e) ? `Correo de ${NOMBRE_TIPO_CONTACTO[e.contacto.tipoContacto]}` : 'Correo general'}
                          {ultima ? ` · contactada el ${fecha(ultima)}` : ''}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          {soloFormulario.length > 0 && (
            <details className="mt-4 rounded-xl bg-hueso p-3">
              <summary className="cursor-pointer font-semibold">
                {soloFormulario.length} {soloFormulario.length === 1 ? 'empresa solo admite' : 'empresas solo admiten'} formulario (no entran en el envío)
              </summary>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {soloFormulario.map((e) => (
                  <li key={e.id}>
                    <a className="enlace text-sm" href={e.contacto.formularioUrl} target="_blank" rel="noopener noreferrer">
                      {e.nombre}<span className="sr-only"> (formulario, se abre en otra pestaña)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </section>

      <section aria-labelledby="t-mensaje" className="tarjeta overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-amarillo px-5 py-4">
          <h2 id="t-mensaje" className="text-xl font-extrabold">3. Mensaje</h2>
          <button
            type="button"
            className="btn-secundario min-h-10 py-1 text-sm"
            onClick={() => {
              setAsunto(base.asunto);
              setCuerpo(base.cuerpo);
            }}
          >
            Restablecer texto
          </button>
        </div>
        <div className="grid gap-4 p-5">
          <div>
            <label htmlFor="t-asunto" className="etiqueta">Asunto</label>
            <input id="t-asunto" className="campo" value={asunto} onChange={(e) => setAsunto(e.target.value)} />
          </div>
          <div>
            <label htmlFor="t-cuerpo" className="etiqueta">Texto (editable)</label>
            <textarea id="t-cuerpo" className="campo min-h-96 leading-relaxed" value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} />
            {cuerpo.includes('[') && <p className="mt-1 text-sm font-semibold text-terracota-oscuro">Quedan textos entre corchetes por completar.</p>}
            {!cuerpo.includes('BAJA') && <p className="mt-1 text-sm font-semibold text-peligro">Mantén la línea de baja al final del texto.</p>}
          </div>
        </div>
      </section>

      <section aria-labelledby="t-enviar" className="tarjeta p-5 sm:p-6">
        <h2 id="t-enviar" className="text-xl font-extrabold">4. Enviar desde tu cuenta</h2>
        <fieldset className="mt-4">
          <legend className="etiqueta">Forma de envío</legend>
          <div className="grid gap-2 md:grid-cols-3">
            {(
              [
                ['cco', 'En copia oculta, por lotes', `Un correo por cada ${config.tutores_envio.maxDestinatariosPorLote} empresas, todas en CCO.`],
                ['uno', 'Uno a uno, personalizado', 'Un correo por empresa, con su nombre en el saludo.'],
                ['csv', 'Combinación de correspondencia', 'CSV para Outlook o Word: un correo personalizado por empresa.'],
              ] as [Modo, string, string][]
            ).map(([valor, titulo, desc]) => (
              <label key={valor} className={`flex cursor-pointer gap-3 rounded-xl border-2 p-3 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-tinta ${modo === valor ? 'border-tinta bg-amarillo-claro' : 'border-linea bg-white'}`}>
                <input type="radio" name="modo-envio" className="mt-1 size-5 shrink-0 accent-tinta" checked={modo === valor} onChange={() => setModo(valor)} />
                <span>
                  <strong>{titulo}</strong>
                  <span className="block text-sm text-tinta-suave">{desc}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 rounded-xl border-2 border-tinta bg-terracota-claro p-4">
          <p className="font-bold">Antes de enviar</p>
          <ul className="mt-1 list-disc pl-5 text-sm">
            <li>Los correos salen de <strong>tu cuenta</strong>: revisa el texto y el número de destinatarios.</li>
            <li>Las empresas van siempre en <strong>CCO</strong> (copia oculta): ninguna ve las direcciones de las demás.</li>
            <li>No vuelvas a escribir a la misma empresa en menos de {config.tutores_envio.diasEntreEnvios} días y respeta las bajas.</li>
          </ul>
          <label className="mt-3 flex min-h-11 items-center gap-2 font-semibold">
            <input type="checkbox" className="size-5 accent-tinta" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} />
            He revisado el texto y los destinatarios, y envío desde mi cuenta
          </label>
        </div>

        {faltaEmail && <div className="mt-4"><Aviso tono="atencion">Escribe tu correo del centro en «Tus datos»: va en «Para» y las empresas en CCO.</Aviso></div>}
        <p aria-live="polite" className="mt-3 text-sm font-semibold">{mensaje}</p>

        {seleccionadas.length === 0 ? (
          <div className="mt-4"><Vacio titulo="No hay empresas seleccionadas" /></div>
        ) : modo === 'cco' ? (
          <ol className="mt-4 grid gap-3">
            {lotes.map((lote, i) => {
              const b = borradorLote(lote);
              const listo = confirmado && !faltaEmail;
              const enlace = (href: string, txt: string, clase: string, externo = true) => (
                <a
                  href={href}
                  aria-disabled={!listo}
                  tabIndex={listo ? undefined : -1}
                  className={`${clase} min-h-10 py-1 text-sm ${listo ? '' : 'pointer-events-none opacity-50'}`}
                  onClick={(ev) => (listo ? undefined : ev.preventDefault())}
                  {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {txt}<span className="sr-only"> (lote {i + 1})</span>
                </a>
              );
              return (
                <li key={i} className="rounded-xl border-2 border-linea p-4">
                  <p className="font-bold">
                    Lote {i + 1} de {lotes.length} · {lote.length} {lote.length === 1 ? 'empresa' : 'empresas'}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-tinta-suave">{lote.map((e) => e.nombre).join(', ')}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {enlace(urlOutlookCco(b), 'Abrir en Outlook web', 'btn-primario')}
                    {enlace(urlGmailCco(b), 'Abrir en Gmail', 'btn-primario')}
                    {enlace(urlMailtoCco(b), 'App de correo', 'btn-secundario', false)}
                    <button type="button" className="btn-secundario min-h-10 py-1 text-sm" onClick={() => copiar(b.cco.join('; '), `Copiadas ${b.cco.length} direcciones del lote ${i + 1}: pégalas en CCO.`)}>
                      Copiar direcciones (CCO)
                    </button>
                    <button type="button" className="btn-amarillo min-h-10 py-1 text-sm" disabled={!confirmado} onClick={() => marcarEnviadas(lote)}>
                      Marcar lote como enviado
                    </button>
                  </div>
                </li>
              );
            })}
            <li>
              <button type="button" className="btn-secundario min-h-10 py-1 text-sm" onClick={() => copiar(`${asunto}\n\n${cuerpo}`, 'Asunto y texto copiados.')}>
                Copiar asunto y texto
              </button>
              <p className="mt-2 text-sm text-tinta-suave">Si la app de correo no muestra el texto completo, copia el texto y las direcciones y pégalos a mano.</p>
            </li>
          </ol>
        ) : modo === 'uno' ? (
          <ul className="mt-4 grid gap-2">
            {seleccionadas.map((e) => {
              const personal = generarCorreoTutor(tutor, { nombre: e.nombre, sector: e.sector });
              // Respeta las ediciones del tutor: solo se cambia el saludo y la frase de presentación.
              const cuerpoPersonal = cuerpo === base.cuerpo ? personal.cuerpo : cuerpo.replace(/^Buenos días:/, `Estimado equipo de ${e.nombre}:`);
              const b = { para: e.contacto.email!, cc: '', asunto, cuerpo: cuerpoPersonal };
              const listo = confirmado;
              return (
                <li key={e.id} className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-linea p-3">
                  <span className="min-w-0 flex-1">
                    <strong>{e.nombre}</strong>
                    <span className="block truncate text-sm text-tinta-suave">{e.contacto.email}{registro[e.id] ? ` · contactada el ${fecha(registro[e.id].fechas.at(-1)!)}` : ''}</span>
                  </span>
                  {(
                    [
                      [urlOutlook(b), 'Outlook', true],
                      [urlGmail(b), 'Gmail', true],
                      [urlMailto(b), 'App', false],
                    ] as [string, string, boolean][]
                  ).map(([href, txt, externo]) => (
                    <a
                      key={txt}
                      href={href}
                      aria-disabled={!listo}
                      tabIndex={listo ? undefined : -1}
                      className={`btn-secundario min-h-10 py-1 text-sm ${listo ? '' : 'pointer-events-none opacity-50'}`}
                      onClick={(ev) => (listo ? marcarEnviadas([e]) : ev.preventDefault())}
                      {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {txt}<span className="sr-only">: escribir a {e.nombre}</span>
                    </a>
                  ))}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-4 grid gap-3">
            <button type="button" className="btn-primario w-fit" disabled={!confirmado} onClick={descargarCsv}>
              Descargar CSV ({seleccionadas.length} empresas)
            </button>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              <li>En Word: <strong>Correspondencia → Iniciar combinación → Mensajes de correo electrónico</strong>.</li>
              <li><strong>Seleccionar destinatarios → Usar una lista existente</strong> y elige el CSV.</li>
              <li>Pega el texto de arriba y sustituye «Buenos días:» por el campo <strong>«saludo»</strong> (Insertar campo combinado).</li>
              <li><strong>Finalizar y combinar → Enviar mensajes de correo</strong>: campo «Para» = <strong>email</strong> y escribe el asunto. Outlook enviará un correo por empresa.</li>
              <li>Vuelve aquí y pulsa «Marcar como enviadas».</li>
            </ol>
            <button type="button" className="btn-amarillo w-fit" disabled={!confirmado} onClick={() => marcarEnviadas(seleccionadas)}>
              Marcar {seleccionadas.length} como enviadas
            </button>
          </div>
        )}
        <p className="mt-4 text-xs text-tinta-suave">{LINEA_BAJA.replace('respondan a este correo', 'las empresas pueden responder')} Si una empresa pide la baja, solicita su retirada del directorio.</p>
      </section>
    </>
  );
}
