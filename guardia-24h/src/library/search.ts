import MiniSearch from 'minisearch';
import type { LibraryDoc } from '../data/schemas';

export interface Fragmento { id: string; docId: string; docTitulo: string; seccionId: string; titulo: string; texto: string }

export function construirIndice(docs: LibraryDoc[]) {
  const frags: Fragmento[] = docs.flatMap((d) =>
    d.secciones.map((s) => ({ id: `${d.id}::${s.id}`, docId: d.id, docTitulo: d.titulo, seccionId: s.id, titulo: s.titulo, texto: s.texto })),
  );
  const ms = new MiniSearch<Fragmento>({
    fields: ['titulo', 'texto'],
    storeFields: ['docId', 'docTitulo', 'seccionId', 'titulo', 'texto'],
    searchOptions: { prefix: true, fuzzy: 0.2, boost: { titulo: 3 } },
    processTerm: (t) => t.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''),
  });
  ms.addAll(frags);
  return { frags, buscar: (q: string) => (q.trim() ? (ms.search(q) as unknown as Fragmento[]) : []) };
}

export interface Cita { doc: string; ref: string }
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[\s·_.-]+/g, '');

/** Una cita es válida si coincide con alguna de `citas_validas` (documento y referencia, sin distinguir formato). */
export const citaValida = (c: Cita, validas: Cita[]): boolean =>
  validas.some((v) => norm(v.doc) === norm(c.doc) && norm(c.ref).startsWith(norm(v.ref)));
