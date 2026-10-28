# Máster IA · FP José Ramón Otero — Plataforma LMS

Plataforma web del **Máster (Título Propio) en Ingeniería de Inteligencia Artificial, LLMs y
Arquitecturas Cognitivas para Desarrolladores**, expedido por Formación Profesional JOSÉ RAMÓN OTERO,
dirigido a titulados en Grado Superior de DAM.

`index.html` es un **archivo único ejecutable**: CSS (Tailwind compilado), temario y lógica van
incrustados. Solo carga desde internet las fuentes de Google y el resaltado de código
(highlight.js); sin conexión la plataforma funciona igual, con tipografía del sistema y código sin colorear.

## Uso

```bash
# Servir en local (Web Crypto exige https:// o localhost)
python -m http.server 8080      # y abrir http://localhost:8080/
```

- **Director Académico:** `omar.romero@jrotero.es`. En el primer acceso deja la contraseña vacía
  y la plataforma pedirá crearla (PBKDF2-SHA-256, 150 000 iteraciones).
- **Alumnado:** registro con correo `@jrotero.es` (queda *pendiente* de admisión; accede al Módulo 0)
  o con un **código de admisión** generado en el Panel de Dirección (admisión directa).
- **Logotipo:** se usa la recreación SVG oficial; si junto a `index.html` existe `logo-jrotero.png`,
  se muestra ese archivo automáticamente.

## Funcionalidad

- 7 módulos y 28 sesiones numeradas, cada una con la barra de 5 pestañas:
  Teoría · Taller paso a paso · Biblioteca de Prompts · Actividad práctica · Preguntas frecuentes.
- Registro conforme a RGPD/LOPDGDD: tabla de primera capa, segunda capa informativa, casillas
  desmarcadas (datos académicos y compromiso ético IA / EU AI Act) y verificación de mayoría de edad.
- Derechos ARSOPOL en «Mi expediente»: exportación JSON (acceso/portabilidad), rectificación,
  supresión, oposición y limitación.
- Panel de Dirección: admisiones y códigos, seguimiento de las 28 sesiones, calificación de
  repositorios, Tribunal de TFM (rúbrica 20/40/25/15), registro de títulos, copia de seguridad y auditoría.
- Emisión e impresión (A4 apaisado / PDF) del diploma con número de registro y código de verificación.

## Desarrollo

```
src/template.html   esqueleto HTML
src/styles.css      componentes con la paleta oficial (#efcd2f, #a9cabb, #e39f7d)
src/app.js          lógica (autenticación, rutas, vistas, panel, diploma)
src/data/*.js       temario: modulos.js + m0…m6.js (una entrada por sesión)
scripts/build.mjs   valida el temario (sesiones 1-28 completas), compila Tailwind y genera index.html
```

```bash
npm install
npm run build
```

En los ficheros de temario el código se escribe con `` c`…` `` (`String.raw`): no admite comillas
invertidas, y un `${` literal se escribe `\${`.

## Limitaciones del prototipo

Los datos se guardan en el `localStorage` del navegador donde se usa: cada navegador es una
instancia independiente (el Panel de Dirección permite exportar e importar la base de datos), y el
primer acceso del Director lo puede reclamar quien abra la plataforma antes que él en ese navegador.
Para uso real con alumnado hace falta un backend con autenticación en servidor, cifrado en tránsito
y en reposo, copias de seguridad y registro de actividades de tratamiento.

## Arquitectura del programa

