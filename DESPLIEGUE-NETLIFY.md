# Desplegar CyberOps en Netlify

Rama de despliegue: **`cyberops-academia`** (repositorio `omarrl94/omarromero`).
La configuración ya está en [`netlify.toml`](netlify.toml): Node 22, `npm run build`, carpeta `dist`,
redirección SPA, caché de assets y exclusión de las claves públicas de Firebase del escáner de secretos.

## 1. Crear el sitio en Netlify

1. Entra en <https://app.netlify.com> → **Add new site → Import an existing project → GitHub**.
2. Autoriza Netlify en GitHub y elige el repositorio **omarrl94/omarromero**.
3. En **Branch to deploy** elige **`cyberops-academia`**.
4. Netlify leerá `netlify.toml`; comprueba que queda así:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Pulsa **Deploy**. En 1-2 minutos tendrás una URL `https://<nombre>.netlify.app`.
   Sin variables de Firebase, la app funciona en **modo local** (cuentas en el navegador).
6. Opcional: **Site configuration → Site details → Change site name** (p. ej. `cyberops-fenix`).

## 2. Activar la nube con Firebase

1. <https://console.firebase.google.com> → **Añadir proyecto** (p. ej. `cyberops-fenix`).
2. **Authentication → Comenzar → Sign-in method → Correo electrónico/contraseña → Habilitar**.
3. **Authentication → Settings → Dominios autorizados → Agregar dominio** → `<nombre>.netlify.app`
   (y tu dominio propio si lo usas).
4. **Firestore Database → Crear base de datos** → modo producción → región `eur3 (europe-west)`.
5. **Configuración del proyecto (⚙) → Tus apps → Web `</>`** → registra la app y copia los valores
   de `firebaseConfig`.

## 3. Variables de entorno en Netlify

**Site configuration → Environment variables → Add a variable** (ámbito *Builds*):

| Variable | Valor de `firebaseConfig` |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_APP_ID` | `appId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |

Después: **Deploys → Trigger deploy → Deploy site**. Vite incrusta estas variables al compilar,
así que **cada cambio de variables necesita un nuevo deploy**.

## 4. Desplegar las reglas de seguridad de Firestore

Desde tu ordenador (Node 18+), en la carpeta del proyecto:

```bash
git clone -b cyberops-academia https://github.com/omarrl94/omarromero.git cyberops
cd cyberops
npm ci
cp .firebaserc.example .firebaserc     # edítalo y pon el id de tu proyecto de Firebase
npx firebase login
npm run desplegar:reglas
```

Sin este paso, Firestore rechazará el registro (las reglas por defecto lo bloquean todo).

## 5. Comprobar

1. Abre la URL de Netlify: la pantalla de registro debe mostrar **«en la nube»**.
2. Crea un agente, elige equipo, supera una misión y mira en Firestore las colecciones
   `cyberops_nicks` y `cyberops_players`.
3. Abre la web en otro navegador, entra con el mismo correo: tu progreso debe aparecer.

## Actualizaciones

Cada `git push` a `cyberops-academia` lanza un deploy automático. Para probar cambios antes de
publicarlos, activa **Deploy Previews** (Site configuration → Build & deploy → Branches and deploy contexts).

## Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| La pantalla de registro dice «modo local» | Faltan variables `VITE_FIREBASE_*` o no se volvió a desplegar tras añadirlas. |
| «El servidor ha rechazado la operación (reglas de Firestore)» | Las reglas no están desplegadas (paso 4). |
| «El acceso con correo y contraseña no está activado» | Falta habilitar el proveedor (paso 2.2). |
| Error `auth/unauthorized-domain` | Añade el dominio de Netlify en Dominios autorizados (paso 2.3). |
| El deploy falla por «secrets detected» | Comprueba que `netlify.toml` incluye `SECRETS_SCAN_OMIT_KEYS` (ya viene en esta rama). |
