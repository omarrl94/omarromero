# Informe de investigación y fuentes

Fecha: 5 de noviembre de 2026. Autoría: equipo de desarrollo de Conecta FFE.

> **Limitación importante de esta investigación.** El entorno donde se ha construido la aplicación solo
> permitía **búsquedas web** (títulos y resúmenes de resultados). No permitía abrir páginas ni consultar
> APIs o DNS. Por eso, todo lo marcado como **«por confirmar»** debe revisarse con acceso normal a
> Internet (ver `docs/PENDIENTES.md`). No se ha dado nada por bueno sin fuente.

## 1. Fuentes de ofertas (apartado 2)

| Fuente | Acceso | Condiciones conocidas | Decisión |
|---|---|---|---|
| **Adzuna** | API REST con `app_id` y `app_key` (registro en developer.adzuna.com). Endpoint por país: `/v1/api/jobs/{país}/search/{página}`. | Según sus [condiciones de servicio](https://developer.adzuna.com/docs/terms_of_service), el uso es posible para organizaciones comerciales, públicas y académicas con una **prueba de 14 días**. Pasado ese plazo, o si el producto genera ingresos o *leads*, se exige un **acuerdo de licencia**. Las condiciones pueden cambiar en cualquier momento. Fuentes de terceros (no oficiales) hablan de unas 1.000 llamadas al mes en el plan gratuito: **por confirmar**. Adzuna anunció su lanzamiento en España en su [blog](https://www.adzuna.com/blog/wp-json/wp/v2/posts/2292) y listados de terceros incluyen `es` entre los 19 países, pero **la cobertura actual de `es` no se ha podido comprobar contra la API**. | **Implementada y desactivada por defecto.** Se activa al definir las claves. Antes hay que (1) confirmar que `es` responde y (2) pedir a Adzuna el uso educativo sin ánimo de lucro por escrito. Consumo previsto: **3 llamadas al día** (3 páginas de 50 resultados), unas 90 al mes. |
| **InfoJobs** | API REST (`api.infojobs.net`) con credenciales de aplicación (`client_id` y `client_secret`) obtenidas en developer.infojobs.net; para buscar ofertas basta autenticación básica. | No se han podido leer las condiciones oficiales; solo hay documentación de librerías no oficiales. Parámetros usados (`q`, `province`, `category`, `sinceDate`, `maxResults`, `order`): **por confirmar** con la documentación oficial. | **Implementada y desactivada por defecto.** Consumo: 3 llamadas al día (términos «prácticas», «becario» y «junior»). Antes de activarla, leer y aceptar sus condiciones de uso de la API. |
| **Greenhouse** (Job Board API) | `GET https://boards-api.greenhouse.io/v1/boards/{slug}/jobs`, sin autenticación. | Los datos de los tableros son públicos y las peticiones GET no requieren autenticación, según su documentación (citada por terceros; **por confirmar** en developers.greenhouse.io). | **Implementada.** Solo para empresas **del directorio** cuya propia web enlaza a su tablero de Greenhouse. El verificador lo detecta y nunca se adivina el `slug`. |
| **Lever** (Postings API) | `GET https://api.lever.co/v0/postings/{slug}?mode=json`, sin autenticación. | Las ofertas publicadas son públicas (github.com/lever/postings-api, **por confirmar**). Existe una instancia europea, `api.eu.lever.co`, que **aún no se usa**. | **Implementada**, con el mismo criterio que Greenhouse. |
| **Ashby** (Posting API) | `GET https://api.ashbyhq.com/posting-api/job-board/{nombre}`, sin autenticación. | API pública de ofertas (developers.ashbyhq.com, **por confirmar**). | **Implementada**, con el mismo criterio que Greenhouse. |
| **Webs de empleo de las empresas** | HTML. | Cada web tiene sus condiciones. | **No se raspan.** Se enlaza la página de empleo en la ficha de la empresa (`empleoUrl`). |

### Portales sin API pública: solo enlaces profundos

| Portal | Motivo | Implementación |
|---|---|---|
| LinkedIn | Su User Agreement prohíbe el scraping y la recogida automatizada, también con herramientas de terceros (caso *hiQ v. LinkedIn*, [resumen](https://www.socialmediatoday.com/news/LinkedIn-Wins-Latest-Court-Battle-Against-Data-Scraping/635938/)). | Enlace a búsqueda: `linkedin.com/jobs/search/?keywords=…&location=…&f_E=1,2` (1 = prácticas, 2 = nivel inicial). |
| Indeed | Las condiciones de uso restringen el acceso automatizado (**por confirmar** el texto vigente). | `es.indeed.com/jobs?q=…&l=…` |
| InfoJobs (web) | Hay API oficial. La web no se raspa. | `infojobs.net/jobsearch/search-results/list.xhtml?keyword=…&provinceIds=33` (`33` = Madrid, **por confirmar**) |
| Tecnoempleo | Sin API pública conocida. No se han podido leer sus condiciones. | `tecnoempleo.com/ofertas-trabajo/?te=…&pr=,28,` (`28` = Madrid, **por confirmar**) |
| Glassdoor | Condiciones restrictivas con robots. | `glassdoor.es/Empleo/empleos.htm?sc.keyword=…&locKeyword=…` |
| Welcome to the Jungle | Sin API pública para terceros. | `welcometothejungle.com/es/jobs?query=…&aroundQuery=…` |

Ninguno de estos enlaces se ha podido **probar** desde el entorno de desarrollo. Por eso en
`config/ffe.config.ts` todos tienen `probado: false` y **en producción no se muestran** hasta que alguien los
pruebe en un navegador y cambie la marca a `probado: true` (en desarrollo sí se ven, con la nota
«sin comprobar»). `npm run comprobar:enlaces` ayuda, pero LinkedIn e Indeed suelen bloquear a los robots:
la prueba definitiva es manual.

**Descartado:** scrapers de terceros como Apify. Hay decenas que ofrecen «Greenhouse/Lever/Ashby» o
«Adzuna». No se usan: CLAUDE.md lo prohíbe y no aportan nada que no den las APIs públicas.

### Otras fuentes legítimas a valorar (no implementadas)

- **Portal de Empleo de la Comunidad de Madrid** y **Empléate (SEPE)**: ofertas públicas, pero sin API documentada que se haya podido verificar.
- **Bolsas de empleo de FP Dual y de la Cámara de Comercio de Madrid**: convenios y ofertas para FP.
- **Programas de becas publicados por las propias empresas.** Ejemplo: Indra Group anunció en 2026 que incorpora alumnado de ciclos de Informática mediante becas ([nota de prensa de marzo de 2026](https://www.indragroup.com/cms-content/2026/03/260303-NP-Indra-Group-Talento-Mobile-World-Congress.pdf)). En la ficha se pueden enlazar con `programaPracticasUrl`.
- **CIEMAT**: publicó en el BOE un convenio para la fase de formación en empresa de FP en Madrid ([BOE-A-2026-10815](https://boe.es/boe/dias/2026/05/19/pdfs/BOE-A-2026-10815.pdf)). Indica que los organismos públicos de investigación también son destino de FFE.
- **42 Madrid (Fundación Telefónica)**: centro colaborador de la fase de formación en empresa según la Comunidad de Madrid (2026).

### Actualización, caché y cuotas

- Función programada `ofertas-actualizar`: **una vez al día** a las 06:17 UTC. Consumo diario: Adzuna 3 llamadas, InfoJobs 3 y una por cada empresa con feed ATS.
- La caché se guarda en Netlify Blobs (`ofertas/cache`). `/api/ofertas` la sirve con `Cache-Control: public, max-age=300`.
- Si una fuente falla, se conservan sus ofertas anteriores que sigan vigentes y la interfaz indica qué fuente ha fallado y cuándo.
- Normalización: se excluyen las ofertas senior (por título o por 3 o más años de experiencia), las caducadas (pasada su fecha o con más de 45 días), las que no son del sector TIC y las que no son de prácticas, beca, junior o primer empleo. Se eliminan duplicados entre fuentes (misma empresa y mismo título normalizados).

## 2. Empresas (apartado 1)

### Método

1. **Investigación (con búsqueda web):** empresas reales de Madrid y alrededores, con su web oficial, sector, tamaño, zona, perfiles y motivo de encaje → `data/empresas.candidatas.json` (**68 candidatas**: 24 consultoras, 17 pymes, 15 grandes empresas y 12 startups).
2. En las candidatas **no se escribe ningún correo**. Los resúmenes de búsqueda devolvían correos de anuncios antiguos, de terceros (Indeed, foros) o personales (p. ej. `nombre.apellido@`). Todos están prohibidos por las reglas, así que no se usaron.
3. **Verificación automática** (`npm run verificar:empresas`). Para cada candidata, el script descarga la web oficial, sigue los enlaces de contacto, empleo y aviso legal del mismo dominio, **extrae los correos que aparecen literalmente** y se queda con el mejor buzón corporativo genérico para candidaturas (prácticas > talento > RR. HH. > general). Rechaza los correos personales, gratuitos, de otro dominio y los de privacidad, prensa o ventas, y comprueba los **registros MX**. Si no hay correo válido, busca el **formulario oficial** de empleo o contacto. Si tampoco hay, **descarta la empresa**. Guarda la URL exacta, la fecha y el nivel de confianza.
4. **Revisión humana** del informe (`docs/INFORME-VERIFICACION.md`) y **auditoría al azar** (`npm run auditar:muestra`).

### Estado actual (5 de noviembre de 2026)

La verificación se ejecuta en **GitHub Actions** (flujo `Verificar empresas`), que tiene Internet. Última ejecución:

- **206 candidatas → 128 empresas verificadas** (45 grandes empresas, 36 consultoras, 34 pymes y 13 startups; 98 con perfiles DAM y 98 con perfiles ASIR).
- **54 con correo público** extraído literalmente de su web. **13 son de RR. HH., selección o talento**: Acens, Aena, Atmira, Factum, Grupo ICA, Keepler, Lyntia, Mnemo, One eSecurity, Panel Sistemas, Paradigma, Redsys y Sothis. Las otras 41 son buzones generales (`info@`, `hola@`, `contacto@`). **74 con formulario oficial** de empleo o contacto.
- **Prioridad a RR. HH.:** el verificador revisa primero las páginas de empleo, prueba las rutas habituales (trabaja con nosotros, empleo, talento, careers, únete) y un segundo nivel de enlaces. Elige el buzón en este orden: prácticas, talento, RR. HH. y, por último, general. En la web, «Recomendadas» pone primero las empresas con correo de RR. HH. y hay un filtro «Correo de RR. HH.».
- **78 descartadas**: webs que bloquean robots o no responden, sin buzón adecuado ni formulario, o que redirigen a otra empresa. Motivos en `docs/INFORME-VERIFICACION.md`.
- **Revisión con desconfianza:** se revisaron a mano todos los correos tras cada ejecución. Se excluyeron buzones válidos en forma pero inadecuados: protección de datos (`contacto.dpd@`), filiales extranjeras (`careers.au@`, `careers.hk@`, `global.careers@`), atención al cliente (`contact_eahelp@`), ventas (`comercial@`), administración y secretaría. Cada caso tiene su prueba automática.
- **Auditoría al azar** (`docs/AUDITORIA-MUESTRA.md`): 10 empresas comprobadas de nuevo desde cero, 0 problemas.
- Los datos de **sector, tamaño, zona y motivo de encaje** salen de la investigación, no del script: conviene revisarlos.

### Fuentes consultadas durante la investigación

- [Comunidad de Madrid, notas de prensa sobre FP](https://www.comunidad.madrid/press-releases/download/102040)
- [Indra Group y la FP (Merca2, 2026)](https://www.merca2.es/2026/02/17/indra-group-formacion-profesional-industrial-2353149/)
- [Escudo Digital: empresas españolas de ciberseguridad](https://www.escudodigital.com/ciberseguridad/las-primeras-empresas-de-ciberseguridad-espanolas.html)
- [CB Insights: Mnemo frente a S21sec](https://www.cbinsights.com/compare/mnemo-vs-s21sec)
- [ERP Research: partners de Dynamics en Madrid (Efor, Devaim, Goom)](https://www.erpresearch.com/dynamics-partners/efor-global-technology-sl)
- [Binhex, partner de Odoo en Madrid](https://binhex.cloud/odoo-partner-madrid)
- [Seedtable: startups tecnológicas de Madrid](https://seedtable.com/companies/city/spain/madrid/technology)
