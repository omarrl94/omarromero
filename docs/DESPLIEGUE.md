# Despliegue paso a paso

Tiempo estimado: 45-60 minutos la primera vez, todo desde el navegador.
Necesitas: la cuenta de GitHub `omarrl94`, una cuenta de Google para Firebase, Netlify y los datos SMTP
del buzón del centro (los mismos que en ColaboraFP, la web de exámenes y el curso).

---

## 1. Crear el proyecto de Firebase (cuentas y datos)

1. Entra en **https://console.firebase.google.com** → **Crear un proyecto** → nombre `conecta-ffe` → desactiva Google Analytics → **Crear proyecto**.
2. **Authentication** → **Comenzar** → **Método de acceso** → **Correo electrónico/contraseña** → **Habilitar** → Guardar.
3. **Authentication → Plantillas** → lápiz → cambia el **idioma de las plantillas a Español** (plan B si el buzón del centro fallara).
4. **Authentication → Configuración → Dominios autorizados** → **Agregar dominio** → tu dominio de Netlify (p. ej. `conecta-ffe-jrotero.netlify.app`).
5. **Firestore Database** → **Crear base de datos** → ubicación **europe-southwest1 (Madrid)** o `eur3` → **Modo de producción** → Crear.
6. **Firestore → Reglas** → borra lo que haya, pega el contenido de [`firebase/firestore.rules`](../firebase/firestore.rules) → **Publicar**.
7. **Configuración del proyecto** (rueda dentada) → **General** → **Tus apps** → icono **`</>`** (Web) → nombre `Conecta FFE` → **Registrar app**. Copia estos cuatro valores del bloque `firebaseConfig`: `apiKey`, `authDomain`, `projectId` y `appId`.
8. **Configuración del proyecto → Cuentas de servicio** → **Generar nueva clave privada** → se descarga un `.json`. Guárdalo bien: es la llave del servidor. **No la subas a GitHub.**

> Usa la cuenta de servicio **de este proyecto**, no la del curso ni la de ColaboraFP: el servidor comprueba que coincida.

## 2. Comprobar las empresas (GitHub Actions)

Ya está hecho: hay 190 empresas verificadas con reglas estrictas (102 de DAM, 95 de ASIR, 20 de SEA y 54 de Actividades Comerciales). El flujo «Verificar empresas» se repite solo cada mes y cada vez que cambian las candidatas (ver `docs/GUIA-EMPRESAS.md`).

## 3. Crear el sitio en Netlify

1. **app.netlify.com** → **Add new project → Import an existing project → GitHub** → `omarrl94/omarromero`.
2. **Branch to deploy:** `conecta-ffe`. El build y la carpeta se leen de `netlify.toml`.
3. Antes de desplegar, añade las variables del paso 4.

## 4. Variables de entorno en Netlify

**Project configuration → Environment variables → Add a variable** (ámbito *All scopes*; «Same value for all deploy contexts»).

### Firebase (web, públicas por diseño)

| Variable | Valor |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` del paso 1.7 |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

### Firebase (servidor, **secreta**)

| Variable | Valor |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | El contenido **completo** del `.json` del paso 1.8 (desde `{` hasta `}`). Marca **«Contains secret values»** |

### Correo del centro (como en ColaboraFP y la web de exámenes)

| Variable | Valor |
|---|---|
| `SMTP_HOST` | `smtp.office365.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | el buzón que envía (p. ej. `omar.romero@jrotero.es`) |
| `SMTP_PASS` | su contraseña o contraseña de aplicación (**secreta**) |
| `MAIL_FROM` | `Conecta FFE · C.F.P. José Ramón Otero <omar.romero@jrotero.es>` |

En lugar de SMTP también vale Resend (`RESEND_API_KEY` + `MAIL_FROM`) o Microsoft Graph (`MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET` + `MAIL_FROM`).

### Opcionales

