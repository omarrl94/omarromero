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
    vars: result ? snapshotVars(result.vars) : [],
    lint,
    stats: {
      ms: performance.now() - t0,
      ticks: result ? result.ticks : 0,
      mode,
    },
  };
}

/** Copia segura de las variables declaradas (para el inspector visual). */
function snapshotVars(vars) {
  const show = (v, depth = 0) => {
    try {
      if (v === null || v === undefined) return 'null';
      if (typeof v === 'string') return `"${v}"`;
      if (typeof v !== 'object') return String(v);
      if (v.__block) return `0x${v.__block.addr.toString(16)}`;
      if (depth > 0) return '…';
      if (Array.isArray(v)) return `[${v.slice(0, 8).map((x) => show(x, 1)).join(', ')}${v.length > 8 ? ', …' : ''}]`;
      if (v instanceof Set) return `{${[...v].slice(0, 8).map((x) => show(x, 1)).join(', ')}}`;
      return `{${Object.entries(v).slice(0, 6).map(([k, x]) => `${k}: ${show(x, 1)}`).join(', ')}}`;
    } catch {
      return '¿?';
    }
  };
  return Object.values(vars || {}).slice(0, 24).map((r) => ({
    name: r.name,
    type: r.type || '?',
    kind: r.kind,
    value: r.display || show(r.value),
    raw: typeof r.value === 'number' ? r.value : null,
    flags: r.flags || [],
    line: r.line,
  }));
}
