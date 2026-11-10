// Generador de niveles: cada nivel se describe UNA vez en una representación neutral
// (IR) y aquí se genera código idiomático para los 10 lenguajes. Así cada mundo tiene
// decenas de niveles con la misma calidad, verificados automáticamente.
import { camelToSnake } from '../core/languages.js';

// ───────────────────────── Constructores del IR ─────────────────────────
// Expresiones
export const num = (v) => ({ k: 'num', v });
export const bool = (v) => ({ k: 'bool', v });
export const V = (n) => ({ k: 'var', n });
export const B = (op, a, b) => ({ k: 'bin', op, a, b });
export const not = (e) => ({ k: 'not', e });
export const idx = (a, i) => ({ k: 'idx', a, i });
export const len = (a) => ({ k: 'len', a });
export const call = (f, ...args) => ({ k: 'call', f, args });
export const mget = (m, key) => ({ k: 'mget', m, key });
export const shas = (s, x) => ({ k: 'shas', s, x });
// Sentencias
export const let_ = (n, t, e, mut = false, bound = 0) => ({ k: 'let', n, t, e, mut, bound });
export const set = (n, e) => ({ k: 'set', n, e });
export const setIdx = (a, i, e) => ({ k: 'setIdx', a, i, e });
export const op = (n, o, e) => ({ k: 'op', n, o, e });
export const if_ = (c, then, els = null) => ({ k: 'if', c, then, els });
export const for_ = (n, from, to, body, incl = false) => ({ k: 'for', n, from, to, body, incl });
export const each = (n, a, body) => ({ k: 'each', n, a, body });
export const while_ = (c, body) => ({ k: 'while', c, body });
export const ret = (e = null) => ({ k: 'ret', e });
export const swap = (a, i, j) => ({ k: 'swap', a, i, j });
export const minc = (m, key) => ({ k: 'minc', m, key });
export const sadd = (s, x) => ({ k: 'sadd', s, x });
export const brk = () => ({ k: 'break' });
/** Función: params [[nombre, tipo]] con tipos int | bool | arr | arrMut; ret int | bool | void. */
export const fn = (name, params, retT, body) => ({ name, params, ret: retT, body });

// ───────────────────────── Utilidades ─────────────────────────
const PREC = { '||': 1, '&&': 2, '==': 3, '!=': 3, '<': 4, '<=': 4, '>': 4, '>=': 4, '+': 5, '-': 5, '*': 6, '/': 6, '%': 6 };
const ARITH = new Set(['+', '-', '*', '/', '%']);
const CMP = new Set(['==', '!=', '<', '<=', '>', '>=']);

function walk(stmts, cb) {
  for (const s of stmts) {
    cb(s);
    if (s.then) walk(s.then, cb);
    if (s.els) walk(s.els, cb);
    if (s.body) walk(s.body, cb);
  }
}
function exprUses(e, cb) {
  if (!e || typeof e !== 'object') return;
  cb(e);
  ['a', 'b', 'e', 'i', 'key', 'x'].forEach((k) => { if (e[k] && typeof e[k] === 'object') exprUses(e[k], cb); });
  (e.args || []).forEach((x) => exprUses(x, cb));
}
const usesKind = (f, kind) => {
  let found = false;
  walk(f.body, (s) => {
    if (s.k === kind || (s.k === 'let' && s.t === kind)) found = true;
    ['e', 'c', 'i', 'j', 'key', 'x', 'from', 'to'].forEach((k) => exprUses(s[k], (x) => { if (x.k === kind) found = true; }));
  });
  return found;
};

// ───────────────────────── Generador ─────────────────────────

class Gen {
  constructor(lang, f) {
    this.lang = lang;
    this.f = f;
    this.types = {};
    this.tmp = 0;
    f.params.forEach(([n, t]) => { this.types[n] = t; });
    this.arrParams = f.params.filter(([, t]) => t === 'arr' || t === 'arrMut').map(([n]) => n);
  }

