import { useEffect, useRef, useState } from 'react';
import { drawCreature, drawPerson, PEOPLE } from './sprites.js';
import { typeColor } from './species.js';

/** Criatura animada en un canvas pixelado. */
export function Creature({ look, size = 120, glitch = 0, flip = false, still = false, className = '', silhouette = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return undefined;
    const g = c.getContext('2d');
    let raf = 0;
    const t0 = performance.now();
    const draw = (now) => {
      const t = still ? 0 : (now - t0) / 1000;
      g.clearRect(0, 0, c.width, c.height);
      drawCreature(g, look, 0, 0, 1, { glitch, t, flip, white: false });
      if (silhouette) {
        g.globalCompositeOperation = 'source-in';
        g.fillStyle = '#1b1830';
        g.fillRect(0, 0, c.width, c.height);
        g.globalCompositeOperation = 'source-over';
      }
      if (!still) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [look, glitch, flip, still, silhouette]);
  return <canvas ref={ref} width={40} height={40} className={`pixelated ${className}`} style={{ width: size, height: size }} aria-hidden="true" />;
}

/** Retrato de un personaje (16×16 escalado). */
export function Person({ look, size = 48, dir = 'down', className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const g = ref.current.getContext('2d');
    g.clearRect(0, 0, 16, 16);
    drawPerson(g, PEOPLE[look] || PEOPLE.kid, 0, 0, dir, 0);
  }, [look, dir]);
  return <canvas ref={ref} width={16} height={16} className={`pixelated ${className}`} style={{ width: size, height: size }} aria-hidden="true" />;
}

/** Barra de vida estilo clásico: verde → ámbar → roja. */
export function HpBar({ value, max, label = 'PS', showNumbers = true, light = false }) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  const color = pct > 0.5 ? '#4ade80' : pct > 0.2 ? '#fbbf24' : '#f43f5e';
  return (
    <div className="flex items-center gap-2">
      <span className={`pixel-font text-[8px] ${light ? 'text-amber-600' : 'text-amber-300'}`}>{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-sm border border-slate-900 bg-slate-800">
        <div className="h-full transition-[width] duration-700 ease-out" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
      {showNumbers && <span className={`w-14 text-right text-[11px] font-bold tabular-nums ${light ? 'text-slate-800' : 'text-slate-200'}`}>{Math.max(0, Math.round(value))}/{max}</span>}
    </div>
  );
}

export function TypeChip({ type }) {
  return (
    <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-950" style={{ background: typeColor(type) }}>
      {type}
    </span>
  );
}

/** Texto que aparece letra a letra; un toque lo completa. */
export function useTypewriter(text, speed = 22) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    if (!text) return undefined;
    const id = setInterval(() => setN((k) => { if (k >= text.length) { clearInterval(id); return k; } return k + 1; }), speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return [text ? text.slice(0, n) : '', n >= (text || '').length, () => setN((text || '').length)];
}

/** Caja de diálogo. */
export function DialogBox({ who, look, text, onNext, choices, onChoice }) {
  const [shown, done, finish] = useTypewriter(text);
  const [sel, setSel] = useState(0);
  useEffect(() => setSel(0), [text]);
  useEffect(() => {
    const onKey = (e) => {
      if (choices && done) {
        if (e.key === 'ArrowDown' || e.key === 's') { setSel((s) => (s + 1) % choices.length); e.preventDefault(); return; }
        if (e.key === 'ArrowUp' || e.key === 'w') { setSel((s) => (s - 1 + choices.length) % choices.length); e.preventDefault(); return; }
      }
      if (['Enter', ' ', 'z', 'Z'].includes(e.key)) {
        e.preventDefault();
        if (!done) finish();
        else if (choices) onChoice(sel);
        else onNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [done, finish, onNext, choices, onChoice, sel]);
  return (
    <div className="dialog-box" onClick={() => { if (!done) finish(); else if (!choices) onNext(); }} role="dialog" aria-live="polite">
      <div className="flex gap-3">
        {look && <div className="hidden shrink-0 rounded-lg bg-slate-900/60 p-1 sm:block"><Person look={look} size={56} /></div>}
        <div className="min-w-0 flex-1">
          {who && <div className="pixel-font mb-1.5 text-[10px] text-amber-300">{who}</div>}
          <p className="min-h-[3.2em] whitespace-pre-line text-[15px] leading-relaxed text-slate-50">{shown}</p>
        </div>
      </div>
      {choices && done && (
        <div className="mt-2 flex flex-wrap justify-end gap-2">
          {choices.map((c, i) => (
            <button key={c} type="button" onClick={(e) => { e.stopPropagation(); onChoice(i); }} onMouseEnter={() => setSel(i)} className={`rounded-md border-2 px-3 py-1.5 text-sm font-bold ${sel === i ? 'border-amber-300 bg-amber-300 text-slate-900' : 'border-slate-500 bg-slate-800 text-slate-100'}`}>
              {sel === i ? '▶ ' : ''}{c}
            </button>
          ))}
        </div>
      )}
      {!choices && done && <span className="dialog-next">▼</span>}
    </div>
  );
}

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') { const tag = document.activeElement && document.activeElement.tagName; if (tag !== 'TEXTAREA' && tag !== 'INPUT') onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-2 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div className={`panel flex max-h-[92vh] w-full flex-col ${wide ? 'max-w-4xl' : 'max-w-xl'}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b-2 border-slate-700 px-4 py-3">
          <h2 className="pixel-font text-[11px] text-amber-300">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-md bg-slate-800 px-2.5 py-1 text-sm text-slate-300 hover:bg-slate-700" aria-label="Cerrar">✕</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
