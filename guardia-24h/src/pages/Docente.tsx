import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import * as XLSX from 'xlsx';
import { Icon } from '../components/Icon';
import { docenteLocal, docenteNube, nubeDisponible, crearClase, loginDocente, registraDocente, salirDocente, sesionDocente, type AlumnoRes, type DocenteBackend } from '../data/docente';
import { items, pesosRa, raFile } from '../data/content';
import type { Intento, Respuesta } from '../data';
import { CRITERIOS_RUBRICA, notaRubrica, type NivelRubrica, type Overrides } from '../game/datos';
import { borraCodigo, creaCodigo, guardaReto, leeReto, listaCodigos } from '../game/extras';
import { notasPorRa } from '../game/progreso';

interface Fila extends AlumnoRes { respuestas: Respuesta[]; intentos: Intento[]; ov: Overrides; notas: ReturnType<typeof notasPorRa>; alertas: string[] }
const CE = raFile.ras.flatMap((r) => r.ce.map((c) => ({ ra: r.id, ...c })));

function calcula(a: AlumnoRes, d: { respuestas: Respuesta[]; intentos: Intento[] }, ov: Overrides): Fila {
  const taller = { ...ov.taller, RA9: ov.taller.RA9 ?? notaRubrica(ov) };
  const notas = notasPorRa(d.respuestas, items, raFile.ras.map((r) => r.id), taller, ov.a, pesosRa, { notaFinalMin: raFile.aprobado.notaFinalMin, notaRaMin: raFile.aprobado.notaRaMin, coberturaMin: raFile.coberturaMin });
  const alertas: string[] = [];
  for (const i of d.intentos) if (i.pe_max > 0 && i.time_s < 15) alertas.push(`Intento de B${i.distrito} N${i.nivel} resuelto en ${i.time_s} s`);
  return { ...a, ...d, ov, notas, alertas };
}
/** Nota 0–10 por criterio de evaluación a partir de las etiquetas de cada ítem. */
function notaCE(f: Fila, ce: string): number | null {
  const mejor = new Map<string, Respuesta>();
  for (const r of f.respuestas) if (r.ce.includes(ce)) { const p = mejor.get(r.item_id); if (!p || r.pe_obtained > p.pe_obtained) mejor.set(r.item_id, r); }
  const max = items.filter((i) => i.ce.includes(ce)).reduce((s, i) => s + i.pe_base * i.dificultad, 0);
  if (!mejor.size || !max) return null;
  const obt = [...mejor.values()].reduce((s, r) => s + r.pe_obtained, 0), mx = [...mejor.values()].reduce((s, r) => s + r.pe_max, 0);
  return mx ? Math.min(10, (obt / mx) * 10) : null;
}
const color = (v: number | null) => (v === null ? 'bg-panel2 text-mute' : v < 5 ? 'bg-bad/25 text-bad' : v < 7 ? 'bg-acc/20 text-acct' : 'bg-ok/20 text-ok');
const f2 = (x: number | null | undefined) => (x === null || x === undefined ? '—' : x.toFixed(2));

const hashPin = async (p: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`g24:${p}`)))).map((b) => b.toString(16).padStart(2, '0')).join('');

export function Docente() {
  const [modo, setModo] = useState<'local' | 'nube'>('local');
  const [acceso, setAcceso] = useState(false);
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <span className="cinta">Profesorado</span>
      <h1 className="mt-1">Panel docente</h1>
      {!acceso ? <Acceso modo={modo} setModo={setModo} ok={() => setAcceso(true)} /> : <Panel backend={modo === 'nube' ? docenteNube : docenteLocal} salir={() => { if (modo === 'nube') void salirDocente(); setAcceso(false); }} />}
    </main>
  );
}

