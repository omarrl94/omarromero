// JEFE FINAL · SKYNET-18: duelo de preguntas de todo el temario.
import { h, shuffle } from '../ui.js';

const QS = [
  ['¿Qué es un dataset de entrenamiento?', ['El conjunto de ejemplos con el que aprende el modelo', 'El código del modelo', 'La GPU'], 0, 'Son los datos con los que se ajustan los parámetros.'],
  ['Predecir la temperatura de mañana en °C es…', ['Clasificación', 'Regresión', 'Clustering'], 1, 'La salida es un número continuo.'],
  ['Agrupar canciones por parecido sin etiquetas previas es…', ['Aprendizaje supervisado', 'No supervisado', 'Por refuerzo'], 1, 'No hay etiquetas: clustering.'],
  ['En k-NN, con k=1 y datos ruidosos suele ocurrir…', ['Infraajuste', 'Sobreajuste', 'Nada'], 1, 'Copia al vecino más cercano, ruido incluido.'],
  ['Una tasa de aprendizaje demasiado alta provoca…', ['Divergencia o rebotes', 'Convergencia segura', 'Menos datos'], 0, 'Los pasos se pasan del mínimo.'],
  ['¿Qué función de activación es la más usada en capas ocultas?', ['ReLU', 'Escalón', 'Logaritmo'], 0, 'ReLU(z) = max(0, z): simple y eficaz.'],
  ['¿Qué calcula la retropropagación?', ['La contribución de cada peso al error', 'El tamaño del dataset', 'La temperatura'], 0, 'Los gradientes de la pérdida respecto a cada peso.'],
  ['Train 99 %, test 58 %. Es…', ['Sobreajuste', 'Infraajuste', 'Perfecto'], 0, 'Memorizó el entrenamiento.'],
  ['¿Qué es un token en un LLM?', ['Un trozo de texto (palabra o parte)', 'Una contraseña', 'Un tipo de GPU'], 0, 'Los LLM trabajan con tokens, no letras.'],
  ['Temperatura ALTA en un LLM implica…', ['Respuestas más variadas y arriesgadas', 'Respuestas siempre idénticas', 'Más rapidez'], 0, 'Reparte la probabilidad entre más tokens.'],
  ['Una alucinación de un LLM es…', ['Un dato inventado dicho con seguridad', 'Un error de red', 'Un modelo apagado'], 0, 'Plausible no es lo mismo que verdadero.'],
  ['¿Para qué sirve RAG?', ['Darle al modelo documentos fiables para responder', 'Comprimir imágenes', 'Entrenar desde cero'], 0, 'Recupera información externa y la usa como contexto.'],
  ['Quitar la columna «género» no elimina el sesgo si…', ['Hay variables proxy como el código postal', 'El dataset es pequeño', 'Usas Python'], 0, 'Otras variables pueden delatar el grupo.'],
  ['Según el AI Act, la IA que puntúa socialmente a los ciudadanos es…', ['De riesgo inaceptable (prohibida)', 'De riesgo mínimo', 'Obligatoriamente pública'], 0, 'Está entre las prácticas prohibidas.'],
  ['Minimax asume que el rival…', ['Juega lo mejor posible', 'Juega al azar', 'No existe'], 0, 'Elige la jugada con mejor peor-caso.'],
  ['La poda alfa-beta…', ['Ahorra evaluar ramas sin cambiar el resultado', 'Cambia el resultado final', 'Solo vale para damas'], 0, 'Descarta ramas irrelevantes.'],
  ['En refuerzo, ¿qué es la recompensa?', ['La señal numérica que indica lo bien que va el agente', 'El dataset', 'El número de capas'], 0, 'Es el único «profesor» del agente.'],
  ['Un agente que farmea una moneda infinita en vez de acabar el nivel muestra…', ['Reward hacking', 'Sobreajuste', 'Overclocking'], 0, 'Optimiza la métrica, no la intención.'],
  ['Una fuga de datos (data leakage) es…', ['Que una feature contenga la respuesta o información del futuro', 'Perder el dataset', 'Un fallo de red'], 0, 'El modelo hace trampa y falla en producción.'],
  ['Un detector de enfermedades graves debe priorizar…', ['Recall (no dejar escapar enfermos)', 'Que sea bonito', 'Velocidad'], 0, 'Un falso negativo es más grave que uno positivo.'],
  ['Una regularización L2…', ['Penaliza pesos grandes', 'Duplica los datos', 'Añade capas'], 0, 'Suaviza el modelo para evitar sobreajuste.'],
  ['¿Qué mecanismo introdujo el Transformer?', ['Atención', 'Escalón', 'Votación k-NN'], 0, 'La atención decide a qué partes del texto mirar.'],
  ['k-means es sensible a…', ['La posición inicial de los centros', 'El color de los puntos', 'Nada'], 0, 'Distintas semillas pueden dar agrupaciones distintas.'],
  ['IA general (AGI) hoy es…', ['Un objetivo de investigación, aún no existe', 'Lo que usa tu móvil', 'Algo ya comercial'], 0, 'Toda la IA actual es «estrecha».'],
];

