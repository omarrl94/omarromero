# evalua-T

**evalua-T** es una plataforma de exámenes online para centros educativos. Los alumnos **se registran con su correo del centro**, hacen los exámenes que publica el profesor y **reciben la corrección automáticamente por correo**. El profesor **sube los exámenes** (HTML de cuestionario, JSON o Word, o los genera con IA), ve las notas, las revisa y las exporta a Excel.

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
1. Se registra en `/` con nombre, apellidos, correo de un dominio permitido, contraseña y **grupo** (los que el centro ha definido para cada ciclo). **El grupo fija su ciclo: solo verá los exámenes de ese ciclo** (también lo comprueba el servidor, aunque tenga el enlace directo). El profesor puede cambiarle el grupo en la pestaña «Alumnos».
2. Recibe un **código de 6 cifras** por correo para confirmar que el correo es suyo.
3. En su panel entra directamente en **su ciclo**, elige **el módulo** (p. ej. Bases de Datos) y ve **los temas** publicados. Cada examen se **entrega una sola vez**.
4. Hace el examen en **modo examen**: si cambia de pestaña o sale de la ventana, se cierra y se borran las respuestas. **Cada salida queda registrada** para el profesor.
5. Al entregar, el servidor corrige, guarda la entrega y **envía el correo** con la nota y la corrección (con copia oculta al profesor si se configura `PROFESOR_EMAIL`).
6. Puede volver a ver su corrección y descargar el PDF desde el panel en cualquier momento.

**Profesores y administrador**
- **Administrador** (`ADMIN_EMAILS`): acceso a todo, pestaña **«Centro»** para configurar el centro, sus ciclos y módulos, y pestaña **«Profesores»** para aprobar solicitudes, quitar el acceso y decidir a qué ciclos tiene acceso cada profesor. Recibe un correo cuando alguien se registra como profesor.
- **Profesor**: se registra en la página principal eligiendo **«Profesor/a»** y marcando los ciclos en los que da clase (correo confirmado con código). Hasta que el administrador lo aprueba ve un aviso de «pendiente». Una vez aprobado, en `/profesor/` crea, sube y genera exámenes con IA **en sus ciclos**, y **solo ve y gestiona los exámenes que ha creado él** (publicarlos, entregas y notas, revisión, CSV). También gestiona a los alumnos de sus ciclos (cambiar grupo, activar, borrar). El administrador ve todos los exámenes. El servidor lo comprueba en cada petición.

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
- Solo se aceptan correos de `DOMINIOS_PERMITIDOS`, y el correo se verifica con un código.
- La API solo acepta JSON en las peticiones que modifican datos (protección CSRF).

## Puesta en marcha en Netlify

1. **Crear el sitio**: Netlify → *Add new site → Import an existing project* → GitHub → tu repositorio con evalua-T. No hay que cambiar nada: `netlify.toml` ya indica la carpeta `public` y las funciones.
2. **Variables de entorno** (*Site configuration → Environment variables*), ver `.env.example`:

   | Variable | Obligatoria | Ejemplo |
   |---|---|---|
   | `ADMIN_EMAILS` | **sí** | `admin@tucentro.es` (varios separados por comas) |
   | `ADMIN_PASSWORD` | **sí** | contraseña del profesor (márcala como *secret*) |
   | `SMTP_HOST` / `SMTP_PORT` | para correo | `smtp.office365.com` / `587` |
   | `SMTP_USER` / `SMTP_PASS` | para correo | cuenta que envía, p. ej. `examenes@tucentro.es` |
   | `MAIL_FROM` | para correo | `"evalua-T <examenes@tucentro.es>"` |
   | `PROFESOR_EMAIL` | no | recibe copia oculta de cada entrega |
   | `DOMINIOS_PERMITIDOS` | no | `tucentro.es` (varios separados por comas; por defecto `*`, cualquier dominio) |
   | `GEMINI_API_KEY` | para la IA | clave gratuita de aistudio.google.com/apikey (márcala como *secret*) |
   | `GEMINI_MODEL` | no | `gemini-2.5-flash` (por defecto; si no existe, se usa el Flash más reciente disponible) |

3. **Redesplegar** (*Deploys → Trigger deploy*) para que coja las variables.
4. Entra en la web con el correo de `ADMIN_EMAILS` y la contraseña de `ADMIN_PASSWORD` (pestaña «Entrar», sin registrarte) y llegarás al panel del profesor, en la pestaña **«Centro»**, para configurar tu centro (ver abajo).

**Microsoft 365:** la cuenta que envía debe tener activado *SMTP autenticado* (Centro de administración → Usuarios → la cuenta → Correo → Administrar aplicaciones de correo electrónico). Si la organización obliga a MFA, usa una cuenta de servicio sin MFA o **Resend** (`RESEND_API_KEY`).

**Sin correo configurado** todo funciona igual, salvo que las cuentas se activan sin código, no se puede recuperar la contraseña por correo y no se envía la corrección (el alumno la ve en pantalla y en su panel). El panel del profesor muestra un aviso.

## Primera puesta en marcha: centro, ciclos y módulos

Cada centro configura evalua-T desde el panel, sin tocar el código. La primera vez que el administrador entra, se abre la pestaña **«Centro»**:

1. **Nombre del centro**: aparece en la cabecera, en la página de entrada y en los correos.
2. **Ciclos** (o cursos, niveles…): nombre corto (p. ej. `DAM`, `4.º ESO`), nivel o grado opcional, nombre completo y **grupos**. Si no escribes grupos se crean «1.º NOMBRE» y «2.º NOMBRE». Los alumnos eligen su grupo al registrarse y **solo ven los exámenes de su ciclo**; los profesores marcan los ciclos en los que dan clase.
3. **Módulos** (asignaturas) de cada ciclo: se pueden escribir al crear el ciclo (separados por comas) o añadir después. Los profesores también pueden crear módulos en sus ciclos con el botón **«Módulos»**.

Los ciclos se pueden editar en cualquier momento. Solo se pueden borrar los ciclos sin exámenes ni alumnos, y los módulos sin exámenes. Todo se guarda en Netlify Blobs (almacén `sistema`).

Si quieres que la plataforma venga con exámenes cargados, créalos en `netlify/lib/semilla-*.mjs` y añádelos a `SEMILLAS` en `netlify/lib/examenes.mjs`: se cargan **una sola vez**; si los borras o editas desde el panel, no se vuelven a crear.

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

## Desarrollo local

```bash
npm install
npm test        # http://localhost:8888
```

Guarda los datos en `.datos/` y **no envía correos**: los imprime en la consola (incluidos los códigos de verificación). Profesor de prueba: `profesor@evalua-t.local` / `profesor-local`.

## Estructura

```
public/index.html              Inicio: entrar / crear cuenta
public/panel/                  Panel del alumno
public/examen/                 Página del examen
public/profesor/               Panel del profesor
public/assets/app.css|app.js   Estilos y utilidades comunes (incluye el PDF)
netlify/functions/api.mjs      API (/api/*)
netlify/lib/catalogo.mjs       Centro, ciclos y módulos (configurables desde el panel)
netlify/lib/rutas-*.mjs        Rutas: cuenta, alumno, profesor, admin
netlify/lib/auth.mjs           Contraseñas, sesiones y códigos
netlify/lib/almacen.mjs        Netlify Blobs (o carpeta local)
netlify/lib/correccion.mjs     Corrección automática
netlify/lib/correo.mjs         Envío por SMTP o Resend
netlify/lib/ia.mjs             Generación de preguntas con IA (Gemini o Claude)
netlify/lib/plantillas.mjs     Correos (código y resultado)
```
