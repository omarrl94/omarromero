# Conecta FFE

Aplicación web del **C.F.P. José Ramón Otero** (Madrid) para que el alumnado de 2.º de **DAM** y **ASIR**
consiga plaza de **Formación en Empresa (FFE)** y encuentre ofertas de su perfil.

- **Empresas para FFE:** directorio de empresas de Madrid **verificadas** (fuente y fecha), con buscador, filtros, orden por encaje, generador de correo editable (Outlook web, Gmail, app de correo o copiar), tutor en copia, aviso de CV y seguimiento local.
- **Ofertas:** prácticas, becas, junior y primer empleo desde APIs oficiales (Adzuna, InfoJobs y los feeds públicos Greenhouse, Lever y Ashby de las empresas del directorio), más enlaces profundos a LinkedIn, Indeed, Tecnoempleo, Glassdoor y Welcome to the Jungle.
- **Cuentas y roles:** registro con el correo del centro (alumnado @a.jrotero.es, profesorado @jrotero.es), verificación desde el buzón del centro, doble factor por correo para tutores y superadmin, y panel de administración (`#/admin`) para aprobar tutores.
- **Tutores** (`#/tutores`): escribir a las empresas del ciclo desde la cuenta del tutor, en CCO y por lotes, uno a uno personalizado o con combinación de correspondencia (CSV).
- **Privacidad:** sin analítica. Perfil y seguimiento en la cuenta del usuario (Firestore, solo accesibles por él), con borrado de cuenta. El directorio solo se entrega a cuentas verificadas con rol y no se indexa.

Las reglas del proyecto están en [CLAUDE.md](CLAUDE.md). **Para ponerla en marcha, sigue [docs/PUESTA-EN-MARCHA.md](docs/PUESTA-EN-MARCHA.md)** (todas las partes, con los archivos y enlaces directos) (paso a paso, solo con el navegador).

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4 · Netlify Functions (v2), función programada y Netlify Blobs · Zod · Vitest · Playwright y axe.

## Instalación y desarrollo

Requisitos: Node 20 o superior (Netlify usa Node 22).

```bash
npm install
npm run dev            # http://localhost:5173 (la API de /api/* corre con el mismo código de las funciones)
```

Para ver el directorio en local con **datos ficticios** (dominios `.test`, nunca en producción):

```bash
CONECTA_MODO=pruebas CONECTA_DATOS=ficticios VITE_AUTH=prueba MAIL_MODE=log npm run dev
# Los «correos» (verificación, códigos) se guardan en .blobs-local/correos-enviados/
```

Con la CLI de Netlify (`npx netlify dev`) se usa Netlify Blobs local y el archivo `.env`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run check` | Lint, comprobación de tipos, pruebas unitarias, validación de datos, build y comprobación del bundle (es el comando de build en Netlify) |
| `npm run e2e` | Pruebas E2E en móvil (Pixel 7) y escritorio, con auditoría de accesibilidad axe |
| `npm run verificar:empresas` | Verifica las candidatas contra sus webs y regenera `data/empresas.json` y el informe (**necesita Internet**) |
| `npm run auditar:muestra` | Vuelve a comprobar 10 empresas al azar desde cero (**necesita Internet**) |
| `npm run comprobar:enlaces` | Enlaces rotos del directorio y prueba de los portales (**necesita Internet**) |
| `npm run comprobar:bundle` | Falla si `dist/` contiene correos de empresas, secretos o datos ficticios |
| `npm run validar:datos` | Valida los JSON de datos con los esquemas Zod |
| `npm run demo` | Genera `dist-demo/conecta-ffe-demo.html`: demostración en un solo archivo con datos ficticios y API simulada (código `demo-ffe`). **Nunca se despliega** |

## Variables de entorno

Todas se explican paso a paso en [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md) (plantilla en [.env.example](.env.example)).

| Variable | Obligatoria | Uso |
|---|---|---|
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` | Sí | Cuentas (Firebase Authentication) y datos del usuario (Firestore). Públicas por diseño |
| `FIREBASE_SERVICE_ACCOUNT` | Sí | Servidor: verificar sesiones, enviar enlaces y borrar cuentas (**secreta**) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Sí | Correos desde el buzón del centro: verificación, doble factor y avisos (o Resend / Microsoft Graph) |
| `SUPERADMIN_EMAILS` | No | Más superadmin además de `omar.romero@jrotero.es` |
| `APP_URL`, `SESSION_SECRET` | No | Enlaces de los correos; firma del doble factor (si falta, se genera sola) |
| `ADZUNA_*`, `INFOJOBS_*` | No | Fuentes de ofertas |

