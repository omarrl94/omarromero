import { useEffect, useRef, useState } from 'react';
import { ready, img, url, BOSS_FRAMES, DIR_COL } from './assets.js';
import { typeColor, faceOf } from './species.js';
import { CHARACTERS } from './world.js';

/**
 * Dibuja una criatura centrada en una caja (w×h) del canvas, a escala entera para que el
 * pixel-art quede nítido. glitch añade el parpadeo «corrupto» de los bugs salvajes.
 */
export function drawCreatureFit(g, sprite, w, h, { t = 0, dir = 'down', glitch = false, still = false, scale: forced = 0 } = {}) {
  g.imageSmoothingEnabled = false;
  let im;
  let sx = 0;
  let sy = 0;
  let fw = 16;
  let fh = 16;
  if (sprite.kind === 'boss') {
    im = ready(`boss/${sprite.key}.png`);
    if (!im) return;
    const n = BOSS_FRAMES[sprite.key] || 4;
    fw = im.width / n;
    fh = im.height;
    sx = (still ? 0 : Math.floor(t * 7) % n) * fw;
  } else {
    im = ready(`mon/${sprite.key}.png`);
    if (!im) return;
    sx = DIR_COL[dir] * 16;
    sy = (still ? 0 : Math.floor(t * 5) % 4) * 16;
  }
  const fit = Math.min(w / fw, h / fh);
  const scale = forced || (sprite.kind === 'boss' ? Math.max(1, Math.floor(fit * 2) / 2) : Math.max(1, Math.floor(fit)));
  const dw = fw * scale;
  const dh = fh * scale;
  const x = Math.round((w - dw) / 2);
  const y = Math.round(h - dh);
  const flick = glitch && (Math.floor(t * 10) % 13 === 0 || Math.floor(t * 10) % 17 === 0);
  if (flick) {
    const band = Math.max(2, Math.floor(fh / 6));
    for (let r = 0; r < fh; r += band) {
      const off = (Math.sin(t * 40 + r) > 0 ? 1 : -1) * scale * (r % (band * 2) ? 1 : 2);
      g.drawImage(im, sx, sy + r, fw, Math.min(band, fh - r), x + off, y + r * scale, dw, Math.min(band, fh - r) * scale);
    }
    g.save();
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(200,60,255,0.35)';
    g.fillRect(0, 0, w, h);
    g.restore();
  } else {
    g.drawImage(im, sx, sy, fw, fh, x, y, dw, dh);
  }
}

/** Criatura animada en un canvas pixelado. */
export function Creature({ sprite, size = 96, dir = 'down', glitch = false, still = false, silhouette = false, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !sprite) return undefined;
    const g = c.getContext('2d');
    let raf = 0;
    let alive = true;
    const path = sprite.kind === 'boss' ? `boss/${sprite.key}.png` : `mon/${sprite.key}.png`;
    const t0 = performance.now();
    const draw = (now) => {
      if (!alive) return;
      const t = (now - t0) / 1000;
      g.clearRect(0, 0, c.width, c.height);
      drawCreatureFit(g, sprite, c.width, c.height, { t, dir, glitch, still });
      if (silhouette) {
        g.save();
        g.globalCompositeOperation = 'source-in';
        g.fillStyle = '#3b2f2a';
        g.fillRect(0, 0, c.width, c.height);
        g.restore();
      }
      if (!still) raf = requestAnimationFrame(draw);
    };
    img(path).promise.then(() => { raf = requestAnimationFrame(draw); });
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [sprite, dir, glitch, still, silhouette]);
  const px = sprite && sprite.kind === 'boss' ? 84 : 32;
  return <canvas ref={ref} width={px} height={px} className={`pixelated ${className}`} style={{ width: size, height: size }} aria-hidden="true" />;
}

/** Retrato de una criatura (faceset del pack). */
export function CreatureFace({ sprite, size = 48, silhouette = false }) {
  return <img src={url(faceOf(sprite))} alt="" width={size} height={size} className="pixelated" style={{ width: size, height: size, filter: silhouette ? 'brightness(0) opacity(0.35)' : undefined }} />;
}

