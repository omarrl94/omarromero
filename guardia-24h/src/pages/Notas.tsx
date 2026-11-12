import { items, pesosRa, raFile } from '../data/content';
import { leeOverrides, useProgreso } from '../game/datos';
import { notasPorRa } from '../game/progreso';
import { useStore } from '../game/store';

export function calculaNotas(uid: string, respuestas: Parameters<typeof notasPorRa>[0]) {
  const ov = leeOverrides(uid);
  return notasPorRa(respuestas, items, raFile.ras.map((r) => r.id), ov.taller, ov.a ?? raFile.aDefecto, pesosRa,
    { notaFinalMin: raFile.aprobado.notaFinalMin, notaRaMin: raFile.aprobado.notaRaMin, coberturaMin: raFile.coberturaMin });
}

export function Notas() {
  const sesion = useStore((s) => s.sesion)!;
  const { respuestas, cargado } = useProgreso();
  if (!cargado) return <main className="p-4">Cargando…</main>;
  const { detalle, global } = calculaNotas(sesion.uid, respuestas);
  const f = (x: number | null) => (x === null ? '—' : x.toFixed(2));
  return (
    <main className="mx-auto max-w-4xl p-4">
      <h1 className="text-2xl">Mis notas</h1>
      <p className="my-2">Nota final: <strong>{global.final.toFixed(2)}</strong> · {global.aprobado ? 'Aprobado' : `Pendiente (${global.pendientes.join(', ') || 'sin datos'})`}</p>
      <div className="overflow-x-auto">
        <table className="card w-full text-left text-sm">
          <thead><tr><th>RA</th><th>Peso</th><th>Juego</th><th>Taller</th><th>Final</th><th>Cobertura</th><th>Estado</th></tr></thead>
          <tbody>
            {detalle.map((d) => (
              <tr key={d.ra} className="border-t">
                <td>{d.ra}</td><td>{Math.round((pesosRa[d.ra] ?? 0) * 100)} %</td><td>{f(d.juego)}</td><td>{f(d.taller)}</td><td>{f(d.final)}</td>
                <td>{Math.round(d.cobertura * 100)} %</td><td>{d.adquirido ? 'adquirido' : 'pendiente'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs">Los pesos y criterios están pendientes de verificación por el profesor. La nota no incluye XP, dinero ni logros.</p>
    </main>
  );
}
