// MÓDULO 0 · Nivelación y Fundamentos Teórico-Prácticos en IA (Sesiones 1 a 4)

SESIONES.push({
  n: 1,
  corto: 'Python científico y tensores',
  titulo: 'Transición de DAM a IA: El Ecosistema Python Científico y Cálculo Tensorial',
  duracion: '5 h',
  resumen: c`Del <code>ArrayList&lt;Double&gt;</code> al tensor: NumPy, Pandas avanzado, álgebra matricial y gestión óptima de memoria en GPU (CUDA) y Apple Silicon (MPS).`,
  stack: ['Python 3.12', 'uv', 'NumPy 2', 'Pandas', 'PyTorch', 'CUDA / MPS', 'VS Code + Jupyter'],
  teoria: {
    intro: c`Un desarrollador DAM piensa en objetos y colecciones. La IA moderna piensa en <strong>tensores</strong>: arrays n-dimensionales homogéneos, contiguos en memoria y operados de forma <em>vectorizada</em>. Esta sesión traduce tu modelo mental de Java/Kotlin al modelo de datos que usan PyTorch, JAX y cualquier motor de inferencia de LLMs.`,
    bloques: [
      ['1. Escalares, vectores, matrices y tensores', c`<p>Un tensor es la generalización de una matriz a <em>n</em> ejes. Su <strong>forma</strong> (<code>shape</code>) es lo primero que debes depurar: un lote de 32 frases de 128 tokens con embeddings de 768 dimensiones es un tensor <code>(32, 128, 768)</code>. Su <strong>dtype</strong> (<code>float32</code>, <code>bfloat16</code>, <code>int8</code>) determina precisión y memoria.</p>`],
      ['2. Vectorización y broadcasting', c`<p>Un bucle <code>for</code> en Python sobre un millón de elementos es ~100× más lento que la operación equivalente en NumPy, que delega en C/BLAS y en instrucciones SIMD. El <strong>broadcasting</strong> alinea formas compatibles desde la derecha: <code>(32,128,768) + (768,)</code> suma un sesgo a cada token sin copiar datos.</p>`],
      ['3. Producto matricial: el corazón de los LLMs', c`<p>Más del 90 % del cómputo de un Transformer son multiplicaciones de matrices (<code>@</code>). Para <code>A(m×k) @ B(k×n)</code> el coste es <code>2·m·k·n</code> FLOPs. Saber estimarlo te permite razonar sobre latencia y coste por token.</p>`],
      ['4. Memoria de GPU (VRAM) y dispositivos', c`<p>La VRAM es el recurso escaso. Un modelo de 8 000 millones de parámetros ocupa ~16 GB en <code>bfloat16</code> (2 bytes/parámetro) solo en pesos, más la caché KV durante la inferencia. Debes dominar <code>torch.cuda.memory_allocated()</code>, el modo <code>torch.inference_mode()</code>, la liberación con <code>del</code> + <code>torch.cuda.empty_cache()</code> y la selección automática de dispositivo <code>cuda</code> / <code>mps</code> / <code>cpu</code>.</p>`],
      ['5. Pandas avanzado para datasets de IA', c`<p>Antes de entrenar o evaluar hay que limpiar: tipos <code>category</code> y <code>Int64</code> nullable, <code>pyarrow</code> como backend, operaciones <code>groupby().agg()</code>, <code>merge</code> y lectura por bloques (<code>chunksize</code>) de ficheros que no caben en RAM. Polars es la alternativa de alto rendimiento.</p>`]
    ],
    formula: c`Memoria de pesos ≈ nº parámetros × bytes por dtype<br>8B × 2 B (bf16) ≈ 16 GB · 8B × 0,5 B (int4) ≈ 4 GB<br>FLOPs(A@B) = 2 · m · k · n`,
    flujo: ['Datos crudos (CSV/JSON)', 'Pandas: limpieza', 'NumPy: matriz float32', 'torch.from_numpy', '.to(device)', 'Cálculo vectorizado en GPU'],
    tabla: {
      cap: 'Del ecosistema Java al ecosistema Python científico',
      head: ['Concepto en DAM (Java/Kotlin)', 'Equivalente en IA (Python)', 'Por qué importa'],
      rows: [
        ['<code>double[][]</code> / <code>List&lt;List&lt;Double&gt;&gt;</code>', '<code>np.ndarray</code> / <code>torch.Tensor</code>', 'Memoria contigua y vectorización SIMD/GPU'],
        ['Maven / Gradle', '<code>uv</code> + <code>pyproject.toml</code>', 'Entornos reproducibles y rápidos'],
        ['Streams <code>map/filter</code>', 'Operaciones vectorizadas y máscaras booleanas', 'Sin bucles Python en el camino crítico'],
        ['JDBC + ResultSet', '<code>pandas.read_sql</code> / Polars', 'Datos tabulares listos para modelos'],
        ['Heap de la JVM', 'VRAM de la GPU', 'El cuello de botella real de los LLMs']
      ]
    },
    claves: [
      'Depura siempre <code>shape</code>, <code>dtype</code> y <code>device</code> antes que la lógica.',
      'Nunca iteres con <code>for</code> sobre tensores grandes: vectoriza.',
      'Estima la VRAM antes de descargar un modelo: parámetros × bytes por dtype + caché KV.'
    ]
  },
  taller: {
    entorno: 'Windows 11 · PowerShell 7 · VS Code (extensiones Python, Jupyter, Pylance) · GPU NVIDIA opcional',
    pasos: [
      { t: 'Crear el proyecto con uv (gestor moderno de Python)', d: 'uv sustituye a pip + venv con resolución de dependencias muy rápida.', lang: 'powershell', file: 'PowerShell', code: c`
# Instalar uv (una sola vez)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

uv init mia-s01-tensores
cd mia-s01-tensores
uv python pin 3.12
uv add numpy pandas pyarrow matplotlib ipykernel
# PyTorch con CUDA 12.4 (omite --index si no tienes GPU NVIDIA)
uv add torch --index https://download.pytorch.org/whl/cu124
code .` },
      { t: 'Detectar el dispositivo y medir la memoria', lang: 'python', file: 'src/dispositivo.py', code: c`
import torch


def mejor_dispositivo() -> torch.device:
    """Devuelve cuda > mps > cpu según disponibilidad."""
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def informe_vram() -> str:
    if not torch.cuda.is_available():
        return "Sin GPU CUDA: se usará CPU/MPS"
    libre, total = torch.cuda.mem_get_info()
    asignada = torch.cuda.memory_allocated()
    return (f"GPU {torch.cuda.get_device_name(0)} | total {total/1e9:.1f} GB | "
            f"libre {libre/1e9:.1f} GB | asignada por PyTorch {asignada/1e9:.2f} GB")


if __name__ == "__main__":
    print(mejor_dispositivo(), "|", informe_vram())` },
      { t: 'Vectorización: bucle Python frente a NumPy', d: 'Medimos la diferencia de rendimiento con la similitud coseno, operación base de cualquier buscador semántico.', lang: 'python', file: 'src/vectorizacion.py', code: c`
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
print("Top-5 documentos:", np.argsort(-sims)[:5])` },
      { t: 'Del DataFrame al tensor en GPU', lang: 'python', file: 'src/pipeline_tensor.py', code: c`
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
print("Matriz de covarianza:", covarianza.shape)` },
      { t: 'Estimar la VRAM de un LLM antes de descargarlo', d: 'Una función que usarás durante todo el Máster para decidir cuantización y hardware.', lang: 'python', file: 'src/calculadora_vram.py', code: c`
BYTES = {"fp32": 4, "bf16": 2, "fp16": 2, "int8": 1, "int4": 0.5}


def vram_gb(params_b: float, dtype: str = "bf16", capas: int = 32, hidden: int = 4096,
            contexto: int = 8192, lote: int = 1, kv_heads_ratio: float = 0.25) -> dict:
    """Pesos + caché KV (2 tensores K y V por capa) + 20 % de sobrecoste de activaciones."""
    pesos = params_b * 1e9 * BYTES[dtype]
    kv = 2 * capas * hidden * kv_heads_ratio * contexto * lote * 2  # caché KV en bf16, con GQA
    total = (pesos + kv) * 1.2
    return {"pesos_gb": round(pesos / 1e9, 1), "kv_gb": round(kv / 1e9, 1), "total_gb": round(total / 1e9, 1)}


for dt in ("bf16", "int8", "int4"):
    print(dt, vram_gb(8, dt))` }
    ]
  },
  prompts: [
    { t: 'Tutor de traducción Java → NumPy/PyTorch', tipo: 'System Prompt', lang: 'markdown', code: c`
Eres un mentor senior de ingeniería de IA para titulados en DAM.
Tu tarea: traducir fragmentos de Java/Kotlin a Python científico vectorizado.

Reglas:
1. Responde siempre con: (a) código NumPy o PyTorch vectorizado, (b) shape y dtype
   de cada tensor intermedio como comentario, (c) complejidad en FLOPs aproximados.
2. Prohibido usar bucles for de Python sobre datos numéricos salvo justificación explícita.
3. Si el código original tiene un error de precisión numérica (float vs double), señálalo.
4. Indica qué parte se ejecutaría en GPU y qué copia host↔device introduce.
5. Si te falta información sobre las formas de entrada, pregunta antes de suponer.` },
    { t: 'Diagnóstico de errores de forma (shape mismatch)', tipo: 'Plantilla de depuración', lang: 'markdown', code: c`
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
3. Propón la corrección mínima y explica si cambia la semántica del modelo.` },
    { t: 'Reglas de proyecto para asistentes de código', tipo: 'CLAUDE.md', lang: 'markdown', file: 'CLAUDE.md', code: c`
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
- Subir datasets con datos personales a data/ (usa data/sintetico/).` }
  ],
  actividad: {
    titulo: 'Motor de similitud vectorizado y calculadora de VRAM',
    contexto: c`La secretaría del centro quiere sugerir ciclos formativos similares a partir de descripciones. Debes construir el núcleo numérico (sin LLM todavía) y demostrar que dominas tensores, vectorización y memoria.`,
    requisitos: [
      'Generar 100 000 vectores sintéticos de 384 dimensiones y una función <code>top_k(consulta, k)</code> vectorizada en NumPy y en PyTorch.',
      'Benchmark reproducible (semilla fija) comparando bucle Python, NumPy CPU y PyTorch en GPU/MPS si está disponible.',
      'Calculadora de VRAM parametrizable (parámetros, dtype, contexto, lote) con tests de <code>pytest</code>.',
      'Notebook con gráfico de tiempos (matplotlib) y conclusiones.'
    ],
    entregables: ['<code>pyproject.toml</code> y <code>uv.lock</code>', '<code>src/</code> con módulos tipados (type hints)', '<code>tests/</code> con al menos 6 tests', '<code>README.md</code> con resultados del benchmark y hardware usado'],
    rubrica: [['Corrección numérica y tests', 30], ['Vectorización y rendimiento', 30], ['Gestión de dispositivo y memoria', 20], ['Calidad del repositorio y documentación', 20]]
  },
  faq: [
    ['Tengo un portátil sin GPU NVIDIA. ¿Puedo seguir el Máster?', c`Sí. Todo el Módulo 0 funciona en CPU. En Mac con Apple Silicon usa <code>mps</code>. Para sesiones de fine-tuning (17-18) usaremos Google Colab o Kaggle (GPU T4 gratuita) y en inferencia local modelos cuantizados GGUF que funcionan en CPU.`],
    ['<code>CUDA out of memory</code> aunque el modelo "cabe". ¿Por qué?', c`Además de los pesos se reserva memoria para activaciones, gradientes (si entrenas), estados del optimizador (AdamW: 2 × parámetros en fp32) y la caché KV. Usa <code>torch.inference_mode()</code>, reduce el lote, libera tensores con <code>del</code> y llama a <code>torch.cuda.empty_cache()</code>. Consulta <code>torch.cuda.memory_summary()</code>.`],
    ['¿float32, float16 o bfloat16?', c`bfloat16 tiene el mismo rango que float32 con menos precisión: es el estándar para entrenar e inferir LLMs en GPUs modernas (Ampere o superior). float16 puede desbordarse (overflow) sin escalado de pérdida. Para cálculos estadísticos clásicos, mantén float32/float64.`],
    ['¿Pandas o Polars?', c`Pandas es universal y lo exige mucho código existente. Polars es multihilo y perezoso (lazy), mucho más rápido en datasets grandes. Aprende Pandas a fondo y usa Polars cuando el volumen lo justifique; ambos se convierten a Arrow sin copia.`]
  ]
});

