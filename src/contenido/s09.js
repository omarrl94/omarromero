/* Sesión 9 · Servidor MCP propio */
export default {
  n: 9, bloque: 3,
  titulo: "Servidor MCP propio en Python: Resources, Tools y Prompts",
  resumen: "Construir desde cero el servidor jro-ops con las tres primitivas, acciones con confirmación y auditoría, pruebas automáticas y despliegue por Streamable HTTP como servicio.",
  skill: "Skill diagnostico-servicio que usa el servidor jro-ops",
  mcp: "Servidor jro-ops completo (Resources de métricas y esquemas, Tools controladas, Prompts) por stdio y Streamable HTTP",
  objetivos: [
    "Diseñar un servidor MCP clasificando cada capacidad por primitiva y riesgo.",
    "Implementar Resources fijos y con plantilla (esquema://{tabla}).",
    "Implementar una acción peligrosa con lista blanca, confirmación explícita y auditoría.",
    "Escribir Prompts que guíen el uso correcto del servidor.",
    "Probar el servidor con pytest sin necesidad del modelo.",
    "Desplegarlo como servicio systemd por Streamable HTTP detrás de TLS."
  ],
  teoria: [
    {
      h: "Diseño del servidor jro-ops",
      html: `<table>
        <tr><th>Primitiva</th><th>Nombre</th><th>Riesgo</th><th>Protección</th></tr>
        <tr><td>Resource</td><td><code>metricas://host</code></td><td>Ninguno</td><td>Solo lectura</td></tr>
        <tr><td>Resource (plantilla)</td><td><code>esquema://{tabla}</code></td><td>Ninguno</td><td>Validación del nombre</td></tr>
        <tr><td>Tool</td><td><code>consulta_segura(sql)</code></td><td>Bajo</td><td>Solo SELECT, límite de filas, conexión de solo lectura</td></tr>
        <tr><td>Tool</td><td><code>estado_servicio(nombre)</code></td><td>Bajo</td><td>Lista blanca</td></tr>
        <tr><td>Tool</td><td><code>reiniciar_servicio(nombre, confirmacion)</code></td><td><b>Alto</b></td><td>Lista blanca + confirmación escrita + sudo limitado + auditoría</td></tr>
        <tr><td>Prompt</td><td><code>diagnostico_incidencia(servicio)</code></td><td>—</td><td>Guía el orden de uso</td></tr>
      </table>
      <p>Pregunta de diseño para cada capacidad: <i>"¿qué es lo peor que puede pasar si el modelo la usa mal o alguien le engaña?"</i>. Si la respuesta es grave, no es una tool libre.</p>`
    },
    {
      h: "Resources fijos y plantillas",
      html: `<ul>
        <li><b>Fijo</b>: <code>@mcp.resource("metricas://host")</code> — una URI concreta.</li>
        <li><b>Plantilla</b>: <code>@mcp.resource("esquema://{tabla}")</code> — el parámetro de la URI llega como argumento de la función. Valídalo igual que en una tool.</li>
      </ul>
      <p>En Claude Code se referencian con <code>@servidor:uri</code> (por ejemplo, <code>@jro-ops:metricas://host</code>), lo que los añade al contexto sin que el modelo tenga que pedirlos.</p>`
    },
    {
      h: "Acciones peligrosas: el patrón de confirmación",
      html: `<p>Una tool que cambia el sistema debe cumplir <b>todas</b> estas reglas:</p>
      <ol>
        <li><b>Lista blanca</b> de valores (servicios concretos), nunca texto libre.</li>
        <li><b>Confirmación</b> que tenga que escribir el usuario (p. ej. <code>REINICIAR nginx</code>): el modelo no puede "inventarla" sin que el usuario la vea.</li>
        <li><b>Privilegio mínimo</b>: sudo limitado a ese comando exacto.</li>
        <li><b>Auditoría</b>: quién, qué, cuándo y resultado.</li>
        <li><b>Resultado real</b>: devuelve lo que pasó, no "hecho".</li>
      </ol>
      <p>Además, el host (Claude Code) pide permiso al usuario antes de cada llamada a herramienta: es una capa más, no la única.</p>`,
      ejemplos: [
        { tipo: "asir", titulo: "Conversación esperada", lang: "Diálogo", code: String.raw`Tú:      nginx no responde
Claude:  [lee metricas://host, estado_servicio("nginx")] nginx está "failed" desde 09:12.
         El log indica que el puerto 80 lo ocupa otro proceso. Si quieres reiniciarlo,
         escribe exactamente: REINICIAR nginx
Tú:      REINICIAR nginx
Claude:  [reiniciar_servicio("nginx", "REINICIAR nginx")] Reiniciado. Estado: active.` }
      ]
    },
    {
      h: "Prompts del servidor",
      html: `<p>Un Prompt MCP es una plantilla que el usuario elige (en Claude Code aparecen como <code>/mcp__jro-ops__diagnostico_incidencia</code>). Sirven para fijar el <b>procedimiento correcto</b>: qué leer primero, qué no hacer sin confirmación y en qué formato informar.</p>`
    },
    {
      h: "Pruebas automáticas de un servidor MCP",
      html: `<p>Las funciones decoradas siguen siendo funciones de Python: puedes probarlas con <b>pytest</b> sin modelo, sin red y en segundos. Prueba lo que importa: que lo válido funciona y que lo peligroso se rechaza.</p>`,
      ejemplos: [
        { tipo: "dam", titulo: "Qué probar como mínimo", lang: "Lista", code: String.raw`✓ consulta_segura con un SELECT válido devuelve filas
✗ consulta_segura con DELETE / dos sentencias → ValueError
✗ esquema("x; DROP") → ValueError
✗ reiniciar_servicio("ssh", ...) → no permitido
✗ reiniciar_servicio("nginx", "si") → pide confirmación, no ejecuta
✓ reiniciar_servicio("nginx", "REINICIAR nginx") → llama a systemctl (simulado) y audita` }
      ]
    },
    {
      h: "Despliegue: Streamable HTTP, TLS y autenticación",
      html: `<div class="scheme">  Cliente (Claude Code / API) ──HTTPS + Bearer──▶ nginx :443 ──HTTP──▶ jro-ops 127.0.0.1:8000/mcp
                                                   │ TLS                     │ systemd, usuario mcpops
                                                   │ comprueba el token      │ sudo solo para 3 servicios</div>
      <ul>
        <li>El servidor escucha <b>solo en 127.0.0.1</b>; el exterior entra por el proxy.</li>
        <li>El proxy termina TLS y rechaza peticiones sin el token correcto (401).</li>
        <li>systemd lo arranca con un usuario propio, reinicio automático y sistema de ficheros protegido.</li>
      </ul>`
    }
  ],
  taller: [
    { t: "1. jro_ops.py completo", d: "Necesita pip install \"mcp[cli]\" psutil. Crea antes tienda.db (Sesión 8).", lang: "Python", code: String.raw`import datetime, logging, re, sqlite3, subprocess, sys
import psutil
from mcp.server.fastmcp import FastMCP

logging.basicConfig(stream=sys.stderr, level=logging.INFO)   # nunca a stdout
mcp = FastMCP("jro-ops")
DB = "file:tienda.db?mode=ro"
SERVICIOS_PERMITIDOS = {"nginx", "tomcat", "postgresql"}
AUDITORIA = "auditoria_mcp.log"
NOMBRE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")

# ---------- Resources ----------
@mcp.resource("metricas://host")
def metricas() -> str:
    """Uso actual de CPU, memoria y disco del servidor."""
    disco = psutil.disk_usage("/")
    return (f"cpu={psutil.cpu_percent(interval=1)}% "
            f"ram={psutil.virtual_memory().percent}% "
            f"disco={disco.percent}% libre={disco.free // 2**30} GiB")

@mcp.resource("esquema://{tabla}")
def esquema(tabla: str) -> str:
    """Columnas de una tabla de la base de datos."""
    if not NOMBRE.match(tabla):
        raise ValueError("Tabla no válida")
    with sqlite3.connect(DB, uri=True) as c:
        return "\n".join(f"{f[1]} {f[2]}" for f in c.execute(f"PRAGMA table_info({tabla})"))

# ---------- Tools ----------
@mcp.tool()
def consulta_segura(sql: str) -> list[dict]:
    """Ejecuta una única sentencia SELECT y devuelve hasta 100 filas."""
    limpio = sql.strip().rstrip(";")
    if not re.match(r"^\s*select\b", limpio, re.I) or ";" in limpio:
        raise ValueError("Solo una sentencia SELECT")
    with sqlite3.connect(DB, uri=True) as c:
        cur = c.execute(limpio)
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, f)) for f in cur.fetchmany(100)]

@mcp.tool()
def estado_servicio(nombre: str) -> str:
    """Estado systemd de un servicio permitido (nginx, tomcat, postgresql)."""
    if nombre not in SERVICIOS_PERMITIDOS:
        raise ValueError(f"Servicio no permitido. Permitidos: {sorted(SERVICIOS_PERMITIDOS)}")
    r = subprocess.run(["systemctl", "is-active", nombre], capture_output=True, text=True, timeout=10)
    return r.stdout.strip() or r.stderr.strip()

def auditar(texto: str) -> None:
    with open(AUDITORIA, "a", encoding="utf-8") as f:
        f.write(f"{datetime.datetime.now().isoformat(timespec='seconds')} {texto}\n")

@mcp.tool()
def reiniciar_servicio(nombre: str, confirmacion: str) -> str:
    """Reinicia un servicio permitido. 'confirmacion' debe ser exactamente
    'REINICIAR <nombre>' escrito por el usuario. Si no la tienes, pídesela."""
    if nombre not in SERVICIOS_PERMITIDOS:
        raise ValueError(f"Servicio no permitido. Permitidos: {sorted(SERVICIOS_PERMITIDOS)}")
    if confirmacion != f"REINICIAR {nombre}":
        auditar(f"restart {nombre} DENEGADO (sin confirmación)")
        return "Falta la confirmación del usuario. Pídele que escriba: REINICIAR " + nombre
    r = subprocess.run(["sudo", "-n", "systemctl", "restart", nombre], capture_output=True, text=True, timeout=60)
    auditar(f"restart {nombre} rc={r.returncode}")
    return "Reiniciado correctamente" if r.returncode == 0 else "Error: " + r.stderr.strip()

# ---------- Prompts ----------
@mcp.prompt()
def diagnostico_incidencia(servicio: str) -> str:
    """Plantilla de diagnóstico de un servicio."""
    return (f"Diagnostica el servicio {servicio}: lee el recurso metricas://host, "
            f"consulta estado_servicio('{servicio}') y propone la causa raíz. "
            "No reinicies nada sin pedirme la confirmación exacta. "
            "Formato: Síntoma / Causa / Acción / Verificación.")

if __name__ == "__main__":
    transporte = sys.argv[1] if len(sys.argv) > 1 else "stdio"
    mcp.run(transport=transporte)` },
    { t: "2. Pruebas con pytest", d: "test_jro_ops.py: sin modelo y sin tocar el sistema (subprocess simulado).", lang: "Python", code: String.raw`import subprocess, pytest
import jro_ops

def test_select_valido():
    assert len(jro_ops.consulta_segura("SELECT * FROM pedidos")) > 0

@pytest.mark.parametrize("sql", ["DELETE FROM pedidos", "SELECT 1; DROP TABLE pedidos", "update x set a=1"])
def test_sql_peligroso(sql):
    with pytest.raises(ValueError):
        jro_ops.consulta_segura(sql)

def test_servicio_no_permitido():
    with pytest.raises(ValueError):
        jro_ops.reiniciar_servicio("ssh", "REINICIAR ssh")

def test_sin_confirmacion_no_ejecuta(monkeypatch):
    llamado = []
    monkeypatch.setattr(subprocess, "run", lambda *a, **k: llamado.append(a))
    assert "Falta la confirmación" in jro_ops.reiniciar_servicio("nginx", "sí, hazlo")
    assert llamado == []

def test_con_confirmacion_ejecuta(monkeypatch):
    class R: returncode = 0; stderr = ""
    llamadas = []
    monkeypatch.setattr(subprocess, "run", lambda args, **k: llamadas.append(args) or R())
    assert jro_ops.reiniciar_servicio("nginx", "REINICIAR nginx") == "Reiniciado correctamente"
    assert llamadas == [["sudo", "-n", "systemctl", "restart", "nginx"]]`, resultado: "pytest -q\n.......                                                    [100%]\n7 passed in 0.31s" },
    { t: "3. sudo limitado para el reinicio", d: "El usuario del servidor solo puede reiniciar esos tres servicios. Edita siempre con visudo.", lang: "Bash", code: String.raw`sudo useradd --system --create-home --shell /usr/sbin/nologin mcpops
sudo visudo -f /etc/sudoers.d/jro-ops
# contenido (una sola línea):
mcpops ALL=(root) NOPASSWD: /usr/bin/systemctl restart nginx, /usr/bin/systemctl restart tomcat, /usr/bin/systemctl restart postgresql
sudo -l -U mcpops`, resultado: "User mcpops may run the following commands:\n    (root) NOPASSWD: /usr/bin/systemctl restart nginx, ..." },
    { t: "4. Probar y registrar en Claude Code", d: "Modo stdio. Usa el resource y el prompt directamente.", lang: "Bash", code: String.raw`mcp dev jro_ops.py
claude mcp add --scope project jro-ops -- "$PWD/.venv/bin/python" jro_ops.py
# En Claude Code:
#   @jro-ops:metricas://host                          (añade el resource al contexto)
#   /mcp__jro-ops__diagnostico_incidencia nginx        (usa el prompt)` },
    { t: "5. Servirlo por Streamable HTTP", d: "En el servidor; en el cliente se registra por URL con el token.", lang: "Bash", code: String.raw`# servidor
python jro_ops.py streamable-http        # escucha en http://127.0.0.1:8000/mcp

# cliente (a través del proxy con TLS y token)
claude mcp add --transport http jro-ops-remoto https://ops.aula.jrotero.es/mcp \
  --header "Authorization: Bearer $JRO_OPS_TOKEN"` },
    { t: "6. Servicio systemd", d: "/etc/systemd/system/jro-ops.service", lang: "INI", code: String.raw`[Unit]
Description=Servidor MCP jro-ops
After=network.target

[Service]
User=mcpops
WorkingDirectory=/opt/jro-ops
ExecStart=/opt/jro-ops/.venv/bin/python jro_ops.py streamable-http
Restart=on-failure
ProtectSystem=strict
ReadWritePaths=/opt/jro-ops
PrivateTmp=true

[Install]
WantedBy=multi-user.target`, resultado: "sudo systemctl daemon-reload && sudo systemctl enable --now jro-ops\n● jro-ops.service - Servidor MCP jro-ops\n     Active: active (running)" },
    { t: "7. nginx con TLS y token", d: "Proxy que solo deja pasar peticiones con el token correcto.", lang: "nginx", code: String.raw`server {
    listen 443 ssl;
    server_name ops.aula.jrotero.es;
    ssl_certificate     /etc/ssl/aula/ops.crt;
    ssl_certificate_key /etc/ssl/aula/ops.key;

    location /mcp {
        if ($http_authorization != "Bearer CAMBIA_ESTE_TOKEN_LARGO") { return 401; }
        proxy_pass http://127.0.0.1:8000/mcp;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;          # necesario para las respuestas en streaming
    }
}`, nota: "El token real no se escribe en el repositorio: genéralo con openssl rand -hex 32 y guárdalo solo en el servidor." },
    { t: "8. Comprobar la autenticación", d: "Sin token debe responder 401.", lang: "Bash", code: String.raw`curl -sk -o /dev/null -w "%{http_code}\n" https://ops.aula.jrotero.es/mcp
curl -sk -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $JRO_OPS_TOKEN" \
  -H "Accept: application/json, text/event-stream" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"1"}}}' \
  https://ops.aula.jrotero.es/mcp`, resultado: "401\n200" }
  ],
  prompts: [
    { t: "Skill diagnostico-servicio", tipo: "SKILL.md", txt: `---
name: diagnostico-servicio
description: Diagnostica un servicio caído o lento usando el servidor MCP jro-ops. Úsala cuando digan que un servicio no responde, va lento o da errores.
---
1. Lee el recurso metricas://host.
2. Consulta estado_servicio del servicio afectado y usa el prompt diagnostico_incidencia.
3. Si propones reiniciar, pide al usuario que escriba exactamente "REINICIAR <servicio>" y pásalo en confirmacion.
4. Termina con un informe: síntoma, causa, acción, verificación.` },
    { t: "Generador de tools seguras", tipo: "Prompt", txt: `Escribe una tool FastMCP para {{acción}}.
Requisitos: type hints y docstring claros, lista blanca, sin shell=True, timeout, límite de salida, registro de auditoría y, si modifica el sistema, parámetro de confirmación explícita. Incluye sus tests con pytest.` },
    { t: "Revisión de seguridad de un servidor MCP", tipo: "Prompt", txt: `<codigo>{{servidor MCP}}</codigo>
Audítalo: ¿alguna tool permite ejecutar comandos o SQL arbitrario? ¿Hay escritura a stdout en modo stdio? ¿Se validan todos los parámetros, también los de las URI de resources? ¿Qué pasaría si un log contiene instrucciones maliciosas?` },
    { t: "Diseño de primitivas", tipo: "Prompt", txt: `Para el sistema {{sistema}}, clasifica estas capacidades en Resource / Tool / Prompt y asigna riesgo y protección: {{lista de capacidades}}. Devuelve la tabla y el esqueleto FastMCP.` }
  ],
  actividad: {
    dam: {
      t: "Resources y Tools de negocio con tests",
      d: "Añade a jro-ops (o a tu servidor) un Resource con el esquema completo de tu BBDD y una Tool de negocio con validación de parámetros y tests con pytest.",
      pasos: ["Resource de esquema con plantilla.", "Tool de negocio.", "Al menos 6 tests (válidos y ataques).", "Captura del Inspector."],
      entregables: ["Código y tests.", "Captura del Inspector mostrando las primitivas."],
      criterios: [["Primitivas correctas", 3], ["Validación y seguridad", 3], ["Tests (≥ 6, en verde)", 3], ["Documentación", 1]]
    },
    asir: {
      t: "Despliegue seguro por HTTP",
      d: "Despliega jro-ops como servicio systemd tras nginx con TLS (certificado del aula) y token Bearer. Comprueba que sin token devuelve 401.",
      pasos: ["Usuario mcpops y sudoers limitado.", "Unit de systemd con protecciones.", "nginx con TLS y token.", "Pruebas con curl con y sin token."],
      entregables: ["Ficheros de configuración (unit, nginx, sudoers).", "Pruebas con curl con y sin token.", "Auditoría tras un reinicio confirmado."],
      criterios: [["Privilegios mínimos", 3], ["TLS y autenticación", 4], ["Servicio robusto (systemd)", 2], ["Pruebas", 1]]
    }
  },
  test: [
    { p: "¿Qué hace @mcp.resource(\"esquema://{tabla}\")?", o: ["Crea una tabla", "Define un resource con plantilla cuyo parámetro llega como argumento", "Borra el esquema", "Define una tool"], c: 1, exp: "Las llaves de la URI se convierten en parámetros de la función." },
    { p: "¿Por qué la tool de reinicio pide 'REINICIAR <nombre>'?", o: ["Por estética", "Para que la acción requiera una confirmación que escribe el usuario", "Porque systemctl lo necesita", "Para gastar menos tokens"], c: 1, exp: "El modelo no debe poder ejecutar la acción sin que el usuario la confirme." },
    { p: "¿Dónde deben ir los logs de un servidor stdio?", o: ["stdout", "stderr o un fichero", "En la respuesta de la tool", "En el resource"], c: 1, exp: "stdout está reservado al protocolo." },
    { p: "¿Qué protege la línea de sudoers del taller?", o: ["Permite cualquier comando", "Solo permite reiniciar tres servicios concretos sin contraseña", "Desactiva sudo", "Da acceso a root"], c: 1, exp: "Privilegio mínimo: comando exacto y servicios concretos." },
    { p: "¿Cómo se prueban las tools sin el modelo?", o: ["No se puede", "Con pytest llamando a las funciones directamente", "Solo con Claude Code", "Con curl"], c: 1, exp: "Siguen siendo funciones de Python." },
    { p: "¿Para qué sirve monkeypatch en los tests?", o: ["Para acelerar Python", "Para simular subprocess y no tocar el sistema real", "Para cifrar", "Para conectar MCP"], c: 1, exp: "Sustituye subprocess.run por una función falsa." },
    { p: "¿En qué dirección debe escuchar jro-ops con HTTP?", o: ["0.0.0.0 sin protección", "127.0.0.1, detrás de un proxy con TLS", "Cualquier puerto público", "Solo IPv6"], c: 1, exp: "El exterior entra solo por el proxy que comprueba el token." },
    { p: "Sin el token Bearer, el proxy debe devolver…", o: ["200", "301", "401", "500"], c: 2, exp: "401 Unauthorized." },
    { p: "¿Qué directiva de nginx es necesaria para el streaming?", o: ["gzip on", "proxy_buffering off", "autoindex on", "client_max_body_size 0"], c: 1, exp: "Sin buffering las respuestas en streaming llegan en vivo." },
    { p: "¿Cómo se usa el prompt del servidor en Claude Code?", o: ["/mcp__jro-ops__diagnostico_incidencia", "@diagnostico", "#prompt", "claude prompt"], c: 0, exp: "Los prompts MCP aparecen como comandos /mcp__servidor__prompt." }
  ],
  faq: [
    { q: "El resource con {tabla} no aparece en la lista", a: "Los recursos con parámetros son plantillas (resource templates); algunos clientes las muestran aparte. Pruébalo en el Inspector, pestaña Resources → Templates." },
    { q: "La tool de reinicio dice 'sudo: a password is required'", a: "Falta la regla NOPASSWD en <code>/etc/sudoers.d/</code> o la ruta de <code>systemctl</code> no coincide (<code>which systemctl</code>)." },
    { q: "Connection refused al conectar por HTTP", a: "Por defecto escucha en 127.0.0.1:8000. Accede a través del proxy; nunca lo abras a 0.0.0.0 sin autenticación." },
    { q: "pytest no encuentra jro_ops", a: "Ejecuta pytest desde la carpeta del servidor o añade un <code>conftest.py</code> vacío; comprueba que tienda.db existe." },
    { q: "Las respuestas por HTTP llegan de golpe al final", a: "Falta <code>proxy_buffering off;</code> en nginx." },
    { q: "¿Puedo hacer el servidor en Java?", a: "Sí: existe un SDK oficial de MCP para Java (y soporte en Spring AI). Los conceptos y las protecciones son los mismos." }
  ]
};
