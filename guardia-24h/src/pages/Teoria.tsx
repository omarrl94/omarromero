import { Link, useParams } from 'react-router-dom';
import { Icon, ICONO_DISTRITO } from '../components/Icon';
import { distritos, teoria } from '../data/content';
import type { BloqueTeoria } from '../data/schemas';
import { useTeoriaLeida } from '../game/teoria';

const AVISO = {
  seguridad: { t: 'Seguridad', c: 'border-bad bg-bad/10 text-bad' },
  norma: { t: 'Norma', c: 'border-info bg-info/10 text-info' },
  clave: { t: 'Clave', c: 'border-acc bg-acc/10 text-acct' },
} as const;

function Bloque({ b }: { b: BloqueTeoria }) {
  switch (b.t) {
    case 'p': return <p className="leading-relaxed text-tx/90">{b.x}</p>;
    case 'ul': return <ul className="ml-5 list-disc space-y-1.5 leading-relaxed text-tx/90 marker:text-acct">{b.items.map((i) => <li key={i}>{i}</li>)}</ul>;
    case 'ol': return <ol className="ml-5 list-decimal space-y-1.5 leading-relaxed text-tx/90 marker:font-mono marker:text-acct">{b.items.map((i) => <li key={i}>{i}</li>)}</ol>;
    case 'formula': return (
      <div className="rounded-md border border-line bg-ink px-4 py-3">
        <div className="eyebrow mb-1">Expresión</div>
        <div className="font-mono text-lg text-acct">{b.x}</div>
        {b.nota && <p className="mt-2 text-sm text-mute">{b.nota}</p>}
      </div>
    );
    case 'ejemplo': return (
      <div className="rounded-md border border-line bg-panel2 p-4">
        <div className="eyebrow mb-2">Ejemplo resuelto · {b.titulo}</div>
        <ol className="space-y-1.5 font-mono text-[13px] leading-relaxed">{b.pasos.map((p, i) => <li key={i} className="flex gap-3"><span className="text-acct">{i === 0 ? '▸' : `${i}.`}</span><span>{p}</span></li>)}</ol>
      </div>
    );
    case 'aviso': return (
      <div className={`rounded-md border-l-4 px-4 py-3 text-sm leading-relaxed ${AVISO[b.nivel].c}`}>
        <span className="eyebrow !text-inherit">{AVISO[b.nivel].t}</span>
        <p className="mt-1 text-tx/90">{b.x}</p>
      </div>
    );
    case 'norma': return (
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-panel2 px-4 py-3 text-sm">
        <span className="chip chip-acc font-mono">{b.ref}</span>
        <span className="flex-1 text-tx/90">{b.x}</span>
        <Link to={`/biblioteca?q=${encodeURIComponent(b.ref)}`} className="flex items-center gap-1 text-xs font-semibold"><Icon n="search" className="h-3.5 w-3.5" />Buscar en la biblioteca</Link>
      </div>
    );
    case 'tabla': return (
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel2 text-xs uppercase tracking-wider text-mute"><tr>{b.cab.map((c) => <th key={c} className="px-3 py-2 font-semibold">{c}</th>)}</tr></thead>
          <tbody>{b.filas.map((f, i) => <tr key={i} className="border-t border-line">{f.map((c, j) => <td key={j} className={`px-3 py-2 align-top ${j === 0 ? 'font-medium text-tx' : 'text-tx/85'}`}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
  }
}

export function Teoria() {
  const { id } = useParams();
  const d = distritos.find((x) => x.id === Number(id));
  const t = teoria.find((x) => x.distrito === Number(id));
  const { leidas, alterna } = useTeoriaLeida();
  if (!d || !t) return <main className="mx-auto max-w-3xl p-6">Teoría no disponible. <Link to="/">Volver</Link></main>;
  const hechas = new Set(leidas[String(d.id)] ?? []);
  const pct = Math.round((hechas.size / t.secciones.length) * 100);
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Link to={`/distrito/${d.id}`} className="flex items-center gap-1 text-sm text-mute hover:text-tx"><Icon n="left" className="h-4 w-4" />Bloque {d.id}</Link>
      <header className="mt-3 flex flex-wrap items-start gap-4 border-b border-line pb-6">
        <span className="grid h-12 w-12 place-items-center rounded-md border border-line bg-panel2 text-acct"><Icon n={ICONO_DISTRITO[d.id]!} className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <span className="cinta">Bloque {d.id} · Teoría</span>
          <h1 className="text-2xl sm:text-3xl">{t.titulo}</h1>
          <p className="mt-1 max-w-3xl text-mute">{t.resumen}</p>
        </div>
        <div className="w-40 shrink-0">
          <div className="eyebrow mb-1">Lectura {pct} %</div>
          <div className="h-1.5 overflow-hidden rounded bg-line" role="progressbar" aria-label="Lectura" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-ok transition-all" style={{ width: `${pct}%` }} /></div>
        </div>
      </header>
      <div className="mt-6 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="eyebrow mb-2">Contenido</div>
          <ol className="space-y-1 text-sm">
            {t.secciones.map((s, i) => (
              <li key={s.id}><a href={`#${s.id}`} className="flex items-center gap-2 rounded px-2 py-1.5 text-tx/85 hover:bg-panel2">
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] ${hechas.has(s.id) ? 'border-ok bg-ok text-white' : 'border-line text-mute'}`}>{hechas.has(s.id) ? <Icon n="check" className="h-3 w-3" /> : i + 1}</span>{s.titulo}
              </a></li>
            ))}
          </ol>
          <div className="mt-5 rounded-md border border-line p-3">
            <div className="eyebrow mb-2">Objetivos</div>
            <ul className="ml-4 list-disc space-y-1 text-xs text-mute">{t.objetivos.map((o) => <li key={o}>{o}</li>)}</ul>
          </div>
        </aside>
        <article className="space-y-10">
          {t.secciones.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 space-y-4">
              <h2 className="flex items-baseline gap-3 text-xl"><span className="font-mono text-sm text-acct">{String(i + 1).padStart(2, '0')}</span>{s.titulo}</h2>
              {s.bloques.map((b, j) => <Bloque key={j} b={b} />)}
              <button className={`btn ${hechas.has(s.id) ? 'btn-ghost' : ''}`} onClick={() => alterna(d.id, s.id)}>
                <Icon n="check" className="h-4 w-4" />{hechas.has(s.id) ? 'Leída · desmarcar' : 'Marcar como leída'}
              </button>
            </section>
          ))}
          <div className="rounded-lg border border-line bg-panel p-5">
            <div className="eyebrow">Siguiente paso</div>
            <p className="mt-1 text-tx/90">Aplica lo estudiado en las prácticas del bloque. Consultar la biblioteca durante las prácticas no penaliza: puntúa localizar y citar.</p>
            <Link to={`/distrito/${d.id}`} className="btn mt-3 no-underline">Ir a las prácticas<Icon n="right" className="h-4 w-4" /></Link>
          </div>
          {!t.verificado && <p className="text-xs text-mute">Texto en borrador pendiente de revisión del profesor. Los valores normativos deben contrastarse con el REBT oficial.</p>}
        </article>
      </div>
    </main>
  );
}
