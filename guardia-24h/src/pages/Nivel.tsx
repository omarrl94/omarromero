import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Acta } from '../components/Acta';
import { CitaSelector } from '../components/CitaSelector';
import { Cableado } from '../components/Cableado';
import { Escena } from '../components/Escena';
import { Icon, ICONO_DISTRITO } from '../components/Icon';
import { Instrumento } from '../components/Instrumento';
import { repo, type Respuesta } from '../data';
import { distritos, items, normaLista } from '../data/content';
import type { Item } from '../data/schemas';
import { validaCuadro, type Propuesta } from '../engine/cuadro';
import { tablaVivienda } from '../game/calculos';
import { leeOverrides, useProgreso } from '../game/datos';
import { evalua, type Entrada } from '../game/evaluar';
import { peMaximo } from '../game/grading';
import { ITEMS_POR_INTENTO, estadoNivel, nivelAbierto, seleccionaItems } from '../game/progreso';
import { sonidoClick, sonidoFallo, sonidoOk, sonidoVictoria } from '../game/sound';
import { useStore } from '../game/store';
import type { Cita } from '../library/search';
import { calificacion } from './Distrito';

const TIPO: Record<string, string> = { opcion_multiple: 'Test', verdadero_falso: 'Verdadero / Falso', numerico: 'Cálculo', selector_cita: 'Gymkhana del REBT', dimensionado: 'Dimensionado', hotspots: 'Muro de la vergüenza', instrumento: 'Diagnóstico', automatismo: 'Cableado de maniobra', acta: 'Acta de verificación' };

type Fin = { pe: number; max: number; xp: number; filas: { item: Item; r: Respuesta }[] };