| Nº | Módulo | Sesión | Stack tecnológico |
|---|---|---|---|
| 1 | M0 · Fundamentos | Transición de DAM a IA: El Ecosistema Python Científico y Cálculo Tensorial | Python 3.12, uv, NumPy 2, Pandas, PyTorch, CUDA / MPS, VS Code + Jupyter |
| 2 | M0 · Fundamentos | Machine Learning Clásico para Desarrolladores (Scikit-Learn & XGBoost) | scikit-learn, XGBoost, Pandas, Optuna, joblib, FastAPI, Pydantic v2 |
| 3 | M0 · Fundamentos | Introducción a las Redes Neuronales Profundas (PyTorch desde Cero) | PyTorch 2, torch.nn, autograd, AdamW, torchvision, TensorBoard |
| 4 | M0 · Fundamentos | Anatomía de los Modelos de Lenguaje (De las Redes Recurrentes a la Arquitectura Transformer) | PyTorch, tiktoken, Hugging Face Transformers, tokenizers, Llama / Qwen (pesos abiertos) |
| 5 | M1 · Backend IA | Integración de Modelos de Frontera (Claude, Google AI Studio / Gemini, Kimi, OpenAI) | anthropic SDK, google-genai, openai SDK, FastAPI, SSE, asyncio, httpx |
| 6 | M1 · Backend IA | IA Generativa en el Ecosistema Java 21+ (Spring AI & LangChain4j) | Java 21, Spring Boot 3.5, Spring AI 1.x, LangChain4j, Virtual Threads, Maven, IntelliJ IDEA |
| 7 | M1 · Backend IA | Structured Outputs, Validación Estricta y Function Calling (Tool Use) | Pydantic v2, anthropic SDK, SDK Java de Anthropic, JSON Schema, PostgreSQL, psycopg 3 |
| 8 | M1 · Backend IA | Despliegue de LLMs Locales y Soberanía de Datos (Ollama, vLLM, GGUF) | Ollama, llama.cpp, GGUF, vLLM, AWQ / GPTQ, Docker, WSL2, LangChain4j Ollama |
| 9 | M2 · RAG | Embeddings, Chunking Semántico y Bases de Datos Vectoriales (Qdrant, Chroma, pgvector) | sentence-transformers, BGE-M3 / multilingual-e5, pgvector, PostgreSQL 16, Qdrant, Chroma, Docling |
| 10 | M2 · RAG | RAG Avanzado (Hybrid Search, BM25, Cross-Encoders y Reranking) | rank-bm25, PostgreSQL FTS, BGE-M3, bge-reranker-v2-m3, Claude, FastAPI |
| 11 | M2 · RAG | GraphRAG y Bases de Datos de Grafos (Neo4j + LLMs) | Neo4j 5, Cypher, neo4j (driver Python), Pydantic, Claude, Spring Data Neo4j |
| 12 | M2 · RAG | RAG Multimodal y Procesamiento de Documentos Complejos (ColPali, Vision-RAG, OCR IA) | Docling, ColPali / ColQwen2, colpali-engine, pdf2image, Claude (visión y PDF), Gemini, Qdrant multivector |
| 13 | M3 · Agentes | Arquitecturas Cognitivas y Diseño de Agentes (ReAct, Plan-and-Solve, Reflexion) | Claude tool use, Pydantic, SQLite, sentence-transformers, pytest (como verificador) |
| 14 | M3 · Agentes | Orquestación Multi-Agente en Producción (LangGraph, CrewAI y PydanticAI) | LangGraph, langchain-anthropic, CrewAI, PydanticAI, SQLite/Postgres checkpointer, FastAPI |
| 15 | M3 · Agentes | Ecosistema MCP (Model Context Protocol) y Arquitectura de Skills | MCP Python SDK (FastMCP), MCP TypeScript SDK, Spring AI MCP Server, Claude Code CLI, MCP Inspector, SKILL.md |
| 16 | M3 · Agentes | Computer Use, Browser Automation (Playwright + IA) y Agentes de Código | Playwright (Python y Java), Playwright MCP, Claude tool use, Computer Use API, Docker (sandbox), Claude Code headless |
| 17 | M4 · Fine-Tuning y Edge AI | Datasets Sintéticos y Fine-Tuning Eficiente (PEFT, LoRA y QLoRA) | Unsloth, Hugging Face TRL, PEFT, bitsandbytes, datasets, Claude Batches API, Google Colab / Kaggle |
| 18 | M4 · Fine-Tuning y Edge AI | Alineamiento de Modelos (DPO / ORPO) y Destilación de Conocimiento | TRL (DPOTrainer, ORPOTrainer), Unsloth, PEFT, PyTorch (pérdida KD), Claude como Teacher/juez, Qwen 0.5B-3B como Student |
| 19 | M4 · Fine-Tuning y Edge AI | IA en Aplicaciones Multiplataforma y Móviles (Android/Kotlin, Flutter, ONNX Runtime) | ONNX, ONNX Runtime (Android, Java), Optimum, Kotlin + Jetpack Compose, Flutter (MethodChannel), llama.cpp / MediaPipe LLM |
| 20 | M4 · Fine-Tuning y Edge AI | Sistemas de Voz en Tiempo Real y Multimodalidad (STT, TTS, WebSockets) | faster-whisper, Silero VAD, Claude streaming, Piper TTS, FastAPI WebSockets, Web Audio API, Spring WebSocket |
| 21 | M5 · LLMOps y Seguridad | Evaluación de Sistemas IA y Observabilidad (RAGAS, DeepEval, Langfuse) | RAGAS, DeepEval, pytest, Langfuse (self-hosted), OpenTelemetry, LLM-as-a-Judge |
| 22 | M5 · LLMOps y Seguridad | MLOps, Contenerización GPU y Despliegue Escalable (Docker, Kubernetes, LiteLLM) | Docker (multi-stage), NVIDIA Container Toolkit, Kubernetes, LiteLLM Proxy, Redis + arq, vLLM, Prometheus / Grafana |
| 23 | M5 · LLMOps y Seguridad | Red Teaming de LLMs, Ciberseguridad IA y Cumplimiento del EU AI Act | OWASP Top 10 for LLM Applications, promptfoo red team, garak, Microsoft Presidio, spaCy (es), Guardrails propios, EU AI Act (Reglamento UE 2024/1689) |
| 24 | M6 · TFM | TFM I · Anteproyecto, Arquitectura de Referencia y Análisis de Riesgos | Plantilla de repositorio TFM, C4 / Mermaid, ADR, GitHub Projects, CLAUDE.md |
| 25 | M6 · TFM | TFM II · Desarrollo Integral Guiado por Evaluación | GitHub Actions, pytest / JUnit 5, pre-commit, Claude Code, Langfuse, Stack elegido en el anteproyecto |
| 26 | M6 · TFM | TFM III · Pruebas de Integración, Contratos, Carga y Evaluación Final | Testcontainers (Python y Java), pytest / JUnit 5, k6, promptfoo, RAGAS / DeepEval, WireMock |
| 27 | M6 · TFM | TFM IV · Despliegue Final, Operación y Expediente de Cumplimiento | Docker Compose / Kubernetes, Caddy (HTTPS automático), Langfuse, Prometheus + Grafana, Model Card, EIPD (art. 35 RGPD) |
| 28 | M6 · TFM | TFM V · Memoria Final, Defensa ante Tribunal y Obtención del Título Propio de Máster | Memoria (Markdown/LaTeX → PDF), Presentación, Demo en vivo + vídeo de respaldo, Plataforma LMS: depósito del TFM |
