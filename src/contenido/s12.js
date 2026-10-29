/* Sesión 12 · Proyecto Final Integrador y Título Propio */
export default {
  n: 12, bloque: 4,
  titulo: "Proyecto Final Integrador (individual, versión DAM o ASIR) y Título Propio",
  resumen: "Diseño, construcción, pruebas de seguridad y defensa de un sistema completo con Skills, servidor MCP, API y despliegue. Es individual: cada alumno hace la versión de su ciclo. Al aprobarse el bloque de tu ciclo de esta sesión, el centro emite tu Título Propio.",
  skill: "Skills del proyecto (mínimo 2) + comando /pre-deploy + subagente revisor",
  mcp: "Servidor MCP del proyecto desplegado por Streamable HTTP con TLS y token",
  objetivos: [
    "Planificar un proyecto individual completo, con alcance realista para el tiempo disponible.",
    "Integrar API, servidor MCP, Skills, comandos y hooks en un mismo repositorio.",
    "Desplegar de forma reproducible con Docker, TLS y secretos fuera del código.",
    "Demostrar la seguridad con pruebas de inyección y de permisos.",
    "Documentar con memoria, diagramas y manuales.",
    "Defender el proyecto ante el tribunal con una demostración en vivo."
  ],
  teoria: [
    {
      h: "Qué hay que construir",
      html: `<p>Un <b>asistente con IA</b> para un escenario real (tienda online, gestión de aulas, helpdesk del centro, inventario…). El proyecto es <b>individual</b> y tiene dos versiones, una por ciclo; las dos comparten una <b>parte común</b>:</p>
      <table>
        <tr><th>Parte</th><th>Versión DAM</th><th>Versión ASIR</th></tr>
        <tr><td>Núcleo</td><td>Aplicación (Java 21 o Python) que usa la API de Claude con streaming, caché y salida estructurada</td><td>Asistente de operaciones: scripts y automatizaciones que usan la API para analizar logs y estado de servicios</td></tr>
        <tr><td>Servidor MCP propio</td><td>De datos: consultas seguras a la BBDD de la app (Resources, Tools de solo lectura, Prompts)</td><td>De operación: estado de servicios, Docker y logs, con Tools que piden confirmación y auditoría</td></tr>
        <tr><td>Despliegue</td><td>Dockerfile de la app y docker-compose básico</td><td>docker-compose con proxy TLS, token del MCP, copias y monitorización</td></tr>
        <tr><td>Común a los dos</td><td colspan="2">Al menos <b>2 Skills</b>, <b>1 comando slash</b> (/pre-deploy) y <b>hooks</b> de seguridad · sanitización de datos y <b>pruebas de inyección</b> documentadas · <b>tests</b> automáticos y CI · memoria y defensa</td></tr>
      </table>`,
      ejemplos: [
        { tipo: "general", titulo: "Ideas de escenario", texto: `<ul>
          <li><b>Helpdesk del centro</b>: tickets desde correo (salida estructurada), servidor MCP con inventario de equipos y estado de servicios, Skill de diagnóstico.</li>
          <li><b>Tienda online</b>: asistente de ventas con consulta segura a la BBDD, servidor MCP de pedidos y de logs del servidor web, informe nocturno por lotes.</li>
          <li><b>Gestión de aulas</b>: reservas, estado de los equipos por aula, Skill de hardening de los PCs y panel de incidencias.</li></ul>` }
      ]
    },
    {
      h: "Alcance realista para una sola persona",
      html: `<p>Como trabajas solo, el éxito depende de <b>acotar bien</b>. Mejor un caso de uso que funcione de principio a fin que cinco a medias.</p>
      <table>
        <tr><th>Imprescindible</th><th>Recomendable</th><th>Opcional (si sobra tiempo)</th></tr>
        <tr><td>Un caso real completo, servidor MCP con 3–4 tools, 2 Skills, /pre-deploy, pruebas de inyección, memoria</td><td>CI con tests, caché de prompts, panel de costes</td><td>Procesamiento por lotes, segundo caso de uso, interfaz cuidada</td></tr>
      </table>
      <p>Haz commits pequeños y frecuentes: el tribunal mirará el historial (<code>git log --oneline</code>) para ver cómo ha evolucionado tu trabajo.</p>`
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
      <p>Nota mínima para el título: <b>5</b> en el bloque de tu ciclo de esta sesión, validada por el profesor responsable.</p>`
    },
    {
      h: "Calendario y entregables",
      html: `<div class="scheme">  Fase 1  Planificación y contrato MCP       → propuesta de una página        · revisión del profesor
  Fase 2  Construcción                       → commits frecuentes             · seguimiento semanal
  Fase 3  Pruebas de seguridad (red team)    → informe de inyección
  Fase 4  Defensa de 10 min + demostración   → bloque de tu ciclo (S12)       · rúbrica
  ───────────────────────────────────────────────────────────────────────────
  Aprobación del bloque de tu ciclo → emisión del Título Propio por omar.romero@jrotero.es</div>`
    },
    {
      h: "Cómo preparar la defensa",
      html: `<ol>
        <li><b>Minuto 0–2</b>: problema y arquitectura (un diagrama).</li>
        <li><b>Minuto 2–7</b>: demostración en vivo de un caso real de principio a fin.</li>
        <li><b>Minuto 7–9</b>: seguridad: un ataque de inyección y cómo se frena.</li>
        <li><b>Minuto 9–10</b>: lo que mejorarías y lo que has aprendido.</li>
      </ol>
      <p>Ten preparado un plan B (vídeo de la demo) por si falla la red del aula. El tribunal te preguntará por cualquier parte del código: tienes que saber explicarlo todo, aunque te haya ayudado Claude.</p>`
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
├── app/                       # DAM: aplicación Java 21 o Python
├── ops/                       # ASIR: scripts y automatizaciones
├── mcp-server/                # tu servidor MCP + tests
├── infra/                     # docker-compose (ASIR: nginx TLS, systemd, copias)
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
## 9. Planificación real frente a la prevista
## 10. Mejoras futuras` },
    { t: "6. Entrega en la plataforma", d: "Entregas el bloque de tu ciclo, que es el proyecto completo.", lang: "Pasos", code: String.raw`1. Etiqueta la versión entregada:
   git tag -a v1.0-final -m "Entrega proyecto final" && git push --tags
2. Actividad práctica → bloque de tu ciclo (DAM o ASIR): enlace al repositorio y resumen.
3. Prepara la defensa: 10 minutos, demo en vivo y una prueba de inyección frenada.
4. Cuando el profesor apruebe el bloque, descarga tu Título Propio desde "Mi perfil".` }
  ],
  prompts: [
    { t: "Planificador del proyecto final", tipo: "Prompt", txt: `<alumno>Ciclo: {{DAM o ASIR}} · Horas disponibles: {{n}}</alumno>
<escenario>{{descripción del caso real}}</escenario>
Propón para un proyecto individual: arquitectura (diagrama de texto), contrato del servidor MCP, Skills necesarias, qué es imprescindible y qué opcional, y plan en 4 fases con entregables y riesgos.` },
    { t: "Ensayo de la defensa", tipo: "Prompt", txt: `Actúa como tribunal de evaluación de FP. Te paso la memoria del proyecto:
<memoria>{{memoria}}</memoria>
Hazme 8 preguntas difíciles (arquitectura, seguridad, costes, RGPD), de una en una, y valora cada respuesta con la rúbrica. Pregúntame también por partes concretas del código para comprobar que lo entiendo.` },
    { t: "CLAUDE.md del proyecto final", tipo: "CLAUDE.md", txt: `# Proyecto final · {{nombre}}
## Autor
{{nombre}} · {{DAM o ASIR}} · carpetas: {{app/ u ops/}}, mcp-server/, infra/
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
      t: "Proyecto Final Integrador · versión DAM",
      d: "Proyecto individual: aplicación completa que usa la API (streaming, caché, salida estructurada) y tu propio servidor MCP de datos, con Skills, /pre-deploy, hooks, pruebas de inyección, despliegue con Docker y defensa. Al aprobarlo, el profesor emite tu Título Propio.",
      pasos: ["Propuesta de una página y contrato del servidor MCP (revisa con el profesor).", "Aplicación con streaming, caché y salida estructurada, con tests.", "Servidor MCP de datos con tools de solo lectura validadas.", "Skills, /pre-deploy y hooks; pruebas de inyección.", "Dockerfile y docker-compose; memoria en docs/.", "Defensa de 10 minutos ante el tribunal."],
      entregables: ["Enlace al repositorio con la etiqueta v1.0-final.", "Memoria en docs/ y manual de usuario.", "Informe de pruebas de inyección."],
      criterios: [["Funcionamiento de extremo a extremo", 3], ["Servidor MCP y seguridad", 2], ["Skills, comandos y hooks", 1.5], ["Ciberseguridad y RGPD", 1.5], ["Despliegue", 1], ["Documentación y defensa", 1]]
    },
    asir: {
      t: "Proyecto Final Integrador · versión ASIR",
      d: "Proyecto individual: asistente de operaciones con tu propio servidor MCP de sistemas (servicios, Docker, logs) desplegado por HTTP con TLS y token, scripts que usan la API, Skills, /pre-deploy, hooks, pruebas de inyección, copias y defensa. Al aprobarlo, el profesor emite tu Título Propio.",
      pasos: ["Propuesta de una página y contrato del servidor MCP (revisa con el profesor).", "Scripts de operación que usan la API (análisis de logs, informes).", "Servidor MCP de operación con confirmación y auditoría, desplegado con TLS y token.", "Skills, /pre-deploy y hooks; sanitización y pruebas de inyección.", "Copias con restauración probada y monitorización; memoria en docs/.", "Defensa de 10 minutos ante el tribunal."],
      entregables: ["Enlace al repositorio con la etiqueta v1.0-final.", "Memoria en docs/ con plan de recuperación.", "Informe de pruebas de inyección."],
      criterios: [["Funcionamiento de extremo a extremo", 3], ["Servidor MCP y seguridad", 2], ["Skills, comandos y hooks", 1.5], ["Ciberseguridad y RGPD", 1.5], ["Despliegue, copias y recuperación", 1], ["Documentación y defensa", 1]]
    }
  },
  test: [
    { p: "¿Qué da acceso al Título Propio?", o: ["Aprobar todos los tests", "Que el profesor apruebe el bloque de tu ciclo de la Sesión 12 (Proyecto Final)", "Marcar las 12 sesiones como completadas", "Entregar el proyecto, aunque no esté aprobado"], c: 1, exp: "El título se emite cuando el profesor aprueba tu Proyecto Final (bloque de tu ciclo en la Sesión 12)." },
    { p: "¿Qué nota mínima se necesita en el proyecto para el título?", o: ["3", "5", "7", "9"], c: 1, exp: "Un 5 validado por el profesor responsable." },
    { p: "Trabajas solo y vas justo de tiempo. ¿Qué haces?", o: ["Empezar cinco casos de uso a la vez", "Acotar: un caso real de principio a fin y dejar lo opcional para el final", "Saltarte las pruebas de seguridad", "Entregar sin memoria"], c: 1, exp: "Mejor un caso completo que varios a medias; la seguridad y la memoria son imprescindibles." },
    { p: "¿Dónde va la clave de API en el despliegue de referencia?", o: ["En el docker-compose", "Como secreto de Docker en un fichero fuera de Git", "En el código", "En la memoria"], c: 1, exp: "El fichero del secreto está en .gitignore." },
    { p: "¿Qué debe dar /pre-deploy antes de entregar?", o: ["NO LISTO", "LISTO", "Un error", "Nada"], c: 1, exp: "Es la puerta de calidad del proyecto." },
    { p: "¿Qué comprueba el paso 'Sin secretos' del CI?", o: ["Que no haya claves ni contraseñas en el repositorio", "Que los tests pasan", "La ortografía", "El tamaño del repo"], c: 0, exp: "Busca patrones como sk-ant- o BEGIN PRIVATE KEY." },
    { p: "¿Qué debe incluir la defensa?", o: ["Solo diapositivas", "Demo en vivo, un ataque de inyección frenado y mejoras", "Leer la memoria", "El código completo"], c: 1, exp: "10 minutos: problema, demo, seguridad y mejoras." },
    { p: "¿Qué etiqueta marca la versión entregada?", o: ["main", "v1.0-final", "latest", "release"], c: 1, exp: "git tag -a v1.0-final." },
    { p: "Las tools del MCP que modifican datos deben…", o: ["Ejecutarse sin preguntar", "Pedir confirmación explícita", "Desactivarse en la demo", "Usar shell=True"], c: 1, exp: "Es una de las reglas del CLAUDE.md del proyecto." },
    { p: "¿Qué hay que preparar por si falla la red del aula?", o: ["Nada", "Un plan B, por ejemplo un vídeo de la demo", "Otro proyecto", "Una nueva clave"], c: 1, exp: "La demo en vivo puede fallar por causas ajenas." }
  ],
  faq: [
    { q: "¿Puedo hacer el proyecto con un compañero?", a: "No: el proyecto final es individual, igual que todas las entregas del curso. Puedes comentar ideas y dudas, pero el código y la memoria tienen que ser tuyos." },
    { q: "¿Cuándo puedo descargar el título?", a: "Cuando el profesor apruebe el bloque de tu ciclo de la Sesión 12 y emita el título desde el Panel docente. Aparecerá en Mi perfil y te llegará un aviso por correo." },
    { q: "¿Hay bloque común en esta sesión?", a: "No. En la Sesión 12 solo entregas el bloque de tu ciclo, que es el proyecto completo. Las partes comunes (Skills, seguridad, memoria) ya van dentro de él." },
    { q: "¿Puedo usar otro modelo que no sea Claude en una parte?", a: "Sí, si lo justificas en la memoria y la arquitectura lo aísla en una capa de adaptador (Sesión 1)." },
    { q: "¿Puedo usar datos reales de una empresa de prácticas?", a: "Solo con permiso por escrito y anonimizados. Lo recomendable es generar datos de prueba." },
    { q: "La demo depende de la API y no hay crédito", a: "Avisa al profesor con antelación. Ten la caché y los lotes bien usados para gastar poco, y un vídeo de respaldo." }
  ]
};
