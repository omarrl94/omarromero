export type RoomKind = 'salon' | 'cocina' | 'dormitorio' | 'bano' | 'pasillo' | 'terraza' | 'garaje';
export interface Room { id: string; name: string; kind: RoomKind; x: number; y: number; w: number; h: number; outdoor?: boolean }
export interface Door { x: number; y: number; len: number; orient: 'h' | 'v'; entry?: boolean; dir?: 1 | -1 }
export interface Win { x: number; y: number; len: number; orient: 'h' | 'v' }
export interface Furn { kind: 'cama' | 'sofa' | 'mesa' | 'encimera' | 'nevera' | 'banera' | 'lavabo' | 'inodoro' | 'armario' | 'lavadora' | 'coche' | 'tv'; x: number; y: number; w: number; h: number }
export interface House { id: string; name: string; w: number; h: number; ox: number; oy: number; rooms: Room[]; doors: Door[]; windows: Win[]; furniture: Furn[]; entry: { x: number; y: number }; panelDefault: { x: number; y: number }; tubZone?: { x: number; y: number; w: number; h: number }; tubZones?: { x: number; y: number; w: number; h: number }[]; bg?: { src: string; w: number; h: number }; custom?: boolean }

const R = (id: string, name: string, kind: RoomKind, x: number, y: number, w: number, h: number, outdoor = false): Room => ({ id, name, kind, x, y, w, h, outdoor });

function build(id: string, name: string, rooms: Room[], pasillo: Room): House {
  const house: House = { id, name, w: 0, h: 0, ox: 0, oy: 0, rooms, doors: [], windows: [], furniture: [], entry: { x: 0.2, y: pasillo.y + pasillo.h / 2 }, panelDefault: { x: 0.35, y: pasillo.y + pasillo.h - 0.3 } };
  const minX = Math.min(...rooms.map((r) => r.x)), minY = Math.min(...rooms.map((r) => r.y));
  const maxX = Math.max(...rooms.map((r) => r.x + r.w)), maxY = Math.max(...rooms.map((r) => r.y + r.h));
  house.ox = minX; house.oy = minY; house.w = maxX - minX; house.h = maxY - minY;
  // Puertas al pasillo, entrada y ventanas exteriores
  for (const r of rooms) {
    if (r.id === pasillo.id) continue;
    if (r.kind === 'terraza') { house.doors.push({ x: r.x + r.w * 0.3, y: r.y + r.h, len: 0.9, orient: 'h' }); continue; }
    if (r.kind === 'garaje') { house.doors.push({ x: r.x, y: r.y + r.h / 2 - 0.4, len: 0.9, orient: 'v' }); continue; }
    const above = r.y + r.h <= pasillo.y + 0.01;
    house.doors.push({ x: r.x + r.w / 2 - 0.4, y: above ? r.y + r.h : r.y, len: 0.8, orient: 'h', dir: above ? -1 : 1 });
    if (r.y <= 0.01 || r.y + r.h >= maxY - 0.01) house.windows.push({ x: r.x + r.w / 2 - (r.kind === 'bano' ? 0.35 : 0.7), y: r.y <= 0.01 ? r.y : r.y + r.h, len: r.kind === 'bano' ? 0.7 : 1.4, orient: 'h' });
  }
  house.doors.push({ x: pasillo.x, y: pasillo.y + pasillo.h / 2 - 0.45, len: 0.9, orient: 'v', entry: true });
  // Mobiliario
  for (const r of rooms) {
    if (r.kind === 'dormitorio') house.furniture.push({ kind: 'cama', x: r.x + r.w / 2 - 0.8, y: r.y + r.h - 2.1, w: 1.6, h: 2 }, { kind: 'armario', x: r.x + 0.1, y: r.y + r.h - 0.6, w: Math.min(1.6, r.w - 2.2), h: 0.5 });
    if (r.kind === 'salon') house.furniture.push({ kind: 'sofa', x: r.x + 0.8, y: r.y + r.h - 1.1, w: 2.2, h: 0.9 }, { kind: 'mesa', x: r.x + r.w - 1.9, y: r.y + 1.3, w: 1.5, h: 0.9 }, { kind: 'tv', x: r.x + 0.8, y: r.y + 0.1, w: 1.6, h: 0.4 });
    if (r.kind === 'cocina') house.furniture.push({ kind: 'encimera', x: r.x, y: r.y, w: r.w, h: 0.6 }, { kind: 'nevera', x: r.x + r.w - 0.7, y: r.y + 0.65, w: 0.65, h: 0.65 }, { kind: 'lavadora', x: r.x + 0.05, y: r.y + r.h - 0.65, w: 0.6, h: 0.6 });
    if (r.kind === 'bano') {
      const t = { x: r.x + r.w - 0.8, y: r.y + 0.05, w: 0.75, h: 1.7 };
      house.furniture.push({ kind: 'banera', ...t }, { kind: 'lavabo', x: r.x + 0.1, y: r.y + 0.1, w: 0.6, h: 0.45 }, { kind: 'inodoro', x: r.x + 0.15, y: r.y + 1.1, w: 0.4, h: 0.7 });
      house.tubZone ??= t; (house.tubZones ??= []).push(t);
    }
    if (r.kind === 'garaje') house.furniture.push({ kind: 'coche', x: r.x + 0.5, y: r.y + 0.3, w: 2.1, h: r.h - 0.6 });
  }
  return house;
}

