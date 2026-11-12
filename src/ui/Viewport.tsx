import { useRef, useState } from 'react';
import { paperVars, type Diagram } from './diagrams';

/** Visor con zoom (rueda) y desplazamiento (arrastrar) para un diagrama sobre «papel». */
export function Viewport({ d, paper = true, pad = 24 }: { d: Diagram; paper?: boolean; pad?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const [v, setV] = useState({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const W = d.w + pad * 2, H = d.h + pad * 2;
  const vw = W / v.k, vh = H / v.k;
  const scale = () => { const r = ref.current!.getBoundingClientRect(); return Math.min(r.width / vw, r.height / vh); };
  return (
    <svg ref={ref} className="viewport" viewBox={`${v.x} ${v.y} ${vw} ${vh}`} style={paperVars() as React.CSSProperties}
      onWheel={(e) => {
        const r = ref.current!.getBoundingClientRect(); const s = scale();
        const ox = (r.width - vw * s) / 2, oy = (r.height - vh * s) / 2;
        const px = v.x + (e.clientX - r.left - ox) / s, py = v.y + (e.clientY - r.top - oy) / s;
        const k = Math.min(4, Math.max(0.4, v.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
        const nw = W / k, nh = H / k;
        setV({ k, x: px - ((px - v.x) / vw) * nw, y: py - ((py - v.y) / vh) * nh });
      }}
      onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); drag.current = { x: e.clientX, y: e.clientY }; }}
      onPointerMove={(e) => { if (!drag.current) return; const s = scale(); setV((p) => ({ ...p, x: p.x - (e.clientX - drag.current!.x) / s, y: p.y - (e.clientY - drag.current!.y) / s })); drag.current = { x: e.clientX, y: e.clientY }; }}
      onPointerUp={() => (drag.current = null)} onDoubleClick={() => setV({ x: 0, y: 0, k: 1 })}>
      {paper && <rect x={0} y={0} width={W} height={H} rx={8} fill="#fff" />}
      {paper && <rect x={8} y={8} width={W - 16} height={H - 16} fill="none" stroke="#14181d" strokeWidth={1.2} />}
      <g transform={`translate(${pad} ${pad})`}>{d.node}</g>
    </svg>
  );
}
