# Despliegue de la plataforma del máster

La plataforma es una web estática: `npm run build` genera la carpeta `dist/` con `index.html`
(todo incrustado) y las cabeceras de seguridad. Se puede publicar en cualquier hosting estático con HTTPS.

## 0. Antes de publicar: qué hace y qué no hace esta versión

| Funciona ya | Necesita servidor (fase 2) |
|---|---|
| Programa, calendario y las 18 sesiones con todo su contenido | Que la Dirección vea las matrículas y entregas hechas desde otros equipos |
| Matrícula, entregas, corrección, actas, tribunal y diploma **dentro de un mismo navegador** | Cuentas de alumnado compartidas entre dispositivos |
| Impresión del diploma, del suplemento y del certificado | Verificación pública de diplomas desde cualquier lugar (y código QR) |
| Exportar e importar la base de datos (copia de seguridad) | Avisos por correo, almacenamiento de ficheros y copias automáticas |

Los datos se guardan en el `localStorage` del navegador. Por eso esta versión sirve para **publicar el
programa y los contenidos, enseñarlo a la dirección del centro y hacer pilotos en un aula**, pero no para
gestionar la edición real con 30 alumnos. Para eso, ver la sección 5.

## 1. Preparar la build (en tu equipo, una vez)

```powershell
git clone https://github.com/omarrl94/omarromero.git
cd omarromero
git switch feature/master-ia-post-dam-v2
cd master-ia
npm ci
npm run build          # comprueba el temario y genera dist/
```

Opcional: copia el logotipo oficial como `master-ia/public/logo-jrotero.png` antes de la build y se
usará en lugar de la recreación SVG.

## 2. Opción A · Netlify (recomendada para publicar ya)

El repositorio ya despliega OrientaFP en Netlify; el máster se publica como **otro sitio** del mismo repositorio.

1. Entra en <https://app.netlify.com> → **Add new site** → **Import an existing project** → GitHub →
   repositorio `omarrl94/omarromero`.
2. Configura:
   - **Branch to deploy:** `feature/master-ia-post-dam-v2` (o `main` cuando se fusione).
   - **Base directory:** `master-ia` (Netlify leerá `master-ia/netlify.toml`).
   - **Build command** y **Publish directory:** se toman del `netlify.toml` (`npm ci && npm run build` y `dist`).
3. **Deploy site**. En 1-2 minutos tendrás una URL `https://<nombre>.netlify.app`.
4. Dominio propio (recomendado): **Domain management** → **Add a domain** → por ejemplo
   `master-ia.jrotero.es`. En el DNS de `jrotero.es` crea un registro **CNAME** `master-ia` →
   `<nombre>.netlify.app`. Netlify emite el certificado HTTPS automáticamente.
5. A partir de ahí, cada `git push` a la rama configurada vuelve a publicar.

Alternativa sin conectar GitHub: tras el paso 1, arrastra la carpeta `master-ia/dist` a
<https://app.netlify.com/drop>, o bien:

```powershell
npx netlify-cli deploy --dir dist --prod
```

## 3. Opción B · Servidor del centro con Docker

```bash
cd master-ia
docker build -t master-ia:1.0 .
docker run -d --name master-ia --restart unless-stopped -p 8080:8080 master-ia:1.0
curl -I http://localhost:8080/          # debe devolver 200 y las cabeceras de seguridad
```

La imagen usa nginx sin privilegios y aplica la CSP generada en la build. Para HTTPS, pon delante un
proxy inverso; con Caddy basta este `Caddyfile`:

```
master-ia.jrotero.es {
    reverse_proxy localhost:8080
}
```

Sin Docker: copia `dist/index.html` a la carpeta del servidor web y usa `deploy/nginx.conf` con
`dist/nginx-headers.conf` (en Apache, traslada esas mismas cabeceras).

## 4. Comprobaciones tras publicar

- [ ] La web abre por **HTTPS**. Sin HTTPS, el registro y el acceso no funcionan, porque el cifrado de contraseñas del navegador (Web Crypto) solo está disponible en HTTPS o en `localhost`.
- [ ] `curl -I https://master-ia.jrotero.es/` muestra `Content-Security-Policy`, `X-Frame-Options` y `Strict-Transport-Security`.
- [ ] La consola del navegador no muestra errores de CSP.
- [ ] Prueba completa: primer acceso de la Dirección, código de admisión, matrícula externa, entrega, corrección y diploma (imprimir → Guardar como PDF → 2 páginas A4 apaisadas).
- [ ] La página **Programa y calendario** coincide con el programa aprobado (fechas, horas y precios).
- [ ] Textos legales revisados por la asesoría del centro antes de anunciar el máster (puntos 6, 7 y 8 del apartado 15 del programa: publicidad como «título propio, sin carácter oficial», protección de datos y formación del personal en IA).

## 5. Fase 2 · Operación real con alumnado (servidor)

Para gestionar la edición con alumnado en varios dispositivos, la plataforma necesita un servidor. Lo que hace falta:

| Pieza | Propuesta | Notas |
|---|---|---|
| API | FastAPI (Python) o Spring Boot (Java 21) | El mismo stack que se enseña en el máster |
| Base de datos | PostgreSQL en la UE | Matrículas, entregas, actas, registro de títulos |
| Acceso | Inicio de sesión con las cuentas Microsoft 365 del centro (Entra ID) y contraseñas en el servidor para el alumnado externo | Evita gestionar contraseñas en el navegador |
| Ficheros | Almacenamiento de objetos en la UE | Memorias en PDF y vídeos enlazados |
| Verificación | Página pública `/verificar/<código>` servida desde la base de datos, con código QR en el diploma | Apartado 13 del programa |
| Hosting | Servidor del centro, o contenedores gestionados en región Madrid/UE | Copias diarias con prueba de restauración |
| Legal | Contrato de encargado del tratamiento (art. 28 RGPD) entre el centro y la empresa que presta la plataforma, registro de actividades y revisión del DPD | Apartado 15, punto 7 |

La interfaz actual se mantiene: solo cambia la capa de datos (`src/app/01-nucleo.js`, funciones
`cargarDB`, `guardar` y las acciones que escriben), que pasaría a llamar a la API.

## 6. Actualizar contenidos

1. Edita el temario en `master-ia/src/data/` (una sesión por objeto; fechas y horas en `modulos.js`).
2. `npm run build`: si una rúbrica no suma 100 %, faltan horas o se rompe la numeración, la build falla y no se publica nada.
3. `git commit` y `git push`: Netlify vuelve a publicar automáticamente.