export const HOUSES: House[] = [
  build('piso3', 'Piso de 3 dormitorios · 97 m²', [
    R('terraza', 'Terraza', 'terraza', 0, -2, 5, 2, true),
    R('salon', 'Salón', 'salon', 0, 0, 5, 4.2), R('cocina', 'Cocina', 'cocina', 5, 0, 3.2, 4.2), R('bano', 'Baño', 'bano', 8.2, 0, 2.6, 4.2),
    R('pasillo', 'Pasillo', 'pasillo', 0, 4.2, 10.8, 1.2),
    R('d1', 'Dormitorio principal', 'dormitorio', 0, 5.4, 4, 3.6), R('d2', 'Dormitorio 2', 'dormitorio', 4, 5.4, 3.4, 3.6), R('d3', 'Dormitorio 3 / despacho', 'dormitorio', 7.4, 5.4, 3.4, 3.6),
    R('garaje', 'Garaje', 'garaje', 11.2, 5.4, 3.4, 3.6, true),
  ], R('pasillo', 'Pasillo', 'pasillo', 0, 4.2, 10.8, 1.2)),
  build('piso2', 'Piso de 2 dormitorios · 72 m²', [
    R('terraza', 'Terraza', 'terraza', 0, -1.8, 4.6, 1.8, true),
    R('salon', 'Salón', 'salon', 0, 0, 4.6, 4), R('cocina', 'Cocina', 'cocina', 4.6, 0, 3, 4), R('bano', 'Baño', 'bano', 7.6, 0, 2.4, 4),
    R('pasillo', 'Pasillo', 'pasillo', 0, 4, 10, 1.1),
    R('d1', 'Dormitorio principal', 'dormitorio', 0, 5.1, 5, 3.4), R('d2', 'Dormitorio 2', 'dormitorio', 5, 5.1, 5, 3.4),
    R('garaje', 'Garaje', 'garaje', 10.4, 5.1, 3, 3.4, true),
  ], R('pasillo', 'Pasillo', 'pasillo', 0, 4, 10, 1.1)),
];
HOUSES.push(
  build('piso1', 'Piso de 1 dormitorio · 54 m²', [
    R('salon', 'Salón-comedor', 'salon', 0, 0, 4.4, 3.8), R('cocina', 'Cocina', 'cocina', 4.4, 0, 2.6, 3.8), R('bano', 'Baño', 'bano', 7, 0, 2.2, 3.8),
    R('pasillo', 'Pasillo', 'pasillo', 0, 3.8, 9.2, 1),
    R('d1', 'Dormitorio', 'dormitorio', 0, 4.8, 4.8, 3.2),
  ], R('pasillo', 'Pasillo', 'pasillo', 0, 3.8, 9.2, 1)),
  build('chalet', 'Chalet de 4 dormitorios y 2 baños · 128 m²', [
    R('terraza', 'Terraza', 'terraza', 0, -2.2, 6, 2.2, true),
    R('salon', 'Salón', 'salon', 0, 0, 6, 4.6), R('cocina', 'Cocina', 'cocina', 6, 0, 3.4, 4.6), R('bano', 'Baño 1', 'bano', 9.4, 0, 2.6, 4.6),
    R('pasillo', 'Pasillo', 'pasillo', 0, 4.6, 16.8, 1.2),
    R('d1', 'Dormitorio principal', 'dormitorio', 0, 5.8, 4.2, 3.6), R('d2', 'Dormitorio 2', 'dormitorio', 4.2, 5.8, 3.4, 3.6), R('bano2', 'Baño 2', 'bano', 7.6, 5.8, 2.4, 3.6),
    R('d3', 'Dormitorio 3', 'dormitorio', 10, 5.8, 3.4, 3.6), R('d4', 'Dormitorio 4 / despacho', 'dormitorio', 13.4, 5.8, 3.4, 3.6),
    R('garaje', 'Garaje', 'garaje', 17.2, 5.8, 4, 3.6, true),
  ], R('pasillo', 'Pasillo', 'pasillo', 0, 4.6, 16.8, 1.2)),
  build('atico', 'Ático de 2 dormitorios con terraza · 81 m²', [
    R('terraza', 'Terraza', 'terraza', 0, -2.6, 6.4, 2.6, true),
    R('salon', 'Salón', 'salon', 0, 0, 6.4, 4.4), R('cocina', 'Cocina', 'cocina', 6.4, 0, 3, 4.4), R('bano', 'Baño', 'bano', 9.4, 0, 2.4, 4.4),
    R('pasillo', 'Pasillo', 'pasillo', 0, 4.4, 11.8, 1.1),
    R('d1', 'Dormitorio principal', 'dormitorio', 0, 5.5, 5.4, 3.6), R('d2', 'Dormitorio 2', 'dormitorio', 5.4, 5.5, 4.2, 3.6),
  ], R('pasillo', 'Pasillo', 'pasillo', 0, 4.4, 11.8, 1.1)),
);

