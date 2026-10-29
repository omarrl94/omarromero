/* Sesión 4 · Claude Code y CLAUDE.md */
export default {
  n: 4, bloque: 2,
  titulo: "Claude Code en terminal y memoria de proyecto con CLAUDE.md",
  resumen: "Instalar y dominar Claude Code en PowerShell y Bash: cómo trabaja, permisos, modos, memoria de proyecto, ejecución no interactiva y primera conexión MCP.",
  skill: "CLAUDE.md del proyecto + .claude/settings.json con permisos allow/deny",
  mcp: "Primera conexión a un servidor MCP existente con claude mcp add",
  objetivos: [
    "Instalar Claude Code en Windows y Linux y abrir una sesión en un repositorio.",
    "Entender el bucle del agente: leer, planificar, editar, ejecutar, verificar.",
    "Escribir un CLAUDE.md útil y saber qué niveles de memoria existen.",
    "Configurar permisos allow/deny y elegir el modo de trabajo adecuado.",
    "Usar claude -p en scripts y en CI.",
    "Conectar un servidor MCP existente y comprobar su estado."
  ],
  teoria: [
    {
      h: "Qué es Claude Code y cómo trabaja",
      html: `<p>Claude Code es un <b>agente</b> que trabaja en tu terminal. A diferencia del chat, no se limita a sugerir: <b>lee</b> los ficheros del repositorio, <b>propone y aplica</b> cambios, <b>ejecuta</b> comandos (tests, git, docker) y <b>comprueba</b> el resultado. Te pide permiso para las acciones sensibles.</p>
      <div class="scheme">  Tu petición ─▶ explora (Read, Grep, Glob) ─▶ planifica
                       ▲                                │
                       └── verifica (tests, linter) ◀── edita (Edit, Write) / ejecuta (Bash)</div>
      <p>Funciona en Linux, macOS y Windows (PowerShell o WSL) y se integra con VS Code y JetBrains.</p>`,
      ejemplos: [
        { tipo: "dam", titulo: "Una petición real", texto: `<p><i>"Añade validación de email en RegistroService y un test que la cubra"</i> → Claude Code busca la clase, lee cómo están hechos los otros tests, edita el servicio, crea el test, ejecuta <code>./mvnw test</code> y, si falla, corrige hasta dejarlo en verde.</p>` },
        { tipo: "asir", titulo: "Una petición real", texto: `<p><i>"Revisa los scripts de backup de esta carpeta y haz que registren en /var/log/backup.log y salgan con código 1 si falla rsync"</i> → lee los .sh, propone el diff, ejecuta <code>shellcheck</code> y te enseña el resultado.</p>` }
      ]
    },
    {
      h: "Memoria de proyecto: CLAUDE.md",
      html: `<p>Claude Code no recuerda sesiones anteriores, pero al empezar <b>lee ficheros CLAUDE.md</b>. Es la forma de que siempre sepa cómo es tu proyecto.</p>
      <table>
        <tr><th>Fichero</th><th>Alcance</th><th>¿Se sube a Git?</th></tr>
        <tr><td><code>./CLAUDE.md</code></td><td>El proyecto, para todo el equipo</td><td>Sí</td></tr>
        <tr><td><code>./subcarpeta/CLAUDE.md</code></td><td>Se carga al trabajar en esa carpeta</td><td>Sí</td></tr>
        <tr><td><code>~/.claude/CLAUDE.md</code></td><td>Tus preferencias en todos los proyectos</td><td>No</td></tr>
      </table>
      <p><code>/init</code> genera un primer CLAUDE.md analizando el repositorio; <code>/memory</code> lo edita. Dentro puedes importar otros ficheros con <code>@ruta/al/fichero.md</code>.</p>
      <p>Qué escribir: lo que necesitaría un compañero nuevo el primer día. Cómo compilar y probar, convenciones, estructura de carpetas, y lo que <b>no</b> se debe tocar. Breve: si ocupa cinco páginas, nadie (ni Claude) lo aprovecha.</p>`,
      ejemplos: [
        { tipo: "aviso", titulo: "Qué NO poner en CLAUDE.md", texto: `<p>Contraseñas, tokens, IPs públicas de producción o datos personales. CLAUDE.md se sube a Git y se envía al modelo en cada sesión.</p>` }
      ]
    },
    {
      h: "Permisos y modos de trabajo",
      html: `<table>
        <tr><th>Modo</th><th>Comportamiento</th><th>Cuándo</th></tr>
        <tr><td>Normal</td><td>Pide permiso para editar y ejecutar</td><td>Por defecto, aprendiendo</td></tr>
        <tr><td>Aceptar ediciones</td><td>Edita sin preguntar; sigue preguntando antes de comandos</td><td>Refactorizaciones con tests</td></tr>
        <tr><td>Plan</td><td>Solo analiza y propone un plan; no cambia nada</td><td>Antes de un cambio grande o en un servidor</td></tr>
      </table>
      <p>Con <b>Shift+Tab</b> cambias de modo. Las reglas permanentes van en ficheros de configuración:</p>
      <ul>
        <li><code>.claude/settings.json</code> — del proyecto (se comparte por Git).</li>
        <li><code>.claude/settings.local.json</code> — tuyas en ese proyecto (no se sube).</li>
        <li><code>~/.claude/settings.json</code> — tuyas en todos los proyectos.</li>
      </ul>
      <p>Sintaxis de reglas: <code>Bash(./mvnw test:*)</code>, <code>Read(./.env)</code>, <code>Edit(src/**)</code>, <code>WebFetch(domain:docs.oracle.com)</code>. Las reglas <code>deny</code> ganan a las <code>allow</code>.</p>`,
      ejemplos: [
        { tipo: "asir", titulo: "Servidor: siempre modo plan primero", texto: `<p>En un servidor, empieza en <b>modo plan</b>: "Analiza por qué el disco /var está al 95 % y propón cómo liberarlo". Revisas el plan y solo entonces cambias de modo para ejecutarlo paso a paso.</p>` }
      ]
    },
    {
      h: "Comandos y atajos esenciales",
      html: `<div class="scheme">  /init         genera CLAUDE.md             /memory      edita la memoria
  /clear        conversación nueva           /compact     resume el contexto largo
  /model        cambia de modelo             /mcp         servidores MCP
  /permissions  reglas de permisos           /hooks       hooks configurados
  /agents       subagentes                   /help        ayuda
  Esc           interrumpe a Claude          Esc Esc      vuelve a un mensaje anterior
  Shift+Tab     cambia de modo               @fichero     menciona un fichero
  !comando      ejecuta en tu shell          claude -c    continúa la última sesión</div>`
    },
    {
      h: "Modo no interactivo: claude -p",
      html: `<p>Con <code>-p</code> (print) Claude Code recibe la tarea, la ejecuta y escribe el resultado en la salida estándar. Se puede encadenar con tuberías y usar en scripts, tareas programadas o CI.</p>
      <ul>
        <li><code>--output-format json</code> devuelve el resultado en JSON (con coste y duración).</li>
        <li><code>--allowedTools</code> limita qué herramientas puede usar en esa ejecución.</li>
        <li>En GitHub existe una Action oficial para que Claude revise PR o responda a <code>@claude</code> en issues.</li>
      </ul>`,
      ejemplos: [
        { tipo: "dam", titulo: "Revisión de un diff antes del commit", lang: "Bash", code: String.raw`git diff --staged | claude -p "Revisa este diff: bugs, seguridad y nombres. Lista priorizada, máximo 10 puntos."` },
        { tipo: "asir", titulo: "Informe nocturno programado", lang: "Bash", code: String.raw`# crontab -e  →  todos los días a las 7:00
0 7 * * * cd /opt/informes && journalctl --since yesterday -p warning | \
  claude -p "Resume los avisos de ayer por servicio y señala lo urgente" > informe_$(date +\%F).txt` }
      ]
    },
    {
      h: "Contexto y costes en Claude Code",
      html: `<ul>
        <li>Cada fichero que lee entra en el contexto. En repositorios grandes, pide tareas acotadas ("en src/pedidos/…").</li>
        <li><code>/compact</code> resume la conversación cuando crece mucho; <code>/clear</code> empieza de cero (lo importante debe estar en CLAUDE.md).</li>
        <li>Excluye de su lectura lo que no aporta (carpetas <code>node_modules</code>, <code>target</code>, datos) con reglas <code>deny</code> de <code>Read</code>.</li>
      </ul>`
    },
    {
      h: "Primer contacto con MCP desde Claude Code",
      html: `<p>MCP (Bloque 3) permite conectar a Claude Code con servicios externos: sistema de ficheros, GitHub, bases de datos… Hoy solo vamos a añadir uno ya hecho y comprobar que funciona; en las Sesiones 7–9 construiremos los nuestros.</p>
      <p><code>claude mcp add NOMBRE -- COMANDO ARGUMENTOS</code> registra un servidor local (stdio). <code>claude mcp list</code> y <code>/mcp</code> muestran su estado.</p>`
    }
  ],
  taller: [
    { t: "1. Instalación en Windows (PowerShell)", d: "Instalador nativo. Después ejecuta claude dentro de tu proyecto e inicia sesión.", lang: "PowerShell", code: String.raw`irm https://claude.ai/install.ps1 | iex
claude --version
cd C:\proyectos\gestor-tickets
claude`, resultado: "Claude Code x.y.z\n╭───────────────────────────╮\n│ ✻ Welcome to Claude Code! │\n╰───────────────────────────╯" },
    { t: "1b. Instalación en Linux (Bash)", d: "Alternativa: npm install -g @anthropic-ai/claude-code (requiere Node.js 18 o superior).", lang: "Bash", code: String.raw`curl -fsSL https://claude.ai/install.sh | bash
claude --version
cd ~/proyectos/gestor-tickets && claude` },
    { t: "2. Generar y afinar CLAUDE.md (proyecto DAM)", d: "Dentro de Claude Code ejecuta /init y después ajusta el fichero. Ejemplo para Java 21 + Docker:", lang: "Markdown", code: String.raw`# Gestor de tickets (DAM + ASIR)

## Comandos
- Compilar: ./mvnw -q package
- Tests: ./mvnw test
- Un solo test: ./mvnw test -Dtest=TicketServiceTest
- Levantar entorno: docker compose up -d

## Arquitectura
- controller → service → repository (Spring Data JPA)
- DTOs en dto/ como records; nunca exponer entidades JPA en la API.

## Convenciones
- Java 21: records para DTOs, switch con pattern matching, sin Lombok.
- Nombres de clases y métodos en inglés; comentarios y mensajes al usuario en español.
- Cada cambio de lógica lleva su test.

## No tocar
- src/main/resources/application-prod.yml
- Nunca leas ni muestres el fichero .env` },
    { t: "2b. CLAUDE.md para un repositorio de ASIR", d: "Para un repositorio de scripts e infraestructura.", lang: "Markdown", code: String.raw`# Infraestructura del aula 2.04

## Entorno
- Servidores: Ubuntu Server 24.04 (srv-web, srv-db), Windows Server 2022 (dc01)
- Automatización: Bash, PowerShell 7, Ansible 2.16, Docker

## Reglas
- Antes de cualquier cambio en un servidor, muestra el comando y espera confirmación.
- Los scripts deben ser idempotentes y registrar en /var/log/automatizacion.log.
- Prohibido: reiniciar servicios de producción, tocar el firewall sin plan de vuelta atrás.

## Comprobaciones
- Bash: shellcheck script.sh
- PowerShell: Invoke-ScriptAnalyzer -Path script.ps1
- Ansible: ansible-playbook --check --diff playbook.yml` },
    { t: "3. Permisos del proyecto", d: ".claude/settings.json: permite los comandos seguros y bloquea secretos y borrados.", lang: "JSON", code: String.raw`{
  "permissions": {
    "allow": [
      "Bash(./mvnw test:*)",
      "Bash(./mvnw -q package)",
      "Bash(docker compose ps)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./secrets/**)",
      "Bash(rm -rf:*)",
      "Bash(git push:*)"
    ]
  }
}`, resultado: "/permissions → muestra las reglas cargadas desde .claude/settings.json" },
    { t: "4. Modo no interactivo en scripts", d: "Útil en CI o en tareas programadas.", lang: "Bash", code: String.raw`claude -p "Resume los cambios del último commit en 5 viñetas" > resumen.txt
git diff main | claude -p "Revisa este diff y lista riesgos de seguridad"
claude -p "¿Qué hace scripts/backup.sh? Responde en 3 líneas" --output-format json | jq -r .result`, resultado: "El script copia /srv/datos a /backup con rsync...\n" },
    { t: "5. Conectar un servidor MCP existente", d: "Servidor de sistema de ficheros limitado a la carpeta docs (necesita Node.js). Compruébalo con /mcp.", lang: "Bash", code: String.raw`claude mcp add docs -- npx -y @modelcontextprotocol/server-filesystem ./docs
claude mcp list
# dentro de Claude Code:  /mcp   →  docs: connected`, resultado: "docs: npx -y @modelcontextprotocol/server-filesystem ./docs - ✓ Connected" },
    { t: "6. Ejercicio guiado: primera tarea real", d: "Pide una tarea pequeña y revisa cada paso que propone antes de aceptarlo.", lang: "Claude Code", code: String.raw`> Explora este repositorio y explícame la arquitectura en 10 líneas. No cambies nada.
> Añade un test para el caso de email vacío en RegistroService y ejecútalo.
> Muéstrame el diff completo antes de terminar.` }
  ],
  prompts: [
    { t: "CLAUDE.md plantilla DAM", tipo: "CLAUDE.md", txt: `# {{Nombre del proyecto}}

## Stack
Java 21 · Spring Boot · PostgreSQL · Docker

## Comandos
- Build: {{comando}}
- Tests: {{comando}}

## Reglas
- Antes de dar una tarea por terminada, ejecuta los tests.
- No añadas dependencias sin preguntar.
- Nunca leas .env ni ficheros de secrets/.` },
    { t: "CLAUDE.md plantilla ASIR", tipo: "CLAUDE.md", txt: `# Infraestructura {{aula/empresa}}

## Entorno
- Servidores: {{lista}}
- Automatización: Bash, PowerShell, Ansible, Docker

## Reglas
- Antes de cualquier cambio, muestra el comando y espera confirmación.
- Prohibido: reiniciar servicios de producción, modificar el firewall sin plan de vuelta atrás.
- Los scripts deben ser idempotentes y registrar en /var/log/automatizacion.log.` },
    { t: "Primer encargo en un repositorio nuevo", tipo: "Prompt", txt: `Explora este repositorio y explícame: arquitectura, cómo se compila, cómo se prueban los cambios y los 3 puntos más frágiles. No modifiques nada todavía.` },
    { t: "Tarea con verificación obligatoria", tipo: "Prompt", uso: "Patrón para cualquier cambio de código.", txt: `{{tarea}}
Requisitos:
1. Antes de editar, dime qué ficheros vas a tocar y por qué.
2. Después de editar, ejecuta {{comando de tests}} y enséñame el resultado.
3. Si un test falla, corrige y repite. No des la tarea por terminada con tests en rojo.` },
    { t: "Análisis en modo plan (ASIR)", tipo: "Prompt", txt: `[Modo plan] El servidor {{nombre}} {{síntoma: va lento / disco lleno / servicio caído}}.
Propón un plan de diagnóstico con los comandos de solo lectura que ejecutarías, en orden, y qué buscarías en cada salida. No ejecutes nada que cambie el sistema.` }
  ],
  actividad: {
    dam: {
      t: "Refactorización guiada con Claude Code",
      d: "En un proyecto Java tuyo: genera CLAUDE.md con /init, ajústalo y pide a Claude Code que migre los DTOs a records manteniendo los tests en verde.",
      pasos: ["/init y revisión manual del CLAUDE.md.", "Rama nueva: git switch -c refactor-records.", "Pide la migración por partes y revisa cada diff.", "Tests en verde y commit."],
      entregables: ["CLAUDE.md final.", "Commit con la refactorización y los tests.", "Reflexión: qué propuso Claude que rechazaste y por qué."],
      criterios: [["CLAUDE.md útil y conciso", 2], ["Refactorización correcta con tests", 5], ["Reflexión crítica", 3]]
    },
    asir: {
      t: "Repositorio de scripts de administración",
      d: "Crea un repositorio con scripts de backup (Bash y PowerShell). Configura CLAUDE.md y settings.json para que Claude Code no pueda leer secretos ni borrar ficheros.",
      pasos: ["Estructura: scripts/linux, scripts/windows, secrets/ (en .gitignore).", "CLAUDE.md con reglas y comprobaciones.", "settings.json con allow/deny.", "Pide a Claude Code que lea secrets/ y documenta el bloqueo."],
      entregables: ["settings.json con allow/deny.", "Prueba de que el deny funciona (captura).", "Scripts mejorados con Claude Code."],
      criterios: [["Reglas deny efectivas", 4], ["Scripts mejorados y verificados", 4], ["Documentación", 2]]
    },
    comun: {
      t: "Plantilla CLAUDE.md reutilizable",
      d: "Crea una plantilla de CLAUDE.md que sirva para cualquier proyecto (app o infraestructura) con las secciones que todo equipo necesita: comandos, convenciones, prohibiciones y cómo verificar.",
      pasos: ["Redacta la plantilla con comentarios que expliquen qué va en cada sección.", "Aplícala a tu proyecto de la sesión.", "Pide a Claude Code dos tareas y comprueba que respeta las prohibiciones.", "Mejora la plantilla con lo que hayas aprendido."],
      entregables: ["Plantilla en tu repositorio.", "Tu CLAUDE.md rellenado a partir de ella.", "Capturas de las dos tareas."],
      criterios: [["Plantilla completa y genérica", 4], ["Claude respeta las reglas", 4], ["Presentación", 2]]
    }
  },
  test: [
    { p: "¿Qué diferencia a Claude Code del chat de claude.ai?", o: ["Usa otro modelo", "Puede leer, editar y ejecutar en tu repositorio", "No necesita conexión", "Es solo para Python"], c: 1, exp: "Es un agente: actúa sobre tus ficheros y tu terminal con tu permiso." },
    { p: "¿Qué comando genera un primer CLAUDE.md?", o: ["/memory", "/init", "/clear", "/mcp"], c: 1, exp: "/init analiza el repositorio y crea un CLAUDE.md inicial." },
    { p: "¿Qué fichero se comparte con el equipo por Git?", o: ["~/.claude/CLAUDE.md", "./CLAUDE.md", ".claude/settings.local.json", "Ninguno"], c: 1, exp: "El CLAUDE.md del proyecto y .claude/settings.json se suben al repositorio." },
    { p: "Si una regla allow y una deny coinciden, ¿qué pasa?", o: ["Gana allow", "Gana deny", "Se pregunta al azar", "Error de configuración"], c: 1, exp: "Las reglas deny tienen prioridad." },
    { p: "¿Qué hace el modo plan?", o: ["Ejecuta todo sin preguntar", "Analiza y propone un plan sin cambiar nada", "Cambia de modelo", "Borra la conversación"], c: 1, exp: "Ideal antes de cambios grandes o en servidores." },
    { p: "¿Qué hace claude -p?", o: ["Abre el modo plan", "Ejecuta una tarea sin interacción y escribe el resultado", "Muestra los permisos", "Instala plugins"], c: 1, exp: "Es el modo no interactivo para scripts y CI." },
    { p: "¿Qué debes evitar escribir en CLAUDE.md?", o: ["Cómo ejecutar los tests", "Contraseñas y datos personales", "Convenciones de código", "Carpetas que no tocar"], c: 1, exp: "Se sube a Git y se envía al modelo: nada de secretos." },
    { p: "¿Qué regla impide que Claude Code lea .env?", o: ["allow: Read(./.env)", "deny: Read(./.env)", "deny: Bash(.env)", "allow: Edit(.env)"], c: 1, exp: "Una regla deny de Read bloquea la lectura." },
    { p: "¿Para qué sirve /compact?", o: ["Comprime ficheros", "Resume la conversación para liberar contexto", "Reduce el tamaño del repositorio", "Minifica el código"], c: 1, exp: "Mantiene lo esencial y libera espacio en el contexto." },
    { p: "¿Qué comando muestra los servidores MCP conectados?", o: ["claude mcp list", "claude servers", "/hooks", "git mcp"], c: 0, exp: "claude mcp list (o /mcp dentro de la sesión)." }
  ],
  faq: [
    { q: "'claude' no se reconoce como comando", a: "Abre una terminal nueva para que se recargue el PATH. En Windows comprueba que la ruta de instalación está en la variable PATH de usuario." },
    { q: "Me pide permiso para todo", a: "Añade reglas <code>allow</code> concretas en <code>.claude/settings.json</code> (p. ej. <code>Bash(./mvnw test:*)</code>) en lugar de desactivar permisos." },
    { q: "Ha olvidado lo que le dije", a: "Lo que debe recordar siempre va en CLAUDE.md, no en el chat. Tras <code>/clear</code> solo se conserva la memoria en ficheros." },
    { q: "El servidor MCP aparece como 'failed' en /mcp", a: "Ejecuta el comando del servidor a mano en la terminal para ver el error (falta Node.js, ruta incorrecta…)." },
    { q: "¿Puedo usarlo en el servidor por SSH?", a: "Sí, pero empieza siempre en modo plan, con reglas deny para comandos destructivos, y revisa cada comando antes de aceptarlo." },
    { q: "Se ha liado con un cambio grande", a: "Pulsa Esc para interrumpir, <code>git diff</code> para ver qué ha hecho y <code>git restore .</code> para deshacer. Trabaja siempre en una rama." }
  ]
};
