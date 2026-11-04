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

/** Registra una misión superada; conserva el mejor resultado. */
export function recordMission(p, team, missionId, stars) {
  const prev = p.teams[team]?.[missionId];
  const best = Math.max(prev?.stars || 0, stars);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const streak = p.streak.last === today ? p.streak : { last: today, days: p.streak.last === yesterday ? p.streak.days + 1 : 1 };
  return { ...p, streak, teams: { ...p.teams, [team]: { ...p.teams[team], [missionId]: { stars: best, at: Date.now() } } } };
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
