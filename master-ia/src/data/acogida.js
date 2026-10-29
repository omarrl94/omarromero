// ACOGIDA · Semana 1: bases de la IA, hoja de ruta y prueba de nivel (Sesión 0)

SESIONES.push({
  n: 0,
  semana: '1',
  fechas: '1 oct 2029',
  corto: 'Acogida, bases de la IA y hoja de ruta',
  titulo: 'Acogida: Bases de la Inteligencia Artificial y Hoja de Ruta del Máster',
  duracion: 'Semana 1 · acogida online',
  resumen: c`Acogida online y prueba de nivel. Qué es (y qué no es) la IA, cómo aprende una máquina, qué es un LLM explicado para un desarrollador DAM, las cuatro formas de construir aplicaciones con IA y el mapa de las 15 semanas: 7 módulos, 5 seminarios con empresas, 3 jornadas presenciales y el Proyecto Final de Máster. Terminas con el entorno instalado y tu primera llamada a un modelo local en Python y Java 21.`,
  stack: [
    'Git',
    'VS Code',
    'IntelliJ IDEA',
    'Python 3.12 + uv',
    'JDK 21',
    'Docker Desktop',
    'Ollama',
    'scikit-learn'
  ],
  teoria: {
    intro: c`Bienvenida al <strong>Máster en Inteligencia Artificial Aplicada al Desarrollo de Aplicaciones Multiplataforma</strong> (título propio del centro, sin carácter oficial, 300 horas). Antes de entrar en módulos conviene tener un <strong>mapa</strong>: esta acogida ordena los conceptos que oirás durante todo el programa, explica con analogías de programador cómo aprende un modelo y te enseña qué vas a construir, semana a semana, hasta defender tu Proyecto Final.`,
    bloques: [
      [
        '1. ¿Qué es la Inteligencia Artificial?',
        c`<p>Es la disciplina que construye sistemas capaces de realizar tareas que asociamos a la inteligencia humana: percibir, entender lenguaje, razonar, predecir o decidir. El Reglamento Europeo de IA (art. 3) define un <strong>sistema de IA</strong> como un sistema basado en máquinas que, con cierto grado de autonomía, <em>infiere</em> a partir de las entradas que recibe cómo generar salidas (predicciones, contenidos, recomendaciones o decisiones) que pueden influir en entornos físicos o virtuales.</p>
<p>La diferencia clave con el software que ya programas: en el software clásico <strong>tú escribes las reglas</strong>; en el aprendizaje automático <strong>el sistema aprende las reglas a partir de datos</strong>.</p>`
      ],
      [
        '2. Software clásico frente a aprendizaje automático',
        c`<ul>
<li><strong>Clásico:</strong> <code>reglas + datos → resultados</code>. Ejemplo: un método <code>esDniValido()</code> con el algoritmo de la letra.</li>
<li><strong>Machine Learning:</strong> <code>datos + resultados esperados → reglas (modelo)</code>. Ejemplo: a partir de miles de correos etiquetados, aprender a detectar spam, algo que no sabrías escribir con <code>if</code>.</li>
<li><strong>Una vez entrenado</strong>, el modelo se usa como una función más: <code>modelo.predecir(entrada)</code>. A eso se le llama <strong>inferencia</strong>, y es lo que tus aplicaciones harán en producción.</li>
</ul>`
      ],
      [
        '3. Las capas de la IA',
        c`<p>Piensa en círculos concéntricos:</p>
<ul>
<li><strong>Inteligencia Artificial</strong>: todo el campo, incluidas reglas y búsqueda (sistemas expertos, el ajedrez clásico).</li>
<li><strong>Machine Learning</strong>: modelos que aprenden de datos (regresión, árboles, gradient boosting). M2, semana 3.</li>
<li><strong>Deep Learning</strong>: redes neuronales de muchas capas que aprenden representaciones por sí mismas (visión, voz, texto). M2, semana 4.</li>
<li><strong>IA Generativa y LLMs</strong>: modelos que generan texto, código, imágenes o audio nuevos. La mayor parte del Máster trabaja aquí, desde M3 (semana 5).</li>
</ul>`
      ],
      [
        '4. Cómo aprende una máquina (en cuatro piezas)',
        c`<p>Todo entrenamiento, desde una regresión hasta un LLM, combina las mismas piezas:</p>
<ul>
<li><strong>Datos</strong>: ejemplos de entrada (y, si hay, la salida esperada).</li>
<li><strong>Modelo</strong>: una función con parámetros ajustables (de unos pocos a cientos de miles de millones).</li>
<li><strong>Función de pérdida</strong>: un número que mide cuánto se equivoca el modelo.</li>
<li><strong>Optimizador</strong>: el algoritmo que ajusta los parámetros para reducir la pérdida, poco a poco (descenso del gradiente).</li>
</ul>
<p>Tipos de aprendizaje: <strong>supervisado</strong> (con etiquetas: spam / no spam), <strong>no supervisado</strong> (agrupar alumnado por patrones sin etiquetas), <strong>por refuerzo</strong> (aprender por recompensas) y <strong>autosupervisado</strong> (el propio texto genera la etiqueta: predecir la siguiente palabra), que es como se preentrenan los LLMs.</p>`
      ],
      [
        '5. Qué es un LLM, explicado para un desarrollador',
        c`<ul>
<li>Un LLM es una red neuronal (Transformer) entrenada para <strong>predecir el siguiente token</strong> (trozo de palabra) dado todo el texto anterior.</li>
<li>Entrenado con enormes cantidades de texto y código, esa tarea simple obliga al modelo a capturar gramática, conocimiento del mundo, estilos de programación y patrones de razonamiento.</li>
<li>Después se ajusta para seguir instrucciones y comportarse como asistente (ajuste fino y alineamiento).</li>
<li>Tiene una <strong>ventana de contexto</strong>: lo que "ve" en cada llamada. No recuerda nada entre llamadas salvo lo que tú le vuelvas a enviar.</li>
<li><strong>No es una base de datos</strong>: puede equivocarse con total seguridad (alucinaciones). Por eso le daremos tus datos con RAG y mediremos su calidad.</li>
</ul>`
      ],
      [
        '6. Las cuatro formas de construir aplicaciones con IA',
        c`<p>Este es el hilo conductor del Máster. De menor a mayor complejidad:</p>
<ul>
<li><strong>Integrar modelos</strong> con buenas instrucciones, salidas estructuradas y llamada a funciones desde Python, Java o Kotlin (M3).</li>
<li><strong>RAG</strong>: darle al modelo los documentos de una empresa para que responda con datos citables (M4).</li>
<li><strong>Agentes</strong>: el modelo decide qué herramientas usar para automatizar un proceso (M5).</li>
<li><strong>Modelos propios y en el dispositivo</strong>: entrenar modelos de ML y redes neuronales (M2) y ejecutarlos dentro de la app Android, Flutter o de escritorio (M6).</li>
</ul>
<p>Todo ello programado con asistentes de IA de forma crítica (M1), <strong>desplegado y monitorizado</strong> (M6), conforme a la normativa (M7) y aplicado en tu Proyecto Final con una empresa colaboradora. Regla de oro: elige siempre la forma más sencilla que resuelva el problema.</p>`
      ],
      [
        '7. Tu perfil: de técnico DAM a desarrollador de aplicaciones con IA',
        c`<p>Un <strong>ingeniero de IA</strong> no es (principalmente) un investigador que inventa modelos: es quien los convierte en productos fiables. Para eso ya tienes lo más difícil de enseñar: programar bien, diseñar APIs, trabajar con bases de datos, Git y arquitectura limpia. El Máster añade lo que te falta: fundamentos matemáticos aplicados, el ecosistema Python científico, el comportamiento de los LLMs, evaluación y operación.</p>`
      ],
      [
        '8. Cómo se cursa y cómo se evalúa',
        c`<ul>
<li><strong>Plataforma online</strong> (unas 20 h semanales): teoría, taller guiado, biblioteca de prompts, una actividad cada semana y preguntas frecuentes.</li>
<li><strong>Tutor asignado</strong>: corrige cada proyecto, responde en el foro en menos de 48 h y hace dos tutorías individuales (inicio y mitad del curso). Tutoría grupal online semanal de 1 h.</li>
<li><strong>Cinco seminarios online con empresas</strong> (jueves de 18:00 a 20:00) y <strong>tres jornadas presenciales</strong> (sábados de 9:30 a 14:30) con examen.</li>
<li><strong>Cada módulo</strong> se califica de 0 a 10: proyecto 50 %, examen presencial 40 % (mínimo 4 para hacer media) y entregas semanales 10 %. Se supera con 5.</li>
<li><strong>Nota final</strong> = 70 % media de los módulos ponderada por horas + 30 % Proyecto Final. Con 9 o más, mención «con distinción».</li>
</ul>`
      ],
      [
        '9. IA responsable desde el primer día',
        c`<p>Trabajarás con datos y sistemas que afectan a personas. Desde esta sesión aplicamos tres reglas: <strong>nunca datos personales reales sin anonimizar</strong> en prácticas (usaremos datos sintéticos), <strong>respetar las licencias</strong> de modelos y datasets y <strong>verificar siempre</strong> la salida de un modelo antes de usarla. El RGPD/LOPDGDD y el Reglamento Europeo de IA (EU AI Act) se tratan en profundidad en M7 y en el Proyecto Final.</p>`
      ],
      [
        '10. Glosario mínimo',
        c`<div class="tbl-wrap"><table class="tbl"><tbody>
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
</tbody></table></div>`
      ]
    ],
    flujoTitulo: 'El ciclo de vida de una aplicación con IA (y el orden del Máster)',
    flujo: [
      'Python y asistentes (M1)',
      'Modelos propios: ML y DL (M2)',
      'LLMs en tus apps (M3)',
      'Tus datos: RAG (M4)',
      'Automatizar: agentes (M5)',
      'App multiplataforma en producción (M6)',
      'Normativa y ética (M7)',
      'Proyecto Final ante tribunal'
    ],
    tabla: {
      cap: 'Hoja de ruta: 300 horas en 15 semanas (1 oct 2029 – 26 ene 2030)',
      head: ['Módulo', 'Horas', 'Semanas', 'Proyecto del módulo'],
      rows: [
        [
          c`<strong>M1 · Fundamentos: Python para IA y desarrollo asistido por IA</strong>`,
          '30',
          '1–2',
          'Modernizar una aplicación heredada con IA y cubrirla con pruebas automáticas'
        ],
        [
          c`<strong>M2 · Aprendizaje automático y deep learning</strong>`,
          '40',
          '3–4',
          'Modelo de clasificación de imágenes publicado como servicio web'
        ],
        [
          c`<strong>M3 · IA generativa y modelos de lenguaje</strong>`,
          '40',
          '5–6',
          'Asistente conversacional para un caso de negocio con salidas estructuradas'
        ],
        [
          c`<strong>M4 · Recuperación aumentada (RAG) y bases vectoriales</strong>`,
          '35',
          '7–8',
          'Buscador inteligente sobre la documentación técnica de una empresa colaboradora'
        ],
        [
          c`<strong>M5 · Agentes de IA y automatización</strong>`,
          '35',
          '9–10',
          'Agente que automatiza un proceso real: soporte, incidencias o atención al cliente'
        ],
        [
          c`<strong>M6 · IA en apps multiplataforma y puesta en producción</strong>`,
          '40',
          '11–12',
          'App multiplataforma con IA desplegada en la nube y con panel de monitorización'
        ],
        [
          c`<strong>M7 · Ética, normativa y uso responsable de la IA</strong>`,
          '10',
          '13–14',
          'Análisis de cumplimiento y ficha de transparencia del Proyecto Final'
        ],
        [
          c`<strong>SEM · Seminarios online con empresa</strong>`,
          '10',
          '2, 4, 6, 9, 11',
          '5 sesiones de 2 h (jueves 18:00–20:00)'
        ],
        [
          c`<strong>PFM · Proyecto Final de Máster</strong>`,
          '60',
          '10–15',
          'Producto funcional desplegado, memoria y defensa presencial'
        ],
        [c`<strong>Total</strong>`, c`<strong>300</strong>`, c`<strong>15</strong>`, '']
      ]
    },
    claves: [
      'Software clásico: tú escribes las reglas. Machine learning: el sistema las aprende de los datos.',
      'Un LLM predice el siguiente token: es muy capaz, pero no verifica hechos ni recuerda entre llamadas.',
      'Cada módulo termina con un proyecto que pasa a tu portfolio de GitHub.',
      'Jornadas presenciales obligatorias: sábados 17 nov 2029, 12 ene 2030 y 26 ene 2030.',
      c`Usa asistentes de IA en todo el programa, pero justifica y verifica lo que entregas: se evalúa el criterio, no solo el resultado.`
    ]
  },
  taller: {
    entorno: c`Windows 11 · PowerShell 7 · winget. En macOS/Linux se usan los equivalentes (brew, apt). El laboratorio completo está en <code>master-ia/labs/sesion-00</code> del repositorio.`,
    pasos: [
      {
        t: 'Instalar las herramientas del Máster',
        d: 'Una sola vez. Todas son gratuitas. Si ya tienes alguna, winget la omitirá o la actualizará.',
        lang: 'powershell',
        file: 'PowerShell (como usuario)',
        code: c`
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
code --install-extension ms-toolsai.jupyter`
      },
      {
        t: 'Clonar el laboratorio y comprobar el entorno',
        d: c`El script <code>verificar_entorno.py</code> comprueba versiones, GPU disponible, Docker y Ollama, y te dice qué falta.`,
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
git clone <url-del-repositorio-del-master> master-ia-jro
cd master-ia-jro/master-ia/labs/sesion-00
uv sync
uv run python verificar_entorno.py`
      },
      {
        t: 'Tu primer modelo de machine learning (10 líneas útiles)',
        d: c`Antes de los LLMs, el ciclo completo de ML: datos → entrenamiento → evaluación → predicción. Usamos un dataset sintético de alumnado de FP (nunca datos reales).`,
        lang: 'python',
        file: 'labs/sesion-00/primer_modelo.py',
        code: c`
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
`
      },
      {
        t: 'Tu primer LLM en local con Ollama (sin claves ni coste)',
        d: 'Un modelo pequeño de pesos abiertos se ejecuta en tu propio equipo. Nada sale de tu ordenador.',
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
ollama pull qwen2.5:1.5b          # ~1 GB; funciona en CPU
ollama run qwen2.5:1.5b "Explica en 3 frases qué es un token"
uv run python hola_ia_local.py`
      },
      {
        t: 'Hola IA desde Python',
        d: c`Ollama expone una API compatible con OpenAI en <code>/v1</code>. El mismo código servirá más adelante para modelos en la nube y en servidores propios.`,
        lang: 'python',
        file: 'labs/sesion-00/hola_ia_local.py',
        code: c`
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
`
      },
      {
        t: 'Hola IA desde Java 21 (sin dependencias)',
        d: c`Un único fichero ejecutable con <code>java HolaIA.java</code>: <code>HttpClient</code>, <code>record</code>, text blocks y <code>switch</code> con flechas. En Windows, añade <code>-Dstdout.encoding=UTF-8</code> si las tildes salen mal. En M3 (semana 6) lo haremos con Spring AI.`,
        lang: 'java',
        file: 'labs/sesion-00/java/HolaIA.java',
        code: c`
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

    /** Extrae el texto de "message.content" de la respuesta de /api/chat (en M3 usaremos Jackson). */
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
`
      },
      {
        t: 'Opcional: el mismo saludo con un modelo de frontera (Claude)',
        d: c`Requiere una clave de API en la variable de entorno <code>ANTHROPIC_API_KEY</code>. Compara calidad, latencia y coste con el modelo local: lo analizarás en la actividad.`,
        lang: 'python',
        file: 'labs/sesion-00/hola_ia_claude.py',
        code: c`
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
`
      }
    ]
  },
  prompts: [
    {
      t: 'Anatomía de un buen prompt',
      tipo: 'Plantilla',
      lang: 'markdown',
      d: c`Las seis piezas que usaremos durante todo el Máster. No todas son obligatorias, pero conviene pensar en cada una.`,
      code: c`
<rol>Quién es el modelo en esta conversación.</rol>
<contexto>Información que necesita y no tiene: público, datos, situación.</contexto>
<tarea>Qué tiene que hacer, con un verbo claro.</tarea>
<formato>Cómo quieres la respuesta: extensión, estructura, lenguaje.</formato>
<restricciones>Qué no debe hacer o qué hacer si le falta información.</restricciones>
<ejemplos>Uno o dos ejemplos de entrada y salida, si el formato es delicado.</ejemplos>`
    },
    {
      t: 'Tutor personal del Máster',
      tipo: 'System Prompt',
      lang: 'markdown',
      code: c`
Eres mi tutor del Máster en IA Aplicada al Desarrollo de Aplicaciones Multiplataforma. Soy titulado en DAM: programo en Java 21,
Kotlin, Python y SQL, conozco APIs REST, Git y arquitectura limpia, pero soy nuevo en IA.

Cuando te pregunte un concepto:
1. Explícalo en 3-5 frases con una analogía de programación (Java, bases de datos, APIs).
2. Añade un ejemplo mínimo de código en Python o Java 21.
3. Termina con una pregunta corta para comprobar si lo he entendido.

Si un término depende de otro que aún no conozco, explícame primero ese.
Si no estás seguro de algo (versiones, nombres de métodos), dilo claramente.`
    },
    {
      t: 'Diagnóstico inicial de conocimientos',
      tipo: 'Prompt de autoevaluación',
      lang: 'markdown',
      code: c`
Hazme un diagnóstico de nivel antes de empezar el Máster de IA.
Pregúntame de una en una 10 preguntas cortas, de dificultad creciente, sobre:
Python (2), álgebra lineal aplicada (2), estadística básica (2), machine learning (2)
y LLMs (2). Espera mi respuesta antes de seguir.
Al final, dame una tabla con cada área, mi nivel (bajo/medio/alto) y qué sesiones del
Máster debo repasar con más atención (M1 Python y asistentes, M2 aprendizaje automático, M3 modelos de lenguaje).`
    },
    {
      t: 'Reglas del portfolio para asistentes de código',
      tipo: 'CLAUDE.md',
      lang: 'markdown',
      file: 'mia-portfolio/CLAUDE.md',
      code: c`
# Portafolio del Máster en IA Aplicada al Desarrollo de Aplicaciones Multiplataforma (FP José Ramón Otero)

## Estructura
- sesion-XX/ : una carpeta por sesión con su README de resultados.
- Python con uv (uv sync / uv run). Java 21 con Maven o ficheros únicos (java Fichero.java).

## Reglas
- Nunca datos personales reales: solo datos sintéticos generados en el propio repositorio.
- Las claves de API van en variables de entorno, nunca en el código ni en .env versionado.
- Cada actividad incluye: cómo ejecutarla, resultados obtenidos y qué he aprendido.
- Explícame los cambios que propongas: estoy aprendiendo, no solo entregando.`
    }
  ],
  actividad: {
    tipo: 'semanal',
    titulo: 'Prueba de nivel, entorno verificado y portfolio del Máster',
    contexto: c`Primera entrega de la semana 1. Prepara el repositorio de GitHub donde publicarás todos los proyectos del Máster (tu portfolio profesional), demuestra que tu entorno funciona y realiza una primera comparación crítica entre modelos. La prueba de nivel no puntúa: sirve al tutor para orientarte.`,
    requisitos: [
      c`Prueba de nivel completada con el prompt «Diagnóstico inicial de conocimientos» (copia el resultado en el README).`,
      c`Repositorio <code>mia-portfolio</code> con README de presentación (tu perfil DAM y tus objetivos), <code>.gitignore</code> y <code>CLAUDE.md</code>.`,
      c`Salida de <code>verificar_entorno.py</code> con las comprobaciones obligatorias en verde.`,
      c`Ejecución de <code>primer_modelo.py</code> explicando las reglas aprendidas y por qué la exactitud no es del 100 %.`,
      c`Primera llamada a un LLM local desde Python <em>y</em> desde Java 21, y comparativa de 5 preguntas técnicas entre dos modelos (calidad, latencia y tokens).`,
      'Tres ideas iniciales para el Proyecto Final (si es posible, con una empresa colaboradora en mente).'
    ],
    entregables: [
      c`URL del repositorio <code>mia-portfolio</code>`,
      c`<code>semana-01/README.md</code> con prueba de nivel, resultados y comparativa`,
      c`<code>semana-01/ideas-pfm.md</code>`
    ],
    rubrica: [
      ['Entorno completo y verificado', 30],
      ['Primer modelo de ML explicado', 20],
      ['LLM local desde Python y Java', 30],
      ['Comparativa crítica e ideas de PFM', 20]
    ]
  },
  faq: [
    [
      '¿Necesito saber muchas matemáticas?',
      c`Necesitas intuición, no demostraciones. En M1 y M2 repasamos lo imprescindible (vectores, matrices, derivadas como "sensibilidad", probabilidad básica) siempre con código. Si programas bucles, arrays y funciones, puedes seguir el Máster.`
    ],
    [
      '¿Necesito un ordenador potente o una GPU?',
      c`No para empezar. Con 16 GB de RAM puedes ejecutar modelos locales pequeños y seguir casi todo el Máster. Para entrenar redes neuronales (M2) puedes usar GPU gratuitas en la nube (Google Colab o Kaggle) y laboratorios en la nube de la plataforma. Una GPU NVIDIA de 8 GB o más, o un Mac con Apple Silicon, ayuda pero no es obligatoria.`
    ],
    [
      '¿Tendré que pagar por usar modelos en la nube?',
      c`Las prácticas obligatorias se pueden hacer con modelos locales gratuitos (Ollama). Los modelos de frontera (Claude, Gemini…) se usan en algunos talleres y su coste en las prácticas es bajo; aprenderás a controlarlo con caché, modelos adecuados a cada tarea y presupuestos.`
    ],
    [
      '¿Python o Java?',
      c`Los dos. Python domina el entrenamiento y el ecosistema de investigación; Java 21 domina muchos backends empresariales. Un perfil que integra IA en ambos lenguajes es muy valorado, y es exactamente lo que vas a practicar.`
    ],
    [
      '¿La IA va a sustituir a los programadores?',
      c`Está cambiando cómo se programa: los asistentes de código ya escriben una parte importante del código rutinario. Lo que gana valor es saber diseñar sistemas, evaluar si lo que genera un modelo es correcto y seguro, e integrar IA en productos reales. Ese es el perfil que forma este Máster.`
    ],
    [
      '¿Cómo se evalúa y qué necesito para obtener el título?',
      c`Cada módulo: proyecto 50 %, examen presencial 40 % (mínimo 4) y entregas semanales 10 %. Para el título: asistir a las tres jornadas presenciales y aprobar sus exámenes, entregar al menos el 80 % de las actividades semanales y superar M1–M7, asistir a 4 de los 5 seminarios (en directo o con la grabación y su cuestionario) y obtener «apto» en el Proyecto Final. Quien no complete el programa recibe un certificado de aprovechamiento de los módulos superados.`
    ],
    [
      '¿El título es oficial?',
      c`No. Es un <strong>título propio del Centro de Formación Profesional José Ramón Otero, sin carácter oficial</strong>: no es un Máster Universitario ni un Máster de Formación Profesional. Su valor está en los proyectos de tu portfolio, la certificación de la industria incluida y la participación de empresas.`
    ]
  ]
});
