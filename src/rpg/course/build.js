// Convierte las descripciones de retos de funciones en retos jugables para los 10 lenguajes:
// código inicial (con el bug), solución, casos de prueba, comprobaciones y lección.
import { generate, signature, fnName } from '../../curriculum/levelgen.js';
import { check, entry } from '../../curriculum/helpers.js';
import { showValue } from '../../curriculum/drill-challenges.js';
import { LANGUAGES, LANG_ORDER } from '../../core/languages.js';
import { stripComments } from '../../core/transpiler.js';
import { usesLoop } from '../../core/analyzer.js';
import { fitComplexity } from '../../core/runtime.js';

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const comment = (lang, text) => `${lang === 'python' ? '#' : '//'} ${text}`;

/** Código de ejemplo de una lección en cada lenguaje. */
const exampleCode = (example) => (example ? Object.fromEntries(LANG_ORDER.map((l) => [l, generate(l, [example], { bare: true }).trim()])) : null);

export function lessonOf(spec) {
  const main = spec.fns ? spec.fns[0] : spec.fast;
  const mission = {};
  for (const lang of LANG_ORDER) mission[lang] = `Escribe la función ${signature(lang, main)}. ${spec.hint}`;
  return {
    steps: spec.lesson.map((st) => ({ title: st.title, text: st.text, visual: st.visual, code: exampleCode(st.example) })),
    mission,
  };
}

