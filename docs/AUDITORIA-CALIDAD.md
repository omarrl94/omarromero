# Auditoría de calidad

Ejecutada el 5 de noviembre de 2026 en el entorno de desarrollo (Node 22, Chromium 1243). Todo lo que figura
como ✔ se ha **ejecutado** y los resultados son reales. Lo marcado como ⏳ no se ha podido ejecutar por falta de
acceso a Internet y está en `docs/PENDIENTES.md`.

| Comprobación | Resultado |
|---|---|
| Lint (ESLint 9, typescript-eslint, react-hooks, jsx-a11y en modo estricto) | ✔ 0 errores, 0 avisos |
| Comprobación de tipos (`tsc --noEmit`, estricto) | ✔ sin errores |
| Pruebas unitarias (Vitest) | ✔ 46/46 en 9 archivos: esquemas, encaje, ofertas, correo, enlaces, servidor (acceso, límite de intentos, cookie, blindaje de producción), actualización de ofertas con fuentes simuladas, verificador e integración del verificador con webs simuladas |
| CI en GitHub Actions (check + E2E) | ✔ en verde |
| Build de producción (Vite) | ✔ JS 287 kB (88 kB gzip), CSS 32 kB (6,4 kB gzip) |
| Build real de Netlify (`netlify build --offline`) | ✔ `npm run check` completo y 4 funciones empaquetadas. Rutas `/api/acceso`, `/api/empresas` y `/api/ofertas`; programada `ofertas-actualizar` con `17 6 * * *` |
| Bundle sin correos protegidos ni secretos (`npm run comprobar:bundle`) | ✔ limpio con los datos reales: 33 correos protegidos ausentes de `dist/`. Prueba negativa: al plantar un correo protegido y el nombre `ACCESS_CODE` en `dist/`, el script los detecta y sale con código 1 |
| Validación de datos con Zod | ✔ 206 candidatas y 128 empresas verificadas válidas |
| E2E móvil (Pixel 7) y escritorio (1280×860) | ✔ 32/32 (16 por dispositivo): portada y perfil en menos de 60 s, código de acceso, límite de intentos (429), filtros y orden por encaje, ficha, generador de correo (CV obligatorio, Outlook y Gmail con CC del tutor, edición), seguimiento y aviso de empresa ya contactada, empresas solo con formulario, ASIR sin tutor, ofertas (fuente, fecha, ubicación, jornada, enlace, fuente fallida), estados de error, vacío y reintento, `noindex` y borrado de datos |
| Accesibilidad (axe WCAG 2.1 A/AA dentro de los E2E) | ✔ 0 violaciones graves o críticas en portada, privacidad, acceso, directorio, ficha, seguimiento y ofertas, en móvil y escritorio |
| Lighthouse móvil (build de producción, portada) | ✔ Rendimiento 98 · Accesibilidad 100 · Buenas prácticas 100 · SEO 63 (bajo **a propósito**: `noindex`) · FCP 1,7 s · LCP 1,9 s · TBT 120 ms · CLS 0 |
| Dependencias (`npm audit`) | ✔ 0 vulnerabilidades (producción y desarrollo). Se ha forzado `minimatch` ≥ 11.0.4 en la cadena de typescript-eslint |
| Validación de empresas contra sus webs (GitHub Actions) | ✔ 206 candidatas → 128 verificadas (54 con correo, 13 de ellos de RR. HH.; 74 con formulario). Revisión manual de todos los correos y reglas endurecidas tras cada hallazgo |
| Revisión con desconfianza de 10 empresas al azar | ✔ 10/10 correctas, comprobadas de nuevo desde cero (`docs/AUDITORIA-MUESTRA.md`) |
| Enlaces del directorio y portales | ✔ 143 enlaces de empresas, 141 correctos (Witrey agotó el tiempo de espera). LinkedIn, InfoJobs web y Welcome to the Jungle responden 200 sin pedir sesión; Indeed, Tecnoempleo y Glassdoor responden 403 a robots y quedan pendientes de prueba manual |
| `netlify serve` / `netlify dev` | ⏳ La CLI necesita descargar su runtime de *edge functions* y la red lo bloquea. Las funciones se han probado con el mismo código a través de Vite (E2E) y Vitest |

## Contraste de colores (AA)

El texto sobre los colores de marca va siempre en tinta `#1d1d1b` (contraste aproximado: amarillo 11:1,
salvia 9:1, terracota 7,7:1). En texto pequeño no se usan los colores de marca sobre blanco: se usan sus variantes
oscuras (`#2b5747` y `#8a3c19`). axe no ha detectado ningún problema de contraste.
