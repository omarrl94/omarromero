// Programa del Máster en Inteligencia Artificial Aplicada al Desarrollo de Aplicaciones
// Multiplataforma (título propio, sin carácter oficial, 300 h). Fuente: «Máster IA ·
// Desarrollo trimestral», borrador v1 de octubre de 2026. Las fechas, horas y criterios
// de este fichero alimentan el calendario, la evaluación, el diploma y su suplemento.
const c = String.raw;

const EDICION = {
  nombre: '1.ª edición',
  inicio: '2029-10-01',
  fin: '2030-01-26',
  periodo: 'octubre 2029 – enero 2030',
  horas: 300,
  semanas: 15,
  plazas: 30,
  lugar: 'Madrid',
  modalidad: 'Semipresencial intensiva: online con tutor y 3 jornadas presenciales con examen',
  precio: { general: 1290, prontoPago: 1190, cuotas: '6 cuotas de 215 €' }
};

// Color estructural (guía de identidad): oro para la acogida; salvia para fundamentos,
// ML, LLMs, RAG y agentes; terracota para producción, normativa y Proyecto Final.
const MODULOS = [
  { id: 'ACO', cod: 'Acogida', nombre: 'Acogida: bases de la IA, hoja de ruta y prueba de nivel', corto: 'Acogida', color: 'gold',
    sesiones: [0, 0], horas: 0, semanas: '1', fechas: '1 oct 2029', computa: false },
  { id: 'M1', cod: 'M1', nombre: 'Fundamentos: Python para IA y desarrollo asistido por IA', corto: 'Fundamentos', color: 'sage',
    sesiones: [1, 2], horas: 30, semanas: '1–2', fechas: '1 oct – 12 oct', examen: 1, computa: true,
    proyecto: 'Modernizar una aplicación heredada con IA y cubrirla con pruebas automáticas.',
    contenidos: ['Python para datos: entornos, notebooks, NumPy, pandas, APIs REST y Git', 'Asistentes de código en el IDE: generación, refactorización, documentación y pruebas', 'Ingeniería de prompts para programar y revisión crítica del código generado', 'Riesgos: errores sutiles, vulnerabilidades, licencias y dependencia de la herramienta'] },
  { id: 'M2', cod: 'M2', nombre: 'Aprendizaje automático y deep learning', corto: 'ML y deep learning', color: 'sage',
    sesiones: [3, 4], horas: 40, semanas: '3–4', fechas: '15 oct – 26 oct', examen: 1, computa: true,
    proyecto: 'Modelo de clasificación de imágenes publicado como servicio web.',
    contenidos: ['Aprendizaje supervisado y no supervisado con scikit-learn: regresión, clasificación y clustering', 'Preparación de datos, validación cruzada, métricas y sobreajuste', 'Redes neuronales con PyTorch: redes convolucionales para visión y transfer learning', 'Introducción a transformers y embeddings'] },
  { id: 'M3', cod: 'M3', nombre: 'IA generativa y modelos de lenguaje', corto: 'IA generativa y LLMs', color: 'sage',
    sesiones: [5, 6], horas: 40, semanas: '5–6', fechas: '29 oct – 9 nov', examen: 1, computa: true,
    proyecto: 'Asistente conversacional para un caso de negocio con salidas estructuradas.',
    contenidos: ['Cómo funcionan los LLM: tokens, ventana de contexto, temperatura, límites y alucinaciones', 'APIs de modelos comerciales y modelos abiertos ejecutados en local', 'Prompts avanzados, salidas estructuradas (JSON) y llamada a funciones', 'Generación de imagen y voz; elección de modelo por coste, latencia y privacidad'] },
  { id: 'M4', cod: 'M4', nombre: 'Recuperación aumentada (RAG) y bases vectoriales', corto: 'RAG', color: 'sage',
    sesiones: [7, 8], horas: 35, semanas: '7–8', fechas: '12 nov – 23 nov', examen: 2, computa: true,
    proyecto: 'Buscador inteligente sobre la documentación técnica de una empresa colaboradora.',
    contenidos: ['Embeddings, búsqueda semántica y fragmentación de documentos', 'Bases de datos vectoriales (pgvector, Chroma, Qdrant)', 'Arquitecturas RAG: búsqueda híbrida, reordenación y citas a la fuente', 'Evaluación de calidad: exactitud, fidelidad a la fuente y pruebas de regresión'] },
  { id: 'M5', cod: 'M5', nombre: 'Agentes de IA y automatización', corto: 'Agentes', color: 'sage',
    sesiones: [9, 10], horas: 35, semanas: '9–10', fechas: '26 nov – 7 dic', examen: 2, computa: true,
    proyecto: 'Agente que automatiza un proceso real: soporte, gestión de incidencias o atención al cliente.',
    contenidos: ['Agentes con herramientas: planificación, memoria y bucles de ejecución', 'Protocolos de integración de herramientas (Model Context Protocol) y frameworks de orquestación', 'Sistemas multiagente y flujos con supervisión humana', 'Seguridad de agentes: mínimo privilegio, inyección de instrucciones y límites de gasto'] },
  { id: 'M6', cod: 'M6', nombre: 'IA en apps multiplataforma y puesta en producción', corto: 'Apps y producción', color: 'terra',
    sesiones: [11, 12], horas: 40, semanas: '11–12', fechas: '10 dic – 21 dic', examen: 2, computa: true,
    proyecto: 'App multiplataforma con IA desplegada en la nube y con panel de monitorización.',
    contenidos: ['Integración de IA en apps Android (Kotlin), multiplataforma (Flutter), web y escritorio', 'Modelos que se ejecutan en el propio dispositivo y experiencia de usuario en funciones de IA', 'Contenedores (Docker), despliegue en la nube y escalado', 'Observabilidad, evaluación continua, costes y seguridad en producción (LLMOps)'] },
  { id: 'M7', cod: 'M7', nombre: 'Ética, normativa y uso responsable de la IA', corto: 'Ética y normativa', color: 'terra',
    sesiones: [13, 14], horas: 10, semanas: '13–14', fechas: '7 ene – 18 ene', examen: 3, computa: true,
    proyecto: 'Análisis de cumplimiento y ficha de transparencia del Proyecto Final de Máster.',
    contenidos: ['Reglamento (UE) 2024/1689 de Inteligencia Artificial: niveles de riesgo y obligaciones', 'RGPD aplicado a sistemas de IA; propiedad intelectual y licencias de modelos y datos', 'Sesgos, explicabilidad, accesibilidad y sostenibilidad'] },
  { id: 'PFM', cod: 'PFM', nombre: 'Proyecto Final de Máster', corto: 'Proyecto Final', color: 'terra',
    sesiones: [15, 17], horas: 60, semanas: '10–15', fechas: '3 dic – 26 ene', computa: false,
    contenidos: ['Producto funcional de alcance acotado que resuelve un problema real, preferiblemente propuesto por una empresa colaboradora', 'Propuesta, anteproyecto, revisión intermedia, entrega final y defensa presencial ante tribunal'] }
];

