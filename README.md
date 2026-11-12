# CircuitosSEA

Simulador web de circuitos eléctricos para alumnos de FP (CFGS Sistemas Electrotécnicos y Automatizados).
Aplicación estática (sin backend): TypeScript + Vite + React + SVG. Licencia MIT.

> **Estado: Fases 1-3 completas + avance de las 4, 5, 6 y 7** (ver `docs/PLAN.md`). Lienzo, 24 componentes de CC con símbolos animados, motor MNA con diodos y protecciones, polímetro y hoja de medidas.

## Modo visitante y superadmin
Sin cuenta, el simulador está **muy limitado**: una pila, una resistencia y el polímetro; todo lo demás (resto de componentes, vistas, instrumentos, resolver, guardar/abrir, juego…) lleva candado y propone registrarse. Con cuenta se desbloquea todo. El superadmin (`ADMIN_EMAILS` en `src/access.ts`, y en `firestore.rules`) exige correo verificado y ve un panel con los usuarios. Detalles en `docs/DESPLIEGUE-NETLIFY-FIREBASE.md`.

## Portada, cuentas y nube
La aplicación abre con una **portada** que explica de qué va (con polímetro, osciloscopio, vatímetro, panel real y plano del juego funcionando en vivo) y pide **iniciar sesión** (Firebase Authentication: correo/contraseña y Google). Con sesión se desbloquea todo y el proyecto y el progreso del juego se guardan en Firestore (`users/{uid}`). Sin variables `VITE_FIREBASE_*` arranca en *modo demostración* (sin cuentas). Guía paso a paso: [`docs/DESPLIEGUE-NETLIFY-FIREBASE.md`](docs/DESPLIEGUE-NETLIFY-FIREBASE.md) · reglas: `firestore.rules` · variables: `.env.example`.

## Resolver valores (informe en PDF)
El botón **🧮 Resolver valores** (en Esquema, Multifilar, Unifilar y Real) resuelve el circuito dibujado, paso a paso, por los métodos que elijas: **Ohm y serie/paralelo, Kirchhoff, mallas, nudos, Millman, Thévenin, Norton y superposición**, más el balance de potencias. Cada método muestra la red, las ecuaciones con letras y con números, la resolución y se **comprueba contra el simulador** (los tests verifican que todos coinciden). Los que no aplican a tu circuito aparecen desactivados con la razón. **Guardar como PDF** abre el diálogo de impresión del navegador (destino «Guardar como PDF»). Alcance: circuitos de corriente continua con fuentes ideales o con resistencia interna (la CA y los diodos no entran todavía); Thévenin y Norton resuelven la carga elegida.

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

- **Modo juego «Instalador»** (pestaña 🏠 Juego): un cliente aleatorio (semilla reproducible, 3 niveles) te encarga la electricidad de su vivienda (piso de 2 o 3 dormitorios con terraza y garaje).
  1. *Replanteo*: coloca puntos de luz, mandos (interruptor, conmutador, detector), bases de 16 A y 25 A, tomas de electrodomésticos y TV, aire acondicionado y cargador de VE sobre un plano cianotipo; vincula cada mando a sus luces, asigna circuitos y coloca el cuadro. Se calculan las canalizaciones y sus longitudes reales. Una lista del pedido se tacha en vivo.
  2. *Cuadro*: elige PIA, curva (B/C/D), sección, IGA y diferenciales; el simulador calcula Iz, caída de tensión e Icc y dibuja el cuadro real en carril DIN.
  3. *Inspección*: se da tensión circuito a circuito: un cable que no soporta su protección arde, un PIA justo salta, un cortocircuito lejano puede no disparar.
  4. *Resultado*: nota sobre 100, estrellas, reacción del cliente, cobro y plano imprimible del cuadro. «Ver cómo lo haría un profesional» carga una solución automática (los tests resuelven 180 clientes con nota ≥ 95).
  Reglas realistas: bases prohibidas a menos de 0,6 m de la bañera, un diferencial por cada 5 circuitos, cuadro junto a la entrada, previsión mínima de IGA. Los mínimos por estancia y los precios son **orientativos** (marcados «a verificar»).

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
