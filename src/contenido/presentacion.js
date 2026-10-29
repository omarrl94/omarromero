/* Presentación del curso: de qué va, para quién es, qué se aprende y cómo funciona. */
export default {
  lema: "Aprende a construir con IA lo que se usa de verdad en una empresa: asistentes que programan, servidores MCP que conectan la IA con tus sistemas y automatizaciones seguras.",

  queEs: `<p>Este curso enseña a usar <b>Claude</b>, el modelo de IA de Anthropic, como lo usa un profesional: no solo para chatear, sino para <b>integrarlo en aplicaciones</b>, <b>automatizar la administración de sistemas</b> y <b>conectarlo con bases de datos, servidores y herramientas</b> de forma segura.</p>
    <p>Es un curso <b>práctico</b>: cada sesión tiene teoría breve con ejemplos y un taller paso a paso con código real (PowerShell, Bash, Python y Java 21). El trabajo es <b>individual</b>: cada alumno sigue el itinerario de su ciclo (DAM o ASIR) y, en las sesiones donde encaja, hace también un <b>bloque común</b> con contenidos que sirven a los dos perfiles (costes, prompts, seguridad, MCP…). Terminarás con un <b>proyecto final propio</b> que podrás enseñar en tu portfolio.</p>`,

  paraQuien: [
    { t: "Alumnado de Grado Superior DAM", d: "1º y 2º de Desarrollo de Aplicaciones Multiplataforma del CFP José Ramón Otero. Integrarás Claude en tus aplicaciones Java y Python, crearás herramientas y servidores MCP de datos." },
    { t: "Alumnado de Grado Superior ASIR", d: "1º y 2º de Administración de Sistemas Informáticos en Red del CFP José Ramón Otero. Automatizarás tareas de Linux, Windows Server y Docker, analizarás logs y crearás servidores MCP de operación." },
    { t: "Sin experiencia previa en IA", d: "Empezamos desde cero: qué es un modelo, qué es un token y cómo hacer la primera llamada. Al final del curso trabajarás con agentes, MCP y seguridad." }
  ],

  requisitos: [
    "Saber programar lo básico (DAM) o manejarte en la terminal de Linux y PowerShell (ASIR).",
    "Correo institucional @jrotero.es (o el código de aula que te dé el profesor).",
    "Un ordenador con Windows o Linux donde puedas instalar Python 3.11+, Java 21 (DAM), Docker y Node.js.",
    "Acceso a la API de Claude: en la Sesión 1 verás cómo se configura; el profesor indicará cómo se obtiene el acceso en el curso.",
    "Una cuenta de GitHub para entregar tus prácticas."
  ],

  aprenderas: [
    "Elegir el modelo adecuado y calcular lo que cuesta cada tarea.",
    "Escribir prompts profesionales: XML, ejemplos y salidas JSON garantizadas.",
    "Usar el razonamiento extendido para depurar código y analizar caídas de servicios.",
    "Trabajar con Claude Code en la terminal: memoria de proyecto, permisos, Skills, comandos y hooks.",
    "Crear servidores MCP en Python que conecten la IA con bases de datos, Docker y logs.",
    "Llevar la IA a producción: streaming, caché, procesamiento por lotes y control de costes.",
    "Defenderte de la inyección de instrucciones y proteger los datos personales (RGPD, EU AI Act).",
    "Desplegar un sistema completo con Docker, TLS y autenticación, y defenderlo ante un tribunal."
  ],

  sesionTabs: [
    ["Teoría", "Objetivos de la sesión, explicación con ejemplos DAM, ASIR y generales, esquemas y avisos de errores típicos."],
    ["Taller paso a paso", "Práctica guiada comando a comando, con el resultado que debe salirte en cada paso."],
    ["Biblioteca de Prompts", "Prompts, plantillas CLAUDE.md, Skills y comandos listos para copiar con un clic."],
    ["Actividad práctica", "Test de autoevaluación de 10 preguntas y las entregas: el bloque de tu ciclo y, en las sesiones que lo tienen, el bloque común DAM y ASIR (también individual)."],
    ["Preguntas frecuentes", "Soluciones a los errores más habituales de la sesión."]
  ],

  pasos: [
    ["1", "Regístrate", "Con tu correo @jrotero.es (o el código de aula), elige tu ciclo y tu curso, y verifica el correo."],
    ["2", "Sigue las sesiones en orden", "Cada sesión se apoya en la anterior. Lee la teoría, haz el taller y repasa las preguntas frecuentes."],
    ["3", "Haz el test", "10 preguntas con corrección y explicación al momento. Puedes repetirlo: se guarda tu mejor nota."],
    ["4", "Entrega tus bloques", "Siempre el de tu ciclo (DAM o ASIR) y, cuando la sesión lo tiene, el bloque común. Todo individual, con un enlace a tu repositorio."],
    ["5", "Recibe tu evaluación", "El profesor corrige cada bloque con su rúbrica. Te llega la nota y los comentarios a la plataforma y por correo. Si pide cambios, corriges y vuelves a entregar."],
    ["6", "Proyecto final y Título", "En la Sesión 12, individual: versión DAM o versión ASIR según tu ciclo. Al aprobarlo, el centro emite tu Título Propio."]
  ],

  evaluacion: [
    ["Tests de autoevaluación", "Uno por sesión (10 preguntas)", "Formativo: te dice si has entendido la sesión. El profesor ve tu mejor nota."],
    ["Bloque de tu ciclo", "Una entrega por sesión (DAM o ASIR)", "Nota de 0 a 10 con rúbrica. Aprobado con 5 o más."],
    ["Bloque común DAM y ASIR", "Una entrega individual en las sesiones donde encaja", "Nota de 0 a 10 con rúbrica. Aprobado con 5 o más."],
    ["Proyecto Final Integrador", "Bloque de tu ciclo de la Sesión 12 + defensa", "Requisito para el Título Propio (mínimo 5)."]
  ],

  titulo: `<p>Al aprobar el <b>Proyecto Final Integrador</b> (bloque de tu ciclo en la Sesión 12), el profesor responsable emite tu <b>Título Propio del Centro</b> de 60 horas. Lleva tu nombre, tu ciclo, la calificación media de tus entregas aprobadas y un <b>código de verificación</b> que cualquier empresa puede comprobar en esta misma web.</p>
    <p>Lo descargas en PDF desde <b>Mi perfil</b>. Es un título propio del centro, no un título oficial del sistema educativo.</p>`,

  normas: [
    ["Uso responsable de la IA", "Revisa siempre lo que genera Claude antes de usarlo. Tú eres responsable de tu código y de tus comandos."],
    ["Nada de datos personales", "No pegues en Claude DNI, correos, contraseñas reales ni logs sin anonimizar. Es el compromiso EU AI Act que aceptas al registrarte."],
    ["Honestidad académica", "Puedes usar Claude para aprender y para trabajar (es el objetivo del curso), pero tienes que entender y saber explicar todo lo que entregas."],
    ["Trabajo individual", "Todas las entregas son personales. Puedes comentar dudas con tus compañeros, pero el código, los scripts y la memoria tienen que ser tuyos."],
    ["Seguridad", "Practica en máquinas virtuales o contenedores, nunca en servidores reales del centro ni de una empresa sin permiso."]
  ]
};
