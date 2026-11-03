// Estado del jugador: Neural XP, rangos, rachas, estrellas, borradores y logros.
// Cada lenguaje es un MUNDO independiente: XP, rango, estrellas, lecciones vistas
// y desbloqueo de módulos se guardan por mundo.
// Persistido en localStorage (con try/catch: funciona igual en modo privado).
import { createContext, useContext } from 'react';
import { CHALLENGES, MODULES } from '../curriculum/index.js';
import { LANG_ORDER } from './languages.js';

const LEGACY_KEY = 'codeforge.living-engine.v1';
const keyFor = (uid) => `codeforge.progress.v2.${uid}`;

export const RANKS = [
  { name: 'Script Kiddie', xp: 0, color: '#8b93b8' },
  { name: 'Bit Wrangler', xp: 250, color: '#22e4ff' },
  { name: 'Loop Rider', xp: 700, color: '#a3ff3d' },
  { name: 'Data Smith', xp: 1400, color: '#ffb534' },
  { name: 'Object Shaper', xp: 2200, color: '#9d7bff' },
  { name: 'Systems Hacker', xp: 3100, color: '#ff3df0' },
  { name: 'Kernel Sage', xp: 4200, color: '#ff6b4a' },
  { name: 'Architect Master', xp: 5400, color: '#ffe066' },
];

export const ACHIEVEMENTS = {
  'first-blood': { name: 'Primer Latido', desc: 'Completa tu primera misión.', icon: 'Zap' },
  'bug-hunter': { name: 'Cazador de Bugs', desc: 'Repara 5 errores de compilación o ejecución.', icon: 'Bug' },
  'world-complete': { name: 'Mundo Construido', desc: 'Conquista todos los niveles de un mundo.', icon: 'Globe' },
  'explorer': { name: 'Explorador', desc: 'Supera una misión en 3 mundos distintos.', icon: 'Languages' },
  'clean-coder': { name: 'Código Limpio', desc: 'Consigue 3 estrellas en 5 misiones.', icon: 'Sparkles' },
  'autonomous': { name: 'Piloto Autónomo', desc: 'Completa una misión sin pistas profundas del pato.', icon: 'Bot' },
  'boss-slayer': { name: 'Rompe-Enjambres', desc: 'Derrota al Enjambre O(n²).', icon: 'Skull' },
  'streak-3': { name: 'En Racha', desc: 'Programa 3 días seguidos.', icon: 'Flame' },
  'memory-master': { name: 'Guardián del Heap', desc: 'Termina el módulo de sistemas en C o C++ sin fugas.', icon: 'MemoryStick' },
};

export const today = () => new Date().toISOString().slice(0, 10);
const yesterday = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);

export const initialState = {
  version: 1,
  xp: {},
  lang: null,
  completed: {},
  drafts: {},
  hints: {},
  streak: { count: 0, last: null, best: 0 },
  stats: { runs: 0, bugsFixed: 0, deploys: 0 },
  settings: { sound: true, keys: false, autorun: true },
  achievements: [],
  seenIntro: false,
  lessonsSeen: {},
  tourSeen: false,
};

function normalize(data) {
    // Migración: antes la XP era global y las lecciones no distinguían mundo.
    if (typeof data.xp === 'number') data.xp = data.xp ? { [data.lang || 'python']: data.xp } : {};
    if (data.lessonsSeen && Object.keys(data.lessonsSeen).some((k) => !k.includes(':'))) data.lessonsSeen = {};
    return { ...initialState, ...data, settings: { ...initialState.settings, ...data.settings }, stats: { ...initialState.stats, ...data.stats } };
}

/**
 * Progreso de un jugador. Si es la primera vez que entra y existe progreso de
 * antes de las cuentas (clave antigua), lo hereda y la clave antigua se retira.
 */
export function loadState(uid) {
  try {
    let raw = uid ? localStorage.getItem(keyFor(uid)) : null;
    if (!raw && uid) {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        raw = legacy;
        localStorage.setItem(keyFor(uid), legacy);
        localStorage.removeItem(LEGACY_KEY);
      }
    }
    if (!raw) return { ...initialState, seenIntro: true };
    return normalize(JSON.parse(raw));
  } catch {
    return { ...initialState, seenIntro: true };
  }
}

