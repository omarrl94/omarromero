// MÓDULO 6 · Trabajo Fin de Máster (Sesiones 24 a 28): desarrollo integral, pruebas, despliegue y defensa

const RUBRICA_TRIBUNAL = [['Memoria técnica y documentación', 20], ['Implementación, arquitectura y calidad de código', 40], ['Defensa oral ante el Tribunal', 25], ['Gobernanza IA, RGPD/LOPDGDD y EU AI Act', 15]];

SESIONES.push({
  n: 24,
  corto: 'TFM: anteproyecto y arquitectura',
  titulo: 'TFM I · Anteproyecto, Arquitectura de Referencia y Análisis de Riesgos',
  duracion: '5 h + tutoría',
  resumen: c`Selección del problema, anteproyecto aprobado por la Dirección, arquitectura C4, registro de decisiones (ADR), plan de evaluación y análisis preliminar EU AI Act/RGPD.`,
  stack: ['Plantilla de repositorio TFM', 'C4 / Mermaid', 'ADR', 'GitHub Projects', 'CLAUDE.md'],
  teoria: {
    intro: c`El TFM demuestra que sabes <strong>diseñar, construir, evaluar, desplegar y gobernar</strong> un sistema de IA completo. Debe integrar al menos tres bloques del Máster (p. ej. RAG + agentes + LLMOps) y resolver un problema real del ámbito educativo o empresarial, con evaluación cuantitativa y análisis de cumplimiento.`,
    bloques: [
      ['1. Elegir el problema', c`<p>Un buen TFM tiene un usuario identificable, un problema medible y datos accesibles legalmente. Ejemplos: asistente normativo con RAG híbrido y evaluación continua; agente MCP de gestión de FCT con aprobación humana; app Android offline con modelo destilado; asistente de voz para recepción; plataforma de corrección asistida (con supervisión humana y análisis de alto riesgo).</p>`],
      ['2. Anteproyecto', c`<p>Documento de 2-4 páginas: problema y usuarios, objetivos medibles (p. ej. "fidelidad ≥ 0,9 en el golden set", "latencia p95 &lt; 2 s"), alcance (qué queda fuera), arquitectura preliminar, datos y licencias, riesgos y planificación por sesiones. Requiere aprobación del Director (<code>omar.romero@jrotero.es</code>).</p>`],
      ['3. Arquitectura C4 y ADRs', c`<p>Diagramas de contexto y contenedores (C4 niveles 1-2) y un <strong>Architecture Decision Record</strong> por decisión relevante: "pgvector frente a Qdrant", "Claude frente a modelo local para datos de alumnado", con contexto, opciones, decisión y consecuencias.</p>`],
      ['4. Evaluación desde el día 1', c`<p>Define el golden set y las métricas antes de programar. El TFM se juzga por la evidencia: sin métricas no hay conclusiones defendibles ante el Tribunal.</p>`],
      ['5. Gobernanza preliminar', c`<p>Clasificación de riesgo EU AI Act, base jurídica RGPD de cada dato, minimización, licencias de modelos y datasets, y medidas de supervisión humana. Se profundiza en la Sesión 27 y forma el 15 % de la nota.</p>`]
    ],
    flujo: ['Idea', 'Anteproyecto', 'Aprobación del Director', 'C4 + ADRs', 'Golden set + métricas', 'Backlog por sesiones 25-27'],
    tabla: {
      cap: 'Hitos del TFM',
      head: ['Sesión', 'Hito', 'Evidencia en el repositorio'],
      rows: [
        ['24', 'Anteproyecto aprobado', '<code>docs/anteproyecto.md</code>, ADR-001…'],
        ['25', 'MVP funcional de extremo a extremo', 'Demo grabada, CI en verde'],
        ['26', 'Pruebas de integración y evaluación', 'Informe de métricas, tests verdes'],
        ['27', 'Despliegue y expediente de cumplimiento', 'URL o instrucciones de despliegue, model card, análisis AI Act/RGPD'],
        ['28', 'Depósito y defensa', 'Memoria final, presentación, acta del Tribunal']
      ]
    },
    claves: ['Objetivos medibles o no hay forma de demostrar el éxito.', 'Alcance pequeño y bien terminado vence a uno ambicioso a medias.', 'Todo dato del TFM debe tener origen y licencia documentados.']
  },
  taller: {
    entorno: 'GitHub · VS Code / IntelliJ · Claude Code',
    pasos: [
      { t: 'Estructura de repositorio del TFM', lang: 'plaintext', file: 'estructura', code: c`
tfm-mia-<apellido>/
├── CLAUDE.md                  # contexto para asistentes de código
├── README.md                  # qué es, cómo ejecutarlo en 5 minutos
├── docs/
│   ├── anteproyecto.md
│   ├── arquitectura.md        # diagramas C4 (Mermaid)
│   ├── adr/0001-*.md
│   ├── evaluacion.md
│   ├── model-card.md
│   └── cumplimiento.md        # EU AI Act + RGPD/LOPDGDD
├── eval/                      # golden set y scripts
├── src/  (python/ y/o java/)
├── tests/
├── deploy/                    # compose, k8s, litellm
└── .github/workflows/` },
      { t: 'Crear el repositorio desde PowerShell', lang: 'powershell', file: 'PowerShell', code: c`
mkdir tfm-mia-romero; cd tfm-mia-romero
git init -b main
mkdir docs/adr, eval, src, tests, deploy, .github/workflows -Force
New-Item README.md, CLAUDE.md, docs/anteproyecto.md, docs/arquitectura.md -ItemType File
git add . ; git commit -m "Estructura inicial del TFM"
gh repo create tfm-mia-romero --private --source . --push` },
      { t: 'Diagrama C4 de contenedores en Mermaid', lang: 'markdown', file: 'docs/arquitectura.md', code: c`
## Nivel 2 · Contenedores

~~~mermaid
flowchart LR
  alumno([Alumnado DAM]) -->|HTTPS| web[Web / App Android]
  web --> api[API FastAPI · Python 3.12]
  api --> gw[LiteLLM · pasarela de modelos]
  gw --> claude[(Claude · nube)]
  gw --> local[(vLLM · Qwen local)]
  api --> pg[(PostgreSQL + pgvector)]
  api --> mcp[Servidor MCP Campus JRO]
  api --> lf[Langfuse · trazas]
  docente([Docente]) -->|aprobación HITL| api
~~~` },
      { t: 'Plantilla de ADR', lang: 'markdown', file: 'docs/adr/0001-almacen-vectorial.md', code: c`
# ADR-0001 · Almacén vectorial

- Estado: aceptado · Fecha: {fecha}
## Contexto
Necesitamos búsqueda híbrida sobre ~20 000 fragmentos con filtros por ciclo y
módulo, en la infraestructura del centro, con copias de seguridad sencillas.
## Opciones
1. pgvector en el PostgreSQL existente. 2. Qdrant dedicado. 3. Elasticsearch.
## Decisión
pgvector: volumen modesto, filtros SQL, búsqueda léxica con tsvector, una sola BD que operar.
## Consecuencias
+ Menos infraestructura. − Si superamos ~10 M vectores, reevaluar Qdrant (ADR futuro).` },
      { t: 'CLAUDE.md del TFM', lang: 'markdown', file: 'CLAUDE.md', code: c`
# TFM · {título}

## Objetivo
{una frase}. Métricas de éxito en docs/evaluacion.md.

## Comandos
- Entorno: uv sync / ./mvnw verify
- Tests: uv run pytest -q
- Evaluación rápida: uv run python eval/run.py --subset rapido

## Reglas
- Toda decisión de arquitectura nueva → ADR en docs/adr/.
- Ningún dato personal real en el repositorio: usa eval/sintetico/.
- No cambies prompts de prompts/ sin ejecutar la evaluación rápida.
- El uso de asistentes de IA se documenta en docs/uso-ia.md (requisito del Tribunal).` }
    ]
  },
  prompts: [
    { t: 'Crítico de anteproyectos', tipo: 'System Prompt', lang: 'markdown', code: c`
Actúas como miembro del Tribunal del Máster en Ingeniería de IA del CFP José Ramón Otero.
Revisa el anteproyecto y responde con:
1. Tres preguntas que harías en la defensa.
2. Objetivos no medibles y cómo reformularlos con métricas.
3. Riesgos técnicos no contemplados (datos, latencia, coste, licencias).
4. Clasificación preliminar según el EU AI Act y dudas a resolver.
5. ¿Es viable en 5 sesiones + trabajo autónomo? Propón recortes de alcance si no.` },
    { t: 'Generador de golden set inicial', tipo: 'Plantilla', lang: 'markdown', code: c`
Para el sistema descrito en <anteproyecto>{texto}</anteproyecto>, propón 30 casos de
evaluación: 20 típicos, 5 límite y 5 adversarios. Para cada uno: entrada, resultado
esperado o criterio de aceptación y métrica que lo evalúa. Formato JSONL.
No incluyas datos personales reales.` }
  ],
  actividad: {
    titulo: 'Entrega 1 del TFM: anteproyecto y arquitectura',
    contexto: c`Primera entrega evaluable del TFM. Sin anteproyecto aprobado no se puede depositar el TFM.`,
    requisitos: [
      'Anteproyecto con problema, usuarios, objetivos medibles, alcance y planificación.',
      'Diagramas C4 (contexto y contenedores) y al menos 3 ADRs.',
      'Golden set inicial de ≥ 30 casos y métricas definidas.',
      'Análisis preliminar EU AI Act y RGPD, licencias de modelos y datos.'
    ],
    entregables: ['Repositorio con la estructura del TFM', '<code>docs/anteproyecto.md</code>, <code>docs/arquitectura.md</code>, <code>docs/adr/</code>', '<code>eval/golden.jsonl</code> inicial'],
    rubrica: [['Definición del problema y objetivos medibles', 30], ['Arquitectura y ADRs', 30], ['Plan de evaluación', 20], ['Gobernanza preliminar', 20]]
  },
  faq: [
    ['¿Puedo hacer el TFM sobre un problema de mi empresa?', c`Sí, con autorización escrita de la empresa, datos anonimizados o sintéticos y sin revelar información confidencial en el repositorio que entregas. Coméntalo con el Director antes del anteproyecto.`],
    ['¿Puedo hacerlo en grupo?', c`El TFM es individual. Puedes compartir infraestructura común (p. ej. el servidor de modelos del aula), pero la contribución evaluada debe ser propia y trazable en el historial de Git.`],
    ['¿Puedo usar asistentes de IA para programar el TFM?', c`Sí, y se valora que lo hagas bien: documenta en <code>docs/uso-ia.md</code> qué herramientas usaste y para qué, y asegúrate de entender y poder defender cada línea. El Tribunal preguntará.`],
    ['¿Python o Java?', c`Ambos son válidos; se valora la integración políglota cuando tiene sentido (p. ej. backend Spring que consume servicios de IA en Python, o MCP en Java). Elige lo que mejor resuelva el problema.`]
  ]
});