function Acceso({ modo, setModo, ok }: { modo: 'local' | 'nube'; setModo: (m: 'local' | 'nube') => void; ok: () => void }) {
  const [pin, setPin] = useState(''); const [email, setEmail] = useState(''); const [clave, setClave] = useState('');
  const [err, setErr] = useState(''); const tienePin = Boolean(localStorage.getItem('g24-pin'));
  const enviar = async (e: FormEvent) => {
    e.preventDefault(); setErr('');
    try {
      if (modo === 'local') {
        if (pin.length < 4) throw new Error('El PIN debe tener al menos 4 caracteres.');
        const h = await hashPin(pin), g = localStorage.getItem('g24-pin');
        if (!g) localStorage.setItem('g24-pin', h); else if (g !== h) throw new Error('PIN incorrecto.');
      } else { await loginDocente(email, clave); }
      ok();
    } catch (x) { setErr((x as Error).message.replace('Firebase: ', '')); }
  };
  return (
    <div className="mt-4 grid max-w-xl gap-4">
      <div role="tablist" className="flex gap-1">
        {([['local', 'Este dispositivo'], ['nube', 'Nube (Firebase)']] as const).map(([k, t]) => <button key={k} role="tab" aria-selected={modo === k} disabled={k === 'nube' && !nubeDisponible} onClick={() => setModo(k)} className={`rounded border px-3 py-1.5 text-sm font-semibold disabled:opacity-40 ${modo === k ? 'border-acc bg-acc/10 text-acct' : 'border-line text-mute'}`}>{t}</button>)}
      </div>
      {!nubeDisponible && <p className="text-xs text-mute">La nube no está configurada (faltan las variables <code>VITE_FIREBASE_*</code>).</p>}
      <form onSubmit={(e) => void enviar(e)} className="card grid gap-3">
        {modo === 'local' ? (
          <label className="text-sm font-medium">{tienePin ? 'PIN del profesor' : 'Crea un PIN de profesor (mín. 4 caracteres)'}<input className="input mt-1" type="password" value={pin} onChange={(e) => setPin(e.target.value)} autoComplete="off" /></label>
        ) : (<>
          <label className="text-sm font-medium">Correo<input className="input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></label>
          <label className="text-sm font-medium">Contraseña<input className="input mt-1" type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="current-password" /></label>
          <button type="button" className="text-left text-xs text-info underline" onClick={() => void registraDocente(email, clave).then(ok).catch((x: Error) => setErr(x.message))}>Crear cuenta de profesor</button>
        </>)}
        {err && <p role="alert" className="text-sm text-bad">{err}</p>}
        <button className="btn">Entrar</button>
        {modo === 'local' && <p className="text-xs text-mute">El PIN protege la pantalla pero no es seguridad real: los datos están en este navegador. Para uso real con alumnos, usa el modo nube.</p>}
      </form>
    </div>
  );
}

