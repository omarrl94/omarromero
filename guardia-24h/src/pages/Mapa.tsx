import { Link } from 'react-router-dom';
import { Icon, ICONO_DISTRITO } from '../components/Icon';
import { distritos, teoria } from '../data/content';
import { useProgreso } from '../game/datos';
import { estadoNivel } from '../game/progreso';
import { useTeoriaLeida } from '../game/teoria';
import { leeReto } from '../game/extras';

export function Mapa() {
  const { intentos } = useProgreso();
  const { cuenta } = useTeoriaLeida();
  const datos = distritos.filter((d) => d.id > 0).map((d) => ({ d, sup: [1, 2, 3, 4, 5].filter((n) => estadoNivel(intentos, d.id, n).superado).length, t: teoria.find((x) => x.distrito === d.id) }));
  const abiertoEpi = [1, 2, 3, 4, 5, 6, 7, 8].every((b) => estadoNivel(intentos, b, 5).superado);
  const total = datos.reduce((s, x) => s + x.sup, 0);
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <span className="cinta">Módulo 0518 TPIE</span>
      <h1 className="mt-2">Campaña: 8 bloques</h1>
      <p className="mt-1 max-w-2xl text-mute">Cada bloque se corresponde con un bloque didáctico del módulo: estudia la teoría, resuelve las prácticas por niveles y supera la intervención final.</p>
      {leeReto() && <div className="card mt-4 flex items-center gap-3 !border-acc/40 !py-2 text-sm"><span className="chip chip-acc">RETO SEMANAL</span>Supera el N{leeReto()!.nivel} del bloque {leeReto()!.distrito}: +{leeReto()!.xp} XP</div>}
      <div className="mt-4 flex items-center gap-3 text-sm text-mute" aria-label="Progreso global">
        <div className="h-2 w-56 overflow-hidden rounded-[2px] border border-tinta/40 bg-panel2"><div className="h-full bg-acc transition-all" style={{ width: `${(total / 40) * 100}%` }} /></div>
        <span>{total} de 40 niveles superados</span>
      </div>
      <section className="mt-6" aria-label="Esquema de bloques">
        <div className="hidden grid-cols-[4.5rem_1fr_11rem_auto] gap-4 border-b-2 border-tinta pb-1 text-sm font-semibold text-mute md:grid"><span>Línea</span><span>Bloque</span><span>Niveles superados</span><span className="w-[17.5rem]">Acceso</span></div>
        <ul>
          {datos.map(({ d, sup, t }) => (
            <li key={d.id} className="grid items-center gap-x-4 gap-y-2 border-b border-line py-3 md:grid-cols-[4.5rem_1fr_11rem_auto]">
              <span className="cinta w-fit !px-2.5 !text-[16px]">B{d.id}</span>
              <div className="min-w-0">
                <h2 className="flex items-center gap-2"><Icon n={ICONO_DISTRITO[d.id]!} className="h-5 w-5 shrink-0 text-acct" />{d.nombre}</h2>
                <p className="text-sm text-mute">Resultados de aprendizaje {d.ra.join(', ')}{sup === 5 ? '. Bloque completado.' : ''}</p>
              </div>
              <div className="flex gap-1.5" role="img" aria-label={`${sup} de 5 niveles superados`}>
                {[1, 2, 3, 4, 5].map((n) => { const on = estadoNivel(intentos, d.id, n).superado; return (
                  <span key={n} className="relative h-8 w-5 rounded-[2px] border border-tinta bg-[#cfd8d3] shadow-[inset_0_-3px_0_rgba(0,0,0,.15)]" title={`N${n}`}>
                    <span className={`absolute inset-x-[3px] h-3 rounded-[1px] border border-tinta transition-all ${on ? 'top-[3px] bg-acc' : 'bottom-[3px] bg-tinta'}`} />
                  </span>); })}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/distrito/${d.id}/teoria`} className="btn btn-ghost" aria-label={`Teoría del bloque ${d.id}`}><Icon n="doc" className="h-4 w-4" />Teoría{t ? ` ${cuenta(d.id)}/${t.secciones.length}` : ''}</Link>
                <Link to={`/distrito/${d.id}`} aria-label={`Bloque ${d.id}: ${d.nombre}`} className="btn"><Icon n="play" className="h-4 w-4" />Prácticas</Link>
              </div>
            </li>
          ))}
          <li className={`grid items-center gap-x-4 gap-y-2 py-4 md:grid-cols-[4.5rem_1fr_11rem_auto] ${abiertoEpi ? '' : 'opacity-70'}`}>
            <span className="cinta w-fit !px-2.5 !text-[16px]">Final</span>
            <div><h2 className="flex items-center gap-2"><Icon n={abiertoEpi ? 'crown' : 'lock'} className="h-5 w-5 text-acct" />La Gran Inspección</h2><p className="text-sm text-mute">Auditoría de una instalación completa. Se abre al superar la evaluación final de los 8 bloques.</p></div>
            <span />
            <div>{abiertoEpi && <Link to="/epilogo" className="btn" aria-label="Iniciar La Gran Inspección"><Icon n="play" className="h-4 w-4" />Iniciar</Link>}</div>
          </li>
        </ul>
      </section>
    </main>
  );
}
