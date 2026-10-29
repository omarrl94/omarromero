// PFM · Proyecto Final de Máster (60 h · semanas 10–15)

SESIONES.push({
  n: 15,
  semana: '10 – 12',
  fechas: '3 – 21 dic 2029',
  corto: 'PFM: propuesta y anteproyecto',
  titulo: 'Proyecto Final de Máster I · Propuesta, Anteproyecto y Arquitectura',
  duracion: 'Semanas 10–12',
  resumen: c`El Proyecto Final (60 horas) es un producto funcional de alcance acotado que resuelve un problema real, preferiblemente propuesto por una empresa colaboradora. Se hace de forma individual o en parejas, con tutoría online y, si lo hay, un mentor de la empresa. Hitos: propuesta (semana 10, 3 dic) y anteproyecto (semana 12, 17 dic), que se revisa en la jornada presencial del 12 de enero.`,
  stack: ['Plantilla de repositorio PFM', 'C4 / Mermaid', 'ADR', 'GitHub Projects', 'CLAUDE.md'],
  teoria: {
    intro: c`El Proyecto Final demuestra que sabes <strong>construir, evaluar, desplegar y gobernar</strong> una aplicación con IA de principio a fin. Debe integrar varios módulos (por ejemplo RAG + app multiplataforma + LLMOps) y resolver un problema real con alcance acotado.`,
    bloques: [
      [
        '1. Ejemplos de proyecto',
        c`<ul>
<li>Asistente RAG que responde sobre la documentación interna de una pyme, con citas a la fuente.</li>
<li>App móvil con visión por computador para controlar el inventario de un comercio.</li>
<li>Agente que clasifica, prioriza y propone respuesta a las incidencias de un servicio de soporte.</li>
<li>Herramienta de revisión automática de código integrada en el flujo de un equipo de desarrollo.</li>
</ul>`
      ],
      [
        '2. Propuesta (semana 10)',
        c`<p>Ficha de <strong>una página</strong>: problema, usuarios, datos disponibles (y su licencia o autorización) y alcance. Con ella se asigna tutor y, si procede, mentor de empresa. Individual o en parejas (en pareja, el reparto de trabajo debe ser explícito y trazable en Git).</p>`
      ],
      [
        '3. Anteproyecto (semana 12)',
        c`<p>Arquitectura, plan de trabajo, riesgos y análisis normativo preliminar. Se aprueba en la semana 12 y se revisa en la jornada presencial del <strong>sábado 12 de enero</strong>.</p>`
      ],
      [
        '4. Arquitectura C4 y ADRs',
        c`<p>Diagramas de contexto y contenedores (C4 niveles 1-2) y un <strong>Architecture Decision Record</strong> por decisión relevante: "pgvector frente a Qdrant", "Claude frente a modelo local para datos de alumnado", con contexto, opciones, decisión y consecuencias.</p>`
      ],
      [
        '5. Evaluación desde el día 1',
        c`<p>Define el golden set y las métricas antes de programar. El Proyecto Final se juzga por la evidencia: sin métricas no hay conclusiones defendibles ante el Tribunal.</p>`
      ]
    ],
    flujo: [
      'Idea / reto de empresa',
      'Propuesta (3 dic)',
      'Asignación de tutor',
      'Anteproyecto (17 dic)',
      'Revisión presencial (12 ene)',
      'Desarrollo intensivo'
    ],
    tabla: {
      cap: 'Hitos y entregables del Proyecto Final',
      head: ['Semana', 'Hito', 'Entregable'],
      rows: [
        ['10 (3 dic)', 'Propuesta', 'Ficha de 1 página: problema, usuarios, datos y alcance'],
        [
          '12 (17 dic)',
          'Anteproyecto',
          'Arquitectura, plan de trabajo, riesgos y análisis normativo; se revisa en la jornada del 12 ene'
        ],
        [
          '14 (14 ene)',
          'Revisión intermedia',
          'Demo funcional del núcleo del producto (online con el tutor)'
        ],
        [
          '15 (miércoles 23 ene)',
          'Entrega final',
          'Producto desplegado, repositorio documentado y memoria (15–25 páginas)'
        ],
        [
          '15 (sábado 26 ene)',
          'Defensa presencial',
          'Presentación de 15 min y 10 min de preguntas ante el tribunal'
        ]
      ]
    },
    claves: [
      'Objetivos medibles o no hay forma de demostrar el éxito.',
      'Alcance pequeño y bien terminado vence a uno ambicioso a medias.',
      'Todo dato del proyecto debe tener origen y licencia o autorización documentados.'
    ]
  },
  taller: {
    entorno: 'GitHub · VS Code / IntelliJ · Claude Code',
    pasos: [
      {
        t: 'Plantilla de la propuesta (1 página)',
        lang: 'markdown',
        file: 'docs/propuesta.md',
        code: c`
# Propuesta de Proyecto Final · {título}

- **Autor/es:** {nombre} {y compañero/a, si es en pareja}
- **Empresa colaboradora / mentor:** {si la hay}
- **Problema:** {qué duele hoy y a quién}
- **Usuarios:** {quién lo usará y en qué contexto}
- **Datos:** {qué datos hay, de quién son, licencia o autorización, ¿datos personales?}
- **Alcance (qué SÍ):** {3-5 funcionalidades}
- **Fuera de alcance (qué NO):** {…}
- **Módulos que integra:** {p. ej. M3 + M4 + M6}
- **Cómo sabremos que funciona:** {1-3 métricas con objetivo}`
      },
      {
        t: 'Estructura de repositorio del Proyecto Final',
        lang: 'plaintext',
        file: 'estructura',
        code: c`
pfm-mia-<apellido>/
├── CLAUDE.md                  # contexto para asistentes de código
├── README.md                  # qué es, cómo ejecutarlo en 5 minutos
├── docs/
│   ├── propuesta.md
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
└── .github/workflows/`
      },
      {
        t: 'Diagrama C4 de contenedores en Mermaid',
        lang: 'markdown',
        file: 'docs/arquitectura.md',
        code: c`
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
~~~`
      },
      {
        t: 'Plantilla de ADR',
        lang: 'markdown',
        file: 'docs/adr/0001-almacen-vectorial.md',
        code: c`
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
+ Menos infraestructura. − Si superamos ~10 M vectores, reevaluar Qdrant (ADR futuro).`
      },
      {
        t: 'CLAUDE.md del Proyecto Final',
        lang: 'markdown',
        file: 'CLAUDE.md',
        code: c`
# Proyecto Final de Máster · {título}

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
- El uso de asistentes de IA se documenta en docs/uso-ia.md (requisito del tribunal).`
      }
    ]
  },
  prompts: [
    {
      t: 'Crítico de anteproyectos',
      tipo: 'System Prompt',
      lang: 'markdown',
      code: c`
Actúas como miembro del tribunal del Máster en IA Aplicada al Desarrollo de Aplicaciones Multiplataforma del CFP José Ramón Otero.
Revisa la propuesta o el anteproyecto del Proyecto Final y responde con:
1. Tres preguntas que harías en la defensa.
2. Objetivos no medibles y cómo reformularlos con métricas.
3. Riesgos técnicos no contemplados (datos, latencia, coste, licencias).
4. Clasificación preliminar según el EU AI Act y dudas a resolver.
5. ¿Es viable en 60 horas entre el 3 de diciembre y el 23 de enero? Propón recortes de alcance si no.`
    },
    {
      t: 'Generador de golden set inicial',
      tipo: 'Plantilla',
      lang: 'markdown',
      code: c`
Para el sistema descrito en <anteproyecto>{texto}</anteproyecto>, propón 30 casos de
evaluación: 20 típicos, 5 límite y 5 adversarios. Para cada uno: entrada, resultado
esperado o criterio de aceptación y métrica que lo evalúa. Formato JSONL.
No incluyas datos personales reales.`
    }
  ],
  actividad: {
    tipo: 'pfm',
    titulo: 'Hitos 1 y 2 del Proyecto Final: propuesta y anteproyecto',
    contexto: c`Registra aquí la propuesta (semana 10) y, después, el anteproyecto (semana 12). Sin anteproyecto aprobado no se puede presentar la entrega final.`,
    requisitos: [
      'Propuesta de una página con problema, usuarios, datos y alcance (hasta el 3 de diciembre).',
      c`Anteproyecto con arquitectura (C4), plan de trabajo, riesgos y análisis normativo preliminar (hasta el 17 de diciembre).`,
      'Repositorio del proyecto creado con la estructura recomendada.'
    ],
    entregables: [
      c`<code>docs/propuesta.md</code>`,
      c`<code>docs/anteproyecto.md</code>, <code>docs/arquitectura.md</code> y ADRs`
    ],
    rubrica: [
      ['Definición del problema y alcance', 35],
      ['Arquitectura y plan', 35],
      ['Riesgos y análisis normativo', 30]
    ]
  },
  faq: [
    [
      '¿Puedo hacerlo en pareja?',
      c`Sí, el Proyecto Final puede ser individual o en parejas. En pareja, el alcance debe ser mayor y cada miembro debe poder defender todo el proyecto; el reparto de trabajo se ve en el historial de Git.`
    ],
    [
      '¿Y si no tengo empresa colaboradora?',
      c`Es preferible, pero no obligatorio: la coordinación ofrece retos de empresas colaboradoras y también se aceptan problemas reales de tu entorno con datos públicos o sintéticos.`
    ],
    [
      '¿Puedo usar asistentes de IA para programar el Proyecto Final?',
      c`Sí, y se valora que lo hagas bien: documenta en <code>docs/uso-ia.md</code> qué herramientas usaste y para qué, y asegúrate de entender y poder defender cada línea. El Tribunal preguntará.`
    ],
    [
      '¿Puedo usar el proyecto de un módulo como base?',
      c`Sí, es una buena estrategia: por ejemplo, partir del buscador de M4 o de la app de M6. El Proyecto Final debe aportar trabajo nuevo y sustancial respecto al proyecto del módulo, y debes indicarlo en la memoria.`
    ]
  ]
});

