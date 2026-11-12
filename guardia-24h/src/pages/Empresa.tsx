import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { listarAlumnosLocales } from '../data/local';
import { repo } from '../data';
import { items } from '../data/content';
import { buscaCodigo, leeReto } from '../game/extras';
import { BONUS_XP, LOGROS, nuevosLogros } from '../game/logros';
import { useProgreso } from '../game/datos';
import { useTeoriaLeida } from '../game/teoria';
import { RANGOS, rangoDe, useStore } from '../game/store';
import { useEffect } from 'react';

/** «Mi empresa»: reputación, dinero, logros, códigos de taller y ranking. Nada de esto afecta a la nota. */
export function Empresa() {
  const { sesion, estado, recompensa } = useStore();
  const { respuestas, intentos } = useProgreso();
  const { leidas } = useTeoriaLeida();
  const [codigo, setCodigo] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [rank, setRank] = useState<{ alias: string; clase: string; xp: number }[]>([]);
  const reto = leeReto();
  useEffect(() => {
    void (async () => {
      const al = await listarAlumnosLocales();
      const filas = await Promise.all(al.map(async (a) => ({ alias: a.alias, clase: a.clase, xp: (await repo.cargarEstado(a.uid)).xp })));
      setRank(filas.sort((a, b) => b.xp - a.xp));
    })();
  }, [estado.xp]);
  const ctx = useMemo(() => ({ respuestas, intentos, items, teoriaLeida: Object.values(leidas).reduce((a, l) => a + l.length, 0) }), [respuestas, intentos, leidas]);
  const pendientes = nuevosLogros(ctx, estado.logros);
  const canjear = async () => {
    const c = buscaCodigo(codigo);
    if (!c) return setMsg({ ok: false, t: 'Código no válido.' });
    if (estado.inventario.includes(`codigo:${c.codigo}`)) return setMsg({ ok: false, t: 'Este código ya se ha canjeado.' });
    await recompensa({ xp: c.xp, dinero: c.dinero, inventario: [`codigo:${c.codigo}`] });
    setMsg({ ok: true, t: `Práctica de taller validada: ${c.descripcion}. +${c.xp} XP y +${c.dinero} €.` }); setCodigo('');
  };
  const idx = RANGOS.findIndex((r) => r.nombre === rangoDe(estado.xp));
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <span className="cinta">Fuera de la nota</span>
      <h1 className="mt-1">Mi empresa</h1>
      <dl className="mt-4 grid grid-cols-2 divide-x divide-line border-y-2 border-tinta sm:grid-cols-4">
        {[['Rango', rangoDe(estado.xp)], ['Experiencia', `${estado.xp} XP`], ['Reputación', `${estado.reputacion} de 100`], ['Tesorería', `${estado.dinero} €`]].map(([k, v]) => <div key={k} className="px-4 py-3 first:pl-0"><dt className="eyebrow">{k}</dt><dd className="mt-0.5 font-display text-3xl font-bold leading-none">{v}</dd></div>)}
      </dl>
      <div className="mt-2 h-1.5 overflow-hidden rounded bg-line" aria-label="Reputación"><div className="h-full bg-info transition-all" style={{ width: `${estado.reputacion}%` }} /></div>
      <p className="mt-1 text-xs text-mute">Rangos: {RANGOS.map((r, i) => <span key={r.nombre} className={i === idx ? 'font-semibold text-acct' : ''}>{r.nombre} ({r.xp}){i < RANGOS.length - 1 ? ' → ' : ''}</span>)}</p>

      {reto && <section className="card mt-6 !border-acc/40"><div className="eyebrow !text-acct">Reto de la semana</div><p className="mt-1">Supera el nivel N{reto.nivel} del bloque {reto.distrito}: <b className="text-acct">+{reto.xp} XP</b>{estado.inventario.includes(`reto:${reto.desde}`) ? ' · completado' : ''}.</p></section>}

      <h2 className="mt-8 mb-2">Logros: {estado.logros.length} de {LOGROS.length}</h2>
      <ul className="divide-y divide-line border-y border-line">
        {LOGROS.map((l) => { const ok = estado.logros.includes(l.id); return (
          <li key={l.id} className={`flex items-start gap-3 py-2.5 ${ok ? '' : 'opacity-55'}`}>
            <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-[2px] border border-tinta ${ok ? 'bg-acc text-tinta' : 'bg-panel2 text-mute'}`}><Icon n={ok ? 'check' : 'lock'} className="h-3.5 w-3.5" /></span>
            <div className="sm:flex sm:flex-1 sm:items-baseline sm:gap-4"><div className="w-48 shrink-0 font-display text-lg font-bold leading-tight">{l.nombre}</div><div className="text-sm text-mute">{l.descripcion}</div></div>
          </li>); })}
      </ul>
      {pendientes.length > 0 && <p className="mt-2 text-xs text-mute">Tienes logros por reclamar: se otorgan (+{BONUS_XP} XP) al terminar tu próximo intento.</p>}

      <h2 className="mt-8 mb-2">Código de taller</h2>
      <div className="card max-w-xl">
        <p className="text-sm text-mute">Al validar tu práctica real en el taller, el profesor te da un código de un solo uso. Desbloquea experiencia y tesorería, pero no sustituye a los puntos de evaluación.</p>
        <div className="mt-3 flex gap-2"><input aria-label="Código de taller" className="input font-mono uppercase" placeholder="TALLER-XXXXXX" value={codigo} onChange={(e) => setCodigo(e.target.value)} /><button className="btn" disabled={!codigo.trim()} onClick={() => void canjear()}>Canjear</button></div>
        {msg && <p role="status" className={`mt-2 text-sm ${msg.ok ? 'text-ok' : 'text-bad'}`}>{msg.t}</p>}
      </div>

      <h2 className="mt-8 mb-2">Ranking de este dispositivo</h2>
      <div className="overflow-x-auto rounded border border-line">
        <table className="w-full text-left text-sm"><thead className="bg-panel2 text-[13px] font-semibold text-mute"><tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Alias</th><th className="px-3 py-2">Clase</th><th className="px-3 py-2 text-right">XP</th></tr></thead>
          <tbody>{rank.map((r, i) => <tr key={r.alias + r.clase} className={`border-t border-line ${r.alias === sesion?.alias ? 'bg-acc/10' : ''}`}><td className="px-3 py-2 font-mono text-mute">{i + 1}</td><td className="px-3 py-2">{r.alias}</td><td className="px-3 py-2 text-mute">{r.clase}</td><td className="px-3 py-2 text-right font-mono">{r.xp}</td></tr>)}</tbody></table>
      </div>
      <p className="mt-1 text-xs text-mute">El ranking compartido de toda la clase llegará con el panel en la nube. Aquí solo aparecen alumnos que han usado este dispositivo.</p>
    </main>
  );
}
