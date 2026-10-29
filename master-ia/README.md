# Máster en IA Aplicada al Desarrollo de Aplicaciones Multiplataforma · Plataforma

Plataforma online del **Máster en Inteligencia Artificial Aplicada al Desarrollo de Aplicaciones
Multiplataforma** del Centro de Formación Profesional José Ramón Otero.

> Título propio del centro · sin carácter oficial · 300 horas. No es un Máster Universitario ni un
> Máster de Formación Profesional. Edición intensiva de un trimestre para titulados en DAM:
> 1.ª edición del 1 de octubre de 2029 al 26 de enero de 2030.

El programa sigue el documento *Máster IA · Desarrollo trimestral* (borrador v1, octubre de 2026):
7 módulos (M1–M7), 5 seminarios con empresas, 3 jornadas presenciales con examen y un Proyecto Final
de Máster (PFM) de 60 horas defendido ante tribunal.

`index.html` es un **archivo único**: estilos, temario y lógica van incrustados. Solo carga desde
internet las fuentes de Google y el resaltado de código; sin conexión funciona con tipografía del
sistema y código sin colorear.

## Uso rápido

```bash
npm install && npm run build     # genera index.html y dist/
python -m http.server 8080       # abrir http://localhost:8080/ (Web Crypto exige https o localhost)
```

- **Dirección del Máster:** `omar.romero@jrotero.es`. En el primer acceso deja la contraseña vacía y
  la plataforma pedirá crearla.
- **Alumnado del centro:** matrícula con correo `@jrotero.es` (queda pendiente de validación; mientras
  tanto accede a la acogida y a M1).
- **Plazas externas:** necesitan un código de admisión que genera la Dirección tras la reserva o el pago.
  Con vía DAM el código matricula directamente; DAW, ASIR o universitarios quedan pendientes de entrevista.
- **Logotipo:** recreación SVG oficial; si junto a `index.html` existe `logo-jrotero.png`, se usa ese archivo.

Para publicarla, ver **[DESPLIEGUE.md](DESPLIEGUE.md)**.

## Qué incluye

- **Temario:** acogida + 17 sesiones (una por semana de M1–M7 y tres del PFM), cada una con las
  5 pestañas: Teoría · Taller paso a paso · Biblioteca de Prompts · Actividad práctica · Preguntas
  frecuentes. Código en Python, Java 21 y Kotlin.
- **Evaluación del programa (apartado 10):** cada módulo = proyecto 50 % + examen presencial 40 %
  (mínimo 4) + entregas semanales 10 %; recuperación una vez. Nota final = 70 % media de módulos
  ponderada por horas + 30 % PFM; «con distinción» con 9 o más.
- **Requisitos del título:** 3 jornadas presenciales, 80 % de actividades semanales, M1–M7 superados,
  4 de 5 seminarios y PFM apto. Comprobación automática; la decisión la toma siempre una persona.
- **Panel de Dirección:** matrículas y códigos de admisión, seguimiento, corrección de entregas, actas
  de módulos (examen y recuperación), asistencia a jornadas y seminarios, tribunal del PFM (5 criterios:
  40/20/10/15/15), expedición de diplomas y certificados de aprovechamiento, copia de seguridad y auditoría.
- **Documentos:** diploma con el texto mínimo del programa (incluido el DNI/NIE) y suplemento con
  módulos, horas, contenidos y notas (A4 apaisado), certificado de aprovechamiento y página pública de
  verificación por código (`#/verificar/<código>`).
- **Protección de datos:** información por capas (RGPD/LOPDGDD), consentimientos desmarcados, aceptación
  expresa del carácter de título propio, compromiso ético de IA y derechos ARSOPOL desde el expediente.

## Desarrollo

```
src/template.html     esqueleto HTML
src/styles.css        componentes con la paleta oficial (#efcd2f, #a9cabb, #e39f7d)
src/app/*.js          lógica, por orden: núcleo, evaluación, acceso, vistas del alumnado,
                      Dirección, documentos y eventos
src/data/modulos.js   edición, módulos (horas, fechas, contenidos), seminarios, jornadas,
                      calendario semana a semana y pesos de evaluación
src/data/*.js         temario: acogida.js, m1.js … m7.js y pfm.js
scripts/build.mjs     valida el temario (numeración, rúbricas al 100 %, 300 h, un proyecto por
                      módulo), compila Tailwind, calcula la CSP y genera index.html y dist/
deploy/               cabeceras de seguridad y configuración de nginx
labs/sesion-XX/       laboratorios ejecutables (código, tests y README)
```

En los ficheros de temario el código se escribe con `` c`…` `` (`String.raw`): no admite comillas
invertidas, y un `${` literal se escribe `\${`.

## Laboratorios

| Laboratorio | Contenido | Estado |
|---|---|---|
| [`labs/sesion-00`](labs/sesion-00) | Verificación del entorno, primer modelo de ML, primer LLM local (Python y Java 21) | ✅ Completo, con tests |

## Limitación importante

Esta versión guarda los datos en el `localStorage` del navegador donde se usa: cada navegador es una
instancia independiente y la Dirección no ve las matrículas hechas en otros equipos. Sirve para
publicar el programa y los contenidos y para validar el diseño con la dirección del centro; para la
operación real con alumnado hace falta un servidor (ver DESPLIEGUE.md, fase 2).

## Sesiones

