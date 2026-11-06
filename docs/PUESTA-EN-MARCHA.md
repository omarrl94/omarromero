# Conecta FFE · Guía de puesta en marcha

Todo se hace desde el navegador. Tiempo total: unos 60 minutos.

**Archivos de esta guía** (van adjuntos y también están en GitHub):

| Archivo | Para qué | Enlace directo en GitHub |
|---|---|---|
| `reglas-firestore.txt` | Parte 2, paso 2.6 | https://github.com/omarrl94/omarromero/blob/conecta-ffe/firebase/firestore.rules |
| `plantilla-variables-netlify.txt` | Parte 3 | https://github.com/omarrl94/omarromero/blob/conecta-ffe/docs/plantilla-variables-netlify.txt |
| Configuración editable | Parte 8 | https://github.com/omarrl94/omarromero/blob/conecta-ffe/config/ffe.config.ts |

Índice:
1. Lo que necesitas
2. Firebase
3. Variables en Netlify
4. Desplegar
5. Tu primera entrada (superadmin)
6. Formulario de retirada de empresas
7. Comprobación final
8. Ajustes del curso (tutor de ASIR, fechas, portales)
9. Fuentes de ofertas (opcional)
10. Mantenimiento
11. Si algo falla

---

## Parte 1 · Lo que necesitas

- [ ] Acceso a **GitHub** con la cuenta `omarrl94`.
- [ ] Acceso a **Netlify** (el proyecto conectado a la rama `conecta-ffe`).
- [ ] Una **cuenta de Google** para crear el proyecto de Firebase (mejor una del centro).
- [ ] Los datos **SMTP del buzón del centro**: los mismos de ColaboraFP o de la web de exámenes. Necesitarás la contraseña.

**Archivo:** abre `plantilla-variables-netlify.txt` en tu ordenador y ve rellenándolo mientras sigues la guía.

---

## Parte 2 · Firebase

Entra en **https://console.firebase.google.com**.

### 2.1 Crear el proyecto
1. **«Crear un proyecto»** → nombre **`conecta-ffe`** → **Continuar**.
2. **Google Analytics:** desactívalo → **«Crear proyecto»** → **Continuar**.

### 2.2 Activar correo y contraseña
1. Menú izquierdo: **Compilación → Authentication → «Comenzar»**.
2. Pestaña **«Método de acceso»** → **«Correo electrónico/contraseña»**.
3. Activa **solo el primer interruptor** → **Guardar**.

### 2.3 Plantillas en español (plan B)
Authentication → pestaña **«Plantillas»** → **lápiz** → **Idioma de la plantilla: Español** → **Guardar**.

### 2.4 Autorizar tu web
Authentication → **«Configuración» → «Dominios autorizados» → «Agregar dominio»**. Escribe tu dirección de Netlify **sin `https://`** (ej.: `conecta-ffe-jrotero.netlify.app`) y pulsa **Agregar**.

### 2.5 Crear Firestore
1. Menú: **Compilación → Firestore Database → «Crear base de datos»**.
2. Edición: **Standard** (si lo pregunta). ID: `(default)`.
3. Ubicación: **`europe-southwest1 (Madrid)`**. ⚠️ No se puede cambiar después.
4. **«Iniciar en modo de producción»** → **Crear**.

