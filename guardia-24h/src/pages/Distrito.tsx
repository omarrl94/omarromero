import { Link, useParams } from 'react-router-dom';
import { ICONO_DISTRITO } from '../components/Iconos';
import { distritos, items } from '../data/content';
import { useProgreso } from '../game/datos';
import { estadoNivel, nivelAbierto } from '../game/progreso';

export const estrellas = (frac: number) => (frac >= 0.9 ? 3 : frac >= 0.75 ? 2 : frac >= 0.5 ? 1 : 0);

export function Distrito() {
  const { id } = useParams();
  const d = distritos.find((x) => x.id === Number(id));
  const { intentos } = useProgreso();
  if (!d) return <main className="p-4">Distrito no encontrado. <Link to="/" className="underline">Volver</Link></main>;
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Link to="/" className="text-sm font-bold text-menta underline">← Mapa</Link>
      <header className="card mt-2 flex items-center gap-4 !bg-amarillo">
        <span aria-hidden className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border-[3px] border-tinta bg-crema text-4xl">{ICONO_DISTRITO[d.id]}</span>
        <div>
          <h1 className="!text-tinta text-2xl font-black leading-tight">Distrito {d.id} · {d.nombre}</h1>
          <div className="mt-1 flex flex-wrap gap-1">{d.ra.map((r) => <span key={r} className="chip">{r}</span>)}</div>
        </div>
      </header>
      <p className="mt-2 text-xs text-menta">ITC: {d.itc.join(', ')}</p>
      {d.pendiente?.map((p) => <p key={p} className="mt-2 rounded-lg bg-salmon/30 p-2 text-sm">{p}</p>)}
      <ol className="mt-4 grid gap-6">
        {d.niveles.map((n, i) => {
          const cuantos = items.filter((it) => it.distrito === d.id && it.nivel === n.n).length;
          const est = estadoNivel(intentos, d.id, n.n);
          const abierto = nivelAbierto(intentos, d.id, n.n);
          const jefe = n.n === 5;
          const e = estrellas(est.mejor);
          return (
            <li key={n.n} className={`flex items-center gap-4 ${i % 2 ? 'flex-row-reverse text-right' : ''}`}>
              <span aria-hidden className={`grid shrink-0 place-items-center rounded-full border-4 border-tinta font-black shadow-[0_7px_0_#000] ${jefe ? 'h-24 w-24 bg-mal text-4xl' : 'h-20 w-20 text-2xl'} ${!jefe && (est.superado ? 'bg-ok text-white' : abierto ? 'bg-amarillo text-tinta animate-glow' : 'bg-white/20 text-crema')}`}>
                {jefe ? '👑' : abierto ? `N${n.n}` : '🔒'}
              </span>
              <div className="card flex-1 !p-3">
                <strong>N{n.n} · {n.nombre}</strong>
                <div aria-label={`${e} estrellas`} className="text-xl">{[0, 1, 2].map((k) => <span key={k} className={k < e ? '' : 'opacity-25 grayscale'}>⭐</span>)}</div>
                <p className="text-sm">{n.descripcion}</p>
                <p className="text-xs opacity-70">{cuantos} ítems · intentos {est.intentos}/3 · mejor {Math.round(est.mejor * 100)} %</p>
                {abierto && cuantos > 0 && <Link className="btn mt-2 !py-1.5 text-base" to={`/distrito/${d.id}/nivel/${n.n}`}>▶ Jugar</Link>}
                {!abierto && <p className="text-xs font-bold">Supera el nivel anterior</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
