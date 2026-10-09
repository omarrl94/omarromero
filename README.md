# Exámenes · FP José Ramón Otero

Plataforma de exámenes online para el centro. Los alumnos **se registran con su correo del centro**, hacen los exámenes que publica el profesor y **reciben la corrección automáticamente por correo**. El profesor **sube los exámenes** (el mismo HTML de cuestionario de siempre), ve las notas, las revisa y las exporta a Excel.

Funciona en **Netlify** (plan gratuito): páginas estáticas + una Netlify Function + **Netlify Blobs** para guardar cuentas, exámenes y entregas. No hace falta base de datos.

## Páginas

| URL | Para | Qué hay |
|---|---|---|
| `/` | todos | Entrar · Crear cuenta (con código de verificación por correo) · Recuperar contraseña |
| `/panel/` | alumno | Elige **ciclo → módulo → tema**; exámenes pendientes y entregados con su nota |
| `/examen/?id=…` | alumno | El examen en modo examen; al entregar, nota + correo automático |
| `/trabajo/?id=…` | alumno | Entregar un trabajo (archivos de hasta 4 MB) y hacer su defensa |
| `/profesor/` | profesor | Subir y publicar exámenes, entregas y notas, revisión, CSV, alumnos, trabajos |

### Trabajos

El profesor crea un trabajo en un módulo (pestaña **Trabajos**) y el alumnado entrega sus archivos desde
`/trabajo/`. El navegador extrae el texto de los PDF, Word, PowerPoint, OpenDocument y código, y la IA lo
usa para preparar una **defensa**: preguntas personalizadas sobre el trabajo de ese alumno (test y abiertas),
que el profesor revisa y envía. La defensa es un examen privado (solo lo ve ese alumno, un intento y modo seguro).
Nota final = trabajo × peso + defensa × (100 − peso), o la que ponga el profesor a mano. Aparece también
en la pestaña Grupos y en sus exportaciones.

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
- **Profesor**: se registra en la página principal eligiendo **«Profesor/a»** y marcando los ciclos en los que da clase (correo `@jrotero.es` confirmado con código). Hasta que el administrador lo aprueba ve un aviso de «pendiente». Una vez aprobado, en `/profesor/` crea, sube y genera exámenes con IA **en sus ciclos**, y **solo ve y gestiona los exámenes que ha creado él** (publicarlos, entregas y notas, revisión, CSV). También gestiona a los alumnos de sus ciclos (cambiar grupo, activar, borrar). El administrador ve todos los exámenes. El servidor lo comprueba en cada petición.

**Panel del profesor** (`/profesor/`)
- **Acceso**: entra desde la página principal con su correo y `ADMIN_PASSWORD`; la cuenta se crea sola, sin registro ni código.
- **Subir examen**: arrastra el HTML del cuestionario (con los arrays `MC` y `OPEN`) o un JSON, elige **ciclo, módulo y orden** del tema, y guarda.
- **✨ Generar con IA**: sube las diapositivas (.pptx), un PDF o un Word del tema, elige ciclo, módulo y cuántas preguntas quieres, y la IA (Google Gemini) redacta las preguntas tipo test y abiertas con sus soluciones y conceptos clave. Se muestran para **revisarlas y quitar** las que no convenzan, y el examen se guarda **sin publicar**. Necesita `GEMINI_API_KEY`.
- **Adaptar examen de Word** (en «✨ Generar con IA», o arrastrando un .docx a «Subir examen»): sube el examen y, si lo tienes, el solucionario. La IA lo pasa a la plataforma tal cual —test (también con nivel de confianza), preguntas abiertas con su rúbrica y ejercicios con sus resultados y figuras— y lo revisas antes de guardar.
- **Probar**: abre el examen como lo verá el alumno, aunque no esté publicado.
- **Publicado**: interruptor para mostrarlo u ocultarlo a los alumnos.
- **🔒 Modo seguro** (activado por defecto): si el alumno cambia de pestaña, minimiza o sale de la ventana, **el examen termina y se entrega solo** con lo que llevaba respondido, y no puede volver a empezarlo (el profesor puede «Reabrir»). En las entregas aparece «Finalizado al salir» y en el correo del alumno se indica. Si se desactiva, el examen sigue abierto aunque salga, pero cada salida queda registrada.
- **Corrección visible**: si se desactiva, el alumno solo ve su nota y sus respuestas (en pantalla y en el correo), sin las soluciones.
- **Entregas**: tabla por alumno con nota automática, nota final, salidas de la ventana y fecha; filtro por grupo y media.
- **Ver / revisar**: respuestas completas, **nota revisada** y **comentario** para el alumno (lo ve en su panel).
- **Reabrir**: borra la entrega de un alumno para que pueda repetir el examen.
- **Exportar notas**: CSV que se abre directamente en Excel.
- **Alumnos**: cuentas registradas, cambiar grupo, activar cuentas sin confirmar, borrar.

