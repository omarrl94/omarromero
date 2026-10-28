# Curso de Claude · FP José Ramón Otero

Plataforma LMS del curso **"Especialización en Ingeniería de IA, Skills, MCP y Automatización con Claude"** (Título Propio del Centro), para alumnado de Grado Superior de DAM y ASIR.

**Para publicarla en Firebase y Netlify, sigue [DESPLIEGUE.md](DESPLIEGUE.md).**

## Qué incluye

- **12 sesiones** en 4 bloques, cada una con las pestañas Teoría · Taller paso a paso · Biblioteca de Prompts · Actividad práctica · Preguntas frecuentes. Cada sesión incluye:
  - objetivos;
  - teoría con ejemplos DAM, ASIR y generales;
  - talleres con el resultado esperado;
  - prompts listos para copiar;
  - rúbricas.
- **Test de autoevaluación por sesión** (10 preguntas, 120 en total): se corrige al momento con la explicación de cada pregunta y se guardan los intentos y la mejor nota. El profesor ve los resultados.
- **Entregas por bloque**: cada alumno entrega el bloque de su ciclo (DAM `#a9cabb` o ASIR `#e39f7d`) y el de Sincronización DAM + ASIR. Cada bloque tiene su nota y sus comentarios, que llegan en tiempo real y por correo.
- **Registro** con correo `@jrotero.es` (o código de aula), verificación del correo y recuperación de contraseña. Si el correo no llega, el profesor puede activar la cuenta a mano.
- **Correos y avisos desde el buzón del centro**, con el mismo sistema que ColaboraFP y la web de exámenes: una función de Netlify con SMTP de Microsoft 365, Resend o Graph. Envía la verificación, el cambio de contraseña, las altas al profesor, el justificante de entrega (con copia al profesor), la nota y los comentarios, y el aviso del título.
- **Protección de datos:** cláusula RGPD/LOPDGDD de primera capa y política completa, con los consentimientos de privacidad y de compromiso EU AI Act desmarcados por defecto y con la fecha de aceptación del servidor.
- **Panel docente** (`omar.romero@jrotero.es`):
  - Seguimiento por ciclo y CSV descargable.
  - Corrección de entregas.
  - Código de aula.
  - Gestión de usuarios.
  - Emisión y revocación del Título Propio.
- **Título Propio** (se emite con el bloque de sincronización de la Sesión 12 aprobado) imprimible en A4 horizontal o en PDF, con código de verificación. Cualquiera puede comprobarlo en `#/verificar/CÓDIGO`.
- **Derechos del alumno:** exportar sus datos en JSON y eliminar su cuenta con todos sus datos.

## Estructura

```
src/
  index.html             página base
  app.js                 interfaz y rutas (#/curso/3/taller, #/perfil, #/admin/entregas…)
  datos.js               pestañas, bloques y lista de sesiones
  contenido/s01…s12.js   contenido de cada sesión (teoría, taller, prompts, actividad, test, FAQ)
  constantes.js          centro, profesor responsable, curso
  backend-firebase.js    Authentication + Firestore (producción)
  backend-local.js       modo demostración (localStorage)
  styles.css             Tailwind + estilos propios
public/                  logo oficial y favicon
netlify/functions/       correo.mjs: correos de la cuenta y avisos desde el buzón del centro
firebase/                reglas e índices de Firestore
scripts/                 compilación, servidor local y pruebas de reglas
netlify.toml · firebase.json
```

## Desarrollo

```bash
npm install
npm run dev              # contra Firebase (firebase.web.json) en http://localhost:8000
npm run dev:demo         # modo demostración, sin Firebase
npm run probar:reglas    # 64 pruebas de las reglas de Firestore en el emulador
```

Con `--demo` (o sin `firebase.web.json` ni variables `FIREBASE_*`), la compilación genera el **modo demostración**: los datos se guardan en el navegador y hay accesos rápidos de profesor y alumnos. Al desplegar (Netlify o `--produccion`) la compilación se niega a publicar ese modo salvo con `PERMITIR_DEMO=1`.

## Seguridad

- Los permisos los imponen las **reglas de Firestore** (`firebase/firestore.rules`), no la interfaz:
  - Un alumno solo lee y escribe lo suyo, no puede ponerse nota ni nombrarse profesor.
  - El título exige el Proyecto Final aprobado.
  - Las verificaciones públicas no se pueden listar.
- **CSP estricta.** La página no usa scripts en línea ni carga nada de terceros: Tailwind se compila y las fuentes se sirven desde la propia web.
- Firebase solo se descarga cuando está configurado.
