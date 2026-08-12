# 🚀 Desplegar Hipster Bingo en Netlify

Guía completa, de cero a URL pública. Tiempo estimado: **10 minutos**.

---

## Paso 0 · Consigue las credenciales de Supabase (obligatorio)

La app usa Supabase Realtime para el multijugador. **No necesitas base de datos ni crear tablas**, solo un proyecto vacío del plan gratuito.

1. Entra en [supabase.com](https://supabase.com) y crea una cuenta (gratis).
2. Pulsa **New project**. Ponle cualquier nombre y contraseña, elige la región más cercana y espera ~2 minutos a que se aprovisione.
3. Ve a **Project Settings** (icono del engranaje) → **API**.
4. Apunta estos dos valores, que usarás en el paso 3:

| Valor en Supabase | Variable de entorno |
|---|---|
| **Project URL** (ej. `https://abcdxyz.supabase.co`) | `NEXT_PUBLIC_SUPABASE_URL` |
| **anon public** (clave larga que empieza por `eyJ...`) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

> ⚠️ Usa la clave **anon public**, nunca la `service_role`. La anon está pensada para ir en el navegador; la otra es secreta.

---

## Paso 1 · Sube el proyecto a GitHub

Netlify necesita leer el código de un repositorio para poder compilarlo con tus variables de entorno.

1. Crea un repositorio nuevo y **vacío** en [github.com/new](https://github.com/new) (sin README, sin .gitignore).
2. Desde la carpeta del proyecto, en tu terminal:

```bash
git init
git add .
git commit -m "Hipster Bingo"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```

---

## Paso 2 · Conecta el repositorio con Netlify

1. Entra en [app.netlify.com](https://app.netlify.com) e inicia sesión (puedes usar tu cuenta de GitHub).
2. Pulsa **Add new site** → **Import an existing project**.
3. Elige **GitHub** y autoriza el acceso si te lo pide.
4. Selecciona el repositorio que acabas de crear.
5. Netlify detecta Next.js automáticamente y rellena la configuración. **Déjala como está** — ya viene fijada en el archivo `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `.next`

**Todavía no pulses Deploy.** Antes hay que añadir las variables (paso 3).

---

## Paso 3 · Añade las variables de entorno

> 🔑 **Este es el paso crítico.** Las variables `NEXT_PUBLIC_*` se incrustan en el código **durante la compilación**, no se leen al arrancar. Si despliegas sin ellas, la web se verá bien pero saldrá el aviso *"Falta configurar el tiempo real"* y el multijugador no funcionará.

En la misma pantalla de importación, despliega **Add environment variables** (o luego en **Site configuration → Environment variables**) y añade las dos:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | La *Project URL* del paso 0 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | La clave *anon public* del paso 0 |

Ahora sí: pulsa **Deploy**.

---

## Paso 4 · Listo

En 1-2 minutos tendrás una URL del tipo `https://nombre-aleatorio.netlify.app`.

- Para cambiarle el nombre: **Site configuration → Change site name**.
- Para usar tu propio dominio: **Domain management → Add a domain**.

Abre la URL, crea una partida y comprueba que arriba a la derecha pone **"En directo"** en verde. Si pone "Sin conexión" o aparece el aviso amarillo, repasa el paso 3 y vuelve a desplegar (ver más abajo).

---

## Alternativa sin GitHub · Netlify CLI

Si prefieres desplegar directamente desde tu ordenador:

```bash
# 1. Instala la CLI (una sola vez)
npm install -g netlify-cli

# 2. Inicia sesión en Netlify
netlify login

# 3. Desde la carpeta del proyecto, crea el sitio
netlify init          # elige "Create & configure a new site"

# 4. Configura las variables de entorno
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://TU-PROYECTO.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "eyJ...tu-anon-key"

# 5. Compila y publica en producción
netlify deploy --build --prod
```

> ❌ **Lo que NO funciona:** arrastrar la carpeta del proyecto a la zona de "drag and drop" de Netlify. Eso solo sirve para sitios estáticos ya compilados; esta app tiene rutas dinámicas que Netlify debe construir. Usa el método de GitHub o la CLI.

---

## Probar en local antes de desplegar (opcional)

```bash
npm install
cp .env.example .env.local     # edita .env.local con tus dos credenciales
npm run dev                    # → http://localhost:3000
```

Para probar el multijugador de verdad, abre la URL en dos navegadores distintos (o uno normal y otro en incógnito): crea la sala en uno y únete con el código desde el otro.

---

## Problemas frecuentes

**Sigue apareciendo "Falta configurar el tiempo real" tras desplegar**
Las variables se incrustan al compilar, así que añadirlas no basta: hay que **volver a construir**. En Netlify ve a **Deploys → Trigger deploy → Clear cache and deploy site**.

**El aviso aparece solo en local**
Tras editar `.env.local` hay que **reiniciar `npm run dev`**; Next.js no recarga las variables en caliente.

**Falla el build en Netlify**
Comprueba en el log que la versión de Node sea la 20 (viene fijada en `netlify.toml`). Si el error menciona dependencias, prueba con **Clear cache and deploy site**.

**Los jugadores no se ven entre ellos**
Asegúrate de que todos entran por la **misma URL desplegada** (no unos en localhost y otros en Netlify) y de que el código de sala es idéntico. Cada despliegue comparte el mismo proyecto de Supabase, así que las salas son globales.
