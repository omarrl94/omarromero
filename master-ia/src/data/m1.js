// MÓDULO 1 · Ingeniería de LLMs, Integración Políglota (Python + Java 21) y Salidas Estructuradas (Sesiones 5 a 8)

SESIONES.push({
  n: 5,
  corto: 'Modelos de frontera vía API',
  titulo: 'Integración de Modelos de Frontera (Claude, Google AI Studio / Gemini, Kimi, OpenAI)',
  duracion: '6 h',
  resumen: c`SDKs oficiales, control del razonamiento (esfuerzo adaptativo en Claude, <code>thinking_budget</code> en Gemini), streaming asíncrono por SSE y Prompt Caching para reducir coste y latencia.`,
  stack: ['anthropic SDK', 'google-genai', 'openai SDK', 'FastAPI', 'SSE', 'asyncio', 'httpx'],
  teoria: {
    intro: c`Integrar un LLM no es "hacer una petición HTTP". Es diseñar un componente con latencia variable (segundos), coste por token, límites de tasa, respuestas no deterministas y errores transitorios. En esta sesión construimos una <strong>pasarela multi-proveedor</strong> con streaming y caché de prompts.`,
    bloques: [
      ['1. Anatomía de una petición', c`<p>Todos los proveedores comparten conceptos: <strong>modelo</strong>, <strong>system prompt</strong> (instrucciones del operador), <strong>mensajes</strong> (turnos user/assistant), <strong>max_tokens</strong> (tope de salida), herramientas y formato de salida. La API es <em>stateless</em>: envías el historial completo en cada turno.</p>`],
      ['2. Control del razonamiento', c`<p>Los modelos actuales "piensan" antes de responder. En <strong>Claude</strong> (familia 5.x) el razonamiento es <em>adaptativo</em>: se controla con <code>output_config.effort</code> (<code>low</code> → <code>max</code>); el antiguo presupuesto fijo <code>budget_tokens</code> ya no se acepta en los modelos actuales. En <strong>Gemini</strong> se usa <code>thinking_config.thinking_budget</code> (tokens de razonamiento; 0 lo desactiva en los modelos Flash). En la API de OpenAI, <code>reasoning.effort</code>. Más razonamiento = mejor calidad en tareas complejas, más latencia y coste.</p>`],
      ['3. Streaming con Server-Sent Events', c`<p>El usuario percibe la latencia del <em>primer token</em> (TTFT), no la total. Con streaming reenviamos los fragmentos al navegador vía SSE (<code>text/event-stream</code>). En peticiones largas el streaming además evita timeouts HTTP.</p>`],
      ['4. Prompt Caching', c`<p>Si el prefijo del prompt (herramientas → system → mensajes) se repite byte a byte, el proveedor reutiliza su procesamiento: las lecturas de caché cuestan aproximadamente un 10 % del precio de entrada normal en Claude. Coloca lo estable primero (instrucciones, documentos) y lo variable al final. Cualquier cambio en el prefijo (una fecha, un id) invalida todo lo que viene detrás.</p>`],
      ['5. Resiliencia', c`<p>Reintentos con backoff exponencial para 429/5xx (los SDKs oficiales lo hacen por defecto), timeouts explícitos, gestión de la parada por <code>max_tokens</code> y de las negativas por seguridad (<code>stop_reason == "refusal"</code>), y registro de tokens consumidos por petición para controlar costes.</p>`]
    ],
    flujo: ['Navegador', 'FastAPI /chat (SSE)', 'Pasarela LLM', 'Claude | Gemini | Kimi | OpenAI', 'Stream de deltas', 'EventSource en el cliente'],
    tabla: {
      cap: 'Comparativa práctica de integración (consulta siempre la documentación vigente: los modelos cambian cada pocos meses)',
      head: ['Proveedor', 'SDK Python', 'Control de razonamiento', 'Caché de prompts', 'Particularidades'],
      rows: [
        ['Anthropic Claude', '<code>anthropic</code>', '<code>output_config.effort</code> + thinking adaptativo', 'Explícita con <code>cache_control</code>', 'System prompt separado, tool use y salidas estructuradas nativas'],
        ['Google Gemini (AI Studio)', '<code>google-genai</code>', '<code>thinking_config.thinking_budget</code>', 'Implícita + caché de contexto explícita', 'Multimodal nativo (audio, vídeo, PDF)'],
        ['Moonshot Kimi', '<code>openai</code> (endpoint compatible)', 'Según modelo', 'Automática', 'API compatible con OpenAI, contexto largo'],
        ['OpenAI', '<code>openai</code>', '<code>reasoning.effort</code>', 'Automática por prefijo', 'Responses API'],
        ['Modelos abiertos (Llama, Qwen, DeepSeek)', 'Ollama / vLLM (compatibles OpenAI)', 'Según modelo', 'Prefix caching en vLLM', 'Control total y soberanía de datos (Sesión 8)']
      ]
    },
    claves: ['Nunca hardcodees API keys: variables de entorno o gestor de secretos.', 'Mide TTFT, tokens de entrada/salida y aciertos de caché en cada llamada.', 'Diseña una interfaz propia (puerto) y adaptadores por proveedor: arquitectura hexagonal.']
  },
  taller: {
    entorno: 'PowerShell 7 · VS Code · Python 3.12 · claves en variables de entorno de usuario',
    pasos: [
      { t: 'Proyecto y secretos', d: 'Las claves se guardan como variables de entorno del usuario de Windows, nunca en el repositorio.', lang: 'powershell', file: 'PowerShell', code: c`
uv init mia-s05-pasarela
cd mia-s05-pasarela
uv add anthropic google-genai openai fastapi "uvicorn[standard]" sse-starlette python-dotenv

[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-ant-...", "User")
[Environment]::SetEnvironmentVariable("GEMINI_API_KEY", "AIza...", "User")
[Environment]::SetEnvironmentVariable("MOONSHOT_API_KEY", "sk-...", "User")
# Cierra y vuelve a abrir la terminal para que se carguen
Add-Content .gitignore ".env"` },
      { t: 'Claude: petición básica con esfuerzo de razonamiento', lang: 'python', file: 'src/claude_basico.py', code: c`
import anthropic

client = anthropic.Anthropic()          # lee ANTHROPIC_API_KEY del entorno

respuesta = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=16000,
    system="Eres un tutor de programación para titulados en DAM. Responde en español.",
    output_config={"effort": "medium"},  # low | medium | high | xhigh | max
    messages=[{"role": "user", "content": "Explica la diferencia entre Virtual Threads y corrutinas de Kotlin."}],
)

if respuesta.stop_reason == "refusal":
    print("El modelo ha declinado la petición")
else:
    for bloque in respuesta.content:
        if bloque.type == "text":
            print(bloque.text)
print(respuesta.usage)                   # input_tokens, output_tokens, cache_*` },
      { t: 'Claude: Prompt Caching de un documento largo', d: 'El reglamento del centro (miles de tokens) se cachea; cada pregunta posterior solo paga el sufijo variable.', lang: 'python', file: 'src/claude_cache.py', code: c`
import anthropic

client = anthropic.Anthropic()
reglamento = open("data/reglamento_regimen_interno.md", encoding="utf-8").read()


def preguntar(pregunta: str):
    r = client.messages.create(
        model="claude-opus-5-5",
        max_tokens=4000,
        system=[
            {"type": "text", "text": "Respondes dudas sobre el reglamento del centro. Cita el artículo."},
            {"type": "text", "text": reglamento, "cache_control": {"type": "ephemeral"}},  # prefijo estable
        ],
        messages=[{"role": "user", "content": pregunta}],               # parte variable, al final
    )
    u = r.usage
    print(f"escritura caché={u.cache_creation_input_tokens} lectura caché={u.cache_read_input_tokens} sin caché={u.input_tokens}")
    return r.content[0].text


preguntar("¿Cuántas faltas injustificadas implican pérdida de evaluación continua?")
preguntar("¿Cuál es el procedimiento para reclamar una calificación?")   # debe leer de caché` },
      { t: 'Gemini (Google AI Studio) con thinking_budget', lang: 'python', file: 'src/gemini_basico.py', code: c`
import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
MODELO = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")   # consulta los modelos vigentes en AI Studio

r = client.models.generate_content(
    model=MODELO,
    contents="Diseña el esquema de tablas para gestionar prácticas FCT en empresas.",
    config=types.GenerateContentConfig(
        system_instruction="Eres arquitecto de bases de datos. Responde con SQL de PostgreSQL.",
        thinking_config=types.ThinkingConfig(thinking_budget=2048),
        max_output_tokens=8000,
    ),
)
print(r.text)
print(r.usage_metadata)

for trozo in client.models.generate_content_stream(model=MODELO, contents="Resume el Modelo OSI en 5 líneas"):
    print(trozo.text or "", end="", flush=True)` },
      { t: 'Kimi y OpenAI con el SDK de OpenAI', d: 'Kimi (Moonshot AI) expone un endpoint compatible con OpenAI: basta con cambiar <code>base_url</code>.', lang: 'python', file: 'src/compatibles_openai.py', code: c`
import os
from openai import OpenAI

kimi = OpenAI(api_key=os.environ["MOONSHOT_API_KEY"], base_url="https://api.moonshot.ai/v1")
r = kimi.chat.completions.create(
    model=os.environ.get("KIMI_MODEL", "kimi-k2-turbo-preview"),   # revisa el catálogo de Moonshot
    messages=[{"role": "system", "content": "Eres un asistente técnico conciso."},
              {"role": "user", "content": "¿Qué es una arquitectura hexagonal?"}],
    max_tokens=1500,
)
print(r.choices[0].message.content)

openai_client = OpenAI()   # OPENAI_API_KEY
r2 = openai_client.responses.create(
    model=os.environ.get("OPENAI_MODEL", "gpt-5-mini"),
    reasoning={"effort": "low"},
    input="Escribe un test JUnit 5 para un método que valida un DNI español.",
)
print(r2.output_text)` },
      { t: 'Pasarela FastAPI con streaming SSE asíncrono', lang: 'python', file: 'src/pasarela.py', code: c`
import json
import anthropic
from fastapi import FastAPI
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

app = FastAPI(title="Pasarela LLM · Máster IA JRO")
claude = anthropic.AsyncAnthropic()


class Peticion(BaseModel):
    mensajes: list[dict]
    esfuerzo: str = "low"


@app.post("/chat")
async def chat(p: Peticion):
    async def eventos():
        async with claude.messages.stream(
            model="claude-opus-5-5",
            max_tokens=64000,
            system="Eres el asistente del Máster de IA del CFP José Ramón Otero.",
            output_config={"effort": p.esfuerzo},
            messages=p.mensajes,
        ) as stream:
            async for texto in stream.text_stream:
                yield {"event": "delta", "data": json.dumps({"t": texto})}
            final = await stream.get_final_message()
            yield {"event": "fin", "data": json.dumps({
                "stop_reason": final.stop_reason,
                "entrada": final.usage.input_tokens, "salida": final.usage.output_tokens})}

    return EventSourceResponse(eventos())` },
      { t: 'Cliente web mínimo (EventSource vía fetch)', lang: 'javascript', file: 'static/chat.js', code: c`
async function preguntar(texto, onDelta) {
  const resp = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mensajes: [{ role: "user", content: texto }] })
  });
  const lector = resp.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await lector.read();
    if (done) break;
    buffer += value;
    const eventos = buffer.split("\r\n\r\n");
    buffer = eventos.pop();
    for (const ev of eventos) {
      const data = ev.split("\n").find(l => l.startsWith("data:"));
      if (ev.includes("event: delta") && data) onDelta(JSON.parse(data.slice(5)).t);
    }
  }
}` }
    ]
  },
  prompts: [
    { t: 'System prompt de producción con secciones estables', tipo: 'System Prompt', lang: 'markdown', d: 'Estructura pensada para caché: todo lo estable arriba; nada de fechas ni ids dinámicos.', code: c`
<rol>
Eres el asistente académico del Máster en Ingeniería de IA del CFP José Ramón Otero.
Tu público son titulados en DAM que ya programan en Java, Kotlin y Python.
</rol>

<estilo>
- Responde en español técnico, directo, sin relleno.
- Código siempre ejecutable, con imports y versión de librerías cuando importe.
- Si hay varias opciones, recomienda una y justifica en 1-2 frases.
</estilo>

<limites>
- No inventes APIs. Si no conoces la firma exacta de un método, dilo y sugiere
  dónde consultarla.
- No pidas ni proceses datos personales de alumnado real.
</limites>

<formato>
Para preguntas conceptuales: explicación breve + ejemplo. Para errores: causa,
corrección y cómo evitarlo.
</formato>` },
    { t: 'Router de proveedor por tipo de tarea', tipo: 'JSON de configuración', lang: 'json', file: 'config/router.json', code: c`
{
  "rutas": [
    {"tarea": "clasificacion_corta", "proveedor": "anthropic", "modelo": "claude-haiku-5-5", "esfuerzo": "low"},
    {"tarea": "chat_general",        "proveedor": "anthropic", "modelo": "claude-sonnet-5-5", "esfuerzo": "low"},
    {"tarea": "codigo_complejo",     "proveedor": "anthropic", "modelo": "claude-opus-5-5", "esfuerzo": "high"},
    {"tarea": "video_multimodal",    "proveedor": "gemini",    "modelo": "env:GEMINI_MODEL", "thinking_budget": 1024},
    {"tarea": "datos_sensibles",     "proveedor": "local",     "modelo": "qwen2.5:14b", "endpoint": "http://localhost:11434/v1"}
  ],
  "limites": {"max_tokens_salida": 16000, "timeout_s": 120, "reintentos": 2}
}` },
    { t: 'Evaluador rápido de respuestas (LLM-as-a-Judge)', tipo: 'LLM-as-a-Judge', lang: 'markdown', code: c`
Evalúa la respuesta de un asistente a una pregunta técnica de un alumno de DAM.
<pregunta>{pregunta}</pregunta>
<respuesta>{respuesta}</respuesta>
Puntúa de 1 a 5 cada criterio y justifica en una frase:
- corrección_tecnica: ¿es correcto el contenido y el código compila/ejecuta?
- adecuacion_nivel: ¿asume los conocimientos de un titulado DAM, ni más ni menos?
- concision: ¿evita relleno?
Devuelve SOLO JSON: {"corrección_tecnica": n, "adecuacion_nivel": n, "concision": n, "comentario": "..."}` }
  ],
  actividad: {
    titulo: 'Pasarela LLM multi-proveedor con streaming, caché y contabilidad de costes',
    contexto: c`El centro quiere un único endpoint interno para todas las aplicaciones que usan IA, con independencia del proveedor, y un informe de costes por aplicación.`,
    requisitos: [
      'Puerto <code>ProveedorLLM</code> (interfaz/Protocol) con adaptadores para Claude, Gemini y uno compatible OpenAI (Kimi u Ollama).',
      'Endpoint <code>/chat</code> con SSE y endpoint <code>/chat/sync</code>.',
      'Prompt Caching activado en Claude y demostración con métricas de <code>cache_read_input_tokens</code>.',
      'Registro (SQLite) de tokens, latencia TTFT y coste estimado por petición y por aplicación cliente.',
      'Reintentos con backoff y gestión de <code>stop_reason</code> (<code>max_tokens</code>, <code>refusal</code>).'
    ],
    entregables: ['Repositorio con <code>src/</code>, <code>tests/</code> y <code>docker-compose.yml</code>', '<code>COSTES.md</code> con una simulación de 1 000 peticiones'],
    rubrica: [['Arquitectura (puertos y adaptadores)', 30], ['Streaming y resiliencia', 25], ['Caché y contabilidad de costes', 25], ['Seguridad de secretos y tests', 20]]
  },
  faq: [
    ['Recibo un error 400 al enviar <code>budget_tokens</code> o <code>temperature</code> a Claude.', c`En los modelos Claude actuales el razonamiento es adaptativo y se controla con <code>output_config.effort</code>; el presupuesto fijo de tokens de razonamiento y los parámetros de muestreo (<code>temperature</code>, <code>top_p</code>) ya no se aceptan. Controla la creatividad desde el prompt y usa salidas estructuradas para respuestas deterministas en forma.`],
    ['Mi caché nunca acierta (<code>cache_read_input_tokens = 0</code>).', c`Algo cambia en el prefijo: una fecha u hora en el system prompt, un JSON serializado con orden de claves distinto, herramientas en orden variable o un id de petición. Además, el prefijo debe superar un tamaño mínimo (cientos o miles de tokens según el modelo) y la caché expira (5 minutos por defecto, ampliable a 1 hora).`],
    ['¿Cómo evito que la clave de API acabe en GitHub?', c`Variables de entorno o gestor de secretos, <code>.env</code> en <code>.gitignore</code>, y activa <em>secret scanning</em> y <em>push protection</em> en el repositorio. Si una clave se filtra, revócala inmediatamente: borrar el commit no basta.`],
    ['¿Qué pasa si el modelo se niega a responder?', c`La respuesta llega con <code>stop_reason: "refusal"</code>. Compruébalo siempre antes de leer el contenido. Claude permite configurar modelos de respaldo (<em>fallbacks</em>) en el servidor para que otro modelo continúe; documenta esa decisión en el diseño.`]
  ]
});

