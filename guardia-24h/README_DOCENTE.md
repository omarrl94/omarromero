# Guía del docente

## Cómo se calcula la nota
- PE de un ítem = `pe_base × dificultad × factor_nivel` (N1 0,5 · N2 0,75 · N3 1 · N4 1,25 · N5 1,5).
- Cita correcta 100 %; respuesta correcta sin cita 70 %; cita correcta con respuesta incorrecta 0 %. Cada pista resta el 20 %.
- Error de seguridad grave: ítem a 0 y −10 % del PE máximo del nivel (tope −30 %).
- `RA_juego = ΣPE obtenidos ÷ ΣPE máximos × 10` (mejor intento; solo si hay ≥ 80 % de cobertura).
- `RA_final = a·RA_juego + (1−a)·RA_taller` (a = 0,4 por defecto, en `content/ra/ra.json`; sin nota de taller, `RA_final = RA_juego`).
- `Nota final = Σ RA × peso` (pesos en `content/ra/ra.json`). Aprobado: final ≥ 5 **y** cada RA ≥ 5.
Implementación y ejemplos numéricos: `src/game/grading.ts` y `grading.test.ts`.

## Añadir contenido (sin tocar código)
1. Ítems: un `.json` por ítem en `content/distritos/dN/` con el contrato de `src/data/schemas.ts` (`ItemSchema`). Nacen con `estado: "borrador"` y `verificado: false`.
2. Valores normativos: `content/norma/*.json` con `fuente` (documento, ITC, apartado/tabla).
3. REBT y manuales: `content/library/*.json` (secciones con `id`, `titulo`, `texto`). Copia el texto **oficial**.
4. `npm run content:validar` comprueba todo.

## Pendiente del profesor (TODO(profesor))
- Texto oficial del REBT y manuales (`content/library/rebt.json` está vacío a propósito).
- ITC exactas del RA4 (distrito 5), valores normativos a verificar, valor de `a`.
- Logotipo y fotos de cuadros; proyecto de Firebase y creación de clases.
- Los CE de `content/ra/ra.json` están transcritos del Anexo I del RD 1127/2010; verificar contra el currículo de Madrid.

## Fase 1: qué hay jugable
- Distrito 1 con 26 ítems **en borrador** (N1 8, N2 6, N3 5, N4 4, N5 3). Son ejemplos pedagógicos **sin valores normativos**; N3 «Gymkhana» pide localizar la ITC y su respuesta esperada (p. ej. ITC-BT-21) debe validarla el profesor contra el REBT oficial. Mínimo previsto por nivel: 25 ítems y 3 jefes (hay que ampliar el banco).
- Reglas: un intento = hasta 10 ítems (prioriza los no vistos), 3 intentos por nivel, nivel superado con ≥ 50 % de PE, nivel N+1 se abre al superar el N.
- Panel docente (`/docente`): alumnos de este dispositivo, nota de taller por RA, valor de `a` por alumno, intento extra (`distrito-nivel`, Enter) y export CSV. **Limitaciones:** sin login de profesor ni contraseña, y en modo local los ajustes viven en el navegador. El panel en la nube va en la siguiente fase.
- Aún no: RA9 rúbrica, mapa de calor, tiempos imposibles, XLSX, desglose por CE, publicar borradores.

## Fase 2: motor de circuitos, D3 y D4
- `src/engine/`: `circuito.ts` (I=P/U, caída de tensión, IB≤In≤IZ, curva de disparo, diferencial), `vivienda.ts` (bases/luz por estancia, nº de diferenciales), `cuadro.ts` (validador con explicación y cita). Sin valores normativos en el código.
- **Valores normativos de la vivienda** (`content/norma/vivienda.json`, `catalogo.json`): C1–C5, reglas de puntos, tensión y conductividad. Los he cargado de memoria para poder probar el motor y **todos están `verificado:false`**: revísalos contra ITC-BT-25 y el resto de fuentes antes de publicar nada.
- Tipos de ítem nuevos: `dimensionado` (PIA/sección/tubo por circuito, puntuación parcial), `hotspots` (Muro de la vergüenza: aciertos suman, falsos positivos restan), `numerico` con `solucion.calculo` (la respuesta sale del motor + norma).
- Contenido en borrador: D3 25 ítems, D4 12 ítems (hotspots con defectos inventados con fines didácticos; citas a ITC por verificar).
- Pendiente de la Fase 2 original: editor visual de replanteo y cuadro (arrastrar), unifilar/multifilar y reparación interactiva (el «cuadro del horror» solo se inspecciona).

## Fase 3: verificación y canalizaciones (D7 y D2)
- `src/engine/averias.ts`: inyector de averías (fase abierta, neutro cortado, borna floja, fuga, inversión F/N, cortocircuito, tierra abierta) e instrumentos virtuales (tensión, continuidad, aislamiento, pinza). **Medir continuidad o aislamiento con tensión = error de seguridad grave** (ítem a 0).
- `src/engine/acta.ts`: acta de verificación; los umbrales salen de `content/norma/verificacion.json` (**todos `verificado:false`**, cargados de memoria: revísalos con ITC-BT-19/18/24).
- Tipos de ítem: `instrumento` (diagnóstico con banco de pruebas) y `acta` (dictamen por prueba + dictamen final, puntuación parcial).
- Contenido en borrador: D7 14 ítems, D2 15 ítems. El banco de cada nivel sigue lejos del mínimo de 25.
- Interfaz rediseñada como juego (mapa de campaña, estrellas, fichas de colores, sonido con silencio, cuadro y multímetro dibujados).

## Teoría de cada bloque
`content/teoria/d1..d8.json`: objetivos, secciones y bloques de contenido (párrafos, listas, fórmulas, ejemplos resueltos, avisos de seguridad/norma/clave, tablas y remisiones a la ITC). Página `/distrito/N/teoria` con índice, marca de lectura y enlace a la biblioteca. Los textos están en **borrador**: explican el criterio y remiten a la ITC; **no fijan valores normativos nuevos** salvo donde se indica «verificar». Revísalos antes de publicar.

## Fase 4: automatismos cableados (bloque 6)
- `src/engine/automatismo.ts`: simulador de circuitos de mando (cables, contactos NA/NC, contactores, relé térmico, temporizador, pilotos, detección de cortocircuito y de estados prohibidos como KM2+KM3).
- Tipo de ítem `automatismo`: el alumno cablea terminales; la nota sale de **escenarios de prueba** (arranque, retención, paro, térmico, enclavamiento…), no de comparar con un cableado único. Si falla el primer escenario (función básica), no hay puntuación aunque pasen los negativos.
- Banco de pruebas en vivo: pulsadores (mantener pulsado = impulso), disparo del térmico y tiempo ×5 para ver el temporizador.
- 19 ítems en borrador (N1 4, N2 5, N3 4, N4 4, N5 2: estrella-triángulo e inversión de giro completos). Cada ítem tiene su cableado de referencia en `solucion.cables` y un test que comprueba que puntúa el 100 %.
- **Limitación de integridad:** las soluciones viajan dentro del paquete del navegador. Para evaluación con garantías habría que validarlas en servidor (Fase 6 / Firebase Functions).
