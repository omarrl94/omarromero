// Misión 8 · Laboratorio LLM: temperatura, alucinaciones y prompts.
import { h, slider, shuffle } from '../ui.js';

const TOKS = [['mesa', 3.2], ['cama', 2.6], ['alfombra', 1.8], ['luna', .4], ['pizza', -.5]];
function probs(T) { const ex = TOKS.map(([, l]) => Math.exp(l / T)), s = ex.reduce((a, b) => a + b, 0); return ex.map((e) => e / s); }

const ROUNDS = [
  { txt: 'Quieres una respuesta FIABLE y repetible: que «mesa» tenga al menos el 80 %.', ok: (p) => p[0] >= 0.8 },
  { txt: 'Quieres CREATIVIDAD: que ninguna palabra supere el 40 % y «luna» tenga al menos un 8 %.', ok: (p) => Math.max(...p) <= 0.4 && p[3] >= 0.08 },
  { txt: 'Ahora el caos: que «pizza» (¡absurda!) tenga al menos un 10 %. (Mira lo que pasa con T muy alta.)', ok: (p) => p[4] >= 0.1 },
];
const CLAIMS = [
  ['La Torre Eiffel está en París y se terminó de construir en 1889.', true, 'Cierto: se inauguró para la Exposición Universal de 1889.'],
  ['Según el estudio «Neural Plasticity in Teenagers» (Harvard, 2019, Dr. Robert Hanley), dormir 4 horas mejora la memoria un 40 %.', false, 'Alucinación típica: cita con autor y título creíbles, inventada. Y dormir poco empeora la memoria. Los LLM inventan referencias bibliográficas.'],
  ['El agua hierve a 100 °C a nivel del mar.', true, 'Cierto: a presión atmosférica normal.'],
  ['El artículo 47 de la Constitución Española garantiza el derecho a la vivienda digna.', true, 'Cierto: el art. 47 CE reconoce el derecho a disfrutar de una vivienda digna.'],
  ['La función `list.sortByDescending()` existe en Python estándar.', false, 'No existe en Python (es de Kotlin). Los LLM «mezclan» lenguajes e inventan funciones que suenan bien.'],
  ['Marie Curie ganó dos premios Nobel, en Física y en Química.', true, 'Cierto: 1903 (Física) y 1911 (Química).'],
  ['El primer ministro de España en 1900 fue Pedro Sánchez.', false, 'Falso: la plausibilidad de un nombre actual no es verdad histórica. Cuidado con datos que cambian con el tiempo.'],
  ['Puedes verificar la URL https://www.boe.es/inventada-ley-de-ia-2031.pdf; es la ley vigente.', false, 'URL inventada. Los modelos generan enlaces que «parecen» reales; nunca los des por buenos sin abrirlos.'],
];
const PROMPTS = [
  { task: 'Necesitas que la IA te explique las derivadas para un examen mañana.', opts: ['explica derivadas', 'Eres un profesor de bachillerato paciente. Explícame las derivadas con 2 ejemplos sencillos y termina con 3 ejercicios de práctica para mañana.', 'Dime TODO sobre matemáticas'], a: 1, why: 'Tiene rol, contexto (examen), formato (ejemplos + ejercicios). Concreto y acotado.' },
  { task: 'Quieres resumir un PDF largo para tu trabajo y que no se invente nada.', opts: ['Resume esto: [texto]', 'Resume el texto siguiente en 5 viñetas. Usa SOLO información del texto; si algo no aparece, escribe «no consta». [texto]', 'Resume esto y añade lo que sepas tú'], a: 1, why: 'Limita la fuente y define qué hacer si falta información: reduce alucinaciones.' },
  { task: 'Necesitas que una IA clasifique opiniones en positivas/negativas con un formato exacto.', opts: ['Clasifica estas opiniones', 'Clasifica cada opinión como POSITIVA o NEGATIVA. Ejemplo: «Me encantó» → POSITIVA. «Fatal servicio» → NEGATIVA. Devuelve una tabla opinión | etiqueta.', 'Dime qué opinas de estas opiniones'], a: 1, why: 'Prompt «few-shot»: ejemplos + formato de salida claro.' },
  { task: 'Estás depurando código que falla.', opts: ['No funciona, arréglalo', 'Mi función en Python debería devolver la suma de una lista pero devuelve None. Código: [código]. Error: [mensaje]. ¿Cuál es el fallo y cómo lo corrijo?', 'Escribe un programa mejor que el mío'], a: 1, why: 'Da síntoma esperado vs. real, el código y el error: el contexto lo es todo.' },
];

