// Misión 1 · ¿IA o no IA? Arcade de cartas con combo.
import { h, shuffle } from '../ui.js';
import { rng } from '../ml.js';

const ML = '🧠 Aprende de datos', RULE = '📏 Reglas a mano', NO = '🚫 No es IA';
const POOL = [
  ['Netflix te recomienda una serie según lo que han visto usuarios parecidos a ti', 0, 'Filtrado colaborativo: aprende patrones de millones de usuarios.'],
  ['El desbloqueo facial del móvil', 0, 'Una red neuronal aprendió a reconocer rostros a partir de ejemplos.'],
  ['Un filtro de spam que bloquea cualquier correo con la palabra «viagra»', 1, 'Una regla fija escrita a mano. No aprende.'],
  ['El traductor automático de Google', 0, 'Modelos neuronales entrenados con millones de textos traducidos.'],
  ['La calculadora del móvil', 2, 'Aritmética determinista: no hay nada que aprender ni decidir.'],
  ['Un termostato que enciende la calefacción por debajo de 19 °C', 1, 'Regla if/else. Muy útil, pero no aprende.'],
  ['Un coche que reconoce peatones en la cámara', 0, 'Visión por computador con redes neuronales entrenadas con imágenes.'],
  ['Una hoja de Excel que suma una columna', 2, 'Cálculo exacto: no es IA.'],
  ['Un NPC de videojuego que persigue al jugador siguiendo un camino con A*', 1, 'Búsqueda clásica: IA «de libro», no aprende de datos.'],
  ['ChatGPT respondiendo a tu pregunta', 0, 'Un LLM: red Transformer entrenada prediciendo texto.'],
  ['Un semáforo con temporizador fijo de 40 segundos', 2, 'Un simple reloj. Ni decide ni aprende.'],
  ['Spotify generando tu «Descubrimiento semanal»', 0, 'Aprende de tus escuchas y las de usuarios similares.'],
  ['Un sistema experto médico con 300 reglas «si fiebre y tos → posible gripe» escritas por doctores', 1, 'IA simbólica de los 80: reglas de expertos, sin aprendizaje.'],
  ['El corrector ortográfico que predice la siguiente palabra en tu teclado', 0, 'Modelo de lenguaje que aprende de texto.'],
  ['Buscar «Ana» en una lista ordenada con búsqueda binaria', 2, 'Algoritmo clásico, sin datos de entrenamiento.'],
  ['Un chatbot de banco con menú «pulsa 1 para saldo, 2 para tarjeta»', 1, 'Un árbol de decisión escrito a mano.'],
  ['Una cámara de tráfico que lee matrículas (OCR)', 0, 'Visión por computador con ML.'],
  ['El motor de ajedrez Deep Blue (1997), que evaluaba millones de jugadas con búsqueda', 1, 'Búsqueda + evaluación escrita a mano, no aprendizaje.'],
  ['Un generador de imágenes como Midjourney o DALL·E', 0, 'Modelos de difusión entrenados con millones de imágenes.'],
  ['Un lector de códigos de barras que decodifica las líneas', 2, 'Decodificación determinista de un estándar.'],
  ['Un banco que detecta un pago «raro» porque se parece poco a tu historial', 0, 'Detección de anomalías aprendida de tus datos.'],
  ['AlphaGo derrotando al campeón del mundo de Go', 0, 'Aprendizaje por refuerzo + redes neuronales + búsqueda.'],
  ['Un robot aspirador que repite un recorrido en zigzag programado', 1, 'Rutina fija escrita por ingenieros.'],
  ['Un cajero automático que valida tu PIN comparándolo con el guardado', 2, 'Comparación exacta. No es IA.'],
];
const LV = [
  { n: 8, lives: 3, three: [0, 1] },   // solo ML vs reglas (sin "no es IA")
  { n: 10, lives: 3, three: [0, 1, 2] },
  { n: 12, lives: 2, three: [0, 1, 2], timed: 7 },
];