  id(n) { return this.lang === 'python' || this.lang === 'rust' ? camelToSnake(n) : n; }
  /** Nombre de función: en C# los métodos van en PascalCase. */
  fid(n) { return this.lang === 'csharp' ? n[0].toUpperCase() + n.slice(1) : this.id(n); }
  lenName(a) { return this.arrParams.length === 1 && !this.types.n ? 'n' : `${a}Len`; }
  ind(level) { return (this.lang === 'js' ? '  ' : '    ').repeat(level); }
  get T() { return this.lang === 'python'; }

  boolLit(v) { return this.lang === 'python' ? (v ? 'True' : 'False') : v ? 'true' : 'false'; }

  /** Tipo Rust de una expresión: i32 | usize | bool. */
  rty(e) {
    switch (e.k) {
      case 'num': return 'lit';
      case 'bool': case 'not': case 'shas': return 'bool';
      case 'var': return this.types[e.n] === 'usize' ? 'usize' : this.types[e.n] === 'bool' ? 'bool' : 'i32';
      case 'len': return 'usize';
      case 'bin': {
        if (!ARITH.has(e.op)) return 'bool';
        const a = this.rty(e.a);
        const b = this.rty(e.b);
        if (a === 'lit') return b;
        if (b === 'lit') return a;
        return a === b ? a : 'i32';
      }
      default: return 'i32';
    }
  }

  /** Expresión en Rust con el tipo pedido (castea si hace falta). */
  rcast(e, want) {
    if (e.k === 'bin' && ARITH.has(e.op) && want === 'i32' && this.rty(e) === 'usize') return this.expr(e, 0, 'i32');
    const code = this.expr(e, 0, want);
    const ty = this.rty(e);
    if (want === 'usize' && ty === 'i32') return `${this.wrap(e, code)} as usize`;
    if (want === 'i32' && ty === 'usize') return `${this.wrap(e, code)} as i32`;
    return code;
  }
  wrap(e, code) { return e.k === 'bin' ? `(${code})` : code; }

  expr(e, parentPrec = 0, want = 'i32') {
    const L = this.lang;
    switch (e.k) {
      case 'num': return String(e.v);
      case 'bool': return this.boolLit(e.v);
      case 'var': return this.id(e.n);
      case 'not': return L === 'python' ? `not ${this.expr(e.e, 7)}` : `!${this.expr(e.e, 7)}`;
      case 'len': {
        const a = this.id(e.a);
        return { python: `len(${a})`, js: `${a}.length`, java: `${a}.length`, csharp: `${a}.Length`, kotlin: `${a}.size`, swift: `${a}.count`, c: this.lenName(e.a), cpp: `(int) ${a}.size()`, go: `len(${a})`, rust: `${a}.len()` }[L];
      }
      case 'idx': {
        const a = this.id(e.a);
        const i = L === 'rust' ? this.rcast(e.i, 'usize') : this.expr(e.i);
        return `${a}[${i}]`;
      }
      case 'call': {
        const args = e.args.map((x) => (L === 'rust' && this.rty(x) === 'usize' ? this.rcast(x, 'i32') : this.expr(x)));
        if (L === 'c') {
          // En C los arrays viajan con su longitud.
          const out = [];
          e.args.forEach((x, k) => { out.push(args[k]); if (x.k === 'var' && (this.types[x.n] === 'arr' || this.types[x.n] === 'arrMut')) out.push(this.lenName(x.n)); });
          return `${this.id(e.f)}(${out.join(', ')})`;
        }
        return `${this.fid(e.f)}(${args.join(', ')})`;
      }
      case 'mget': {
        const m = this.id(e.m);
        const k = L === 'rust' ? this.rcast(e.key, 'i32') : this.expr(e.key);
        return { python: `${m}.get(${k}, 0)`, js: `(${m}[${k}] ?? 0)`, java: `${m}.getOrDefault(${k}, 0)`, csharp: `${m}.GetValueOrDefault(${k})`, kotlin: `(${m}[${k}] ?: 0)`, swift: `${m}[${k}, default: 0]`, c: `${m}[${k}]`, cpp: `${m}[${k}]`, go: `${m}[${k}]`, rust: `*${m}.get(&${k}).unwrap_or(&0)` }[L];
      }
      case 'shas': {
        const s = this.id(e.s);
        const x = L === 'rust' ? this.rcast(e.x, 'i32') : this.expr(e.x);
        return { python: `${x} in ${s}`, js: `${s}.has(${x})`, java: `${s}.contains(${x})`, csharp: `${s}.Contains(${x})`, kotlin: `${x} in ${s}`, swift: `${s}.contains(${x})`, c: `${s}[${x}]`, cpp: `${s}.count(${x})`, go: `${s}[${x}]`, rust: `${s}.contains(&${x})` }[L];
      }
      case 'bin': {
        const p = PREC[e.op];
        let opS = e.op;
        if (L === 'python') opS = { '&&': 'and', '||': 'or', '/': '//' }[e.op] || e.op;
        if (L === 'js') opS = { '==': '===', '!=': '!==' }[e.op] || e.op;
        let a;
        let b;
        if (L === 'rust' && (ARITH.has(e.op) || CMP.has(e.op))) {
          const ta = this.rty(e.a);
          const tb = this.rty(e.b);
          let t = ta === 'lit' ? tb : tb === 'lit' ? ta : ta === tb ? ta : 'i32';
          if (ARITH.has(e.op) && want === 'i32' && t === 'usize') t = 'i32';
          const w = t === 'lit' ? want : t;
          a = this.rcastP(e.a, w, p);
          b = this.rcastP(e.b, w, p + 0.5);
        } else {
          a = this.expr(e.a, p);
          b = this.expr(e.b, p + 0.5);
        }
        let code = `${a} ${opS} ${b}`;
        if (L === 'js' && e.op === '/') code = `Math.floor(${a} / ${b})`;
        return p < parentPrec ? `(${code})` : code;
      }
      default: throw new Error(`IR desconocido: ${e.k}`);
    }
  }
  rcastP(e, want, prec) {
    const ty = this.rty(e);
    const code = this.expr(e, prec, want);
    if (want === 'usize' && ty === 'i32') return `(${code} as usize)`;
    if (want === 'i32' && ty === 'usize') return `(${code} as i32)`;
    return code;
  }