SESIONES.push({
  n: 6,
  corto: 'IA en Java 21 (Spring AI)',
  titulo: 'IA Generativa en el Ecosistema Java 21+ (Spring AI & LangChain4j)',
  duracion: '6 h',
  resumen: c`Microservicios nativos con Spring Boot 3 y Virtual Threads conectados a LLMs mediante <code>ChatClient</code>, advisors de memoria conversacional y AI Services de LangChain4j.`,
  stack: ['Java 21', 'Spring Boot 3.5', 'Spring AI 1.x', 'LangChain4j', 'Virtual Threads', 'Maven', 'IntelliJ IDEA'],
  teoria: {
    intro: c`La mayoría de sistemas empresariales del entorno del alumnado DAM corren en la JVM. No hace falta reescribirlos en Python para añadir IA: <strong>Spring AI</strong> y <strong>LangChain4j</strong> aportan abstracciones portables (modelos, memoria, herramientas, RAG) con la ergonomía de Spring.`,
    bloques: [
      ['1. Spring AI: ChatClient y advisors', c`<p><code>ChatClient</code> es una API fluida: <code>prompt().system().user().call().content()</code>. Los <strong>advisors</strong> interceptan la petición/respuesta (patrón cadena de responsabilidad) para añadir memoria, RAG, logging o guardrails sin ensuciar el servicio.</p>`],
      ['2. Memoria conversacional', c`<p>La API del LLM no recuerda nada. <code>MessageWindowChatMemory</code> guarda los últimos N mensajes por <code>conversationId</code>; en producción respáldala con JDBC/Redis. Limita la ventana: más historial = más coste y más riesgo de deriva.</p>`],
      ['3. Virtual Threads (Project Loom)', c`<p>Una llamada a un LLM bloquea entre 1 y 60 segundos. Con hilos de plataforma, 200 usuarios agotan el pool de Tomcat. Con <code>spring.threads.virtual.enabled=true</code> cada petición usa un hilo virtual barato: código imperativo simple con escalabilidad de I/O reactiva.</p>`],
      ['4. LangChain4j: AI Services', c`<p>Defines una interfaz Java anotada (<code>@SystemMessage</code>, <code>@UserMessage</code>, <code>@MemoryId</code>) y LangChain4j genera la implementación. El tipo de retorno puede ser un <code>record</code>: la librería pide JSON y lo deserializa.</p>`],
      ['5. ¿Spring AI o LangChain4j?', c`<p>Spring AI encaja de forma natural en proyectos Spring Boot (autoconfiguración, observabilidad con Micrometer). LangChain4j es agnóstico de framework (Quarkus, Micronaut, Java SE) y muy completo en agentes y RAG. Ambos soportan Claude, Gemini, OpenAI y Ollama.</p>`]
    ],
    flujo: ['Controller REST', 'Servicio', 'ChatClient', 'Advisors (memoria, logging)', 'ChatModel (Claude / Gemini / Ollama)', 'Respuesta / Flux<String>'],
    tabla: {
      cap: 'Equivalencias entre Python y Java en el Máster',
      head: ['Necesidad', 'Python', 'Java 21+'],
      rows: [
        ['Cliente LLM', '<code>anthropic</code>, <code>google-genai</code>', 'Spring AI <code>ChatClient</code>, LangChain4j <code>ChatModel</code>, SDK Java de Anthropic'],
        ['Modelo de datos', 'Pydantic', '<code>record</code> + Jackson / Bean Validation'],
        ['Concurrencia I/O', '<code>asyncio</code>', 'Virtual Threads / Reactor'],
        ['Orquestación de agentes', 'LangGraph, PydanticAI', 'LangChain4j Agents, Spring AI tool calling'],
        ['Servidor web', 'FastAPI', 'Spring Boot (MVC o WebFlux)']
      ]
    },
    claves: ['Expón el modelo como bean y configura por propiedades, no en código.', 'El <code>conversationId</code> es un dato de sesión: valida que pertenece al usuario autenticado.', 'Usa streaming (<code>Flux&lt;String&gt;</code>) para respuestas de chat.']
  },
  taller: {
    entorno: 'IntelliJ IDEA · JDK 21 (Temurin) · Maven · PowerShell 7',
    pasos: [
      { t: 'Generar el proyecto con Spring Initializr', lang: 'powershell', file: 'PowerShell', code: c`
winget install EclipseAdoptium.Temurin.21.JDK
Invoke-WebRequest "https://start.spring.io/starter.zip?type=maven-project&javaVersion=21&groupId=es.jrotero&artifactId=tutor-ia&dependencies=web,validation,actuator" -OutFile tutor-ia.zip
Expand-Archive tutor-ia.zip -DestinationPath tutor-ia
cd tutor-ia
idea64.exe .` },
      { t: 'Dependencias de Spring AI', lang: 'xml', file: 'pom.xml (fragmento)', code: c`
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.ai</groupId>
      <artifactId>spring-ai-bom</artifactId>
      <version>1.0.3</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>

<dependencies>
  <dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-anthropic</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-ollama</artifactId>
  </dependency>
</dependencies>` },
      { t: 'Configuración con Virtual Threads', lang: 'yaml', file: 'src/main/resources/application.yml', code: c`
spring:
  threads:
    virtual:
      enabled: true          # Tomcat y @Async sobre hilos virtuales
  ai:
    anthropic:
      api-key: \${ANTHROPIC_API_KEY}
      chat:
        options:
          model: claude-sonnet-5-5
          max-tokens: 4000
    ollama:
      base-url: http://localhost:11434
      chat:
        options:
          model: qwen2.5:7b
management:
  endpoints.web.exposure.include: health,metrics` },
      { t: 'Servicio de tutoría con memoria conversacional', lang: 'java', file: 'TutorService.java', code: c`
package es.jrotero.tutoria;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
public class TutorService {

    private final ChatClient chat;

    public TutorService(ChatClient.Builder builder) {
        ChatMemory memoria = MessageWindowChatMemory.builder().maxMessages(20).build();
        this.chat = builder
                .defaultSystem("""
                        Eres el tutor del Máster de IA del CFP José Ramón Otero.
                        El alumnado son titulados DAM. Responde en español con ejemplos en Java 21.
                        """)
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(memoria).build(), new SimpleLoggerAdvisor())
                .build();
    }

    public String preguntar(String conversacionId, String pregunta) {
        return chat.prompt()
                .user(pregunta)
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversacionId))
                .call()
                .content();
    }

    public Flux<String> preguntarStream(String conversacionId, String pregunta) {
        return chat.prompt()
                .user(pregunta)
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversacionId))
                .stream()
                .content();
    }
}` },
      { t: 'Controlador REST con streaming', lang: 'java', file: 'TutorController.java', code: c`
package es.jrotero.tutoria;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/tutor")
public class TutorController {

    record Pregunta(@NotBlank @Size(max = 4000) String texto) {}
    record Respuesta(String texto) {}

    private final TutorService tutor;

    TutorController(TutorService tutor) { this.tutor = tutor; }

    @PostMapping
    Respuesta preguntar(@RequestHeader("X-Alumno-Id") String alumnoId, @RequestBody @jakarta.validation.Valid Pregunta p) {
        return new Respuesta(tutor.preguntar("alumno-" + alumnoId, p.texto()));
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    Flux<String> stream(@RequestHeader("X-Alumno-Id") String alumnoId, @RequestBody @jakarta.validation.Valid Pregunta p) {
        return tutor.preguntarStream("alumno-" + alumnoId, p.texto());
    }
}
// En producción el id de alumno sale del token JWT autenticado, nunca de una cabecera libre.` },
      { t: 'La misma idea con LangChain4j (AI Services)', lang: 'java', file: 'AsistenteFct.java', code: c`
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.anthropic.AnthropicChatModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.MemoryId;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;

public class AsistenteFct {

    record EvaluacionPractica(String empresa, int puntuacion, java.util.List<String> fortalezas, java.util.List<String> mejoras) {}

    interface Asistente {
        @SystemMessage("Eres coordinador de prácticas FCT. Responde siempre en español.")
        String chat(@MemoryId String alumno, @UserMessage String mensaje);

        @SystemMessage("Extrae la evaluación de la memoria de prácticas. Puntuación de 0 a 10.")
        EvaluacionPractica evaluar(@UserMessage String memoria);
    }

    public static void main(String[] args) {
        var modelo = AnthropicChatModel.builder()
                .apiKey(System.getenv("ANTHROPIC_API_KEY"))
                .modelName("claude-sonnet-5-5")
                .maxTokens(4000)
                .build();

        Asistente asistente = AiServices.builder(Asistente.class)
                .chatModel(modelo)
                .chatMemoryProvider(id -> MessageWindowChatMemory.withMaxMessages(20))
                .build();

        System.out.println(asistente.chat("ana", "Empiezo la FCT el lunes en una consultora. ¿Qué debo preparar?"));
        System.out.println(asistente.evaluar("Durante las prácticas en Indra desarrollé una API REST..."));
    }
}` },
      { t: 'Ejecutar y probar', lang: 'powershell', file: 'PowerShell', code: c`
.\mvnw.cmd spring-boot:run

$body = @{ texto = "¿Cuándo uso un record y cuándo una clase?" } | ConvertTo-Json
Invoke-RestMethod http://localhost:8080/api/tutor -Method Post -Body $body -ContentType "application/json" -Headers @{ "X-Alumno-Id" = "42" }
curl.exe -N -X POST http://localhost:8080/api/tutor/stream -H "Content-Type: application/json" -H "X-Alumno-Id: 42" -d '{\"texto\":\"Explica sealed interfaces\"}'` }
    ]
  },
  prompts: [
    { t: 'System prompt para asistente interno Spring', tipo: 'System Prompt', lang: 'markdown', code: c`
Eres un asistente integrado en la intranet del centro (backend Spring Boot).
- Solo respondes sobre: horarios, normativa académica, FCT y recursos de los ciclos.
- Si la pregunta requiere datos personales de un alumno, responde que debe
  consultarlo en Secretaría y no especules.
- Cuando des pasos a seguir, usa una lista numerada de máximo 6 pasos.
- Termina con la fuente (documento y apartado) cuando la tengas en el contexto.` },
    { t: 'Plantilla de prompt externalizada (resources)', tipo: 'Plantilla StringTemplate', lang: 'markdown', file: 'src/main/resources/prompts/resumen-memoria.st', code: c`
Resume la siguiente memoria de prácticas para el tutor del centro.
Máximo {palabras} palabras. Destaca tecnologías usadas y competencias DAM demostradas.

<memoria>
{memoria}
</memoria>` },
    { t: 'Reglas para el asistente de código del proyecto Java', tipo: 'CLAUDE.md', lang: 'markdown', file: 'CLAUDE.md', code: c`
# tutor-ia (Spring Boot 3.5 + Spring AI)

## Comandos
- Compilar y testear: ./mvnw verify
- Arrancar: ./mvnw spring-boot:run (requiere ANTHROPIC_API_KEY)

## Arquitectura
- Controladores en *.web, servicios en *.app, integración IA en *.ia.
- Nunca llames al ChatClient desde un controlador: pasa por un servicio.
- DTOs como record; validación con jakarta.validation.

## Tests
- Usa un ChatModel falso en tests unitarios; los tests contra la API real se
  etiquetan @Tag("ia-real") y no se ejecutan en CI.` }
  ],
  actividad: {
    titulo: 'Microservicio "Tutor FCT" en Spring Boot 3 con Virtual Threads',
    contexto: c`Construye un microservicio Java 21 que asista al alumnado durante la Formación en Centros de Trabajo, con memoria persistente y modelo intercambiable (Claude en la nube, Qwen local en Ollama).`,
    requisitos: [
      'Spring AI <code>ChatClient</code> con memoria por alumno persistida en base de datos (JDBC).',
      'Endpoint de streaming SSE y endpoint de extracción estructurada a <code>record</code>.',
      'Perfil <code>local</code> (Ollama) y perfil <code>cloud</code> (Claude) seleccionables por propiedad.',
      'Prueba de carga (k6 o JMeter) con 200 usuarios concurrentes comparando hilos de plataforma y virtuales.',
      'Tests con un <code>ChatModel</code> simulado (sin llamadas reales en CI).'
    ],
    entregables: ['Proyecto Maven completo', '<code>CARGA.md</code> con resultados de rendimiento', 'Colección de peticiones (.http o Postman)'],
    rubrica: [['Diseño Spring y separación de capas', 30], ['Memoria y streaming', 25], ['Rendimiento con Virtual Threads', 25], ['Tests y configuración por perfiles', 20]]
  },
  faq: [
    ['¿Los Virtual Threads aceleran la llamada al LLM?', c`No: la latencia del modelo es la misma. Lo que mejoran es la <em>capacidad</em>: miles de peticiones esperando I/O sin agotar hilos. Evita bloques <code>synchronized</code> largos que fijen (pinning) el hilo portador.`],
    ['La memoria crece y el coste se dispara.', c`Usa ventana de mensajes (<code>maxMessages</code>), resume conversaciones largas con un modelo barato o recupera solo los turnos relevantes. Mide los tokens de entrada por petición en Micrometer.`],
    ['¿Puedo usar el SDK oficial de Anthropic para Java en lugar de Spring AI?', c`Sí: <code>com.anthropic:anthropic-java</code> da acceso completo y temprano a todas las funciones de la API (razonamiento, caché, salidas estructuradas). Spring AI aporta portabilidad entre proveedores; elige según si priorizas funciones específicas o abstracción.`],
    ['¿Cómo pruebo sin gastar tokens?', c`Implementa un <code>ChatModel</code> falso que devuelva respuestas fijas para tests unitarios, y graba/reproduce respuestas reales (patrón VCR) para tests de integración. Reserva las llamadas reales para una suite manual o nocturna.`]
  ]
});

