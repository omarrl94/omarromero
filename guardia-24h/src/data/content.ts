import { DistritoSchema, ItemSchema, LibraryDocSchema, RaFileSchema, type Distrito, type Item, type LibraryDoc } from './schemas';

const parse = <T,>(mods: Record<string, unknown>, schema: { parse: (x: unknown) => T }): T[] =>
  Object.values(mods).map((m) => schema.parse((m as { default: unknown }).default));

const raMods = import.meta.glob('/content/ra/ra.json', { eager: true });
const libMods = import.meta.glob('/content/library/*.json', { eager: true });
const disMods = import.meta.glob('/content/distritos/d*/distrito.json', { eager: true });
const itemMods = import.meta.glob(['/content/distritos/d*/*.json', '!/content/distritos/d*/distrito.json'], { eager: true });

export const raFile = parse(raMods, RaFileSchema)[0]!;
export const biblioteca: LibraryDoc[] = parse(libMods, LibraryDocSchema);
export const distritos: Distrito[] = parse(disMods, DistritoSchema).sort((a, b) => a.id - b.id);
export const items: Item[] = parse(itemMods, ItemSchema);
export const pesosRa: Record<string, number> = Object.fromEntries(raFile.ras.map((r) => [r.id, r.peso]));
