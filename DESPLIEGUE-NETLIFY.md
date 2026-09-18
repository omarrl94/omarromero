# 🚀 Desplegar Rollo Madrid en Netlify

Todo desde la terminal, sin pasar por la web de Netlify ni por GitHub.

---

## Método rápido · un solo comando

```bash
npm install
npm run deploy
```

Funciona igual en **Windows** (cmd y PowerShell), **macOS** y **Linux**: el script está escrito en Node, así que no necesitas Git Bash ni WSL.

Eso es todo. El script se encarga del resto:

1. Comprueba que tienes Node.js 18+.
2. Te pide la clave de Google Maps (o la lee de `.env.local` si ya existe) y la guarda.
3. Instala las dependencias si hacen falta.
4. Abre el navegador para que autorices tu cuenta de Netlify.
5. Crea el sitio (o lo reutiliza si ya lo creaste).
6. Configura las variables de entorno en Netlify.
7. Compila y publica en producción.

Al terminar te imprime la URL pública. **Las siguientes veces solo tienes que volver a ejecutar `npm run deploy`**: ya no pedirá nada, compila y sube directamente.

### Antes de empezar: consigue la clave de Google Maps

El script te la va a pedir, así que tenla a mano:

1. Entra en [console.cloud.google.com](https://console.cloud.google.com/) y crea un proyecto.
2. **APIs y servicios → Biblioteca** y habilita las dos que usa la app:
   - **Maps JavaScript API** → el mapa.
   - **Places API (New)** → el buscador de bares. (Si tu clave es antigua y solo tiene la *Places API* clásica, la app detecta y usa esa.)
3. **APIs y servicios → Credenciales → Crear credenciales → Clave de API**.
4. **Restringe la clave** por *HTTP referrers* a tu dominio (`https://tu-sitio.netlify.app/*` y `http://localhost:3000/*`).
5. Opcional pero recomendado: crea un **Map ID** en *Google Maps Platform → Gestión de mapas* (tipo JavaScript, vectorial). Sin él la app usa `DEMO_MAP_ID`, que funciona pero pinta una marca de agua.

> ⚠️ La clave viaja al navegador: por eso hay que restringirla por dominio. También conviene ponerle un límite de cuota diario en Google Cloud para que una noche de fiesta no te cueste un riñón.

### Publicar una preview sin tocar producción

```bash
npm run deploy:preview
```

Genera una URL temporal para probar. Útil para enseñar cambios antes de publicarlos de verdad.

---

## Método manual · comandos sueltos

Si prefieres controlar cada paso a mano:

```bash
# 1. Dependencias
npm install

# 2. Sesión de Netlify (abre el navegador la primera vez)
npx netlify-cli login

# 3. Crear el sitio y vincular esta carpeta
#    Elige "Create & configure a new site"
npx netlify-cli init

# 4. Variables de entorno (sustituye por las tuyas)
npx netlify-cli env:set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY "AIza...tu-clave"
npx netlify-cli env:set NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID "tu-map-id"

# 5. Compilar y publicar en producción
npx netlify-cli deploy --build --prod
```

Para una preview en vez de producción, quita `--prod` del último comando.

---

## Comandos útiles del día a día

| Comando | Para qué sirve |
|---|---|
| `npm run deploy` | Publicar la versión actual en producción |
| `npm run deploy:preview` | Publicar una URL temporal de prueba |
| `npx netlify-cli open` | Abrir el panel del sitio en el navegador |
| `npx netlify-cli open:site` | Abrir la web publicada |
| `npx netlify-cli env:list` | Ver las variables configuradas |
| `npx netlify-cli sites:list` | Listar todos tus sitios |
| `npx netlify-cli logs:deploy` | Ver el log del último despliegue |
| `npx netlify-cli unlink` | Desvincular esta carpeta del sitio |

Para cambiar el nombre del sitio (y por tanto la URL):

```bash
npx netlify-cli sites:update --name rollo-madrid
# → https://rollo-madrid.netlify.app
```

---

## Probar en local antes de desplegar

```bash
npm run dev     # → http://localhost:3000
```

El script ya te habrá dejado el `.env.local` creado, así que el mapa funciona también en local. Recuerda añadir `http://localhost:3000/*` a las restricciones de la clave en Google Cloud.

---

## Despliegue automático desde GitHub (opcional)

Si además quieres que cada `git push` publique sola la web:

```bash
git init && git add . && git commit -m "Rollo Madrid"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main

npx netlify-cli link          # vincula con el sitio ya creado
```

Después, en el panel de Netlify: **Site configuration → Build & deploy → Link repository**. A partir de ahí, cada push a `main` dispara un despliegue.

---

## Problemas frecuentes

**En la web publicada sale "Falta la clave de Google Maps"**
Las variables `NEXT_PUBLIC_*` se incrustan **durante la compilación**, no se leen al arrancar. Si las cambiaste después de desplegar, hay que volver a compilar:

```bash
npm run deploy
```

**El aviso aparece solo en local**
Tras editar `.env.local` hay que **reiniciar `npm run dev`**; Next.js no recarga esas variables en caliente.

**"Google Maps no ha podido cargar" o el mapa sale en gris**
Casi siempre es una de estas tres: la clave no tiene habilitada *Maps JavaScript API*, el dominio no está en las restricciones de referrer, o el proyecto de Google Cloud no tiene facturación activada (Google la exige aunque haya capa gratuita). La consola del navegador dice cuál de las tres es.

**El buscador no sugiere nada**
Falta habilitar *Places API (New)* en el mismo proyecto que la clave. Escribe al menos 3 letras: el buscador no dispara antes.

**Los pines no aparecen pero el mapa sí**
Los marcadores avanzados necesitan un Map ID. Comprueba `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` y que el Map ID sea de tipo *JavaScript*.

**"No hay terminal interactiva para pedirte las credenciales"**
Estás ejecutando el comando con la entrada redirigida (por ejemplo desde un script o CI). Crea a mano un `.env.local` en la raíz con las variables y vuelve a lanzarlo.

**"You don't appear to be in a folder that is linked to a site"**
Falta vincular la carpeta. Ejecuta `npx netlify-cli init` (sitio nuevo) o `npx netlify-cli link` (sitio existente).

**Quiero empezar de cero con otro sitio**

```bash
npx netlify-cli unlink
npm run deploy      # creará uno nuevo
```
