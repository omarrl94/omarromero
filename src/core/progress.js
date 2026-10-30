// Estado del jugador: Neural XP, rangos, rachas, estrellas, borradores y logros.
// Persistido en localStorage (con try/catch: funciona igual en modo privado).
import { createContext, useContext } from 'react';
import { CHALLENGES, MODULES } from '../curriculum/index.js';

const KEY = 'codeforge.living-engine.v1';

export const RANKS = [
  { name: 'Script Kiddie', xp: 0, color: '#8b93b8' },
  { name: 'Bit Wrangler', xp: 150, color: '#22e4ff' },
  { name: 'Loop Rider', xp: 400, color: '#a3ff3d' },
  { name: 'Data Smith', xp: 750, color: '#ffb534' },
  { name: 'Object Shaper', xp: 1150, color: '#9d7bff' },
  { name: 'Systems Hacker', xp: 1650, color: '#ff3df0' },
  { name: 'Kernel Sage', xp: 2300, color: '#ff6b4a' },
  { name: 'Architect Master', xp: 3100, color: '#ffe066' },
];

export const ACHIEVEMENTS = {
  'first-blood': { name: 'Primer Latido', desc: 'Completa tu primera misión.', icon: 'Zap' },
  'bug-hunter': { name: 'Cazador de Bugs', desc: 'Repara 5 errores de compilación o ejecución.', icon: 'Bug' },
  'polyglot': { name: 'Políglota', desc: 'Completa una misión en 3 lenguajes.', icon: 'Languages' },
  'polyglot-max': { name: 'Torre de Babel', desc: 'Completa una misión en los 5 lenguajes.', icon: 'Globe' },
  'clean-coder': { name: 'Código Limpio', desc: 'Consigue 3 estrellas en 5 misiones.', icon: 'Sparkles' },
  'autonomous': { name: 'Piloto Autónomo', desc: 'Completa una misión sin pistas profundas del pato.', icon: 'Bot' },
  'boss-slayer': { name: 'Rompe-Enjambres', desc: 'Derrota al Enjambre O(n²).', icon: 'Skull' },
  'streak-3': { name: 'En Racha', desc: 'Programa 3 días seguidos.', icon: 'Flame' },
  'memory-master': { name: 'Guardián del Heap', desc: 'Termina el módulo de sistemas en C sin fugas.', icon: 'MemoryStick' },
};

export const today = () => new Date().toISOString().slice(0, 10);
const yesterday = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);

export const initialState = {
  version: 1,
  xp: 0,
  lang: 'python',
  completed: {},
  drafts: {},
  hints: {},
  streak: { count: 0, last: null, best: 0 },
  stats: { runs: 0, bugsFixed: 0, deploys: 0 },
  settings: { sound: true, keys: false, autorun: true },
  achievements: [],
  seenIntro: false,
};

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState;
    const data = JSON.parse(raw);
    return { ...initialState, ...data, settings: { ...initialState.settings, ...data.settings }, stats: { ...initialState.stats, ...data.stats } };
  } catch {
    return initialState;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* almacenamiento no disponible: el progreso vive solo en esta sesión */
  }
}

export function rankOf(xp) {
  let idx = 0;
  RANKS.forEach((r, i) => { if (xp >= r.xp) idx = i; });
  const cur = RANKS[idx];
  const next = RANKS[idx + 1];
  return { ...cur, index: idx, next, progress: next ? (xp - cur.xp) / (next.xp - cur.xp) : 1 };
}

export const draftKey = (chId, lang) => `${chId}:${lang}`;

export const starsOf = (state, chId, lang) => (state.completed[chId] && state.completed[chId][lang] ? state.completed[chId][lang].stars : 0);
export const bestStars = (state, chId) => Math.max(0, ...Object.values(state.completed[chId] || {}).map((x) => x.stars));
export const isDone = (state, chId) => Object.keys(state.completed[chId] || {}).length > 0;

export function moduleUnlocked(state, moduleId) {
  if (moduleId === 1) return true;
  const prev = MODULES.find((m) => m.id === moduleId - 1);
  return prev.challenges.every((c) => isDone(state, c.id));
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
  const doneIds = Object.keys(state.completed).filter((id) => isDone(state, id));
  if (doneIds.length) add('first-blood');
  if (state.stats.bugsFixed >= 5) add('bug-hunter');
  const langCounts = doneIds.map((id) => Object.keys(state.completed[id]).length);
  if (langCounts.some((n) => n >= 3)) add('polyglot');
  if (langCounts.some((n) => n >= 5)) add('polyglot-max');
  if (doneIds.filter((id) => bestStars(state, id) === 3).length >= 5) add('clean-coder');
  if (Object.values(state.completed).some((byLang) => Object.values(byLang).some((x) => x.noHints))) add('autonomous');
  if (isDone(state, 'boss-swarm')) add('boss-slayer');
  if (state.streak.count >= 3) add('streak-3');
  if (state.completed['m5-systems'] && state.completed['m5-systems'].c) add('memory-master');
  const list = [...got];
  return { ...state, achievements: list };
}

/**
 * Reducer del progreso. La acción `complete` calcula estrellas y XP:
 *   ★ superar la misión · ★ sin pistas profundas del pato · ★ estilo impecable
 * XP: base × (60/80/100 %) la primera vez en un lenguaje; +50 % de bonus políglota
 * si ya la habías completado en otro; mejorar estrellas paga la diferencia.
 */
export function reducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return action.state;
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
      const otherLangs = Object.keys(state.completed[id] || {}).filter((l) => l !== lang);
      const pct = [0, 0.6, 0.8, 1][stars];
      let gain = 0;
      const breakdown = [];
      if (!prev) {
        gain = Math.round(ch.xp * pct);
        breakdown.push({ label: `Misión superada ${'★'.repeat(stars)}`, xp: gain });
        if (otherLangs.length) {
          const bonus = Math.round(ch.xp * 0.5);
          gain += bonus;
          breakdown.push({ label: 'Bonus políglota', xp: bonus });
        }
      } else if (stars > prev.stars) {
        gain = Math.round(ch.xp * (pct - [0, 0.6, 0.8, 1][prev.stars]));
        breakdown.push({ label: `Mejora a ${'★'.repeat(stars)}`, xp: gain });
      }
      const entryRec = { stars: Math.max(stars, prev ? prev.stars : 0), at: Date.now(), noHints: noHints || (prev && prev.noHints) };
      let next = {
        ...state,
        xp: state.xp + gain,
        completed: { ...state.completed, [id]: { ...(state.completed[id] || {}), [lang]: entryRec } },
        streak: bumpStreak(state.streak),
        stats: { ...state.stats, deploys: state.stats.deploys + 1 },
        lastReward: { id, lang, gain, stars, breakdown, firstTime: !prev, at: Date.now() },
      };
      next = withAchievements(next);
      return next;
    }
    case 'reset':
      return { ...initialState, seenIntro: true };
    default:
      return state;
  }
}

export const ProgressContext = createContext(null);
export const useProgress = () => useContext(ProgressContext);

export const totalStars = (state) => CHALLENGES.reduce((s, c) => s + bestStars(state, c.id), 0);
