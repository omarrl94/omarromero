// Partida guardada: tres ranuras en localStorage. Todo lo que cambia la partida pasa por aquí.
import { START } from './world.js';
import { BUG, STARTERS, maxHpOf, xpToNext, stageOf } from './species.js';

const KEY = (slot) => `bitlandia.save.v1.${slot}`;
export const SLOTS = [0, 1, 2];

export function newGame(name) {
  return {
    v: 1,
    name: name || 'Ada',
    lang: null,
    createdAt: Date.now(),
    savedAt: Date.now(),
    playMs: 0,
    pos: { ...START },
    respawn: { x: START.x, y: START.y },
    flags: {},
    team: [],
    dex: { seen: {}, caught: {} },
    bag: { cafe: 3, expreso: 0 },
    bits: 100,
    drafts: {},
    solved: {},
    learned: {},
    stats: { wins: 0, attacks: 0, solved: 0 },
    settings: { music: true, sound: true },
  };
}

export function loadSlot(slot) {
  try {
    const raw = localStorage.getItem(KEY(slot));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function saveSlot(slot, game) {
  try {
    localStorage.setItem(KEY(slot), JSON.stringify({ ...game, savedAt: Date.now() }));
    return true;
  } catch {
    return false;
  }
}
export function deleteSlot(slot) {
  try { localStorage.removeItem(KEY(slot)); } catch { /* sin almacenamiento */ }
}

let uidSeq = 0;
const uid = () => `${Date.now().toString(36)}${(uidSeq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function makeDaemon(kind, species, level) {
  return { uid: uid(), kind, species, level, xp: 0, hp: maxHpOf(level) };
}

/** Nivel con el que se une un bug depurado: más alto cuanto más avanzado es su módulo. */
export const bugLevel = (id) => Math.max(2, Math.min(14, BUG[id].module * 2));

export const lead = (g) => g.team.find((m) => m.hp > 0) || g.team[0];
export const teamAlive = (g) => g.team.some((m) => m.hp > 0);

/** Suma experiencia a un daemon. Devuelve los mensajes de subida de nivel y evolución. */
export function gainXp(m, amount) {
  const msgs = [];
  m.xp += amount;
  while (m.xp >= xpToNext(m.level)) {
    m.xp -= xpToNext(m.level);
    const stageBefore = stageOf(m.level);
    m.level += 1;
    m.hp = Math.min(maxHpOf(m.level), m.hp + 6);
    msgs.push({ kind: 'level', level: m.level });
    if (m.kind === 'starter' && stageOf(m.level) > stageBefore) {
      msgs.push({ kind: 'evolve', from: STARTERS[m.species].names[stageBefore], to: STARTERS[m.species].names[stageOf(m.level)] });
    }
  }
  return msgs;
}

export const healAll = (g) => ({ ...g, team: g.team.map((m) => ({ ...m, hp: maxHpOf(m.level) })) });

export function fmtTime(ms) {
  const m = Math.floor(ms / 60000);
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

export const ITEMS = {
  cafe: { name: 'Café', heal: 25, price: 40, desc: 'Recupera 25 PS a un daemon.' },
  expreso: { name: 'Expreso', heal: 999, price: 120, desc: 'Recupera todos los PS a un daemon.' },
};