| Variable | Uso |
|---|---|
| `APP_URL` | Dirección pública (`https://conecta-ffe-jrotero.netlify.app`) para los enlaces de los correos |
| `SUPERADMIN_EMAILS` | Más superadmin además de `omar.romero@jrotero.es`, separados por comas |
| `SESSION_SECRET` | Firma del doble factor. Si no la pones, el servidor genera y guarda la suya |
| `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `INFOJOBS_CLIENT_ID`, `INFOJOBS_CLIENT_SECRET` | Fuentes de ofertas (ver «Conectar fuentes de ofertas» más abajo) |

## 5. Desplegar

**Deploys → Trigger deploy → Clear cache and deploy project.** El build ejecuta todas las comprobaciones (lint, pruebas, datos y que ningún correo de empresa ni secreto llegue a la web pública). Si algo falla, no publica.

## 6. Primer acceso del superadmin (tú)

1. Abre la web → **Entrar** → **Crear cuenta** → **Soy profesor/a tutor/a** → tu nombre, `omar.romero@jrotero.es` y una contraseña.
2. Te llega «Confirma tu correo» desde el buzón del centro → abre el enlace.
3. Vuelve a la web → **Ya lo he verificado** → te pide la **verificación en dos pasos** → **Enviarme el código** → escribe el código que te llega.
4. Llegas a **Admin · Usuarios y roles**.

`omar.romero@jrotero.es` es superadmin siempre (está en la configuración), aunque alguien intente cambiarlo.

## 7. Cómo funciona para cada perfil

| Quién | Cómo se registra | Qué ve |
|---|---|---|
| **Alumnado** | «Soy alumno/a» con correo **@a.jrotero.es** → confirma el correo | Entra directamente: Empresas, Ofertas, Seguimiento, Mis datos |
| **Profesorado** | «Soy profesor/a tutor/a» con correo **@jrotero.es** → confirma el correo | Queda **pendiente**; te llega un aviso por correo. Cuando lo apruebas en **Admin**, recibe otro correo y, con el código de doble factor, ve **Tutores** |
| **Superadmin** | `omar.romero@jrotero.es` (y `SUPERADMIN_EMAILS`) | **Admin** (aprobar tutores, cambiar o bloquear roles), Tutores, Empresas y Ofertas |

Otros dominios no pueden registrarse. Para quitar el acceso a alguien: **Admin → rol «Bloqueado»**.

## 8. Formulario de retirada

**Forms → Enable form detection** → vuelve a desplegar → **Form notifications → Email notification** a tu correo.

## 9. Comprobación final

- [ ] Registro de un alumno de prueba con @a.jrotero.es: llega el correo de verificación y entra en Empresas.
- [ ] Registro de un profesor de prueba con @jrotero.es: queda pendiente y te llega el aviso.
- [ ] En **Admin**, «Aprobar como tutor/a»: al profesor le llega el correo, entra con el código y ve **Tutores**.
- [ ] `https://TU-SITIO/api/empresas` en una ventana privada: «Inicia sesión para ver las empresas.»
- [ ] **Mis datos** en el móvil y en el ordenador con la misma cuenta: muestran lo mismo.
- [ ] **Mis datos → Borrar mi cuenta** con la cuenta de prueba: desaparece de **Admin**.

## Conectar fuentes de ofertas

1. **Adzuna:** regístrate en developer.adzuna.com y copia `Application ID` y `Application Key`. Prueba `https://api.adzuna.com/v1/api/jobs/es/search/1?app_id=…&app_key=…&results_per_page=1`. Sus condiciones dan 14 días de prueba: pide permiso de uso educativo por escrito.
2. **InfoJobs:** registra la aplicación en developer.infojobs.net y copia `Client ID` y `Client Secret`.
3. Añade `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `INFOJOBS_CLIENT_ID` e `INFOJOBS_CLIENT_SECRET` (secretas) y redespliega.
4. **Functions → `ofertas-actualizar` → Run now** (o espera a la ejecución diaria).

## Solución de problemas

| Lo que ves | Causa | Solución |
|---|---|---|
| «Las cuentas todavía no están configuradas» | Faltan las `VITE_FIREBASE_*` | Añádelas y redespliega |
| No llega el correo de verificación | SMTP sin configurar o rechazado | Revisa `SMTP_*`. Mientras tanto, la web usa el correo de Firebase como plan B (mira en no deseado) |
| «El servidor de correo rechazó… (535)» | Microsoft 365 no permite SMTP a ese buzón | El administrador de M365 debe activar **SMTP autenticado** para ese buzón |
| «Inicia sesión» al cargar empresas estando dentro | `FIREBASE_SERVICE_ACCOUNT` o `VITE_FIREBASE_PROJECT_ID` de otro proyecto | Usa la cuenta de servicio de este proyecto |
| `auth/unauthorized-domain` | El dominio de Netlify no está autorizado | Firebase → Authentication → Configuración → Dominios autorizados |
| El profesor no ve Tutores | Está pendiente o falta el código | Apruébalo en **Admin**; después debe introducir el código que le llega |

## Mantenimiento

| Cuándo | Qué |
|---|---|
| Cada curso | Fechas, horas y tutores en `config/ffe.config.ts`; bloquear o borrar cuentas de quien terminó |
| Cada mes (automático) | «Verificar empresas»; revisa el commit que genera |
| Al recibir una retirada | `data/retiradas.json`, en un máximo de 10 días hábiles |
