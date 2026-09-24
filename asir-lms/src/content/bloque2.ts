import type { TopicContent } from "./types";

// Bloque 2 · Hacking ético y auditoría (temas 2-7).
// Enfoque metodológico y defensivo. Toda práctica se realiza SOLO sobre las máquinas
// vulnerables del laboratorio aislado (Metasploitable, DVWA, Juice Shop) con autorización.
export const bloque2: Record<number, TopicContent> = {
  2: {
    theory: [
      {
        title: "Hacking ético: qué es y qué no es",
        paragraphs: [
          "Un hacker ético o auditor de seguridad evalúa la seguridad de sistemas con autorización expresa del propietario, con un alcance acordado y con el objetivo de corregir las debilidades encontradas. La diferencia con un atacante no está en las herramientas, sino en la autorización, la intención y la confidencialidad.",
          "Se distingue el análisis de vulnerabilidades (identificar fallos) del test de intrusión (comprobar de forma controlada su impacto). Y según la información previa: caja negra (ninguna), caja gris (parcial) y caja blanca (completa).",
        ],
      },
      {
        title: "Fases de una auditoría",
        paragraphs: ["Las metodologías comparten una estructura común:"],
        bullets: [
          "1. Acuerdo previo: alcance, autorización y reglas de actuación.",
          "2. Recolección de información sobre el objetivo.",
          "3. Análisis de vulnerabilidades.",
          "4. Verificación controlada de los hallazgos.",
          "5. Informe con hallazgos, riesgo y recomendaciones.",
          "6. Retest: verificación de las correcciones.",
        ],
      },
      {
        title: "El laboratorio seguro",
        paragraphs: [
          "Las prácticas se realizan sobre máquinas virtuales deliberadamente vulnerables y aisladas (Metasploitable, DVWA, OWASP Juice Shop), pensadas para aprender. Nunca se conectan a Internet ni a la red del centro, y se restauran con instantáneas tras cada práctica.",
          "Practicar sobre sistemas ajenos sin permiso es ilegal (Bloque 1). El objetivo del bloque es entender cómo piensa un atacante para defender mejor.",
        ],
      },
      {
        title: "Metodologías: PTES, OSSTMM y OWASP",
        only: "SUPERIOR",
        paragraphs: [
          "PTES define siete fases, del acuerdo previo al informe, incluyendo el modelado de amenazas. OSSTMM aporta un enfoque medible por canales (humano, físico, inalámbrico, redes) con la métrica RAV.",
          "OWASP publica la Web Security Testing Guide y el estándar ASVS, con requisitos verificables por niveles. Elegir y combinar metodologías da rigor y trazabilidad a la auditoría.",
        ],
      },
      {
        title: "La IA como asistente del auditor",
        only: "SUPERIOR",
        paragraphs: [
          "Los asistentes de IA ayudan a planificar la auditoría, redactar la documentación, explicar hallazgos y priorizar. Son un apoyo, no un sustituto del criterio técnico.",
          "Deben usarse con cuidado: no enviar datos confidenciales del cliente y verificar siempre sus salidas, que pueden ser inexactas.",
        ],
      },
    ],
    labs: [
      {
        title: "Preparar el laboratorio de auditoría",
        goal: "Añadir una máquina vulnerable al laboratorio aislado y verificar la conectividad para practicar de forma segura y legal.",
        environment: ["VirtualBox con la red ASIR-LAB", "Imagen de una VM vulnerable de prácticas (según indique el profesor)", "VM Ubuntu como equipo del auditor"],
        steps: [
          { title: "Importar la VM vulnerable", detail: "Importa la máquina vulnerable de prácticas y asígnale la red NAT ASIR-LAB. Confirma que NO tiene adaptador puente ni salida a Internet." },
          { title: "Comprobar el aislamiento", detail: "Desde la VM vulnerable, verifica que no hay salida a Internet (un ping a un dominio externo debe fallar). Es la garantía de que trabajas aislado." },
          { title: "Verificar la red interna", detail: "Desde la VM del auditor, comprueba que alcanzas la VM vulnerable dentro de la red del laboratorio.", code: "ping -c2 10.10.10.X" },
          { title: "Registrar el alcance", detail: "Anota en tu cuaderno qué máquina vas a auditar, su IP y que la prueba es sobre un sistema propio del laboratorio." },
          { title: "Tomar instantáneas", detail: "Crea una instantánea de ambas VM para poder restaurarlas tras cada práctica." },
        ],
        check: "La VM vulnerable está aislada (sin Internet), es accesible desde el equipo auditor dentro del laboratorio y has documentado el alcance.",
      },
      {
        title: "Recorrer las fases de una auditoría (documental)",
        only: "SUPERIOR",
        goal: "Planificar una auditoría completa sobre el laboratorio siguiendo una metodología, sin ejecutar aún las pruebas.",
        environment: ["Documento de metodología (PTES/OWASP)", "Procesador de textos"],
        steps: [
          { title: "Definir alcance y reglas", detail: "Redacta el alcance (qué VM del laboratorio), las técnicas permitidas y las prohibidas." },
          { title: "Mapear las fases", detail: "Para cada fase de PTES, describe qué harías sobre el laboratorio y qué esperas obtener." },
          { title: "Modelar amenazas", detail: "Identifica los activos de la VM y las amenazas más probables." },
          { title: "Planificar el informe", detail: "Diseña la plantilla de hallazgo (descripción, riesgo, evidencia, recomendación)." },
          { title: "Apoyo de IA", detail: "Pide a un asistente que revise tu plan y anota qué sugerencias aceptas y por qué." },
        ],
        check: "Tienes un plan de auditoría con alcance, fases mapeadas, modelado de amenazas y plantilla de informe.",
      },
    ],
    activities: [
      { title: "Atacante vs. auditor", description: "Elabora una tabla con las diferencias entre un atacante y un hacker ético (autorización, intención, confidencialidad, resultado)." },
      { title: "Ordena las fases", description: "Dadas las fases de una auditoría desordenadas, colócalas en el orden correcto y explica el objetivo de cada una." },
      { title: "Caja negra, gris o blanca", description: "Para tres encargos distintos, indica qué tipo de auditoría (caja negra/gris/blanca) sería más adecuada y por qué." },
      { title: "Compara metodologías", only: "SUPERIOR", description: "Compara PTES, OSSTMM y OWASP: enfoque, ámbito principal y cuándo usarías cada una." },
    ],
    projects: [
      {
        title: "Guía del laboratorio seguro",
        only: "MEDIO",
        description: "Elabora una guía que explique cómo montar un laboratorio de pruebas aislado y las normas éticas y legales para practicar seguridad.",
        deliverables: ["Guía de montaje del laboratorio", "Decálogo ético-legal"],
        evaluation: ["Corrección técnica del aislamiento (40%)", "Normas ético-legales (40%)", "Claridad (20%)"],
      },
      {
        title: "Plan de auditoría metodológico",
        only: "SUPERIOR",
        description: "Redacta el plan completo de una auditoría sobre el laboratorio siguiendo una metodología reconocida, listo para ejecutarse en los temas siguientes.",
        deliverables: ["Documento de alcance y autorización", "Plan por fases según metodología", "Plantilla de informe"],
        evaluation: ["Alcance y autorización (30%)", "Rigor metodológico (40%)", "Plantilla de informe (20%)", "Presentación (10%)"],
      },
    ],
    quiz: [
      { question: "¿Qué diferencia a un hacker ético de un atacante?", options: ["Las herramientas que usa", "La autorización, la intención y la confidencialidad", "La velocidad", "El sistema operativo"], answer: 1, explanation: "El auditor actúa con permiso, para mejorar la seguridad y guardando confidencialidad." },
      { question: "¿Cuál es la primera fase de una auditoría?", options: ["La explotación", "El acuerdo previo (alcance y autorización)", "El informe", "El retest"], answer: 1, explanation: "Sin alcance y autorización por escrito no debe empezarse nada." },
      { question: "El análisis de vulnerabilidades consiste en…", options: ["Corregir todos los fallos", "Identificar las debilidades de un sistema", "Redactar el contrato", "Cifrar el disco"], answer: 1, explanation: "Es la fase de localizar los fallos; verificarlos y corregirlos son pasos posteriores." },
      { question: "¿Sobre qué sistemas se practica en este bloque?", options: ["Cualquier web de Internet", "Solo máquinas vulnerables propias del laboratorio aislado", "Los servidores del centro", "Redes ajenas"], answer: 1, explanation: "Solo sobre sistemas propios y aislados; hacerlo sobre ajenos sin permiso es delito." },
      { question: "Una auditoría de caja negra se hace…", options: ["Con acceso total a la documentación", "Sin información previa del sistema", "Solo al código fuente", "Con las credenciales de administrador"], answer: 1, explanation: "En caja negra el auditor parte sin información, como un atacante externo." },
      { question: "¿Qué aporta OSSTMM frente a otras metodologías?", only: "SUPERIOR", options: ["Solo prueba webs", "Un enfoque medible por canales con la métrica RAV", "Un antivirus", "Un cortafuegos"], answer: 1, explanation: "OSSTMM propone medir la seguridad operativa de forma cuantificable." },
      { question: "El uso de IA en una auditoría debe…", only: "SUPERIOR", options: ["Sustituir al auditor", "Ser un apoyo verificado, sin enviar datos confidenciales del cliente", "Publicar los hallazgos", "Confiarse al 100 %"], answer: 1, explanation: "La IA ayuda, pero el criterio y la responsabilidad son del auditor." },
    ],
  },

  3: {
    theory: [
      {
        title: "Recolección de información (reconocimiento)",
        paragraphs: [
          "El reconocimiento es la fase en la que se reúne información sobre el objetivo antes de cualquier prueba. Cuanto mejor se conoce un sistema, mejor se puede evaluar y, sobre todo, mejor se puede defender reduciendo lo que queda expuesto.",
          "Se distingue el reconocimiento pasivo (consultar fuentes públicas sin tocar el objetivo) del activo (interactuar con él, ya dentro del alcance autorizado).",
        ],
        bullets: [
          "OSINT: inteligencia a partir de fuentes abiertas y públicas.",
          "Huella digital: todo lo que una organización expone sin darse cuenta.",
          "Objetivo defensivo: saber qué expones para reducirlo.",
        ],
      },
      {
        title: "OSINT y su marco ético-legal",
        only: "SUPERIOR",
        paragraphs: [
          "El OSINT recopila información de fuentes abiertas: webs, registros públicos, redes sociales, metadatos de documentos, buscadores especializados. Es legal cuando se consultan fuentes públicas, pero debe respetar la privacidad y la finalidad autorizada.",
          "Desde la defensa, el OSINT sirve para descubrir qué información sensible se está filtrando (correos, versiones de software, documentos internos publicados por error) y corregirlo.",
        ],
      },
      {
        title: "Reducir la huella digital",
        only: "SUPERIOR",
        paragraphs: [
          "Una vez identificada la información expuesta, la organización puede reducir su huella: limpiar metadatos de los documentos publicados, revisar qué revela su web, formar al personal sobre lo que comparte y minimizar los datos técnicos visibles.",
        ],
      },
    ],
    labs: [
      {
        title: "Analizar la huella pública de una organización de prueba",
        only: "SUPERIOR",
        goal: "Recopilar, solo de fuentes públicas y con fines defensivos, la información expuesta de un dominio de prácticas y proponer cómo reducirla.",
        environment: ["VM Ubuntu del laboratorio", "Un dominio de prácticas autorizado o de ejemplo", "Navegador y herramientas de consulta pública"],
        steps: [
          { title: "Consultar datos públicos del dominio", detail: "Revisa la información pública de registro y DNS del dominio de prácticas.", code: "whois ejemplo.org\nhost ejemplo.org" },
          { title: "Revisar metadatos de un documento", detail: "Descarga un documento publicado y observa qué metadatos incluye (autor, software, rutas)." },
          { title: "Buscar exposición con buscadores", detail: "Usa búsquedas avanzadas para ver qué páginas o ficheros del dominio están indexados públicamente." },
          { title: "Listar hallazgos", detail: "Anota qué información expuesta podría ser útil para un atacante." },
          { title: "Proponer mitigaciones", detail: "Para cada hallazgo, propón una medida defensiva (limpiar metadatos, ocultar versiones, formación)." },
        ],
        check: "Tienes una lista de información pública expuesta y, para cada elemento, una medida defensiva concreta.",
      },
    ],
    activities: [
      { title: "Pasivo vs. activo", only: "SUPERIOR", description: "Clasifica varias acciones de reconocimiento como pasivas o activas y explica las implicaciones de cada tipo." },
      { title: "Metadatos", only: "SUPERIOR", description: "Explica qué información pueden filtrar los metadatos de documentos e imágenes y cómo eliminarlos antes de publicar." },
      { title: "Huella digital propia", only: "SUPERIOR", description: "Investiga qué información tuya o del centro es pública y propón cómo reducir la exposición innecesaria." },
    ],
    projects: [
      {
        title: "Informe de exposición y plan de reducción",
        only: "SUPERIOR",
        description: "Realiza, solo con fuentes públicas y de forma ética, un análisis de la huella digital de una organización de prácticas y propón un plan para reducirla.",
        deliverables: ["Informe de información expuesta", "Plan de reducción de huella priorizado", "Recomendaciones de concienciación"],
        evaluation: ["Rigor y ética de la recolección (35%)", "Análisis de la exposición (30%)", "Plan de reducción (25%)", "Presentación (10%)"],
      },
    ],
    quiz: [
      { question: "¿Qué es el reconocimiento en una auditoría?", only: "SUPERIOR", options: ["Corregir vulnerabilidades", "Reunir información sobre el objetivo antes de las pruebas", "Redactar el informe", "Cifrar datos"], answer: 1, explanation: "Es la fase de recopilación previa de información." },
      { question: "El reconocimiento pasivo…", only: "SUPERIOR", options: ["Interactúa directamente con el objetivo", "Consulta fuentes públicas sin tocar el objetivo", "Es siempre ilegal", "Requiere credenciales"], answer: 1, explanation: "El pasivo no interactúa con el sistema; usa fuentes abiertas." },
      { question: "¿Qué es el OSINT?", only: "SUPERIOR", options: ["Un antivirus", "Inteligencia obtenida de fuentes abiertas y públicas", "Un tipo de cifrado", "Un cortafuegos"], answer: 1, explanation: "Open Source Intelligence: información de fuentes públicas." },
      { question: "Desde la defensa, el OSINT sirve para…", only: "SUPERIOR", options: ["Atacar a la competencia", "Descubrir y reducir la información sensible que la organización expone", "Cifrar el correo", "Balancear carga"], answer: 1, explanation: "Permite ver qué se filtra sin querer y corregirlo." },
      { question: "¿Qué pueden revelar los metadatos de un documento?", only: "SUPERIOR", options: ["Nada relevante", "Autor, software, rutas internas u otra información sensible", "Solo el tamaño", "La contraseña"], answer: 1, explanation: "Los metadatos filtran datos que conviene limpiar antes de publicar." },
    ],
  },

  4: {
    theory: [
      {
        title: "Análisis de vulnerabilidades",
        paragraphs: [
          "El análisis de vulnerabilidades identifica y clasifica las debilidades de un sistema. Es una foto del estado de seguridad que permite priorizar las correcciones. Se apoya en herramientas que comparan la configuración y las versiones con bases de datos de fallos conocidos.",
          "El resultado no es una lista para explotar, sino una lista para corregir, ordenada por gravedad.",
        ],
        bullets: [
          "Descubrir servicios y versiones expuestos.",
          "Contrastar con vulnerabilidades conocidas (CVE).",
          "Valorar la gravedad (CVSS) y la probabilidad de explotación.",
          "Priorizar la remediación.",
        ],
      },
      {
        title: "CVE, CVSS y priorización",
        only: "SUPERIOR",
        paragraphs: [
          "Un CVE es un identificador único de una vulnerabilidad conocida. CVSS puntúa su gravedad (0-10). EPSS estima la probabilidad de que se explote y la lista KEV recoge las que ya se explotan activamente.",
          "Combinar gravedad (CVSS), probabilidad (EPSS) y contexto del activo permite priorizar de forma realista: no todo lo grave es urgente ni todo lo urgente es grave.",
        ],
      },
      {
        title: "Detección de vulnerabilidades con IA",
        only: "SUPERIOR",
        paragraphs: [
          "La IA ayuda a triar los resultados de un escáner (reducir falsos positivos), a priorizar según el contexto y a revisar código en busca de patrones inseguros. Siempre bajo verificación humana: la IA puede tanto pasar por alto fallos como señalar problemas inexistentes.",
        ],
      },
    ],
    labs: [
      {
        title: "Descubrir servicios y comprobar el estado del laboratorio",
        goal: "Identificar qué servicios y versiones expone la VM del laboratorio para valorar su superficie de ataque.",
        environment: ["VM Ubuntu como equipo auditor", "VM de prácticas del laboratorio aislado", "nmap"],
        steps: [
          { title: "Instalar nmap", detail: "Instala la herramienta de descubrimiento de red en el equipo auditor.", code: "sudo apt update && sudo apt install -y nmap" },
          { title: "Descubrir servicios abiertos", detail: "Comprueba qué puertos y servicios expone la VM del laboratorio.", code: "nmap -sV 10.10.10.X" },
          { title: "Anotar versiones", detail: "Registra los servicios y sus versiones. Cada versión expuesta es información útil para valorar riesgos." },
          { title: "Contrastar con fallos conocidos", detail: "Busca en fuentes públicas (por ejemplo, la base de datos CVE) si alguna versión detectada tiene vulnerabilidades conocidas." },
          { title: "Proponer mitigaciones", detail: "Para cada servicio con versión antigua, propón actualizar, desactivar si no se usa o restringir el acceso." },
          { title: "Documentar", detail: "Elabora una tabla: servicio, versión, riesgo y recomendación." },
        ],
        check: "Tienes el inventario de servicios y versiones de la VM y, para cada uno, una recomendación defensiva.",
      },
      {
        title: "Priorizar vulnerabilidades con CVSS, EPSS y apoyo de IA",
        only: "SUPERIOR",
        goal: "Ordenar una lista de hallazgos según su riesgo real combinando métricas y contexto.",
        environment: ["Informe de escáner de ejemplo (proporcionado por el profesor)", "Hoja de cálculo", "Asistente de IA"],
        steps: [
          { title: "Partir del informe", detail: "Toma el informe de vulnerabilidades de ejemplo con sus CVE." },
          { title: "Anotar CVSS y EPSS", detail: "Para cada CVE, registra su puntuación CVSS y, si está disponible, su EPSS." },
          { title: "Añadir el contexto", detail: "Valora la importancia del activo afectado (¿es crítico?, ¿está expuesto a Internet?)." },
          { title: "Priorizar", detail: "Ordena los hallazgos combinando gravedad, probabilidad y contexto; justifica el top 3." },
          { title: "Contraste con IA", detail: "Pide a un asistente que priorice la misma lista y compara con tu criterio, anotando diferencias y errores." },
        ],
        check: "Tienes una priorización justificada por gravedad, probabilidad y contexto, y una comparación crítica con la IA.",
      },
    ],
    activities: [
      { title: "Superficie de ataque", description: "Explica qué es la superficie de ataque y enumera cinco formas de reducirla en un servidor." },
      { title: "Actualizar es defender", description: "A partir de una lista de servicios con versiones antiguas, indica para cada uno la medida defensiva prioritaria." },
      { title: "Falsos positivos", only: "SUPERIOR", description: "Explica qué es un falso positivo en un escáner de vulnerabilidades y por qué es importante triarlos." },
      { title: "CVSS vs. EPSS", only: "SUPERIOR", description: "Explica la diferencia entre CVSS y EPSS y por qué conviene usar ambos para priorizar." },
    ],
    projects: [
      {
        title: "Inventario y estado de seguridad de un servidor",
        only: "MEDIO",
        description: "Realiza el inventario de servicios de la VM del laboratorio y propón un plan de mejora (actualizaciones, servicios innecesarios) explicado con claridad.",
        deliverables: ["Tabla de servicios y versiones", "Plan de mejoras priorizado"],
        evaluation: ["Inventario correcto (40%)", "Recomendaciones (40%)", "Claridad (20%)"],
      },
      {
        title: "Informe de análisis y priorización de vulnerabilidades",
        only: "SUPERIOR",
        description: "Analiza la VM del laboratorio, elabora el listado de hallazgos con su riesgo y prioriza la remediación combinando métricas y contexto.",
        deliverables: ["Listado de hallazgos con CVSS", "Priorización justificada", "Plan de remediación"],
        evaluation: ["Rigor del análisis (35%)", "Priorización (35%)", "Plan de remediación (20%)", "Presentación (10%)"],
      },
    ],
    quiz: [
      { question: "¿Qué produce un análisis de vulnerabilidades?", options: ["Una lista de fallos para corregir, ordenada por gravedad", "Un cifrado del disco", "Una copia de seguridad", "Un balanceador"], answer: 0, explanation: "Es una foto de las debilidades para priorizar su corrección." },
      { question: "Descubrir las versiones de los servicios sirve para…", options: ["Acelerar la red", "Saber si tienen vulnerabilidades conocidas y actuar", "Cifrar el correo", "Hacer copias"], answer: 1, explanation: "Las versiones permiten contrastar con bases de datos de fallos conocidos." },
      { question: "Ante un servicio con una versión antigua y vulnerable, lo prioritario es…", options: ["Ignorarlo", "Actualizarlo, desactivarlo si no se usa o restringir su acceso", "Publicarlo", "Cifrar el disco"], answer: 1, explanation: "Reducir el riesgo actuando sobre el servicio afectado." },
      { question: "Reducir la superficie de ataque significa…", options: ["Abrir más puertos", "Exponer lo mínimo imprescindible", "Instalar más software", "Desactivar el cortafuegos"], answer: 1, explanation: "Menos servicios y datos expuestos implican menos oportunidades de ataque." },
      { question: "¿Qué es un CVE?", only: "SUPERIOR", options: ["Un antivirus", "Un identificador único de una vulnerabilidad conocida", "Un cortafuegos", "Una copia"], answer: 1, explanation: "Common Vulnerabilities and Exposures identifica cada fallo conocido." },
      { question: "¿Qué mide CVSS?", only: "SUPERIOR", options: ["La probabilidad de explotación", "La gravedad de una vulnerabilidad (0-10)", "El tamaño del disco", "La velocidad de red"], answer: 1, explanation: "CVSS puntúa la severidad; EPSS estima la probabilidad de explotación." },
      { question: "El papel de la IA en el análisis de vulnerabilidades es…", only: "SUPERIOR", options: ["Decidir sin supervisión", "Ayudar a triar y priorizar, bajo verificación humana", "Explotar los fallos", "Cifrar los resultados"], answer: 1, explanation: "Apoya el triaje y la priorización, pero el técnico valida las conclusiones." },
    ],
  },

  5: {
    theory: [
      {
        title: "Del hallazgo a la comprobación",
        paragraphs: [
          "Tras identificar una vulnerabilidad, el test de intrusión comprueba de forma controlada si es realmente explotable y qué impacto tendría. El objetivo no es causar daño, sino demostrar el riesgo para justificar su corrección.",
          "Toda esta fase se realiza únicamente en el laboratorio aislado, sobre máquinas propias y con instantáneas para restaurar. Fuera de ese entorno y sin autorización, sería ilegal.",
        ],
        bullets: [
          "Verificar el impacto real de una vulnerabilidad, no dañar.",
          "Trabajar siempre en el laboratorio aislado y autorizado.",
          "Documentar cada paso para el informe.",
          "Cerrar con recomendaciones de mitigación.",
        ],
      },
      {
        title: "Ciclo de una prueba y post-explotación responsable",
        only: "SUPERIOR",
        paragraphs: [
          "El ciclo típico consiste en preparar la prueba, verificar la vulnerabilidad de forma controlada, valorar el alcance (qué se habría podido comprometer) y documentar. La post-explotación en una auditoría se limita a demostrar el impacto sin causar daños ni exfiltrar datos reales.",
          "Cada acción se registra con evidencias (capturas, salidas) que sustentarán el informe y permitirán al cliente reproducir y corregir el problema.",
        ],
      },
      {
        title: "IA en pentesting: apoyo, límites y ética",
        only: "SUPERIOR",
        paragraphs: [
          "La IA puede ayudar a entender una vulnerabilidad, sugerir vías de comprobación o redactar la documentación. Presenta límites importantes: comete errores (alucinaciones), puede proponer acciones peligrosas o fuera de alcance, y no asume responsabilidad.",
          "El uso ético exige mantenerse dentro del alcance autorizado, no automatizar acciones sin control, no enviar datos del cliente a servicios externos y validar siempre lo que la IA sugiere. La responsabilidad es del auditor.",
        ],
      },
    ],
    labs: [
      {
        title: "Verificar una vulnerabilidad conocida en el laboratorio",
        only: "SUPERIOR",
        goal: "Comprobar de forma controlada una debilidad de una máquina vulnerable del laboratorio y proponer su mitigación, documentándolo para el informe.",
        environment: ["Laboratorio aislado con una VM vulnerable de prácticas", "VM del auditor", "Instantáneas para restaurar"],
        steps: [
          { title: "Restaurar y delimitar", detail: "Restaura las instantáneas y confirma por escrito que trabajas sobre una VM propia y aislada." },
          { title: "Partir de un hallazgo", detail: "Toma una vulnerabilidad identificada en el tema anterior (por ejemplo, un servicio desactualizado)." },
          { title: "Comprobar de forma controlada", detail: "Verifica que la debilidad existe realmente, siguiendo la guía del profesor, sin causar daño ni alterar datos." },
          { title: "Valorar el impacto", detail: "Describe qué se habría podido comprometer si fuera un sistema real, para justificar el riesgo." },
          { title: "Proponer la mitigación", detail: "Indica la corrección (actualizar, reconfigurar, restringir) y, si es posible, compruébala." },
          { title: "Documentar el hallazgo", detail: "Redacta la ficha: descripción, evidencia, riesgo y recomendación." },
        ],
        check: "Has verificado la debilidad sin causar daño, propuesto su mitigación y documentado el hallazgo para el informe.",
      },
    ],
    activities: [
      { title: "Verificar no es dañar", only: "SUPERIOR", description: "Explica la diferencia entre demostrar el impacto de una vulnerabilidad en una auditoría y causar un daño real, con ejemplos." },
      { title: "Dentro del alcance", only: "SUPERIOR", description: "Ante varias acciones propuestas durante una prueba, indica cuáles quedarían dentro del alcance autorizado y cuáles no." },
      { title: "Límites de la IA", only: "SUPERIOR", description: "Enumera cinco riesgos de apoyarse en un asistente de IA durante un pentest y cómo mitigarlos." },
    ],
    projects: [
      {
        title: "Comprobación guiada de vulnerabilidades y mitigaciones",
        only: "SUPERIOR",
        description: "Sobre la VM del laboratorio, verifica de forma controlada dos vulnerabilidades, propón y aplica sus mitigaciones y documenta el proceso con un uso crítico de la IA.",
        deliverables: ["Documento de alcance y aislamiento", "Fichas de los hallazgos con evidencias", "Mitigaciones aplicadas y verificadas", "Reflexión sobre el uso de la IA"],
        evaluation: ["Trabajo controlado y ético (30%)", "Verificación de los hallazgos (25%)", "Mitigaciones aplicadas (25%)", "Uso crítico de la IA y documentación (20%)"],
      },
    ],
    quiz: [
      { question: "¿Cuál es el objetivo de comprobar una vulnerabilidad en una auditoría?", only: "SUPERIOR", options: ["Causar el máximo daño", "Demostrar el riesgo de forma controlada para justificar la corrección", "Robar datos", "Publicar el fallo"], answer: 1, explanation: "Se demuestra el impacto sin dañar, para que se corrija." },
      { question: "¿Dónde se realizan estas pruebas?", only: "SUPERIOR", options: ["En cualquier sistema", "Solo en el laboratorio aislado y autorizado", "En la red del centro", "En servidores públicos"], answer: 1, explanation: "Fuera de un entorno propio y autorizado sería ilegal." },
      { question: "En una auditoría, la post-explotación responsable…", only: "SUPERIOR", options: ["Exfiltra datos reales", "Demuestra el impacto sin causar daños ni robar información", "Destruye el sistema", "Se salta el alcance"], answer: 1, explanation: "Se limita a evidenciar el alcance del problema, sin daño real." },
      { question: "¿Por qué se documenta cada paso?", only: "SUPERIOR", options: ["Para alargar el trabajo", "Para sustentar el informe y que el cliente pueda reproducir y corregir", "Para publicarlo", "No hace falta"], answer: 1, explanation: "Las evidencias dan validez al informe y guían la corrección." },
      { question: "Un límite importante de la IA en pentesting es…", only: "SUPERIOR", options: ["Que es infalible", "Que puede cometer errores y proponer acciones fuera de alcance, sin asumir responsabilidad", "Que cifra el disco", "Que hace copias"], answer: 1, explanation: "La IA se equivoca y no responde por sus sugerencias; el auditor valida y responde." },
      { question: "El uso ético de la IA en una prueba exige…", only: "SUPERIOR", options: ["Enviar datos del cliente a cualquier servicio", "Mantenerse en el alcance, no automatizar sin control y validar lo sugerido", "Automatizarlo todo", "Confiar sin revisar"], answer: 1, explanation: "Alcance, control humano, confidencialidad y verificación son imprescindibles." },
    ],
  },

  6: {
    theory: [
      {
        title: "Seguridad de aplicaciones web",
        paragraphs: [
          "Las aplicaciones web son uno de los principales objetivos porque están expuestas a Internet. Conocer sus fallos típicos permite desarrollarlas y configurarlas de forma segura.",
          "OWASP publica el Top 10, la lista de los riesgos más críticos en aplicaciones web, que sirve de guía tanto para auditar como para desarrollar con seguridad.",
        ],
        bullets: [
          "Validar y controlar siempre la entrada del usuario.",
          "Gestionar bien la autenticación y el control de acceso.",
          "Proteger los datos en tránsito y en reposo.",
          "Mantener dependencias y componentes actualizados.",
        ],
      },
      {
        title: "OWASP Top 10 y ASVS",
        only: "SUPERIOR",
        paragraphs: [
          "El OWASP Top 10 recoge categorías como el control de acceso roto, los fallos criptográficos, la inyección o el uso de componentes vulnerables. Cada categoría incluye cómo prevenirla.",
          "ASVS (Application Security Verification Standard) es un estándar con requisitos verificables en tres niveles, útil para definir qué debe cumplir una aplicación segura. Las prácticas se realizan sobre aplicaciones vulnerables de laboratorio como DVWA o Juice Shop.",
        ],
      },
      {
        title: "OWASP para aplicaciones con LLM",
        only: "SUPERIOR",
        paragraphs: [
          "Las aplicaciones que integran modelos de lenguaje tienen riesgos propios, recogidos en el OWASP Top 10 for LLM Applications: inyección de instrucciones (prompt injection), fuga de datos sensibles, dependencia excesiva del modelo o manejo inseguro de sus salidas.",
          "Defenderlas implica validar entradas y salidas del modelo, limitar sus permisos, no exponerle datos confidenciales y tratar su respuesta como una entrada no confiable más.",
        ],
      },
    ],
    labs: [
      {
        title: "Explorar el OWASP Top 10 en una app de laboratorio",
        only: "SUPERIOR",
        goal: "Reconocer, sobre una aplicación vulnerable de laboratorio, dos riesgos del OWASP Top 10 y sus defensas.",
        environment: ["Aplicación web vulnerable de laboratorio (DVWA o Juice Shop) en la red aislada", "Navegador"],
        steps: [
          { title: "Desplegar la app", detail: "Levanta la aplicación vulnerable de prácticas en el laboratorio aislado, sin salida a Internet." },
          { title: "Recorrer las categorías", detail: "Consulta el OWASP Top 10 y localiza en la app dos categorías (por ejemplo, control de acceso y validación de entrada)." },
          { title: "Observar el comportamiento inseguro", detail: "Siguiendo la guía del profesor, comprueba de forma controlada por qué la app es vulnerable en esos puntos." },
          { title: "Identificar la defensa", detail: "Para cada categoría, describe la medida que la evitaría (validación, control de acceso, consultas parametrizadas…)." },
          { title: "Documentar", detail: "Redacta una ficha por categoría: riesgo, evidencia y defensa recomendada." },
        ],
        check: "Has identificado dos categorías del OWASP Top 10 en la app y, para cada una, su defensa correcta.",
      },
    ],
    activities: [
      { title: "Explora el OWASP Top 10", only: "SUPERIOR", description: "Resume tres categorías del OWASP Top 10 explicando el riesgo y cómo se previene cada una." },
      { title: "Validar la entrada", only: "SUPERIOR", description: "Explica por qué nunca hay que confiar en la entrada del usuario y da tres ejemplos de validación." },
      { title: "Riesgos de las apps con IA", only: "SUPERIOR", description: "A partir del OWASP Top 10 for LLM, explica qué es el prompt injection y cómo mitigarlo." },
    ],
    projects: [
      {
        title: "Guía de desarrollo web seguro",
        only: "SUPERIOR",
        description: "Elabora una guía de buenas prácticas de desarrollo web seguro basada en el OWASP Top 10, incluyendo un apartado para aplicaciones que integran IA.",
        deliverables: ["Guía por categorías del OWASP Top 10 con defensas", "Apartado de seguridad para apps con LLM", "Checklist para revisar una aplicación"],
        evaluation: ["Cobertura y corrección (40%)", "Defensas prácticas (30%)", "Apartado de IA (20%)", "Presentación (10%)"],
      },
    ],
    quiz: [
      { question: "¿Por qué las aplicaciones web son un objetivo frecuente?", only: "SUPERIOR", options: ["Porque son lentas", "Porque están expuestas a Internet", "Porque no usan bases de datos", "Porque no tienen usuarios"], answer: 1, explanation: "Su exposición pública las convierte en un blanco habitual." },
      { question: "¿Qué es el OWASP Top 10?", only: "SUPERIOR", options: ["Un antivirus", "La lista de los riesgos más críticos en aplicaciones web", "Un lenguaje de programación", "Un cortafuegos"], answer: 1, explanation: "Es la referencia de los riesgos web más importantes y cómo prevenirlos." },
      { question: "¿Qué buena práctica evita muchos fallos web?", only: "SUPERIOR", options: ["Confiar en toda la entrada del usuario", "Validar y controlar siempre la entrada del usuario", "Desactivar HTTPS", "No actualizar dependencias"], answer: 1, explanation: "Nunca se debe confiar en la entrada; validarla evita numerosos ataques." },
      { question: "¿Para qué sirve ASVS?", only: "SUPERIOR", options: ["Cifrar discos", "Definir requisitos verificables de seguridad para aplicaciones", "Balancear carga", "Hacer copias"], answer: 1, explanation: "El estándar ASVS establece qué debe cumplir una aplicación segura, por niveles." },
      { question: "¿Qué es el prompt injection?", only: "SUPERIOR", options: ["Un fallo de red", "Manipular las instrucciones de un modelo de lenguaje mediante la entrada", "Un tipo de RAID", "Un cifrado"], answer: 1, explanation: "Consiste en inyectar instrucciones que alteran el comportamiento del LLM." },
      { question: "Ante la salida de un LLM en una aplicación conviene…", only: "SUPERIOR", options: ["Confiar en ella sin más", "Tratarla como una entrada no confiable y validarla", "Publicarla siempre", "Guardarla sin revisar"], answer: 1, explanation: "La respuesta del modelo puede ser insegura; hay que validarla como cualquier entrada." },
    ],
  },

  7: {
    theory: [
      {
        title: "El factor humano y la concienciación",
        paragraphs: [
          "La ingeniería social manipula a las personas para que revelen información o realicen acciones que comprometen la seguridad. Por muy buena que sea la tecnología, el eslabón humano suele ser el más débil.",
          "La mejor defensa es la concienciación: formar a las personas para reconocer engaños (phishing, llamadas fraudulentas, suplantaciones) y saber cómo reaccionar.",
        ],
        bullets: [
          "Phishing (correo), vishing (voz), smishing (SMS).",
          "Señales de alerta: urgencia, autoridad, premios, miedo.",
          "Verificar por otro canal antes de actuar.",
          "Cultura de reportar sin miedo los intentos.",
        ],
      },
      {
        title: "Seguridad en redes inalámbricas",
        only: "SUPERIOR",
        paragraphs: [
          "Las redes Wi-Fi son un punto sensible: si están mal protegidas, permiten el acceso a la red interna. La recomendación actual es usar WPA3 (o WPA2 con contraseñas robustas), separar la red de invitados y cambiar las credenciales por defecto de los equipos.",
          "También conviene ocultar información innecesaria, mantener el firmware actualizado y monitorizar los dispositivos conectados.",
        ],
      },
      {
        title: "Deepfakes y fraude generado con IA",
        only: "SUPERIOR",
        paragraphs: [
          "La IA generativa permite crear correos convincentes, clonar voces (vishing) e incluso vídeos falsos (deepfakes) para suplantar a directivos o familiares. Esto hace la ingeniería social más creíble y peligrosa.",
          "Las defensas combinan concienciación, verificación por canales alternativos, procedimientos de doble confirmación para operaciones sensibles (como transferencias) y herramientas de detección de contenido sintético.",
        ],
      },
    ],
    labs: [
      {
        title: "Analizar intentos de ingeniería social",
        goal: "Reconocer las señales de un intento de fraude y definir cómo reaccionar.",
        environment: ["Conjunto de ejemplos de mensajes fraudulentos (proporcionados por el profesor)", "Cuaderno"],
        steps: [
          { title: "Revisar los ejemplos", detail: "Analiza varios mensajes (correos, SMS) e identifica cuáles son fraudulentos." },
          { title: "Señalar los indicios", detail: "Para cada uno, marca las señales de alerta: urgencia, remitente sospechoso, enlaces extraños, petición de datos." },
          { title: "Definir la reacción", detail: "Escribe qué harías ante cada mensaje (no pulsar, verificar por otro canal, reportar)." },
          { title: "Crear un cartel de concienciación", detail: "Diseña un cartel breve con las 5 señales clave para reconocer un fraude." },
          { title: "Reflexión sobre IA", detail: "Explica por qué la IA hace estos fraudes más convincentes y qué señales siguen siendo útiles." },
        ],
        check: "Distingues los mensajes fraudulentos, justificas por qué y tienes un material de concienciación claro.",
      },
      {
        title: "Revisar la configuración de una red Wi-Fi segura",
        only: "SUPERIOR",
        goal: "Definir la configuración segura de una red inalámbrica y una red de invitados separada.",
        environment: ["Documentación de un punto de acceso (manual o simulador)", "Cuaderno"],
        steps: [
          { title: "Elegir el cifrado", detail: "Indica qué protocolo usarías (WPA3 o WPA2 robusto) y por qué descartas los antiguos." },
          { title: "Credenciales", detail: "Define una política de contraseña del Wi-Fi y explica por qué cambiar las credenciales por defecto del equipo." },
          { title: "Red de invitados", detail: "Diseña una red de invitados aislada de la red interna y justifica su utilidad." },
          { title: "Mantenimiento", detail: "Enumera medidas continuas: actualizar firmware, revisar dispositivos conectados, desactivar servicios innecesarios." },
          { title: "Documentar", detail: "Reúne todo en una ficha de configuración Wi-Fi segura." },
        ],
        check: "Tu ficha define cifrado moderno, credenciales robustas, red de invitados aislada y mantenimiento.",
      },
    ],
    activities: [
      { title: "Señales de fraude", description: "Elabora una lista de 8 señales que ayudan a reconocer un intento de ingeniería social." },
      { title: "Plan de concienciación", description: "Diseña un pequeño plan de concienciación para el personal de una empresa (temas, formato y frecuencia)." },
      { title: "Verificar por otro canal", description: "Explica con un ejemplo por qué ante una petición urgente conviene confirmar por un canal distinto." },
      { title: "Defensa ante deepfakes", only: "SUPERIOR", description: "Propón medidas y procedimientos para protegerse frente a suplantaciones por voz o vídeo generadas con IA." },
    ],
    projects: [
      {
        title: "Campaña de concienciación",
        only: "MEDIO",
        description: "Diseña una campaña de concienciación sobre fraudes digitales para los compañeros del centro: materiales, mensajes clave y actividad práctica.",
        deliverables: ["Materiales de la campaña (carteles/infografía)", "Guion de una charla breve"],
        evaluation: ["Claridad de los mensajes (40%)", "Utilidad práctica (40%)", "Creatividad y presentación (20%)"],
      },
      {
        title: "Plan de defensa ante ingeniería social e IA",
        only: "SUPERIOR",
        description: "Elabora un plan para proteger a una organización frente a la ingeniería social potenciada con IA: concienciación, procedimientos de verificación y configuración de red segura.",
        deliverables: ["Plan de concienciación", "Procedimientos de doble verificación para operaciones sensibles", "Ficha de configuración Wi-Fi segura"],
        evaluation: ["Cobertura del plan (35%)", "Procedimientos de verificación (30%)", "Configuración de red (20%)", "Presentación (15%)"],
      },
    ],
    quiz: [
      { question: "¿Qué es la ingeniería social?", options: ["Un fallo de hardware", "Manipular a las personas para que comprometan la seguridad", "Un tipo de cifrado", "Un protocolo de red"], answer: 1, explanation: "Explota el factor humano en lugar de fallos técnicos." },
      { question: "¿Cuál es la mejor defensa frente a la ingeniería social?", options: ["Un antivirus", "La concienciación y formación de las personas", "Un RAID", "Más ancho de banda"], answer: 1, explanation: "Personas formadas reconocen y frenan los engaños." },
      { question: "Ante un correo urgente que pide tus datos, lo correcto es…", options: ["Responder de inmediato", "Desconfiar y verificar por otro canal antes de actuar", "Reenviarlo a todos", "Pulsar el enlace para comprobar"], answer: 1, explanation: "La urgencia es una señal de alerta; verificar por otro canal evita el fraude." },
      { question: "¿Qué es el vishing?", options: ["Fraude por vídeo", "Fraude mediante llamadas de voz", "Un antivirus", "Un tipo de Wi-Fi"], answer: 1, explanation: "El vishing es la ingeniería social a través de llamadas telefónicas." },
      { question: "Una cultura de seguridad sana incluye…", options: ["Castigar a quien reporta", "Reportar sin miedo los intentos de fraude", "Ocultar los incidentes", "No formar al personal"], answer: 1, explanation: "Reportar sin miedo permite detectar y frenar campañas a tiempo." },
      { question: "¿Qué protocolo Wi-Fi es el recomendado actualmente?", only: "SUPERIOR", options: ["WEP", "WPA3 (o WPA2 con contraseña robusta)", "Red abierta", "WPA original"], answer: 1, explanation: "WPA3 es el más seguro; los antiguos como WEP están obsoletos." },
      { question: "¿Cómo protegerse mejor de un deepfake de voz que pide una transferencia?", only: "SUPERIOR", options: ["Hacer la transferencia de inmediato", "Aplicar un procedimiento de doble verificación por otro canal", "Confiar en la voz", "Ignorar toda llamada"], answer: 1, explanation: "La doble confirmación por un canal alternativo frena la suplantación." },
    ],
  },
};
