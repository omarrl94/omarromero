# Pendientes

## A. Lo que no he podido hacer (y cómo completarlo)

La causa principal: el entorno de desarrollo **solo tenía acceso a los registros de paquetes y a la búsqueda web**.
No podía abrir webs de empresas, APIs de empleo ni consultar DNS.

| # | Pendiente | Por qué | Cómo completarlo | Tiempo estimado |
|---|---|---|---|---|
| 1 | **Verificar las 68 empresas candidatas** y publicar el directorio | Sin acceso a sus webs ni a DNS (MX) | En un equipo con Internet: `npm install && npm run verificar:empresas`. Revisa `docs/INFORME-VERIFICACION.md` y el diff de `data/empresas.json`, y haz commit | 15 min de script + 1-2 h de revisión |
| 2 | **Llegar a 60 o más empresas verificadas** | Depende del punto 1. Se espera que se descarte una parte | Si no se llega, añade candidatas (sobre todo pymes de zona sur y este) siguiendo `docs/GUIA-EMPRESAS.md` | 1-3 h |
| 3 | **Revisión con desconfianza de 10 empresas al azar** | No hay empresas verificadas | `npm run auditar:muestra` y, además, abrir a mano las 10 fuentes en el navegador | 30 min |
| 4 | **Probar los enlaces profundos** (LinkedIn, Indeed, InfoJobs web, Tecnoempleo, Glassdoor, Welcome to the Jungle) | Sin red. Además, varios bloquean a los robots | Abre cada uno desde `#/ofertas` en desarrollo. Si filtra bien por perfil y Madrid, pon `probado: true` y la fecha en `config/ffe.config.ts`. Confirma los códigos de provincia de InfoJobs (`33`) y Tecnoempleo (`,28,`) | 30 min |
| 5 | **Confirmar que Adzuna cubre España** y sus condiciones | No se pudo llamar a la API ni abrir su documentación | Con las claves: `curl "https://api.adzuna.com/v1/api/jobs/es/search/1?app_id=…&app_key=…&results_per_page=1"`. Lee sus condiciones: hay una prueba de 14 días y luego hace falta licencia | 20 min + respuesta de Adzuna |
| 6 | **Confirmar parámetros y condiciones de la API de InfoJobs** | Su documentación oficial no se pudo abrir | Revisa en developer.infojobs.net los parámetros de `server/fuentes/infojobs.ts` (`province=madrid`, `category=informatica-telecomunicaciones`, `sinceDate=_15_DAYS`) y ajústalos | 30 min |
| 7 | **Primera actualización real de ofertas** | Sin claves ni red | Tras desplegar con las claves: Netlify → Functions → `ofertas-actualizar` → *Run now*. Revisa `#/ofertas` | 10 min |
| 8 | **Probar con `netlify dev`** (Blobs reales y cookies) | La CLI descarga un runtime desde Internet | `npx netlify dev` en tu equipo, o directamente un *deploy preview* | 15 min |
| 9 | **Comprobar que las empresas siguen activas en el registro** | El script comprueba la web, no el BORME | Para las dudosas (pymes pequeñas), búscalas en el BORME o en informa.es | Variable |
| 10 | **Revisar sector, tamaño, zona y motivo de encaje** | Salen de la investigación y del conocimiento público, no de una comprobación automática | Repasa `data/empresas.candidatas.json`. Atención a la zona de las grandes empresas, que tienen varias sedes | 1 h |

## B. Lo que tienes que hacer tú

### Antes de publicar (obligatorio)

1. **Rama:** el trabajo está en `conecta-ffe`, una rama nueva sin el historial del LMS. Decide si se despliega desde esa rama o si se pasa a un repositorio propio.
2. **Variables en Netlify** (Project configuration → Environment variables, solo servidor):
   - `ACCESS_CODE`: el código del curso para el alumnado (no lo publiques en el aula virtual en abierto).
   - `SESSION_SECRET`: genera uno con `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.
3. **Ejecutar la verificación de empresas** (pendientes 1 a 3) y revisar el informe.
4. **Activar Netlify Forms** y la notificación por correo del formulario `retirada`.
5. **Revisar los textos legales** de `#/privacidad` con la persona responsable de protección de datos del centro (responsable del tratamiento, base jurídica, plazo de retirada de 10 días hábiles).
6. **Revisión final** en el *deploy preview*: entra con el código, genera un correo de prueba **a tu propia dirección** (cambia el «Para») y comprueba que Outlook y Gmail se abren bien.

### Datos de configuración que confirmar (`config/ffe.config.ts`)

- **Horas de ASIR (420):** marcadas como pendientes de confirmar (`horasPendientesDeConfirmar.ASIR`).
- **Tutor/a de ASIR:** está a `null`. Mientras tanto el correo sale sin copia y se avisa al alumno. Pon `{ nombre, email }` cuando se asigne.
- **Fechas de las modalidades:** se han puesto en 2027 (curso 2026-2027). Cámbialas cada curso.
- **Contacto de privacidad:** `centro.contactoPrivacidad` apunta a omar.romero@jrotero.es; cámbialo si debe ser otro buzón.

### Opcional

- **Claves de Adzuna** (`ADZUNA_APP_ID` y `ADZUNA_APP_KEY`): pide a Adzuna por escrito el uso educativo sin ánimo de lucro (pendiente 5).
- **Claves de InfoJobs** (`INFOJOBS_CLIENT_ID` y `INFOJOBS_CLIENT_SECRET`): registra la aplicación en developer.infojobs.net y acepta sus condiciones.
- **Dominio propio** (p. ej. `ffe.jrotero.es`) en Netlify.

## C. Mejoras propuestas para una siguiente versión

- **Panel docente**, protegido con otro código, para ver el informe de verificación y las solicitudes de retirada sin entrar en Netlify.
- **Lever UE:** soportar `api.eu.lever.co` para empresas con instancia europea.
- **Más feeds ATS** con API pública documentada (Workable, Personio, SmartRecruiters, Teamtailor), siempre que la propia web de la empresa los enlace.
- **Exportar e importar el seguimiento** a un archivo JSON, para cambiar de dispositivo sin servidor.
- **Plantillas de correo por perfil** (p. ej. un párrafo distinto para ciberseguridad o para videojuegos) editables en la configuración.
- **Recordatorio local** para insistir pasados 7 días sin respuesta.
- **Prueba automática de enlaces profundos** en CI, con navegador real y aceptación de cookies, para detectar cambios de formato de URL.
- **Ejecución programada del verificador** (p. ej. un GitHub Action mensual) que abra un PR con el diff de `data/empresas.json` para revisión humana.