function Panel({ backend, salir }: { backend: DocenteBackend; salir: () => void }) {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState<'resumen' | 'criterios' | 'rubrica' | 'aula'>('resumen');
  const [sel, setSel] = useState<string | null>(null);
  const carga = useCallback(async () => {
    setCargando(true);
    const al = await backend.listar();
    setFilas(await Promise.all(al.map(async (a) => calcula(a, await backend.datos(a.uid), await backend.leeOv(a.uid)))));
    setCargando(false);
  }, [backend]);
  useEffect(() => { void carga(); }, [carga]);
  const guarda = async (uid: string, fn: (o: Overrides) => void) => {
    const f = filas.find((x) => x.uid === uid)!; const o = structuredClone(f.ov); fn(o);
    await backend.guardaOv(uid, o); await carga();
  };
  const alumno = filas.find((f) => f.uid === sel);
  const alertas = filas.flatMap((f) => f.alertas.map((a) => `${f.alias}: ${a}`));

  const exportaCsv = () => {
    const ras = raFile.ras.map((r) => r.id);
    const l = [['alias', 'clase', ...ras, 'nota_final', 'aprobado'].join(';'), ...filas.map((f) => [f.alias, f.clase, ...f.notas.detalle.map((d) => f2(d.final).replace('.', ',')), f2(f.notas.global.final).replace('.', ','), f.notas.global.aprobado ? 'sí' : 'no'].join(';'))];
    descarga(new Blob(['﻿' + l.join('\n')], { type: 'text/csv;charset=utf-8' }), 'notas-guardia24h.csv');
  };
  const exportaXlsx = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filas.map((f) => ({ Alias: f.alias, Clase: f.clase, ...Object.fromEntries(f.notas.detalle.map((d) => [d.ra, d.final === null ? '' : Number(d.final.toFixed(2))])), 'Nota final': Number(f.notas.global.final.toFixed(2)), Aprobado: f.notas.global.aprobado ? 'Sí' : 'No', 'RA pendientes': f.notas.global.pendientes.join(', ') }))), 'Notas por RA');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filas.map((f) => ({ Alias: f.alias, ...Object.fromEntries(CE.map((c) => [c.id, notaCE(f, c.id) === null ? '' : Number(notaCE(f, c.id)!.toFixed(2))])) }))), 'Criterios (CE)');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filas.flatMap((f) => f.intentos.map((i) => ({ Alias: f.alias, Bloque: i.distrito, Nivel: i.nivel, PE: Number(i.pe_obtained.toFixed(2)), 'PE máx': Number(i.pe_max.toFixed(2)), 'Tiempo (s)': i.time_s, Consultas: i.consult_count })))), 'Intentos');
    XLSX.writeFile(wb, 'guardia24h.xlsx');
  };

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" className="flex flex-wrap gap-1">
          {([['resumen', 'Resumen y notas'], ['criterios', 'Criterios (mapa de calor)'], ['rubrica', 'Rúbrica RA9 y taller'], ['aula', 'Aula: códigos y reto']] as const).map(([k, t]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded border px-3 py-1.5 text-sm font-semibold ${tab === k ? 'border-acc bg-acc/10 text-acct' : 'border-line text-mute hover:text-tx'}`}>{t}</button>)}
        </div>
        <span className="chip ml-auto">{backend.modo === 'nube' ? `NUBE · ${sesionDocente() ?? ''}` : 'LOCAL · este dispositivo'}</span>
        <button className="text-xs text-mute underline" onClick={salir}>Cerrar</button>
      </div>
      {cargando && <p className="mt-4 text-mute">Cargando…</p>}
      {!cargando && filas.length === 0 && <p className="card mt-4">Aún no hay alumnos{backend.modo === 'nube' ? ' en tus clases. Crea una clase y comparte el código.' : ' en este dispositivo.'}</p>}

      {tab === 'resumen' && filas.length > 0 && (<>
        <div className="mt-4 flex flex-wrap gap-2"><button className="btn" onClick={exportaXlsx}><Icon n="doc" className="h-4 w-4" />Exportar XLSX</button><button className="btn btn-ghost" onClick={exportaCsv}>Exportar CSV</button></div>
        {alertas.length > 0 && <div className="card mt-4 !border-warn/50 text-sm"><div className="eyebrow !text-warn">Alertas de integridad</div><ul className="mt-1 list-disc pl-5">{alertas.slice(0, 8).map((a) => <li key={a}>{a}</li>)}</ul></div>}
        <div className="mt-4 overflow-x-auto rounded border border-line"><table className="w-full text-left text-sm">
          <thead className="bg-panel2 text-[13px] font-semibold text-mute"><tr><th className="px-3 py-2">Alumno</th>{raFile.ras.map((r) => <th key={r.id} className="px-2 py-2 text-center">{r.id}</th>)}<th className="px-3 py-2 text-right">Final</th><th className="px-3 py-2">Estado</th><th /></tr></thead>
          <tbody>{filas.map((f) => <tr key={f.uid} className="border-t border-line">
            <td className="px-3 py-2">{f.alias}<div className="text-xs text-mute">{f.clase}</div></td>
            {f.notas.detalle.map((d) => <td key={d.ra} className={`px-2 py-2 text-center font-mono ${color(d.final)}`}>{d.final === null ? '—' : d.final.toFixed(1)}</td>)}
            <td className="px-3 py-2 text-right font-mono font-semibold">{f.notas.global.final.toFixed(2)}</td>
            <td className="px-3 py-2">{f.notas.global.aprobado ? <span className="text-ok">Aprobado</span> : <span className="text-mute">Pendiente</span>}</td>
            <td className="px-3 py-2"><button className="text-info underline" onClick={() => { setSel(f.uid); setTab('rubrica'); }}>Editar</button> · <a href={`#/informe/${f.uid}`} onClick={(e) => { e.preventDefault(); informe(f); }}>Informe</a></td></tr>)}</tbody></table></div>
      </>)}

      {tab === 'criterios' && filas.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded border border-line"><table className="w-full text-left text-xs">
          <thead className="bg-panel2 text-[13px] font-semibold text-mute"><tr><th className="px-3 py-2">Criterio de evaluación</th>{filas.map((f) => <th key={f.uid} className="px-2 py-2 text-center">{f.alias}</th>)}</tr></thead>
          <tbody>{CE.map((c) => <tr key={c.id} className="border-t border-line"><td className="px-3 py-1.5"><span className="font-mono text-acct">{c.id}</span> <span className="text-mute">{c.texto.slice(0, 70)}{c.texto.length > 70 ? '…' : ''}</span></td>{filas.map((f) => { const v = notaCE(f, c.id); return <td key={f.uid} className={`px-2 py-1.5 text-center font-mono ${color(v)}`}>{v === null ? '·' : v.toFixed(1)}</td>; })}</tr>)}</tbody></table>
          <p className="p-2 text-xs text-mute">Rojo &lt; 5 · ámbar 5–7 · verde ≥ 7 · «·» sin ítems resueltos.</p></div>
      )}

      {tab === 'rubrica' && filas.length > 0 && (
        <div className="mt-4">
          <label className="text-sm font-medium">Alumno
            <select className="input mt-1 max-w-xs" value={sel ?? ''} onChange={(e) => setSel(e.target.value || null)}><option value="">— elegir —</option>{filas.map((f) => <option key={f.uid} value={f.uid}>{f.alias}</option>)}</select></label>
          {alumno && <Ajustes f={alumno} guarda={guarda} />}
        </div>
      )}

      {tab === 'aula' && <Aula backend={backend} />}
    </div>
  );
}