SESIONES.push({
  n: 7,
  corto: 'Structured Outputs y Tool Use',
  titulo: 'Structured Outputs, Validación Estricta y Function Calling (Tool Use)',
  duracion: '6 h',
  resumen: c`JSON garantizado por esquema con Pydantic (Python) y Records (Java), bucle de herramientas para ejecutar métodos de backend y consultas SQL seguras sin dejar que el modelo escriba SQL libre.`,
  stack: ['Pydantic v2', 'anthropic SDK', 'SDK Java de Anthropic', 'JSON Schema', 'PostgreSQL', 'psycopg 3'],
  teoria: {
    intro: c`Un LLM integrado en software debe devolver <strong>datos</strong>, no prosa. Las <strong>salidas estructuradas</strong> restringen la generación a un esquema JSON y el <strong>tool use</strong> permite que el modelo solicite la ejecución de funciones tuyas. Tu código sigue al mando: el modelo propone, tu backend valida y ejecuta.`,
    bloques: [
      ['1. Del "responde en JSON" al JSON garantizado', c`<p>Pedir JSON en el prompt falla en un porcentaje pequeño pero real (comillas, campos inventados). Con <strong>structured outputs</strong> (<code>output_config.format</code> o el helper <code>messages.parse()</code>) el proveedor aplica decodificación restringida: la salida siempre valida contra el esquema.</p>`],
      ['2. Tool use: el contrato', c`<p>Declaras herramientas con <code>name</code>, <code>description</code> e <code>input_schema</code>. El modelo responde con bloques <code>tool_use</code> (<code>stop_reason == "tool_use"</code>); ejecutas la función y devuelves <code>tool_result</code> en el siguiente mensaje de usuario. Repite hasta <code>end_turn</code>. Con <code>strict: true</code> los argumentos cumplen exactamente el esquema.</p>`],
      ['3. Descripciones: la documentación que lee el modelo', c`<p>La calidad del tool use depende de las descripciones: qué hace, cuándo usarla, cuándo <em>no</em> usarla, formato de cada parámetro y ejemplos. Es documentación de API para un consumidor muy literal.</p>`],
      ['4. SQL seguro', c`<p>Nunca ejecutes SQL generado libremente por el modelo contra producción. Patrones seguros: (a) herramientas con parámetros tipados que tu código traduce a consultas parametrizadas; (b) si necesitas SQL libre, usuario de solo lectura, vistas restringidas, <code>statement_timeout</code>, validación con un parser y lista blanca de tablas.</p>`],
      ['5. Validación en profundidad', c`<p>Aunque el esquema garantice la forma, valida la semántica (rangos, existencia de ids, permisos del usuario). Devuelve errores al modelo con <code>is_error: true</code> para que se corrija, y limita el número de iteraciones del bucle.</p>`]
    ],
    flujo: ['Pregunta del usuario', 'LLM + definición de tools', 'tool_use (args JSON)', 'Validación Pydantic / Record', 'Ejecución parametrizada en backend', 'tool_result', 'Respuesta final'],
    tabla: {
      cap: 'Técnicas de salida estructurada',
      head: ['Técnica', 'Garantía', 'Cuándo usarla'],
      rows: [
        ['Instrucción en el prompt', 'Ninguna', 'Prototipos'],
        ['Structured outputs (<code>output_config.format</code> / <code>parse()</code>)', 'JSON válido según esquema', 'Extracción, clasificación, generación de datos'],
        ['Tool use con <code>strict: true</code>', 'Argumentos válidos según esquema', 'Acciones sobre sistemas'],
        ['Validación posterior (Pydantic / Bean Validation)', 'Semántica de negocio', 'Siempre, como segunda capa']
      ]
    },
    claves: ['El modelo propone; tu código decide y ejecuta.', 'Esquemas pequeños, enums cerrados y descripciones claras reducen errores.', 'Toda herramienta que escribe datos necesita autorización y, a veces, confirmación humana.']
  },
  taller: {
    entorno: 'PowerShell 7 · VS Code + IntelliJ · PostgreSQL 16 en Docker',
    pasos: [
      { t: 'Base de datos de ejemplo', lang: 'powershell', file: 'PowerShell', code: c`
docker run -d --name pg-mia -e POSTGRES_PASSWORD=mia -p 5432:5432 postgres:16
uv init mia-s07-tools; cd mia-s07-tools
uv add anthropic pydantic "psycopg[binary]"
docker exec -i pg-mia psql -U postgres -c "CREATE ROLE lector LOGIN PASSWORD 'lector'; "` },
      { t: 'Extracción estructurada con Pydantic y messages.parse()', lang: 'python', file: 'src/extraer.py', code: c`
from typing import Literal
import anthropic
from pydantic import BaseModel, Field

client = anthropic.Anthropic()


class Incidencia(BaseModel):
    categoria: Literal["hardware", "software", "red", "cuentas", "otros"]
    prioridad: Literal["baja", "media", "alta", "critica"]
    aula: str | None = Field(description="Código del aula si se menciona, p. ej. 'A-12'")
    resumen: str = Field(description="Resumen en una frase, máximo 20 palabras")
    requiere_tecnico_presencial: bool


correo = """Buenos días, en el aula B-04 desde esta mañana ningún equipo tiene
internet y a las 10 hay examen práctico de DAM. Gracias. — Luis (profesor)"""

r = client.messages.parse(
    model="claude-opus-5-5",
    max_tokens=2000,
    messages=[{"role": "user", "content": f"Clasifica esta incidencia del centro:\n\n{correo}"}],
    output_format=Incidencia,
)
incidencia: Incidencia = r.parsed_output
print(incidencia.model_dump_json(indent=2))` },
      { t: 'Herramientas tipadas para consultar la base de datos', d: 'El modelo no escribe SQL: elige una herramienta y sus parámetros; el SQL es nuestro y está parametrizado.', lang: 'python', file: 'src/herramientas.py', code: c`
from datetime import date
import psycopg
from pydantic import BaseModel, Field

DSN = "postgresql://lector:lector@localhost:5432/postgres"


class BuscarModulos(BaseModel):
    ciclo: str = Field(pattern="^(DAM|DAW|ASIR|SMR)$")
    curso: int = Field(ge=1, le=2)


class PlazasFct(BaseModel):
    ciclo: str = Field(pattern="^(DAM|DAW|ASIR|SMR)$")
    desde: date


def buscar_modulos(args: BuscarModulos) -> list[dict]:
    with psycopg.connect(DSN, options="-c statement_timeout=3000") as con:
        filas = con.execute(
            "SELECT codigo, nombre, horas FROM modulos WHERE ciclo = %s AND curso = %s ORDER BY codigo",
            (args.ciclo, args.curso)).fetchall()
    return [{"codigo": c, "nombre": n, "horas": h} for c, n, h in filas]


def plazas_fct(args: PlazasFct) -> list[dict]:
    with psycopg.connect(DSN, options="-c statement_timeout=3000") as con:
        filas = con.execute(
            "SELECT empresa, plazas, inicio FROM ofertas_fct WHERE ciclo = %s AND inicio >= %s",
            (args.ciclo, args.desde)).fetchall()
    return [{"empresa": e, "plazas": p, "inicio": i.isoformat()} for e, p, i in filas]


def esquema(modelo: type[BaseModel]) -> dict:
    s = modelo.model_json_schema()
    s["additionalProperties"] = False
    return s


TOOLS = [
    {"name": "buscar_modulos", "strict": True,
     "description": "Lista los módulos profesionales de un ciclo y curso. Úsala para preguntas sobre asignaturas u horas.",
     "input_schema": esquema(BuscarModulos)},
    {"name": "plazas_fct", "strict": True,
     "description": "Ofertas de prácticas FCT disponibles para un ciclo a partir de una fecha (YYYY-MM-DD).",
     "input_schema": esquema(PlazasFct)},
]
EJECUTORES = {"buscar_modulos": (BuscarModulos, buscar_modulos), "plazas_fct": (PlazasFct, plazas_fct)}` },
      { t: 'Bucle de tool use con validación y errores devueltos al modelo', lang: 'python', file: 'src/agente_sql.py', code: c`
import json
import anthropic
from pydantic import ValidationError
from herramientas import TOOLS, EJECUTORES

client = anthropic.Anthropic()


def responder(pregunta: str, max_iter: int = 6) -> str:
    mensajes = [{"role": "user", "content": pregunta}]
    for _ in range(max_iter):
        r = client.messages.create(model="claude-opus-5-5", max_tokens=8000, tools=TOOLS,
                                   system="Responde usando solo datos obtenidos con las herramientas.",
                                   messages=mensajes)
        mensajes.append({"role": "assistant", "content": r.content})
        if r.stop_reason != "tool_use":
            return "".join(b.text for b in r.content if b.type == "text")

        resultados = []
        for b in r.content:
            if b.type != "tool_use":
                continue
            Modelo, funcion = EJECUTORES[b.name]
            try:
                salida = funcion(Modelo.model_validate(b.input))
                resultados.append({"type": "tool_result", "tool_use_id": b.id,
                                   "content": json.dumps(salida, ensure_ascii=False)})
            except (ValidationError, Exception) as e:   # el modelo verá el error y podrá corregir
                resultados.append({"type": "tool_result", "tool_use_id": b.id,
                                   "content": f"Error: {e}", "is_error": True})
        mensajes.append({"role": "user", "content": resultados})   # todos los resultados en un único mensaje
    return "No se pudo completar la consulta en el número máximo de pasos."


print(responder("¿Qué módulos de segundo de DAM tienen más de 100 horas y qué empresas ofrecen FCT desde marzo?"))` },
      { t: 'Salida estructurada a Record en Java 21 (SDK oficial de Anthropic)', lang: 'java', file: 'ExtraerIncidencia.java', code: c`
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.StructuredMessageCreateParams;
import java.util.List;

public class ExtraerIncidencia {

    enum Prioridad { BAJA, MEDIA, ALTA, CRITICA }
    record Incidencia(String categoria, Prioridad prioridad, String aula, String resumen, boolean requiereTecnico) {}
    record Lote(List<Incidencia> incidencias) {}

    public static void main(String[] args) {
        AnthropicClient client = AnthropicOkHttpClient.fromEnv();

        StructuredMessageCreateParams<Lote> params = MessageCreateParams.builder()
                .model("claude-opus-5-5")
                .maxTokens(4000L)
                .outputConfig(Lote.class)                 // esquema derivado del record
                .addUserMessage("""
                        Extrae las incidencias:
                        1) Proyector del aula A-12 no enciende.
                        2) Un alumno no puede acceder a Moodle desde ayer, tiene entrega hoy.
                        """)
                .build();

        client.messages().create(params).content().stream()
                .flatMap(b -> b.text().stream())
                .forEach(t -> t.text().incidencias().forEach(System.out::println));
    }
}` }
    ]
  },
  prompts: [
    { t: 'Descripción de herramienta de calidad profesional', tipo: 'Tool definition', lang: 'json', code: c`
{
  "name": "reservar_aula",
  "strict": true,
  "description": "Reserva un aula del centro para una franja horaria. Úsala SOLO cuando el usuario haya confirmado aula, fecha y franja. NO la uses para consultar disponibilidad (usa consultar_disponibilidad). Devuelve el id de reserva o un error si el aula está ocupada.",
  "input_schema": {
    "type": "object",
    "additionalProperties": false,
    "required": ["aula", "fecha", "franja", "motivo"],
    "properties": {
      "aula":   {"type": "string", "description": "Código del aula, formato letra-dos dígitos, p. ej. B-04"},
      "fecha":  {"type": "string", "description": "Fecha ISO YYYY-MM-DD"},
      "franja": {"type": "string", "enum": ["08:00-10:00", "10:00-12:00", "12:30-14:30", "16:00-18:00", "18:00-20:00"]},
      "motivo": {"type": "string", "description": "Motivo breve (máx. 80 caracteres)"}
    }
  }
}` },
    { t: 'Esquema de extracción de currículums de titulados DAM', tipo: 'Pydantic', lang: 'python', code: c`
from typing import Literal
from pydantic import BaseModel, Field


class Tecnologia(BaseModel):
    nombre: str
    nivel: Literal["basico", "intermedio", "avanzado"]
    evidencia: str = Field(description="Cita literal del CV que justifica el nivel")


class PerfilDAM(BaseModel):
    anios_experiencia: float = Field(ge=0)
    lenguajes: list[Tecnologia]
    frameworks: list[Tecnologia]
    proyectos_destacados: list[str] = Field(max_length=5)
    apto_master_ia: bool = Field(description="True si acredita programación en Java/Kotlin/Python")
    # Nota: no extraigas edad, sexo, nacionalidad ni foto (minimización de datos, art. 5.1.c RGPD)` },
    { t: 'System prompt para agente con herramientas de solo lectura', tipo: 'System Prompt', lang: 'markdown', code: c`
Eres un asistente de consultas académicas con acceso a herramientas de solo lectura.
- Usa herramientas para todo dato concreto; nunca respondas cifras de memoria.
- Si una herramienta devuelve error, corrige los parámetros una vez; si vuelve a
  fallar, explica al usuario qué dato falta.
- Puedes llamar a varias herramientas en paralelo si son independientes.
- Si la pregunta requiere modificar datos, indica que no tienes permisos para ello.` }
  ],
  actividad: {
    titulo: 'Asistente de Secretaría con herramientas tipadas y SQL seguro',
    contexto: c`Diseña un asistente que responda preguntas sobre oferta formativa, horarios y FCT consultando una base de datos PostgreSQL, sin que el modelo genere nunca SQL libre.`,
    requisitos: [
      'Esquema de BD con al menos 5 tablas y datos sintéticos.',
      'Mínimo 5 herramientas tipadas (Pydantic) con <code>strict: true</code> y consultas parametrizadas.',
      'Rol de BD de solo lectura y <code>statement_timeout</code>.',
      'Implementación equivalente de una de las herramientas en Java 21 con <code>record</code>.',
      'Batería de 20 preguntas de prueba con resultado esperado y tasa de acierto medida.'
    ],
    entregables: ['<code>schema.sql</code> + <code>seed.sql</code>', 'Código Python y Java', '<code>EVALUACION.md</code> con la batería de pruebas'],
    rubrica: [['Seguridad (sin SQL libre, permisos mínimos)', 30], ['Diseño de herramientas y descripciones', 25], ['Bucle de tool use robusto', 25], ['Evaluación con batería de pruebas', 20]]
  },
  faq: [
    ['El modelo llama a la herramienta equivocada.', c`Mejora las descripciones indicando cuándo usarla y cuándo no, reduce herramientas solapadas y nombra los parámetros de forma inequívoca. Con muchas herramientas (decenas), usa búsqueda de herramientas o agrúpalas por dominio.`],
    ['¿Puedo forzar que el modelo use una herramienta concreta?', c`Algunos modelos actuales ya no admiten forzar la herramienta (<code>tool_choice</code> de tipo <code>tool</code>/<code>any</code>). Usa <code>tool_choice: auto</code> con una instrucción explícita, o directamente salidas estructuradas si lo único que querías era JSON.`],
    ['¿Por qué devolver todos los <code>tool_result</code> en un único mensaje?', c`Cuando el modelo pide varias herramientas a la vez (llamadas en paralelo), espera todos los resultados juntos en el siguiente turno de usuario. Repartirlos en varios mensajes degrada el comportamiento de llamadas paralelas.`],
    ['Los campos opcionales salen como <code>null</code> inventados.', c`Describe explícitamente "si no aparece en el texto, null" y evita campos obligatorios que el texto puede no contener. Incluye en el esquema una cita literal de evidencia para los datos críticos y valida que la cita existe en el original.`]
  ]
});

