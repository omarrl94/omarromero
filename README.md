# CodeForge: The Living Engine

> Aquí no se hacen ejercicios. **Se programa el mundo.**

SPA gamificada (React + Tailwind + Canvas + Framer Motion + Lucide) donde aprender a programar en
**Python, Java, Kotlin, Swift y C** consiste en construir, pieza a pieza, las físicas, la IA y las
reglas de un motor de juego vivo. Cada línea que escribes se compila **de verdad** y el resultado se ve
al instante en un canvas; cada bug también.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/ (estático, desplegable en Netlify/Firebase/GitHub Pages)
npm test         # verifica el currículo en los 5 lenguajes (90 comprobaciones)
```

## Qué lo hace distinto

| Pieza | Qué hace |
|---|---|
| **Forge VM (Polyglot Core)** | Transpilador 1:1 de un subconjunto realista de los 5 lenguajes a JavaScript instrumentado. Conserva la numeración de líneas, así que cada error y cada frame del stack trace apunta a tu línea. |
| **Tipos reales** | `int` desborda a los 2 147 483 647 (wrap-around en Java/Kotlin/C, *trap* en Swift, precisión arbitraria en Python), la promoción `long x = a * b` se evalúa en 32 bits como en la JVM, `int g = 9.81` es error de compilación en Java/Kotlin/Swift y truncado silencioso en C. |
| **Heap simulado (C)** | `malloc`/`calloc`/`free` sobre bloques visualizados: detecta *heap-buffer-overflow*, *use-after-free*, *double free* y fugas, con mensajes estilo AddressSanitizer. |
| **Bug Visualizer** | Un error no es solo texto: corrompe el canvas (separación RGB, desgarros) y genera *fragmentos corruptos* con los frames del stack trace. Al pulsarlos, el editor salta a la línea culpable. |
| **Big O medido** | El boss cuenta las operaciones reales de tu función con n = 200…1600 y ajusta la pendiente log-log. O(n²) → la simulación va a 8 fps y el enjambre te arrolla; O(n) → vuela. `x in lista` cuenta como O(n) aunque no se vea el bucle. |
| **Rubber Duck AI** | Compañero socrático local: analiza tu código, el error y los checks que fallan y responde con preguntas, nunca con la solución. Puedes «explicarle» tu código y te devuelve preguntas reflexivas. Las preguntas más concretas cuestan la estrella de autonomía. |
| **IDE Arena** | Editor con resaltado, autocompletado simulado (palabras clave, API, identificadores y *snippets*), sangría inteligente, marcadores de error y de estilo, ejecución en vivo con *debounce* y `Ctrl+Enter` para desplegar. |
| **Análisis de estilo** | PEP 8 en Python, camelCase/PascalCase en el resto, espacios tras palabras clave, `;` innecesarios en Kotlin/Swift… El estilo limpio da una estrella. |

## El metaproyecto (The Engine Loop)

| Módulo | Misión | Lo que programas | Escena |
|---|---|---|---|
| 1 · Fundamentos | Las Leyes del Mundo | Constantes físicas con el tipo correcto | La lanzadera aterriza o se estrella |
| | Reactor en Desbordamiento | Rangos numéricos y overflow | El empuje da la vuelta y el reactor explota |
| 2 · Control de flujo | Ruta de Patrulla | Bucles y el clásico off-by-one | El dron sigue tu ruta (o se sale de la zona) |
| | Maniobra Zigzag | Condicionales y módulo | La torreta falla si tu ruta es impredecible |
| 3 · Estructuras de datos | Ordenar la Bodega | Arrays e índices (bubble sort) | Cada lectura/escritura real se anima |
| | Inventario Cuántico | Diccionarios / tabla hash (array indexado en C) | Los objetos sobrescritos se desintegran |
| 4 · POO | La Jerarquía Viva | Herencia, `open`/`override`, structs + punteros a función en C | Tu árbol de clases se instancia y se mueve |
| 5 · Sistemas | Núcleo del Sistema | `malloc`/`free` en C · concurrencia (asyncio, hilos, corrutinas, `async let`) | Heap visual · línea de tiempo serie vs paralelo |
| Boss | El Enjambre O(n²) | Refactorizar de O(n²) a O(n) | La velocidad de la simulación depende de tu complejidad |

Cada misión trae, para **cada lenguaje**, un código inicial con un bug didáctico y una solución de
referencia. `npm test` comprueba que el código inicial falla y la solución pasa en los 5 lenguajes.
Al superar una misión se desbloquea el **Codex Polyglot**: cómo se resuelve el mismo problema en los
otros cuatro paradigmas.

## Gamificación

- **Neural XP** y 8 rangos: *Script Kiddie → Bit Wrangler → Loop Rider → Data Smith → Object Shaper →
  Systems Hacker → Kernel Sage → Architect Master*.
- **3 estrellas por misión y lenguaje**: superada · sin pistas profundas del pato · estilo impecable.
- **Bonus políglota** (+50 %) por resolver la misma misión en otro lenguaje.
- **Rachas diarias**, logros, matriz políglota y celebraciones animadas.
- Todo se guarda en `localStorage` (progreso, borradores por misión y lenguaje, rachas, ajustes).
- Sonidos táctiles sintetizados con WebAudio (opcionales; el clic de teclado va aparte).

## Arquitectura

```
src/
  core/
    transpiler.js   Forge VM: comentarios, cadenas, sintaxis y traducción línea a línea
    runtime.js      ejecución instrumentada: tipos, overflow, arrays vigilados, heap, stack traces
    analyzer.js     análisis estático: estilo, clases (POO), concurrencia, anidamiento de bucles
    engine.js       evaluate(misión, código, lenguaje) → checks + datos de escena + error
    duck.js         motor socrático del Rubber Duck
    progress.js     XP, rangos, estrellas, rachas, logros y persistencia
    sound.js        sonidos WebAudio
  curriculum/       6 módulos · 9 misiones × 5 lenguajes (starter, solución, validación, pistas)
  scenes/           escenas Canvas 2D (mundo lógico 640×360) + Bug Visualizer
  components/       TopBar, mapa del motor, IDE Arena, editor, canvas en vivo, consola, pato, perfil
scripts/verify-curriculum.mjs
```

El Forge VM ejecuta un **subconjunto** de cada lenguaje (variables tipadas, aritmética, `if`/`else`,
bucles, funciones, arrays, listas, mapas y conjuntos, `malloc`/`free`…). Las misiones de POO y de
concurrencia se validan por análisis estático. Los bucles infinitos se cortan con un contador de
operaciones y la recursión infinita se traduce al error nativo de cada lenguaje.
