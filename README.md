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

**Profesor** (`/profesor/`, solo los correos de `ADMIN_EMAILS`)
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
   | `GEMINI_MODEL` | no | `gemini-2.5-flash` (por defecto) |

3. **Redesplegar** (*Deploys → Trigger deploy*) para que coja las variables.
4. Entra en la web con el correo de `ADMIN_EMAILS` y la contraseña de `ADMIN_PASSWORD` (pestaña «Entrar», sin registrarte) y llegarás al panel del profesor. El examen de **ASIR › Seguridad y Alta Disponibilidad › Temas 1 y 2** ya aparece cargado y publicado.

**Microsoft 365:** la cuenta que envía debe tener activado *SMTP autenticado* (Centro de administración → Usuarios → la cuenta → Correo → Administrar aplicaciones de correo electrónico). Si el centro obliga a MFA, usa una cuenta de servicio sin MFA o **Resend** (`RESEND_API_KEY`).

**Sin correo configurado** todo funciona igual, salvo que las cuentas se activan sin código, no se puede recuperar la contraseña por correo y no se envía la corrección (el alumno la ve en pantalla y en su panel). El panel del profesor muestra un aviso.

## Ciclos y módulos

Se definen en `netlify/lib/catalogo.mjs`. Ahora mismo:

- **ASIR** — Administración de Sistemas Informáticos en Red
  - Seguridad y Alta Disponibilidad (`sad`) · Temas 1 y 2
- **DAM** — Desarrollo de Aplicaciones Multiplataforma
  - Inteligencia Artificial (`ia`) · Tema 1 · Introducción a la IA

Para añadir otro ciclo o módulo basta con añadir una línea en ese archivo (y hacer push). Los grupos del registro se generan solos a partir de los ciclos (`CURSOS`: 1.º y 2.º).

Los exámenes que vienen con la plataforma están en `netlify/lib/semilla-*.mjs` y se cargan **una sola vez** al desplegar; si los borras o editas desde el panel, no se vuelven a crear.

## Generar exámenes con IA

- El **navegador del profesor** extrae el texto del archivo (diapositivas con sus notas del orador, PDF o Word); al servidor solo llega el texto. Las diapositivas que son solo imágenes no aportan contenido.
- El servidor pide las preguntas a **Google Gemini** (`GEMINI_API_KEY`, modelo `GEMINI_MODEL`, por defecto `gemini-2.5-flash`) en **lotes** de 10 tipo test o 5 abiertas, para no superar el límite de tiempo de las funciones de Netlify ni el de peticiones por minuto del plan gratuito; el panel muestra el progreso y, si se alcanza el límite, espera 30 s y repite. Si en lugar de Gemini se configura `ANTHROPIC_API_KEY`, usa Claude (`claude-opus-5-5`) con lotes de 5 y 3.
- La respuesta llega en JSON con esquema fijo; el servidor descarta preguntas mal formadas, **baraja las opciones** (la correcta queda repartida entre a/b/c/d) y normaliza los conceptos clave.
- Coste: con el plan gratuito de Gemini, 0 € (tiene límites de peticiones por minuto y por día; un examen son unas 5 peticiones). En el plan gratuito, Google puede usar el contenido enviado para mejorar sus productos: envía material del curso, nunca datos de alumnos. El consumo de cada lote aparece en los logs de la función (`ia-lote`).
- Para cambiar el estilo de las preguntas, edita el texto `SISTEMA` en `netlify/lib/ia.mjs`, o usa el campo «Indicaciones para la IA» del panel.

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
