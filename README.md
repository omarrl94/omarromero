# Exámenes · FP José Ramón Otero

Plataforma de exámenes online para el centro. Los alumnos **se registran con su correo del centro**, hacen los exámenes que publica el profesor y **reciben la corrección automáticamente por correo**. El profesor **sube los exámenes** (el mismo HTML de cuestionario de siempre), ve las notas, las revisa y las exporta a Excel.

Funciona en **Netlify** (plan gratuito): páginas estáticas + una Netlify Function + **Netlify Blobs** para guardar cuentas, exámenes y entregas. No hace falta base de datos.

## Páginas

| URL | Para | Qué hay |
|---|---|---|
| `/` | todos | Entrar · Crear cuenta (con código de verificación por correo) · Recuperar contraseña |
| `/panel/` | alumno | Elige **ciclo → módulo → tema**; exámenes pendientes y entregados con su nota |
| `/examen/?id=…` | alumno | El examen en modo examen; al entregar, nota + correo automático |
| `/profesor/` | profesor | Subir y publicar exámenes, entregas y notas, revisión, CSV, alumnos |

## Cómo funciona

**Alumno**
1. Se registra en `/` con nombre, apellidos, correo `@jrotero.es`, contraseña y **grupo** (1.º/2.º ASIR, 1.º/2.º DAM…). **El grupo fija su ciclo: solo verá los exámenes de ese ciclo** (también lo comprueba el servidor, aunque tenga el enlace directo). El profesor puede cambiarle el grupo en la pestaña «Alumnos».
2. Recibe un **código de 6 cifras** por correo para confirmar que el correo es suyo.
3. En su panel entra directamente en **su ciclo**, elige **el módulo** (p. ej. Seguridad y Alta Disponibilidad) y ve **los temas** publicados. Cada examen se **entrega una sola vez**.
4. Hace el examen en **modo examen**: si cambia de pestaña o sale de la ventana, se cierra y se borran las respuestas. **Cada salida queda registrada** para el profesor.
5. Al entregar, el servidor corrige, guarda la entrega y **envía el correo** con la nota y la corrección (con copia oculta al profesor si se configura `PROFESOR_EMAIL`).
6. Puede volver a ver su corrección y descargar el PDF desde el panel en cualquier momento.

**Profesores y administrador**
- **Administrador** (`ADMIN_EMAILS`): acceso a todo y pestaña **«Profesores»** para aprobar solicitudes, quitar el acceso y decidir a qué ciclos tiene acceso cada profesor. Recibe un correo cuando alguien se registra como profesor.
- **Profesor**: se registra en la página principal eligiendo **«Profesor/a»** y marcando los ciclos en los que da clase (correo `@jrotero.es` confirmado con código). Hasta que el administrador lo aprueba ve un aviso de «pendiente». Una vez aprobado, en `/profesor/` **solo ve y gestiona lo de sus ciclos**: crear, subir y generar exámenes con IA, publicarlos, entregas y notas, revisión, CSV y sus alumnos (cambiar grupo, activar, borrar). El servidor lo comprueba en cada petición.

**Panel del profesor** (`/profesor/`)
- **Acceso**: entra desde la página principal con su correo y `ADMIN_PASSWORD`; la cuenta se crea sola, sin registro ni código.
- **Subir examen**: arrastra el HTML del cuestionario (con los arrays `MC` y `OPEN`) o un JSON, elige **ciclo, módulo y orden** del tema, y guarda.
- **✨ Generar con IA**: sube las diapositivas (.pptx), un PDF o un Word del tema, elige ciclo, módulo y cuántas preguntas quieres, y la IA (Google Gemini) redacta las preguntas tipo test y abiertas con sus soluciones y conceptos clave. Se muestran para **revisarlas y quitar** las que no convenzan, y el examen se guarda **sin publicar**. Necesita `GEMINI_API_KEY`.
- **Probar**: abre el examen como lo verá el alumno, aunque no esté publicado.
- **Publicado**: interruptor para mostrarlo u ocultarlo a los alumnos.
- **Corrección visible**: si se desactiva, el alumno solo ve su nota y sus respuestas (en pantalla y en el correo), sin las soluciones.
- **Entregas**: tabla por alumno con nota automática, nota final, salidas de la ventana y fecha; filtro por grupo y media.
- **Ver / revisar**: respuestas completas, **nota revisada** y **comentario** para el alumno (lo ve en su panel).
- **Reabrir**: borra la entrega de un alumno para que pueda repetir el examen.
- **Exportar notas**: CSV que se abre directamente en Excel.
- **Alumnos**: cuentas registradas, cambiar grupo, activar cuentas sin confirmar, borrar.

### Seguridad
- Las **soluciones nunca llegan al navegador** antes de entregar; la corrección se hace en el servidor.
- Contraseñas con **scrypt**; sesión en cookie **HttpOnly** firmada (12 h); bloqueo temporal tras 8 intentos fallidos.
- Solo se aceptan correos de `DOMINIOS_PERMITIDOS`, y el correo se verifica con un código.
- La API solo acepta JSON en las peticiones que modifican datos (protección CSRF).

## Puesta en marcha en Netlify

