import LegalLayout, { Dato, List, Section } from '../../components/LegalLayout';
import { CENTRO } from '../../config/centro';
import { MAX_RETENTION_DAYS, RETENTION_DAYS, ROOM_OPEN_HOURS } from '../../utils/constants';

export default function Privacidad() {
  return (
    <LegalLayout
      title="Política de privacidad"
      intro="Cómo trata ColaboraFP los datos personales, conforme al Reglamento (UE) 2016/679 (RGPD) y a la Ley Orgánica 3/2018 (LOPDGDD)."
    >
      <Section id="responsable" title="1. Responsable del tratamiento">
        <List
          items={[
            <>Responsable: <Dato value={CENTRO.titular} label="Razón social" /> — {CENTRO.nombre}</>,
            <>NIF/CIF: <Dato value={CENTRO.nif} label="NIF" /></>,
            <>Domicilio: <Dato value={CENTRO.direccion} label="Dirección postal" /></>,
            <>Contacto: <Dato value={CENTRO.email} label="Correo de contacto" /></>,
            <>Delegado/a de Protección de Datos: <Dato value={CENTRO.dpd} label="Contacto del DPD" /></>,
          ]}
        />
      </Section>

      <Section id="datos" title="2. Qué datos tratamos y para qué">
        <p><strong>Profesorado.</strong> Nombre, correo electrónico del centro y contraseña (que gestiona de forma cifrada Firebase Authentication; el centro no puede verla), así como las salas y recursos que publica. Finalidad: gestionar su cuenta y la actividad docente en ColaboraFP. Para activar una cuenta, el administrador de la plataforma ve el nombre y el correo de quien solicita el alta.</p>
        <p><strong>Alumnado.</strong> No necesita cuenta ni se le pide ningún dato identificativo. Solo se guardan los contenidos que decide compartir y, si lo escribe, un nombre o alias opcional (recomendamos usar un alias o solo el nombre de pila). Finalidad: la actividad colaborativa de la clase.</p>
        <p><strong>Notificaciones de contenido.</strong> El motivo y la descripción opcional de cada aviso, sin identificar a quien lo envía. Finalidad: retirar contenidos ilícitos o inadecuados.</p>
        <p><strong>Datos técnicos.</strong> Dirección IP y datos de conexión que tratan los proveedores de alojamiento para prestar el servicio y protegerlo frente a abusos.</p>
        <p>No se elaboran perfiles, no se toman decisiones automatizadas, no se usa inteligencia artificial y no hay publicidad ni analítica de terceros.</p>
      </Section>

      <Section id="base" title="3. Base jurídica">
        <p>
          El ejercicio de la función educativa del centro (art. 6.1.e RGPD, en relación con la disposición adicional vigesimotercera
          de la Ley Orgánica 2/2006, de Educación) y, en el caso del profesorado, la relación que le vincula con el centro (art. 6.1.b RGPD).
        </p>
      </Section>

      <Section id="plazos" title="4. Plazos de conservación">
        <List
          items={[
            <>Cada sala se <strong>cierra automáticamente a las {ROOM_OPEN_HOURS} horas</strong> de abrirse (el profesor puede reabrirla).</>,
            <>La sala y <strong>todo su contenido</strong> (recursos, archivos, aportaciones y notificaciones) <strong>se eliminan automáticamente en la fecha que elige el profesor</strong> al crear la sala (por defecto, {RETENTION_DAYS} días; como máximo, {MAX_RETENTION_DAYS} días desde que se fija). El profesorado puede cambiar esa fecha o borrarlo todo antes en cualquier momento.</>,
            <>Los <strong>calendarios de clase</strong> contienen solo fechas y avisos del profesorado (no datos del alumnado) y se eliminan automáticamente el <strong>31 de julio</strong> al terminar su curso.</>,
            <>La cuenta del profesorado se conserva mientras preste servicio en el centro. Puede eliminarla, con todas sus salas, desde «Mis salas → Mi cuenta».</>,
            <>Los datos guardados en tu propio dispositivo (ver apartado 7) permanecen hasta que los borras desde tu navegador.</>,
          ]}
        />
      </Section>

      <Section id="encargados" title="5. Destinatarios y encargados del tratamiento">
        <p>No se ceden datos a terceros salvo obligación legal. Para prestar el servicio intervienen, como encargados del tratamiento con contrato conforme al art. 28 RGPD:</p>
        <List
          items={[
            <><strong>Google Ireland Limited</strong> (Firebase Authentication y Cloud Firestore): autenticación del profesorado y base de datos, con servidores en la Unión Europea.</>,
            <><strong>Netlify, Inc.</strong> (Estados Unidos): alojamiento y entrega de la aplicación web.</>,
          ]}
        />
        <p>
          Las transferencias internacionales que pudieran producirse se amparan en el Marco de Privacidad de Datos UE-EE. UU.
          (art. 45 RGPD) y/o en las cláusulas contractuales tipo de la Comisión Europea (art. 46 RGPD).
        </p>
      </Section>

      <Section id="derechos" title="6. Tus derechos">
        <p>
          Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad
          escribiendo a <Dato value={CENTRO.dpd || CENTRO.email} label="Contacto del DPD" />. Si consideras que tus derechos no se han
          respetado, puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).
        </p>
      </Section>

      <Section id="dispositivo" title="7. Cookies y almacenamiento en tu dispositivo">
        <p>
          ColaboraFP <strong>no usa cookies</strong> de analítica, publicidad ni de terceros. Solo guarda en el almacenamiento
          local del navegador la información estrictamente necesaria para funcionar, exenta de consentimiento (art. 22.2 LSSI):
        </p>
        <List
          items={[
            'La sesión del profesorado.',
            'La preferencia de modo claro u oscuro.',
            'Una copia en caché del muro de la sala, para que cargue al instante.',
            'La lista «Mis aportaciones» del alumnado, que solo existe en su propio dispositivo.',
          ]}
        />
        <p>Las tipografías se sirven desde el propio dominio de ColaboraFP: la aplicación no conecta con servicios de fuentes externos.</p>
      </Section>

      <Section id="seguridad" title="8. Seguridad">
        <p>
          Las comunicaciones van cifradas (HTTPS). El acceso a los datos está limitado por reglas de seguridad en el servidor: solo
          el profesorado verificado gestiona salas, el contenido de cada sala solo es accesible desde ella, las aportaciones del
          alumnado se moderan antes de publicarse y no se admiten archivos ejecutables.
        </p>
      </Section>
    </LegalLayout>
  );
}
