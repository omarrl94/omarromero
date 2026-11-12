import { useRef, useState } from 'react';
import type { Item } from '../data/schemas';

type Plano = NonNullable<Item['plano']>;
type Pt = { x: number; y: number };

const Salida = ({ x, y }: Pt) => (
  <g aria-hidden><rect x={x - 12} y={y - 8} width="24" height="16" rx="2" fill="#1f9d55" stroke="#0f5c31" /><circle cx={x - 2} cy={y - 3} r="1.8" fill="#fff" /><path d={`M${x - 2} ${y - 1}l-3 5m3 -5l3 3l3 1m-6 -4l-2 -1`} stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" /><path d={`M${x + 4} ${y}h5m-2 -2l2 2l-2 2`} stroke="#fff" strokeWidth="1.1" fill="none" /></g>
);
const Extintor = ({ x, y }: Pt) => (<g aria-hidden><rect x={x - 5} y={y - 9} width="10" height="18" rx="3" fill="#c0392b" stroke="#6b130d" /><rect x={x - 2} y={y - 12} width="4" height="4" fill="#333" /></g>);
const Cuadro = ({ x, y }: Pt) => (<g aria-hidden><rect x={x - 10} y={y - 14} width="20" height="28" rx="2" fill="#8d999e" stroke="#2b363c" strokeWidth="1.5" /><path d={`M${x + 1} ${y - 8}l-5 9h4l-1 6l6 -9h-4z`} fill="#EFCD2F" stroke="#1a1a1a" strokeWidth=".6" /></g>);
const Pulsador = ({ x, y }: Pt) => (<g aria-hidden><rect x={x - 5} y={y - 5} width="10" height="10" fill="#e5534b" stroke="#6b130d" /><circle cx={x} cy={y} r="2.4" fill="#fff" /></g>);
const Luminaria = ({ x, y, estado }: Pt & { estado?: 'ok' | 'sobra' }) => (
  <g aria-hidden>
    <circle cx={x} cy={y} r="14" fill="#EFCD2F" opacity=".22" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <path key={a} d={`M${x + 9 * Math.cos((a * Math.PI) / 180)} ${y + 9 * Math.sin((a * Math.PI) / 180)}L${x + 13 * Math.cos((a * Math.PI) / 180)} ${y + 13 * Math.sin((a * Math.PI) / 180)}`} stroke="#8a6d00" strokeWidth="1.2" />)}
    <circle cx={x} cy={y} r="7" fill="#fff" stroke={estado === 'sobra' ? '#E39F7D' : '#1a1a1a'} strokeWidth="1.6" /><path d={`M${x - 7} ${y}a7 7 0 0 1 14 0z`} fill="#1a1a1a" transform={`rotate(180 ${x} ${y})`} />
  </g>
);

