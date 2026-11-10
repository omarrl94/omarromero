# Publicar CodeForge en Google Play · guía paso a paso

> **Nota de CodeForge Medio.** Esta guía viene de CodeForge y sus pasos sirven igual. Tres diferencias:
> el proyecto Android está en `codeforgemedio/android/` con el id `es.jrotero.codeforgemedio`; la compilación
> automática (`.github/workflows/android.yml`) solo compila el CodeForge original, así que aquí se compila a mano
> (`npm run build && npx cap sync android` y después Gradle o Android Studio); y la carpeta `store/` (icono, capturas
> y textos de la ficha) no se ha copiado porque era la del juego original: hay que preparar la de Medio antes de publicar.
> Los iconos de `android/` siguen siendo los de CodeForge.


CodeForge ya es una app de Android de verdad: el mismo juego de la web, empaquetado con
**Capacitor** y con funciones nativas (botón «atrás», vibración, barra de estado, icono
adaptativo y pantalla de arranque). La app la compilan los servidores de **GitHub Actions**:
no necesitas instalar Android Studio.

| Pieza | Dónde está |
|---|---|
| Proyecto Android | `android/` (id de la app: `es.jrotero.codeforgemedio`) |
| Configuración de Capacitor | `capacitor.config.json` |
| Compilación automática | `.github/workflows/android.yml` |
| Textos e imágenes de la ficha | `store/google-play/` |
| Política de privacidad y borrado de cuenta | `public/privacidad.html` y `public/borrar-cuenta.html` |

> ⚠️ **El id `es.jrotero.codeforgemedio` es para siempre.** Si quieres otro, cámbialo en
> `capacitor.config.json` y en `android/app/build.gradle` (`namespace` y `applicationId`)
> **antes** de subir la primera versión a Google Play.

---

## Paso 1 · Probar la app en tu móvil (5 minutos)

1. Entra en tu repositorio de GitHub → pestaña **Actions** → **App Android**.
2. Pulsa la ejecución más reciente con el ✅ verde.
3. Abajo, en **Artifacts**, descarga **CodeForge-apk-pruebas** (es un .zip).
4. Pásalo al móvil, descomprímelo y abre el archivo `.apk`.
5. Android te pedirá permiso para *instalar apps de origen desconocido*: acéptalo solo para esta instalación.

> Si quieres compilar a mano: **Actions → App Android → Run workflow**.

---

## Paso 2 · Conectar la app con Firebase (cuentas en la nube y ranking)

Sin esto la app funciona en **modo local** (cada móvil guarda sus propias cuentas). Usa los
mismos valores que pusiste en Netlify (`DESPLIEGUE-NETLIFY.md`, paso de Firebase).

1. GitHub → tu repositorio → **Settings** → **Secrets and variables** → **Actions**.
2. Pulsa **New repository secret** y crea uno por cada valor:

   | Nombre del secreto | Valor |
   |---|---|
   | `VITE_FIREBASE_API_KEY` | apiKey |
   | `VITE_FIREBASE_AUTH_DOMAIN` | authDomain |
   | `VITE_FIREBASE_PROJECT_ID` | projectId |
   | `VITE_FIREBASE_APP_ID` | appId |
   | `VITE_FIREBASE_STORAGE_BUCKET` | storageBucket |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | messagingSenderId |

3. Despliega las reglas nuevas de Firestore (ahora permiten que cada jugador borre su cuenta):
   `npm run desplegar:reglas`.
4. Si en Google Cloud restringiste la API key por dominio, añade también `localhost`
   (la app de Android carga el juego desde `https://localhost`).

---

## Paso 3 · La llave de firma (obligatoria para Google Play)

Google Play solo acepta apps firmadas. Se ha creado una **llave de subida** para ti; está en
los archivos que te pasé en el chat:

- `codeforge-upload.jks` → la llave.
- `codeforge-upload.jks.base64.txt` → la misma llave en texto, para GitHub.
- `LEEME-llave-google-play.txt` → contraseña y alias.

