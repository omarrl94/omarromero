// Análisis estático políglota: estilo, jerarquías de clases (POO) y concurrencia.
import { stripComments } from './transpiler.js';

const lineOf = (src, idx) => src.slice(0, idx).split('\n').length;

// ───────────────────────── Estilo ─────────────────────────

const isSnake = (s) => /^[a-z_][a-z0-9_]*$/.test(s);
const isCamel = (s) => /^[a-z][a-zA-Z0-9]*$/.test(s);
const isPascal = (s) => /^[A-Z][a-zA-Z0-9]*$/.test(s);

/** Reglas de estilo idiomáticas de cada lenguaje (PEP 8, guías de Google/Kotlin/Swift). */
export function lintStyle(code, lang) {
  const warnings = [];
  const lines = code.split('\n');
  const clean = stripComments(code, lang).split('\n');
  const warn = (line, msg, rule) => { if (warnings.length < 30) warnings.push({ line, msg, rule }); };
  lines.forEach((raw, i) => {
    const L = i + 1;
    if (raw.length > 100) warn(L, `Línea de ${raw.length} caracteres: el máximo recomendado es 100.`, 'line-length');
    if (/\S[ \t]+$/.test(raw)) warn(L, 'Espacios en blanco al final de la línea.', 'trailing-space');
    if (/\t/.test(raw)) warn(L, 'Usa espacios en lugar de tabuladores.', 'tabs');
    const t = (clean[i] || '').trim();
    if (!t) return;
    let m;
    if (lang === 'python') {
      if ((m = /^def\s+(\w+)/.exec(t)) && !isSnake(m[1]) && !/^__\w+__$/.test(m[1])) warn(L, `PEP 8: la función «${m[1]}» debería ir en snake_case.`, 'naming');
      if ((m = /^([A-Za-z_]\w*)\s*(?::[^=]+)?=[^=]/.exec(t)) && !isSnake(m[1]) && !/^[A-Z][A-Z0-9_]*$/.test(m[1])) warn(L, `PEP 8: la variable «${m[1]}» debería ir en snake_case.`, 'naming');
      if ((m = /^class\s+(\w+)/.exec(t)) && !isPascal(m[1])) warn(L, `PEP 8: la clase «${m[1]}» debería ir en PascalCase.`, 'naming');
      if (/;\s*$/.test(t)) warn(L, 'Python no necesita «;» al final de la línea.', 'semicolon');
      if (/==\s*(True|False|None)\b/.test(t)) warn(L, 'Compara con «is None» o usa el booleano directamente.', 'compare-bool');
    } else {
      if (/\b(if|for|while|switch)\(/.test(t)) warn(L, 'Deja un espacio entre la palabra clave y el paréntesis.', 'keyword-space');
      if ((lang === 'kotlin' || lang === 'swift') && /;\s*$/.test(t)) warn(L, `${lang === 'swift' ? 'Swift' : 'Kotlin'} no necesita «;» al final.`, 'semicolon');
      const decl = lang === 'c' || lang === 'java'
        ? /^(?:final\s+|const\s+|static\s+)*(?:int|long|double|float|boolean|bool|char|String|short|byte)\s*\**\s*([A-Za-z_]\w*)\s*[=;[]/.exec(t)
        : /^(?:val|var|let)\s+([A-Za-z_]\w*)/.exec(t);
      if (decl && lang !== 'c' && !isCamel(decl[1]) && !/^[A-Z][A-Z0-9_]*$/.test(decl[1])) warn(L, `Convención: «${decl[1]}» debería ir en camelCase.`, 'naming');
      if ((m = /\b(?:class|struct|interface|protocol)\s+(\w+)/.exec(t)) && !isPascal(m[1])) warn(L, `El tipo «${m[1]}» debería ir en PascalCase.`, 'naming');
    }
  });
  return warnings;
}

// ───────────────────────── Bloques ─────────────────────────

function braceBody(src, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return { body: src.slice(openIdx + 1, i), start: openIdx, end: i };
    }
  }
  return { body: src.slice(openIdx + 1), start: openIdx, end: src.length };
}

