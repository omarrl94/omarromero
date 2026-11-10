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
    // Los espacios invisibles al final de una línea no cuentan: el editor los limpia al pulsar Enter.
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
    } else if (lang === 'go') {
      if ((m = /^(\w+)\s*:=/.exec(t) || /^var\s+(\w+)/.exec(t)) && !isCamel(m[1]) && m[1] !== '_') warn(L, `Go: «${m[1]}» debería ir en camelCase (sin guiones bajos).`, 'naming');
      if (/^(?:\}\s*else\s+)?(if|for)\s*\(.*\)\s*\{$/.test(t)) warn(L, 'gofmt quita los paréntesis de la condición: escríbela sin ellos.', 'parens');
      if (/;\s*$/.test(t)) warn(L, 'Go no necesita «;» al final de la línea.', 'semicolon');
    } else if (lang === 'js') {
      if ((m = /^(?:const|let|var)\s+(\w+)/.exec(t)) && !isCamel(m[1]) && !/^[A-Z][A-Z0-9_]*$/.test(m[1])) warn(L, `JavaScript: «${m[1]}» debería ir en camelCase.`, 'naming');
      if (/^var\s/.test(t)) warn(L, 'Usa let o const en lugar de var (var ignora los bloques).', 'no-var');
      if (/[^=!]==[^=]/.test(t) || /!=[^=]/.test(t)) warn(L, 'Usa === y !== : == convierte tipos por sorpresa ("1" == 1 es true).', 'eqeqeq');
      if ((m = /^class\s+(\w+)/.exec(t)) && !isPascal(m[1])) warn(L, `La clase «${m[1]}» debería ir en PascalCase.`, 'naming');
    } else if (lang === 'csharp') {
      // Convenciones de .NET: métodos y tipos en PascalCase, variables locales en camelCase.
      if ((m = /^(?:(?:public|private|protected|internal|static|virtual|override|abstract|async|sealed)\s+)+[\w<>[\],\s]*?\s(\w+)\s*\(/.exec(t)) && !/^(if|for|foreach|while|switch|catch|using|lock|return|new)$/.test(m[1]) && !isPascal(m[1])) warn(L, `C#: el método «${m[1]}» debería ir en PascalCase (${m[1][0].toUpperCase()}${m[1].slice(1)}).`, 'naming');
      if ((m = /^(?:const\s+)?(?:int|long|double|float|decimal|bool|char|string|var|byte|short|object|List<[^>]*>|Dictionary<[^>]*>|HashSet<[^>]*>|int\[\]|string\[\]|double\[\])\s+([A-Za-z_]\w*)\s*[=;]/.exec(t)) && !/^const/.test(t) && !isCamel(m[1])) warn(L, `C#: la variable «${m[1]}» debería ir en camelCase.`, 'naming');
      if ((m = /\b(?:class|struct|interface|enum|record)\s+(\w+)/.exec(t)) && !isPascal(m[1])) warn(L, `C#: el tipo «${m[1]}» debería ir en PascalCase.`, 'naming');
      if (/\b(if|for|foreach|while|switch)\(/.test(t)) warn(L, 'Deja un espacio entre la palabra clave y el paréntesis.', 'keyword-space');
    } else if (lang === 'rust') {
      if ((m = /^(?:pub\s+)?fn\s+(\w+)/.exec(t)) && !isSnake(m[1])) warn(L, `Rust: la función «${m[1]}» debería ir en snake_case.`, 'naming');
      if ((m = /^let\s+(?:mut\s+)?(\w+)/.exec(t)) && !isSnake(m[1])) warn(L, `Rust: la variable «${m[1]}» debería ir en snake_case.`, 'naming');
      if ((m = /^(?:pub\s+)?(?:struct|trait|enum)\s+(\w+)/.exec(t)) && !isPascal(m[1])) warn(L, `Rust: el tipo «${m[1]}» debería ir en PascalCase.`, 'naming');
      if (/^(?:\}\s*else\s+)?(if|while)\s*\(.*\)\s*\{$/.test(t)) warn(L, 'Rust no necesita paréntesis alrededor de la condición.', 'parens');
    } else {
      if (/\b(if|for|while|switch)\(/.test(t)) warn(L, 'Deja un espacio entre la palabra clave y el paréntesis.', 'keyword-space');
      if ((lang === 'kotlin' || lang === 'swift') && /;\s*$/.test(t)) warn(L, `${lang === 'swift' ? 'Swift' : 'Kotlin'} no necesita «;» al final.`, 'semicolon');
      const decl = lang === 'c' || lang === 'java' || lang === 'cpp'
        ? /^(?:final\s+|const\s+|static\s+)*(?:int|long|double|float|boolean|bool|char|String|short|byte)\s*\**\s*([A-Za-z_]\w*)\s*[=;[]/.exec(t)
        : /^(?:val|var|let)\s+([A-Za-z_]\w*)/.exec(t);
      if (decl && lang !== 'c' && lang !== 'cpp' && !isCamel(decl[1]) && !/^[A-Z][A-Z0-9_]*$/.test(decl[1])) warn(L, `Convención: «${decl[1]}» debería ir en camelCase.`, 'naming');
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
 * Detecta jerarquías de clases en los seis lenguajes.
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
  } else if (lang === 'cpp') {
    for (const m of src.matchAll(/(?:class|struct)\s+(\w+)\s*(?::\s*(?:public|protected|private)?\s*(\w+))?\s*\{/g)) {
      const { body } = braceBody(src, m.index + m[0].length - 1);
      const methods = {};
      for (const mm of body.matchAll(/(virtual\s+)?(?:void|int|bool|double|float)\s+(\w+)\s*\([^)]*\)\s*(?:const\s*)?(override\s*)?(?:=\s*0\s*)?(\{|;)/g)) {
        const mb = mm[4] === '{' ? braceBody(body, mm.index + mm[0].length - 1).body : '';
        methods[mm[2]] = { line: lineOf(src, m.index) + body.slice(0, mm.index).split('\n').length - 1, override: !!mm[3], virtual: !!mm[1], body: mb };
      }
      classes[m[1]] = { name: m[1], parent: m[2] || null, line: lineOf(src, m.index), open: true, abstract: false, methods, fields: [] };
    }
  } else if (lang === 'js') {
    for (const m of src.matchAll(/class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{/g)) {
      const { body } = braceBody(src, m.index + m[0].length - 1);
      const methods = {};
      for (const mm of body.matchAll(/^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/gm)) {
        if (/^(if|for|while|switch|constructor|function|catch)$/.test(mm[1])) continue;
        methods[mm[1]] = { line: lineOf(src, m.index) + body.slice(0, mm.index).split('\n').length - 1, override: false, body: braceBody(body, mm.index + mm[0].length - 1).body, superCall: /super\.\w+\(/.test(mm[0]) };
      }
      classes[m[1]] = { name: m[1], parent: m[2] || null, line: lineOf(src, m.index), open: true, abstract: false, methods, fields: [] };
    }
  } else if (lang === 'csharp') {
    // C#: herencia con «:», virtual en la base y override OBLIGATORIO en la hija (si no, lo oculta).
    for (const m of src.matchAll(/((?:(?:public|private|protected|internal|abstract|sealed|static|partial)\s+)*)(class|interface|struct)\s+(\w+)\s*(?::\s*([\w,\s]+?))?\s*\{/g)) {
      const { body } = braceBody(src, m.index + m[0].length - 1);
      const startLine = lineOf(src, m.index);
      const iface = m[2] === 'interface';
      const methods = {};
      const mre = iface
        ? /(?:void|int|bool|double|float|string)\s+(\w+)\s*\([^)]*\)\s*;/g
        : /((?:(?:public|private|protected|internal|static|virtual|override|abstract|sealed|new|async)\s+)*)(?:void|int|bool|double|float|long|string|Task(?:<\w+>)?)\s+(\w+)\s*\([^)]*\)\s*(\{|;)/g;
      for (const mm of body.matchAll(mre)) {
        const name = iface ? mm[1] : mm[2];
        const mods = iface ? 'abstract' : mm[1] || '';
        const hasBody = !iface && mm[3] === '{';
        const mb = hasBody ? braceBody(body, mm.index + mm[0].length - 1).body : '';
        methods[name[0].toLowerCase() + name.slice(1)] = {
          line: startLine + body.slice(0, mm.index).split('\n').length - 1,
          override: /\boverride\b/.test(mods),
          virtual: /\b(virtual|abstract|override)\b/.test(mods),
          hides: /\bnew\b/.test(mods),
          body: mb,
          superCall: /base\.\w+\(/.test(mb),
          name,
        };
      }
      const parents = (m[4] || '').split(',').map((x) => x.trim()).filter(Boolean);
      const fields = [...new Set([...body.matchAll(/(?:protected|public|private|internal)?\s*(?:double|int|float|string|bool)\s+(\w+)\s*(?:,\s*(\w+)\s*)?[;=]/g)].flatMap((x) => [x[1], x[2]]).filter(Boolean))];
      classes[m[3]] = { name: m[3], parent: parents[0] || null, interfaces: parents.slice(1), line: startLine, open: !/sealed/.test(m[1] || ''), abstract: /abstract/.test(m[1] || '') || iface, methods, fields, iface };
    }
  } else if (lang === 'go') {
    // Go no tiene clases ni herencia: structs + métodos + interfaces implícitas.
    const ifaces = {};
    for (const m of src.matchAll(/type\s+(\w+)\s+interface\s*\{/g)) {
      const { body } = braceBody(src, m.index + m[0].length - 1);
      const names = [...body.matchAll(/(\w+)\s*\(/g)].map((x) => x[1]);
      ifaces[m[1]] = names;
      const methods = {};
      names.forEach((n) => { methods[n[0].toLowerCase() + n.slice(1)] = { line: lineOf(src, m.index), override: false, body: '' }; });
      classes[m[1]] = { name: m[1], parent: null, line: lineOf(src, m.index), open: true, abstract: true, methods, fields: [], iface: true };
    }
    for (const m of src.matchAll(/type\s+(\w+)\s+struct\s*\{/g)) {
      classes[m[1]] = { name: m[1], parent: null, line: lineOf(src, m.index), open: false, abstract: false, methods: {}, fields: [], goMethods: [] };
    }
    for (const m of src.matchAll(/func\s*\(\s*(\w+)\s+(\*?)(\w+)\s*\)\s*(\w+)\s*\([^)]*\)[^{]*\{/g)) {
      const c = classes[m[3]];
      if (!c) continue;
      const { body } = braceBody(src, m.index + m[0].length - 1);
      const key = m[4][0].toLowerCase() + m[4].slice(1);
      c.methods[key] = { line: lineOf(src, m.index), override: true, body: body.replace(new RegExp(`\\b${m[1]}\\.`, 'g'), 'this.'), pointer: m[2] === '*' };
      c.goMethods.push(m[4]);
    }
    for (const c of Object.values(classes)) {
      if (!c.goMethods) continue;
      const impl = Object.entries(ifaces).find(([, names]) => names.length && names.every((n) => c.goMethods.includes(n)));
      if (impl) c.parent = impl[0];
    }
  } else if (lang === 'rust') {
    // Rust no tiene herencia: un trait define el comportamiento y cada struct lo implementa.
    for (const m of src.matchAll(/(?:pub\s+)?trait\s+(\w+)\s*\{/g)) {
      const { body } = braceBody(src, m.index + m[0].length - 1);
      const methods = {};
      for (const mm of body.matchAll(/fn\s+(\w+)\s*\([^)]*\)[^;{]*(\{|;)/g)) {
        const mb = mm[2] === '{' ? braceBody(body, mm.index + mm[0].length - 1).body : '';
        methods[mm[1]] = { line: lineOf(src, m.index), override: false, body: mb, defaultImpl: mm[2] === '{' };
      }
      classes[m[1]] = { name: m[1], parent: null, line: lineOf(src, m.index), open: true, abstract: true, methods, fields: [], trait: true };
    }
    for (const m of src.matchAll(/(?:pub\s+)?struct\s+(\w+)/g)) {
      if (!classes[m[1]]) classes[m[1]] = { name: m[1], parent: null, line: lineOf(src, m.index), open: false, abstract: false, methods: {}, fields: [] };
    }
    for (const m of src.matchAll(/impl\s+(\w+)\s+for\s+(\w+)\s*\{/g)) {
      const { body } = braceBody(src, m.index + m[0].length - 1);
      const target = classes[m[2]] || (classes[m[2]] = { name: m[2], parent: null, line: lineOf(src, m.index), open: false, abstract: false, methods: {}, fields: [] });
      target.parent = m[1];
      for (const mm of body.matchAll(/fn\s+(\w+)\s*\([^)]*\)[^{]*\{/g)) {
        const { body: mb } = braceBody(body, mm.index + mm[0].length - 1);
        target.methods[mm[1]] = { line: lineOf(src, m.index) + body.slice(0, mm.index).split('\n').length - 1, override: true, body: mb };
      }
    }
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
      const flat = fn.replace(/_/g, '').toLowerCase();
      const owner = Object.keys(classes).filter((c) => flat.startsWith(c.toLowerCase())).sort((x, y) => y.length - x.length)[0] || def.type;
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
      if (classes[c.parent].methods[name] && (lang === 'python' || lang === 'java' || lang === 'js' || (lang === 'cpp' && classes[c.parent].methods[name].virtual))) md.override = true;
      // C#: «override» sobre un método que no es virtual no compila (CS0506): no hay polimorfismo.
      if (lang === 'csharp' && md.override && classes[c.parent].methods[name] && !classes[c.parent].methods[name].virtual) { md.override = false; md.badOverride = true; }
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
  rust: /thread::spawn\(|tokio::spawn\(|\.spawn\(/,
  go: /\bgo\s+(func\b|\w+\()/,
  js: /Promise\.(all|allSettled|race)\(/,
  cpp: /\bthread\s+\w+\s*\(|std::thread|std::async\(/,
  // C#: Task.Run, o llamar a un método async SIN await (la tarea arranca ya: «hot task»).
  csharp: /Task\.Run\(|Task\.Factory\.StartNew\(|new\s+Thread\(|\.Add\(\s*\w*[Ss]can\w*\(|(?:Task<\w+>|var)\s+\w+\s*=\s*(?!await\b)\w*[Ss]can\w*\(|\.Select\(\s*\w+\s*=>\s*\w*[Ss]can\w*\(/,
};
const JOIN = {
  python: /\bawait\b|\.join\(/,
  java: /\.join\(\)|\.get\(\)|allOf\(|awaitTermination\(|invokeAll\(/,
  kotlin: /\.join\(\)|\.await\(\)|awaitAll\(|joinAll\(/,
  swift: /\bawait\b/,
  c: /pthread_join\(/,
  rust: /\.join\(\)|\.await\b|join_all\(/,
  go: /\.Wait\(\)|(?:^|[=(,]|\+=)\s*<-\s*\w+/,
  js: /\bawait\b/,
  cpp: /\.join\(\)|\.get\(\)/,
  csharp: /\bawait\b|\.Wait\(\)|\.Result\b|Task\.WaitAll\(|\.Join\(\)/,
};
const PROTECT = {
  python: /asyncio\.Lock|threading\.Lock|with\s+\w*lock/i,
  java: /AtomicInteger|AtomicLong|synchronized|ReentrantLock|\.incrementAndGet|\.addAndGet|LongAdder/,
  kotlin: /Mutex|withLock|AtomicInteger|\.incrementAndGet|\.addAndGet/,
  swift: /\bactor\b|NSLock|OSAllocatedUnfairLock/,
  c: /pthread_mutex_lock|atomic_/,
  rust: /Mutex|RwLock|Atomic(I|U)\w+|\.lock\(\)|mpsc::/,
  go: /sync\.Mutex|\.Lock\(\)|atomic\./,
  js: /Atomics\./,
  cpp: /atomic<|mutex|lock_guard/,
  csharp: /\block\s*\(|Interlocked\.|Concurrent\w+|SemaphoreSlim|Monitor\.Enter/,
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
  const loopRe = lang === 'python' ? /^(for|while)\b/ : /^(for|foreach|while)\b|\brepeat\s*\(\s*\d+\s*\)\s*\{|\.forEach\s*\{|\.map\s*\{|\.map\(\s*(move\s*)?\|/;
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
      if (lang === 'js' && /Promise\./.test(t)) count = /\.map\(/.test(t) ? 3 : (t.match(/\w*scan\w*\(/g) || []).length || 1;
      if (lang === 'csharp' && /\.Select\(/.test(t)) count = 3;
      if (loopOf(L) || /\.(map|forEach)\s*\{|repeat\s*\(|\.map\(\s*(move\s*)?\|/.test(t)) count = 3;
      spawns.push({ line: L, count, loop: loopOf(L), gather: /gather\(/.test(t) });
      if (/\{/.test(t)) closures.push({ from: L, to: blockEnd(lines, i, lang) });
    } else if (lang === 'java' && /\.start\(\)/.test(t)) {
      spawns.push({ line: L, count: 0, loop: loopOf(L), start: true });
    }
    const directAwait = /\bawait\s+\w*scan\w*\(/i.test(t) && !/async\s+let|gather|addTask/.test(t);
    if (directAwait) joins.push({ line: L, direct: true, loop: loopOf(L) });
    else if (!SPAWN[lang].test(t) && JOIN[lang].test(t)) joins.push({ line: L, loop: loopOf(L) });
    else if (SPAWN[lang].test(t) && JOIN[lang].test(t) && !['python', 'swift', 'js'].includes(lang)) joins.push({ line: L, loop: loopOf(L), sameLine: true });
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
  if ((lang === 'python' && !/threading/.test(src)) || lang === 'js') sharedMutation = false; // un solo hilo: sin carreras
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
    const isLoop = /^(for|foreach|while)\b/.test(t) || /\}\s*while/.test(t) === false && /^do\b/.test(t);
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
  return /\b(for|foreach|while|repeat)\b/.test(src);
}

export function usesConditional(code, lang) {
  const src = stripComments(code, lang);
  return /\b(if|when|switch|guard)\b|\?.*:/.test(src);
}