SESIONES.push({
  n: 2,
  corto: 'ML clásico y FastAPI',
  titulo: 'Machine Learning Clásico para Desarrolladores (Scikit-Learn & XGBoost)',
  duracion: '5 h',
  resumen: c`Pipelines tabulares reproducibles, ingeniería de características, validación cruzada estratificada y despliegue del modelo como microservicio FastAPI.`,
  stack: ['scikit-learn', 'XGBoost', 'Pandas', 'Optuna', 'joblib', 'FastAPI', 'Pydantic v2'],
  teoria: {
    intro: c`No todo problema necesita un LLM. Para datos tabulares (abandono escolar, fraude, demanda), los modelos de <strong>gradient boosting</strong> siguen siendo el estado del arte: son baratos, rápidos, explicables y desplegables en cualquier servidor. Un ingeniero de IA sabe cuándo <em>no</em> usar un LLM.`,
    bloques: [
      ['1. Formulación del problema', c`<p>Clasificación (¿abandonará?), regresión (¿qué nota sacará?), ranking. Define la <strong>métrica de negocio</strong> antes de entrenar: en abandono escolar importa más el <em>recall</em> (no dejar escapar casos) que la exactitud.</p>`],
      ['2. Pipelines y fuga de datos (data leakage)', c`<p>El error más común: normalizar o imputar con estadísticas de todo el dataset antes de dividir. Un <code>Pipeline</code> + <code>ColumnTransformer</code> garantiza que cada transformación se ajusta solo con el conjunto de entrenamiento de cada pliegue.</p>`],
      ['3. Validación cruzada y métricas', c`<p><code>StratifiedKFold</code> mantiene la proporción de clases. Usa ROC-AUC y PR-AUC para clases desbalanceadas, F1 para umbral fijo, y calibra probabilidades si vas a tomar decisiones con ellas.</p>`],
      ['4. Gradient Boosting (XGBoost)', c`<p>Ensamble secuencial de árboles donde cada árbol corrige los residuos del anterior. Hiperparámetros clave: <code>n_estimators</code>, <code>learning_rate</code>, <code>max_depth</code>, <code>subsample</code>, <code>colsample_bytree</code> y <code>early_stopping_rounds</code>.</p>`],
      ['5. Del notebook a producción', c`<p>Serializa el pipeline completo (preprocesado + modelo) con <code>joblib</code>, versiona el artefacto, valida la entrada con Pydantic y expón un endpoint <code>/predict</code>. Registra la versión del modelo en cada respuesta para trazabilidad.</p>`]
    ],
    flujo: ['CSV', 'train/test split estratificado', 'ColumnTransformer', 'XGBClassifier', 'StratifiedKFold + Optuna', 'joblib', 'FastAPI /predict'],
    tabla: {
      cap: '¿Qué técnica usar?',
      head: ['Problema', 'Técnica recomendada', 'Motivo'],
      rows: [
        ['Datos tabulares estructurados', 'XGBoost / LightGBM', 'Mejor precisión/coste, explicable con SHAP'],
        ['Texto libre corto, pocas clases', 'Embeddings + regresión logística', 'Barato y robusto'],
        ['Texto libre, razonamiento complejo', 'LLM con salidas estructuradas', 'Comprensión semántica'],
        ['Series temporales', 'Gradient boosting con lags / modelos específicos', 'Captura estacionalidad'],
        ['Imágenes', 'Redes convolucionales / ViT preentrenados', 'Extracción jerárquica de rasgos']
      ]
    },
    claves: ['Un baseline simple (regresión logística) es obligatorio antes de cualquier modelo complejo.', 'El pipeline entero es el artefacto desplegable, no solo el modelo.', 'Las métricas de negocio mandan sobre la exactitud.']
  },
  taller: {
    entorno: 'PowerShell 7 · VS Code · Python 3.12 + uv',
    pasos: [
      { t: 'Proyecto y dependencias', lang: 'powershell', file: 'PowerShell', code: c`
uv init mia-s02-abandono
cd mia-s02-abandono
uv add scikit-learn xgboost pandas pyarrow optuna joblib fastapi "uvicorn[standard]" pydantic
uv add --dev pytest httpx
mkdir src, models, data, tests` },
      { t: 'Pipeline de entrenamiento con validación cruzada', lang: 'python', file: 'src/entrenar.py', code: c`
import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.metrics import classification_report, roc_auc_score
from xgboost import XGBClassifier

NUM = ["edad", "nota_acceso", "faltas_trimestre", "horas_trabajo_semana"]
CAT = ["ciclo", "turno", "modalidad"]

df = pd.read_csv("data/alumnado_sintetico.csv")
X, y = df[NUM + CAT], df["abandona"]
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

preprocesado = ColumnTransformer([
    ("num", Pipeline([("imp", SimpleImputer(strategy="median")), ("esc", StandardScaler())]), NUM),
    ("cat", Pipeline([("imp", SimpleImputer(strategy="most_frequent")),
                      ("ohe", OneHotEncoder(handle_unknown="ignore"))]), CAT),
])

modelo = Pipeline([
    ("pre", preprocesado),
    ("xgb", XGBClassifier(n_estimators=400, learning_rate=0.05, max_depth=4, subsample=0.9,
                          colsample_bytree=0.8, eval_metric="aucpr",
                          scale_pos_weight=(y_tr == 0).sum() / (y_tr == 1).sum())),
])

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
auc = cross_val_score(modelo, X_tr, y_tr, cv=cv, scoring="roc_auc")
print(f"ROC-AUC CV: {auc.mean():.3f} ± {auc.std():.3f}")

modelo.fit(X_tr, y_tr)
proba = modelo.predict_proba(X_te)[:, 1]
print("ROC-AUC test:", round(roc_auc_score(y_te, proba), 3))
print(classification_report(y_te, proba > 0.35))       # umbral orientado a recall

joblib.dump({"pipeline": modelo, "version": "abandono-xgb-1.0.0", "umbral": 0.35}, "models/abandono.joblib")` },
      { t: 'Optimización de hiperparámetros con Optuna', lang: 'python', file: 'src/optimizar.py', code: c`
import optuna
from sklearn.model_selection import cross_val_score
from entrenar import modelo, X_tr, y_tr, cv


def objetivo(trial: optuna.Trial) -> float:
    modelo.set_params(
        xgb__max_depth=trial.suggest_int("max_depth", 2, 8),
        xgb__learning_rate=trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
        xgb__n_estimators=trial.suggest_int("n_estimators", 100, 800, step=100),
        xgb__subsample=trial.suggest_float("subsample", 0.6, 1.0),
    )
    return cross_val_score(modelo, X_tr, y_tr, cv=cv, scoring="average_precision").mean()


estudio = optuna.create_study(direction="maximize")
estudio.optimize(objetivo, n_trials=40)
print("Mejores parámetros:", estudio.best_params, "PR-AUC:", round(estudio.best_value, 3))` },
      { t: 'Microservicio FastAPI con validación Pydantic', lang: 'python', file: 'src/api.py', code: c`
from contextlib import asynccontextmanager
from typing import Literal

import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field

artefacto: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    artefacto.update(joblib.load("models/abandono.joblib"))   # carga única al arrancar
    yield
    artefacto.clear()


app = FastAPI(title="Predicción de abandono FP", version="1.0.0", lifespan=lifespan)


class Alumno(BaseModel):
    edad: int = Field(ge=16, le=70)
    nota_acceso: float = Field(ge=0, le=10)
    faltas_trimestre: int = Field(ge=0)
    horas_trabajo_semana: int = Field(ge=0, le=60)
    ciclo: str
    turno: Literal["mañana", "tarde", "noche"]
    modalidad: Literal["presencial", "distancia", "dual"]


class Prediccion(BaseModel):
    probabilidad_abandono: float
    alerta: bool
    version_modelo: str


@app.post("/predict", response_model=Prediccion)
def predecir(alumno: Alumno) -> Prediccion:
    df = pd.DataFrame([alumno.model_dump()])
    p = float(artefacto["pipeline"].predict_proba(df)[0, 1])
    return Prediccion(probabilidad_abandono=round(p, 4), alerta=p >= artefacto["umbral"],
                      version_modelo=artefacto["version"])` },
      { t: 'Arrancar y probar desde PowerShell', lang: 'powershell', file: 'PowerShell', code: c`
uv run uvicorn src.api:app --reload --port 8000

# En otra terminal
$cuerpo = @{ edad=19; nota_acceso=6.2; faltas_trimestre=14; horas_trabajo_semana=25;
            ciclo="DAM"; turno="tarde"; modalidad="presencial" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8000/predict -Method Post -Body $cuerpo -ContentType "application/json"` },
      { t: 'Cliente Java 21 del microservicio', d: 'El backend del centro (Spring/Java) consume el modelo Python como servicio. Usamos <code>HttpClient</code> y <code>record</code>.', lang: 'java', file: 'PrediccionClient.java', code: c`
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.*;

public class PrediccionClient {
    record Alumno(int edad, double nota_acceso, int faltas_trimestre, int horas_trabajo_semana,
                  String ciclo, String turno, String modalidad) {}
    record Prediccion(double probabilidad_abandono, boolean alerta, String version_modelo) {}

    private static final ObjectMapper JSON = new ObjectMapper();

    public static void main(String[] args) throws Exception {
        try (var http = HttpClient.newBuilder().executor(java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor()).build()) {
            var cuerpo = JSON.writeValueAsString(new Alumno(19, 6.2, 14, 25, "DAM", "tarde", "presencial"));
            var req = HttpRequest.newBuilder(URI.create("http://localhost:8000/predict"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(cuerpo)).build();
            var resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            Prediccion p = JSON.readValue(resp.body(), Prediccion.class);
            System.out.printf("Riesgo: %.1f %% (alerta=%s, modelo=%s)%n",
                    p.probabilidad_abandono() * 100, p.alerta(), p.version_modelo());
        }
    }
}` }
    ]
  },
  prompts: [
    { t: 'Revisor de fuga de datos', tipo: 'System Prompt', lang: 'markdown', code: c`
Actúas como revisor de código de ciencia de datos.
Analiza el script que te paso y detecta SOLO problemas de fuga de datos (data leakage):
- transformaciones ajustadas antes del split,
- variables que contienen información del futuro o del objetivo,
- duplicados entre train y test,
- selección de características con todo el dataset.
Formato de salida: tabla Markdown con columnas Línea | Problema | Impacto | Corrección.
Si no hay fugas, dilo explícitamente y no inventes problemas.` },
    { t: 'Explicación de predicciones para tutores', tipo: 'Plantilla', lang: 'markdown', code: c`
Eres un orientador educativo. Recibes la salida SHAP de un modelo de riesgo de abandono:
<shap>{json_con_contribuciones}</shap>
Redacta en 4 frases, para un tutor sin formación técnica, qué factores aumentan el
riesgo de este alumno y qué intervención pedagógica sugieres. No menciones términos
estadísticos. No emitas juicios sobre la persona; habla de factores modificables.` },
    { t: 'Esquema de validación de entrada', tipo: 'JSON Schema', lang: 'json', code: c`
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Alumno",
  "type": "object",
  "additionalProperties": false,
  "required": ["edad", "nota_acceso", "faltas_trimestre", "horas_trabajo_semana", "ciclo", "turno", "modalidad"],
  "properties": {
    "edad": {"type": "integer", "minimum": 16, "maximum": 70},
    "nota_acceso": {"type": "number", "minimum": 0, "maximum": 10},
    "faltas_trimestre": {"type": "integer", "minimum": 0},
    "horas_trabajo_semana": {"type": "integer", "minimum": 0, "maximum": 60},
    "ciclo": {"type": "string"},
    "turno": {"enum": ["mañana", "tarde", "noche"]},
    "modalidad": {"enum": ["presencial", "distancia", "dual"]}
  }
}` }
  ],
  actividad: {
    titulo: 'Servicio de alerta temprana de abandono en FP',
    contexto: c`Con un dataset <strong>sintético</strong> (prohibido usar datos reales de alumnado) construye un modelo de riesgo de abandono y despliégalo como API consumida desde Java 21.`,
    requisitos: [
      'Generador de dataset sintético de 5 000 registros con Faker/NumPy y documentación de su distribución.',
      'Baseline (regresión logística) frente a XGBoost optimizado con Optuna; comparar ROC-AUC y PR-AUC.',
      'API FastAPI con validación Pydantic, endpoint <code>/health</code> y versión del modelo en la respuesta.',
      'Cliente Java 21 con <code>record</code> y Virtual Threads que procese un CSV de 200 alumnos en paralelo.',
      'Análisis de sesgo: comparar tasa de alertas por <code>turno</code> y <code>modalidad</code>.'
    ],
    entregables: ['Repositorio con <code>python/</code> y <code>java/</code>', 'Informe <code>MODEL_CARD.md</code> (métricas, límites, sesgos)', 'Tests de la API con <code>httpx</code> + <code>pytest</code>'],
    rubrica: [['Rigor metodológico (sin fugas, CV correcta)', 30], ['Calidad de la API y del cliente Java', 25], ['Model card y análisis de sesgo', 25], ['Tests y reproducibilidad', 20]]
  },
  faq: [
    ['Mi modelo da 99 % de exactitud. ¿Está bien?', c`Casi seguro hay fuga de datos o clases muy desbalanceadas. Si solo el 3 % abandona, un modelo que siempre dice "no" acierta el 97 %. Mira PR-AUC, recall y la matriz de confusión, y revisa que ninguna variable derive del objetivo.`],
    ['¿Pickle o joblib? ¿Es seguro cargar modelos?', c`joblib es más eficiente con arrays grandes, pero ambos ejecutan código al deserializar: <strong>nunca cargues artefactos de origen no confiable</strong>. Para intercambio seguro entre lenguajes exporta a ONNX (lo veremos en la Sesión 19) o usa formatos nativos como <code>model.save_model("modelo.ubj")</code> de XGBoost.`],
    ['¿Cómo explico al centro por qué el modelo marcó a un alumno?', c`Usa SHAP (<code>shap.TreeExplainer</code>) para obtener la contribución de cada variable a la predicción individual. Recuerda el art. 22 RGPD: la alerta debe apoyar a un tutor humano, nunca decidir automáticamente.`],
    ['¿Cuántos datos necesito?', c`Para boosting tabular, unos cientos de ejemplos por clase minoritaria es un mínimo razonable. Usa curvas de aprendizaje (<code>learning_curve</code>) para comprobar si más datos mejorarían el resultado.`]
  ]
});