function pyBlock(lines, headerIdx) {
  const indent = lines[headerIdx].length - lines[headerIdx].trimStart().length;
  const out = [];
  let j = headerIdx + 1;
  for (; j < lines.length; j++) {
    const l = lines[j];
    if (!l.trim()) { out.push(l); continue; }
    if (l.length - l.trimStart().length <= indent) break;
    out.push(l);
  }
  return { body: out.join('\n'), endLine: j };
}

/** Extrae el «movimiento» de un método update(): incrementos sobre x / y. */
export function motionOf(body) {
  const v = { vx: 0, vy: 0, chase: false };
  const re = /(?:self\.|this\.|->|\.)?\b(x|y)\s*(\+=|-=)\s*(-?\d+(?:\.\d+)?)/g;
  let m;
  while ((m = re.exec(body))) {
    const val = Number(m[3]) * (m[2] === '-=' ? -1 : 1);
    if (m[1] === 'x') v.vx += val;
    else v.vy += val;
  }
  if (/\b(x|y)\s*(\+\+|--)/.test(body)) {
    const mm = /\b(x|y)\s*(\+\+|--)/.exec(body);
    v[mm[1] === 'x' ? 'vx' : 'vy'] += mm[2] === '++' ? 1 : -1;
  }
  if (/target|player|objetivo/i.test(body)) v.chase = true;
  return v;
}

// ───────────────────────── Clases (POO) ─────────────────────────

/**
 * Detecta jerarquías de clases en los cinco lenguajes.
 * @returns {{ classes: Record<string, {name, parent, line, open, abstract, methods: Record<string, {line, override, body}>, fields: string[]}> , fnPointers: object }}
 */