### Seguridad
- Las **soluciones nunca llegan al navegador** antes de entregar; la corrección se hace en el servidor.
- Contraseñas con **scrypt**; sesión en cookie **HttpOnly** firmada (12 h); bloqueo temporal tras 8 intentos fallidos.
- El alumnado puede registrarse con cualquier correo (del centro o personal) y su nombre completo; el profesorado, solo con correos de `DOMINIOS_PERMITIDOS`. El correo se verifica siempre con un código.
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

Un examen puede tener hasta tres partes; cada pregunta vale `puntos` (1 si no se indica) y la nota es *puntos obtenidos / puntos posibles × 10*.

```js
// Parte A · Test
mc: [{ t: "Pregunta", o: ["opción a", "opción b", "opción c"], c: 1, puntos: 0.4, exp: "justificación" }]
confianza: true   // opcional: test con nivel de confianza (Muy seguro ±100 % · Seguro +70/−50 % · Poco seguro +50/−30 %; la parte no baja de 0)

// Parte B · Abiertas: conceptos clave (raíces sin tildes) para «Bien»/«Casi»…
open: [{ t: "Pregunta abierta", groups: [["salud", "medic"], ["biometr"]], full: 2, partial: 1, exp: "Lo que se esperaba",
         puntos: 0.4, pesos: [0.2, 0.2] }]   // …o rúbrica: puntos de cada concepto mencionado

// Parte C · Ejercicios: apartados con resultados numéricos (tolerancia en %) u opciones cerradas
num: [{ t: "a) Calcula la intensidad", puntos: 0.2, bloque: "ej1", exp: "I = V/R = 5 A",
        campos: [{ etiqueta: "Intensidad", tipo: "numero", valor: 5, unidad: "A", tolerancia: 2 },
                 { etiqueta: "Tipo de fuerza", tipo: "opcion", opciones: ["Atracción", "Repulsión"], correcta: 0 }] }]
bloques: [{ id: "ej1", titulo: "Ejercicio 1", texto: "Datos comunes…", imagen: "data:image/png;base64,…" }]
partes: { mc: "Test con nivel de confianza", open: "Definiciones", num: "Ejercicios" }   // títulos de las partes
```

En los ejercicios, el alumno escribe solo el resultado: se acepta coma o punto decimal, miles con punto, notación científica (`1,872·10^21`, `1.872e21`) y unidades con prefijo (`1,15 kW` cuando se espera W). Se corrige el resultado final, no el desarrollo: el profesor puede ajustar la nota en «Ver / revisar».

Exámenes de ejemplo incluidos: ASIR › SAD › Temas 1 y 2 · DAM › IA › Tema 1 · **SEA › Fundamentos de la Electricidad › Examen Temas 1 y 2** (adaptado del Word: test con confianza, definiciones con rúbrica y 3 ejercicios con figuras).

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
public/trabajo/                Entrega de un trabajo (alumno)
public/assets/extraer.js       Texto de los archivos entregados (para la defensa)
public/assets/app.css|app.js   Estilos y utilidades comunes (incluye el PDF)
netlify/functions/api.mjs      API (/api/*)
netlify/lib/catalogo.mjs       Ciclos y módulos
netlify/lib/rutas-*.mjs        Rutas: cuenta, alumno, profesor, admin, trabajos
netlify/lib/auth.mjs           Contraseñas, sesiones y códigos
netlify/lib/almacen.mjs        Netlify Blobs (o carpeta local)
netlify/lib/correccion.mjs     Corrección automática
netlify/lib/correo.mjs         Envío por SMTP o Resend
netlify/lib/ia.mjs             Generación de preguntas con IA (Gemini o Claude)
netlify/lib/plantillas.mjs     Correos (código y resultado)
```
