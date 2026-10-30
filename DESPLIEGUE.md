# Publicar el Campus Virtual

El campus se publica en **Netlify** (web + funciones de pago) con un proyecto de **Firebase propio**.
No reutilices el proyecto del curso de Claude ni el del máster: cada uno tiene sus reglas de Firestore y
desplegar estas encima borraría las suyas.

## 1. Firebase (una vez)

1. <https://console.firebase.google.com> → **Crear un proyecto**. Nombre sugerido: `campus-jrotero`.
2. **Authentication → Método de acceso → Correo electrónico/contraseña → Habilitar.**
3. **Firestore Database → Crear base de datos** (ubicación `europe-west`, modo producción).
4. **Configuración del proyecto → Tus apps → Web (`</>`)**: copia `apiKey`, `authDomain`, `projectId` y `appId`.
5. **Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada**: descarga el JSON.
   Es secreto: guárdalo solo en Netlify.
6. Sube las reglas desde esta carpeta:

   ```bash
   npm install
   npx firebase login
   npx firebase use --add          # elige campus-jrotero
   npm run desplegar:reglas
   ```

## 2. Netlify

1. **Add new site → Import from Git** → este repositorio, rama **`campus`**.
   Build command y publish directory ya vienen en `netlify.toml`.
2. **Site configuration → Environment variables**:

   | Variable | Valor | Ámbito |
   | --- | --- | --- |
   | `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID` | los del paso 1.4 | Builds y Functions |
   | `FIREBASE_SERVICE_ACCOUNT` | el JSON completo del paso 1.5 (secret) | Functions |
   | `CAMPUS_API_KEY` | `openssl rand -hex 32` (secret) | Functions |
   | `APP_URL` | `https://campus.jrotero.es` (opcional) | Functions |

3. **Deploys → Trigger deploy**.
4. En Firebase → **Authentication → Configuración → Dominios autorizados**, añade el dominio de Netlify
   (y `campus.jrotero.es` si usas dominio propio).

## 3. Primer acceso de la administración

1. Abre el campus → **Crear cuenta** con `omar.romero@jrotero.es`.
2. Verifica el correo con el enlace que llega y pulsa **Ya lo he verificado**.
3. Aparece **Panel**. Ve a **Catálogo → Cargar catálogo inicial** y revisa precios y direcciones.

## 4. Pagos con Stripe (cuando quieras cobrar)

Hasta que no hagas esto, las formaciones de pago muestran **«Solicitar matrícula»**.

1. Crea la cuenta en <https://dashboard.stripe.com> con los datos fiscales del centro.
2. **Developers → API keys** → copia la *Secret key* en `STRIPE_SECRET_KEY` (Netlify, Functions, secret).
   Empieza con la de pruebas (`sk_test_…`).
3. **Developers → Webhooks → Add endpoint**
   - URL: `https://<tu-campus>/.netlify/functions/stripe-webhook`
   - Eventos: `checkout.session.completed` y `checkout.session.async_payment_succeeded`
   - Copia el *Signing secret* en `STRIPE_WEBHOOK_SECRET`.
4. Vuelve a desplegar. Prueba una compra con la tarjeta `4242 4242 4242 4242`: en unos segundos la
   formación aparece en *Mi campus* y el pedido en *Panel → Pedidos*.
5. Cambia a las claves `sk_live_…` y repite el paso 3 en modo real.

> Revisa con la asesoría del centro el IVA de cada formación, la facturación y el texto de
> «Condiciones de contratación» (`modalCondiciones` en `src/app.js`) antes de cobrar.

## 5. Conectar las plataformas

Pon la dirección de cada plataforma en su ficha (*Panel → Catálogo → Editar → Dirección*), y si quieres que
comprueben el acceso contra el campus sigue [INTEGRACION.md](INTEGRACION.md).

## Comprobación final

- [ ] El catálogo se ve sin iniciar sesión y la administración ve **Panel**.
- [ ] Una cuenta nueva verifica el correo y canjea un código de prueba.
- [ ] `npm run probar:reglas` → 32 pruebas correctas.
- [ ] Una compra de prueba crea pedido y matrícula (con Stripe en modo test).
- [ ] `curl -H "X-Campus-Key: <clave>" "https://<tu-campus>/.netlify/functions/campus?email=<correo>&formacion=curso-claude"` responde `acceso`.
