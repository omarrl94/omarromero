// M3 · IA generativa y modelos de lenguaje (40 h · semanas 5–6)

SESIONES.push({
  n: 5,
  semana: '5',
  fechas: '29 oct – 2 nov 2029',
  corto: 'Cómo funcionan los LLM: APIs y modelos locales',
  titulo: 'Cómo Funcionan los LLM: Tokens, Contexto y Límites; APIs Comerciales y Modelos Abiertos en Local',
  duracion: 'Semana 5 · 20 h',
  resumen: c`Tokens, ventana de contexto, temperatura, límites y alucinaciones explicados desde dentro del transformer. Integración con APIs de modelos comerciales (Claude, Gemini, Kimi, OpenAI) con streaming y caché de prompts, y ejecución de modelos abiertos en local con Ollama.`,
  stack: ['anthropic SDK', 'google-genai', 'openai SDK', 'Ollama', 'tiktoken', 'FastAPI + SSE'],
  teoria: {
    intro: c`Para integrar bien un modelo de lenguaje en una app hay que saber cómo funciona por dentro lo justo para razonar sobre <strong>coste, latencia, calidad y privacidad</strong>. Esta semana entiendes tokens, contexto y alucinaciones, y conectas tu código tanto a modelos comerciales en la nube como a modelos abiertos que se ejecutan en tu propio equipo.`,
    bloques: [
      [
        '1. Tokens',
        c`<p>Byte Pair Encoding parte de bytes y fusiona iterativamente los pares más frecuentes. Un token ≈ 0,75 palabras en inglés y algo menos en español. El coste, el límite de contexto y la latencia se miden en tokens, no en caracteres.</p>`
      ],
      [
        '2. Embeddings y posición',
        c`<p>Cada id de token se convierte en un vector aprendido (<code>nn.Embedding</code>). Como la atención no conoce el orden, se añade información posicional: los modelos actuales usan <strong>RoPE</strong> (rotary position embeddings), que rota los vectores Q y K según la posición.</p>`
      ],
      [
        '3. Atención: cómo el modelo usa el contexto',
        c`<p>Cada token produce una consulta (Q), una clave (K) y un valor (V). La similitud Q·Kᵀ, escalada y normalizada con softmax, decide cuánto "atiende" a cada token anterior. La <strong>máscara causal</strong> impide ver el futuro.</p>`
      ],
      [
        '4. Generación, temperatura y caché KV',
        c`<p>El modelo predice la distribución del siguiente token; se muestrea (temperatura, top-p) y se repite. Para no recalcular el pasado se guardan K y V de tokens anteriores: la <strong>caché KV</strong>, que crece con el contexto y domina la VRAM en contextos largos. GQA (grouped-query attention) la reduce compartiendo K/V entre cabezas.</p>`
      ],
      [
        '5. Ventana de contexto, límites y alucinaciones',
        c`<p>La <strong>ventana de contexto</strong> es todo lo que el modelo ve en una llamada (instrucciones, historial, documentos y respuesta). Más contexto implica más coste y latencia. El modelo no recuerda nada entre llamadas y no verifica hechos: genera la continuación más probable, por eso puede <strong>alucinar</strong> con total seguridad. Las soluciones de ingeniería son darle datos verificables (RAG, M4), pedir salidas estructuradas y validables, y evaluar (M4 y M6).</p>`
      ],
      [
        '6. Anatomía de una petición',
        c`<p>Todos los proveedores comparten conceptos: <strong>modelo</strong>, <strong>system prompt</strong> (instrucciones del operador), <strong>mensajes</strong> (turnos user/assistant), <strong>max_tokens</strong> (tope de salida), herramientas y formato de salida. La API es <em>stateless</em>: envías el historial completo en cada turno.</p>`
      ],
      [
        '7. Control del razonamiento',
        c`<p>Los modelos actuales "piensan" antes de responder. En <strong>Claude</strong> (familia 5.x) el razonamiento es <em>adaptativo</em>: se controla con <code>output_config.effort</code> (<code>low</code> → <code>max</code>); el antiguo presupuesto fijo <code>budget_tokens</code> ya no se acepta en los modelos actuales. En <strong>Gemini</strong> se usa <code>thinking_config.thinking_budget</code> (tokens de razonamiento; 0 lo desactiva en los modelos Flash). En la API de OpenAI, <code>reasoning.effort</code>. Más razonamiento = mejor calidad en tareas complejas, más latencia y coste.</p>`
      ],
      [
        '8. Streaming con Server-Sent Events',
        c`<p>El usuario percibe la latencia del <em>primer token</em> (TTFT), no la total. Con streaming reenviamos los fragmentos al navegador vía SSE (<code>text/event-stream</code>). En peticiones largas el streaming además evita timeouts HTTP.</p>`
      ],
      [
        '9. Prompt Caching',
        c`<p>Si el prefijo del prompt (herramientas → system → mensajes) se repite byte a byte, el proveedor reutiliza su procesamiento: las lecturas de caché cuestan aproximadamente un 10 % del precio de entrada normal en Claude. Coloca lo estable primero (instrucciones, documentos) y lo variable al final. Cualquier cambio en el prefijo (una fecha, un id) invalida todo lo que viene detrás.</p>`
      ],
      [
        '10. Modelos abiertos en local',
        c`<p>Llama, Qwen, DeepSeek o Gemma pueden ejecutarse en tu equipo con <strong>Ollama</strong> gracias a la cuantización (pesos de 16 bits comprimidos a 4-8 bits). Ventajas: privacidad (los datos no salen), coste fijo y funcionamiento sin conexión. Inconvenientes: menor calidad que los modelos de frontera y necesidad de hardware. Revisa siempre la licencia de los pesos.</p>`
      ]
    ],
    formula: 'Attention(Q, K, V) = softmax( Q·Kᵀ / √d_k + M_causal ) · V',
    flujo: [
      'Texto',
      'Tokens',
      'Transformer',
      'Distribución del siguiente token',
      'Muestreo (temperatura)',
      'Streaming al cliente'
    ],
    tabla: {
      cap: c`Comparativa práctica de integración (consulta siempre la documentación vigente: los modelos cambian cada pocos meses)`,
      head: ['Proveedor', 'SDK Python', 'Control de razonamiento', 'Caché de prompts', 'Particularidades'],
      rows: [
        [
          'Anthropic Claude',
          c`<code>anthropic</code>`,
          c`<code>output_config.effort</code> + thinking adaptativo`,
          c`Explícita con <code>cache_control</code>`,
          'System prompt separado, tool use y salidas estructuradas nativas'
        ],
        [
          'Google Gemini (AI Studio)',
          c`<code>google-genai</code>`,
          c`<code>thinking_config.thinking_budget</code>`,
          'Implícita + caché de contexto explícita',
          'Multimodal nativo (audio, vídeo, PDF)'
        ],
        [
          'Moonshot Kimi',
          c`<code>openai</code> (endpoint compatible)`,
          'Según modelo',
          'Automática',
          'API compatible con OpenAI, contexto largo'
        ],
        [
          'OpenAI',
          c`<code>openai</code>`,
          c`<code>reasoning.effort</code>`,
          'Automática por prefijo',
          'Responses API'
        ],
        [
          'Modelos abiertos (Llama, Qwen, DeepSeek)',
          'Ollama / vLLM (compatibles OpenAI)',
          'Según modelo',
          'Prefix caching en vLLM',
          'Control total y soberanía de datos (esta semana)'
        ]
      ]
    },
    claves: [
      'Coste, latencia y límites se miden en tokens.',
      'La caché KV crece linealmente con el contexto: contexto largo = más VRAM.',
      'Un LLM predice tokens probables, no verifica hechos: de ahí las alucinaciones y la necesidad de RAG.',
      'Nunca hardcodees claves de API: variables de entorno o gestor de secretos.'
    ]
  },
  taller: {
    entorno: 'PowerShell 7 · VS Code · Python 3.12 · claves en variables de entorno de usuario',
    pasos: [
      {
        t: 'Explorar la tokenización',
        lang: 'python',
        file: 'src/tokens.py',
        code: c`
import tiktoken
from transformers import AutoTokenizer

texto = "El alumnado de DAM desarrolla aplicaciones multiplataforma con Kotlin."
enc = tiktoken.get_encoding("o200k_base")
ids = enc.encode(texto)
print(len(ids), "tokens:", [enc.decode([i]) for i in ids])

tok = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-0.5B-Instruct")
print(len(tok(texto)["input_ids"]), "tokens con el tokenizer de Qwen")
print(tok.apply_chat_template([{"role": "user", "content": "Hola"}], tokenize=False, add_generation_prompt=True))`
      },
      {
        t: 'Proyecto y secretos',
        d: 'Las claves se guardan como variables de entorno del usuario de Windows, nunca en el repositorio.',
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
uv init mia-s05-pasarela
cd mia-s05-pasarela
uv add anthropic google-genai openai fastapi "uvicorn[standard]" sse-starlette python-dotenv

[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-ant-...", "User")
[Environment]::SetEnvironmentVariable("GEMINI_API_KEY", "AIza...", "User")
[Environment]::SetEnvironmentVariable("MOONSHOT_API_KEY", "sk-...", "User")
# Cierra y vuelve a abrir la terminal para que se carguen
Add-Content .gitignore ".env"`
      },
      {
        t: 'Claude: petición básica con esfuerzo de razonamiento',
        lang: 'python',
        file: 'src/claude_basico.py',
        code: c`
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
print(respuesta.usage)                   # input_tokens, output_tokens, cache_*`
      },
      {
        t: 'Claude: Prompt Caching de un documento largo',
        d: 'El reglamento del centro (miles de tokens) se cachea; cada pregunta posterior solo paga el sufijo variable.',
        lang: 'python',
        file: 'src/claude_cache.py',
        code: c`
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
preguntar("¿Cuál es el procedimiento para reclamar una calificación?")   # debe leer de caché`
      },
      {
        t: 'Gemini (Google AI Studio) con thinking_budget',
        lang: 'python',
        file: 'src/gemini_basico.py',
        code: c`
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
    print(trozo.text or "", end="", flush=True)`
      },
      {
        t: 'Kimi y OpenAI con el SDK de OpenAI',
        d: c`Kimi (Moonshot AI) expone un endpoint compatible con OpenAI: basta con cambiar <code>base_url</code>.`,
        lang: 'python',
        file: 'src/compatibles_openai.py',
        code: c`
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
print(r2.output_text)`
      },
      {
        t: 'Modelos abiertos en local con Ollama',
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
winget install Ollama.Ollama
ollama pull qwen2.5:7b
ollama pull llama3.1:8b
ollama pull deepseek-r1:8b
ollama list
ollama run qwen2.5:7b "Explica qué es la cuantización en 3 frases"
ollama ps      # muestra VRAM/RAM en uso y si el modelo está en GPU`
      },
      {
        t: 'El mismo cliente para nube y local (API compatible OpenAI)',
        lang: 'python',
        file: 'src/cliente_local.py',
        code: c`
from openai import OpenAI

local = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")   # la clave se ignora
r = local.chat.completions.create(
    model="secretaria-jro",
    messages=[{"role": "user", "content": "Redacta un aviso de cambio de horario para 2º DAM"}],
)
print(r.choices[0].message.content)
print(r.usage)`
      },
      {
        t: 'Pasarela FastAPI con streaming SSE asíncrono',
        lang: 'python',
        file: 'src/pasarela.py',
        code: c`
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

    return EventSourceResponse(eventos())`
      },
      {
        t: 'Cliente web mínimo (EventSource vía fetch)',
        lang: 'javascript',
        file: 'static/chat.js',
        code: c`
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
}`
      }
    ]
  },
  prompts: [
    {
      t: 'System prompt de producción con secciones estables',
      tipo: 'System Prompt',
      lang: 'markdown',
      d: 'Estructura pensada para caché: todo lo estable arriba; nada de fechas ni ids dinámicos.',
      code: c`
<rol>
Eres el asistente académico del Máster en IA Aplicada al Desarrollo de Aplicaciones Multiplataforma del CFP José Ramón Otero.
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
</formato>`
    },
    {
      t: 'System prompt compacto para modelos pequeños',
      tipo: 'System Prompt',
      lang: 'markdown',
      d: 'Los modelos de 3-8B siguen peor instrucciones largas: frases cortas, imperativas y ejemplo de formato.',
      code: c`
Responde en español.
Máximo 5 frases.
Si no sabes algo, di "No tengo esa información".
Formato:
Respuesta: <texto>
Fuente: <documento o "ninguna">`
    },
    {
      t: 'Auditoría de coste en tokens',
      tipo: 'Plantilla',
      lang: 'markdown',
      code: c`
Analiza este prompt de producción y su tráfico estimado:
<prompt>{prompt}</prompt>
<trafico>{peticiones_dia} peticiones/día, salida media {tokens_salida} tokens</trafico>
Devuelve: tokens aproximados de entrada, partes estáticas cacheables, partes
redundantes que pueden eliminarse sin perder calidad y coste mensual estimado con
los precios que te indico: {precios}.`
    }
  ],
  actividad: {
    tipo: 'semanal',
    titulo: 'Entrega semanal: comparador de modelos en la nube y en local',
    contexto: c`Construye una pequeña pasarela que envíe la misma pregunta a un modelo comercial y a uno local, y compara calidad, latencia, tokens y coste.`,
    requisitos: [
      'Endpoint FastAPI con streaming SSE hacia al menos un proveedor en la nube y Ollama en local.',
      'Registro de tokens de entrada/salida, latencia hasta el primer token y coste estimado.',
      'Batería de 10 preguntas de tu dominio respondidas por ambos modelos, con valoración razonada.',
      c`Claves en variables de entorno y <code>.env</code> fuera del repositorio.`
    ],
    entregables: ['Repositorio con código y README', c`<code>COMPARATIVA.md</code>`],
    rubrica: [
      ['Integración con APIs y streaming', 40],
      ['Medición y comparativa', 40],
      ['Seguridad de secretos y documentación', 20]
    ]
  },
  faq: [
    [
      '¿Por qué el modelo "inventa" datos con total seguridad?',
      c`Porque genera la continuación más probable según sus datos de entrenamiento, sin un mecanismo de verificación. La confianza del texto no está calibrada con la veracidad. La solución de ingeniería es aportar contexto verificable (RAG, M4) y evaluar la fidelidad (M4, semana 8).`
    ],
    [
      '¿Temperatura 0 hace al modelo determinista?',
      c`Reduce la variabilidad (elige el token más probable), pero en APIs y GPUs puede haber pequeñas diferencias por paralelismo numérico y por el procesamiento por lotes del proveedor. Algunos modelos recientes ya no permiten ajustar la temperatura: el control se hace con el prompt, el esfuerzo de razonamiento y las salidas estructuradas.`
    ],
    [
      c`Recibo un error 400 al enviar <code>budget_tokens</code> o <code>temperature</code> a Claude.`,
      c`En los modelos Claude actuales el razonamiento es adaptativo y se controla con <code>output_config.effort</code>; el presupuesto fijo de tokens de razonamiento y los parámetros de muestreo (<code>temperature</code>, <code>top_p</code>) ya no se aceptan. Controla la creatividad desde el prompt y usa salidas estructuradas para respuestas deterministas en forma.`
    ],
    [
      c`Mi caché nunca acierta (<code>cache_read_input_tokens = 0</code>).`,
      c`Algo cambia en el prefijo: una fecha u hora en el system prompt, un JSON serializado con orden de claves distinto, herramientas en orden variable o un id de petición. Además, el prefijo debe superar un tamaño mínimo (cientos o miles de tokens según el modelo) y la caché expira (5 minutos por defecto, ampliable a 1 hora).`
    ],
    [
      '¿Cómo evito que la clave de API acabe en GitHub?',
      c`Variables de entorno o gestor de secretos, <code>.env</code> en <code>.gitignore</code>, y activa <em>secret scanning</em> y <em>push protection</em> en el repositorio. Si una clave se filtra, revócala inmediatamente: borrar el commit no basta.`
    ],
    [
      'Ollama va lentísimo: ~2 tokens/s.',
      c`Probablemente el modelo no cabe en VRAM y se ejecuta (total o parcialmente) en CPU. Comprueba <code>ollama ps</code> (columna PROCESSOR), usa un modelo más pequeño o una cuantización menor, y reduce <code>num_ctx</code>.`
    ]
  ]
});

SESIONES.push({
  n: 6,
  semana: '6',
  fechas: '5 – 9 nov 2029',
  corto: 'Prompts, JSON, funciones, imagen y voz',
  titulo: 'Prompts Avanzados, Salidas Estructuradas (JSON) y Llamada a Funciones; Generación de Imagen y Voz',
  duracion: 'Semana 6 · 20 h',
  resumen: c`Prompts de producción, JSON garantizado por esquema con Pydantic y records de Java, llamada a funciones para ejecutar lógica de tu backend con seguridad, integración en Spring Boot con Spring AI, generación de imagen y voz, y cómo elegir modelo por coste, latencia y privacidad. Proyecto del módulo M3.`,
  stack: [
    'Pydantic v2',
    'anthropic SDK',
    'Spring AI',
    'SDK Java de Anthropic',
    'google-genai (imagen)',
    'faster-whisper',
    'Piper TTS'
  ],
  teoria: {
    intro: c`Un LLM integrado en software debe devolver <strong>datos</strong>, no prosa. Las <strong>salidas estructuradas</strong> restringen la generación a un esquema JSON y el <strong>tool use</strong> permite que el modelo solicite la ejecución de funciones tuyas. Tu código sigue al mando: el modelo propone, tu backend valida y ejecuta.`,
    bloques: [
      [
        '1. Prompts avanzados',
        c`<p>Un prompt de producción tiene secciones estables (rol, estilo, límites, formato) y una parte variable al final, delimita los datos con etiquetas, incluye ejemplos cuando el formato es delicado y dice qué hacer si falta información. Se versiona como código y se prueba con una batería de casos.</p>`
      ],
      [
        '2. Del "responde en JSON" al JSON garantizado',
        c`<p>Pedir JSON en el prompt falla en un porcentaje pequeño pero real (comillas, campos inventados). Con <strong>structured outputs</strong> (<code>output_config.format</code> o el helper <code>messages.parse()</code>) el proveedor aplica decodificación restringida: la salida siempre valida contra el esquema.</p>`
      ],
      [
        '3. Tool use: el contrato',
        c`<p>Declaras herramientas con <code>name</code>, <code>description</code> e <code>input_schema</code>. El modelo responde con bloques <code>tool_use</code> (<code>stop_reason == "tool_use"</code>); ejecutas la función y devuelves <code>tool_result</code> en el siguiente mensaje de usuario. Repite hasta <code>end_turn</code>. Con <code>strict: true</code> los argumentos cumplen exactamente el esquema.</p>`
      ],
      [
        '4. Descripciones: la documentación que lee el modelo',
        c`<p>La calidad del tool use depende de las descripciones: qué hace, cuándo usarla, cuándo <em>no</em> usarla, formato de cada parámetro y ejemplos. Es documentación de API para un consumidor muy literal.</p>`
      ],
      [
        '5. SQL seguro',
        c`<p>Nunca ejecutes SQL generado libremente por el modelo contra producción. Patrones seguros: (a) herramientas con parámetros tipados que tu código traduce a consultas parametrizadas; (b) si necesitas SQL libre, usuario de solo lectura, vistas restringidas, <code>statement_timeout</code>, validación con un parser y lista blanca de tablas.</p>`
      ],
      [
        '6. Validación en profundidad',
        c`<p>Aunque el esquema garantice la forma, valida la semántica (rangos, existencia de ids, permisos del usuario). Devuelve errores al modelo con <code>is_error: true</code> para que se corrija, y limita el número de iteraciones del bucle.</p>`
      ],
      [
        '7. Integración en Java: Spring AI',
        c`<p><code>ChatClient</code> es una API fluida: <code>prompt().system().user().call().content()</code>. Los <strong>advisors</strong> interceptan la petición/respuesta (patrón cadena de responsabilidad) para añadir memoria, RAG, logging o guardrails sin ensuciar el servicio.</p>`
      ],
      [
        '8. Memoria conversacional',
        c`<p>La API del LLM no recuerda nada. <code>MessageWindowChatMemory</code> guarda los últimos N mensajes por <code>conversationId</code>; en producción respáldala con JDBC/Redis. Limita la ventana: más historial = más coste y más riesgo de deriva.</p>`
      ],
      [
        '9. Generación de imagen y voz',
        c`<p><strong>Imagen</strong>: modelos de difusión que generan o editan imágenes a partir de texto (iconos, ilustraciones, maquetas). <strong>Voz</strong>: reconocimiento (STT, p. ej. Whisper) y síntesis (TTS neuronal). En una app hay que decidir dónde se ejecutan (nube o dispositivo), avisar de que el contenido es sintético (art. 50 del Reglamento de IA) y no clonar voces ni generar imágenes de personas reales sin consentimiento.</p>`
      ],
      [
        '10. Elegir modelo por coste, latencia y privacidad',
        c`<ul>
<li><strong>Tareas simples y masivas</strong> (clasificar, extraer): modelo pequeño y rápido, poco razonamiento.</li>
<li><strong>Razonamiento o código complejo</strong>: modelo grande con más esfuerzo de razonamiento.</li>
<li><strong>Datos sensibles</strong>: modelo local o proveedor con contrato de encargado del tratamiento en la UE.</li>
<li><strong>Tiempo real</strong> (voz, autocompletado): latencia del primer token por encima de la calidad máxima.</li>
</ul><p>Decide con una batería de casos de tu dominio y mide el coste por tarea completada, no por llamada.</p>`
      ]
    ],
    flujo: [
      'Pregunta del usuario',
      'LLM + definición de tools',
      'tool_use (args JSON)',
      'Validación Pydantic / Record',
      'Ejecución parametrizada en backend',
      'tool_result',
      'Respuesta final'
    ],
    tabla: {
      cap: 'Elección de modelo (orientativa)',
      head: ['Necesidad', 'Opción', 'Por qué'],
      rows: [
        [
          'Extraer datos de un formulario',
          'Modelo pequeño + salida estructurada',
          'Barato, rápido y validable'
        ],
        [
          'Asistente con lógica de negocio',
          'Modelo medio/grande + funciones',
          'Sigue instrucciones y usa herramientas'
        ],
        [
          'Datos de salud o de menores',
          'Modelo local (Ollama/vLLM)',
          'Los datos no salen del centro o la empresa'
        ],
        [
          'Generar ilustraciones para la app',
          'Modelo de imagen en la nube',
          'Calidad; revisar licencia de uso'
        ],
        ['Dictado por voz sin conexión', 'Whisper pequeño en el dispositivo', 'Privacidad y sin red']
      ]
    },
    claves: [
      'El modelo propone; tu código decide y ejecuta.',
      'Esquemas pequeños, enums cerrados y descripciones claras reducen errores.',
      'Toda herramienta que escribe datos necesita autorización y, a veces, confirmación humana.'
    ]
  },
  taller: {
    entorno: 'PowerShell 7 · VS Code + IntelliJ · PostgreSQL 16 en Docker · IntelliJ para la parte Java',
    pasos: [
      {
        t: 'Base de datos de ejemplo',
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
docker run -d --name pg-mia -e POSTGRES_PASSWORD=mia -p 5432:5432 postgres:16
uv init mia-s07-tools; cd mia-s07-tools
uv add anthropic pydantic "psycopg[binary]"
docker exec -i pg-mia psql -U postgres -c "CREATE ROLE lector LOGIN PASSWORD 'lector'; "`
      },
      {
        t: 'Extracción estructurada con Pydantic y messages.parse()',
        lang: 'python',
        file: 'src/extraer.py',
        code: c`
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
print(incidencia.model_dump_json(indent=2))`
      },
      {
        t: 'Herramientas tipadas para consultar la base de datos',
        d: 'El modelo no escribe SQL: elige una herramienta y sus parámetros; el SQL es nuestro y está parametrizado.',
        lang: 'python',
        file: 'src/herramientas.py',
        code: c`
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
EJECUTORES = {"buscar_modulos": (BuscarModulos, buscar_modulos), "plazas_fct": (PlazasFct, plazas_fct)}`
      },
      {
        t: 'Bucle de tool use con validación y errores devueltos al modelo',
        lang: 'python',
        file: 'src/agente_sql.py',
        code: c`
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


print(responder("¿Qué módulos de segundo de DAM tienen más de 100 horas y qué empresas ofrecen FCT desde marzo?"))`
      },
      {
        t: 'Salida estructurada a Record en Java 21 (SDK oficial de Anthropic)',
        lang: 'java',
        file: 'ExtraerIncidencia.java',
        code: c`
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
}`
      },
      {
        t: 'Configuración con Virtual Threads',
        lang: 'yaml',
        file: 'src/main/resources/application.yml',
        code: c`
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
  endpoints.web.exposure.include: health,metrics`
      },
      {
        t: 'Servicio de tutoría con memoria conversacional',
        lang: 'java',
        file: 'TutorService.java',
        code: c`
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
}`
      },
      {
        t: 'Generar una imagen para la app',
        d: c`Ejemplo con la API de Google (Imagen) desde <code>google-genai</code>. El identificador del modelo cambia con frecuencia: consúltalo en Google AI Studio y ponlo en una variable de entorno.`,
        lang: 'python',
        file: 'src/generar_imagen.py',
        code: c`
import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
r = client.models.generate_images(
    model=os.environ["MODELO_IMAGEN"],
    prompt="Icono plano y minimalista de una app de reservas de aulas, fondo blanco, color principal amarillo #efcd2f",
    config=types.GenerateImagesConfig(number_of_images=1),
)
with open("icono_reservas.png", "wb") as f:
    f.write(r.generated_images[0].image.image_bytes)
print("Imagen guardada. Recuerda indicar en la app que es contenido generado por IA.")`
      },
      {
        t: 'Voz: transcribir y sintetizar en local',
        lang: 'python',
        file: 'src/voz.py',
        code: c`
import subprocess
import tempfile
from faster_whisper import WhisperModel

stt = WhisperModel("small", device="cuda", compute_type="float16")   # en CPU: device="cpu", compute_type="int8"
VOZ = "voces/es_ES-davefx-medium.onnx"


def transcribir(ruta_audio: str) -> str:
    segmentos, info = stt.transcribe(ruta_audio, language="es", vad_filter=True, beam_size=1)
    return " ".join(s.text.strip() for s in segmentos)


def sintetizar(frase: str) -> bytes:
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        salida = f.name
    subprocess.run(["piper", "--model", VOZ, "--output_file", salida], input=frase.encode("utf-8"), check=True)
    return open(salida, "rb").read()`
      }
    ]
  },
  prompts: [
    {
      t: 'System prompt de producción con secciones estables',
      tipo: 'System Prompt',
      lang: 'markdown',
      d: 'Estructura pensada para caché: todo lo estable arriba; nada de fechas ni ids dinámicos.',
      code: c`
<rol>
Eres el asistente académico del Máster en IA Aplicada al Desarrollo de Aplicaciones Multiplataforma del CFP José Ramón Otero.
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
</formato>`
    },
    {
      t: 'Descripción de herramienta de calidad profesional',
      tipo: 'Tool definition',
      lang: 'json',
      code: c`
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
}`
    },
    {
      t: 'Esquema de extracción de currículums de titulados DAM',
      tipo: 'Pydantic',
      lang: 'python',
      code: c`
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
    # Nota: no extraigas edad, sexo, nacionalidad ni foto (minimización de datos, art. 5.1.c RGPD)`
    },
    {
      t: 'System prompt para agente con herramientas de solo lectura',
      tipo: 'System Prompt',
      lang: 'markdown',
      code: c`
Eres un asistente de consultas académicas con acceso a herramientas de solo lectura.
- Usa herramientas para todo dato concreto; nunca respondas cifras de memoria.
- Si una herramienta devuelve error, corrige los parámetros una vez; si vuelve a
  fallar, explica al usuario qué dato falta.
- Puedes llamar a varias herramientas en paralelo si son independientes.
- Si la pregunta requiere modificar datos, indica que no tienes permisos para ello.`
    },
    {
      t: 'System prompt para asistente interno Spring',
      tipo: 'System Prompt',
      lang: 'markdown',
      code: c`
Eres un asistente integrado en la intranet del centro (backend Spring Boot).
- Solo respondes sobre: horarios, normativa académica, FCT y recursos de los ciclos.
- Si la pregunta requiere datos personales de un alumno, responde que debe
  consultarlo en Secretaría y no especules.
- Cuando des pasos a seguir, usa una lista numerada de máximo 6 pasos.
- Termina con la fuente (documento y apartado) cuando la tengas en el contexto.`
    }
  ],
  actividad: {
    tipo: 'proyecto',
    titulo: 'Proyecto del módulo M3: asistente conversacional para un caso de negocio con salidas estructuradas',
    contexto: c`Desarrolla un asistente conversacional para un caso de negocio real o propuesto por una empresa colaboradora (reservas de un taller, pedidos de un comercio, citas de una clínica veterinaria, soporte de una app…) que devuelva datos estructurados y ejecute acciones a través de funciones de tu backend.`,
    requisitos: [
      'System prompt versionado y batería de al menos 20 conversaciones de prueba con resultado esperado.',
      c`Salidas estructuradas validadas (Pydantic o records de Java) y al menos 3 funciones tipadas que consulten o modifiquen datos de forma segura.`,
      'Backend en Python (FastAPI) o Java (Spring AI) con streaming, y cliente web o móvil sencillo.',
      'Justificación de la elección de modelo por coste, latencia y privacidad (con mediciones).',
      'Vídeo de defensa de 5 minutos.'
    ],
    entregables: [
      'Repositorio con backend, cliente y README',
      c`<code>EVALUACION.md</code> con la batería de pruebas`,
      'Enlace al vídeo de defensa (5 min)'
    ],
    rubrica: [
      ['Funcionamiento', 30],
      ['Calidad técnica', 30],
      ['Documentación', 20],
      ['Vídeo de defensa (5 min)', 20]
    ]
  },
  faq: [
    [
      'El modelo llama a la herramienta equivocada.',
      c`Mejora las descripciones indicando cuándo usarla y cuándo no, reduce herramientas solapadas y nombra los parámetros de forma inequívoca. Con muchas herramientas (decenas), usa búsqueda de herramientas o agrúpalas por dominio.`
    ],
    [
      '¿Puedo forzar que el modelo use una herramienta concreta?',
      c`Algunos modelos actuales ya no admiten forzar la herramienta (<code>tool_choice</code> de tipo <code>tool</code>/<code>any</code>). Usa <code>tool_choice: auto</code> con una instrucción explícita, o directamente salidas estructuradas si lo único que querías era JSON.`
    ],
    [
      c`¿Por qué devolver todos los <code>tool_result</code> en un único mensaje?`,
      c`Cuando el modelo pide varias herramientas a la vez (llamadas en paralelo), espera todos los resultados juntos en el siguiente turno de usuario. Repartirlos en varios mensajes degrada el comportamiento de llamadas paralelas.`
    ],
    [
      c`Los campos opcionales salen como <code>null</code> inventados.`,
      c`Describe explícitamente "si no aparece en el texto, null" y evita campos obligatorios que el texto puede no contener. Incluye en el esquema una cita literal de evidencia para los datos críticos y valida que la cita existe en el original.`
    ],
    [
      '¿Cómo pruebo sin gastar tokens?',
      c`Implementa un <code>ChatModel</code> falso que devuelva respuestas fijas para tests unitarios, y graba/reproduce respuestas reales (patrón VCR) para tests de integración. Reserva las llamadas reales para una suite manual o nocturna.`
    ],
    [
      '¿Puedo usar imágenes generadas en una app comercial?',
      c`Depende de los términos del proveedor del modelo y de lo que represente la imagen. Revisa las condiciones de uso, no generes marcas ni personas reales y marca el contenido como generado por IA cuando corresponda. Lo veremos en M7.`
    ]
  ]
});