// 10 h de seminarios online con empresas (5 × 2 h, jueves de 18:00 a 20:00)
const SEMINARIOS = [
  { id: 1, semana: 2, fecha: '2029-10-11', titulo: 'IA en el día a día de un equipo de desarrollo', ponente: 'Empresa de software' },
  { id: 2, semana: 4, fecha: '2029-10-25', titulo: 'Del prototipo al producto: casos reales de apps con IA', ponente: 'Empresa colaboradora' },
  { id: 3, semana: 6, fecha: '2029-11-08', titulo: 'Startups de IA en Madrid: emprender con un producto de IA', ponente: 'Startup colaboradora' },
  { id: 4, semana: 9, fecha: '2029-11-29', titulo: 'Seguridad y privacidad en aplicaciones con modelos de lenguaje', ponente: 'Empresa colaboradora' },
  { id: 5, semana: 11, fecha: '2029-12-13', titulo: 'Entrevistas técnicas y portfolio: cómo conseguir el primer empleo en IA', ponente: 'Empresa colaboradora' }
];

// Sábados de 9:30 a 14:30. Asistencia obligatoria.
const JORNADAS = [
  { id: 1, fecha: '2029-11-17', contenido: 'Clase de dudas y examen presencial de M1–M3', modulos: ['M1', 'M2', 'M3'] },
  { id: 2, fecha: '2030-01-12', contenido: 'Clase de dudas y examen presencial de M4–M6 · revisión del anteproyecto del Proyecto Final', modulos: ['M4', 'M5', 'M6'] },
  { id: 3, fecha: '2030-01-26', contenido: 'Examen de M7, defensa del Proyecto Final ante tribunal y exámenes de recuperación', modulos: ['M7'] }
];