1. **Crear el sitio**: Netlify → *Add new site → Import an existing project* → GitHub → repositorio `omarrl94/omarromero` → rama **`examenes`**. No hay que cambiar nada: `netlify.toml` ya indica la carpeta `public` y las funciones.
2. **Variables de entorno** (*Site configuration → Environment variables*), ver `.env.example`:

   | Variable | Obligatoria | Ejemplo |
   |---|---|---|
   | `ADMIN_EMAILS` | **sí** | `omar.romero@jrotero.es` (varios separados por comas) |
   | `ADMIN_PASSWORD` | **sí** | contraseña del profesor (márcala como *secret*) |
   | `SMTP_HOST` / `SMTP_PORT` | para correo | `smtp.office365.com` / `587` |
   | `SMTP_USER` / `SMTP_PASS` | para correo | cuenta que envía, p. ej. `examenes@jrotero.es` |
   | `MAIL_FROM` | para correo | `"Exámenes FP José Ramón Otero <examenes@jrotero.es>"` |
   | `PROFESOR_EMAIL` | no | recibe copia oculta de cada entrega |
   | `DOMINIOS_PERMITIDOS` | no | `jrotero.es` (por defecto) |
   | `GEMINI_API_KEY` | para la IA | clave gratuita de aistudio.google.com/apikey (márcala como *secret*) |
   | `GEMINI_MODEL` | no | `gemini-2.5-flash` (por defecto; si no existe, se usa el Flash más reciente disponible) |

3. **Redesplegar** (*Deploys → Trigger deploy*) para que coja las variables.
4. Entra en la web con el correo de `ADMIN_EMAILS` y la contraseña de `ADMIN_PASSWORD` (pestaña «Entrar», sin registrarte) y llegarás al panel del profesor. El examen de **ASIR › Seguridad y Alta Disponibilidad › Temas 1 y 2** ya aparece cargado y publicado.

**Microsoft 365:** la cuenta que envía debe tener activado *SMTP autenticado* (Centro de administración → Usuarios → la cuenta → Correo → Administrar aplicaciones de correo electrónico). Si el centro obliga a MFA, usa una cuenta de servicio sin MFA o **Resend** (`RESEND_API_KEY`).

**Sin correo configurado** todo funciona igual, salvo que las cuentas se activan sin código, no se puede recuperar la contraseña por correo y no se envía la corrección (el alumno la ve en pantalla y en su panel). El panel del profesor muestra un aviso.

## Ciclos y módulos

Los **ciclos** del centro están en `netlify/lib/catalogo.mjs`:

| Ciclo | Nombre | Grado |
|---|---|---|
| SEA | Sistemas Electrotécnicos y Automatizados | GS |
| DAM | Desarrollo de Aplicaciones Multiplataforma | GS |
| ASIR | Administración de Sistemas Informáticos en Red | GS |
| DAW | Desarrollo de Aplicaciones Web | GS |
| IEA | Instalaciones Eléctricas y Automáticas | GM |
| Comercio | Actividades Comerciales | GM |
| Gestión Adm. | Gestión Administrativa | GM |
| AYF | Administración y Finanzas | GS |
| AUT | Automoción (todos los ciclos de automoción) | GM y GS |

Los grupos del registro de alumnos se generan solos (1.º y 2.º de cada ciclo, `CURSOS`); AUT tiene sus propios grupos: 1.º/2.º de GM y 1.º/2.º de GS. Para añadir un ciclo, añade una línea en `CICLOS` (con un `id` nuevo que no cambie nunca) y haz push.

Los **módulos** los crean el administrador y los profesores desde el panel (botón **«Módulos»**), cada uno en sus ciclos; se guardan en Netlify Blobs. Solo se pueden borrar los módulos sin exámenes. Vienen de serie: ASIR › Seguridad y Alta Disponibilidad y DAM › Inteligencia Artificial.

Los exámenes que vienen con la plataforma están en `netlify/lib/semilla-*.mjs` y se cargan **una sola vez** al desplegar; si los borras o editas desde el panel, no se vuelven a crear.

## Formato de un examen

El mismo de los HTML de cuestionario (también se puede subir como JSON; en el panel hay una plantilla):

```js
mc:   [{ t: "Pregunta", o: ["opción a", "opción b", "opción c", "opción d"], c: 1 }]   // c = índice de la correcta
open: [{ act: "Actividad 1", t: "Pregunta abierta",
         groups: [["salud", "medic"], ["biometr", "huella"]],   // conceptos clave (raíces, sin tildes)
         full: 2, partial: 1,                                     // conceptos para «Bien» / «Casi»
         exp: "Lo que se esperaba" }]
```

Nota: cada pregunta vale 1 punto (abiertas: Bien 1 · Casi 0,5), sobre 10.

## Desarrollo local

```bash
npm install
npm test        # http://localhost:8888
```

Guarda los datos en `.datos/` y **no envía correos**: los imprime en la consola (incluidos los códigos de verificación). Profesor de prueba: `profesor@jrotero.es` / `profesor-local`.

## Estructura

```
public/index.html              Inicio: entrar / crear cuenta
public/panel/                  Panel del alumno
public/examen/                 Página del examen
public/profesor/               Panel del profesor
public/assets/app.css|app.js   Estilos y utilidades comunes (incluye el PDF)
netlify/functions/api.mjs      API (/api/*)
netlify/lib/catalogo.mjs       Ciclos y módulos
netlify/lib/rutas-*.mjs        Rutas: cuenta, alumno, profesor
netlify/lib/auth.mjs           Contraseñas, sesiones y códigos
netlify/lib/almacen.mjs        Netlify Blobs (o carpeta local)
netlify/lib/correccion.mjs     Corrección automática
netlify/lib/correo.mjs         Envío por SMTP o Resend
netlify/lib/ia.mjs             Generación de preguntas con IA (Gemini o Claude)
netlify/lib/plantillas.mjs     Correos (código y resultado)
```
