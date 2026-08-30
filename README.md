# OrientaFP

Aplicación web de orientación vocacional para la **Formación Profesional en España**.
Explica qué es la FP sin lenguaje de folleto, hace un test de 20 preguntas y devuelve la
familia profesional que mejor encaja con el estudiante, junto a los ciclos concretos de
Grado Básico, Medio o Superior a los que puede acceder.

---

## Puesta en marcha

```bash
npm install
npm run dev      # http://localhost:5173
```

| Script              | Qué hace                                            |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo con recarga en caliente       |
| `npm run build`     | Comprueba tipos (`tsc -b`) y genera `dist/`          |
| `npm run preview`   | Sirve el bundle de producción ya construido          |
| `npm run typecheck` | Solo la comprobación de tipos                        |
| `npm run check`     | Equilibrio del cuestionario + validación por perfiles |
| `npm run build:standalone` | Empaqueta todo en un único HTML autocontenido |
| `npm run build:netlify` | Genera `orientafp-netlify.zip` para subir a mano |

No hace falta ninguna variable de entorno ni servicio externo: todo funciona en el
navegador y los datos se guardan en `localStorage`.

---

## Stack

- **React 18 + Vite 5 + TypeScript** en modo `strict` (con `noUncheckedIndexedAccess`).
- **Tailwind CSS 3** con paleta propia declarada como variables CSS.
- **framer-motion** para las transiciones entre pantallas.
- **lucide-react** para la iconografía.
- Enrutado por hash propio (`useHashRoute`), sin dependencia de router.

---

## Estructura

```
src/
├── types/index.ts          Contratos de dominio (Ciclo, Familia, Pregunta, Resultado...)
├── data/
│   ├── fpData.ts           Catálogo: 14 familias, 46 ciclos, situaciones de acceso
│   ├── questions.ts        Las 20 preguntas, sus pesos y sus etiquetas
│   ├── mercadoLaboral.ts   Estimaciones de inserción, salario y demanda (ver aviso)
│   ├── calendario.ts       Fases de admisión y portales por comunidad autónoma
│   └── guiaContent.ts      Textos de la guía y los mitos
├── utils/
│   └── archetypes.ts       Los cinco arquetipos vocacionales
├── lib/
│   ├── scoring.ts          Algoritmo de afinidad
│   ├── storage.ts          Persistencia con versionado de esquema
│   └── format.ts           Formato de horas independiente de ICU
├── hooks/
│   ├── useTest.ts          Estado del cuestionario y del resultado
│   ├── useHashRoute.ts     Navegación por `#/ruta`
│   └── useTheme.ts         Modo claro / oscuro
└── components/
    ├── Home.tsx            Portada con la guía introductoria
    ├── GuiaFP.tsx          Guía completa (`#/guia-fp`)
    ├── TestWizard.tsx      Cuestionario paso a paso
    ├── ResultsView.tsx     Resultados y ciclos recomendados
    ├── ExplorerView.tsx    Buscador del catálogo completo
    ├── CicloCard.tsx       Tarjeta de ciclo; al pulsarla abre la ficha
    ├── CicloModal.tsx      Ficha completa: asignaturas, salidas e itinerario
    ├── CycleComparator.tsx Comparador cara a cara de 2-3 ciclos
    ├── CareerPathSimulator.tsx  Itinerario visual: partida → ciclo → ECTS
    ├── HiddenGems.tsx      Ciclos poco conocidos con alta inserción
    ├── MythBusters.tsx     Mitos en tarjetas giratorias
    ├── FichaImprimible.tsx Informe vocacional en PDF / impresión
    └── ui/                 Card, Button, Badge, ProgressBar, Icon, SectionHeader
