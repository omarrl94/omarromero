/* Sesión 12 · Proyecto Final Integrador y Título Propio */
export default {
  n: 12, bloque: 4,
  titulo: "Proyecto Final Integrador (parejas DAM + ASIR) y Título Propio",
  resumen: "Diseño, construcción, pruebas de seguridad y defensa de un sistema completo con Skills, servidor MCP, API y despliegue. La aprobación del bloque de sincronización da acceso al Título Propio del centro.",
  skill: "Skills del proyecto (mínimo 2) + comando /pre-deploy + subagente revisor",
  mcp: "Servidor MCP del proyecto desplegado por Streamable HTTP con TLS y token",
  objetivos: [
    "Planificar un proyecto en parejas con reparto claro entre DAM y ASIR.",
    "Integrar API, servidor MCP, Skills, comandos y hooks en un mismo repositorio.",
    "Desplegar de forma reproducible con Docker, TLS y secretos fuera del código.",
    "Demostrar la seguridad con pruebas de inyección y de permisos.",
    "Documentar con memoria, diagramas y manuales.",
    "Defender el proyecto ante el tribunal con una demostración en vivo."
  ],
  teoria: [
    {
      h: "Qué hay que construir",
      html: `<p>Un <b>asistente de operaciones y desarrollo</b> para un escenario real (tienda online, gestión de aulas, helpdesk del centro, inventario…) con:</p>
      <ol>
        <li><b>Aplicación</b> (DAM) que usa la API de Claude con streaming, caché y salida estructurada.</li>
        <li><b>Servidor MCP propio</b> (pareja) con Resources, Tools seguras con confirmación y Prompts, desplegado por HTTP con TLS y token (ASIR).</li>
        <li>Al menos <b>2 Skills</b>, <b>1 comando slash</b> y <b>hooks</b> de seguridad.</li>
        <li><b>Sanitización</b> de datos y <b>pruebas de inyección</b> documentadas.</li>
        <li><b>Tests</b> automáticos y CI.</li>
      </ol>`,
      ejemplos: [
        { tipo: "general", titulo: "Ideas de escenario", texto: `<ul>
          <li><b>Helpdesk del centro</b>: tickets desde correo (salida estructurada), servidor MCP con inventario de equipos y estado de servicios, Skill de diagnóstico.</li>
          <li><b>Tienda online</b>: asistente de ventas con consulta segura a la BBDD, servidor MCP de pedidos y de logs del servidor web, informe nocturno por lotes.</li>
          <li><b>Gestión de aulas</b>: reservas, estado de los equipos por aula, Skill de hardening de los PCs y panel de incidencias.</li></ul>` }
      ]
    },
    {
      h: "Reparto de trabajo DAM + ASIR",
      html: `<table>
        <tr><th>Parte</th><th>DAM</th><th>ASIR</th><th>Juntos</th></tr>
        <tr><td>Arquitectura</td><td>Diseño de la app y del contrato MCP</td><td>Diseño de red, servidores y seguridad</td><td>Diagrama final</td></tr>
        <tr><td>Código</td><td>App, tools de negocio, tests</td><td>Tools de sistema, scripts, Skills de ops</td><td>Servidor MCP</td></tr>
        <tr><td>Infraestructura</td><td>Dockerfile de la app</td><td>docker-compose, proxy TLS, systemd, copias</td><td>/pre-deploy</td></tr>
        <tr><td>Seguridad</td><td>Validación, OWASP</td><td>Hardening, permisos, sanitización</td><td>Red team cruzado</td></tr>
      </table>
      <p>Cada miembro debe tener commits propios en las partes que le corresponden: el tribunal lo comprobará con <code>git shortlog -sn</code>.</p>`
    },
    {
      h: "Rúbrica de evaluación (10 puntos)",
      html: `<table>
        <tr><th>Criterio</th><th>Peso</th><th>Qué se valora</th></tr>
        <tr><td>Funcionamiento de extremo a extremo</td><td>3</td><td>Demo en vivo sin trucos, casos reales</td></tr>
        <tr><td>Servidor MCP: diseño y seguridad</td><td>2</td><td>Primitivas bien elegidas, validación, confirmación, auditoría</td></tr>
        <tr><td>Skills, comandos y hooks</td><td>1,5</td><td>Útiles, bien descritos, probados</td></tr>
        <tr><td>Ciberseguridad y cumplimiento</td><td>1,5</td><td>Inyección, anonimización, secretos, RGPD</td></tr>
        <tr><td>Despliegue e infraestructura</td><td>1</td><td>Reproducible, TLS, copias, monitorización</td></tr>
        <tr><td>Documentación y defensa oral</td><td>1</td><td>Memoria clara, respuestas al tribunal</td></tr>
      </table>
      <p>Nota mínima para el título: <b>5</b> en el bloque de sincronización de esta sesión, validada por el profesor responsable.</p>`
    },
    {
      h: "Calendario y entregables",
      html: `<div class="scheme">  Fase 1  Planificación y contrato MCP       → bloque de tu ciclo (diseño)    · revisión del profesor
  Fase 2  Construcción por parejas           → commits de ambos              · seguimiento semanal
  Fase 3  Pruebas de seguridad cruzadas      → informe de red team
  Fase 4  Defensa de 10 min + demostración   → bloque de sincronización      · rúbrica
  ───────────────────────────────────────────────────────────────────────────
  Validación del bloque de sincronización → emisión del Título Propio por omar.romero@jrotero.es</div>`
    },
    {
      h: "Cómo preparar la defensa",
      html: `<ol>
        <li><b>Minuto 0–2</b>: problema y arquitectura (un diagrama).</li>
        <li><b>Minuto 2–7</b>: demostración en vivo de un caso real de principio a fin.</li>
        <li><b>Minuto 7–9</b>: seguridad: un ataque de inyección y cómo se frena.</li>
        <li><b>Minuto 9–10</b>: lo que mejoraríais y lo que habéis aprendido.</li>
      </ol>
      <p>Ten preparado un plan B (vídeo de la demo) por si falla la red del aula. El tribunal preguntará a cada miembro por la parte del otro.</p>`
    },
    {
      h: "Checklist antes de entregar",
      html: `<ul>
        <li>☐ Ningún secreto en el repositorio (<code>git grep -nE "sk-ant-|password=|BEGIN PRIVATE KEY"</code> vacío).</li>
        <li>☐ <code>/pre-deploy</code> da "LISTO".</li>
        <li>☐ Tests en verde en CI.</li>
        <li>☐ Datos de prueba anonimizados.</li>
        <li>☐ README con instrucciones para levantar todo desde cero.</li>
        <li>☐ Etiqueta <code>v1.0-final</code> creada y subida.</li>
      </ul>`
    }
  ],
  taller: [
    { t: "1. Estructura del repositorio", d: "Plantilla recomendada.", lang: "Bash", code: String.raw`proyecto-final/
├── CLAUDE.md
├── .mcp.json
├── .claude/
│   ├── settings.json          # permisos + hooks
│   ├── commands/pre-deploy.md
│   ├── agents/revisor.md
│   ├── hooks/
│   └── skills/
├── app/                       # DAM: Java 21 o Python
├── mcp-server/                # servidor MCP (pareja) + tests
├── infra/                     # ASIR: docker-compose, nginx, systemd, copias
├── seguridad/                 # sanitizador, pruebas de inyección
├── .github/workflows/ci.yml
└── docs/                      # memoria, diagramas, manuales` },
    { t: "2. docker-compose de referencia", d: "App, servidor MCP y proxy con TLS; la clave como secreto de Docker.", lang: "YAML", code: String.raw`services:
  app:
    build: ./app
    environment:
      - ANTHROPIC_API_KEY_FILE=/run/secrets/anthropic_key
    secrets: [anthropic_key]
    depends_on: [mcp]
    restart: unless-stopped
  mcp:
    build: ./mcp-server
    command: ["python", "servidor.py", "streamable-http"]
    read_only: true
    cap_drop: [ALL]
    restart: unless-stopped
  proxy:
    image: nginx:1.27-alpine
    ports: ["443:443"]
    volumes:
      - ./infra/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./infra/certs:/etc/nginx/certs:ro
    depends_on: [app, mcp]
secrets:
  anthropic_key:
    file: ./infra/secrets/anthropic_key.txt     # en .gitignore` },
    { t: "3. CI con GitHub Actions", d: ".github/workflows/ci.yml: tests del servidor MCP y búsqueda de secretos en cada push.", lang: "YAML", code: String.raw`name: ci
on: [push, pull_request]
jobs:
  tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install "mcp[cli]" psutil pytest
      - run: pytest -q mcp-server
      - name: Sin secretos
        run: "! git grep -nE 'sk-ant-|BEGIN PRIVATE KEY|password='"` },
    { t: "4. /pre-deploy", d: ".claude/commands/pre-deploy.md: la puerta antes de cada entrega.", lang: "Markdown", code: String.raw`---
description: Comprobaciones previas al despliegue del proyecto final
---
1. Ejecuta los tests de app/ y de mcp-server/.
2. Usa la Skill auditoria-owasp sobre app/.
3. Ejecuta /audit-dockerfile sobre cada Dockerfile.
4. Comprueba que no hay secretos en el repositorio (git grep -nE "sk-ant-|password=").
5. Lanza seguridad/pruebas_inyeccion.py.
6. Usa el subagente revisor sobre git diff main.
Resultado: tabla con OK/FALLO por punto y veredicto final "LISTO" o "NO LISTO".` },
    { t: "5. Plantilla de la memoria", d: "docs/memoria.md", lang: "Markdown", code: String.raw`# {{Nombre del proyecto}}
## 1. Problema y usuarios
## 2. Arquitectura (diagrama + decisiones)
## 3. Servidor MCP: primitivas, riesgos y protecciones
## 4. Skills, comandos y hooks
## 5. Despliegue (cómo levantarlo desde cero)
## 6. Seguridad: pruebas de inyección y resultados
## 7. Protección de datos (qué datos, anonimización, RGPD)
## 8. Costes (uso medido, caché, lotes)
## 9. Reparto de trabajo y git shortlog
## 10. Mejoras futuras` },
    { t: "6. Entrega en la plataforma", d: "Cada uno entrega su bloque de ciclo y el bloque de sincronización.", lang: "Pasos", code: String.raw`1. Etiqueta la versión entregada:
   git tag -a v1.0-final -m "Entrega proyecto final" && git push --tags
2. Actividad práctica → bloque de tu ciclo (DAM o ASIR): enlace a tu parte y resumen.
3. Actividad práctica → bloque Sincronización: enlace al repositorio, nombre de tu pareja y resumen.
4. Prepara la defensa: 10 minutos, demo en vivo y una prueba de inyección frenada.
5. Tras la validación del bloque de sincronización, descarga tu Título Propio desde "Mi perfil".` }
  ],
  prompts: [
    { t: "Planificador del proyecto final", tipo: "Prompt", txt: `<equipo>DAM: {{nombre}} · ASIR: {{nombre}}</equipo>
<escenario>{{descripción del caso real}}</escenario>
Propón: arquitectura (diagrama de texto), contrato del servidor MCP, Skills necesarias, reparto de tareas por ciclo y plan en 4 fases con entregables y riesgos.` },
    { t: "Ensayo de la defensa", tipo: "Prompt", txt: `Actúa como tribunal de evaluación de FP. Te paso la memoria del proyecto:
<memoria>{{memoria}}</memoria>
Hazme 8 preguntas difíciles (arquitectura, seguridad, costes, RGPD), de una en una, y valora cada respuesta con la rúbrica. Pregunta a cada miembro por la parte del otro.` },
    { t: "CLAUDE.md del proyecto final", tipo: "CLAUDE.md", txt: `# Proyecto final · {{nombre}}
## Equipo
DAM: {{nombre}} (app/) · ASIR: {{nombre}} (infra/, mcp-server/)
## Comandos
- Tests: {{...}}  · Levantar: docker compose up -d  · Comprobar: /pre-deploy
## Reglas
- Logs siempre a través de la Skill sanitizar-logs.
- Ninguna tool del MCP modifica datos sin confirmación explícita.
- Nunca leer infra/secrets/.` },
    { t: "Revisión final de la memoria", tipo: "Prompt", txt: `<memoria>{{memoria}}</memoria>
Revisa como un tribunal exigente: ¿falta algún apartado de la plantilla? ¿hay afirmaciones sin evidencia? ¿se explica cómo levantarlo desde cero? Lista de mejoras priorizada.` }
  ],
  actividad: {
    dam: {
      t: "Aplicación del proyecto",
      d: "Aplicación completa que consume la API (streaming, caché, salida estructurada) y el servidor MCP de la pareja, con tests y manual de usuario.",
      pasos: ["Diseño y contrato con ASIR.", "App con streaming y caché.", "Tools de negocio del servidor MCP con tests.", "Manual de usuario."],
      entregables: ["Código en app/ con tests.", "Manual de usuario."],
      criterios: [["Funcionamiento", 4], ["Calidad y tests", 3], ["Uso correcto de la API (streaming, caché, esquema)", 2], ["Manual", 1]]
    },
    asir: {
      t: "Infraestructura del proyecto",
      d: "Despliegue reproducible con Docker, proxy TLS, autenticación del MCP, copias de seguridad y monitorización, con plan de recuperación.",
      pasos: ["docker-compose y proxy TLS.", "Token del MCP y secretos fuera del repositorio.", "Copias y restauración probada.", "Monitorización básica."],
      entregables: ["infra/ completo.", "Plan de recuperación ante desastres de una página.", "Prueba de restauración."],
      criterios: [["Despliegue reproducible", 3], ["Seguridad (TLS, token, secretos)", 3], ["Copias y recuperación probadas", 3], ["Documentación", 1]]
    },
    sync: {
      t: "Entrega del Proyecto Final Integrador",
      d: "Integración completa, pruebas de seguridad cruzadas y defensa. Este bloque, una vez aprobado por el profesor, habilita la emisión del Título Propio.",
      pasos: ["/pre-deploy en LISTO.", "Informe de red team cruzado.", "Memoria completa.", "Defensa ante el tribunal."],
      entregables: ["Enlace al repositorio con la etiqueta v1.0-final.", "Memoria en docs/.", "Informe de pruebas de inyección."],
      criterios: [["Funcionamiento de extremo a extremo", 3], ["Servidor MCP y seguridad", 2], ["Skills, comandos y hooks", 1.5], ["Ciberseguridad y RGPD", 1.5], ["Despliegue", 1], ["Documentación y defensa", 1]]
    }
  },
  test: [
    { p: "¿Qué bloque de la Sesión 12 da acceso al Título Propio?", o: ["El bloque DAM", "El bloque ASIR", "El bloque de Sincronización DAM + ASIR", "El test"], c: 2, exp: "El título se emite cuando el profesor aprueba el bloque de sincronización." },
    { p: "¿Qué nota mínima se necesita en el proyecto para el título?", o: ["3", "5", "7", "9"], c: 1, exp: "Un 5 validado por el profesor responsable." },
    { p: "¿Cómo comprueba el tribunal el reparto del trabajo?", o: ["Preguntando al azar", "Con los commits de cada miembro (git shortlog -sn)", "Por el número de líneas de la memoria", "No lo comprueba"], c: 1, exp: "Cada miembro debe tener commits en su parte." },
    { p: "¿Dónde va la clave de API en el despliegue de referencia?", o: ["En el docker-compose", "Como secreto de Docker en un fichero fuera de Git", "En el código", "En la memoria"], c: 1, exp: "El fichero del secreto está en .gitignore." },
    { p: "¿Qué debe dar /pre-deploy antes de entregar?", o: ["NO LISTO", "LISTO", "Un error", "Nada"], c: 1, exp: "Es la puerta de calidad del proyecto." },
    { p: "¿Qué comprueba el paso 'Sin secretos' del CI?", o: ["Que no haya claves ni contraseñas en el repositorio", "Que los tests pasan", "La ortografía", "El tamaño del repo"], c: 0, exp: "Busca patrones como sk-ant- o BEGIN PRIVATE KEY." },
    { p: "¿Qué debe incluir la defensa?", o: ["Solo diapositivas", "Demo en vivo, un ataque de inyección frenado y mejoras", "Leer la memoria", "El código completo"], c: 1, exp: "10 minutos: problema, demo, seguridad y mejoras." },
    { p: "¿Qué etiqueta marca la versión entregada?", o: ["main", "v1.0-final", "latest", "release"], c: 1, exp: "git tag -a v1.0-final." },
    { p: "Las tools del MCP que modifican datos deben…", o: ["Ejecutarse sin preguntar", "Pedir confirmación explícita", "Desactivarse en la demo", "Usar shell=True"], c: 1, exp: "Es una de las reglas del CLAUDE.md del proyecto." },
    { p: "¿Qué hay que preparar por si falla la red del aula?", o: ["Nada", "Un plan B, por ejemplo un vídeo de la demo", "Otro proyecto", "Una nueva clave"], c: 1, exp: "La demo en vivo puede fallar por causas ajenas." }
  ],
  faq: [
    { q: "¿Qué pasa si mi pareja abandona?", a: "Comunícalo al profesor responsable (omar.romero@jrotero.es). Se ajustará el alcance para que puedas completar el proyecto en solitario." },
    { q: "¿Cuándo puedo descargar el título?", a: "Cuando el profesor apruebe el bloque de sincronización de la Sesión 12 y emita el título desde el Panel docente. Aparecerá en Mi perfil y te llegará un aviso por correo." },
    { q: "¿Tengo que entregar los dos bloques?", a: "Sí: el bloque de tu ciclo (tu parte) y el de sincronización (el proyecto común). Cada uno tiene su nota." },
    { q: "¿Puedo usar otro modelo que no sea Claude en una parte?", a: "Sí, si lo justificas en la memoria y la arquitectura lo aísla en una capa de adaptador (Sesión 1)." },
    { q: "¿Puedo usar datos reales de una empresa de prácticas?", a: "Solo con permiso por escrito y anonimizados. Lo recomendable es generar datos de prueba." },
    { q: "La demo depende de la API y no hay crédito", a: "Avisa al profesor con antelación. Ten la caché y los lotes bien usados para gastar poco, y un vídeo de respaldo." }
  ]
};
