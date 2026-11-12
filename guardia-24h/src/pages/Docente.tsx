import { useEffect, useState } from 'react';
import { repo } from '../data';
import { raFile } from '../data/content';
import { listarAlumnosLocales } from '../data/local';
import { leeOverrides } from '../game/datos';
import { calculaNotas } from './Notas';

type Fila = { uid: string; alias: string; clase: string; final: number; notas: Record<string, number | null>; aprobado: boolean; intentos: number };

export function Docente() {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    void (async () => {
      const al = await listarAlumnosLocales();
      const out: Fila[] = [];
      for (const a of al) {
        const [rs, ints] = await Promise.all([repo.respuestas(a.uid), repo.intentos(a.uid)]);
        const { detalle, global } = calculaNotas(a.uid, rs);
        out.push({ ...a, final: global.final, aprobado: global.aprobado, intentos: ints.length, notas: Object.fromEntries(detalle.map((d) => [d.ra, d.final])) });
      }
      setFilas(out);
    })();
  }, [version]);

  const guarda = (uid: string, fn: (o: ReturnType<typeof leeOverrides>) => void) => {
    const o = leeOverrides(uid); o.desbloqueos ??= {}; o.taller ??= {}; o.a ??= raFile.aDefecto;
    fn(o); localStorage.setItem(`g24-teacher-${uid}`, JSON.stringify(o)); setVersion((v) => v + 1);
  };
  const csv = () => {
    const ras = raFile.ras.map((r) => r.id);
    const lineas = [['alias', 'clase', ...ras, 'nota_final', 'aprobado', 'intentos'].join(';'),
      ...filas.map((f) => [f.alias, f.clase, ...ras.map((r) => f.notas[r]?.toFixed(2).replace('.', ',') ?? ''), f.final.toFixed(2).replace('.', ','), f.aprobado ? 'sí' : 'no', f.intentos].join(';'))];
    const url = URL.createObjectURL(new Blob(['﻿' + lineas.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'notas-guardia24h.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const o = sel ? leeOverrides(sel) : null;

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="font-titulo text-2xl font-black">🧑‍🏫 Panel del profesor (mínimo)</h1>
      <p className="my-2 rounded bg-salmon/40 p-2 text-sm">Fase 1: muestra los alumnos que han jugado en <strong>este dispositivo</strong> (modo local). El panel en la nube con login de profesor llega en la siguiente fase. Sin protección por contraseña todavía.</p>
      <button className="btn mb-3" onClick={csv} disabled={!filas.length}>Exportar CSV</button>
      <div className="overflow-x-auto">
        <table className="card w-full text-left text-sm">
          <thead><tr><th>Alias</th><th>Clase</th>{raFile.ras.map((r) => <th key={r.id}>{r.id}</th>)}<th>Final</th><th></th></tr></thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.uid} className="border-t">
                <td>{f.alias}</td><td>{f.clase}</td>
                {raFile.ras.map((r) => <td key={r.id}>{f.notas[r.id]?.toFixed(1) ?? '—'}</td>)}
                <td>{f.final.toFixed(2)}</td><td><button className="underline" onClick={() => setSel(f.uid)}>Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sel && o && (
        <section className="card mt-4 grid gap-2">
          <h2 className="font-bold">Ajustes de {filas.find((f) => f.uid === sel)?.alias}</h2>
          <label>Peso del juego «a» (0–1)
            <input className="input" type="number" step="0.05" min="0" max="1" defaultValue={o.a ?? raFile.aDefecto} onBlur={(e) => guarda(sel, (x) => { x.a = Math.min(1, Math.max(0, Number(e.target.value))); })} />
          </label>
          <div className="grid gap-2 sm:grid-cols-3">
            {raFile.ras.map((r) => (
              <label key={r.id}>Taller {r.id} (0–10)
                <input className="input" type="number" step="0.1" min="0" max="10" defaultValue={o.taller?.[r.id] ?? ''}
                  onBlur={(e) => guarda(sel, (x) => { x.taller[r.id] = e.target.value === '' ? null : Math.min(10, Math.max(0, Number(e.target.value))); })} />
              </label>
            ))}
          </div>
          <label>Desbloquear un intento extra (distrito-nivel, p. ej. 1-1)
            <input className="input" placeholder="1-1" onKeyDown={(e) => { if (e.key === 'Enter') { const k = (e.target as HTMLInputElement).value.trim(); guarda(sel, (x) => { x.desbloqueos[k] = (x.desbloqueos[k] ?? 0) + 1; }); } }} />
          </label>
          <p className="text-xs">Extras concedidos: {JSON.stringify(o.desbloqueos ?? {})}</p>
        </section>
      )}
    </main>
  );
}