## Configuración editable

Todo lo que cambia de un curso a otro está en **[config/ffe.config.ts](config/ffe.config.ts)**: modalidades y fechas, horas por ciclo, tutores, perfiles, zonas, máximo de contactos por empresa, días de vigencia de las ofertas, enlaces profundos (con su marca `probado`) y límites de acceso.

## Despliegue en Netlify

1. Crea un sitio desde este repositorio y rama. Netlify lee `netlify.toml`: el build es `npm run check` y se publica `dist/`.
2. Define las variables de entorno de la tabla anterior.
3. Activa **Forms** (Netlify → Forms) y las notificaciones por correo del formulario `retirada`.
4. Despliega. La función programada `ofertas-actualizar` se ejecuta a diario a las 06:17 UTC. Para la primera carga, ejecútala desde Netlify → Functions → `ofertas-actualizar` → «Run now».
5. Comprueba en producción: `/#/empresas` pide el código; `/api/empresas` sin cookie devuelve 401; las cabeceras incluyen `X-Robots-Tag: noindex`.

## Mantenimiento

- **Empresas:** sigue [docs/GUIA-EMPRESAS.md](docs/GUIA-EMPRESAS.md). Verifica antes de cada periodo de FFE y cada trimestre.
- **Retiradas:** se reciben en Netlify Forms. Se añaden a `data/retiradas.json`. Plazo de 10 días hábiles.
- **Cuentas:** cada curso, bloquea o borra en **Admin** las cuentas de quien ya terminó.
- **Fuentes de ofertas:** el estado de cada fuente aparece en `#/ofertas`. Si una falla varios días, revisa las claves y sus condiciones ([docs/INVESTIGACION-FUENTES.md](docs/INVESTIGACION-FUENTES.md)).
- **Dependencias:** `npm audit` y `npm outdated` cada trimestre. Después, `npm run check && npm run e2e`.

## Estructura

```
config/ffe.config.ts      configuración editable
shared/                   esquemas Zod y lógica pura (encaje, ofertas, correo, enlaces)
server/                   solo servidor: sesión, límite de intentos, Blobs, fuentes de ofertas
netlify/functions/        acceso, empresas, ofertas, ofertas-actualizar (programada)
src/                      interfaz React
scripts/                  verificación de empresas, auditoría, enlaces, bundle, datos
data/                     empresas.candidatas.json (sin verificar), empresas.json (verificadas), retiradas.json
docs/                     investigación, guía, informes, pendientes
tests/unit · tests/e2e    Vitest · Playwright
```

## Documentación

- [docs/PENDIENTES.md](docs/PENDIENTES.md): qué falta y qué tienes que hacer tú
- [docs/INVESTIGACION-FUENTES.md](docs/INVESTIGACION-FUENTES.md): informe de investigación y fuentes
- [docs/GUIA-EMPRESAS.md](docs/GUIA-EMPRESAS.md): cómo añadir, revisar y retirar empresas
- [docs/AUDITORIA-CALIDAD.md](docs/AUDITORIA-CALIDAD.md): resultados de lint, pruebas, accesibilidad, rendimiento y dependencias
- [docs/INFORME-VERIFICACION.md](docs/INFORME-VERIFICACION.md): empresas válidas y descartadas (se regenera)
