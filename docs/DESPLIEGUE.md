# Despliegue paso a paso en Netlify

Tiempo estimado: 20-30 minutos la primera vez. No hace falta instalar nada en tu ordenador:
todo se hace desde el navegador (GitHub y Netlify).

## 0. Antes de empezar

- Acceso de administración al repositorio `omarrl94/omarromero` en GitHub.
- Una cuenta de Netlify (el plan gratuito basta). Puedes entrar con tu cuenta de GitHub.
- Decide el **código de acceso** que darás al alumnado (por ejemplo, una frase de 3 palabras; cámbialo cada curso).

## 1. Verificar las empresas (GitHub Actions)

El directorio solo publica empresas verificadas. La verificación necesita Internet, así que se ejecuta en GitHub Actions.

1. Ve a **github.com/omarrl94/omarromero → pestaña Actions**. Si GitHub lo pide, pulsa *I understand my workflows, go ahead and enable them*.
2. El flujo **«Verificar empresas»** se ejecuta solo cada vez que cambia `data/empresas.candidatas.json` en la rama `conecta-ffe`, y el día 1 de cada mes. Para lanzarlo a mano: ábrelo → **Run workflow** → rama `conecta-ffe`.
3. Tarda unos 10-20 minutos. Al terminar, hace un commit en la rama con:
   - `data/empresas.json`: las empresas verificadas;
   - `docs/INFORME-VERIFICACION.md`: válidas, descartadas y motivos;
   - `docs/AUDITORIA-MUESTRA.md`: 10 empresas al azar comprobadas de nuevo;
   - `docs/COMPROBACION-ENLACES.md`: enlaces rotos y portales.
4. **Revisión humana (obligatoria la primera vez):** abre `docs/INFORME-VERIFICACION.md` en GitHub. En 10 empresas al azar, abre la URL de la fuente y comprueba que el correo aparece y que es un buzón para candidaturas. Si alguna no te convence, añádela a `data/retiradas.json` (ver `docs/GUIA-EMPRESAS.md`).

> El flujo **CI** comprueba en cada cambio que todo sigue funcionando (lint, pruebas, build y E2E). Si sale en rojo, no despliegues hasta revisarlo.

## 2. Crear el sitio en Netlify

1. Entra en **app.netlify.com** → **Add new project** → **Import an existing project** → **GitHub**.
2. Autoriza a Netlify y elige el repositorio **omarrl94/omarromero**.
3. En la configuración:
   - **Branch to deploy:** `conecta-ffe`
   - **Build command** y **Publish directory:** déjalos vacíos; se leen de `netlify.toml` (`npm run check` y `dist`).
4. **Antes de pulsar Deploy**, despliega el apartado *Environment variables* (o hazlo en el paso 3 y vuelve a desplegar).

## 3. Variables de entorno

En **Project configuration → Environment variables → Add a variable** (ámbito: *Builds* y *Functions*):

| Variable | Valor |
|---|---|
| `ACCESS_CODE` | El código del alumnado |
| `SESSION_SECRET` | **Opcional.** Si no la pones, o si es corta, el servidor genera y guarda su propia clave aleatoria |
| `ADZUNA_APP_ID` y `ADZUNA_APP_KEY` | Opcional (ver paso 7) |
| `INFOJOBS_CLIENT_ID` y `INFOJOBS_CLIENT_SECRET` | Opcional (ver paso 7) |

Marca `ACCESS_CODE`, `SESSION_SECRET` y las claves como **secretas** (*Contains secret values*).
**No** les pongas el prefijo `VITE_`.

## 4. Desplegar

1. **Deploys → Trigger deploy → Deploy site.**
2. El build ejecuta `npm run check`: lint, tipos, 43 pruebas, validación de datos, build y la comprobación de que ningún correo protegido llega a la web pública. Si algo falla, el despliegue se detiene y el sitio anterior sigue publicado.
3. Al terminar, Netlify te da una URL tipo `https://nombre-aleatorio.netlify.app`. Cámbiala en **Domain management → Options → Edit site name** (por ejemplo `conecta-ffe-jrotero`).

## 5. Activar el formulario de retirada

1. **Forms → Enable form detection** y vuelve a desplegar (*Trigger deploy*).
2. Debe aparecer el formulario **`retirada`**.
3. **Forms → Form notifications → Add notification → Email notification** → tu correo (o el del responsable de protección de datos).

## 6. Primera carga de ofertas