SESIONES.push({
  n: 16,
  semana: '13 – 14',
  fechas: '7 – 18 ene 2030',
  corto: 'PFM: desarrollo y revisión intermedia',
  titulo: 'Proyecto Final de Máster II · Desarrollo Intensivo, Pruebas y Revisión Intermedia',
  duracion: 'Semanas 13–14',
  resumen: c`Desarrollo intensivo con tutoría online en paralelo al módulo M7: esqueleto de extremo a extremo, desarrollo guiado por evaluación, pruebas de integración y carga, y revisión intermedia con demo funcional del núcleo del producto (semana 14).`,
  stack: ['GitHub Actions', 'pytest / JUnit 5', 'Testcontainers', 'k6', 'pre-commit', 'Claude Code'],
  teoria: {
    intro: c`La forma más segura de terminar un Proyecto Final de IA es tener <strong>cuanto antes</strong> un flujo completo funcionando ("esqueleto andante"), aunque cada pieza sea simple, y mejorar después la pieza que más impacte en las métricas.`,
    bloques: [
      [
        '1. Esqueleto andante',
        c`<p>Primera semana: interfaz mínima → API → recuperación simple → LLM → respuesta, desplegado en local con un comando y con un test de extremo a extremo. Todo lo demás es iteración sobre una base que funciona.</p>`
      ],
      [
        '2. Desarrollo guiado por evaluación',
        c`<p>Cada iteración: hipótesis ("el reranking mejorará el recall@5"), cambio, ejecución del golden set, comparación con la versión anterior y registro en <code>docs/evaluacion.md</code>. Si la métrica no mejora, se revierte.</p>`
      ],
      [
        '3. Calidad de código',
        c`<p>Tipado (type hints / Java), linters y formateadores (ruff, Spotless), pre-commit, tests unitarios con LLM simulado y CI que bloquea merges en rojo. El 40 % de la nota es implementación y calidad.</p>`
      ],
      [
        '4. Trabajo con asistentes de código',
        c`<p>Usa Claude Code u otros asistentes con <code>CLAUDE.md</code>, tareas pequeñas y revisión de cada cambio. Commits atómicos con mensajes claros: el historial de Git es parte de la evidencia de autoría.</p>`
      ],
      [
        '5. Pirámide de pruebas para sistemas de IA',
        c`<p>Base: unitarias (lógica, parsers, validadores) con LLM simulado. Medio: integración con dependencias reales en contenedores (Postgres/pgvector, Redis, Neo4j) y LLM simulado o grabado. Cima: E2E y evaluación con LLM real sobre el golden set.</p>`
      ],
      [
        '6. Testcontainers',
        c`<p>Arranca dependencias reales en Docker desde el propio test (Python o Java), con datos sembrados y destrucción automática. Elimina el "en mi máquina funciona".</p>`
      ],
      [
        '7. Carga y robustez',
        c`<p>k6 para medir latencias p50/p95/p99 y errores bajo carga, comprobando los límites de tasa de la pasarela y el comportamiento de la cola. Prueba de caos: proveedor principal caído, base de datos lenta.</p>`
      ]
    ],
    flujo: [
      'Hipótesis',
      'Rama + cambio',
      'Tests + eval rápida (CI)',
      'Comparar métricas',
      'Merge o revertir',
      'Registrar en evaluacion.md'
    ],
    tabla: {
      cap: 'Checklist del MVP',
      head: ['Elemento', 'Criterio de hecho'],
      rows: [
        ['Arranque', c`<code>docker compose up</code> o un comando documentado`],
        ['Flujo principal', 'Funciona de extremo a extremo con datos sintéticos'],
        ['Tests', 'Unitarios + 1 E2E en CI'],
        ['Evaluación', 'Golden set ejecutable con informe'],
        ['Observabilidad', 'Trazas de cada petición'],
        ['Seguridad básica', 'Secretos fuera del repo, validación de entradas']
      ]
    },
    claves: [
      'Primero de extremo a extremo, después profundidad.',
      'Cada mejora, con su métrica antes y después.',
      'Commits pequeños y CI siempre en verde.'
    ]
  },
  taller: {
    entorno: 'Repositorio del Proyecto Final · GitHub Actions · Docker · PowerShell 7',
    pasos: [
      {
        t: 'pre-commit con ruff, detección de secretos y tests rápidos',
        lang: 'yaml',
        file: '.pre-commit-config.yaml',
        code: c`
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
        pass_filenames: false`
      },
      {
        t: 'CI del Proyecto Final: calidad + tests + evaluación rápida',
        lang: 'yaml',
        file: '.github/workflows/ci.yml',
        code: c`
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
        env: { ANTHROPIC_API_KEY: "\${{ secrets.ANTHROPIC_API_KEY }}" }`
      },
      {
        t: 'Arnés de evaluación con comparación entre versiones',
        lang: 'python',
        file: 'eval/run.py',
        code: c`
import argparse
import json
import statistics
import subprocess
import sys
from pathlib import Path
from sistema import responder            # punto de entrada del Proyecto Final
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
sys.exit(0 if resumen["fidelidad"] >= a.umbral_fidelidad else 1)`
      },
      {
        t: 'Flujo de trabajo diario con Claude Code',
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
git switch -c feat/reranking
claude   # "Añade reranking con bge-reranker-v2-m3 tras la búsqueda híbrida. Sigue CLAUDE.md, añade tests y ejecuta la eval rápida."
uv run pytest -q
uv run python eval/run.py --subset rapido
git add -p ; git commit -m "Añadir reranking cross-encoder (recall@5 0,71 → 0,84)"
git push -u origin feat/reranking
gh pr create --fill`
      },
      {
        t: 'Integración en Python con Testcontainers + pgvector',
        lang: 'python',
        file: 'tests/integracion/test_busqueda.py',
        code: c`
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
    assert all(r.ciclo == "DAM" for r in buscar(conexion, "horas", ciclo="DAM", k=5))`
      },
      {
        t: 'Integración en Java con Testcontainers y LLM simulado',
        lang: 'java',
        file: 'TutorServiceIT.java',
        code: c`
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
}`
      },
      {
        t: 'Prueba de carga con k6',
        lang: 'javascript',
        file: 'carga/consulta.js',
        code: c`
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
}`
      }
    ]
  },
  prompts: [
    {
      t: 'Revisor de PR del Proyecto Final',
      tipo: 'System Prompt',
      lang: 'markdown',
      code: c`
Revisa este pull request de un Proyecto Final de ingeniería de IA. Prioriza:
1. Errores de corrección y casos límite.
2. Riesgos de seguridad (secretos, inyección, PII).
3. Cambios en prompts o modelos sin evidencia de evaluación.
4. Tests que faltan.
Ignora el estilo si el linter pasa. Formato: lista de hallazgos con fichero:línea y severidad.`
    },
    {
      t: 'Diario de iteraciones',
      tipo: 'Plantilla',
      lang: 'markdown',
      file: 'docs/evaluacion.md',
      code: c`
| Fecha | Commit | Hipótesis | Cambio | Fidelidad | Exactitud | p95 (ms) | Coste/consulta | Decisión |
|-------|--------|-----------|--------|-----------|-----------|----------|----------------|----------|
| {f}   | a1b2c3 | Baseline  | Denso top-5 | 0,78 | 0,64 | 1 900 | 0,004 $ | — |
| {f}   | d4e5f6 | Híbrido mejora recall | BM25 + RRF | 0,81 | 0,71 | 2 000 | 0,004 $ | Merge |`
    },
    {
      t: 'Generador de casos límite',
      tipo: 'Plantilla',
      lang: 'markdown',
      code: c`
Para la funcionalidad {funcionalidad}, genera 15 entradas límite: vacías, muy largas,
en otro idioma, con errores ortográficos, con datos personales, ambiguas, con
instrucciones incrustadas y fuera de dominio. Indica para cada una el comportamiento
correcto esperado del sistema.`
    }
  ],
  actividad: {
    tipo: 'pfm',
    titulo: 'Hito 3 del Proyecto Final: revisión intermedia',
    contexto: c`Demo funcional del núcleo del producto con tu tutor (online, semana 14). Es también la semana de recuperación: si tienes un proyecto de módulo pendiente, entrega aquí su nueva versión en la sesión correspondiente.`,
    requisitos: [
      'Núcleo del producto funcionando de extremo a extremo y arrancable con un comando.',
      'CI con tests y evaluación rápida en verde.',
      'Al menos 3 iteraciones documentadas con métricas.',
      'Lista de pendientes priorizada hasta la entrega final del 23 de enero.'
    ],
    entregables: ['Repositorio actualizado (rama main en verde)', 'Vídeo o grabación de la demo (≤ 5 min)'],
    rubrica: [
      ['Funcionalidad de extremo a extremo', 40],
      ['Calidad, pruebas y CI', 30],
      ['Iteraciones con métricas', 30]
    ]
  },
  faq: [
    [
      'Voy retrasado. ¿Qué recorto?',
      c`Recorta alcance funcional, nunca evaluación ni documentación de cumplimiento. Un sistema más pequeño, bien medido y desplegado puntúa más que uno grande sin métricas.`
    ],
    [
      'Los tests con LLM real son lentos y caros en CI.',
      c`Marca esos tests (<code>@pytest.mark.ia_real</code>), usa un LLM simulado en los unitarios y ejecuta la evaluación real solo en PRs y con un subconjunto rápido.`
    ],
    [
      'La prueba de carga agota mi cuota del proveedor.',
      c`Ejecuta la carga contra el modelo local (vLLM) o un LLM simulado con latencia artificial para medir tu sistema, y haz una prueba corta y controlada contra el proveedor real con presupuesto limitado en LiteLLM.`
    ],
    [
      '¿Cuántas horas de tutoría tengo para el Proyecto Final?',
      c`Unas 3 horas por alumno con el tutor del centro, además de la tutoría grupal semanal y, si lo hay, el mentor de la empresa colaboradora.`
    ]
  ]
});

SESIONES.push({
  n: 17,
  semana: '15',
  fechas: '21 – 26 ene 2030',
  corto: 'PFM: entrega final y defensa',
  titulo: 'Proyecto Final de Máster III · Despliegue, Memoria, Entrega Final y Defensa ante Tribunal',
  duracion: 'Semana 15 · defensa el sábado 26 de enero',
  resumen: c`Entrega final el miércoles 23 de enero: producto desplegado, repositorio documentado y memoria de 15 a 25 páginas. Defensa presencial el sábado 26 de enero: 15 minutos de presentación y 10 de preguntas ante un tribunal formado por la coordinación académica, un docente del programa y un profesional de una empresa colaboradora.`,
  stack: [
    'Docker Compose / nube',
    'Caddy (HTTPS)',
    'Model card',
    'Memoria (Markdown → PDF)',
    'Presentación'
  ],
  teoria: {
    intro: c`La defensa es la última evidencia: demuestras que entiendes cada decisión, que tus resultados son sólidos y que conoces los límites de tu sistema. El Tribunal valora la <strong>honestidad técnica</strong> tanto como el resultado.`,
    bloques: [
      [
        '1. Despliegue reproducible',
        c`<p>Infraestructura como código, configuración por variables de entorno, secretos gestionados, HTTPS (Caddy obtiene certificados automáticamente), versionado de imágenes y un procedimiento de actualización y rollback documentado.</p>`
      ],
      [
        '2. Operación',
        c`<p>Healthchecks, métricas (latencia, errores, coste, tokens), alertas, trazas, copias de seguridad de la base de datos y del índice vectorial con prueba de restauración, y un runbook para incidencias típicas.</p>`
      ],
      [
        '3. Memoria (15–25 páginas)',
        c`<p>Resumen · Introducción, problema y objetivos medibles · Análisis y requisitos · Arquitectura y decisiones (C4, ADRs) · Implementación (decisiones clave, no listados de código) · Evaluación del sistema de IA (metodología, resultados, análisis de errores) · Despliegue y operación · Cumplimiento normativo y ética (resumen del proyecto de M7 y ficha de transparencia) · Uso de asistentes de IA · Conclusiones, limitaciones y trabajo futuro.</p>`
      ],
      [
        '4. Defensa (15 + 10 minutos)',
        c`<p>Problema y usuario (2 min) → arquitectura (3) → demo en vivo (5) → resultados con métricas (3) → normativa y conclusiones (2). Después, 10 minutos de preguntas. Ten un vídeo de la demo por si falla la red.</p>`
      ],
      [
        '5. Tribunal y criterios',
        c`<p>Tribunal: <strong>coordinación académica, un docente del programa y un profesional de una empresa colaboradora</strong>. Criterios: <strong>solución técnica (40 %)</strong>, <strong>calidad y evaluación del sistema de IA (20 %)</strong>, <strong>cumplimiento normativo y ética (10 %)</strong>, <strong>memoria (15 %)</strong> y <strong>defensa (15 %)</strong>. El resultado es <em>apto</em> o <em>no apto</em> con una calificación de 0 a 10.</p>`
      ],
      [
        '6. Nota final y título',
        c`<p><strong>Nota final = 70 % media de los módulos ponderada por horas + 30 % nota del Proyecto Final.</strong> Con 9 o más se concede la mención «con distinción». Requisitos del título: tres jornadas presenciales con exámenes aprobados, 80 % de actividades semanales entregadas, M1–M7 superados, 4 de 5 seminarios y Proyecto Final apto. Quien no complete el programa recibe un certificado de aprovechamiento de los módulos superados.</p>`
      ]
    ],
    flujo: [
      'Despliegue final',
      'Memoria (23 ene)',
      'Defensa (26 ene)',
      'Acta del tribunal',
      'Nota final',
      'Diploma y suplemento'
    ],
    tabla: {
      cap: 'Criterios del tribunal del Proyecto Final',
      head: ['Criterio', 'Peso', 'Qué se valora'],
      rows: [
        ['Solución técnica', '40 %', 'Funcionalidad, arquitectura, calidad de código, despliegue'],
        [
          'Calidad y evaluación del sistema de IA',
          '20 %',
          'Métricas, conjunto de evaluación, análisis de errores'
        ],
        [
          'Cumplimiento normativo y ética',
          '10 %',
          'Reglamento de IA, RGPD, licencias, ficha de transparencia'
        ],
        ['Memoria', '15 %', 'Claridad, rigor y reproducibilidad'],
        ['Defensa', '15 %', 'Comunicación, demo y respuestas']
      ]
    },
    claves: [
      'Defiende con datos: cada afirmación de la memoria, con su métrica o referencia.',
      'Reconoce las limitaciones antes de que te las señalen.',
      'Ensaya la demo en el equipo y la red donde la harás.'
    ]
  },
  taller: {
    entorno: 'Repositorio del Proyecto Final · Pandoc o LaTeX · editor de presentaciones · Plataforma LMS del Máster',
    pasos: [
      {
        t: 'Proxy HTTPS con Caddy',
        lang: 'plaintext',
        file: 'deploy/Caddyfile',
        code: c`
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
}`
      },
      {
        t: 'Compose de producción con perfiles y backups',
        lang: 'yaml',
        file: 'deploy/docker-compose.prod.yml',
        code: c`
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
  caddy-data: {}`
      },
      {
        t: 'Plantilla de Model Card',
        lang: 'markdown',
        file: 'docs/model-card.md',
        code: c`
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
Clasificación EU AI Act: {…} (docs/cumplimiento.md). Base jurídica RGPD: {…}.`
      },
      {
        t: 'Generar la memoria en PDF desde Markdown',
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
winget install JohnMacFarlane.Pandoc
winget install MiKTeX.MiKTeX
$meta = @("--metadata", "title=Asistente normativo con RAG híbrido y evaluación continua", "--metadata", "author=Nombre Apellido")
pandoc docs/memoria/*.md -o memoria-pfm.pdf --toc --number-sections @meta --pdf-engine=xelatex -V lang=es -V geometry:margin=2.5cm`
      },
      {
        t: 'Esqueleto de la memoria',
        lang: 'markdown',
        file: 'docs/memoria/00-indice.md',
        code: c`
# Resumen
# 1. Introducción: problema, usuarios y objetivos medibles
# 2. Análisis y requisitos
# 3. Arquitectura y decisiones (C4, ADRs, modelos y proveedores)
# 4. Implementación
# 5. Evaluación del sistema de IA (metodología, resultados, errores)
# 6. Despliegue y operación
# 7. Cumplimiento normativo y ética (ficha de transparencia)
# 8. Uso de asistentes de IA
# 9. Conclusiones, limitaciones y trabajo futuro
# Bibliografía · Anexos
# Extensión: 15–25 páginas`
      },
      {
        t: 'Checklist de depósito (ejecutable)',
        lang: 'python',
        file: 'scripts/checklist_deposito.py',
        code: c`
from pathlib import Path
import subprocess

REQUISITOS = {
    "README con despliegue": Path("README.md"),
    "Memoria PDF": Path("memoria-pfm.pdf"),
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
    print("  - Posibles secretos en el repositorio:\n", secretos)`
      },
      {
        t: 'Entrega en la plataforma',
        d: c`En la pestaña <strong>Actividad práctica</strong> de esta sesión registra el repositorio, la URL del producto desplegado y la memoria antes del <strong>miércoles 23 de enero</strong>. El tribunal registrará las calificaciones por criterio y el acta tras la defensa del sábado 26.`
      }
    ]
  },
  prompts: [
    {
      t: 'Simulacro de Tribunal',
      tipo: 'System Prompt',
      lang: 'markdown',
      code: c`
Eres el tribunal del Proyecto Final del Máster en IA Aplicada al Desarrollo de Aplicaciones
Multiplataforma del CFP José Ramón Otero (coordinación académica, docente y profesional de empresa). Has leído la memoria del Proyecto Final que te adjunto.
Haz UNA pregunta cada vez, como en una defensa real, y espera mi respuesta.
Alterna preguntas de: arquitectura, evaluación y validez de resultados, seguridad,
RGPD/EU AI Act y uso de asistentes de IA. Tras mi respuesta, valórala brevemente
(sólida / mejorable / insuficiente) y explica qué faltó. Tras 6 preguntas (10 minutos), da una
estimación de la nota del criterio "Defensa" (15 %) con justificación.`
    },
    {
      t: 'Revisor de diapositivas',
      tipo: 'Plantilla',
      lang: 'markdown',
      code: c`
Revisa el guion de mi presentación de PFM (15 minutos).
<guion>{diapositivas en texto}</guion>
Comprueba: una idea por diapositiva, tiempo estimado por bloque, que cada resultado
tenga su métrica y su comparación con la línea base, que la demo tenga plan B, y que
las limitaciones aparezcan explícitamente. Propón cortes si supera los 15 minutos.`
    },
    {
      t: 'Revisión de README para despliegue por terceros',
      tipo: 'Plantilla',
      lang: 'markdown',
      code: c`
Imagina que eres un técnico de sistemas que no conoce el proyecto. Con solo este
README, intenta desplegar el sistema mentalmente paso a paso y lista cada punto donde
te quedarías bloqueado (variables sin documentar, puertos, dependencias, datos
iniciales, credenciales). Propón el texto que falta.`
    }
  ],
  actividad: {
    tipo: 'pfm',
    titulo: 'Hito 4 del Proyecto Final: entrega final y defensa presencial',
    contexto: c`Entrega final hasta el miércoles 23 de enero de 2030 y defensa presencial el sábado 26 de enero ante el tribunal.`,
    requisitos: [
      c`Producto desplegado (URL o instrucciones reproducibles) y repositorio documentado con etiqueta <code>v1.0.0</code>.`,
      'Memoria de 15 a 25 páginas en PDF.',
      'Ficha de transparencia y registro de uso de IA.',
      'Presentación de 15 minutos con demo en vivo y vídeo de respaldo.'
    ],
    entregables: [
      'Repositorio y URL del producto',
      c`<code>memoria-pfm.pdf</code>`,
      'Presentación (PDF) y vídeo de la demo'
    ],
    rubrica: [
      ['Solución técnica', 40],
      ['Calidad y evaluación del sistema de IA', 20],
      ['Cumplimiento normativo y ética', 10],
      ['Memoria', 15],
      ['Defensa', 15]
    ]
  },
  faq: [
    [
      '¿Qué nota necesito en el Proyecto Final?',
      c`Calificación de apto (nota igual o superior a 5). La nota del Proyecto Final cuenta un 30 % en la nota final del Máster.`
    ],
    [
      '¿Qué pasa si la demo falla durante la defensa?',
      c`Pasa al vídeo de respaldo sin dramatizar y explica qué ha fallado y por qué: diagnosticar en directo también demuestra dominio. Por eso el vídeo es obligatorio.`
    ],
    [
      '¿Cómo se verifica el diploma?',
      c`Cada diploma se anota en el libro de registro de títulos propios del centro y lleva un código de verificación que puede comprobarse online. Se acompaña de un suplemento con los módulos, horas, contenidos y calificaciones.`
    ],
    [
      '¿Es un título oficial?',
      c`No. Es un <strong>título propio del centro, sin carácter oficial</strong>, de 300 horas. No es un Máster Universitario ni un Máster de Formación Profesional. Su valor está en tu portfolio, la certificación de la industria incluida y la participación de empresas.`
    ],
    [
      'No tengo servidor propio.',
      c`Puedes desplegar en una VM del aula, en un servicio con capa gratuita o entregar un despliegue local completo con Docker Compose que el Tribunal pueda reproducir. Lo evaluado es la reproducibilidad y la operación, no el proveedor.`
    ]
  ]
});