1. **Guarda los tres archivos en un lugar seguro** (gestor de contraseñas, unidad privada).
   Nunca los subas al repositorio (el `.gitignore` ya lo impide).
2. En GitHub → **Settings → Secrets and variables → Actions**, crea estos 4 secretos:

   | Nombre del secreto | Valor |
   |---|---|
   | `ANDROID_KEYSTORE_BASE64` | todo el contenido de `codeforge-upload.jks.base64.txt` |
   | `ANDROID_KEYSTORE_PASSWORD` | la contraseña del archivo LEEME |
   | `ANDROID_KEY_ALIAS` | `codeforge` |
   | `ANDROID_KEY_PASSWORD` | la misma contraseña |

3. **Actions → App Android → Run workflow**. Al terminar verás un artifact nuevo:
   **CodeForge-google-play-aab** con el archivo `.aab` que se sube a Google Play.

> Si algún día pierdes la llave de subida, no pasa nada grave: Google Play permite
> restablecerla desde **Play Console → Prueba y publica → Configuración → Integridad de la app**.

---

## Paso 4 · Tu correo de contacto en la política de privacidad

Google Play exige una política de privacidad pública y una página para pedir el borrado de la cuenta.

1. Abre `public/privacidad.html` y `public/borrar-cuenta.html`.
2. Sustituye `[CORREO DE CONTACTO]` por el correo en el que quieras recibir consultas (aparece 3 veces en total).
3. Sube el cambio (commit + push). Netlify las publicará en:
   - `https://TU-SITIO.netlify.app/privacidad.html`
   - `https://TU-SITIO.netlify.app/borrar-cuenta.html`

---

## Paso 5 · Crear tu cuenta de desarrollador de Google Play

1. Entra en <https://play.google.com/console/signup> con tu cuenta de Google.
2. Elige **Personal** (tú) u **Organización** (empresa; necesita un número D-U-N-S).
3. Paga la cuota única de **25 US$** y verifica tu identidad (DNI) y tu teléfono.
4. La verificación puede tardar unos días.

> **Cuentas personales nuevas:** antes de publicar para todo el mundo, Google exige una
> **prueba cerrada con al menos 12 personas durante 14 días seguidos** (paso 9). Ve buscando
> 12 amigos o compañeros con móvil Android.

---

## Paso 6 · Crear la app en Play Console

1. **Play Console → Crear aplicación**.
2. Nombre: `CodeForge: aprende a programar`.
3. Idioma predeterminado: **Español (España) – es-ES**.
4. **Juego**, **Gratis**.
5. Acepta las declaraciones y pulsa **Crear aplicación**.

---

## Paso 7 · «Configura tu app» (Panel → tareas pendientes)

Completa cada tarjeta del panel con estas respuestas:

| Sección | Qué poner |
|---|---|
| **Política de privacidad** | `https://TU-SITIO.netlify.app/privacidad.html` |
| **Acceso a la app** | Elige *«Toda o parte de la funcionalidad está restringida»*: para jugar hay que registrarse. Crea en la app una cuenta para los revisores (por ejemplo `revision@tudominio.com` con una contraseña) y escribe ahí el correo y la contraseña. |
| **Anuncios** | No, la app no contiene anuncios. |
| **Clasificación de contenido** | Categoría *Juego*. Sin violencia, sexo, lenguaje soez, drogas ni apuestas. Interacción entre usuarios: los usuarios **no** pueden comunicarse; solo se ve su nick en un ranking. Resultado esperado: PEGI 3 / Para todos. |
| **Público objetivo** | 13-15, 16-17 y 18 o más. (Si marcas menores de 13 entras en el programa Familias, con requisitos extra). |
| **Aplicación de noticias / gubernamental / sanitaria / financiera** | No. |
| **Seguridad de los datos** | Ver tabla de abajo. |
| **Eliminación de cuentas** | Sí, se pueden crear cuentas. URL: `https://TU-SITIO.netlify.app/borrar-cuenta.html` |

