import LegalLayout, { Dato, List, Section } from '../../components/LegalLayout';
import { CENTRO } from '../../config/centro';
import { RETENTION_DAYS } from '../../utils/constants';

export default function Condiciones() {
  return (
    <LegalLayout
      title="Condiciones de uso"
      intro="Normas para usar ColaboraFP y para compartir contenidos en las salas. Al usar la plataforma, el profesorado y el alumnado las aceptan."
    >
      <Section id="uso" title="1. Uso educativo">
        <p>ColaboraFP se utiliza exclusivamente para la actividad docente del centro. Está prohibido publicar o compartir:</p>
        <List
          items={[
            'Contenidos ilícitos, ofensivos, discriminatorios, violentos o que atenten contra la dignidad de las personas.',
            'Datos personales de otras personas (nombres completos, DNI, teléfonos, direcciones, notas…), y fotos o vídeos en los que aparezcan personas.',
            'Material protegido por derechos de autor sin permiso de su titular.',
            'Software malicioso, ejecutables o cualquier contenido que pueda dañar los equipos de otras personas.',
            'Publicidad, spam o contenidos ajenos a la actividad de clase.',
          ]}
        />
      </Section>

      <Section id="pi" title="2. Propiedad intelectual de lo que se comparte">
        <List
          items={[
            'Quien comparte un contenido declara que es de su autoría o que tiene permiso para compartirlo. Las citas y fragmentos de obras ajenas deben indicar su autor y fuente, y limitarse a lo necesario para la actividad docente (art. 32 del Texto Refundido de la Ley de Propiedad Intelectual).',
            `Al compartir, el autor conserva todos sus derechos y concede al centro y a los participantes de esa sala una licencia gratuita, no exclusiva y limitada a la actividad educativa de la sala para mostrar, copiar y descargar el contenido durante su plazo de conservación (${RETENTION_DAYS} días).`,
            'El nombre, los logotipos y el software de ColaboraFP y del centro no pueden usarse fuera de la plataforma sin autorización.',
          ]}
        />
      </Section>

      <Section id="moderacion" title="3. Moderación">
        <p>
          Las aportaciones del alumnado no se publican hasta que el profesor o profesora de la sala las aprueba. El profesorado
          puede retirar cualquier contenido en cualquier momento y cerrar la sala.
        </p>
      </Section>

      <Section id="notificar" title="4. Notificar un contenido">
        <p>
          Si ves algo que incumple estas condiciones, pulsa <strong>«Notificar contenido»</strong> en el recurso o escribe a{' '}
          <Dato value={CENTRO.email} label="Correo de contacto" /> indicando el PIN de la sala y el recurso. El centro lo revisará y,
          si procede, lo retirará con la mayor rapidez posible.
        </p>
      </Section>

      <Section id="responsabilidad" title="5. Responsabilidad">
        <p>
          Cada persona es responsable de los contenidos que publica. El incumplimiento de estas condiciones puede conllevar la
          retirada del contenido y, en su caso, las medidas previstas en las normas de convivencia del centro.
        </p>
      </Section>

      <Section id="conservacion" title="6. Conservación">
        <p>Las salas se cierran solas a las 12 horas y todo su contenido se borra automáticamente a los {RETENTION_DAYS} días de su creación. Guarda en tu equipo lo que quieras conservar.</p>
      </Section>

      <Section id="cambios" title="7. Cambios">
        <p>El centro puede actualizar estas condiciones; la fecha de la última versión figura al inicio de esta página.</p>
      </Section>
    </LegalLayout>
  );
}
