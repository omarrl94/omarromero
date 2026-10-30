# Despliegue de la plataforma del máster en Firebase

La plataforma se publica en **Firebase**:

| Servicio | Para qué |
|---|---|
| **Firebase Hosting** | Sirve la web (`dist/index.html`) por HTTPS con las cabeceras de seguridad y la CSP de `firebase.json` |
| **Firebase Authentication** (correo y contraseña) | Cuentas de la Dirección y del alumnado, verificación del correo y recuperación de contraseña |
| **Cloud Firestore** | Matrículas, códigos de admisión, entregas, actas, tribunal, libro de registro de títulos, verificación pública y auditoría |

Toda la autorización vive en `firestore.rules`:
- La Dirección es la cuenta `omar.romero@jrotero.es`, y solo con el correo verificado.
- Cada alumno solo lee y escribe lo suyo.
- Notas, actas, títulos y certificados solo los escribe la Dirección.
- La verificación pública de un diploma solo expone datos mínimos.

Los tests de `tests/reglas.test.mjs` comprueban estas reglas.

> Sin `firebase.config.json` la build genera el **modo demostración**: los datos se guardan en el navegador.
> Ese modo sirve para enseñar la plataforma, no para la edición real. `npm run deploy` se niega a publicar en
> modo demostración.

## 1. Requisitos en tu equipo (una vez)

- **Node.js 22 o posterior** (recomendado 24 LTS): <https://nodejs.org>.
- **Git** y una cuenta de Google con acceso a la consola de Firebase. Lo ideal es la cuenta del centro.

```powershell
git clone https://github.com/omarrl94/omarromero.git
cd omarromero
git switch feature/master-ia-post-dam-v2
cd master-ia
npm ci                       # instala también firebase-tools (la CLI de Firebase)
npx firebase login           # abre el navegador para iniciar sesión con tu cuenta de Google
```

## 2. Crear el proyecto de Firebase (consola, una vez)

1. Entra en <https://console.firebase.google.com> → **Crear un proyecto**.
   - Nombre, por ejemplo, `master-ia-jrotero`.
   - Google Analytics: **desactivado**. No hace falta, y así se evitan cookies de analítica.
2. **Plan:** el plan gratuito *Spark* basta para 30 alumnos. Para las copias de seguridad programadas
   (paso 8) necesitas el plan *Blaze* (pago por uso). Con este volumen el coste es de céntimos al mes;
   pon un **presupuesto con alerta** en Google Cloud → Facturación → Presupuestos.
3. **Authentication:**
   1. Ve a **Compilación → Authentication → Comenzar**.
   2. En **Método de acceso**, activa **Correo electrónico/contraseña**. El «vínculo de correo electrónico» queda desactivado.
   3. En **Configuración → Dominios autorizados**, añade tu dominio propio cuando lo tengas (paso 7).
   4. Opcional: en **Plantillas**, pon el idioma **español** y el nombre del centro como remitente.
4. **Firestore:**
   1. Ve a **Compilación → Firestore Database → Crear base de datos**.
   2. Elige la edición **Standard** y la ubicación **`europe-southwest1` (Madrid)**. Los datos se quedan en la UE, y la ubicación **no se puede cambiar** después.
   3. Empieza en **modo de producción**. Las reglas reales se suben en el paso 5.
5. **Registrar la app web:**
   1. Ve a **Configuración del proyecto** (rueda dentada) → **Tus apps** → icono **`</>`** (Web).
   2. Ponle un apodo, por ejemplo `plataforma`. No marques Hosting aquí.
   3. Copia el objeto `firebaseConfig` que te muestra.

## 3. Conectar el código con tu proyecto

1. Crea el fichero de configuración de la app web:

   ```powershell
   copy firebase.config.example.json firebase.config.json     # en macOS/Linux: cp
   ```

2. Rellena `firebase.config.json` con los valores copiados: `apiKey`, `authDomain`, `projectId`,
   `storageBucket`, `messagingSenderId` y `appId`. Esta configuración **no es secreta**: la ve cualquier
   navegador, y la seguridad la ponen las reglas. Puedes subirla al repositorio.
3. Vincula la carpeta con el proyecto:

   ```powershell
   npx firebase use --add      # elige el proyecto y ponle el alias "produccion"
   ```

   Esto crea `.firebaserc`, que también conviene subir al repositorio.

## 4. Probar en local con los emuladores (recomendado)

```powershell
npm run test:reglas          # 22 tests de las reglas de seguridad contra el emulador de Firestore
npm run build:emuladores     # build que habla con los emuladores (proyecto demo-master-ia)
npm run emuladores           # Auth 9099 · Firestore 8085 · web en http://127.0.0.1:5002 · panel en http://127.0.0.1:4000
```

En el emulador no se envían correos. El enlace de verificación aparece en la consola de los emuladores
y en el panel <http://127.0.0.1:4000/auth>.

