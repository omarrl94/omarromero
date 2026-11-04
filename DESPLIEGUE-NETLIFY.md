# Configurar Firebase y publicar CyberOps en Netlify, paso a paso

- Repositorio: `omarrl94/omarromero`
- Rama: **`cyberops-academia`**
- Tiempo aproximado: 20-30 minutos
- Coste: 0 €. El plan gratuito de Netlify y el plan Spark de Firebase bastan para una clase.

> **Orden recomendado:** primero Firebase (partes A y B) y después Netlify (partes C y D), porque
> Netlify necesita los datos de Firebase al compilar. Al final se añade el dominio de Netlify en Firebase (parte E).
> Si solo quieres probar el juego sin cuentas en la nube, ve directamente a la parte C y sáltate la D:
> funcionará en **modo local**, con el progreso guardado en el navegador de cada alumno.

---

## Parte A · Crear el proyecto de Firebase

1. Entra en <https://console.firebase.google.com> con tu cuenta de Google (mejor la del centro).
2. Pulsa **Crear un proyecto** (o «Añadir proyecto»).
3. Nombre: `cyberops-otero` (o el que quieras). Pulsa **Continuar**.
4. Google Analytics: **desactívalo** (no hace falta) y pulsa **Crear proyecto**. Espera y pulsa **Continuar**.

> ⚠️ Usa un **proyecto nuevo**. Si reutilizas el de otra web (por ejemplo, el del curso o CodeForge), al publicar
> estas reglas **sustituirías las de esa otra web** y dejaría de funcionar.

## Parte B · Activar el inicio de sesión, la base de datos y las reglas

### B1. Inicio de sesión con correo y contraseña
1. Menú izquierdo: **Compilación (Build) → Authentication → Comenzar**.
2. Pestaña **Método de inicio de sesión (Sign-in method)** → **Correo electrónico/contraseña**.
3. Activa el **primer** interruptor (Correo electrónico/contraseña) y pulsa **Guardar**.
4. (Opcional) Pestaña **Plantillas (Templates)**: cambia el idioma a **español** para los correos de verificación y de cambio de contraseña.

### B2. Base de datos Firestore
1. Menú izquierdo: **Compilación → Firestore Database → Crear base de datos**.
2. Ubicación: **`eur3 (europe-west)`** (o `europe-southwest1`, Madrid). Pulsa **Siguiente**.
3. Elige **Iniciar en modo de producción** y pulsa **Crear**.

### B3. Publicar las reglas de seguridad (sin terminal)
1. En Firestore, abre la pestaña **Reglas (Rules)**.
2. Abre en otra pestaña el fichero de reglas del repositorio:
   <https://github.com/omarrl94/omarromero/blob/cyberops-academia/firebase/firestore.rules>
   y copia **todo** su contenido (botón «Copy raw file»).
3. En la consola de Firebase, **borra** lo que hay en el editor, **pega** las reglas y pulsa **Publicar**.

> Las reglas hacen que cada alumno solo pueda leer y escribir su propio progreso, que nadie pueda inventarse
> puntos imposibles y que los nicks sean únicos. Sin ellas, el registro falla.
> (Alternativa con terminal, más abajo: `npm run desplegar:reglas`).

### B4. Registrar la app web y copiar la configuración
1. Arriba a la izquierda, la rueda **⚙ → Configuración del proyecto**.
2. En **Tus apps**, pulsa el icono **Web `</>`**.
3. Apodo: `cyberops-web`. **No** marques Firebase Hosting. Pulsa **Registrar app**.
4. Aparece un bloque `const firebaseConfig = { … }`. **Deja esta página abierta**: necesitarás estos 6 valores:
   `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId` y `appId`.

> Estos valores son **públicos por diseño** (viajan en la web). La seguridad la ponen las reglas del paso B3.

---

## Parte C · Crear el sitio en Netlify

1. Entra en <https://app.netlify.com> e inicia sesión (por ejemplo, con GitHub).
2. **Add new site → Import an existing project → GitHub**.
3. Autoriza a Netlify si te lo pide y elige el repositorio **`omarrl94/omarromero`**.
4. En la configuración del sitio:
   - **Branch to deploy:** `cyberops-academia` ← importante.
   - **Base directory:** vacío.
   - **Build command:** `npm run build`. **Publish directory:** `dist`. Netlify los lee de `netlify.toml`; déjalos así.
5. **No pulses Deploy todavía** si vas a usar Firebase: abre antes **Add environment variables** (o hazlo en la parte D).
6. Pulsa **Deploy**. En 1-2 minutos tendrás una dirección `https://algo-aleatorio.netlify.app`.
7. Cámbiale el nombre: **Site configuration → Site details → Change site name** → `cyberops-otero`.
   La dirección queda así: **`https://cyberops-otero.netlify.app`** (o la que quede libre).

