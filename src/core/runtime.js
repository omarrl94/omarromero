// Forge VM · runtime
// Ejecuta el JS producido por el transpilador con un entorno instrumentado:
// tipos con rango real (overflow), contador de operaciones (Big O), arrays vigilados,
// heap simulado para C (malloc/free) y errores traducidos al idioma de cada lenguaje.

import { transpile, ForgeSyntaxError, sourceFile } from './transpiler.js';

// ───────────────────────── Tipos ─────────────────────────

const INT = (bits, signed = true) => ({ kind: 'int', bits, signed });
const TYPES = {
  // 32 bits
  int: INT(32), Integer: INT(32), Int: INT(32), Int32: INT(32), int32_t: INT(32), uint32_t: INT(32, false),
  // 64 bits
  long: INT(64), Long: INT(64), Int64: INT(64), int64_t: INT(64), uint64_t: INT(64, false), size_t: INT(64, false),
  // pequeños
  short: INT(16), Short: INT(16), int16_t: INT(16), byte: INT(8), Byte: INT(8), int8_t: INT(8), uint8_t: INT(8, false),
  // coma flotante
  float: { kind: 'float' }, double: { kind: 'float' }, Float: { kind: 'float' }, Double: { kind: 'float' },
  // lógicos y texto
  boolean: { kind: 'bool' }, bool: { kind: 'bool' }, Boolean: { kind: 'bool' }, Bool: { kind: 'bool' },
  String: { kind: 'str' }, str: { kind: 'str' }, 'char*': { kind: 'str' }, 'char[]': { kind: 'str' },
  char: { kind: 'char' }, Char: { kind: 'char' }, Character: { kind: 'char' },
};

