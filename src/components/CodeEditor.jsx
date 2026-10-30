import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { highlight } from './highlight.js';
import { LANGUAGES } from '../core/languages.js';
import { play } from '../core/sound.js';

const LINE_H = 20;
const PAD = 12;

/**
 * Editor de código: textarea transparente sobre una capa resaltada.
 * Autocompletado simulado (palabras clave, API, identificadores y snippets),
 * sangría inteligente, marcadores de error y de estilo en el margen.
 */
export default function CodeEditor({ code, onChange, lang, errorLine, lintLines = [], focus, onRun }) {
  const ta = useRef(null);
  const pre = useRef(null);
  const gutter = useRef(null);
  const [scroll, setScroll] = useState({ top: 0, left: 0 });
  const [ac, setAc] = useState(null); // { items, index, word, top, left }
  const [charW, setCharW] = useState(7.8);
  const [flash, setFlash] = useState(null);

  const lines = useMemo(() => code.split('\n'), [code]);
  const html = useMemo(() => highlight(code, lang) + '\n', [code, lang]);
  const lintSet = useMemo(() => new Set(lintLines), [lintLines]);

  useEffect(() => {
    const c = document.createElement('canvas').getContext('2d');
    c.font = '13px "JetBrains Mono", monospace';
    const measure = () => setCharW(c.measureText('MMMMMMMMMM').width / 10);
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  }, []);

  // Salto a una línea (desde el Bug Visualizer o el pato).
  useEffect(() => {
    if (!focus || !focus.line || !ta.current) return;
    const el = ta.current;
    const ls = el.value.split('\n');
    const idx = Math.max(0, Math.min(focus.line, ls.length) - 1);
    const start = ls.slice(0, idx).reduce((s, l) => s + l.length + 1, 0);
    el.focus();
    el.setSelectionRange(start, start + ls[idx].length);
    el.scrollTop = Math.max(0, idx * LINE_H - el.clientHeight / 3);
    setFlash(idx + 1);
    const t = setTimeout(() => setFlash(null), 1600);
    return () => clearTimeout(t);
  }, [focus]);

  const syncScroll = () => {
    const el = ta.current;
    setScroll({ top: el.scrollTop, left: el.scrollLeft });
  };

  const vocabulary = useMemo(() => {
    const L = LANGUAGES[lang];
    const ids = new Set(code.match(/[A-Za-z_]\w{2,}/g) || []);
    const api = ['waypoint', 'scan', 'print', 'println', 'printf', 'malloc', 'free'];
    const words = new Set([...L.keywords, ...L.types, ...L.builtins.map((b) => b.split('.').pop()), ...api, ...ids]);
    return { words: [...words], snippets: L.snippets };
  }, [lang, code]);

  const updateAc = useCallback((el) => {
    const pos = el.selectionStart;
    const before = el.value.slice(0, pos);
    const m = /[A-Za-z_]\w*$/.exec(before);
    if (!m || m[0].length < 2) { setAc(null); return; }
    const word = m[0];
    const lw = word.toLowerCase();
    const snippetItems = Object.keys(vocabulary.snippets).filter((k) => k.startsWith(lw)).map((k) => ({ label: k, snippet: vocabulary.snippets[k] }));
    const wordItems = vocabulary.words
      .filter((w) => w.toLowerCase().startsWith(lw) && w !== word)
      .sort((a, b) => a.length - b.length)
      .slice(0, 7)
      .map((w) => ({ label: w }));
    const items = [...snippetItems, ...wordItems.filter((w) => !snippetItems.some((s) => s.label === w.label))].slice(0, 8);
    if (!items.length) { setAc(null); return; }
    const lineIdx = before.split('\n').length - 1;
    const col = before.length - before.lastIndexOf('\n') - 1;
    setAc({ items, index: 0, word, top: PAD + (lineIdx + 1) * LINE_H - el.scrollTop + 2, left: 44 + PAD + (col - word.length) * charW - el.scrollLeft });
  }, [vocabulary, charW]);

  // Escribe en el DOM y fija el cursor de forma síncrona: así no se pierde la posición
  // aunque el usuario teclee más rápido que el siguiente render de React.
  const setValue = (el, next, caret) => {
    el.value = next;
    el.selectionStart = el.selectionEnd = caret;
    onChange(next);
  };
  const replaceRange = (el, start, end, text, caretOffset = text.length) => {
    setValue(el, el.value.slice(0, start) + text + el.value.slice(end), start + caretOffset);
  };

  const accept = (item) => {
    const el = ta.current;
    const pos = el.selectionStart;
    const start = pos - ac.word.length;
    if (item.snippet) {
      const lineStart = el.value.lastIndexOf('\n', start - 1) + 1;
      const indent = /^\s*/.exec(el.value.slice(lineStart))[0];
      const body = item.snippet.replace(/\n/g, `\n${indent}`);
      const caret = body.indexOf('\n') >= 0 ? body.indexOf('\n') + 1 + indent.length + 4 : body.length;
      replaceRange(el, start, pos, body, Math.min(caret, body.length));
    } else {
      replaceRange(el, start, pos, item.label);
    }
    setAc(null);
    play('click');
  };

  const onKeyDown = (e) => {
    const el = e.currentTarget;
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun && onRun();
      return;
    }
    if (ac) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setAc({ ...ac, index: (ac.index + 1) % ac.items.length }); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setAc({ ...ac, index: (ac.index - 1 + ac.items.length) % ac.items.length }); return; }
      if (e.key === 'Tab' || e.key === 'Enter') { e.preventDefault(); accept(ac.items[ac.index]); return; }
      if (e.key === 'Escape') { e.preventDefault(); setAc(null); return; }
    }
    const { selectionStart: s, selectionEnd: en, value } = el;
    if (e.key === 'Tab') {
      e.preventDefault();
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      if (e.shiftKey) {
        const m = /^ {1,4}/.exec(value.slice(lineStart));
        if (m) setValue(el, value.slice(0, lineStart) + value.slice(lineStart + m[0].length), Math.max(lineStart, s - m[0].length));
      } else replaceRange(el, s, en, '    ');
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      const cur = value.slice(lineStart, s);
      let indent = /^\s*/.exec(cur)[0];
      const trimmed = cur.trimEnd();
      if (/[{:([]$/.test(trimmed) && !(lang !== 'python' && trimmed.endsWith(':'))) indent += '    ';
      const nextCh = value[s];
      if (trimmed.endsWith('{') && nextCh === '}') {
        const base = /^\s*/.exec(cur)[0];
        replaceRange(el, s, en, `\n${indent}\n${base}`, indent.length + 1);
      } else replaceRange(el, s, en, `\n${indent}`);
      return;
    }
    if (e.key === '}' && /^\s+$/.test(value.slice(value.lastIndexOf('\n', s - 1) + 1, s))) {
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      const ind = value.slice(lineStart, s);
      const dedent = ind.slice(0, Math.max(0, ind.length - 4));
      e.preventDefault();
      setValue(el, value.slice(0, lineStart) + dedent + '}' + value.slice(en), lineStart + dedent.length + 1);
      return;
    }
    if (e.key.length === 1) play('key');
  };

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden rounded-xl bg-void-900/80" onBlur={() => setTimeout(() => setAc(null), 150)}>
      {/* margen con números de línea y marcadores */}
      <div className="relative w-11 shrink-0 select-none overflow-hidden border-r border-void-600/50 bg-void-950/60">
        <div ref={gutter} style={{ transform: `translateY(${-scroll.top}px)`, paddingTop: PAD }} className="editor-layer text-right">
          {lines.map((_, i) => {
            const n = i + 1;
            const isErr = errorLine === n;
            const isLint = lintSet.has(n);
            return (
              <div key={n} className={`pr-2 ${isErr ? 'text-neon-red' : isLint ? 'text-neon-amber' : 'text-void-600'}`} style={{ height: LINE_H }}>
                {isErr ? '●' : isLint ? '◆' : n}
              </div>
            );
          })}
        </div>
      </div>
      <div className="relative min-w-0 flex-1">
        {/* resaltado de líneas */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div style={{ transform: `translateY(${PAD - scroll.top}px)` }}>
            {lines.map((_, i) => (
              <div key={i} style={{ height: LINE_H }} className={errorLine === i + 1 ? 'line-error' : flash === i + 1 ? 'line-focus' : lintSet.has(i + 1) ? 'line-lint' : ''} />
            ))}
          </div>
        </div>
        <pre
          ref={pre}
          aria-hidden="true"
          className="editor-layer pointer-events-none absolute inset-0 m-0 overflow-hidden"
          style={{ padding: PAD, transform: `translate(${-scroll.left}px, ${-scroll.top}px)` }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <textarea
          ref={ta}
          value={code}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          aria-label={`Editor de código ${LANGUAGES[lang].name}`}
          className="editor-layer editor-textarea absolute inset-0 h-full w-full"
          style={{ padding: PAD }}
          onChange={(e) => { onChange(e.target.value); updateAc(e.target); }}
          onKeyDown={onKeyDown}
          onScroll={syncScroll}
          onClick={() => setAc(null)}
        />
        {ac && (
          <div className="absolute z-20 min-w-[180px] overflow-hidden rounded-lg border border-neon-cyan/40 bg-void-900/95 shadow-neon" style={{ top: ac.top, left: Math.max(4, ac.left) }}>
            {ac.items.map((it, i) => (
              <button
                key={it.label + i}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); accept(it); }}
                className={`flex w-full items-center justify-between gap-4 px-3 py-1 text-left text-xs ${i === ac.index ? 'bg-neon-cyan/15 text-neon-cyan' : 'text-slate-300'}`}
              >
                <span>{it.label}</span>
                <span className="text-[10px] uppercase tracking-wider text-void-600">{it.snippet ? 'snippet' : 'símbolo'}</span>
              </button>
            ))}
            <div className="border-t border-void-600/50 px-3 py-1 text-[10px] text-slate-500">Tab ↹ aceptar · Esc cerrar</div>
          </div>
        )}
      </div>
    </div>
  );
}
