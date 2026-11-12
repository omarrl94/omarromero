import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CitaSelector } from '../components/CitaSelector';
import { repo, type Respuesta } from '../data';
import { distritos, items } from '../data/content';
import type { Item } from '../data/schemas';
import { evalua, type Entrada } from '../game/evaluar';
import { useProgreso, leeOverrides } from '../game/datos';
import { peMaximo } from '../game/grading';
import { ITEMS_POR_INTENTO, estadoNivel, nivelAbierto, seleccionaItems } from '../game/progreso';
import { useStore } from '../game/store';
import type { Cita } from '../library/search';

export function Nivel() {
  const { id, n } = useParams();
  const d = distritos.find((x) => x.id === Number(id));
  const nivel = Number(n);
  const sesion = useStore((s) => s.sesion)!;
  const sumaXp = useStore((s) => s.sumaXp);
  const { intentos, respuestas, cargado, recarga } = useProgreso();
  const [intento, setIntento] = useState<{ semilla: string; lista: Item[] } | null>(null);
  const [fin, setFin] = useState<{ pe: number; max: number; rs: Respuesta[] } | null>(null);
  if (!d || !(nivel >= 1 && nivel <= 5)) return <main className="p-4">Nivel no encontrado.</main>;
  if (!cargado) return <main className="p-4">Cargando…</main>;
  const ov = leeOverrides(sesion.uid);
  const estado = estadoNivel(intentos, d.id, nivel, ov.desbloqueos[`${d.id}-${nivel}`] ?? 0);
  const abierto = nivelAbierto(intentos, d.id, nivel);
  const banco = items.filter((i) => i.distrito === d.id && i.nivel === nivel);

  function empezar() {
    const vistos = new Set(respuestas.filter((r) => r.distrito === d!.id && r.nivel === nivel).map((r) => r.item_id));
    const semilla = `${sesion.uid}:${d!.id}:${nivel}:${estado.intentos}`;
    setFin(null);
    setIntento({ semilla, lista: seleccionaItems(banco, vistos, semilla) });
  }

  if (intento) {
    return <Jugando semilla={intento.semilla} lista={intento.lista} onFin={async (rs, segundos, consultas) => {
      const pe = rs.reduce((s, r) => s + r.pe_obtained, 0), max = rs.reduce((s, r) => s + r.pe_max, 0);
      await repo.guardarRespuestas(sesion.uid, rs);
      await repo.registrarIntento(sesion.uid, { distrito: d.id, nivel, seed: intento.semilla, pe_obtained: pe, pe_max: max, lives_lost: 0, consult_count: consultas, time_s: segundos, ts: Date.now() });
      await sumaXp(Math.round(pe * 10));
      await recarga();
      setIntento(null); setFin({ pe, max, rs });
    }} />;
  }

  return (
    <main className="mx-auto max-w-3xl p-4">
      <Link to={`/distrito/${d.id}`} className="underline">← Distrito {d.id}</Link>
      <h1 className="my-2 font-titulo text-2xl font-black">N{nivel} · {d.niveles[nivel - 1]?.nombre}</h1>
      <p>{d.niveles[nivel - 1]?.descripcion}</p>
      <p className="my-2 text-sm">Banco: {banco.length} ítems · Intentos: {estado.intentos}/3 · Mejor: {Math.round(estado.mejor * 100)} %</p>
      {fin && (
        <section className="card my-3" role="status">
          <h2 className="font-bold">Resultado: {fin.pe.toFixed(2)} / {fin.max.toFixed(2)} PE ({Math.round((fin.pe / fin.max) * 100)} %)</h2>
          <p>{fin.pe / fin.max >= 0.5 ? '✅ Nivel superado' : '❌ Necesitas el 50 % de los PE. Puedes repetir con ítems distintos.'}</p>
        </section>
      )}
      {!abierto ? <p className="card">🔒 Supera antes el nivel anterior.</p>
        : banco.length === 0 ? <p className="card">Este nivel aún no tiene ítems (se añaden como ficheros en <code>content/</code>).</p>
        : estado.bloqueadoPorIntentos ? <p className="card">Has agotado los 3 intentos. Pide a tu profesor que desbloquee el nivel.</p>
        : <button className="btn" onClick={empezar}>{estado.intentos ? 'Nuevo intento' : 'Empezar'} ({Math.min(ITEMS_POR_INTENTO, banco.length)} ítems)</button>}
    </main>
  );
}