/** Tipo efectivo de una declaración, resolviendo particularidades de cada lenguaje. */
export function typeInfo(type, lang) {
  if (!type) return null;
  const t = type.trim();
  if (lang === 'swift' && t === 'Int') return INT(64);
  if (lang === 'python' && t === 'int') return { kind: 'int', bits: Infinity, signed: true };
  if (lang === 'python' && t === 'float') return { kind: 'float' };
  if (/\*$/.test(t) && t !== 'char*') return { kind: 'ptr' };
  if (/\[\]$|^\[|List|Array|list/.test(t)) return { kind: 'list' };
  if (/Map|dict|\[\w+\s*:/.test(t)) return { kind: 'map' };
  if (/Set|set/.test(t)) return { kind: 'set' };
  return TYPES[t] || { kind: 'other' };
}

/** Infiere el tipo de un literal en lenguajes con inferencia (Python, Kotlin, Swift, var de Java). */
function inferType(expr, value, lang) {
  const e = (expr || '').trim();
  const py = lang === 'python';
  if (/^-?\d[\d_]*\.\d*(e-?\d+)?$/i.test(e) || /^-?\d+e-?\d+$/i.test(e)) return py ? 'float' : 'Double';
  if (/^-?\d[\d_]*[lL]$/.test(e)) return lang === 'kotlin' ? 'Long' : 'long';
  if (/^-?\d[\d_]*$/.test(e)) return py ? 'int' : lang === 'java' ? 'int' : 'Int';
  if (/^["'f]/.test(e)) return py ? 'str' : 'String';
  if (/^(True|False|true|false)$/.test(e)) return py ? 'bool' : lang === 'swift' ? 'Bool' : 'Boolean';
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return py ? 'int' : lang === 'swift' ? 'Int' : 'Int';
    return py ? 'float' : 'Double';
  }
  if (typeof value === 'string') return py ? 'str' : 'String';
  if (typeof value === 'boolean') return py ? 'bool' : 'Boolean';
  if (Array.isArray(value)) return py ? 'list' : 'List';
  if (value instanceof Set) return py ? 'set' : 'Set';
  if (value && typeof value === 'object') return py ? 'dict' : 'Map';
  return null;
}

const wrapInt = (v, bits, signed) => {
  if (bits >= 64) return v;
  const mod = 2 ** bits;
  let r = ((Math.trunc(v) % mod) + mod) % mod;
  if (signed && r >= mod / 2) r -= mod;
  return r;
};
const rangeOf = (bits, signed) => (signed ? [-(2 ** (bits - 1)), 2 ** (bits - 1) - 1] : [0, 2 ** bits - 1]);

const LANG_TYPE_NAMES = {
  java: { int32: 'int', int64: 'long' }, c: { int32: 'int', int64: 'long long' },
  kotlin: { int32: 'Int', int64: 'Long' }, swift: { int32: 'Int32', int64: 'Int64' }, python: { int32: 'int', int64: 'int' },
};

// ───────────────────────── Errores ─────────────────────────

export class ForgeRuntimeError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.forge = true;
    this.code = code;
    Object.assign(this, extra);
  }
}

const ERR = {
  index: (lang, i, len) => ({
    python: 'IndexError: list index out of range',
    java: `java.lang.ArrayIndexOutOfBoundsException: Index ${i} out of bounds for length ${len}`,
    kotlin: `java.lang.ArrayIndexOutOfBoundsException: Index ${i} out of bounds for length ${len}`,
    swift: 'Fatal error: Index out of range',
    c: `AddressSanitizer: stack-buffer-overflow — acceso a [${i}] en un array de ${len} elementos (comportamiento indefinido)`,
  })[lang],
  overflowTrap: () => 'Fatal error: Arithmetic overflow',
  timeout: (lang) => ({
    python: 'TimeoutError: el bucle no termina (¿condición de salida?)',
    java: 'java.util.concurrent.TimeoutException: el bucle no termina',
    kotlin: 'kotlinx.coroutines.TimeoutCancellationException: el bucle no termina',
    swift: 'Watchdog: el proceso no termina (bucle infinito)',
    c: 'Watchdog: proceso terminado por SIGKILL (bucle infinito)',
  })[lang],
};

const NAMES = {
  name: (lang, n) => ({
    python: `NameError: name '${n}' is not defined`,
    java: `error: cannot find symbol\n  symbol:   variable ${n}`,
    kotlin: `error: unresolved reference: ${n}`,
    swift: `error: cannot find '${n}' in scope`,
    c: `error: '${n}' undeclared (first use in this function)`,
  })[lang],
  nullRef: (lang, prop) => ({
    python: `AttributeError: 'NoneType' object has no attribute '${prop}'`,
    java: `java.lang.NullPointerException: Cannot read field "${prop}" because value is null`,
    kotlin: 'java.lang.NullPointerException',
    swift: 'Fatal error: Unexpectedly found nil while unwrapping an Optional value',
    c: 'Segmentation fault (core dumped) — desreferencia de puntero NULL',
  })[lang],
  notCallable: (lang, n) => ({
    python: `TypeError: '${n}' object is not callable`,
    java: `error: cannot find symbol\n  symbol:   method ${n}`,
    kotlin: `error: unresolved reference: ${n}`,
    swift: `error: cannot call value of non-function type '${n}'`,
    c: `error: called object '${n}' is not a function`,
  })[lang],
  recursion: (lang) => ({
    python: 'RecursionError: maximum recursion depth exceeded',
    java: 'java.lang.StackOverflowError',
    kotlin: 'java.lang.StackOverflowError',
    swift: 'EXC_BAD_ACCESS: stack overflow',
    c: 'Segmentation fault (core dumped) — stack overflow',
  })[lang],
};

let LINE_OFFSET = null;
function lineOffset() {
  if (LINE_OFFSET !== null) return LINE_OFFSET;
  try {
    new Function('__S', '__H', '"use strict";\nconst {} = __H; return (function () {\nthrow new Error("probe")\n})();')({}, {});
  } catch (e) {
    const m = /(?:<anonymous>|Function):(\d+):\d+/.exec(e.stack || '');
    LINE_OFFSET = m ? Number(m[1]) - 1 : 4;
  }
  return LINE_OFFSET;
}

function parseFrames(e, maxLine) {
  const frames = [];
  const off = lineOffset();
  for (const raw of String(e.stack || '').split('\n')) {
    let m = /at\s+(?:async\s+)?(?:(?:Object\.|Array\.)?([\w$]+)\s+\()?.*?<anonymous>:(\d+):(\d+)/.exec(raw)
      || /^([\w$]*)@.*Function:(\d+):(\d+)/.exec(raw);
    if (!m) continue;
    const line = Number(m[2]) - off;
    if (line < 1 || line > maxLine) continue;
    const fn = !m[1] || m[1] === 'anonymous' || m[1] === 'eval' ? null : m[1];
    frames.push({ fn, line });
  }
  return frames;
}

function frameLabel(fn, lang) {
  if (fn) return fn;
  return { python: '<module>', java: 'main', kotlin: 'main', swift: 'top-level', c: 'main' }[lang];
}

/** Construye un stack trace con el formato nativo de cada lenguaje. */
export function formatTrace(lang, message, frames) {
  const file = sourceFile(lang);
  const fr = frames.length ? frames : [{ fn: null, line: 0 }];
  switch (lang) {
    case 'python':
      return ['Traceback (most recent call last):', ...[...fr].reverse().map((f) => `  File "${file}", line ${f.line}, in ${frameLabel(f.fn, lang)}`), message].join('\n');
    case 'java':
    case 'kotlin': {
      const cls = lang === 'java' ? 'Main' : 'MainKt';
      const head = message.startsWith('error') ? message : `Exception in thread "main" ${message}`;
      return [head, ...fr.map((f) => `\tat ${cls}.${frameLabel(f.fn, lang)}(${file}:${f.line})`)].join('\n');
    }
    case 'swift':
      return [`${file}:${fr[0].line}: ${message}`, ...fr.map((f, i) => `${i} main  ${frameLabel(f.fn, lang)} + ${f.line * 4} (${file}:${f.line})`)].join('\n');
    default:
      return [`==1==ERROR: ${message}`, ...fr.map((f, i) => `    #${i} in ${frameLabel(f.fn, lang)} ${file}:${f.line}`)].join('\n');
  }
}

function normalizeError(e, lang, S, maxLine) {
  let frames = parseFrames(e, maxLine);
  if (!frames.length && S.l) frames = [{ fn: null, line: S.l }];
  const line = e.line || frames[0]?.line || S.l || null;
  let message;
  let code = e.code || 'runtime';
  if (e.forge) message = e.message;
  else if (e instanceof RangeError && /call stack/i.test(e.message)) { code = 'recursion'; message = NAMES.recursion(lang); }
  else if (e instanceof ReferenceError) {
    const n = (/^(\S+) is not defined/.exec(e.message) || [])[1] || '?';
    code = 'name';
    message = NAMES.name(lang, n);
  } else if (e instanceof TypeError && /Cannot (?:read|set) properties of (?:undefined|null) \(reading '([^']*)'\)|null|undefined/.test(e.message)) {
    const prop = (/\((?:reading|setting) '([^']*)'\)/.exec(e.message) || [])[1] || '?';
    code = 'null';
    message = NAMES.nullRef(lang, prop);
  } else if (e instanceof TypeError && /is not a function/.test(e.message)) {
    const n = (/(\S+) is not a function/.exec(e.message) || [])[1] || '?';
    code = 'call';
    message = NAMES.notCallable(lang, n.replace(/^.*\./, ''));
  } else if (e instanceof SyntaxError) {
    code = 'syntax';
    message = 'error: construcción que el Forge VM no reconoce';
  } else message = `${e.name || 'Error'}: ${e.message}`;
  return {
    kind: code === 'syntax' || /^error/.test(message) ? 'compile' : 'runtime',
    code,
    message,
    line,
    frames,
    hint: e.hint || '',
    trace: formatTrace(lang, message, frames),
  };
}

// ───────────────────────── Prototipos de colección ─────────────────────────

let CUR = null; // estado de la ejecución activa
const tick = (n = 1) => {
  if (!CUR) return;
  CUR.ticks += n;
  if (CUR.ticks > CUR.maxTicks) throw new ForgeRuntimeError('timeout', ERR.timeout(CUR.lang));
};

const DictProto = Object.create(null);
let protoInstalled = false;
function installProtos() {
  if (protoInstalled) return;
  protoInstalled = true;
  const def = (proto, name, fn) => Object.defineProperty(proto, name, { value: fn, enumerable: false, configurable: true, writable: true });
  const numSort = (a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b)));
  const sortCost = (n) => tick(Math.ceil(n * Math.log2(Math.max(2, n))));
  def(Array.prototype, '__size', function () { return this.length; });
  def(Array.prototype, '__isEmpty', function () { return this.length === 0; });
  def(Array.prototype, '__add', function (x) { this.push(x); return true; });
  def(Array.prototype, '__get', function (i, d) { const v = this[i]; return v === undefined && d !== undefined ? d : v; });
  def(Array.prototype, '__has', function (x) { tick(this.length); return this.includes(x); });
  def(Array.prototype, '__sort', function () { sortCost(this.length); const s = [...this].sort(numSort); s.forEach((v, i) => { this[i] = v; }); return this; });
  def(Array.prototype, '__sorted', function () { sortCost(this.length); return [...this].sort(numSort); });
  def(Array.prototype, '__indices', function () { return [...this.keys()]; });
  def(Array.prototype, '__eq', function (o) { return this === o; });
  def(Array.prototype, 'swapAt', function (i, j) { const t = this[i]; this[i] = this[j]; this[j] = t; });
  def(Set.prototype, '__size', function () { return this.size; });
  def(Set.prototype, '__isEmpty', function () { return this.size === 0; });
  def(Set.prototype, '__add', function (x) { const had = this.has(x); this.add(x); return !had; });
  def(Set.prototype, '__has', function (x) { return this.has(x); });
  def(String.prototype, '__size', function () { return this.length; });
  def(String.prototype, '__isEmpty', function () { return this.length === 0; });
  def(String.prototype, '__has', function (x) { return this.includes(x); });
  def(String.prototype, '__eq', function (o) { return String(this) === String(o); });
  def(String.prototype, '__toInt', function () { return parseInt(this, 10); });
  def(Number.prototype, '__toInt', function () { return Math.trunc(this); });
  def(Number.prototype, '__eq', function (o) { return Number(this) === o; });
  def(DictProto, '__get', function (k, d) { return Object.prototype.hasOwnProperty.call(this, k) ? this[k] : d === undefined ? null : d; });
  def(DictProto, '__put', function (k, v) { this[k] = v; return v; });
  def(DictProto, '__has', function (k) { return Object.prototype.hasOwnProperty.call(this, k); });
  def(DictProto, '__size', function () { return Object.keys(this).length; });
  def(DictProto, '__isEmpty', function () { return Object.keys(this).length === 0; });
  def(DictProto, 'getOrDefault', function (k, d) { return this.__get(k, d); });
  def(DictProto, 'toString', function () { return JSON.stringify({ ...this }); });
}