const CALENDARIO = [
  { sem: '1', del: '2029-10-01', actividad: 'M1 · Fundamentos: Python para IA y desarrollo asistido por IA', hito: 'Acogida online y prueba de nivel' },
  { sem: '2', del: '2029-10-08', actividad: 'M1 · Fundamentos: Python para IA y desarrollo asistido por IA', hito: 'Entrega del proyecto de M1 · Seminario online (jueves)' },
  { sem: '3', del: '2029-10-15', actividad: 'M2 · Aprendizaje automático y deep learning', hito: '' },
  { sem: '4', del: '2029-10-22', actividad: 'M2 · Aprendizaje automático y deep learning', hito: 'Entrega del proyecto de M2 · Seminario online (jueves)' },
  { sem: '5', del: '2029-10-29', actividad: 'M3 · IA generativa y modelos de lenguaje', hito: '' },
  { sem: '6', del: '2029-11-05', actividad: 'M3 · IA generativa y modelos de lenguaje', hito: 'Entrega del proyecto de M3 · Seminario online (jueves)' },
  { sem: '7', del: '2029-11-12', actividad: 'M4 · Recuperación aumentada (RAG) y bases vectoriales', hito: 'Sábado 17 nov: jornada presencial 1 (examen de M1–M3)' },
  { sem: '8', del: '2029-11-19', actividad: 'M4 · Recuperación aumentada (RAG) y bases vectoriales', hito: 'Entrega del proyecto de M4' },
  { sem: '9', del: '2029-11-26', actividad: 'M5 · Agentes de IA y automatización', hito: 'Seminario online (jueves)' },
  { sem: '10', del: '2029-12-03', actividad: 'M5 · Agentes de IA y automatización + PFM: propuesta', hito: 'Entrega del proyecto de M5 · Propuesta de PFM y asignación de tutor' },
  { sem: '11', del: '2029-12-10', actividad: 'M6 · IA en apps multiplataforma y puesta en producción + PFM: anteproyecto', hito: 'Seminario online (jueves)' },
  { sem: '12', del: '2029-12-17', actividad: 'M6 · IA en apps multiplataforma y puesta en producción + PFM: anteproyecto', hito: 'Entrega del proyecto de M6 · Anteproyecto aprobado' },
  { sem: '—', del: '2029-12-24', actividad: 'Vacaciones de Navidad', hito: '' },
  { sem: '—', del: '2029-12-31', actividad: 'Vacaciones de Navidad', hito: '' },
  { sem: '13', del: '2030-01-07', actividad: 'M7 · Normativa + PFM: desarrollo con tutoría online', hito: 'Sábado 12 ene: jornada presencial 2 (examen de M4–M6)' },
  { sem: '14', del: '2030-01-14', actividad: 'M7 · Normativa + PFM: desarrollo con tutoría online', hito: 'Entrega del proyecto de M7 · Revisión intermedia del PFM · Recuperación: nueva versión de proyectos pendientes' },
  { sem: '15', del: '2030-01-21', actividad: 'PFM · Entrega y defensa presencial', hito: 'Miércoles 23 ene: entrega de memoria y producto · Sábado 26 ene: examen de M7, defensas y recuperaciones (presencial)' }
];

// Evaluación (apartado 10 del programa)
const EVALUACION = {
  modulo: { proyecto: 0.5, examen: 0.4, entregas: 0.1, minimoExamen: 4, aprobado: 5 },
  final: { modulos: 0.7, pfm: 0.3, distincion: 9 },
  requisitos: { jornadas: 3, entregasPct: 0.8, seminarios: 4 },
  tribunalPFM: [
    ['tecnica', 'Solución técnica', 0.40],
    ['calidad', 'Calidad y evaluación del sistema de IA', 0.20],
    ['normativa', 'Cumplimiento normativo y ética', 0.10],
    ['memoria', 'Memoria', 0.15],
    ['defensa', 'Defensa', 0.15]
  ]
};

const SESIONES = [];
