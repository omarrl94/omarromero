import { useState } from 'react';
import { biblioteca } from '../data/content';
import type { Cita } from '../library/search';

/** Selector de cita: documento → ITC/capítulo/sección → apartado o tabla. */
export function CitaSelector({ onChange }: { onChange: (c: Cita | null) => void }) {
  const [doc, setDoc] = useState('');
  const [sec, setSec] = useState('');
  const [apartado, setApartado] = useState('');
  const d = biblioteca.find((x) => x.id === doc);
  const emite = (dd: string, ss: string, aa: string) => {
    const titulo = biblioteca.find((x) => x.id === dd);
    const s = titulo?.secciones.find((x) => x.id === ss);
    onChange(titulo && s ? { doc: titulo.tipo === 'rebt' ? 'REBT' : titulo.titulo, ref: [s.id, aa].filter(Boolean).join(' · ') } : null);
  };
  return (
    <fieldset className="card grid gap-2 sm:grid-cols-3">
      <legend className="px-1 font-bold">Cita</legend>
      <label>Documento
        <select className="input" value={doc} onChange={(e) => { setDoc(e.target.value); setSec(''); emite(e.target.value, '', apartado); }}>
          <option value="">—</option>
          {biblioteca.map((b) => <option key={b.id} value={b.id}>{b.titulo}</option>)}
        </select>
      </label>
      <label>ITC / sección
        <select className="input" value={sec} disabled={!d} onChange={(e) => { setSec(e.target.value); emite(doc, e.target.value, apartado); }}>
          <option value="">—</option>
          {d?.secciones.map((s) => <option key={s.id} value={s.id}>{s.titulo}</option>)}
        </select>
      </label>
      <label>Apartado / tabla
        <input className="input" value={apartado} placeholder="p. ej. Tabla 1" onChange={(e) => { setApartado(e.target.value); emite(doc, sec, e.target.value); }} />
      </label>
    </fieldset>
  );
}