> Puedes tener varios sitios de Netlify conectados al mismo repositorio, cada uno con su rama. Este es independiente
> del sitio del curso o de CodeForge.

## Parte D · Conectar Netlify con Firebase (variables de entorno)

1. En el sitio de Netlify: **Site configuration → Environment variables → Add a variable → Add a single variable**.
2. Crea estas **6 variables** copiando cada valor de `firebaseConfig` (parte B4), **sin comillas**:

   | Clave en Netlify | Valor (de `firebaseConfig`) |
   |---|---|
   | `VITE_FIREBASE_API_KEY` | `apiKey` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` (termina en `.firebaseapp.com`) |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `VITE_FIREBASE_APP_ID` | `appId` |

   Ámbito (Scopes): **All** o, como mínimo, **Builds**.
3. Vuelve a publicar para que se apliquen: **Deploys → Trigger deploy → Clear cache and deploy site**.

> Las variables se incrustan **al compilar**: cada vez que cambies una, hay que volver a desplegar.

## Parte E · Autorizar el dominio de Netlify en Firebase

1. Firebase → **Authentication → Configuración (Settings) → Dominios autorizados**.
2. **Agregar dominio** → `cyberops-otero.netlify.app` (el tuyo, **sin** `https://`).
3. Si más adelante usas un dominio propio (por ejemplo, `cyberops.jrotero.es`), añádelo también.

---

## Parte F · Comprobar que todo funciona

1. Abre `https://cyberops-otero.netlify.app` y pulsa **Empezar la misión**.
2. En la pantalla de registro, arriba a la derecha, debe poner **«en la nube»** en verde.
   Si pone «modo local», revisa la parte D.
3. Crea un agente de prueba, elige equipo y supera la primera misión.
4. En Firebase → **Firestore Database → Datos** deben aparecer las colecciones `cyberops_nicks` y `cyberops_players`.
5. Abre la web en **otro navegador** o en el móvil y entra con el mismo correo: debe aparecer el mismo progreso.
6. Pestaña **Ranking**: verás a los agentes de la clase.

## Parte G · Uso en clase

- Comparte la dirección con los alumnos: se registran con nick, correo, contraseña y avatar.
- **Notas:** cada alumno descarga su **boletín en CSV** desde Perfil y puede entregarlo. El ranking muestra la XP de todos.
- **Resúmenes:** cada tema se descarga en el mapa («Descargar resumen del tema»).
- **Sin Internet o para enseñarlo rápido:** `preview/cyberops-preview.html` funciona con doble clic, en modo local.

## Actualizaciones

Cada `git push` a la rama `cyberops-academia` vuelve a publicar la web automáticamente en 1-2 minutos.
El progreso de los alumnos no se pierde: está en Firestore.

## Alternativa con terminal (reglas y pruebas)

Necesitas Node 18 o superior (y Java 11 o superior solo para las pruebas con emulador).

```bash
git clone -b cyberops-academia https://github.com/omarrl94/omarromero.git cyberops
cd cyberops
npm ci
cp .firebaserc.example .firebaserc   # cambia TU-PROYECTO-FIREBASE por el projectId
npx firebase login
npm run desplegar:reglas             # publica firebase/firestore.rules
npm test                             # verifica las 60 misiones y la auditoría pedagógica
npm run test:rules                   # 24 pruebas de las reglas en el emulador (requiere Java)
```

## Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| El registro dice **«modo local»** | Faltan variables `VITE_FIREBASE_*`, están mal escritas o no se volvió a desplegar (parte D, paso 3). |
| «**El servidor ha rechazado la operación** (reglas de Firestore)» | Las reglas no están publicadas o se pegaron incompletas (parte B3). |
| «El acceso con correo y contraseña **no está activado**» | Falta activar el proveedor (parte B1). |
| Error **`auth/unauthorized-domain`** | Añade el dominio de Netlify en Dominios autorizados (parte E). |
| «Ya existe una cuenta con ese correo» | El alumno ya se registró: debe usar **Entrar** o «He olvidado mi contraseña». |
| No llega el correo de verificación o de contraseña | Mira en spam. Los correos salen de `noreply@<proyecto>.firebaseapp.com`. |
| El deploy falla con **«secrets detected»** | `netlify.toml` ya excluye las claves públicas de Firebase. Comprueba que el sitio usa la rama `cyberops-academia`. |
| El deploy falla al compilar | En **Deploys → (último) → Deploy log**, busca la primera línea en rojo. La rama compila con `npm ci && npm run build` (comprobado en limpio). |