export function saveState(state, uid) {
  if (!uid) return;
  try {
    localStorage.setItem(keyFor(uid), JSON.stringify({ ...state, savedAt: Date.now() }));
  } catch {
    /* almacenamiento no disponible: el progreso vive solo en esta sesión */
  }
}

/** Une el progreso local y el de la nube sin perder nada: lo mejor de cada uno. */
export function mergeProgress(localState, remote) {
  if (!remote) return localState;
  const r = normalize(remote);
  // Gana la copia más reciente; un navegador sin progreso propio siempre cede ante la nube.
  const localEmpty = !localState.lang && !Object.keys(localState.completed || {}).length;
  const newer = localEmpty || (r.savedAt || 0) > (localState.savedAt || 0) ? r : localState;
  const completed = { ...r.completed };
  for (const [id, byLang] of Object.entries(localState.completed || {})) {
    completed[id] = { ...(completed[id] || {}) };
    for (const [l, rec] of Object.entries(byLang)) {
      const other = completed[id][l];
      completed[id][l] = !other || rec.stars >= other.stars ? rec : other;
    }
  }
  const xp = { ...r.xp };
  for (const [l, v] of Object.entries(localState.xp || {})) xp[l] = Math.max(v, xp[l] || 0);
  return {
    ...newer,
    completed,
    xp,
    achievements: [...new Set([...(localState.achievements || []), ...(r.achievements || [])])],
    lessonsSeen: { ...r.lessonsSeen, ...localState.lessonsSeen },
    streak: (r.streak && localState.streak && (r.streak.best || 0) > (localState.streak.best || 0)) ? r.streak : localState.streak || r.streak,
    seenIntro: true,
    lastReward: localState.lastReward,
  };
}

/** Estadísticas públicas para el ranking. */
export function playerStats(state) {
  return {
    gold: totalGold(state),
    xp: totalXp(state),
    worlds: LANG_ORDER.filter((l) => worldDone(state, l) === CHALLENGES.length).length,
    conquered: LANG_ORDER.reduce((n, l) => n + worldDone(state, l), 0),
  };
}

export function rankOf(xp) {
  let idx = 0;
  RANKS.forEach((r, i) => { if (xp >= r.xp) idx = i; });
  const cur = RANKS[idx];
  const next = RANKS[idx + 1];
  return { ...cur, index: idx, next, progress: next ? (xp - cur.xp) / (next.xp - cur.xp) : 1 };
}

export const draftKey = (chId, lang) => `${chId}:${lang}`;

export const worldXp = (state, lang = state.lang) => (state.xp && state.xp[lang]) || 0;
export const starsOf = (state, chId, lang = state.lang) => (state.completed[chId] && state.completed[chId][lang] ? state.completed[chId][lang].stars : 0);
export const isDone = (state, chId, lang = state.lang) => !!(state.completed[chId] && state.completed[chId][lang]);
export const worldDone = (state, lang = state.lang) => CHALLENGES.filter((c) => isDone(state, c.id, lang)).length;

// Oro: se deriva del progreso (no se guarda aparte), así siempre es coherente.
export const GOLD_PER_STAR = 25;
export const CROWN_BONUS = 150;
export const goldOf = (state, lang = state.lang) => CHALLENGES.reduce((g, c) => g + starsOf(state, c.id, lang) * GOLD_PER_STAR, 0)
  + (worldDone(state, lang) === CHALLENGES.length ? CROWN_BONUS : 0);
export const totalGold = (state) => LANG_ORDER.reduce((g, l) => g + goldOf(state, l), 0);
export const totalXp = (state) => Object.values(state.xp || {}).reduce((a, b) => a + b, 0);

export function moduleUnlocked(state, moduleId, lang = state.lang) {
  if (moduleId === 1) return true;
  const prev = MODULES.find((m) => m.id === moduleId - 1);
  return prev.challenges.every((c) => isDone(state, c.id, lang));
}

function bumpStreak(streak) {
  const t = today();
  if (streak.last === t) return streak;
  const count = streak.last === yesterday() ? streak.count + 1 : 1;
  return { count, last: t, best: Math.max(streak.best || 0, count) };
}