SESIONES.push({
  n: 8,
  corto: 'LLMs locales y soberanía',
  titulo: 'Despliegue de LLMs Locales y Soberanía de Datos (Ollama, vLLM, GGUF)',
  duracion: '6 h',
  resumen: c`Cuantización de modelos abiertos (Llama, DeepSeek, Qwen) a GGUF/AWQ, ejecución con Ollama y llama.cpp en el portátil y servicio de alto rendimiento con vLLM en servidor propio, sin dependencia cloud.`,
  stack: ['Ollama', 'llama.cpp', 'GGUF', 'vLLM', 'AWQ / GPTQ', 'Docker', 'WSL2', 'LangChain4j Ollama'],
  teoria: {
    intro: c`Cuando los datos no pueden salir del centro (expedientes, datos de salud, código propietario) o el volumen hace inviable el coste por token, la respuesta es <strong>inferencia local</strong> con modelos de pesos abiertos. La clave técnica es la <strong>cuantización</strong>: representar los pesos con menos bits.`,
    bloques: [
      ['1. Soberanía de datos y marco legal', c`<p>Un modelo en infraestructura propia elimina transferencias internacionales y encargados del tratamiento externos (arts. 28 y 44 RGPD). Pero sigues siendo responsable: control de accesos, registros, y cumplimiento de la <strong>licencia</strong> de los pesos (Llama Community License, Apache 2.0 en Qwen, MIT en DeepSeek…).</p>`],
      ['2. Cuantización', c`<p>Pasar de 16 bits a 4 bits divide la memoria por 4 con una pérdida de calidad pequeña en modelos ≥ 7B. Formatos: <strong>GGUF</strong> (llama.cpp/Ollama, CPU+GPU, variantes Q4_K_M, Q5_K_M, Q8_0), <strong>AWQ</strong> y <strong>GPTQ</strong> (GPU, vLLM), <strong>FP8</strong> en GPUs recientes.</p>`],
      ['3. Ollama y llama.cpp', c`<p>Ollama empaqueta llama.cpp con un gestor de modelos y una API REST (nativa y compatible con OpenAI en <code>/v1</code>). Ideal para desarrollo y equipos individuales. Un <code>Modelfile</code> fija system prompt, parámetros y plantilla.</p>`],
      ['4. vLLM para producción', c`<p>vLLM maximiza el rendimiento con <strong>PagedAttention</strong> (caché KV paginada), <em>continuous batching</em> y prefix caching. Sirve decenas de usuarios concurrentes en una sola GPU con API compatible OpenAI. Requiere Linux (o WSL2) y GPU NVIDIA.</p>`],
      ['5. Dimensionamiento', c`<p>Regla práctica: modelo 7-8B en Q4 ≈ 5 GB (portátil con 16 GB RAM o GPU de 8 GB); 14B Q4 ≈ 9 GB; 32B Q4 ≈ 20 GB (GPU 24 GB); 70B Q4 ≈ 40 GB (2 GPUs o Mac con memoria unificada). Suma la caché KV según contexto y usuarios concurrentes.</p>`]
    ],
    formula: c`Tokens/s (decodificación, limitado por memoria) ≈ ancho de banda memoria (GB/s) ÷ tamaño del modelo (GB)<br>Ej.: GPU 450 GB/s con modelo de 5 GB → ~90 tokens/s teóricos por usuario`,
    flujo: ['Pesos HF (safetensors bf16)', 'convert_hf_to_gguf.py', 'GGUF f16', 'llama-quantize Q4_K_M', 'Ollama Modelfile', 'API local :11434'],
    tabla: {
      cap: 'Motores de inferencia local',
      head: ['Motor', 'Hardware', 'Concurrencia', 'Uso recomendado'],
      rows: [
        ['Ollama', 'CPU, NVIDIA, AMD, Apple Silicon', 'Baja-media', 'Desarrollo, puestos individuales, prototipos'],
        ['llama.cpp (llama-server)', 'Cualquiera', 'Media', 'Embebido, edge, máximo control'],
        ['vLLM', 'NVIDIA/AMD en Linux', 'Alta', 'Servidor de producción multiusuario'],
        ['SGLang / TGI', 'NVIDIA en Linux', 'Alta', 'Alternativas de producción'],
        ['LM Studio', 'Escritorio', 'Baja', 'Exploración sin código']
      ]
    },
    claves: ['Comprueba la licencia del modelo antes de usarlo en producción o con fines comerciales.', 'Q4_K_M es el punto de partida razonable en GGUF.', 'La API compatible OpenAI permite cambiar de nube a local sin tocar el código cliente.']
  },
  taller: {
    entorno: 'Windows 11 + PowerShell 7 (Ollama) · WSL2 Ubuntu 24.04 (llama.cpp y vLLM) · GPU NVIDIA recomendada',
    pasos: [
      { t: 'Instalar Ollama y descargar modelos', lang: 'powershell', file: 'PowerShell', code: c`
winget install Ollama.Ollama
ollama pull qwen2.5:7b
ollama pull llama3.1:8b
ollama pull deepseek-r1:8b
ollama list
ollama run qwen2.5:7b "Explica qué es la cuantización en 3 frases"
ollama ps      # muestra VRAM/RAM en uso y si el modelo está en GPU` },
      { t: 'Modelfile: asistente local personalizado', lang: 'dockerfile', file: 'Modelfile', code: c`
FROM qwen2.5:7b
PARAMETER num_ctx 8192
PARAMETER temperature 0.3
SYSTEM """Eres el asistente interno de Secretaría del CFP José Ramón Otero.
Los datos que recibes son confidenciales y no salen de este servidor.
Responde en español, de forma breve y citando la normativa cuando proceda."""` },
      { t: 'Crear y usar el modelo personalizado', lang: 'powershell', file: 'PowerShell', code: c`
ollama create secretaria-jro -f Modelfile
ollama run secretaria-jro "¿Qué documentación necesito para convalidar módulos?"

# API nativa
$body = @{ model="secretaria-jro"; stream=$false; messages=@(@{role="user"; content="Hola"}) } | ConvertTo-Json -Depth 4
Invoke-RestMethod http://localhost:11434/api/chat -Method Post -Body $body -ContentType "application/json"` },
      { t: 'El mismo cliente para nube y local (API compatible OpenAI)', lang: 'python', file: 'src/cliente_local.py', code: c`
from openai import OpenAI

local = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")   # la clave se ignora
r = local.chat.completions.create(
    model="secretaria-jro",
    messages=[{"role": "user", "content": "Redacta un aviso de cambio de horario para 2º DAM"}],
)
print(r.choices[0].message.content)
print(r.usage)` },
      { t: 'Cuantizar tú mismo a GGUF con llama.cpp (WSL2)', lang: 'bash', file: 'WSL2 · bash', code: c`
git clone https://github.com/ggml-org/llama.cpp && cd llama.cpp
cmake -B build -DGGML_CUDA=ON && cmake --build build --config Release -j
pip install -r requirements.txt huggingface_hub
huggingface-cli download Qwen/Qwen2.5-3B-Instruct --local-dir modelos/qwen3b

python convert_hf_to_gguf.py modelos/qwen3b --outfile qwen3b-f16.gguf --outtype f16
./build/bin/llama-quantize qwen3b-f16.gguf qwen3b-Q4_K_M.gguf Q4_K_M
ls -lh *.gguf                                  # compara tamaños
./build/bin/llama-perplexity -m qwen3b-Q4_K_M.gguf -f wiki.test.raw -c 512   # mide la degradación
./build/bin/llama-server -m qwen3b-Q4_K_M.gguf --port 8081 -ngl 99 -c 8192` },
      { t: 'Servir con vLLM en servidor (Docker + GPU)', lang: 'bash', file: 'WSL2 · bash', code: c`
docker run --gpus all -p 8000:8000 --ipc=host \
  -v ~/.cache/huggingface:/root/.cache/huggingface \
  vllm/vllm-openai:latest \
  --model Qwen/Qwen2.5-7B-Instruct-AWQ \
  --quantization awq \
  --max-model-len 16384 \
  --gpu-memory-utilization 0.90 \
  --enable-prefix-caching

# Prueba de carga básica: 32 peticiones concurrentes
seq 32 | xargs -P 32 -I{} curl -s localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"Qwen/Qwen2.5-7B-Instruct-AWQ","messages":[{"role":"user","content":"Di hola"}],"max_tokens":50}' > /dev/null` },
      { t: 'Consumir Ollama desde Java con LangChain4j', lang: 'java', file: 'ClienteLocal.java', code: c`
import dev.langchain4j.model.ollama.OllamaChatModel;
import java.time.Duration;

public class ClienteLocal {
    public static void main(String[] args) {
        var modelo = OllamaChatModel.builder()
                .baseUrl("http://localhost:11434")
                .modelName("secretaria-jro")
                .timeout(Duration.ofSeconds(120))
                .build();
        System.out.println(modelo.chat("Enumera los módulos de primero de DAM"));
    }
}` }
    ]
  },
  prompts: [
    { t: 'System prompt compacto para modelos pequeños', tipo: 'System Prompt', lang: 'markdown', d: 'Los modelos de 3-8B siguen peor instrucciones largas: frases cortas, imperativas y ejemplo de formato.', code: c`
Responde en español.
Máximo 5 frases.
Si no sabes algo, di "No tengo esa información".
Formato:
Respuesta: <texto>
Fuente: <documento o "ninguna">` },
    { t: 'Benchmark comparativo local vs. nube', tipo: 'LLM-as-a-Judge', lang: 'markdown', code: c`
Compara dos respuestas a la misma pregunta de un alumno de DAM.
<pregunta>{pregunta}</pregunta>
<respuesta_A>{respuesta_modelo_local}</respuesta_A>
<respuesta_B>{respuesta_modelo_nube}</respuesta_B>
Evalúa corrección, completitud y claridad. No sabes qué modelo generó cada una.
Devuelve JSON: {"ganador": "A"|"B"|"empate", "diferencia": "nula"|"pequeña"|"grande", "motivo": "..."}` }
  ],
  actividad: {
    titulo: 'Servidor de IA soberano para la Secretaría del centro',
    contexto: c`Despliega un asistente que funcione íntegramente en infraestructura del centro y justifica técnica y legalmente la elección de modelo y cuantización.`,
    requisitos: [
      'Comparar al menos 3 modelos abiertos (p. ej. Llama 3.1 8B, Qwen 2.5 7B, DeepSeek-R1 8B) y 2 niveles de cuantización.',
      'Medir tokens/s, TTFT, memoria y calidad (batería de 30 preguntas evaluadas con LLM-as-a-Judge o manualmente).',
      'Desplegar el ganador con Ollama (o vLLM si hay GPU Linux) en <code>docker-compose</code> con Open WebUI.',
      'Informe de licencias de los modelos evaluados y análisis RGPD (sin transferencias internacionales).'
    ],
    entregables: ['<code>docker-compose.yml</code> y <code>Modelfile</code>', '<code>BENCHMARK.md</code> con tablas y gráficos', '<code>LICENCIAS_Y_RGPD.md</code>'],
    rubrica: [['Rigor del benchmark', 35], ['Despliegue reproducible', 25], ['Análisis legal y de licencias', 20], ['Conclusiones y recomendación', 20]]
  },
  faq: [
    ['Ollama va lentísimo: ~2 tokens/s.', c`Probablemente el modelo no cabe en VRAM y se ejecuta (total o parcialmente) en CPU. Comprueba <code>ollama ps</code> (columna PROCESSOR), usa un modelo más pequeño o una cuantización menor, y reduce <code>num_ctx</code>.`],
    ['¿Puedo usar vLLM en Windows?', c`No de forma nativa: usa WSL2 con los drivers NVIDIA para WSL, o Docker Desktop con backend WSL2 y soporte GPU. En Windows puro, Ollama y llama.cpp son las opciones.`],
    ['¿Q4 o Q8?', c`Q8_0 es casi indistinguible de f16 pero ocupa el doble que Q4_K_M. Para modelos ≥ 7B, Q4_K_M/Q5_K_M es el equilibrio habitual. Mide la perplejidad y, sobre todo, tu batería de casos reales: la métrica que importa es la de tu tarea.`],
    ['¿Los modelos "distill" de DeepSeek-R1 son DeepSeek-R1?', c`No: son modelos más pequeños (basados en Qwen o Llama) entrenados con salidas del R1 original. Razonan mejor que su base, pero lejos del modelo completo. Revisa también su licencia, que hereda condiciones del modelo base.`]
  ]
});