Los emuladores necesitan **Java 21** instalado.

## 5. Publicar

```powershell
npm run deploy
```

El comando hace dos cosas:
- **Build de producción:** valida el temario, compila Tailwind, incrusta el SDK de Firebase y calcula la CSP.
- **Despliegue:** `firebase deploy --only hosting,firestore:rules,firestore:indexes`.

Al terminar verás la URL `https://<proyecto>.web.app`.

## 6. Primer acceso de la Dirección

1. Abre la web → **Primer acceso de la Dirección**.
2. Elige una contraseña: al menos 10 caracteres, con mayúsculas, minúsculas y números.
3. Llegará un correo a `omar.romero@jrotero.es`. Pulsa el enlace y vuelve a la web → **Ya lo he verificado**.
4. Se abre el **Panel de Dirección**. Desde ahí generas los códigos de admisión para plazas externas.

> Haz este paso **nada más publicar**: la cuenta de Dirección solo se puede crear con ese correo, y las
> reglas no le dan permisos hasta que el correo está verificado.

Si el correo no llega, revisa la carpeta de spam y la cuarentena de Microsoft 365 del dominio `jrotero.es`.
El remitente es `noreply@<proyecto>.firebaseapp.com`.

## 7. Dominio propio (`master-ia.jrotero.es`)

1. En la consola de Firebase, abre **Hosting → Añadir dominio personalizado** → `master-ia.jrotero.es`.
2. Firebase te da unos registros DNS (normalmente **A** o **TXT** de verificación). Créalos en el DNS de `jrotero.es`.
3. Espera a que el certificado HTTPS aparezca como **Conectado**. Suele tardar de minutos a pocas horas.
4. En **Authentication → Configuración → Dominios autorizados**, añade `master-ia.jrotero.es`.
5. Opcional: para que los correos de verificación salgan con el dominio del centro, configura
   **Authentication → Plantillas → Dominio personalizado** y añade los registros DNS que indica.

## 8. Copias de seguridad y conservación

- **Exportar en JSON:** Panel de Dirección → **Datos y auditoría** → **Exportar en JSON**. Hazlo al cerrar
  cada módulo y guárdalo en el archivo del centro.
- **Copias automáticas** (plan Blaze): en Google Cloud Console → Firestore → **Recuperación ante desastres**,
  activa las **copias de seguridad programadas** (diarias, con retención de 7 a 14 días) y la
  **recuperación a un momento dado (PITR)**.
- **Libro de registro de títulos:** los diplomas expedidos quedan en `titulos` y en `verificaciones`.
  No se borran aunque el alumno ejerza el derecho de supresión.

## 9. Actualizar la plataforma

1. Edita el temario en `src/data/`: una sesión por objeto; las fechas y las horas van en `modulos.js`.
2. Ejecuta `npm run deploy`. Si una rúbrica no suma 100 %, faltan horas o la numeración está rota, la build falla y no se publica nada.
3. Haz `git commit` y `git push` para guardar el cambio en el repositorio.

Para volver a la versión anterior, abre **Hosting** en la consola y pulsa **Revertir** sobre el
despliegue previo. El cambio es instantáneo.

## 10. Comprobaciones tras publicar

- [ ] `https://<proyecto>.web.app` (y el dominio propio) abre la pantalla de acceso **sin** el aviso de
      «modo demostración».
- [ ] `curl -I https://master-ia.jrotero.es/` muestra `Content-Security-Policy`, `X-Frame-Options` y
      `Strict-Transport-Security`, y la consola del navegador no muestra errores de CSP.
- [ ] Primer acceso de la Dirección hecho y correo verificado.
- [ ] Prueba completa en **dos navegadores distintos**:
  1. Con la Dirección, genera un código de admisión.
  2. Con una alumna de prueba, matricúlate con el código, verifica el correo y haz una entrega.
  3. Con la Dirección, corrige la entrega.
  4. Borra la alumna de prueba con **Perfil → Derecho de supresión**.
- [ ] **Firestore → Reglas** muestra las reglas de `firestore.rules`, no las de prueba.
- [ ] Presupuesto con alerta creado (si usas Blaze).
- [ ] Textos legales revisados por la asesoría del centro (apartado 15 del programa): título propio sin
      carácter oficial, protección de datos y alfabetización en IA del personal.
- [ ] Contrato de encargado del tratamiento con Google: aceptar los *Data Processing Terms* de
      Firebase/Google Cloud en **Configuración del proyecto → Privacidad**. Anótalo también en el registro de actividades de tratamiento.

## Alternativas (sin Firebase)

La build sin `firebase.config.json` genera el modo demostración, que se puede publicar en cualquier
hosting estático:
- **Netlify:** `netlify.toml`, con Base directory `master-ia`.
- **Docker/nginx:** `Dockerfile` y `deploy/nginx.conf`.

En ese modo los datos se guardan en el navegador de cada usuario.