  typeName(t) {
    const L = this.lang;
    const map = {
      int: { java: 'int', csharp: 'int', kotlin: 'Int', swift: 'Int', c: 'int', cpp: 'int', go: 'int', rust: 'i32' },
      bool: { java: 'boolean', csharp: 'bool', kotlin: 'Boolean', swift: 'Bool', c: 'bool', cpp: 'bool', go: 'bool', rust: 'bool' },
    };
    return map[t] ? map[t][L] : null;
  }

  paramDecl([n, t]) {
    const L = this.lang;
    const id = this.id(n);
    if (L === 'python' || L === 'js') return id;
    if (t === 'int' || t === 'bool') {
      const ty = this.typeName(t);
      return { java: `${ty} ${id}`, csharp: `${ty} ${id}`, kotlin: `${id}: ${ty}`, swift: `_ ${id}: ${ty}`, c: `${ty} ${id}`, cpp: `${ty} ${id}`, go: `${id} ${ty}`, rust: `${id}: ${ty}` }[L];
    }
    const mut = t === 'arrMut';
    return {
      java: `int[] ${id}`, csharp: `int[] ${id}`, kotlin: `${id}: IntArray`, swift: mut ? `_ ${id}: inout [Int]` : `_ ${id}: [Int]`,
      c: `${mut ? '' : 'const '}int ${id}[], int ${this.lenName(n)}`, cpp: `${mut ? '' : 'const '}vector<int>& ${id}`,
      go: `${id} []int`, rust: mut ? `${id}: &mut Vec<i32>` : `${id}: &[i32]`,
    }[L];
  }

  header() {
    const L = this.lang;
    const f = this.f;
    const name = this.id(f.name);
    const ps = f.params.map((p) => this.paramDecl(p)).join(', ');
    const rt = f.ret === 'void' ? null : this.typeName(f.ret);
    switch (L) {
      case 'python': return `def ${name}(${ps}):`;
      case 'js': return `function ${name}(${ps}) {`;
      case 'java': return `static ${rt || 'void'} ${name}(${ps}) {`;
      case 'csharp': return `static ${rt || 'void'} ${this.fid(f.name)}(${ps}) {`;
      case 'kotlin': return `fun ${name}(${ps})${rt ? `: ${rt}` : ''} {`;
      case 'swift': return `func ${name}(${ps})${rt ? ` -> ${rt}` : ''} {`;
      case 'c': case 'cpp': return `${rt || 'void'} ${name}(${ps}) {`;
      case 'go': return `func ${name}(${ps})${rt ? ` ${rt}` : ''} {`;
      case 'rust': return `fn ${name}(${ps})${rt ? ` -> ${rt}` : ''} {`;
      default: return '';
    }
  }

