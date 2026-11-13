# CircuitosSEA

Simulador web de circuitos eléctricos para alumnos de FP (CFGS Sistemas Electrotécnicos y Automatizados).
Aplicación estática (sin backend): TypeScript + Vite + React + SVG. Licencia MIT.

> **Estado: Fases 1-3 completas + avance de las 4, 5, 6 y 7** (ver `docs/PLAN.md`). Lienzo, 24 componentes de CC con símbolos animados, motor MNA con diodos y protecciones, polímetro y hoja de medidas.

## Montar en esquema, multifilar y unifilar
Las pestañas **Esquema**, **Multifilar** y **Unifilar** son editables: arrastras componentes, los cableas y se simula al instante.
- **Multifilar:** todos los conductores, con la designación de cada borne (L, N, 1, 2, 3-4, X1-X2…), el color normalizado y la sección de cada cable.
- **Unifilar:** dibujas **solo la línea** (fuente → interruptor/fusible/magnetotérmico → receptor) con las marcas de conductores; el simulador añade solo el conductor de retorno de cada receptor. Esos retornos son cables reales (se ven en las demás vistas) y se ocultan en el unifilar. Disponible para fuentes, aparamenta en serie (interruptor, pulsadores, fusible, magnetotérmico) y receptores; el resto (conmutador, potenciómetro, diodos…) se monta en esquema o multifilar.
- El botón **Documento** de cada pestaña muestra el esquema generado automáticamente a partir del circuito (con el cajetín por línea en el unifilar), el que se imprime en el plano.

## Modo visitante y superadmin
Sin cuenta, el simulador está **muy limitado**: una pila, una resistencia y el polímetro; todo lo demás (resto de componentes, vistas, instrumentos, resolver, guardar/abrir, juego…) lleva candado y propone registrarse. Con cuenta se desbloquea todo. El superadmin (`ADMIN_EMAILS` en `src/access.ts`, y en `firestore.rules`) exige correo verificado y ve un panel con los usuarios. Detalles en `docs/DESPLIEGUE-NETLIFY-FIREBASE.md`.

## Portada, cuentas y nube
La aplicación abre con una **portada** que explica de qué va (con polímetro, osciloscopio, vatímetro, panel real y plano del juego funcionando en vivo) y pide **iniciar sesión** (Firebase Authentication: correo/contraseña y Google). Con sesión se desbloquea todo y el proyecto y el progreso del juego se guardan en Firestore (`users/{uid}`). Sin variables `VITE_FIREBASE_*` arranca en *modo demostración* (sin cuentas). Guía paso a paso: [`docs/DESPLIEGUE-NETLIFY-FIREBASE.md`](docs/DESPLIEGUE-NETLIFY-FIREBASE.md) · reglas: `firestore.rules` · variables: `.env.example`.

## Resolver valores (informe en PDF)
El botón **Resolver valores** (en Esquema, Multifilar, Unifilar y Real) genera un **solucionario con el formato de clase**: *Enunciado* (con figura y puntos nombrados) → *Resultado* → cada método con bandas y pasos «**Qué hago / Por qué / En la pizarra**» (ecuaciones ①②③, sustitución, reducción, Gauss) → *Comprobaciones*, *Interpretación* y *Reflexión*. Métodos: **Kirchhoff directo, mallas, matrices y Cramer (con determinantes), nudos, Millman, Thévenin, Norton y superposición**. **Funciona también en alterna**: fasores e impedancias complejas (R, +jωL, −j/ωC) en rectangular y polar, ley de Ohm con impedancia total y caídas, potencia compleja S = V·I*, P, Q, cos φ, diagrama fasorial y compensación del factor de potencia. Elige el convenio de sentidos (fuentes hacia A y cargas de A a B, o todas hacia A), la rama que estudian Thévenin/Norton, y rellena asignatura/tema/alumno. **Guardar como PDF** abre el diálogo de impresión (destino «Guardar como PDF»). Los ejercicios 1 y 2 del Tema 3 vienen como ejemplos. **Nombres de puntos**: doble clic en un terminal o empalme para llamarlo A, B, C… (si no, se asignan solos). Alcance: fuentes ideales o con resistencia interna; sin diodos; con fuentes de corriente no se usan mallas ni Cramer.

