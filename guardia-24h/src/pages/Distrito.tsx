import { Link, useParams } from 'react-router-dom';
import { Icon, ICONO_DISTRITO } from '../components/Icon';
import { distritos, items, teoria } from '../data/content';
import { useProgreso } from '../game/datos';
import { estadoNivel, nivelAbierto } from '../game/progreso';
import { useTeoriaLeida } from '../game/teoria';

export const calificacion = (frac: number) => (frac >= 0.9 ? 'Sobresaliente' : frac >= 0.75 ? 'Notable' : frac >= 0.5 ? 'Aprobado' : 'Insuficiente');

export function Distrito() {
  const { id } = useParams();
  const d = distritos.find((x) => x.id === Number(id));
  const t = teoria.find((x) => x.distrito === Number(id));
  const { intentos } = useProgreso();
  const { cuenta } = useTeoriaLeida();
  if (!d) return <main className="p-6">Bloque no encontrado. <Link to="/">Volver</Link></main>;
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Link to="/" className="flex items-center gap-1 text-sm text-mute hover:text-tx"><Icon n="left" className="h-4 w-4" />Plan formativo</Link>
      <header className="mt-3 flex items-start gap-4 border-b border-line pb-5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-line bg-panel2 text-acct"><Icon n={ICONO_DISTRITO[d.id]!} className="h-6 w-6" /></span>
        <div>
          <span className="cinta">Bloque {d.id}</span>
          <h1 className="text-2xl sm:text-3xl">{d.nombre}</h1>
          <div className="mt-2 flex flex-wrap gap-1">{d.ra.map((r) => <span key={r} className="chip chip-acc">{r}</span>)}{d.itc.map((i) => <span key={i} className="chip font-mono">{i.startsWith('ITC') ? i : `ITC-BT-${i}`}</span>)}</div>
        </div>
      </header>
      {d.pendiente?.map((p) => <p key={p} className="mt-3 rounded-md border border-warn/50 bg-warn/10 p-3 text-sm text-warn">{p}</p>)}
      {t && (
        <Link to={`/distrito/${d.id}/teoria`} className="card mt-5 flex items-center gap-4 text-tx no-underline hover:border-acc">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-acc/10 text-acct"><Icon n="doc" /></span>
          <div className="flex-1"><div className="font-semibold">Teoría del bloque</div><div className="text-sm text-mute">{t.secciones.length} secciones · {cuenta(d.id)} leídas. Estudia antes de las prácticas.</div></div>
          <Icon n="right" className="text-mute" />
        </Link>
      )}
      <h2 className="eyebrow mt-8 mb-3">Prácticas por niveles</h2>
      <ol className="grid gap-3">
        {d.niveles.map((n) => {
          const cuantos = items.filter((it) => it.distrito === d.id && it.nivel === n.n).length;
          const est = estadoNivel(intentos, d.id, n.n);
          const abierto = nivelAbierto(intentos, d.id, n.n);
          const jefe = n.n === 5;
          return (
            <li key={n.n} className={`card flex flex-wrap items-center gap-4 ${abierto ? '' : 'opacity-60'} ${jefe ? 'border-acc/40' : ''}`}>
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-md font-mono text-sm font-bold ${est.superado ? 'bg-ok/15 text-ok' : abierto ? 'bg-acc/15 text-acct' : 'bg-panel2 text-mute'}`}>{abierto ? (est.superado ? <Icon n="check" /> : `N${n.n}`) : <Icon n="lock" className="h-4 w-4" />}</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">N{n.n} · {n.nombre}{jefe && <span className="chip chip-acc ml-2 align-middle">Evaluación final</span>}</div>
                <p className="text-sm text-mute">{n.descripcion}</p>
                <p className="mt-1 text-xs text-mute">{cuantos} ítems · intentos {est.intentos}/3 · mejor {Math.round(est.mejor * 100)} %{est.intentos > 0 && ` · ${calificacion(est.mejor)}`}</p>
              </div>
              {abierto && cuantos > 0 && <Link className="btn no-underline" to={`/distrito/${d.id}/nivel/${n.n}`}><Icon n="play" className="h-4 w-4" />Practicar</Link>}
              {!abierto && <span className="text-xs text-mute">Requiere superar N{n.n - 1}</span>}
            </li>
          );
        })}
      </ol>
    </main>
  );
}
