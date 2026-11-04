// Progreso del jugador: equipo elegido, misiones superadas por equipo, estrellas y XP.
// Se guarda en localStorage (y se sincroniza en la nube si hay cuenta de Firebase).
import { MODULES, missionsFor } from '../campaign/index.js';

const KEY = 'cyberops.progress.v1';

export const emptyProgress = () => ({ team: null, oath: false, teams: { red: {}, blue: {}, purple: {} }, streak: { last: null, days: 0 }, seenIntro: false });

export function loadProgress(uid = 'anon') {
  try {
    const raw = JSON.parse(localStorage.getItem(`${KEY}.${uid}`) || 'null');
    return raw ? { ...emptyProgress(), ...raw, teams: { ...emptyProgress().teams, ...(raw.teams || {}) } } : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(uid = 'anon', p) {
  try { localStorage.setItem(`${KEY}.${uid}`, JSON.stringify(p)); } catch { /* sin almacenamiento */ }
}

export const XP_BASE = 100;
export const XP_STAR = 50;

export function xpFor(mission, stars) {
  return Math.round((mission.xp || XP_BASE) + (stars - 1) * XP_STAR);
}

export function teamXp(p, team) {
  const done = p.teams[team] || {};
  return missionsFor(team).reduce((s, m) => s + (done[m.id] ? xpFor(m, done[m.id].stars) : 0), 0);
}

export function teamStars(p, team) {
  return Object.values(p.teams[team] || {}).reduce((s, r) => s + (r.stars || 0), 0);
}

export function completedCount(p, team) {
  const done = p.teams[team] || {};
  return missionsFor(team).filter((m) => done[m.id]).length;
}

/** Un módulo se desbloquea cuando el anterior está completo para ese equipo. */
export function moduleUnlocked(p, team, moduleIndex) {
  if (moduleIndex === 0) return true;
  const prev = MODULES[moduleIndex - 1];
  const done = p.teams[team] || {};
  return missionsFor(team, prev.id).every((m) => done[m.id]);
}

export function moduleDone(p, team, moduleId) {
  const done = p.teams[team] || {};
  return missionsFor(team, moduleId).every((m) => done[m.id]);
}

/** Puntos de una misión (0-100): los registros antiguos sin puntos se estiman por estrellas. */
export function missionScore(rec) {
  if (!rec) return 0;
  return rec.score ?? ({ 3: 100, 2: 85, 1: 70 }[rec.stars] || 0);
}

/** Calificación académica española a partir de la nota sobre 10. */
export function gradeLabel(nota, perfect = false) {
  if (perfect) return { label: 'Matrícula de honor', short: 'MH', color: '#ffd34d' };
  if (nota >= 9) return { label: 'Sobresaliente', short: 'SB', color: '#2bff88' };
  if (nota >= 7) return { label: 'Notable', short: 'NT', color: '#22e4ff' };
  if (nota >= 6) return { label: 'Bien', short: 'BI', color: '#9d7bff' };
  if (nota >= 5) return { label: 'Suficiente', short: 'SU', color: '#ffb534' };
  return { label: 'Insuficiente', short: 'IN', color: '#ff4767' };
}

export const GRADE_SCALE = [
  { from: 0, to: 4.99, label: 'Insuficiente' },
  { from: 5, to: 5.99, label: 'Suficiente' },
  { from: 6, to: 6.99, label: 'Bien' },
  { from: 7, to: 8.99, label: 'Notable' },
  { from: 9, to: 10, label: 'Sobresaliente' },
];

/** Traductor de puntos a nota de un tema para un equipo. */
export function moduleGrade(p, team, moduleId) {
  const list = missionsFor(team, moduleId);
  const done = p.teams[team] || {};
  const points = list.reduce((s, m) => s + missionScore(done[m.id]), 0);
  const max = list.length * 100;
  const nota = max ? Math.round((points / max) * 100) / 10 : 0;
  const perfect = points === max && max > 0;
  const next = GRADE_SCALE.find((g) => g.from > nota);
  return { points, max, nota, perfect, ...gradeLabel(nota, perfect), played: list.filter((m) => done[m.id]).length, total: list.length, nextLabel: next?.label, pointsToNext: next ? Math.max(0, Math.ceil((next.from / 10) * max - points)) : 0 };
}

/** Nota media del curso (los 10 temas) para un equipo. */
export function courseGrade(p, team) {
  const grades = MODULES.map((m) => moduleGrade(p, team, m.id));
  const avg = (list) => (list.length ? Math.round((list.reduce((a, g) => a + g.nota, 0) / list.length) * 100) / 100 : 0);
  const started = grades.filter((g) => g.played > 0);
  const media = avg(started); // media de los temas empezados
  const final = avg(grades); // nota final: los 10 temas
  return { media, started: started.length, final, finalGrade: gradeLabel(final), ...gradeLabel(media) };
}

export const formatNota = (n) => n.toFixed(n % 1 === 0 ? 0 : 1).replace('.', ',');

/** Registra una misión superada; conserva el mejor resultado. */
export function recordMission(p, team, missionId, stars, score = null) {
  const prev = p.teams[team]?.[missionId];
  const best = Math.max(prev?.stars || 0, stars);
  const bestScore = Math.max(prev ? missionScore(prev) : 0, score ?? missionScore({ stars }));
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const streak = p.streak.last === today ? p.streak : { last: today, days: p.streak.last === yesterday ? p.streak.days + 1 : 1 };
  return { ...p, streak, teams: { ...p.teams, [team]: { ...p.teams[team], [missionId]: { stars: best, score: bestScore, at: Date.now() } } } };
}

/** Estadísticas públicas para el ranking. */
export function publicStatsOf(p) {
  const team = p.team || 'blue';
  return {
    team,
    xp: teamXp(p, 'red') + teamXp(p, 'blue') + teamXp(p, 'purple'),
    stars: teamStars(p, 'red') + teamStars(p, 'blue') + teamStars(p, 'purple'),
    missions: completedCount(p, 'red') + completedCount(p, 'blue') + completedCount(p, 'purple'),
  };
}
