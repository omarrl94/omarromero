import { useState, type FormEvent } from 'react';
import { config } from '../../config/ffe.config';
import { enviarRetirada } from '../lib/api';

export function Privacidad() {
  const [estado, setEstado] = useState<'inicial' | 'enviando' | 'ok' | 'error'>('inicial');
  const [datos, setDatos] = useState({ empresa: '', email: '', motivo: '' });
  const mailto = `mailto:${config.centro.contactoPrivacidad}?subject=${encodeURIComponent('Conecta FFE: solicitud de retirada')}&body=${encodeURIComponent(`Empresa: ${datos.empresa}\nMotivo: ${datos.motivo}`)}`;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEstado('enviando');
    try {
      await enviarRetirada(datos);
      setEstado('ok');
    } catch {
      setEstado('error');
    }
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      <header>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Privacidad y retirada de empresas</h1>
      </header>

      <section aria-labelledby="t-alumnado" className="grid gap-3 leading-relaxed">
        <h2 id="t-alumnado" className="text-2xl font-extrabold">Para el alumnado</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>No hay registro de usuarios ni analítica.</strong> No usamos cookies de seguimiento ni herramientas de terceros que te sigan.</li>
          <li><strong>Tus datos se quedan en tu navegador</strong> (localStorage): nombre, teléfono, enlaces, perfil, modalidad y seguimiento. No se envían al servidor. Puedes borrarlos cuando quieras en <a className="enlace" href="#/perfil">Mis datos</a>.</li>
          <li><strong>Tu CV nunca se sube.</strong> Lo adjuntas tú en tu programa de correo.</li>
          <li>Para entrar al directorio se usa una <strong>cookie técnica</strong> de sesión (12 horas) que solo indica que has introducido el código del centro. Para limitar intentos se guarda temporalmente un resumen cifrado (hash) de tu IP, nunca la IP en claro.</li>
          <li><strong>Los correos los envías tú.</strong> Conecta FFE solo prepara un borrador.</li>
        </ul>
      </section>

      <section aria-labelledby="t-empresas" className="grid gap-3 leading-relaxed">
        <h2 id="t-empresas" className="text-2xl font-extrabold">Para las empresas</h2>
        <p>
          El directorio lo mantiene el {config.centro.nombre} para que su alumnado de 2.º de DAM y ASIR solicite plaza de Formación en Empresa. Solo incluye datos de contacto <strong>corporativos que la propia empresa publica</strong> (en su web o en una fuente oficial), con la URL de origen y la fecha de comprobación. No incluimos correos personales de empleados ni correos deducidos. El acceso está restringido al alumnado con un código del centro y la web no se indexa en buscadores.
        </p>
        <p>El alumnado redacta y envía cada correo de forma individual, con un máximo recomendado de {config.maxContactosPorEmpresa} contactos por empresa. El profesorado tutor de FFE puede escribir a varias empresas a la vez desde su propia cuenta del centro: siempre en copia oculta, por lotes de {config.tutores_envio.maxDestinatariosPorLote} como máximo, sin repetir empresa en menos de {config.tutores_envio.diasEntreEnvios} días y con opción de darse de baja respondiendo «BAJA». Conecta FFE no envía correos por sí mismo.</p>
      </section>

      <section aria-labelledby="t-retirada" className="tarjeta p-5 sm:p-8">
        <h2 id="t-retirada" className="text-2xl font-extrabold">Solicitar la retirada de una empresa</h2>
        <p className="mt-2">La retiraremos del directorio en un plazo máximo de 10 días hábiles. No hace falta justificarlo.</p>
        {estado === 'ok' ? (
          <p role="status" className="mt-4 rounded-xl bg-salvia-claro p-4 font-semibold">Solicitud recibida. Te escribiremos al correo indicado cuando esté retirada.</p>
        ) : (
          <form name="retirada" onSubmit={enviar} className="mt-4 grid gap-4">
            <div>
              <label htmlFor="r-empresa" className="etiqueta">Empresa</label>
              <input id="r-empresa" required className="campo" autoComplete="organization" value={datos.empresa} onChange={(e) => setDatos({ ...datos, empresa: e.target.value })} />
            </div>
            <div>
              <label htmlFor="r-email" className="etiqueta">Correo de contacto</label>
              <input id="r-email" type="email" required className="campo" autoComplete="email" value={datos.email} onChange={(e) => setDatos({ ...datos, email: e.target.value })} />
            </div>
            <div>
              <label htmlFor="r-motivo" className="etiqueta">Comentario (opcional)</label>
              <textarea id="r-motivo" className="campo min-h-24" value={datos.motivo} onChange={(e) => setDatos({ ...datos, motivo: e.target.value })} />
            </div>
            <p className="text-sm text-tinta-suave">Usaremos este correo solo para gestionar la retirada y lo borraremos al terminar.</p>
            <button type="submit" className="btn-primario w-fit" disabled={estado === 'enviando'}>{estado === 'enviando' ? 'Enviando…' : 'Enviar solicitud'}</button>
            {estado === 'error' && (
              <p role="alert" className="font-semibold text-peligro">
                No se ha podido enviar. Escríbenos a <a className="enlace" href={mailto}>{config.centro.contactoPrivacidad}</a>.
              </p>
            )}
          </form>
        )}
        <p className="mt-4 text-sm">También puedes escribir a <a className="enlace" href={mailto}>{config.centro.contactoPrivacidad}</a>.</p>
      </section>
    </div>
  );
}
