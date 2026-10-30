// Forge VM · Polyglot Core
// Traduce un subconjunto realista de Python, Java, Kotlin, Swift y C a JavaScript
// instrumentado. La traducción es línea a línea (1:1) para que cada error y cada
// frame del stack trace apunten exactamente a la línea que escribió el usuario.

const SRC_FILE = { python: 'main.py', java: 'Main.java', kotlin: 'Main.kt', swift: 'main.swift', c: 'main.c' };
export const sourceFile = (lang) => SRC_FILE[lang];

export class ForgeSyntaxError extends Error {
  constructor(message, line, col = 1, hint = '') {
    super(message);
    this.line = line;
    this.col = col;
    this.hint = hint;
  }
}

// ───────────────────────── 1. Comentarios y cadenas ─────────────────────────

/** Elimina comentarios conservando saltos de línea (y cadenas intactas). */
export function stripComments(src, lang) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const c2 = src[i + 1];
    if (c === '"' || c === "'") {
      const q = c;
      let j = i + 1;
      while (j < n && src[j] !== q && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      out += src.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (lang === 'python') {
      if (c === '#') {
        while (i < n && src[i] !== '\n') i++;
        continue;
      }
    } else {
      if (c === '/' && c2 === '/') {
        while (i < n && src[i] !== '\n') i++;
        continue;
      }
      if (c === '/' && c2 === '*') {
        i += 2;
        while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
          if (src[i] === '\n') out += '\n';
          i++;
        }
        i += 2;
        continue;
      }
    }
    out += c;
    i++;
  }
  return out;
}

const PH = '\u0001';

