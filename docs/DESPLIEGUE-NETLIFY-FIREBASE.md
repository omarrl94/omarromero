# Despliegue: Firebase (cuentas y guardado) + Netlify

Tiempo estimado: 15–20 minutos. No hace falta tarjeta de crédito: el plan gratuito de Firebase (Spark) y el de Netlify sobran para una clase.

## 1. Crear el proyecto de Firebase
1. Entra en https://console.firebase.google.com y pulsa **Crear un proyecto** (puedes desactivar Google Analytics).
2. En el proyecto: **Compilación → Authentication → Comenzar**.
   - Pestaña **Método de acceso** → activa **Correo electrónico/contraseña** y **Google** (en Google elige un correo de asistencia del proyecto).
3. **Compilación → Firestore Database → Crear base de datos** → modo **producción** → elige la región `eur3` (Europa) o la más cercana.
4. En Firestore → pestaña **Reglas** → pega el contenido del archivo `firestore.rules` → **Publicar**.
   Con esas reglas cada usuario solo puede leer y escribir su propio documento (`users/{uid}`).
5. **Configuración del proyecto (rueda dentada) → General → Tus apps → icono `</>` (Web)**. Ponle un nombre, **no** marques Firebase Hosting y pulsa **Registrar app**. Copia los valores de `firebaseConfig`.

## 2. Probar en local (opcional)
```powershell
copy .env.example .env.local
```
Edita `.env.local` y pega los valores de `firebaseConfig`:
`apiKey → VITE_FIREBASE_API_KEY`, `authDomain → VITE_FIREBASE_AUTH_DOMAIN`, `projectId → VITE_FIREBASE_PROJECT_ID`,
`storageBucket → VITE_FIREBASE_STORAGE_BUCKET`, `messagingSenderId → VITE_FIREBASE_MESSAGING_SENDER_ID`, `appId → VITE_FIREBASE_APP_ID`.
```powershell
npm install
npm run dev
```
Abre http://localhost:5173: verás la portada con el formulario de acceso. `localhost` ya está autorizado por defecto en Firebase.
Sin variables, la aplicación arranca en **modo demostración** (sin cuentas), que es lo que ves en el HTML de vista previa.

## 3. Subir el código a GitHub
El proyecto vive en su propia rama, `circuitossea`, del repositorio `omarrl94/omarromero`, con los archivos en la raíz de la rama.

## 4. Publicar en Netlify
1. https://app.netlify.com → **Add new site → Import an existing project → GitHub** → elige `omarromero`.
2. Configura:
   - **Branch to deploy:** `circuitossea`
   - **Base directory:** (vacío: el proyecto está en la raíz de la rama)
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. **Site configuration → Environment variables → Add a variable** y crea las seis `VITE_FIREBASE_*` con los valores del paso 1.
4. **Deploy site**. Al terminar tendrás una URL tipo `https://nombre-aleatorio.netlify.app` (puedes cambiarla en *Domain management*).

## 5. Autorizar el dominio en Firebase (imprescindible)
Firebase → **Authentication → Configuración → Dominios autorizados → Agregar dominio** → pon tu dominio de Netlify (`nombre.netlify.app`, sin `https://`).
Sin este paso el login con Google (y el de correo) falla con «dominio no autorizado».

## 6. Comprobar
- Abre la URL → portada → **Crear cuenta gratis** → entra el simulador.
- En Firebase → Authentication → Usuarios debe aparecer tu usuario; y en Firestore → `users` tu documento con el proyecto y la carrera del juego.
- Cierra sesión y entra desde otro navegador: tu último proyecto y tu progreso del juego aparecen solos.

## Problemas típicos
| Síntoma | Causa y arreglo |
|---|---|
| La portada dice «Modo demostración» | Faltan las variables `VITE_FIREBASE_*` en Netlify (hay que volver a desplegar tras añadirlas: *Deploys → Trigger deploy → Clear cache and deploy*). |
| «Dominio no autorizado» | Paso 5. |
| «Ese método de acceso no está activado» | Paso 1.2: activa Correo/contraseña y/o Google. |
| El build de Netlify falla por «secrets scanning» | Ya está resuelto con `SECRETS_SCAN_OMIT_KEYS` en `netlify.toml`; comprueba que Netlify lee ese archivo (está en la raíz de la rama `circuitossea`). |
| No se guarda en la nube | Revisa que publicaste las reglas (paso 1.4) y que Firestore está creado. |

## Seguridad y datos personales
- Solo se guarda: nombre (opcional), correo (lo gestiona Firebase Authentication), tu último proyecto y las estadísticas del juego.
- Las claves `VITE_FIREBASE_*` de la app web no son secretas; la protección real son las **reglas de Firestore** y los **dominios autorizados**.
- Si usas la aplicación con alumnado menor de edad, informa del tratamiento de datos según el RGPD de tu centro.
