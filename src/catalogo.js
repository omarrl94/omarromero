/* Catálogo inicial del campus: las tres formaciones que ya tienen plataforma propia.
   En modo demostración se carga tal cual; con Firebase, el administrador lo sube desde
   Panel → Catálogo → «Cargar catálogo inicial» y a partir de ahí se edita desde el panel.
   Precios y direcciones (url) son orientativos: revísalos antes de abrir la matrícula. */
export const CATALOGO_INICIAL = [
  {
    id: "curso-claude",
    tipo: "curso",
    titulo: "Especialización en Ingeniería de IA, Skills, MCP y Automatización con Claude",
    corto: "Curso de Claude",
    resumen: "Aprende a construir con IA lo que se usa de verdad en una empresa: asistentes que programan, servidores MCP que conectan la IA con tus sistemas y automatizaciones seguras.",
    descripcion: "Curso práctico para usar Claude como lo usa un profesional: integrarlo en aplicaciones, automatizar la administración de sistemas y conectarlo con bases de datos, Git, Docker y logs mediante MCP. Cada sesión tiene teoría con ejemplos, un taller paso a paso con código real, biblioteca de prompts, actividad práctica y test de autoevaluación. El trabajo es individual y cada alumno sigue el itinerario de su ciclo (DAM o ASIR).",
    horas: 60,
    duracion: "12 sesiones en 4 bloques",
    modalidad: "Online con seguimiento docente",
    nivel: "Grado Superior DAM y ASIR",
    titulacion: "Título Propio del Centro con código de verificación",
    edicion: "Curso 2026-2027",
    precio: 149,
    estado: "abierta",
    url: "https://curso-claude-jrotero.netlify.app",
    incluidaCentro: false,
    destacada: true,
    orden: 1,
    aprenderas: [
      "Elegir el modelo adecuado y calcular lo que cuesta cada tarea.",
      "Escribir prompts profesionales: XML, ejemplos y salidas JSON garantizadas.",
      "Trabajar con Claude Code en la terminal: memoria de proyecto, Skills, comandos y hooks.",
      "Crear servidores MCP en Python que conecten la IA con bases de datos, Docker y logs.",
      "Llevar la IA a producción: streaming, caché, lotes y control de costes.",
      "Defenderte de la inyección de instrucciones y proteger los datos personales (RGPD, EU AI Act)."
    ],
    temario: [
      { titulo: "Bloque 1 · Fundamentos, Context Engineering y Pensamiento Extendido", items: [
        "Ecosistema Claude: modelos, tokens y primera llamada a la API",
        "Pensamiento extendido: adaptive thinking y esfuerzo",
        "Context Engineering: XML, Few-Shot, salidas estructuradas, Artifacts y Projects"] },
      { titulo: "Bloque 2 · Claude Code (CLI), Skills y Automatización", items: [
        "Claude Code en terminal y memoria de proyecto con CLAUDE.md",
        "Creación de Skills personalizadas (SKILL.md)",
        "Comandos slash propios, Hooks de seguridad y subagentes"] },
      { titulo: "Bloque 3 · Conexiones en tiempo real con MCP", items: [
        "Arquitectura MCP: Host, Client, Server, primitivas y transportes",
        "Conexiones en vivo: bases de datos, Git, Docker y logs",
        "Servidor MCP propio en Python: Resources, Tools y Prompts"] },
      { titulo: "Bloque 4 · API en producción, Tool Use, Computer Use, Ciberseguridad y Título", items: [
        "API en producción: SDK, streaming, Prompt Caching, Batch API y conector MCP",
        "Tool Use, Computer Use y ciberseguridad en LLMs",
        "Proyecto Final Integrador (individual, versión DAM o ASIR) y Título Propio"] }
    ],
    requisitos: [
      "Saber programar lo básico (DAM) o manejarte en la terminal de Linux y PowerShell (ASIR).",
      "Un ordenador donde puedas instalar Python 3.11+, Java 21 (DAM), Docker y Node.js.",
      "Una cuenta de GitHub para entregar las prácticas."
    ]
  },
  {
    id: "master-ia-dam",
    tipo: "master",
    titulo: "Máster en Inteligencia Artificial Aplicada al Desarrollo de Aplicaciones Multiplataforma",
    corto: "Máster IA · DAM",
    resumen: "Edición intensiva de un trimestre para titulados en DAM: de Python para IA a agentes, RAG y apps con IA en producción, con Proyecto Final defendido ante tribunal.",
    descripcion: "Título propio del centro (sin carácter oficial) de 300 horas. Siete módulos (M1–M7), cinco seminarios con empresas, tres jornadas presenciales con examen y un Proyecto Final de Máster de 60 horas, preferiblemente propuesto por una empresa colaboradora. Cada módulo se evalúa con proyecto (50 %), examen presencial (40 %) y entregas semanales (10 %).",
    horas: 300,
    duracion: "15 semanas · 1 oct 2029 – 26 ene 2030",
    modalidad: "Semipresencial intensiva: online con tutor y 3 jornadas presenciales en Madrid",
    nivel: "Titulados en DAM (DAW, ASIR o universitarios, previa entrevista)",
    titulacion: "Título propio del centro con diploma, suplemento y código de verificación",
    edicion: "1.ª edición · 30 plazas",
    precio: 1290,
    estado: "abierta",
    url: "https://master-ia.jrotero.es",
    incluidaCentro: false,
    destacada: true,
    orden: 2,
    aprenderas: [
      "Programar con Python para datos y trabajar con asistentes de código de forma crítica.",
      "Entrenar modelos de machine learning y deep learning y publicarlos como servicio.",
      "Construir asistentes con LLMs, salidas estructuradas y llamada a funciones.",
      "Diseñar sistemas RAG con bases vectoriales y evaluarlos.",
      "Crear agentes que automatizan procesos reales con supervisión humana.",
      "Integrar IA en apps Android, Flutter, web y escritorio y llevarlas a producción."
    ],
    temario: [
      { titulo: "M1 · Fundamentos: Python para IA y desarrollo asistido por IA (30 h)", items: ["Python para datos, asistentes de código, prompts para programar y riesgos"] },
      { titulo: "M2 · Aprendizaje automático y deep learning (40 h)", items: ["scikit-learn, validación y métricas, PyTorch, transfer learning y embeddings"] },
      { titulo: "M3 · IA generativa y modelos de lenguaje (40 h)", items: ["Cómo funcionan los LLM, APIs y modelos locales, JSON y funciones, imagen y voz"] },
      { titulo: "M4 · Recuperación aumentada (RAG) y bases vectoriales (35 h)", items: ["Embeddings, pgvector/Chroma/Qdrant, búsqueda híbrida y evaluación"] },
      { titulo: "M5 · Agentes de IA y automatización (35 h)", items: ["Herramientas, memoria, MCP, multiagente y seguridad de agentes"] },
      { titulo: "M6 · IA en apps multiplataforma y puesta en producción (40 h)", items: ["Kotlin, Flutter, modelos en el dispositivo, Docker, nube y LLMOps"] },
      { titulo: "M7 · Ética, normativa y uso responsable de la IA (10 h)", items: ["Reglamento (UE) 2024/1689, RGPD, licencias, sesgos y sostenibilidad"] },
      { titulo: "PFM · Proyecto Final de Máster (60 h)", items: ["Producto funcional que resuelve un problema real, defendido ante tribunal"] }
    ],
    requisitos: [
      "Título de Técnico Superior en DAM (otras vías, previa entrevista).",
      "Asistir a las 3 jornadas presenciales con examen.",
      "Aceptar expresamente el carácter de título propio."
    ]
  },
  {
    id: "modulo-sad",
    tipo: "modulo",
    titulo: "Seguridad y Alta Disponibilidad",
    corto: "Módulo SAD · ASIR",
    resumen: "El módulo de ciberseguridad de ASIR con el enfoque de la IA: hacking ético, hardening, alta disponibilidad, SIEM y análisis forense.",
    descripcion: "Plataforma del módulo Seguridad y Alta Disponibilidad con contenido adaptado a Grado Medio y Grado Superior. 19 temas en 6 bloques; cada tema incluye su enfoque de Inteligencia Artificial en la ciberseguridad, laboratorio guiado y autoevaluación. Grado Medio ve la versión simplificada; Grado Superior, el temario completo con hacking ético y análisis forense.",
    horas: 100,
    duracion: "19 temas en 6 bloques",
    modalidad: "Online · apoyo a las clases presenciales",
    nivel: "Grado Medio y Grado Superior (ASIR)",
    titulacion: "Certificado de aprovechamiento del centro",
    edicion: "Curso 2026-2027",
    precio: 79,
    estado: "abierta",
    url: "",
    incluidaCentro: true,
    destacada: false,
    orden: 3,
    aprenderas: [
      "Aplicar el marco legal de la seguridad y del uso de IA (AI Act y datos personales).",
      "Planificar y documentar auditorías y pentesting autorizados, asistidos por IA.",
      "Bastionar sistemas Windows y Linux y proteger el perímetro con IDS/IPS.",
      "Montar alta disponibilidad, balanceo de carga y copias de seguridad.",
      "Monitorizar con SIEM y hacer análisis forense digital.",
      "Redactar informes técnicos y ejecutivos."
    ],
    temario: [
      { titulo: "Bloque 1 · Fundamentos y marco legal", items: ["Fundamentos de la seguridad informática", "Marco legal y normativo"] },
      { titulo: "Bloque 2 · Hacking ético y auditoría", items: ["Introducción al hacking ético y metodologías", "Recolección de información", "Análisis de vulnerabilidades", "Pentesting asistido por IA", "Seguridad de aplicaciones web", "Ingeniería social y redes inalámbricas"] },
      { titulo: "Bloque 3 · Defensa y hardening", items: ["Hardening de sistemas Windows", "Hardening de sistemas Linux", "Seguridad perimetral", "Criptografía aplicada"] },
      { titulo: "Bloque 4 · Alta disponibilidad", items: ["Alta disponibilidad y clustering", "Balanceo de carga y virtualización", "Continuidad de negocio y copias de seguridad"] },
      { titulo: "Bloque 5 · Visibilidad y forense", items: ["Monitorización y SIEM", "Análisis forense digital"] },
      { titulo: "Bloque 6 · Informe y proyecto final", items: ["Informe técnico y ejecutivo"] }
    ],
    requisitos: [
      "Estar cursando ASIR (Grado Superior) o el ciclo de Grado Medio correspondiente, o tener conocimientos equivalentes de redes y sistemas.",
      "Un equipo capaz de ejecutar máquinas virtuales."
    ]
  }
];

// Campos editables desde el panel (también los que validan las reglas de Firestore)
export const CAMPOS_FORMACION = ["tipo", "titulo", "corto", "resumen", "descripcion", "horas", "duracion", "modalidad", "nivel",
  "titulacion", "edicion", "precio", "estado", "url", "incluidaCentro", "destacada", "orden", "aprenderas", "temario", "requisitos"];
