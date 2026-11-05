import { useId, useState } from 'react';
import { config } from '../../config/ffe.config';
import { generarBorrador, textoParaCopiar, urlGmail, urlMailto, urlOutlook, type Borrador } from '../../shared/correo';
import type { Empresa } from '../../shared/schemas';
import type { Alumno } from '../lib/alumno';
import { enlaceUsuario, fechaHora } from '../lib/formato';
import { useSeguimiento } from '../lib/seguimiento';
import { Aviso } from './Estados';

export function GeneradorCorreo({ empresa, alumno }: { empresa: Empresa; alumno: Alumno }) {
  const id = useId();
  const { seguimiento, registrarContacto, actualizar } = useSeguimiento();
  const contactos = seguimiento[empresa.id]?.contactos ?? [];
  const tutor = alumno.ciclo ? config.tutores[alumno.ciclo] : null;
  const listo = Boolean(alumno.ciclo && alumno.modalidad && alumno.nombre.trim());

  const generar = (): Borrador | null =>
    alumno.ciclo && alumno.modalidad
      ? generarBorrador(empresa, {
          nombre: alumno.nombre.trim(),
          ciclo: alumno.ciclo,
          perfiles: alumno.perfiles,
          modalidad: alumno.modalidad,
          github: enlaceUsuario(alumno.github),
          portfolio: enlaceUsuario(alumno.portfolio),
          linkedin: enlaceUsuario(alumno.linkedin),
          telefono: alumno.telefono.trim(),
        })
      : null;

  const [borrador, setBorrador] = useState<Borrador | null>(generar);
  const [cvConfirmado, setCvConfirmado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [preguntarEnviado, setPreguntarEnviado] = useState(false);

  if (!listo || !borrador) {
    return (
      <Aviso tono="atencion" titulo="Completa tus datos para generar el correo">
        Necesitamos tu nombre, tu ciclo y tu modalidad. <a className="enlace" href="#/perfil">Ir a Mis datos</a>
      </Aviso>
    );
  }

  const cambiar = (c: Partial<Borrador>) => setBorrador({ ...borrador, ...c });
  const esFormulario = empresa.contacto.tipo === 'formulario';
  const superaMaximo = contactos.length >= config.maxContactosPorEmpresa;

  const abrir = (url: string) => {
    registrarContacto(empresa.id, empresa.nombre);
    setPreguntarEnviado(true);
    window.open(url, url.startsWith('mailto:') ? '_self' : '_blank', 'noopener');
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(esFormulario ? `${borrador.asunto}\n\n${borrador.cuerpo}` : textoParaCopiar(borrador));
      setMensaje('Copiado al portapapeles.');
      registrarContacto(empresa.id, empresa.nombre);
      setPreguntarEnviado(true);
    } catch {
      setMensaje('No se ha podido copiar. Selecciona el texto y cópialo a mano.');
    }
  };

  return (
    <section aria-labelledby={`${id}-titulo`} className="tarjeta overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-amarillo px-5 py-4">
        <h2 id={`${id}-titulo`} className="text-2xl font-extrabold">Tu correo para {empresa.nombre}</h2>
        <button type="button" className="btn-secundario min-h-10 py-1 text-sm" onClick={() => setBorrador(generar())}>
          Restablecer texto
        </button>
      </div>
      <div className="grid gap-4 p-5">
        {contactos.length > 0 && (
          <Aviso tono={superaMaximo ? 'peligro' : 'atencion'} titulo={superaMaximo ? `Ya has contactado ${contactos.length} veces con esta empresa` : 'Ya has contactado con esta empresa desde este dispositivo'}>
            Último contacto: {fechaHora(contactos.at(-1)!)}.{' '}
            {superaMaximo
              ? `El máximo orientativo es ${config.maxContactosPorEmpresa}. Antes de volver a escribir, habla con tu tutor/a.`
              : 'Si no te han respondido, espera al menos una semana antes de insistir.'}
          </Aviso>
        )}

        {esFormulario ? (
          <Aviso tono="info" titulo="Esta empresa recibe candidaturas por formulario">
            No publica un correo para candidaturas. Copia el texto, abre su formulario oficial y pégalo allí. Adjunta tu CV si el formulario lo permite.
          </Aviso>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`${id}-para`} className="etiqueta">Para</label>
              <input id={`${id}-para`} className="campo bg-hueso" value={borrador.para} readOnly />
            </div>
            <div>
              <label htmlFor={`${id}-cc`} className="etiqueta">CC (tutor/a de FFE)</label>
              <input id={`${id}-cc`} className="campo" value={borrador.cc} onChange={(e) => cambiar({ cc: e.target.value })} aria-describedby={`${id}-cc-ayuda`} />
              <p id={`${id}-cc-ayuda`} className="mt-1 text-sm text-tinta-suave">
                {tutor ? `${tutor.nombre} va en copia.` : 'Tutor/a de tu ciclo pendiente de asignar: pregunta en el centro a quién poner en copia.'}
              </p>
            </div>
          </div>
        )}
        <div>
          <label htmlFor={`${id}-asunto`} className="etiqueta">Asunto</label>
          <input id={`${id}-asunto`} className="campo" value={borrador.asunto} onChange={(e) => cambiar({ asunto: e.target.value })} />
        </div>
        <div>
          <label htmlFor={`${id}-cuerpo`} className="etiqueta">Mensaje (edítalo: los textos entre corchetes son para ti)</label>
          <textarea id={`${id}-cuerpo`} className="campo min-h-96 font-sans leading-relaxed" value={borrador.cuerpo} onChange={(e) => cambiar({ cuerpo: e.target.value })} />
          {borrador.cuerpo.includes('[') && <p className="mt-1 text-sm font-semibold text-terracota-oscuro">Quedan textos entre corchetes por completar.</p>}
        </div>

        <div className="rounded-xl border-2 border-tinta bg-terracota-claro p-4">
          <p className="font-bold">
            <span aria-hidden="true">📎 </span>Adjunta tu CV en PDF antes de enviar
          </p>
          <p className="mt-1 text-sm">Los enlaces abren un borrador sin adjuntos. Añade tu CV en PDF en tu programa de correo. Conecta FFE no sube ni guarda tu CV.</p>
          <label className="mt-3 flex min-h-11 items-center gap-2 font-semibold">
            <input type="checkbox" className="size-5 accent-tinta" checked={cvConfirmado} onChange={(e) => setCvConfirmado(e.target.checked)} />
            Entendido: adjuntaré mi CV en PDF y revisaré el correo antes de enviarlo
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {esFormulario ? (
            <>
              <button type="button" className="btn-primario" disabled={!cvConfirmado} onClick={copiar}>Copiar texto</button>
              <a className={`btn-amarillo ${cvConfirmado ? '' : 'pointer-events-none opacity-50'}`} aria-disabled={!cvConfirmado} tabIndex={cvConfirmado ? undefined : -1} href={empresa.contacto.formularioUrl} target="_blank" rel="noopener noreferrer">
                Abrir formulario oficial <span className="sr-only">(se abre en otra pestaña)</span>
              </a>
            </>
          ) : (
            <>
              <button type="button" className="btn-primario" disabled={!cvConfirmado} onClick={() => abrir(urlOutlook(borrador))}>Abrir en Outlook web</button>
              <button type="button" className="btn-primario" disabled={!cvConfirmado} onClick={() => abrir(urlGmail(borrador))}>Abrir en Gmail</button>
              <button type="button" className="btn-secundario" disabled={!cvConfirmado} onClick={() => abrir(urlMailto(borrador))}>Abrir en mi app de correo</button>
              <button type="button" className="btn-secundario" disabled={!cvConfirmado} onClick={copiar}>Copiar</button>
            </>
          )}
        </div>
        <p aria-live="polite" className="text-sm font-semibold">{mensaje}</p>
        {!cvConfirmado && <p className="text-sm text-tinta-suave">Marca la casilla del CV para activar los botones.</p>}

        {preguntarEnviado && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-salvia-claro p-4" role="status">
            <p className="font-semibold">¿Has enviado el correo?</p>
            <button type="button" className="btn-primario min-h-10 py-1" onClick={() => { actualizar(empresa.id, empresa.nombre, { estado: 'enviado' }); setPreguntarEnviado(false); setMensaje('Marcada como enviada en tu seguimiento.'); }}>
              Sí, marcar como enviado
            </button>
            <button type="button" className="btn-secundario min-h-10 py-1" onClick={() => setPreguntarEnviado(false)}>Todavía no</button>
          </div>
        )}
        <p className="text-xs text-tinta-suave">Conecta FFE nunca envía correos por ti: cada mensaje lo revisas y lo envías tú desde tu cuenta.</p>
      </div>
    </section>
  );
}
