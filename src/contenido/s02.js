/* Sesión 2 · Pensamiento extendido: adaptive thinking y esfuerzo */
export default {
  n: 2, bloque: 1,
  titulo: "Pensamiento extendido: adaptive thinking y esfuerzo",
  resumen: "Cómo razona Claude antes de responder, cómo se regula con effort y cuándo compensa: depuración compleja (DAM) y análisis de caídas en cascada (ASIR).",
  skill: "Script diagnostico.py con thinking adaptativo, nivel de esfuerzo configurable y resumen del razonamiento",
  mcp: "—",
  objetivos: [
    "Explicar qué es el pensamiento extendido y por qué mejora los problemas de varios pasos.",
    "Configurar thinking adaptativo y el nivel de esfuerzo (low → max) en Python y Java.",
    "Migrar código antiguo con budget_tokens a la configuración actual.",
    "Ver un resumen del razonamiento con display: summarized.",
    "Decidir el esfuerzo adecuado midiendo calidad, tokens y tiempo.",
    "Aplicarlo a un bug de concurrencia en Java 21 y a una caída en cascada de servicios."
  ],
  teoria: [
    {
      h: "Qué es el pensamiento extendido",
      html: `<p>Antes de escribir la respuesta, el modelo puede generar un <b>razonamiento interno</b>: plantea hipótesis, las descarta, comprueba pasos intermedios. Ese razonamiento llega como bloques de tipo <code>thinking</code> en <code>content</code>. Es como la diferencia entre contestar de memoria y hacer la cuenta en un papel antes.</p>
      <p>Mejora sobre todo en problemas con <b>varios pasos encadenados</b>: una condición de carrera, una caída DNS → LDAP → aplicación → balanceador, un plan de migración, una consulta SQL con varios JOIN y agregados.</p>
      <p>En los modelos actuales el modo es <b>adaptativo</b>: <code>thinking: {"type": "adaptive"}</code>. Claude decide cuánto pensar según la dificultad. Lo que tú regulas es el <b>esfuerzo</b>.</p>`,
      ejemplos: [
        { tipo: "general", titulo: "Mismo problema, distinto esfuerzo", texto: `<p>Pregunta: <i>"Mi contador con hilos virtuales a veces da 9 987 en lugar de 10 000"</i>. Con esfuerzo <code>low</code> suele responder "usa synchronized". Con <code>high</code> explica que <code>total++</code> es leer-sumar-escribir (no atómico), propone <code>AtomicInteger</code> o <code>LongAdder</code>, y te da un test que reproduce el fallo.</p>` }
      ]
    },
    {
      h: "Del antiguo thinking_budget a effort",
      html: `<table>
        <tr><th>Antes (modelos antiguos)</th><th>Ahora (Opus 5.5, Sonnet 5.5, Haiku 5.5)</th></tr>
        <tr><td><code>thinking: {type: "enabled", budget_tokens: 8000}</code></td><td><code>thinking: {type: "adaptive"}</code> + <code>output_config: {effort: "high"}</code></td></tr>
        <tr><td>Presupuesto fijo de tokens de pensamiento</td><td>Niveles <code>low</code>, <code>medium</code>, <code>high</code>, <code>xhigh</code>, <code>max</code></td></tr>
        <tr><td><code>temperature</code> para variar respuestas</td><td>Ya no se admite en los modelos actuales; se controla con el prompt y el esfuerzo</td></tr>
      </table>
      <ul>
        <li>En <b>Opus 5.5</b> el pensamiento no se puede desactivar y <code>budget_tokens</code> devuelve error 400. El esfuerzo por defecto es <code>medium</code>.</li>
        <li>En <b>Sonnet 5.5</b> el esfuerzo por defecto es <code>high</code>; para apagar el pensamiento existe <code>{"type": "between_tools"}</code>.</li>
        <li>El esfuerzo va <b>dentro</b> de <code>output_config</code>, no en el nivel superior de la petición.</li>
      </ul>`,
      ejemplos: [
        { tipo: "aviso", titulo: "Código antiguo que verás en Internet", lang: "Python", code: String.raw`# ✗ Esto da error 400 en Opus 5.5
client.messages.create(model="claude-opus-5-5", max_tokens=16000,
    thinking={"type": "enabled", "budget_tokens": 8000}, messages=[...])

# ✓ Equivalente actual
client.messages.create(model="claude-opus-5-5", max_tokens=16000,
    thinking={"type": "adaptive"},
    output_config={"effort": "high"}, messages=[...])` }
      ]
    },
    {
      h: "Los cinco niveles de esfuerzo",
      html: `<div class="scheme">  Nivel    Qué hace                                   Ejemplo de uso
  ───────  ─────────────────────────────────────────  ─────────────────────────────────
  low      Responde casi directo, pocas comprobaciones Clasificar una línea, traducir
  medium   Equilibrio (por defecto en Opus 5.5)       Explicar un concepto, revisar 50 líneas
  high     Razona con cuidado, verifica pasos          Revisar una clase, diseñar una API
  xhigh    Explora alternativas y casos límite         Bug intermitente, post-mortem
  max      Máxima profundidad, coste alto              Decisiones críticas de seguridad o datos</div>
      <p>Más esfuerzo = más tokens de salida (el razonamiento se factura como salida) = <b>más coste y más tiempo</b>. Mide con casos reales: muchas veces <code>medium</code> basta y <code>high</code> no aporta nada salvo factura.</p>`,
      ejemplos: [
        { tipo: "general", titulo: "Medición real de un caso de clase", lang: "Tabla", code: String.raw`Caso: post-mortem de caída en cascada (log de 3 KB)
Esfuerzo   Tokens salida   Tiempo   ¿Causa raíz correcta?
low              420        4 s      No (culpa al balanceador)
medium         1 350       11 s      Sí, sin evidencias
high           3 900       27 s      Sí, con línea temporal
xhigh          7 800       52 s      Sí, + 3 acciones preventivas
→ Para el informe diario basta "high"; "xhigh" solo para incidencias graves.` }
      ]
    },
    {
      h: "Ver el razonamiento: display",
      html: `<p>Por defecto los bloques <code>thinking</code> llegan <b>vacíos</b> (<code>display: "omitted"</code>): el modelo piensa, pero no te enseña el texto. Opciones:</p>
      <ul>
        <li><code>"display": "summarized"</code>: recibes un <b>resumen legible</b> del razonamiento. Muy útil en clase para entender cómo llegó a la conclusión.</li>
        <li><code>"display": "omitted"</code>: el valor por defecto; menos texto que procesar.</li>
      </ul>
      <p>El pensamiento se factura igual se muestre o no. El razonamiento completo en bruto nunca se devuelve.</p>`,
      ejemplos: [
        { tipo: "general", titulo: "Leer el resumen en Python", lang: "Python", code: String.raw`r = client.messages.create(
    model="claude-opus-5-5", max_tokens=16000,
    thinking={"type": "adaptive", "display": "summarized"},
    output_config={"effort": "high"},
    messages=[{"role": "user", "content": pregunta}])

for b in r.content:
    if b.type == "thinking" and b.thinking:
        print("RAZONAMIENTO (resumen):\n", b.thinking)
    elif b.type == "text":
        print("RESPUESTA:\n", b.text)` }
      ]
    },
    {
      h: "Streaming: imprescindible con esfuerzos altos",
      html: `<p>Con esfuerzo <code>xhigh</code> o <code>max</code> una respuesta puede tardar más de un minuto. Si haces la petición normal, el cliente HTTP puede agotar el tiempo de espera. Solución: <b>streaming</b>, que recibe la respuesta en trozos. Si no necesitas mostrarla en vivo, usa <code>get_final_message()</code> para obtenerla completa al final.</p>
      <p>Regla del curso: con <code>max_tokens</code> mayor de 16 000 o esfuerzo <code>xhigh</code>/<code>max</code>, siempre <code>client.messages.stream(...)</code>.</p>`
    },
    {
      h: "Cómo pedir un razonamiento verificable",
      html: `<p>El pensamiento interno ayuda, pero tú también puedes estructurar la respuesta para poder <b>comprobarla</b>:</p>
      <ol>
        <li>Pide las <b>hipótesis descartadas</b> y la evidencia de cada descarte.</li>
        <li>Pide que cite la <b>línea exacta</b> del log o del código en que se basa.</li>
        <li>Pide un <b>experimento</b> o test que confirme la causa raíz.</li>
        <li>Pide el <b>formato fijo</b>: Causa raíz / Evidencias / Solución / Verificación.</li>
      </ol>`,
      ejemplos: [
        { tipo: "asir", titulo: "Formato de post-mortem", lang: "Texto", code: String.raw`CAUSA RAÍZ: el DNS primario (dns01) dejó de responder a las 09:00:01.
EVIDENCIAS:
  - 09:00:01 dns01 named: refresh failed (timeout)
  - 09:00:40 ldap01: unable to resolve db01.corp.local
DESCARTADAS: balanceador (solo refleja que no hay backends), red (ping OK).
SOLUCIÓN: segundo DNS en resolv.conf de ldap01 + alerta de named.
VERIFICACIÓN: dig @dns02 db01.corp.local desde ldap01 devuelve la IP.` }
      ]
    },
    {
      h: "Cuándo NO subir el esfuerzo",
      html: `<ul>
        <li>Si falta información (no has pegado el log o el código), más esfuerzo no la inventa: <b>da más contexto</b>.</li>
        <li>Tareas mecánicas (formatear, traducir, extraer campos): <code>low</code>.</li>
        <li>Procesos masivos (miles de peticiones): mide primero el coste; en Haiku 5.5 con <code>low</code> suele bastar.</li>
        <li>Chat interactivo con alumnos: <code>low</code>/<code>medium</code> para que responda rápido.</li>
      </ul>`
    }
  ],
  taller: [
    { t: "1. diagnostico.py con thinking adaptativo", d: "Recibe un fichero (traza o log) y el nivel de esfuerzo; usa streaming y muestra el resumen del razonamiento.", lang: "Python", code: String.raw`import sys, time, pathlib, anthropic

fichero = sys.argv[1]
esfuerzo = sys.argv[2] if len(sys.argv) > 2 else "high"
contenido = pathlib.Path(fichero).read_text(encoding="utf-8")

client = anthropic.Anthropic()
inicio = time.time()
with client.messages.stream(
    model="claude-opus-5-5",
    max_tokens=64000,
    thinking={"type": "adaptive", "display": "summarized"},
    output_config={"effort": esfuerzo},
    system="Eres un ingeniero senior de diagnóstico. Responde en español.",
    messages=[{"role": "user", "content":
        f"<logs>\n{contenido}\n</logs>\n"
        "Encuentra la causa raíz. Formato: CAUSA RAÍZ / EVIDENCIAS / DESCARTADAS / SOLUCIÓN / VERIFICACIÓN."}],
) as stream:
    respuesta = stream.get_final_message()

for b in respuesta.content:
    if b.type == "thinking" and b.thinking:
        print("── Resumen del razonamiento ──\n" + b.thinking + "\n")
    elif b.type == "text":
        print(b.text)
print(f"\n[{esfuerzo}] {respuesta.usage.output_tokens} tokens de salida en {time.time() - inicio:.0f} s")` },
    { t: "2. Caso DAM: condición de carrera en Java 21", d: "Guarda esta clase como contador.txt y ejecuta el diagnóstico con low y después con xhigh. Compara las respuestas.", lang: "Java", code: String.raw`public class Contador {
    private int total = 0;

    public void sumar() { total++; }   // leer, sumar y escribir: NO es atómico

    public static void main(String[] args) throws Exception {
        var c = new Contador();
        try (var ex = java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 10_000; i++) ex.submit(c::sumar);
        }
        System.out.println(c.total); // a veces < 10000
    }
}`, resultado: "python diagnostico.py contador.txt xhigh\nCAUSA RAÍZ: total++ no es atómico; dos hilos leen el mismo valor...\nSOLUCIÓN: AtomicInteger total = new AtomicInteger(); total.incrementAndGet();" },
    { t: "3. La corrección y su test JUnit 5", d: "Aplica la solución propuesta y comprueba que el test falla antes y pasa después.", lang: "Java", code: String.raw`import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.RepeatedTest;
import static org.junit.jupiter.api.Assertions.assertEquals;

class ContadorTest {
    static class ContadorSeguro {
        private final AtomicInteger total = new AtomicInteger();
        void sumar() { total.incrementAndGet(); }
        int valor() { return total.get(); }
    }

    @RepeatedTest(20)
    void sumaDiezMilVecesSinPerder() {
        var c = new ContadorSeguro();
        try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 10_000; i++) ex.submit(c::sumar);
        }
        assertEquals(10_000, c.valor());
    }
}` },
    { t: "4. Caso ASIR: caída en cascada", d: "Log de ejemplo ya anonimizado. Lánzalo con xhigh.", lang: "Bash", code: String.raw`cat > cascada.log <<'EOF'
09:00:01 dns01 named[812]: zone corp.local/IN: refresh: failure trying master 10.0.0.2#53 (timeout)
09:00:40 ldap01 slapd[455]: unable to resolve db01.corp.local
09:01:05 app01 tomcat[2201]: javax.naming.CommunicationException: ldap01:389
09:01:06 app01 tomcat[2201]: HTTP 500 /login (x312)
09:02:30 lb01 haproxy[90]: backend app_pool has no server available!
09:03:10 mon01 zabbix: Problem: Web /login down
EOF
python diagnostico.py cascada.log xhigh`, resultado: "CAUSA RAÍZ: fallo de dns01 a las 09:00:01...\nDESCARTADAS: haproxy (síntoma), tomcat (síntoma)..." },
    { t: "5. Comparar esfuerzos automáticamente (PowerShell)", d: "Ejecuta los cinco niveles y guarda cada salida para comparar calidad, tokens y tiempo.", lang: "PowerShell", code: String.raw`foreach ($e in "low","medium","high","xhigh","max") {
    python diagnostico.py cascada.log $e | Out-File "resultado_$e.txt" -Encoding utf8
    Write-Host "Nivel $e terminado"
}
Get-ChildItem resultado_*.txt | ForEach-Object {
    $ultima = Get-Content $_ -Tail 1
    "{0,-22} {1}" -f $_.Name, $ultima
}`, resultado: "resultado_high.txt     [high] 3900 tokens de salida en 27 s\nresultado_low.txt      [low] 420 tokens de salida en 4 s\n..." },
    { t: "6. Lo mismo en Java 21", d: "Configuración de esfuerzo y thinking adaptativo con el SDK de Java.", lang: "Java", code: String.raw`import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.OutputConfig;
import com.anthropic.models.messages.ThinkingConfigAdaptive;
import java.nio.file.Files;
import java.nio.file.Path;

public class Diagnostico {
    public static void main(String[] args) throws Exception {
        var client = AnthropicOkHttpClient.fromEnv();
        String log = Files.readString(Path.of(args[0]));

        var params = MessageCreateParams.builder()
            .model("claude-opus-5-5")
            .maxTokens(16000L)
            .thinking(ThinkingConfigAdaptive.builder().build())
            .outputConfig(OutputConfig.builder().effort(OutputConfig.Effort.HIGH).build())
            .addUserMessage("<logs>\n" + log + "\n</logs>\nEncuentra la causa raíz.")
            .build();

        client.messages().create(params).content().stream()
            .flatMap(b -> b.text().stream())
            .forEach(t -> System.out.println(t.text()));
    }
}`, nota: "Si tu versión del SDK no tiene alguna de estas clases, el compilador te dirá el nombre correcto; consulta el README del SDK de Java." }
  ],
  prompts: [
    { t: "Depurador de concurrencia (DAM)", tipo: "System Prompt", txt: `<rol>Ingeniero Java senior especialista en concurrencia y Java 21.</rol>
<codigo>
{{pega la clase o el fragmento}}
</codigo>
<sintoma>{{qué falla y cada cuánto}}</sintoma>
<tarea>
1. Identifica la causa raíz (no los síntomas), citando las líneas.
2. Propón la corrección mínima con código.
3. Escribe un test JUnit 5 que falle antes y pase después.
4. Indica si hay otros puntos del código con el mismo problema.
</tarea>` },
    { t: "Post-mortem de incidencia (ASIR)", tipo: "Prompt", txt: `<logs>
{{logs anonimizados, ordenados por hora, de todos los servicios implicados}}
</logs>
<topologia>{{servidores y dependencias: dns → ldap → app → balanceador}}</topologia>
Construye la línea temporal, señala el primer fallo (causa raíz), los fallos derivados y tres acciones preventivas, cada una con su comando de monitorización.` },
    { t: "Razonamiento verificable", tipo: "Prompt", uso: "Añádelo al final de cualquier pregunta difícil.", txt: `Antes de la solución final:
- Enumera las hipótesis que descartas y la evidencia (línea exacta) que descarta cada una.
- Indica el experimento o comando que confirmaría tu causa raíz.
Termina con UNA sola causa raíz y tu nivel de confianza (alto/medio/bajo).` },
    { t: "Revisión de una consulta SQL compleja", tipo: "Prompt", txt: `<esquema>{{CREATE TABLE ...}}</esquema>
<consulta>{{SELECT ...}}</consulta>
<problema>{{devuelve duplicados / tarda 30 s / no cuadra el total}}</problema>
Explica paso a paso qué hace cada JOIN, dónde se multiplican filas, la consulta corregida y el índice que la acelera.` },
    { t: "Plan de migración con riesgos", tipo: "Prompt", txt: `<situacion>{{p. ej. migrar 40 equipos de Windows 10 a Windows 11 / migrar app de Java 11 a 21}}</situacion>
Razona con cuidado y entrega: fases, riesgos de cada fase (probabilidad e impacto), plan de vuelta atrás y checklist del día D.` }
  ],
  actividad: {
    dam: {
      t: "Bug hunting con esfuerzo variable",
      d: "Elige un bug real de tus prácticas (o el del contador). Ejecuta el diagnóstico con low, high y xhigh y valora si la calidad compensa el coste.",
      pasos: ["Reproduce el bug con un test que falle.", "Ejecuta diagnostico.py con tres esfuerzos.", "Aplica la mejor solución y deja el test en verde.", "Rellena la tabla de comparación."],
      entregables: ["Tabla esfuerzo / tokens / tiempo / ¿acertó la causa?", "Parche aplicado y test JUnit que lo verifica."],
      criterios: [["Test que reproduce el fallo", 3], ["Comparación de esfuerzos medida", 3], ["Corrección correcta", 3], ["Conclusión razonada", 1]]
    },
    asir: {
      t: "Análisis de caída en cascada",
      d: "Monta en Docker tres contenedores (dns, ldap simulado y web), provoca la caída del DNS, recoge los logs, anonimízalos y analízalos con diagnostico.py en xhigh.",
      pasos: ["docker compose up con los tres servicios.", "docker stop dns y observa el efecto en cadena.", "docker compose logs > incidencia.log y anonimiza IPs y usuarios.", "Analiza y compara con tu propio diagnóstico."],
      entregables: ["docker-compose.yml.", "Log anonimizado.", "Informe post-mortem con línea temporal."],
      criterios: [["Escenario reproducible", 3], ["Anonimización correcta", 2], ["Post-mortem con línea temporal y causa raíz", 4], ["Acciones preventivas", 1]]
    }
  },
  test: [
    { p: "¿Cómo se activa el pensamiento en Opus 5.5?", o: ["thinking: {type: \"enabled\", budget_tokens: 8000}", "thinking: {type: \"adaptive\"} y se regula con output_config.effort", "temperature: 0", "No se puede activar"], c: 1, exp: "En los modelos actuales el modo es adaptativo y la profundidad se regula con effort." },
    { p: "¿Qué ocurre si envías budget_tokens a Opus 5.5?", o: ["Se ignora", "Error 400", "Responde más rápido", "Se aplica como max_tokens"], c: 1, exp: "budget_tokens está retirado en Opus 5.5 y devuelve 400." },
    { p: "¿Dónde va el parámetro effort?", o: ["En la cabecera HTTP", "Dentro de output_config", "En el system prompt", "En messages"], c: 1, exp: "Se escribe output_config: {effort: \"high\"}." },
    { p: "¿Cuál es el esfuerzo por defecto en Opus 5.5?", o: ["low", "medium", "high", "max"], c: 1, exp: "Opus 5.5 usa medium por defecto; conviene fijarlo explícitamente." },
    { p: "¿Qué devuelve display: \"summarized\"?", o: ["El razonamiento completo en bruto", "Un resumen legible del razonamiento", "Solo la respuesta final", "Un resumen de la pregunta"], c: 1, exp: "Devuelve un resumen; el razonamiento completo nunca se expone." },
    { p: "¿Cómo se factura el pensamiento?", o: ["Es gratis", "Como tokens de salida, se muestre o no", "Como tokens de entrada", "Solo si display es summarized"], c: 1, exp: "Se piensa y se factura igual con cualquier display." },
    { p: "¿Por qué usar streaming con esfuerzo xhigh?", o: ["Porque es más barato", "Para evitar que la petición agote el tiempo de espera", "Porque sin streaming no hay thinking", "Para usar menos tokens"], c: 1, exp: "Las respuestas largas pueden tardar minutos; el streaming evita timeouts." },
    { p: "En el contador con hilos virtuales, ¿por qué total++ falla?", o: ["Porque int es demasiado pequeño", "Porque leer-sumar-escribir no es atómico", "Porque los hilos virtuales no existen", "Porque falta System.gc()"], c: 1, exp: "Dos hilos pueden leer el mismo valor y escribir el mismo resultado; se pierden incrementos." },
    { p: "Si al modelo le falta el log para diagnosticar, ¿qué haces?", o: ["Subir el esfuerzo a max", "Darle el contexto que falta", "Cambiar a Haiku", "Bajar max_tokens"], c: 1, exp: "Más esfuerzo no inventa información: hay que aportar el contexto." },
    { p: "En la caída DNS → LDAP → app → balanceador, ¿cuál es la causa raíz?", o: ["El balanceador sin backends", "El error HTTP 500", "El fallo del DNS primario", "La alerta de Zabbix"], c: 2, exp: "El primer fallo de la cadena es el DNS; el resto son síntomas derivados." }
  ],
  faq: [
    { q: "Error 400 al enviar budget_tokens", a: "En Opus 5.5, Sonnet 5.5 y Haiku 5.5 se usa <code>thinking: {\"type\": \"adaptive\"}</code> y se regula con <code>output_config: {\"effort\": ...}</code>." },
    { q: "Error 400 con temperature", a: "Los modelos actuales no aceptan <code>temperature</code>, <code>top_p</code> ni <code>top_k</code>. Quítalos y controla el estilo con el prompt." },
    { q: "Los bloques thinking llegan vacíos", a: "Es el comportamiento por defecto. Añade <code>\"display\": \"summarized\"</code> dentro de <code>thinking</code>." },
    { q: "Timeout con respuestas largas", a: "Con <code>max_tokens</code> alto o esfuerzo alto usa <code>client.messages.stream(...)</code> y <code>get_final_message()</code>." },
    { q: "¿Puedo desactivar el pensamiento en Opus 5.5?", a: "No. Baja <code>effort</code> a <code>low</code> para respuestas rápidas y baratas." },
    { q: "Con xhigh tarda demasiado para un chat", a: "Para conversación interactiva usa <code>low</code> o <code>medium</code>; reserva <code>xhigh</code> para análisis puntuales." }
  ]
};