```

---

## Cómo funciona el cálculo de afinidad

El test mide dos cosas a la vez, y las dos hacen falta.

**Ocho dimensiones vocacionales** — analítico, creativo, asistencial, técnico, organizativo,
social, científico y físico — describen *cómo es* la persona.

**Veintiséis etiquetas de afinidad** (`programacion`, `cocina`, `vehiculos`, `deporte`,
`laboratorio`…) describen *de qué va* el trabajo que le atrae. Hacen falta porque dos ciclos
de la misma familia pueden pedir perfiles muy distintos: DAM programa y ASIR administra
servidores, y por dimensiones quedan casi empatados.

1. **Puntuación.** Cada opción elegida suma puntos a una o varias dimensiones (`pesos`) y
   acumula sus etiquetas (`tags`). Las preguntas del bloque D puntúan además **metas**
   (trabajar pronto / especializarse / universidad / emprender).
2. **Afinidad de familia.** Se compara el vector de dimensiones del estudiante con el de cada
   familia mediante **similitud del coseno**. Se usa coseno y no distancia porque importa *la
   forma* del perfil —en qué reparte su interés— y no cuántos puntos ha acumulado en total.
3. **Reescalado.** Entre vectores no negativos el coseno rara vez baja de 0,4, así que sin
   reescalar todas las familias parecerían igual de compatibles. Se aplica un suelo de 0,4 y
   un techo visual del 97 %: prometer un 100 % de encaje nunca es honesto.
4. **Encaje de ciclo.** `45 %` afinidad de la familia + `20 %` coincidencia con el
   `perfilIdeal` + `20 %` coincidencia de etiquetas + `15 %` accesibilidad del grado. La
   familia pesa más porque equivocarse de sector duele más que equivocarse de ciclo dentro del
   sector correcto; las etiquetas son las que ordenan a los ciclos hermanos.
5. **Grado sugerido.** Manda siempre la situación académica: no tiene sentido recomendar un
   Grado Superior a quien todavía no tiene la ESO. Las metas solo deciden cuando el estudiante
   elige «quiero explorar todo».

## Las dos comprobaciones que protegen el algoritmo

`npm run check` ejecuta dos guardias. Conviene lanzarlas después de tocar preguntas, pesos o
dataset: los dos fallos que evitan ya se han producido de verdad durante el desarrollo.

**`check:balance`** — Comprueba además que los 46 ciclos tengan datos de mercado coherentes
(bandas salariales bien ordenadas, inserción en rango, escalas de 1 a 5) y que los cinco
arquetipos cubran todas las familias. Y lo principal: cada dimensión debe poder alcanzar un máximo comparable. Si una se queda
corta, las familias que dependen de ella no pueden salir primeras por muy bien que responda el
estudiante: el instrumento tiene un techo antes que una opinión. Comprueba también que ninguna
etiqueta declarada en un ciclo sea inalcanzable desde el test (sería peso muerto que penaliza a
ese ciclo) y que cada pregunta tenga sus cuatro opciones. Ahora mismo el ratio suelo/techo es
**0,66**, con un mínimo aceptado de 0,55.

**`check:personas`** — Diez perfiles arquetípicos responden las 20 preguntas de forma coherente
y se comprueba que aterrizan en la familia que un orientador esperaría. Incluye un caso que
verifica específicamente el mecanismo de etiquetas: Automoción y Fabricación Mecánica tienen
perfiles por dimensiones casi idénticos, así que solo las etiquetas pueden separarlas.

## Sobre los datos de mercado laboral

**`src/data/mercadoLaboral.ts` contiene estimaciones orientativas, no estadísticas oficiales.**

Las cifras de inserción, salario y demanda se han elaborado como bandas razonables por familia y
grado para que el comparador pueda ordenar ciclos entre sí. Viven en un fichero aparte del
catálogo a propósito: los títulos, módulos e itinerarios son estables y verificables en el BOE y
en Todo FP; estas otras cifras dependen del año, del sector y sobre todo de la provincia, y
caducan.

Antes de publicar la app como servicio real, sustituye esos valores por los de las fuentes
oficiales que el propio fichero enumera (Observatorio de las Ocupaciones del SEPE, Estadística de
Inserción Laboral de titulados de FP, Encuesta de Estructura Salarial del INE, observatorios
autonómicos). La interfaz etiqueta siempre estas cifras como orientativas y muestra un aviso;
no lo quites sin haber cambiado los datos.

Lo mismo aplica a `src/data/calendario.ts`: recoge las **fases** del proceso de admisión y sus
ventanas aproximadas, no fechas concretas, porque cada comunidad publica las suyas cada curso.
Lo que sí es estable —y por eso está— es el enlace al portal oficial de cada comunidad.

Los relatos de «Un día en el trabajo» de las gemas ocultas son descripciones ilustrativas de la
tarea, no testimonios de personas reales, y la interfaz lo dice.

## Dónde se edita el contenido

| Quiero cambiar...                    | Fichero                    |
| ------------------------------------ | -------------------------- |
| Ciclos, familias, salidas laborales  | `src/data/fpData.ts`       |
| Preguntas, pesos y etiquetas         | `src/data/questions.ts`    |
| Inserción, salarios y demanda        | `src/data/mercadoLaboral.ts` |
| Fases de matrícula y portales CCAA   | `src/data/calendario.ts`   |
| Arquetipos vocacionales              | `src/utils/archetypes.ts`  |
| Textos de la guía, mitos, grados     | `src/data/guiaContent.ts`  |
| Colores y tipografías                | `tailwind.config.js` + `src/index.css` |

Para añadir un ciclo basta con un objeto nuevo en `CICLOS` con un `id` único; el explorador,
el buscador y el algoritmo lo recogen automáticamente. Después lanza `npm run check`: avisa si
alguna etiqueta del ciclo nuevo no es alcanzable desde el test.

Si cambias la forma de lo que se guarda (preguntas, campos del resultado), **incrementa
`SCHEMA_VERSION`** en `src/lib/storage.ts`. Un test a medias guardado con la versión anterior
tiene los mismos ids de pregunta pero significan otra cosa, y reutilizarlo daría un resultado
sin sentido.

---

## Persistencia

Todo pasa por `src/lib/storage.ts`, que:

- Envuelve cada acceso en `try/catch`, de forma que el modo incógnito, la cuota llena o las
  cookies bloqueadas nunca tumban la aplicación (la sesión sigue funcionando en memoria).
- Usa un `SCHEMA_VERSION`. Al cambiar la forma de los datos guardados basta con
  incrementarlo: lo antiguo se descarta en lugar de intentar pintar un objeto incompleto.
- Valida la forma mínima de lo leído antes de devolverlo.

Se guardan tres cosas: el test a medias (para poder retomarlo), el último resultado y la
preferencia de tema.

---

## Accesibilidad

- Contraste verificado en AA (4.5:1) para **todos** los pares de texto, en claro y en oscuro.
  Los nueve colores de familia se ajustaron para pasar el umbral con texto blanco.
- Enlace «Saltar al contenido principal» como primer elemento enfocable.
- Puntos de referencia semánticos (`header`, `nav`, `main`, `section`, `footer`), un solo
  `h1` por vista y jerarquía de encabezados sin saltos.
- `aria-label` en todos los botones que solo llevan icono; `aria-pressed` en las opciones del
  test y en los filtros; `aria-live` en el contador de resultados del buscador.
- Áreas táctiles de 44 px como mínimo y anillos de foco visibles de 4 px.
- El color nunca es el único portador de información: los badges siempre llevan texto.
- Se respeta `prefers-reduced-motion`.

## La ficha en PDF

No se incluye ninguna librería de PDF. `FichaImprimible` se maqueta para papel y solo es
visible en el flujo de impresión; el botón llama a `window.print()` y el propio navegador
ofrece «Guardar como PDF». Menos peso en el bundle y mejor resultado que un canvas rasterizado.

---

## Despliegue en Netlify

`npm run build` deja el sitio estático en `dist/`. La app es una SPA con enrutado por hash, así
que **no necesita reescrituras en el servidor**: todas las rutas viven bajo `index.html`.

El repositorio incluye `netlify.toml` con el comando de build, la versión de Node fijada y las
cabeceras de caché.

### Opción recomendada: conectar el repositorio

1. En Netlify: **Add new site → Import an existing project → GitHub**, y elige `omarrl94/omarromero`.
2. **Importante:** en *Branch to deploy* selecciona `claude/orientafp-educational-app-16yb2b`.
   La rama por defecto del repositorio es otro proyecto distinto, así que si dejas el valor que
   viene por defecto, Netlify construirá y publicará lo que no es.
3. El resto de campos los rellena `netlify.toml`; no hay que tocar nada.
4. **Deploy site**.

A partir de ahí, cada `git push` a esa rama vuelve a desplegar solo.

El comando de build es `npm run check && npm run build`: si alguien rompe el equilibrio del
cuestionario o el dataset, el despliegue falla en vez de publicar un test que recomienda
cualquier cosa. Si prefieres que un fallo de validación no bloquee la publicación, cambia el
comando a `npm run build` en `netlify.toml`.

### Opción rápida: subir un zip a mano

```bash
npm run build:netlify   # deja orientafp-netlify.zip en la raíz
```

Arrastra ese zip a <https://app.netlify.com/drop>. No requiere cuenta enlazada ni permisos sobre
el repositorio.

Un despliegue manual **no lee `netlify.toml`** —ese fichero solo se aplica cuando Netlify
construye desde el repositorio—, así que el script escribe dentro del paquete un `_redirects` y
un `_headers` equivalentes, que Netlify sí lee desde la carpeta publicada. El resultado se
comporta igual que el despliegue automático: misma caché y misma regla de SPA.

La contrapartida que queda es que hay que repetir la subida a mano en cada cambio. Para una demo
puntual va bien; para algo que vaya a durar, usa la opción de arriba.

## Aviso

Los datos son orientativos y están basados en el catálogo de títulos de FP del sistema
educativo español. La oferta concreta varía según comunidad autónoma y centro. El resultado
del test es una recomendación para abrir puertas, no un veredicto: conviene contrastarlo con
el departamento de orientación del centro.
