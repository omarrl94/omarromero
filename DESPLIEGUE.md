# Publicar el curso en Firebase y Netlify

Firebase guarda las cuentas (**Authentication**) y los datos (**Cloud Firestore**). La web se puede servir desde **Netlify**, desde **Firebase Hosting** o desde los dos a la vez, porque las dos versiones usan el mismo proyecto de Firebase y ven los mismos datos.

Todo funciona en el plan gratuito de Firebase (Spark): no hacen falta funciones ni tarjeta.

---

## 1. Crear el proyecto de Firebase (una sola vez)

1. Entra en [console.firebase.google.com](https://console.firebase.google.com) y pulsa **Crear un proyecto** (por ejemplo, `curso-claude-jrotero`). Google Analytics no hace falta.
2. **Compilación → Authentication → Comenzar → Método de acceso → Correo electrónico/contraseña → Habilitar** (solo la primera opción, sin "vínculo de correo").
3. **Authentication → Plantillas**: pulsa el lápiz y cambia el **idioma de la plantilla a Español**, para que los correos de verificación y de cambio de contraseña lleguen en castellano.
4. **Compilación → Firestore Database → Crear base de datos**:
   - **Edición Standard**.
   - Ubicación **`eur3 (Europe)`** o `europe-southwest1 (Madrid)`. Tiene que estar en la UE por el RGPD y **no se puede cambiar después**.
   - Modo **producción**. No toques las reglas en la consola: están en este repositorio.
5. **⚙ Configuración del proyecto → General → Tus apps → Web (`</>`)**: registra la app (sin Hosting de momento) y copia estos valores de `firebaseConfig`:

   | Valor de Firebase | Variable de entorno |
   |---|---|
   | `apiKey` | `FIREBASE_API_KEY` |
   | `authDomain` | `FIREBASE_AUTH_DOMAIN` |
   | `projectId` | `FIREBASE_PROJECT_ID` |
   | `appId` | `FIREBASE_APP_ID` |

   La configuración web de Firebase **no es secreta**: va dentro de la página. Lo que protege los datos son las reglas de Firestore (paso 2) y las restricciones de la clave (paso 6).

## 2. Subir las reglas de seguridad

Necesitas Node.js 20 o posterior.

```bash
git clone -b curso-claude https://github.com/omarrl94/omarromero.git curso-claude
cd curso-claude
npm install
npx firebase login                 # abre el navegador con tu cuenta de Google
npx firebase use --add             # elige el proyecto y pon "default" como alias
npm run desplegar:reglas           # sube firebase/firestore.rules
```

`firebase use --add` crea `.firebaserc`. Súbelo al repositorio para no repetirlo en otro equipo.

## 3A. Publicar en Netlify

1. En [app.netlify.com](https://app.netlify.com): **Add new site → Import an existing project → GitHub** y elige `omarrl94/omarromero`.
2. **Branch to deploy: `curso-claude`**. El comando de compilación (`npm run build`) y la carpeta (`dist`) se leen de `netlify.toml`: no cambies nada.
3. No hace falta crear variables: la configuración del proyecto `cursoclaude-6bc22` está en `firebase.web.json`. Si algún día usas otro proyecto, cambia ese fichero o define las variables `FIREBASE_*` en **Site configuration → Environment variables**, que tienen prioridad.
4. **Deploy**. Cada push a `curso-claude` vuelve a publicar la web.
5. Copia la dirección del sitio (`https://algo.netlify.app`, o tu dominio si lo configuras en **Domain management**).

`netlify.toml` ya incluye:
- Cabeceras de seguridad (CSP estricta, HSTS, nosniff).
- Caché larga para fuentes y código con hash.
- La exclusión del escáner de secretos para la configuración web de Firebase, que es pública.

## 3B. Publicar en Firebase Hosting

1. En la consola: **Compilación → Hosting → Comenzar** (basta con aceptar los pasos; la configuración ya está en `firebase.json`).
3. Publica:

   ```bash
   npm run desplegar:firebase       # compila y sube la web y las reglas
   ```

La web queda en `https://TU-PROYECTO.web.app`. Las mismas cabeceras de seguridad están en `firebase.json`.

## 3C. Correo del centro (avisos y correos de la cuenta)

Funciona igual que en **ColaboraFP** y en la **web de exámenes**. El correo del centro bloquea los mensajes externos, incluidos los de Firebase, así que los correos salen desde un buzón del propio centro mediante una función de Netlify (`netlify/functions/correo.mjs`):

| Correo | Cuándo | Para quién |
|---|---|---|
| Activa tu cuenta | Al registrarse o con **Reenviar correo** | El alumno o el profesor |
| Elige una contraseña nueva | **¿Has olvidado tu contraseña?** o *Restablecer contraseña* desde el panel | El usuario |
| Nueva alta en el curso | Cuando se registra un alumno | El profesorado (`ADMIN_EMAILS`) |
| Entrega recibida | Cuando un alumno entrega una actividad | El alumno (justificante), con copia oculta al profesor |
| Actividad aprobada / necesita cambios | Cuando el profesor evalúa | El alumno, con la nota y los comentarios |
| Tu Título Propio | Cuando el profesor lo emite | El alumno, con el código de verificación |

Los enlaces de los correos llevan a la propia web (`/accion`), en castellano y con el diseño del curso.

**Variables en Netlify** (Project configuration → Environment variables). Las `SMTP_*` y `MAIL_FROM` pueden ser las mismas que en ColaboraFP y en la web de exámenes. **La cuenta de servicio no**: tiene que ser la de este proyecto (`cursoclaude-6bc22`), o la función la rechaza. El **ámbito (scope)** debe incluir **Functions**:

| Variable | Valor |
|---|---|
| `SMTP_HOST` | `smtp.office365.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | el buzón del centro que envía (p. ej. `omar.romero@jrotero.es`) |
| `SMTP_PASS` | su contraseña o contraseña de aplicación (**márcala como secreta**) |
| `MAIL_FROM` | `Curso de Claude · FP José Ramón Otero <omar.romero@jrotero.es>` |
| `FIREBASE_SERVICE_ACCOUNT` | el JSON completo de la cuenta de servicio (**secreta**, ver abajo) |
| `ADMIN_EMAILS` | opcional; por defecto `omar.romero@jrotero.es` |

Si prefieres Resend: `RESEND_API_KEY` y `MAIL_FROM` en lugar de las `SMTP_*`.

**Cuenta de servicio:**
1. Firebase → ⚙ **Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada**. Se descarga un `.json`.
2. Ábrelo con el Bloc de notas y copia **todo**, desde `{` hasta `}`.
3. Pégalo como valor de `FIREBASE_SERVICE_ACCOUNT`.
4. Esa clave da acceso total al proyecto: no la subas al repositorio ni la pegues en un chat.

Después: **Deploys → Trigger deploy → Deploy site**.

**Comprobarlo:**
- **Panel docente → Usuarios y acceso → Correo del centro** dice "Activo" y muestra el remitente.
- Si falta algo, ese mismo recuadro dice qué variable falta, sin mostrar nunca los valores.

Si no configuras el correo, todo sigue funcionando con los correos normales de Firebase (que el correo del centro puede bloquear) y sin avisos. Lo mismo pasa al publicar en Firebase Hosting, que no ejecuta funciones de Netlify.

**Si a un alumno no le llega el correo:** en **Panel docente → Usuarios y acceso → Altas pendientes de verificar**, pulsa **Activar cuenta**. Es la misma aprobación manual que en ColaboraFP.

Los correos tienen un límite de 1 por minuto y 10 al día por destinatario. Los avisos se construyen con los datos de Firestore, así que nadie puede usar la función para mandar correos con contenido propio.

## 4. Autorizar los dominios

**Authentication → Configuración → Dominios autorizados → Agregar dominio**. Añade cada dirección desde la que se use la plataforma:

- `algo.netlify.app` (y tu dominio propio, si tienes uno)
- `TU-PROYECTO.web.app` y `TU-PROYECTO.firebaseapp.com`: Firebase los añade solo
- `localhost` ya viene incluido

## 5. Primer acceso del profesor (hazlo lo primero)

**Opción rápida, con contraseña inicial** (igual que `ADMIN_PASSWORD` en la web de exámenes; necesita `FIREBASE_SERVICE_ACCOUNT`):
1. En Netlify, crea la variable `ADMIN_PASSWORD` con la contraseña inicial. Márcala como secreta y con el ámbito **Functions**. Después vuelve a desplegar.
2. En la web, **Iniciar sesión** con `omar.romero@jrotero.es` y esa contraseña. La cuenta se crea sola, ya verificada.
3. La web te obliga a **elegir una contraseña nueva**. Hasta que lo hagas, las reglas no te dan permisos de profesor.
4. Desde ese momento la contraseña inicial deja de funcionar. Ya puedes borrar `ADMIN_PASSWORD` de Netlify.

Hazlo nada más desplegar: mientras no la cambies, quien conozca la contraseña inicial podría adelantarse.

**Opción con registro:**

1. Abre la web publicada → **Registro de alumnado** → regístrate con **`omar.romero@jrotero.es`**. El ciclo y el curso no se aplican a la cuenta del profesor.
2. Abre el enlace del correo de verificación (mira en spam si no llega).
3. Vuelve a la web y pulsa **Ya lo he verificado**: se activa el **Panel docente**.
4. Si vas a admitir alumnos sin correo `@jrotero.es`: **Panel docente → Usuarios y acceso → Código de acceso de aula**. Sin código, solo pueden registrarse correos institucionales.

Las reglas solo reconocen como profesor a quien tenga ese correo **verificado**. Aunque alguien lo registrara antes que tú, sin acceso al buzón nunca tendría permisos de profesor. En ese caso, borra esa cuenta en **Authentication → Usuarios** y regístrate tú.

## 6. Restringir la clave de API (recomendado)

En [console.cloud.google.com](https://console.cloud.google.com), con el mismo proyecto seleccionado: **APIs y servicios → Credenciales → Browser key (auto created by Firebase)**.

- **Restricciones de aplicaciones → Sitios web**: `https://algo.netlify.app/*`, `https://TU-PROYECTO.web.app/*`, `https://TU-PROYECTO.firebaseapp.com/*`, tu dominio y `http://localhost/*`.
- **Restricciones de API**: *Identity Toolkit API*, *Token Service API* y *Cloud Firestore API*.

Opcional: en **Uso y facturación → Presupuestos y alertas** pon una alerta de, por ejemplo, 1 €, por si algún día activas el plan de pago.

---

## Trabajar en local

```bash
npm run dev                   # contra el proyecto real de Firebase, en http://localhost:8000
npm run dev:demo              # modo demostración (datos en el navegador, sin Firebase)
```

Con los emuladores de Firebase, sin tocar el proyecto real (necesita Java 11 o posterior):

```bash
npm run emuladores            # terminal 1: Auth en :9099 y Firestore en :8080
# terminal 2:
FIREBASE_API_KEY=demo FIREBASE_AUTH_DOMAIN=demo-jrotero.firebaseapp.com \
FIREBASE_PROJECT_ID=demo-jrotero FIREBASE_APP_ID=1:1:web:1 FIREBASE_EMULADOR=1 npm run dev
```

Los correos de verificación del emulador no se envían: sus enlaces se ven en `http://127.0.0.1:9099/emulator/v1/projects/demo-jrotero/oobCodes`.

Para probar las reglas de seguridad (64 casos: registro, roles, altas aprobadas, entregas por bloque, tests, notas, títulos y supresión):

```bash
npm run probar:reglas
```

## Mantenimiento

| Tarea | Cómo |
|---|---|
| Cambiar temario o prompts | `src/datos.js`; en Netlify basta con hacer push a `curso-claude` |
| Cambiar el profesor responsable | `ADMIN_EMAIL` en `src/constantes.js` **y** en `firebase/firestore.rules`; después `npm run desplegar:reglas` |
| Borrar del todo a un alumno | Panel docente → Eliminar datos, y además **Authentication → Usuarios → Eliminar cuenta** |
| Copia de seguridad | Firestore → Importar/Exportar (requiere plan Blaze) o exportar el CSV de seguimiento desde el panel |

## Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| Netlify: *Despliegue sin Firebase* | Falta `firebase.web.json` en la rama o está incompleto. Después usa **Deploys → Trigger deploy → Clear cache and deploy**. |
| Netlify: *Secrets scanning detected secrets* | Has renombrado alguna variable; la lista que se excluye está en `SECRETS_SCAN_OMIT_KEYS` de `netlify.toml`. |
| *El acceso con correo y contraseña no está activado* | Falta el paso 1.2. |
| *Operación no permitida* al registrarse o entregar | Las reglas no están subidas (paso 2), el correo no está verificado o el código de aula es incorrecto. |
| No llega el correo de verificación | Revisa spam. Configura el correo del centro (paso 3C) o activa la cuenta desde **Altas pendientes de verificar**. |
| `7 PERMISSION_DENIED: Missing or insufficient permissions` con la cuenta `firebase-adminsdk-…@cursoclaude-6bc22` | Esa cuenta no tiene roles. En console.cloud.google.com → **IAM y administración → IAM**, pulsa el lápiz junto a ella y añade **Usuario de Cloud Datastore** y **Administrador de Firebase Authentication**. |
| `7 PERMISSION_DENIED` con una cuenta de otro proyecto | La cuenta de servicio no es de este proyecto. Genera una clave nueva en **Cuentas de servicio** con `cursoclaude-6bc22` seleccionado y sustituye `FIREBASE_SERVICE_ACCOUNT`. Compruébalo en `/.netlify/functions/correo?comprobar=1`, donde debe aparecer `"comprobacion":"ok"`. |
| *Correo del centro: No configurado* en el panel | El recuadro dice qué variable falta. Revisa que el ámbito incluya **Functions** y vuelve a desplegar. |
| *El servidor de correo rechazó el envío (535…)* | Microsoft 365 no permite SMTP a ese buzón: el administrador de M365 debe activar **SMTP autenticado** para él (Centro de administración → Usuarios → Correo → Administrar aplicaciones de correo). |
| El profesor no ve el panel | El correo no está verificado: pulsa **Ya lo he verificado** después de abrir el enlace. |
