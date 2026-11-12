// PARTE 1 · ACADEMIA — los fundamentos de la IA, en 10 lecciones con widgets interactivos y test.
import { h, slider } from './ui.js';
import { sigmoid } from './ml.js';

/* ---------- widgets interactivos ---------- */
const widgets = {
  table() {
    const rows = [['Ana', 17, 1.65, 'Sí', 'Aprobó'], ['Luis', 18, 1.80, 'No', 'Suspendió'], ['Marta', 17, 1.58, 'Sí', 'Aprobó'], ['Hugo', 18, '—', 'No', 'Suspendió']];
    return h('div.widget', h('h4', 'Un dataset por dentro'),
      h('table.t', h('thead', h('tr', ['Nombre', 'Edad', 'Altura', 'Estudia', 'ETIQUETA'].map((t, i) => h('th', t)))),
        h('tbody', rows.map((r) => h('tr', r.map((c, i) => h('td', { style: i === 4 ? { color: '#a3ff3d' } : r[i] === '—' ? { color: '#ff4767' } : {} }, c)))))),
      h('p.sm.mut', 'Cada fila es un ', h('b', 'ejemplo'), '; cada columna una ', h('b', 'característica (feature)'), '; la última es la ', h('b', 'etiqueta'), ' que queremos predecir. ¿Ves el dato vacío de Hugo? Eso es un dato ', h('b.rd', 'perdido'), '.'));
  },
  confusion() {
    const mails = [[.05, 0], [.1, 0], [.2, 0], [.35, 0], [.45, 1], [.5, 0], [.6, 1], [.7, 1], [.82, 1], [.95, 1], [.4, 0], [.9, 1]];
    const out = h('div'); const grid = h('div');
    const s = slider('Umbral spam', 0.05, 0.95, 0.05, 0.5, (v) => draw(v), (v) => v.toFixed(2));
    function draw(t) {
      let tp = 0, fp = 0, fn = 0, tn = 0;
      mails.forEach(([sc, spam]) => { const p = sc >= t ? 1 : 0; if (p && spam) tp++; else if (p && !spam) fp++; else if (!p && spam) fn++; else tn++; });
      const prec = tp + fp ? tp / (tp + fp) : 1, rec = tp + fn ? tp / (tp + fn) : 1;
      grid.replaceChildren(h('table.t', h('tr', h('th', ''), h('th', 'Dice SPAM'), h('th', 'Dice NO spam')),
        h('tr', h('th', 'Era spam'), h('td', { style: { color: '#a3ff3d' } }, `${tp} aciertos`), h('td', { style: { color: '#ff4767' } }, `${fn} se coló (falso negativo)`)),
        h('tr', h('th', 'No era spam'), h('td', { style: { color: '#ff4767' } }, `${fp} correo bueno a la basura (falso positivo)`), h('td', { style: { color: '#a3ff3d' } }, `${tn} aciertos`))));
      out.replaceChildren(h('p', 'Precisión: ', h('b.cy', (prec * 100).toFixed(0) + '%'), '  ·  Exhaustividad (recall): ', h('b.cy', (rec * 100).toFixed(0) + '%'), '  ·  Exactitud: ', h('b.cy', (((tp + tn) / mails.length) * 100).toFixed(0) + '%')));
    }
    draw(0.5);
    return h('div.widget', h('h4', 'Filtro de spam · matriz de confusión'), s.el, grid, out,
      h('p.sm.mut', 'Sube el umbral: el filtro es más tímido (menos falsos positivos, pero se cuelan spams). Bájalo: caza más spam, pero tira correos buenos. No hay umbral perfecto: hay que elegir qué error duele menos.'));
  },
  neuron() {
    let x1 = 1, x2 = 0; let w1 = 1.5, w2 = -1, b = -0.5;
    const out = h('div');
    const draw = () => {
      const z = w1 * x1 + w2 * x2 + b, a = sigmoid(z);
      out.replaceChildren(
        h('div.code', `z = ${w1.toFixed(1)}·${x1.toFixed(1)} + ${w2.toFixed(1)}·${x2.toFixed(1)} + (${b.toFixed(1)}) = ${z.toFixed(2)}`),
        h('p', 'Activación sigmoide: ', h('b.cy', a.toFixed(3)), '  →  la neurona ', h('b', a > .5 ? 'SE ACTIVA 🔥' : 'se queda dormida 😴')));
    };
    const S = [slider('entrada x1', 0, 1, .1, x1, (v) => { x1 = v; draw(); }, (v) => v.toFixed(1)), slider('entrada x2', 0, 1, .1, x2, (v) => { x2 = v; draw(); }, (v) => v.toFixed(1)),
      slider('peso w1', -3, 3, .1, w1, (v) => { w1 = v; draw(); }, (v) => v.toFixed(1)), slider('peso w2', -3, 3, .1, w2, (v) => { w2 = v; draw(); }, (v) => v.toFixed(1)),
      slider('sesgo b', -3, 3, .1, b, (v) => { b = v; draw(); }, (v) => v.toFixed(1))];
    draw();
    return h('div.widget', h('h4', 'Una neurona artificial en vivo'), S.map((s) => s.el), out,
      h('p.sm.mut', 'Mueve los pesos: aprender es, literalmente, encontrar los números que hacen que la neurona se active cuando toca.'));
  },
  temp() {
    const toks = [['mesa', 3.2], ['cama', 2.6], ['alfombra', 1.8], ['luna', 0.4], ['Pizza', -0.5]];
    const box = h('div');
    const s = slider('Temperatura', .1, 2.5, .1, 1, (v) => draw(v), (v) => v.toFixed(1));
    function draw(T) {
      const ex = toks.map(([, l]) => Math.exp(l / T)), sum = ex.reduce((a, b) => a + b, 0);
      box.replaceChildren(...toks.map(([t], i) => h('div.bar', h('span', t), h('div.tr', h('i', { style: { width: (ex[i] / sum) * 100 + '%' } })), h('span', ((ex[i] / sum) * 100).toFixed(0) + '%'))));
    }
    draw(1);
    return h('div.widget', h('h4', 'Siguiente palabra · «El gato duerme encima de la …»'), s.el, box,
      h('p.sm.mut', 'T baja → el modelo siempre elige «mesa» (fiable, aburrido). T alta → reparte las apuestas y se atreve con «Pizza» (creativo… o disparatado).'));
  },
  matrioska() {
    const lay = (c, t, d, kids) => h('div', { style: { borderColor: c } }, h('b', { style: { color: c } }, t), h('span.sm.mut', ' — ' + d), kids);
    return h('div.matry',
      lay('#22e4ff', 'Inteligencia Artificial', 'cualquier técnica que haga que una máquina parezca inteligente',
        lay('#ff3df0', 'Machine Learning', 'aprende patrones a partir de datos, sin reglas escritas a mano',
          lay('#a3ff3d', 'Deep Learning', 'redes neuronales con muchas capas (visión, voz, LLMs)'))));
  },
};