SESIONES.push({
  n: 25,
  corto: 'TFM: desarrollo integral',
  titulo: 'TFM II · Desarrollo Integral Guiado por Evaluación',
  duracion: '5 h + tutoría',
  resumen: c`Construcción del MVP de extremo a extremo con iteraciones cortas, integración continua, evaluación automática en cada cambio y tutorías de código con el Director.`,
  stack: ['GitHub Actions', 'pytest / JUnit 5', 'pre-commit', 'Claude Code', 'Langfuse', 'Stack elegido en el anteproyecto'],
  teoria: {
    intro: c`La forma más segura de terminar un TFM de IA es tener <strong>cuanto antes</strong> un flujo completo funcionando ("esqueleto andante"), aunque cada pieza sea simple, y mejorar después la pieza que más impacte en las métricas.`,
    bloques: [
      ['1. Esqueleto andante', c`<p>Primera semana: interfaz mínima → API → recuperación simple → LLM → respuesta, desplegado en local con un comando y con un test de extremo a extremo. Todo lo demás es iteración sobre una base que funciona.</p>`],
      ['2. Desarrollo guiado por evaluación', c`<p>Cada iteración: hipótesis ("el reranking mejorará el recall@5"), cambio, ejecución del golden set, comparación con la versión anterior y registro en <code>docs/evaluacion.md</code>. Si la métrica no mejora, se revierte.</p>`],
      ['3. Calidad de código', c`<p>Tipado (type hints / Java), linters y formateadores (ruff, Spotless), pre-commit, tests unitarios con LLM simulado y CI que bloquea merges en rojo. El 40 % de la nota es implementación y calidad.</p>`],
      ['4. Trabajo con asistentes de código', c`<p>Usa Claude Code u otros asistentes con <code>CLAUDE.md</code>, tareas pequeñas y revisión de cada cambio. Commits atómicos con mensajes claros: el historial de Git es parte de la evidencia de autoría.</p>`]
    ],
    flujo: ['Hipótesis', 'Rama + cambio', 'Tests + eval rápida (CI)', 'Comparar métricas', 'Merge o revertir', 'Registrar en evaluacion.md'],
    tabla: {
      cap: 'Checklist del MVP',
      head: ['Elemento', 'Criterio de hecho'],
      rows: [
        ['Arranque', '<code>docker compose up</code> o un comando documentado'],
        ['Flujo principal', 'Funciona de extremo a extremo con datos sintéticos'],
        ['Tests', 'Unitarios + 1 E2E en CI'],
        ['Evaluación', 'Golden set ejecutable con informe'],
        ['Observabilidad', 'Trazas de cada petición'],
        ['Seguridad básica', 'Secretos fuera del repo, validación de entradas']
      ]
    },
    claves: ['Primero de extremo a extremo, después profundidad.', 'Cada mejora, con su métrica antes y después.', 'Commits pequeños y CI siempre en verde.']
  },
  taller: {
    entorno: 'Repositorio del TFM · GitHub Actions · PowerShell 7',
    pasos: [
      { t: 'pre-commit con ruff, detección de secretos y tests rápidos', lang: 'yaml', file: '.pre-commit-config.yaml', code: c`
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.8.4
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.21.2
    hooks:
      - id: gitleaks
  - repo: local
    hooks:
      - id: tests-rapidos
        name: tests rápidos
        entry: uv run pytest -q -m "not lento and not ia_real"
        language: system
        pass_filenames: false` },
      { t: 'CI del TFM: calidad + tests + evaluación rápida', lang: 'yaml', file: '.github/workflows/ci.yml', code: c`
name: ci
on: [push, pull_request]
jobs:
  python:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env: { POSTGRES_PASSWORD: test }
        ports: ["5432:5432"]
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v5
      - run: uv sync --all-extras
      - run: uv run ruff check . && uv run ruff format --check .
      - run: uv run pytest -q -m "not ia_real" --cov=src --cov-report=term-missing
  java:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: "21", cache: maven }
      - run: ./mvnw -B verify
  eval-rapida:
    if: github.event_name == 'pull_request'
    needs: [python]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v5
      - run: uv sync
      - run: uv run python eval/run.py --subset rapido --umbral-fidelidad 0.85 --comparar-con main
        env: { ANTHROPIC_API_KEY: "\${{ secrets.ANTHROPIC_API_KEY }}" }` },
      { t: 'Arnés de evaluación con comparación entre versiones', lang: 'python', file: 'eval/run.py', code: c`
import argparse
import json
import statistics
import subprocess
import sys
from pathlib import Path
from sistema import responder            # punto de entrada del TFM
from jueces import juzgar_fidelidad, juzgar_correccion

p = argparse.ArgumentParser()
p.add_argument("--subset", default="completo")
p.add_argument("--umbral-fidelidad", type=float, default=0.85)
p.add_argument("--comparar-con")
a = p.parse_args()

casos = [json.loads(l) for l in open(f"eval/golden_{a.subset}.jsonl", encoding="utf-8")]
resultados = []
for c in casos:
    r = responder(c["entrada"])
    resultados.append({"id": c["id"], "fidelidad": juzgar_fidelidad(r), "correcta": juzgar_correccion(c, r),
                       "latencia_ms": r.latencia_ms, "coste_usd": r.coste_usd})

resumen = {
    "commit": subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], text=True).strip(),
    "fidelidad": statistics.mean(x["fidelidad"] for x in resultados),
    "exactitud": sum(x["correcta"] for x in resultados) / len(resultados),
    "latencia_p95": sorted(x["latencia_ms"] for x in resultados)[int(len(resultados) * 0.95) - 1],
    "coste_medio": statistics.mean(x["coste_usd"] for x in resultados),
}
Path("eval/historico.jsonl").open("a", encoding="utf-8").write(json.dumps(resumen) + "\n")
print(json.dumps(resumen, indent=2))
sys.exit(0 if resumen["fidelidad"] >= a.umbral_fidelidad else 1)` },
      { t: 'Flujo de trabajo diario con Claude Code', lang: 'powershell', file: 'PowerShell', code: c`
git switch -c feat/reranking
claude   # "Añade reranking con bge-reranker-v2-m3 tras la búsqueda híbrida. Sigue CLAUDE.md, añade tests y ejecuta la eval rápida."
uv run pytest -q
uv run python eval/run.py --subset rapido
git add -p ; git commit -m "Añadir reranking cross-encoder (recall@5 0,71 → 0,84)"
git push -u origin feat/reranking
gh pr create --fill` }
    ]
  },
  prompts: [
    { t: 'Revisor de PR del TFM', tipo: 'System Prompt', lang: 'markdown', code: c`
Revisa este pull request de un TFM de ingeniería de IA. Prioriza:
1. Errores de corrección y casos límite.
2. Riesgos de seguridad (secretos, inyección, PII).
3. Cambios en prompts o modelos sin evidencia de evaluación.
4. Tests que faltan.
Ignora el estilo si el linter pasa. Formato: lista de hallazgos con fichero:línea y severidad.` },
    { t: 'Diario de iteraciones', tipo: 'Plantilla', lang: 'markdown', file: 'docs/evaluacion.md', code: c`
| Fecha | Commit | Hipótesis | Cambio | Fidelidad | Exactitud | p95 (ms) | Coste/consulta | Decisión |
|-------|--------|-----------|--------|-----------|-----------|----------|----------------|----------|
| {f}   | a1b2c3 | Baseline  | Denso top-5 | 0,78 | 0,64 | 1 900 | 0,004 $ | — |
| {f}   | d4e5f6 | Híbrido mejora recall | BM25 + RRF | 0,81 | 0,71 | 2 000 | 0,004 $ | Merge |` }
  ],
  actividad: {
    titulo: 'Entrega 2 del TFM: MVP de extremo a extremo con CI y evaluación',
    contexto: c`MVP funcional demostrable, con integración continua y al menos tres iteraciones documentadas con métricas.`,
    requisitos: [
      'Flujo principal funcionando de extremo a extremo y arrancable con un comando.',
      'CI con lint, tests y evaluación rápida en PRs.',
      '≥ 3 iteraciones registradas en <code>docs/evaluacion.md</code> con hipótesis y métricas.',
      'Documento <code>docs/uso-ia.md</code> con el uso de asistentes de IA.'
    ],
    entregables: ['Repositorio actualizado (rama main en verde)', 'Vídeo demo del MVP (≤ 3 min)'],
    rubrica: [['Funcionalidad de extremo a extremo', 35], ['Calidad de código y CI', 30], ['Iteraciones guiadas por métricas', 25], ['Transparencia en el uso de IA', 10]]
  },
  faq: [
    ['Voy retrasado. ¿Qué recorto?', c`Recorta alcance funcional, nunca evaluación ni documentación de cumplimiento. Un sistema más pequeño, bien medido y desplegado puntúa más que uno grande sin métricas.`],
    ['Los tests con LLM real son lentos y caros en CI.', c`Marca esos tests (<code>@pytest.mark.ia_real</code>), usa un LLM simulado en los unitarios y ejecuta la evaluación real solo en PRs y con un subconjunto rápido.`],
    ['¿Cada cuánto tengo tutoría?', c`En cada sesión del Módulo 6 hay tutoría con el Director. Entre sesiones, consultas por correo a <code>omar.romero@jrotero.es</code> indicando enlace al commit o PR concreto.`]
  ]
});