1. **Logs → Functions → `ofertas-actualizar`** (o **Functions** en el menú) → **Run now** si aparece la opción. Si no, espera a la ejecución diaria (06:17 UTC).
2. Sin claves de Adzuna ni InfoJobs solo se cargan los feeds públicos de las empresas del directorio que los tengan. Es normal que al principio haya pocas ofertas o ninguna. La página lo indica y ofrece los enlaces a portales.

## 7. Fuentes de ofertas (opcional)

- **Adzuna:** regístrate en developer.adzuna.com y crea una aplicación. Sus condiciones dan **14 días de prueba**; para usarlo después, escribe a Adzuna explicando el uso educativo sin ánimo de lucro. Comprueba primero que España responde:
  `https://api.adzuna.com/v1/api/jobs/es/search/1?app_id=TU_ID&app_key=TU_CLAVE&results_per_page=1`
- **InfoJobs:** registra una aplicación en developer.infojobs.net y acepta sus condiciones. Añade las dos claves a Netlify.
- Tras añadir claves: **Deploys → Trigger deploy** y vuelve a ejecutar `ofertas-actualizar`.

## 8. Enlaces a portales (LinkedIn, Indeed…)

En producción están ocultos hasta que se prueben. Para cada portal:

1. Abre la versión de desarrollo o la demo, entra en **Ofertas** y pulsa el enlace del portal.
2. Si abre una búsqueda filtrada por el perfil y por Madrid, edita `config/ffe.config.ts` en GitHub (icono del lápiz) y en ese portal cambia `probado: false` por `probado: true` y `fechaPrueba: null` por la fecha (`'2026-11-05'`).
3. Haz commit en `conecta-ffe`: Netlify despliega solo.

## 9. Comprobación final (10 minutos)

En la URL de producción, desde el móvil y desde el ordenador:

- [ ] La portada carga y permite elegir ciclo, perfil, zona y modalidad.
- [ ] `#/empresas` pide el código. Con un código erróneo avisa; tras 5 intentos fallidos bloquea 15 minutos.
- [ ] Con el código correcto aparecen las empresas verificadas.
- [ ] En una ficha, con tu nombre en «Mis datos», el correo se genera con el tutor en copia. **Cambia el «Para» por tu propio correo** y prueba Outlook web y Gmail.
- [ ] `https://TU-SITIO/api/empresas` abierto en una ventana privada devuelve `{"error":"Necesitas el código de acceso del centro."}`.
- [ ] La página `#/ofertas` muestra la fecha de actualización y el estado de las fuentes.
- [ ] `#/privacidad`: envía una solicitud de prueba y comprueba que llega a Netlify Forms y a tu correo; después bórrala.
- [ ] «Mis datos» → «Borrar todos mis datos» deja la app como nueva.

## 10. Mantenimiento

| Cuándo | Qué |
|---|---|
| Cada curso | Cambiar `ACCESS_CODE`; actualizar fechas, horas y tutores en `config/ffe.config.ts` |
| Cada mes (automático) | «Verificar empresas» se ejecuta solo; revisa el commit que genera |
| Antes de cada periodo de FFE | Revisión manual de 10 empresas al azar |
| Al recibir una retirada | `data/retiradas.json`, en un máximo de 10 días hábiles |
| Cada trimestre | Revisar el estado de las fuentes en `#/ofertas` y las alertas de dependencias de GitHub |

Para añadir empresas: `docs/GUIA-EMPRESAS.md`. Al hacer commit de nuevas candidatas, la verificación se lanza sola.

## Solución de problemas

| Lo que ves | Causa | Solución |
|---|---|---|
| «El acceso no está configurado en el servidor (falta ACCESS_CODE)» | A las funciones les falta `ACCESS_CODE` | Comprueba los nombres exactos y que el ámbito incluye *Functions*. Después: **Deploys → Trigger deploy → Clear cache and deploy project** |
| «Código incorrecto» | El código no coincide con `ACCESS_CODE` | Revisa el valor (sin espacios al principio ni al final) |
| «Demasiados intentos» | 5 fallos en 15 minutos desde la misma conexión | Espera 15 minutos o prueba desde otra red |
| Error 502 o «SESSION_SECRET demasiado corto» | Versión anterior de la app | Despliega la última versión de `conecta-ffe`: ahora `SESSION_SECRET` es opcional |
| `/api/empresas` responde «Necesitas el código de acceso del centro.» | Es lo correcto: las funciones responden y protegen el directorio | Entra con el código desde la web |