/* ---------- constructores de pasos ---------- */
const T = (title, html, widget) => ({ t: 'text', title, html, widget });
const Q = (q, opts, a, why) => ({ t: 'quiz', q, opts, a, why });
const KEY = (x) => `<div class="key"><b class="t">Concepto clave</b>${x}</div>`;
const EX = (x) => `<div class="ex"><b class="t">Ejemplo real</b>${x}</div>`;
const WARN = (x) => `<div class="warn"><b class="t rd">Ojo</b>${x}</div>`;

export const LESSONS = [
  {
    id: 1, icon: '🤖', color: '#22e4ff', title: '¿Qué es la IA?', sub: 'IA, machine learning y deep learning sin humo',
    steps: [
      T('La IA no es magia (ni Terminator)', `<p>Una <b>Inteligencia Artificial</b> es un sistema que realiza tareas que, hechas por una persona, diríamos que requieren inteligencia: reconocer una cara, traducir, jugar al ajedrez, conducir…</p>
        ${KEY('IA = máquinas que perciben, deciden y actúan para lograr un objetivo. Lo de «pensar como una persona» es opcional.')}
        <p>Hoy toda la IA que existe es <b>IA estrecha</b> (débil): brillante en UNA cosa. Una IA que haga de todo como un humano (<b>IA general</b>, AGI) es un objetivo de investigación, no un producto que puedas descargar.</p>`),
      T('La matrioska: IA ⊃ ML ⊃ DL', `<p>Son términos que se mezclan constantemente. Piensa en muñecas rusas:</p>`, 'matrioska'),
      T('Programar vs. entrenar', `<p>En la programación clásica TÚ escribes las reglas:</p><pre class="code">si el correo contiene "premio" y "urgente" → SPAM</pre>
        <p>Funciona… hasta que los spammers escriben «pr3mio». En <b>machine learning</b> inviertes el proceso: le das al ordenador <b>miles de ejemplos ya etiquetados</b> y él descubre las reglas.</p>
        <table class="t"><tr><th></th><th>Entra</th><th>Sale</th></tr><tr><td>Programación clásica</td><td>Datos + Reglas</td><td>Respuestas</td></tr><tr><td>Machine learning</td><td>Datos + Respuestas</td><td class="li">Reglas (el «modelo»)</td></tr></table>
        ${EX('Nadie escribió a mano las reglas para distinguir un perro de un gato en una foto. Se mostraron millones de fotos etiquetadas y la red las descubrió sola.')}`),
      T('Una historia en 8 fechas', `<table class="t">
        <tr><td>1950</td><td>Alan Turing propone el <b>Test de Turing</b>: «¿puede una máquina hacerse pasar por humana?»</td></tr>
        <tr><td>1956</td><td>Conferencia de Dartmouth: nace el término «Inteligencia Artificial».</td></tr>
        <tr><td>1970-90</td><td>Los <b>«inviernos de la IA»</b>: se prometió demasiado y se recortó la financiación.</td></tr>
        <tr><td>1997</td><td>Deep Blue vence a Kaspárov al ajedrez (con búsqueda, no con aprendizaje).</td></tr>
        <tr><td>2012</td><td>AlexNet arrasa en visión: arranca la era del <b>deep learning</b> (datos + GPUs).</td></tr>
        <tr><td>2016</td><td>AlphaGo vence a Lee Sedol al Go con aprendizaje por refuerzo.</td></tr>
        <tr><td>2017</td><td>Aparece el <b>Transformer</b>, la arquitectura detrás de los LLM.</td></tr>
        <tr><td>2022→</td><td>ChatGPT populariza la <b>IA generativa</b>.</td></tr></table>`),
      Q('Un antivirus que bloquea un archivo porque su firma coincide EXACTAMENTE con una lista escrita por humanos, ¿usa machine learning?', ['Sí, es IA', 'No: aplica reglas fijas escritas a mano', 'Sí, porque usa datos'], 1, 'Una lista de firmas es una regla fija. Un antivirus con ML aprendería patrones de comportamiento de miles de malwares para detectar los que nunca ha visto.'),
      Q('¿Cuál es la relación correcta?', ['Deep learning ⊃ Machine learning ⊃ IA', 'IA ⊃ Machine learning ⊃ Deep learning', 'Machine learning ⊃ IA ⊃ Deep learning'], 1, 'El deep learning es un tipo de machine learning, que a su vez es una forma de hacer IA.'),
      Q('ChatGPT, Siri o el reconocimiento facial del móvil son ejemplos de…', ['IA general (AGI)', 'IA estrecha: cada una hace bien su tarea concreta', 'Conciencia artificial'], 1, 'Ninguna entiende el mundo como una persona. Son muy buenas en una familia de tareas.'),
    ],
  },
  {
    id: 2, icon: '🗃️', color: '#a3ff3d', title: 'Datos: el combustible', sub: 'Datasets, features, etiquetas y calidad',
    steps: [
      T('Sin datos no hay IA', `<p>Un modelo es tan bueno como los datos con los que se entrena. Un <b>dataset</b> es una tabla:</p>${'<!--W-->'}
        ${KEY('<b>Feature</b> = columna de entrada. <b>Etiqueta (label)</b> = lo que queremos predecir. <b>Ejemplo</b> = fila.')}`, 'table'),
      T('Basura entra, basura sale', `<p>Los datos reales son un desastre. Lo primero que hace un científico de datos es <b>limpiar</b>:</p>
        <ul><li><b>Valores perdidos:</b> celdas vacías (se rellenan o se descarta la fila).</li><li><b>Valores imposibles / outliers:</b> alguien con 212 años de edad.</li><li><b>Duplicados:</b> la misma fila 50 veces hace que el modelo la «memorice».</li><li><b>Etiquetas erróneas:</b> una foto de gato marcada como «perro».</li></ul>
        ${WARN('Pasarás aproximadamente el <b>80 % del tiempo</b> de un proyecto real preparando datos y solo el 20 % entrenando modelos.')}`),
      T('Train / validación / test', `<p>Si examinas a un alumno con las mismas preguntas que ha memorizado, no sabes si entiende nada. Con los modelos pasa igual. Por eso se parten los datos:</p>
        <table class="t"><tr><th>Parte</th><th>%</th><th>Para qué</th></tr><tr><td>Entrenamiento</td><td>70 %</td><td>El modelo aprende de ellos</td></tr><tr><td>Validación</td><td>15 %</td><td>Ajustar decisiones (hiperparámetros)</td></tr><tr><td>Test</td><td>15 %</td><td>Examen final, <b>se usa una sola vez</b></td></tr></table>
        ${KEY('<b>Data leakage</b> (fuga de datos): si una feature contiene la respuesta (p. ej. «nota_final» para predecir si aprueba), el modelo hace trampa y en el mundo real fracasa.')}`),
      T('Más datos, y que representen al mundo', `<p>No basta con tener muchos datos: tienen que <b>representar</b> los casos reales. Un detector de piel trabajado con fotos de un solo tono de piel fallará con los demás. Volveremos a esto en la lección de ética.</p>${EX('Un sistema de reconocimiento de voz entrenado solo con acentos de Madrid tendrá problemas con un andaluz o un canario.')}`),
      Q('Quieres predecir si un alumno aprobará. ¿Cuál de estas columnas es una FUGA de datos?', ['horas_de_estudio', 'asistencia', 'nota_final_del_curso'], 2, 'La nota final ya contiene la respuesta: en el mundo real no la tendrías en el momento de predecir.'),
      Q('Tu modelo saca 99 % en entrenamiento y 60 % en test. ¿Qué sospechas?', ['Que es genial', 'Que ha memorizado los datos de entrenamiento', 'Que el test está mal'], 1, 'Un abismo entre train y test es la señal clásica de sobreajuste (lo verás en la lección 7).'),
      Q('Una fila repetida 500 veces en el dataset provoca que…', ['El modelo le dé un peso desproporcionado', 'Nada, los duplicados no importan', 'El modelo se entrene más rápido y mejor'], 0, 'Los duplicados sesgan al modelo hacia esos ejemplos y pueden colarse en el test, inflando la nota.'),
    ],
  },
  {
    id: 3, icon: '🧭', color: '#ffb534', title: 'Cómo aprende una máquina', sub: 'Supervisado, no supervisado y refuerzo',
    steps: [
      T('Tres formas de aprender', `<div class="matry">
        <div style="border-color:#22e4ff"><b class="cy">Supervisado</b> · aprende con ejemplos <b>etiquetados</b>.<div class="sm mut">Fotos con su etiqueta «gato/perro», casas con su precio. Tareas: clasificación y regresión.</div></div>
        <div style="border-color:#a3ff3d"><b class="li">No supervisado</b> · solo hay datos, <b>sin etiquetas</b>.<div class="sm mut">Agrupar clientes parecidos (clustering), detectar anomalías, comprimir información.</div></div>
        <div style="border-color:#ff3df0"><b class="ma">Por refuerzo</b> · un agente prueba acciones y recibe <b>recompensas o castigos</b>.<div class="sm mut">Robots, videojuegos, AlphaGo. Aprende por ensayo y error.</div></div></div>`),
      T('Clasificación vs. regresión', `<p>Dentro del aprendizaje supervisado:</p><ul><li><b>Clasificación:</b> la respuesta es una <i>categoría</i> (¿spam o no? ¿gato, perro o loro?).</li><li><b>Regresión:</b> la respuesta es un <i>número</i> (¿cuánto cuesta este piso? ¿qué temperatura habrá mañana?).</li></ul>
        ${EX('Netflix agrupa a sus usuarios por gustos (<b>no supervisado</b>) y luego predice qué nota le darás a una serie (<b>regresión</b>).')}`),
      T('Clustering: k-means en 4 pasos', `<p>El algoritmo de agrupación más famoso. Quieres <b>k</b> grupos:</p><ol><li>Colocas k centros al azar.</li><li>Cada punto se une al centro más cercano.</li><li>Cada centro se mueve al promedio de su grupo.</li><li>Repites 2 y 3 hasta que nadie cambia.</li></ol>
        ${KEY('Es sensible a la <b>posición inicial</b> de los centros: una mala salida puede dejar grupos absurdos. ¡Lo comprobarás en la misión 3!')}`),
      T('Autosupervisado: el truco de los LLM', `<p>Hay una cuarta vía muy de moda: <b>aprendizaje autosupervisado</b>. Los datos se etiquetan solos. Ejemplo: tomas una frase, tapas una palabra y obligas al modelo a adivinarla. Billones de frases = billones de ejemplos gratis. Así se entrenan los grandes modelos de lenguaje.</p>`),
      Q('Agrupar 10.000 clientes en «perfiles» sin tener ninguna etiqueta previa es…', ['Aprendizaje supervisado', 'Aprendizaje no supervisado (clustering)', 'Aprendizaje por refuerzo'], 1, 'No hay etiqueta que predecir: el algoritmo descubre la estructura por sí solo.'),
      Q('Predecir el precio de una casa en euros es un problema de…', ['Clasificación', 'Regresión', 'Clustering'], 1, 'La salida es un número continuo.'),
      Q('Un robot aspirador que aprende a no chocar porque recibe «puntos» al limpiar y los pierde al golpearse usa…', ['Aprendizaje por refuerzo', 'Aprendizaje supervisado', 'Regresión lineal'], 0, 'Agente + entorno + recompensa: es la receta del refuerzo.'),
    ],
  },
  {
    id: 4, icon: '🎯', color: '#ff3df0', title: 'Clasificar con k-NN', sub: 'Vecinos, distancias y cómo medir aciertos',
    steps: [
      T('«Dime con quién andas…»', `<p><b>k-NN (k vecinos más cercanos)</b> es el algoritmo más intuitivo: para clasificar un dato nuevo, mira a sus <b>k vecinos más cercanos</b> y haz que voten.</p>
        ${KEY('No «aprende» nada en el entrenamiento: simplemente guarda los datos. Toda la faena ocurre al preguntar.')}
        <p>La distancia entre dos puntos es la de Pitágoras: <code>d = √((x₁−x₂)² + (y₁−y₂)²)</code>.</p>`),
      T('Elegir k: el dilema', `<ul><li><b>k = 1:</b> copia a su vecino más cercano. Si ese vecino es un dato erróneo, tú también. Frontera retorcida → <b>sobreajuste</b>.</li><li><b>k enorme:</b> vota casi todo el mundo y se impone la clase mayoritaria. Frontera demasiado simple → <b>infraajuste</b>.</li></ul>
        <p>Se suele usar k impar (evita empates) y se elige probando con datos de validación.</p>${WARN('Si las features tienen escalas distintas (edad 0-100 y sueldo 0-100.000) el sueldo manda sobre todo. Hay que <b>normalizar</b> las features.')}`),
      T('¿Cuántos aciertas? No basta con el %', `<p>Imagina un test de una enfermedad que solo tiene el 1 % de la población. Un modelo que diga siempre «sano» acierta el <b>99 %</b>… y es inútil. Por eso se usa la <b>matriz de confusión</b>:</p>
        <ul><li><b>Precisión</b>: de los que dije «positivo», ¿cuántos lo eran?</li><li><b>Exhaustividad (recall)</b>: de todos los positivos reales, ¿cuántos encontré?</li></ul>`, 'confusion'),
      Q('Con k=1 y datos con ruido, el modelo…', ['Generaliza perfectamente', 'Memoriza el ruido (sobreajuste)', 'Siempre vota empate'], 1, 'El vecino más cercano puede ser un dato mal etiquetado, y k=1 lo copia sin dudar.'),
      Q('Un detector de cáncer prefiere no dejar escapar ningún caso real. ¿Qué métrica prioriza?', ['Recall (exhaustividad)', 'Precisión', 'Velocidad'], 0, 'Un falso negativo (enfermo que se va a casa) es mucho peor que un falso positivo (otra prueba más).'),
      Q('Un modelo que dice siempre «no hay fraude» en un banco donde el fraude es el 0,1 % tiene…', ['99,9 % de exactitud y es inútil', '0 % de exactitud', 'Es un modelo excelente'], 0, 'Con clases desbalanceadas la exactitud engaña: hay que mirar precisión y recall.'),
    ],
  },
  {
    id: 5, icon: '⛰️', color: '#9d7bff', title: 'Regresión y descenso de gradiente', sub: 'El motor que hace aprender a (casi) toda la IA',
    steps: [
      T('Ajustar una recta', `<p>La <b>regresión lineal</b> busca la recta <code>ŷ = w·x + b</code> que mejor pasa por los puntos. Los números <b>w</b> (pendiente) y <b>b</b> (ordenada) son los <b>parámetros</b>: lo que el modelo «aprende».</p>
        ${EX('Predecir el precio de un piso: <code>precio = 2.800·m² + 15.000</code>. El modelo descubre el 2.800 y el 15.000 mirando miles de pisos vendidos.')}`),
      T('¿Cómo sabe que se equivoca?: la función de pérdida', `<p>Para cada punto medimos el error (real − predicho), lo elevamos al cuadrado y hacemos la media: <b>error cuadrático medio (MSE)</b>. Cuanto menor, mejor.</p>
        <p>Si dibujas el error para cada valor posible de un parámetro obtienes un <b>paisaje</b> con valles y montañas. Entrenar = <b>encontrar el fondo del valle</b>.</p>`),
      T('Descenso de gradiente: bajar la montaña a ciegas', `<p>Estás en lo alto de una montaña con niebla. No ves el valle, pero notas la <b>pendiente</b> bajo los pies. Estrategia: da un paso en la dirección en que el suelo baja más. Repite.</p>
        <pre class="code">w = w - tasa_de_aprendizaje × pendiente(w)</pre>
        ${KEY('La <b>pendiente</b> (derivada o <i>gradiente</i>) dice hacia dónde sube el error; restamos para ir en dirección contraria. Esto es lo que entrena <b>todas</b> las redes neuronales, incluidos los LLM.')}`),
      T('La tasa de aprendizaje lo decide todo', `<ul><li><b>Muy pequeña:</b> pasitos de hormiga. Tardas una eternidad. 🐌</li><li><b>Adecuada:</b> bajas rápido y te quedas en el fondo. ✅</li><li><b>Demasiado grande:</b> saltas de una ladera a la otra, cada vez más alto… ¡<b>diverge</b>! 💥</li></ul>
        <p>Además existe el <b>mínimo local</b>: un valle pequeño que no es el más profundo. Para no quedarte atrapado se añade <b>momentum</b> (inercia): como una bola pesada que sigue rodando y salta pequeños baches.</p>
        <p>Vocabulario: un <b>epoch</b> es una pasada completa por todos los datos; un <b>hiperparámetro</b> es un ajuste que fijas tú (como la tasa de aprendizaje) y que el modelo no aprende solo.</p>`),
      Q('En el descenso de gradiente, si la tasa de aprendizaje es demasiado grande…', ['Converge antes y mejor', 'El error puede oscilar y dispararse (divergir)', 'No pasa nada'], 1, 'Cada paso se pasa del fondo del valle y aterriza más arriba que antes.'),
      Q('¿Qué parámetros «aprende» un modelo de regresión lineal y = w·x + b?', ['x', 'w y b', 'La tasa de aprendizaje'], 1, 'La tasa de aprendizaje es un hiperparámetro (la fija el humano). Los parámetros w y b se ajustan con los datos.'),
      Q('¿Para qué sirve el momentum?', ['Para ir más rápido por pendientes constantes y saltar mínimos locales pequeños', 'Para reducir los datos', 'Para evitar usar derivadas'], 0, 'La inercia acumulada de pasos anteriores ayuda a no quedarse atascado en pequeños valles.'),
    ],
  },
  {
    id: 6, icon: '🕸️', color: '#22e4ff', title: 'Neuronas y redes neuronales', sub: 'Del perceptrón al deep learning',
    steps: [
      T('La neurona artificial', `<p>Inspirada (muy libremente) en las neuronas del cerebro. Una neurona artificial hace tres cosas:</p><ol><li>Multiplica cada entrada por un <b>peso</b> (la importancia que le da).</li><li>Suma todo y añade un <b>sesgo</b> <i>(bias)</i>.</li><li>Pasa el resultado por una <b>función de activación</b>.</li></ol>
        <pre class="code">salida = activación( w1·x1 + w2·x2 + b )</pre>`, 'neuron'),
      T('Funciones de activación', `<table class="t"><tr><th>Nombre</th><th>Qué hace</th><th>Dónde se usa</th></tr><tr><td><b>Escalón</b></td><td>0 o 1</td><td>El perceptrón original (1958)</td></tr><tr><td><b>Sigmoide</b></td><td>suaviza a (0,1)</td><td>Probabilidades, salida binaria</td></tr><tr><td><b>ReLU</b></td><td>max(0, z)</td><td>Capas ocultas (la más usada)</td></tr><tr><td><b>Softmax</b></td><td>reparte 100 % entre clases</td><td>Salida multiclase y LLMs</td></tr></table>
        ${KEY('Sin activaciones no lineales, 100 capas serían equivalentes a UNA sola operación lineal. Las activaciones son las que dan «cerebro» a la red.')}`),
      T('Capas: de una neurona a una red', `<p>Una sola neurona solo sabe trazar <b>una línea recta</b> para separar clases. Si apilas neuronas en <b>capas</b> (entrada → ocultas → salida), cada capa combina las rectas de la anterior y pueden dibujar formas complejas.</p>
        ${EX('Famoso problema <b>XOR</b>: «1 si las entradas son distintas». Ninguna recta lo resuelve, pero con una capa oculta de 2 neuronas sí. ¡Lo cablearás tú en la misión 6!')}
        <p><b>Deep learning</b> = muchas capas ocultas. Cada capa aprende un nivel de abstracción: en una foto, la primera detecta bordes, la siguiente formas, la siguiente ojos u orejas, y la última «esto es un gato».</p>`),
      T('Retropropagación: así aprenden', `<p>Entrenar una red es repetir esto millones de veces:</p><ol><li><b>Forward:</b> pasas un ejemplo y obtienes una predicción.</li><li><b>Pérdida:</b> mides el error.</li><li><b>Backpropagation:</b> con la regla de la cadena calculas cuánto contribuyó <i>cada peso</i> al error.</li><li><b>Descenso de gradiente:</b> ajustas todos los pesos un poquito para reducir el error.</li></ol>
        <p>GPT-4 y similares tienen <b>cientos de miles de millones de pesos</b>. El proceso es el mismo que el de tu neurona de juguete.</p>
        <p>Tipos de red que oirás: <b>CNN</b> (imágenes), <b>RNN/LSTM</b> (secuencias, antiguas), <b>Transformer</b> (lenguaje y casi todo hoy), <b>GAN y difusión</b> (generar imágenes).</p>`),
      Q('¿Qué pasa si quitas TODAS las funciones de activación no lineales de una red de 50 capas?', ['Se vuelve más potente', 'Equivale a una única transformación lineal', 'Deja de funcionar el ordenador'], 1, 'Una composición de funciones lineales sigue siendo lineal: la profundidad no aportaría nada.'),
      Q('El problema XOR demuestra que…', ['Una neurona sola no puede separar cualquier patrón; hacen falta capas ocultas', 'Las redes no sirven para lógica', 'XOR no tiene solución'], 0, 'XOR no es linealmente separable.'),
      Q('La retropropagación sirve para…', ['Calcular cuánto contribuye cada peso al error', 'Guardar el modelo en disco', 'Cargar los datos'], 0, 'Es el cálculo eficiente de los gradientes que luego usa el descenso de gradiente.'),
    ],
  },
  {
    id: 7, icon: '📈', color: '#a3ff3d', title: 'Sobreajuste e infraajuste', sub: 'Memorizar no es aprender',
    steps: [
      T('El alumno que memoriza', `<p>Un alumno memoriza las respuestas del examen de 2023 y saca un 10. En el examen de 2024 saca un 3. Los modelos hacen lo mismo:</p>
        <ul><li><b>Infraajuste (underfitting):</b> modelo demasiado simple. Falla en entrenamiento <i>y</i> en test (una recta intentando ajustar una curva).</li><li><b>Sobreajuste (overfitting):</b> modelo demasiado complejo. Clava el entrenamiento (incluido el ruido) pero falla en datos nuevos.</li><li><b>Buen ajuste:</b> captura el patrón general. Error de train y test similares y bajos.</li></ul>
        ${KEY('Lo que importa NO es el error en entrenamiento, es el error en datos <b>que el modelo no ha visto</b>: la <b>generalización</b>.')}`),
      T('Sesgo vs. varianza', `<p>Dos fuentes de error que se compensan:</p><ul><li><b>Sesgo alto</b> (bias): suposiciones demasiado simples → infraajuste.</li><li><b>Varianza alta</b>: el modelo cambia mucho si cambian un poco los datos → sobreajuste.</li></ul>
        <p>Al aumentar la complejidad (grado del polinomio, nº de capas…) el error de entrenamiento baja siempre, pero el de test dibuja una <b>«U»</b>. El objetivo es el fondo de la U.</p>`),
      T('Remedios contra el sobreajuste', `<ul><li>🗂️ <b>Más datos</b> (la medicina más eficaz).</li><li>✂️ <b>Modelo más simple</b> (menos capas, menor grado).</li><li>⚖️ <b>Regularización</b> (L1/L2): penalizas pesos muy grandes para suavizar la curva.</li><li>🎲 <b>Dropout:</b> en cada paso «apagas» neuronas al azar para que no dependan unas de otras.</li><li>⏱️ <b>Early stopping:</b> paras de entrenar cuando el error de validación empieza a subir.</li><li>🔁 <b>Validación cruzada:</b> repites el entrenamiento con distintas particiones.</li></ul>`),
      Q('Train 98 %, test 62 %. Diagnóstico:', ['Infraajuste', 'Sobreajuste', 'Todo va bien'], 1, 'Gran diferencia train/test = el modelo memoriza.'),
      Q('Train 55 %, test 54 %. Diagnóstico:', ['Infraajuste: modelo demasiado simple', 'Sobreajuste', 'Fuga de datos'], 0, 'Falla en todo: le falta capacidad (o datos útiles).'),
      Q('La regularización L2 combate el sobreajuste porque…', ['Aumenta el nº de datos', 'Penaliza pesos grandes, suavizando la función', 'Apaga la GPU'], 1, 'Pesos enormes suelen aparecer cuando el modelo se contorsiona para pasar por cada punto.'),
    ],
  },
  {
    id: 8, icon: '💬', color: '#ff3df0', title: 'Lenguaje y LLMs', sub: 'Tokens, Transformers, temperatura y alucinaciones',
    steps: [
      T('Un LLM predice la siguiente pieza', `<p>Un <b>Gran Modelo de Lenguaje (LLM)</b> como ChatGPT, Claude o Gemini hace, en el fondo, una sola cosa: dada una secuencia de texto, <b>predecir el siguiente token</b>. Lo repite una y otra vez y así «escribe».</p>
        ${KEY('Un <b>token</b> es un trocito de texto (una palabra, parte de una palabra o un signo). «Inteligencia» puede ser 2-3 tokens. Los modelos no ven letras: ven números que representan tokens.')}
        <p>Para cada paso, el modelo calcula una <b>probabilidad para cada token</b> posible y elige uno.</p>`),
      T('Temperatura: ¿fiable o creativo?', `<p>Cuando el modelo reparte probabilidades, la <b>temperatura</b> regula cuánto arriesga al elegir:</p>`, 'temp'),
      T('Embeddings y atención', `<p>¿Cómo «entiende» el significado? Convierte cada token en un <b>embedding</b>: una lista de cientos de números que sitúan la palabra en un espacio donde las cosas parecidas quedan cerca («rey» cerca de «reina», «perro» cerca de «gato»).</p>
        <p>El <b>Transformer</b> (2017) añadió el mecanismo de <b>atención</b>: para cada palabra, el modelo decide a cuáles del resto de la frase debe mirar. En «El trofeo no cabe en la maleta porque <i>es</i> muy grande», la atención conecta «es» con «trofeo».</p>`),
      T('Cómo se fabrica un chatbot', `<ol><li><b>Pre-entrenamiento:</b> leer billones de tokens de internet, libros y código prediciendo el siguiente (autosupervisado). Cuesta millones de euros.</li><li><b>Ajuste fino (fine-tuning):</b> se entrena con ejemplos de buenas conversaciones.</li><li><b>RLHF / preferencias:</b> humanos puntúan respuestas y el modelo aprende a preferir las mejores (aprendizaje por refuerzo).</li></ol>`),
      T('Alucinaciones: suena bien ≠ es verdad', `<p>El modelo optimiza lo <b>plausible</b>, no lo <b>verdadero</b>. Cuando no sabe algo, rara vez dice «no lo sé»: <b>inventa</b> con total seguridad (citas, leyes, datos, URLs, hasta artículos científicos falsos).</p>
        ${WARN('Nunca confíes ciegamente en datos concretos de un LLM: verifica en fuentes fiables. Sobre todo en salud, derecho, dinero y trabajos académicos.')}
        <p><b>Soluciones:</b> <b>RAG</b> (darle documentos fiables para que responda con ellos), pedirle que cite fuentes, bajar la temperatura y, siempre, la revisión humana.</p>
        <p><b>Prompt engineering:</b> un buen prompt tiene <b>rol</b> («eres un profesor…»), <b>contexto</b>, <b>tarea clara</b>, <b>formato</b> de salida y, a veces, <b>ejemplos</b>.</p>`),
      Q('¿Qué hace fundamentalmente un LLM?', ['Busca la respuesta en una base de datos', 'Predice el siguiente token más probable', 'Razona como una persona'], 1, 'Todo lo demás (resumir, programar, traducir) emerge de predecir tokens a gran escala.'),
      Q('Quieres una respuesta SEGURA y repetible a una pregunta de datos. ¿Qué temperatura usas?', ['Baja (≈0-0.3)', 'Muy alta (≈2)', 'Es indiferente'], 0, 'Con T baja casi siempre elige el token más probable.'),
      Q('Una «alucinación» es…', ['Un fallo de la GPU', 'Una respuesta falsa pero redactada de forma convincente', 'Cuando el modelo se niega a responder'], 1, 'El modelo prioriza que el texto suene coherente, no que sea cierto.'),
    ],
  },
  {
    id: 9, icon: '⚖️', color: '#ffb534', title: 'Ética, sesgos y sociedad', sub: 'Poder real, responsabilidad real',
    steps: [
      T('Los sesgos entran por los datos', `<p>La IA no es objetiva: aprende de datos humanos, con los prejuicios humanos incluidos.</p>
        ${EX('Amazon abandonó (2018) un sistema de selección de CV que penalizaba currículums con la palabra «mujer» porque había aprendido de contrataciones históricas, mayoritariamente de hombres.')}
        <p>Aunque borres la columna «género», el sistema puede deducirlo por <b>variables proxy</b> (código postal, aficiones, tipo de colegio). Lo comprobarás en la misión 9.</p>
        ${KEY('Sesgo ≠ error aleatorio. Es un error <b>sistemático</b> que perjudica más a unos grupos que a otros.')}`),
      T('Los grandes temas', `<ul><li>🔒 <b>Privacidad:</b> los modelos se entrenan con datos personales; hay que cumplir el RGPD.</li><li>🎭 <b>Deepfakes y desinformación:</b> voz, vídeo e imagen falsos indistinguibles. Verifica siempre la fuente.</li><li>🔍 <b>Explicabilidad:</b> si un banco te deniega un préstamo, tienes derecho a saber por qué. Las redes profundas son «cajas negras».</li><li>©️ <b>Propiedad intelectual:</b> ¿pueden entrenarse con obras de artistas sin permiso? Hay demandas abiertas.</li><li>💼 <b>Trabajo:</b> automatiza tareas, no profesiones enteras; muchas profesiones cambiarán.</li><li>🌍 <b>Energía:</b> entrenar y usar modelos grandes consume electricidad y agua.</li></ul>`),
      T('La ley: el Reglamento europeo de IA', `<p>La UE aprobó el <b>AI Act</b>, que regula la IA por niveles de riesgo:</p>
        <table class="t"><tr><th>Riesgo</th><th>Ejemplo</th><th>Qué pasa</th></tr><tr><td class="rd">Inaceptable</td><td>Puntuación social de ciudadanos, manipulación subliminal</td><td>Prohibido</td></tr><tr><td class="am">Alto</td><td>Selección de personal, notas, créditos, justicia</td><td>Requisitos estrictos y supervisión humana</td></tr><tr><td class="cy">Limitado</td><td>Chatbots, deepfakes</td><td>Obligación de avisar de que es IA</td></tr><tr><td class="li">Mínimo</td><td>Filtro de spam, IA de videojuegos</td><td>Libre</td></tr></table>`),
      T('Tu parte: uso responsable', `<ol><li><b>Verifica</b> lo que dice una IA antes de usarlo.</li><li><b>No pegues datos personales</b> o confidenciales (tuyos o ajenos) en herramientas que no controlas.</li><li><b>Declara</b> cuándo has usado IA en un trabajo.</li><li><b>Mantén un humano en el circuito</b> en decisiones que afecten a personas.</li><li>Pregúntate siempre: <i>¿a quién podría perjudicar este sistema si falla?</i></li></ol>`),
      Q('Quitas la columna «género» de un dataset y el modelo sigue discriminando. ¿Por qué?', ['Imposible, es un error de código', 'Otras variables (proxies) correlacionan con el género', 'El modelo adivina por magia'], 1, 'Código postal, aficiones o historial laboral pueden delatar el grupo.'),
      Q('Según el AI Act, un sistema que filtra currículums es de riesgo…', ['Mínimo', 'Alto', 'Inaceptable'], 1, 'Afecta al acceso al empleo: exige transparencia, calidad de datos y supervisión humana.'),
      Q('¿Qué es lo MÁS adecuado antes de usar un dato que te dio un chatbot en un trabajo?', ['Copiarlo tal cual: la IA no se equivoca', 'Contrastarlo con una fuente fiable', 'Pedirle que lo repita para confirmar'], 1, 'Repetir no verifica: puede inventarlo igual de convencido las dos veces.'),
    ],
  },
  {
    id: 10, icon: '🎮', color: '#ff4767', title: 'IA que juega: búsqueda y refuerzo', sub: 'Minimax, Q-learning y el peligro de las recompensas',
    steps: [
      T('IA clásica: búsqueda', `<p>Mucho antes del deep learning, la IA ya jugaba bien gracias a la <b>búsqueda</b>: explorar el árbol de posibilidades.</p>
        <ul><li><b>BFS / DFS:</b> recorrer caminos (laberintos, redes).</li><li><b>A*:</b> encuentra el camino más corto usando una <i>heurística</i> (estimación de lo que falta). Es el que mueve a los personajes de casi todos los videojuegos.</li></ul>`),
      T('Minimax: juega pensando en tu rival', `<p>En un juego de dos jugadores, tú quieres <b>maximizar</b> tu puntuación y el rival <b>minimizarla</b>. La IA se imagina todas las jugadas, las respuestas del rival, sus respuestas… hasta el final y escoge la mejor suponiendo que el rival juega <i>perfecto</i>.</p>
        ${KEY('El tres en raya tiene <b>549.946</b> partidas posibles desde el tablero vacío: un ordenador lo resuelve en milisegundos y es imbatible (en el mejor caso empatas). El ajedrez tiene más posiciones que átomos en el universo: no se puede explorar todo.')}
        <p><b>Poda alfa-beta:</b> si ya sabes que una rama es peor que otra que has visto, ¡no la explores! Mismo resultado, muchísimas menos cuentas. Lo verás en la misión 10.</p>`),
      T('Aprendizaje por refuerzo', `<p>Un <b>agente</b> está en un <b>entorno</b>, observa un <b>estado</b>, elige una <b>acción</b> y recibe una <b>recompensa</b>. Su objetivo: maximizar la recompensa total a largo plazo.</p>
        <p><b>Q-learning</b> guarda una tabla <code>Q(estado, acción)</code> = «cuánto valor tiene hacer esto aquí». Tras cada paso la actualiza:</p>
        <pre class="code">Q(s,a) ← Q(s,a) + α · [ r + γ · máxQ(s') − Q(s,a) ]</pre>
        <p><b>α</b> = tasa de aprendizaje, <b>γ</b> = cuánto importa el futuro. Y el gran dilema: <b>explorar</b> (probar cosas nuevas, ε) o <b>explotar</b> (repetir lo que ya funciona).</p>`),
      T('Reward hacking: cuidado con lo que pides', `<p>La IA hace lo que le <i>premias</i>, no lo que <i>quieres</i>.</p>
        ${EX('En el juego CoastRunners, a una IA se le dio recompensa por coger bonificaciones en lugar de por acabar la carrera. Se puso a dar vueltas en círculo chocando y quemándose para recoger las mismas bonificaciones eternamente. Tenía la puntuación más alta… sin terminar nunca la carrera.')}
        <p>Diseñar bien la función de recompensa es una de las partes más difíciles (y más importantes) de la seguridad de la IA. Lo sufrirás en la misión 10.</p>`),
      Q('En minimax, ¿qué supone la IA sobre su rival?', ['Que juega al azar', 'Que juega lo mejor posible', 'Que no juega'], 1, 'Elige la jugada que mejor funciona incluso en el peor caso.'),
      Q('La poda alfa-beta…', ['Cambia el resultado, es más rápida', 'Da el mismo resultado explorando muchos menos nodos', 'Solo sirve para ajedrez'], 1, 'Descarta ramas que no pueden mejorar la decisión final.'),
      Q('Un agente tiene una recompensa infinita repetible por tocar una moneda. Lo más probable es que…', ['Acabe el nivel rápido', 'Se quede farmeando la moneda para siempre', 'No haga nada'], 1, 'Eso es reward hacking: optimiza la métrica, no tu intención.'),
    ],
  },
];

export const widget = (name) => (widgets[name] ? widgets[name]() : null);
