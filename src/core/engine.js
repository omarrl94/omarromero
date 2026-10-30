// The Engine Loop: compila, ejecuta, valida y traduce el resultado en estado de escena.
import { runProgram, formatTrace } from './runtime.js';
import { syntaxCheck, ForgeSyntaxError, sourceFile } from './transpiler.js';
import { lintStyle } from './analyzer.js';
import { modeOf } from '../curriculum/index.js';

/**
 * Evalúa el código del usuario contra una misión.
 * @returns {{ passed, checks, scene, error, output, lint, stats }}
 */
export function evaluate(ch, code, lang) {
  const t0 = performance.now();
  const lint = lintStyle(code, lang);
  const mode = modeOf(ch, lang);
  let result = null;
  let error = null;
  if (mode === 'run') {
    result = runProgram({
      code,
      lang,
      api: ch.api,
      maxTicks: ch.maxTicks,
      invoke: ch.invoke ? (ctx) => ch.invoke(ctx, lang) : undefined,
    });
    error = result.error;
  } else {
    try {
      syntaxCheck(code, lang);
    } catch (e) {
      if (!(e instanceof ForgeSyntaxError)) throw e;
      error = { kind: 'syntax', code: 'syntax', message: e.message, line: e.line, col: e.col, hint: e.hint, frames: [{ fn: null, line: e.line }] };
      error.trace = `${sourceFile(lang)}:${e.line}:${e.col}: ${e.message}`;
    }
  }
  let ev;
  try {
    ev = ch.evaluate({ result, code, lang, error });
  } catch (e) {
    ev = { checks: [], scene: {} };
    if (!error) error = { kind: 'runtime', code: 'engine', message: String(e.message || e), line: null, frames: [], trace: formatTrace(lang, String(e.message || e), []) };
  }
  // Un error de compilación/ejecución bloquea la misión aunque algún check pase por casualidad.
  const checks = ev.checks;
  const passed = !error && checks.length > 0 && checks.every((c) => c.ok);
  return {
    passed,
    checks,
    scene: ev.scene || {},
    error,
    output: result ? result.output : [],
    lint,
    stats: {
      ms: performance.now() - t0,
      ticks: result ? result.ticks : 0,
      mode,
    },
  };
}
