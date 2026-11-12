import { Link, useParams } from 'react-router-dom';
import { distritos, items } from '../data/content';

export function Distrito() {
  const { id } = useParams();
  const d = distritos.find((x) => x.id === Number(id));
  if (!d) return <main className="p-4">Distrito no encontrado. <Link to="/" className="underline">Volver</Link></main>;
  return (
    <main className="mx-auto max-w-3xl p-4">
      <Link to="/" className="underline">← Mapa</Link>
      <h1 className="my-2 font-titulo text-2xl font-black">Distrito {d.id} · {d.nombre}</h1>
      <p className="mb-2 text-sm">ITC: {d.itc.join(', ')}</p>
      {d.pendiente?.map((p) => <p key={p} className="mb-2 rounded bg-salmon/40 p-2 text-sm">{p}</p>)}
      <ol className="grid gap-3">
        {d.niveles.map((n) => (
          <li key={n.n} className="card">
            <strong>N{n.n} · {n.nombre}</strong> — {n.descripcion}
            <div className="text-sm">{items.filter((i) => i.distrito === d.id && i.nivel === n.n).length} ítems · 🔒 Próximamente (Fase 1)</div>
          </li>
        ))}
      </ol>
    </main>
  );
}
