# Exámenes · FP José Ramón Otero

Cuestionarios online con **corrección en el servidor** y **envío automático de la corrección al correo del alumno** (con copia oculta al profesor). Se despliega en **Netlify** (sitio estático + Netlify Functions).

## Qué hace

1. El alumno entra en `/examen/?id=sad-temas-1-2`, escribe nombre, **correo del centro** (`@jrotero.es`) y grupo.
2. Hace el examen en **modo examen** (si cambia de pestaña o sale de la ventana, se cierra y se borran las respuestas).
3. Al pulsar **Entregar**, el servidor corrige y **envía automáticamente un correo** al alumno con su nota, sus respuestas y la corrección. El profesor recibe **copia oculta** de cada entrega.
4. El alumno ve la nota, la corrección y puede **descargar el PDF** para Teams.

### Mejoras respecto al HTML original

| Antes | Ahora |
|---|---|
| Las soluciones estaban dentro del HTML (visibles con «Ver código fuente») | Las soluciones solo están en el servidor; el navegador las recibe **después** de entregar |
| `mailto:` abría el cliente de correo del alumno y había que pulsar Enviar | El correo se envía **solo**, desde el servidor |
| El profesor no se enteraba de las entregas | **CCO al profesor** de cada entrega + registro en los logs de Netlify |
| Cualquier correo | Solo dominios del centro (evita usar el formulario para spam) |
| Se podía «Repetir» tras ver las soluciones | Sin botón de repetir tras la entrega |
| Un solo examen fijo | Portada con listado y varios exámenes por `?id=` |

## Estructura

```
public/index.html                  Portada con el listado de exámenes
public/examen/index.html           Página del examen (genérica)
netlify/functions/examen.mjs       GET  /api/examen   → enunciado SIN soluciones
netlify/functions/entregar.mjs     POST /api/entregar → corrige + envía correo
netlify/lib/examenes/*.mjs         Preguntas y soluciones (solo servidor)
netlify/lib/correo.mjs             Envío por SMTP o Resend
netlify/lib/plantilla-correo.mjs   Diseño del correo
```

## Configurar el correo (obligatorio para el envío)

En Netlify: **Site configuration → Environment variables** (ver `.env.example`):

| Variable | Ejemplo |
|---|---|
| `SMTP_HOST` / `SMTP_PORT` | `smtp.office365.com` / `587` |
| `SMTP_USER` / `SMTP_PASS` | cuenta que envía (p. ej. `examenes@jrotero.es`) |
| `MAIL_FROM` | `"Exámenes FP José Ramón Otero <examenes@jrotero.es>"` |
| `PROFESOR_EMAIL` | recibe copia oculta de cada entrega |
| `DOMINIOS_PERMITIDOS` | `jrotero.es` |

**Microsoft 365:** la cuenta remitente debe tener activado *SMTP autenticado* (Centro de administración de Microsoft 365 → Usuarios → la cuenta → Correo → Administrar aplicaciones de correo electrónico → «SMTP autenticado»). Si el centro tiene MFA obligatorio, usa una cuenta de servicio sin MFA o la opción **Resend** (`RESEND_API_KEY`).

Si no hay correo configurado el examen funciona igual: el alumno ve un aviso y descarga el PDF.

## Desplegar en Netlify

**Opción 1 — desde GitHub (recomendada):** Netlify → *Add new site → Import from Git* → este repositorio → rama **`examenes`**. Netlify lee `netlify.toml` (publish `public`, funciones `netlify/functions`). Cada `git push` a la rama redepliega.

**Opción 2 — desde la terminal:**

```bash
npm install
NETLIFY_AUTH_TOKEN=... NETLIFY_SITE_ID=... npm run deploy
```

## Probar en local

```bash
npm install
MAIL_MODE=log PROFESOR_EMAIL=profe@jrotero.es npm test   # http://localhost:8888
```

Con `MAIL_MODE=log` no se envía nada: el correo se imprime en la consola.

## Añadir un examen

1. Copia `netlify/lib/examenes/sad-temas-1-2.mjs` con otro `id`, preguntas y soluciones.
2. Regístralo en `netlify/lib/examenes/index.mjs`.
3. Comparte `https://TU-SITIO.netlify.app/examen/?id=<id>`.
