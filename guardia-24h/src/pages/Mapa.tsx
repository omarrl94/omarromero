import { Link } from 'react-router-dom';
import { distritos, items } from '../data/content';

export function Mapa() {
  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="mb-1 font-titulo text-2xl font-black">Campaña · 8 distritos</h1>
      <p className="mb-4">Avanza del 1 al 8. En esta fase el contenido jugable aún está en construcción.</p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {distritos.map((d) => {
          const n = items.filter((i) => i.distrito === d.id).length;
          return (
            <li key={d.id} className="card">
              <h2 className="font-bold">Distrito {d.id} · {d.nombre}</h2>
              <p className="text-sm">{d.ra.join(' · ')} · {n} ítems (borrador)</p>
              <Link className="btn mt-2 inline-block" to={`/distrito/${d.id}`}>Ver niveles</Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
