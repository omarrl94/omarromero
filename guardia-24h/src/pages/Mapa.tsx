import { Link } from 'react-router-dom';
import { Icon, ICONO_DISTRITO } from '../components/Icon';
import { distritos, teoria } from '../data/content';
import { useProgreso } from '../game/datos';
import { estadoNivel } from '../game/progreso';
import { useTeoriaLeida } from '../game/teoria';

export function Mapa() {
  const { intentos } = useProgreso();
  const { cuenta } = useTeoriaLeida();
  const datos = distritos.filter((d) => d.id > 0).map((d) => ({ d, sup: [1, 2, 3, 4, 5].filter((n) => estadoNivel(intentos, d.id, n).superado).length, t: teoria.find((x) => x.distrito === d.id) }));
  const abiertoEpi = [1, 2, 3, 4, 5, 6, 7, 8].every((b) => estadoNivel(intentos, b, 5).superado);
  const total = datos.reduce((s, x) => s + x.sup, 0);
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="eyebrow">Plan formativo · Módulo 0518 TPIE</div>
      <h1 className="mt-1 text-3xl">Campaña · 8 bloques</h1>
      <p className="mt-1 max-w-2xl text-mute">Cada bloque se corresponde con un bloque didáctico del módulo: estudia la teoría, resuelve las prácticas por niveles y supera la intervención final.</p>
      <div className="mt-4 flex items-center gap-3 text-sm text-mute" aria-label="Progreso global">
        <div className="h-1.5 w-56 overflow-hidden rounded bg-line"><div className="h-full bg-acc transition-all" style={{ width: `${(total / 40) * 100}%` }} /></div>
        <span>{total} de 40 niveles superados</span>
      </div>
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {datos.map(({ d, sup, t }) => (
          <li key={d.id} className="card flex flex-col gap-4 transition hover:border-mute">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-line bg-panel2 text-acc"><Icon n={ICONO_DISTRITO[d.id]!} className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="eyebrow">Bloque {d.id}</div>
                <h2 className="text-lg leading-snug">{d.nombre}</h2>
                <div className="mt-1.5 flex flex-wrap gap-1">{d.ra.map((r) => <span key={r} className="chip">{r}</span>)}</div>
              </div>
              {sup === 5 && <span className="chip border-ok/50 bg-ok/10 text-ok">Completado</span>}
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-mute"><span>Prácticas</span><span>{sup}/5 niveles</span></div>
              <div className="flex gap-1" aria-label={`${sup} de 5 niveles superados`}>{[1, 2, 3, 4, 5].map((n) => <span key={n} className={`h-1.5 flex-1 rounded ${estadoNivel(intentos, d.id, n).superado ? 'bg-ok' : 'bg-line'}`} />)}</div>
            </div>
            <div className="mt-auto flex flex-wrap gap-2">
              <Link to={`/distrito/${d.id}/teoria`} className="btn btn-ghost no-underline" aria-label={`Teoría del bloque ${d.id}`}><Icon n="doc" className="h-4 w-4" />Teoría{t ? ` · ${cuenta(d.id)}/${t.secciones.length}` : ''}</Link>
              <Link to={`/distrito/${d.id}`} aria-label={`Bloque ${d.id}: ${d.nombre}`} className="btn no-underline"><Icon n="play" className="h-4 w-4" />Prácticas</Link>
            </div>
          </li>
        ))}
        <li className={`card flex flex-wrap items-center gap-4 md:col-span-2 ${abiertoEpi ? 'border-acc/50' : 'border-dashed opacity-70'}`}>
          <span className="grid h-11 w-11 place-items-center rounded-md border border-line text-acc"><Icon n={abiertoEpi ? 'crown' : 'lock'} className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1"><div className="eyebrow">Epílogo · prueba final</div><h2 className="text-lg">La Gran Inspección</h2><p className="text-sm text-mute">Auditoría integral de una instalación completa (canalizaciones, circuitos, cuadro, local especial, automatismo, medidas y documentación). Se desbloquea al superar la evaluación final (N5) de los 8 bloques.</p></div>
          {abiertoEpi && <Link to="/epilogo" className="btn no-underline" aria-label="Iniciar La Gran Inspección"><Icon n="play" className="h-4 w-4" />Iniciar</Link>}
        </li>
      </ul>
    </main>
  );
}
