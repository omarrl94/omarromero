# CodeForge: The Living Engine

> Aquí no se hacen ejercicios. **Se programa el mundo.**

SPA gamificada (React + Tailwind + Canvas + Framer Motion + Lucide) donde aprender a programar en
**Python, JavaScript, Java, C#, Kotlin, Swift, C, C++, Go y Rust** consiste en construir, pieza a pieza, las físicas, la IA y las
reglas de un motor de juego vivo. Cada línea que escribes se compila **de verdad** y el resultado se ve
al instante en un canvas; cada bug también.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/ (estático, desplegable en Netlify/Firebase/GitHub Pages)
npm test         # verifica el currículo en los 10 lenguajes (880 comprobaciones)
npm run test:rules  # reglas de Firestore contra el emulador (23 pruebas, requiere Java)
```

## Jugadores, oro y mapas de conquista

- **Cuentas de piloto:** registro con **nick**, **correo**, contraseña y **avatar** (16 pilotos dibujados en SVG). Nick único, edición de nick y avatar en el perfil, recuperación de contraseña y cierre de sesión.
- **Firebase:** Authentication + Firestore con perfil público (ranking) y progreso privado sincronizado entre dispositivos. Reglas de seguridad verificadas con 27 pruebas contra el emulador oficial. Sin configuración funciona en **modo local**. Guía completa en [FIREBASE.md](FIREBASE.md).
- **Oro:** cada estrella vale 25 de oro y completar un mundo da una corona (+150). Se calcula a partir del progreso, así que siempre es coherente.
- **Galaxia de mundos:** cada lenguaje es un planeta que se llena de oro al conquistar sus misiones; al completarlo luce una corona y tu avatar orbita el planeta en el que estás.
- **Mapa de conquista de cada mundo:** islas por módulo unidas por un camino. Los territorios conquistados se vuelven de oro con tu bandera y tu avatar; el siguiente late con «¡Conquista!».
- **Salón de la Fama:** ranking de pilotos por oro.

## App de Android (Google Play)

El mismo juego empaquetado como app nativa con **Capacitor 8** (Android 7.0+, compilada para Android 16): botón «atrás» nativo, vibración, icono adaptativo, pantalla de arranque, funcionamiento sin conexión y opción de **borrar la cuenta** desde el perfil. GitHub Actions compila el APK de pruebas y el `.aab` firmado en cada push. Textos, icono, gráfico destacado y capturas de la ficha en `store/google-play/`. Guía completa en [GOOGLE-PLAY.md](GOOGLE-PLAY.md).

## 44 niveles por mundo

Cada mundo tiene **8 módulos y 44 niveles**: 9 misiones de historia con escenas propias, 32 niveles de
práctica, 3 niveles extra de POO y el Boss.

| Módulo | Niveles |
|---|---|
| 1 · Fundamentos | Leyes del mundo, reactor, combustible, Kelvin, perímetro, segundos, división entera y resto |
| 2 · Control de flujo | Patrulla, zigzag, par/impar, máximo de tres, sumatorio, múltiplos, Collatz y primos |
| 3 · Estructuras de datos | Bodega, inventario, suma, máximo, contar, buscar, invertir en el sitio, el más frecuente y distintos |
| 4 · POO | Jerarquía viva, torretas, asteroides y escuadrón completo |
| 5 · Sistemas | Núcleo (memoria o concurrencia), buffer circular, bits y potencias de dos |
| 6 · Funciones y Recursión | Factorial, Fibonacci, potencia, suma de dígitos y Euclides |
| 7 · Algoritmos | ¿Está ordenado?, búsqueda binaria, segundo mayor, Kadane y ordenación por inserción |
| 8 · Boss | El Enjambre O(n²) |

Los niveles de práctica se describen **una sola vez** en una representación neutral
([`src/curriculum/drills.js`](src/curriculum/drills.js)) y un generador
([`levelgen.js`](src/curriculum/levelgen.js)) produce código idiomático para los 10 lenguajes:
la firma, el código inicial, la solución y el ejemplo de la lección. Cada nivel trae su explicación,
casos de prueba visuales en el canvas y pistas. `npm test` ejecuta en los 10 lenguajes el código
inicial de cada nivel (debe fallar) y su solución (debe pasar).

## Diez mundos independientes

Cada lenguaje es un **mundo propio**: eliges uno en la galaxia de mundos y, dentro, todo se explica en ese lenguaje (lecciones, ejemplos, errores, pistas y el Codex). No hay cambio de lenguaje dentro de una misión. Cada mundo guarda su propia XP, rango, estrellas, lecciones vistas y desbloqueo de módulos; la racha y los logros son comunes.

| Mundo | Lo que enseña a su manera |
|---|---|
| Python | tipado dinámico, `//` y `%`, enteros sin límite, asyncio |
| JavaScript | `number` y la pérdida de precisión más allá de 2^53, BigInt, `const`/`let`, `Promise.all` |
| Java / Kotlin | tipos estáticos, la trampa de la promoción a `long`, `open`/`override`, hilos y corrutinas |
| C# | `var`, conversiones que no compilan (CS0266), `Dictionary` y `KeyNotFoundException`, `virtual`/`override`, `async`/`await` con `Task.WhenAll` |
| Swift | traps por overflow, `inout`, `override`, `async let` |
| C | truncado silencioso, texto como array de `char` con `'\0'` (no existe `string`), punteros, `malloc`/`free` visualizados |
| C++ | `vector`, `unordered_map`, `virtual`/`override`, `new[]`/`delete[]` y use-after-free |
| Go | `:=`, «declared and not used», `int32` vs `int64`, receptor puntero, goroutines y canales |
| Rust 🦀 | inmutabilidad, *panic* por overflow, Entry API, traits, concurrencia sin carreras |

