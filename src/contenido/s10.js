/* Sesión 10 · API en producción */
export default {
  n: 10, bloque: 4,
  titulo: "API en producción: SDK, streaming, Prompt Caching, Batch API y conector MCP",
  resumen: "Llevar Claude a una aplicación real: streaming, caché de prompts, procesamiento por lotes, ficheros, conector MCP, errores, observabilidad y control de costes.",
  skill: "Cliente de producción con caché, reintentos y registro de uso",
  mcp: "Conector MCP de la API: usar jro-ops remoto desde una llamada a /v1/messages",
  objetivos: [
    "Mostrar respuestas en vivo con streaming en Python y en una web.",
    "Diseñar prompts cacheables y comprobar los aciertos de caché.",
    "Procesar miles de peticiones con la Batch API al 50 % de coste.",
    "Conectar la API a un servidor MCP remoto con el conector MCP.",
    "Gestionar errores reintentables y no reintentables.",
    "Registrar el uso y calcular el coste real por tarea."
  ],
  teoria: [
    {
      h: "Streaming",
      html: `<p>La respuesta llega en trozos mientras se genera. Ventajas: el usuario ve el texto al instante y no hay timeouts en respuestas largas. En Python: <code>client.messages.stream(...)</code> y <code>stream.text_stream</code>; si no necesitas mostrarlo en vivo, <code>stream.get_final_message()</code>.</p>
      <p>En una web, el backend recibe el stream de Claude y lo reenvía al navegador (por ejemplo con Server-Sent Events). <b>Nunca</b> llames a la API desde el navegador: expondrías la clave.</p>`,
      ejemplos: [
        { tipo: "dam", titulo: "Arquitectura de un chat web", lang: "Esquema", code: String.raw`Navegador ──fetch /api/chat──▶ Backend (FastAPI / Spring) ──stream──▶ API de Claude
    ▲                                  │  (clave en el servidor)
    └──────── text/event-stream ───────┘` }
      ]
    },
    {
      h: "Prompt Caching",
      html: `<p>Si muchas peticiones comparten el mismo principio (instrucciones de sistema, documentación, esquema), márcalo con <code>cache_control</code>. Las lecturas de caché cuestan una fracción de la entrada normal (en Opus 5.5: 0,20 $ frente a 4 $ por millón, un 95 % menos).</p>
      <ul>
        <li>Funciona por <b>prefijo exacto</b>: el orden es herramientas → system → mensajes. Un solo carácter distinto al principio invalida todo lo posterior.</li>
        <li>Pon lo estable primero (system, documentos) y lo variable al final (la pregunta).</li>
        <li>Nunca metas la fecha/hora, el nombre del usuario o un ID de petición en la parte cacheada.</li>
        <li>Hay un tamaño mínimo para cachear; prefijos muy cortos no se cachean.</li>
        <li>Compruébalo con <code>usage.cache_read_input_tokens</code>: si siempre vale 0, algo cambia en el prefijo.</li>
      </ul>`,
      ejemplos: [
        { tipo: "aviso", titulo: "El invalidador silencioso", lang: "Python", code: String.raw`# ✗ La hora cambia en cada llamada: la caché no acierta nunca
system = f"Eres el asistente del CFP. Hoy es {datetime.now()}.\n{MANUAL}"

# ✓ Lo estable primero (cacheable) y lo variable en el mensaje
system = [{"type": "text", "text": MANUAL, "cache_control": {"type": "ephemeral"}}]
messages = [{"role": "user", "content": f"(Fecha: {date.today()}) {pregunta}"}]` }
      ]
    },
    {
      h: "Batch API",
      html: `<p>Para trabajos que no necesitan respuesta inmediata (clasificar 10 000 tickets, corregir 200 prácticas, analizar los logs de la noche) envías un lote y lo recoges cuando termina, con un <b>50 % de descuento</b>. Normalmente termina en menos de una hora (como máximo 24 h).</p>
      <ul>
        <li>Cada petición lleva un <code>custom_id</code> tuyo: los resultados llegan en <b>cualquier orden</b>.</li>
        <li>Cada resultado tiene un tipo: <code>succeeded</code>, <code>errored</code>, <code>canceled</code> o <code>expired</code>.</li>
        <li>Se puede combinar con la caché: si todas las peticiones comparten el mismo system, mejor aún.</li>
      </ul>`
    },
    {
      h: "Ficheros y documentos",
      html: `<p>Puedes enviar <b>PDF</b> e <b>imágenes</b> en los mensajes (en base64) o subirlos una vez con la <b>Files API</b> (<code>client.files.upload</code>) y referenciarlos por <code>file_id</code> en varias peticiones. Útil para analizar enunciados de prácticas, manuales en PDF o capturas de errores.</p>`,
      ejemplos: [
        { tipo: "asir", titulo: "Analizar una captura de un error", lang: "Python", code: String.raw`import base64
img = base64.standard_b64encode(open("pantallazo_bsod.png", "rb").read()).decode()
r = client.messages.create(model="claude-opus-5-5", max_tokens=16000, messages=[{"role": "user", "content": [
    {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": img}},
    {"type": "text", "text": "¿Qué error de Windows es y cómo lo diagnostico?"}]}])` }
      ]
    },
    {
      h: "Conector MCP en la API",
      html: `<p>La API puede conectarse directamente a un <b>servidor MCP remoto</b> (por URL): Claude usa sus herramientas sin que tu código implemente el bucle. Hay que declarar <b>las dos partes</b>:</p>
      <ol>
        <li><code>mcp_servers</code>: dónde está el servidor (URL, nombre y token).</li>
        <li>Una tool <code>{"type": "mcp_toolset", "mcp_server_name": "..."}</code>: qué herramientas usar.</li>
      </ol>
      <p>Requiere la cabecera beta <code>mcp-client-2025-11-20</code> y que el servidor sea accesible por HTTPS desde Internet.</p>`
    },
    {
      h: "Errores y reintentos",
      html: `<table>
        <tr><th>Tipo</th><th>Códigos</th><th>Qué hacer</th></tr>
        <tr><td>Reintentable</td><td>429, 500, 529, errores de red</td><td>Reintentar con espera exponencial (los SDK lo hacen 2 veces; súbelo con <code>max_retries</code>)</td></tr>
        <tr><td>Error tuyo</td><td>400, 404, 413</td><td>No reintentar: corregir la petición</td></tr>
        <tr><td>Credenciales</td><td>401, 403</td><td>Revisar la clave y el espacio de trabajo</td></tr>
      </table>
      <p>Captura de lo más concreto a lo más general (<code>RateLimitError</code> → <code>APIStatusError</code> → <code>APIConnectionError</code>) y comprueba siempre <code>stop_reason</code> antes de usar la respuesta.</p>`
    },
    {
      h: "Costes y observabilidad",
      html: `<ul>
        <li>Registra en cada llamada: modelo, <code>input_tokens</code>, <code>output_tokens</code>, <code>cache_read_input_tokens</code>, <code>cache_creation_input_tokens</code>, duración y resultado.</li>
        <li>Calcula el <b>coste por tarea completada</b>, no por petición: una petición barata que necesita tres reintentos no es barata.</li>
        <li>Orden de ahorro: 1) caché, 2) recortar contexto innecesario, 3) Batch, 4) bajar el esfuerzo, 5) modelo más pequeño (midiendo la calidad).</li>
        <li>Pon límites de gasto por espacio de trabajo en la consola.</li>
      </ul>`
    }
  ],
  taller: [
    { t: "1. Streaming en Python", d: "Muestra el texto según llega.", lang: "Python", code: String.raw`import anthropic
client = anthropic.Anthropic()

with client.messages.stream(
    model="claude-opus-5-5",
    max_tokens=64000,
    messages=[{"role": "user", "content": "Escribe un docker-compose con nginx, app Java y PostgreSQL, comentado."}],
) as stream:
    for trozo in stream.text_stream:
        print(trozo, end="", flush=True)
    final = stream.get_final_message()
print("\n\nTokens de salida:", final.usage.output_tokens)` },
    { t: "2. Chat web con streaming (FastAPI)", d: "El backend reenvía el stream al navegador; la clave no sale del servidor.", lang: "Python", code: String.raw`from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import anthropic, json

app = FastAPI()
client = anthropic.Anthropic()

class Pregunta(BaseModel):
    texto: str

@app.post("/api/chat")
def chat(p: Pregunta):
    def eventos():
        with client.messages.stream(model="claude-opus-5-5", max_tokens=16000,
                                    output_config={"effort": "low"},
                                    messages=[{"role": "user", "content": p.texto[:4000]}]) as s:
            for trozo in s.text_stream:
                yield f"data: {json.dumps(trozo)}\n\n"
        yield "data: [FIN]\n\n"
    return StreamingResponse(eventos(), media_type="text/event-stream")`, nota: "Arranca con: uvicorn app:app --reload. En el navegador, lee la respuesta con fetch() y response.body.getReader()." },
    { t: "3. Prompt Caching: asistente del manual del centro", d: "El manual (largo y estable) se cachea; cada pregunta paga solo la parte nueva.", lang: "Python", code: String.raw`import anthropic, pathlib
client = anthropic.Anthropic()
MANUAL = pathlib.Path("manual_infraestructura.md").read_text(encoding="utf-8")

def preguntar(pregunta: str):
    r = client.messages.create(
        model="claude-opus-5-5",
        max_tokens=16000,
        system=[
            {"type": "text", "text": "Respondes solo con lo que diga el manual. Si no está, dilo."},
            {"type": "text", "text": f"<manual>\n{MANUAL}\n</manual>", "cache_control": {"type": "ephemeral"}},
        ],
        messages=[{"role": "user", "content": pregunta}],
    )
    u = r.usage
    print(f"escrito en caché={u.cache_creation_input_tokens}  leído de caché={u.cache_read_input_tokens}  nuevo={u.input_tokens}")
    return "".join(b.text for b in r.content if b.type == "text")

preguntar("¿Qué VLAN usa el aula 2.04?")
preguntar("¿Cuál es la política de copias de seguridad?")   # esta ya lee de caché`, resultado: "escrito en caché=48210  leído de caché=0  nuevo=14\nescrito en caché=0  leído de caché=48210  nuevo=12" },
    { t: "4. Batch API: corregir 200 entregas", d: "Crear el lote, esperar y recoger por custom_id.", lang: "Python", code: String.raw`import time, anthropic
client = anthropic.Anthropic()
RUBRICA = open("rubrica.md", encoding="utf-8").read()

entregas = {"alumno-001": open("e001.py").read(), "alumno-002": open("e002.py").read()}
lote = client.messages.batches.create(requests=[
    {"custom_id": cid, "params": {
        "model": "claude-opus-5-5",
        "max_tokens": 4000,
        "system": [{"type": "text", "text": RUBRICA, "cache_control": {"type": "ephemeral"}}],
        "messages": [{"role": "user", "content": f"<codigo>{codigo}</codigo>\nEvalúa con la rúbrica."}],
    }}
    for cid, codigo in entregas.items()
])
print("Lote", lote.id)

while client.messages.batches.retrieve(lote.id).processing_status != "ended":
    time.sleep(60)

for res in client.messages.batches.results(lote.id):
    if res.result.type == "succeeded":
        texto = "".join(b.text for b in res.result.message.content if b.type == "text")
        print(res.custom_id, "→", texto[:120])
    else:
        print(res.custom_id, "→", res.result.type)` },
    { t: "5. Java: reintentos y errores tipados", d: "El SDK reintenta 429/5xx; captura de lo más concreto a lo más general.", lang: "Java", code: String.raw`import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.errors.AnthropicServiceException;
import com.anthropic.errors.RateLimitException;
import com.anthropic.models.messages.MessageCreateParams;

AnthropicClient client = AnthropicOkHttpClient.builder()
    .fromEnv()
    .maxRetries(4)
    .build();

try {
    var r = client.messages().create(MessageCreateParams.builder()
        .model("claude-opus-5-5").maxTokens(16000L)
        .addUserMessage("Resume este ticket: ...").build());
    System.out.println(r.usage());
} catch (RateLimitException e) {
    System.err.println("Límite alcanzado: encola y reintenta más tarde");
} catch (AnthropicServiceException e) {
    System.err.println("Error " + e.statusCode() + ": " + e.getMessage());
}` },
    { t: "6. Conector MCP: usar jro-ops remoto desde la API", d: "El servidor debe ser accesible por HTTPS. Cabecera beta y las dos partes de la configuración.", lang: "Python", code: String.raw`import anthropic, os
client = anthropic.Anthropic()

r = client.beta.messages.create(
    model="claude-opus-5-5",
    max_tokens=16000,
    betas=["mcp-client-2025-11-20"],
    mcp_servers=[{
        "type": "url",
        "url": "https://ops.aula.jrotero.es/mcp",
        "name": "jro-ops",
        "authorization_token": os.environ["JRO_OPS_TOKEN"],
    }],
    tools=[{"type": "mcp_toolset", "mcp_server_name": "jro-ops"}],
    messages=[{"role": "user", "content": "¿Cómo están las métricas del host?"}],
)
print("".join(b.text for b in r.content if b.type == "text"))` },
    { t: "7. Registro de uso y coste por llamada", d: "Una función envoltorio que guarda el uso en CSV para el panel de costes.", lang: "Python", code: String.raw`import csv, time, datetime
PRECIOS = {"claude-opus-5-5": (4, 20, 0.20), "claude-sonnet-5-5": (2, 10, 0.20), "claude-haiku-5-5": (0.10, 0.50, 0.01)}

def llamar(client, **params):
    t0 = time.time()
    r = client.messages.create(**params)
    u = r.usage
    pe, ps, pc = PRECIOS[params["model"]]
    coste = (u.input_tokens * pe + u.output_tokens * ps + (u.cache_read_input_tokens or 0) * pc) / 1e6
    with open("uso.csv", "a", newline="") as f:
        csv.writer(f).writerow([datetime.datetime.now().isoformat(timespec="seconds"), params["model"],
            u.input_tokens, u.output_tokens, u.cache_read_input_tokens, round(time.time() - t0, 1), round(coste, 5), r.stop_reason])
    return r`, nota: "El precio de lectura de caché de Haiku es aproximado: consulta la tabla oficial de precios." }
  ],
  prompts: [
    { t: "Prompt de sistema cacheable", tipo: "System Prompt", txt: `<!-- Bloque 1: estable, va primero y se cachea -->
<rol>Asistente técnico del CFP José Ramón Otero.</rol>
<documentacion>{{manual, esquema o normativa}}</documentacion>
<!-- Nada de fechas, nombres de usuario ni IDs aquí: rompen la caché -->` },
    { t: "Rúbrica para corrección por lotes", tipo: "Plantilla", txt: `<rubrica>
- Funciona (4 puntos): compila/ejecuta y cumple el enunciado.
- Calidad (3): nombres, estructura, sin duplicación.
- Seguridad (2): validación de entradas, sin secretos.
- Documentación (1): README claro.
</rubrica>
<codigo>{{entrega}}</codigo>
Devuelve la nota de cada criterio con una frase de justificación y la nota total.` },
    { t: "Auditor de costes", tipo: "Prompt", txt: `<usage>{{registro de uso.csv de un día}}</usage>
Calcula el coste total, el porcentaje de aciertos de caché y propone 3 cambios para reducir el gasto sin perder calidad, ordenados por ahorro estimado.` },
    { t: "Revisor de integración en producción", tipo: "Prompt", txt: `<codigo>{{módulo que llama a la API}}</codigo>
Revisa: clave en el servidor, streaming para respuestas largas, control de stop_reason, reintentos, timeouts, registro de uso, datos personales en los prompts y caché. Lista priorizada.` }
  ],
  actividad: {
    dam: {
      t: "Chat con streaming y caché en tu app",
      d: "Integra en una app (web con FastAPI/Spring o JavaFX) un asistente con streaming y documentación cacheada. Muestra en pantalla los tokens leídos de caché.",
      pasos: ["Backend con streaming (la clave no sale del servidor).", "System cacheable con la documentación.", "Indicador de caché en la interfaz.", "Medición de 20 preguntas con y sin caché."],
      entregables: ["Código.", "Medición: coste de 20 preguntas con y sin caché."],
      criterios: [["Streaming correcto", 3], ["Caché efectiva (medida)", 4], ["Seguridad de la clave", 2], ["Interfaz", 1]]
    },
    asir: {
      t: "Análisis nocturno de logs con Batch API",
      d: "Script programado (cron o Programador de tareas) que cada noche envía en un lote los logs anonimizados de cada servidor y genera un informe por la mañana.",
      pasos: ["Recogida y anonimización de logs.", "Lote con custom_id por servidor.", "Recogida de resultados y informe.", "Programación con cron o schtasks."],
      entregables: ["Script y entrada de cron/tarea programada.", "Informe generado de una noche real del aula."],
      criterios: [["Lote correcto con custom_id", 3], ["Anonimización", 3], ["Programación y robustez", 3], ["Informe", 1]]
    },
    sync: {
      t: "Panel de costes compartido",
      d: "ASIR exporta el uso de sus scripts (uso.csv); DAM construye un panel con el gasto diario por modelo y por proyecto y la tasa de aciertos de caché.",
      pasos: ["Formato común de uso.csv.", "Panel con gráficas.", "Recomendación de ahorro basada en los datos."],
      entregables: ["Panel funcionando.", "Recomendación de ahorro basada en los datos."],
      criterios: [["Datos reales integrados", 4], ["Panel útil", 3], ["Recomendación justificada", 3]]
    }
  },
  test: [
    { p: "¿Por qué no se llama a la API directamente desde el navegador?", o: ["Porque no funciona en HTTPS", "Porque expondrías la clave de API", "Porque el navegador no admite JSON", "Porque es más caro"], c: 1, exp: "La clave debe quedarse en el servidor." },
    { p: "¿Qué atributo marca un bloque como cacheable?", o: ["cache: true", "cache_control: {type: \"ephemeral\"}", "store: true", "persist: 1"], c: 1, exp: "cache_control con tipo ephemeral." },
    { p: "¿Qué invalida la caché?", o: ["Cambiar la pregunta final", "Cambiar algo al principio del prefijo (p. ej. la hora en el system)", "Usar streaming", "Usar Java"], c: 1, exp: "La caché es por prefijo exacto." },
    { p: "¿Cómo compruebas que la caché funciona?", o: ["Por el tiempo de respuesta solamente", "Con usage.cache_read_input_tokens mayor que 0", "Con stop_reason", "No se puede"], c: 1, exp: "Ese campo indica los tokens leídos de caché." },
    { p: "¿Cuánto descuento tiene la Batch API?", o: ["10 %", "25 %", "50 %", "90 %"], c: 2, exp: "Un 50 % sobre el precio normal." },
    { p: "Los resultados de un lote llegan…", o: ["Siempre en el mismo orden", "En cualquier orden: se identifican por custom_id", "Uno por día", "Sin identificador"], c: 1, exp: "Usa custom_id para relacionarlos." },
    { p: "¿Qué dos partes necesita el conector MCP?", o: ["mcp_servers y una tool mcp_toolset", "Solo la URL", "Un fichero .mcp.json", "Un hook"], c: 0, exp: "mcp_servers dice dónde está; mcp_toolset, qué herramientas usar." },
    { p: "¿Qué error es reintentable?", o: ["400", "401", "429", "404"], c: 2, exp: "429 (y 5xx) son temporales." },
    { p: "¿Qué métrica de coste es la correcta?", o: ["Coste por petición", "Coste por tarea completada", "Coste por carácter", "Coste por minuto"], c: 1, exp: "Una petición barata con reintentos puede salir cara." },
    { p: "¿Qué es lo primero que conviene aplicar para ahorrar?", o: ["Cambiar a un modelo más pequeño", "La caché de prompts", "Quitar el system prompt", "Bajar max_tokens a 100"], c: 1, exp: "La caché ahorra sin perder calidad." }
  ],
  faq: [
    { q: "cache_read_input_tokens siempre vale 0", a: "El prefijo cambia entre llamadas (una fecha, un orden distinto de herramientas) o es demasiado corto para cachearse. Imprime el system de dos llamadas y compáralos." },
    { q: "Error de validación al usar mcp_servers", a: "Falta la otra mitad: la tool <code>{\"type\": \"mcp_toolset\", \"mcp_server_name\": ...}</code> con el mismo nombre, y la cabecera beta <code>mcp-client-2025-11-20</code>." },
    { q: "Los resultados del lote salen desordenados", a: "Es normal. Usa siempre <code>custom_id</code> para relacionar cada resultado con su petición." },
    { q: "stop_reason es 'refusal'", a: "El modelo ha declinado la petición por seguridad. Comprueba <code>stop_reason</code> antes de leer el contenido y revisa si el prompt incluye material que pueda malinterpretarse." },
    { q: "El streaming llega a trompicones por el proxy", a: "Desactiva el buffering del proxy (<code>proxy_buffering off</code> en nginx) y envía la cabecera <code>Cache-Control: no-cache</code>." },
    { q: "¿Cuánto tarda un lote?", a: "Normalmente menos de una hora; como máximo 24 horas. No lo uses para nada que el usuario espere en directo." }
  ]
};
