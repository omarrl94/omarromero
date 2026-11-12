// «Mi manual»: se guarda SOLO en este dispositivo (IndexedDB), nunca se envía a la nube.
import { openDB } from 'idb';
import type { LibraryDoc } from '../data/schemas';

const dbp = openDB('guardia24h-manual', 1, { upgrade(d) { d.createObjectStore('docs', { keyPath: 'id' }); } });

export const listarMiManual = async (): Promise<LibraryDoc[]> => (await dbp).getAll('docs');
export const guardarMiManual = async (d: LibraryDoc) => { await (await dbp).put('docs', d); };
export const borrarMiManual = async (id: string) => { await (await dbp).delete('docs', id); };

/** Divide texto plano/markdown en secciones (por encabezados # o por bloques de ~1500 caracteres). */
export function trocea(texto: string): { id: string; titulo: string; texto: string }[] {
  const lineas = texto.replace(/\r/g, '').split('\n');
  const secs: { titulo: string; cuerpo: string[] }[] = [];
  for (const l of lineas) {
    const h = /^#{1,4}\s+(.*)$/.exec(l);
    if (h) secs.push({ titulo: h[1]!.trim(), cuerpo: [] });
    else (secs[secs.length - 1] ?? secs[secs.push({ titulo: 'Inicio', cuerpo: [] }) - 1]!).cuerpo.push(l);
  }
  const out: { id: string; titulo: string; texto: string }[] = [];
  secs.forEach((s, i) => {
    const t = s.cuerpo.join('\n').trim();
    if (!t && secs.length > 1) return;
    for (let k = 0; k < Math.max(1, Math.ceil(t.length / 1500)); k++) {
      out.push({ id: `s${i}-${k}`, titulo: k ? `${s.titulo} (${k + 1})` : s.titulo, texto: t.slice(k * 1500, (k + 1) * 1500) });
    }
  });
  return out;
}

export async function extraerTexto(f: File): Promise<string> {
  const n = f.name.toLowerCase();
  if (n.endsWith('.txt') || n.endsWith('.md')) return f.text();
  if (n.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    return (await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() })).value;
  }
  if (n.endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist');
    const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = worker;
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
    const partes: string[] = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const c = await (await pdf.getPage(p)).getTextContent();
      partes.push(`# Página ${p}\n` + c.items.map((i) => ('str' in i ? i.str : '')).join(' '));
    }
    return partes.join('\n');
  }
  throw new Error('Formato no admitido. Usa PDF, DOCX, MD o TXT.');
}

export async function importarMiManual(f: File): Promise<LibraryDoc> {
  const secciones = trocea(await extraerTexto(f));
  const doc: LibraryDoc = { id: `mi-${Date.now()}`, titulo: f.name, tipo: 'manual', estado: 'borrador', secciones };
  await guardarMiManual(doc);
  return doc;
}
