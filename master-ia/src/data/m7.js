// M7 · Ética, normativa y uso responsable de la IA (10 h · semanas 13–14)

SESIONES.push({
  n: 13,
  semana: '13',
  fechas: '7 – 11 ene 2030',
  corto: 'Reglamento de IA, RGPD y licencias',
  titulo: c`Reglamento (UE) 2024/1689 de Inteligencia Artificial, RGPD Aplicado a Sistemas de IA y Propiedad Intelectual y Licencias`,
  duracion: 'Semana 13 · 5 h',
  resumen: c`Niveles de riesgo y obligaciones del Reglamento europeo de IA, aplicación del RGPD y la LOPDGDD a sistemas de IA (bases jurídicas, minimización, encargados del tratamiento, transferencias, evaluación de impacto) y propiedad intelectual: licencias de modelos, datos, código y contenido generado. Se cursa en paralelo al desarrollo del Proyecto Final.`,
  stack: [
    'Reglamento (UE) 2024/1689',
    'RGPD / LOPDGDD',
    'Microsoft Presidio',
    'Hugging Face Hub (licencias)',
    'pip-licenses'
  ],
  teoria: {
    intro: c`Un desarrollador de aplicaciones con IA no es jurista, pero debe saber <strong>qué preguntas hacer</strong> y cómo diseñar para cumplir. Esta semana aplicas el marco europeo a tu Proyecto Final: qué riesgo tiene según el Reglamento de IA, qué datos personales trata y con qué base, y si puedes usar legalmente cada modelo, dataset y librería.`,
    bloques: [
      [
        '1. Reglamento de IA: enfoque basado en riesgo',
        c`<p><strong>Prácticas prohibidas</strong> (art. 5), entre ellas el <em>reconocimiento de emociones en centros educativos</em> y en el trabajo, salvo por razones médicas o de seguridad. <strong>Alto riesgo</strong> (Anexo III, punto 3): sistemas de educación para admisión, evaluación de resultados de aprendizaje, asignación de nivel y supervisión de conductas prohibidas en exámenes; exigen gestión de riesgos, gobernanza de datos, documentación técnica, registros, transparencia, supervisión humana, precisión y ciberseguridad. <strong>Transparencia</strong> (art. 50): informar de la interacción con IA y marcar contenido sintético. <strong>Alfabetización en IA</strong> (art. 4) para quien usa estos sistemas. Las obligaciones entran en vigor de forma escalonada: consulta el calendario vigente, porque la Comisión ha propuesto ajustes en algunos plazos de alto riesgo.</p>`
      ],
      [
        '2. Obligaciones según el rol',
        c`<p>El <strong>proveedor</strong> desarrolla el sistema o lo comercializa con su nombre; el <strong>responsable del despliegue</strong> lo usa bajo su autoridad. Para sistemas de alto riesgo, el proveedor asume la gestión de riesgos, la gobernanza de datos, la documentación técnica, los registros y la supervisión humana; el responsable del despliegue, el uso conforme a las instrucciones, la supervisión por personas formadas y, en algunos casos, la evaluación de impacto en derechos fundamentales. Todos deben garantizar la <strong>alfabetización en IA</strong> de su personal (art. 4) y la transparencia del art. 50.</p>`
      ],
      [
        '3. RGPD aplicado a sistemas de IA',
        c`<ul>
<li><strong>Base jurídica</strong> para cada finalidad (art. 6) y especial cuidado con categorías especiales (art. 9).</li>
<li><strong>Minimización</strong>: solo los datos necesarios; seudonimiza o anonimiza antes de enviar a un modelo o construir un dataset.</li>
<li><strong>Encargados del tratamiento</strong>: proveedores de nube y de APIs de IA requieren contrato (art. 28); revisa si usan tus datos para entrenar.</li>
<li><strong>Transferencias internacionales</strong>: comprueba dónde se procesan los datos y con qué garantías.</li>
<li><strong>Decisiones automatizadas</strong> con efectos significativos: derecho a intervención humana (art. 22).</li>
<li><strong>Evaluación de impacto</strong> (art. 35) cuando el tratamiento entrañe alto riesgo.</li>
</ul>`
      ],
      [
        '4. Anonimización de PII con Presidio',
        c`<p>Presidio combina NER (spaCy en español), expresiones regulares y contexto para detectar nombres, correos, teléfonos, IBAN y reconocedores propios (DNI/NIE con letra de control). Operadores: reemplazar, enmascarar, hash o cifrado reversible. Aplícalo antes de enviar datos a terceros, de registrar trazas y de construir datasets.</p>`
      ],
      [
        '5. Propiedad intelectual y licencias',
        c`<ul>
<li><strong>Pesos de modelos</strong>: "abierto" no significa sin condiciones. Apache 2.0 y MIT son permisivas; otras licencias comunitarias limitan usos, número de usuarios o exigen atribución.</li>
<li><strong>Datasets</strong>: revisa la licencia y si contienen datos personales o contenido protegido.</li>
<li><strong>APIs de modelos</strong>: sus términos regulan la propiedad de las salidas y si pueden usarse para entrenar otros modelos.</li>
<li><strong>Código generado por asistentes</strong>: revisa similitudes con código con licencia incompatible y declara su uso.</li>
<li><strong>Dependencias</strong>: genera el inventario de licencias de tu proyecto antes de distribuirlo.</li>
</ul>`
      ]
    ],
    flujo: [
      'Describir el sistema',
      '¿Práctica prohibida?',
      '¿Alto riesgo (Anexo III)?',
      'Transparencia (art. 50)',
      'RGPD: datos y bases jurídicas',
      'Licencias',
      'Medidas y documentación'
    ],
    tabla: {
      cap: 'EU AI Act aplicado a casos del sector educativo (orientativo; requiere análisis jurídico caso a caso)',
      head: ['Sistema', 'Clasificación probable', 'Obligaciones clave'],
      rows: [
        ['Detector de emociones del alumnado por webcam', 'Prohibido (art. 5.1.f)', 'No puede desplegarse'],
        [
          'Corrección automática que determina la nota',
          'Alto riesgo (Anexo III.3)',
          'Gestión de riesgos, supervisión humana, registros, documentación'
        ],
        [
          'Sistema que decide la admisión al Máster',
          'Alto riesgo (Anexo III.3)',
          'Ídem + evaluación de impacto en derechos fundamentales para determinados responsables del despliegue'
        ],
        ['Chatbot de dudas administrativas', 'Riesgo limitado', 'Informar de que es una IA (art. 50)'],
        [
          'Generador de imágenes para material didáctico',
          'Riesgo limitado',
          'Marcado del contenido sintético'
        ],
        ['Autocompletado de código en el IDE', 'Riesgo mínimo', 'Alfabetización en IA (art. 4)']
      ]
    },
    claves: [
      'En educación, empleo o servicios esenciales, la IA que decide sobre personas suele ser de alto riesgo.',
      c`El reconocimiento de emociones en centros educativos y en el trabajo está prohibido salvo excepciones médicas o de seguridad.`,
      'Revisa la licencia de cada modelo, dataset y dependencia antes de usarlos.',
      'Esta sesión no sustituye el asesoramiento jurídico: identifica riesgos y consúltalos.'
    ]
  },
  taller: {
    entorno: 'PowerShell 7 · VS Code · Node.js (promptfoo) · Python 3.12',
    pasos: [
      {
        t: 'Instalar Presidio con soporte en español',
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
uv init mia-s23-seguridad; cd mia-s23-seguridad
uv add presidio-analyzer presidio-anonymizer spacy anthropic
uv run python -m spacy download es_core_news_md`
      },
      {
        t: 'Reconocedor de DNI/NIE con validación de letra y anonimización',
        lang: 'python',
        file: 'src/pii.py',
        code: c`
from presidio_analyzer import AnalyzerEngine, Pattern, PatternRecognizer, RecognizerRegistry
from presidio_analyzer.nlp_engine import NlpEngineProvider
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig

LETRAS = "TRWAGMYFPDXBNJZSQVHLCKE"


class DniNieRecognizer(PatternRecognizer):
    def __init__(self):
        super().__init__(supported_entity="ES_DNI_NIE", supported_language="es",
                         patterns=[Pattern("dni_nie", r"\b[XYZ]?\d{7,8}[A-Z]\b", 0.5)],
                         context=["dni", "nie", "documento", "identidad"])

    def validate_result(self, texto: str) -> bool:
        num = texto[:-1].replace("X", "0").replace("Y", "1").replace("Z", "2")
        return num.isdigit() and LETRAS[int(num) % 23] == texto[-1]


nlp = NlpEngineProvider(nlp_configuration={"nlp_engine_name": "spacy",
                        "models": [{"lang_code": "es", "model_name": "es_core_news_md"}]}).create_engine()
registro = RecognizerRegistry(supported_languages=["es"])
registro.load_predefined_recognizers(languages=["es"], nlp_engine=nlp)
registro.add_recognizer(DniNieRecognizer())
analizador = AnalyzerEngine(nlp_engine=nlp, registry=registro, supported_languages=["es"])
anonimizador = AnonymizerEngine()


def anonimizar(texto: str) -> str:
    hallazgos = analizador.analyze(text=texto, language="es",
                                   entities=["PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER", "IBAN_CODE", "ES_DNI_NIE"])
    return anonimizador.anonymize(text=texto, analyzer_results=hallazgos, operators={
        "PERSON": OperatorConfig("replace", {"new_value": "<PERSONA>"}),
        "ES_DNI_NIE": OperatorConfig("mask", {"masking_char": "*", "chars_to_mask": 6, "from_end": False}),
        "DEFAULT": OperatorConfig("replace", {"new_value": "<DATO>"}),
    }).text


print(anonimizar("La alumna Lucía Fernández (DNI 12345678Z, lucia@gmail.com, 600123456) solicita revisión."))`
      },
      {
        t: 'Inventario de licencias de modelos y dependencias',
        lang: 'python',
        file: 'src/licencias.py',
        code: c`
from huggingface_hub import model_info

MODELOS = ["Qwen/Qwen2.5-7B-Instruct", "BAAI/bge-m3", "intfloat/multilingual-e5-small"]

print("| Modelo | Licencia |")
print("|---|---|")
for nombre in MODELOS:
    info = model_info(nombre)
    licencia = (info.card_data or {}).get("license") if info.card_data else None
    print(f"| {nombre} | {licencia or 'REVISAR MANUALMENTE'} |")

# Dependencias Python del proyecto:  uvx pip-licenses --format=markdown --with-urls
# Dependencias Java (Maven):          ./mvnw org.codehaus.mojo:license-maven-plugin:add-third-party`
      },
      {
        t: 'Preclasificación de riesgo del Proyecto Final',
        d: 'Cuestionario guiado que ayuda a ordenar el análisis (no sustituye la valoración jurídica).',
        lang: 'python',
        file: 'src/clasificar_riesgo.py',
        code: c`
PREGUNTAS = [
    ("prohibido", "¿Reconoce emociones en el trabajo o en centros educativos, puntúa socialmente a personas o manipula de forma subliminal?"),
    ("alto", "¿Decide o influye en admisión, evaluación o vigilancia de exámenes en educación?"),
    ("alto", "¿Selecciona o evalúa candidatos o trabajadores?"),
    ("alto", "¿Evalúa la solvencia o el acceso a servicios esenciales?"),
    ("limitado", "¿Interactúa directamente con personas (chatbot, asistente de voz)?"),
    ("limitado", "¿Genera imagen, audio, vídeo o texto sintético que se publica?"),
]


def clasificar() -> str:
    nivel = "mínimo"
    for tipo, pregunta in PREGUNTAS:
        if input(pregunta + " (s/n) ").strip().lower() == "s":
            if tipo == "prohibido":
                return "PROHIBIDO: no puede desplegarse (art. 5). Consulta con la coordinación."
            if tipo == "alto":
                nivel = "alto"
            elif nivel == "mínimo":
                nivel = "limitado"
    return {"alto": "ALTO RIESGO probable (Anexo III): gestión de riesgos, datos, documentación, registros y supervisión humana.",
            "limitado": "RIESGO LIMITADO: obligaciones de transparencia (art. 50).",
            "mínimo": "RIESGO MÍNIMO: buenas prácticas y alfabetización en IA (art. 4)."}[nivel]


if __name__ == "__main__":
    print(clasificar())`
      },
      {
        t: 'Equivalente Java: enmascarado de DNI en Spring antes del LLM',
        lang: 'java',
        file: 'EnmascaradorPii.java',
        code: c`
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class EnmascaradorPii {
    private static final Pattern DNI = Pattern.compile("\\b([XYZ]?\\d{7,8})([A-Z])\\b");
    private static final Pattern EMAIL = Pattern.compile("[\\w.+-]+@[\\w-]+\\.[\\w.]+");
    private static final String LETRAS = "TRWAGMYFPDXBNJZSQVHLCKE";

    public String enmascarar(String texto) {
        Matcher m = DNI.matcher(texto);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            String num = m.group(1).replace('X', '0').replace('Y', '1').replace('Z', '2');
            boolean valido = LETRAS.charAt((int) (Long.parseLong(num) % 23)) == m.group(2).charAt(0);
            m.appendReplacement(sb, valido ? "<DNI>" : m.group());
        }
        m.appendTail(sb);
        return EMAIL.matcher(sb.toString()).replaceAll("<EMAIL>");
    }
}
// Úsalo en un advisor de Spring AI (M3, semana 6) para que ningún prompt salga con PII.`
      }
    ]
  },
  prompts: [
    {
      t: 'Evaluación de impacto EU AI Act de un sistema',
      tipo: 'Plantilla de análisis',
      lang: 'markdown',
      code: c`
Analiza este sistema de IA según el Reglamento (UE) 2024/1689.
<sistema>{descripcion: finalidad, usuarios, datos, decisiones que influye}</sistema>
1. ¿Encaja en alguna práctica prohibida del art. 5? Justifica.
2. ¿Es de alto riesgo según el Anexo III (en especial el punto 3, educación)?
   ¿Aplica alguna excepción del art. 6.3?
3. Obligaciones de transparencia (art. 50).
4. Rol de la organización (proveedor / responsable del despliegue) y obligaciones.
5. Medidas de supervisión humana propuestas.
Indica qué puntos requieren validación jurídica. No afirmes plazos sin citar el artículo.`
    },
    {
      t: 'Asistente de redacción de evaluación de impacto (EIPD)',
      tipo: 'System Prompt',
      lang: 'markdown',
      code: c`
Ayudas a redactar una Evaluación de Impacto en Protección de Datos (art. 35 RGPD)
siguiendo la estructura de las guías de la AEPD: descripción sistemática del
tratamiento, necesidad y proporcionalidad, identificación de riesgos para los
derechos y libertades (probabilidad × impacto) y medidas para mitigarlos.
Pide los datos que falten. Señala con [REVISAR DPD] todo lo que deba validar el
Delegado de Protección de Datos. No inventes obligaciones legales.`
    }
  ],
  actividad: {
    tipo: 'semanal',
    titulo: 'Entrega semanal: análisis normativo preliminar del Proyecto Final',
    contexto: c`Aplica lo visto a tu Proyecto Final: clasificación de riesgo, datos personales y licencias. Es la base del proyecto del módulo M7 de la semana siguiente.`,
    requisitos: [
      'Clasificación de riesgo razonada según el Reglamento de IA y rol (proveedor / responsable del despliegue).',
      'Inventario de datos personales con base jurídica, minimización y proveedores que actúan como encargados.',
      'Inventario de licencias de modelos, datasets y dependencias.',
      'Si tratas datos personales: anonimización o seudonimización implementada con Presidio u otra herramienta.'
    ],
    entregables: [c`<code>docs/normativa-preliminar.md</code> en el repositorio del PFM`],
    rubrica: [['Clasificación de riesgo', 35], ['Análisis RGPD', 35], ['Licencias', 30]]
  },
  faq: [
    [
      '¿Este LMS es un sistema de alto riesgo?',
      c`La plataforma registra calificaciones introducidas por personas: la IA no decide la nota ni la admisión, y el art. 22 RGPD se respeta. Si se añadiera corrección automática que determinara calificaciones o admisiones, entraría en el Anexo III.3 y requeriría el régimen de alto riesgo. Es un buen caso para el análisis de tu Proyecto Final.`
    ],
    [
      '¿Quién es "proveedor" y quién "responsable del despliegue"?',
      c`El proveedor desarrolla el sistema (o lo comercializa con su nombre); el responsable del despliegue lo utiliza bajo su autoridad. Un centro que integra un modelo de terceros en su propio sistema puede ser proveedor de ese sistema. Analízalo caso a caso con asesoría jurídica.`
    ],
    [
      'Presidio no detecta nombres españoles compuestos.',
      c`Usa un modelo spaCy más grande (<code>es_core_news_lg</code>), añade reconocedores por contexto ("alumno", "alumna", "D./Dña."), listas de nombres del dominio y revisa umbrales. Mide recall con un conjunto anotado: en anonimización, un falso negativo es más grave que un falso positivo.`
    ],
    [
      '¿Necesito un abogado para mi Proyecto Final?',
      c`No para el análisis del Máster: se valora que identifiques correctamente los riesgos y las obligaciones. En un producto real, las conclusiones deben validarse con asesoría jurídica y con el delegado de protección de datos.`
    ]
  ]
});

