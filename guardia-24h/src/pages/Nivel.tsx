import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Acta } from '../components/Acta';
import { CitaSelector } from '../components/CitaSelector';
import { Confeti } from '../components/Confeti';
import { Escena } from '../components/Escena';
import { ICONO_DISTRITO } from '../components/Iconos';
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
import { estrellas } from './Distrito';

const COLORES = ['bg-amarillo', 'bg-menta', 'bg-salmon', 'bg-azul'];
const TIPO: Record<string, string> = { opcion_multiple: 'Test', verdadero_falso: 'Verdadero / Falso', numerico: 'Cálculo', selector_cita: 'Gymkhana del REBT', dimensionado: 'Dimensionado', hotspots: 'Muro de la vergüenza', instrumento: 'Diagnóstico', acta: 'Acta de verificación' };

type Fin = { pe: number; max: number; xp: number };

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
      setIntento(null); setFin({ pe, max, xp });
    }} />;
  }

  if (fin) {
    const frac = fin.pe / fin.max, e = estrellas(frac), ok = frac >= 0.5;
    return (
      <main className="mx-auto grid max-w-md gap-4 px-4 pt-6 text-center">
        {ok && <Confeti />}
        <div className="flex justify-center gap-2 text-6xl" aria-label={`${e} estrellas`}>
          {[0, 1, 2].map((k) => <span key={k} className={k < e ? 'animate-pop' : 'opacity-25 grayscale'} style={{ animationDelay: `${k * 0.25}s` }}>⭐</span>)}
        </div>
        <h1 className="text-3xl font-black">{ok ? '¡Aviso resuelto!' : 'Aviso sin cerrar'}</h1>
        <section className="card" role="status">
          <p className="text-2xl font-black">Resultado: {fin.pe.toFixed(2)} / {fin.max.toFixed(2)} PE</p>
          <div className="my-2 h-4 overflow-hidden rounded-full border-2 border-tinta bg-white"><div className={`h-full ${ok ? 'bg-ok' : 'bg-mal'}`} style={{ width: `${Math.round(frac * 100)}%` }} /></div>
          <p>{Math.round(frac * 100)} % · {ok ? '✅ Nivel superado' : '❌ Necesitas el 50 % de los PE. Repite con ítems distintos.'}</p>
          <p className="mt-1 font-bold text-ok">+{fin.xp} XP</p>
        </section>
        <div className="flex flex-wrap justify-center gap-3">
          <Link className="btn btn-ghost" to={`/distrito/${d.id}`}>← Distrito</Link>
          {ok && nivel < 5 && <Link className="btn" onClick={() => setFin(null)} to={`/distrito/${d.id}/nivel/${nivel + 1}`}>Siguiente nivel ▶</Link>}
          {!estado.bloqueadoPorIntentos && <button className="btn btn-ghost" onClick={empezar}>↻ Nuevo intento</button>}
        </div>
      </main>
    );
  }

  const jefe = nivel === 5;
  return (
    <main className="mx-auto max-w-md px-4 pt-6 text-center">
      <Link to={`/distrito/${d.id}`} className="text-sm font-bold text-menta underline">← Distrito {d.id}</Link>
      <div className={`mx-auto mt-4 grid h-28 w-28 place-items-center rounded-full border-4 border-tinta text-5xl shadow-[0_8px_0_#000] ${jefe ? 'bg-mal' : 'bg-amarillo'}`} aria-hidden>{jefe ? '👑' : ICONO_DISTRITO[d.id]}</div>
      <h1 className="mt-4 text-3xl font-black">N{nivel} · {info.nombre}</h1>
      <p className="mt-1">{info.descripcion}</p>
      <div className="mx-auto my-4 grid max-w-xs grid-cols-3 gap-2 text-center">
        <div className="card !p-2"><div className="text-xl font-black">{banco.length}</div><div className="text-[11px]">ítems</div></div>
        <div className="card !p-2"><div className="text-xl font-black">{estado.intentos}/3</div><div className="text-[11px]">intentos</div></div>
        <div className="card !p-2"><div className="text-xl font-black">{Math.round(estado.mejor * 100)}%</div><div className="text-[11px]">mejor</div></div>
      </div>
      {!abierto ? <p className="card">🔒 Supera antes el nivel anterior.</p>
        : banco.length === 0 ? <p className="card">Este nivel aún no tiene ítems.</p>
        : estado.bloqueadoPorIntentos ? <p className="card">Has agotado los 3 intentos. Pide a tu profesor que desbloquee el nivel.</p>
        : <button className="btn btn-big" onClick={empezar}>{estado.intentos ? 'Nuevo intento' : 'Empezar'} ({Math.min(ITEMS_POR_INTENTO, banco.length)} ítems)</button>}
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
  const [vidas, setVidas] = useState(3);
  const [guardando, setGuardando] = useState(false);
  const item = lista[k]!;
  const orden = useMemo(() => item.opciones?.map((_, i) => i) ?? [], [item]);
  const comprobar = () => {
    const r = evalua(item, e);
    setRes(r);
    if (r.pe_obtained >= r.pe_max * 0.5) sonidoOk(); else { sonidoFallo(); setVidas((v) => Math.max(0, v - 1)); }
  };
  const siguiente = async () => {
    sonidoClick();
    const nuevo = [...rs, res!];
    if (k + 1 >= lista.length) { setGuardando(true); await onFin(nuevo, Math.round((Date.now() - t0.current) / 1000), consultas, 3 - vidas); return; }
    setRs(nuevo); setRes(null); setE({ pistas: 0 }); setK(k + 1);
  };
  const pista = () => { sonidoClick(); setE((x) => (x.pistas < item.pistas.length ? { ...x, pistas: x.pistas + 1 } : x)); };
  const sol = item.solucion as Record<string, unknown>;
  const completo = item.tipo === 'acta' ? Boolean(e.dictamen) && (item.pruebas ?? []).every((p) => e.acta?.[p.id])
    : item.tipo === 'opcion_multiple' || item.tipo === 'instrumento' ? e.opcion !== undefined
    : item.tipo === 'verdadero_falso' ? e.vf !== undefined
    : item.tipo === 'numerico' ? e.numero !== undefined && !Number.isNaN(e.numero)
    : item.tipo === 'hotspots' || item.tipo === 'dimensionado' ? true : Boolean(e.cita);
  const ok = res ? res.pe_obtained >= res.pe_max * 0.5 : false;
  const pct = ((k + (res ? 1 : 0)) / lista.length) * 100;

  return (
    <main className="mx-auto max-w-2xl px-4 pb-44 pt-3">
      <div className="flex items-center gap-3">
        <Link to={`/distrito/${distrito}`} aria-label="Abandonar el aviso" className="text-2xl">✕</Link>
        <div className="h-4 flex-1 overflow-hidden rounded-full border-2 border-tinta bg-white/20" role="progressbar" aria-label="Progreso del aviso" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-menta transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span aria-label={`${vidas} vidas`} className="text-lg">{'❤️'.repeat(vidas)}{'🖤'.repeat(3 - vidas)}</span>
      </div>
      <p className="mt-3 text-sm text-menta">Ítem {k + 1} de {lista.length}</p>
      <section key={item.id} className="card mt-1 animate-pop">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <span className="chip !bg-amarillo">{TIPO[item.tipo] ?? item.tipo}</span>
          {item.ra.map((r) => <span key={r} className="chip">{r}</span>)}
          <span className="chip !bg-white">máx. {peMaximo(item).toFixed(2)} PE</span>
        </div>
        <h1 className="!text-tinta text-xl font-black leading-snug sm:text-2xl">{item.enunciado}</h1>
      </section>

      <fieldset disabled={Boolean(res)} className="mt-4 grid gap-3">
        {(item.tipo === 'opcion_multiple' || item.tipo === 'instrumento') && orden.map((i) => {
          const sel = e.opcion === i, correcta = res && sol.correcta === i;
          return (
            <label key={i} className={`tile ${COLORES[i % 4]} ${sel ? 'tile-sel' : ''} ${correcta ? '!ring-4 !ring-ok' : ''} ${res && sel && !correcta ? 'animate-shake opacity-70' : ''}`}>
              <input type="radio" name="op" className="absolute inset-0 cursor-pointer opacity-0" checked={sel} onChange={() => { sonidoClick(); setE({ ...e, opcion: i }); }} />
              <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-tinta bg-white font-black">{correcta ? '✓' : res && sel ? '✗' : 'ABCD'[i]}</span>
              <span>{item.opciones![i]}</span>
            </label>
          );
        })}
        {item.tipo === 'verdadero_falso' && (
          <div className="grid grid-cols-2 gap-3">
            {[true, false].map((v) => {
              const sel = e.vf === v, correcta = res && sol.correcta === v;
              return (
                <label key={String(v)} className={`tile justify-center py-8 text-2xl ${v ? 'bg-ok text-white' : 'bg-mal text-white'} ${sel ? 'tile-sel' : ''} ${correcta ? '!ring-4 !ring-white' : ''}`}>
                  <input type="radio" name="vf" className="absolute inset-0 cursor-pointer opacity-0" checked={sel} onChange={() => { sonidoClick(); setE({ ...e, vf: v }); }} />
                  <span aria-hidden>{v ? '✔' : '✘'}</span> {v ? 'Verdadero' : 'Falso'}
                </label>
              );
            })}
          </div>
        )}
        {item.tipo === 'numerico' && (
          <label className="card font-bold">Tu respuesta
            <input className="input mt-1 text-center text-3xl font-black" inputMode="decimal" placeholder="0" onChange={(ev) => setE({ ...e, numero: parseFloat(ev.target.value.replace(',', '.')) })} />
          </label>
        )}
        {item.tipo === 'instrumento' && item.circuito && (
          <Instrumento averia={item.circuito.averia} alimentadoInicial={item.circuito.alimentado} bloqueado={Boolean(res)} onSeguridad={() => setE((x) => ({ ...x, seguridad: true }))} />
        )}
        {item.tipo === 'acta' && <Acta pruebas={item.pruebas ?? []} acta={e.acta ?? {}} dictamen={e.dictamen} revelar={Boolean(res)} onChange={(acta, dictamen) => setE((x) => ({ ...x, acta, dictamen }))} />}
        {item.tipo === 'hotspots' && item.escena && <Escena escena={item.escena} seleccion={e.seleccion ?? []} revelar={Boolean(res)} onChange={(seleccion) => setE((x) => ({ ...x, seleccion }))} />}
        {item.tipo === 'dimensionado' && <Dimensionado circuitos={(sol as { circuitos: string[] }).circuitos} onChange={(dim) => setE((x) => ({ ...x, dim }))} />}
        {(item.requiere_cita || item.tipo === 'selector_cita') && <CitaSelector onChange={(c: Cita | null) => setE((x) => ({ ...x, cita: c }))} />}
      </fieldset>

      {e.pistas > 0 && <ul className="mt-3 rounded-2xl border-[3px] border-amarillo bg-amarillo/15 p-3 text-sm">{item.pistas.slice(0, e.pistas).map((p) => <li key={p}>💡 {p}</li>)}</ul>}

      {!res && (
        <div className="fixed inset-x-0 bottom-16 z-10 border-t-4 border-tinta bg-noche/95 p-3 md:bottom-0">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <button className="btn btn-ghost" onClick={pista} disabled={e.pistas >= item.pistas.length}>💡 Pista (−20 %)</button>
            <a href="/biblioteca" target="_blank" rel="noreferrer" className="btn btn-ghost" onClick={() => setConsultas((c) => c + 1)}>📚 Biblioteca</a>
            <button className="btn btn-big ml-auto !px-6 !py-3" disabled={!completo} onClick={comprobar}>Comprobar</button>
          </div>
        </div>
      )}

      {res && (
        <section role="status" className={`fixed inset-x-0 bottom-16 z-10 max-h-[48vh] animate-slideup overflow-y-auto border-t-4 border-tinta p-4 text-tinta md:bottom-0 ${ok ? 'bg-[#bff0d4]' : 'bg-[#ffc9cb]'}`}>
          <div className="mx-auto max-w-2xl">
            <p className="text-2xl font-black">{ok ? '✅ ¡Correcto!' : res.pe_obtained > 0 ? '🟡 Parcial' : '❌ Incorrecto'} <span className="text-base font-bold">· {res.pe_obtained.toFixed(2)} PE</span></p>
            {item.requiere_cita && <p className="text-sm">{res.cite_ok ? '📖 Cita correcta.' : `📖 Cita no válida. Esperada: ${item.citas_validas.map((c) => `${c.doc} ${c.ref}`).join(' / ')}`}</p>}
            {e.seguridad && <p className="font-bold text-red-800">⚠️ Error de seguridad grave: medida con tensión donde no tocaba. El ítem puntúa 0.</p>}
            {item.tipo === 'hotspots' && item.escena && (
              <ul className="my-1 list-disc pl-5 text-sm">
                {item.escena.elementos.filter((x) => x.defecto).map((x) => (
                  <li key={x.id}>{(e.seleccion ?? []).includes(x.id) ? '✅' : '❌ (se te escapó)'} {x.etiqueta}: {x.explicacion}{x.cita ? ` — ${x.cita.doc} ${x.cita.ref}` : ''}</li>
                ))}
              </ul>
            )}
            {item.tipo === 'dimensionado' && (
              <ul className="my-1 list-disc pl-5 text-sm">
                {validaCuadro(e.dim ?? [], tablaVivienda((sol as { circuitos: string[] }).circuitos), (c) => ({ doc: 'REBT', ref: `ITC-BT-25 · Tabla 1 (${c})` })).incumplimientos.map((i) => <li key={i.circuito + i.campo}>{i.mensaje} <em>({i.cita.doc} {i.cita.ref})</em></li>)}
              </ul>
            )}
            <p className="text-sm">{item.explicacion}</p>
            <button className="btn btn-big mt-2" disabled={guardando} onClick={() => void siguiente()}>{k + 1 >= lista.length ? 'Terminar 🏁' : 'Siguiente ▶'}</button>
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
          <legend className="rounded-lg bg-tinta px-3 py-0.5 text-lg font-black text-amarillo">⚡ {c}</legend>
          {(['pia', 'seccion', 'tubo'] as const).map((campo) => (
            <label key={campo} className="font-bold">{nombre[campo]}
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