function Jugando({ semilla, lista, onFin }: { semilla: string; lista: Item[]; onFin: (rs: Respuesta[], segundos: number, consultas: number) => Promise<void> }) {
  const t0 = useRef(Date.now());
  const [k, setK] = useState(0);
  const [rs, setRs] = useState<Respuesta[]>([]);
  const [e, setE] = useState<Entrada>({ pistas: 0 });
  const [res, setRes] = useState<Respuesta | null>(null);
  const [consultas, setConsultas] = useState(0);
  const item = lista[k]!;
  const orden = useMemo(() => item.opciones?.map((_, i) => i) ?? [], [item]);
  void semilla;
  const comprobar = () => setRes(evalua(item, e));
  const siguiente = async () => {
    const nuevo = [...rs, res!];
    if (k + 1 >= lista.length) { await onFin(nuevo, Math.round((Date.now() - t0.current) / 1000), consultas); return; }
    setRs(nuevo); setRes(null); setE({ pistas: 0 }); setK(k + 1);
  };
  const pista = () => setE((x) => (x.pistas < item.pistas.length ? { ...x, pistas: x.pistas + 1 } : x));
  const completo = item.tipo === 'opcion_multiple' ? e.opcion !== undefined : item.tipo === 'verdadero_falso' ? e.vf !== undefined
    : item.tipo === 'numerico' ? e.numero !== undefined && !Number.isNaN(e.numero) : Boolean(e.cita);

  return (
    <main className="mx-auto max-w-3xl p-4">
      <p className="text-sm">Ítem {k + 1} de {lista.length} · máx. {peMaximo(item).toFixed(2)} PE · RA {item.ra.join(', ')}</p>
      <h1 className="my-2 text-xl font-bold">{item.enunciado}</h1>
      <fieldset disabled={Boolean(res)} className="grid gap-2">
        {item.tipo === 'opcion_multiple' && orden.map((i) => (
          <label key={i} className="card flex cursor-pointer gap-2"><input type="radio" name="op" checked={e.opcion === i} onChange={() => setE({ ...e, opcion: i })} />{item.opciones![i]}</label>
        ))}
        {item.tipo === 'verdadero_falso' && [true, false].map((v) => (
          <label key={String(v)} className="card flex cursor-pointer gap-2"><input type="radio" name="vf" checked={e.vf === v} onChange={() => setE({ ...e, vf: v })} />{v ? 'Verdadero' : 'Falso'}</label>
        ))}
        {item.tipo === 'numerico' && (
          <label>Respuesta numérica<input className="input" inputMode="decimal" onChange={(ev) => setE({ ...e, numero: parseFloat(ev.target.value.replace(',', '.')) })} /></label>
        )}
        {(item.requiere_cita || item.tipo === 'selector_cita') && <CitaSelector onChange={(c: Cita | null) => setE((x) => ({ ...x, cita: c }))} />}
      </fieldset>
      <p className="my-2 text-sm">
        <a href="/biblioteca" target="_blank" rel="noreferrer" className="underline" onClick={() => setConsultas((c) => c + 1)}>📚 Consultar biblioteca (no resta)</a>
      </p>
      {e.pistas > 0 && <ul className="my-2 rounded bg-amarillo/50 p-2 text-sm">{item.pistas.slice(0, e.pistas).map((p) => <li key={p}>💡 {p}</li>)}</ul>}
      {res ? (
        <section className="card" role="status">
          <p className="font-bold">{res.correct ? '✅ Correcto' : '❌ Incorrecto'} · {res.pe_obtained.toFixed(2)} PE</p>
          {item.requiere_cita && <p>{res.cite_ok ? 'Cita correcta.' : `Cita no válida. Esperada: ${item.citas_validas.map((c) => `${c.doc} ${c.ref}`).join(' / ')}`}</p>}
          <p className="text-sm">{item.explicacion}</p>
          <button className="btn mt-2" onClick={() => void siguiente()}>{k + 1 >= lista.length ? 'Terminar' : 'Siguiente'}</button>
        </section>
      ) : (
        <div className="flex gap-2">
          <button className="btn" disabled={!completo} onClick={comprobar}>Comprobar</button>
          <button className="btn bg-white" onClick={pista} disabled={e.pistas >= item.pistas.length}>Pista (−20 %)</button>
        </div>
      )}
    </main>
  );
}