SESIONES.push({
  n: 14,
  semana: '14',
  fechas: '14 – 18 ene 2030',
  corto: 'Sesgos, explicabilidad, accesibilidad y sostenibilidad',
  titulo: 'Sesgos, Explicabilidad, Accesibilidad y Sostenibilidad; Ficha de Transparencia',
  duracion: 'Semana 14 · 5 h',
  resumen: c`Detectar y mitigar sesgos con métricas por grupo, explicar las predicciones de un modelo, diseñar funciones de IA accesibles y medir el impacto energético. Elaboración de la ficha de transparencia del Proyecto Final. Proyecto del módulo M7.`,
  stack: ['fairlearn', 'SHAP', 'XGBoost', 'WCAG 2.2', 'CodeCarbon', 'Model card / ficha de transparencia'],
  teoria: {
    intro: c`Que un sistema de IA funcione "de media" no basta: puede fallar más con ciertos grupos, ser imposible de explicar a quien le afecta, excluir a personas con discapacidad o consumir mucha más energía de la necesaria. Esta semana mides esos aspectos en tu proyecto y los documentas en una <strong>ficha de transparencia</strong>.`,
    bloques: [
      [
        '1. Sesgos',
        c`<p>Los sesgos llegan por los datos (grupos poco representados, etiquetas históricas injustas), por las variables (códigos postales que actúan como sustitutos de origen) o por el uso. Se detectan comparando métricas <strong>por grupo</strong>: tasa de selección (paridad demográfica), tasa de errores y de aciertos (igualdad de oportunidades). Se mitigan con mejores datos, revisión de variables, umbrales por grupo justificados o, a veces, decidiendo no automatizar.</p>`
      ],
      [
        '2. Explicabilidad',
        c`<p>Quien recibe una decisión apoyada en IA tiene derecho a entender lo esencial. En modelos tabulares, <strong>SHAP</strong> muestra cuánto aporta cada variable a una predicción concreta. En LLMs, la explicabilidad práctica viene de citar fuentes (RAG), mostrar los pasos de un agente y registrar las decisiones para auditoría.</p>`
      ],
      [
        '3. Accesibilidad',
        c`<ul>
<li>Las funciones de IA deben cumplir las pautas WCAG 2.2: contraste, teclado, lectores de pantalla.</li>
<li>Texto que llega en streaming anunciado con regiones <code>aria-live</code> sin saturar al lector de pantalla.</li>
<li>Alternativas de entrada y salida: voz y texto, subtítulos para audio generado.</li>
<li>Textos alternativos generados por IA siempre revisables por una persona.</li>
<li>Lenguaje claro en respuestas y mensajes de error.</li>
</ul>`
      ],
      [
        '4. Sostenibilidad',
        c`<p>Entrenar e inferir consume energía. Mide (CodeCarbon), elige el modelo más pequeño que cumpla, cachea, limita la longitud de las respuestas, ejecuta en el dispositivo cuando tenga sentido y prefiere regiones cloud con energía más limpia. Documenta el impacto estimado en la ficha.</p>`
      ],
      [
        '5. Ficha de transparencia',
        c`<p>Documento breve y público que explica: finalidad y usos no previstos, modelos y datos utilizados, cómo se evaluó (incluidas métricas por grupo), limitaciones conocidas, supervisión humana, cómo se protegen los datos personales, impacto energético estimado y contacto para incidencias.</p>`
      ]
    ],
    flujo: [
      'Métricas por grupo',
      'Explicaciones de predicciones',
      'Revisión de accesibilidad',
      'Medición de energía',
      'Ficha de transparencia'
    ],
    tabla: {
      cap: 'Cómo medir cada aspecto',
      head: ['Aspecto', 'Métrica o prueba', 'Herramienta'],
      rows: [
        [
          'Sesgo en clasificación',
          'Diferencia de paridad demográfica y de tasa de aciertos por grupo',
          'fairlearn'
        ],
        ['Explicabilidad', 'Contribución de cada variable a una predicción', 'SHAP'],
        ['Fidelidad en LLMs', 'Afirmaciones respaldadas por fuentes citadas', 'RAGAS / juez LLM (M4)'],
        [
          'Accesibilidad',
          'Auditoría WCAG 2.2 y prueba con lector de pantalla',
          'Lighthouse, axe, NVDA/TalkBack'
        ],
        ['Sostenibilidad', 'kg de CO₂ equivalente por entrenamiento o por 1 000 peticiones', 'CodeCarbon']
      ]
    },
    claves: [
      'Mide por grupos, no solo la media.',
      'Si no puedes explicar una decisión que afecta a una persona, no la automatices.',
      'La accesibilidad también es requisito de las funciones de IA.'
    ]
  },
  taller: {
    entorno: 'PowerShell 7 · VS Code · Python 3.12',
    pasos: [
      {
        t: 'Dependencias',
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
uv init mia-m7-etica; cd mia-m7-etica
uv add fairlearn shap xgboost scikit-learn pandas codecarbon matplotlib`
      },
      {
        t: 'Métricas de sesgo por grupo con fairlearn',
        d: c`Datos sintéticos de solicitudes de una app de becas, con una variable sensible (turno) y un sesgo introducido a propósito.`,
        lang: 'python',
        file: 'src/sesgos.py',
        code: c`
import numpy as np
import pandas as pd
from fairlearn.metrics import MetricFrame, demographic_parity_difference, selection_rate
from sklearn.metrics import accuracy_score, recall_score
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

rng = np.random.default_rng(3)
n = 4000
df = pd.DataFrame({
    "nota": rng.normal(6.5, 1.5, n).clip(0, 10),
    "renta_tramo": rng.integers(1, 6, n),
    "turno": rng.choice(["mañana", "tarde"], n, p=[0.7, 0.3]),
})
# Etiquetas históricas sesgadas: al turno de tarde se le concedía menos a igual mérito
merito = 0.9 * (df.nota - 6) - 0.4 * (df.renta_tramo - 3)
df["concedida"] = (merito - 0.6 * (df.turno == "tarde") + rng.normal(0, 0.7, n) > 0).astype(int)

X = pd.get_dummies(df[["nota", "renta_tramo", "turno"]], dtype=float)
X_tr, X_te, y_tr, y_te, g_tr, g_te = train_test_split(X, df.concedida, df.turno, test_size=0.3, random_state=3)
modelo = XGBClassifier(n_estimators=200, max_depth=3).fit(X_tr, y_tr)
pred = modelo.predict(X_te)

mf = MetricFrame(metrics={"exactitud": accuracy_score, "tasa_concesion": selection_rate, "recall": recall_score},
                 y_true=y_te, y_pred=pred, sensitive_features=g_te)
print(mf.by_group.round(3))
print("Diferencia de paridad demográfica:", round(demographic_parity_difference(y_te, pred, sensitive_features=g_te), 3))
# Prueba: quita la variable 'turno' y vuelve a medir. ¿Desaparece el sesgo? ¿Por qué no del todo?`
      },
      {
        t: 'Explicar una predicción con SHAP',
        lang: 'python',
        file: 'src/explicar.py',
        code: c`
import shap
from sesgos import modelo, X_te

explicador = shap.TreeExplainer(modelo)
valores = explicador(X_te.iloc[:200])
shap.plots.beeswarm(valores, show=False)                 # importancia global
import matplotlib.pyplot as plt
plt.savefig("shap_global.png", bbox_inches="tight"); plt.close()

caso = valores[0]                                        # explicación individual
for nombre, aporte in sorted(zip(X_te.columns, caso.values), key=lambda t: -abs(t[1])):
    print(f"{nombre:<16} {aporte:+.3f}")`
      },
      {
        t: 'Medir la huella de carbono',
        lang: 'python',
        file: 'src/energia.py',
        code: c`
from codecarbon import EmissionsTracker
from sesgos import X_tr, y_tr
from xgboost import XGBClassifier

tracker = EmissionsTracker(project_name="mia-m7", log_level="error")
tracker.start()
for _ in range(20):                                      # simula un entrenamiento repetido
    XGBClassifier(n_estimators=400, max_depth=5).fit(X_tr, y_tr)
kg = tracker.stop()
print(f"Emisiones estimadas: {kg * 1000:.2f} g de CO2 equivalente")`
      },
      {
        t: 'Streaming accesible en una interfaz web',
        d: 'El texto que llega en streaming se anuncia al lector de pantalla por frases completas, no carácter a carácter.',
        lang: 'javascript',
        file: 'static/respuesta-accesible.js',
        code: c`
// HTML: <div id="respuesta" aria-busy="true"></div> <div id="anuncio" aria-live="polite" class="sr-only"></div>
const respuesta = document.querySelector("#respuesta");
const anuncio = document.querySelector("#anuncio");
let pendiente = "";

function alRecibir(trozo) {
  respuesta.textContent += trozo;                 // visible al instante
  pendiente += trozo;
  const fin = pendiente.search(/[.!?]\s/);
  if (fin >= 0) {                                 // al lector de pantalla, frase a frase
    anuncio.textContent = pendiente.slice(0, fin + 1);
    pendiente = pendiente.slice(fin + 2);
  }
}

function alTerminar() {
  if (pendiente.trim()) anuncio.textContent = pendiente;
  respuesta.setAttribute("aria-busy", "false");
}`
      },
      {
        t: 'Plantilla de ficha de transparencia',
        lang: 'markdown',
        file: 'docs/ficha-transparencia.md',
        code: c`
# Ficha de transparencia · {nombre del Proyecto Final}

**Qué hace:** {una frase}. **Para quién:** {usuarios}. **Usos no previstos:** {…}.
**Interacción con IA:** los usuarios son informados de que interactúan con un sistema de IA (art. 50).

## Modelos y datos
| Componente | Modelo / versión | Licencia | Dónde se procesan los datos |
|---|---|---|---|

## Evaluación
- Métricas globales: {…}
- Métricas por grupo: {…} · Diferencia máxima observada: {…}

## Limitaciones conocidas y riesgos
- {…} → mitigación: {…}

## Supervisión humana
{quién revisa qué antes de qué acción}

## Datos personales
Base jurídica: {…} · Minimización: {…} · Conservación: {…} · Derechos: {contacto}

## Accesibilidad y sostenibilidad
WCAG 2.2: {resultado de la auditoría} · Emisiones estimadas: {g CO₂e por 1 000 peticiones}

## Contacto para incidencias
{correo}`
      }
    ]
  },
  prompts: [
    {
      t: 'Auditor de sesgos de un sistema',
      tipo: 'System Prompt',
      lang: 'markdown',
      code: c`
Eres auditor de equidad de sistemas de IA. A partir de la descripción del sistema, sus
datos y sus métricas por grupo:
1. Identifica grupos potencialmente afectados y variables que podrían actuar como sustitutos.
2. Interpreta las diferencias entre grupos: ¿son relevantes?, ¿qué daño concreto causarían?
3. Propón mitigaciones ordenadas por coste y eficacia, incluida la de no automatizar.
No concluyas que no hay sesgo si faltan métricas por grupo: pide las que falten.`
    },
    {
      t: 'Revisión de accesibilidad de una función de IA',
      tipo: 'Plantilla',
      lang: 'markdown',
      code: c`
Revisa la accesibilidad de esta función de IA de una app según WCAG 2.2.
<descripcion>{qué hace y cómo se muestra}</descripcion>
<codigo>{HTML/Compose/Flutter relevante}</codigo>
Comprueba: anuncio del contenido en streaming, foco y teclado, contraste, alternativas
de voz/texto, mensajes de error comprensibles y textos alternativos revisables.
Devuelve una tabla Criterio WCAG | Cumple/No | Corrección.`
    }
  ],
  actividad: {
    tipo: 'proyecto',
    titulo: 'Proyecto del módulo M7: análisis de cumplimiento y ficha de transparencia del Proyecto Final',
    contexto: c`Completa el análisis normativo y ético de tu Proyecto Final. Este documento forma parte de la memoria y se valora en el criterio de cumplimiento normativo y ética del tribunal.`,
    requisitos: [
      c`Análisis de cumplimiento: Reglamento de IA (riesgo, rol, obligaciones), RGPD (datos, bases jurídicas, encargados, transferencias) y licencias.`,
      'Métricas por grupo o análisis de sesgos adecuado a tu sistema, con mitigaciones.',
      'Explicabilidad: cómo se explican las salidas a los usuarios.',
      'Auditoría básica de accesibilidad y estimación del impacto energético.',
      'Ficha de transparencia completa y vídeo de defensa de 5 minutos.'
    ],
    entregables: [
      c`<code>docs/cumplimiento.md</code> y <code>docs/ficha-transparencia.md</code> en el repositorio del PFM`,
      'Enlace al vídeo de defensa (5 min)'
    ],
    rubrica: [
      ['Análisis normativo', 35],
      ['Sesgos, explicabilidad, accesibilidad y sostenibilidad', 30],
      ['Ficha de transparencia', 20],
      ['Vídeo de defensa', 15]
    ]
  },
  faq: [
    [
      'Mi sistema no trata con personas. ¿Tengo que analizar sesgos?',
      c`Analiza al menos si el rendimiento cambia según el tipo de dato de entrada (idioma, calidad de imagen, tipo de documento) y quién usa el sistema. Los sesgos no solo afectan a decisiones sobre personas, también a quién recibe un peor servicio.`
    ],
    [
      '¿Quitar la variable sensible elimina el sesgo?',
      c`No necesariamente: otras variables pueden actuar como sustitutos. Por eso se mide el resultado por grupo, no solo qué variables entran al modelo.`
    ],
    [
      '¿Cómo explico las respuestas de un LLM?',
      c`Con citas a las fuentes (RAG), mostrando las acciones de un agente, registrando prompts y versiones de modelo para auditoría, y documentando limitaciones conocidas en la ficha de transparencia.`
    ],
    [
      '¿Es fiable la estimación de CodeCarbon?',
      c`Es una estimación basada en el hardware y la región, suficiente para comparar alternativas y tomar decisiones de diseño. Para modelos de terceros en la nube, usa las cifras que publique el proveedor o estimaciones razonadas e indícalo.`
    ]
  ]
});