/** Construye una vivienda jugable a partir de estancias rectangulares dibujadas a mano (puertas, ventanas y mobiliario automáticos). */
export function finalizeHouse(id: string, name: string, rooms: Room[], entry: { x: number; y: number }, bg?: House['bg']): House {
  const pasillo = rooms.find((r) => r.id === 'pasillo')!;
  const base = build(id, name, rooms, pasillo);
  const house: House = { ...base, doors: [], windows: [], entry, panelDefault: { x: entry.x + (entry.x > pasillo.x + pasillo.w / 2 ? -0.6 : 0.6), y: Math.min(pasillo.y + pasillo.h - 0.2, Math.max(pasillo.y + 0.2, entry.y)) }, custom: true, bg };
  const ov = (a0: number, a1: number, b0: number, b1: number) => [Math.max(a0, b0), Math.min(a1, b1)] as const;
  const near = (a: number, b: number) => Math.abs(a - b) < 0.06;
  const maxX = Math.max(...rooms.map((r) => r.x + r.w)), maxY = Math.max(...rooms.map((r) => r.y + r.h)), minX = Math.min(...rooms.map((r) => r.x)), minY = Math.min(...rooms.map((r) => r.y));
  const doorBetween = (a: Room, b: Room): Door | null => {
    if (near(a.y + a.h, b.y) || near(b.y + b.h, a.y)) { const [x0, x1] = ov(a.x, a.x + a.w, b.x, b.x + b.w); if (x1 - x0 >= 0.9) { const y = near(a.y + a.h, b.y) ? b.y : a.y; return { x: (x0 + x1) / 2 - 0.4, y, len: 0.8, orient: 'h', dir: near(a.y + a.h, b.y) ? (b === pasillo ? -1 : 1) : (b === pasillo ? 1 : -1) }; } }
    if (near(a.x + a.w, b.x) || near(b.x + b.w, a.x)) { const [y0, y1] = ov(a.y, a.y + a.h, b.y, b.y + b.h); if (y1 - y0 >= 0.9) { const x = near(a.x + a.w, b.x) ? b.x : a.x; return { x, y: (y0 + y1) / 2 - 0.4, len: 0.8, orient: 'v' }; } }
    return null;
  };
  for (const r of rooms) {
    if (r === pasillo) continue;
    const d = doorBetween(r, pasillo) ?? rooms.filter((o) => o !== r && o.kind !== 'pasillo').map((o) => doorBetween(r, o)).find(Boolean) ?? null;
    if (d) house.doors.push(d);
    if (!r.outdoor && r.kind !== 'pasillo') { if (near(r.y, minY)) house.windows.push({ x: r.x + r.w / 2 - 0.6, y: r.y, len: 1.2, orient: 'h' }); else if (near(r.y + r.h, maxY)) house.windows.push({ x: r.x + r.w / 2 - 0.6, y: r.y + r.h, len: 1.2, orient: 'h' }); }
  }
  void maxX; void minX;
  house.doors.push({ x: entry.x, y: Math.max(pasillo.y, Math.min(pasillo.y + pasillo.h - 0.9, entry.y - 0.45)), len: 0.9, orient: 'v', entry: true, dir: entry.x > pasillo.x + pasillo.w / 2 ? -1 : 1 });
  if (bg) { house.ox = 0; house.oy = 0; house.w = bg.w; house.h = bg.h; }
  return house;
}

/** Planos propios (subidos por el alumno o el profesor): se guardan en este navegador. */
const CUSTOM_KEY = 'circuitossea:planos';
let custom: House[] = [];
try { custom = JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? '[]'); } catch { custom = []; }
const persist = () => { try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom)); return true; } catch { return false; /* sin almacenamiento o imagen demasiado grande */ } };
export const customHouses = () => custom;
export function registerHouse(h: House): boolean { custom = [...custom.filter((c) => c.id !== h.id), { ...h, custom: true }]; return persist(); }
export function removeHouse(id: string) { custom = custom.filter((c) => c.id !== id); persist(); }
export const houseOf = (id: string) => HOUSES.find((h) => h.id === id) ?? custom.find((h) => h.id === id) ?? HOUSES[0];
/** Estancia donde se pide el teletrabajo (el último dormitorio libre). */
export const officeId = (h: House) => (h.rooms.filter((r) => r.kind === 'dormitorio' && r.id !== 'd1').pop()?.id ?? null);
/** Los mínimos para poder jugar sobre un plano. */
export function validateHouse(h: Pick<House, 'rooms'>): string[] {
  const miss: string[] = [];
  for (const [id, label] of [['salon', 'un salón'], ['cocina', 'una cocina'], ['pasillo', 'un pasillo (donde irá el cuadro y la entrada)'], ['bano', 'un baño'], ['d1', 'al menos un dormitorio']] as const) if (!h.rooms.some((r) => r.id === id)) miss.push(`Falta ${label}.`);
  return miss;
}
export const area = (r: Room) => r.w * r.h;