SESIONES.push({
  n: 3,
  corto: 'Redes neuronales con PyTorch',
  titulo: 'Introducción a las Redes Neuronales Profundas (PyTorch desde Cero)',
  duracion: '6 h',
  resumen: c`Perceptrón, funciones de activación, backpropagation con autograd, optimizador AdamW y un bucle de entrenamiento profesional con validación, early stopping y checkpoints.`,
  stack: ['PyTorch 2', 'torch.nn', 'autograd', 'AdamW', 'torchvision', 'TensorBoard'],
  teoria: {
    intro: c`Una red neuronal es una composición de funciones diferenciables. El entrenamiento consiste en ajustar millones de parámetros para minimizar una función de pérdida, usando el gradiente calculado automáticamente por <strong>retropropagación</strong>. Todo LLM es, en esencia, esto mismo a enorme escala.`,
    bloques: [
      ['1. Del perceptrón a la capa densa', c`<p>Una neurona calcula <code>y = σ(w·x + b)</code>. Una capa densa (<code>nn.Linear</code>) hace lo mismo para muchas neuronas a la vez con un producto matricial: <code>Y = σ(X Wᵀ + b)</code>.</p>`],
      ['2. Funciones de activación', c`<p>Sin no linealidades, apilar capas equivale a una sola capa lineal. ReLU es simple y eficiente; <strong>GELU</strong> y <strong>SwiGLU</strong> son las que usan los Transformers modernos; softmax convierte logits en probabilidades.</p>`],
      ['3. Función de pérdida', c`<p>Clasificación: <code>CrossEntropyLoss</code> (recibe logits, no probabilidades). Regresión: <code>MSELoss</code> o <code>HuberLoss</code>. Los LLMs se entrenan con entropía cruzada sobre el siguiente token.</p>`],
      ['4. Backpropagation y autograd', c`<p>PyTorch construye un grafo dinámico de operaciones. <code>loss.backward()</code> aplica la regla de la cadena desde la pérdida hasta cada parámetro y deja el gradiente en <code>param.grad</code>. Hay que llamar a <code>optimizer.zero_grad()</code> en cada iteración porque los gradientes se acumulan.</p>`],
      ['5. Optimizadores: de SGD a AdamW', c`<p>Adam adapta la tasa de aprendizaje de cada parámetro con medias móviles del gradiente y de su cuadrado. <strong>AdamW</strong> desacopla la regularización (weight decay) y es el optimizador por defecto para Transformers. Combínalo con un <em>scheduler</em> de warmup + decaimiento coseno.</p>`],
      ['6. Generalización', c`<p>Separa train/validación, vigila el sobreajuste (la pérdida de validación sube), aplica dropout, weight decay, aumento de datos y early stopping. Guarda el mejor checkpoint, no el último.</p>`]
    ],
    formula: c`Actualización AdamW (por parámetro θ):<br>m ← β₁m + (1−β₁)g &nbsp;&nbsp; v ← β₂v + (1−β₂)g²<br>θ ← θ − η · ( m̂ / (√v̂ + ε) + λ·θ )`,
    flujo: ['Lote X', 'forward()', 'logits', 'CrossEntropyLoss', 'loss.backward()', 'optimizer.step()', 'zero_grad()'],
    tabla: {
      cap: 'Componentes de PyTorch y su análogo en un backend Java',
      head: ['PyTorch', 'Función', 'Analogía DAM'],
      rows: [
        ['<code>nn.Module</code>', 'Componente con parámetros y <code>forward()</code>', 'Clase de servicio con estado'],
        ['<code>Dataset</code> / <code>DataLoader</code>', 'Acceso y lotes de datos', 'Repositorio + paginación'],
        ['<code>optimizer</code>', 'Actualiza parámetros', 'Estrategia de actualización'],
        ['<code>state_dict</code>', 'Pesos serializables', 'Snapshot/persistencia del estado'],
        ['<code>model.eval()</code> / <code>train()</code>', 'Modo de ejecución (dropout, batchnorm)', 'Perfiles de configuración']
      ]
    },
    claves: ['El bucle forward → loss → backward → step → zero_grad es universal.', 'Pasa a <code>model.eval()</code> y <code>torch.inference_mode()</code> para evaluar.', 'Fija semillas y registra hiperparámetros: reproducibilidad es calidad.']
  },
  taller: {
    entorno: 'PowerShell 7 · VS Code · PyTorch (CPU, CUDA o MPS) · TensorBoard',
    pasos: [
      { t: 'Instalar dependencias', lang: 'powershell', file: 'PowerShell', code: c`
uv init mia-s03-redes
cd mia-s03-redes
uv add torch torchvision tensorboard --index https://download.pytorch.org/whl/cu124
uv add numpy matplotlib` },
      { t: 'Autograd a mano: entender el gradiente', d: 'Antes de usar capas, comprobamos que PyTorch calcula la derivada que esperamos.', lang: 'python', file: 'src/autograd_demo.py', code: c`
import torch

x = torch.tensor(3.0)
w = torch.tensor(2.0, requires_grad=True)
b = torch.tensor(1.0, requires_grad=True)

y = torch.sigmoid(w * x + b)          # neurona
loss = (y - 1.0) ** 2                  # queremos que salga 1
loss.backward()

# d(loss)/dw = 2(y-1) * y(1-y) * x
manual = 2 * (y - 1) * y * (1 - y) * x
print(f"autograd={w.grad.item():.6f}  manual={manual.item():.6f}")` },
      { t: 'Definir un MLP para clasificar dígitos (MNIST)', lang: 'python', file: 'src/modelo.py', code: c`
import torch
from torch import nn


class ClasificadorMLP(nn.Module):
    def __init__(self, entrada: int = 28 * 28, oculta: int = 256, clases: int = 10, p_dropout: float = 0.2):
        super().__init__()
        self.red = nn.Sequential(
            nn.Flatten(),                       # (B, 1, 28, 28) -> (B, 784)
            nn.Linear(entrada, oculta), nn.GELU(), nn.Dropout(p_dropout),
            nn.Linear(oculta, oculta), nn.GELU(), nn.Dropout(p_dropout),
            nn.Linear(oculta, clases),          # logits (B, 10)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.red(x)` },
      { t: 'Bucle de entrenamiento profesional', d: 'Incluye AdamW, scheduler coseno con warmup, validación, early stopping, checkpoint y TensorBoard.', lang: 'python', file: 'src/entrenar.py', code: c`
import math
import torch
from torch import nn
from torch.utils.data import DataLoader, random_split
from torch.utils.tensorboard import SummaryWriter
from torchvision import datasets, transforms
from modelo import ClasificadorMLP

torch.manual_seed(42)
device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"

tf = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.1307,), (0.3081,))])
completo = datasets.MNIST("data", train=True, download=True, transform=tf)
train_ds, val_ds = random_split(completo, [54_000, 6_000])
train_dl = DataLoader(train_ds, batch_size=128, shuffle=True, num_workers=2)
val_dl = DataLoader(val_ds, batch_size=512)

modelo = ClasificadorMLP().to(device)
criterio = nn.CrossEntropyLoss(label_smoothing=0.05)
opt = torch.optim.AdamW(modelo.parameters(), lr=3e-3, weight_decay=0.01)
EPOCAS, WARMUP = 15, 200
total_pasos = EPOCAS * len(train_dl)
sched = torch.optim.lr_scheduler.LambdaLR(opt, lambda p: min(1.0, (p + 1) / WARMUP)
                                          * 0.5 * (1 + math.cos(math.pi * p / total_pasos)))
log = SummaryWriter("runs/mlp")
mejor, paciencia = float("inf"), 0

for epoca in range(EPOCAS):
    modelo.train()
    for xb, yb in train_dl:
        xb, yb = xb.to(device), yb.to(device)
        loss = criterio(modelo(xb), yb)
        opt.zero_grad(set_to_none=True)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(modelo.parameters(), 1.0)
        opt.step(); sched.step()

    modelo.eval(); val_loss, aciertos = 0.0, 0
    with torch.inference_mode():
        for xb, yb in val_dl:
            xb, yb = xb.to(device), yb.to(device)
            logits = modelo(xb)
            val_loss += criterio(logits, yb).item() * len(xb)
            aciertos += (logits.argmax(1) == yb).sum().item()
    val_loss /= len(val_ds); acc = aciertos / len(val_ds)
    log.add_scalars("loss", {"val": val_loss, "train": loss.item()}, epoca)
    print(f"época {epoca:02d} | val_loss {val_loss:.4f} | acc {acc:.4f}")

    if val_loss < mejor:
        mejor, paciencia = val_loss, 0
        torch.save(modelo.state_dict(), "mejor_modelo.pt")
    else:
        paciencia += 1
        if paciencia >= 3:
            print("Early stopping"); break` },
      { t: 'Visualizar el entrenamiento', lang: 'powershell', file: 'PowerShell', code: c`
uv run python src/entrenar.py
uv run tensorboard --logdir runs
# Abre http://localhost:6006` }
    ]
  },
  prompts: [
    { t: 'Diagnóstico de curvas de entrenamiento', tipo: 'System Prompt', lang: 'markdown', code: c`
Eres un ingeniero de deep learning. Te paso las pérdidas de entrenamiento y validación
por época (CSV) y los hiperparámetros. Diagnostica UNA de estas situaciones:
underfitting, overfitting, learning rate excesivo, learning rate insuficiente,
gradientes explosivos, problema de datos. Justifica con valores concretos del CSV y
propón como máximo 3 cambios ordenados por impacto esperado. No propongas cambiar
de arquitectura salvo que lo demás esté descartado.` },
    { t: 'Generador de tests para módulos PyTorch', tipo: 'Plantilla', lang: 'markdown', code: c`
Genera tests pytest para este nn.Module:
<modulo>{código}</modulo>
Cubre: (1) shape de salida para lotes de tamaño 1 y 64, (2) que los gradientes llegan a
todos los parámetros tras un backward, (3) determinismo en modo eval con semilla fija,
(4) que el modelo puede sobreajustar un lote diminuto (8 ejemplos) en 200 pasos.` }
  ],
  actividad: {
    titulo: 'Clasificador de incidencias de soporte con PyTorch puro',
    contexto: c`El departamento de informática del centro clasifica incidencias en 5 categorías. Entrena una red con PyTorch a partir de vectores TF-IDF y compárala con la Sesión 2.`,
    requisitos: [
      'Dataset sintético de 3 000 incidencias (texto + categoría) generado y documentado.',
      'Vectorización TF-IDF (scikit-learn) → tensor denso → MLP en PyTorch.',
      'Bucle de entrenamiento con AdamW, scheduler, early stopping y checkpoints.',
      'Test de "sobreajuste de un lote" que valide la implementación.',
      'Matriz de confusión y comparación con regresión logística.'
    ],
    entregables: ['<code>src/</code>, <code>tests/</code> y logs de TensorBoard', '<code>RESULTADOS.md</code> con curvas y análisis'],
    rubrica: [['Bucle de entrenamiento correcto', 35], ['Experimentación y comparación', 25], ['Tests', 20], ['Documentación', 20]]
  },
  faq: [
    ['La pérdida es <code>nan</code> desde la primera época.', c`Learning rate demasiado alto, datos sin normalizar o <code>log(0)</code>. Baja el LR un orden de magnitud, usa <code>clip_grad_norm_</code> y comprueba que pasas logits (no softmax) a <code>CrossEntropyLoss</code>. Activa <code>torch.autograd.set_detect_anomaly(True)</code> para localizar el origen.`],
    ['¿Por qué mi modelo va más lento en GPU que en CPU?', c`Con modelos y lotes pequeños domina el coste de transferencia host↔device y de lanzar kernels. Aumenta el <code>batch_size</code>, usa <code>pin_memory=True</code> en el DataLoader y evita <code>.item()</code> dentro del bucle (fuerza sincronización).`],
    ['¿Qué es <code>torch.compile</code>?', c`Compila el grafo del modelo (TorchDynamo + Inductor) generando kernels fusionados. Suele acelerar entre 1,3× y 2× el entrenamiento en GPU. Úsalo cuando el código ya funcione: <code>modelo = torch.compile(modelo)</code>.`],
    ['¿Necesito saber cálculo para seguir el Máster?', c`Necesitas la intuición (derivada = sensibilidad, regla de la cadena = propagación), no resolver integrales. Autograd hace el cálculo; tú debes saber interpretar gradientes y curvas.`]
  ]
});

