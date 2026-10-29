// M1 · Fundamentos: Python para IA y desarrollo asistido por IA (30 h · semanas 1–2)

SESIONES.push({
  n: 1,
  semana: '1',
  fechas: '1 – 5 oct 2029',
  corto: 'Python para datos e IA',
  titulo: 'Python para Datos e IA: Entornos, Notebooks, NumPy, pandas, APIs REST y Git',
  duracion: 'Semana 1 · 15 h',
  resumen: c`Del <code>ArrayList&lt;Double&gt;</code> al array vectorizado: entornos con uv, notebooks, NumPy y pandas, consumo de APIs REST para obtener datos y flujo de trabajo con Git. Incluye cómo razonar sobre la memoria (CPU y GPU) que necesita un modelo.`,
  stack: ['Python 3.12', 'uv', 'Jupyter', 'NumPy 2', 'pandas', 'httpx', 'Git', 'PyTorch (introducción)'],
  teoria: {
    intro: c`Un desarrollador DAM piensa en objetos y colecciones. La IA moderna piensa en <strong>tensores</strong>: arrays n-dimensionales homogéneos, contiguos en memoria y operados de forma <em>vectorizada</em>. Esta sesión traduce tu modelo mental de Java/Kotlin al modelo de datos que usan PyTorch, JAX y cualquier motor de inferencia de LLMs.`,
    bloques: [
      [
        '1. Entornos y notebooks',
        c`<p>Cada proyecto tiene su entorno aislado y reproducible: <code>uv</code> crea el entorno, fija versiones en <code>uv.lock</code> (el equivalente a fijar dependencias en Maven/Gradle) y ejecuta scripts. Los <strong>notebooks</strong> (Jupyter en VS Code) sirven para explorar datos y documentar experimentos; el código definitivo vive en módulos <code>.py</code> con tests.</p>`
      ],
      [
        '2. Escalares, vectores, matrices y tensores',
        c`<p>Un tensor es la generalización de una matriz a <em>n</em> ejes. Su <strong>forma</strong> (<code>shape</code>) es lo primero que debes depurar: un lote de 32 frases de 128 tokens con embeddings de 768 dimensiones es un tensor <code>(32, 128, 768)</code>. Su <strong>dtype</strong> (<code>float32</code>, <code>bfloat16</code>, <code>int8</code>) determina precisión y memoria.</p>`
      ],
      [
        '3. Vectorización y broadcasting',
        c`<p>Un bucle <code>for</code> en Python sobre un millón de elementos es ~100× más lento que la operación equivalente en NumPy, que delega en C/BLAS y en instrucciones SIMD. El <strong>broadcasting</strong> alinea formas compatibles desde la derecha: <code>(32,128,768) + (768,)</code> suma un sesgo a cada token sin copiar datos.</p>`
      ],
      [
        '4. Producto matricial: el corazón de los LLMs',
        c`<p>Más del 90 % del cómputo de un Transformer son multiplicaciones de matrices (<code>@</code>). Para <code>A(m×k) @ B(k×n)</code> el coste es <code>2·m·k·n</code> FLOPs. Saber estimarlo te permite razonar sobre latencia y coste por token.</p>`
      ],
      [
        '5. Pandas avanzado para datasets de IA',
        c`<p>Antes de entrenar o evaluar hay que limpiar: tipos <code>category</code> y <code>Int64</code> nullable, <code>pyarrow</code> como backend, operaciones <code>groupby().agg()</code>, <code>merge</code> y lectura por bloques (<code>chunksize</code>) de ficheros que no caben en RAM. Polars es la alternativa de alto rendimiento.</p>`
      ],
      [
        '6. Datos desde APIs REST',
        c`<p>Muchos datos llegan de APIs: con <code>httpx</code> haces la petición, validas la respuesta (código, esquema, paginación) y la conviertes en un <code>DataFrame</code>. Lo mismo que harías con <code>HttpClient</code> en Java, pero con pandas para analizar el resultado.</p>`
      ],
      [
        '7. Memoria de GPU (VRAM) y dispositivos',
        c`<p>La VRAM es el recurso escaso. Un modelo de 8 000 millones de parámetros ocupa ~16 GB en <code>bfloat16</code> (2 bytes/parámetro) solo en pesos, más la caché KV durante la inferencia. Debes dominar <code>torch.cuda.memory_allocated()</code>, el modo <code>torch.inference_mode()</code>, la liberación con <code>del</code> + <code>torch.cuda.empty_cache()</code> y la selección automática de dispositivo <code>cuda</code> / <code>mps</code> / <code>cpu</code>.</p>`
      ],
      [
        '8. Git como base del portfolio',
        c`<p>Todo lo que construyas en el Máster se publica en GitHub: commits pequeños con mensajes claros, ramas por funcionalidad, <code>.gitignore</code> para entornos, datos pesados y secretos, y un README que permita ejecutar el proyecto en cinco minutos. Los datasets grandes y los modelos no van al repositorio.</p>`
      ]
    ],
    formula: c`Memoria de pesos ≈ nº parámetros × bytes por dtype<br>8B × 2 B (bf16) ≈ 16 GB · 8B × 0,5 B (int4) ≈ 4 GB<br>FLOPs(A@B) = 2 · m · k · n`,
    flujo: [
      'API REST / CSV',
      'httpx + validación',
      'pandas: limpieza',
      'NumPy: matriz float32',
      'Cálculo vectorizado',
      'Notebook + commit'
    ],
    tabla: {
      cap: 'Del ecosistema Java al ecosistema Python científico',
      head: ['Concepto en DAM (Java/Kotlin)', 'Equivalente en IA (Python)', 'Por qué importa'],
      rows: [
        [
          c`<code>double[][]</code> / <code>List&lt;List&lt;Double&gt;&gt;</code>`,
          c`<code>np.ndarray</code> / <code>torch.Tensor</code>`,
          'Memoria contigua y vectorización SIMD/GPU'
        ],
        [
          'Maven / Gradle',
          c`<code>uv</code> + <code>pyproject.toml</code>`,
          'Entornos reproducibles y rápidos'
        ],
        [
          c`Streams <code>map/filter</code>`,
          'Operaciones vectorizadas y máscaras booleanas',
          'Sin bucles Python en el camino crítico'
        ],
        [
          'JDBC + ResultSet',
          c`<code>pandas.read_sql</code> / Polars`,
          'Datos tabulares listos para modelos'
        ],
        ['Heap de la JVM', 'VRAM de la GPU', 'El cuello de botella real de los LLMs']
      ]
    },
    claves: [
      c`Depura siempre <code>shape</code>, <code>dtype</code> y <code>device</code> antes que la lógica.`,
      c`Nunca iteres con <code>for</code> sobre tensores grandes: vectoriza.`,
      'Estima la VRAM antes de descargar un modelo: parámetros × bytes por dtype + caché KV.',
      'Notebook para explorar, módulo con tests para entregar.'
    ]
  },
  taller: {
    entorno: 'Windows 11 · PowerShell 7 · VS Code (extensiones Python, Jupyter, Pylance) · GPU NVIDIA opcional',
    pasos: [
      {
        t: 'Crear el proyecto con uv (gestor moderno de Python)',
        d: 'uv sustituye a pip + venv con resolución de dependencias muy rápida.',
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
# Instalar uv (una sola vez)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

uv init mia-s01-tensores
cd mia-s01-tensores
uv python pin 3.12
uv add numpy pandas pyarrow matplotlib ipykernel
# PyTorch con CUDA 12.4 (omite --index si no tienes GPU NVIDIA)
uv add torch --index https://download.pytorch.org/whl/cu124
code .`
      },
      {
        t: 'Vectorización: bucle Python frente a NumPy',
        d: 'Medimos la diferencia de rendimiento con la similitud coseno, operación base de cualquier buscador semántico.',
        lang: 'python',
        file: 'src/vectorizacion.py',
        code: c`
import time
import numpy as np

rng = np.random.default_rng(42)
docs = rng.standard_normal((50_000, 384), dtype=np.float32)   # 50k embeddings
consulta = rng.standard_normal(384, dtype=np.float32)


def coseno_bucle(docs, q):
    res = []
    for d in docs:                                   # estilo "Java clásico"
        num = sum(a * b for a, b in zip(d, q))
        den = (sum(a * a for a in d) ** 0.5) * (sum(b * b for b in q) ** 0.5)
        res.append(num / den)
    return res


def coseno_vectorizado(docs, q):
    docs_n = docs / np.linalg.norm(docs, axis=1, keepdims=True)  # broadcasting
    q_n = q / np.linalg.norm(q)
    return docs_n @ q_n                               # un único matmul


t0 = time.perf_counter(); coseno_bucle(docs[:2000], consulta); t1 = time.perf_counter()
sims = coseno_vectorizado(docs, consulta); t2 = time.perf_counter()
print(f"Bucle (2k docs): {t1-t0:.2f}s | Vectorizado (50k docs): {t2-t1:.4f}s")
print("Top-5 documentos:", np.argsort(-sims)[:5])`
      },
      {
        t: 'Del DataFrame al tensor en GPU',
        lang: 'python',
        file: 'src/pipeline_tensor.py',
        code: c`
import numpy as np
import pandas as pd
import torch
from dispositivo import mejor_dispositivo

df = pd.read_csv("data/matriculas.csv", dtype_backend="pyarrow")
df["ciclo"] = df["ciclo"].astype("category")
df = df.dropna(subset=["nota_media", "horas_practicas"])

# One-hot de la variable categórica + normalización z-score
X = pd.get_dummies(df[["nota_media", "horas_practicas", "ciclo"]], columns=["ciclo"], dtype=np.float32)
X = (X - X.mean()) / X.std().replace(0, 1)

device = mejor_dispositivo()
tensor = torch.from_numpy(X.to_numpy(dtype=np.float32)).to(device)
print(tensor.shape, tensor.dtype, tensor.device)

with torch.inference_mode():
    covarianza = (tensor.T @ tensor) / (tensor.shape[0] - 1)
print("Matriz de covarianza:", covarianza.shape)`
      },
      {
        t: 'Consumir una API REST y analizarla con pandas',
        d: c`Usamos la API pública de datos abiertos de ejemplo (sustituible por la de una empresa colaboradora). Validamos, paginamos y guardamos en Parquet.`,
        lang: 'python',
        file: 'src/api_a_dataframe.py',
        code: c`
import httpx
import pandas as pd

URL = "https://jsonplaceholder.typicode.com/todos"   # API de prueba; cambia por la de tu caso


def descargar(url: str) -> pd.DataFrame:
    with httpx.Client(timeout=10, headers={"Accept": "application/json"}) as http:
        r = http.get(url)
        r.raise_for_status()                    # 4xx/5xx -> excepción, como en un cliente Java bien hecho
        datos = r.json()
    if not isinstance(datos, list):
        raise ValueError("Se esperaba una lista JSON")
    return pd.DataFrame(datos)


df = descargar(URL)
print(df.dtypes)
resumen = (df.groupby("userId")["completed"]
             .agg(tareas="count", completadas="sum")
             .assign(ratio=lambda d: (d.completadas / d.tareas).round(2))
             .sort_values("ratio", ascending=False))
print(resumen.head())
resumen.to_parquet("data/resumen.parquet")      # formato columnar: rápido y con tipos`
      },
      {
        t: 'Notebook de exploración en VS Code',
        d: c`Crea <code>notebooks/exploracion.ipynb</code>, selecciona el entorno <code>.venv</code> del proyecto como kernel y explora el Parquet. El notebook se versiona sin salidas para que los diffs sean legibles.`,
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
uv add --dev ipykernel nbstripout
uv run nbstripout --install          # elimina las salidas del notebook al hacer commit
code notebooks/exploracion.ipynb`
      },
      {
        t: 'Estimar la VRAM de un LLM antes de descargarlo',
        d: 'Una función que usarás durante todo el Máster para decidir cuantización y hardware.',
        lang: 'python',
        file: 'src/calculadora_vram.py',
        code: c`
BYTES = {"fp32": 4, "bf16": 2, "fp16": 2, "int8": 1, "int4": 0.5}


def vram_gb(params_b: float, dtype: str = "bf16", capas: int = 32, hidden: int = 4096,
            contexto: int = 8192, lote: int = 1, kv_heads_ratio: float = 0.25) -> dict:
    """Pesos + caché KV (2 tensores K y V por capa) + 20 % de sobrecoste de activaciones."""
    pesos = params_b * 1e9 * BYTES[dtype]
    kv = 2 * capas * hidden * kv_heads_ratio * contexto * lote * 2  # caché KV en bf16, con GQA
    total = (pesos + kv) * 1.2
    return {"pesos_gb": round(pesos / 1e9, 1), "kv_gb": round(kv / 1e9, 1), "total_gb": round(total / 1e9, 1)}


for dt in ("bf16", "int8", "int4"):
    print(dt, vram_gb(8, dt))`
      },
      {
        t: 'Publicar en tu portfolio',
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
git init -b main
@"
.venv/
__pycache__/
data/*.parquet
.env
"@ | Out-File -Encoding utf8 .gitignore
git add . ; git commit -m "Semana 1: vectorización, pandas y datos desde API REST"
gh repo create mia-s01-python --public --source . --push`
      }
    ]
  },
  prompts: [
    {
      t: 'Tutor de traducción Java → NumPy/PyTorch',
      tipo: 'System Prompt',
      lang: 'markdown',
      code: c`
Eres un mentor senior de ingeniería de IA para titulados en DAM.
Tu tarea: traducir fragmentos de Java/Kotlin a Python científico vectorizado.

Reglas:
1. Responde siempre con: (a) código NumPy o PyTorch vectorizado, (b) shape y dtype
   de cada tensor intermedio como comentario, (c) complejidad en FLOPs aproximados.
2. Prohibido usar bucles for de Python sobre datos numéricos salvo justificación explícita.
3. Si el código original tiene un error de precisión numérica (float vs double), señálalo.
4. Indica qué parte se ejecutaría en GPU y qué copia host↔device introduce.
5. Si te falta información sobre las formas de entrada, pregunta antes de suponer.`
    },
    {
      t: 'Diagnóstico de errores de forma (shape mismatch)',
      tipo: 'Plantilla de depuración',
      lang: 'markdown',
      code: c`
Contexto: obtengo este error en PyTorch:
<error>
RuntimeError: mat1 and mat2 shapes cannot be multiplied (32x768 and 512x10)
</error>

Código relevante:
<codigo>
{pega aquí la función}
</codigo>

Haz lo siguiente:
1. Reconstruye la shape de cada tensor línea a línea en una tabla.
2. Identifica la primera línea donde la shape diverge de lo esperado.
3. Propón la corrección mínima y explica si cambia la semántica del modelo.`
    },
    {
      t: 'Reglas de proyecto para asistentes de código',
      tipo: 'CLAUDE.md',
      lang: 'markdown',
      file: 'CLAUDE.md',
      code: c`
# Proyecto mia-s01-tensores

## Entorno
- Python 3.12 gestionado con uv. Instalar dependencias: uv sync
- Ejecutar scripts: uv run python src/<script>.py

## Convenciones
- Todo cálculo numérico vectorizado (NumPy/PyTorch). Nada de bucles sobre arrays.
- Comenta la shape de los tensores: # (batch, seq, hidden)
- Selecciona dispositivo con dispositivo.mejor_dispositivo(); nunca "cuda" a fuego.
- dtype por defecto float32 en CPU, bfloat16 en GPU con soporte.

## Prohibido
- Subir datasets con datos personales a data/ (usa data/sintetico/).`
    }
  ],
  actividad: {
    tipo: 'semanal',
    titulo: 'Entrega semanal: motor de similitud vectorizado y análisis de datos de una API',
    contexto: c`La secretaría del centro quiere sugerir ciclos formativos similares a partir de descripciones. Debes construir el núcleo numérico (sin LLM todavía) y demostrar que dominas tensores, vectorización y memoria.`,
    requisitos: [
      c`Función <code>top_k(consulta, k)</code> vectorizada sobre 100 000 vectores sintéticos, con benchmark frente a un bucle Python.`,
      'Script que descargue datos de una API REST pública, los valide y los resuma con pandas.',
      c`Notebook de exploración sin salidas versionadas y calculadora de memoria con tests de <code>pytest</code>.`,
      'Repositorio publicado en GitHub con README ejecutable en 5 minutos.'
    ],
    entregables: [
      c`<code>pyproject.toml</code> y <code>uv.lock</code>`,
      c`<code>src/</code>, <code>tests/</code> y <code>notebooks/</code>`,
      'README con resultados'
    ],
    rubrica: [
      ['Corrección y tests', 40],
      ['Vectorización y uso de pandas', 30],
      ['Repositorio y documentación', 30]
    ]
  },
  faq: [
    [
      'Tengo un portátil sin GPU NVIDIA. ¿Puedo seguir el Máster?',
      c`Sí. M1 funciona entero en CPU. En Mac con Apple Silicon usa <code>mps</code>. Para entrenar redes en M2 usarás Google Colab, Kaggle (GPU gratuita) o los laboratorios en la nube de la plataforma, y en local, modelos cuantizados que funcionan en CPU.`
    ],
    [
      c`<code>CUDA out of memory</code> aunque el modelo "cabe". ¿Por qué?`,
      c`Además de los pesos se reserva memoria para activaciones, gradientes (si entrenas), estados del optimizador (AdamW: 2 × parámetros en fp32) y la caché KV. Usa <code>torch.inference_mode()</code>, reduce el lote, libera tensores con <code>del</code> y llama a <code>torch.cuda.empty_cache()</code>. Consulta <code>torch.cuda.memory_summary()</code>.`
    ],
    [
      '¿Pandas o Polars?',
      c`Pandas es universal y lo exige mucho código existente. Polars es multihilo y perezoso (lazy), mucho más rápido en datasets grandes. Aprende Pandas a fondo y usa Polars cuando el volumen lo justifique; ambos se convierten a Arrow sin copia.`
    ],
    [
      '¿Notebooks o scripts?',
      c`Notebooks para explorar y explicar; scripts y módulos para todo lo que se reutiliza, se prueba o se despliega. Un buen hábito: cuando una celda funciona, muévela a una función en <code>src/</code> y llámala desde el notebook.`
    ]
  ]
});

