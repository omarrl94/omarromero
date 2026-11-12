import { useRef } from 'react';

export interface KnobPos { angle: number; label: string }

/**
 * Rueda giratoria de instrumento. Se gira arrastrando, con la rueda del ratón, con las flechas
 * del teclado o pulsando sobre una de las marcas.
 */
export function Knob({ r = 50, positions, index, onChange, accent = '#EFCD2F', labelSize = 11, label }: {
  r?: number; positions: KnobPos[]; index: number; onChange: (i: number) => void; accent?: string; labelSize?: number; label?: string;
}) {
  const ref = useRef<SVGCircleElement>(null);
  const pickByPointer = (e: React.PointerEvent) => {
    const b = ref.current!.getBoundingClientRect();
    const dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2);
    if (Math.hypot(dx, dy) < 4) return;
    const a = (Math.atan2(dx, -dy) * 180) / Math.PI; // 0 = arriba, horario +
    let best = 0, bd = 1e9;
    positions.forEach((p, i) => { const d = Math.abs(((a - p.angle + 540) % 360) - 180); if (d < bd) { bd = d; best = i; } });
    if (best !== index) onChange(best);
  };
  const cur = positions[index];
  return (
    <g tabIndex={0} role="slider" aria-label={label ?? 'Selector'} aria-valuetext={cur.label}
      onKeyDown={(e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(positions.length - 1, index + 1)); if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(0, index - 1)); }}
      onWheel={(e) => { e.preventDefault(); onChange(Math.max(0, Math.min(positions.length - 1, index + (e.deltaY > 0 ? 1 : -1)))); }}
      style={{ outline: 'none' }}>
      {positions.map((p, i) => {
        const a = (p.angle * Math.PI) / 180;
        const lx = Math.sin(a) * (r + 14), ly = -Math.cos(a) * (r + 14);
        return (
          <g key={i} onClick={() => onChange(i)} style={{ cursor: 'pointer' }}>
            <line x1={Math.sin(a) * (r + 2)} y1={-Math.cos(a) * (r + 2)} x2={Math.sin(a) * (r + 8)} y2={-Math.cos(a) * (r + 8)} stroke={i === index ? accent : '#bbb'} strokeWidth={2.5} strokeLinecap="round" />
            <text x={lx} y={ly + labelSize / 3} fontSize={labelSize} textAnchor="middle" fontWeight={i === index ? 800 : 500} fill={i === index ? accent : '#ddd'} style={{ userSelect: 'none' }}>{p.label}</text>
          </g>
        );
      })}
      <circle r={r + 3} fill="#111" />
      <circle ref={ref} r={r} fill="url(#knobGrad)" stroke="#000" strokeWidth={1.5} style={{ cursor: 'grab', touchAction: 'none' }}
        onPointerDown={(e) => { (e.target as Element).setPointerCapture(e.pointerId); pickByPointer(e); }}
        onPointerMove={(e) => { if (e.buttons) pickByPointer(e); }} />
      {/* rugosidades del borde */}
      {Array.from({ length: 24 }, (_, k) => (
        <line key={k} transform={`rotate(${k * 15})`} x1={0} y1={-r + 1} x2={0} y2={-r + 6} stroke="#0006" strokeWidth={2} pointerEvents="none" />
      ))}
      <g style={{ transform: `rotate(${cur.angle}deg)`, transition: 'transform .18s cubic-bezier(.3,1.4,.5,1)' }} pointerEvents="none">
        <path d={`M-5 ${-r * 0.2} L0 ${-r + 4} L5 ${-r * 0.2} Z`} fill={accent} stroke="#000" strokeWidth={1} />
      </g>
      <circle r={r * 0.22} fill="#222" pointerEvents="none" />
    </g>
  );
}

export function KnobDefs() {
  return (
    <defs>
      <radialGradient id="knobGrad" cx="35%" cy="30%" r="80%"><stop offset="0%" stopColor="#5b5650" /><stop offset="60%" stopColor="#2f2b27" /><stop offset="100%" stopColor="#171513" /></radialGradient>
      <linearGradient id="caseGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F5D943" /><stop offset="100%" stopColor="#D9B51B" /></linearGradient>
      <linearGradient id="lcdGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b9cdb0" /><stop offset="100%" stopColor="#97ad90" /></linearGradient>
    </defs>
  );
}