## Pensado para aprender desde cero

| Ayuda | Qué hace |
|---|---|
| **Aprende primero** | Antes de cada misión, una lección de 3-5 pasos con una animación que muestra la idea (cajas que son variables, un cuentakilómetros que desborda, burbujas que se ordenan…), el ejemplo en tu lenguaje y una tarjeta final «Qué tienes que cambiar». |
| **Explicación de cada línea** | Debajo del editor, una barra traduce a castellano la línea donde está el cursor («Bucle: repite 7 veces; el 7 no se incluye»). |
| **Líneas marcadas** | Las líneas que tienes que tocar llevan ✎ en el margen y un fondo ámbar. |
| **Checks con «¿Cómo?»** | Cada objetivo pendiente tiene una pista concreta en lenguaje sencillo. |
| **Errores en cristiano** | Encima del mensaje técnico: qué ha pasado y cómo arreglarlo. |
| **Inspector de variables** | Tus variables dibujadas como cajas con nombre, tipo y valor (y aviso si se desbordaron). |
| **Tour y solución explicada** | Un tour de 4 pasos la primera vez y, como último recurso, la solución comentada (cuesta la estrella de autonomía). |

## Qué lo hace distinto

| Pieza | Qué hace |
|---|---|
| **Forge VM** | Transpilador 1:1 de un subconjunto realista de los 10 lenguajes a JavaScript instrumentado. Conserva la numeración de líneas, así que cada error y cada frame del stack trace apunta a tu línea. |
| **Rust 🦀** | El lenguaje más querido de los últimos años: *panic* al desbordar, inmutabilidad por defecto (error E0384), `HashMap::entry`, traits en lugar de herencia y concurrencia sin carreras de datos. |
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

Cada misión trae, para **cada uno de los 10 lenguajes**, un código inicial con un bug didáctico y una solución de
referencia. `npm test` comprueba que el código inicial falla y la solución pasa en los 10 lenguajes.
La pestaña **Codex** explica cómo se hace en tu lenguaje y, al superar la misión, te enseña la
solución de referencia para que compares.

## Gamificación

- **Neural XP** y 8 rangos: *Script Kiddie → Bit Wrangler → Loop Rider → Data Smith → Object Shaper →
  Systems Hacker → Kernel Sage → Architect Master*.
- **3 estrellas por misión y lenguaje**: superada · sin pistas profundas del pato · estilo impecable.
- **XP, rango y estrellas por mundo**: cada lenguaje se juega como una partida propia.
- **Rachas diarias**, logros y celebraciones animadas.
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
    explain.js      explicación de líneas y de errores en lenguaje sencillo
    progress.js     XP, oro, rangos, estrellas, rachas, logros, persistencia por jugador y fusión con la nube
    sound.js        sonidos WebAudio
  curriculum/       6 módulos · 9 misiones × 10 lenguajes (starter, solución, validación, pistas)
    lessons.js      lecciones «Aprende primero» y ayudas de cada check
    *-pack.js       paquetes de Rust, C++, Go y JavaScript (misiones, ejemplos y pasos propios)
  services/
    firebase.js     configuración y carga bajo demanda del SDK de Firebase
    accounts.js     cuentas: motor Firebase (Auth + Firestore) y motor local con la misma interfaz
  scenes/           escenas Canvas 2D (mundo lógico 640×360) + Bug Visualizer
  components/       TopBar, mapa del motor, IDE Arena, editor, canvas en vivo, consola, pato, perfil
scripts/verify-curriculum.mjs
```

El Forge VM ejecuta un **subconjunto** de cada lenguaje (variables tipadas, aritmética, `if`/`else`,
bucles, funciones, arrays, listas, mapas y conjuntos, `malloc`/`free`…). Las misiones de POO y de
concurrencia se validan por análisis estático. Los bucles infinitos se cortan con un contador de
operaciones y la recursión infinita se traduce al error nativo de cada lenguaje.
