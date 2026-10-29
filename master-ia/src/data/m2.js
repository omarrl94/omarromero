// M2 · Aprendizaje automático y deep learning (40 h · semanas 3–4)

SESIONES.push({
  n: 3,
  semana: '3',
  fechas: '15 – 19 oct 2029',
  corto: 'Aprendizaje automático con scikit-learn',
  titulo: 'Aprendizaje Automático con scikit-learn: Regresión, Clasificación, Clustering y Validación',
  duracion: 'Semana 3 · 20 h',
  resumen: c`Aprendizaje supervisado y no supervisado con scikit-learn: preparación de datos, pipelines sin fuga de datos, validación cruzada, métricas, sobreajuste, gradient boosting y clustering. Despliegue del modelo como API ligera con FastAPI consumida desde Java.`,
  stack: ['scikit-learn', 'XGBoost', 'pandas', 'Optuna', 'FastAPI', 'Pydantic v2', 'Java 21 HttpClient'],
  teoria: {
    intro: c`No todo problema necesita un LLM. Para datos tabulares (abandono escolar, fraude, demanda), los modelos de <strong>gradient boosting</strong> siguen siendo el estado del arte: son baratos, rápidos, explicables y desplegables en cualquier servidor. Un ingeniero de IA sabe cuándo <em>no</em> usar un LLM.`,
    bloques: [
      [
        '1. Formulación del problema',
        c`<p>Clasificación (¿abandonará?), regresión (¿qué nota sacará?), ranking. Define la <strong>métrica de negocio</strong> antes de entrenar: en abandono escolar importa más el <em>recall</em> (no dejar escapar casos) que la exactitud.</p>`
      ],
      [
        '2. Supervisado y no supervisado',
        c`<p><strong>Regresión</strong> (predecir un número: horas que tardará una incidencia), <strong>clasificación</strong> (predecir una categoría: tipo de incidencia) y <strong>clustering</strong> (agrupar sin etiquetas: segmentos de usuarios de una app según su uso). En clustering no hay "respuesta correcta": se valida con métricas internas (silueta) y, sobre todo, con la interpretación de negocio.</p>`
      ],
      [
        '3. Pipelines y fuga de datos (data leakage)',
        c`<p>El error más común: normalizar o imputar con estadísticas de todo el dataset antes de dividir. Un <code>Pipeline</code> + <code>ColumnTransformer</code> garantiza que cada transformación se ajusta solo con el conjunto de entrenamiento de cada pliegue.</p>`
      ],
      [
        '4. Validación cruzada y métricas',
        c`<p><code>StratifiedKFold</code> mantiene la proporción de clases. Usa ROC-AUC y PR-AUC para clases desbalanceadas, F1 para umbral fijo, y calibra probabilidades si vas a tomar decisiones con ellas.</p>`
      ],
      [
        '5. Sobreajuste',
        c`<p>Un modelo sobreajustado memoriza el entrenamiento y falla con datos nuevos: gran diferencia entre la métrica de entrenamiento y la de validación. Se combate con más datos, modelos más simples, regularización y validación cruzada honesta.</p>`
      ],
      [
        '6. Gradient Boosting (XGBoost)',
        c`<p>Ensamble secuencial de árboles donde cada árbol corrige los residuos del anterior. Hiperparámetros clave: <code>n_estimators</code>, <code>learning_rate</code>, <code>max_depth</code>, <code>subsample</code>, <code>colsample_bytree</code> y <code>early_stopping_rounds</code>.</p>`
      ],
      [
        '7. Del notebook a producción',
        c`<p>Serializa el pipeline completo (preprocesado + modelo) con <code>joblib</code>, versiona el artefacto, valida la entrada con Pydantic y expón un endpoint <code>/predict</code>. Registra la versión del modelo en cada respuesta para trazabilidad.</p>`
      ]
    ],
    flujo: [
      'CSV',
      'train/test split estratificado',
      'ColumnTransformer',
      'XGBClassifier',
      'StratifiedKFold + Optuna',
      'joblib',
      'FastAPI /predict'
    ],
    tabla: {
      cap: '¿Qué técnica usar?',
      head: ['Problema', 'Técnica recomendada', 'Motivo'],
      rows: [
        [
          'Datos tabulares estructurados',
          'XGBoost / LightGBM',
          'Mejor precisión/coste, explicable con SHAP'
        ],
        ['Texto libre corto, pocas clases', 'Embeddings + regresión logística', 'Barato y robusto'],
        ['Texto libre, razonamiento complejo', 'LLM con salidas estructuradas', 'Comprensión semántica'],
        ['Series temporales', 'Gradient boosting con lags / modelos específicos', 'Captura estacionalidad'],
        ['Imágenes', 'Redes convolucionales / ViT preentrenados', 'Extracción jerárquica de rasgos']
      ]
    },
    claves: [
      'Un baseline simple (regresión logística) es obligatorio antes de cualquier modelo complejo.',
      'El pipeline entero es el artefacto desplegable, no solo el modelo.',
      'Las métricas de negocio mandan sobre la exactitud.'
    ]
  },
  taller: {
    entorno: 'PowerShell 7 · VS Code · Python 3.12 + uv',
    pasos: [
      {
        t: 'Proyecto y dependencias',
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
uv init mia-s02-abandono
cd mia-s02-abandono
uv add scikit-learn xgboost pandas pyarrow optuna joblib fastapi "uvicorn[standard]" pydantic
uv add --dev pytest httpx
mkdir src, models, data, tests`
      },
      {
        t: 'Pipeline de entrenamiento con validación cruzada',
        lang: 'python',
        file: 'src/entrenar.py',
        code: c`
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

joblib.dump({"pipeline": modelo, "version": "abandono-xgb-1.0.0", "umbral": 0.35}, "models/abandono.joblib")`
      },
      {
        t: 'Optimización de hiperparámetros con Optuna',
        lang: 'python',
        file: 'src/optimizar.py',
        code: c`
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
print("Mejores parámetros:", estudio.best_params, "PR-AUC:", round(estudio.best_value, 3))`
      },
      {
        t: 'Clustering: segmentar usuarios de una app',
        d: 'Con datos de uso sintéticos de una app móvil buscamos perfiles de usuario y los describimos.',
        lang: 'python',
        file: 'src/segmentar.py',
        code: c`
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

rng = np.random.default_rng(7)
uso = pd.DataFrame({
    "sesiones_semana": np.concatenate([rng.normal(2, 1, 300), rng.normal(10, 2, 300), rng.normal(25, 4, 150)]),
    "minutos_sesion": np.concatenate([rng.normal(3, 1, 300), rng.normal(12, 3, 300), rng.normal(6, 2, 150)]),
    "compras_mes": np.concatenate([rng.poisson(0.2, 300), rng.poisson(1, 300), rng.poisson(4, 150)]),
}).clip(lower=0)

X = StandardScaler().fit_transform(uso)
for k in range(2, 7):                                   # elegir k con la silueta
    etiquetas = KMeans(n_clusters=k, n_init=10, random_state=7).fit_predict(X)
    print(k, round(silhouette_score(X, etiquetas), 3))

uso["segmento"] = KMeans(n_clusters=3, n_init=10, random_state=7).fit_predict(X)
print(uso.groupby("segmento").mean().round(1))          # ponle nombre de negocio a cada grupo`
      },
      {
        t: 'Microservicio FastAPI con validación Pydantic',
        lang: 'python',
        file: 'src/api.py',
        code: c`
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
                      version_modelo=artefacto["version"])`
      },
      {
        t: 'Arrancar y probar desde PowerShell',
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
uv run uvicorn src.api:app --reload --port 8000

# En otra terminal
$cuerpo = @{ edad=19; nota_acceso=6.2; faltas_trimestre=14; horas_trabajo_semana=25;
            ciclo="DAM"; turno="tarde"; modalidad="presencial" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8000/predict -Method Post -Body $cuerpo -ContentType "application/json"`
      },
      {
        t: 'Cliente Java 21 del microservicio',
        d: c`El backend del centro (Spring/Java) consume el modelo Python como servicio. Usamos <code>HttpClient</code> y <code>record</code>.`,
        lang: 'java',
        file: 'PrediccionClient.java',
        code: c`
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
}`
      }
    ]
  },
  prompts: [
    {
      t: 'Revisor de fuga de datos',
      tipo: 'System Prompt',
      lang: 'markdown',
      code: c`
Actúas como revisor de código de ciencia de datos.
Analiza el script que te paso y detecta SOLO problemas de fuga de datos (data leakage):
- transformaciones ajustadas antes del split,
- variables que contienen información del futuro o del objetivo,
- duplicados entre train y test,
- selección de características con todo el dataset.
Formato de salida: tabla Markdown con columnas Línea | Problema | Impacto | Corrección.
Si no hay fugas, dilo explícitamente y no inventes problemas.`
    },
    {
      t: 'Explicación de predicciones para tutores',
      tipo: 'Plantilla',
      lang: 'markdown',
      code: c`
Eres un orientador educativo. Recibes la salida SHAP de un modelo de riesgo de abandono:
<shap>{json_con_contribuciones}</shap>
Redacta en 4 frases, para un tutor sin formación técnica, qué factores aumentan el
riesgo de este alumno y qué intervención pedagógica sugieres. No menciones términos
estadísticos. No emitas juicios sobre la persona; habla de factores modificables.`
    },
    {
      t: 'Esquema de validación de entrada',
      tipo: 'JSON Schema',
      lang: 'json',
      code: c`
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
}`
    },
    {
      t: 'Interpretar segmentos de clustering',
      tipo: 'Plantilla',
      lang: 'markdown',
      code: c`
Estos son los centroides (medias por variable) de los segmentos de usuarios de una app:
<centroides>{tabla}</centroides>
Para cada segmento propón: un nombre de negocio, una descripción de 1 frase y una acción
de producto. Advierte si algún segmento es demasiado pequeño o poco distinto para actuar.`
    }
  ],
  actividad: {
    tipo: 'semanal',
    titulo: 'Entrega semanal: predicción y segmentación sobre datos de una app',
    contexto: c`Con un dataset <strong>sintético</strong> de uso de una app (prohibido usar datos reales de personas), entrena un modelo supervisado y un clustering y publica el modelo supervisado como API.`,
    requisitos: [
      'Baseline (regresión logística o lineal) frente a XGBoost con validación cruzada.',
      'Clustering con elección de k justificada (silueta) y segmentos interpretados.',
      'API FastAPI con validación Pydantic y un cliente Java 21.',
      'README con métricas y conclusiones.'
    ],
    entregables: [c`Repositorio con <code>src/</code>, <code>tests/</code> y cliente Java`, 'README con resultados'],
    rubrica: [
      ['Rigor metodológico (sin fugas, CV)', 40],
      ['Clustering e interpretación', 30],
      ['API y documentación', 30]
    ]
  },
  faq: [
    [
      'Mi modelo da 99 % de exactitud. ¿Está bien?',
      c`Casi seguro hay fuga de datos o clases muy desbalanceadas. Si solo el 3 % abandona, un modelo que siempre dice "no" acierta el 97 %. Mira PR-AUC, recall y la matriz de confusión, y revisa que ninguna variable derive del objetivo.`
    ],
    [
      '¿Pickle o joblib? ¿Es seguro cargar modelos?',
      c`joblib es más eficiente con arrays grandes, pero ambos ejecutan código al deserializar: <strong>nunca cargues artefactos de origen no confiable</strong>. Para intercambio seguro entre lenguajes exporta a ONNX (lo veremos en M6, semana 11) o usa formatos nativos como <code>model.save_model("modelo.ubj")</code> de XGBoost.`
    ],
    [
      '¿Cómo explico al centro por qué el modelo marcó a un alumno?',
      c`Usa SHAP (<code>shap.TreeExplainer</code>) para obtener la contribución de cada variable a la predicción individual. Recuerda el art. 22 RGPD: la alerta debe apoyar a un tutor humano, nunca decidir automáticamente.`
    ],
    [
      '¿Cuántos datos necesito?',
      c`Para boosting tabular, unos cientos de ejemplos por clase minoritaria es un mínimo razonable. Usa curvas de aprendizaje (<code>learning_curve</code>) para comprobar si más datos mejorarían el resultado.`
    ]
  ]
});

SESIONES.push({
  n: 4,
  semana: '4',
  fechas: '22 – 26 oct 2029',
  corto: 'Deep learning: visión y transfer learning',
  titulo: 'Deep Learning con PyTorch: Redes Convolucionales, Transfer Learning, Transformers y Embeddings',
  duracion: 'Semana 4 · 20 h',
  resumen: c`Del perceptrón a las redes convolucionales para visión; transfer learning con modelos preentrenados para clasificar imágenes con pocos datos; introducción a transformers y embeddings. Publicación del modelo como servicio web. Proyecto del módulo M2.`,
  stack: [
    'PyTorch 2',
    'torchvision',
    'ResNet / EfficientNet',
    'sentence-transformers',
    'FastAPI',
    'Docker',
    'ONNX'
  ],
  teoria: {
    intro: c`Las redes neuronales profundas aprenden por sí mismas las características de los datos: bordes y formas en imágenes, patrones en texto. Esta semana entrenas tu primera red, entiendes por qué las <strong>convolucionales</strong> funcionan tan bien con imágenes y aplicas <strong>transfer learning</strong>, la técnica que permite a un equipo pequeño crear un clasificador útil con unos cientos de fotos.`,
    bloques: [
      [
        '1. Del perceptrón a la capa densa',
        c`<p>Una neurona calcula <code>y = σ(w·x + b)</code>. Una capa densa (<code>nn.Linear</code>) hace lo mismo para muchas neuronas a la vez con un producto matricial: <code>Y = σ(X Wᵀ + b)</code>.</p>`
      ],
      [
        '2. Funciones de activación',
        c`<p>Sin no linealidades, apilar capas equivale a una sola capa lineal. ReLU es simple y eficiente; <strong>GELU</strong> y <strong>SwiGLU</strong> son las que usan los Transformers modernos; softmax convierte logits en probabilidades.</p>`
      ],
      [
        '3. Función de pérdida',
        c`<p>Clasificación: <code>CrossEntropyLoss</code> (recibe logits, no probabilidades). Regresión: <code>MSELoss</code> o <code>HuberLoss</code>. Los LLMs se entrenan con entropía cruzada sobre el siguiente token.</p>`
      ],
      [
        '4. Backpropagation y autograd',
        c`<p>PyTorch construye un grafo dinámico de operaciones. <code>loss.backward()</code> aplica la regla de la cadena desde la pérdida hasta cada parámetro y deja el gradiente en <code>param.grad</code>. Hay que llamar a <code>optimizer.zero_grad()</code> en cada iteración porque los gradientes se acumulan.</p>`
      ],
      [
        '5. Optimizadores: de SGD a AdamW',
        c`<p>Adam adapta la tasa de aprendizaje de cada parámetro con medias móviles del gradiente y de su cuadrado. <strong>AdamW</strong> desacopla la regularización (weight decay) y es el optimizador por defecto para Transformers. Combínalo con un <em>scheduler</em> de warmup + decaimiento coseno.</p>`
      ],
      [
        '6. Redes convolucionales (CNN)',
        c`<p>Una capa convolucional desliza pequeños filtros (3×3) sobre la imagen y detecta patrones locales: las primeras capas aprenden bordes y texturas; las profundas, partes y objetos. Comparte pesos en toda la imagen, así que necesita muchos menos parámetros que una capa densa y entiende que un objeto es el mismo esté donde esté. Arquitecturas de referencia: ResNet, EfficientNet, MobileNet (pensada para móviles).</p>`
      ],
      [
        '7. Transfer learning',
        c`<p>En lugar de entrenar desde cero (millones de imágenes), partes de una red preentrenada en ImageNet, <strong>congelas</strong> sus capas y sustituyes solo la última por una para tus clases. Con 100-500 imágenes por clase y aumento de datos (giros, recortes, cambios de brillo) se obtienen modelos muy precisos en minutos. Si hay más datos, se descongelan las últimas capas (<em>fine-tuning</em>).</p>`
      ],
      [
        '8. Generalización',
        c`<p>Separa train/validación, vigila el sobreajuste (la pérdida de validación sube), aplica dropout, weight decay, aumento de datos y early stopping. Guarda el mejor checkpoint, no el último.</p>`
      ],
      [
        '9. Transformers y embeddings',
        c`<p>El <strong>transformer</strong> sustituyó a las redes recurrentes en texto (y hoy también en visión) gracias al mecanismo de <strong>atención</strong>: cada elemento mira a todos los demás. Un <strong>embedding</strong> es un vector que representa el significado de un texto o una imagen: textos parecidos tienen vectores cercanos. Son la base de los LLMs (M3) y de los buscadores semánticos (M4).</p>`
      ]
    ],
    formula: c`Salida de una convolución: tamaño = (entrada − filtro + 2·relleno) / paso + 1<br>Transfer learning: parámetros entrenables ≈ solo la última capa (p. ej. 512 × nº clases en ResNet18)`,
    flujo: [
      'Imágenes por carpetas',
      'Aumento de datos',
      'ResNet18 preentrenada (congelada)',
      'Nueva capa final',
      'Entrenar + validar',
      'Exportar (TorchScript/ONNX)',
      'FastAPI /clasificar'
    ],
    tabla: {
      cap: 'Qué arquitectura usar',
      head: ['Datos', 'Arquitectura', 'Ejemplo en una app'],
      rows: [
        ['Tabulares', 'Gradient boosting (M2, semana 3)', 'Predecir abandono de usuarios'],
        ['Imágenes', 'CNN preentrenada + transfer learning', 'Reconocer productos del inventario'],
        ['Imágenes en el móvil', 'MobileNet / EfficientNet-Lite', 'Clasificar sin conexión (M6)'],
        ['Texto', 'Transformers y embeddings', 'Buscar documentos por significado (M4)'],
        ['Texto generativo', 'LLMs (transformer decoder)', 'Asistente conversacional (M3)']
      ]
    },
    claves: [
      'Con pocos datos, transfer learning casi siempre gana a entrenar desde cero.',
      'El bucle forward → loss → backward → step es el mismo para cualquier red.',
      c`Separa siempre validación y prueba; publica el modelo con la misma transformación de entrada que en entrenamiento.`
    ]
  },
  taller: {
    entorno: 'PowerShell 7 · VS Code · PyTorch (CPU, CUDA o MPS; Google Colab si no tienes GPU) · Docker',
    pasos: [
      {
        t: 'Instalar dependencias',
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
uv init mia-m2-vision
cd mia-m2-vision
uv add torch torchvision tensorboard --index https://download.pytorch.org/whl/cu124
uv add numpy matplotlib
uv add fastapi "uvicorn[standard]" python-multipart pillow onnx`
      },
      {
        t: 'Autograd a mano: entender el gradiente',
        d: 'Antes de usar capas, comprobamos que PyTorch calcula la derivada que esperamos.',
        lang: 'python',
        file: 'src/autograd_demo.py',
        code: c`
import torch

x = torch.tensor(3.0)
w = torch.tensor(2.0, requires_grad=True)
b = torch.tensor(1.0, requires_grad=True)

y = torch.sigmoid(w * x + b)          # neurona
loss = (y - 1.0) ** 2                  # queremos que salga 1
loss.backward()

# d(loss)/dw = 2(y-1) * y(1-y) * x
manual = 2 * (y - 1) * y * (1 - y) * x
print(f"autograd={w.grad.item():.6f}  manual={manual.item():.6f}")`
      },
      {
        t: 'Bucle de entrenamiento profesional (repaso con un MLP)',
        d: 'Incluye AdamW, scheduler coseno con warmup, validación, early stopping, checkpoint y TensorBoard.',
        lang: 'python',
        file: 'src/entrenar.py',
        code: c`
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
            print("Early stopping"); break`
      },
      {
        t: 'Dataset de imágenes por carpetas y aumento de datos',
        d: c`Ejemplo: clasificar productos de un comercio (bebidas, conservas, limpieza, snacks). Organiza las fotos en <code>data/train/&lt;clase&gt;/</code> y <code>data/val/&lt;clase&gt;/</code>.`,
        lang: 'python',
        file: 'src/datos.py',
        code: c`
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from torchvision.models import ResNet18_Weights

pesos = ResNet18_Weights.DEFAULT
normalizar = transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])

tf_train = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(), normalizar,
])
tf_eval = transforms.Compose([transforms.Resize(256), transforms.CenterCrop(224), transforms.ToTensor(), normalizar])

train_ds = datasets.ImageFolder("data/train", transform=tf_train)
val_ds = datasets.ImageFolder("data/val", transform=tf_eval)
train_dl = DataLoader(train_ds, batch_size=32, shuffle=True, num_workers=2)
val_dl = DataLoader(val_ds, batch_size=64)
CLASES = train_ds.classes
print(CLASES, len(train_ds), "imágenes de entrenamiento")`
      },
      {
        t: 'Transfer learning con ResNet18',
        lang: 'python',
        file: 'src/entrenar_vision.py',
        code: c`
import torch
from torch import nn
from torchvision.models import resnet18, ResNet18_Weights
from datos import train_dl, val_dl, CLASES

device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
modelo = resnet18(weights=ResNet18_Weights.DEFAULT)
for p in modelo.parameters():
    p.requires_grad = False                                # congelar la red preentrenada
modelo.fc = nn.Linear(modelo.fc.in_features, len(CLASES))  # nueva capa final, entrenable
modelo = modelo.to(device)

opt = torch.optim.AdamW(modelo.fc.parameters(), lr=1e-3)
criterio = nn.CrossEntropyLoss()
mejor = 0.0
for epoca in range(8):
    modelo.train()
    for x, y in train_dl:
        x, y = x.to(device), y.to(device)
        loss = criterio(modelo(x), y)
        opt.zero_grad(); loss.backward(); opt.step()
    modelo.eval(); aciertos = 0
    with torch.inference_mode():
        for x, y in val_dl:
            aciertos += (modelo(x.to(device)).argmax(1).cpu() == y).sum().item()
    acc = aciertos / len(val_dl.dataset)
    print(f"época {epoca} · exactitud validación {acc:.3f}")
    if acc > mejor:
        mejor = acc
        torch.save({"estado": modelo.state_dict(), "clases": CLASES}, "modelo_productos.pt")`
      },
      {
        t: 'Publicar el modelo como servicio web',
        lang: 'python',
        file: 'src/api_vision.py',
        code: c`
import io
from contextlib import asynccontextmanager
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image
from torch import nn
from torchvision.models import resnet18
from datos import tf_eval

estado: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    ckpt = torch.load("modelo_productos.pt", map_location="cpu")
    m = resnet18()
    m.fc = nn.Linear(m.fc.in_features, len(ckpt["clases"]))
    m.load_state_dict(ckpt["estado"]); m.eval()
    estado.update(modelo=m, clases=ckpt["clases"])
    yield


app = FastAPI(title="Clasificador de productos", version="1.0.0", lifespan=lifespan)


@app.post("/clasificar")
async def clasificar(imagen: UploadFile = File(...)):
    if imagen.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(415, "Formato no soportado")
    datos = await imagen.read()
    if len(datos) > 5_000_000:
        raise HTTPException(413, "Imagen demasiado grande (máx. 5 MB)")
    x = tf_eval(Image.open(io.BytesIO(datos)).convert("RGB")).unsqueeze(0)
    with torch.inference_mode():
        prob = torch.softmax(estado["modelo"](x), dim=1)[0]
    top = prob.topk(3)
    return {"predicciones": [{"clase": estado["clases"][i], "probabilidad": round(p.item(), 4)}
                             for p, i in zip(top.values, top.indices)]}


@app.get("/health")
def health():
    return {"ok": "modelo" in estado}`
      },
      {
        t: 'Probar el servicio y contenerizarlo',
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
uv run uvicorn src.api_vision:app --port 8000
curl.exe -F "imagen=@foto_prueba.jpg" http://localhost:8000/clasificar

# Contenedor (Dockerfile de la plantilla del módulo)
docker build -t clasificador-productos:1.0 .
docker run --rm -p 8000:8000 clasificador-productos:1.0`
      },
      {
        t: 'Embeddings: similitud por significado',
        d: 'Un adelanto de M3 y M4: los textos con significado parecido tienen vectores cercanos.',
        lang: 'python',
        file: 'src/embeddings_demo.py',
        code: c`
from sentence_transformers import SentenceTransformer, util

modelo = SentenceTransformer("intfloat/multilingual-e5-small")
consulta = modelo.encode("query: la app se cierra al abrir la cámara", normalize_embeddings=True)
incidencias = ["passage: Crash al iniciar CameraX en Android 14",
               "passage: Error de pago con tarjeta",
               "passage: La aplicación se bloquea cuando uso la cámara"]
sims = util.cos_sim(consulta, modelo.encode(incidencias, normalize_embeddings=True))[0]
for texto, s in sorted(zip(incidencias, sims.tolist()), key=lambda t: -t[1]):
    print(f"{s:.3f}  {texto}")`
      }
    ]
  },
  prompts: [
    {
      t: 'Diagnóstico de curvas de entrenamiento',
      tipo: 'System Prompt',
      lang: 'markdown',
      code: c`
Eres un ingeniero de deep learning. Te paso las pérdidas de entrenamiento y validación
por época (CSV) y los hiperparámetros. Diagnostica UNA de estas situaciones:
underfitting, overfitting, learning rate excesivo, learning rate insuficiente,
gradientes explosivos, problema de datos. Justifica con valores concretos del CSV y
propón como máximo 3 cambios ordenados por impacto esperado. No propongas cambiar
de arquitectura salvo que lo demás esté descartado.`
    },
    {
      t: 'Generador de tests para módulos PyTorch',
      tipo: 'Plantilla',
      lang: 'markdown',
      code: c`
Genera tests pytest para este nn.Module:
<modulo>{código}</modulo>
Cubre: (1) shape de salida para lotes de tamaño 1 y 64, (2) que los gradientes llegan a
todos los parámetros tras un backward, (3) determinismo en modo eval con semilla fija,
(4) que el modelo puede sobreajustar un lote diminuto (8 ejemplos) en 200 pasos.`
    },
    {
      t: 'Plan de recogida de imágenes para un clasificador',
      tipo: 'Plantilla',
      lang: 'markdown',
      code: c`
Voy a entrenar un clasificador de imágenes para {caso de uso} con las clases {clases}.
Diseña un plan de recogida de imágenes: número mínimo por clase, variedad necesaria
(iluminación, fondos, ángulos, dispositivos), cómo evitar sesgos (p. ej. que una clase
siempre aparezca sobre el mismo fondo), cómo separar train/val/test sin fugas (fotos del
mismo objeto en conjuntos distintos) y qué datos personales evitar (caras, matrículas).`
    }
  ],
  actividad: {
    tipo: 'proyecto',
    titulo: 'Proyecto del módulo M2: modelo de clasificación de imágenes publicado como servicio web',
    contexto: c`Construye un clasificador de imágenes para un caso real de una app (inventario de un comercio, residuos reciclables, piezas de un taller, incidencias en instalaciones…) y publícalo como servicio web listo para que lo consuma una app móvil.`,
    requisitos: [
      c`Dataset propio o con licencia compatible (≥ 3 clases, ≥ 80 imágenes por clase) con separación train/val/test sin fugas y sin datos personales.`,
      'Línea base (MLP o CNN pequeña) frente a transfer learning con una red preentrenada.',
      'Métricas en test: exactitud, matriz de confusión y análisis de errores con ejemplos.',
      c`API FastAPI con validación de entrada, <code>/health</code> y contenedor Docker.`,
      'Vídeo de defensa de 5 minutos con demostración.'
    ],
    entregables: [
      c`Repositorio con código, <code>Dockerfile</code> y README`,
      c`Ficha del dataset y del modelo (<code>MODEL_CARD.md</code>)`,
      'Enlace al vídeo de defensa (5 min)'
    ],
    rubrica: [
      ['Funcionamiento del modelo y del servicio', 30],
      ['Calidad técnica (metodología, métricas, código)', 30],
      ['Documentación (README, model card)', 20],
      ['Vídeo de defensa', 20]
    ]
  },
  faq: [
    [
      c`La pérdida es <code>nan</code> desde la primera época.`,
      c`Learning rate demasiado alto, datos sin normalizar o <code>log(0)</code>. Baja el LR un orden de magnitud, usa <code>clip_grad_norm_</code> y comprueba que pasas logits (no softmax) a <code>CrossEntropyLoss</code>. Activa <code>torch.autograd.set_detect_anomaly(True)</code> para localizar el origen.`
    ],
    [
      '¿Por qué mi modelo va más lento en GPU que en CPU?',
      c`Con modelos y lotes pequeños domina el coste de transferencia host↔device y de lanzar kernels. Aumenta el <code>batch_size</code>, usa <code>pin_memory=True</code> en el DataLoader y evita <code>.item()</code> dentro del bucle (fuerza sincronización).`
    ],
    [
      'Tengo pocas imágenes. ¿Sirve igual?',
      c`Con transfer learning y aumento de datos, 80-200 imágenes por clase suelen dar buenos resultados si son variadas. Lo que no funciona es tener todas las fotos de una clase en el mismo fondo o con la misma luz: el modelo aprende el fondo, no el objeto.`
    ],
    [
      '¿Puedo usar imágenes de internet?',
      c`Solo si su licencia lo permite (Creative Commons compatibles, datasets con licencia abierta) y sin personas identificables. Documenta el origen en la ficha del dataset. Lo veremos con detalle en M7.`
    ],
    [
      '¿Necesito saber cálculo para seguir el Máster?',
      c`Necesitas la intuición (derivada = sensibilidad, regla de la cadena = propagación), no resolver integrales. Autograd hace el cálculo; tú debes saber interpretar gradientes y curvas.`
    ]
  ]
});
