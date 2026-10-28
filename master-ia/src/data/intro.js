// MÓDULO INTRODUCTORIO · Sesión 0: bases de la Inteligencia Artificial y hoja de ruta del Máster

SESIONES.push({
  n: 0,
  corto: 'Bases de la IA y hoja de ruta',
  titulo: 'Introducción a la Inteligencia Artificial y Hoja de Ruta del Máster',
  duracion: '4 h',
  resumen: c`Qué es (y qué no es) la IA, cómo aprende una máquina, qué es un LLM explicado para un desarrollador, las cuatro formas de construir software con IA y el mapa completo de lo que vas a construir en los 7 módulos y el TFM. Terminas la sesión con el entorno instalado y tu primera llamada a un modelo en local, en Python y en Java 21.`,
  stack: ['Git', 'VS Code', 'IntelliJ IDEA', 'Python 3.12 + uv', 'JDK 21', 'Docker Desktop', 'Ollama', 'scikit-learn'],
  teoria: {
    intro: c`Antes de entrar en tensores, RAG o agentes conviene tener un <strong>mapa</strong>. Esta sesión ordena los conceptos que vas a oír durante todo el Máster (IA, machine learning, deep learning, IA generativa, LLM, agente…), explica con analogías de programador cómo aprende un modelo y te enseña qué vas a construir, módulo a módulo, hasta defender tu Trabajo Fin de Máster.`,
    bloques: [
      ['1. ¿Qué es la Inteligencia Artificial?', c`<p>Es la disciplina que construye sistemas capaces de realizar tareas que asociamos a la inteligencia humana: percibir, entender lenguaje, razonar, predecir o decidir. El Reglamento Europeo de IA (art. 3) define un <strong>sistema de IA</strong> como un sistema basado en máquinas que, con cierto grado de autonomía, <em>infiere</em> a partir de las entradas que recibe cómo generar salidas (predicciones, contenidos, recomendaciones o decisiones) que pueden influir en entornos físicos o virtuales.</p>
<p>La diferencia clave con el software que ya programas: en el software clásico <strong>tú escribes las reglas</strong>; en el aprendizaje automático <strong>el sistema aprende las reglas a partir de datos</strong>.</p>`],
      ['2. Software clásico frente a aprendizaje automático', c`<ul>
<li><strong>Clásico:</strong> <code>reglas + datos → resultados</code>. Ejemplo: un método <code>esDniValido()</code> con el algoritmo de la letra.</li>
<li><strong>Machine Learning:</strong> <code>datos + resultados esperados → reglas (modelo)</code>. Ejemplo: a partir de miles de correos etiquetados, aprender a detectar spam, algo que no sabrías escribir con <code>if</code>.</li>
<li><strong>Una vez entrenado</strong>, el modelo se usa como una función más: <code>modelo.predecir(entrada)</code>. A eso se le llama <strong>inferencia</strong>, y es lo que tus aplicaciones harán en producción.</li>
</ul>`],
      ['3. Las capas de la IA', c`<p>Piensa en círculos concéntricos:</p>
<ul>
<li><strong>Inteligencia Artificial</strong>: todo el campo, incluidas reglas y búsqueda (sistemas expertos, el ajedrez clásico).</li>
<li><strong>Machine Learning</strong>: modelos que aprenden de datos (regresión, árboles, gradient boosting). Sesión 2.</li>
<li><strong>Deep Learning</strong>: redes neuronales de muchas capas que aprenden representaciones por sí mismas (visión, voz, texto). Sesión 3.</li>
<li><strong>IA Generativa y LLMs</strong>: modelos que generan texto, código, imágenes o audio nuevos. La mayor parte del Máster trabaja aquí, desde la Sesión 4.</li>
</ul>`],
      ['4. Cómo aprende una máquina (en cuatro piezas)', c`<p>Todo entrenamiento, desde una regresión hasta un LLM, combina las mismas piezas:</p>
<ul>
<li><strong>Datos</strong>: ejemplos de entrada (y, si hay, la salida esperada).</li>
<li><strong>Modelo</strong>: una función con parámetros ajustables (de unos pocos a cientos de miles de millones).</li>
<li><strong>Función de pérdida</strong>: un número que mide cuánto se equivoca el modelo.</li>
<li><strong>Optimizador</strong>: el algoritmo que ajusta los parámetros para reducir la pérdida, poco a poco (descenso del gradiente).</li>
</ul>
<p>Tipos de aprendizaje: <strong>supervisado</strong> (con etiquetas: spam / no spam), <strong>no supervisado</strong> (agrupar alumnado por patrones sin etiquetas), <strong>por refuerzo</strong> (aprender por recompensas) y <strong>autosupervisado</strong> (el propio texto genera la etiqueta: predecir la siguiente palabra), que es como se preentrenan los LLMs.</p>`],
      ['5. Qué es un LLM, explicado para un desarrollador', c`<ul>
<li>Un LLM es una red neuronal (Transformer) entrenada para <strong>predecir el siguiente token</strong> (trozo de palabra) dado todo el texto anterior.</li>
<li>Entrenado con enormes cantidades de texto y código, esa tarea simple obliga al modelo a capturar gramática, conocimiento del mundo, estilos de programación y patrones de razonamiento.</li>
<li>Después se ajusta para seguir instrucciones y comportarse como asistente (ajuste fino y alineamiento, Sesiones 17-18).</li>
<li>Tiene una <strong>ventana de contexto</strong>: lo que "ve" en cada llamada. No recuerda nada entre llamadas salvo lo que tú le vuelvas a enviar.</li>
<li><strong>No es una base de datos</strong>: puede equivocarse con total seguridad (alucinaciones). Por eso le daremos tus datos con RAG y mediremos su calidad.</li>
</ul>`],
      ['6. Las cuatro formas de construir software con IA', c`<p>Este es el hilo conductor del Máster. De menor a mayor complejidad:</p>
<ul>
<li><strong>Prompting e integración</strong>: llamar a un modelo con buenas instrucciones y salidas estructuradas desde Python o Java (Módulo 1).</li>
<li><strong>RAG</strong>: darle al modelo tus documentos para que responda con datos tuyos y citables (Módulo 2).</li>
<li><strong>Agentes</strong>: el modelo decide qué herramientas usar en bucle para conseguir un objetivo (Módulo 3).</li>
<li><strong>Fine-tuning</strong>: modificar el propio modelo para una tarea o estilo concretos, o llevarlo a un móvil (Módulo 4).</li>
</ul>
<p>Y todo ello <strong>medido, desplegado y gobernado</strong> (Módulo 5) y aplicado en tu TFM (Módulo 6). Regla de oro: elige siempre la forma más sencilla que resuelva el problema.</p>`],
      ['7. Tu perfil: de desarrollador DAM a ingeniero de IA', c`<p>Un <strong>ingeniero de IA</strong> no es (principalmente) un investigador que inventa modelos: es quien los convierte en productos fiables. Para eso ya tienes lo más difícil de enseñar: programar bien, diseñar APIs, trabajar con bases de datos, Git y arquitectura limpia. El Máster añade lo que te falta: fundamentos matemáticos aplicados, el ecosistema Python científico, el comportamiento de los LLMs, evaluación y operación.</p>`],
      ['8. IA responsable desde el primer día', c`<p>Trabajarás con datos y sistemas que afectan a personas. Desde esta sesión aplicamos tres reglas: <strong>nunca datos personales reales sin anonimizar</strong> en prácticas (usaremos datos sintéticos), <strong>respetar las licencias</strong> de modelos y datasets y <strong>verificar siempre</strong> la salida de un modelo antes de usarla. El RGPD/LOPDGDD y el Reglamento Europeo de IA (EU AI Act) se tratan en profundidad en la Sesión 23 y en el TFM.</p>`],
      ['9. Glosario mínimo', c`<div class="tbl-wrap"><table class="tbl"><tbody>
<tr><th>Modelo</th><td>Función con parámetros aprendidos a partir de datos.</td></tr>
<tr><th>Parámetros (pesos)</th><td>Los números que el entrenamiento ajusta. "8B" = 8 000 millones.</td></tr>
<tr><th>Entrenamiento / inferencia</th><td>Aprender los parámetros / usar el modelo ya entrenado.</td></tr>
<tr><th>Token</th><td>Unidad de texto que procesa un LLM (≈ ¾ de palabra). Coste y límites se miden en tokens.</td></tr>
<tr><th>Prompt</th><td>Instrucciones y contexto que envías al modelo.</td></tr>
<tr><th>Embedding</th><td>Vector de números que representa el significado de un texto. Base de la búsqueda semántica.</td></tr>
<tr><th>RAG</th><td>Recuperar documentos relevantes y dárselos al modelo para que responda con ellos.</td></tr>
<tr><th>Agente</th><td>Sistema en el que el modelo decide qué acciones (herramientas) ejecutar en bucle.</td></tr>
<tr><th>Fine-tuning</th><td>Reentrenar parcialmente un modelo con tus propios ejemplos.</td></tr>
<tr><th>Alucinación</th><td>Respuesta plausible pero falsa generada por el modelo.</td></tr>
<tr><th>Pesos abiertos</th><td>Modelos descargables (Llama, Qwen, DeepSeek…) que puedes ejecutar en tu propio equipo.</td></tr>
</tbody></table></div>`]
    ],
    flujoTitulo: 'El ciclo de vida de un sistema de IA (y el orden del Máster)',
    flujo: ['Fundamentos (M0)', 'Integrar modelos (M1)', 'Darles tus datos: RAG (M2)', 'Darles autonomía: agentes (M3)', 'Adaptarlos: fine-tuning y edge (M4)', 'Medir, desplegar y proteger (M5)', 'TFM ante Tribunal (M6)'],
    tabla: {
      cap: 'Hoja de ruta: qué vas a construir en cada módulo',
      head: ['Módulo', 'Sesiones', 'Pregunta que responde', 'Lo que construirás'],
      rows: [
        ['<strong>Introducción</strong>', '0', '¿Qué es la IA y cómo está organizado el Máster?', 'Entorno de trabajo y primera llamada a un LLM local en Python y Java'],
        ['<strong>M0 · Fundamentos</strong>', '1–4', '¿Cómo funcionan por dentro los modelos?', 'Motor de similitud vectorizado, API de predicción con XGBoost, red neuronal en PyTorch y un mini-GPT propio'],
        ['<strong>M1 · Backend IA</strong>', '5–8', '¿Cómo integro LLMs en mis aplicaciones?', 'Pasarela multi-proveedor con streaming, microservicio Spring AI, asistente con herramientas y SQL seguro, servidor de IA soberano'],
        ['<strong>M2 · RAG</strong>', '9–12', '¿Cómo hago que responda con mis datos?', 'Buscador semántico del currículo DAM, asistente normativo con citas, grafo de conocimiento y RAG sobre documentos con imágenes'],
        ['<strong>M3 · Agentes</strong>', '13–16', '¿Cómo le doy autonomía de forma segura?', 'Tutor con memoria, sistema multi-agente con aprobación docente, servidor MCP del centro y agente de QA con Playwright'],
        ['<strong>M4 · Fine-tuning y Edge AI</strong>', '17–20', '¿Cómo adapto un modelo y lo llevo al dispositivo?', 'Modelo ajustado con QLoRA, modelo pequeño destilado, app Android offline y asistente de voz'],
        ['<strong>M5 · LLMOps y seguridad</strong>', '21–23', '¿Cómo lo mido, despliego y protejo?', 'Evaluación continua en CI, plataforma desplegable con pasarela de modelos y auditoría de seguridad y EU AI Act'],
        ['<strong>M6 · TFM</strong>', '24–28', '¿Sé construir un sistema completo de principio a fin?', 'Tu propio sistema de IA: anteproyecto, desarrollo, pruebas, despliegue y defensa ante Tribunal']
      ]
    },
    claves: [
      'Software clásico: tú escribes las reglas. Machine learning: el sistema las aprende de los datos.',
      'Un LLM predice el siguiente token: es muy capaz, pero no verifica hechos ni recuerda entre llamadas.',
      'Cuatro formas de construir con IA: prompting, RAG, agentes y fine-tuning. Empieza siempre por la más sencilla.',
      'Cada sesión tiene la misma estructura: Teoría, Taller, Biblioteca de Prompts, Actividad evaluable y Preguntas frecuentes.',
      'Evaluación: una actividad por sesión (repositorio Git) y un TFM defendido ante Tribunal para obtener el Título Propio de Máster.'
    ]
  },
  taller: {
    entorno: 'Windows 11 · PowerShell 7 · winget. En macOS/Linux se usan los equivalentes (brew, apt). El laboratorio completo está en <code>master-ia/labs/sesion-00</code> del repositorio.',
    pasos: [
      { t: 'Instalar las herramientas del Máster', d: 'Una sola vez. Todas son gratuitas. Si ya tienes alguna, winget la omitirá o la actualizará.', lang: 'powershell', file: 'PowerShell (como usuario)', code: c`
winget install --id Git.Git -e
winget install --id Microsoft.VisualStudioCode -e
winget install --id JetBrains.IntelliJIDEA.Community -e
winget install --id EclipseAdoptium.Temurin.21.JDK -e
winget install --id Docker.DockerDesktop -e
winget install --id Ollama.Ollama -e
winget install --id OpenJS.NodeJS.LTS -e
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Cierra y vuelve a abrir la terminal para que se actualice el PATH
uv python install 3.12
code --install-extension ms-python.python
code --install-extension ms-toolsai.jupyter` },
      { t: 'Clonar el laboratorio y comprobar el entorno', d: 'El script <code>verificar_entorno.py</code> comprueba versiones, GPU disponible, Docker y Ollama, y te dice qué falta.', lang: 'powershell', file: 'PowerShell', code: c`
git clone <url-del-repositorio-del-master> master-ia-jro
cd master-ia-jro/master-ia/labs/sesion-00
uv sync
uv run python verificar_entorno.py` },
      { t: 'Tu primer modelo de machine learning (10 líneas útiles)', d: 'Antes de los LLMs, el ciclo completo de ML: datos → entrenamiento → evaluación → predicción. Usamos un dataset sintético de alumnado de FP (nunca datos reales).', lang: 'python', file: 'labs/sesion-00/primer_modelo.py', code: c`
"""Sesión 0 · Tu primer modelo de machine learning.

Ciclo completo: datos -> entrenamiento -> evaluación -> inferencia.
Ejecuta: uv run python primer_modelo.py
"""

from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier, export_text

from datos_sinteticos import generar_alumnado


def entrenar(semilla: int = 42) -> tuple[DecisionTreeClassifier, float, list[str]]:
    X, y, columnas = generar_alumnado(n=1000, semilla=semilla)       # datos + resultado esperado
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=semilla, stratify=y)

    modelo = DecisionTreeClassifier(max_depth=3, random_state=semilla)  # el modelo
    modelo.fit(X_train, y_train)                                       # entrenamiento
    return modelo, modelo.score(X_test, y_test), columnas              # evaluación con datos no vistos


if __name__ == "__main__":
    modelo, exactitud, columnas = entrenar()
    print(f"Exactitud con datos nunca vistos: {exactitud:.1%}")
    print("\nReglas aprendidas (¡no las hemos escrito nosotros!):")
    print(export_text(modelo, feature_names=columnas))

    nueva = [[7.5, 2, 10, 1]]  # nota 7,5 · 2 faltas · 10 h de estudio · trabaja
    print("Alumno nuevo -> ¿promociona?", "sí" if modelo.predict(nueva)[0] == 1 else "no")
    print(f"Probabilidad estimada: {modelo.predict_proba(nueva)[0][1]:.0%}")
` },
      { t: 'Tu primer LLM en local con Ollama (sin claves ni coste)', d: 'Un modelo pequeño de pesos abiertos se ejecuta en tu propio equipo. Nada sale de tu ordenador.', lang: 'powershell', file: 'PowerShell', code: c`
ollama pull qwen2.5:1.5b          # ~1 GB; funciona en CPU
ollama run qwen2.5:1.5b "Explica en 3 frases qué es un token"
uv run python hola_ia_local.py` },
      { t: 'Hola IA desde Python', d: 'Ollama expone una API compatible con OpenAI en <code>/v1</code>. El mismo código servirá más adelante para modelos en la nube y en servidores propios.', lang: 'python', file: 'labs/sesion-00/hola_ia_local.py', code: c`
"""Sesión 0 · Primera llamada a un LLM local (Ollama), sin claves ni coste.

Requisitos: Ollama en ejecución y el modelo descargado (ollama pull qwen2.5:1.5b).
Ejecuta: uv run python hola_ia_local.py ["tu pregunta"]
"""

import os
import sys
import time

from openai import APIConnectionError, OpenAI

URL = os.environ.get("OLLAMA_URL", "http://localhost:11434") + "/v1"
MODELO = os.environ.get("MODELO_LOCAL", "qwen2.5:1.5b")
SISTEMA = "Eres un tutor de IA. Responde en español, en menos de 120 palabras."


def preguntar(pregunta: str) -> None:
    cliente = OpenAI(base_url=URL, api_key="ollama")   # Ollama ignora la clave
    inicio = time.perf_counter()
    respuesta = cliente.chat.completions.create(
        model=MODELO,
        messages=[{"role": "system", "content": SISTEMA}, {"role": "user", "content": pregunta}],
    )
    segundos = time.perf_counter() - inicio
    print(respuesta.choices[0].message.content)
    print(f"\n[{MODELO}] {respuesta.usage.prompt_tokens} tokens de entrada, "
          f"{respuesta.usage.completion_tokens} de salida, {segundos:.1f} s")


if __name__ == "__main__":
    texto = " ".join(sys.argv[1:]) or "Soy titulado en DAM. Explícame con una analogía de programación qué es un LLM."
    try:
        preguntar(texto)
    except APIConnectionError:
        sys.exit(f"No hay conexión con Ollama en {URL}. ¿Está arrancado? Prueba: ollama run {MODELO}")
` },
      { t: 'Hola IA desde Java 21 (sin dependencias)', d: 'Un único fichero ejecutable con <code>java HolaIA.java</code>: <code>HttpClient</code>, <code>record</code>, text blocks y <code>switch</code> con flechas. En Windows, añade <code>-Dstdout.encoding=UTF-8</code> si las tildes salen mal. En la Sesión 6 lo haremos con Spring AI.', lang: 'java', file: 'labs/sesion-00/java/HolaIA.java', code: c`
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Sesión 0 · Primera llamada a un LLM local (Ollama) desde Java 21, sin dependencias.
 * Ejecuta: java HolaIA.java "tu pregunta"
 */
public class HolaIA {

    record Peticion(String modelo, String sistema, String pregunta) {
        String json() {
            return """
                {"model": "%s", "stream": false, "messages": [
                  {"role": "system", "content": "%s"},
                  {"role": "user", "content": "%s"}]}
                """.formatted(escapar(modelo), escapar(sistema), escapar(pregunta));
        }
    }

    static String escapar(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
    }

    /** Extrae el texto de "message.content" de la respuesta de /api/chat (en la Sesión 6 usaremos Jackson). */
    static String contenido(String json) {
        int clave = json.indexOf("\"content\"");
        if (clave < 0) throw new IllegalStateException("Respuesta inesperada: " + json);
        int i = json.indexOf('"', json.indexOf(':', clave) + 1) + 1;
        var sb = new StringBuilder();
        for (; i < json.length() && json.charAt(i) != '"'; i++) {
            char c = json.charAt(i);
            if (c != '\\') { sb.append(c); continue; }
            char e = json.charAt(++i);
            switch (e) {
                case 'n' -> sb.append('\n');
                case 't' -> sb.append('\t');
                case 'u' -> { sb.append((char) Integer.parseInt(json.substring(i + 1, i + 5), 16)); i += 4; }
                default -> sb.append(e);      // \" \\ \/
            }
        }
        return sb.toString();
    }

    public static void main(String[] args) throws Exception {
        var url = System.getenv().getOrDefault("OLLAMA_URL", "http://localhost:11434") + "/api/chat";
        var modelo = System.getenv().getOrDefault("MODELO_LOCAL", "qwen2.5:1.5b");
        var peticion = new Peticion(modelo, "Eres un tutor de IA. Responde en español en 3 frases.",
                args.length > 0 ? String.join(" ", args) : "¿Qué diferencia hay entre entrenamiento e inferencia?");

        try (var http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build()) {
            var req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofMinutes(2))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(peticion.json()))
                    .build();
            long inicio = System.nanoTime();
            var resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                System.err.println("Ollama respondió " + resp.statusCode() + ": " + resp.body());
                System.exit(1);
            }
            System.out.println(contenido(resp.body()));
            System.out.printf("%n[%s] %.1f s%n", modelo, (System.nanoTime() - inicio) / 1e9);
        } catch (java.net.ConnectException e) {
            System.err.println("No hay conexión con Ollama en " + url + ". ¿Está arrancado?");
            System.exit(1);
        }
    }
}
` },
      { t: 'Opcional: el mismo saludo con un modelo de frontera (Claude)', d: 'Requiere una clave de API en la variable de entorno <code>ANTHROPIC_API_KEY</code>. Compara calidad, latencia y coste con el modelo local: lo analizarás en la actividad.', lang: 'python', file: 'labs/sesion-00/hola_ia_claude.py', code: c`
"""Sesión 0 (opcional) · La misma pregunta a un modelo de frontera (Claude).

Requisitos: variable de entorno ANTHROPIC_API_KEY.
Ejecuta: uv run python hola_ia_claude.py ["tu pregunta"]
"""

import sys
import time

import anthropic

SISTEMA = "Eres un tutor de IA. Responde en español, en menos de 120 palabras."


def preguntar(pregunta: str) -> None:
    cliente = anthropic.Anthropic()   # lee ANTHROPIC_API_KEY del entorno
    inicio = time.perf_counter()
    respuesta = cliente.messages.create(
        model="claude-opus-5-5",
        max_tokens=1000,
        output_config={"effort": "low"},   # tarea sencilla: menos razonamiento, más rápido y barato
        system=SISTEMA,
        messages=[{"role": "user", "content": pregunta}],
    )
    segundos = time.perf_counter() - inicio
    if respuesta.stop_reason == "refusal":
        print("El modelo ha declinado la petición.")
    else:
        print("".join(b.text for b in respuesta.content if b.type == "text"))
    u = respuesta.usage
    print(f"\n[{respuesta.model}] {u.input_tokens} tokens de entrada, {u.output_tokens} de salida, {segundos:.1f} s")


if __name__ == "__main__":
    texto = " ".join(sys.argv[1:]) or "Soy titulado en DAM. Explícame con una analogía de programación qué es un LLM."
    try:
        preguntar(texto)
    except anthropic.AuthenticationError:
        sys.exit("Falta una clave válida en ANTHROPIC_API_KEY.")
    except anthropic.APIConnectionError:
        sys.exit("No hay conexión con la API de Anthropic.")
` }
    ]
  },
  prompts: [
    { t: 'Anatomía de un buen prompt', tipo: 'Plantilla', lang: 'markdown', d: 'Las seis piezas que usaremos durante todo el Máster. No todas son obligatorias, pero conviene pensar en cada una.', code: c`
<rol>Quién es el modelo en esta conversación.</rol>
<contexto>Información que necesita y no tiene: público, datos, situación.</contexto>
<tarea>Qué tiene que hacer, con un verbo claro.</tarea>
<formato>Cómo quieres la respuesta: extensión, estructura, lenguaje.</formato>
<restricciones>Qué no debe hacer o qué hacer si le falta información.</restricciones>
<ejemplos>Uno o dos ejemplos de entrada y salida, si el formato es delicado.</ejemplos>` },
    { t: 'Tutor personal del Máster', tipo: 'System Prompt', lang: 'markdown', code: c`
Eres mi tutor del Máster en Ingeniería de IA. Soy titulado en DAM: programo en Java 21,
Kotlin, Python y SQL, conozco APIs REST, Git y arquitectura limpia, pero soy nuevo en IA.

Cuando te pregunte un concepto:
1. Explícalo en 3-5 frases con una analogía de programación (Java, bases de datos, APIs).
2. Añade un ejemplo mínimo de código en Python o Java 21.
3. Termina con una pregunta corta para comprobar si lo he entendido.

Si un término depende de otro que aún no conozco, explícame primero ese.
Si no estás seguro de algo (versiones, nombres de métodos), dilo claramente.` },
    { t: 'Diagnóstico inicial de conocimientos', tipo: 'Prompt de autoevaluación', lang: 'markdown', code: c`
Hazme un diagnóstico de nivel antes de empezar el Máster de IA.
Pregúntame de una en una 10 preguntas cortas, de dificultad creciente, sobre:
Python (2), álgebra lineal aplicada (2), estadística básica (2), machine learning (2)
y LLMs (2). Espera mi respuesta antes de seguir.
Al final, dame una tabla con cada área, mi nivel (bajo/medio/alto) y qué sesiones del
Máster debo repasar con más atención (Sesiones 1-4 de fundamentos, 5-8 de LLMs).` },
    { t: 'Reglas del portafolio para asistentes de código', tipo: 'CLAUDE.md', lang: 'markdown', file: 'mia-portafolio/CLAUDE.md', code: c`
# Portafolio del Máster en Ingeniería de IA (FP José Ramón Otero)

## Estructura
- sesion-XX/ : una carpeta por sesión con su README de resultados.
- Python con uv (uv sync / uv run). Java 21 con Maven o ficheros únicos (java Fichero.java).

## Reglas
- Nunca datos personales reales: solo datos sintéticos generados en el propio repositorio.
- Las claves de API van en variables de entorno, nunca en el código ni en .env versionado.
- Cada actividad incluye: cómo ejecutarla, resultados obtenidos y qué he aprendido.
- Explícame los cambios que propongas: estoy aprendiendo, no solo entregando.` }
  ],
  actividad: {
    titulo: 'Portafolio del Máster, entorno verificado y primer contacto con modelos',
    contexto: c`Prepara el repositorio donde entregarás todas las actividades del Máster, demuestra que tu entorno funciona y realiza una primera comparación crítica entre un modelo local y uno de frontera. Es la base sobre la que se apoyan las 28 sesiones.`,
    requisitos: [
      'Repositorio <code>mia-portafolio</code> con un README de presentación (tu perfil DAM y tus objetivos en el Máster), <code>.gitignore</code> y <code>CLAUDE.md</code>.',
      'Salida de <code>verificar_entorno.py</code> con todas las comprobaciones obligatorias en verde (la GPU es opcional).',
      'Ejecución de <code>primer_modelo.py</code>: explica con tus palabras las reglas que ha aprendido el árbol y por qué la exactitud no es del 100 %.',
      'Primera llamada a un LLM local desde Python <em>y</em> desde Java 21.',
      'Comparativa de 5 preguntas técnicas respondidas por un modelo local y uno de frontera (o dos modelos locales de distinto tamaño): calidad, latencia y tokens.',
      'Mapa conceptual (imagen o Mermaid) de IA → ML → DL → IA generativa y tres ideas iniciales de TFM.'
    ],
    entregables: ['URL del repositorio <code>mia-portafolio</code>', '<code>sesion-00/README.md</code> con resultados, comparativa y reflexión', '<code>sesion-00/mapa.md</code> con el mapa conceptual y las ideas de TFM'],
    rubrica: [['Entorno completo y verificado', 25], ['Primer modelo de ML explicado', 20], ['LLM local desde Python y Java', 25], ['Comparativa crítica de modelos', 20], ['Mapa conceptual e ideas de TFM', 10]]
  },
  faq: [
    ['¿Necesito saber muchas matemáticas?', c`Necesitas intuición, no demostraciones. En el Módulo 0 repasamos lo imprescindible (vectores, matrices, derivadas como "sensibilidad", probabilidad básica) siempre con código. Si programas bucles, arrays y funciones, puedes seguir el Máster.`],
    ['¿Necesito un ordenador potente o una GPU?', c`No para empezar. Con 16 GB de RAM puedes ejecutar modelos locales pequeños y seguir casi todo el Máster. Para las sesiones de entrenamiento (17-18) usaremos GPU gratuitas en la nube (Google Colab o Kaggle). Una GPU NVIDIA de 8 GB o más, o un Mac con Apple Silicon, ayuda pero no es obligatoria.`],
    ['¿Tendré que pagar por usar modelos en la nube?', c`Las prácticas obligatorias se pueden hacer con modelos locales gratuitos (Ollama). Los modelos de frontera (Claude, Gemini…) se usan en algunos talleres y su coste en las prácticas es bajo; aprenderás a controlarlo con caché, modelos adecuados a cada tarea y presupuestos.`],
    ['¿Python o Java?', c`Los dos. Python domina el entrenamiento y el ecosistema de investigación; Java 21 domina muchos backends empresariales. Un perfil que integra IA en ambos lenguajes es muy valorado, y es exactamente lo que vas a practicar.`],
    ['¿La IA va a sustituir a los programadores?', c`Está cambiando cómo se programa: los asistentes de código ya escriben una parte importante del código rutinario. Lo que gana valor es saber diseñar sistemas, evaluar si lo que genera un modelo es correcto y seguro, e integrar IA en productos reales. Ese es el perfil que forma este Máster.`],
    ['¿Cómo se evalúa el Máster?', c`Cada sesión tiene una actividad práctica evaluable que entregas como repositorio Git y valida el Director del Máster. Al final, el TFM se defiende ante Tribunal; con acta APTA y calificación igual o superior a 5 se emite el Título Propio de Máster.`]
  ]
});