export function analyzeClasses(code, lang) {
  const src = stripComments(code, lang);
  const classes = {};
  if (lang === 'python') {
    const lines = src.split('\n');
    lines.forEach((l, i) => {
      const m = /^class\s+(\w+)\s*(?:\(\s*(\w*)\s*\))?\s*:/.exec(l.trim());
      if (!m || l.length - l.trimStart().length > 0) return;
      const { body } = pyBlock(lines, i);
      const bl = body.split('\n');
      const methods = {};
      bl.forEach((b, k) => {
        const mm = /^\s+def\s+(\w+)\s*\(\s*self/.exec(b);
        if (mm) methods[mm[1]] = { line: i + 2 + k, override: false, body: pyBlock(bl, k).body, superCall: false };
      });
      Object.values(methods).forEach((md) => { md.superCall = /super\(\)/.test(md.body); });
      const fields = [...new Set([...body.matchAll(/self\.(\w+)\s*=/g)].map((x) => x[1]))];
      classes[m[1]] = { name: m[1], parent: m[2] && m[2] !== 'object' ? m[2] : null, line: i + 1, open: true, abstract: /ABC/.test(m[2] || ''), methods, fields };
    });
  } else if (lang === 'c') {
    const re = /(typedef\s+)?struct\s+(\w+)?\s*\{/g;
    let m;
    while ((m = re.exec(src))) {
      const { body, end } = braceBody(src, src.indexOf('{', m.index));
      const after = /^\s*(\w+)\s*;/.exec(src.slice(end + 1));
      const name = (after && after[1]) || m[2];
      if (!name) continue;
      const first = body.split(';').map((s) => s.trim()).filter(Boolean)[0] || '';
      const pm = /^(?:struct\s+)?(\w+)\s+(?:base|parent|super|entity)\b/.exec(first);
      const fnPtrs = [...body.matchAll(/\(\s*\*\s*(\w+)\s*\)\s*\(/g)].map((x) => x[1]);
      const fields = body.split(';').map((s) => (/(\w+)\s*(?:\[[^\]]*\])?\s*$/.exec(s.trim()) || [])[1]).filter(Boolean);
      classes[name] = { name, parent: pm ? pm[1] : null, line: lineOf(src, m.index), open: true, abstract: false, methods: {}, fields, fnPtrs };
    }
    // Funciones asignadas a punteros de función → «métodos» con polimorfismo.
    const assigns = [...src.matchAll(/(?:\.|->)(\w+)\s*=\s*&?(\w+)\s*[;,]/g)];
    const fnDefs = {};
    for (const fm of src.matchAll(/^\s*(?:static\s+)?void\s+(\w+)\s*\(\s*(?:struct\s+)?(\w+)\s*\*\s*\w+\s*\)\s*\{/gm)) {
      const { body } = braceBody(src, src.indexOf('{', fm.index));
      fnDefs[fm[1]] = { type: fm[2], body, line: lineOf(src, fm.index) };
    }
    for (const [, field, fn] of assigns) {
      const def = fnDefs[fn];
      if (!def) continue;
      const owner = Object.keys(classes).find((c) => fn.toLowerCase().startsWith(c.toLowerCase())) || def.type;
      if (!classes[owner]) continue;
      const isBase = !classes[owner].parent;
      classes[owner].methods[field] = { line: def.line, override: !isBase, body: def.body, fn };
    }
  } else {
    const headerRe = {
      java: /((?:(?:public|abstract|final|static)\s+)*)class\s+(\w+)(?:\s+extends\s+(\w+))?[^{\n]*(\{)?/g,
      kotlin: /((?:(?:open|abstract|data|sealed)\s+)*)class\s+(\w+)\s*(?:\([^)]*\))?\s*(?::\s*(\w+)\s*(?:\([^)]*\))?)?[^{\n]*(\{)?/g,
      swift: /((?:(?:final|open|public)\s+)*)class\s+(\w+)\s*(?::\s*(\w+))?[^{\n]*(\{)?/g,
    }[lang];
    let m;
    while ((m = headerRe.exec(src))) {
      const { body } = m[4] ? braceBody(src, m.index + m[0].length - 1) : { body: '' };
      const mods = m[1] || '';
      const startLine = lineOf(src, m.index);
      const methods = {};
      const mre = {
        java: /(@Override\s+)?(?:(?:public|protected|private|static|final|abstract)\s+)*(?:void|int|double|boolean|String|float|long)\s+(\w+)\s*\([^)]*\)\s*\{/g,
        kotlin: /((?:override|open|abstract)\s+)*fun\s+(\w+)\s*\([^)]*\)[^{]*\{/g,
        swift: /((?:override|final)\s+)*func\s+(\w+)\s*\([^)]*\)[^{]*\{/g,
      }[lang];
      let mm;
      while ((mm = mre.exec(body))) {
        const { body: mb } = braceBody(body, body.indexOf('{', mm.index + mm[0].length - 1));
        const modsM = mm[1] || '';
        methods[mm[2]] = {
          line: startLine + body.slice(0, mm.index).split('\n').length - 1,
          override: /override/i.test(modsM) || /@Override/.test(modsM),
          open: /open/.test(modsM),
          body: mb,
          superCall: /super\.\w+\(/.test(mb),
        };
      }
      const fieldRe = lang === 'java' ? /(?:protected|public|private)?\s*(?:double|int|float|String|boolean)\s+(\w+)\s*[;=]/g : /(?:val|var)\s+(\w+)/g;
      const fields = [...new Set([...body.matchAll(fieldRe)].map((x) => x[1]))];
      classes[m[2]] = { name: m[2], parent: m[3] || null, line: startLine, open: lang !== 'kotlin' || /open|abstract/.test(mods), abstract: /abstract/.test(mods), methods, fields, finalSwift: /final/.test(mods) };
    }
  }
  // Marca overrides implícitos (Python/Java sin @Override) comparando con el padre.
  for (const c of Object.values(classes)) {
    if (!c.parent || !classes[c.parent]) continue;
    for (const [name, md] of Object.entries(c.methods)) {
      if (classes[c.parent].methods[name] && (lang === 'python' || lang === 'java')) md.override = true;
    }
  }
  return { classes };
}

// ───────────────────────── Concurrencia ─────────────────────────

const SPAWN = {
  python: /asyncio\.create_task\(|asyncio\.gather\(|TaskGroup|threading\.Thread\(/,
  java: /new\s+Thread\(|\.submit\(|CompletableFuture\.(?:runAsync|supplyAsync)\(|\.execute\(/,
  kotlin: /\blaunch\s*(?:\([^)]*\))?\s*\{|\basync\s*(?:\([^)]*\))?\s*\{/,
  swift: /async\s+let\b|\.addTask\s*\{|\bTask\s*\{/,
  c: /pthread_create\(/,
};
const JOIN = {
  python: /\bawait\b|\.join\(/,
  java: /\.join\(\)|\.get\(\)|allOf\(|awaitTermination\(|invokeAll\(/,
  kotlin: /\.join\(\)|\.await\(\)|awaitAll\(|joinAll\(/,
  swift: /\bawait\b/,
  c: /pthread_join\(/,
};
const PROTECT = {
  python: /asyncio\.Lock|threading\.Lock|with\s+\w*lock/i,
  java: /AtomicInteger|AtomicLong|synchronized|ReentrantLock|\.incrementAndGet|\.addAndGet|LongAdder/,
  kotlin: /Mutex|withLock|AtomicInteger|\.incrementAndGet|\.addAndGet/,
  swift: /\bactor\b|NSLock|OSAllocatedUnfairLock/,
  c: /pthread_mutex_lock|atomic_/,
};

/**
 * Determina si el código lanza las tareas en paralelo (todas antes de esperar)
 * o en serie, y si hay estado compartido mutado sin protección dentro de las tareas.
 */
export function analyzeConcurrency(code, lang) {
  const src = stripComments(code, lang);
  const lines = src.split('\n');
  const spawns = [];
  const joins = [];
  const loops = []; // { id, from, to }
  const closures = []; // rangos de líneas dentro de una tarea lanzada
  // 1. Bucles (rango de líneas) por sangría (Python) o llaves (resto).
  const loopRe = lang === 'python' ? /^(for|while)\b/ : /^(for|while)\b|\brepeat\s*\(\s*\d+\s*\)\s*\{|\.forEach\s*\{|\.map\s*\{/;
  lines.forEach((l, i) => {
    const t = l.trim();
    if (!loopRe.test(t) && !(lang !== 'python' && /\.(forEach|map)\s*\{/.test(t))) return;
    loops.push({ id: loops.length + 1, from: i + 1, to: blockEnd(lines, i, lang) });
  });
  const loopOf = (line) => {
    const inside = loops.filter((lp) => line >= lp.from && line <= lp.to);
    return inside.length ? inside[inside.length - 1].id : 0;
  };
  lines.forEach((l, i) => {
    const t = l.trim();
    const L = i + 1;
    if (!t) return;
    if (SPAWN[lang].test(t)) {
      let count = 1;
      if (lang === 'python' && /gather\(/.test(t)) count = /gather\(\s*\*/.test(t) || /\bfor\b/.test(t) ? 3 : (t.match(/\w*scan\w*\(/g) || []).length || 1;
      if (loopOf(L) || /\.(map|forEach)\s*\{|repeat\s*\(/.test(t)) count = 3;
      spawns.push({ line: L, count, loop: loopOf(L), gather: /gather\(/.test(t) });
      if (/\{/.test(t)) closures.push({ from: L, to: blockEnd(lines, i, lang) });
    } else if (lang === 'java' && /\.start\(\)/.test(t)) {
      spawns.push({ line: L, count: 0, loop: loopOf(L), start: true });
    }
    const directAwait = /\bawait\s+\w*scan\w*\(/.test(t) && !/async\s+let|gather|addTask/.test(t);
    if (directAwait) joins.push({ line: L, direct: true, loop: loopOf(L) });
    else if (!SPAWN[lang].test(t) && JOIN[lang].test(t)) joins.push({ line: L, loop: loopOf(L) });
    else if (SPAWN[lang].test(t) && JOIN[lang].test(t) && lang !== 'python' && lang !== 'swift') joins.push({ line: L, loop: loopOf(L), sameLine: true });
  });
  const real = spawns.filter((x) => x.count > 0);
  const spawnCount = real.reduce((a, x) => a + x.count, 0);
  const firstSpawn = Math.min(...spawns.map((x) => x.line).concat([Infinity]));
  const lastSpawn = Math.max(0, ...spawns.map((x) => x.line));
  const blocking = joins.filter((j) => !j.direct && !j.sameLine);
  // Esperar entre lanzamientos (o dentro del mismo bucle que lanza) ⇒ ejecución en serie.
  const interleaved = blocking.some((j) => j.line > firstSpawn && j.line < lastSpawn)
    || blocking.some((j) => j.loop && spawns.some((x) => x.loop === j.loop));
  const direct = joins.filter((j) => j.direct);
  let concurrent = spawnCount >= 3 && !interleaved;
  if (!real.length && direct.length) concurrent = false;
  // Mutaciones de estado compartido dentro de una tarea lanzada.
  const mutRe = /\b(total|found|count|ores)\s*(\+=|\+\+|=\s*(total|found|count|ores)\s*\+)/;
  let sharedMutation = false;
  lines.forEach((l, i) => {
    if (!mutRe.test(l)) return;
    const L = i + 1;
    if (closures.some((c) => L >= c.from && L <= c.to)) sharedMutation = true;
  });
  if (lang === 'python' && !/threading/.test(src)) sharedMutation = false; // asyncio: un solo hilo
  const protectedMutation = PROTECT[lang].test(src);
  const tasks = Math.max(spawnCount, direct.reduce((a, d) => a + (d.loop ? 3 : 1), 0));
  return { spawns, joins, spawnCount, concurrent, interleaved, sharedMutation, protectedMutation, tasks, waits: joins.length > 0 };
}

function blockEnd(lines, i, lang) {
  if (lang === 'python') {
    const ind = lines[i].length - lines[i].trimStart().length;
    let j = i + 1;
    for (; j < lines.length; j++) {
      if (!lines[j].trim()) continue;
      if (lines[j].length - lines[j].trimStart().length <= ind) break;
    }
    return j;
  }
  let depth = 0;
  let opened = false;
  for (let j = i; j < lines.length; j++) {
    for (const ch of lines[j]) {
      if (ch === '{') { depth++; opened = true; }
      else if (ch === '}') depth--;
    }
    if (opened && depth <= 0) return j + 1;
    if (!opened && j > i) return i + 1;
  }
  return lines.length;
}

// ───────────────────────── Métricas ─────────────────────────

/** Profundidad máxima de bucles anidados (pista de complejidad para el pato). */
export function loopNesting(code, lang) {
  const src = stripComments(code, lang);
  const lines = src.split('\n');
  let max = 0;
  if (lang === 'python') {
    const stack = [];
    for (const l of lines) {
      if (!l.trim()) continue;
      const ind = l.length - l.trimStart().length;
      while (stack.length && ind <= stack[stack.length - 1]) stack.pop();
      if (/^\s*(for|while)\b/.test(l)) { stack.push(ind); max = Math.max(max, stack.length); }
    }
    return max;
  }
  let depth = 0;
  const stack = [];
  for (const l of lines) {
    const t = l.trim();
    const isLoop = /^(for|while)\b/.test(t) || /\}\s*while/.test(t) === false && /^do\b/.test(t);
    const opens = (t.match(/\{/g) || []).length;
    const closes = (t.match(/\}/g) || []).length;
    depth -= Math.min(closes, depth);
    while (stack.length && depth < stack[stack.length - 1]) stack.pop();
    if (isLoop) { stack.push(depth + 1); max = Math.max(max, stack.length); }
    depth += opens;
  }
  return max;
}

export function usesLoop(code, lang) {
  const src = stripComments(code, lang);
  return /\b(for|while|repeat)\b/.test(src);
}

export function usesConditional(code, lang) {
  const src = stripComments(code, lang);
  return /\b(if|when|switch|guard)\b|\?.*:/.test(src);
}
