// Efectos visuales: fondo de red viva en canvas, texto glitch, confeti y visuales de lecciones.
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Fondo animado: nodos de red conectados por los que viajan «paquetes» del color del equipo. */
export function CyberBackground({ color = '#2bff88' }) {
  const ref = useRef(null);
  const colorRef = useRef(color);
  colorRef.current = color;

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext('2d');
    let w = 0;
    let h = 0;
    let raf = 0;
    let nodes = [];
    let packets = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(70, (w * h) / 22000));
      nodes = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: Math.random() * 1.6 + 0.6 }));
    };
    resize();
    window.addEventListener('resize', resize);
    const still = reduced();
    const frame = () => {
      const c = colorRef.current;
      ctx.clearRect(0, 0, w, h);
      for (const a of nodes) {
        if (!still) { a.x += a.vx; a.y += a.vy; }
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 140) {
            ctx.strokeStyle = `${c}${Math.round((1 - d / 140) * 40).toString(16).padStart(2, '0')}`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            if (!still && Math.random() < 0.0006 && packets.length < 18) packets.push({ a, b, t: 0 });
          }
        }
      }
      for (const n of nodes) {
        ctx.fillStyle = `${c}99`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      packets = packets.filter((p) => p.t <= 1);
      for (const p of packets) {
        p.t += 0.012;
        const x = p.a.x + (p.b.x - p.a.x) * p.t;
        const y = p.a.y + (p.b.y - p.a.y) * p.t;
        ctx.shadowColor = c;
        ctx.shadowBlur = 12;
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(frame);
    };
    frame();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-0 h-full w-full opacity-70" />;
}

/** Texto con efecto glitch y descifrado de caracteres al aparecer. */
export function GlitchText({ text, className = '', as: Tag = 'h1' }) {
  const [shown, setShown] = useState(reduced() ? text : '');
  useEffect(() => {
    if (reduced()) { setShown(text); return undefined; }
    const chars = '!<>-_\\/[]{}—=+*^?#01';
    let frame = 0;
    const total = text.length * 2 + 10;
    const id = setInterval(() => {
      frame++;
      const revealed = Math.floor((frame / total) * text.length);
      setShown(text.split('').map((ch, i) => (i < revealed || ch === ' ' ? ch : chars[Math.floor(Math.random() * chars.length)])).join(''));
      if (frame >= total) { setShown(text); clearInterval(id); }
    }, 28);
    return () => clearInterval(id);
  }, [text]);
  return <Tag className={`glitch ${className}`} data-text={text}>{shown}</Tag>;
}

/** Confeti para celebrar una misión superada. */
export function Confetti({ colors }) {
  const pieces = Array.from({ length: reduced() ? 0 : 60 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((i) => {
        const x = Math.random() * 100;
        const c = colors[i % colors.length];
        return (
          <motion.span key={i} className="absolute top-0 h-2 w-1.5 rounded-sm" style={{ left: `${x}%`, background: c }}
            initial={{ y: -20, rotate: 0, opacity: 1 }}
            animate={{ y: 520 + Math.random() * 200, rotate: Math.random() * 720 - 360, x: (Math.random() - 0.5) * 160, opacity: [1, 1, 0] }}
            transition={{ duration: 1.8 + Math.random() * 1.4, ease: 'easeOut', delay: Math.random() * 0.3 }} />
        );
      })}
    </div>
  );
}

/** Radar giratorio decorativo. */
export function Radar({ color, size = 120 }) {
  return (
    <div className="relative" style={{ width: size, height: size }} aria-hidden="true">
      <div className="absolute inset-0 rounded-full border" style={{ borderColor: `${color}55` }} />
      <div className="absolute inset-[18%] rounded-full border" style={{ borderColor: `${color}33` }} />
      <div className="absolute inset-[36%] rounded-full border" style={{ borderColor: `${color}22` }} />
      <div className="radar-sweep absolute inset-0 rounded-full" style={{ background: `conic-gradient(from 0deg, ${color}66, transparent 25%)` }} />
      <span className="absolute h-1.5 w-1.5 animate-ping rounded-full" style={{ background: color, left: '62%', top: '30%' }} />
      <span className="absolute h-1.5 w-1.5 animate-ping rounded-full" style={{ background: color, left: '30%', top: '65%', animationDelay: '0.7s' }} />
    </div>
  );
}

/** Visuales de apoyo para algunas lecciones. */
export function LessonVisual({ kind, color }) {
  if (kind === 'handshake') {
    const steps = [['SYN', 'cliente → servidor'], ['SYN-ACK', 'servidor → cliente'], ['ACK', 'cliente → servidor']];
    return (
      <div className="relative mt-3 rounded-xl border border-void-600 bg-void-950/70 p-4">
        <div className="flex justify-between text-xs font-bold text-slate-300"><span>💻 Cliente</span><span>🖥️ Servidor</span></div>
        {steps.map(([lbl, dir], i) => {
          const right = i !== 1;
          return (
            <div key={lbl} className="relative my-3 h-6">
              <div className="absolute left-0 right-0 top-3 h-px bg-void-600" />
              <motion.div className="absolute top-0 rounded-md px-2 py-0.5 text-[11px] font-bold text-void-950" style={{ background: color }}
                initial={{ left: right ? '0%' : '80%' }} animate={{ left: right ? ['0%', '80%'] : ['80%', '0%'] }} transition={{ duration: 1.4, delay: i * 1.4, repeat: Infinity, repeatDelay: 2.8 }}>
                {lbl}
              </motion.div>
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-slate-500">{dir}</span>
            </div>
          );
        })}
      </div>
    );
  }
  if (kind === 'crypto') {
    const rows = [
      ['Codificar', 'hola', 'aG9sYQ==', '↔ reversible sin clave', '#ffb534'],
      ['Cifrar', 'hola', 'U2FsdGVk…', '↔ solo con la clave', '#22a6ff'],
      ['Hash', 'hola', 'b221d9db…', '→ un solo sentido', '#ff4767'],
    ];
    return (
      <div className="mt-3 space-y-2">
        {rows.map(([t, a, b, d, c], i) => (
          <motion.div key={t} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}
            className="grid grid-cols-[80px_1fr_auto_1fr] items-center gap-2 rounded-lg border border-void-600 bg-void-950/70 px-3 py-2 font-mono text-xs">
            <span className="font-bold" style={{ color: c }}>{t}</span>
            <span className="text-white">{a}</span>
            <span style={{ color: c }}>⟶</span>
            <span className="truncate text-slate-300">{b} <span className="text-slate-500">{d}</span></span>
          </motion.div>
        ))}
      </div>
    );
  }
  return null;
}
