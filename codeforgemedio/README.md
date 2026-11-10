# CodeForge Medio

> Aprende a programar **jugando**. Desde cero.

Versión de iniciación de [CodeForge: The Living Engine](../README.md), pensada para alumnado de
**grado medio (16-17 años)** que no ha programado nunca. Mismo motor y misma idea —el código se
ejecuta de verdad y el resultado se ve al instante—, pero con un recorrido mucho más suave y con un
objetivo añadido: **que les guste tanto que quieran seguir estudiando**.

```bash
cd codeforgemedio
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/ (estático: Netlify, Firebase Hosting, GitHub Pages…)
npm test         # verifica el currículo en los 3 lenguajes (186 comprobaciones)
npm run test:rules  # reglas de Firestore contra el emulador (requiere Java)
```

## Qué cambia respecto a CodeForge

| | CodeForge | CodeForge Medio |
|---|---|---|
| Lenguajes | 10 | **3: Python, JavaScript y Java** |
| Niveles por mundo | 44 en 8 módulos | **31 en 6 módulos**, más cortos |
| Punto de partida | Tipos y desbordamiento de enteros | **«Hola, mundo»**: escribir en pantalla |
| Techo | POO, memoria, concurrencia, O(n²) | Listas y un reto final: **FizzBuzz** |
| Nombres en el código | En inglés | **En castellano** (`vidas`, `mochila`, `precioBillete`) |
| Sección propia | — | **«Tu futuro»**: qué sabes hacer ya y qué estudiar después |
| Rangos | Script Kiddie → Architect Master | Cadete → Aprendiz → Piloto → … → Leyenda |

No se ha incluido lo que no toca a este nivel: desbordamiento de 32 bits, diccionarios y conjuntos,
herencia, `malloc`/`free`, concurrencia, recursión, búsqueda binaria ni complejidad.

## El recorrido: 31 niveles por mundo

| Módulo | Qué se aprende | Niveles |
|---|---|---|
| 1 · Primeros pasos | Escribir en pantalla, variables, cálculos, cambiar una variable, unir textos, tipos de datos | Enciende la Pantalla · Cajas con Nombre · Calculadora de a Bordo · Una Vida Menos · Mensaje de Bienvenida · Las Leyes del Mundo |
| 2 · Funciones | Parámetros y `return`, operadores, paréntesis, división entera y resto | Consumo de Combustible · Sensor Térmico · Valla del Hangar · Reloj de Misión · Reparto de Celdas · Celdas de Reserva |
| 3 · Decisiones | `if` / `else`, comparaciones, cadenas de condiciones, «y» / «o» | Control de Acceso · Licencia de Piloto · Turnos de Guardia · Billete a la Estación · El Escudo Más Fuerte · Permiso de Despegue |
| 4 · Bucles | `for`, `while`, acumuladores, contar con condición | Ruta de Patrulla · Cuenta Atrás · Acumulador de Energía · Maniobra Zigzag · Radar de Frecuencias · Batería a la Mitad |
| 5 · Listas | Posiciones desde 0, tamaño, recorrer, máximo, contar, buscar, intercambiar | La Mochila del Explorador · Peso Total · El Contenedor Más Pesado · Alarma de Sobrecarga · Localizador de Señales · Ordenar la Bodega |
| 6 · Reto final | Combinar bucle + decisiones + resto | **El Guardián FizzBuzz** (una prueba clásica de entrevistas de trabajo) |

Hay tres tipos de nivel:

- **Programas** (`src/curriculum/programs.js`): código que se ejecuta de arriba abajo y escribe en la
  **pantalla de la nave** (escena `screen`). Son los primeros pasos, sin funciones. Para que no valga
  escribir el resultado a mano, el nivel vuelve a ejecutar el programa con otros datos (otro premio,
  otro nombre, otra energía).
- **Misiones con escena** heredadas de CodeForge: la lanzadera que aterriza, los drones que patrullan
  y la bodega que se ordena.
- **Niveles de práctica** (`src/curriculum/drills.js`): una función ya montada que hay que completar,
  con casos de prueba animados. Se describen una sola vez y el generador (`levelgen.js`) produce el
  código inicial, la solución y el ejemplo de la lección en cada lenguaje.

Cada nivel tiene su lección «Aprende primero», pistas en cada objetivo («¿Cómo?»), el pato de goma
que pregunta en vez de dar la solución y, como último recurso, la solución explicada.

`npm test` ejecuta, en los 3 lenguajes, el código inicial de cada nivel (debe fallar) y su solución
(debe pasar).

## «Tu futuro»: para que quieran seguir

- **Lo que ya sabes hacer.** Al terminar cada módulo se desbloquea una tarjeta que conecta lo
  aprendido con algo que usan a diario («cada comprobación que hace una app es un `if`»). También
  aparece en la pantalla de recompensa al completar el módulo.
- **Y después del grado medio, ¿qué?** Los tres grados superiores de informática (DAM, DAW y ASIR),
  explicados en sencillo y enlazados con el mundo del juego con el que practicar.
- **Trabajos en los que se programa** y un mensaje final distinto según hayan conquistado ya un
  mundo o no.
- Cada planeta cuenta dónde se usa ese lenguaje en el mundo real.

Los textos están en `src/curriculum/future.js`: conviene que el profesorado los revise y los adapte
a la oferta de su centro y de su comunidad.

## Cuentas, oro y ranking

Igual que en CodeForge: cuentas con nick y avatar, oro por estrella, corona al completar un mundo,
mapas de conquista y Salón de la Fama. Sin configurar nada funciona en **modo local** (todo se guarda
en el navegador); con Firebase, el progreso se sincroniza entre dispositivos.

**No se mezcla con CodeForge:** usa sus propias claves de `localStorage` (`codeforgemedio.*`) y sus
propias colecciones de Firestore (`codeforgemedio_players`, `codeforgemedio_nicks`), así que puede
compartir proyecto de Firebase con el juego original añadiendo sus reglas. Ver [FIREBASE.md](FIREBASE.md).

## Desplegar

Es un sitio independiente que sale de la misma rama: en Netlify, **Base directory = `codeforgemedio`**.
Guía completa en [DESPLIEGUE-NETLIFY.md](DESPLIEGUE-NETLIFY.md).

La app de Android está preparada con su propio id (`es.jrotero.codeforgemedio`), pero **no se ha
compilado ni probado** y sigue llevando los iconos de CodeForge. Ver la nota al principio de
[GOOGLE-PLAY.md](GOOGLE-PLAY.md).

## Arquitectura

```
src/
  core/         Forge VM (transpilador + ejecución instrumentada), análisis de estilo, pato, progreso
  curriculum/
    index.js      los 6 módulos y el orden de los niveles
    programs.js   misiones de programa y sus lecciones
    drills.js     niveles de práctica (descritos una vez para los 3 lenguajes)
    levelgen.js   generador de código por lenguaje
    future.js     textos de «Tu futuro»
    m1…m3, js-pack.js, lessons.js   misiones con escena heredadas y sus lecciones
  scenes/       escenas Canvas 2D: screen (pantalla), lander, drones, carga, tests
  components/   mapa, arena, editor, lecciones, perfil, ranking, Future.jsx
  services/     cuentas (Firebase o local)
scripts/verify-curriculum.mjs
```

El Forge VM sigue admitiendo los 10 lenguajes de CodeForge; aquí solo se ofrecen tres
(`LANG_ORDER` en `src/core/languages.js`). Un cambio propio de Medio: en Python las listas aceptan
índices negativos (`mochila[-1]`) y avisan con `IndexError` al salirse.