SESIONES.push({
  n: 26,
  corto: 'TFM: pruebas de integración',
  titulo: 'TFM III · Pruebas de Integración, Contratos, Carga y Evaluación Final',
  duracion: '5 h + tutoría',
  resumen: c`Testcontainers en Python y Java, tests de contrato entre servicios, pruebas de carga con k6, red teaming del sistema completo y evaluación final con el golden set ampliado.`,
  stack: ['Testcontainers (Python y Java)', 'pytest / JUnit 5', 'k6', 'promptfoo', 'RAGAS / DeepEval', 'WireMock'],
  teoria: {
    intro: c`Las pruebas unitarias con LLM simulado no detectan los fallos que aparecen cuando se juntan base de datos vectorial, pasarela de modelos, colas y servicios Java/Python. Esta sesión cierra la calidad del TFM con pruebas de integración reales y la <strong>evaluación final</strong> que defenderás ante el Tribunal.`,
    bloques: [
      ['1. Pirámide de pruebas para sistemas de IA', c`<p>Base: unitarias (lógica, parsers, validadores) con LLM simulado. Medio: integración con dependencias reales en contenedores (Postgres/pgvector, Redis, Neo4j) y LLM simulado o grabado. Cima: E2E y evaluación con LLM real sobre el golden set.</p>`],
      ['2. Testcontainers', c`<p>Arranca dependencias reales en Docker desde el propio test (Python o Java), con datos sembrados y destrucción automática. Elimina el "en mi máquina funciona".</p>`],
      ['3. Contratos entre servicios', c`<p>Si un backend Spring consume tu servicio de IA en Python, define el contrato (OpenAPI o esquemas JSON) y verifica ambos lados. Los cambios de esquema de salida estructurada son cambios de contrato.</p>`],
      ['4. Carga y robustez', c`<p>k6 para medir latencias p50/p95/p99 y errores bajo carga, comprobando los límites de tasa de la pasarela y el comportamiento de la cola. Prueba de caos: proveedor principal caído, base de datos lenta.</p>`],
      ['5. Evaluación final', c`<p>Golden set ampliado (≥ 100 casos), comparación con una línea base (p. ej. LLM sin RAG) y con versiones intermedias, intervalos de confianza y análisis de errores por categoría. Es el núcleo de los resultados de la memoria.</p>`]
    ],
    flujo: ['Unitarias (LLM simulado)', 'Integración (Testcontainers)', 'Contratos', 'E2E', 'Carga (k6)', 'Red team', 'Evaluación final'],
    tabla: {
      cap: 'Qué prueba cada nivel',
      head: ['Nivel', 'Detecta', 'Coste', 'Frecuencia'],
      rows: [
        ['Unitarias', 'Errores de lógica y parsing', 'Muy bajo', 'Cada commit'],
        ['Integración', 'SQL, índices, serialización, configuración', 'Bajo', 'Cada PR'],
        ['Contrato', 'Rupturas entre servicios', 'Bajo', 'Cada PR'],
        ['Evaluación LLM', 'Regresiones de calidad', 'Medio ($)', 'PR (subconjunto) y release'],
        ['Carga', 'Cuellos de botella, límites de tasa', 'Medio', 'Antes del despliegue']
      ]
    },
    claves: ['Dependencias reales en contenedores, no mocks, en integración.', 'La evaluación final necesita línea base y análisis de errores.', 'Reporta p95, no solo la media.']
  },
  taller: {
    entorno: 'Docker Desktop · PowerShell 7 · VS Code + IntelliJ',
    pasos: [
      { t: 'Integración en Python con Testcontainers + pgvector', lang: 'python', file: 'tests/integracion/test_busqueda.py', code: c`
import psycopg
import pytest
from pgvector.psycopg import register_vector
from testcontainers.postgres import PostgresContainer
from busqueda import indexar_textos, buscar


@pytest.fixture(scope="module")
def conexion():
    with PostgresContainer("pgvector/pgvector:pg16", driver=None) as pg:
        con = psycopg.connect(pg.get_connection_url(), autocommit=True)
        con.execute("CREATE EXTENSION IF NOT EXISTS vector")
        register_vector(con)
        con.execute(open("sql/schema.sql").read())
        yield con


def test_busqueda_hibrida_encuentra_codigo_exacto(conexion):
    indexar_textos(conexion, [("doc1", "El módulo 0486 Acceso a Datos tiene 170 horas."),
                              ("doc2", "Programación de Servicios y Procesos se imparte en segundo.")])
    resultados = buscar(conexion, "horas del 0486", k=1)
    assert resultados[0].doc == "doc1"


def test_filtro_por_ciclo_no_filtra_otros_ciclos(conexion):
    assert all(r.ciclo == "DAM" for r in buscar(conexion, "horas", ciclo="DAM", k=5))` },
      { t: 'Integración en Java con Testcontainers y LLM simulado', lang: 'java', file: 'TutorServiceIT.java', code: c`
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.ai.chat.model.ChatModel;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

@SpringBootTest
@Testcontainers
class TutorServiceIT {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("pgvector/pgvector:pg16");

    @TestConfiguration
    static class LlmFalso {
        @Bean ChatModel chatModel() { return mock(ChatModel.class); }   // sin llamadas reales en CI
    }

    @Autowired MemoriaRepository memoria;

    @Test
    void persisteLaConversacionPorAlumno() {
        memoria.guardar("alumno-1", "user", "Hola");
        assertThat(memoria.ultimos("alumno-1", 10)).hasSize(1);
        assertThat(memoria.ultimos("alumno-2", 10)).isEmpty();
    }
}` },
      { t: 'Prueba de carga con k6', lang: 'javascript', file: 'carga/consulta.js', code: c`
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 20 },
    { duration: "3m", target: 50 },
    { duration: "1m", target: 0 }
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<4000"]
  }
};

const preguntas = JSON.parse(open("./preguntas.json"));

export default function () {
  const q = preguntas[Math.floor(Math.random() * preguntas.length)];
  const r = http.post("http://localhost:8000/chat/sync", JSON.stringify({ mensaje: q }),
    { headers: { "Content-Type": "application/json", Authorization: "Bearer " + __ENV.TOKEN_PRUEBAS } });
  check(r, { "200": (res) => res.status === 200, "con citas": (res) => res.body.includes("[") });
  sleep(1);
}` },
      { t: 'Ejecutar toda la batería', lang: 'powershell', file: 'PowerShell', code: c`
uv run pytest tests/integracion -q
.\mvnw.cmd verify -Pintegracion
k6 run carga/consulta.js --env TOKEN_PRUEBAS=$env:TOKEN_PRUEBAS
npx promptfoo@latest redteam run -c redteam/promptfooconfig.yaml
uv run python eval/run.py --subset completo --comparar-con v0-baseline` }
    ]
  },
  prompts: [
    { t: 'Análisis de errores de la evaluación final', tipo: 'System Prompt', lang: 'markdown', code: c`
Recibes los casos fallidos de la evaluación final de un sistema de IA (entrada,
salida, esperado, trazas). Agrúpalos por causa raíz (recuperación, generación,
datos fuente, fuera de alcance, guardrail excesivo…), cuenta cada grupo, elige un
ejemplo representativo por grupo y propón la mejora con mayor impacto esperado.
Devuelve una tabla y un párrafo de conclusiones apto para la memoria del TFM.` },
    { t: 'Generador de casos límite', tipo: 'Plantilla', lang: 'markdown', code: c`
Para la funcionalidad {funcionalidad}, genera 15 entradas límite: vacías, muy largas,
en otro idioma, con errores ortográficos, con datos personales, ambiguas, con
instrucciones incrustadas y fuera de dominio. Indica para cada una el comportamiento
correcto esperado del sistema.` }
  ],
  actividad: {
    titulo: 'Entrega 3 del TFM: informe de pruebas y evaluación final',
    contexto: c`Batería de pruebas completa y resultados finales que sustentarán el capítulo de resultados de la memoria.`,
    requisitos: [
      'Tests de integración con Testcontainers en los componentes con dependencias.',
      'Test de contrato si hay más de un servicio.',
      'Prueba de carga con umbrales y análisis de cuellos de botella.',
      'Red team del sistema completo con resultados antes/después de mitigaciones.',
      'Evaluación final (≥ 100 casos) frente a línea base, con análisis de errores.'
    ],
    entregables: ['<code>tests/integracion/</code>, <code>carga/</code>, <code>redteam/</code>', '<code>docs/resultados.md</code>'],
    rubrica: [['Pruebas de integración y contrato', 30], ['Carga y robustez', 20], ['Red team', 20], ['Evaluación final y análisis', 30]]
  },
  faq: [
    ['Testcontainers no arranca en Windows.', c`Necesitas Docker Desktop en ejecución con WSL2. Si usas una configuración remota de Docker, revisa <code>DOCKER_HOST</code> y la configuración de Testcontainers en <code>~/.testcontainers.properties</code>.`],
    ['La prueba de carga agota mi cuota del proveedor.', c`Ejecuta la carga contra el modelo local (vLLM) o un LLM simulado con latencia artificial para medir tu sistema, y haz una prueba corta y controlada contra el proveedor real con presupuesto limitado en LiteLLM.`],
    ['¿Cuántos casos necesito en la evaluación final?', c`Al menos 100 para que diferencias de 5-10 puntos sean interpretables, y reporta intervalos de confianza (bootstrap). Explica cómo se construyó el conjunto y cómo evitaste que se filtrara al desarrollo.`]
  ]
});