/** Sustituye literales de cadena por marcadores para que las regex no los toquen. */
function protectStrings(src, lang) {
  const table = [];
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    let prefix = '';
    if (lang === 'python' && (c === 'f' || c === 'F') && (src[i + 1] === '"' || src[i + 1] === "'") && !/\w/.test(src[i - 1] || '')) {
      prefix = 'f';
    }
    const q = prefix ? src[i + 1] : c;
    if (q === '"' || q === "'") {
      if (!prefix && (c !== '"' && c !== "'")) {
        out += c;
        i++;
        continue;
      }
      const start = i + (prefix ? 2 : 1);
      let j = start;
      while (j < src.length && src[j] !== q && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      const body = src.slice(start, j);
      let kind = 'str';
      if (prefix) kind = 'fstr';
      else if (q === "'" && lang !== 'python') kind = 'char';
      else if (lang === 'kotlin' && /\$[\w{]/.test(body)) kind = 'ktpl';
      else if (lang === 'swift' && body.includes('\\(')) kind = 'swtpl';
      table.push({ body, kind, q });
      out += `${PH}${table.length - 1}${PH}`;
      i = j + 1;
      continue;
    }
    out += c;
    i++;
  }
  return { code: out, table };
}

function restoreStrings(code, table, lang, exprFn) {
  return code.replace(/\u0001(\d+)\u0001/g, (_, k) => {
    const { body, kind, q } = table[Number(k)];
    if (kind === 'str' || kind === 'char') return q === "'" && kind === 'char' ? `'${body}'` : `${q}${body}${q}`;
    const esc = (s) => s.replace(/`/g, '\\`');
    if (kind === 'fstr') {
      return '`' + esc(body).replace(/\{([^{}]+)\}/g, (m, e) => {
        const [expr, spec] = e.split(':');
        const js = exprFn(expr.trim());
        const fix = spec && /^\.(\d+)f$/.exec(spec.trim());
        return fix ? '${(' + js + ').toFixed(' + fix[1] + ')}' : '${' + js + '}';
      }) + '`';
    }
    if (kind === 'ktpl') {
      return '`' + esc(body)
        .replace(/\$\{([^{}]+)\}/g, (m, e) => '${' + exprFn(e.trim()) + '}')
        .replace(/\$([A-Za-z_]\w*(?:\.\w+)*)/g, (m, e) => '${' + exprFn(e) + '}') + '`';
    }
    if (kind === 'swtpl') {
      let s = esc(body);
      let res = '';
      for (let i = 0; i < s.length; i++) {
        if (s[i] === '\\' && s[i + 1] === '(') {
          let depth = 1;
          let j = i + 2;
          while (j < s.length && depth) {
            if (s[j] === '(') depth++;
            else if (s[j] === ')') depth--;
            j++;
          }
          res += '${' + exprFn(s.slice(i + 2, j - 1)) + '}';
          i = j - 1;
        } else res += s[i];
      }
      return '`' + res + '`';
    }
    return `"${body}"`;
  });
}

// ───────────────────────── 2. Utilidades ─────────────────────────

export function splitTopLevel(str, sep = ',') {
  const parts = [];
  let depth = 0;
  let cur = '';
  for (const ch of str) {
    if ('([{<'.includes(ch) && !(ch === '<' && sep !== ',')) depth += ch === '<' ? 0 : 1;
    if (')]}'.includes(ch)) depth--;
    if (ch === sep && depth === 0) {
      parts.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (cur.trim() !== '' || parts.length) parts.push(cur);
  return parts.map((p) => p.trim()).filter((p) => p !== '');
}

const JAVA_PRIMS = ['int', 'long', 'short', 'byte', 'double', 'float', 'boolean', 'char', 'var', 'void'];
const C_PRIMS = ['int', 'long', 'short', 'char', 'double', 'float', 'bool', 'void', 'size_t', 'int8_t', 'int16_t', 'int32_t', 'int64_t', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t'];
const NOT_TYPES = new Set(['return', 'new', 'else', 'case', 'goto', 'throw', 'delete', 'print', 'printf', 'free', 'if', 'for', 'while', 'switch', 'do', 'break', 'continue', 'import', 'package', 'sizeof', 'typeof', 'await', 'yield']);

function isTypeToken(t, lang) {
  const base = t.replace(/<.*>/, '').replace(/\[\s*\]/g, '').replace(/\*/g, '').replace(/^struct\s+/, '').trim();
  if (!base || NOT_TYPES.has(base)) return false;
  if (lang === 'c') return C_PRIMS.includes(base) || /_t$/.test(base) || /^struct\s/.test(t) || /^[A-Z]\w*$/.test(base);
  return JAVA_PRIMS.includes(base) || /^[A-Z]\w*$/.test(base);
}

const lastIdent = (p) => {
  const m = /([A-Za-z_]\w*)\s*(?:\[\s*\d*\s*\])*\s*$/.exec(p.replace(/\.\.\./g, ' '));
  return m ? m[1] : null;
};

function paramsCFamily(params) {
  if (!params.trim() || params.trim() === 'void') return [];
  return splitTopLevel(params).map(lastIdent).filter(Boolean);
}

function paramsKotlinSwift(params) {
  return splitTopLevel(params)
    .map((p) => {
      const m = /([A-Za-z_]\w*)\s*:\s*[^=]+?(?:=\s*(.+))?$/.exec(p.replace(/^(vararg|inout)\s+/, ''));
      if (!m) return null;
      return m[2] ? `${m[1]} = ${m[2]}` : m[1];
    })
    .filter(Boolean);
}

function pythonParams(params) {
  return splitTopLevel(params)
    .map((p) => {
      if (p === 'self') return null;
      const m = /^\*{0,2}([A-Za-z_]\w*)\s*(?::\s*[^=]+?)?\s*(?:=\s*(.+))?$/.exec(p);
      if (!m) return null;
      return m[2] ? `${m[1]} = ${m[2]}` : m[1];
    })
    .filter(Boolean);
}

/** Convierte la expresión de iteración de un `for` en un iterable JS. */
function iterExpr(e, lang, expr) {
  e = e.trim();
  let m;
  if ((m = /^stride\(\s*from:\s*(.+?),\s*(to|through):\s*(.+?),\s*by:\s*(.+)\)$/.exec(e))) {
    return m[2] === 'to' ? `__range(${expr(m[1])}, ${expr(m[3])}, ${expr(m[4])})` : `__rangeIncl(${expr(m[1])}, ${expr(m[3])}, ${expr(m[4])})`;
  }
  let step = '1';
  if ((m = /^(.+?)\s+step\s+(.+)$/.exec(e))) {
    e = m[1];
    step = expr(m[2]);
  }
  if ((m = /^(.+?)\s+until\s+(.+)$/.exec(e))) return `__range(${expr(m[1])}, ${expr(m[2])}, ${step})`;
  if ((m = /^(.+?)\s+downTo\s+(.+)$/.exec(e))) return `__rangeIncl(${expr(m[1])}, ${expr(m[2])}, -(${step}))`;
  if ((m = /^(.+?)\s*\.\.<\s*(.+)$/.exec(e))) return `__range(${expr(m[1])}, ${expr(m[2])}, ${step})`;
  if ((m = /^(.+?)\s*\.\.\.\s*(.+)$/.exec(e))) return `__rangeIncl(${expr(m[1])}, ${expr(m[2])}, ${step})`;
  if ((m = /^(.+?)\s*\.\.\s*(.+)$/.exec(e))) return `__rangeIncl(${expr(m[1])}, ${expr(m[2])}, ${step})`;
  if ((m = /^range\((.*)\)$/.exec(e))) return `__range(${splitTopLevel(m[1]).map(expr).join(', ')})`;
  if ((m = /^enumerate\((.*)\)$/.exec(e))) return `__enumerate(${expr(m[1])})`;
  if ((m = /^(.+)\.(withIndex|enumerated)\(\)$/.exec(e))) return `__enumerate(${expr(m[1])})`;
  return `__iter(${expr(e)})`;
}

const loopVar = (v) => {
  v = v.trim().replace(/^\((.*)\)$/, '$1');
  const parts = splitTopLevel(v).map((p) => p.replace(/^(val|var|let)\s+/, '').replace(/:.*$/, '').trim());
  return parts.length > 1 ? `[${parts.join(', ')}]` : parts[0];
};

// ───────────────────────── 3. Expresiones por lenguaje ─────────────────────────

const SIZEOF = { char: 1, bool: 1, int8_t: 1, uint8_t: 1, short: 2, int16_t: 2, int: 4, float: 4, int32_t: 4, uint32_t: 4, long: 8, double: 8, int64_t: 8, uint64_t: 8, size_t: 8 };

function exprCommon(s) {
  return s
    .replace(/\b(0x[0-9a-fA-F]+|\d+(?:\.\d+)?)(?:[uU]?[lL]{1,2}|[fF](?![\w])|[uU])\b/g, '$1')
    .replace(/(\d)_(?=\d)/g, '$1_');
}

function exprPython(s) {
  return exprCommon(s)
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null')
    .replace(/([\w.\]\)]+(?:\[[^\]]*\])?)\s+not\s+in\s+([\w.]+(?:\([^()]*\))?)/g, '!__in($1, $2)')
    .replace(/([\w.\]\)]+(?:\[[^\]]*\])?)\s+in\s+([\w.]+(?:\([^()]*\))?)/g, '__in($1, $2)')
    .replace(/\bnot\s+/g, '!')
    .replace(/\s+and\s+/g, ' && ')
    .replace(/\s+or\s+/g, ' || ')
    .replace(/\bis\s+not\b/g, '!==')
    .replace(/\bis\b/g, '===')
    .replace(/(\w+(?:\[[^\]]*\])?|\([^()]*\))\s*\/\/\s*(\w+(?:\[[^\]]*\])?|\([^()]*\))/g, 'Math.floor($1 / $2)')
    .replace(/\[([^[\]]*)\]\s*\*\s*(\w+|\([^()]*\))/g, '__arr($2, $1)')
    .replace(/\.append\(/g, '.push(')
    .replace(/\.get\(/g, '.__get(')
    .replace(/\.sort\(\)/g, '.__sort()')
    .replace(/(\w+)\.items\(\)/g, '__items($1)')
    .replace(/(\w+)\.keys\(\)/g, '__keys($1)')
    .replace(/(\w+)\.values\(\)/g, '__values($1)')
    .replace(/(^|[=(,:\s]|return\s)\{\s*\}/g, '$1__dict()')
    .replace(/(^|[=(,]\s*|return\s+)\{([^{}]*:[^{}]*)\}/g, '$1__dict({$2})')
    .replace(/\bself\./g, 'this.');
}

function exprJava(s) {
  return exprCommon(s)
    .replace(/System\.out\.println\(/g, 'print(')
    .replace(/System\.out\.print\(/g, 'print(')
    .replace(/System\.out\.printf\(/g, 'printf(')
    .replace(/String\.valueOf\(/g, 'String(')
    .replace(/Integer\.MAX_VALUE/g, '2147483647')
    .replace(/Integer\.MIN_VALUE/g, '(-2147483648)')
    .replace(/Long\.MAX_VALUE/g, '9223372036854775807')
    .replace(/Arrays\.sort\(/g, '__sortArr(')
    .replace(/Arrays\.toString\(/g, '__str(')
    .replace(/(?:List|Set)\.of\(/g, '__listOf(')
    .replace(/new\s+(?:ArrayList|LinkedList)\s*(?:<[^()]*>)?\(\s*\)/g, '[]')
    .replace(/new\s+(?:HashMap|TreeMap|LinkedHashMap)\s*(?:<[^()]*>)?\(\s*\)/g, '__dict()')
    .replace(/new\s+(?:HashSet|TreeSet|LinkedHashSet)\s*(?:<[^()]*>)?\(\s*\)/g, 'new Set()')
    .replace(/new\s+(?:int|long|double|float|short|byte|char|String)\s*\[\s*\]\s*\{([^}]*)\}/g, '[$1]')
    .replace(/new\s+boolean\s*\[([^\]]+)\]/g, '__arr($1, false)')
    .replace(/new\s+(?:int|long|double|float|short|byte|char)\s*\[([^\]]+)\]/g, '__arr($1, 0)')
    .replace(/new\s+String\s*\[([^\]]+)\]/g, '__arr($1, null)')
    .replace(/\.length\(\)/g, '.length')
    .replace(/\.size\(\)/g, '.__size()')
    .replace(/\.isEmpty\(\)/g, '.__isEmpty()')
    .replace(/\.add\(/g, '.__add(')
    .replace(/\.get\(/g, '.__get(')
    .replace(/\.getOrDefault\(/g, '.__get(')
    .replace(/\.put\(/g, '.__put(')
    .replace(/\.contains(?:Key)?\(/g, '.__has(')
    .replace(/\.equals\(/g, '.__eq(')
    .replace(/\((?:double|float|long)\)\s*/g, '')
    .replace(/\((?:int|short|byte)\)\s*(\w+(?:\.\w+)*(?:\([^()]*\))?|\([^()]*\))/g, 'Math.trunc($1)');
}

function exprKotlin(s) {
  return exprCommon(s)
    .replace(/\bprintln\(/g, 'print(')
    .replace(/\?:/g, '??')
    .replace(/!!/g, '')
    .replace(/Int\.MAX_VALUE/g, '2147483647')
    .replace(/Long\.MAX_VALUE/g, '9223372036854775807')
    .replace(/\b(?:mutableListOf|listOf|arrayListOf|intArrayOf|longArrayOf|arrayOf)\s*(?:<[^()]*>)?\(/g, '__listOf(')
    .replace(/\b(?:mutableMapOf|hashMapOf|mapOf)\s*(?:<[^()]*>)?\(\s*\)/g, '__dict()')
    .replace(/\b(?:mutableSetOf|hashSetOf|setOf)\s*(?:<[^()]*>)?\(/g, '__setOf(')
    .replace(/\bBooleanArray\(([^()]+)\)/g, '__arr($1, false)')
    .replace(/\b(?:IntArray|LongArray|DoubleArray)\(([^()]+)\)/g, '__arr($1, 0)')
    .replace(/\.size\b(?!\s*\()/g, '.__size()')
    .replace(/\.indices\b/g, '.__indices()')
    .replace(/\.isEmpty\(\)/g, '.__isEmpty()')
    .replace(/\.add\(/g, '.__add(')
    .replace(/\.getOrDefault\(/g, '.__get(')
    .replace(/\.contains(?:Key)?\(/g, '.__has(')
    .replace(/\.sort\(\)/g, '.__sort()')
    .replace(/\.sorted\(\)/g, '.__sorted()')
    .replace(/\.toLong\(\)/g, '')
    .replace(/\.toDouble\(\)/g, '')
    .replace(/\.toInt\(\)/g, '.__toInt()')
    .replace(/\bmaxOf\(/g, 'Math.max(')
    .replace(/\bminOf\(/g, 'Math.min(')
    .replace(/([\w.\])]+)\s+!in\s+([\w.]+)/g, '!__in($1, $2)')
    .replace(/([\w.\])]+)\s+in\s+([\w.]+)/g, '__in($1, $2)');
}

function stripSwiftLabels(s) {
  let out = '';
  const stack = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if ('([{'.includes(ch)) stack.push(ch);
    else if (')]}'.includes(ch)) stack.pop();
    out += ch;
    if ((ch === '(' || ch === ',') && stack[stack.length - 1] === '(') {
      const m = /^\s*([A-Za-z_]\w*):(?!:)\s*/.exec(s.slice(i + 1));
      if (m) {
        out += ' ';
        i += m[0].length;
      }
    }
  }
  return out;
}

function exprSwift(s) {
  const r = exprCommon(s)
    .replace(/\bnil\b/g, 'null')
    .replace(/Int\.max\b/g, '9223372036854775807')
    .replace(/Int32\.max\b/g, '2147483647')
    .replace(/Array\(\s*repeating:\s*([^,]+),\s*count:\s*([^)]+)\)/g, '__arr($2, $1)')
    .replace(/\[\s*\w+\s*\]\s*\(\s*repeating:\s*([^,]+),\s*count:\s*([^)]+)\)/g, '__arr($2, $1)')
    .replace(/\[\s*:\s*\]/g, '__dict()')
    .replace(/\[\s*\w+\s*:\s*\w+\s*\]\s*\(\s*\)/g, '__dict()')
    .replace(/\[\s*\w+\s*\]\s*\(\s*\)/g, '[]')
    .replace(/Set<[^()]*>\(\s*\)/g, 'new Set()')
    .replace(/\[((?:\s*\u0001\d+\u0001\s*:\s*[^,\]]+,?)+)\]/g, '__dict({$1})')
    .replace(/^(\w+)\[([^\],]+),\s*default:\s*([^\]]+)\]\s*\+=\s*(.+)$/, '$1[$2] = ($1[$2] ?? $3) + $4')
    .replace(/(\w+)\[([^\],]+),\s*default:\s*([^\]]+)\]/g, '($1[$2] ?? $3)')
    .replace(/\.count\b(?!\s*\()/g, '.__size()')
    .replace(/\.isEmpty\b/g, '.__isEmpty()')
    .replace(/\.indices\b/g, '.__indices()')
    .replace(/\.append\(/g, '.push(')
    .replace(/\.insert\(/g, '.__add(')
    .replace(/\.contains\(/g, '.__has(')
    .replace(/\.sort\(\)/g, '.__sort()')
    .replace(/\.sorted\(\)/g, '.__sorted()')
    .replace(/(^|[(,]\s*)&(?=\w)/g, '$1')
    .replace(/\bInt64\(/g, '__i64(')
    .replace(/\bInt32\(/g, '__i32(')
    .replace(/\bInt\(/g, '__i64(')
    .replace(/\bDouble\(/g, 'Number(');
  return stripSwiftLabels(r);
}

function exprC(s) {
  return exprCommon(s)
    .replace(/\bNULL\b/g, 'null')
    .replace(/->/g, '.')
    .replace(/sizeof\s*\(\s*(\w+)\s*\)\s*\/\s*sizeof\s*\(\s*\1\s*\[\s*0\s*\]\s*\)/g, '$1.length')
    .replace(/sizeof\s*\(\s*(?:struct\s+)?(\w+)\s*\*\s*\)/g, '8')
    .replace(/sizeof\s*\(\s*(\w+)\s*\)/g, (m, t) => (SIZEOF[t] ? String(SIZEOF[t]) : `__sizeof(${t})`))
    .replace(/\(\s*(?:const\s+)?(?:struct\s+)?\w+\s*\*+\s*\)\s*/g, '')
    .replace(/\(\s*(?:long|double|float|int64_t|uint64_t|size_t)\s*\)\s*/g, '')
    .replace(/\(\s*(?:int|short|char|int32_t)\s*\)\s*(\w+(?:\[[^\]]*\])?|\([^()]*\))/g, 'Math.trunc($1)')
    .replace(/\*\s*\(\s*(\w+)\s*\+\s*([^()]+)\)/g, '$1[$2]')
    .replace(/(^|[=(,!+\-/%<>&|?:]\s*|return\s+)\*\s*([A-Za-z_]\w*)/g, '$1__deref($2)')
    .replace(/(^|[(,=]\s*)&(?=[A-Za-z_])/g, '$1');
}

const EXPR = { python: exprPython, java: exprJava, kotlin: exprKotlin, swift: exprSwift, c: exprC };

// ───────────────────────── 4. Comprobación sintáctica ─────────────────────────

const PAIRS = { '(': ')', '[': ']', '{': '}' };

function checkBrackets(lines, lang) {
  const stack = [];
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    for (let ci = 0; ci < line.length; ci++) {
      const ch = line[ci];
      if (PAIRS[ch]) stack.push({ ch, line: li + 1, col: ci + 1 });
      else if (')]}'.includes(ch)) {
        const top = stack.pop();
        if (!top || PAIRS[top.ch] !== ch) {
          throw new ForgeSyntaxError(syntaxMsg(lang, top ? `'${PAIRS[top.ch]}' esperado, encontrado '${ch}'` : `'${ch}' sin apertura`), li + 1, ci + 1,
            top ? `El '${top.ch}' de la línea ${top.line} no se cierra donde crees.` : 'Sobra un cierre: cuenta tus llaves y paréntesis.');
        }
      }
    }
  }
  if (stack.length) {
    const top = stack[stack.length - 1];
    throw new ForgeSyntaxError(syntaxMsg(lang, `se esperaba '${PAIRS[top.ch]}' al final del archivo`), top.line, top.col,
      `El '${top.ch}' abierto en la línea ${top.line} nunca se cierra.`);
  }
}

function syntaxMsg(lang, msg) {
  switch (lang) {
    case 'python': return `SyntaxError: ${msg}`;
    case 'java': return `error: ${msg}`;
    case 'kotlin': return `error: ${msg}`;
    case 'swift': return `error: ${msg}`;
    default: return `error: ${msg}`;
  }
}

function checkStatements(lines, lang) {
  let depth = 0;
  for (let li = 0; li < lines.length; li++) {
    const raw = lines[li];
    const t = raw.trim();
    const startDepth = depth;
    for (const ch of raw) {
      if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') depth--;
    }
    if (!t || startDepth > 0 || depth > 0) continue;
    if (lang === 'java' || lang === 'c') {
      if (/^(#|@)/.test(t) || /[;{},:]$/.test(t) || /[+\-*/%=&|?<>]$/.test(t)) continue;
      if (/^(else|do|try|finally)$/.test(t)) continue;
      const next = (lines.slice(li + 1).find((l) => l.trim()) || '').trim();
      if (/^[{.+\-*/%&|?:]/.test(next)) continue;
      if (/^(if|for|while|switch)\b.*\)$/.test(t)) continue;
      throw new ForgeSyntaxError(lang === 'java' ? "error: ';' expected" : "error: expected ';' after expression", li + 1, raw.length + 1,
        `En ${lang === 'java' ? 'Java' : 'C'} cada sentencia termina en punto y coma.`);
    }
    if ((lang === 'java' || lang === 'kotlin') && /^(if|while|for)\s+[^(\s]/.test(t)) {
      throw new ForgeSyntaxError(lang === 'java' ? "error: '(' expected" : "error: expecting '('", li + 1, t.indexOf(' ') + 2,
        `En ${lang === 'java' ? 'Java' : 'Kotlin'} la condición va entre paréntesis.`);
    }
    if ((lang === 'java' || lang === 'c' || lang === 'kotlin' || lang === 'swift') && /^(if|for|while)\b/.test(t) && !/\{\s*$/.test(t)) {
      const next = (lines.slice(li + 1).find((l) => l.trim()) || '').trim();
      if (next !== '{') {
        throw new ForgeSyntaxError(syntaxMsg(lang, 'el Forge VM exige llaves { } en cada bloque'), li + 1, raw.length,
          'Las llaves evitan el clásico bug de la segunda línea que creías dentro del if (goto fail, Apple 2014).');
      }
    }
  }
}

function checkPythonIndent(lines) {
  const headerRe = /^(if|elif|else|for|while|def|class|try|except|finally|with|async\s+def|async\s+with)\b/;
  let prevIndent = 0;
  let expectIndent = false;
  let prevLine = 0;
  let depth = 0;
  for (let li = 0; li < lines.length; li++) {
    const raw = lines[li].replace(/\t/g, '    ');
    const t = raw.trim();
    const startDepth = depth;
    for (const ch of raw) {
      if ('([{'.includes(ch)) depth++;
      else if (')]}'.includes(ch)) depth--;
    }
    if (!t || startDepth > 0) continue;
    const indent = raw.length - raw.trimStart().length;
    if (expectIndent && indent <= prevIndent) {
      throw new ForgeSyntaxError(`IndentationError: expected an indented block after line ${prevLine}`, li + 1, 1,
        'Tras los dos puntos, el bloque debe ir sangrado (4 espacios).');
    }
    if (!expectIndent && indent > prevIndent) {
      throw new ForgeSyntaxError('IndentationError: unexpected indent', li + 1, 1, 'Esta línea tiene más sangría de la que le corresponde.');
    }
    const isHeader = headerRe.test(t);
    if (isHeader && depth === 0 && !t.endsWith(':')) {
      throw new ForgeSyntaxError("SyntaxError: expected ':'", li + 1, raw.length + 1, 'Las cabeceras de bloque (if, for, def…) terminan en dos puntos.');
    }
    expectIndent = isHeader && t.endsWith(':') && depth === 0;
    if (/^(if|for|while)\b.*\{\s*$/.test(t)) {
      throw new ForgeSyntaxError('SyntaxError: invalid syntax', li + 1, raw.length, 'En Python no hay llaves: los bloques se marcan con «:» y sangría.');
    }
    prevIndent = indent;
    prevLine = li + 1;
  }
  if (expectIndent) throw new ForgeSyntaxError('SyntaxError: unexpected EOF while parsing', prevLine, 1, 'El último bloque está vacío.');
}

// ───────────────────────── 5. Traducción línea a línea ─────────────────────────

function translatePython(lines, meta) {
  const expr = (e) => EXPR.python(e);
  const out = [];
  const stack = [];
  let depth = 0;
  let lastCode = -1;
  for (let li = 0; li < lines.length; li++) {
    const raw = lines[li].replace(/\t/g, '    ');
    const t = raw.trim();
    const startDepth = depth;
    for (const ch of raw) {
      if ('([{'.includes(ch)) depth++;
      else if (')]}'.includes(ch)) depth--;
    }
    if (!t) { out.push(''); continue; }
    if (startDepth > 0) { out.push(expr(raw)); lastCode = li; continue; }
    const indent = raw.length - raw.trimStart().length;
    let closers = '';
    while (stack.length && stack[stack.length - 1] >= indent) {
      stack.pop();
      closers += '} ';
    }
    const pad = ' '.repeat(indent);
    let m;
    let js;
    let opens = false;
    const L = li + 1;
    if ((m = /^if\s+(.+):$/.exec(t))) { js = `if (${expr(m[1])}) {`; opens = true; }
    else if ((m = /^elif\s+(.+):$/.exec(t))) { js = `else if (${expr(m[1])}) {`; opens = true; }
    else if (/^else\s*:$/.test(t)) { js = 'else {'; opens = true; }
    else if ((m = /^while\s+(.+):$/.exec(t))) { js = `while (${expr(m[1])}) { __tick();`; opens = true; }
    else if ((m = /^for\s+(.+?)\s+in\s+(.+):$/.exec(t))) { js = `for (let ${loopVar(m[1])} of ${iterExpr(m[2], 'python', expr)}) { __tick();`; opens = true; }
    else if ((m = /^(async\s+)?def\s+(\w+)\s*\((.*)\)\s*(?:->\s*.+)?:$/.exec(t))) {
      meta.functions.push({ name: m[2], line: L });
      js = `${m[1] ? 'async ' : ''}function ${m[2]}(${pythonParams(m[3]).map(expr).join(', ')}) { __tick();`;
      opens = true;
    }
    else if (/^class\s/.test(t)) throw new ForgeSyntaxError('Forge VM: las clases se analizan en el Módulo 4, no en esta misión', L, 1, 'Resuelve la misión con funciones y variables.');
    else if (/^(import|from)\s/.test(t) || /^global\s/.test(t) || t === 'pass') js = ';';
    else if (/^(return|break|continue)\b/.test(t)) js = expr(t);
    else if ((m = /^([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)+)\s*=\s*([^=].*)$/.exec(t))) {
      js = `var [${m[1]}] = [${expr(m[2])}]`;
    } else if ((m = /^(.+?,.+?)\s*=\s*([^=].*)$/.exec(t)) && !/^[\w.]+\s*\(/.test(t) && splitTopLevel(m[1]).length > 1) {
      js = `;[${splitTopLevel(m[1]).map(expr).join(', ')}] = [${splitTopLevel(m[2]).map(expr).join(', ')}]`;
    } else if ((m = /^([A-Za-z_]\w*)\s*(?::\s*([\w[\], ]+?))?\s*=\s*([^=].*)$/.exec(t))) {
      if (indent === 0) {
        meta.decls[L] = { type: m[2] || null, name: m[1], expr: m[3] };
        js = `var ${m[1]} = __decl(${m[2] ? `'${m[2]}'` : 'null'}, '${m[1]}', (${expr(m[3])}), ${L})`;
      } else js = `var ${m[1]} = ${expr(m[3])}`;
    } else js = expr(t);
    if (opens) stack.push(indent);
    else if (!/[{;]$/.test(js)) js += ';';
    out.push(pad + closers + js);
    lastCode = li;
  }
  if (stack.length && lastCode >= 0) out[lastCode] += ' }'.repeat(stack.length);
  return out;
}

function translateCFamily(lines, lang, meta, mode) {
  const expr = (e) => EXPR[lang](e);
  const out = [];
  const isJava = lang === 'java';
  // Normaliza estilo Allman: "{" solo en una línea se sube a la cabecera.
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '{') {
      let p = i - 1;
      while (p >= 0 && !lines[p].trim()) p--;
      if (p >= 0 && !/[;{}]\s*$/.test(lines[p])) {
        lines[p] = lines[p].replace(/\s*$/, ' {');
        lines[i] = '';
      }
    }
  }
  let braceDepth = 0;
  const dropAt = [];
  for (let li = 0; li < lines.length; li++) {
    const L = li + 1;
    let raw = lines[li];
    if (lang === 'c') {
      raw = raw
        .replace(/\bunsigned\s+long\s+long\b/g, 'uint64_t')
        .replace(/\blong\s+long(\s+int)?\b/g, 'int64_t')
        .replace(/\bunsigned\s+int\b/g, 'uint32_t')
        .replace(/\bunsigned\s+char\b/g, 'uint8_t')
        .replace(/\bunsigned\b/g, 'uint32_t')
        .replace(/\blong\s+int\b/g, 'long');
    }
    const t = raw.trim();
    const pad = raw.slice(0, raw.length - raw.trimStart().length);
    const closeMatch = /^((?:\}\s*)*)(.*)$/.exec(t);
    let closers = closeMatch[1];
    let rest = closeMatch[2].trim();
    // Cierres de bloques eliminados (envoltorio class de Java).
    let closerOut = '';
    for (const ch of closers) {
      if (ch !== '}') continue;
      braceDepth--;
      if (dropAt.length && dropAt[dropAt.length - 1] === braceDepth) {
        dropAt.pop();
        closerOut += ' ';
      } else closerOut += '} ';
    }
    let js = rest;
    let m;
    if (!rest) js = '';
    else if (/^#/.test(rest) || /^(import|package)\s/.test(rest) || /^@\w+/.test(rest) || /^using\s/.test(rest)) js = '';
    else if (isJava && mode === 'run' && /^(?:(?:public|private|final|abstract|static)\s+)*class\s+\w+[^{]*\{$/.test(rest)) {
      dropAt.push(braceDepth);
      braceDepth++;
      js = '';
      rest = '';
    } else if ((m = /^(?:(?:public|private|protected|static|final|synchronized|inline|extern)\s+)*([A-Za-z_][\w<>, ]*?(?:\[\s*\])*)\s*(\**)\s*([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?:throws\s+[\w.,\s]+)?\{$/.exec(rest))
      && (lang === 'java' || lang === 'c') && isTypeToken(m[1].trim(), lang) && !NOT_TYPES.has(m[3])) {
      meta.functions.push({ name: m[3], line: L });
      js = `function ${m[3]}(${paramsCFamily(m[4]).join(', ')}) { __tick();`;
    } else if ((m = /^(?:(?:private|public|internal|override|open|suspend|inline)\s+)*fun\s+(\w+)\s*\((.*)\)\s*(?::\s*[\w<>?,\s[\]]+)?\s*(\{|=\s*(.+))$/.exec(rest)) && lang === 'kotlin') {
      meta.functions.push({ name: m[1], line: L });
      const ps = paramsKotlinSwift(m[2]).map(expr).join(', ');
      js = m[4] ? `function ${m[1]}(${ps}) { __tick(); return ${expr(m[4])}; }` : `function ${m[1]}(${ps}) { __tick();`;
    } else if ((m = /^(?:(?:private|public|static|mutating|@discardableResult)\s+)*func\s+(\w+)\s*\((.*)\)\s*(async\s*)?(?:throws\s*)?(?:->\s*[^{]+)?\{$/.exec(rest)) && lang === 'swift') {
      meta.functions.push({ name: m[1], line: L });
      js = `${m[3] ? 'async ' : ''}function ${m[1]}(${paramsKotlinSwift(m[2]).map(expr).join(', ')}) { __tick();`;
    } else if (/^for\b/.test(rest)) {
      if (lang === 'swift' && (m = /^for\s+(.+?)\s+in\s+(.+?)\s*\{$/.exec(rest))) {
        js = `for (let ${loopVar(m[1])} of ${iterExpr(m[2], lang, expr)}) { __tick();`;
      } else if ((m = /^for\s*\((.+)\)\s*\{$/.exec(rest))) {
        const inner = m[1];
        let km;
        if (lang === 'kotlin' && (km = /^(\(.*?\)|\w+)\s+in\s+(.+)$/.exec(inner))) {
          js = `for (let ${loopVar(km[1])} of ${iterExpr(km[2], lang, expr)}) { __tick();`;
        } else if ((km = /^(?:final\s+)?([\w<>[\]]+)\s+(\w+)\s*:\s*(.+)$/.exec(inner)) && !inner.includes(';')) {
          js = `for (let ${km[2]} of __iter(${expr(km[3])})) { __tick();`;
        } else {
          const parts = inner.split(';');
          if (parts.length !== 3) throw new ForgeSyntaxError(syntaxMsg(lang, 'cabecera de for no válida'), L, 1, 'Formato: for (inicio; condición; incremento)');
          let init = parts[0].trim();
          const im = /^(?:const\s+)?([\w<>*]+(?:\s+\w+)?)\s+(\w+\s*=.*)$/.exec(init);
          if (im && isTypeToken(im[1], lang)) init = `let ${im[2]}`;
          js = `for (${expr(init)}; ${expr(parts[1])}; ${expr(parts[2])}) { __tick();`;
        }
      } else throw new ForgeSyntaxError(syntaxMsg(lang, 'cabecera de for no reconocida'), L, 1, 'Revisa la sintaxis del bucle for.');
    } else if ((m = /^while\s*(.+?)\s*\{$/.exec(rest))) {
      js = `while (${expr(m[1].replace(/^\((.*)\)$/, '$1'))}) { __tick();`;
    } else if (/^(do|repeat)\s*\{$/.test(rest)) {
      js = 'do { __tick();';
    } else if ((m = /^while\s*(.+?);?$/.exec(rest)) && closers) {
      js = `while (${expr(m[1].replace(/^\((.*)\)$/, '$1'))});`;
    } else if ((m = /^(else\s+)?if\s*(.+?)\s*\{$/.exec(rest))) {
      let cond = m[2];
      if (lang === 'java' || lang === 'c' || lang === 'kotlin') cond = cond.replace(/^\((.*)\)$/, '$1');
      js = `${m[1] ? 'else ' : ''}if (${expr(cond)}) {`;
    } else if ((m = /^guard\s+(.+?)\s+else\s*\{$/.exec(rest))) {
      js = `if (!(${expr(m[1])})) {`;
    } else if (/^else\s*\{$/.test(rest)) {
      js = 'else {';
    } else if (/^when\b/.test(rest) || /^switch\b/.test(rest)) {
      throw new ForgeSyntaxError(syntaxMsg(lang, `'${rest.split(/\W/)[0]}' aún no está soportado por el Forge VM`), L, 1, 'Usa una cadena de if / else if.');
    } else if ((m = /^(?:(?:private|public)\s+)?(val|var|let)\s+(\w+)\s*(?::\s*([^=]+?))?\s*(?:=\s*(.+?))?;?$/.exec(rest)) && (lang === 'kotlin' || lang === 'swift')) {
      const type = m[3] ? m[3].trim() : null;
      meta.decls[L] = { type, name: m[2], expr: m[4] || '', mutable: m[1] === 'var' };
      js = `let ${m[2]} = __decl(${type ? `'${type.replace(/'/g, '')}'` : 'null'}, '${m[2]}', ${m[4] ? `(${expr(m[4])})` : 'undefined'}, ${L});`;
    } else if ((m = /^(?:(?:final|const|static|volatile|register)\s+)*((?:struct\s+)?[A-Za-z_][\w]*(?:\s*<[^=;]*>)?(?:\s*\[\s*\])*)\s*(\**)\s*([A-Za-z_]\w*)\s*((?:\[[^\]]*\])*)\s*(?:=\s*(.+?))?;$/.exec(rest))
      && (lang === 'java' || lang === 'c') && isTypeToken(m[1], lang) && !/^(return|new)$/.test(m[3])) {
      const baseType = m[1].replace(/\s+/g, '');
      const type = baseType + m[2];
      const name = m[3];
      const dims = m[4];
      let init = m[5];
      meta.decls[L] = { type: type + (dims ? '[]' : ''), name, expr: init || '' };
      if (init && /^\{.*\}$/.test(init)) init = `[${init.slice(1, -1)}]`;
      if (dims) {
        const size = /\[([^\]]*)\]/.exec(dims)[1].trim();
        js = `let ${name} = __carr('${baseType}', ${init ? expr(init) : 'null'}, ${size ? expr(size) : 'null'}, ${L});`;
      } else {
        js = `let ${name} = __decl('${type}', '${name}', ${init ? `(${expr(init)})` : 'undefined'}, ${L});`;
      }
    } else if (/^(?:(?:public|private|protected|abstract|final|open|data)\s+)*(class|struct|interface|typedef|enum|protocol|actor)\b/.test(rest)) {
      throw new ForgeSyntaxError(syntaxMsg(lang, 'las clases y structs se analizan en el Módulo 4'), L, 1, 'Resuelve esta misión con funciones y variables.');
    } else {
      js = expr(rest);
    }
    braceDepth += (rest.match(/\{/g) || []).length - (rest.match(/\}/g) || []).length;
    let line = (closerOut + js).trimEnd();
    if (line && !/[{};]$/.test(line) && !/^\s*}?\s*$/.test(line)) line += ';';
    out.push(pad + line);
  }
  return out;
}

/** Prefija cada sentencia con el número de línea para rastrear la ejecución. */
function instrumentLines(out) {
  let depth = 0;
  return out.map((line, i) => {
    const t = line.trim();
    const startDepth = depth;
    for (const ch of line) {
      if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') depth--;
    }
    if (!t || startDepth > 0) return line;
    const lead = /^(\s*(?:\}\s*)*)(.*)$/.exec(line);
    const body = lead[2];
    if (!body || /^(else|catch|finally|while\s*\(.*\);$)/.test(body) || /^[.+\-*/%&|?:)\]]/.test(body)) return line;
    return `${lead[1]}__S.l=${i + 1};${body}`;
  });
}

/** Solo comprobación sintáctica (para misiones de análisis estático). */
export function syntaxCheck(src, lang) {
  const clean = stripComments(src.replace(/\r\n?/g, '\n'), lang);
  const { code } = protectStrings(clean, lang);
  const lines = code.split('\n');
  checkBrackets(lines, lang);
  if (lang === 'python') checkPythonIndent(lines);
}

/**
 * Transpila código fuente del usuario a JS ejecutable por el runtime.
 * @returns {{ js: string, meta: { functions: Array, decls: Object } }}
 */
export function transpile(src, lang, { mode = 'run' } = {}) {
  const meta = { functions: [], decls: {} };
  const clean = stripComments(src.replace(/\r\n?/g, '\n'), lang);
  const { code, table } = protectStrings(clean, lang);
  const lines = code.split('\n');
  checkBrackets(lines, lang);
  if (lang === 'python') checkPythonIndent(lines);
  else checkStatements(lines, lang);
  const out = lang === 'python' ? translatePython(lines, meta) : translateCFamily(lines.slice(), lang, meta, mode);
  const exprFn = (e) => EXPR[lang](e);
  const js = restoreStrings(instrumentLines(out).join('\n'), table, lang, exprFn);
  return { js, meta };
}