function withAchievements(state) {
  const got = new Set(state.achievements);
  const add = (id) => got.add(id);
  const entries = Object.values(state.completed).flatMap((byLang) => Object.entries(byLang));
  if (entries.length) add('first-blood');
  if (state.stats.bugsFixed >= 5) add('bug-hunter');
  const worlds = new Set(entries.map(([l]) => l));
  if (worlds.size >= 3) add('explorer');
  if ([...worlds].some((l) => worldDone(state, l) === CHALLENGES.length)) add('world-complete');
  if (entries.filter(([, x]) => x.stars === 3).length >= 5) add('clean-coder');
  if (entries.some(([, x]) => x.noHints)) add('autonomous');
  if (Object.keys(state.completed['boss-swarm'] || {}).length) add('boss-slayer');
  if (state.streak.count >= 3) add('streak-3');
  const sys = state.completed['m5-systems'] || {};
  if (sys.c || sys.cpp) add('memory-master');
  const list = [...got];
  return { ...state, achievements: list };
}

/**
 * Reducer del progreso. La acción `complete` calcula estrellas y XP:
 *   ★ superar la misión · ★ sin pistas profundas del pato · ★ estilo impecable
 * XP del mundo: base × (60/80/100 %) la primera vez; mejorar estrellas paga la diferencia.
 */
export function reducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'lessonSeen':
      return { ...state, lessonsSeen: { ...state.lessonsSeen, [draftKey(action.id, action.lang)]: true } };
    case 'tourSeen':
      return { ...state, tourSeen: true };
    case 'setLang':
      return { ...state, lang: action.lang };
    case 'intro':
      return { ...state, seenIntro: true, lang: action.lang || state.lang };
    case 'draft':
      return { ...state, drafts: { ...state.drafts, [draftKey(action.id, action.lang)]: action.code } };
    case 'resetDraft': {
      const drafts = { ...state.drafts };
      delete drafts[draftKey(action.id, action.lang)];
      return { ...state, drafts };
    }
    case 'hint': {
      const k = draftKey(action.id, action.lang);
      return { ...state, hints: { ...state.hints, [k]: (state.hints[k] || 0) + 1 } };
    }
    case 'run':
      return { ...state, stats: { ...state.stats, runs: state.stats.runs + 1, bugsFixed: state.stats.bugsFixed + (action.fixed ? 1 : 0) } };
    case 'setting':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } };
    case 'complete': {
      const { id, lang, clean } = action;
      const ch = CHALLENGES.find((c) => c.id === id);
      const noHints = !(state.hints[draftKey(id, lang)] > 0);
      const stars = 1 + (noHints ? 1 : 0) + (clean ? 1 : 0);
      const prev = (state.completed[id] || {})[lang];
      const pct = [0, 0.6, 0.8, 1][stars];
      let gain = 0;
      const breakdown = [];
      if (!prev) {
        gain = Math.round(ch.xp * pct);
        breakdown.push({ label: `Misión superada ${'★'.repeat(stars)}`, xp: gain });
      } else if (stars > prev.stars) {
        gain = Math.round(ch.xp * (pct - [0, 0.6, 0.8, 1][prev.stars]));
        breakdown.push({ label: `Mejora a ${'★'.repeat(stars)}`, xp: gain });
      }
      const entryRec = { stars: Math.max(stars, prev ? prev.stars : 0), at: Date.now(), noHints: noHints || (prev && prev.noHints) };
      const goldBefore = goldOf(state, lang);
      let next = {
        ...state,
        xp: { ...state.xp, [lang]: worldXp(state, lang) + gain },
        completed: { ...state.completed, [id]: { ...(state.completed[id] || {}), [lang]: entryRec } },
        streak: bumpStreak(state.streak),
        stats: { ...state.stats, deploys: state.stats.deploys + 1 },
        lastReward: { id, lang, gain, stars, breakdown, firstTime: !prev, at: Date.now() },
      };
      next = withAchievements(next);
      next.lastReward = { ...next.lastReward, gold: goldOf(next, lang) - goldBefore, crown: worldDone(next, lang) === CHALLENGES.length && worldDone(state, lang) < CHALLENGES.length };
      return next;
    }
    case 'reset':
      return { ...initialState, seenIntro: true };
    case 'load':
      return action.state;
    default:
      return state;
  }
}

export const ProgressContext = createContext(null);
export const useProgress = () => useContext(ProgressContext);

export const totalStars = (state, lang = state.lang) => CHALLENGES.reduce((s, c) => s + starsOf(state, c.id, lang), 0);
