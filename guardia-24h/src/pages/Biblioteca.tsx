import { useEffect, useMemo, useRef, useState } from 'react';
import { biblioteca } from '../data/content';
import type { LibraryDoc } from '../data/schemas';
import { borrarMiManual, guardarMiManual, importarMiManual, listarMiManual } from '../library/manual';
import { construirIndice } from '../library/search';

export function Biblioteca() {
  const [mio, setMio] = useState<LibraryDoc[]>([]);
  const [q, setQ] = useState('');
  const [aviso, setAviso] = useState('');
  const [nota, setNota] = useState('');
  const fichero = useRef<HTMLInputElement>(null);
  const recarga = () => void listarMiManual().then(setMio);
  useEffect(recarga, []);
  const todos = useMemo(() => [...biblioteca, ...mio], [mio]);
  const indice = useMemo(() => construirIndice(todos), [todos]);
  const res = indice.buscar(q);
  const pendientes = biblioteca.filter((b) => b.pendiente);

  async function subir(f: File | undefined) {
    if (!f) return;
    setAviso('Procesando…');
    try { await importarMiManual(f); setAviso(`«${f.name}» añadido a Mi manual (solo en este dispositivo).`); recarga(); }
    catch (e) { setAviso((e as Error).message); }
  }
  async function guardaNota() {
    if (!nota.trim()) return;
    await guardarMiManual({ id: `mi-${Date.now()}`, titulo: nota.trim().split('\n')[0]!.slice(0, 40), tipo: 'manual', estado: 'borrador', secciones: [{ id: 'nota', titulo: 'Nota', texto: nota }] });
    setNota(''); recarga();
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-4 p-4 md:grid-cols-[1fr_20rem]">
      <section>
        <h1 className="font-titulo text-2xl font-black">📚 Biblioteca</h1>
        {pendientes.length > 0 && (
          <p role="status" className="my-2 rounded bg-salmon/40 p-2 text-sm">
            Faltan contenidos oficiales: {pendientes.map((p) => p.titulo).join('; ')}. No se inventa texto normativo.
          </p>
        )}
        <label className="sr-only" htmlFor="q">Buscar</label>
        <input id="q" className="input my-2" type="search" placeholder="Buscar en REBT, manuales y Mi manual…" value={q} onChange={(e) => setQ(e.target.value)} />
        {q && res.length === 0 && <p>Sin resultados.</p>}
        <ul className="grid gap-2">
          {(q ? res : indice.frags).map((f) => (
            <li key={f.id} className="card">
              <div className="text-xs">{f.docTitulo}</div>
              <h2 className="font-bold">{f.titulo}</h2>
              <p className="whitespace-pre-wrap text-sm">{f.texto.slice(0, 400)}</p>
            </li>
          ))}
        </ul>
      </section>
      <aside className="grid content-start gap-3">
        <div className="card">
          <h2 className="font-bold">Mi manual</h2>
          <p className="text-sm">Privado: no sale de tu dispositivo.</p>
          <input ref={fichero} type="file" accept=".pdf,.docx,.md,.txt" className="my-2 block w-full text-sm" onChange={(e) => void subir(e.target.files?.[0])} />
          <textarea className="input" rows={3} placeholder="Escribe una nota…" value={nota} onChange={(e) => setNota(e.target.value)} />
          <button className="btn mt-2" onClick={() => void guardaNota()}>Guardar nota</button>
          {aviso && <p role="status" className="mt-2 text-sm">{aviso}</p>}
          <ul className="mt-2 text-sm">
            {mio.map((m) => (
              <li key={m.id} className="flex justify-between gap-2">
                <span className="truncate">{m.titulo}</span>
                <button className="underline" onClick={() => void borrarMiManual(m.id).then(recarga)}>Borrar</button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </main>
  );
}