export function Nivel() {
  const { id, n } = useParams();
  const d = distritos.find((x) => x.id === Number(id));
  const nivel = Number(n);
  const sesion = useStore((s) => s.sesion)!;
  const sumaXp = useStore((s) => s.sumaXp);
  const { intentos, respuestas, cargado, recarga } = useProgreso();
  const [intento, setIntento] = useState<{ semilla: string; lista: Item[] } | null>(null);
  const [fin, setFin] = useState<Fin | null>(null);
  if (!d || !(nivel >= 1 && nivel <= 5)) return <main className="p-4">Nivel no encontrado.</main>;
  if (!cargado) return <main className="p-4">Cargando…</main>;
  const ov = leeOverrides(sesion.uid);
  const estado = estadoNivel(intentos, d.id, nivel, ov.desbloqueos?.[`${d.id}-${nivel}`] ?? 0);
  const abierto = nivelAbierto(intentos, d.id, nivel);
  const banco = items.filter((i) => i.distrito === d.id && i.nivel === nivel);
  const info = d.niveles[nivel - 1]!;

  function empezar() {
    sonidoClick();
    const vistos = new Set(respuestas.filter((r) => r.distrito === d!.id && r.nivel === nivel).map((r) => r.item_id));
    const semilla = `${sesion.uid}:${d!.id}:${nivel}:${estado.intentos}`;
    setFin(null);
    setIntento({ semilla, lista: seleccionaItems(banco, vistos, semilla) });
  }

  if (intento) {
    return <Jugando lista={intento.lista} distrito={d.id} onFin={async (rs: Respuesta[], segundos: number, consultas: number, vidas: number) => {
      const pe = rs.reduce((s, r) => s + r.pe_obtained, 0), max = rs.reduce((s, r) => s + r.pe_max, 0);
      await repo.guardarRespuestas(sesion.uid, rs);
      await repo.registrarIntento(sesion.uid, { distrito: d.id, nivel, seed: intento.semilla, pe_obtained: pe, pe_max: max, lives_lost: vidas, consult_count: consultas, time_s: segundos, ts: Date.now() });
      const xp = Math.round(pe * 10);
      await sumaXp(xp); await recarga();
      if (pe / max >= 0.5) sonidoVictoria(); else sonidoFallo();
      setIntento(null); setFin({ pe, max, xp, filas: intento.lista.map((item, i) => ({ item, r: rs[i]! })) });
    }} />;
  }

  if (fin) {
    const frac = fin.pe / fin.max, ok = frac >= 0.5;
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="eyebrow">Bloque {d.id} · N{nivel} · {info.nombre}</div>
        <h1 className="mt-1 text-3xl">{ok ? 'Nivel superado' : 'Nivel no superado'}</h1>
        <section className="card mt-4" role="status">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
            <div><div className="eyebrow">Resultado</div><div className="font-mono text-3xl font-semibold">{fin.pe.toFixed(2)} <span className="text-lg text-mute">/ {fin.max.toFixed(2)} PE</span></div></div>
            <div><div className="eyebrow">Calificación</div><div className="text-xl font-semibold">{Math.round(frac * 100)} % · {calificacion(frac)}</div></div>
            <div><div className="eyebrow">Experiencia</div><div className="text-xl font-semibold text-acc">+{fin.xp} XP</div></div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded bg-line"><div className={`h-full ${ok ? 'bg-ok' : 'bg-bad'}`} style={{ width: `${Math.round(frac * 100)}%` }} /></div>
          <p className="mt-2 text-sm text-mute">{ok ? 'Has alcanzado el 50 % de los puntos de evaluación.' : 'Necesitas el 50 % de los puntos de evaluación. Repasa la teoría y repite con ítems distintos.'}</p>
        </section>
        <h2 className="eyebrow mt-6 mb-2">Revisión de ítems</h2>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-panel2 text-xs uppercase tracking-wider text-mute"><tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Enunciado</th><th className="px-3 py-2">RA</th><th className="px-3 py-2 text-right">PE</th></tr></thead>
            <tbody>{fin.filas.map(({ item, r }, i) => (
              <tr key={item.id} className="border-t border-line align-top">
                <td className="px-3 py-2 font-mono text-mute">{i + 1}</td>
                <td className="px-3 py-2">{item.enunciado.slice(0, 110)}{item.enunciado.length > 110 ? '…' : ''}<div className="mt-0.5 text-xs text-mute">{item.explicacion.replace(/\[BORRADOR[^\]]*\]/, '').trim().slice(0, 140)}</div></td>
                <td className="px-3 py-2 text-xs text-mute">{item.ra.join(', ')}</td>
                <td className={`px-3 py-2 text-right font-mono ${r.pe_obtained >= r.pe_max * 0.5 ? 'text-ok' : 'text-bad'}`}>{r.pe_obtained.toFixed(2)}/{r.pe_max.toFixed(2)}</td>
              </tr>))}</tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn btn-ghost no-underline" to={`/distrito/${d.id}`}><Icon n="left" className="h-4 w-4" />Volver al bloque</Link>
          <Link className="btn btn-ghost no-underline" to={`/distrito/${d.id}/teoria`}><Icon n="doc" className="h-4 w-4" />Repasar teoría</Link>
          {ok && nivel < 5 && <Link className="btn no-underline" onClick={() => setFin(null)} to={`/distrito/${d.id}/nivel/${nivel + 1}`}>Siguiente nivel<Icon n="right" className="h-4 w-4" /></Link>}
          {!estado.bloqueadoPorIntentos && <button className="btn btn-ghost" onClick={empezar}><Icon n="redo" className="h-4 w-4" />Nuevo intento</button>}
        </div>
      </main>
    );
  }

  const jefe = nivel === 5;
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link to={`/distrito/${d.id}`} className="flex items-center gap-1 text-sm text-mute hover:text-tx"><Icon n="left" className="h-4 w-4" />Bloque {d.id} · {d.nombre}</Link>
      <div className="mt-4 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-md border border-line bg-panel2 text-acc"><Icon n={jefe ? 'crown' : ICONO_DISTRITO[d.id]!} className="h-6 w-6" /></span><div><div className="eyebrow">{jefe ? 'Evaluación final del bloque' : `Nivel ${nivel}`}</div><h1 className="text-2xl">{info.nombre}</h1></div></div>
      <p className="mt-3 text-tx/90">{info.descripcion}</p>
      <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
        {[[banco.length, 'ítems en el banco'], [`${estado.intentos}/3`, 'intentos'], [`${Math.round(estado.mejor * 100)} %`, 'mejor resultado']].map(([v, l]) => <div key={String(l)} className="card !p-3"><dd className="font-mono text-xl font-semibold">{v}</dd><dt className="text-[11px] text-mute">{l}</dt></div>)}
      </dl>
      <ul className="mt-5 space-y-1 text-sm text-mute">
        <li>· Puedes consultar la biblioteca en cualquier momento: no penaliza.</li>
        <li>· Cada pista resta el 20 % de los puntos del ítem.</li>
        <li>· Responder sin citar la norma, cuando se exige, puntúa el 70 %.</li>
        <li>· Un error de seguridad grave anula el ítem.</li>
      </ul>
      <Link to={`/distrito/${d.id}/teoria`} className="mt-4 inline-flex items-center gap-1 text-sm"><Icon n="doc" className="h-4 w-4" />Repasar la teoría de este bloque</Link>
      <div className="mt-6">
        {!abierto ? <p className="card">Supera antes el nivel anterior.</p>
          : banco.length === 0 ? <p className="card">Este nivel aún no tiene ítems.</p>
          : estado.bloqueadoPorIntentos ? <p className="card">Has agotado los 3 intentos. Pide a tu profesor que desbloquee el nivel.</p>
          : <button className="btn btn-big" onClick={empezar}>{estado.intentos ? 'Nuevo intento' : 'Empezar'} ({Math.min(ITEMS_POR_INTENTO, banco.length)} ítems)</button>}
      </div>
    </main>
  );
}