### 2.6 Pegar las reglas
**Archivo:** `reglas-firestore.txt` (adjunto) · [ver en GitHub](https://github.com/omarrl94/omarromero/blob/conecta-ffe/firebase/firestore.rules) · [versión sin formato para copiar](https://raw.githubusercontent.com/omarrl94/omarromero/conecta-ffe/firebase/firestore.rules)

1. Firestore Database → pestaña **«Reglas»**.
2. **Borra todo** lo que haya.
3. Abre `reglas-firestore.txt`, **Ctrl+A**, **Ctrl+C** y pégalo en el editor.
4. **«Publicar»**.

### 2.7 Registrar la app web
1. **⚙️ (arriba a la izquierda) → Configuración del proyecto → General → «Tus apps» → icono `</>`**.
2. Sobrenombre: `Conecta FFE`. **No** marques Firebase Hosting → **«Registrar app»**.
3. Copia en la plantilla (apartado A) los 4 valores del bloque `firebaseConfig`, sin comillas:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`
4. **«Ir a la consola»**.

### 2.8 Clave del servidor
1. **⚙️ → Configuración del proyecto → «Cuentas de servicio»**.
2. **«Generar nueva clave privada» → «Generar clave»**. Se descarga un `.json`.
3. ⚠️ Es la llave del servidor: **no la envíes ni la subas a GitHub**. La usarás en el paso 3.3.

---

## Parte 3 · Variables en Netlify

**Archivo:** `plantilla-variables-netlify.txt` (adjunto).

Entra en **https://app.netlify.com** → tu proyecto → **Project configuration → Environment variables**.

Para cada variable: **«Add a variable» → «Add a single variable»** → **Key** → **Scopes: All scopes** → **Values: «Same value for all deploy contexts»** → **Create variable**.

### 3.1 Firebase web (apartado A) · ⚠️ NO marques «Contains secret values»
`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
Si las marcas como secretas, Netlify detiene el despliegue: son públicas por diseño.

### 3.2 Correo del centro (apartado C)
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `MAIL_FROM`, y `SMTP_PASS` (esta **sí**, marcada como secreta).

### 3.3 Clave del servidor (apartado B) · ✅ marca «Contains secret values»
1. Abre el `.json` del paso 2.8 con el **Bloc de notas** (clic derecho → Abrir con).
2. **Ctrl+A**, **Ctrl+C** (empieza por `{` y acaba en `}`).
3. Key **`FIREBASE_SERVICE_ACCOUNT`**, marca **Contains secret values** y pega.

### 3.4 Dirección de la web (apartado D)
`APP_URL` = `https://TU-PROYECTO.netlify.app` (sin barra final).

### 3.5 Borrar lo antiguo (apartado F)
En la lista, pulsa **«…» → Delete variable** en `ACCESS_CODE` y en `TUTOR_ACCESS_CODE`.

---

## Parte 4 · Desplegar

1. **Deploys → «Trigger deploy» → «Clear cache and deploy project»**.
2. Espera a **«Published»** en verde (3-4 minutos).
3. Si sale **«Failed»**, abre el despliegue y copia las últimas líneas del registro (ver Parte 11).

---

## Parte 5 · Tu primera entrada (superadmin)

1. Abre tu web → **«Entrar»** (arriba a la derecha) → pestaña **«Crear cuenta»**.
2. **«Soy profesor/a tutor/a»** → tu nombre → **`omar.romero@jrotero.es`** → una contraseña (mínimo 8 caracteres) → marca el aviso de privacidad → **«Crear cuenta»**.
3. Te llega **«Conecta FFE · Confirma tu correo»** (mira también en no deseado) → **abre el enlace**.
4. En la web: **«Ya lo he verificado»**.
5. **«Verificación en dos pasos» → «Enviarme el código»** → escribe el código de 6 cifras → **«Comprobar»**.
6. Llegas a **Admin · Usuarios y roles**. ✅

---

## Parte 6 · Formulario de retirada de empresas

1. Netlify → **Forms** → **«Enable form detection»**.
2. **Deploys → Trigger deploy → Deploy project** y espera a «Published».
3. Vuelve a **Forms**: debe aparecer **`retirada`**.
4. **Form notifications → Add notification → Email notification** → tu correo → **Save**.

---

## Parte 7 · Comprobación final (10 minutos)

Usa un alumno y un profesor de prueba (o pide a un compañero).

- [ ] **Alumno:** «Crear cuenta» → «Soy alumno/a» con un correo **@a.jrotero.es** → llega el correo → al verificar entra en **Empresas** y ve el directorio.
- [ ] **Profesor:** «Crear cuenta» → «Soy profesor/a tutor/a» con un correo **@jrotero.es** → al verificar sale **«Solicitud enviada»** y **a ti te llega un aviso**.
- [ ] **Tú:** en **Admin**, «Aprobar como tutor/a». Al profesor le llega un correo; entra con su código y ve **Tutores**.
- [ ] **Seguridad:** abre `https://TU-PROYECTO.netlify.app/api/empresas` en una ventana privada. Debe decir «Inicia sesión para ver las empresas.»
- [ ] **Sincronización:** con la misma cuenta de alumno en el móvil y en el ordenador, **Mis datos** muestra lo mismo.
- [ ] **Borrado:** con la cuenta de prueba, **Mis datos → «Borrar mi cuenta y mis datos»**. Desaparece de **Admin**.

---

## Parte 8 · Ajustes del curso

**Archivo:** `config/ffe.config.ts` → [abrir para editar en GitHub](https://github.com/omarrl94/omarromero/edit/conecta-ffe/config/ffe.config.ts)

Al guardar en GitHub (**«Commit changes»** en la rama `conecta-ffe`), Netlify vuelve a publicar solo.

### 8.1 Tutor/a de ASIR
Busca:
```
ASIR: null,
```
y cámbialo por:
```
ASIR: { nombre: 'Nombre Apellido', email: 'correo@jrotero.es' },
```

### 8.2 Horas de ASIR
Cuando confirmes las 420 h, busca `horasPendientesDeConfirmar` y cambia `ASIR: true` por `ASIR: false`.

### 8.3 Fechas de las modalidades (cada curso)
Busca `modalidades` y cambia las fechas `inicio` y `fin` (formato `AAAA-MM-DD`).

### 8.4 Activar Indeed, Tecnoempleo y Glassdoor
1. Pruébalos: en la web, **Ofertas** → abajo, «Busca también en los portales». También puedes probarlos en la demo, donde salen con «(sin comprobar)».
2. Si un enlace abre una búsqueda filtrada por perfil y Madrid, en su línea de `enlacesProfundos` cambia `probado: false` por `probado: true` y `fechaPrueba: null` por `fechaPrueba: '2026-11-06'`.

### 8.5 Otro superadmin (opcional)
En Netlify, añade la variable `SUPERADMIN_EMAILS` = `otra.persona@jrotero.es` (varias, separadas por comas) y redespliega.

---

## Parte 9 · Fuentes de ofertas (opcional)

1. **Adzuna:** regístrate en https://developer.adzuna.com y copia **Application ID** y **Application Key**. Comprueba España abriendo:
   `https://api.adzuna.com/v1/api/jobs/es/search/1?app_id=TU_ID&app_key=TU_CLAVE&results_per_page=1`
   Sus condiciones dan 14 días de prueba: pide por escrito el uso educativo sin ánimo de lucro.
2. **InfoJobs:** registra la aplicación en https://developer.infojobs.net y copia **Client ID** y **Client Secret**.
3. En Netlify añade `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `INFOJOBS_CLIENT_ID` e `INFOJOBS_CLIENT_SECRET` (secretas, apartado E de la plantilla) y redespliega.
4. **Functions → `ofertas-actualizar` → «Run now»** (o espera a la actualización diaria).

---

## Parte 10 · Mantenimiento

| Cuándo | Qué | Acceso directo |
|---|---|---|
| Al recibir una solicitud de tutor | Aprobarla | Tu web → **Admin** |
| Cada mes (automático) | Revisar la verificación de empresas | [GitHub Actions · Verificar empresas](https://github.com/omarrl94/omarromero/actions/workflows/verificar-empresas.yml) · [Informe](https://github.com/omarrl94/omarromero/blob/conecta-ffe/docs/INFORME-VERIFICACION.md) |
| Si una empresa pide la retirada | Añadirla a la lista de retiradas (máximo 10 días hábiles) | [Editar `data/retiradas.json`](https://github.com/omarrl94/omarromero/edit/conecta-ffe/data/retiradas.json) · [Guía](https://github.com/omarrl94/omarromero/blob/conecta-ffe/docs/GUIA-EMPRESAS.md) |
| Para añadir empresas | Añadirlas como candidatas (se verifican solas) | [Editar candidatas](https://github.com/omarrl94/omarromero/edit/conecta-ffe/data/empresas.candidatas.json) |
| Cada curso | Fechas y tutores; bloquear las cuentas de quien terminó | Parte 8 · **Admin** |

Formato de una retirada en `data/retiradas.json`:
```
[{ "id": "id-de-la-empresa", "dominio": "empresa.es", "fecha": "2026-11-06", "motivo": "Solicitud de la empresa" }]
```

---

## Parte 11 · Si algo falla

| Lo que ves | Solución |
|---|---|
| «Las cuentas todavía no están configuradas» | Faltan las 4 `VITE_FIREBASE_*` (Parte 3.1) → redespliega |
| El despliegue falla por «secrets» | Has marcado como secreta alguna `VITE_FIREBASE_*`: desmárcala |
| El despliegue falla por «4 KB» | Usa las tres variables alternativas del apartado B de la plantilla |
| No llega el correo de verificación | Revisa `SMTP_*` (Parte 3.2) y el correo no deseado. Si el buzón falla, la web usa el correo de Firebase como plan B |
| «535» o «rechazó el usuario o la contraseña» | En Microsoft 365, el administrador debe activar **SMTP autenticado** para ese buzón |
| `auth/unauthorized-domain` | Falta el dominio en Firebase (Parte 2.4) |
| Estás dentro pero no cargan las empresas | `FIREBASE_SERVICE_ACCOUNT` es de otro proyecto: genera la clave en **este** (Parte 2.8) |
| El profesor no ve «Tutores» | Apruébalo en **Admin**; después debe introducir el código que le llega |

Si te atascas, dime **la parte y el paso** y **el texto exacto** que ves en pantalla.
