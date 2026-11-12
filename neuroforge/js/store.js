// Progreso del jugador, guardado en el navegador (localStorage). Sin cuentas ni servidores.
const KEY = 'neuroforge:v1';
export const RANKS = [
  [0, 'Becario/a de Datos', '🐣'], [150, 'Aprendiz Neuronal', '🧪'], [400, 'Prompt Engineer', '⌨️'],
  [800, 'Data Scientist', '📊'], [1300, 'Arquitecto/a de IA', '🏗️'], [2000, 'Maestro/a Neural', '🧠'],
];
const blank = () => ({ name: '', lessons: {}, stars: {}, xp: 0, ach: {}, sound: true, streak: 0, last: '', bossBest: 0 });
let S = blank();
try { S = { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { /* modo privado */ }
const subs = new Set();
export const state = () => S;
export const onChange = (f) => { subs.add(f); return () => subs.delete(f); };
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* sin almacenamiento */ }
  subs.forEach((f) => f(S));
}
export function reset() { S = blank(); save(); }
export function rank(xp = S.xp) {
  let i = 0;
  RANKS.forEach((r, k) => { if (xp >= r[0]) i = k; });
  const next = RANKS[i + 1];
  return { i, name: RANKS[i][1], icon: RANKS[i][2], from: RANKS[i][0], to: next ? next[0] : null };
}
export function addXP(n) { const before = rank().i; S.xp += n; save(); return rank().i > before ? rank() : null; }
export function touchStreak() {
  const today = new Date().toISOString().slice(0, 10);
  if (S.last === today) return;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  S.streak = S.last === y ? S.streak + 1 : 1; S.last = today; save();
}
export const lessonDone = (id) => !!S.lessons[id];
export const starsOf = (m, l) => S.stars[`${m}:${l}`] || 0;
export function setStars(m, l, s) {
  const k = `${m}:${l}`, old = S.stars[k] || 0;
  if (s > old) { S.stars[k] = s; save(); return (s - old) * 20 + (old ? 0 : 10); }
  return 0;
}
export const missionDone = (m, n) => Array.from({ length: n }, (_, i) => starsOf(m, i)).every((s) => s > 0);
export const totalStars = () => Object.values(S.stars).reduce((a, b) => a + b, 0);
