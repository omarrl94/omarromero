# Guía para añadir o revisar empresas

**Regla de oro:** los correos **nunca se escriben a mano**. Los extrae el script de la web de la empresa.
Si alguien te pasa un correo (un antiguo alumno, un anuncio de Indeed…), **no lo añadas**: añade la empresa
como candidata y deja que el script compruebe qué publica la propia empresa.

## Añadir una empresa

1. Abre `data/empresas.candidatas.json` y añade un objeto así:

   ```json
   {
     "id": "nombre-en-minusculas-con-guiones",
     "nombre": "Nombre comercial",
     "web": "https://www.empresa.es",
     "sector": "Desarrollo de software para logística",
     "tamano": "pyme",
     "zona": "sur",
     "direccion": "Getafe (opcional)",
     "perfiles": ["dam-web", "dam-backend"],
     "motivoEncaje": "Por qué encaja con DAM/ASIR, en una o dos frases.",
     "paginasContacto": ["https://www.empresa.es/trabaja-con-nosotros"],
     "tipoContactoEsperado": "general",
     "programaPracticasUrl": "https://www.empresa.es/becas (solo si la EMPRESA lo publica)"
   }
   ```

   - `tamano`: `pyme`, `consultora`, `startup` o `gran-empresa`.
   - `zona` y `perfiles`: los identificadores de `config/ffe.config.ts` (por ejemplo, `madrid`, `norte` o `asir-cloud`).
   - `paginasContacto`: páginas **oficiales** donde suele estar el correo o el formulario (contacto, empleo, aviso legal). Si no las conoces, pon la portada: el script sigue los enlaces.
   - `programaPracticasUrl`: solo si la empresa publica un programa de prácticas o becas. El script comprueba que la página lo menciona. Si no lo pones, la empresa aparece como **candidatura espontánea**.

2. Verifica solo esa empresa:

   ```bash
   npm run verificar:empresas -- --solo=nombre-en-minusculas-con-guiones
   ```

3. Lee la salida y `docs/INFORME-VERIFICACION.md`:
   - ✔ **válida**: comprueba en el navegador que el correo aparece en la URL de la fuente y que es un buzón para candidaturas.
   - ✖ **descartada**: el motivo explica por qué (sin correo válido, sin formulario, web caída…).

4. `npm run check` y commit.

## Revisar el directorio (recomendado cada trimestre y antes de cada periodo de FFE)

```bash
npm run verificar:empresas      # vuelve a verificar todas las candidatas desde cero
npm run auditar:muestra         # 10 empresas al azar, comprobación independiente
npm run comprobar:enlaces       # enlaces rotos y portales
```

Revisa el diff de `data/empresas.json` antes de hacer commit. Si una empresa cambia de correo, lo verás.

## Qué hace el verificador (y qué no)

Se ejecuta en GitHub Actions (necesita Internet, el puerto 25 y Chromium): `npm run verificar:empresas -- --smtp --navegador`.

| Comprueba | No comprueba (revisión humana) |
|---|---|
| Que la web responde (con y sin «www»; si la portada bloquea robots, su portal de empleo del mismo dominio) | Que la empresa sigue activa en el Registro Mercantil (BORME) |
| Que la web es de la empresa (su nombre está en el dominio o en la portada) y menciona la Comunidad de Madrid | Que el sector, el tamaño y la zona son correctos |
| Que el correo aparece literalmente en su **página de empleo o de contacto** (no en la portada, un artículo, el blog ni el aviso legal) | Que la empresa acoge alumnado de FP (pregúntalo en el primer correo) |
| Que el correo es del mismo dominio, genérico, no de otro país y no de privacidad, prensa o ventas | |
| Que el dominio tiene MX y que **su servidor de correo no dice que el buzón no exista** (RCPT TO, sin enviar nada) | |
| Que el correo no ha rebotado nunca (`data/correos-rebotados.json`) | |
| Que el formulario es **real** al cargar la página en Chromium: pide correo y mensaje o CV; no es buscador, boletín, acceso, comentarios del blog, pedidos, presupuestos, demos ni una oferta concreta | |
| Feeds públicos de Greenhouse, Lever y Ashby enlazados desde su web | |

**Buzón** (en la ficha de la empresa): `existe` = confirmado por su servidor; `acepta-todo` = el servidor acepta cualquier dirección (no se puede confirmar); `sin-confirmar` = no respondió.

**Confianza:**
- `alta`: buzón de prácticas, talento o RR. HH. confirmado, o correo general confirmado en la página de empleo, o formulario de empleo.
- `media`: el resto (correo sin confirmar o formulario de contacto).

## Revisión manual (obligatoria tras cada verificación)

1. Abre `docs/AUDITORIA-CONTACTOS.md`: cada contacto publicado con su prueba (texto de la página donde aparece el correo, respuesta del servidor de correo, campos del formulario).
2. Si algo no sirve, anótalo en `data/revision-manual.json`:
   ```json
   { "id-de-la-empresa": { "correosRechazados": ["info@empresa.es"], "formulariosRechazados": ["https://…"], "descartar": false, "motivo": "…", "fecha": "AAAA-MM-DD" } }
   ```
3. Si un correo **rebota** al escribirle, añádelo a `data/correos-rebotados.json` con la fecha y la respuesta del servidor. También lo pueden avisar alumnos y tutores desde la ficha («Avisar de un problema»).
4. Al subir cualquiera de los dos archivos, GitHub vuelve a verificar y publica el resultado.

## Retirar una empresa

Cuando una empresa lo pida (por el formulario de `#/privacidad`, que llega a Netlify Forms, o por correo):

1. Añádela a `data/retiradas.json`:
   ```json
   [{ "id": "id-de-la-empresa", "dominio": "empresa.es", "fecha": "2026-11-05", "motivo": "Solicitud de la empresa" }]
   ```
2. Quítala de `data/empresas.json` (o ejecuta `npm run verificar:empresas`, que ya la descarta).
3. `npm run check` (falla si una retirada sigue en el directorio), commit y despliegue.
4. Responde a la empresa y **borra la solicitud** en Netlify → Forms (es un dato personal).

Plazo comprometido en la web: 10 días hábiles.