  block(stmts, level) {
    const out = [];
    for (const s of stmts) out.push(...this.stmt(s, level));
    if (!out.length && this.lang === 'python') out.push(`${this.ind(level)}pass`);
    return out;
  }

  close(level) { return this.lang === 'python' ? [] : [`${this.ind(level)}}`]; }

  cond(c) {
    const code = this.expr(c, 0, 'i32');
    return { python: code, js: `(${code})`, java: `(${code})`, csharp: `(${code})`, kotlin: `(${code})`, swift: code, c: `(${code})`, cpp: `(${code})`, go: code, rust: code }[this.lang];
  }

  stmt(s, level) {
    const L = this.lang;
    const I = this.ind(level);
    const semi = ['js', 'java', 'csharp', 'c', 'cpp', 'rust'].includes(L) ? ';' : '';
    switch (s.k) {
      case 'let': {
        const id = this.id(s.n);
        this.types[s.n] = s.t;
        if (s.t === 'map') {
          return [{
            python: `${I}${id} = {}`, js: `${I}const ${id} = {};`, java: `${I}Map<Integer, Integer> ${id} = new HashMap<>();`, csharp: `${I}var ${id} = new Dictionary<int, int>();`,
            kotlin: `${I}val ${id} = mutableMapOf<Int, Int>()`, swift: `${I}var ${id}: [Int: Int] = [:]`, c: `${I}int ${id}[${s.bound}] = {0};`,
            cpp: `${I}unordered_map<int, int> ${id};`, go: `${I}${id} := make(map[int]int)`, rust: `${I}let mut ${id}: HashMap<i32, i32> = HashMap::new();`,
          }[L]];
        }
        if (s.t === 'set') {
          return [{
            python: `${I}${id} = set()`, js: `${I}const ${id} = new Set();`, java: `${I}Set<Integer> ${id} = new HashSet<>();`, csharp: `${I}var ${id} = new HashSet<int>();`,
            kotlin: `${I}val ${id} = mutableSetOf<Int>()`, swift: `${I}var ${id} = Set<Int>()`, c: `${I}bool ${id}[${s.bound}] = {false};`,
            cpp: `${I}unordered_set<int> ${id};`, go: `${I}${id} := make(map[int]bool)`, rust: `${I}let mut ${id}: HashSet<i32> = HashSet::new();`,
          }[L]];
        }
        const e = L === 'rust' && s.t === 'int' ? this.rcast(s.e, 'i32') : this.expr(s.e);
        const ty = this.typeName(s.t);
        return [{
          python: `${I}${id} = ${e}`,
          js: `${I}${s.mut ? 'let' : 'const'} ${id} = ${e};`,
          java: `${I}${ty} ${id} = ${e};`,
          csharp: `${I}${ty} ${id} = ${e};`,
          kotlin: `${I}${s.mut ? 'var' : 'val'} ${id} = ${e}`,
          swift: `${I}${s.mut ? 'var' : 'let'} ${id} = ${e}`,
          c: `${I}${ty} ${id} = ${e};`,
          cpp: `${I}${ty} ${id} = ${e};`,
          go: `${I}${id} := ${e}`,
          rust: `${I}let ${s.mut ? 'mut ' : ''}${id}: ${ty} = ${e};`,
        }[L]];
      }
      case 'set': {
        const e = L === 'rust' && this.types[s.n] !== 'bool' ? this.rcast(s.e, 'i32') : this.expr(s.e);
        return [`${I}${this.id(s.n)} = ${e}${semi}`];
      }
      case 'setIdx': {
        const e = L === 'rust' ? this.rcast(s.e, 'i32') : this.expr(s.e);
        return [`${I}${this.expr(idx(s.a, s.i))} = ${e}${semi}`];
      }
      case 'op': {
        const e = L === 'rust' && this.types[s.n] !== 'usize' ? this.rcast(s.e, 'i32') : this.expr(s.e);
        const o = L === 'python' && s.o === '/' ? '//' : s.o;
        if (L === 'js' && s.o === '/') return [`${I}${this.id(s.n)} = Math.floor(${this.id(s.n)} / ${e});`];
        return [`${I}${this.id(s.n)} ${o}= ${e}${semi}`];
      }
      case 'if': {
        const out = [];
        let cur = s;
        let first = true;
        while (cur) {
          const head = L === 'python'
            ? `${I}${first ? 'if' : 'elif'} ${this.cond(cur.c)}:`
            : `${I}${first ? '' : '} else '}if ${this.cond(cur.c)} {`;
          out.push(head);
          out.push(...this.block(cur.then, level + 1));
          first = false;
          if (cur.els && cur.els.length === 1 && cur.els[0].k === 'if') { cur = cur.els[0]; continue; }
          if (cur.els && cur.els.length) {
            out.push(L === 'python' ? `${I}else:` : `${I}} else {`);
            out.push(...this.block(cur.els, level + 1));
          }
          cur = null;
        }
        out.push(...this.close(level));
        return out;
      }
      case 'for': {
        const id = this.id(s.n);
        const isLen = s.to.k === 'len' || (s.to.k === 'bin' && s.to.a.k === 'len');
        this.types[s.n] = L === 'rust' && isLen ? 'usize' : 'int';
        const from = L === 'rust' ? this.rcast(s.from, isLen ? 'usize' : 'i32') : this.expr(s.from);
        const to = L === 'rust' ? this.rcast(s.to, isLen ? 'usize' : 'i32') : this.expr(s.to);
        const cmp = s.incl ? '<=' : '<';
        const head = {
          python: `for ${id} in range(${s.from.k === 'num' && s.from.v === 0 && !s.incl ? '' : `${from}, `}${s.incl ? this.expr(B('+', s.to, num(1))) : to}):`,
          js: `for (let ${id} = ${from}; ${id} ${cmp} ${to}; ${id}++) {`,
          java: `for (int ${id} = ${from}; ${id} ${cmp} ${to}; ${id}++) {`,
          csharp: `for (int ${id} = ${from}; ${id} ${cmp} ${to}; ${id}++) {`,
          kotlin: `for (${id} in ${from}${s.incl ? '..' : ' until '}${to}) {`,
          swift: `for ${id} in ${from}${s.incl ? '...' : '..<'}${s.to.k === 'bin' ? `(${to})` : to} {`,
          c: `for (int ${id} = ${from}; ${id} ${cmp} ${to}; ${id}++) {`,
          cpp: `for (int ${id} = ${from}; ${id} ${cmp} ${to}; ${id}++) {`,
          go: `for ${id} := ${from}; ${id} ${cmp} ${to}; ${id}++ {`,
          rust: `for ${id} in ${from}..${s.incl ? '=' : ''}${to} {`,
        }[L];
        return [`${I}${head}`, ...this.block(s.body, level + 1), ...this.close(level)];
      }
      case 'each': {
        const id = this.id(s.n);
        const a = this.id(s.a);
        this.types[s.n] = 'int';
        if (L === 'c') {
          const k = `i${++this.tmp}`;
          return [`${I}for (int ${k} = 0; ${k} < ${this.lenName(s.a)}; ${k}++) {`, `${this.ind(level + 1)}int ${id} = ${a}[${k}];`, ...this.block(s.body, level + 1), ...this.close(level)];
        }
        const head = {
          python: `for ${id} in ${a}:`, js: `for (const ${id} of ${a}) {`, java: `for (int ${id} : ${a}) {`, csharp: `foreach (int ${id} in ${a}) {`, kotlin: `for (${id} in ${a}) {`,
          swift: `for ${id} in ${a} {`, cpp: `for (int ${id} : ${a}) {`, go: `for _, ${id} := range ${a} {`, rust: `for &${id} in ${a} {`,
        }[L];
        return [`${I}${head}`, ...this.block(s.body, level + 1), ...this.close(level)];
      }
      case 'while': {
        const head = L === 'python' ? `while ${this.cond(s.c)}:` : L === 'go' ? `for ${this.cond(s.c)} {` : `while ${this.cond(s.c)} {`;
        return [`${I}${head}`, ...this.block(s.body, level + 1), ...this.close(level)];
      }
      case 'ret': {
        if (!s.e) return [`${I}return${semi}`];
        const e = L === 'rust' && this.f.ret === 'int' ? this.rcast(s.e, 'i32') : this.expr(s.e);
        return [`${I}return ${e}${semi}`];
      }
      case 'break': return [`${I}break${semi}`];
      case 'swap': {
        const a = this.id(s.a);
        const i = L === 'rust' ? this.rcast(s.i, 'usize') : this.expr(s.i);
        const j = L === 'rust' ? this.rcast(s.j, 'usize') : this.expr(s.j);
        if (L === 'python' || L === 'go') return [`${I}${a}[${i}], ${a}[${j}] = ${a}[${j}], ${a}[${i}]`];
        if (L === 'js') return [`${I}[${a}[${i}], ${a}[${j}]] = [${a}[${j}], ${a}[${i}]];`];
        if (L === 'swift') return [`${I}${a}.swapAt(${i}, ${j})`];
        if (L === 'rust') return [`${I}${a}.swap(${i}, ${j});`];
        if (L === 'cpp') return [`${I}swap(${a}[${i}], ${a}[${j}]);`];
        const t = this.tmp++ ? `tmp${this.tmp}` : 'tmp';
        if (L === 'kotlin') return [`${I}val ${t} = ${a}[${i}]`, `${I}${a}[${i}] = ${a}[${j}]`, `${I}${a}[${j}] = ${t}`];
        return [`${I}int ${t} = ${a}[${i}];`, `${I}${a}[${i}] = ${a}[${j}];`, `${I}${a}[${j}] = ${t};`];
      }
      case 'minc': {
        const m = this.id(s.m);
        const k = L === 'rust' ? this.rcast(s.key, 'i32') : this.expr(s.key);
        return [{
          python: `${I}${m}[${k}] = ${m}.get(${k}, 0) + 1`, js: `${I}${m}[${k}] = (${m}[${k}] ?? 0) + 1;`,
          java: `${I}${m}.put(${k}, ${m}.getOrDefault(${k}, 0) + 1);`, csharp: `${I}${m}[${k}] = ${m}.GetValueOrDefault(${k}) + 1;`, kotlin: `${I}${m}[${k}] = (${m}[${k}] ?: 0) + 1`,
          swift: `${I}${m}[${k}, default: 0] += 1`, c: `${I}${m}[${k}]++;`, cpp: `${I}${m}[${k}]++;`, go: `${I}${m}[${k}]++`,
          rust: `${I}*${m}.entry(${k}).or_insert(0) += 1;`,
        }[L]];
      }
      case 'sadd': {
        const st = this.id(s.s);
        const x = L === 'rust' ? this.rcast(s.x, 'i32') : this.expr(s.x);
        return [{
          python: `${I}${st}.add(${x})`, js: `${I}${st}.add(${x});`, java: `${I}${st}.add(${x});`, csharp: `${I}${st}.Add(${x});`, kotlin: `${I}${st}.add(${x})`,
          swift: `${I}${st}.insert(${x})`, c: `${I}${st}[${x}] = true;`, cpp: `${I}${st}.insert(${x});`, go: `${I}${st}[${x}] = true`, rust: `${I}${st}.insert(${x});`,
        }[L]];
      }
      default: throw new Error(`Sentencia IR desconocida: ${s.k}`);
    }
  }