/** Retrato de un personaje. */
export function Face({ look, size = 56, framed = true }) {
  const face = <img src={url(`char/${CHARACTERS[look] || look}-face.png`)} alt="" className="pixelated" style={{ width: size, height: size }} />;
  return framed ? <div className="face-frame" style={{ width: size + 12, height: size + 12 }}>{face}</div> : face;
}

/** Personaje de cuerpo entero (primer fotograma mirando hacia abajo). */
export function Person({ look, size = 48, dir = 'down' }) {
  const ref = useRef(null);
  useEffect(() => {
    const path = `char/${CHARACTERS[look] || look}.png`;
    let alive = true;
    img(path).promise.then((im) => {
      if (!alive || !ref.current) return;
      const g = ref.current.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.clearRect(0, 0, 16, 16);
      g.drawImage(im, DIR_COL[dir] * 16, 0, 16, 16, 0, 0, 16, 16);
    });
    return () => { alive = false; };
  }, [look, dir]);
  return <canvas ref={ref} width={16} height={16} className="pixelated" style={{ width: size, height: size }} aria-hidden="true" />;
}

/** Barra de vida con el estilo del pack. */
export function HpBar({ value, max, label = 'PS', showNumbers = true }) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  const color = pct > 0.5 ? '#5ec043' : pct > 0.2 ? '#f0b53a' : '#e0473a';
  return (
    <div className="flex items-center gap-1.5">
      <span className="hp-label">{label}</span>
      <div className="hp-track flex-1">
        <div className="hp-fill" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
      {showNumbers && <span className="w-14 text-right text-[13px] font-bold tabular-nums text-[#4a2f22]">{Math.max(0, Math.round(value))}/{max}</span>}
    </div>
  );
}

export function TypeChip({ type }) {
  return <span className="type-chip" style={{ background: typeColor(type) }}>{type}</span>;
}

/** Texto que aparece letra a letra; un toque lo completa. */
export function useTypewriter(text, speed = 20) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    if (!text) return undefined;
    const id = setInterval(() => setN((k) => { if (k >= text.length) { clearInterval(id); return k; } return k + 1; }), speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return [text ? text.slice(0, n) : '', n >= (text || '').length, () => setN((text || '').length)];
}

/** Caja de diálogo con retrato. */
export function DialogBox({ who, look, text, onNext, choices, onChoice }) {
  const [shown, done, finish] = useTypewriter(text);
  const [sel, setSel] = useState(0);
  useEffect(() => setSel(0), [text]);
  useEffect(() => {
    const onKey = (e) => {
      if (choices && done) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 's') { setSel((s) => (s + 1) % choices.length); e.preventDefault(); return; }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'w') { setSel((s) => (s - 1 + choices.length) % choices.length); e.preventDefault(); return; }
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
    <div className="dialog-wrap" onClick={() => { if (!done) finish(); else if (!choices) onNext(); }} role="dialog" aria-live="polite">
      {who && <div className="dialog-name">{who}</div>}
      <div className="pp-panel dialog-body flex gap-3">
        {look && <div className="hidden shrink-0 sm:block"><Face look={look} size={60} /></div>}
        <p className="dialog-text min-h-[3.4em] flex-1 whitespace-pre-line">{shown}</p>
      </div>
      {choices && done && (
        <div className="mt-2 flex flex-wrap justify-end gap-2">
          {choices.map((c, i) => (
            <button key={c} type="button" onClick={(e) => { e.stopPropagation(); onChoice(i); }} onMouseEnter={() => setSel(i)} className={`pp-btn ${sel === i ? 'pp-btn-on' : ''}`}>
              {sel === i ? '▸ ' : ''}{c}
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
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#1a120e]/70 p-2 sm:items-center sm:p-6" onClick={onClose}>
      <div className={`pp-panel modal-panel flex max-h-[92vh] w-full flex-col ${wide ? 'max-w-4xl' : 'max-w-xl'}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b-2 border-[#d9b28c] px-1 pb-2">
          <h2 className="pixel-title text-xl text-[#7a3b1e]">{title}</h2>
          <button type="button" onClick={onClose} className="pp-btn !px-2.5 !py-0.5" aria-label="Cerrar">✕</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-1 pt-3">{children}</div>
      </div>
    </div>
  );
}