export default {
  id: 11, title: 'SKYNET-18', icon: '☠️', lesson: 0, color: '#ff4767', boss: true,
  blurb: 'La IA rebelde ataca. Solo tu dominio de todo el temario puede apagarla. 12 preguntas · 3 vidas · 25 s cada una.',
  levels: [{ name: 'El combate final', desc: '12 rondas' }],
  mount(root, li, api) {
    const qs = shuffle(QS).slice(0, 12).map((q) => { const idx = shuffle([0, 1, 2]); return { q: q[0], opts: idx.map((i) => q[1][i]), a: idx.indexOf(q[2]), why: q[3] }; });
    let i = 0, lives = 3, hp = 100, left = 100, timer = null, locked = false;
    const head = h('div'), stage = h('div');
    root.append(head, stage);
    const bar = () => head.replaceChildren(h('div.row', h('span.chip', `Ronda ${Math.min(i + 1, 12)}/12`), h('span.hearts', '❤️'.repeat(lives) + '🖤'.repeat(3 - lives)), h('span.grow', ''), h('b.rd', '☠ SKYNET-18')), h('div.hpbar', h('i', { style: { width: hp + '%' } })));
    function show() {
      if (hp <= 0 || i >= qs.length) return api.win(lives, `Apagaste a SKYNET-18 con ${lives} vida(s) restante(s).`);
      locked = false; bar(); left = 100;
      const q = qs[i];
      stage.replaceChildren(h('div.timer', h('i', { style: { width: '100%' } })), h('div.cardbig', q.q), ...q.opts.map((o, k) => h('button.quiz.opt', { style: { display: 'block', width: '100%', textAlign: 'left', margin: '8px 0', background: 'var(--p3)', border: '1px solid var(--p5)', borderRadius: '12px', padding: '11px 14px', cursor: 'pointer' }, onclick: (e) => answer(k, e.currentTarget) }, o)), h('div#fb'));
      clearInterval(timer); timer = setInterval(() => { left -= 0.4; const t = stage.querySelector('.timer i'); if (t) t.style.width = left + '%'; if (left <= 0) answer(-1); }, 100);
    }
    function answer(k, btn) {
      if (locked) return; locked = true; clearInterval(timer);
      const q = qs[i], ok = k === q.a;
      stage.querySelectorAll('button.opt').forEach((b, n) => { b.disabled = true; b.style.borderColor = n === q.a ? 'var(--lime)' : b === btn ? 'var(--red)' : 'var(--p5)'; });
      if (ok) { hp = Math.max(0, hp - 100 / 12 - 0.1); api.sfx('ok'); } else { lives--; api.sfx('bad'); }
      bar();
      stage.querySelector('#fb').replaceChildren(h('p', h('b', { class: ok ? 'li' : 'rd' }, ok ? '⚡ ¡Impacto!' : (k < 0 ? '⏱ ¡Tiempo!' : '💥 SKYNET te golpea.')), ' ', q.why));
      if (lives <= 0) return setTimeout(() => api.lose('SKYNET-18 gana esta vez. Repasa las lecciones y vuelve a por ella.'), 1700);
      setTimeout(() => { i++; show(); }, ok ? 1100 : 2000);
    }
    show();
    return () => clearInterval(timer);
  },
};