  fnLines(body, base) {
    return [`${this.ind(base)}${this.header()}`, ...this.block(body, base + 1), ...this.close(base)];
  }
}

function defaultReturn(f, lang) {
  if (f.ret === 'void') return [];
  const v = f.ret === 'bool' ? (lang === 'python' ? 'False' : 'false') : '0';
  return [ret({ k: 'raw', v })];
}

/** Cabeceras e imports que necesita el código generado. */
function prelude(lang, fns) {
  const needMap = fns.some((f) => usesKind(f, 'map'));
  const needSet = fns.some((f) => usesKind(f, 'set'));
  const needBool = fns.some((f) => f.ret === 'bool' || f.params.some(([, t]) => t === 'bool') || usesKind(f, 'set'));
  const needVec = fns.some((f) => f.params.some(([, t]) => t === 'arr' || t === 'arrMut'));
  const out = [];
  if (lang === 'java' && (needMap || needSet)) out.push('import java.util.*;', '');
  if (lang === 'csharp') out.push('using System;', ...(needMap || needSet ? ['using System.Collections.Generic;'] : []), '');
  if (lang === 'c' && needBool) out.push('#include <stdbool.h>', '');
  if (lang === 'cpp') {
    const inc = [];
    if (needVec) inc.push('#include <vector>');
    if (needMap) inc.push('#include <unordered_map>');
    if (needSet) inc.push('#include <unordered_set>');
    if (inc.length) out.push(...inc, 'using namespace std;', '');
  }
  if (lang === 'go') out.push('package main', '');
  if (lang === 'rust') {
    if (needMap) out.push('use std::collections::HashMap;');
    if (needSet) out.push('use std::collections::HashSet;');
    if (needMap || needSet) out.push('');
  }
  return out;
}