## Arrancar

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests del motor y del netlist
npm run build      # genera dist/ (alojable en Netlify / GitHub Pages)
```

## Qué hay hecho
- Motor MNA en continua (`src/engine`): resistencias, pilas con resistencia interna, fuentes de corriente, interruptores. Detecta lazos de fuentes, cortocircuitos y nudos flotantes con mensajes en español.
- Lienzo SVG: arrastrar desde la paleta, mover con imán a rejilla, girar (R), duplicar (Ctrl+D), borrar (Supr), deshacer/rehacer (Ctrl+Z/Y), zoom y desplazamiento, cableado pulsando terminal a terminal, empalmes.
- Corriente animada (sentido e intensidad), mapa de calor de tensiones, etiquetas V/I, lámpara que se ilumina.
- Panel de propiedades y de avisos, tema claro/oscuro, guardado automático local, abrir/guardar `.json`.
- Ejemplos: dos pilas en paralelo (Millman: **5 V y 5 A**), lámpara con interruptor, divisor de tensión.

- **24 componentes**: pila, fuente de corriente, resistencia, potenciómetro, condensador, bobina, NTC, PTC, LDR, diodo, LED (4 colores), Zener, interruptor, pulsadores NA/NC, conmutador, fusible, magnetotérmico (B/C/D), lámpara, resistencia calefactora, zumbador, motor de CC, masa y empalme.
- **Visual**: el LED y la lámpara brillan según la corriente, el motor gira, el fusible se funde con humo, el zumbador suena, los interruptores se accionan con un clic y los pulsadores mientras se mantienen.
- **Averías persistentes**: fusible, magnetotérmico, LED y lámpara se estropean al superar sus límites y quedan así hasta «Reponer averías».
- **Polímetro**: V⎓ (10 MΩ), A⎓ (shunt 0,05 Ω, fusible de 10 A que se funde si mides en paralelo), Ω y continuidad (solo sin tensión), bornes VΩ / 10 A, puntas que se colocan sobre terminales y hoja de medidas con valor teórico, error absoluto/relativo y exportación CSV.

- **Corriente alterna (fase 3)**: fuente senoidal (230 V / 50 Hz ajustable), condensador y bobina con reactancia, análisis con fasores (valores eficaces), potencias P/Q/S y cos φ. Ejemplos: RLC serie, corrección del factor de potencia, lámpara de 230 V.
- **Instrumentos «de taller»** (botón 🔬 Instrumentos): polímetro de mano con rueda giratoria (V⎓, V~, Ω, continuidad, A⎓, A~), bornes 10 A / COM / VΩ con clavijas, puntas que se colocan sobre el circuito; **osciloscopio de 2 canales** (base de tiempos, sensibilidad, acoplamiento AC/DC/GND, disparo, Vpp/Vrms/f/T y desfase Δφ; sonda de tensión o pinza de intensidad); **vatímetro** con aguja de cos φ, V, I, P, Q, S, kWh y coste (tarifa configurable, 1 s = 1 h para verlo moverse).

- **Modo Real** (selector Esquema | Real): el mismo circuito montado sobre un panel de prácticas con carril DIN, fuente/red, aparamenta modular (magnetotérmico, fusible, interruptor, conmutador), señalización y pulsadores de 22 mm, receptores, bornes de tornillo y cables de colores normalizados con terminal de punta (positivo rojo, negativo negro; en CA fase marrón, neutro azul). Se accionan interruptores y pulsadores y se colocan las puntas de los instrumentos sobre los bornes.

- **Seis vistas** del mismo circuito (selector superior): **Esquema** (edición), **Multifilar** (símbolos con designación de bornes y marcas de conductor por colores y sección), **Unifilar** (acometida → protecciones → receptores, con cajetín por línea: protección, conductor, tensión, potencia, intensidad y caída), **Real** (panel de montaje), **Cuadro** y **Plano**.
- **Sección del cableado**: cada cable tiene sección y longitud (se editan al seleccionarlo) y se ve en el esquema, en el multifilar y sobre el cable real (el grosor del cable crece con la sección). Se calcula R = L/(γ·S), intensidad, caída de tensión y se compara con la intensidad admisible; avisa si el cable se sobrecalienta o supera el 3 % (alumbrado) / 5 %.
- **Cuadro eléctrico** (vista Cuadro): electrificación básica ITC-BT-25 (C1–C5 editables, circuitos adicionales), dimensionado automático de PIA y sección (Ib, In ≤ Iz, caída), IGA, diferencial y limitador de sobretensiones, aspecto real en carril DIN, unifilar, cuadro de cargas y **cálculo paso a paso con fórmulas**.
- **Plano imprimible**: hoja A3/A4 con marco, zonas de referencia y cajetín (proyecto, plano, alumno, curso, fecha, escala, normativa). Contenido a elegir (unifilar del cuadro + cuadro de cargas, cuadro real, unifilar o multifilar del circuito). Imprimir/PDF (diálogo del navegador), SVG y PNG.

- **El circuito es lo principal**: los instrumentos son ventanas flotantes (botones ⚡ Polímetro · 〰 Osciloscopio · ◔ Vatímetro) que se arrastran por encima del lienzo, se minimizan y se cierran; paleta y propiedades se pueden ocultar (◧ ◨) y «Ajustar» (tecla F) encaja el circuito en pantalla.
- **Puntas arrastrables**: coge la punta roja/negra del polímetro o la sonda del osciloscopio y suéltala sobre un borne (se imanta al más cercano y se resalta). También puedes mover una punta ya colocada arrastrando su cabeza, o soltarla en vacío para quitarla.

- **Cablear en modo Real**: arrastra de borne a borne (con imán y vista previa del cable); clic en un cable + Supr lo quita; Ctrl+Z deshace. El cable toma su color normalizado automáticamente.
- **Esquema pulido**: cables con esquinas redondeadas y color por función, etiquetas V·I tipo tarjeta, sombras y cuadrícula con líneas mayores. Pantalla de bienvenida con inicio rápido (botón ❓).

- **Cuando algo va mal, estalla**: lámparas y LED sobrecargados, fusibles y fuentes en cortocircuito se destruyen con explosión animada (destello, onda, chispas, humo), sacudida de pantalla y sonido (opcional). Quedan quemados hasta pulsar «Reponer averías». Las lámparas se ponen al rojo blanco y parpadean antes de fundirse, y un cable que supera su intensidad admisible parpadea en rojo. Las fuentes tienen «Corriente máxima» (30 A pilas, 100 A red).
- **Cablear arrastrando también en el esquema**: arrastra de terminal a terminal con imán y vista previa (o clic-clic como antes).

- **Modo juego «Instalador»** (pestaña 🏠 Juego): un cliente aleatorio (semilla reproducible, 3 niveles) te encarga la electricidad de su vivienda (5 planos de serie que salen al azar: piso de 1, 2 y 3 dormitorios, ático con terraza y chalet de 4 dormitorios y 2 baños).
  1. *Replanteo*: coloca puntos de luz, mandos (interruptor, conmutador, detector), bases de 16 A y 25 A, tomas de electrodomésticos y TV, aire acondicionado y cargador de VE sobre un plano cianotipo; vincula cada mando a sus luces, asigna circuitos y coloca el cuadro. Se calculan las canalizaciones y sus longitudes reales. Una lista del pedido se tacha en vivo.
  2. *Cuadro*: elige PIA, curva (B/C/D), sección, IGA y diferenciales; el simulador calcula Iz, caída de tensión e Icc y dibuja el cuadro real en carril DIN.
  3. *Inspección*: se da tensión circuito a circuito: un cable que no soporta su protección arde, un PIA justo salta, un cortocircuito lejano puede no disparar.
  4. *Resultado*: nota sobre 100, estrellas, reacción del cliente, cobro y plano imprimible del cuadro. «Ver cómo lo haría un profesional» carga una solución automática (los tests resuelven 180 clientes con nota ≥ 95).
  Reglas realistas: bases prohibidas a menos de 0,6 m de la bañera, un diferencial por cada 5 circuitos, cuadro junto a la entrada, previsión mínima de IGA. Los mínimos por estancia y los precios son **orientativos** (marcados «a verificar»).

### Materiales reales y planos propios (modo juego)
- **Materiales reales**: `src/data/materiales.ts` recoge marca, referencia, precio (IVA incl.) y enlace a la ficha de tiendas españolas (Leroy Merlin, Obramat, ManoMano), consultadas en nov. 2026. Las líneas con `est: true` no tenían ficha clara y se han estimado. Son precios **orientativos**. Al entregar la obra aparece la **lista de materiales** (imprimible) con marca, cantidad, precio unitario y enlace. El presupuesto del cliente se calcula a partir del coste real de una instalación profesional.
- **Subir mi plano**: en la orden de trabajo, «Subir mi plano» → imagen, escala (dos puntos + distancia real), estancias (rectángulos: salón, cocina, pasillo, baño y dormitorio como mínimo), entrada y guardar. Se guarda en el navegador; se puede **exportar/importar** como `.plano.json` para compartirlo con la clase.

### Juego «Parte de avería» (pestaña 🔧 Avería)
Segundo juego, continuación de la reforma: el cliente llama con un síntoma y el alumno diagnostica, formula una hipótesis, repara, comprueba y entrega un parte en PDF. Solo con cuenta; el progreso (partes, mejor nota, media y estrellas) se guarda en el navegador y en la nube.
- **Flujo:** Aviso → Diagnóstico (esquema del circuito afectado con la avería oculta; IGA, enchufes y conmutadores accionables; polímetro con puntas arrastrables; cada acción gasta tiempo) → Hipótesis (causa y punto) → Reparación (con coste) → Comprobación y parte (nota sobre 10, estrellas, explicación y medida que la habría localizado antes).
- **Nota:** diagnóstico 4 (acertar a la primera da más), eficiencia 2 (menos medidas y tiempo), coste 2 (penaliza piezas que no estaban averiadas) y seguridad 2 (continuidad con tensión, intensidad en paralelo y manipular con tensión). Solo cuentan las medidas que se anotan.
- **Averías (8, una por partida según el nivel):** N1 cortocircuito en una toma y sobrecarga · N2 neutro suelto, derivación a tierra y conmutada mal cableada · N3 protección sobredimensionada, sección insuficiente (caída de tensión) y conductor de protección interrumpido.
- **Cómo está hecho** (`src/averias/`): `catalog.ts` define cada avería como DATOS (síntoma, efectos, medida que la delata, reparación correcta, coste); añadir una avería es añadir un objeto. `model.ts` traduce un circuito de la vivienda (el del instalador profesional, `autoSolve`) a un circuito del simulador con componentes ocultos, con una IGA de dos polos, el diferencial, el PIA, la resistencia de la línea y la tierra; el motor y el polímetro son los de siempre.
- **Simplificaciones, NO normativas** (`RULES` en `catalog.ts`): el térmico dispara con más de 1,45·In sostenido; el diferencial de 30 mA dispara con una fuga ≥ 30 mA; se da por buena una tensión ≥ 90 % de la nominal; la red es TN simplificada (neutro y tierra unidos en el origen); los tiempos y costes de mano de obra son valores de diseño del juego. La tabla de Iz sigue marcada como no verificada.
- **Pinza amperimétrica:** tarjeta propia en el diagnóstico (no toca el circuito, no hay fusible): fase o neutro de la línea, cada receptor, o fase y neutro juntos para leer la fuga a tierra. Mide como si se acabaran de rearmar las protecciones (simplificación para poder medir las averías que disparan al momento).
- **Guardado:** los `.omi` pueden incluir el parte en curso; dentro del juego se guarda el circuito del alumno, no el de la avería.
- **Móvil y tablet:** cabecera compacta de una fila, pestañas y herramientas con desplazamiento, zoom con dos dedos en el lienzo, y en «Parte de avería» el polímetro se maneja desde un panel (función y puntas por toque) en vez de la ventana flotante.

### Juego «El boletín» (pestaña 📋 Boletín)
Antes de entregar la obra, el alumno hace las verificaciones reglamentarias con instrumentos propios, decide si cada valor es apto y firma el boletín… o se niega a firmarlo si hay algún defecto. Solo con cuenta; el progreso (visitas, mejor nota, media y estrellas) se guarda en el navegador y en la nube.
- **Escena:** la vivienda con su cuadro (IGA, diferenciales, PIA y limitador), los receptores enchufados, el circuito en prueba con las puntas, la pica de tierra y, para el telurómetro, el jardín con las picas auxiliares y sus zonas de influencia. Se toca el IGA, los receptores o la pica para prepararlos y un mecanismo o PIA para elegir el circuito; los defectos encontrados se marcan, y al final se revelan todos.
- **Instrumentos:** megóhmetro (aislamiento, con pareja de conductores y tensión de ensayo), medidor de continuidad (con puntas a cero), telurómetro (distancia de picas auxiliares) y comprobador de diferenciales (corriente y tiempo de disparo).
- **Mecánica:** hay que preparar la instalación (IGA, receptores, limitador de sobretensiones, pica) y cada preparación y ensayo gastan tiempo del cliente. Las condiciones mal puestas dan lecturas engañosas (y una medida inválida), como en la realidad; medir con tensión penaliza la seguridad. Cada medida se anota como apto o no apto; al final se revela qué defectos había y cuáles se escaparon.
- **Niveles:** 1 un defecto claro y avisos de los aparatos · 2 preparación exigente, 0–2 defectos · 3 defectos escondidos (por ejemplo solo entre fase y neutro), valores justos, o ninguno.
- **Nota:** decisión 3, hallazgos 2, juicio 2, cobertura 1,5, seguridad 1, tiempo 0,5. Firmar con un defecto limita la nota a 3; negarse sin motivo a 5.
- **Código** (`src/boletin/`): `catalog.ts` (defectos como datos), `rules.ts` (los valores reglamentarios, en un solo sitio y marcados `verified: false`), `instruments.ts` (qué marcaría cada aparato en cada condición), `manual.ts` (el manual del instalador que sale dentro del juego).
- **Valores:** el aislamiento (500 V / 0,5 MΩ) coincide con guías técnicas, pero ningún valor se ha podido contrastar con el texto del BOE; el umbral de continuidad (2 Ω) es una simplificación del juego.

### Archivos .omi
Formato propio (JSON con cabecera `format: "omi"`): circuito, cuadro, cajetín del plano y, opcionalmente, la obra del juego con sus planos propios. «Guardar» → descargar al ordenador o guardar en el navegador; «Abrir» → archivo, biblioteca del navegador o arrastrar el `.omi` sobre la página. Acepta también los `.json` antiguos. Código: `src/omi.ts`, `src/ui/FilesDialog.tsx`.

### Edición del esquema: cables, empalmes y atajos
- **Cables con codos:** clic en un terminal empieza el cable; cada clic en el lienzo fija un codo (el cable gira ahí; Espacio cambia el sentido del tramo, Retroceso quita el último codo, Esc o clic derecho cancelan); clic en otro terminal lo termina. Los codos de un cable seleccionado se arrastran.
- **Empalme automático:** si el cable termina sobre otro, se crea un empalme en ese punto (ajustado a la rejilla), el cable atravesado se divide en dos y todo queda conectado eléctricamente. Se puede deshacer. Código: `src/model/wiregeom.ts` y `connectToWire` en `src/store.ts`.
- **Ratón:** la rueda sobre un componente lo gira (Ctrl + rueda hace zoom siempre), Mayús + arrastrar selecciona con recuadro.
- **Teclado:** Ctrl+C / X / V (se pega donde está el cursor), Ctrl+D duplicar, Ctrl+A seleccionar todo, flechas mueven (Mayús = 5 cuadros), R / Mayús+R giran, Ctrl+Z / Y. La tecla ? (o el botón «Atajos») muestra la lista completa.

## Estructura
```
src/engine/   motor puro (solver.ts, dc.ts) — sin DOM
src/model/    types, library (componentes por datos), netlist (cables→nudos), ejemplos
src/ui/       React + SVG
src/store.ts  estado + historial
docs/PLAN.md  arquitectura, decisiones, fases y riesgos
```

## Añadir un componente
1. Añade una entrada en `src/model/library.ts` (terminales, parámetros y modelo `R`/`V`/`I`/`SW`).
2. Añade su símbolo en `src/ui/symbols.tsx`.

## Limitaciones conocidas (Fase 1)
- CA solo monofásica, monofrecuencia y lineal (sin diodos ni rectificadores: llegan con el análisis transitorio); sin mezcla CC + CA; el voltímetro de CA no carga el circuito con sus 10 MΩ. El osciloscopio dibuja el régimen permanente (aún no hay transitorios RC/RL).
- CC en régimen estático; la lámpara es una resistencia lineal R = Vn²/Pn; condensador = abierto y bobina = resistencia del hilo.
- Protecciones simplificadas: el fusible salta a 1,6·In y el magnetotérmico solo por umbral magnético; sus curvas tiempo-corriente reales llegan en la fase 6.
- **Datos normativos**: `src/data/rebt.ts` marca como «a verificar» las intensidades admisibles (tipo UNE-HD 60364-5-52, método B1, Cu, PVC) y los coeficientes Cs/Cu de ITC-BT-25: están transcritos de bibliografía, no de las tablas oficiales. Solo hay conductor de cobre, un método de instalación y sin factores de corrección por agrupamiento/temperatura.
- Los cables no alteran la simulación (la caída se calcula aparte y avisa).
- El cuadro es independiente del circuito simulado (todavía no se genera el circuito a partir del cuadro ni de un plano de planta).
- El multifilar y el unifilar son de lectura y se generan automáticamente; la separación mando/potencia con referenciado de contactos llega con los automatismos (fase 8).
- El modo Real es de momento de lectura y maniobra: el cableado se edita en el esquema (arrastrar cables en modo real llega en la fase 5).
- Las puntas del polímetro se colocan en terminales (no sobre cables).
- Aún sin polímetro, CA, vistas unifilar/multifilar/real, plano, protecciones, automatismos, retos ni PWA (fases 2-10).
- No hay aviso de «circuito abierto» ni validación REBT todavía.

## Biblioteca de componentes (tanda 1)
Ahora hay 130 componentes con símbolo propio, buscables en la paleta: fuentes de CC (ideal, real, regulable, conmutada, dinamo, panel fotovoltaico, baterías Pb/Li/Ni-MH) y de CA (red, alternador, grupo, SAI); resistencias (potencia, reóstato, trimmer, shunt, galga, red, PT100); condensadores y bobinas de todos los tipos con su impedancia en CA; impedancia genérica R + jX; conexión y tomas; maniobra manual (bipolar/tripolar/tetrapolar, pulsador doble, conmutador de cruce, seta, selectores, seccionadores); sensores como contactos NA/NC; fusibles NH/D/cilíndrico, IGA, ICP, guardamotor, caja moldeada, relé térmico; lámparas, calefactores, electroválvulas, cargas RLC genéricas y motores monofásicos/CC. Pendiente (tanda 2): trifásica, transformadores, relés y contactores con bobina, temporizadores, diferenciales, bobinas acopladas y electrónica de potencia.

**Relés y contactores** (categoría Control): relé, relé de 2 contactos, SSR, contactor (3 principales + auxiliares NA/NC) y relés de mínima/máxima tensión. La bobina mueve sus contactos y *recuerda* su estado, así funciona la autorretención (ejemplo «Marcha-paro con contactor»). Falta: temporizadores (necesitan tiempo), diferenciales, trifásica y transformadores.

**Transformadores y trifásica**: transformador monofásico, con toma intermedia, autotransformador, variac, aislamiento, seguridad (MBTS), mando, toroidal, TI y TT; trifásicos Yy, Dy, Yd y Dd con desfase real; fuentes trifásicas (red 400/230 V con neutro, estrella, triángulo, alternador); cargas trifásicas equilibradas (estrella/triángulo), desequilibrada y motores trifásicos (jaula, rotor bobinado, síncrono). Transformador ideal con impedancia de cortocircuito (ucc). **Diferenciales** 2P/4P y magnetotérmico-diferencial: disparan por corriente de fuga. **Temporizadores** (a la conexión, a la desconexión, estrella-triángulo, automático de escalera) con tiempo real. Límites: el solucionario paso a paso no incluye transformadores; no se modela la corriente de vacío ni la saturación; la Yz y el Dahlander no están.

## Electrónica y análisis transitorio
El botón **Transitorio** simula el circuito en el tiempo (Euler implícito + Newton) y dibuja tensiones y corrientes: rectificadores y puentes con condensador, transistores BJT y MOSFET/IGBT (Ebers-Moll y ley cuadrática), amplificador operacional y comparador (con saturación), 555 astable/monoestable, puertas lógicas IEC (AND, OR, NOT, NAND, NOR, XOR), biestables D, JK, T y SR, tiristor, triac, diac, optoacoplador, fotodiodo/fototransistor, reguladores 78xx y LM317, convertidores buck/boost, regulador solar, inversor, variador de frecuencia, arrancador suave, driver LED y filtro EMI (los convertidores usan modelo promediado). Generadores de funciones (senoidal, cuadrada, triangular, diente de sierra), PWM y fuente con armónicos. Ejemplos: fuente rectificada con filtro, 555 con LED y amplificador inversor ×−10.
También: telerruptor, relé biestable, contador de impulsos, relé de control de fases, interruptor horario, programador astronómico, bloque de contactos auxiliares y enclavamiento mecánico (se indican por el número de contactor, en orden de colocación).
Límites: PLC y programación no incluidos; el análisis transitorio no resuelve transformadores ni relés con histéresis temporal (los relés se toman en su estado estático).