function Jugando({ lista, distrito, onFin }: { lista: Item[]; distrito: number; onFin: (rs: Respuesta[], segundos: number, consultas: number, vidas: number) => Promise<void> }) {
  const t0 = useRef(Date.now());
  const [k, setK] = useState(0);
  const [rs, setRs] = useState<Respuesta[]>([]);
  const [e, setE] = useState<Entrada>({ pistas: 0 });
  const [res, setRes] = useState<Respuesta | null>(null);
  const [consultas, setConsultas] = useState(0);
  const [errores, setErrores] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const item = lista[k]!;
  const orden = useMemo(() => item.opciones?.map((_, i) => i) ?? [], [item]);
  const comprobar = () => {
    const r = evalua(item, e);
    setRes(r);
    if (r.pe_obtained >= r.pe_max * 0.5) sonidoOk(); else { sonidoFallo(); setErrores((v) => v + 1); }
  };
  const siguiente = async () => {
    sonidoClick();
    const nuevo = [...rs, res!];
    if (k + 1 >= lista.length) { setGuardando(true); await onFin(nuevo, Math.round((Date.now() - t0.current) / 1000), consultas, errores); return; }
    setRs(nuevo); setRes(null); setE({ pistas: 0 }); setK(k + 1);
  };
  const pista = () => { sonidoClick(); setE((x) => (x.pistas < item.pistas.length ? { ...x, pistas: x.pistas + 1 } : x)); };
  const sol = item.solucion as Record<string, unknown>;
  const completo = item.tipo === 'automatismo' ? (e.cables?.length ?? 0) > 0 : item.tipo === 'acta' ? Boolean(e.dictamen) && (item.pruebas ?? []).every((p) => e.acta?.[p.id])
    : item.tipo === 'opcion_multiple' || item.tipo === 'instrumento' ? e.opcion !== undefined
    : item.tipo === 'verdadero_falso' ? e.vf !== undefined
    : item.tipo === 'numerico' ? e.numero !== undefined && !Number.isNaN(e.numero)
    : item.tipo === 'hotspots' || item.tipo === 'dimensionado' ? true : Boolean(e.cita);
  const ok = res ? res.pe_obtained >= res.pe_max * 0.5 : false;
  const pct = ((k + (res ? 1 : 0)) / lista.length) * 100;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-48 pt-4">
      <div className="flex items-center gap-3">
        <Link to={`/distrito/${distrito}`} aria-label="Abandonar la intervención" className="text-mute hover:text-tx"><Icon n="x" /></Link>
        <div className="h-1.5 flex-1 overflow-hidden rounded bg-line" role="progressbar" aria-label="Progreso" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-acc transition-all duration-500" style={{ width: `${pct}%` }} /></div>
        <span className="font-mono text-xs text-mute">{k + 1}/{lista.length}</span>
      </div>
      <section key={item.id} className="card mt-4 animate-fade">
        <div className="mb-3 flex flex-wrap gap-1.5">
          <span className="chip chip-acc">{TIPO[item.tipo] ?? item.tipo}</span>
          {item.ra.map((r) => <span key={r} className="chip">{r}</span>)}
          <span className="chip font-mono">{peMaximo(item).toFixed(2)} PE</span>
        </div>
        <h1 className="text-lg font-semibold leading-snug sm:text-xl">{item.enunciado}</h1>
      </section>

      <fieldset disabled={Boolean(res)} className="mt-4 grid gap-3">
        {(item.tipo === 'opcion_multiple' || item.tipo === 'instrumento') && orden.map((i) => {
          const sel = e.opcion === i, correcta = res && sol.correcta === i;
          return (
            <label key={i} className={`tile ${sel && !res ? 'tile-sel' : ''} ${correcta ? '!border-ok !bg-ok/10' : ''} ${res && sel && !correcta ? '!border-bad !bg-bad/10' : ''}`}>
              <input type="radio" name="op" className="absolute inset-0 cursor-pointer opacity-0" checked={sel} onChange={() => { sonidoClick(); setE({ ...e, opcion: i }); }} />
              <span aria-hidden className={`grid h-6 w-6 shrink-0 place-items-center rounded border font-mono text-xs ${sel ? 'border-acc text-acc' : 'border-line text-mute'}`}>{'ABCD'[i]}</span>
              <span>{item.opciones![i]}</span>
            </label>
          );
        })}
        {item.tipo === 'verdadero_falso' && (
          <div className="grid grid-cols-2 gap-3">
            {[true, false].map((v) => {
              const sel = e.vf === v, correcta = res && sol.correcta === v;
              return (
                <label key={String(v)} className={`tile justify-center py-6 text-lg font-semibold ${sel && !res ? 'tile-sel' : ''} ${correcta ? '!border-ok !bg-ok/10' : ''} ${res && sel && !correcta ? '!border-bad !bg-bad/10' : ''}`}>
                  <input type="radio" name="vf" className="absolute inset-0 cursor-pointer opacity-0" checked={sel} onChange={() => { sonidoClick(); setE({ ...e, vf: v }); }} />
                  {v ? 'Verdadero' : 'Falso'}
                </label>
              );
            })}
          </div>
        )}
        {item.tipo === 'numerico' && (
          <label className="card text-sm font-medium">Respuesta numérica
            <input className="input mt-1 font-mono text-2xl" inputMode="decimal" placeholder="0" onChange={(ev) => setE({ ...e, numero: parseFloat(ev.target.value.replace(',', '.')) })} />
          </label>
        )}
        {item.tipo === 'instrumento' && item.circuito && (
          <Instrumento averia={item.circuito.averia} alimentadoInicial={item.circuito.alimentado} bloqueado={Boolean(res)} onSeguridad={() => setE((x) => ({ ...x, seguridad: true }))} />
        )}
        {item.tipo === 'automatismo' && item.automatismo && <Cableado comps={item.automatismo.componentes} fijos={item.automatismo.cablesFijos} cables={e.cables ?? []} onChange={(cables) => setE((x) => ({ ...x, cables }))} bloqueado={Boolean(res)} escenarios={item.automatismo.escenarios} revelar={Boolean(res)} />}
        {item.tipo === 'acta' && <Acta pruebas={item.pruebas ?? []} acta={e.acta ?? {}} dictamen={e.dictamen} revelar={Boolean(res)} onChange={(acta, dictamen) => setE((x) => ({ ...x, acta, dictamen }))} />}
        {item.tipo === 'hotspots' && item.escena && <Escena escena={item.escena} seleccion={e.seleccion ?? []} revelar={Boolean(res)} onChange={(seleccion) => setE((x) => ({ ...x, seleccion }))} />}
        {item.tipo === 'dimensionado' && <Dimensionado circuitos={(sol as { circuitos: string[] }).circuitos} onChange={(dim) => setE((x) => ({ ...x, dim }))} />}
        {(item.requiere_cita || item.tipo === 'selector_cita') && <CitaSelector onChange={(c: Cita | null) => setE((x) => ({ ...x, cita: c }))} />}
      </fieldset>

      {e.pistas > 0 && <ul className="mt-3 rounded-md border border-acc/40 bg-acc/10 p-3 text-sm">{item.pistas.slice(0, e.pistas).map((p) => <li key={p} className="flex gap-2"><Icon n="bulb" className="h-4 w-4 shrink-0 text-acc" />{p}</li>)}</ul>}

      {!res && (
        <div className="fixed inset-x-0 bottom-14 z-10 border-t border-line bg-ink/95 p-3 backdrop-blur md:bottom-0">
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            <button className="btn btn-ghost" onClick={pista} disabled={e.pistas >= item.pistas.length}><Icon n="bulb" className="h-4 w-4" />Pista <span className="text-mute">−20 %</span></button>
            <a href="/biblioteca" target="_blank" rel="noreferrer" className="btn btn-ghost no-underline" onClick={() => setConsultas((c) => c + 1)}><Icon n="book" className="h-4 w-4" />Biblioteca</a>
            <button className="btn btn-big ml-auto" disabled={!completo} onClick={comprobar}>Comprobar</button>
          </div>
        </div>
      )}

      {res && (
        <section role="status" className={`fixed inset-x-0 bottom-14 z-10 max-h-[50vh] animate-slideup overflow-y-auto border-t-2 bg-panel p-4 md:bottom-0 ${ok ? 'border-ok' : res.pe_obtained > 0 ? 'border-acc' : 'border-bad'}`}>
          <div className="mx-auto max-w-3xl">
            <p className="flex items-center gap-2 text-lg font-semibold"><span className={ok ? 'text-ok' : res.pe_obtained > 0 ? 'text-acc' : 'text-bad'}>{ok ? 'Correcto' : res.pe_obtained > 0 ? 'Parcialmente correcto' : 'Incorrecto'}</span><span className="font-mono text-sm text-mute">{res.pe_obtained.toFixed(2)} / {res.pe_max.toFixed(2)} PE</span></p>
            {item.requiere_cita && <p className="mt-1 text-sm">{res.cite_ok ? 'Cita correcta.' : `Cita no válida. Esperada: ${item.citas_validas.map((c) => `${c.doc} ${c.ref}`).join(' / ')}`}</p>}
            {e.seguridad && <p className="mt-1 text-sm font-semibold text-bad">Error de seguridad grave: medida con tensión donde no tocaba. El ítem puntúa 0.</p>}
            {item.tipo === 'hotspots' && item.escena && (
              <ul className="my-2 list-disc space-y-0.5 pl-5 text-sm">
                {item.escena.elementos.filter((x) => x.defecto).map((x) => (
                  <li key={x.id} className={(e.seleccion ?? []).includes(x.id) ? 'text-ok' : 'text-bad'}><span className="text-tx">{x.etiqueta}: {x.explicacion}{x.cita ? ` — ${x.cita.doc} ${x.cita.ref}` : ''}</span></li>
                ))}
              </ul>
            )}
            {item.tipo === 'dimensionado' && (
              <ul className="my-2 list-disc pl-5 text-sm">
                {validaCuadro(e.dim ?? [], tablaVivienda((sol as { circuitos: string[] }).circuitos), (c) => ({ doc: 'REBT', ref: `ITC-BT-25 · Tabla 1 (${c})` })).incumplimientos.map((i) => <li key={i.circuito + i.campo}>{i.mensaje} <em className="text-mute">({i.cita.doc} {i.cita.ref})</em></li>)}
              </ul>
            )}
            <p className="mt-1 text-sm text-mute">{item.explicacion.replace(/\[BORRADOR[^\]]*\]/, '').trim()}</p>
            <button className="btn btn-big mt-3" disabled={guardando} onClick={() => void siguiente()}>{k + 1 >= lista.length ? 'Finalizar' : 'Siguiente'}<Icon n="right" className="h-4 w-4" /></button>
          </div>
        </section>
      )}
    </main>
  );
}

