// Verifica el currículo completo en los 5 lenguajes:
//   · el código inicial de cada misión NO debe superarla (tiene un bug didáctico)
//   · la solución de referencia SÍ debe superarla, sin errores
// Uso: npm test   (añade --verbose para ver checks y salida)
import { CHALLENGES } from '../src/curriculum/index.js';
import { evaluate } from '../src/core/engine.js';
import { LANG_ORDER } from '../src/core/languages.js';

const verbose = process.argv.includes('--verbose');
let failures = 0;
let total = 0;

for (const ch of CHALLENGES) {
  for (const lang of LANG_ORDER) {
    const starter = ch.starter[lang];
    const solution = ch.solution[lang];
    if (!starter || !solution) {
      console.log(`✗ ${ch.id} [${lang}] falta starter o solución`);
      failures++;
      continue;
    }
    total += 2;
    const s = evaluate(ch, starter, lang);
    const r = evaluate(ch, solution, lang);
    const okStarter = !s.passed;
    const okSolution = r.passed;
    const mark = okStarter && okSolution ? '✓' : '✗';
    const why = [];
    if (!okStarter) why.push('el starter ya supera la misión');
    if (!okSolution) {
      why.push(`solución falla: ${r.error ? r.error.message : r.checks.filter((c) => !c.ok).map((c) => `${c.label} (${c.detail})`).join('; ')}`);
    }
    const lint = r.lint.length ? ` · estilo: ${r.lint.map((w) => `L${w.line} ${w.rule}`).join(', ')}` : '';
    const starterInfo = s.error ? `starter → ${s.error.message.split('\n')[0]}` : `starter → ${s.checks.filter((c) => !c.ok).map((c) => c.id).join(', ')}`;
    console.log(`${mark} ${ch.id.padEnd(16)} [${lang.padEnd(6)}] ${starterInfo}${lint}${why.length ? `\n    ⚠ ${why.join(' | ')}` : ''}`);
    if (verbose) {
      console.log('    checks:', r.checks.map((c) => `${c.ok ? '✓' : '✗'} ${c.id}`).join(' '), r.output.length ? `\n    out: ${r.output.join(' / ')}` : '');
      if (s.error) console.log(s.error.trace.split('\n').map((l) => `    | ${l}`).join('\n'));
    }
    if (!(okStarter && okSolution)) failures += (okStarter ? 0 : 1) + (okSolution ? 0 : 1);
  }
}

console.log(`\n${total - failures}/${total} verificaciones correctas`);
process.exit(failures ? 1 : 0);
