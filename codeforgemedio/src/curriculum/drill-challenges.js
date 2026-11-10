// Convierte cada nivel de práctica (drills.js) en una misión completa para cada mundo.
import { DRILLS } from './drills.js';
import { generate, signature, fnName } from './levelgen.js';
import { check, entry } from './helpers.js';
import { LANGUAGES, LANG_ORDER, idiom } from '../core/languages.js';
import { stripComments } from '../core/transpiler.js';
import { usesLoop } from '../core/analyzer.js';

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function showValue(v, lang) {
  if (typeof v === 'boolean') return lang === 'python' ? (v ? 'True' : 'False') : String(v);
  if (Array.isArray(v)) return `[${v.map((x) => showValue(x, lang)).join(', ')}]`;
  if (v === undefined) return lang === 'python' ? 'None' : 'undefined';
  if (v === null) return lang === 'python' ? 'None' : 'null';
  return String(v);
}

const DUCK = {
  tests: [
    'Mira en el canvas el primer caso que falla: ¿qué resultado esperabas y cuál da tu función?',
    'Haz el cálculo a mano con ese caso, paso a paso. ¿En qué paso se separa tu código del cálculo a mano?',
    '¿Has escrito return con el resultado, o tu función todavía devuelve el valor de ejemplo?',
  ],
  loop: ['¿Qué estructura repite un bloque de código para cada elemento?'],
  recursion: ['¿En qué momento tu función se llama a sí misma? ¿Y cuál es el caso que responde sin volver a llamarse?'],
  nosort: ['¿Puedes ordenar moviendo tú los elementos, sin pedírselo a la librería?'],
};

/** Nombres compuestos de un nivel (función, parámetros y variables) que cambian de forma según el lenguaje. */
function compoundNames(spec) {
  const names = new Set();
  const visit = (stmts) => stmts.forEach((s) => {
    if (s.k === 'let' || s.k === 'for' || s.k === 'each') names.add(s.n);
    ['then', 'els', 'body'].forEach((k) => { if (s[k]) visit(s[k]); });
  });
  for (const f of [...spec.fns, ...(spec.teach.example ? [spec.teach.example] : [])]) {
    names.add(f.name);
    f.params.forEach(([n]) => names.add(n));
    visit(f.body);
  }
  return [...names].filter((n) => /[A-Z]/.test(n));
}

/** Escribe los identificadores de un texto como se ven en el código de ese lenguaje (por_km en Python). */
function localize(text, lang, names) {
  return names.reduce((t, n) => t.replace(new RegExp(`\\b${n}\\b`, 'g'), idiom(n, lang)), text);
}

function makeChallenge(spec) {
  const main = spec.fns[0];
  const names = compoundNames(spec);
  const objective = {};
  const hint = {};
  const starter = {};
  const solution = {};
  const polyglot = {};
  for (const lang of LANG_ORDER) {
    objective[lang] = localize(spec.objective, lang, names);
    hint[lang] = localize(spec.hint, lang, names);
    starter[lang] = generate(lang, spec.fns, { stub: true, todo: localize(spec.todo, lang, names) });
    solution[lang] = generate(lang, spec.fns);
    polyglot[lang] = `Firma en ${LANGUAGES[lang].name}: ${signature(lang, main)}. ${hint[lang]}`;
  }
  return {
    id: spec.id,
    title: spec.title,
    codename: spec.codename,
    xp: spec.xp,
    drill: true,
    mode: 'run',
    scene: spec.scene || 'tests',
    story: spec.story,
    objective,
    concept: { title: spec.teach.title, text: spec.teach.text },
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
            const t = ctx.track([...a], ti === 0 && !firstArr ? 'carga' : `arg${ti}-${k}`);
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
          first ? `${name}(${first.args.map((a) => showValue(a, lang)).join(', ')}) debería dar ${showValue(first.expected, lang)} y da ${showValue(first.got, lang)}` : ''), { help: hint[lang] }),
      ];
      const src = stripComments(code, lang);
      for (const req of spec.requires || []) {
        if (req === 'loop') checks.push(check('loop', 'Usa un bucle', usesLoop(code, lang)));
        if (req === 'recursion') {
          const calls = (src.match(new RegExp(`\\b${name}\\s*\\(`, 'g')) || []).length;
          checks.push(Object.assign(check('recursion', 'La función se llama a sí misma (recursión)', calls >= 2, calls >= 2 ? '' : `${name} no se llama a sí misma.`), { help: 'Dentro de la función, devuelve una llamada a la propia función con un problema más pequeño.' }));
        }
        if (req === 'nosort') {
          const builtin = /\.sort\(|sorted\(|Arrays\.sort|qsort\(|\bsort\(|\.sorted\b|sortWith/.test(src);
          checks.push(Object.assign(check('nosort', 'Ordena con tu propio algoritmo (sin sort)', !builtin), { help: 'No uses la ordenación de la librería: mueve tú los elementos con intercambios.' }));
        }
      }
      let scene;
      if (spec.scene === 'carga') {
        const events = result && result.state ? result.state.events.filter((e) => e.label === 'carga') : [];
        scene = { initial: spec.tests[0][0][0], events, final: results[0] ? results[0].got : [] };
      } else {
        scene = {
          fnName: name,
          cases: spec.tests.map(([args, expected], k) => {
            const r = results[k];
            return { input: args.map((a) => showValue(a, lang)).join(', '), expected: showValue(expected, lang), got: r ? showValue(r.got, lang) : '—', ok: !!r && eq(r.got, r.expected), ran: !!r };
          }),
        };
      }
      return { checks, scene };
    },
    duck: DUCK,
  };
}

export const DRILL_CHALLENGES = DRILLS.map(makeChallenge);

/** Lecciones «Aprende primero» de cada nivel de práctica, con el ejemplo en cada lenguaje. */
export const DRILL_LESSONS = Object.fromEntries(DRILLS.map((spec) => {
  const code = {};
  const mission = {};
  for (const lang of LANG_ORDER) {
    const names = compoundNames(spec);
    if (spec.teach.example) code[lang] = generate(lang, [spec.teach.example], { bare: true }).trim();
    mission[lang] = `La función ${signature(lang, spec.fns[0])} ya está montada, pero devuelve un valor de relleno. Cambia lo que hay dentro. ${localize(spec.hint, lang, names)}`;
  }
  return [spec.id, {
    steps: [{ title: spec.teach.title, text: spec.teach.text, visual: spec.teach.visual, code: spec.teach.example ? code : null }],
    mission,
  }];
}));