SESIONES.push({
  n: 27,
  corto: 'TFM: despliegue y cumplimiento',
  titulo: 'TFM IV · Despliegue Final, Operación y Expediente de Cumplimiento',
  duracion: '5 h + tutoría',
  resumen: c`Despliegue reproducible con HTTPS, observabilidad, copias de seguridad y runbook; model card, evaluación de impacto en protección de datos y expediente EU AI Act del sistema.`,
  stack: ['Docker Compose / Kubernetes', 'Caddy (HTTPS automático)', 'Langfuse', 'Prometheus + Grafana', 'Model Card', 'EIPD (art. 35 RGPD)'],
  teoria: {
    intro: c`Un TFM de ingeniería termina desplegado y operable por otra persona. Además, un sistema de IA en la UE debe llegar con su documentación de gobernanza: qué hace, con qué datos, con qué límites, quién lo supervisa y cómo se ejercen los derechos.`,
    bloques: [
      ['1. Despliegue reproducible', c`<p>Infraestructura como código, configuración por variables de entorno, secretos gestionados, HTTPS (Caddy obtiene certificados automáticamente), versionado de imágenes y un procedimiento de actualización y rollback documentado.</p>`],
      ['2. Operación', c`<p>Healthchecks, métricas (latencia, errores, coste, tokens), alertas, trazas, copias de seguridad de la base de datos y del índice vectorial con prueba de restauración, y un runbook para incidencias típicas.</p>`],
      ['3. Model card y documentación técnica', c`<p>Finalidad prevista y usos no previstos, modelos y versiones, datos, métricas de evaluación por subgrupos, limitaciones conocidas, riesgos y mitigaciones. Para sistemas de alto riesgo, la documentación técnica del Anexo IV del EU AI Act.</p>`],
      ['4. Evaluación de impacto (EIPD)', c`<p>El art. 35 RGPD exige una EIPD cuando el tratamiento entraña alto riesgo (p. ej. evaluación sistemática de personas, datos de menores o colectivos vulnerables, nuevas tecnologías a gran escala). Describe el tratamiento, su necesidad y proporcionalidad, los riesgos para los derechos y las medidas. Es un ejercicio obligatorio en el TFM aunque el sistema final no la requiera.</p>`],
      ['5. Supervisión humana y transparencia', c`<p>Quién revisa qué decisiones, cómo se corrige un error, cómo se informa a los usuarios de que interactúan con IA y cómo se registra la actividad para auditoría.</p>`]
    ],
    flujo: ['Imagen versionada', 'Compose / Helm', 'Caddy HTTPS', 'Servicio en producción', 'Métricas + trazas + alertas', 'Backups probados', 'Model card + EIPD + AI Act'],
    tabla: {
      cap: 'Expediente de cumplimiento del TFM',
      head: ['Documento', 'Contenido mínimo', 'Base normativa'],
      rows: [
        ['Registro del tratamiento', 'Finalidad, categorías de datos, plazos, medidas', 'Art. 30 RGPD'],
        ['EIPD (ejercicio)', 'Riesgos para derechos y medidas', 'Art. 35 RGPD'],
        ['Clasificación AI Act', 'Prohibido / alto riesgo / limitado / mínimo, razonado', 'Arts. 5, 6, 50 y Anexo III'],
        ['Supervisión humana', 'Roles, puntos de control, capacidad de anular', 'Art. 14 AI Act'],
        ['Model card', 'Uso previsto, métricas, límites', 'Buenas prácticas / Anexo IV'],
        ['Licencias', 'Modelos, datasets, librerías', 'Licencias de cada componente']
      ]
    },
    claves: ['Si otra persona no puede desplegarlo con tu README, no está terminado.', 'Una copia de seguridad no probada no es una copia de seguridad.', 'La documentación de gobernanza es parte del producto, no un anexo.']
  },
  taller: {
    entorno: 'Servidor Linux (VPS del centro o máquina virtual) · Docker · dominio o subdominio de pruebas',
    pasos: [
      { t: 'Proxy HTTPS con Caddy', lang: 'plaintext', file: 'deploy/Caddyfile', code: c`
tfm-romero.mia.jrotero.es {
    encode zstd gzip
    reverse_proxy /api/* api:8000
    reverse_proxy web:80
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    log {
        output file /var/log/caddy/acceso.log
        format json
    }
}` },
      { t: 'Compose de producción con perfiles y backups', lang: 'yaml', file: 'deploy/docker-compose.prod.yml', code: c`
services:
  caddy:
    image: caddy:2
    ports: ["80:80", "443:443"]
    volumes: ["./Caddyfile:/etc/caddy/Caddyfile:ro", "caddy-data:/data"]
    restart: unless-stopped
  api:
    image: ghcr.io/usuario/tfm-api:\${VERSION}
    env_file: .env.prod
    restart: unless-stopped
    healthcheck: { test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"], interval: 30s }
  postgres:
    image: pgvector/pgvector:pg16
    env_file: .env.prod
    volumes: ["pgdata:/var/lib/postgresql/data"]
    restart: unless-stopped
  backup:
    image: pgvector/pgvector:pg16
    env_file: .env.prod
    entrypoint: ["/bin/sh", "-c", "while true; do pg_dump -h postgres -U postgres -Fc tfm > /backups/tfm-$$(date +%F).dump; find /backups -mtime +14 -delete; sleep 86400; done"]
    volumes: ["./backups:/backups"]
volumes:
  pgdata: {}
  caddy-data: {}` },
      { t: 'Despliegue, verificación y restauración de prueba', lang: 'bash', file: 'servidor · bash', code: c`
export VERSION=1.0.0
docker compose -f deploy/docker-compose.prod.yml pull
docker compose -f deploy/docker-compose.prod.yml up -d
curl -fsS https://tfm-romero.mia.jrotero.es/api/health

# Prueba de restauración en una base temporal (obligatoria para el TFM)
docker run --rm -d --name restaura -e POSTGRES_PASSWORD=x pgvector/pgvector:pg16
sleep 5
docker cp backups/tfm-$(date +%F).dump restaura:/tmp/r.dump
docker exec restaura sh -c "createdb -U postgres tfm && pg_restore -U postgres -d tfm /tmp/r.dump"
docker exec restaura psql -U postgres -d tfm -c "SELECT count(*) FROM fragmentos;"
docker rm -f restaura` },
      { t: 'Plantilla de Model Card', lang: 'markdown', file: 'docs/model-card.md', code: c`
# Model Card · {nombre del sistema} v1.0.0

## Uso previsto
{qué hace, para quién}. **Usos no previstos:** {p. ej. decidir calificaciones sin revisión humana}.

## Componentes
| Componente | Modelo / versión | Licencia | Ubicación de los datos |
|---|---|---|---|
| Generación | claude-sonnet-5-5 / Qwen2.5-7B-AWQ (fallback) | Comercial / Apache 2.0 | UE / servidor del centro |
| Embeddings | BAAI/bge-m3 | MIT | Servidor del centro |

## Evaluación
Golden set de {n} casos. Fidelidad {x}, exactitud {y}, p95 {z} ms. Resultados por categoría en docs/resultados.md.

## Limitaciones y riesgos
- {limitación} → mitigación: {…}

## Supervisión humana
{rol} revisa {qué} antes de {acción}. Canal de incidencias: {…}.

## Cumplimiento
Clasificación EU AI Act: {…} (docs/cumplimiento.md). Base jurídica RGPD: {…}.` }
    ]
  },
  prompts: [
    { t: 'Asistente de redacción de EIPD', tipo: 'System Prompt', lang: 'markdown', code: c`
Ayudas a redactar una Evaluación de Impacto en Protección de Datos (art. 35 RGPD)
siguiendo la estructura de las guías de la AEPD: descripción sistemática del
tratamiento, necesidad y proporcionalidad, identificación de riesgos para los
derechos y libertades (probabilidad × impacto) y medidas para mitigarlos.
Pide los datos que falten. Señala con [REVISAR DPD] todo lo que deba validar el
Delegado de Protección de Datos. No inventes obligaciones legales.` },
    { t: 'Revisión de README para despliegue por terceros', tipo: 'Plantilla', lang: 'markdown', code: c`
Imagina que eres un técnico de sistemas que no conoce el proyecto. Con solo este
README, intenta desplegar el sistema mentalmente paso a paso y lista cada punto donde
te quedarías bloqueado (variables sin documentar, puertos, dependencias, datos
iniciales, credenciales). Propón el texto que falta.` }
  ],
  actividad: {
    titulo: 'Entrega 4 del TFM: sistema desplegado y expediente de gobernanza',
    contexto: c`Sistema accesible (o desplegable por el Tribunal con instrucciones) y documentación completa de operación y cumplimiento.`,
    requisitos: [
      'Despliegue reproducible con HTTPS, healthchecks y versión etiquetada.',
      'Observabilidad (métricas y trazas) y alertas básicas.',
      'Copias de seguridad automáticas con prueba de restauración documentada.',
      'Runbook, model card, registro de tratamiento, EIPD (ejercicio) y clasificación EU AI Act razonada.'
    ],
    entregables: ['<code>deploy/</code> completo y etiqueta de versión v1.0.0', '<code>docs/model-card.md</code>, <code>docs/cumplimiento.md</code>, <code>RUNBOOK.md</code>'],
    rubrica: [['Despliegue y operación', 35], ['Copias y recuperación', 15], ['Model card', 15], ['Expediente RGPD y EU AI Act', 35]]
  },
  faq: [
    ['No tengo servidor propio.', c`Puedes desplegar en una VM del aula, en un servicio con capa gratuita o entregar un despliegue local completo con Docker Compose que el Tribunal pueda reproducir. Lo evaluado es la reproducibilidad y la operación, no el proveedor.`],
    ['¿Mi TFM necesita realmente una EIPD?', c`Quizá no legalmente, pero en el Máster se exige como ejercicio. Si tratas datos de menores, evalúas a personas o usas datos sensibles, probablemente sí sería obligatoria en un despliegue real.`],
    ['¿Debo declarar qué modelos de pago uso?', c`Sí, en la model card: proveedor, modelo, región de procesamiento si la conoces y si existe contrato de encargado del tratamiento. Es parte del análisis de transferencias internacionales.`]
  ]
});