### Seguridad de los datos (formulario)

- ¿Recoge o comparte datos? **Sí, recoge.** ¿Los comparte con terceros? **No** (Firebase es un proveedor de servicio, no cuenta como «compartir»).
- ¿Cifrados en tránsito? **Sí.**
- ¿Los usuarios pueden pedir que se borren? **Sí.**

| Tipo de dato | ¿Obligatorio? | Finalidad |
|---|---|---|
| Información personal → **Dirección de correo electrónico** | Obligatorio | Gestión de la cuenta |
| Información personal → **ID de usuario** (nick) | Obligatorio | Funcionalidad de la app, gestión de la cuenta |
| Actividad en la app → **Otro contenido generado por el usuario** (código y progreso) | Obligatorio | Funcionalidad de la app |
| Actividad en la app → **Otras acciones** (niveles, oro, XP) | Obligatorio | Funcionalidad de la app |

---

## Paso 8 · La ficha de Play Store

**Crecimiento → Presencia en Google Play → Ficha principal.** Todo está preparado en
`store/google-play/`:

- Textos: `store/google-play/ficha.md` (nombre, descripción breve y completa).
- Icono: `icono-512.png`.
- Gráfico destacado: `grafico-destacado-1024x500.png`.
- Capturas de teléfono: las 7 de `capturas/`, en orden.

Categoría: **Juego → Educativos**.

---

## Paso 9 · Prueba cerrada (obligatoria en cuentas personales nuevas)

1. **Prueba y publica → Pruebas → Prueba cerrada → Crear canal** (o usa *Alpha*).
2. **Testers:** crea una lista de correo con las **12 personas o más** (sus cuentas de Google).
3. **Crear versión** → la primera vez te preguntará por **Firma de aplicaciones de Google Play**: acéptala (Google guarda la llave final; tú solo usas la de subida).
4. Sube el `.aab` del artifact **CodeForge-google-play-aab**.
5. Notas de la versión: las tienes en `ficha.md`.
6. **Guardar → Revisar versión → Iniciar lanzamiento**.
7. Comparte con tus testers el enlace de participación. Deben **instalarla y mantenerse en la prueba 14 días seguidos**.

---

## Paso 10 · Producción

Pasados los 14 días: **Panel → Solicitar acceso a producción**, responde las preguntas sobre
la prueba y, cuando Google lo apruebe, **Producción → Crear versión** con el mismo `.aab` (o uno
más nuevo). La revisión suele tardar de unas horas a unos días.

---

## Publicar actualizaciones

1. Cambia la versión en `package.json` (`"version": "1.0.1"`). Es el número que verán los jugadores.
2. Haz commit y push a `codeforge-netlify`. GitHub compilará un `.aab` nuevo
   (el *código de versión* sube solo en cada compilación, como exige Google).
3. Play Console → el canal que quieras → **Crear versión** → sube el nuevo `.aab`.

---

## Qué tiene la app de Android

- **Botón «atrás» nativo:** cierra la ventana abierta (lección, pato, solución, recompensa),
  vuelve de la misión al mapa y, en el mapa, minimiza el juego.
- **Vibración** al superar una misión, al subir de rango y con los errores.
- **Teclado:** al escribir se ocultan las barras inferiores para dejar sitio al código.
- **Icono adaptativo** (con versión monocroma para los iconos temáticos de Android 13+) y pantalla de arranque oscura.
- **Sin conexión:** el juego va dentro de la app; solo necesita red para la cuenta y el ranking.
- **Borrar mi cuenta** desde el perfil (obligatorio en Google Play): borra la cuenta de Firebase, el nick, el perfil del ranking y todo el progreso.
- Android 7.0 o superior (API 24), compilada para Android 16 (API 36).