SESIONES.push({
  n: 4,
  corto: 'Anatomía de un LLM',
  titulo: 'Anatomía de los Modelos de Lenguaje (De las Redes Recurrentes a la Arquitectura Transformer)',
  duracion: '6 h',
  resumen: c`Tokenización BPE, embeddings, self-attention multi-cabeza, máscara causal y el bloque Transformer decoder implementado desde cero, hasta generar texto con un mini-GPT.`,
  stack: ['PyTorch', 'tiktoken', 'Hugging Face Transformers', 'tokenizers', 'Llama / Qwen (pesos abiertos)'],
  teoria: {
    intro: c`Las RNN y LSTM procesaban el texto token a token, con memoria limitada y sin paralelismo. El Transformer (Vaswani et al., 2017) sustituyó la recurrencia por <strong>atención</strong>: cada token mira directamente a todos los anteriores. Entender este bloque te permitirá razonar sobre contexto, coste, caché KV y alucinaciones.`,
    bloques: [
      ['1. Tokenización BPE', c`<p>Byte Pair Encoding parte de bytes y fusiona iterativamente los pares más frecuentes. Un token ≈ 0,75 palabras en inglés y algo menos en español. El coste, el límite de contexto y la latencia se miden en tokens, no en caracteres.</p>`],
      ['2. Embeddings y posición', c`<p>Cada id de token se convierte en un vector aprendido (<code>nn.Embedding</code>). Como la atención no conoce el orden, se añade información posicional: los modelos actuales usan <strong>RoPE</strong> (rotary position embeddings), que rota los vectores Q y K según la posición.</p>`],
      ['3. Self-attention', c`<p>Cada token produce una consulta (Q), una clave (K) y un valor (V). La similitud Q·Kᵀ, escalada y normalizada con softmax, decide cuánto "atiende" a cada token anterior. La <strong>máscara causal</strong> impide ver el futuro.</p>`],
      ['4. Multi-head, MLP y residuales', c`<p>Varias cabezas atienden a patrones distintos en paralelo. Tras la atención viene un MLP (con SwiGLU en Llama/Qwen). Las conexiones residuales y la normalización (RMSNorm, pre-norm) permiten apilar decenas de bloques.</p>`],
      ['5. Generación autoregresiva y caché KV', c`<p>El modelo predice la distribución del siguiente token; se muestrea (temperatura, top-p) y se repite. Para no recalcular el pasado se guardan K y V de tokens anteriores: la <strong>caché KV</strong>, que crece con el contexto y domina la VRAM en contextos largos. GQA (grouped-query attention) la reduce compartiendo K/V entre cabezas.</p>`],
      ['6. Del preentrenamiento al asistente', c`<p>Preentrenamiento (predecir el siguiente token en billones de tokens) → ajuste por instrucciones (SFT) → alineamiento con preferencias (RLHF/DPO). Los modelos de razonamiento añaden entrenamiento con refuerzo sobre cadenas de pensamiento.</p>`]
    ],
    formula: c`Attention(Q, K, V) = softmax( Q·Kᵀ / √d_k + M_causal ) · V`,
    flujo: ['Texto', 'Tokenizer BPE', 'ids', 'Embedding + RoPE', 'N × [RMSNorm → Attention → RMSNorm → MLP]', 'Logits', 'Muestreo', 'Siguiente token'],
    tabla: {
      cap: 'Comparativa de familias de modelos (orientativa, verifica siempre la ficha oficial)',
      head: ['Familia', 'Proveedor', 'Acceso', 'Fortalezas para un desarrollador'],
      rows: [
        ['Claude (Opus, Sonnet, Haiku)', 'Anthropic', 'API, AWS, Google Cloud, Azure', 'Código, agentes, uso de herramientas, contextos muy largos'],
        ['Gemini', 'Google (AI Studio / Vertex AI)', 'API', 'Multimodalidad nativa (vídeo, audio), integración Google Cloud'],
        ['Kimi', 'Moonshot AI', 'API y pesos abiertos', 'Contexto largo y agentes'],
        ['Llama', 'Meta', 'Pesos abiertos (licencia comunitaria)', 'Ecosistema enorme, ejecución local'],
        ['DeepSeek', 'DeepSeek', 'API y pesos abiertos (MIT)', 'Razonamiento y MoE eficiente'],
        ['Qwen', 'Alibaba', 'Pesos abiertos (Apache 2.0 en muchas variantes)', 'Multilingüe, tamaños de 0,5B a >200B']
      ]
    },
    claves: ['Coste, latencia y límites se miden en tokens.', 'La caché KV crece linealmente con el contexto: contexto largo = más VRAM.', 'Un LLM predice tokens probables, no verifica hechos: de ahí las alucinaciones y la necesidad de RAG.']
  },
  taller: {
    entorno: 'PowerShell 7 · VS Code · PyTorch · Hugging Face',
    pasos: [
      { t: 'Explorar la tokenización', lang: 'python', file: 'src/tokens.py', code: c`
import tiktoken
from transformers import AutoTokenizer

texto = "El alumnado de DAM desarrolla aplicaciones multiplataforma con Kotlin."
enc = tiktoken.get_encoding("o200k_base")
ids = enc.encode(texto)
print(len(ids), "tokens:", [enc.decode([i]) for i in ids])

tok = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-0.5B-Instruct")
print(len(tok(texto)["input_ids"]), "tokens con el tokenizer de Qwen")
print(tok.apply_chat_template([{"role": "user", "content": "Hola"}], tokenize=False, add_generation_prompt=True))` },
      { t: 'Self-attention causal multi-cabeza desde cero', lang: 'python', file: 'src/atencion.py', code: c`
import math
import torch
from torch import nn
import torch.nn.functional as F


class AtencionCausal(nn.Module):
    def __init__(self, d_model: int, n_heads: int, max_len: int = 512, p_drop: float = 0.1):
        super().__init__()
        assert d_model % n_heads == 0
        self.h, self.dk = n_heads, d_model // n_heads
        self.qkv = nn.Linear(d_model, 3 * d_model, bias=False)
        self.proj = nn.Linear(d_model, d_model, bias=False)
        self.drop = nn.Dropout(p_drop)
        self.register_buffer("mask", torch.tril(torch.ones(max_len, max_len)).bool())

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B, T, C = x.shape                                           # (B, T, C)
        q, k, v = self.qkv(x).split(C, dim=2)
        q, k, v = (t.view(B, T, self.h, self.dk).transpose(1, 2) for t in (q, k, v))  # (B, h, T, dk)
        att = (q @ k.transpose(-2, -1)) / math.sqrt(self.dk)       # (B, h, T, T)
        att = att.masked_fill(~self.mask[:T, :T], float("-inf"))
        att = self.drop(F.softmax(att, dim=-1))
        y = (att @ v).transpose(1, 2).contiguous().view(B, T, C)
        return self.proj(y)
        # En producción: F.scaled_dot_product_attention(q, k, v, is_causal=True) (FlashAttention)` },
      { t: 'Bloque Transformer y mini-GPT', lang: 'python', file: 'src/minigpt.py', code: c`
import torch
from torch import nn
from atencion import AtencionCausal


class Bloque(nn.Module):
    def __init__(self, d: int, h: int):
        super().__init__()
        self.n1, self.n2 = nn.RMSNorm(d), nn.RMSNorm(d)
        self.att = AtencionCausal(d, h)
        self.mlp = nn.Sequential(nn.Linear(d, 4 * d), nn.GELU(), nn.Linear(4 * d, d))

    def forward(self, x):
        x = x + self.att(self.n1(x))      # pre-norm + residual
        return x + self.mlp(self.n2(x))


class MiniGPT(nn.Module):
    def __init__(self, vocab: int, d: int = 256, h: int = 8, capas: int = 6, max_len: int = 256):
        super().__init__()
        self.tok = nn.Embedding(vocab, d)
        self.pos = nn.Embedding(max_len, d)
        self.bloques = nn.Sequential(*[Bloque(d, h) for _ in range(capas)])
        self.norm = nn.RMSNorm(d)
        self.cabeza = nn.Linear(d, vocab, bias=False)
        self.cabeza.weight = self.tok.weight          # weight tying
        self.max_len = max_len

    def forward(self, ids):
        pos = torch.arange(ids.shape[1], device=ids.device)
        x = self.tok(ids) + self.pos(pos)
        return self.cabeza(self.norm(self.bloques(x)))    # (B, T, vocab)

    @torch.inference_mode()
    def generar(self, ids, nuevos: int, temperatura: float = 0.8, top_k: int = 40):
        for _ in range(nuevos):
            logits = self(ids[:, -self.max_len:])[:, -1, :] / temperatura
            v, _ = torch.topk(logits, top_k)
            logits[logits < v[:, [-1]]] = float("-inf")
            sig = torch.multinomial(torch.softmax(logits, dim=-1), 1)
            ids = torch.cat([ids, sig], dim=1)
        return ids` },
      { t: 'Entrenar el mini-GPT a nivel de carácter', d: 'Con un corpus de dominio público (p. ej. textos del Quijote) el modelo aprende ortografía y estilo en minutos en una GPU modesta.', lang: 'python', file: 'src/entrenar_gpt.py', code: c`
import torch
from minigpt import MiniGPT

texto = open("data/corpus.txt", encoding="utf-8").read()
vocab = sorted(set(texto)); stoi = {ch: i for i, ch in enumerate(vocab)}
datos = torch.tensor([stoi[ch] for ch in texto], dtype=torch.long)
device = "cuda" if torch.cuda.is_available() else "cpu"
modelo = MiniGPT(len(vocab)).to(device)
opt = torch.optim.AdamW(modelo.parameters(), lr=3e-4, weight_decay=0.1)


def lote(T=128, B=32):
    i = torch.randint(len(datos) - T - 1, (B,))
    x = torch.stack([datos[j:j + T] for j in i]); y = torch.stack([datos[j + 1:j + T + 1] for j in i])
    return x.to(device), y.to(device)


for paso in range(3000):
    x, y = lote()
    logits = modelo(x)
    loss = torch.nn.functional.cross_entropy(logits.view(-1, logits.size(-1)), y.view(-1))
    opt.zero_grad(); loss.backward(); opt.step()
    if paso % 500 == 0:
        print(paso, round(loss.item(), 3))

semilla = torch.tensor([[stoi["E"]]], device=device)
print("".join(vocab[i] for i in modelo.generar(semilla, 300)[0].tolist()))` },
      { t: 'Inspeccionar un LLM real con Hugging Face', lang: 'python', file: 'src/inspeccionar.py', code: c`
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

nombre = "Qwen/Qwen2.5-0.5B-Instruct"
tok = AutoTokenizer.from_pretrained(nombre)
modelo = AutoModelForCausalLM.from_pretrained(nombre, torch_dtype=torch.bfloat16)
print(modelo.config)                      # capas, cabezas, kv_heads (GQA), rope_theta…
print(f"Parámetros: {sum(p.numel() for p in modelo.parameters())/1e6:.0f} M")

ids = tok("La capital de Galicia es", return_tensors="pt")
with torch.inference_mode():
    logits = modelo(**ids).logits[0, -1]
top = torch.topk(torch.softmax(logits.float(), -1), 5)
for p, i in zip(top.values, top.indices):
    print(f"{tok.decode(i)!r}: {p:.3f}")` }
    ]
  },
  prompts: [
    { t: 'Explicador de arquitectura de modelos', tipo: 'System Prompt', lang: 'markdown', code: c`
Eres profesor de arquitectura de LLMs. Cuando te pase el config.json de un modelo
de Hugging Face:
1. Resume: nº de capas, d_model, cabezas de atención, cabezas KV (GQA), tamaño de
   vocabulario, contexto máximo, tipo de posición (RoPE/ALiBi) y si es MoE.
2. Estima parámetros totales y VRAM en bf16 e int4.
3. Calcula el tamaño de la caché KV para 8k y 128k tokens con lote 1.
Muestra los cálculos. Si un dato no está en el config, dilo; no lo inventes.` },
    { t: 'Auditoría de coste en tokens', tipo: 'Plantilla', lang: 'markdown', code: c`
Analiza este prompt de producción y su tráfico estimado:
<prompt>{prompt}</prompt>
<trafico>{peticiones_dia} peticiones/día, salida media {tokens_salida} tokens</trafico>
Devuelve: tokens aproximados de entrada, partes estáticas cacheables, partes
redundantes que pueden eliminarse sin perder calidad y coste mensual estimado con
los precios que te indico: {precios}.` }
  ],
  actividad: {
    titulo: 'Mini-GPT de dominio: generador de enunciados de ejercicios de programación',
    contexto: c`Entrena un Transformer decoder pequeño (≤ 15 M parámetros) sobre un corpus propio de enunciados de ejercicios de DAM (redactados por ti o generados y revisados) y analiza su comportamiento.`,
    requisitos: [
      'Implementación propia de la atención causal y del bloque Transformer (sin <code>nn.Transformer</code>).',
      'Tokenizador BPE entrenado con la librería <code>tokenizers</code> (vocabulario 4 000).',
      'Curvas de pérdida, perplejidad en validación y muestras con temperaturas 0,2 / 0,8 / 1,2.',
      'Comparativa del tokenizador propio frente a <code>o200k_base</code> en número de tokens.'
    ],
    entregables: ['Código y pesos del mejor checkpoint (o enlace si > 100 MB)', '<code>ANALISIS.md</code> con muestras y conclusiones'],
    rubrica: [['Implementación correcta de la arquitectura', 40], ['Entrenamiento y métricas', 25], ['Análisis de tokenización y muestreo', 20], ['Documentación', 15]]
  },
  faq: [
    ['¿Por qué el modelo "inventa" datos con total seguridad?', c`Porque genera la continuación más probable según sus datos de entrenamiento, sin un mecanismo de verificación. La confianza del texto no está calibrada con la veracidad. La solución de ingeniería es aportar contexto verificable (RAG, Módulo 2) y evaluar la fidelidad (Sesión 21).`],
    ['¿Qué significa que un modelo tenga 1M de tokens de contexto?', c`Que puede procesar esa longitud de entrada, pero el coste y la latencia crecen con ella y la caché KV consume mucha memoria. Además, la precisión de recuperación de datos en mitad de contextos enormes puede degradarse: un buen RAG suele ser más barato y preciso.`],
    ['¿Qué es un modelo MoE (Mixture of Experts)?', c`Un modelo donde cada token activa solo algunos "expertos" (MLPs) de entre muchos. Tiene muchos parámetros totales pero pocos activos por token, lo que abarata la inferencia. DeepSeek, Qwen-MoE o Mixtral siguen este diseño. Ojo: para ejecutarlo localmente necesitas memoria para <em>todos</em> los parámetros.`],
    ['¿Temperatura 0 hace al modelo determinista?', c`Reduce la variabilidad (elige el token más probable), pero en APIs y GPUs puede haber pequeñas diferencias por paralelismo numérico y por el procesamiento por lotes del proveedor. Algunos modelos recientes ya no permiten ajustar la temperatura: el control se hace con el prompt, el esfuerzo de razonamiento y las salidas estructuradas.`]
  ]
});
