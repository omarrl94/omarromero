# 🚀 Desplegar Hipster Bingo en Netlify

Todo desde la terminal, sin pasar por la web de Netlify ni por GitHub.

---

## Método rápido · un solo comando

```bash
npm install
npm run deploy
```

Eso es todo. El script se encarga del resto:

1. Comprueba que tienes Node.js 18+.
2. Te pide las dos credenciales de Supabase (o las lee de `.env.local` si ya existen) y las guarda.
3. Instala las dependencias si hacen falta.
4. Abre el navegador para que autorices tu cuenta de Netlify.
5. Crea el sitio (o lo reutiliza si ya lo creaste).
6. Configura las variables de entorno en Netlify.
7. Compila y publica en producción.

Al terminar te imprime la URL pública. **Las siguientes veces solo tienes que volver a ejecutar `npm run deploy`**: ya no pedirá nada, compila y sube directamente.

### Antes de empezar: consigue las credenciales

El script te las va a pedir, así que tenlas a mano:

1. Entra en [supabase.com](https://supabase.com) y crea un proyecto (plan gratuito). **No hace falta base de datos ni crear tablas.**
2. Ve a **Project Settings** (engranaje) → **API**.
3. Copia estos dos valores:
   - **Project URL** → algo como `https://abcdxyz.supabase.co`
   - **anon public** → la clave larga que empieza por `eyJ...`

> ⚠️ Usa la clave **anon public**, nunca la `service_role`. La anon está pensada para ir en el navegador; la otra es secreta.

### Publicar una preview sin tocar producción

```bash
npm run deploy:preview
```

Genera una URL temporal para probar. Útil para enseñar cambios antes de publicarlos de verdad.

---

## Método manual · comandos sueltos

Si prefieres controlar cada paso, o estás en Windows sin Git Bash (donde el script `.sh` no corre):

```bash
# 1. Dependencias
npm install

# 2. Sesión de Netlify (abre el navegador la primera vez)
npx netlify-cli login

# 3. Crear el sitio y vincular esta carpeta
#    Elige "Create & configure a new site"
npx netlify-cli init

# 4. Variables de entorno (sustituye por las tuyas)
npx netlify-cli env:set NEXT_PUBLIC_SUPABASE_URL "https://TU-PROYECTO.supabase.co"
npx netlify-cli env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "eyJ...tu-anon-key"

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
npx netlify-cli sites:update --name mi-bingo-musical
# → https://mi-bingo-musical.netlify.app
```

---

## Probar en local antes de desplegar

```bash
npm run dev     # → http://localhost:3000
```

El script ya te habrá dejado el `.env.local` creado, así que el multijugador funciona también en local. Para probarlo de verdad, abre la URL en dos navegadores distintos (o uno normal y otro en incógnito): crea la sala en uno y únete con el código desde el otro.

---

## Despliegue automático desde GitHub (opcional)

Si además quieres que cada `git push` publique sola la web:

```bash
git init && git add . && git commit -m "Hipster Bingo"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main

npx netlify-cli link          # vincula con el sitio ya creado
```

Después, en el panel de Netlify: **Site configuration → Build & deploy → Link repository**. A partir de ahí, cada push a `main` dispara un despliegue.

---

## Problemas frecuentes

**Aparece el aviso amarillo "Falta configurar el tiempo real" en la web publicada**
Las variables `NEXT_PUBLIC_*` se incrustan **durante la compilación**, no se leen al arrancar. Si las cambiaste después de desplegar, hay que volver a compilar:

```bash
npm run deploy
```

**El aviso aparece solo en local**
Tras editar `.env.local` hay que **reiniciar `npm run dev`**; Next.js no recarga esas variables en caliente.

**`npm run deploy` falla en Windows**
El script es de Bash. Usa **Git Bash** o **WSL**, o sigue el método manual de comandos sueltos de más arriba.

**"You don't appear to be in a folder that is linked to a site"**
Falta vincular la carpeta. Ejecuta `npx netlify-cli init` (sitio nuevo) o `npx netlify-cli link` (sitio existente).

**Los jugadores no se ven entre ellos**
Asegúrate de que todos entran por la **misma URL publicada** (no unos en localhost y otros en Netlify) y de que el código de sala es idéntico.

**Quiero empezar de cero con otro sitio**

```bash
npx netlify-cli unlink
npm run deploy      # creará uno nuevo
```