SESIONES.push({
  n: 28,
  corto: 'TFM: defensa ante Tribunal',
  titulo: 'TFM V · Memoria Final, Defensa ante Tribunal y Obtención del Título Propio de Máster',
  duracion: '5 h + defensa',
  resumen: c`Estructura de la memoria, preparación de la presentación y la demo, simulacro de preguntas del Tribunal (<code>omar.romero@jrotero.es</code>) y procedimiento de depósito, acta y emisión del Título Propio de Máster de Formación Profesional JOSÉ RAMÓN OTERO.`,
  stack: ['Memoria (Markdown/LaTeX → PDF)', 'Presentación', 'Demo en vivo + vídeo de respaldo', 'Plataforma LMS: depósito del TFM'],
  teoria: {
    intro: c`La defensa es la última evidencia: demuestras que entiendes cada decisión, que tus resultados son sólidos y que conoces los límites de tu sistema. El Tribunal valora la <strong>honestidad técnica</strong> tanto como el resultado.`,
    bloques: [
      ['1. Estructura de la memoria (40-70 páginas)', c`<p>Resumen · Introducción y objetivos medibles · Estado del arte breve · Análisis y requisitos · Arquitectura (C4, ADRs) · Implementación (decisiones clave, no listados de código) · Evaluación (metodología, resultados, análisis de errores) · Despliegue y operación · Gobernanza (RGPD, EU AI Act, licencias, uso de IA) · Conclusiones, limitaciones y trabajo futuro · Bibliografía y anexos.</p>`],
      ['2. Presentación (20 minutos)', c`<p>Problema y usuario (2 min) → arquitectura (4) → demo en vivo (6) → resultados con métricas (4) → gobernanza (2) → conclusiones y limitaciones (2). Una idea por diapositiva y gráficos legibles. Ten un vídeo de la demo por si falla la red.</p>`],
      ['3. Turno de preguntas (15-20 minutos)', c`<p>Preguntas habituales: ¿por qué esta arquitectura y no otra?, ¿cómo sabes que funciona?, ¿qué pasa si el proveedor cae?, ¿qué datos personales tratas y con qué base?, ¿qué riesgo tiene según el EU AI Act?, ¿qué parte hizo un asistente de IA y cómo la verificaste?</p>`],
      ['4. Procedimiento académico', c`<p>1) Depósito del TFM en la plataforma (Mi expediente → Depositar TFM). 2) Convocatoria de defensa. 3) Defensa y deliberación. 4) El Tribunal registra las calificaciones por criterio y el acta (APTO/NO APTO). 5) Con acta APTA y calificación ≥ 5, el Director emite el <strong>Título Propio de Máster</strong>, inscrito en el Registro de Títulos con código de verificación.</p>`]
    ],
    flujo: ['Memoria final', 'Depósito en la plataforma', 'Convocatoria', 'Defensa (20 + 20 min)', 'Acta del Tribunal', 'Emisión del Título Propio de Máster'],
    tabla: {
      cap: 'Rúbrica oficial del Tribunal de TFM',
      head: ['Criterio', 'Peso', 'Qué se valora'],
      rows: [
        ['Memoria técnica y documentación', '20 %', 'Claridad, rigor, estructura, reproducibilidad'],
        ['Implementación, arquitectura y calidad de código', '40 %', 'Funcionalidad, diseño, tests, CI, despliegue'],
        ['Defensa oral ante el Tribunal', '25 %', 'Comunicación, demo, dominio de las decisiones, respuestas'],
        ['Gobernanza IA, RGPD/LOPDGDD y EU AI Act', '15 %', 'Análisis de riesgos, cumplimiento, licencias, transparencia en el uso de IA']
      ]
    },
    claves: ['Defiende con datos: cada afirmación de la memoria, con su métrica o referencia.', 'Reconoce las limitaciones antes de que te las señalen.', 'Ensaya la demo en el equipo y la red donde la harás.']
  },
  taller: {
    entorno: 'Repositorio del TFM · Pandoc o LaTeX · editor de presentaciones · Plataforma LMS del Máster',
    pasos: [
      { t: 'Generar la memoria en PDF desde Markdown', lang: 'powershell', file: 'PowerShell', code: c`
winget install JohnMacFarlane.Pandoc
winget install MiKTeX.MiKTeX
$meta = @("--metadata", "title=Asistente normativo con RAG híbrido y evaluación continua", "--metadata", "author=Nombre Apellido")
pandoc docs/memoria/*.md -o memoria-tfm.pdf --toc --number-sections @meta --pdf-engine=xelatex -V lang=es -V geometry:margin=2.5cm` },
      { t: 'Esqueleto de la memoria', lang: 'markdown', file: 'docs/memoria/00-indice.md', code: c`
# Resumen / Abstract
# 1. Introducción
## 1.1 Problema y usuarios  ## 1.2 Objetivos medibles  ## 1.3 Alcance
# 2. Estado del arte (breve, orientado a decisiones)
# 3. Análisis y requisitos
# 4. Arquitectura
## 4.1 C4  ## 4.2 Decisiones (ADRs)  ## 4.3 Modelos y proveedores
# 5. Implementación
# 6. Evaluación
## 6.1 Metodología y golden set  ## 6.2 Resultados  ## 6.3 Análisis de errores
# 7. Despliegue y operación
# 8. Gobernanza: RGPD/LOPDGDD, EU AI Act, licencias y uso de IA
# 9. Conclusiones, limitaciones y trabajo futuro
# Bibliografía · Anexos (manual de despliegue, golden set, prompts)` },
      { t: 'Checklist de depósito (ejecutable)', lang: 'python', file: 'scripts/checklist_deposito.py', code: c`
from pathlib import Path
import subprocess

REQUISITOS = {
    "README con despliegue": Path("README.md"),
    "Memoria PDF": Path("memoria-tfm.pdf"),
    "Anteproyecto": Path("docs/anteproyecto.md"),
    "Arquitectura": Path("docs/arquitectura.md"),
    "Resultados": Path("docs/resultados.md"),
    "Model card": Path("docs/model-card.md"),
    "Cumplimiento": Path("docs/cumplimiento.md"),
    "Uso de IA": Path("docs/uso-ia.md"),
    "Golden set": Path("eval/golden_completo.jsonl"),
}
fallos = [n for n, p in REQUISITOS.items() if not p.exists()]
etiquetas = subprocess.run(["git", "tag", "--list", "v1.*"], capture_output=True, text=True).stdout.split()
secretos = subprocess.run(["git", "grep", "-nE", "sk-ant-|AKIA|BEGIN PRIVATE KEY"], capture_output=True, text=True).stdout

print("✔ Todo listo para depositar" if not (fallos or not etiquetas or secretos) else "✘ Pendiente:")
for f in fallos:
    print("  - Falta:", f)
if not etiquetas:
    print("  - Falta la etiqueta de versión v1.x")
if secretos:
    print("  - Posibles secretos en el repositorio:\n", secretos)` },
      { t: 'Depósito en la plataforma LMS', d: 'En <strong>Mi expediente → Mi Trabajo Fin de Máster</strong>: título, URL del repositorio (https), resumen con arquitectura, modelos, evaluación y análisis EU AI Act, y declaración de autoría. Tras «Depositar TFM para Tribunal», el Director verá el TFM en el Panel de Dirección → Tribunal de TFM, registrará las notas por criterio y el acta y, si procede, emitirá el Título Propio de Máster.' }
    ]
  },
  prompts: [
    { t: 'Simulacro de Tribunal', tipo: 'System Prompt', lang: 'markdown', code: c`
Eres el Tribunal del Máster en Ingeniería de IA del CFP José Ramón Otero, presidido
por el Director Académico. Has leído la memoria del TFM que te adjunto.
Haz UNA pregunta cada vez, como en una defensa real, y espera mi respuesta.
Alterna preguntas de: arquitectura, evaluación y validez de resultados, seguridad,
RGPD/EU AI Act y uso de asistentes de IA. Tras mi respuesta, valórala brevemente
(sólida / mejorable / insuficiente) y explica qué faltó. Tras 8 preguntas, da una
estimación de la nota del criterio "Defensa oral" con justificación.` },
    { t: 'Revisor de diapositivas', tipo: 'Plantilla', lang: 'markdown', code: c`
Revisa el guion de mi presentación de TFM (20 minutos).
<guion>{diapositivas en texto}</guion>
Comprueba: una idea por diapositiva, tiempo estimado por bloque, que cada resultado
tenga su métrica y su comparación con la línea base, que la demo tenga plan B, y que
las limitaciones aparezcan explícitamente. Propón cortes si supera los 20 minutos.` }
  ],
  actividad: {
    titulo: 'Depósito y defensa del Trabajo Fin de Máster',
    contexto: c`Entrega final: memoria, repositorio etiquetado y defensa pública ante el Tribunal Académico presidido por el Director del Máster. La calificación final del TFM se registra en la plataforma conforme a la rúbrica oficial.`,
    requisitos: [
      'Memoria final en PDF y repositorio con etiqueta <code>v1.0.0</code>.',
      'Checklist de depósito sin pendientes.',
      'TFM depositado en la plataforma (Mi expediente).',
      'Presentación de 20 minutos con demo en vivo y vídeo de respaldo.',
      'Defensa y turno de preguntas del Tribunal.'
    ],
    entregables: ['<code>memoria-tfm.pdf</code>', 'Presentación (PDF)', 'Vídeo de la demo', 'Depósito en la plataforma'],
    rubrica: RUBRICA_TRIBUNAL
  },
  faq: [
    ['¿Qué nota mínima necesito para obtener el título?', c`Acta APTA del Tribunal y calificación ponderada del TFM ≥ 5 según la rúbrica (20 % memoria, 40 % implementación, 25 % defensa, 15 % gobernanza). Con ello, el Director emite el Título Propio de Máster.`],
    ['¿Qué pasa si la demo falla durante la defensa?', c`Pasa al vídeo de respaldo sin dramatizar y explica qué ha fallado y por qué: diagnosticar en directo también demuestra dominio. Por eso el vídeo es obligatorio.`],
    ['¿Cómo se verifica el título?', c`Cada título tiene un número de registro (MIA-JRO-año-nnnn) y un código de verificación inscritos en el Registro de Títulos Propios del centro. Para verificarlo, escribe a <code>omar.romero@jrotero.es</code>.`],
    ['¿Es un título oficial?', c`Es un <strong>Título Propio</strong> expedido por Formación Profesional JOSÉ RAMÓN OTERO. Acredita la formación cursada y las competencias evaluadas, pero no es un título universitario oficial del sistema educativo.`]
  ]
});