function Dimensionado({ circuitos, onChange }: { circuitos: string[]; onChange: (p: Propuesta[]) => void }) {
  const [vals, setVals] = useState<Record<string, Propuesta>>({});
  const opts = { pia: normaLista('catalogo.pia'), seccion: normaLista('catalogo.seccion'), tubo: normaLista('catalogo.tubo') };
  const cambia = (c: string, campo: 'pia' | 'seccion' | 'tubo', v: string) => {
    const nuevo = { ...vals, [c]: { ...(vals[c] ?? { circuito: c }), [campo]: v ? Number(v) : undefined } };
    setVals(nuevo); onChange(circuitos.map((x) => nuevo[x] ?? { circuito: x }));
  };
  const nombre = { pia: 'PIA (A)', seccion: 'Sección (mm²)', tubo: 'Tubo (mm)' } as const;
  return (
    <div className="grid gap-3">
      {circuitos.map((c) => (
        <fieldset key={c} className="card grid gap-2 sm:grid-cols-3">
          <legend className="rounded bg-panel2 px-2 font-mono text-sm font-semibold text-acc">{c}</legend>
          {(['pia', 'seccion', 'tubo'] as const).map((campo) => (
            <label key={campo} className="text-sm font-medium">{nombre[campo]}
              <select className="input mt-1" onChange={(ev) => cambia(c, campo, ev.target.value)} defaultValue="">
                <option value="">—</option>{opts[campo].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}
