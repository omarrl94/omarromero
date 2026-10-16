import { Link } from 'react-router-dom';
import LegalLayout, { Dato, List, Section } from '../../components/LegalLayout';
import { CENTRO } from '../../config/centro';

export default function AvisoLegal() {
  return (
    <LegalLayout
      title="Aviso legal"
      intro="Información general de ColaboraFP, en cumplimiento del artículo 10 de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI)."
    >
      <Section id="titular" title="1. Titular del sitio">
        <List
          items={[
            <>Denominación: <Dato value={CENTRO.nombre} label="Nombre del centro" /></>,
            <>Entidad titular: <Dato value={CENTRO.titular} label="Razón social" /></>,
            <>NIF/CIF: <Dato value={CENTRO.nif} label="NIF" /></>,
            <>Domicilio: <Dato value={CENTRO.direccion} label="Dirección postal" /></>,
            <>Correo electrónico de contacto: <Dato value={CENTRO.email} label="Correo de contacto" /></>,
            CENTRO.telefono ? <>Teléfono: <Dato value={CENTRO.telefono} label="Teléfono" /></> : null,
            <>Autorización/registro administrativo del centro: <Dato value={CENTRO.registro} label="Código de centro o autorización" /></>,
          ].filter(Boolean)}
        />
      </Section>

      <Section id="objeto" title="2. Objeto">
        <p>
          ColaboraFP es una herramienta educativa gratuita del centro para compartir en tiempo real recursos de clase
          (código, enunciados, enlaces y archivos) entre el profesorado y su alumnado. No es un servicio comercial ni
          contiene publicidad.
        </p>
      </Section>

      <Section id="acceso" title="3. Acceso y uso">
        <p>
          El alumnado accede sin registro, con el PIN o el código QR de la sala que le facilita su profesor o profesora. Solo
          el profesorado del centro, con su correo institucional verificado, puede crear una cuenta y gestionar salas. El uso
          de ColaboraFP implica la aceptación de las <Link className="font-semibold text-brand-700 underline dark:text-brand-300" to="/condiciones">condiciones de uso</Link>.
        </p>
      </Section>

      <Section id="contenidos" title="4. Contenidos de los usuarios y notificación de contenidos">
        <p>
          Los recursos los publica el profesorado y, previa aprobación de este, el alumnado. Respecto a esos contenidos, el
          centro actúa como prestador de un servicio de alojamiento de datos (art. 16 LSSI): no los controla con carácter previo
          más allá de la moderación docente, pero los retirará con diligencia en cuanto tenga conocimiento efectivo de que son
          ilícitos o lesionan derechos de terceros.
        </p>
        <p>
          Cualquier persona puede notificar un contenido mediante el botón <strong>«Notificar contenido»</strong> que acompaña a
          cada recurso (el aviso llega al profesor o profesora de la sala) o escribiendo a <Dato value={CENTRO.email} label="Correo de contacto" />,
          indicando el PIN de la sala y el recurso afectado.
        </p>
      </Section>

      <Section id="propiedad" title="5. Propiedad intelectual e industrial">
        <p>
          El nombre y los logotipos del centro y de ColaboraFP pertenecen a su titular. Los recursos compartidos pertenecen a
          sus autores, que conceden la licencia de uso limitada descrita en las condiciones de uso.
        </p>
      </Section>

      <Section id="enlaces" title="6. Enlaces externos">
        <p>
          Los enlaces publicados en las salas dirigen a sitios de terceros sobre los que el centro no tiene control; se abren en
          una pestaña nueva y su uso se rige por las condiciones de esos sitios.
        </p>
      </Section>

      <Section id="ia" title="7. Inteligencia artificial">
        <p>
          ColaboraFP no utiliza sistemas de inteligencia artificial, por lo que no le resulta de aplicación el Reglamento (UE)
          2024/1689 de inteligencia artificial.
        </p>
      </Section>

      <Section id="ley" title="8. Legislación aplicable">
        <p>Este aviso legal se rige por la legislación española.</p>
      </Section>
    </LegalLayout>
  );
}