SESIONES.push({
  n: 2,
  semana: '2',
  fechas: '8 – 12 oct 2029',
  corto: 'Desarrollo asistido por IA',
  titulo: 'Desarrollo Asistido por IA: Asistentes de Código, Prompts para Programar y Revisión Crítica',
  duracion: 'Semana 2 · 15 h',
  resumen: c`Asistentes de código en el IDE y en la terminal para generar, refactorizar, documentar y probar; ingeniería de prompts para programar; revisión crítica del código generado y sus riesgos: errores sutiles, vulnerabilidades, licencias y dependencia de la herramienta. Proyecto del módulo M1.`,
  stack: ['Claude Code', 'GitHub Copilot / JetBrains AI', 'Java 21', 'JUnit 5', 'JaCoCo', 'Semgrep', 'Git'],
  teoria: {
    intro: c`Los asistentes de IA ya escriben buena parte del código rutinario de un equipo. La diferencia entre un desarrollador productivo y uno que introduce errores más rápido está en <strong>cómo los dirige y cómo revisa lo que generan</strong>. En esta semana trabajas como lo hará tu futuro equipo: con asistentes, pero con tests, revisión y criterio.`,
    bloques: [
      [
        '1. Tipos de asistentes',
        c`<ul>
<li><strong>Autocompletado en el IDE</strong> (Copilot, JetBrains AI, Gemini Code Assist): sugerencias línea a línea mientras escribes.</li>
<li><strong>Chat en el IDE</strong>: preguntas sobre el código abierto, explicaciones y cambios localizados.</li>
<li><strong>Agentes de código</strong> (Claude Code, Copilot agent, Cursor): leen el repositorio, editan varios ficheros, ejecutan tests y comandos en bucle. Muy potentes para tareas acotadas y con un criterio claro de "hecho".</li>
</ul>`
      ],
      [
        '2. Prompts para programar',
        c`<p>Un buen encargo a un asistente se parece a una buena tarea de Jira: <strong>contexto</strong> (qué hace el sistema, restricciones, versión de Java), <strong>objetivo concreto</strong>, <strong>criterio de aceptación verificable</strong> (tests que deben pasar), <strong>límites</strong> (qué no tocar) y <strong>formato</strong> (diff pequeño, commits separados). El fichero <code>CLAUDE.md</code> (o equivalentes) guarda el contexto permanente del repositorio: comandos de build, convenciones y prohibiciones.</p>`
      ],
      [
        '3. Primero tests, después cambios',
        c`<p>Antes de modernizar código heredado, el asistente genera <strong>tests de caracterización</strong>: fijan el comportamiento actual (aunque tenga defectos) para detectar cualquier cambio involuntario al refactorizar. Con la red de tests en verde, se refactoriza en pasos pequeños.</p>`
      ],
      [
        '4. Revisión crítica del código generado',
        c`<p>Revisa como revisarías el PR de un compañero nuevo y muy rápido: ¿compila y pasan los tests?, ¿cubre casos límite (nulos, vacíos, concurrencia)?, ¿inventa APIs o versiones?, ¿introduce dependencias innecesarias?, ¿es más complejo de lo necesario? Nunca aceptes un cambio que no entiendas lo bastante como para defenderlo.</p>`
      ],
      [
        '5. Riesgos',
        c`<ul>
<li><strong>Errores sutiles</strong>: código plausible que falla en casos límite o con datos reales.</li>
<li><strong>Vulnerabilidades</strong>: SQL concatenado, deserialización insegura, secretos en el código, validaciones ausentes. Usa análisis estático (Semgrep, SpotBugs) y revisa dependencias.</li>
<li><strong>Licencias</strong>: fragmentos que reproducen código con licencia incompatible; dependencias sugeridas con licencias restrictivas.</li>
<li><strong>Privacidad</strong>: no pegues en un asistente en la nube código o datos confidenciales sin autorización y sin revisar sus condiciones.</li>
<li><strong>Dependencia de la herramienta</strong>: si no sabrías escribirlo sin el asistente, tampoco sabrás arreglarlo cuando falle.</li>
</ul>`
      ]
    ],
    flujo: [
      'Contexto (CLAUDE.md)',
      'Tests de caracterización',
      'Encargo acotado al asistente',
      'Diff pequeño',
      'Tests + análisis estático',
      'Revisión humana',
      'Commit'
    ],
    tabla: {
      cap: 'Qué delegar y qué no',
      head: ['Tarea', 'Delegar en el asistente', 'Revisión necesaria'],
      rows: [
        ['Tests de caracterización y casos límite', 'Sí', 'Comprobar que prueban algo útil'],
        [
          'Refactorización mecánica (records, streams, switch)',
          'Sí, en pasos pequeños',
          'Tests en verde en cada paso'
        ],
        ['Documentación y Javadoc', 'Sí', 'Que describa lo que el código hace realmente'],
        ['Diseño de arquitectura', 'Como apoyo para comparar opciones', 'Decisión humana documentada'],
        [
          'Código de seguridad (autenticación, cifrado)',
          'Con mucha cautela',
          'Revisión experta y bibliotecas estándar'
        ],
        ['Cambios en datos de producción', 'No', '—']
      ]
    },
    claves: [
      'El criterio de "hecho" de un encargo es un test que pasa.',
      'Diffs pequeños, uno por intención.',
      'Se evalúa tu criterio: justifica y verifica todo lo que entregues.'
    ]
  },
  taller: {
    entorno: 'IntelliJ IDEA o VS Code · JDK 21 · Maven · Claude Code (o el asistente que prefieras) · PowerShell 7',
    pasos: [
      {
        t: 'La aplicación heredada',
        d: c`Partimos de una pequeña app de gestión de préstamos de una biblioteca escrita al estilo Java 6: clases anémicas, <code>null</code> por todas partes y sin tests.`,
        lang: 'java',
        file: 'src/main/java/biblioteca/GestorPrestamos.java (antes)',
        code: c`
public class GestorPrestamos {
    private List prestamos = new ArrayList();          // sin genéricos

    public String prestar(Libro libro, Socio socio) {
        if (libro == null || socio == null) return "ERROR";
        if (libro.getEstado() == 1) return "PRESTADO";   // número mágico
        if (socio.getPrestamos() >= 3) return "LIMITE";
        Prestamo p = new Prestamo();
        p.setLibro(libro); p.setSocio(socio);
        p.setFecha(new Date());
        p.setDevolucion(new Date(new Date().getTime() + 15L * 24 * 3600 * 1000));
        prestamos.add(p);
        libro.setEstado(1);
        socio.setPrestamos(socio.getPrestamos() + 1);
        return "OK";
    }
}`
      },
      {
        t: 'Contexto permanente para el asistente',
        lang: 'markdown',
        file: 'CLAUDE.md',
        code: c`
# biblioteca-legacy

## Comandos
- Compilar y testear: ./mvnw verify
- Cobertura: ./mvnw verify y abrir target/site/jacoco/index.html

## Reglas
- Java 21. Objetivo: modernizar sin cambiar el comportamiento observable.
- Antes de refactorizar una clase, debe tener tests de caracterización en verde.
- Un commit por paso de refactorización; los tests pasan en cada commit.
- No añadas dependencias nuevas sin justificarlo en el mensaje del commit.
- No cambies los textos devueltos ("OK", "PRESTADO", "LIMITE"): los usa otra aplicación.`
      },
      {
        t: 'Encargo 1: tests de caracterización',
        d: c`Pide los tests antes de tocar nada. Revisa que cubren los cuatro resultados posibles y los límites (tercer préstamo, cuarto préstamo).`,
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
claude "Genera tests JUnit 5 de caracterización para GestorPrestamos.prestar que fijen el comportamiento ACTUAL, incluidos los casos límite (socio con 2 y con 3 préstamos, libro ya prestado, argumentos nulos). No modifiques código de producción. Ejecuta ./mvnw verify y enséñame la cobertura."`
      },
      {
        t: 'Resultado esperado de los tests (revísalos tú)',
        lang: 'java',
        file: 'src/test/java/biblioteca/GestorPrestamosTest.java',
        code: c`
class GestorPrestamosTest {
    private final GestorPrestamos gestor = new GestorPrestamos();

    @Test void prestaUnLibroDisponible() {
        var libro = new Libro(); var socio = new Socio();
        assertEquals("OK", gestor.prestar(libro, socio));
        assertEquals(1, libro.getEstado());
        assertEquals(1, socio.getPrestamos());
    }

    @Test void rechazaLibroYaPrestado() {
        var libro = new Libro(); libro.setEstado(1);
        assertEquals("PRESTADO", gestor.prestar(libro, new Socio()));
    }

    @ParameterizedTest @CsvSource({"2,OK", "3,LIMITE"})
    void respetaElLimiteDeTresPrestamos(int previos, String esperado) {
        var socio = new Socio(); socio.setPrestamos(previos);
        assertEquals(esperado, gestor.prestar(new Libro(), socio));
    }

    @Test void argumentosNulosDevuelvenError() {
        assertEquals("ERROR", gestor.prestar(null, new Socio()));
        assertEquals("ERROR", gestor.prestar(new Libro(), null));
    }
}`
      },
      {
        t: 'Encargo 2: modernizar a Java 21 en pasos pequeños',
        lang: 'java',
        file: 'GestorPrestamos.java (después, revisado)',
        code: c`
public class GestorPrestamos {
    static final int MAX_PRESTAMOS = 3;
    static final Duration PLAZO = Duration.ofDays(15);

    public enum Resultado { OK, PRESTADO, LIMITE, ERROR }   // toString() conserva los textos

    private final List<Prestamo> prestamos = new ArrayList<>();
    private final Clock reloj;

    public GestorPrestamos(Clock reloj) { this.reloj = reloj; }   // testeable: el tiempo se inyecta
    public GestorPrestamos() { this(Clock.systemDefaultZone()); }

    public String prestar(Libro libro, Socio socio) {
        return evaluar(libro, socio).name();
    }

    private Resultado evaluar(Libro libro, Socio socio) {
        if (libro == null || socio == null) return Resultado.ERROR;
        if (libro.estaPrestado()) return Resultado.PRESTADO;
        if (socio.getPrestamos() >= MAX_PRESTAMOS) return Resultado.LIMITE;
        var ahora = Instant.now(reloj);
        prestamos.add(new Prestamo(libro, socio, ahora, ahora.plus(PLAZO)));   // Prestamo es un record
        libro.marcarPrestado();
        socio.incrementarPrestamos();
        return Resultado.OK;
    }
}`
      },
      {
        t: 'Verificar: tests, cobertura y análisis estático',
        d: 'La IA no se evalúa a sí misma: los tests y las herramientas sí.',
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
.\mvnw.cmd verify                     # tests de caracterización siguen en verde
uvx semgrep scan --config p/java --error   # vulnerabilidades y malas prácticas conocidas
git diff --stat main                  # ¿el cambio es tan pequeño como debería?
git commit -am "Modernizar GestorPrestamos a Java 21 sin cambiar el comportamiento"`
      },
      {
        t: 'Revisión crítica con un segundo asistente (o el mismo, con otro rol)',
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
git diff main~1 | claude -p "Revisa este diff como un revisor senior exigente. Busca cambios de comportamiento no intencionados, casos límite, problemas de concurrencia y vulnerabilidades. No comentes estilo. Formato: tabla Severidad | Línea | Problema | Propuesta."`
      }
    ]
  },
  prompts: [
    {
      t: 'Encargo estructurado para un asistente de código',
      tipo: 'Plantilla',
      lang: 'markdown',
      code: c`
<contexto>
Proyecto: {qué hace}. Stack: Java 21, Spring Boot 3, Maven. Ver CLAUDE.md.
</contexto>
<objetivo>{un único cambio concreto}</objetivo>
<criterio_de_hecho>
- ./mvnw verify en verde.
- Nuevo test que falla antes del cambio y pasa después: {describe el caso}.
</criterio_de_hecho>
<limites>
No modifiques {módulos/ficheros}. Sin dependencias nuevas. No cambies la API pública.
</limites>
<entrega>
Diff mínimo y un párrafo explicando qué has cambiado y por qué.
</entrega>`
    },
    {
      t: 'Revisor crítico de código generado',
      tipo: 'System Prompt',
      lang: 'markdown',
      code: c`
Eres revisor senior de código Java/Kotlin/Python. Te paso un diff generado con ayuda de IA.
Busca SOLO:
1. Cambios de comportamiento no pedidos.
2. Casos límite no cubiertos (null, vacío, tamaños grandes, zonas horarias, concurrencia).
3. Vulnerabilidades (inyección, deserialización, secretos, validación ausente).
4. APIs, métodos o versiones que podrían no existir.
5. Dependencias o complejidad innecesarias.
Para cada hallazgo: fichero:línea, severidad y propuesta. Si no encuentras nada, dilo.`
    },
    {
      t: 'CLAUDE.md para un proyecto Python del Máster',
      tipo: 'CLAUDE.md',
      lang: 'markdown',
      file: 'CLAUDE.md',
      code: c`
# Proyecto mia-s01-tensores

## Entorno
- Python 3.12 gestionado con uv. Instalar dependencias: uv sync
- Ejecutar scripts: uv run python src/<script>.py

## Convenciones
- Todo cálculo numérico vectorizado (NumPy/PyTorch). Nada de bucles sobre arrays.
- Comenta la shape de los tensores: # (batch, seq, hidden)
- Selecciona dispositivo con dispositivo.mejor_dispositivo(); nunca "cuda" a fuego.
- dtype por defecto float32 en CPU, bfloat16 en GPU con soporte.

## Prohibido
- Subir datasets con datos personales a data/ (usa data/sintetico/).`
    },
    {
      t: 'Registro de uso de IA en la entrega',
      tipo: 'Plantilla',
      lang: 'markdown',
      file: 'USO-IA.md',
      code: c`
# Uso de asistentes de IA en este proyecto

| Tarea | Herramienta | Qué generó | Cómo lo verifiqué | Qué cambié a mano |
|---|---|---|---|---|
| Tests de caracterización | {herramienta} | 9 tests JUnit | Ejecutados; añadí el caso de 3 préstamos | Nombres de tests |
| Refactorización a Java 21 | {herramienta} | Enum Resultado, Clock | Tests + Semgrep + revisión | Rechacé un cambio de textos |

Decisiones en las que NO seguí la propuesta del asistente y por qué: {…}`
    }
  ],
  actividad: {
    tipo: 'proyecto',
    titulo: 'Proyecto del módulo M1: modernizar una aplicación heredada con IA y cubrirla con pruebas automáticas',
    contexto: c`Elige una aplicación heredada (de tu ciclo DAM, de un repositorio público o la que aporte una empresa colaboradora) y modernízala con ayuda de asistentes de IA, demostrando que no has roto su comportamiento y que entiendes cada cambio.`,
    requisitos: [
      c`Tests de caracterización antes de cualquier cambio y cobertura medida antes y después (objetivo ≥ 70 % en las clases tocadas).`,
      'Al menos 5 refactorizaciones en commits separados, con los tests en verde en cada uno.',
      'Análisis estático (Semgrep, SpotBugs o similar) sin hallazgos de severidad alta.',
      c`<code>CLAUDE.md</code> del repositorio y <code>USO-IA.md</code> con qué se delegó, cómo se verificó y qué se rechazó.`,
      c`Vídeo de defensa de 5 minutos explicando el antes, el después y una decisión en la que no seguiste al asistente.`
    ],
    entregables: [
      'Repositorio en GitHub con historial de commits limpio',
      'Informe de cobertura y de análisis estático',
      'Enlace al vídeo de defensa (5 min)'
    ],
    rubrica: [
      ['Funcionamiento: comportamiento preservado y mejoras', 30],
      ['Calidad técnica de la refactorización y los tests', 30],
      ['Documentación (README, CLAUDE.md, USO-IA.md)', 20],
      ['Vídeo de defensa', 20]
    ]
  },
  faq: [
    [
      '¿Puedo usar cualquier asistente?',
      c`Sí. El taller usa Claude Code, pero Copilot, JetBrains AI o Gemini Code Assist sirven igual. Lo que se evalúa es el método: contexto, encargos acotados, tests y revisión. Revisa las condiciones de cada herramienta sobre el uso de tu código.`
    ],
    [
      'El asistente cambia cosas que no le he pedido.',
      c`Acota el encargo (ficheros y límites explícitos), pide diffs pequeños y revisa con <code>git diff</code> antes de aceptar. Si el cambio es grande, descártalo y divide la tarea.`
    ],
    [
      '¿Cómo demuestro que entiendo el código generado?',
      c`Con el vídeo de defensa, el registro <code>USO-IA.md</code> y preguntas del tutor: debes poder explicar cualquier línea entregada y por qué es correcta.`
    ],
    [
      '¿Es plagio usar código generado por IA?',
      c`No, si lo declaras en <code>USO-IA.md</code>, lo verificas y respetas las licencias. Sí lo es presentar como propio trabajo ajeno sin declararlo. La normativa del Máster exige transparencia en el uso de IA.`
    ]
  ]
});
