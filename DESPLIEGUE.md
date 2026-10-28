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

## 4. Autorizar los dominios

**Authentication → Configuración → Dominios autorizados → Agregar dominio**. Añade cada dirección desde la que se use la plataforma:

- `algo.netlify.app` (y tu dominio propio, si tienes uno)
- `TU-PROYECTO.web.app` y `TU-PROYECTO.firebaseapp.com`: Firebase los añade solo
- `localhost` ya viene incluido

## 5. Primer acceso del profesor (hazlo lo primero)

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

Para probar las reglas de seguridad (43 casos: registro, roles, entregas, notas, títulos y supresión):

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
| No llega el correo de verificación | Revisa spam. Después de unos minutos usa **Reenviar correo**. Si el centro filtra correos externos, pide que admitan `noreply@TU-PROYECTO.firebaseapp.com`. |
| El profesor no ve el panel | El correo no está verificado: pulsa **Ya lo he verificado** después de abrir el enlace. |
