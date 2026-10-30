// Resaltado de sintaxis ligero (tokenizador por regex) para los cinco lenguajes.
import { LANGUAGES } from '../core/languages.js';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cache = {};

function tokenRe(lang) {
  if (cache[lang]) return cache[lang];
  const comment = lang === 'python' ? '#[^\\n]*' : '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?(?:\\*\\/|$)';
  const pp = lang === 'c' ? '|(^[ \\t]*#\\w+[^\\n]*)' : '';
  const re = new RegExp(`(${comment})|("(?:\\\\.|[^"\\\\\\n])*"?|'(?:\\\\.|[^'\\\\\\n])*'?)|(\\b\\d[\\d_]*(?:\\.\\d+)?(?:[eE][-+]?\\d+)?[fFlLuU]*\\b)|([A-Za-z_]\\w*)${pp}|(@\\w+)`, 'gm');
  cache[lang] = re;
  return re;
}

export function highlight(code, lang) {
  const L = LANGUAGES[lang];
  const kw = new Set(L.keywords);
  const types = new Set(L.types);
  const bi = new Set(L.builtins.map((b) => b.split('.').pop()));
  const re = tokenRe(lang);
  re.lastIndex = 0;
  let out = '';
  let last = 0;
  let m;
  while ((m = re.exec(code))) {
    if (m.index > last) out += esc(code.slice(last, m.index));
    const [tok] = m;
    let cls = 'tk-plain';
    if (m[1]) cls = 'tk-com';
    else if (m[2]) cls = 'tk-str';
    else if (m[3]) cls = 'tk-num';
    else if (m[4]) {
      const after = code.slice(m.index + tok.length).match(/^\s*\(/);
      if (kw.has(tok)) cls = 'tk-kw';
      else if (types.has(tok) || /^[A-Z]/.test(tok)) cls = 'tk-type';
      else if (bi.has(tok)) cls = 'tk-bi';
      else if (after) cls = 'tk-fn';
    } else if (m[5] && lang === 'c') cls = 'tk-pp';
    else cls = 'tk-kw';
    out += `<span class="${cls}">${esc(tok)}</span>`;
    last = m.index + tok.length;
    if (tok.length === 0) re.lastIndex++;
  }
  out += esc(code.slice(last));
  return out;
}