/** Plano de un local en el que el alumno ubica las luminarias de emergencia. */
export function PlanoLuminarias({ plano, puntos, revelar, onChange }: { plano: Plano; puntos: Pt[]; revelar: boolean; onChange: (p: Pt[]) => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const [cur, setCur] = useState<Pt>({ x: Math.round(plano.ancho / 2), y: Math.round(plano.alto / 2) });
  const [foco, setFoco] = useState(false);
  const alterna = (p: Pt) => {
    if (revelar) return;
    const cerca = puntos.findIndex((q) => Math.hypot(q.x - p.x, q.y - p.y) < 12);
    if (cerca >= 0) onChange(puntos.filter((_, i) => i !== cerca));
    else if (puntos.length < plano.maxPuntos + 4) onChange([...puntos, { x: Math.round(p.x), y: Math.round(p.y) }]);
  };
  const clic = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = ref.current!, pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const m = svg.getScreenCTM(); if (!m) return;
    const p = pt.matrixTransform(m.inverse()); alterna({ x: p.x, y: p.y });
  };
  const tecla = (e: React.KeyboardEvent) => {
    const d = e.shiftKey ? 25 : 10;
    const mv: Record<string, Pt> = { ArrowLeft: { x: -d, y: 0 }, ArrowRight: { x: d, y: 0 }, ArrowUp: { x: 0, y: -d }, ArrowDown: { x: 0, y: d } };
    if (mv[e.key]) { e.preventDefault(); setCur((c) => ({ x: Math.min(plano.ancho, Math.max(0, c.x + mv[e.key]!.x)), y: Math.min(plano.alto, Math.max(0, c.y + mv[e.key]!.y)) })); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alterna(cur); }
  };
  const cubierta = (z: Plano['zonas'][number]) => puntos.some((p) => Math.hypot(p.x - z.x, p.y - z.y) <= z.r);
  return (
    <figure>
      <svg ref={ref} viewBox={`0 0 ${plano.ancho} ${plano.alto}`} tabIndex={0} role="application" aria-label={`${plano.titulo}. Pulsa para colocar o quitar luminarias. Con teclado: flechas para mover el cursor y Enter para colocar.`}
        onClick={clic} onKeyDown={tecla} onFocus={() => setFoco(true)} onBlur={() => setFoco(false)} className="w-full cursor-crosshair rounded-lg border border-line bg-[#efebdd] outline-none focus-visible:ring-2 focus-visible:ring-info">
        <defs><pattern id="rejPlano" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#d9d4c3" strokeWidth=".6" /></pattern><pattern id="parquet" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#e7e1cf" /><path d="M0 6h12" stroke="#d8d1bb" strokeWidth=".6" /></pattern></defs>
        <rect width={plano.ancho} height={plano.alto} fill="url(#rejPlano)" />
        {plano.formas.map((f, i) => {
          switch (f.t) {
            case 'rect': return <rect key={i} x={f.x} y={f.y} width={f.w} height={f.h} fill={f.k === 'muro' ? '#2f343a' : f.k === 'servicio' ? '#d3d8d5' : f.k === 'mueble' ? '#cdbf9c' : f.k === 'pasillo' ? '#e2ddcb' : 'url(#parquet)'} stroke={f.k === 'mueble' ? '#8d7f5a' : 'none'} />;
            case 'escalera': return <g key={i}><rect x={f.x} y={f.y} width={f.w} height={f.h} fill="#dcd7c6" stroke="#2f343a" />{Array.from({ length: Math.floor((f.h ?? 0) / 9) }, (_, k) => <path key={k} d={`M${f.x} ${f.y + 9 * (k + 1)}h${f.w}`} stroke="#8b8570" />)}<path d={`M${f.x! + f.w! / 2} ${f.y! + f.h! - 6}V${f.y! + 10}m-5 6l5 -6l5 6`} stroke="#2f343a" strokeWidth="1.6" fill="none" /></g>;
            case 'puerta': { const w = f.w ?? 30; return f.dir === 'v'
              ? <g key={i}><rect x={f.x - 5} y={f.y} width="10" height={w} fill="#efebdd" /><path d={`M${f.x} ${f.y}v${w}`} stroke="#8a5a2b" strokeWidth="2" /><path d={`M${f.x} ${f.y}a${w} ${w} 0 0 1 ${w} ${w}`} fill="none" stroke="#7d8a92" strokeDasharray="3 3" /></g>
              : <g key={i}><rect x={f.x} y={f.y - 5} width={w} height="10" fill="#efebdd" /><path d={`M${f.x} ${f.y}h${w}`} stroke="#8a5a2b" strokeWidth="2" /><path d={`M${f.x} ${f.y}a${w} ${w} 0 0 0 ${w} ${-w}`} fill="none" stroke="#7d8a92" strokeDasharray="3 3" /></g>; }
            case 'salida': return <Salida key={i} x={f.x} y={f.y} />;
            case 'extintor': return <Extintor key={i} x={f.x} y={f.y} />;
            case 'cuadro': return <Cuadro key={i} x={f.x} y={f.y} />;
            case 'pulsador': return <Pulsador key={i} x={f.x} y={f.y} />;
            case 'texto': return <text key={i} x={f.x} y={f.y} fontSize="11" fill="#5b564a" fontFamily="Arial, sans-serif" textAnchor="middle" fontWeight="700">{f.s}</text>;
          }
        })}
        {revelar && plano.zonas.map((z) => {
          const ok = cubierta(z);
          return <g key={z.id} aria-hidden><circle cx={z.x} cy={z.y} r={z.r} fill={ok ? 'rgba(63,178,127,.18)' : 'rgba(229,83,75,.16)'} stroke={ok ? '#3fb27f' : '#e5534b'} strokeWidth="2" strokeDasharray={ok ? undefined : '5 4'} /></g>;
        })}
        {puntos.map((p, i) => <Luminaria key={i} x={p.x} y={p.y} estado={i >= plano.maxPuntos ? 'sobra' : 'ok'} />)}
        {foco && !revelar && <g aria-hidden><circle cx={cur.x} cy={cur.y} r="9" fill="none" stroke="#2257b8" strokeWidth="2" /><path d={`M${cur.x - 14} ${cur.y}h28M${cur.x} ${cur.y - 14}v28`} stroke="#2257b8" /></g>}
      </svg>
      <figcaption className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-mute">
        <span>Luminarias: <b className={puntos.length > plano.maxPuntos ? 'text-warn' : 'text-tx'}>{puntos.length}</b> / {plano.maxPuntos} máx.</span>
        <span>Pulsa en el plano para colocar o quitar. Teclado: flechas + Enter.</span>
        {!revelar && puntos.length > 0 && <button type="button" className="text-info underline" onClick={() => onChange([])}>Quitar todas</button>}
      </figcaption>
    </figure>
  );
}