export default {
  id: 1, title: 'IA o no IA', icon: '🃏', lesson: 1, color: '#22e4ff',
  blurb: 'Clasifica sistemas reales al vuelo: ¿aprende de datos, usa reglas o ni siquiera es IA?',
  levels: [{ name: 'Calentamiento', desc: 'Solo ML vs reglas' }, { name: 'Sin red', desc: 'Aparece «no es IA»' }, { name: 'Contrarreloj', desc: '7 s por carta · 2 vidas' }],
  mount(root, li, api) {
    const L = LV[li];
    const r = rng(100 + li * 7 + (Date.now() % 1000));
    const pool = shuffle(POOL.filter((p) => L.three.includes(p[1])), r).slice(0, L.n);
    let i = 0, errs = 0, combo = 0, lives = L.lives, timer = null, left = 0, locked = false;
    const stage = h('div'), info = h('div.row');
    root.append(h('div.goal', `Cada carta es un sistema real. Pulsa su categoría (o las teclas `, h('code', '1'), h('code', '2'), L.three.length > 2 ? h('code', '3') : '', `). ${L.timed ? `Tienes ${L.timed} s por carta. ` : ''}Pierdes una vida por fallo.`), info, stage);
    const cats = [[0, ML, 'cy'], [1, RULE, 'am'], [2, NO, 'rd']].filter((c) => L.three.includes(c[0]));
    const draw = () => {
      if (i >= pool.length) return finish();
      locked = false;
      const [txt] = pool[i];
      info.replaceChildren(h('span.chip', `Carta ${i + 1}/${pool.length}`), h('span.hearts', '❤️'.repeat(lives) + '🖤'.repeat(L.lives - lives)), h('span.chip', `Combo ×${combo}`));
      const tm = L.timed ? h('div.timer', h('i', { style: { width: '100%' } })) : '';
      stage.replaceChildren(tm, h('div.cardbig', txt), h('div.row', { style: { marginTop: '12px', justifyContent: 'center' } }, cats.map(([k, label], n) => h('button.btn' + (k === 1 ? '.m' : k === 2 ? '.g' : ''), { onclick: () => answer(k) }, `${n + 1}. ${label}`))), h('div#fb', { style: { minHeight: '60px', marginTop: '10px', textAlign: 'center' } }));
      if (L.timed) { left = L.timed * 4; clearInterval(timer); timer = setInterval(() => { left--; const b = stage.querySelector('.timer i'); if (b) b.style.width = (left / (L.timed * 4)) * 100 + '%'; if (left <= 0) { clearInterval(timer); answer(-1); } }, 250); }
    };
    function answer(k) {
      if (locked) return; locked = true; clearInterval(timer);
      const [, truth, why] = pool[i];
      const ok = k === truth;
      combo = ok ? combo + 1 : 0;
      if (!ok) { errs++; lives--; api.sfx('bad'); } else api.sfx('ok');
      stage.querySelector('#fb').replaceChildren(h('b', { class: ok ? 'li' : 'rd' }, ok ? '✔ ¡Correcto!' : (k < 0 ? '⏱ ¡Tiempo!' : '✘ Fallaste'), ' ', h('span.mut', `Era: ${[ML, RULE, NO][truth]}. `), why));
      if (lives <= 0) return setTimeout(() => api.lose('Te quedaste sin vidas. Repasa la diferencia entre «aprende de datos» y «reglas fijas».'), 1300);
      setTimeout(() => { i++; draw(); }, ok ? 1000 : 1700);
    }
    function finish() { api.win(errs === 0 ? 3 : errs <= 1 ? 2 : 1, `${pool.length - errs}/${pool.length} aciertos.`); }
    const key = (e) => { const k = +e.key - 1; if (!locked && cats[k]) answer(cats[k][0]); };
    addEventListener('keydown', key);
    draw();
    return () => { clearInterval(timer); removeEventListener('keydown', key); };
  },
};