function Ajustes({ f, guarda }: { f: Fila; guarda: (uid: string, fn: (o: Overrides) => void) => Promise<void> }) {
  const [bloque, setBloque] = useState('1');
  const rub = f.ov.rubrica[bloque] ?? {};
  const nota9 = notaRubrica(f.ov);
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <section className="card">
        <h2 className="eyebrow mb-2">Evidencias de taller por RA (0–10) y peso del juego «a»</h2>
        <label className="text-sm">Peso del juego «a» (0–1)<input className="input mt-1 max-w-[8rem] font-mono" type="number" min="0" max="1" step="0.05" defaultValue={f.ov.a} onBlur={(e) => void guarda(f.uid, (o) => { o.a = Math.min(1, Math.max(0, Number(e.target.value))); })} /></label>
        <div className="mt-3 grid grid-cols-3 gap-2">{raFile.ras.map((r) => <label key={r.id} className="text-xs">{r.id}<input className="input mt-1 font-mono" type="number" min="0" max="10" step="0.1" defaultValue={f.ov.taller[r.id] ?? ''} placeholder={r.id === 'RA9' && nota9 !== null ? `rúbrica ${nota9.toFixed(1)}` : ''} onBlur={(e) => void guarda(f.uid, (o) => { o.taller[r.id] = e.target.value === '' ? null : Math.min(10, Math.max(0, Number(e.target.value))); })} /></label>)}</div>
        <p className="mt-2 text-xs text-mute">Sin nota de taller, RA_final = RA_juego. En RA9 se usa la media de la rúbrica si no escribes nota.</p>
        <label className="mt-3 block text-sm">Intento extra (bloque-nivel, p. ej. 1-1)<input className="input mt-1 max-w-[8rem] font-mono" placeholder="1-1" onKeyDown={(e) => { if (e.key === 'Enter') { const k = (e.target as HTMLInputElement).value.trim(); void guarda(f.uid, (o) => { o.desbloqueos[k] = (o.desbloqueos[k] ?? 0) + 1; }); } }} /></label>
        <p className="mt-1 text-xs text-mute">Concedidos: {JSON.stringify(f.ov.desbloqueos)}</p>
      </section>
      <section className="card">
        <h2 className="eyebrow mb-2">Rúbrica de observación continua (RA9)</h2>
        <label className="text-sm">Bloque<select className="input mt-1 max-w-[8rem]" value={bloque} onChange={(e) => setBloque(e.target.value)}>{[1, 2, 3, 4, 5, 6, 7, 8].map((b) => <option key={b} value={b}>Bloque {b}</option>)}</select></label>
        <div className="mt-3 grid gap-2">{CRITERIOS_RUBRICA.map((c) => <div key={c} className="grid grid-cols-[1fr_auto] items-center gap-2 text-sm"><span>{c}</span>
          <select aria-label={c} className="input !w-auto" value={rub[c] ?? ''} onChange={(e) => void guarda(f.uid, (o) => { o.rubrica[bloque] ??= {}; if (e.target.value) o.rubrica[bloque]![c] = e.target.value as NivelRubrica; else delete o.rubrica[bloque]![c]; })}>
            <option value="">—</option><option value="excelente">Excelente (10)</option><option value="adecuado">Adecuado (7)</option><option value="reforzar">A reforzar (4)</option></select></div>)}</div>
        <p className="mt-2 text-sm">Media de la rúbrica: <b className="font-mono">{nota9 === null ? '—' : nota9.toFixed(2)}</b></p>
      </section>
    </div>
  );
}

