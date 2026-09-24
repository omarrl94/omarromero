import type { TopicContent } from "./types";

// Bloque 5 · Visibilidad y forense (temas 15-16).
export const bloque5: Record<number, TopicContent> = {
  15: {
    theory: [
      {
        title: "Sin visibilidad no hay defensa",
        paragraphs: [
          "No se puede proteger lo que no se ve. La monitorización recoge de forma continua el estado de los sistemas y los eventos de seguridad, para detectar problemas y reaccionar a tiempo. La base son los registros o logs.",
          "Cada sistema, servicio y dispositivo genera logs: inicios de sesión, errores, accesos, cambios. El reto es centralizarlos y darles sentido.",
        ],
        bullets: [
          "Logs: el rastro de lo que ocurre en cada sistema.",
          "Centralización: reunir los logs en un único lugar.",
          "Alertas: avisar cuando algo se sale de lo normal.",
          "SOC: el equipo que vigila y responde a los incidentes.",
        ],
      },
      {
        title: "Qué son los logs y dónde están",
        paragraphs: [
          "En Linux, muchos logs viven en /var/log (autenticación, sistema, servicios). En Windows están en el Visor de eventos. Saber leerlos permite reconstruir qué ha pasado: quién entró, cuándo y desde dónde.",
          "Una monitorización básica vigila también recursos (CPU, memoria, disco) y la disponibilidad de los servicios.",
        ],
      },
      {
        title: "Alertas básicas",
        paragraphs: [
          "Una alerta avisa cuando ocurre algo relevante: muchos intentos de acceso fallidos, un disco lleno, un servicio caído. Definir buenas alertas evita tanto el ruido (demasiados avisos) como los puntos ciegos.",
        ],
      },
      {
        title: "SIEM, correlación, UEBA y análisis con IA",
        only: "SUPERIOR",
        paragraphs: [
          "Un SIEM (como Wazuh o Elastic) centraliza los logs de toda la organización, los normaliza y aplica reglas de correlación que relacionan eventos aparentemente aislados para detectar un incidente (por ejemplo, un acceso fallido repetido seguido de uno exitoso desde otro país).",
          "UEBA (análisis del comportamiento de usuarios y entidades) usa aprendizaje automático para aprender qué es normal y alertar de desviaciones. La IA también ayuda al analista del SOC a resumir grandes volúmenes de logs y priorizar las alertas más peligrosas.",
        ],
      },
    ],
    labs: [
      {
        title: "Leer y analizar logs del sistema",
        goal: "Localizar e interpretar los registros de autenticación y servicios en la VM Ubuntu.",
        environment: ["VM Ubuntu del laboratorio", "Acceso por SSH configurado en prácticas anteriores"],
        steps: [
          { title: "Localizar los logs", detail: "Explora el directorio de logs del sistema.", code: "ls -l /var/log" },
          { title: "Ver accesos recientes", detail: "Consulta los inicios de sesión correctos y fallidos.", code: "sudo journalctl -u ssh --since \"today\" | tail -n 30" },
          { title: "Contar intentos fallidos", detail: "Genera un par de accesos fallidos a propósito y búscalos en el log.", code: "sudo grep -i \"failed\" /var/log/auth.log | tail -n 20" },
          { title: "Vigilar recursos", detail: "Comprueba el uso de disco y memoria como parte de la monitorización.", code: "df -h && free -h" },
          { title: "Definir una alerta", detail: "Describe en tu cuaderno una alerta útil (p. ej. «más de 10 accesos fallidos en 5 minutos») y qué acción dispararía." },
          { title: "Documentar", detail: "Resume qué información obtuviste de los logs y qué habrías detectado." },
        ],
        check: "Sabes localizar los logs, distinguir accesos correctos de fallidos y proponer una alerta con sentido.",
      },
      {
        title: "Centralizar y correlacionar con un SIEM",
        only: "SUPERIOR",
        goal: "Instalar un SIEM ligero, recibir eventos de un agente y crear una regla de detección.",
        environment: ["VM Ubuntu del laboratorio (servidor)", "Segunda VM como agente", "Wazuh (o Elastic) según guía del profesor"],
        steps: [
          { title: "Instalar el SIEM", detail: "Despliega el servidor SIEM siguiendo la guía del profesor y accede a su panel." },
          { title: "Añadir un agente", detail: "Instala el agente en la segunda VM y comprueba que sus eventos llegan al SIEM." },
          { title: "Generar eventos", detail: "Provoca accesos fallidos en el agente y localízalos en el panel del SIEM." },
          { title: "Crear una regla de correlación", detail: "Define una regla que alerte tras varios accesos fallidos seguidos de uno correcto, y pruébala." },
          { title: "Reflexión sobre IA", detail: "Explica cómo UEBA y un asistente de IA ayudarían a reducir falsos positivos y a priorizar alertas." },
        ],
        check: "El SIEM recibe eventos del agente, tu regla de correlación genera la alerta esperada y sabes explicar el papel de la IA.",
      },
    ],
    activities: [
      { title: "¿Dónde están los logs?", description: "Elabora una tabla con los principales logs de Linux y de Windows y qué información aporta cada uno." },
      { title: "Reconstruye un acceso", description: "A partir de un extracto de log proporcionado por el profesor, indica quién accedió, cuándo y desde qué IP." },
      { title: "Diseña alertas", description: "Propón 5 alertas útiles para un pequeño servidor, indicando el umbral y la acción de cada una." },
      { title: "Reglas de correlación", only: "SUPERIOR", description: "Diseña dos reglas de correlación que combinen varios eventos para detectar un incidente, explicando qué detectan." },
    ],
    projects: [
      {
        title: "Monitorización básica de un servidor",
        only: "MEDIO",
        description: "Documenta cómo vigilar un pequeño servidor: qué logs revisar, qué recursos monitorizar y qué alertas definir.",
        deliverables: ["Guía de monitorización", "Lista de alertas con umbrales"],
        evaluation: ["Cobertura de la monitorización (50%)", "Alertas útiles (30%)", "Claridad (20%)"],
      },
      {
        title: "Despliegue de un SIEM y casos de detección",
        only: "SUPERIOR",
        description: "Despliega un SIEM con al menos un agente, crea varias reglas de correlación y documenta los casos de uso que detectan.",
        deliverables: ["Documento del despliegue", "Reglas de correlación creadas", "Casos de detección probados"],
        evaluation: ["Despliegue funcional (35%)", "Reglas de correlación (35%)", "Casos de uso (20%)", "Presentación (10%)"],
      },
    ],
    quiz: [
      { question: "¿Por qué es importante la monitorización?", options: ["Para gastar más disco", "Porque no se puede proteger lo que no se ve", "Para acelerar la red", "Para cifrar datos"], answer: 1, explanation: "La visibilidad continua permite detectar y reaccionar a tiempo." },
      { question: "¿Qué son los logs?", options: ["Copias de seguridad", "Registros de lo que ocurre en los sistemas", "Reglas de cortafuegos", "Certificados"], answer: 1, explanation: "Los logs son el rastro de eventos: accesos, errores, cambios…" },
      { question: "En Linux, ¿dónde se guardan muchos logs?", options: ["/home", "/var/log", "/etc/passwd", "/boot"], answer: 1, explanation: "El directorio /var/log concentra buena parte de los registros del sistema." },
      { question: "Una buena alerta debe…", options: ["Avisar de absolutamente todo", "Avisar de lo relevante evitando el ruido excesivo", "No avisar nunca", "Cifrar los logs"], answer: 1, explanation: "El equilibrio evita tanto la fatiga por exceso de avisos como los puntos ciegos." },
      { question: "¿Qué es un SOC?", options: ["Un tipo de disco", "El equipo que vigila y responde a incidentes de seguridad", "Un protocolo de red", "Una copia de seguridad"], answer: 1, explanation: "El Security Operations Center monitoriza y responde a los incidentes." },
      { question: "¿Qué hace la correlación en un SIEM?", only: "SUPERIOR", options: ["Cifrar los logs", "Relacionar eventos aislados para detectar un incidente", "Borrar los logs antiguos", "Hacer copias"], answer: 1, explanation: "Une eventos que por separado no dirían nada para revelar un ataque." },
      { question: "¿Qué es UEBA?", only: "SUPERIOR", options: ["Un antivirus", "Análisis del comportamiento de usuarios y entidades con ML para detectar desviaciones", "Un cortafuegos", "Un tipo de RAID"], answer: 1, explanation: "Aprende lo normal y alerta de comportamientos anómalos." },
    ],
  },

  16: {
    theory: [
      {
        title: "Qué es el análisis forense digital",
        paragraphs: [
          "El análisis forense investiga qué ocurrió tras un incidente: cómo entró el atacante, qué hizo y qué información se vio afectada. Su objetivo es reconstruir los hechos y, si procede, aportar pruebas válidas.",
          "La regla de oro es preservar la evidencia: trabajar siempre sobre copias, sin alterar el original, y documentar cada paso.",
        ],
        bullets: [
          "Adquirir la evidencia sin alterarla (copias verificadas con hash).",
          "Cadena de custodia: quién tuvo la evidencia, cuándo y por qué.",
          "Analizar copias, nunca el original.",
          "Documentar todo para que el análisis sea reproducible.",
        ],
      },
      {
        title: "Cadena de custodia y validez legal",
        paragraphs: [
          "La cadena de custodia registra cada persona que ha manejado la evidencia y cada acción realizada, garantizando que no se ha manipulado. Sin ella, una prueba puede ser rechazada en un juicio.",
          "Para demostrar que una copia es idéntica al original se calcula su hash antes y después: si coincide, la integridad está probada.",
        ],
      },
      {
        title: "Análisis de disco y memoria",
        paragraphs: [
          "El análisis de disco recupera archivos, historial y rastros de actividad; herramientas como Autopsy ayudan a examinarlo. El análisis de memoria (RAM), con herramientas como Volatility, revela procesos en ejecución, conexiones y datos que no quedan en el disco, muy útil ante malware.",
        ],
      },
      {
        title: "Líneas temporales e IA en el forense",
        only: "SUPERIOR",
        paragraphs: [
          "Reconstruir una línea temporal (timeline) ordena todos los eventos —creación de archivos, accesos, conexiones— para entender la secuencia del incidente. Es una de las tareas más valiosas y laboriosas.",
          "La IA acelera el forense clasificando grandes volúmenes de archivos, destacando lo relevante y ayudando a construir la línea temporal. El analista valida siempre las conclusiones: la responsabilidad y la interpretación final son humanas.",
        ],
      },
    ],
    labs: [
      {
        title: "Preservar evidencia y verificar su integridad",
        goal: "Practicar la adquisición de una evidencia y su verificación con hash, sin alterar el original.",
        environment: ["VM Ubuntu del laboratorio", "Un fichero o imagen de ejemplo a analizar"],
        steps: [
          { title: "Preparar la evidencia", detail: "Crea un archivo que represente la evidencia (por ejemplo, un pequeño volumen o un fichero de datos)." },
          { title: "Calcular el hash del original", detail: "Obtén y anota la huella del original.", code: "sha256sum evidencia.img" },
          { title: "Hacer una copia de trabajo", detail: "Copia la evidencia para trabajar sobre ella, nunca sobre el original.", code: "cp evidencia.img trabajo.img" },
          { title: "Verificar la copia", detail: "Calcula el hash de la copia y comprueba que coincide con el original.", code: "sha256sum trabajo.img" },
          { title: "Registrar la cadena de custodia", detail: "Anota fecha, hora, responsable, descripción de la evidencia y los hashes en una tabla." },
          { title: "Reflexión", detail: "Explica por qué se analiza la copia y qué invalidaría la prueba." },
        ],
        check: "Los hashes del original y la copia coinciden y tienes una tabla de cadena de custodia completa.",
      },
      {
        title: "Explorar artefactos y construir una línea temporal",
        only: "SUPERIOR",
        goal: "Analizar una imagen de ejemplo y ordenar los hallazgos en una línea temporal.",
        environment: ["VM Ubuntu del laboratorio", "Imagen de ejemplo del profesor", "Autopsy o herramientas de línea de comandos"],
        steps: [
          { title: "Montar la copia en solo lectura", detail: "Trabaja siempre en solo lectura sobre la copia para no alterarla." },
          { title: "Buscar artefactos", detail: "Localiza archivos recientes, marcas de tiempo y rastros de actividad relevantes." },
          { title: "Ordenar los eventos", detail: "Coloca cada hallazgo con su fecha y hora en una tabla ordenada cronológicamente." },
          { title: "Apoyarse en IA", detail: "Usa un asistente de IA para clasificar o resumir un conjunto de eventos y valida sus conclusiones." },
          { title: "Redactar la conclusión", detail: "Escribe un breve relato de lo sucedido basado en la línea temporal." },
        ],
        check: "Has construido una línea temporal coherente sin alterar la evidencia y has validado el apoyo de la IA.",
      },
    ],
    activities: [
      { title: "Cadena de custodia", description: "Diseña una plantilla de cadena de custodia con todos los campos necesarios y explica por qué es importante cada uno." },
      { title: "Disco o memoria", description: "Para varios objetivos de investigación, indica si buscarías la evidencia en el disco o en la memoria RAM y por qué." },
      { title: "Integridad con hash", description: "Explica cómo se demuestra que una copia de una evidencia es idéntica al original." },
      { title: "Timeline", only: "SUPERIOR", description: "A partir de una lista desordenada de eventos, construye una línea temporal y redacta qué pudo ocurrir." },
    ],
    projects: [
      {
        title: "Guía de primeros pasos ante un incidente",
        only: "MEDIO",
        description: "Elabora una guía sencilla sobre qué hacer (y qué no hacer) en los primeros minutos tras detectar un posible incidente para no destruir evidencias.",
        deliverables: ["Guía de actuación", "Checklist de preservación de evidencias"],
        evaluation: ["Corrección de las pautas (50%)", "Utilidad práctica (30%)", "Claridad (20%)"],
      },
      {
        title: "Informe forense de un caso simulado",
        only: "SUPERIOR",
        description: "Analiza una imagen de ejemplo, preserva la evidencia, construye la línea temporal y redacta un informe forense con tus conclusiones.",
        deliverables: ["Registro de cadena de custodia", "Línea temporal del incidente", "Informe forense con conclusiones"],
        evaluation: ["Preservación de la evidencia (30%)", "Línea temporal y análisis (35%)", "Informe y conclusiones (25%)", "Uso crítico de la IA (10%)"],
      },
    ],
    quiz: [
      { question: "¿Cuál es la regla de oro del análisis forense?", options: ["Trabajar rápido sobre el original", "Preservar la evidencia y analizar copias sin alterar el original", "Borrar los logs", "Reiniciar el sistema afectado"], answer: 1, explanation: "Nunca se altera el original; se trabaja sobre copias verificadas." },
      { question: "¿Para qué sirve la cadena de custodia?", options: ["Cifrar la evidencia", "Registrar quién manejó la evidencia y cuándo, garantizando que no se manipuló", "Acelerar el análisis", "Hacer copias de seguridad"], answer: 1, explanation: "Documenta el recorrido de la evidencia para que sea válida legalmente." },
      { question: "¿Cómo se demuestra que una copia es idéntica al original?", options: ["Comparando el tamaño", "Comparando el hash antes y después", "Abriendo los archivos", "Reiniciando"], answer: 1, explanation: "Si el hash coincide, la integridad está probada." },
      { question: "El análisis de memoria (RAM) es especialmente útil para…", options: ["Recuperar el fondo de pantalla", "Ver procesos en ejecución y conexiones, útil ante malware", "Cifrar el disco", "Hacer copias"], answer: 1, explanation: "La RAM revela información volátil que no queda en el disco." },
      { question: "¿Por qué se analiza una copia y no el original?", options: ["Porque es más rápido", "Para no alterar la evidencia y mantener su validez", "Porque el original no se puede leer", "Para ahorrar espacio"], answer: 1, explanation: "Trabajar sobre el original lo modificaría e invalidaría como prueba." },
      { question: "¿Qué es una línea temporal (timeline) forense?", only: "SUPERIOR", options: ["Un antivirus", "La ordenación cronológica de los eventos del incidente", "Una copia de seguridad", "Un cortafuegos"], answer: 1, explanation: "Ordena los eventos para reconstruir la secuencia del incidente." },
      { question: "En el forense, el papel de la IA es…", only: "SUPERIOR", options: ["Sustituir al analista y decidir por él", "Acelerar la clasificación y el resumen, con validación humana de las conclusiones", "Cifrar la evidencia", "Borrar los rastros"], answer: 1, explanation: "La IA ayuda, pero la interpretación y la responsabilidad son del analista." },
    ],
  },
};
