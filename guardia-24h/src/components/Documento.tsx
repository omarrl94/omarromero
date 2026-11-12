import type { Item } from '../data/schemas';

const papel = 'rounded-md border border-[#cfc8b4] bg-[#f8f6ee] p-5 text-[#222] shadow-[0_6px_20px_rgba(0,0,0,.45)]';

/** Documento a completar (certificado, plan de mantenimiento…). */
export function Formulario({ f, valores, revelar, onChange }: { f: NonNullable<Item['formulario']>; valores: Record<string, string>; revelar: boolean; onChange: (v: Record<string, string>) => void }) {
  return (
    <section className={papel} aria-label={f.titulo}>
      <header className="border-b-2 border-[#222] pb-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#666]">Documento oficial · borrador de práctica</div>
        <h2 className="text-lg font-bold uppercase tracking-wide !text-[#111]">{f.titulo}</h2>
        {f.subtitulo && <p className="text-sm text-[#555]">{f.subtitulo}</p>}
      </header>
      <div className="mt-3 divide-y divide-[#d8d2bf]">
        {f.campos.map((c) => {
          const v = valores[c.id] ?? '';
          const ok = revelar && (typeof c.correcta === 'number' ? Math.abs(Number(v.replace(',', '.')) - c.correcta) <= (c.tolerancia ?? 0) : v === c.correcta);
          return (
            <div key={c.id} className="grid items-center gap-2 py-2 sm:grid-cols-[1fr_16rem]">
              <label htmlFor={`f-${c.id}`} className="text-sm font-medium">{c.etiqueta}</label>
              <div>
                {c.tipo === 'select'
                  ? <select id={`f-${c.id}`} disabled={revelar} value={v} onChange={(e) => onChange({ ...valores, [c.id]: e.target.value })} className="w-full rounded border border-[#8c866f] bg-white px-2 py-1.5 text-sm text-[#111]"><option value="">— seleccionar —</option>{c.opciones?.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                  : <input id={`f-${c.id}`} disabled={revelar} inputMode="decimal" value={v} onChange={(e) => onChange({ ...valores, [c.id]: e.target.value })} className="w-full rounded border border-[#8c866f] bg-white px-2 py-1.5 font-mono text-sm text-[#111]" />}
                {revelar && <p className={`mt-1 text-xs font-semibold ${ok ? 'text-[#157347]' : 'text-[#b02a37]'}`}>{ok ? 'Correcto' : `Correcto: ${c.correcta}`}{!ok && c.explicacion ? ` · ${c.explicacion}` : ''}</p>}
              </div>
            </div>
          );
        })}
      </div>
      <footer className="mt-4 flex justify-between border-t border-[#d8d2bf] pt-3 text-xs text-[#777]"><span>Firma del instalador: ______________________</span><span>Fecha: ___ / ___ / ______</span></footer>
    </section>
  );
}

/** Texto técnico generado por IA con errores plantados: el alumno marca los fragmentos incorrectos. */
export function TextoErrores({ t, seleccion, revelar, onChange }: { t: NonNullable<Item['texto']>; seleccion: string[]; revelar: boolean; onChange: (s: string[]) => void }) {
  const alterna = (id: string) => { if (!revelar) onChange(seleccion.includes(id) ? seleccion.filter((x) => x !== id) : [...seleccion, id]); };
  return (
    <section className={papel} aria-label={t.titulo}>
      <header className="flex items-start justify-between gap-3 border-b-2 border-[#222] pb-2">
        <div><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#666]">{t.origen ?? 'Borrador generado por ASIST-IA'}</div><h2 className="text-lg font-bold !text-[#111]">{t.titulo}</h2></div>
        <span className="rounded border border-[#b58a00] bg-[#fff3c4] px-2 py-0.5 text-[10px] font-bold uppercase text-[#7a5d00]">Sin verificar</span>
      </header>
      <p className="mt-3 text-sm leading-7">
        {t.fragmentos.map((f) => {
          const m = seleccion.includes(f.id);
          const cls = revelar ? (f.defecto ? 'bg-[#f8c9cc] underline decoration-[#b02a37] decoration-2' : m ? 'bg-[#fbe3c9] line-through decoration-[#b26a00]' : '') : m ? 'bg-[#ffe27a]' : 'hover:bg-[#efe7c8]';
          return <button key={f.id} type="button" aria-pressed={m} disabled={revelar} onClick={() => alterna(f.id)} className={`mr-1 inline rounded-sm px-0.5 text-left align-baseline transition ${cls}`}>{f.x}</button>;
        })}
      </p>
      <p className="mt-3 text-xs text-[#666]">Marca las frases incorrectas o dudosas. Marcar frases correctas resta puntuación.</p>
    </section>
  );
}