const isDict = (o) => o && typeof o === 'object' && Object.getPrototypeOf(o) === DictProto;

export function dictToObject(d) {
  if (!d) return {};
  if (d instanceof Map) return Object.fromEntries(d);
  return { ...d };
}

// ───────────────────────── Formateo de salida ─────────────────────────

function fmt(v, lang, nested = false) {
  const py = lang === 'python';
  if (v === null || v === undefined) return py ? 'None' : lang === 'swift' ? 'nil' : 'null';
  if (typeof v === 'boolean') return py ? (v ? 'True' : 'False') : String(v);
  if (typeof v === 'string') return nested ? (py ? `'${v}'` : lang === 'swift' ? `"${v}"` : v) : v;
  if (typeof v === 'number') {
    if (py && !Number.isInteger(v)) return String(v);
    return String(v);
  }
  if (Array.isArray(v)) {
    if (v.__block) return `0x${v.__block.addr.toString(16)}`;
    if (lang === 'java' && !nested) return `[I@${(v.length * 2654435761 >>> 0).toString(16).slice(0, 7)}`;
    return `[${v.map((x) => fmt(x, lang, true)).join(', ')}]`;
  }
  if (v instanceof Set) return py ? `{${[...v].map((x) => fmt(x, lang, true)).join(', ')}}` : `[${[...v].map((x) => fmt(x, lang, true)).join(', ')}]`;
  if (isDict(v)) {
    const ents = Object.entries(v);
    if (py) return `{${ents.map(([k, x]) => `'${k}': ${fmt(x, lang, true)}`).join(', ')}}`;
    if (lang === 'swift') return `[${ents.map(([k, x]) => `"${k}": ${fmt(x, lang, true)}`).join(', ')}]`;
    return `{${ents.map(([k, x]) => `${k}=${fmt(x, lang, true)}`).join(', ')}}`;
  }
  if (typeof v === 'function') return `<function ${v.name}>`;
  return String(v);
}