| Sesión | Bloque | Semana | Título | Actividad | Stack |
|---|---|---|---|---|---|
| 0 | Acogida | 1 | Acogida: Bases de la Inteligencia Artificial y Hoja de Ruta del Máster | Entrega semanal | Git, VS Code, IntelliJ IDEA, Python 3.12 + uv, JDK 21, Docker Desktop, Ollama, scikit-learn |
| 1 | M1 | 1 | Python para Datos e IA: Entornos, Notebooks, NumPy, pandas, APIs REST y Git | Entrega semanal | Python 3.12, uv, Jupyter, NumPy 2, pandas, httpx, Git, PyTorch (introducción) |
| 2 | M1 | 2 | Desarrollo Asistido por IA: Asistentes de Código, Prompts para Programar y Revisión Crítica | **Proyecto de M1** | Claude Code, GitHub Copilot / JetBrains AI, Java 21, JUnit 5, JaCoCo, Semgrep, Git |
| 3 | M2 | 3 | Aprendizaje Automático con scikit-learn: Regresión, Clasificación, Clustering y Validación | Entrega semanal | scikit-learn, XGBoost, pandas, Optuna, FastAPI, Pydantic v2, Java 21 HttpClient |
| 4 | M2 | 4 | Deep Learning con PyTorch: Redes Convolucionales, Transfer Learning, Transformers y Embeddings | **Proyecto de M2** | PyTorch 2, torchvision, ResNet / EfficientNet, sentence-transformers, FastAPI, Docker, ONNX |
| 5 | M3 | 5 | Cómo Funcionan los LLM: Tokens, Contexto y Límites; APIs Comerciales y Modelos Abiertos en Local | Entrega semanal | anthropic SDK, google-genai, openai SDK, Ollama, tiktoken, FastAPI + SSE |
| 6 | M3 | 6 | Prompts Avanzados, Salidas Estructuradas (JSON) y Llamada a Funciones; Generación de Imagen y Voz | **Proyecto de M3** | Pydantic v2, anthropic SDK, Spring AI, SDK Java de Anthropic, google-genai (imagen), faster-whisper, Piper TTS |
| 7 | M4 | 7 | Embeddings, Búsqueda Semántica, Fragmentación de Documentos y Bases de Datos Vectoriales | Entrega semanal | sentence-transformers, BGE-M3 / multilingual-e5, pgvector, PostgreSQL 16, Qdrant, Chroma, Docling |
| 8 | M4 | 8 | Arquitecturas RAG: Búsqueda Híbrida, Reordenación, Citas a la Fuente y Evaluación de Calidad | **Proyecto de M4** | rank-bm25, PostgreSQL FTS, BGE-M3, bge-reranker-v2-m3, Claude, FastAPI, RAGAS, DeepEval, pytest |
| 9 | M5 | 9 | Agentes con Herramientas: Planificación, Memoria, Bucles de Ejecución y Model Context Protocol | Entrega semanal | anthropic SDK (tool use), Pydantic, MCP Python SDK, MCP TypeScript SDK, Spring AI MCP, Claude Code |
| 10 | M5 | 10 | Sistemas Multiagente, Supervisión Humana y Seguridad de Agentes | **Proyecto de M5** | LangGraph, CrewAI, PydanticAI, Playwright, Docker (sandbox), LiteLLM (presupuestos) |
| 11 | M6 | 11 | IA en Apps Android (Kotlin), Multiplataforma (Flutter), Web y Escritorio: Modelos en el Dispositivo y Experiencia de Usuario | Entrega semanal | Kotlin + Jetpack Compose, Flutter, ONNX Runtime (Android, Java, Web), Optimum, Retrofit / Ktor, faster-whisper, WebSockets |
| 12 | M6 | 12 | Puesta en Producción: Contenedores, Despliegue en la Nube, Escalado, Observabilidad, Evaluación Continua y Costes (LLMOps) | **Proyecto de M6** | Docker, Google Cloud Run (u otro proveedor), LiteLLM, Redis + arq, Langfuse, Prometheus / Grafana, GitHub Actions |
| 13 | M7 | 13 | Reglamento (UE) 2024/1689 de Inteligencia Artificial, RGPD Aplicado a Sistemas de IA y Propiedad Intelectual y Licencias | Entrega semanal | Reglamento (UE) 2024/1689, RGPD / LOPDGDD, Microsoft Presidio, Hugging Face Hub (licencias), pip-licenses |
| 14 | M7 | 14 | Sesgos, Explicabilidad, Accesibilidad y Sostenibilidad; Ficha de Transparencia | **Proyecto de M7** | fairlearn, SHAP, XGBoost, WCAG 2.2, CodeCarbon, Model card / ficha de transparencia |
| 15 | PFM | 10 – 12 | Proyecto Final de Máster I · Propuesta, Anteproyecto y Arquitectura | Hito del PFM | Plantilla de repositorio PFM, C4 / Mermaid, ADR, GitHub Projects, CLAUDE.md |
| 16 | PFM | 13 – 14 | Proyecto Final de Máster II · Desarrollo Intensivo, Pruebas y Revisión Intermedia | Hito del PFM | GitHub Actions, pytest / JUnit 5, Testcontainers, k6, pre-commit, Claude Code |
| 17 | PFM | 15 | Proyecto Final de Máster III · Despliegue, Memoria, Entrega Final y Defensa ante Tribunal | Hito del PFM | Docker Compose / nube, Caddy (HTTPS), Model card, Memoria (Markdown → PDF), Presentación |
