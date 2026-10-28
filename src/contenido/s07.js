/* Sesión 7 · Arquitectura MCP */
export default {
  n: 7, bloque: 3,
  titulo: "Arquitectura MCP: Host, Client, Server, primitivas y transportes",
  resumen: "Cómo funciona el Model Context Protocol por dentro: piezas, mensajes JSON-RPC, primitivas del servidor y del cliente, transportes stdio y Streamable HTTP, y cómo inspeccionar servidores.",
  skill: "Fichero .mcp.json del proyecto con servidores locales y remotos",
  mcp: "Servidores existentes: filesystem (stdio) y GitHub remoto (HTTP), probados con MCP Inspector",
  objetivos: [
    "Explicar qué problema resuelve MCP y por qué es un estándar abierto.",
    "Identificar Host, Client y Server en un caso real.",
    "Distinguir Resources, Tools y Prompts, y las capacidades del cliente.",
    "Leer un intercambio JSON-RPC de inicialización y de llamada a herramienta.",
    "Elegir entre stdio y Streamable HTTP y conocer sus riesgos.",
    "Configurar servidores en .mcp.json e inspeccionarlos con MCP Inspector."
  ],
  teoria: [
    {
      h: "El problema que resuelve MCP",
      html: `<p>Sin un estándar, cada aplicación de IA necesita una integración distinta con cada sistema: N aplicaciones × M sistemas = N·M integraciones. <b>MCP</b> (Model Context Protocol) es un protocolo abierto que define cómo una aplicación de IA se conecta a datos y herramientas. Escribes un <b>servidor MCP</b> una vez y lo usan Claude Code, Claude Desktop, la API de Claude y otros clientes compatibles: N + M.</p>
      <p>Analogía: MCP es a la IA lo que USB a los periféricos. El ratón no necesita un conector distinto para cada marca de ordenador.</p>`,
      ejemplos: [
        { tipo: "general", titulo: "Mismo servidor, varios clientes", texto: `<p>El servidor <code>jro-ops</code> que construiremos en la Sesión 9 sirve igual para: Claude Code en tu portátil (stdio), un compañero que lo usa por red (HTTP) y una aplicación DAM que llama a la API con el conector MCP (Sesión 10).</p>` }
      ]
    },
    {
      h: "Las tres piezas: Host, Client y Server",
      html: `<div class="scheme">  ┌──────────── HOST (Claude Code, Claude Desktop, tu app) ───────────┐
  │   Client MCP ①  ───────────▶  Servidor MCP "postgres" (datos)      │
  │   Client MCP ②  ───────────▶  Servidor MCP "docker"   (ops)        │
  │   Client MCP ③  ───────────▶  Servidor MCP "github"   (remoto)     │
  └──────────────────────────────────────────────────────────────────────┘
  Mensajes: JSON-RPC 2.0   ·   un client por cada servidor   ·   el host decide permisos</div>
      <ul>
        <li><b>Host</b>: la aplicación que usa el usuario. Contiene el modelo y decide qué se permite.</li>
        <li><b>Client</b>: el conector que el host crea para cada servidor (relación 1 a 1).</li>
        <li><b>Server</b>: programa que expone capacidades (datos, acciones, plantillas) de un sistema concreto.</li>
      </ul>`
    },
    {
      h: "Primitivas del servidor: Resources, Tools y Prompts",
      html: `<table>
        <tr><th>Primitiva</th><th>Qué es</th><th>Quién decide usarla</th><th>Ejemplo DAM</th><th>Ejemplo ASIR</th></tr>
        <tr><td><b>Resources</b></td><td>Datos de solo lectura identificados por URI</td><td>La aplicación / el usuario</td><td><code>esquema://pedidos</code></td><td><code>metricas://host</code></td></tr>
        <tr><td><b>Tools</b></td><td>Acciones con parámetros y resultado</td><td>El modelo (con permiso del usuario)</td><td><code>consultar(sql)</code></td><td><code>reiniciar_servicio(nombre)</code></td></tr>
        <tr><td><b>Prompts</b></td><td>Plantillas de tareas reutilizables</td><td>El usuario (las elige)</td><td>"Revisa este endpoint"</td><td>"Diagnostica el servicio X"</td></tr>
      </table>
      <p>Las tools pueden llevar <b>anotaciones</b> que informan al host: <code>readOnlyHint</code> (no cambia nada), <code>destructiveHint</code> (puede borrar), <code>idempotentHint</code>. Son pistas, no garantías: la seguridad la impone el código del servidor.</p>`
    },
    {
      h: "Capacidades del cliente: roots, sampling y elicitation",
      html: `<p>La comunicación es en ambos sentidos. El cliente también puede ofrecer capacidades al servidor:</p>
      <ul>
        <li><b>Roots</b>: qué carpetas o recursos puede tocar el servidor (p. ej. solo el proyecto actual).</li>
        <li><b>Sampling</b>: el servidor pide al host que el modelo genere texto (sin tener clave de API propia).</li>
        <li><b>Elicitation</b>: el servidor pide al usuario un dato o una confirmación durante una acción ("¿Seguro que quieres reiniciar nginx?").</li>
      </ul>`
    },
    {
      h: "El protocolo por dentro: JSON-RPC 2.0",
      html: `<p>Todo son mensajes JSON-RPC: peticiones con <code>id</code>, respuestas con el mismo <code>id</code> y notificaciones sin <code>id</code>. El ciclo de vida:</p>
      <ol>
        <li><code>initialize</code>: cliente y servidor acuerdan versión del protocolo y capacidades.</li>
        <li><code>notifications/initialized</code>: listo para trabajar.</li>
        <li><code>tools/list</code>, <code>resources/list</code>, <code>prompts/list</code>: descubrimiento.</li>
        <li><code>tools/call</code>, <code>resources/read</code>, <code>prompts/get</code>: uso.</li>
      </ol>`,
      ejemplos: [
        { tipo: "general", titulo: "Llamada a una herramienta", lang: "JSON", code: String.raw`→ {"jsonrpc":"2.0","id":7,"method":"tools/call",
   "params":{"name":"logs_servicio","arguments":{"servicio":"nginx","lineas":50}}}

← {"jsonrpc":"2.0","id":7,
   "result":{"content":[{"type":"text","text":"oct 28 09:12 nginx[812]: ..."}],"isError":false}}` }
      ]
    },
    {
      h: "Transportes: stdio y Streamable HTTP",
      html: `<table>
        <tr><th>Transporte</th><th>Cómo funciona</th><th>Cuándo</th><th>Riesgos</th></tr>
        <tr><td><code>stdio</code></td><td>El host lanza el servidor como proceso local; hablan por stdin/stdout</td><td>Herramientas locales, desarrollo</td><td>Se ejecuta con tus permisos</td></tr>
        <tr><td>Streamable HTTP</td><td>Servidor web con un endpoint (normalmente <code>/mcp</code>); puede responder en streaming</td><td>Servidores remotos y compartidos</td><td>Expuesto en red: TLS y autenticación obligatorios</td></tr>
        <tr><td>SSE (antiguo)</td><td>Transporte HTTP anterior, sustituido por Streamable HTTP</td><td>Solo servidores heredados</td><td>—</td></tr>
      </table>
      <p><b>Regla de oro de stdio</b>: el servidor nunca escribe en stdout nada que no sea protocolo. Un <code>print()</code> de depuración rompe la conexión: usa stderr o <code>logging</code>.</p>
      <p>Para servidores remotos, la especificación usa <b>OAuth 2.1</b>; en el aula usaremos un token Bearer detrás de un proxy con TLS.</p>`
    },
    {
      h: "Ámbitos y configuración en Claude Code",
      html: `<table>
        <tr><th>Ámbito</th><th>Dónde se guarda</th><th>Quién lo ve</th></tr>
        <tr><td><code>local</code> (por defecto)</td><td>Configuración privada del proyecto</td><td>Solo tú, en este proyecto</td></tr>
        <tr><td><code>project</code></td><td><code>.mcp.json</code> en la raíz (se sube a Git)</td><td>Todo el equipo</td></tr>
        <tr><td><code>user</code></td><td>Tu configuración global</td><td>Tú, en todos los proyectos</td></tr>
      </table>
      <p>En <code>.mcp.json</code> puedes usar variables de entorno (<code>\${GITHUB_TOKEN}</code>) para no escribir secretos en el fichero.</p>`,
      ejemplos: [
        { tipo: "aviso", titulo: "Servidores MCP de terceros", texto: `<p>Un servidor MCP es código que se ejecuta en tu equipo (stdio) o que recibe tus datos (HTTP). Usa solo servidores oficiales o revisados, con permisos mínimos.</p>` }
      ]
    }
  ],
  taller: [
    { t: "1. Servidor stdio local (filesystem)", d: "Limitado a la carpeta del proyecto y compartido con el equipo.", lang: "Bash", code: String.raw`claude mcp add --scope project fs -- npx -y @modelcontextprotocol/server-filesystem .
cat .mcp.json`, resultado: "{\n  \"mcpServers\": {\n    \"fs\": { \"command\": \"npx\", \"args\": [\"-y\", \"@modelcontextprotocol/server-filesystem\", \".\"] }\n  }\n}" },
    { t: "2. Servidor remoto por HTTP (GitHub)", d: "GitHub ofrece un servidor MCP remoto. La primera vez, autentícate desde /mcp.", lang: "Bash", code: String.raw`claude mcp add --transport http github https://api.githubcopilot.com/mcp/
claude mcp list
# En Claude Code: /mcp → github → Authenticate`, resultado: "fs: npx -y @modelcontextprotocol/server-filesystem . - ✓ Connected\ngithub: https://api.githubcopilot.com/mcp/ (HTTP) - ⚠ Needs authentication" },
    { t: "3. El fichero .mcp.json resultante", d: "Un servidor stdio y uno HTTP, con la variable de entorno para el token.", lang: "JSON", code: String.raw`{
  "mcpServers": {
    "fs": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    },
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    }
  }
}` },
    { t: "4. Inspeccionar un servidor con MCP Inspector", d: "Interfaz web para ver Tools, Resources y Prompts y probarlos sin el modelo.", lang: "Bash", code: String.raw`npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-filesystem .
# Abre la URL que muestra → Connect → pestaña Tools → list_directory → Run`, resultado: "MCP Inspector is up and running at http://localhost:6274 🚀" },
    { t: "5. Hablar con un servidor a mano (protocolo en crudo)", d: "Envía la inicialización por stdin y mira la respuesta: así ves el protocolo sin intermediarios.", lang: "Bash", code: String.raw`printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"prueba","version":"0.1"}}}' \
 '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
 | npx -y @modelcontextprotocol/server-filesystem . 2>/dev/null | head -c 600`, resultado: "{\"result\":{\"protocolVersion\":\"2025-06-18\",\"capabilities\":{\"tools\":{}},\"serverInfo\":{...}},\"jsonrpc\":\"2.0\",\"id\":1}\n{\"result\":{\"tools\":[{\"name\":\"read_file\",...}" },
    { t: "6. Usarlos desde Claude Code", d: "Pide tareas que necesiten cada servidor.", lang: "Claude Code", code: String.raw`> Con el servidor fs, lista los ficheros de docs/ y resume el más reciente
> Con el servidor github, lista las issues abiertas de mi repositorio con la etiqueta bug
> ¿Qué herramientas tiene el servidor fs? ¿Alguna puede modificar ficheros?` }
  ],
  prompts: [
    { t: "Explorar un servidor MCP recién conectado", tipo: "Prompt", txt: `Lista las herramientas y recursos que expone el servidor MCP "{{nombre}}". Para cada herramienta indica qué hace, sus parámetros y si puede modificar datos (riesgo alto/medio/bajo).` },
    { t: "Usar GitHub MCP en una revisión", tipo: "Prompt", txt: `Usando el servidor MCP de GitHub, revisa las issues abiertas de {{owner/repo}} con la etiqueta "bug", agrúpalas por componente y propone el orden de resolución.` },
    { t: "Diseño de un servidor MCP", tipo: "System Prompt", txt: `<rol>Arquitecto de integraciones MCP.</rol>
<sistema>{{sistema a conectar: BBDD, API, servidor…}}</sistema>
<tarea>Propón qué exponer como Resources (solo lectura), qué como Tools (acciones, con su riesgo y anotaciones) y qué como Prompts. Indica transporte recomendado y autenticación.</tarea>` },
    { t: "Auditoría de un servidor de terceros", tipo: "Prompt", uso: "Antes de instalar un servidor MCP que has encontrado en Internet.", txt: `<codigo>{{código o README del servidor}}</codigo>
¿Qué permisos necesita? ¿Ejecuta comandos o accede a la red? ¿Envía datos fuera? ¿Qué configuración mínima recomiendas para usarlo con seguridad?` }
  ],
  actividad: {
    dam: {
      t: "Mapa MCP de tu aplicación",
      d: "Diseña (sin programar aún) el servidor MCP de tu proyecto: Resources, Tools y Prompts con parámetros, tipos y anotaciones.",
      pasos: ["Lista lo que un asistente necesitaría leer (Resources).", "Lista acciones (Tools) con su riesgo.", "Dos Prompts útiles.", "Diagrama Host/Client/Server."],
      entregables: ["Documento de diseño con tabla de primitivas.", "Diagrama Host/Client/Server."],
      criterios: [["Primitivas bien clasificadas", 4], ["Parámetros y riesgos", 3], ["Diagrama", 3]]
    },
    asir: {
      t: "Servidores MCP en el equipo del aula",
      d: "Configura filesystem y GitHub en un .mcp.json de proyecto, pruébalos con MCP Inspector y documenta qué puede y no puede hacer cada uno.",
      pasos: [".mcp.json con ámbito project.", "Inspector: lista y prueba de cada tool.", "Protocolo en crudo (paso 5 del taller).", "Análisis de riesgos."],
      entregables: [".mcp.json.", "Capturas del Inspector.", "Análisis de riesgos de cada tool."],
      criterios: [["Configuración correcta", 3], ["Pruebas en Inspector y en crudo", 4], ["Análisis de riesgos", 3]]
    },
    sync: {
      t: "Contrato del servidor común",
      d: "Acordad el contrato (nombres de tools, parámetros, respuestas y errores) del servidor MCP que construiréis en las Sesiones 8 y 9.",
      pasos: ["Reunión de 30 minutos.", "Contrato en Markdown o JSON Schema.", "Firmado (commit) por los dos."],
      entregables: ["Contrato en JSON o Markdown firmado por la pareja."],
      criterios: [["Contrato completo y sin ambigüedades", 6], ["Errores definidos", 2], ["Acuerdo documentado", 2]]
    }
  },
  test: [
    { p: "¿Qué problema resuelve MCP?", o: ["Hace los modelos más baratos", "Estandariza cómo las apps de IA se conectan a datos y herramientas", "Sustituye a HTTP", "Cifra los prompts"], c: 1, exp: "Pasa de N×M integraciones a N+M con un protocolo común." },
    { p: "¿Qué pieza decide qué se permite y contiene el modelo?", o: ["El servidor", "El host", "El transporte", "El resource"], c: 1, exp: "El host (Claude Code, Claude Desktop, tu app) controla permisos y modelo." },
    { p: "¿Qué primitiva representa datos de solo lectura con URI?", o: ["Tool", "Resource", "Prompt", "Root"], c: 1, exp: "Los resources son datos identificados por URI, como metricas://host." },
    { p: "¿Quién decide normalmente invocar una Tool?", o: ["El usuario siempre a mano", "El modelo, con permiso del usuario", "El servidor solo", "Nadie"], c: 1, exp: "Las tools las invoca el modelo; el host pide permiso." },
    { p: "¿Qué formato de mensajes usa MCP?", o: ["SOAP", "JSON-RPC 2.0", "gRPC", "XML-RPC"], c: 1, exp: "Todos los mensajes son JSON-RPC 2.0." },
    { p: "¿Cuál es el primer mensaje del ciclo de vida?", o: ["tools/call", "initialize", "resources/read", "shutdown"], c: 1, exp: "initialize acuerda versión y capacidades." },
    { p: "¿Qué rompe un servidor stdio?", o: ["Usar logging a stderr", "Hacer print() a stdout", "Tener varias tools", "Usar Python"], c: 1, exp: "stdout está reservado al protocolo." },
    { p: "¿Qué transporte usarías para un servidor compartido por red?", o: ["stdio", "Streamable HTTP", "SSE nuevo", "FTP"], c: 1, exp: "Streamable HTTP, con TLS y autenticación." },
    { p: "¿Qué ámbito guarda la configuración en .mcp.json para el equipo?", o: ["local", "project", "user", "global"], c: 1, exp: "El ámbito project escribe .mcp.json, que se sube a Git." },
    { p: "¿Para qué sirve elicitation?", o: ["Para que el servidor pida un dato o confirmación al usuario", "Para cifrar", "Para listar tools", "Para cambiar de modelo"], c: 0, exp: "Permite pedir confirmaciones durante una acción." }
  ],
  faq: [
    { q: "El servidor stdio se desconecta nada más arrancar", a: "Casi siempre es un <code>print()</code> a stdout o un error de arranque. Ejecuta el comando a mano en la terminal y revisa stderr." },
    { q: "¿SSE o Streamable HTTP?", a: "Para servidores nuevos, Streamable HTTP. SSE se mantiene solo por compatibilidad." },
    { q: "No veo las herramientas del servidor", a: "En Claude Code abre <code>/mcp</code> y comprueba que el estado es 'connected'. Si es remoto, puede faltar autenticarse." },
    { q: "npx tarda mucho o falla detrás del proxy del centro", a: "Configura el proxy de npm (<code>npm config set proxy http://proxy:3128</code>) o instala el paquete una vez globalmente." },
    { q: "¿Puedo poner el token de GitHub en .mcp.json?", a: "No lo escribas: usa una variable de entorno (<code>\${GITHUB_TOKEN}</code>) para que el fichero pueda subirse a Git sin secretos." },
    { q: "¿Qué versión del protocolo uso?", a: "La negocian cliente y servidor en <code>initialize</code>; los SDK oficiales se encargan. Mantén el SDK actualizado." }
  ]
};
