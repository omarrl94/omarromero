import { useMemo } from 'react';

/** Explosión: destello, onda expansiva, chispas y humo. Se dibuja centrada en (0,0). */
export function Boom({ big = false }: { big?: boolean }) {
  const k = big ? 1.6 : 1;
  const parts = useMemo(() => Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2 + Math.random() * 0.5, d = (34 + Math.random() * 70) * k;
    return { dx: Math.cos(a) * d, dy: Math.sin(a) * d - 8, r: 1.6 + Math.random() * 3.2, c: ['#fff6a8', '#ffcf40', '#ff8a1f', '#ff4d2e'][i % 4], delay: Math.random() * 0.07 };
  }), [k]);
  return (
    <g pointerEvents="none" className="boom">
      <circle className="boom-flash" r={22 * k} />
      <circle className="boom-ring" r={16 * k} />
      <circle className="boom-ring r2" r={12 * k} />
      {parts.map((p, i) => (
        <circle key={i} className="boom-p" r={p.r} fill={p.c} style={{ ['--dx' as string]: `${p.dx}px`, ['--dy' as string]: `${p.dy}px`, animationDelay: `${p.delay}s` }} />
      ))}
      {[0, 1, 2, 3].map((i) => <circle key={i} className="boom-smoke" cx={(i - 1.5) * 9 * k} cy={-4} r={9 * k} style={{ animationDelay: `${0.15 + i * 0.18}s` }} />)}
    </g>
  );
}
