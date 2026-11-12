import { normaNum } from '../data/content';
import { cumple, dictamenApta, type Prueba } from '../engine/acta';

type Resp = Record<string, 'cumple' | 'no'>;

/** Acta de verificación: el alumno dictamina cada prueba con los valores medidos y emite el dictamen final. */
export function Acta({ pruebas, acta, dictamen, revelar, onChange }: { pruebas: Prueba[]; acta: Resp; dictamen?: 'apta' | 'no_apta'; revelar: boolean; onChange: (a: Resp, d?: 'apta' | 'no_apta') => void }) {
  return (
    <section className="card overflow-x-auto" aria-label="Acta de verificación">
      <h2 className="font-titulo text-lg font-black">📝 Acta de verificación</h2>
      <table className="w-full text-left text-sm">
        <thead><tr><th>Prueba</th><th>Valor medido</th><th>Dictamen</th>{revelar && <th>Correcto</th>}</tr></thead>
        <tbody>
          {pruebas.map((p) => (
            <tr key={p.id} className="border-t">
              <td>{p.nombre}</td><td>{p.valor} {p.unidad}</td>
              <td>
                <select aria-label={`Dictamen ${p.nombre}`} className="input" disabled={revelar} value={acta[p.id] ?? ''} onChange={(e) => onChange({ ...acta, [p.id]: e.target.value as 'cumple' | 'no' }, dictamen)}>
                  <option value="">—</option><option value="cumple">Cumple</option><option value="no">No cumple</option>
                </select>
              </td>
              {revelar && <td>{cumple(p, normaNum) ? 'Cumple' : 'No cumple'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      <label className="mt-2 block">Dictamen final de la instalación
        <select className="input" disabled={revelar} value={dictamen ?? ''} onChange={(e) => onChange(acta, (e.target.value || undefined) as 'apta' | 'no_apta' | undefined)}>
          <option value="">—</option><option value="apta">APTA</option><option value="no_apta">NO APTA</option>
        </select>
      </label>
      {revelar && <p className="mt-1 text-sm">Dictamen correcto: <strong>{dictamenApta(pruebas, normaNum) ? 'APTA' : 'NO APTA'}</strong></p>}
    </section>
  );
}
