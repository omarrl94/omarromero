import LegalLayout, { Dato, List, Section } from '../../components/LegalLayout';
import { CENTRO } from '../../config/centro';

export const ACCESSIBILITY_REVIEW = '15 de octubre de 2026';

export default function Accesibilidad() {
  return (
    <LegalLayout
      title="Declaración de accesibilidad"
      intro={`${CENTRO.nombre} se compromete a hacer accesible ColaboraFP conforme al Real Decreto 1112/2018 y a la norma UNE-EN 301 549, que remite a las Pautas WCAG 2.1 de nivel AA.`}
    >
      <Section id="situacion" title="1. Situación de cumplimiento">
        <p>
          ColaboraFP es <strong>parcialmente conforme</strong> con el Real Decreto 1112/2018 por las excepciones que se indican a
          continuación. La interfaz propia de la aplicación se ha revisado frente a los criterios WCAG 2.1 A y AA.
        </p>
      </Section>

      <Section id="no-accesible" title="2. Contenido no accesible">
        <List
          items={[
            'Contenidos aportados por los usuarios: los archivos, imágenes, enlaces y textos que publican el profesorado y el alumnado pueden no ser accesibles (por ejemplo, imágenes sin texto alternativo o PDF sin etiquetar). Se recomienda al profesorado añadir un título descriptivo a cada recurso y publicar documentos accesibles.',
            'Código QR: es una alternativa visual; siempre se ofrece también el PIN en texto y el enlace directo a la sala.',
            'Resaltado de sintaxis del código: el color es un apoyo visual; el código se puede leer y copiar como texto plano.',
          ]}
        />
      </Section>

      <Section id="preparacion" title="3. Preparación de esta declaración">
        <p>
          Declaración preparada el {ACCESSIBILITY_REVIEW} mediante autoevaluación: análisis automático con axe-core (reglas WCAG 2.0 y 2.1,
          niveles A y AA) de todas las pantallas en modo claro y oscuro, en escritorio y móvil, y revisión manual de navegación con
          teclado, foco visible, etiquetas de formularios, contraste y preferencia de movimiento reducido.
        </p>
      </Section>

      <Section id="contacto" title="4. Observaciones y datos de contacto">
        <p>
          Puedes comunicar problemas de accesibilidad o solicitar información en formato accesible escribiendo a{' '}
          <Dato value={CENTRO.email} label="Correo de contacto" />. Responderemos en un plazo máximo de veinte días hábiles.
        </p>
      </Section>

      <Section id="ambito" title="5. Ámbito de aplicación">
        <p>
          El Real Decreto 1112/2018 es obligatorio para el sector público y para los centros sostenidos con fondos públicos. Esta
          declaración se publica en cualquier caso como compromiso de accesibilidad del centro.
        </p>
      </Section>
    </LegalLayout>
  );
}
