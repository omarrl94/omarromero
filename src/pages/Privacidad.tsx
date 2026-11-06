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
        <h2 id="t-alumnado" className="text-2xl font-extrabold">Para el alumnado y el profesorado</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Cuenta del centro.</strong> Para usar Conecta FFE creas una cuenta con tu correo del centro: el alumnado con @{config.cuentas.dominioAlumnado} y el profesorado con @{config.cuentas.dominioProfesorado}. La cuenta la gestiona Firebase Authentication (Google), como en el resto de plataformas del centro.</li>
          <li><strong>Qué se guarda en tu cuenta:</strong> tu nombre, tu correo, tu rol (alumno/a o tutor/a), tu perfil (ciclo, perfiles, zona, modalidad, teléfono y enlaces) y tu seguimiento de candidaturas. Sirve para que veas lo mismo en el móvil y en el ordenador. Nadie más puede leer tus datos: ni el resto del alumnado ni las empresas.</li>
          <li><strong>Tu CV nunca se sube.</strong> Lo adjuntas tú en tu programa de correo.</li>
          <li><strong>Seguridad:</strong> el correo se verifica con un enlace enviado desde el buzón del centro. El profesorado tutor y la administración entran además con un código que llega por correo (doble factor). Para limitar intentos se guarda temporalmente un resumen cifrado de tu IP, nunca la IP en claro.</li>
          <li><strong>Sin analítica</strong> ni cookies de seguimiento. Solo se usan cookies técnicas de sesión.</li>
          <li><strong>Los correos a las empresas los envías tú</strong> desde tu cuenta: Conecta FFE solo prepara el borrador.</li>
          <li><strong>Puedes borrar tu cuenta</strong> y todos tus datos cuando quieras en <a className="enlace" href="#/perfil">Mi cuenta</a>. Al cerrar sesión se borran los datos guardados en ese navegador.</li>
        </ul>
      </section>

      <section aria-labelledby="t-empresas" className="grid gap-3 leading-relaxed">
        <h2 id="t-empresas" className="text-2xl font-extrabold">Para las empresas</h2>
        <p>
          El directorio lo mantiene el {config.centro.nombre} para que su alumnado de 2.º de {config.ciclos.map((c) => c.corto).join(', ').replace(/, ([^,]*)$/, ' y $1')} solicite plaza de Formación en Empresa. Solo incluye datos de contacto <strong>corporativos que la propia empresa publica</strong> (en su web o en una fuente oficial), con la URL de origen y la fecha de comprobación. No incluimos correos personales de empleados ni correos deducidos. El acceso está restringido al alumnado con un código del centro y la web no se indexa en buscadores.
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
