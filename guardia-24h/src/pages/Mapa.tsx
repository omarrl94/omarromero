import { Link } from 'react-router-dom';
import { ICONO_DISTRITO } from '../components/Iconos';
import { distritos } from '../data/content';
import { useProgreso } from '../game/datos';
import { estadoNivel } from '../game/progreso';

const ALTO = 150;
const xs = [30, 70, 34, 66, 30, 70, 34, 66];

export function Mapa() {
  const { intentos } = useProgreso();
  const nodos = distritos.map((d, i) => {
    const sup = [1, 2, 3, 4, 5].filter((n) => estadoNivel(intentos, d.id, n).superado).length;
    return { d, sup, x: xs[i] ?? 50, y: 90 + i * ALTO };
  });
  const total = 90 + distritos.length * ALTO + 40;
  const camino = nodos.map((n, i) => (i === 0 ? `M ${n.x} ${n.y}` : `C ${n.x} ${nodos[i - 1]!.y + ALTO / 2}, ${nodos[i - 1]!.x} ${n.y - ALTO / 2}, ${n.x} ${n.y}`)).join(' ');
  const epi = { x: 50, y: total - 10 };
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <h1 className="text-center text-3xl font-black drop-shadow-[0_3px_0_#000]">Campaña · 8 distritos</h1>
      <p className="mb-2 text-center text-sm text-menta">Recorre la ciudad de avería en avería. Cada distrito es un bloque del curso.</p>
      <div className="relative" style={{ height: total + 80 }}>
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${total + 80}`} preserveAspectRatio="none" aria-hidden>
          <path d={camino} fill="none" stroke="#000" strokeWidth="16" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity=".5" />
          <path d={camino} fill="none" stroke="#EFCD2F" strokeWidth="5" strokeDasharray="2 12" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {nodos.map(({ d, sup, x, y }) => {
          const hecho = sup === 5, empezado = sup > 0;
          return (
            <Link key={d.id} to={`/distrito/${d.id}`} aria-label={`Distrito ${d.id}: ${d.nombre}`} className="group absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${x}%`, top: y }}>
              <span className={`relative grid h-24 w-24 place-items-center rounded-full border-4 border-tinta text-4xl shadow-[0_7px_0_#000] transition group-hover:-translate-y-1 group-focus-visible:outline group-focus-visible:outline-4 group-focus-visible:outline-menta ${hecho ? 'bg-ok' : empezado ? 'bg-amarillo animate-glow' : 'bg-crema'}`}
                style={{ backgroundImage: `conic-gradient(#2FB872 ${(sup / 5) * 360}deg, transparent 0)`, backgroundBlendMode: 'normal' }}>
                <span className="absolute inset-2 grid place-items-center rounded-full border-2 border-tinta bg-crema">{hecho ? '🏆' : ICONO_DISTRITO[d.id]}</span>
                <span className="absolute -right-1 -top-1 grid h-8 w-8 place-items-center rounded-full border-[3px] border-tinta bg-tinta text-sm font-black text-amarillo">{d.id}</span>
              </span>
              <span className="mx-auto mt-3 block w-44 rounded-lg border-2 border-tinta bg-tinta/90 px-2 py-1 text-sm font-bold leading-tight text-crema">
                {d.nombre}
                <span className="block text-[11px] font-normal text-menta">{d.ra.join(' · ')} · {sup}/5 niveles</span>
              </span>
            </Link>
          );
        })}
        <div className="absolute -translate-x-1/2 -translate-y-1/2 text-center opacity-70" style={{ left: `${epi.x}%`, top: epi.y + 70 }} aria-label="Epílogo: La Gran Inspección (bloqueado)">
          <span className="grid h-20 w-20 place-items-center rounded-full border-4 border-dashed border-menta text-3xl grayscale">👑</span>
          <span className="mt-2 block text-sm font-bold">La Gran Inspección</span><span className="text-xs">🔒 Jefe final</span>
        </div>
      </div>
    </main>
  );
}