function Aula({ backend }: { backend: DocenteBackend }) {
  const [codigos, setCodigos] = useState(listaCodigos());
  const [desc, setDesc] = useState(''); const [xp, setXp] = useState(100);
  const [reto, setReto] = useState(leeReto());
  const [rb, setRb] = useState(1), [rn, setRn] = useState(3), [rxp, setRxp] = useState(150);
  const [clase, setClase] = useState(''); const [msg, setMsg] = useState('');
  const crea = useMemo(() => () => { creaCodigo(desc || 'Práctica de taller', xp, Math.round(xp / 2)); setCodigos(listaCodigos()); setDesc(''); }, [desc, xp]);
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <section className="card">
        <h2 className="eyebrow mb-2">Códigos de taller (un solo uso por alumno)</h2>
        <div className="grid gap-2 sm:grid-cols-[1fr_6rem_auto]"><input className="input" placeholder="p. ej. Cuadro de grupo montado" value={desc} onChange={(e) => setDesc(e.target.value)} /><input aria-label="XP" className="input font-mono" type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))} /><button className="btn" onClick={crea}>Generar</button></div>
        <ul className="mt-3 divide-y divide-line text-sm">{codigos.map((c) => <li key={c.codigo} className="flex items-center gap-2 py-1.5"><span className="font-mono text-acct">{c.codigo}</span><span className="flex-1 text-mute">{c.descripcion} · +{c.xp} XP</span><button className="text-xs text-mute underline" onClick={() => { borraCodigo(c.codigo); setCodigos(listaCodigos()); }}>Borrar</button></li>)}</ul>
        <p className="mt-2 text-xs text-mute">Se guardan en este dispositivo. En la nube, el canje compartido entre dispositivos queda pendiente.</p>
      </section>
      <section className="card">
        <h2 className="eyebrow mb-2">Reto semanal</h2>
        <div className="grid grid-cols-3 gap-2 text-sm"><label>Bloque<input className="input mt-1 font-mono" type="number" min="1" max="8" value={rb} onChange={(e) => setRb(Number(e.target.value))} /></label><label>Nivel<input className="input mt-1 font-mono" type="number" min="1" max="5" value={rn} onChange={(e) => setRn(Number(e.target.value))} /></label><label>XP extra<input className="input mt-1 font-mono" type="number" value={rxp} onChange={(e) => setRxp(Number(e.target.value))} /></label></div>
        <div className="mt-3 flex gap-2"><button className="btn" onClick={() => { const r = { distrito: rb, nivel: rn, xp: rxp, desde: Date.now() }; guardaReto(r); setReto(r); }}>Lanzar reto</button>{reto && <button className="btn btn-ghost" onClick={() => { guardaReto(null); setReto(null); }}>Quitar</button>}</div>
        {reto && <p className="mt-2 text-sm text-mute">Activo: bloque {reto.distrito}, N{reto.nivel}, +{reto.xp} XP.</p>}
      </section>
      {backend.modo === 'nube' && (
        <section className="card lg:col-span-2">
          <h2 className="eyebrow mb-2">Crear clase (código para el alumnado)</h2>
          <div className="flex gap-2"><input className="input max-w-xs font-mono uppercase" placeholder="SEA-2026" value={clase} onChange={(e) => setClase(e.target.value)} /><button className="btn" onClick={() => void crearClase(clase).then((c) => setMsg(`Clase ${c} creada. Comparte el código.`)).catch((e: Error) => setMsg(e.message))}>Crear</button></div>
          {msg && <p role="status" className="mt-2 text-sm text-mute">{msg}</p>}
        </section>
      )}
    </div>
  );
}

