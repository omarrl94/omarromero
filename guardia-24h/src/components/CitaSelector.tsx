import { useId, useState } from 'react';
import { biblioteca } from '../data/content';
import type { Cita } from '../library/search';

/** Selector de cita: documento → ITC/sección/apartado (texto libre con sugerencias de la biblioteca). */
export function CitaSelector({ onChange }: { onChange: (c: Cita | null) => void }) {
  const [doc, setDoc] = useState('REBT');
  const [ref, setRef] = useState('');
  const lista = useId();
  const emite = (d: string, r: string) => onChange(d && r.trim() ? { doc: d, ref: r.trim() } : null);
  const sugerencias = biblioteca.find((b) => (b.tipo === 'rebt' ? 'REBT' : b.titulo) === doc)?.secciones ?? [];
  return (
    <fieldset className="card grid gap-2 sm:grid-cols-2">
      <legend className="px-1 font-bold">Cita (documento y apartado)</legend>
      <label>Documento
        <select className="input" value={doc} onChange={(e) => { setDoc(e.target.value); emite(e.target.value, ref); }}>
          <option value="REBT">REBT</option>
          {biblioteca.filter((b) => b.tipo === 'manual').map((b) => <option key={b.id} value={b.titulo}>{b.titulo}</option>)}
        </select>
      </label>
      <label>ITC / apartado / tabla
        <input className="input" list={lista} value={ref} placeholder="p. ej. ITC-BT-21" onChange={(e) => { setRef(e.target.value); emite(doc, e.target.value); }} />
        <datalist id={lista}>{sugerencias.map((s) => <option key={s.id} value={s.titulo} />)}</datalist>
      </label>
    </fieldset>
  );
}
