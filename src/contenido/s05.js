/* Sesión 5 · Skills personalizadas */
export default {
  n: 5, bloque: 2,
  titulo: "Creación de Skills personalizadas (SKILL.md)",
  resumen: "Empaquetar procedimientos técnicos con instrucciones, scripts y plantillas para que Claude los use exactamente cuando toca, en Claude Code y en la API.",
  skill: "Skills auditoria-owasp, migracion-java21, hardening-linux y hardening-windows",
  mcp: "—",
  objetivos: [
    "Explicar qué es una Skill y cómo se carga de forma progresiva.",
    "Escribir un SKILL.md con una descripción que active la Skill en el momento justo.",
    "Separar lo determinista (scripts) del criterio (instrucciones).",
    "Crear Skills de proyecto y personales y probarlas.",
    "Diferenciar Skill, CLAUDE.md, comando slash y servidor MCP.",
    "Versionar y revisar Skills como código."
  ],
  teoria: [
    {
      h: "Qué es una Skill",
      html: `<p>Una <b>Skill</b> es una carpeta con un fichero <code>SKILL.md</code> (instrucciones con cabecera YAML) y, opcionalmente, scripts, plantillas o documentación de apoyo. Empaqueta un <b>procedimiento</b>: "cómo auditamos una API", "cómo endurecemos un servidor".</p>
      <p>Funciona por <b>carga progresiva</b>:</p>
      <ol>
        <li>Al empezar, Claude solo lee el <b>nombre y la descripción</b> de cada Skill (pocos tokens).</li>
        <li>Cuando una tarea encaja con la descripción, carga el <b>SKILL.md completo</b>.</li>
        <li>Si el SKILL.md menciona scripts o documentos, los lee o ejecuta <b>solo si hacen falta</b>.</li>
      </ol>
      <p>Así puedes tener decenas de procedimientos disponibles sin llenar el contexto.</p>`
    },
    {
      h: "Dónde viven y cómo se invocan",
      html: `<table>
        <tr><th>Ruta</th><th>Alcance</th></tr>
        <tr><td><code>.claude/skills/&lt;nombre&gt;/SKILL.md</code></td><td>Proyecto (se comparte por Git con el equipo)</td></tr>
        <tr><td><code>~/.claude/skills/&lt;nombre&gt;/SKILL.md</code></td><td>Personal, en todos tus proyectos</td></tr>
      </table>
      <p>Se activan de dos formas: <b>automáticamente</b>, cuando Claude reconoce la tarea por la descripción, o <b>a mano</b> escribiendo <code>/nombre-de-la-skill</code>. Las Skills también se pueden usar desde la API de Claude (con la herramienta de ejecución de código) y en claude.ai.</p>`
    },
    {
      h: "Estructura de SKILL.md",
      html: `<div class="scheme">  .claude/skills/hardening-linux/
  ├── SKILL.md              ← obligatorio
  ├── scripts/comprobar.sh  ← determinista, solo lectura
  ├── plantillas/informe.md ← formato de salida
  └── referencia/cis.md     ← se lee solo si hace falta</div>
      <p>La cabecera YAML lleva al menos <code>name</code> (minúsculas y guiones) y <code>description</code>. El cuerpo, en Markdown: pasos numerados, formato de salida y lo que está prohibido.</p>
      <p>La <b>descripción</b> es lo más importante: decide cuándo se activa. Debe decir <b>qué hace</b> y <b>cuándo usarla</b>, con las palabras que usará quien la pida.</p>`,
      ejemplos: [
        { tipo: "general", titulo: "Descripción mala y buena", lang: "YAML", code: String.raw`# ✗ Demasiado vaga: no se activará cuando toca
description: Ayuda con seguridad.

# ✓ Qué hace + cuándo + palabras clave
description: Audita código de APIs y formularios web contra OWASP Top 10 (inyección,
  control de acceso, criptografía, configuración). Úsala cuando pidan revisar la
  seguridad de un endpoint, controlador, formulario o API REST.` }
      ]
    },
    {
      h: "Instrucciones frente a scripts",
      html: `<p>Regla de diseño: <b>lo determinista, en scripts; el criterio, en instrucciones</b>.</p>
      <table>
        <tr><th>En un script</th><th>En las instrucciones</th></tr>
        <tr><td>Listar puertos abiertos, permisos, versiones</td><td>Decidir qué es grave y qué no</td></tr>
        <tr><td>Contar líneas, buscar patrones, ejecutar tests</td><td>Explicar el riesgo y priorizar</td></tr>
        <tr><td>Generar un fichero con formato fijo</td><td>Redactar recomendaciones</td></tr>
      </table>
      <p>Un script da siempre el mismo resultado y no gasta tokens en "pensar" cómo listar usuarios. Las instrucciones aprovechan lo que el modelo hace bien: interpretar.</p>`
    },
    {
      h: "Skill, CLAUDE.md, comando slash o MCP: ¿qué uso?",
      html: `<table>
        <tr><th>Necesito…</th><th>Usa</th><th>Ejemplo</th></tr>
        <tr><td>Que siempre sepa cómo es el proyecto</td><td><code>CLAUDE.md</code></td><td>Cómo compilar, convenciones</td></tr>
        <tr><td>Un procedimiento que se active cuando toca</td><td><b>Skill</b></td><td>Auditoría OWASP, hardening</td></tr>
        <tr><td>Un atajo que lanzo yo</td><td>Comando slash (Sesión 6)</td><td>/audit-dockerfile</td></tr>
        <tr><td>Una regla que se cumpla siempre</td><td>Hook (Sesión 6)</td><td>Bloquear rm -rf</td></tr>
        <tr><td>Acceso a datos o sistemas externos</td><td>Servidor MCP (Bloque 3)</td><td>Consultar PostgreSQL</td></tr>
      </table>`
    },
    {
      h: "Buenas prácticas",
      html: `<ul>
        <li><b>Una Skill = un procedimiento.</b> Mejor tres pequeñas que una enorme.</li>
        <li>Incluye un <b>ejemplo de salida</b> esperada y una sección <b>Prohibido</b>.</li>
        <li>Las Skills que tocan sistemas deben ser <b>de solo lectura</b> por defecto: proponen, no ejecutan cambios.</li>
        <li><b>Versiónalas en Git</b> y revísalas como código: una Skill mal escrita se equivoca siempre igual.</li>
        <li>Solo instala Skills de fuentes en las que confíes: pueden incluir scripts que se ejecutan en tu equipo.</li>
      </ul>`,
      ejemplos: [
        { tipo: "aviso", titulo: "Skills de terceros", texto: `<p>Una Skill descargada puede traer un <code>scripts/instalar.sh</code> malicioso. Léela entera antes de usarla, igual que harías con un script de Internet.</p>` }
      ]
    }
  ],
  taller: [
    { t: "1. Crear la estructura", d: "Cuatro Skills en el proyecto.", lang: "Bash", code: String.raw`mkdir -p .claude/skills/{auditoria-owasp,migracion-java21,hardening-linux/scripts,hardening-windows/scripts}
find .claude/skills -type d`, resultado: ".claude/skills\n.claude/skills/auditoria-owasp\n.claude/skills/migracion-java21\n.claude/skills/hardening-linux\n.claude/skills/hardening-linux/scripts\n..." },
    { t: "2. Skill de auditoría OWASP (DAM)", d: ".claude/skills/auditoria-owasp/SKILL.md", lang: "Markdown", code: String.raw`---
name: auditoria-owasp
description: Audita código de APIs y formularios web contra OWASP Top 10 (inyección, control de acceso, criptografía, configuración). Úsala cuando se pida revisar la seguridad de un endpoint, controlador, formulario o API REST.
---

# Auditoría OWASP

## Pasos
1. Localiza los puntos de entrada (controladores, rutas, formularios).
2. Para cada uno revisa:
   - Validación de entrada y tamaño máximo.
   - Consultas parametrizadas (nada de concatenar SQL).
   - Autorización por recurso (¿puede el usuario A ver el pedido de B?).
   - Gestión de errores (sin trazas internas al cliente).
   - Secretos escritos en el código.
3. No modifiques código: solo informa.

## Formato del informe
| Gravedad | Fichero:línea | Categoría OWASP | Problema | Corrección |

Termina con las 3 correcciones prioritarias.

## Prohibido
- Ejecutar ataques reales contra servicios.
- Mostrar valores de secretos encontrados (di solo dónde están).` },
    { t: "3. Skill de migración a Java 21 (DAM)", d: ".claude/skills/migracion-java21/SKILL.md", lang: "Markdown", code: String.raw`---
name: migracion-java21
description: Migra código Java 8/11/17 a Java 21 (records, pattern matching en switch, text blocks, hilos virtuales, colecciones secuenciadas). Úsala cuando pidan modernizar o migrar un proyecto Java.
---

# Migración a Java 21

1. Comprueba la versión en pom.xml o build.gradle y súbela a 21.
2. Ejecuta los tests: deben estar en verde ANTES de empezar.
3. Cambia de uno en uno, ejecutando los tests tras cada paso:
   - DTOs inmutables → record
   - cadenas de if/instanceof → switch con patrones
   - cadenas multilínea → text blocks
   - pools de hilos para E/S → Executors.newVirtualThreadPerTaskExecutor()
   - list.get(list.size() - 1) → list.getLast()
4. Si un test falla, revierte ese cambio y anótalo.
5. Resume en una tabla: antes / después / motivo.` },
    { t: "4. Skill de hardening Linux con script (ASIR)", d: ".claude/skills/hardening-linux/SKILL.md", lang: "Markdown", code: String.raw`---
name: hardening-linux
description: Revisa el bastionado de un servidor Ubuntu/Debian (SSH, usuarios, firewall, actualizaciones, permisos, servicios). Úsala cuando pidan auditar, revisar o endurecer un servidor Linux.
---

# Hardening Linux

1. Ejecuta scripts/comprobar.sh (solo lectura) y analiza su salida.
2. Clasifica cada hallazgo: crítico, alto, medio, bajo.
3. Para cada hallazgo propone el comando de corrección, pero NO lo ejecutes:
   el administrador debe confirmarlo.
4. Incluye el comando de vuelta atrás de cada cambio.

## Formato
| Gravedad | Hallazgo | Evidencia | Corrección | Vuelta atrás |` },
    { t: "4b. scripts/comprobar.sh", d: "Comprobaciones deterministas de solo lectura. Dale permisos: chmod +x.", lang: "Bash", code: String.raw`#!/usr/bin/env bash
# Solo lectura: no modifica el sistema
echo "== SSH =="
sshd -T 2>/dev/null | grep -Ei '^(permitrootlogin|passwordauthentication|port|maxauthtries) '
echo "== Usuarios con UID 0 =="
awk -F: '$3 == 0 {print $1}' /etc/passwd
echo "== Usuarios con shell y sin contraseña bloqueada =="
awk -F: '$7 ~ /(bash|sh)$/ {print $1}' /etc/passwd
echo "== Firewall =="
(ufw status verbose 2>/dev/null || echo "ufw no instalado")
echo "== Puertos en escucha =="
ss -tulpn | awk 'NR>1 {print $1, $5, $7}'
echo "== Actualizaciones pendientes =="
apt list --upgradable 2>/dev/null | tail -n +2 | wc -l
echo "== Ficheros escribibles por todos en /etc =="
find /etc -xdev -type f -perm -0002 2>/dev/null`, resultado: "== SSH ==\npermitrootlogin yes\npasswordauthentication yes\nport 22\n== Usuarios con UID 0 ==\nroot\n..." },
    { t: "5. Skill de hardening Windows (ASIR)", d: ".claude/skills/hardening-windows/scripts/comprobar.ps1 (solo lectura).", lang: "PowerShell", code: String.raw`Write-Output "== Firewall =="
Get-NetFirewallProfile | Select-Object Name, Enabled, DefaultInboundAction
Write-Output "== Usuarios locales habilitados =="
Get-LocalUser | Where-Object Enabled | Select-Object Name, LastLogon, PasswordRequired
Write-Output "== SMBv1 =="
Get-SmbServerConfiguration | Select-Object EnableSMB1Protocol
Write-Output "== Últimos parches =="
Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 5 HotFixID, InstalledOn
Write-Output "== Servicios automáticos detenidos =="
Get-Service | Where-Object { $_.StartType -eq "Automatic" -and $_.Status -ne "Running" } | Select-Object Name, Status` },
    { t: "6. Probar las Skills", d: "Pide la tarea sin nombrar la Skill y comprueba que la elige sola; después invócala a mano.", lang: "Claude Code", code: String.raw`> Revisa la seguridad del controlador UsuarioController
  (debería activarse auditoria-owasp)
> Audita el bastionado de este servidor
  (debería activarse hardening-linux y ejecutar scripts/comprobar.sh)
> /migracion-java21` }
  ],
  prompts: [
    { t: "Generador de SKILL.md", tipo: "SKILL.md", uso: "Convierte un procedimiento que haces a mano en una Skill.", txt: `Crea una Skill de Claude Code para este procedimiento:
<procedimiento>{{describe los pasos que haces a mano}}</procedimiento>
Requisitos:
- Cabecera YAML con name (minúsculas y guiones) y description (qué hace + cuándo usarla + palabras clave).
- Pasos numerados, formato de salida y qué NO debe hacer.
- Si hay pasos deterministas, sepáralos en un script en scripts/ (solo lectura).` },
    { t: "Plantilla SKILL.md vacía", tipo: "SKILL.md", txt: `---
name: {{nombre-skill}}
description: {{Qué hace}}. Úsala cuando {{situación}}.
---

# {{Título}}

## Pasos
1. ...

## Formato de salida
...

## Prohibido
- ...` },
    { t: "Revisor de Skills", tipo: "Prompt", txt: `Revisa esta SKILL.md como si fueras Claude leyéndola por primera vez:
<skill>{{contenido}}</skill>
¿La descripción deja claro cuándo usarla? ¿Hay pasos ambiguos? ¿Falta el formato de salida? ¿Hay algo que debería ir en un script? Propón la versión mejorada.` },
    { t: "Skill de revisión de PR", tipo: "SKILL.md", txt: `---
name: revision-pr
description: Revisa un pull request o un diff (bugs, seguridad, tests, legibilidad). Úsala cuando pidan revisar cambios, un diff o un PR antes de fusionarlo.
---
1. Lee el diff completo y los ficheros que toca.
2. Ejecuta los tests afectados.
3. Informe: Bloqueantes / Recomendados / Opcionales, cada punto con fichero:línea.` },
    { t: "Skill de informe de incidencias", tipo: "SKILL.md", txt: `---
name: informe-incidencia
description: Redacta el informe de una incidencia de sistemas a partir de logs y notas. Úsala cuando pidan un post-mortem o un informe de caída.
---
1. Construye la línea temporal con hora exacta.
2. Distingue causa raíz y síntomas.
3. Formato: Resumen / Impacto / Línea temporal / Causa raíz / Acciones (responsable y fecha).` }
  ],
  actividad: {
    dam: {
      t: "Skill propia de calidad de código",
      d: "Crea una Skill que ejecute los tests y el linter del proyecto (Checkstyle, ruff…) y redacte un informe de calidad con prioridades.",
      pasos: ["Script que lanza tests + linter y guarda la salida.", "SKILL.md con criterio de prioridad.", "Plantilla del informe.", "Prueba de activación automática."],
      entregables: ["Carpeta .claude/skills/<nombre>/ completa.", "Ejemplo de informe generado.", "Prueba de que Claude la invoca sin nombrarla."],
      criterios: [["Descripción que activa la Skill", 2], ["Script determinista correcto", 3], ["Informe útil y priorizado", 3], ["Pruebas", 2]]
    },
    asir: {
      t: "Skill de hardening con vuelta atrás",
      d: "Amplía hardening-linux o completa hardening-windows. Cada recomendación debe llevar comando de corrección y de reversión.",
      pasos: ["Script de comprobaciones de solo lectura.", "SKILL.md con la tabla de formato.", "Ejecución sobre una VM real.", "Aplicar una corrección y su vuelta atrás."],
      entregables: ["SKILL.md y scripts.", "Informe sobre una VM real.", "Prueba de una corrección y su vuelta atrás."],
      criterios: [["Script de solo lectura completo", 3], ["Informe con gravedades correctas", 3], ["Vuelta atrás probada", 3], ["Documentación", 1]]
    },
    sync: {
      t: "Catálogo de Skills del equipo",
      d: "Juntad vuestras Skills en un repositorio común con un README que explique cada una, cuándo se activa y un ejemplo de salida.",
      pasos: ["Repositorio skills-equipo.", "Revisión cruzada: DAM revisa una Skill de ASIR y viceversa.", "README del catálogo."],
      entregables: ["Repositorio con al menos 4 Skills.", "README del catálogo.", "Revisión cruzada documentada."],
      criterios: [["Catálogo completo", 4], ["Revisión cruzada", 3], ["README", 3]]
    }
  },
  test: [
    { p: "¿Qué fichero es obligatorio en una Skill?", o: ["README.md", "SKILL.md", "skill.json", "CLAUDE.md"], c: 1, exp: "La Skill se define con SKILL.md (cabecera YAML + instrucciones)." },
    { p: "¿Qué lee Claude de cada Skill al empezar?", o: ["Todo el contenido", "Solo el nombre y la descripción", "Solo los scripts", "Nada"], c: 1, exp: "Es la carga progresiva: el resto se lee cuando la tarea lo pide." },
    { p: "¿Qué parte decide cuándo se activa una Skill?", o: ["El nombre de la carpeta", "La descripción", "El tamaño del fichero", "El orden alfabético"], c: 1, exp: "La descripción debe decir qué hace y cuándo usarla." },
    { p: "¿Dónde se guarda una Skill del proyecto?", o: ["~/.claude/skills/", ".claude/skills/<nombre>/", "/etc/claude/", "src/skills/"], c: 1, exp: "En .claude/skills/<nombre>/SKILL.md, compartida por Git." },
    { p: "¿Qué debe ir en un script y no en las instrucciones?", o: ["Decidir la gravedad", "Listar puertos abiertos", "Redactar recomendaciones", "Priorizar"], c: 1, exp: "Lo determinista va en scripts; el criterio, en instrucciones." },
    { p: "Necesitas que una regla se cumpla siempre (bloquear rm -rf). ¿Qué usas?", o: ["Una Skill", "Un hook", "CLAUDE.md", "Un Artifact"], c: 1, exp: "Los hooks se ejecutan siempre; la Skill depende de que el modelo la use." },
    { p: "¿Cómo se invoca a mano la Skill migracion-java21?", o: ["#migracion-java21", "/migracion-java21", "@migracion-java21", "!migracion-java21"], c: 1, exp: "Con /nombre-de-la-skill." },
    { p: "Una Skill de hardening debería por defecto…", o: ["Aplicar los cambios directamente", "Proponer cambios y no ejecutarlos sin confirmación", "Reiniciar el servidor", "Desactivar el firewall"], c: 1, exp: "Solo lectura por defecto; los cambios los confirma el administrador." },
    { p: "¿Qué riesgo tiene instalar Skills de terceros?", o: ["Ninguno", "Pueden incluir scripts maliciosos", "Consumen la clave de API", "Borran CLAUDE.md"], c: 1, exp: "Hay que leerlas antes, como cualquier script." },
    { p: "¿Qué es mejor?", o: ["Una Skill enorme para todo", "Varias Skills pequeñas, una por procedimiento", "Ninguna Skill", "Copiar las Skills en CLAUDE.md"], c: 1, exp: "Una Skill = un procedimiento: se activan mejor y se mantienen mejor." }
  ],
  faq: [
    { q: "Claude no usa mi Skill", a: "Mejora la <code>description</code>: incluye las palabras con las que se pedirá la tarea y la frase 'Úsala cuando…'. Comprueba la ruta <code>.claude/skills/&lt;nombre&gt;/SKILL.md</code>." },
    { q: "La cabecera YAML da error", a: "Debe empezar y acabar con <code>---</code> en líneas propias y no llevar tabuladores. Si la descripción tiene dos puntos, ponla entre comillas." },
    { q: "El script de la Skill no se ejecuta", a: "Revisa permisos (<code>chmod +x</code>) y finales de línea: un .sh guardado desde Windows con CRLF falla en Linux (<code>dos2unix</code>)." },
    { q: "En Windows el .ps1 no se ejecuta", a: "Puede ser la política de ejecución: <code>Get-ExecutionPolicy</code>. Para scripts locales firmados o del proyecto, <code>Set-ExecutionPolicy -Scope CurrentUser RemoteSigned</code>." },
    { q: "¿Las Skills funcionan fuera de Claude Code?", a: "Sí: en claude.ai y desde la API (con la herramienta de ejecución de código). El formato de SKILL.md es el mismo." },
    { q: "¿Cuántas Skills puedo tener?", a: "Muchas: solo se carga su descripción hasta que hacen falta. Lo que importa es que las descripciones no se solapen." }
  ]
};