function descarga(blob: Blob, nombre: string) { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = nombre; a.click(); URL.revokeObjectURL(u); }

/** Informe imprimible por alumno (ventana limpia, pensada para PDF o papel). */
function informe(f: Fila) {
  const w = window.open('', '_blank'); if (!w) return;
  const fila = (d: (typeof f.notas.detalle)[number]) => `<tr><td>${d.ra}</td><td>${Math.round((pesosRa[d.ra] ?? 0) * 100)} %</td><td>${f2(d.juego)}</td><td>${f2(d.taller)}</td><td>${f2(d.final)}</td><td>${Math.round(d.cobertura * 100)} %</td><td>${d.adquirido ? 'Adquirido' : 'Pendiente'}</td></tr>`;
  const ceFilas = CE.map((c) => { const v = notaCE(f, c.id); return `<tr><td>${c.id}</td><td>${c.texto}</td><td>${v === null ? '—' : v.toFixed(1)}</td></tr>`; }).join('');
  w.document.write(`<!doctype html><meta charset="utf-8"><title>Informe ${f.alias}</title><style>body{font:13px/1.4 Arial,sans-serif;margin:32px;color:#111}h1{font-size:20px;margin:0}h2{font-size:14px;margin:22px 0 6px;border-bottom:2px solid #111}table{border-collapse:collapse;width:100%}td,th{border:1px solid #bbb;padding:4px 6px;text-align:left}th{background:#eee}.r{text-align:right}small{color:#555}</style>
  <h1>Informe de evaluación · Guardia 24 h</h1><small>CFGS Sistemas Electrotécnicos y Automatizados · Módulo 0518 TPIE</small>
  <p><b>Alumno:</b> ${f.alias} · <b>Clase:</b> ${f.clase} · <b>Fecha:</b> ${new Date().toLocaleDateString('es-ES')}</p>
  <p><b>Nota final:</b> ${f.notas.global.final.toFixed(2)} · <b>${f.notas.global.aprobado ? 'Aprobado' : 'Pendiente'}</b>${f.notas.global.pendientes.length ? ` (RA pendientes: ${f.notas.global.pendientes.join(', ')})` : ''}</p>
  <h2>Resultados por RA</h2><table><tr><th>RA</th><th>Peso</th><th>Juego</th><th>Taller</th><th>Final</th><th>Cobertura</th><th>Estado</th></tr>${f.notas.detalle.map(fila).join('')}</table>
  <h2>Criterios de evaluación (parte juego)</h2><table><tr><th>CE</th><th>Descripción</th><th class="r">Nota</th></tr>${ceFilas}</table>
  <p><small>La nota no incluye experiencia, dinero ni logros. Pesos y criterios pendientes de verificación por el profesor.</small></p><script>setTimeout(()=>window.print(),300)</script>`);
  w.document.close();
}