function cprintf(format, args) {
  let i = 0;
  return String(format).replace(/%([-+ 0#]*)(\d*)(?:\.(\d+))?(hh|h|ll|l|z)?([diufFeEgGxXscp%])/g, (m, flags, width, prec, len, conv) => {
    if (conv === '%') return '%';
    const a = args[i++];
    let s;
    switch (conv) {
      case 'd': case 'i': case 'u': s = String(Math.trunc(Number(a))); break;
      case 'f': case 'F': s = Number(a).toFixed(prec !== undefined ? Number(prec) : 6); break;
      case 'e': case 'E': s = Number(a).toExponential(prec !== undefined ? Number(prec) : 6); break;
      case 'g': case 'G': s = String(Number(a)); break;
      case 'x': case 'X': s = (Number(a) >>> 0).toString(16); if (conv === 'X') s = s.toUpperCase(); break;
      case 'c': s = typeof a === 'number' ? String.fromCharCode(a) : String(a); break;
      case 'p': s = a && a.__block ? `0x${a.__block.addr.toString(16)}` : '(nil)'; break;
      default: s = a && a.__block ? '[heap]' : String(a);
    }
    if (width && s.length < Number(width)) s = flags.includes('-') ? s.padEnd(Number(width)) : s.padStart(Number(width), flags.includes('0') ? '0' : ' ');
    return s;
  });
}

// ───────────────────────── Arrays vigilados ─────────────────────────

/**
 * Envuelve un array en un Proxy que registra lecturas/escrituras (para animar)
 * y aplica la semántica de índices de cada lenguaje (IndexError, OOB, UB…).
 */
function makeTracked(arr, label, S) {
  const lang = S.lang;
  const log = (ev) => { if (S.events.length < 20000) S.events.push(ev); };
  return new Proxy(arr, {
    get(target, key, recv) {
      if (key === '__tracked') return label;
      if (typeof key === 'string' && /^-?\d+$/.test(key)) {
        let i = Number(key);
        if (lang === 'python' && i < 0) i += target.length;
        if (i < 0 || i >= target.length) {
          log({ op: 'oob', label, i, line: S.l });
          throw new ForgeRuntimeError('index', ERR.index(lang, Number(key), target.length), { index: Number(key), length: target.length });
        }
        S.reads++;
        log({ op: 'get', label, i, line: S.l });
        return target[i];
      }
      return Reflect.get(target, key, recv);
    },
    set(target, key, value) {
      if (typeof key === 'string' && /^-?\d+$/.test(key)) {
        let i = Number(key);
        if (lang === 'python' && i < 0) i += target.length;
        if (i < 0 || i >= target.length) {
          if (lang === 'python' || lang === 'c' || lang === 'swift' || lang === 'java' || lang === 'kotlin') {
            log({ op: 'oob', label, i, line: S.l });
            throw new ForgeRuntimeError('index', ERR.index(lang, Number(key), target.length), { index: Number(key), length: target.length });
          }
        }
        S.writes++;
        log({ op: 'set', label, i, v: value, line: S.l });
        target[i] = value;
        return true;
      }
      target[key] = value;
      return true;
    },
  });
}

// ───────────────────────── Heap simulado (C) ─────────────────────────

function makeHeap(S) {
  const heap = { blocks: [], next: 0x5000, events: [] };
  const ev = (e) => heap.events.push({ ...e, line: S.l, t: heap.events.length });
  function ptrProxy(block) {
    const data = new Array(Math.max(1, Math.floor(block.size / 4))).fill(0);
    block.data = data;
    return new Proxy(data, {
      get(target, key, recv) {
        if (key === '__block') return block;
        if (typeof key === 'string' && /^-?\d+$/.test(key)) {
          const i = Number(key);
          if (block.freed) {
            ev({ op: 'uaf', id: block.id, i });
            throw new ForgeRuntimeError('uaf', `AddressSanitizer: heap-use-after-free READ en 0x${(block.addr + i * block.elem).toString(16)} (bloque #${block.id} liberado en la línea ${block.freedLine})`, { block: block.id });
          }
          if (i < 0 || i >= block.len) {
            ev({ op: 'overflow', id: block.id, i });
            throw new ForgeRuntimeError('heapoverflow', `AddressSanitizer: heap-buffer-overflow READ [${i}] — el bloque #${block.id} solo tiene ${block.len} elementos`, { block: block.id });
          }
          return target[i];
        }
        return Reflect.get(target, key, recv);
      },
      set(target, key, value) {
        if (typeof key === 'string' && /^-?\d+$/.test(key)) {
          const i = Number(key);
          if (block.freed) {
            ev({ op: 'uaf', id: block.id, i });
            throw new ForgeRuntimeError('uaf', `AddressSanitizer: heap-use-after-free WRITE en 0x${(block.addr + i * block.elem).toString(16)} (bloque #${block.id} liberado en la línea ${block.freedLine})`, { block: block.id });
          }
          if (i < 0 || i >= block.len) {
            ev({ op: 'overflow', id: block.id, i });
            throw new ForgeRuntimeError('heapoverflow', `AddressSanitizer: heap-buffer-overflow WRITE [${i}] — el bloque #${block.id} solo tiene ${block.len} elementos`, { block: block.id });
          }
          target[i] = value;
          ev({ op: 'write', id: block.id, i, v: value });
          return true;
        }
        target[key] = value;
        return true;
      },
    });
  }
  heap.malloc = (bytes, zero = false) => {
    bytes = Math.max(0, Math.trunc(Number(bytes)));
    if (!Number.isFinite(bytes) || bytes > 1 << 24) throw new ForgeRuntimeError('oom', `malloc(${bytes}): Cannot allocate memory`);
    const block = { id: heap.blocks.length + 1, addr: heap.next, size: bytes, elem: 4, len: Math.floor(bytes / 4), freed: false, line: S.l, zero };
    heap.next += Math.ceil(bytes / 16) * 16 + 16;
    heap.blocks.push(block);
    ev({ op: 'malloc', id: block.id, size: bytes });
    tick();
    return ptrProxy(block);
  };
  heap.free = (p) => {
    if (p === null || p === undefined || p === 0) return;
    const block = p.__block;
    if (!block) throw new ForgeRuntimeError('invalidfree', 'free(): invalid pointer — ese puntero no viene de malloc');
    if (block.freed) {
      ev({ op: 'doublefree', id: block.id });
      throw new ForgeRuntimeError('doublefree', `free(): double free detected — el bloque #${block.id} ya se liberó en la línea ${block.freedLine}`, { block: block.id });
    }
    block.freed = true;
    block.freedLine = S.l;
    ev({ op: 'free', id: block.id });
  };
  heap.retype = (p, elem) => {
    const block = p && p.__block;
    if (!block) return;
    block.elem = elem;
    block.len = Math.floor(block.size / elem);
    block.data.length = Math.max(1, block.len);
    block.data.fill(0);
  };
  return heap;
}

// ───────────────────────── Ejecución ─────────────────────────

function* rangeGen(a, b, s = 1) {
  if (b === undefined) { b = a; a = 0; }
  if (s === 0) throw new ForgeRuntimeError('value', 'ValueError: range() arg 3 must not be zero');
  if (s > 0) for (let i = a; i < b; i += s) yield i;
  else for (let i = a; i > b; i += s) yield i;
}

function buildHelpers(S, meta) {
  const lang = S.lang;
  const out = (s) => { if (S.output.length < 400) S.output.push(s); };
  const H = {
    print: (...a) => out(a.map((x) => fmt(x, lang)).join(lang === 'python' ? ' ' : '')),
    printf: (f, ...a) => {
      const s = cprintf(f, a);
      const parts = (S.partial + s).split('\n');
      S.partial = parts.pop();
      parts.forEach(out);
    },
    __tick: () => tick(),
    __range: (a, b, s) => rangeGen(a, b, s),
    __rangeIncl: (a, b, s = 1) => rangeGen(a, s > 0 ? b + 1 : b - 1, s),
    __iter: (x) => {
      if (x === null || x === undefined) throw new ForgeRuntimeError('type', lang === 'python' ? "TypeError: 'NoneType' object is not iterable" : 'NullPointerException: iteración sobre null');
      if (typeof x === 'number') throw new ForgeRuntimeError('type', lang === 'python' ? "TypeError: 'int' object is not iterable" : 'error: un número no es iterable');
      if (isDict(x)) return Object.keys(x);
      return x;
    },
    __enumerate: function* (x) { let i = 0; for (const v of H.__iter(x)) yield [i++, v]; },
    __items: (d) => Object.entries(d),
    __keys: (d) => Object.keys(d),
    __values: (d) => Object.values(d),
    __in: (x, c) => {
      if (Array.isArray(c) || typeof c === 'string') { tick(c.length); return c.includes(x); }
      if (c instanceof Set || c instanceof Map) return c.has(x);
      if (c && typeof c === 'object') return Object.prototype.hasOwnProperty.call(c, x);
      return false;
    },
    __arr: (n, fill = 0) => { tick(Math.min(n, 1e5) / 50); return new Array(Math.max(0, Math.trunc(n))).fill(fill); },
    __listOf: (...xs) => xs,
    __setOf: (...xs) => new Set(xs),
    __dict: (o) => Object.assign(Object.create(DictProto), o || {}),
    __sortArr: (a) => a.__sort(),
    __str: (a) => fmt(a, lang, true),
    __i64: (x) => Math.trunc(Number(x)),
    __i32: (x) => {
      const v = Math.trunc(Number(x));
      if (v > 2147483647 || v < -2147483648) throw new ForgeRuntimeError('overflow', 'Fatal error: Not enough bits to represent the passed value');
      return v;
    },
    __deref: (p) => (p === null || p === undefined ? (() => { throw new ForgeRuntimeError('null', NAMES.nullRef('c', '*')); })() : p[0]),
    __sizeof: () => 16,
    len: (x) => (x == null ? (() => { throw new ForgeRuntimeError('type', "TypeError: object of type 'NoneType' has no len()"); })() : x instanceof Set ? x.size : isDict(x) ? Object.keys(x).length : x.length),
    sorted: (x) => [...H.__iter(x)].__sorted(),
    min: (...a) => (a.length === 1 ? Math.min(...H.__iter(a[0])) : Math.min(...a)),
    max: (...a) => (a.length === 1 ? Math.max(...H.__iter(a[0])) : Math.max(...a)),
    abs: Math.abs,
    sum: (x) => { const arr = [...H.__iter(x)]; tick(arr.length); return arr.reduce((s, v) => s + v, 0); },
    int: (x) => { const v = typeof x === 'string' ? parseInt(x, 10) : Math.trunc(x); if (Number.isNaN(v)) throw new ForgeRuntimeError('value', `ValueError: invalid literal for int() with base 10: '${x}'`); return v; },
    float: (x) => { const v = Number(x); if (Number.isNaN(v)) throw new ForgeRuntimeError('value', `ValueError: could not convert string to float: '${x}'`); return v; },
    str: (x) => fmt(x, lang),
    bool: (x) => Boolean(x),
    list: (x) => [...H.__iter(x)],
    set: (x) => new Set(x ? H.__iter(x) : []),
    round: (x, d = 0) => Number(Number(x).toFixed(d)),
    String: (x) => fmt(x, lang),
    Math,
    malloc: (b) => S.heap.malloc(b),
    calloc: (n, s) => S.heap.malloc(n * s, true),
    free: (p) => S.heap.free(p),
    memset: (p, v, n) => { for (let i = 0; i < p.length && i < n / 4; i++) p[i] = v; return p; },
    qsort: (a, n) => { const s = a.slice(0, n).__sorted(); s.forEach((v, i) => { a[i] = v; }); },
    __carr: (type, init, size, line) => {
      let arr;
      if (init !== null && init !== undefined && typeof init === 'string') arr = init;
      else {
        const n = size ?? (init ? init.length : 0);
        const fill = /bool/.test(type) ? false : 0;
        arr = new Array(Math.max(0, n)).fill(fill);
        if (init) init.forEach((v, i) => { if (i < arr.length) arr[i] = v; });
      }
      const name = meta.decls[line]?.name;
      if (name) S.vars[name] = { type: `${type}[]`, kind: 'list', value: arr, line };
      return arr;
    },
    __decl: (type, name, value, line) => declare(S, meta, type, name, value, line),
  };
  // Alias por lenguaje.
  H.println = H.print;
  return H;
}

/** Declaración tipada: aplica rangos reales, promociones y traps de cada lenguaje. */
function declare(S, meta, type, name, value, line) {
  const lang = S.lang;
  const d = meta.decls[line] || { expr: '' };
  const exprSrc = d.expr || '';
  let declType = type || inferType(exprSrc, value, lang);
  if (!type && typeof value === 'number' && lang !== 'python') {
    // Inferencia por operandos: Int32 * Int32 sigue siendo Int32 (Kotlin/Swift/var de Java).
    const opTypes = (exprSrc.match(/[A-Za-z_]\w*/g) || []).filter((x) => S.vars[x] && S.vars[x].kind === 'int').map((x) => S.vars[x].type);
    if (/Int64\(|\.toLong\(\)|\(\s*long\s*\)|\d[lL]\b/.test(exprSrc)) declType = { swift: 'Int64', kotlin: 'Long', java: 'long', c: 'int64_t' }[lang];
    else if (opTypes.length && Number.isInteger(value) && !/\d\.\d/.test(exprSrc)) {
      declType = opTypes.reduce((a, b) => ((typeInfo(b, lang).bits || 0) > (typeInfo(a, lang).bits || 0) ? b : a));
    }
  }
  const info = typeInfo(declType, lang) || { kind: 'other' };
  const rec = { name, type: declType, declared: !!type, kind: info.kind, line, expr: exprSrc, raw: value, value, flags: [] };
  if (value === undefined) {
    value = info.kind === 'int' || info.kind === 'float' ? 0 : info.kind === 'bool' ? false : null;
    rec.value = value;
    rec.uninit = true;
  }
  if (info.kind === 'set' && Array.isArray(value)) value = new Set(value);
  if (info.kind === 'ptr' && value && value.__block) {
    const elem = /^(?:char|bool|int8_t|uint8_t)\*/.test(declType) ? 1 : /^(?:double|long|int64_t|uint64_t|size_t)\*/.test(declType) ? 8 : /^short\*/.test(declType) ? 2 : 4;
    S.heap.retype(value, elem);
    rec.block = value.__block.id;
    rec.display = `0x${value.__block.addr.toString(16)}`;
  }
  if (info.kind === 'int' && typeof value === 'number') {
    if (!Number.isInteger(value) && lang !== 'python' && /\//.test(exprSrc) && !/\d\.\d|\(\s*(double|float)\s*\)|Double\(|toDouble/.test(exprSrc)) {
      value = Math.trunc(value); // división entera: int / int trunca hacia cero
    }
    if (!Number.isInteger(value)) {
      if (lang === 'c') { rec.flags.push('truncated'); value = Math.trunc(value); }
      else if (lang !== 'python') {
        const from = lang === 'java' ? 'double' : 'Double';
        throw new ForgeRuntimeError('type', lang === 'java'
          ? `error: incompatible types: possible lossy conversion from ${from} to ${declType}`
          : lang === 'kotlin' ? `error: the floating-point literal does not conform to the expected type ${declType}`
            : `error: cannot convert value of type 'Double' to specified type '${declType}'`, { line, hint: 'Un tipo entero no puede guardar decimales.' });
      }
    }
    if (info.bits !== Infinity) {
      const ids = (exprSrc.match(/[A-Za-z_]\w*/g) || []).filter((x) => S.vars[x]);
      const widened = /\(\s*(long|int64_t|long long|double)\s*\)|\.toLong\(\)|Int64\(|\d[lL]\b|\bL\b/.test(exprSrc)
        || ids.some((x) => (typeInfo(S.vars[x].type, lang) || {}).bits >= 64);
      const narrowOps = ids.length > 0 && ids.every((x) => (typeInfo(S.vars[x].type, lang) || {}).bits === 32);
      if (lang === 'swift' && info.bits === 64 && narrowOps && !widened && /[*+-]/.test(exprSrc)) {
        throw new ForgeRuntimeError('type', `error: cannot convert value of type 'Int32' to specified type '${declType}'`, { line, hint: 'Swift no convierte tipos numéricos de forma implícita: usa Int64(valor).' });
      }
      if (info.bits >= 64 && narrowOps && !widened && /\*|\+/.test(exprSrc) && lang !== 'swift') {
        // La operación se evaluó en 32 bits ANTES de ampliarse: el clásico bug de promoción.
        const wrapped = wrapInt(value, 32, true);
        if (wrapped !== value) {
          rec.flags.push('promotion');
          rec.overflow = true;
          value = wrapped;
        }
      }
      const [lo, hi] = rangeOf(info.bits, info.signed);
      if (value > hi || value < lo) {
        const literal = /^-?[\d_]+[lL]?$/.test(exprSrc.trim());
        if (literal && lang !== 'c') {
          throw new ForgeRuntimeError('type', lang === 'java' ? 'error: integer number too large'
            : lang === 'kotlin' ? `error: the integer literal does not conform to the expected type ${declType}`
              : `error: integer literal '${exprSrc.trim()}' overflows when stored into '${declType}'`, { line });
        }
        if (lang === 'swift') {
          throw new ForgeRuntimeError('overflow', ERR.overflowTrap(), { line, hint: 'Swift detiene el programa antes de corromper datos: es seguro por diseño.' });
        }
        rec.flags.push('overflow');
        rec.overflow = true;
        value = wrapInt(value, info.bits, info.signed);
      }
    }
  }
  rec.value = value;
  rec.typeName = LANG_TYPE_NAMES[lang] ? declType : declType;
  S.vars[name] = rec;
  return value;
}

/**
 * Compila y ejecuta un programa.
 * @param {object} opts
 * @param {string} opts.code     código fuente del usuario
 * @param {string} opts.lang     python | java | kotlin | swift | c
 * @param {(ctx) => any} [opts.invoke]  llamada a la función de entrada de la misión
 * @param {number} [opts.maxTicks]
 */
export function runProgram({ code, lang, invoke, api, maxTicks = 3e6, callMain = true }) {
  installProtos();
  const S = { lang, l: 0, ticks: 0, maxTicks, reads: 0, writes: 0, output: [], partial: '', vars: {}, events: [], heap: null };
  S.heap = makeHeap(S);
  const started = performance.now();
  const result = { state: S, ok: false, output: S.output, vars: S.vars, events: S.events, heap: S.heap, error: null, value: undefined, fns: {}, meta: null, ticks: 0 };
  let tr;
  try {
    tr = transpile(code, lang);
  } catch (e) {
    if (e instanceof ForgeSyntaxError) {
      result.error = { kind: 'syntax', code: 'syntax', message: e.message, line: e.line, col: e.col, frames: [{ fn: null, line: e.line }], hint: e.hint, trace: formatSyntax(lang, e) };
      return result;
    }
    throw e;
  }
  result.meta = tr.meta;
  result.js = tr.js;
  const maxLine = code.split('\n').length;
  const H = buildHelpers(S, tr.meta);
  if (api) Object.assign(H, api(S));
  const names = Object.keys(H).filter((k) => /^[A-Za-z_$][\w$]*$/.test(k) && !['String', 'Math'].includes(k));
  const fnNames = [...new Set(tr.meta.functions.map((f) => f.name))];
  const body = `"use strict";\nconst {${names.join(', ')}} = __H; return (function () {\n${tr.js}\n;return {${fnNames.map((n) => `${n}: typeof ${n} === 'function' ? ${n} : undefined`).join(', ')}}; })();`;
  const prev = CUR;
  CUR = S;
  try {
    let factory;
    try {
      factory = new Function('__S', '__H', body);
    } catch (e) {
      const line = locateSyntaxError(tr.js);
      result.error = {
        kind: 'syntax', code: 'syntax', line, frames: line ? [{ fn: null, line }] : [],
        message: syntaxMessage(lang),
        hint: 'El Forge VM no reconoce esa construcción. Revisa la línea marcada o usa la forma más simple.',
      };
      result.error.trace = formatSyntax(lang, { message: result.error.message, line: line || 1, col: 1 });
      return result;
    }
    const fns = factory(S, H) || {};
    result.fns = fns;
    if (callMain && lang !== 'python' && typeof fns.main === 'function') fns.main([]);
    if (invoke) {
      result.value = invoke({
        fns,
        lang,
        S,
        track: (arr, label = 'arr') => makeTracked(arr, label, S),
        resetTicks: () => { S.ticks = 0; },
        ticks: () => S.ticks,
        dict: (o) => H.__dict(o),
      });
    }
    if (S.partial) { S.output.push(S.partial); S.partial = ''; }
    result.ok = true;
  } catch (e) {
    if (S.partial) { S.output.push(S.partial); S.partial = ''; }
    result.error = normalizeError(e, lang, S, maxLine);
  } finally {
    CUR = prev;
  }
  result.ticks = S.ticks;
  result.elapsed = performance.now() - started;
  return result;
}

function syntaxMessage(lang) {
  return { python: 'SyntaxError: invalid syntax', java: 'error: illegal start of expression', kotlin: 'error: expecting an element', swift: 'error: expected expression', c: 'error: expected expression' }[lang];
}

/** Busca la primera línea que rompe la compilación compilando prefijos con cierres. */
function locateSyntaxError(js) {
  const lines = js.split('\n');
  const balance = (s) => {
    const st = [];
    for (const ch of s) {
      if ('([{'.includes(ch)) st.push(ch);
      else if (')]}'.includes(ch)) st.pop();
    }
    return st.reverse().map((c) => ({ '(': ')', '[': ']', '{': '}' }[c])).join('');
  };
  for (let i = 1; i <= lines.length; i++) {
    const chunk = lines.slice(0, i).join('\n');
    try {
      new Function(`"use strict";\n${chunk}\n${balance(chunk.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, ''))}`);
    } catch (e) {
      if (e instanceof SyntaxError && !/Unexpected end of input/.test(e.message)) return i;
    }
  }
  return null;
}

function formatSyntax(lang, e) {
  const file = sourceFile(lang);
  if (lang === 'python') return `  File "${file}", line ${e.line}\n${e.message}`;
  if (lang === 'java') return `${file}:${e.line}: ${e.message}`;
  return `${file}:${e.line}:${e.col || 1}: ${e.message}`;
}

/** Mide la complejidad empírica (pendiente log-log de operaciones frente a n). */
export function fitComplexity(samples) {
  const pts = samples.filter((s) => s.ops > 0 && s.n > 0);
  if (pts.length < 2) return { slope: 0, label: 'O(1)', cls: 'o1' };
  const xs = pts.map((p) => Math.log(p.n));
  const ys = pts.map((p) => Math.log(p.ops));
  const mx = xs.reduce((a, b) => a + b) / xs.length;
  const my = ys.reduce((a, b) => a + b) / ys.length;
  let num = 0;
  let den = 0;
  xs.forEach((x, i) => { num += (x - mx) * (ys[i] - my); den += (x - mx) ** 2; });
  const slope = den ? num / den : 0;
  let label = 'O(1)';
  let cls = 'o1';
  if (slope > 2.5) { label = 'O(n³)'; cls = 'n3'; }
  else if (slope > 1.6) { label = 'O(n²)'; cls = 'n2'; }
  else if (slope > 1.08) { label = 'O(n log n)'; cls = 'nlogn'; }
  else if (slope > 0.5) { label = 'O(n)'; cls = 'n'; }
  return { slope, label, cls };
}
