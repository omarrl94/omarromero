export type RoomKind = 'salon' | 'cocina' | 'dormitorio' | 'bano' | 'pasillo' | 'terraza' | 'garaje';
export interface Room { id: string; name: string; kind: RoomKind; x: number; y: number; w: number; h: number; outdoor?: boolean }
export interface Door { x: number; y: number; len: number; orient: 'h' | 'v'; entry?: boolean }
export interface Win { x: number; y: number; len: number; orient: 'h' | 'v' }
export interface Furn { kind: 'cama' | 'sofa' | 'mesa' | 'encimera' | 'nevera' | 'banera' | 'lavabo' | 'inodoro' | 'armario' | 'lavadora' | 'coche' | 'tv'; x: number; y: number; w: number; h: number }
export interface House { id: string; name: string; w: number; h: number; ox: number; oy: number; rooms: Room[]; doors: Door[]; windows: Win[]; furniture: Furn[]; entry: { x: number; y: number }; panelDefault: { x: number; y: number }; tubZone?: { x: number; y: number; w: number; h: number } }

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
    house.doors.push({ x: r.x + r.w / 2 - 0.4, y: above ? r.y + r.h : r.y, len: 0.8, orient: 'h' });
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
      house.tubZone = t;
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
export const houseOf = (id: string) => HOUSES.find((h) => h.id === id) ?? HOUSES[0];
export const area = (r: Room) => r.w * r.h;
