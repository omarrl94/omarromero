/** Clientes aleatorios (con semilla) y sus peticiones verificables. */
import { devsIn, controllers, type Ctx } from './logic';
import { HOUSES } from './houses';

export interface Req { id: string; text: string; short: string; extraBudget: number; check: (c: Ctx) => { ok: boolean; detail?: string } }
export interface Client { seed: number; name: string; emoji: string; houseId: string; intro: string; budget: number; level: number; reqs: Req[] }

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = <T,>(r: () => number, a: T[]) => a[Math.floor(r() * a.length)];

const PEOPLE: [string, string][] = [
  ['Marta Quintana', '👩‍🍳'], ['Joaquín Prieto', '👴'], ['Familia Benítez', '👨‍👩‍👧'], ['Lucía y Hugo', '🧑‍🤝‍🧑'], ['Doña Remedios', '👵'],
  ['Álvaro Soto', '🧑‍💻'], ['Iván Casal', '🧔'], ['Noemí Ferrer', '👩‍🔬'], ['Samir Haddad', '👨‍🍳'], ['Paula Ortega', '👩‍🎨'],
];
const INTROS = [
  'Acabo de comprar el piso y no hay ni un enchufe donde lo necesito.',
  'Reforma integral, todo a cero. Quiero la instalación bien hecha de una vez.',
  'Tengo el presupuesto cerrado, así que ojo con lo que gastáis.',
  'Mi cuñado dice que se puede hacer más barato. Yo prefiero que sea seguro.',
  'Vivo con dos niños pequeños: cuanto más seguro, mejor.',
  'Me han dicho que ahora hay que poner diferencial. Hacedlo como toca.',
];

const room = (c: Ctx, id: string) => c.house.rooms.find((r) => r.id === id);
const HAS = (c: Ctx, id: string) => !!room(c, id);

const REQ: Record<string, (c: Ctx) => Req> = {
  cocina: () => ({ id: 'cocina', extraBudget: 0, short: 'Cocina: horno, lavadora y lavavajillas', text: 'En la cocina quiero horno y, por supuesto, lavadora y lavavajillas.',
    check: (c) => {
      const h = devsIn(c, 'cocina', 'tomaHorno'), l = devsIn(c, 'cocina', 'tomaLav');
      const ok = h.length >= 1 && l.length >= 2 && h.every((d) => d.circuit === 'C3') && l.every((d) => d.circuit === 'C4');
      return { ok, detail: ok ? undefined : `horno ${h.length}/1 · electrodomésticos ${l.length}/2 (cada uno en su circuito)` };
    } }),
  acSalon: () => ({ id: 'acSalon', extraBudget: 420, short: 'Aire acondicionado en el salón', text: 'Me muero de calor en verano: quiero aire acondicionado en el salón.',
    check: (c) => { const a = devsIn(c, 'salon', 'ac'); const ok = a.length >= 1 && a.every((d) => d.circuit === 'C9'); return { ok, detail: ok ? undefined : 'falta el equipo en el salón, en circuito C9' }; } }),
  conmPasillo: () => ({ id: 'conmPasillo', extraBudget: 40, short: 'Pasillo: luz desde los dos extremos', text: 'El pasillo es larguísimo: quiero encenderlo y apagarlo desde los dos extremos.',
    check: (c) => {
      const lights = devsIn(c, 'pasillo', 'luz');
      const okL = lights.filter((l) => { const cs = controllers(c, l.id).filter((d) => d.kind === 'conm'); if (cs.length < 2) return false; let m = 0; for (const a of cs) for (const b of cs) m = Math.max(m, Math.hypot(a.x - b.x, a.y - b.y)); return m >= 5; });
      const ok = lights.length > 0 && okL.length === lights.length;
      return { ok, detail: ok ? undefined : 'cada luz del pasillo necesita 2 conmutadores separados al menos 5 m' };
    } }),
  conmD1: () => ({ id: 'conmD1', extraBudget: 20, short: 'Dormitorio principal: luz desde la puerta y la cama', text: 'En mi dormitorio quiero apagar la luz desde la cama sin levantarme.',
    check: (c) => { const l = devsIn(c, 'd1', 'luz'); const ok = l.length > 0 && l.every((x) => controllers(c, x.id).filter((d) => d.kind === 'conm').length >= 2); return { ok, detail: ok ? undefined : 'necesita 2 conmutadores vinculados a la luz' }; } }),
  tv: () => ({ id: 'tv', extraBudget: 25, short: 'Toma de TV en el salón y en el dormitorio principal', text: 'Quiero toma de televisión en el salón y en el dormitorio principal.',
    check: (c) => { const a = devsIn(c, 'salon', 'tomaTV').length, b = devsIn(c, 'd1', 'tomaTV').length; return { ok: a >= 1 && b >= 1, detail: a >= 1 && b >= 1 ? undefined : `salón ${a}/1 · dormitorio ${b}/1` }; } }),
  ev: () => ({ id: 'ev', extraBudget: 650, short: 'Cargador de coche eléctrico en el garaje', text: 'He comprado un coche eléctrico: necesito un cargador en el garaje.',
    check: (c) => { const e = devsIn(c, 'garaje', 'ev'); const ok = e.length >= 1 && e.every((d) => d.circuit === 'CVE'); return { ok, detail: ok ? undefined : 'cargador en el garaje con circuito propio (CVE)' }; } }),
  luzTerraza: () => ({ id: 'luzTerraza', extraBudget: 50, short: 'Terraza: luz con detector de presencia', text: 'En la terraza quiero una luz que se encienda sola cuando salgo.',
    check: (c) => {
      const l = devsIn(c, 'terraza', 'luzExt');
      const ok = l.length >= 1 && l.every((x) => controllers(c, x.id).some((d) => d.kind === 'detector'));
      return { ok, detail: ok ? undefined : 'aplique exterior + detector vinculado' };
    } }),
  teletrabajo: () => ({ id: 'teletrabajo', extraBudget: 40, short: 'Despacho: 6 enchufes y toma de datos', text: 'Teletrabajo desde casa: en el despacho necesito 6 enchufes y toma de datos.',
    check: (c) => { const id = HAS(c, 'd3') ? 'd3' : 'd2'; const t = devsIn(c, id, 'toma').length, d = devsIn(c, id, 'tomaTV').length; const ok = t >= 6 && d >= 1; return { ok, detail: ok ? undefined : `${room(c, id)?.name}: enchufes ${t}/6 · datos ${d}/1` }; } }),
};
export const SPECIAL = ['acSalon', 'conmPasillo', 'conmD1', 'tv', 'ev', 'luzTerraza', 'teletrabajo'];

export function makeClient(seed: number, level = 1): Client {
  const r = rng(seed);
  const [name, emoji] = pick(r, PEOPLE);
  const houseId = r() < 0.55 ? 'piso3' : 'piso2';
  const house = HOUSES.find((h) => h.id === houseId)!;
  const n = Math.min(SPECIAL.length, 1 + level + (r() < 0.5 ? 1 : 0));
  const pool = [...SPECIAL];
  const chosen: string[] = [];
  while (chosen.length < n) chosen.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  const stub = { house } as Ctx;
  const reqs = ['cocina', ...chosen].map((id) => REQ[id](stub));
  const budget = Math.round(((houseId === 'piso3' ? 1450 : 1200) + reqs.reduce((a, q) => a + q.extraBudget, 0) + Math.floor(r() * 220)) / 10) * 10;
  return { seed, name, emoji, houseId, intro: pick(r, INTROS), budget, level, reqs };
}
