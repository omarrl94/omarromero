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
│   ├── fpData.ts           Catálogo: 11 familias, 41 ciclos, situaciones de acceso
│   ├── questions.ts        Las 20 preguntas, sus pesos y sus etiquetas
│   └── guiaContent.ts      Textos de la guía "¿Por qué estudiar FP?"
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
    ├── CicloModal.tsx      Ficha completa: asignaturas, salidas y continuidad
    ├── FichaImprimible.tsx Ficha en PDF / impresión
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

**`check:balance`** — Cada dimensión debe poder alcanzar un máximo comparable. Si una se queda
corta, las familias que dependen de ella no pueden salir primeras por muy bien que responda el
estudiante: el instrumento tiene un techo antes que una opinión. Comprueba también que ninguna
etiqueta declarada en un ciclo sea inalcanzable desde el test (sería peso muerto que penaliza a
ese ciclo) y que cada pregunta tenga sus cuatro opciones. Ahora mismo el ratio suelo/techo es
**0,66**, con un mínimo aceptado de 0,55.

**`check:personas`** — Diez perfiles arquetípicos responden las 20 preguntas de forma coherente
y se comprueba que aterrizan en la familia que un orientador esperaría. Incluye un caso que
verifica específicamente el mecanismo de etiquetas: Automoción y Fabricación Mecánica tienen
perfiles por dimensiones casi idénticos, así que solo las etiquetas pueden separarlas.

## Dónde se edita el contenido

| Quiero cambiar...                    | Fichero                    |
| ------------------------------------ | -------------------------- |
| Ciclos, familias, salidas laborales  | `src/data/fpData.ts`       |
| Preguntas, pesos y etiquetas         | `src/data/questions.ts`    |
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

## Despliegue

`npm run build` deja el sitio estático en `dist/`. Sirve en cualquier hosting estático
(Vercel, Netlify, GitHub Pages, un bucket). Es una SPA con enrutado por hash, así que **no
necesita reescrituras en el servidor**: todas las rutas viven bajo `index.html`.

---

## Aviso

Los datos son orientativos y están basados en el catálogo de títulos de FP del sistema
educativo español. La oferta concreta varía según comunidad autónoma y centro. El resultado
del test es una recomendación para abrir puertas, no un veredicto: conviene contrastarlo con
el departamento de orientación del centro.
