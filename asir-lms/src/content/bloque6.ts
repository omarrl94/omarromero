import type { TopicContent } from "./types";

// Bloque 6 · Informe y proyecto final (temas 17-18).
export const bloque6: Record<number, TopicContent> = {
  17: {
    theory: [
      {
        title: "Comunicar los resultados",
        paragraphs: [
          "De poco sirve un buen trabajo técnico si no se comunica bien. El informe es el producto final de una auditoría o de un incidente: traslada los hallazgos, su riesgo y las recomendaciones a quienes deben decidir.",
          "Un mismo trabajo suele necesitar dos informes: uno ejecutivo (breve, sin tecnicismos, para la dirección) y uno técnico (detallado, para el equipo que aplicará las correcciones).",
        ],
        bullets: [
          "Informe ejecutivo: qué riesgo hay y qué decisiones tomar.",
          "Informe técnico: qué se encontró y cómo corregirlo.",
          "Cada hallazgo con su nivel de riesgo y su recomendación.",
          "Lenguaje claro, adaptado a quien lo lee.",
        ],
      },
      {
        title: "Estructura de un informe",
        paragraphs: [
          "Un informe suele incluir: resumen ejecutivo, alcance y metodología, hallazgos (cada uno con descripción, riesgo, evidencia y recomendación), conclusiones y plan de acción priorizado.",
          "Explicar un problema con claridad es una habilidad clave: describir qué es, por qué importa y cómo se soluciona, sin dar por supuesto que quien lee es experto.",
        ],
      },
      {
        title: "Priorizar por riesgo",
        paragraphs: [
          "No todos los hallazgos tienen la misma urgencia. Clasificarlos por nivel de riesgo (crítico, alto, medio, bajo) ayuda a la organización a atacar primero lo más peligroso con los recursos disponibles.",
        ],
      },
      {
        title: "Métricas de riesgo y redacción asistida por IA",
        only: "SUPERIOR",
        paragraphs: [
          "Para dar objetividad al riesgo se usan escalas como CVSS, que puntúa las vulnerabilidades. El informe técnico enlaza cada hallazgo con su métrica y su recomendación concreta.",
          "La IA puede ayudar a redactar borradores, resumir hallazgos o traducir la parte técnica a lenguaje ejecutivo. Es imprescindible revisar el resultado: la IA puede introducir imprecisiones o inventar datos, y la responsabilidad del informe es de quien lo firma.",
        ],
      },
    ],
    labs: [
      {
        title: "Redactar la ficha de un hallazgo",
        goal: "Practicar la comunicación de un hallazgo de seguridad con su riesgo y su recomendación.",
        environment: ["Procesador de textos", "Un hallazgo de prácticas anteriores (p. ej. un puerto abierto innecesario)"],
        steps: [
          { title: "Elegir un hallazgo real", detail: "Toma un hallazgo de las prácticas del curso (una configuración débil que detectaste)." },
          { title: "Describirlo con claridad", detail: "Explica qué es el problema en 3-4 frases, sin tecnicismos innecesarios." },
          { title: "Valorar el riesgo", detail: "Asigna un nivel (crítico/alto/medio/bajo) y justifica por qué, pensando en el impacto y la probabilidad." },
          { title: "Aportar evidencia", detail: "Añade una captura o el fragmento de salida que demuestra el hallazgo." },
          { title: "Recomendar la solución", detail: "Indica de forma concreta cómo corregirlo." },
          { title: "Versión ejecutiva", detail: "Resume el hallazgo en dos frases que entendería una persona no técnica." },
        ],
        check: "La ficha incluye descripción, riesgo justificado, evidencia, recomendación y una versión ejecutiva.",
      },
      {
        title: "De informe técnico a resumen ejecutivo con IA",
        only: "SUPERIOR",
        goal: "Transformar hallazgos técnicos en un resumen ejecutivo, apoyándose en IA y revisándolo con espíritu crítico.",
        environment: ["Conjunto de 3-4 hallazgos técnicos", "Asistente de IA"],
        steps: [
          { title: "Puntuar con una métrica", detail: "Asigna a cada hallazgo una valoración de riesgo (por ejemplo con CVSS) y ordénalos." },
          { title: "Pedir un borrador ejecutivo", detail: "Pide a un asistente de IA que redacte un resumen ejecutivo a partir de tus hallazgos." },
          { title: "Revisar el borrador", detail: "Detecta imprecisiones, tecnicismos que sobran o afirmaciones no respaldadas por tus datos." },
          { title: "Corregir y priorizar", detail: "Reescribe el resumen con un plan de acción priorizado por riesgo." },
          { title: "Reflexión", detail: "Anota qué aportó la IA y qué errores tuviste que corregir." },
        ],
        check: "El resumen ejecutivo es claro, fiel a los hallazgos, prioriza por riesgo y has documentado las correcciones a la IA.",
      },
    ],
    activities: [
      { title: "Ejecutivo vs. técnico", description: "Toma un hallazgo y redáctalo dos veces: una para la dirección y otra para el equipo técnico. Compara las diferencias." },
      { title: "Prioriza hallazgos", description: "Dada una lista de 6 hallazgos, ordénalos por riesgo y justifica el orden." },
      { title: "Mejora un texto confuso", description: "Reescribe un párrafo técnico enrevesado para que lo entienda una persona sin conocimientos informáticos." },
      { title: "CVSS", only: "SUPERIOR", description: "Investiga qué factores tiene en cuenta la puntuación CVSS y calcula (con una calculadora online) la de una vulnerabilidad de ejemplo." },
    ],
    projects: [
      {
        title: "Informe de seguridad de un caso sencillo",
        only: "MEDIO",
        description: "Redacta un informe breve sobre el estado de seguridad de un equipo que has revisado durante el curso, con hallazgos y recomendaciones.",
        deliverables: ["Informe con estructura clara", "Tabla de hallazgos con riesgo y recomendación"],
        evaluation: ["Claridad y estructura (40%)", "Hallazgos y recomendaciones (40%)", "Presentación (20%)"],
      },
      {
        title: "Informe profesional de auditoría",
        only: "SUPERIOR",
        description: "Elabora un informe completo (ejecutivo y técnico) de una auditoría realizada en el laboratorio, con métricas de riesgo y plan de acción priorizado.",
        deliverables: ["Resumen ejecutivo", "Informe técnico detallado", "Plan de acción priorizado por riesgo"],
        evaluation: ["Resumen ejecutivo (25%)", "Rigor técnico de los hallazgos (35%)", "Priorización y plan (25%)", "Redacción y presentación (15%)"],
      },
    ],
    quiz: [
      { question: "¿Cuál es el objetivo de un informe de seguridad?", options: ["Impresionar con tecnicismos", "Trasladar hallazgos, riesgo y recomendaciones a quien decide", "Ocultar los problemas", "Sustituir a las copias"], answer: 1, explanation: "El informe comunica los resultados para que se tomen decisiones." },
      { question: "¿En qué se diferencia el informe ejecutivo del técnico?", options: ["No hay diferencia", "El ejecutivo es breve y sin tecnicismos, para la dirección; el técnico es detallado, para el equipo", "El técnico es para clientes", "El ejecutivo lleva más código"], answer: 1, explanation: "Cada informe se adapta a quién lo lee y qué necesita decidir o hacer." },
      { question: "Cada hallazgo de un informe debería incluir…", options: ["Solo el título", "Descripción, riesgo, evidencia y recomendación", "Únicamente una captura", "El precio de la solución"], answer: 1, explanation: "Un hallazgo completo permite entenderlo y corregirlo." },
      { question: "¿Por qué se priorizan los hallazgos por riesgo?", options: ["Para hacer el informe más largo", "Para atacar primero lo más peligroso con los recursos disponibles", "Porque lo exige la ley siempre", "Para cifrarlos"], answer: 1, explanation: "La priorización orienta el esfuerzo hacia lo más crítico." },
      { question: "Explicar bien un problema significa…", options: ["Usar el máximo de tecnicismos", "Decir qué es, por qué importa y cómo se soluciona, de forma clara", "No dar detalles", "Copiar el log entero"], answer: 1, explanation: "La comunicación clara adapta el mensaje a quien lo recibe." },
      { question: "¿Para qué sirve CVSS?", only: "SUPERIOR", options: ["Cifrar el informe", "Puntuar la gravedad de las vulnerabilidades de forma objetiva", "Hacer copias", "Balancear carga"], answer: 1, explanation: "CVSS da una métrica común para valorar y comparar vulnerabilidades." },
      { question: "Al usar IA para redactar un informe hay que…", only: "SUPERIOR", options: ["Publicarlo sin leerlo", "Revisarlo: puede introducir imprecisiones o inventar datos, y la responsabilidad es de quien firma", "Confiar siempre al 100 %", "Enviarle datos confidenciales sin control"], answer: 1, explanation: "La IA ayuda con el borrador, pero el rigor y la responsabilidad son humanos." },
    ],
  },

  18: {
    theory: [
      {
        title: "El proyecto final: integrarlo todo",
        paragraphs: [
          "El proyecto final reúne lo aprendido durante el módulo en un caso realista: diseñar, implantar y documentar una infraestructura segura y de alta disponibilidad, integrando herramientas de IA defensiva.",
          "Es un trabajo de síntesis: seguridad (bastionado, cortafuegos, cifrado), alta disponibilidad (redundancia, copias) y visibilidad (monitorización), presentado de forma profesional.",
        ],
        bullets: [
          "Parte de un caso o requisitos concretos.",
          "Combina defensa, disponibilidad y visibilidad.",
          "Se documenta y se presenta/defiende.",
          "Integra al menos una herramienta de IA defensiva.",
        ],
      },
      {
        title: "Fases del proyecto",
        paragraphs: [
          "Un proyecto se organiza en fases: análisis de requisitos, diseño, implantación (en el laboratorio), pruebas, documentación y presentación. Planificar el tiempo y llevar un registro del avance es parte de la nota.",
        ],
      },
      {
        title: "Documentación y presentación",
        paragraphs: [
          "La documentación debe permitir que otra persona entienda y reproduzca el trabajo: decisiones tomadas, configuración aplicada y resultados de las pruebas. La presentación explica el proyecto de forma clara y responde a las preguntas del tribunal o del profesorado.",
        ],
      },
      {
        title: "Defensa ante tribunal y criterios profesionales",
        only: "SUPERIOR",
        paragraphs: [
          "En el Grado Superior el proyecto se defiende: se expone el diseño, se justifican las decisiones y se responde a preguntas técnicas. Se valora la coherencia entre requisitos, diseño e implementación, así como el uso crítico y responsable de la IA.",
          "Un buen proyecto no solo funciona: está justificado, es mantenible y considera costes, riesgos y mejoras futuras.",
        ],
      },
    ],
    labs: [
      {
        title: "Maqueta segura y con copias en el laboratorio",
        goal: "Montar una pequeña infraestructura con un servicio protegido, cortafuegos y copias de seguridad, reutilizando las prácticas del curso.",
        environment: ["VM del laboratorio", "Herramientas usadas en bloques anteriores (cortafuegos, copias)"],
        steps: [
          { title: "Definir el objetivo", detail: "Describe qué servicio ofrecerá tu maqueta (por ejemplo, una web) y qué debe proteger." },
          { title: "Desplegar y bastionar", detail: "Levanta el servicio, aplica el bastionado básico y configura el cortafuegos con mínimo privilegio." },
          { title: "Añadir copias", detail: "Configura copias de seguridad de la parte importante y prueba una restauración." },
          { title: "Monitorizar", detail: "Define qué logs y alertas vigilarías en esta maqueta." },
          { title: "Documentar", detail: "Recoge la configuración, las pruebas y una instantánea final del laboratorio." },
        ],
        check: "La maqueta ofrece el servicio con cortafuegos, tiene copias probadas y está documentada.",
      },
      {
        title: "Infraestructura HA con visibilidad e IA defensiva",
        only: "SUPERIOR",
        goal: "Integrar alta disponibilidad, seguridad y monitorización en una maqueta más completa, con un componente de IA defensiva.",
        environment: ["Varias VM del laboratorio", "Herramientas de balanceo/clúster, copias y SIEM de los bloques anteriores"],
        steps: [
          { title: "Diseñar la arquitectura", detail: "Dibuja la arquitectura eliminando puntos únicos de fallo e indicando dónde va cada medida de seguridad." },
          { title: "Implantar la HA", detail: "Monta el balanceo o clúster y comprueba la conmutación ante un fallo simulado." },
          { title: "Asegurar y respaldar", detail: "Aplica bastionado, cortafuegos, cifrado donde proceda y copias con su prueba de restauración." },
          { title: "Dar visibilidad", detail: "Centraliza logs y define alertas; integra un componente de IA defensiva (detección de anomalías o asistente de análisis)." },
          { title: "Documentar y preparar la defensa", detail: "Redacta la documentación y prepara la presentación con las decisiones justificadas." },
        ],
        check: "La infraestructura tolera un fallo, está asegurada y monitorizada, integra IA defensiva y está lista para defenderse.",
      },
    ],
    activities: [
      { title: "Planifica el proyecto", description: "Elabora un cronograma con las fases de tu proyecto final y el tiempo estimado de cada una." },
      { title: "Lista de requisitos", description: "Redacta los requisitos de seguridad y disponibilidad que debe cumplir tu proyecto, a partir de un caso dado." },
      { title: "Guion de la presentación", description: "Prepara el guion de una presentación de 8-10 minutos de tu proyecto." },
      { title: "Análisis de decisiones", only: "SUPERIOR", description: "Justifica por escrito tres decisiones de diseño de tu proyecto, valorando alternativas descartadas." },
    ],
    projects: [
      {
        title: "Proyecto final · Grado Medio",
        only: "MEDIO",
        description: "Diseña, monta y documenta una pequeña infraestructura segura con copias de seguridad y cortafuegos, y preséntala.",
        deliverables: ["Maqueta funcional en el laboratorio", "Documentación del proyecto", "Presentación"],
        evaluation: ["Funcionamiento y seguridad básica (40%)", "Copias y disponibilidad (20%)", "Documentación (20%)", "Presentación (20%)"],
      },
      {
        title: "Proyecto final · Grado Superior",
        only: "SUPERIOR",
        description: "Diseña, implanta, documenta y defiende una infraestructura segura y de alta disponibilidad con monitorización e integración de IA defensiva.",
        deliverables: ["Infraestructura HA funcional", "Documentación técnica completa", "Integración de una herramienta de IA defensiva", "Defensa ante tribunal"],
        evaluation: ["Diseño e implantación HA (30%)", "Seguridad y monitorización (25%)", "Integración de IA defensiva (15%)", "Documentación (15%)", "Defensa (15%)"],
      },
    ],
    quiz: [
      { question: "¿Qué caracteriza al proyecto final del módulo?", options: ["Repetir un solo tema", "Integrar lo aprendido en una infraestructura segura y de alta disponibilidad", "Solo teoría", "Únicamente un test"], answer: 1, explanation: "Es un trabajo de síntesis que combina seguridad, disponibilidad y visibilidad." },
      { question: "¿Cuál es una fase típica de un proyecto?", options: ["Ignorar los requisitos", "Análisis, diseño, implantación, pruebas, documentación y presentación", "Solo implantar sin probar", "Presentar sin documentar"], answer: 1, explanation: "Un proyecto ordenado recorre esas fases de principio a fin." },
      { question: "¿Para qué sirve una buena documentación?", options: ["Para ocupar más páginas", "Para que otra persona entienda y reproduzca el trabajo", "Para cifrar el proyecto", "No es necesaria"], answer: 1, explanation: "La documentación hace el trabajo comprensible y reproducible." },
      { question: "El proyecto debe integrar, además de seguridad y disponibilidad…", options: ["Un videojuego", "Al menos una herramienta de IA defensiva", "Una tienda online real", "Publicidad"], answer: 1, explanation: "El módulo pide integrar el enfoque de IA defensiva en el proyecto." },
      { question: "Monitorizar la maqueta implica…", options: ["Apagarla", "Definir qué logs y alertas vigilar", "Borrar los datos", "Quitar el cortafuegos"], answer: 1, explanation: "La visibilidad es parte de una infraestructura bien planteada." },
      { question: "En la defensa del proyecto (Grado Superior) se valora sobre todo…", only: "SUPERIOR", options: ["Que sea largo", "La coherencia entre requisitos, diseño e implementación y la justificación de las decisiones", "El color de las diapositivas", "Que use muchos tecnicismos"], answer: 1, explanation: "Se juzga que el proyecto esté justificado y sea coherente, no su extensión." },
      { question: "Un buen proyecto profesional, además de funcionar, debe ser…", only: "SUPERIOR", options: ["Imposible de mantener", "Justificado, mantenible y consciente de costes, riesgos y mejoras futuras", "Secreto", "Lo más complejo posible"], answer: 1, explanation: "La calidad profesional incluye mantenibilidad, justificación y visión de futuro." },
    ],
  },
};