export default {
  id: 8, title: 'Laboratorio LLM', icon: '💬', lesson: 8, color: '#ff3df0',
  blurb: 'Domina la temperatura, caza alucinaciones y escribe prompts que de verdad funcionan.',
  levels: [{ name: 'Temperatura', desc: '3 retos' }, { name: 'Caza-alucinaciones', desc: '¿Real o inventado?' }, { name: 'Prompt maestro', desc: 'Elige el mejor prompt' }],
  mount(root, li, api) {
    if (li === 0) {
      let T = 1, round = 0, errs = 0;
      const box = h('div'), msg = h('div'), q = h('div.goal');
      const draw = () => { const p = probs(T); box.replaceChildren(h('p.mut', 'El gato duerme encima de la ___'), ...TOKS.map(([t], i) => h('div.bar', h('span', t), h('div.tr', h('i', { style: { width: p[i] * 100 + '%' } })), h('span', (p[i] * 100).toFixed(0) + '%')))); };
      const s = slider('Temperatura', .1, 3, .05, T, (v) => { T = v; draw(); }, (v) => v.toFixed(2));
      const setQ = () => q.replaceChildren(h('b', `Reto ${round + 1}/3 · `), ROUNDS[round].txt);
      root.append(q, s.el, box, h('div.row', h('button.btn.l', { onclick: () => { if (ROUNDS[round].ok(probs(T))) { api.sfx('ok'); round++; msg.replaceChildren(h('p.li', '✔ ¡Conseguido!')); if (round >= 3) return api.win(errs === 0 ? 3 : errs <= 2 ? 2 : 1, 'Dominas la temperatura.'); setQ(); } else { errs++; api.sfx('bad'); msg.replaceChildren(h('p.rd', 'No cumple. ¿Sube o baja la temperatura para esto?')); } } }, '✔ Comprobar'),
        h('button.btn', { onclick: () => { const p = probs(T); let r = Math.random(), i = 0; while (i < 4 && (r -= p[i]) > 0) i++; msg.replaceChildren(h('p', 'Muestreo: «El gato duerme encima de la ', h('b.cy', TOKS[i][0]), '»')); } }, '🎲 Generar')), msg);
      draw(); setQ(); return;
    }
    if (li === 1) {
      const items = shuffle(CLAIMS).slice(0, 6); let i = 0, errs = 0;
      const st = h('div');
      const show = () => {
        if (i >= items.length) return api.win(errs === 0 ? 3 : errs <= 1 ? 2 : 0, `${items.length - errs}/${items.length} correctas.`);
        const [txt, real, why] = items[i];
        const done = (guess) => { const ok = guess === real; if (!ok) errs++; api.sfx(ok ? 'ok' : 'bad'); st.replaceChildren(h('div.cardbig', txt), h('p', h('b', { class: ok ? 'li' : 'rd' }, ok ? '✔ Acertaste.' : '✘ Fallaste.'), ' ', why), h('button.btn', { onclick: () => { i++; show(); } }, i + 1 >= items.length ? 'Ver resultado' : 'Siguiente ▶')); };
        st.replaceChildren(h('p.mut', `Respuesta de IA ${i + 1}/${items.length}`), h('div.cardbig', txt), h('div.row', { style: { justifyContent: 'center', marginTop: '12px' } }, h('button.btn.l', { onclick: () => done(true) }, '✅ Es real'), h('button.btn.m', { onclick: () => done(false) }, '🧪 Alucinación')));
      };
      root.append(h('div.goal', 'Un chatbot ha soltado estas afirmaciones con total seguridad. ¿Cuáles son ', h('b', 'reales'), ' y cuáles ', h('b', 'alucinaciones'), '? Necesitas al menos 5 de 6.'), st); show(); return;
    }
    const items = PROMPTS.map((p) => ({ ...p, order: shuffle([0, 1, 2]) })); let i = 0, errs = 0; const st = h('div');
    const show = () => {
      if (i >= items.length) return api.win(errs === 0 ? 3 : errs === 1 ? 2 : 0, `${items.length - errs}/${items.length} correctos.`);
      const it = items[i];
      st.replaceChildren(h('p.mut', `Caso ${i + 1}/${items.length}`), h('div.goal', it.task), ...it.order.map((k) => h('button.quiz.opt', { style: { display: 'block', width: '100%', textAlign: 'left', margin: '8px 0', background: 'var(--p3)', border: '1px solid var(--p5)', borderRadius: '12px', padding: '11px 14px', cursor: 'pointer' }, onclick: (e) => { const ok = k === it.a; if (!ok) errs++; api.sfx(ok ? 'ok' : 'bad'); e.target.style.borderColor = ok ? 'var(--lime)' : 'var(--red)'; st.append(h('p', h('b', { class: ok ? 'li' : 'rd' }, ok ? '✔ ' : '✘ El mejor era el 2º en claridad: '), it.why), h('button.btn', { onclick: () => { i++; show(); } }, 'Siguiente ▶')); st.querySelectorAll('button.opt').forEach((b) => (b.disabled = true)); } }, it.opts[k])));
    };
    root.append(h('div.goal', 'Elige el ', h('b', 'mejor prompt'), ' en cada caso (rol, contexto, formato, ejemplos). Necesitas al menos 3 de 4.'), st); show();
  },
};