/** Comprobaciones extra: usar un bucle, usar recursión u ordenar sin sort(). */
function extraChecks(spec, code, lang, name) {
  const out = [];
  const src = stripComments(code, lang);
  for (const req of spec.requires || []) {
    if (req === 'loop') out.push(Object.assign(check('loop', 'Usa un bucle', usesLoop(code, lang)), { help: 'Recorre los datos con un bucle (for o while) en vez de escribir cada caso a mano.' }));
    if (req === 'recursion') {
      const calls = (src.match(new RegExp(`\\b${name}\\s*\\(`, 'g')) || []).length;
      out.push(Object.assign(check('recursion', 'La función se llama a sí misma (recursión)', calls >= 2, calls >= 2 ? '' : `${name} no se llama a sí misma.`), { help: 'Dentro de la función, devuelve una llamada a la propia función con un problema más pequeño.' }));
    }
    if (req === 'nosort') {
      const builtin = /\.sort\(|sorted\(|Arrays\.sort|qsort\(|\bsort\(|\.sorted\b|sortWith|Array\.Sort/.test(src);
      out.push(Object.assign(check('nosort', 'Ordena con tu propio algoritmo (sin sort)', !builtin), { help: 'No uses la ordenación de la librería: mueve tú los elementos con intercambios.' }));
    }
  }
  return out;
}

export function buildFunctionLevel(spec, chapter) {
  const main = spec.fns[0];
  const starter = {};
  const solution = {};
  const polyglot = {};
  for (const lang of LANG_ORDER) {
    starter[lang] = generate(lang, spec.fns, { stub: true, todo: spec.todo });
    solution[lang] = generate(lang, spec.fns);
    polyglot[lang] = `Firma en ${LANGUAGES[lang].name}: ${signature(lang, main)}. ${spec.hint}`;
  }
  return {
    id: spec.id,
    module: chapter,
    title: spec.title,
    xp: spec.xp,
    drill: true,
    mode: 'run',
    story: spec.story,
    objective: spec.objective,
    concept: { title: spec.lesson[0].title, text: spec.lesson[0].text },
    starter,
    solution,
    polyglot,
    tests: spec.tests,
    invoke(ctx) {
      const f = entry(ctx, main.name);
      return spec.tests.map(([args, expected], ti) => {
        const real = [];
        let firstArr = null;
        args.forEach((a, k) => {
          if (Array.isArray(a)) {
            const t = ctx.track([...a], `arg${ti}-${k}`);
            if (!firstArr) firstArr = t;
            real.push(t);
            if (ctx.lang === 'c') real.push(a.length);
          } else real.push(a);
        });
        let got = f(...real);
        if (main.ret === 'void') got = firstArr ? [...firstArr] : null;
        if (main.ret === 'bool') got = !!got;
        return { args, expected, got };
      });
    },
    evaluate({ result, code, lang }) {
      const results = (result && Array.isArray(result.value)) ? result.value : [];
      const fails = results.filter((r) => !eq(r.got, r.expected));
      const name = fnName(lang, main.name);
      const first = fails[0];
      const checks = [
        Object.assign(check('tests', `Pasa los ${spec.tests.length} casos de prueba`, results.length === spec.tests.length && fails.length === 0,
          first ? `${name}(${first.args.map((a) => showValue(a, lang)).join(', ')}) debería dar ${showValue(first.expected, lang)} y da ${showValue(first.got, lang)}` : ''), { help: spec.hint }),
        ...extraChecks(spec, code, lang, name),
      ];
      const scene = {
        fnName: name,
        cases: spec.tests.map(([args, expected], k) => {
          const r = results[k];
          return { input: args.map((a) => showValue(a, lang)).join(', '), expected: showValue(expected, lang), got: r ? showValue(r.got, lang) : '—', ok: !!r && eq(r.got, r.expected), ran: !!r };
        }),
      };
      return { checks, scene };
    },
  };
}

// ───────────────────────── Jefe final: medir la complejidad ─────────────────────────
const SIZES = [200, 400, 800, 1600];
const CASES = [
  { ids: [3, 1, 4, 1, 5], expect: true },
  { ids: [9, 8, 7, 6], expect: false },
  { ids: [], expect: false },
  { ids: [42, 42], expect: true },
  { ids: [5, 17, 3, 99, 21, 64, 3], expect: true },
];
/** Números de serie sin repetir (el peor caso para el detector), barajados de forma fija. */
const uniqueIds = (n) => {
  const a = Array.from({ length: n }, (_, i) => i * 3 + 1);
  let seed = n;
  for (let i = n - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = seed % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function buildBossLevel(spec, chapter) {
  const starter = {};
  const solution = {};
  const polyglot = {};
  for (const lang of LANG_ORDER) {
    starter[lang] = `${comment(lang, '⚠ Funciona, pero compara cada bug con todos los demás: O(n²). ¡Hazla O(n)!')}\n${generate(lang, [spec.slow])}`;
    solution[lang] = generate(lang, [spec.fast]);
    polyglot[lang] = `Firma en ${LANGUAGES[lang].name}: ${signature(lang, spec.fast)}. ${spec.hint}`;
  }
  return {
    id: spec.id,
    module: chapter,
    title: spec.title,
    xp: spec.xp,
    drill: false,
    boss: true,
    mode: 'run',
    maxTicks: 8e6,
    story: spec.story,
    objective: spec.objective,
    concept: { title: 'Notación Big O', text: spec.lesson[0].text },
    starter,
    solution,
    polyglot,
    invoke(ctx) {
      const f = entry(ctx, 'hayClones');
      const correctness = CASES.map((c) => {
        const arr = ctx.track([...c.ids], 'ids');
        return { ...c, got: !!f(arr, c.ids.length) };
      });
      const samples = [];
      for (const n of SIZES) {
        const ids = ctx.track(uniqueIds(n), 'ids');
        ctx.resetTicks();
        const got = f(ids, n);
        samples.push({ n, ops: Math.max(1, ctx.ticks()), got: !!got });
      }
      return { correctness, samples };
    },
    evaluate({ result }) {
      const val = (result && result.value) || { correctness: [], samples: [] };
      const correct = val.correctness.length > 0 && val.correctness.every((c) => c.got === c.expect) && val.samples.every((s) => s.got === false);
      const fit = fitComplexity(val.samples);
      const fast = ['o1', 'n', 'nlogn'].includes(fit.cls);
      const checks = [
        Object.assign(check('correct', 'Detecta los clones correctamente (5 casos + el peor caso)', correct,
          val.correctness.filter((c) => c.got !== c.expect).map((c) => `[${c.ids.join(', ')}] → ${c.got}`).join(' · ')), { help: 'Prueba a mano con [3, 1, 4, 1, 5]: ¿en qué momento debería darse cuenta del clon? Y con una lista vacía, ¿qué devuelves?' }),
        Object.assign(check('complexity', 'Complejidad O(n) u O(n log n)', correct && fast, val.samples.length ? `Medido: ${fit.label}. Operaciones: ${val.samples.map((s) => `${s.n} bugs → ${s.ops}`).join(', ')}` : ''), { help: 'Para cada bug, ¿de verdad hace falta compararlo con todos los demás? Apunta los números que ya has visto en un conjunto.' }),
      ];
      return { checks, scene: { samples: val.samples, fit, correct } };
    },
  };
}