/**
 * Genera el programa completo de un nivel en un lenguaje.
 * @param {object[]} fns  funciones del IR (la principal y sus auxiliares)
 * @param {object} opts   { stub: bool, todo: string }
 */
export function generate(lang, fns, { stub = false, todo = '', bare = false } = {}) {
  const lines = bare ? [] : [...prelude(lang, fns)];
  const java = (lang === 'java' || lang === 'csharp') && !bare;
  if (java) lines.push(lang === 'csharp' ? 'class Program {' : 'public class Main {');
  fns.forEach((f, k) => {
    const g = new Gen(lang, f);
    let body = f.body;
    if (stub) body = [{ k: 'todo', text: todo }, ...defaultReturn(f, lang)];
    const base = java ? 1 : 0;
    const out = [`${g.ind(base)}${g.header()}`];
    for (const s of body) {
      if (s.k === 'todo') out.push(`${g.ind(base + 1)}${lang === 'python' ? '#' : '//'} TODO: ${s.text}`);
      else if (s.k === 'ret' && s.e && s.e.k === 'raw') out.push(`${g.ind(base + 1)}return ${s.e.v}${['js', 'java', 'csharp', 'c', 'cpp', 'rust'].includes(lang) ? ';' : ''}`);
      else out.push(...g.stmt(s, base + 1));
    }
    if (lang === 'python' && !out.slice(1).some((l) => !l.trim().startsWith('#'))) out.push(`${g.ind(base + 1)}pass`);
    out.push(...g.close(base));
    if (k > 0) lines.push('');
    lines.push(...out);
  });
  if (java) lines.push('}');
  return `${(lang === 'csharp' ? allman(lines) : lines).join('\n')}\n`;
}

/** Estilo de llaves de .NET (Allman): cada «{» en su propia línea, alineada con su cabecera. */
export function allman(lines) {
  const out = [];
  for (const line of lines) {
    const ind = /^\s*/.exec(line)[0];
    const t = line.trim();
    let m;
    if ((m = /^\}\s*(else.*?)\s*\{$/.exec(t))) out.push(`${ind}}`, `${ind}${m[1]}`, `${ind}{`);
    else if (t.length > 1 && t.endsWith('{') && !/^\{/.test(t)) out.push(`${ind}${t.slice(0, -1).trimEnd()}`, `${ind}{`);
    else out.push(line);
  }
  return out;
}

/** Firma de la función en un lenguaje (para los textos de las lecciones). */
export function signature(lang, f) {
  return new Gen(lang, f).header().replace(/\s*[{:]$/, '');
}

/** Nombre idiomático de una función en un lenguaje. */
export const fnName = (lang, name) => (lang === 'python' || lang === 'rust' ? camelToSnake(name) : lang === 'csharp' ? name[0].toUpperCase() + name.slice(1) : name);
