/* Sesión 1 · Ecosistema Claude, modelos, tokens y primera llamada a la API */
export default {
  n: 1, bloque: 1,
  titulo: "Ecosistema Claude: modelos, tokens y primera llamada a la API",
  resumen: "Qué es Claude, dónde se usa, cómo se elige modelo, qué es un token y cuánto cuesta, y cómo hacer la primera petición desde PowerShell, Bash, Python y Java.",
  skill: "Script base hola_claude (Python y Java 21) + medidor de tokens y costes",
  mcp: "— (se presenta el concepto; se construye en el Bloque 3)",
  objetivos: [
    "Distinguir claude.ai, la API de Claude y Claude Code, y saber cuándo usar cada uno.",
    "Elegir entre Haiku, Sonnet, Opus y Fable según calidad, coste y velocidad.",
    "Explicar qué es un token y estimar el coste de una petición antes de enviarla.",
    "Guardar una clave de API de forma segura en Windows y en Linux.",
    "Hacer peticiones con curl, Invoke-RestMethod, Python y Java 21 y leer la respuesta.",
    "Interpretar los errores HTTP más comunes (400, 401, 429, 500, 529)."
  ],
  teoria: [
    {
      h: "Qué es un modelo de lenguaje (y qué no es)",
      html: `<p>Claude es un <b>modelo de lenguaje grande</b> (LLM): un programa entrenado con enormes cantidades de texto y código que, dada una entrada, genera la continuación más útil. No "busca" en una base de datos ni "ejecuta" tu código: <b>predice texto</b>. Por eso puede explicar, resumir, traducir, programar o razonar, pero también equivocarse con seguridad aparente (las llamadas <i>alucinaciones</i>).</p>
      <ul>
        <li><b>Sabe</b> lo que aprendió en su entrenamiento (hasta su fecha de corte) y lo que tú le pongas en el mensaje.</li>
        <li><b>No sabe</b> lo que hay en tu servidor, tu base de datos o tu repositorio salvo que se lo des (copiándolo, o con herramientas y MCP, Bloques 2 y 3).</li>
        <li><b>No recuerda</b> conversaciones anteriores: la API es <i>sin estado</i>. Cada petición lleva todo el contexto.</li>
      </ul>
      <p>Regla práctica para el aula: trata a Claude como a un compañero muy rápido y muy leído al que <b>siempre</b> hay que revisarle el trabajo.</p>`,
      ejemplos: [
        { tipo: "general", titulo: "Por qué hay que darle contexto", texto: `<p>Pregunta sin contexto: <i>"¿Por qué falla mi servicio?"</i> → respuesta genérica (DNS, permisos, memoria…). Pregunta con contexto: pegas las 30 últimas líneas de <code>journalctl -u nginx</code> y la respuesta señala la línea exacta del error. El modelo es el mismo; cambia lo que le das.</p>` },
        { tipo: "aviso", titulo: "Alucinaciones", texto: `<p>Si le pides "el comando de PowerShell para X" puede inventarse un parámetro que no existe. Antes de ejecutar nada en un servidor: <code>Get-Help Comando -Full</code> o <code>man comando</code>, y prueba en una VM.</p>` }
      ]
    },
    {
      h: "Las tres superficies de Claude",
      html: `<table>
        <tr><th>Superficie</th><th>Qué es</th><th>Para qué la usaremos</th></tr>
        <tr><td><b>claude.ai</b> (web, escritorio, móvil)</td><td>Chat con <i>Projects</i> (conocimiento por proyecto) y <i>Artifacts</i> (páginas, código y documentos generados)</td><td>Explorar ideas, prototipos de interfaz, documentación</td></tr>
        <tr><td><b>API de Claude</b></td><td>Servicio HTTP: <code>POST https://api.anthropic.com/v1/messages</code></td><td>Integrar Claude en tus aplicaciones (DAM) y en tus scripts de operación (ASIR)</td></tr>
        <tr><td><b>Claude Code</b></td><td>Agente en la terminal que lee, edita y ejecuta en tu repositorio</td><td>Programar y administrar con ayuda (Bloque 2)</td></tr>
      </table>
      <p>La cuenta de claude.ai y la consola de la API (<b>platform.claude.com</b>) se facturan por separado: una suscripción a claude.ai no da crédito de API.</p>`
    },
    {
      h: "Familias de modelos y cómo elegir",
      html: `<p>Anthropic publica varias familias. Cuanto más capaz, más cara y algo más lenta:</p>
      <table>
        <tr><th>Modelo</th><th>ID de API</th><th>Entrada / salida (USD por millón de tokens)</th><th>Cuándo usarlo</th></tr>
        <tr><td>Claude Haiku 5.5</td><td><code>claude-haiku-5-5</code></td><td>0,10 / 0,50</td><td>Tareas masivas y simples: clasificar logs, etiquetar tickets, extraer campos</td></tr>
        <tr><td>Claude Sonnet 5.5</td><td><code>claude-sonnet-5-5</code></td><td>2 / 10</td><td>Programación diaria, agentes, revisión de código</td></tr>
        <tr><td>Claude Opus 5.5</td><td><code>claude-opus-5-5</code></td><td>4 / 20</td><td>Depuración compleja, arquitectura, análisis de incidencias; modelo por defecto del curso</td></tr>
        <tr><td>Claude Fable 5.1</td><td><code>claude-fable-5-1</code></td><td>10 / 50</td><td>Los problemas más difíciles y tareas largas autónomas</td></tr>
      </table>
      <p>Todos admiten 1 millón de tokens de contexto. Los precios cambian: consulta la página oficial antes de presupuestar. Para elegir, empieza por el modelo más capaz que puedas pagar, mide la calidad con 10–20 casos reales y solo entonces prueba uno más barato.</p>`,
      ejemplos: [
        { tipo: "dam", titulo: "Elegir modelo en una app", texto: `<p>Una app de reservas que resume reseñas de clientes (miles al día, texto corto) → <b>Haiku 5.5</b>. El asistente que propone la refactorización de un módulo de pagos → <b>Opus 5.5</b>. Puedes usar los dos en la misma app: cada llamada elige su modelo.</p>` },
        { tipo: "asir", titulo: "Elegir modelo en operación", texto: `<p>Clasificar 200 000 líneas de <code>auth.log</code> por tipo de evento → Haiku 5.5 (barato y rápido). Escribir el post-mortem de una caída que afecta a DNS, LDAP y la web → Opus 5.5 (razonamiento en varios pasos).</p>` }
      ]
    },
    {
      h: "Tokens: la unidad de coste y de memoria",
      html: `<p>Un <b>token</b> es un trozo de texto: a veces una palabra entera, a veces una sílaba o un signo. En español, de media, un token es algo menos que una palabra; el código y los JSON suelen gastar más tokens por carácter que la prosa.</p>
      <ul>
        <li><b>Tokens de entrada</b>: todo lo que envías (instrucciones de sistema, historial, documentos, imágenes).</li>
        <li><b>Tokens de salida</b>: lo que genera el modelo, incluido su razonamiento interno. Son más caros.</li>
        <li><b>Ventana de contexto</b>: el máximo que cabe en una petición (entrada + salida). En los modelos actuales, 1M de tokens.</li>
        <li><b><code>max_tokens</code></b>: el límite de salida que tú fijas. Si se alcanza, la respuesta se corta (<code>stop_reason: "max_tokens"</code>).</li>
      </ul>
      <p>Como la API no guarda memoria, en una conversación de 20 turnos el turno 20 reenvía los 19 anteriores: <b>las conversaciones largas se encarecen</b>. En la Sesión 10 veremos la caché de prompts para abaratarlo.</p>`,
      ejemplos: [
        { tipo: "general", titulo: "Cálculo de coste", texto: `<p>Analizar un log de 40 000 tokens con Opus 5.5 y obtener un informe de 2 000 tokens:</p>`, lang: "Cálculo", code: String.raw`Entrada:  40 000 / 1 000 000 × 4,00 $  = 0,16 $
Salida:    2 000 / 1 000 000 × 20,00 $ = 0,04 $
Total por análisis ≈ 0,20 $   →  30 análisis al mes ≈ 6 $
Con Haiku 5.5:  0,004 $ + 0,001 $ = 0,005 $ por análisis` }
      ]
    },
    {
      h: "Anatomía de una petición y de una respuesta",
      html: `<div class="scheme">  Tu programa ──HTTPS──▶  POST https://api.anthropic.com/v1/messages
     │  cabeceras: x-api-key, anthropic-version, content-type
     │  cuerpo:    model, max_tokens, system, messages[]
     ▼
  Respuesta:  id, model, role: "assistant"
              content[]     bloques: thinking, text, tool_use…
              stop_reason   end_turn | max_tokens | tool_use | refusal | pause_turn
              usage         input_tokens, output_tokens, cache_*</div>
      <ul>
        <li><code>messages</code> es una lista que alterna <code>user</code> y <code>assistant</code>. Para "seguir la conversación", añades la respuesta anterior y la nueva pregunta.</li>
        <li><code>system</code> va aparte: el rol, el tono, las reglas. Es lo primero que lee el modelo.</li>
        <li>En los modelos actuales el primer bloque de <code>content</code> puede ser de tipo <code>thinking</code> (su razonamiento). <b>Busca siempre los bloques <code>text</code></b>; no leas <code>content[0]</code> a ciegas.</li>
        <li>Revisa <code>stop_reason</code>: <code>refusal</code> significa que el modelo ha declinado responder por seguridad; <code>max_tokens</code>, que se ha cortado.</li>
      </ul>`,
      ejemplos: [
        { tipo: "general", titulo: "Respuesta real (simplificada)", lang: "JSON", code: String.raw`{
  "id": "msg_01AbC...",
  "type": "message",
  "role": "assistant",
  "model": "claude-opus-5-5",
  "content": [
    { "type": "thinking", "thinking": "" },
    { "type": "text", "text": "Un token es un fragmento de texto..." }
  ],
  "stop_reason": "end_turn",
  "usage": { "input_tokens": 31, "output_tokens": 112 }
}` },
        { tipo: "general", titulo: "Conversación de varios turnos", lang: "JSON", code: String.raw`"messages": [
  { "role": "user",      "content": "¿Qué es un record en Java?" },
  { "role": "assistant", "content": "Un record es una clase inmutable..." },
  { "role": "user",      "content": "Ponme un ejemplo con validación." }
]` }
      ]
    },
    {
      h: "Seguridad de la clave de API",
      html: `<p>La clave (<code>sk-ant-...</code>) es como una tarjeta de crédito: quien la tenga gasta a tu cargo. Reglas del curso:</p>
      <ol>
        <li>Nunca en el código fuente ni en un repositorio (añade <code>.env</code> a <code>.gitignore</code>).</li>
        <li>Siempre en una <b>variable de entorno</b> (<code>ANTHROPIC_API_KEY</code>), que los SDK leen solos.</li>
        <li>En servidores, en un fichero de secretos con permisos <code>600</code> o en un gestor de secretos, y una clave distinta por proyecto para poder revocarla sin romper el resto.</li>
        <li>Si se filtra: revócala en la consola en el momento y crea otra.</li>
        <li>Pon un <b>límite de gasto</b> mensual en la consola de la organización.</li>
      </ol>`,
      ejemplos: [
        { tipo: "aviso", titulo: "Error típico", texto: `<p>Hacer <code>git add .</code> con un <code>config.py</code> que tiene la clave escrita. Aunque luego la borres, queda en el historial de Git. La única solución segura es <b>revocarla</b>.</p>` }
      ]
    },
    {
      h: "Interoperabilidad: Claude frente a Kimi y Google AI Studio",
      html: `<table>
        <tr><th>Aspecto</th><th>API de Claude</th><th>APIs de estilo OpenAI (p. ej. Kimi)</th><th>Google AI Studio (Gemini)</th></tr>
        <tr><td>Instrucciones de sistema</td><td>Parámetro <code>system</code> aparte</td><td>Mensaje con <code>role: "system"</code></td><td>Campo <code>system_instruction</code></td></tr>
        <tr><td>Respuesta</td><td>Lista de bloques tipados en <code>content</code></td><td><code>choices[0].message</code></td><td><code>candidates[].content.parts</code></td></tr>
        <tr><td>Herramientas</td><td>Tool use + MCP</td><td>Function calling</td><td>Function calling; MCP en sus herramientas CLI</td></tr>
        <tr><td>Autenticación</td><td>Cabecera <code>x-api-key</code></td><td><code>Authorization: Bearer</code></td><td>Clave de AI Studio / Vertex</td></tr>
      </table>
      <p>Diseña con una <b>capa de adaptador</b>: una interfaz <code>AsistenteIA</code> con un método <code>preguntar(sistema, mensajes)</code> y una implementación por proveedor. Cambiar de proveedor toca solo esa clase. MCP, al ser un estándar abierto, permite reutilizar los mismos servidores con varios clientes.</p>`,
      ejemplos: [
        { tipo: "dam", titulo: "Patrón adaptador en Java 21", lang: "Java", code: String.raw`public interface AsistenteIA {
    String preguntar(String sistema, String pregunta);
}

public final class AsistenteClaude implements AsistenteIA {
    private final AnthropicClient client = AnthropicOkHttpClient.fromEnv();

    @Override
    public String preguntar(String sistema, String pregunta) {
        var r = client.messages().create(MessageCreateParams.builder()
            .model("claude-opus-5-5").maxTokens(16000L)
            .system(sistema).addUserMessage(pregunta).build());
        return r.content().stream()
            .flatMap(b -> b.text().stream())
            .map(t -> t.text())
            .collect(java.util.stream.Collectors.joining());
    }
}
// Mañana: class AsistenteOtroProveedor implements AsistenteIA { ... }` }
      ]
    },
    {
      h: "Errores HTTP que vas a ver",
      html: `<table>
        <tr><th>Código</th><th>Tipo</th><th>Causa habitual</th><th>Qué hacer</th></tr>
        <tr><td>400</td><td><code>invalid_request_error</code></td><td>JSON mal formado, parámetro no admitido por ese modelo</td><td>Leer el mensaje: dice qué campo falla</td></tr>
        <tr><td>401</td><td><code>authentication_error</code></td><td>Clave ausente o incorrecta</td><td>Revisar la variable de entorno</td></tr>
        <tr><td>403</td><td><code>permission_error</code></td><td>La clave no tiene acceso a ese recurso</td><td>Revisar el espacio de trabajo de la clave</td></tr>
        <tr><td>429</td><td><code>rate_limit_error</code></td><td>Demasiadas peticiones o tokens por minuto</td><td>Esperar (cabecera <code>retry-after</code>); los SDK reintentan solos</td></tr>
        <tr><td>500 / 529</td><td><code>api_error</code> / <code>overloaded_error</code></td><td>Error o sobrecarga temporal del servicio</td><td>Reintentar con espera exponencial</td></tr>
      </table>
      <p>Los SDK oficiales reintentan automáticamente 2 veces los 408, 409, 429 y 5xx.</p>`
    }
  ],
  taller: [
    { t: "1. Crear la clave de API y guardarla (Windows)", d: "Genera la clave en platform.claude.com → API Keys. Guárdala como variable de usuario; NUNCA en el código.", lang: "PowerShell", code: String.raw`# Solo para esta ventana
$env:ANTHROPIC_API_KEY = "sk-ant-..."

# Persistente para tu usuario de Windows (abre una terminal nueva después)
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-ant-...", "User")

# Comprobar sin mostrarla entera
$env:ANTHROPIC_API_KEY.Substring(0, 10)`, resultado: "sk-ant-api" },
    { t: "1b. Lo mismo en Linux (Bash)", d: "En tu equipo personal, en ~/.bashrc. En servidores, en un fichero de entorno con permisos 600.", lang: "Bash", code: String.raw`export ANTHROPIC_API_KEY="sk-ant-..."
echo 'export ANTHROPIC_API_KEY="sk-ant-..."' >> ~/.bashrc

# Servidor: fichero de secretos solo legible por el usuario del servicio
sudo install -m 600 -o svc-ia /dev/null /etc/ia/anthropic.env
echo 'ANTHROPIC_API_KEY=sk-ant-...' | sudo tee /etc/ia/anthropic.env > /dev/null
ls -l /etc/ia/anthropic.env`, resultado: "-rw------- 1 svc-ia root 42 oct 28 09:00 /etc/ia/anthropic.env" },
    { t: "2. Primera llamada con curl", d: "La petición mínima: modelo, max_tokens y un mensaje de usuario.", lang: "Bash", code: String.raw`curl -s https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-opus-5-5",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Explica qué es un token en dos frases."}]
  }' | python3 -m json.tool`, resultado: "{ \"content\": [ ..., { \"type\": \"text\", \"text\": \"Un token es...\" } ], \"stop_reason\": \"end_turn\", ... }" },
    { t: "2b. Primera llamada con PowerShell", d: "Invoke-RestMethod convierte el JSON de respuesta en objetos.", lang: "PowerShell", code: String.raw`$cuerpo = @{
  model      = "claude-opus-5-5"
  max_tokens = 1024
  messages   = @(@{ role = "user"; content = "¿Qué es Active Directory? En tres líneas." })
} | ConvertTo-Json -Depth 5

$peticion = @{
  Method      = "Post"
  Uri         = "https://api.anthropic.com/v1/messages"
  Headers     = @{ "x-api-key" = $env:ANTHROPIC_API_KEY; "anthropic-version" = "2023-06-01" }
  ContentType = "application/json; charset=utf-8"
  Body        = $cuerpo
}
$r = Invoke-RestMethod @peticion

($r.content | Where-Object type -eq "text").text
"Tokens: entrada $($r.usage.input_tokens), salida $($r.usage.output_tokens)"`, nota: "Si ves caracteres raros en las tildes, añade [Console]::OutputEncoding = [Text.Encoding]::UTF8 al principio." },
    { t: "3. Python: hola_claude.py", d: "pip install anthropic. El cliente lee la clave de la variable de entorno.", lang: "Python", code: String.raw`import anthropic

client = anthropic.Anthropic()

respuesta = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=16000,
    system="Eres profesor de FP. Respondes en español, claro y breve.",
    messages=[{"role": "user", "content": "¿Qué diferencia hay entre TCP y UDP?"}],
)

if respuesta.stop_reason == "refusal":
    print("El modelo ha declinado responder.")
else:
    texto = "".join(b.text for b in respuesta.content if b.type == "text")
    print(texto)
    u = respuesta.usage
    print(f"Tokens → entrada: {u.input_tokens} | salida: {u.output_tokens}")`, resultado: "TCP es orientado a conexión y garantiza el orden...\nTokens → entrada: 38 | salida: 214" },
    { t: "4. Java 21: HolaClaude.java", d: "Dependencia Maven com.anthropic:anthropic-java. AnthropicOkHttpClient.fromEnv() lee ANTHROPIC_API_KEY.", lang: "Java", code: String.raw`import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;

public class HolaClaude {
    public static void main(String[] args) {
        AnthropicClient client = AnthropicOkHttpClient.fromEnv();

        MessageCreateParams params = MessageCreateParams.builder()
            .model("claude-opus-5-5")
            .maxTokens(16000L)
            .system("Eres profesor de DAM. Responde en español.")
            .addUserMessage("Explica en 3 puntos qué es un record de Java 21.")
            .build();

        Message respuesta = client.messages().create(params);
        respuesta.content().stream()
            .flatMap(bloque -> bloque.text().stream())
            .forEach(t -> System.out.println(t.text()));
        System.out.println("Uso: " + respuesta.usage());
    }
}`, nota: "En pom.xml: <dependency><groupId>com.anthropic</groupId><artifactId>anthropic-java</artifactId><version>3.2.0</version></dependency>" },
    { t: "5. Conversación de varios turnos en Python", d: "La API no recuerda: tú guardas el historial y lo reenvías.", lang: "Python", code: String.raw`import anthropic
client = anthropic.Anthropic()
historial = []

while (pregunta := input("Tú: ").strip()) not in ("", "salir"):
    historial.append({"role": "user", "content": pregunta})
    r = client.messages.create(model="claude-opus-5-5", max_tokens=16000,
                               system="Tutor de FP. Respuestas cortas.", messages=historial)
    texto = "".join(b.text for b in r.content if b.type == "text")
    historial.append({"role": "assistant", "content": r.content})   # se guarda tal cual
    print("Claude:", texto, f"\n  [entrada acumulada: {r.usage.input_tokens} tokens]")`, resultado: "Tú: ¿Qué es DHCP?\nClaude: ...\n  [entrada acumulada: 45 tokens]\nTú: ¿Y DORA?\nClaude: ...\n  [entrada acumulada: 260 tokens]   ← crece en cada turno" },
    { t: "6. Medir tokens y coste antes de enviar", d: "count_tokens no genera respuesta: úsalo para estimar el coste de un log o un fichero grande.", lang: "Python", code: String.raw`import anthropic, pathlib

PRECIOS = {"claude-haiku-5-5": (0.10, 0.50), "claude-sonnet-5-5": (2, 10), "claude-opus-5-5": (4, 20)}
client = anthropic.Anthropic()
log = pathlib.Path("syslog_muestra.txt").read_text(encoding="utf-8")

for modelo, (pe, ps) in PRECIOS.items():
    n = client.messages.count_tokens(model=modelo, messages=[{"role": "user", "content": log}]).input_tokens
    coste = n / 1e6 * pe + 2000 / 1e6 * ps          # suponiendo 2 000 tokens de respuesta
    print(f"{modelo:20} {n:>8} tokens  ≈ {coste:.4f} $")`, resultado: "claude-haiku-5-5        39812 tokens  ≈ 0.0050 $\nclaude-sonnet-5-5       39812 tokens  ≈ 0.0996 $\nclaude-opus-5-5         39812 tokens  ≈ 0.1992 $" }
  ],
  prompts: [
    { t: "System prompt base del curso", tipo: "System Prompt", uso: "Pégalo como system en todos tus scripts del curso y ve afinándolo.", txt: `<rol>Eres un tutor técnico de Formación Profesional de Grado Superior (DAM y ASIR).</rol>
<estilo>
- Respondes en español de España, con frases cortas.
- Primero la respuesta directa; después, si hace falta, el porqué.
- Cuando des comandos, indica si son de PowerShell o de Bash y qué hacen.
</estilo>
<limites>
- Si no estás seguro de un dato, dilo y propone cómo comprobarlo.
- No inventes parámetros de comandos: si dudas, indica cómo consultar la ayuda.
</limites>` },
    { t: "Comparador de modelos para un caso real", tipo: "Prompt", txt: `<contexto>
Tengo que procesar {{N}} registros al día del tipo: {{descripcion_tarea}}.
Cada registro tiene unos {{tokens}} tokens. Presupuesto mensual: {{presupuesto}} USD.
</contexto>
<tarea>
Compara Haiku 5.5, Sonnet 5.5 y Opus 5.5 para este caso: calidad esperada, coste mensual (muestra la cuenta) y latencia. Recomienda uno y explica cuándo cambiarías.
</tarea>` },
    { t: "Explicador de errores de la API", tipo: "Prompt", txt: `<logs>
{{pega aquí la respuesta de error completa, SIN la clave de API}}
</logs>
Dime: 1) qué significa el código HTTP, 2) la causa más probable, 3) el comando exacto para comprobarlo en PowerShell y en Bash.` },
    { t: "Profesor de conceptos con analogías", tipo: "Prompt", uso: "Para entender un concepto nuevo de cualquier módulo.", txt: `Explícame {{concepto}} para un alumno de {{DAM/ASIR}}:
1. Definición en una frase.
2. Una analogía de la vida real.
3. Un ejemplo técnico concreto con código o comandos.
4. El error más típico al usarlo.
5. Tres preguntas tipo test para comprobar que lo he entendido (con solución al final).` },
    { t: "Revisor de seguridad de mi script", tipo: "Prompt", txt: `<codigo>
{{tu script que llama a la API}}
</codigo>
Revisa: ¿hay claves escritas en el código? ¿se registran en logs datos sensibles? ¿se controla stop_reason y los errores 429/5xx? Devuelve una lista priorizada de correcciones.` }
  ],
  actividad: {
    dam: {
      t: "Cliente de consola multi-modelo",
      d: "Programa en Python o Java 21 un cliente de consola que pregunte el modelo (haiku/sonnet/opus), envíe la pregunta, muestre la respuesta y calcule tokens y coste en euros.",
      pasos: [
        "Crea un repositorio con .gitignore que excluya .env.",
        "Lee la clave de ANTHROPIC_API_KEY (nunca del código).",
        "Implementa la capa AsistenteIA con una clase para Claude.",
        "Muestra input_tokens, output_tokens y el coste con una tabla de precios en un fichero de configuración.",
        "Haz la misma pregunta a los tres modelos y compara."
      ],
      entregables: ["Repositorio Git (sin claves).", "README con instrucciones de ejecución.", "Tabla comparando las tres respuestas a la misma pregunta."],
      criterios: [["Funciona con los tres modelos", 4], ["Coste calculado correctamente", 2], ["Clave gestionada de forma segura", 2], ["Código limpio y README", 2]]
    },
    asir: {
      t: "Clave de API segura en un servidor",
      d: "En una VM Linux y en una Windows Server, configura ANTHROPIC_API_KEY para que solo la vea el usuario de servicio y haz la llamada con curl e Invoke-RestMethod.",
      pasos: [
        "Crea un usuario de servicio sin shell interactiva (Linux) o una cuenta de servicio local (Windows).",
        "Guarda la clave en /etc/ia/anthropic.env (600) o como variable de usuario de esa cuenta.",
        "Escribe un script .sh y uno .ps1 que hagan la llamada y muestren solo el texto.",
        "Demuestra que otro usuario no puede leer la clave."
      ],
      entregables: ["Capturas de permisos del fichero de secretos.", "Scripts .sh y .ps1.", "Explicación de por qué no debe quedar la clave en el historial de la shell."],
      criterios: [["Permisos mínimos correctos", 4], ["Scripts funcionando en ambos sistemas", 3], ["Prueba de que otro usuario no accede", 2], ["Documentación", 1]]
    },
    sync: {
      t: "Calculadora de costes compartida",
      d: "DAM programa una función que estima el coste por tokens; ASIR la ejecuta sobre un log real anonimizado de 1 MB y documenta cuántos tokens tiene y cuánto costaría analizarlo con cada modelo.",
      pasos: ["DAM publica la función en el repositorio común.", "ASIR anonimiza el log (IPs, usuarios) y lo mide.", "Juntos redactan la recomendación de modelo para el análisis diario."],
      entregables: ["Enlace al repositorio común.", "Informe de una página con la tabla de costes y la recomendación."],
      criterios: [["Integración funcionando", 4], ["Log correctamente anonimizado", 3], ["Recomendación justificada", 3]]
    }
  },
  test: [
    { p: "¿Qué significa que la API de Claude sea «sin estado»?", o: ["Que no guarda conversaciones: cada petición debe incluir todo el contexto", "Que no devuelve códigos de estado HTTP", "Que solo admite una pregunta por día", "Que el modelo no tiene fecha de corte"], c: 0, exp: "La API no recuerda nada entre peticiones; para seguir una conversación reenvías el historial en messages." },
    { p: "¿Qué modelo elegirías para clasificar 200 000 líneas de log por tipo de evento?", o: ["Claude Fable 5.1", "Claude Opus 5.5", "Claude Haiku 5.5", "Da igual, cuestan lo mismo"], c: 2, exp: "Es una tarea simple y masiva: Haiku 5.5 es el más barato y rápido." },
    { p: "¿Dónde debe guardarse la clave de API?", o: ["En el código, en una constante", "En una variable de entorno o en un gestor de secretos", "En el README para que el equipo la vea", "En un comentario del código"], c: 1, exp: "Los SDK leen ANTHROPIC_API_KEY del entorno; nunca debe estar en el código ni en Git." },
    { p: "Una respuesta llega con stop_reason \"max_tokens\". ¿Qué ha pasado?", o: ["El modelo ha rechazado la petición", "La respuesta se ha cortado al alcanzar el límite de salida", "Has superado el límite de peticiones", "La clave no es válida"], c: 1, exp: "max_tokens indica que se alcanzó el límite de salida que fijaste; súbelo o usa streaming." },
    { p: "¿Por qué no conviene leer siempre content[0].text?", o: ["Porque content siempre está vacío", "Porque el primer bloque puede ser de tipo thinking", "Porque text está en usage", "Porque solo funciona en Java"], c: 1, exp: "En los modelos actuales el primer bloque puede ser el razonamiento (thinking); hay que filtrar los bloques de tipo text." },
    { p: "¿Qué código HTTP indica que has superado el límite de peticiones?", o: ["401", "404", "429", "302"], c: 2, exp: "429 rate_limit_error: espera y reintenta; los SDK lo hacen solos." },
    { p: "En una conversación de muchos turnos, ¿qué ocurre con los tokens de entrada?", o: ["Se mantienen constantes", "Crecen, porque se reenvía el historial", "Se reducen a cero", "Solo se cobran los del primer turno"], c: 1, exp: "Cada turno reenvía todo lo anterior, así que la entrada crece; la caché (Sesión 10) lo abarata." },
    { p: "¿Para qué sirve count_tokens?", o: ["Para generar una respuesta más corta", "Para medir cuántos tokens tiene una entrada sin generar respuesta", "Para ver el saldo de la cuenta", "Para limitar max_tokens"], c: 1, exp: "Permite estimar el coste antes de enviar la petición real." },
    { p: "¿Qué ventaja tiene una capa de adaptador (interfaz AsistenteIA)?", o: ["Hace el modelo más inteligente", "Permite cambiar de proveedor tocando solo una clase", "Elimina la necesidad de clave de API", "Reduce los tokens de salida"], c: 1, exp: "El resto de la aplicación depende de la interfaz, no del proveedor concreto." },
    { p: "Se ha subido por error la clave a un repositorio público. ¿Qué es lo correcto?", o: ["Borrar el fichero y hacer otro commit", "Revocar la clave en la consola y crear otra", "Hacer el repositorio privado", "Cambiar el nombre de la variable"], c: 1, exp: "Queda en el historial de Git y puede estar ya copiada: la única solución segura es revocarla." }
  ],
  faq: [
    { q: "Error 401 authentication_error", a: "La clave no llega o es incorrecta. Comprueba la variable con <code>echo $ANTHROPIC_API_KEY | cut -c1-10</code> (Bash) o <code>$env:ANTHROPIC_API_KEY.Substring(0,10)</code> (PowerShell) y abre una terminal nueva si la acabas de definir." },
    { q: "Error 429 rate_limit_error", a: "Has superado el límite de peticiones o tokens por minuto. Los SDK reintentan solos 2 veces; para cargas masivas usa la Batch API (Sesión 10) y respeta la cabecera <code>retry-after</code>." },
    { q: "Error 529 overloaded_error", a: "El servicio está saturado temporalmente. Reintenta con espera exponencial (1 s, 2 s, 4 s…). No es un fallo de tu código." },
    { q: "La respuesta sale cortada", a: "Mira <code>stop_reason</code>: si es <code>max_tokens</code>, sube <code>max_tokens</code>. Para salidas largas usa streaming (Sesión 10)." },
    { q: "Leo content[0].text y falla", a: "El primer bloque puede ser de tipo <code>thinking</code>. Recorre <code>content</code> y quédate con los bloques <code>text</code>." },
    { q: "¿Mi suscripción de claude.ai sirve para la API?", a: "No. La API se paga aparte en platform.claude.com, por tokens consumidos." },
    { q: "Las tildes salen mal en PowerShell", a: "Ejecuta <code>[Console]::OutputEncoding = [Text.Encoding]::UTF8</code> y envía el cuerpo con <code>charset=utf-8</code>." }
  ]
};
