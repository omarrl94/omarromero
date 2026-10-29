/* Sesión 6 · Comandos slash, hooks y subagentes */
export default {
  n: 6, bloque: 2,
  titulo: "Comandos slash propios, Hooks de seguridad y subagentes",
  resumen: "Crear comandos reutilizables (/audit-dockerfile, /generate-tests, /parse-syslog), hooks que validan antes y después de cada acción y subagentes especializados.",
  skill: "Comandos /audit-dockerfile, /generate-tests, /parse-syslog + hooks PreToolUse y PostToolUse + subagente revisor",
  mcp: "—",
  objetivos: [
    "Crear comandos slash con argumentos ($ARGUMENTS) y cabecera de metadatos.",
    "Explicar el ciclo de eventos de Claude Code y en qué momento actúa cada hook.",
    "Programar un hook PreToolUse que bloquee comandos peligrosos (exit 2).",
    "Programar un hook PostToolUse que pase el linter tras cada edición.",
    "Definir un subagente especializado con sus propias herramientas.",
    "Combinar comandos, hooks y Skills en un flujo de pre-despliegue."
  ],
  teoria: [
    {
      h: "Comandos slash personalizados",
      html: `<p>Un fichero Markdown en <code>.claude/commands/</code> se convierte en un comando: <code>.claude/commands/audit-dockerfile.md</code> → <code>/audit-dockerfile</code>. Dentro, <code>$ARGUMENTS</code> se sustituye por lo que escribas después del comando (y <code>$1</code>, <code>$2</code>… por cada argumento).</p>
      <p>La cabecera opcional admite <code>description</code> (lo que se ve al escribir <code>/</code>), <code>argument-hint</code> (ayuda sobre los argumentos) y <code>allowed-tools</code> (herramientas que puede usar sin preguntar).</p>
      <p>Diferencia clave: el comando lo invocas <b>tú</b>; la Skill la puede elegir <b>Claude</b> sola.</p>`,
      ejemplos: [
        { tipo: "dam", titulo: "Comando con dos argumentos", lang: "Markdown", code: String.raw`---
description: Crea un endpoint REST completo
argument-hint: <Entidad> <ruta>
---
Crea el endpoint para la entidad $1 en la ruta /api/$2:
record DTO, servicio, controlador, validación y test de integración.
Sigue las convenciones de CLAUDE.md y ejecuta los tests al terminar.` }
      ]
    },
    {
      h: "Hooks: reglas que se cumplen siempre",
      html: `<p>Un <b>hook</b> es un comando que Claude Code ejecuta automáticamente en un momento del ciclo. No depende de que el modelo "se acuerde": lo ejecuta el programa, siempre.</p>
      <table>
        <tr><th>Evento</th><th>Cuándo</th><th>Uso típico</th></tr>
        <tr><td><code>PreToolUse</code></td><td>Antes de usar una herramienta</td><td>Bloquear comandos peligrosos o la lectura de secretos</td></tr>
        <tr><td><code>PostToolUse</code></td><td>Después de usarla</td><td>Pasar el linter o el formateador tras editar</td></tr>
        <tr><td><code>UserPromptSubmit</code></td><td>Al enviar un mensaje</td><td>Avisar si el mensaje contiene datos personales</td></tr>
        <tr><td><code>Stop</code></td><td>Cuando Claude termina de responder</td><td>Ejecutar los tests o notificar</td></tr>
        <tr><td><code>SessionStart</code></td><td>Al iniciar la sesión</td><td>Cargar contexto (rama actual, tareas pendientes)</td></tr>
      </table>
      <p>Se configuran en <code>.claude/settings.json</code> (o con <code>/hooks</code>). El <code>matcher</code> indica a qué herramientas afecta: <code>Bash</code>, <code>Edit|Write</code>, <code>Read</code>…</p>`
    },
    {
      h: "Cómo decide un hook",
      html: `<div class="scheme">  Claude quiere ejecutar:  Bash("rm -rf /var/www")
        │
        ▼  PreToolUse (matcher "Bash")
  tu script recibe JSON por stdin:
     {"tool_name":"Bash","tool_input":{"command":"rm -rf /var/www"}, ...}
        │
        ├─ exit 0  → se permite
        ├─ exit 2  → se BLOQUEA; el texto de stderr se envía a Claude como motivo
        └─ otro    → aviso, pero no bloquea</div>
      <p>Como Claude recibe el motivo, normalmente <b>reformula</b> la acción de forma segura ("en lugar de borrar, muevo a /tmp/papelera").</p>`,
      ejemplos: [
        { tipo: "aviso", titulo: "Los hooks ejecutan código en tu equipo", texto: `<p>Un hook es un programa con tus permisos. Revisa los hooks de cualquier repositorio que clones antes de abrir Claude Code en él.</p>` }
      ]
    },
    {
      h: "Hooks de calidad: el linter que nunca se olvida",
      html: `<p>Con <code>PostToolUse</code> y matcher <code>Edit|Write</code>, cada fichero que Claude edita pasa por tu linter o formateador. Si sale con código 2, Claude ve los errores y los corrige antes de seguir.</p>
      <table>
        <tr><th>Lenguaje</th><th>Herramienta</th></tr>
        <tr><td>Python</td><td><code>ruff check --fix</code>, <code>ruff format</code></td></tr>
        <tr><td>Java</td><td><code>./mvnw -q checkstyle:check</code>, google-java-format</td></tr>
        <tr><td>Bash</td><td><code>shellcheck</code></td></tr>
        <tr><td>PowerShell</td><td><code>Invoke-ScriptAnalyzer</code></td></tr>
        <tr><td>Dockerfile</td><td><code>hadolint</code></td></tr>
        <tr><td>YAML / Ansible</td><td><code>yamllint</code>, <code>ansible-lint</code></td></tr>
      </table>`
    },
    {
      h: "Subagentes especializados",
      html: `<p>Un <b>subagente</b> es un Claude con su propio prompt, sus herramientas y su propio contexto, al que el agente principal delega una tarea. Se definen en <code>.claude/agents/&lt;nombre&gt;.md</code> (o con <code>/agents</code>).</p>
      <ul>
        <li>Su contexto es <b>independiente</b>: lo que lee no llena el de la conversación principal.</li>
        <li>Puedes limitar sus herramientas (un revisor que solo lee, no edita).</li>
        <li>Útil para revisión de código, investigación en un repositorio grande o análisis de logs extensos.</li>
      </ul>`,
      ejemplos: [
        { tipo: "dam", titulo: ".claude/agents/revisor.md", lang: "Markdown", code: String.raw`---
name: revisor
description: Revisor de código. Úsalo después de cualquier cambio importante para revisar bugs, seguridad y tests.
tools: Read, Grep, Glob, Bash
---
Eres un revisor de código exigente. Revisa los cambios recientes (git diff),
ejecuta los tests y devuelve: Bloqueantes / Recomendados / Opcionales,
cada punto con fichero:línea. No edites ficheros.` },
        { tipo: "asir", titulo: ".claude/agents/analista-logs.md", lang: "Markdown", code: String.raw`---
name: analista-logs
description: Analiza logs grandes del sistema y devuelve solo un resumen. Úsalo cuando haya que revisar muchos ficheros de log.
tools: Read, Grep, Bash
---
Lee los logs indicados, agrupa por servicio y gravedad, anonimiza IPs y usuarios
y devuelve como máximo 20 líneas de resumen con las 3 incidencias más graves.` }
      ]
    },
    {
      h: "Flujo completo: de la petición al despliegue",
      html: `<div class="scheme">  Tú: /pre-deploy
   ├─ comando: lista de comprobaciones
   ├─ Skill auditoria-owasp (se activa sola)
   ├─ subagente revisor (contexto aparte)
   ├─ PreToolUse: bloquea git push --force y rm -rf
   └─ PostToolUse: linter tras cada edición
  Resultado: "LISTO" / "NO LISTO" con la tabla de comprobaciones</div>`
    }
  ],
  taller: [
    { t: "1. /audit-dockerfile", d: ".claude/commands/audit-dockerfile.md — uso: /audit-dockerfile docker/app/Dockerfile", lang: "Markdown", code: String.raw`---
description: Audita un Dockerfile (seguridad, tamaño y buenas prácticas)
argument-hint: <ruta del Dockerfile>
---
Audita el Dockerfile $ARGUMENTS y revisa:
1. Imagen base con versión fija (nada de :latest).
2. Usuario no root (instrucción USER).
3. Multi-stage build y tamaño final.
4. Secretos en ARG/ENV o copiados a la imagen.
5. HEALTHCHECK definido.
6. COPY selectivo y .dockerignore.
Devuelve una tabla Problema / Riesgo / Línea corregida y el Dockerfile final.` },
    { t: "2. /generate-tests", d: ".claude/commands/generate-tests.md — uso: /generate-tests src/main/java/.../TicketService.java", lang: "Markdown", code: String.raw`---
description: Genera tests JUnit 5 o pytest para un fichero
argument-hint: <ruta del fichero>
allowed-tools: Read, Write, Bash(./mvnw test:*), Bash(pytest:*)
---
Lee $ARGUMENTS y genera tests unitarios:
- JUnit 5 + AssertJ si es Java; pytest si es Python.
- Casos normales, límites y errores (al menos uno de cada).
- Ejecuta los tests y corrige hasta que pasen. No modifiques el código bajo prueba.
- Termina con el porcentaje de métodos cubiertos.` },
    { t: "3. /parse-syslog", d: ".claude/commands/parse-syslog.md — uso: /parse-syslog /var/log/auth.log", lang: "Markdown", code: String.raw`---
description: Resume un log del sistema y detecta anomalías
argument-hint: <ruta del log>
allowed-tools: Bash(tail:*), Bash(grep:*), Bash(awk:*)
---
Analiza las últimas 500 líneas de $ARGUMENTS (usa tail).
Agrupa por servicio, cuenta errores y destaca:
- intentos de acceso fallidos por IP (top 5),
- servicios que se reinician en bucle,
- errores de disco o memoria.
No copies IPs públicas ni usuarios reales en la respuesta: anonimízalos (IP_1, USUARIO_1…).` },
    { t: "4. Hook PreToolUse que bloquea comandos peligrosos", d: ".claude/hooks/bloquear_peligrosos.py", lang: "Python", code: String.raw`#!/usr/bin/env python3
import json, re, sys

datos = json.load(sys.stdin)
comando = datos.get("tool_input", {}).get("command", "")

PROHIBIDOS = [
    (r"rm\s+-rf\s+/(\s|$)", "borrado recursivo de la raíz"),
    (r"mkfs\.", "formateo de disco"),
    (r"dd\s+if=.*of=/dev/sd", "escritura directa en disco"),
    (r"\.env\b|id_rsa|\.pem\b", "acceso a secretos"),
    (r"\b(shutdown|reboot|halt)\b", "apagado o reinicio"),
    (r"git\s+push\s+.*--force", "push forzado"),
    (r"Remove-Item\s+.*-Recurse.*C:\\", "borrado recursivo en C:"),
    (r"Stop-Computer|Restart-Computer", "apagado o reinicio en Windows"),
]
for patron, motivo in PROHIBIDOS:
    if re.search(patron, comando, re.IGNORECASE):
        print(f"Bloqueado por la política del centro ({motivo}). Propón una alternativa segura.", file=sys.stderr)
        sys.exit(2)
sys.exit(0)` },
    { t: "4b. Probar el hook sin Claude", d: "Simula la entrada que recibirá.", lang: "Bash", code: String.raw`echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf / "}}' | python3 .claude/hooks/bloquear_peligrosos.py; echo "código: $?"
echo '{"tool_name":"Bash","tool_input":{"command":"ls -la"}}' | python3 .claude/hooks/bloquear_peligrosos.py; echo "código: $?"`, resultado: "Bloqueado por la política del centro (borrado recursivo de la raíz). Propón una alternativa segura.\ncódigo: 2\ncódigo: 0" },
    { t: "5. Hook PostToolUse que pasa el linter tras editar", d: ".claude/hooks/lint.sh — valida el fichero editado según su tipo.", lang: "Bash", code: String.raw`#!/usr/bin/env bash
fichero=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["tool_input"].get("file_path",""))')
case "$fichero" in
  *.py)         ruff check --fix "$fichero" >&2 || exit 2 ;;
  *.sh)         shellcheck "$fichero" >&2 || exit 2 ;;
  *Dockerfile)  hadolint "$fichero" >&2 || exit 2 ;;
  *.yml|*.yaml) yamllint "$fichero" >&2 || exit 2 ;;
esac
exit 0` },
    { t: "6. Registrar los hooks en .claude/settings.json", d: "Revisa con /hooks que aparecen.", lang: "JSON", code: String.raw`{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "python3 .claude/hooks/bloquear_peligrosos.py" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/lint.sh" }]
      }
    ]
  }
}` },
    { t: "7. Comando /pre-deploy que lo junta todo", d: ".claude/commands/pre-deploy.md", lang: "Markdown", code: String.raw`---
description: Comprobaciones previas al despliegue
---
1. Ejecuta los tests (./mvnw test o pytest).
2. Usa el subagente revisor sobre git diff main.
3. Ejecuta /audit-dockerfile sobre cada Dockerfile.
4. Comprueba que no hay secretos: git grep -nE "sk-ant-|password=|BEGIN PRIVATE KEY".
Resultado: tabla OK/FALLO por punto y veredicto "LISTO" o "NO LISTO".` }
  ],
  prompts: [
    { t: "Diseñador de comandos slash", tipo: "/slash", txt: `Convierte esta tarea repetitiva en un comando de Claude Code (.claude/commands/<nombre>.md):
<tarea>{{lo que haces a menudo}}</tarea>
Incluye cabecera con description, argument-hint y allowed-tools mínimas, uso de $ARGUMENTS, pasos y formato de salida.` },
    { t: "Diseñador de hooks", tipo: "Prompt", txt: `<politica>{{qué nunca debe pasar en este repositorio}}</politica>
Escribe un hook PreToolUse en Python que lea el JSON de stdin, aplique la política y salga con código 2 y mensaje en stderr cuando haya que bloquear. Incluye la entrada para .claude/settings.json y 5 casos de prueba (3 bloqueados, 2 permitidos).` },
    { t: "/audit-dockerfile (copia directa)", tipo: "/slash", txt: `---
description: Audita un Dockerfile
argument-hint: <ruta>
---
Audita el Dockerfile $ARGUMENTS: versión fija de imagen base, USER no root, multi-stage, sin secretos, HEALTHCHECK, .dockerignore. Tabla de problemas y Dockerfile corregido.` },
    { t: "Subagente de tests", tipo: "Subagente", txt: `---
name: tester
description: Escribe y ejecuta tests. Úsalo cuando se añada o cambie lógica sin tests.
tools: Read, Write, Bash
---
Escribe tests para el código indicado (JUnit 5 o pytest), ejecútalos y no termines hasta que pasen. No cambies el código de producción.` },
    { t: "Hook UserPromptSubmit anti-datos personales", tipo: "Prompt", txt: `Escribe un hook UserPromptSubmit que lea el prompt de stdin y, si detecta DNI/NIE, correos o IPs públicas, salga con código 2 y el mensaje "Anonimiza los datos antes de enviarlos (compromiso EU AI Act)". Incluye pruebas.` }
  ],
  actividad: {
    dam: {
      t: "Comando /generate-tests y hook de linter",
      d: "Implanta /generate-tests en tu proyecto y un hook PostToolUse que ejecute el linter de tu lenguaje tras cada edición.",
      pasos: ["Comando con allowed-tools mínimas.", "Hook PostToolUse con tu linter.", "Provoca un error de estilo y comprueba que Claude lo corrige.", "Mide la cobertura antes y después."],
      entregables: ["Ficheros de .claude/commands y .claude/hooks.", "Captura de un cambio bloqueado por el linter.", "Cobertura de tests antes y después."],
      criterios: [["Comando funcional", 3], ["Hook efectivo", 3], ["Mejora de cobertura medida", 3], ["Documentación", 1]]
    },
    asir: {
      t: "Política de seguridad con hooks",
      d: "Escribe un hook PreToolUse que bloquee al menos 8 patrones peligrosos (Linux y Windows) y demuestra que funciona, también con pruebas sin Claude.",
      pasos: ["Lista de 8 patrones con su motivo.", "Pruebas con echo | python3 hook.", "Prueba real con Claude Code.", "Tabla de resultados."],
      entregables: ["Script del hook y settings.json.", "Tabla de 8 intentos y su resultado.", "Captura de Claude reformulando tras el bloqueo."],
      criterios: [["8 patrones correctos", 4], ["Pruebas automatizadas", 3], ["Prueba real", 2], ["Documentación", 1]]
    },
    comun: {
      t: "Comando /pre-entrega",
      d: "Crea un comando personalizado que revise cualquier entrega antes de subirla: secretos en el código, ficheros que no deben subirse, README presente y pruebas pasando. Vale para un proyecto Java/Python o para scripts de sistemas.",
      pasos: ["Define el comando en .claude/commands/pre-entrega.md con un veredicto LISTO / NO LISTO.", "Añade un hook que bloquee la escritura de ficheros .env.", "Ejecútalo sobre tu proyecto.", "Introduce un fallo a propósito (un token en el código) y comprueba que da NO LISTO."],
      entregables: ["Comando y hook en tu repositorio.", "Capturas de las ejecuciones LISTO y NO LISTO."],
      criterios: [["Comando completo", 4], ["Detecta el fallo introducido", 4], ["Documentación", 2]]
    }
  },
  test: [
    { p: "¿Dónde se crea un comando slash del proyecto?", o: [".claude/commands/<nombre>.md", ".claude/skills/<nombre>/", "~/.bashrc", "CLAUDE.md"], c: 0, exp: "Cada fichero .md de .claude/commands/ es un comando." },
    { p: "¿Qué se sustituye por lo que escribes tras el comando?", o: ["$INPUT", "$ARGUMENTS", "{{args}}", "%1"], c: 1, exp: "$ARGUMENTS (y $1, $2… para argumentos sueltos)." },
    { p: "¿Qué evento permite bloquear un comando antes de que se ejecute?", o: ["PostToolUse", "PreToolUse", "Stop", "SessionStart"], c: 1, exp: "PreToolUse actúa antes de usar la herramienta." },
    { p: "¿Con qué código de salida bloquea un hook?", o: ["0", "1", "2", "127"], c: 2, exp: "exit 2 bloquea y envía stderr a Claude como motivo." },
    { p: "¿Por dónde recibe el hook la información de la acción?", o: ["Argumentos de línea de comandos", "JSON por stdin", "Un fichero temporal", "Variables de entorno solamente"], c: 1, exp: "Recibe un JSON con tool_name y tool_input por la entrada estándar." },
    { p: "¿Qué matcher usarías para pasar el linter tras editar?", o: ["Bash", "Edit|Write", "Read", "WebFetch"], c: 1, exp: "Las ediciones se hacen con Edit y Write." },
    { p: "¿Qué ventaja tiene un subagente?", o: ["Es gratis", "Tiene su propio contexto y herramientas limitadas", "No necesita modelo", "Ejecuta sin permisos"], c: 1, exp: "Lo que lee no llena el contexto principal y puede tener solo las herramientas que necesita." },
    { p: "¿Dónde se definen los subagentes del proyecto?", o: [".claude/agents/<nombre>.md", ".claude/hooks/", "package.json", ".mcp.json"], c: 0, exp: "En .claude/agents (o con /agents)." },
    { p: "¿Qué diferencia hay entre un comando slash y una Skill?", o: ["Ninguna", "El comando lo invocas tú; la Skill la puede elegir Claude", "La Skill solo funciona en Windows", "El comando no admite argumentos"], c: 1, exp: "La Skill se activa por su descripción; el comando, cuando lo escribes." },
    { p: "¿Por qué hay que revisar los hooks de un repositorio clonado?", o: ["Porque ocupan mucho", "Porque son programas que se ejecutan con tus permisos", "Porque cambian el modelo", "No hace falta"], c: 1, exp: "Un hook malicioso podría hacer cualquier cosa en tu equipo." }
  ],
  faq: [
    { q: "El hook no se ejecuta", a: "Comprueba con <code>/hooks</code> que está registrado, que el <code>matcher</code> coincide con el nombre de la herramienta (<code>Bash</code>, <code>Edit</code>, <code>Write</code>) y que el JSON de settings es válido." },
    { q: "El hook bloquea pero Claude no sabe por qué", a: "El motivo debe escribirse en <b>stderr</b> y salir con código <b>2</b>. Con otros códigos distintos de 0 solo se muestra un aviso." },
    { q: "Mi comando no aparece al escribir /", a: "Debe estar en <code>.claude/commands/</code> con extensión <code>.md</code>. Reinicia la sesión de Claude Code si lo acabas de crear." },
    { q: "El hook funciona en Linux pero no en Windows", a: "Usa <code>python</code> en vez de <code>python3</code> si así se llama en Windows, o escribe el hook en PowerShell (<code>pwsh -File hook.ps1</code>)." },
    { q: "El linter tarda mucho y ralentiza todo", a: "Pásalo solo sobre el fichero editado (como en lint.sh), no sobre todo el proyecto." },
    { q: "¿El subagente ve mi conversación?", a: "No: recibe la tarea que le delega el agente principal y devuelve un resultado. Por eso conviene que su descripción y su prompt sean claros." }
  ]
};
