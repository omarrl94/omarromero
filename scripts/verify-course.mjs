// Verifica el curso de Bitlandia en los 10 lenguajes:
//   · el código inicial de cada reto NO debe superarlo (tiene el bug)
//   · la solución SÍ debe superarlo, sin errores
//   · cada reto tiene lección, y los textos no hablan de la nave espacial del motor original
// Uso: npm run test:course   (--verbose para ver los fallos con detalle)
import { COURSE, LESSONS, lessonSteps } from '../src/rpg/course/index.js';
import { evaluate } from '../src/core/engine.js';
import { LANG_ORDER } from '../src/core/languages.js';

const verbose = process.argv.includes('--verbose');
let fails = 0;
let total = 0;
const OLD_WORLD = /\b(nave|naves|piloto|gravedad|gravity|sonda|empuje|combustible|lanzadera|Kepler|asteroide|torreta|hangar|reactor|motor|motores|sensor|planeta|mineral|minerales|callsign|dron|drones|galaxia|alien\w*)\b/i;

for (const ch of COURSE) {
  const row = [];
  for (const lang of LANG_ORDER) {
    total += 2;
    const s = evaluate(ch, ch.starter[lang], lang);
    const r = evaluate(ch, ch.solution[lang], lang);
    const okS = !s.passed;
    const okR = r.passed;
    if (!okS || !okR) {
      fails += (okS ? 0 : 1) + (okR ? 0 : 1);
      row.push(`${lang}${okS ? '' : ' (el inicial ya pasa)'}${okR ? '' : ` (solución falla: ${r.error ? r.error.message.split('\n')[0] : r.checks.filter((c) => !c.ok).map((c) => `${c.label} ${c.detail || ''}`).join('; ')})`}`);
      if (verbose && !okR) console.log(r.error ? r.error.trace : '', '\n', ch.solution[lang]);
    }
    const steps = lessonSteps(ch.id, lang);
    if (!steps.length || !LESSONS[ch.id].mission[lang]) { fails++; row.push(`${lang} (sin lección)`); }
    const pick = (x) => (typeof x === 'string' ? x : x ? x[lang] || x.default || '' : '');
    const texts = [ch.starter[lang], ch.solution[lang], pick(ch.story), pick(ch.objective), pick(ch.polyglot), ch.concept ? ch.concept.text : '', ...steps.map((st) => `${st.title} ${(st.textByLang && st.textByLang[lang]) || st.text} ${(st.code && st.code[lang]) || ''}`), LESSONS[ch.id].mission[lang]].join('\n');
    const old = OLD_WORLD.exec(texts);
    if (old) { fails++; row.push(`${lang} (texto del juego anterior: «${old[0]}»)`); }
  }
  console.log(`${row.length ? '✗' : '✓'} ${ch.id.padEnd(18)} ${row.join(' · ')}`);
}
console.log(`\n${COURSE.length} retos · ${total - fails}/${total} comprobaciones correctas`);
process.exit(fails ? 1 : 0);
