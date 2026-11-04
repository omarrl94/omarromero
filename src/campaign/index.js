// Campaña completa: 10 módulos, cada uno con una misión común y una por equipo.
import a from './m01-m03.js';
import b from './m04-m05.js';
import c from './m06-m07.js';
import d from './m08-m10.js';
import { TRAINING, examFor } from './generators.js';
import { mulberry32 } from './random.js';

export const MODULES = [
  { id: 'm1', num: 1, title: 'Inducción', subtitle: 'Ética, ley y tríada CIA', icon: 'GraduationCap', level: 'Iniciación' },
  { id: 'm2', num: 2, title: 'Linux y permisos', subtitle: 'Usuarios, permisos y mínimo privilegio', icon: 'Terminal', level: 'Iniciación' },
  { id: 'm3', num: 3, title: 'Reconocimiento pasivo', subtitle: 'OSINT, WHOIS, DNS y metadatos', icon: 'Search', level: 'Básico' },
  { id: 'm4', num: 4, title: 'Redes y servicios', subtitle: 'Puertos, TCP y escaneos en los logs', icon: 'Network', level: 'Básico' },
  { id: 'm5', num: 5, title: 'Vulnerabilidades', subtitle: 'CVE, CWE, CVSS y parches', icon: 'Bug', level: 'Intermedio' },
  { id: 'm6', num: 6, title: 'Seguridad web', subtitle: 'OWASP Top 10 y código seguro', icon: 'Globe', level: 'Intermedio' },
  { id: 'm7', num: 7, title: 'Criptografía', subtitle: 'Codificar, cifrar, hash y contraseñas', icon: 'KeyRound', level: 'Intermedio' },
  { id: 'm8', num: 8, title: 'Ingeniería social', subtitle: 'Phishing, cabeceras y concienciación', icon: 'Mail', level: 'Avanzado' },
  { id: 'm9', num: 9, title: 'Detección (SOC)', subtitle: 'Logs, caza de amenazas y ATT&CK', icon: 'Radar', level: 'Avanzado' },
  { id: 'm10', num: 10, title: 'Operación Otero', subtitle: 'Respuesta a incidentes y examen final', icon: 'Flame', level: 'Experto' },
];

const STATIC = [...a, ...b, ...c, ...d];
const ALL_TEAMS = ['red', 'blue', 'purple'];

/** Por tema: misiones de historia + Entrenamiento (retos aleatorios) + Examen del tema. */
export const MISSIONS = MODULES.flatMap((mod) => {
  const own = STATIC.filter((m) => m.module === mod.id);
  const common = own.find((m) => m.teams.length === 3) || own[0];
  return [
    ...own,
    {
      id: `${mod.id}-entreno`,
      module: mod.id,
      teams: ALL_TEAMS,
      kind: 'training',
      title: `Entrenamiento: ${mod.title}`,
      story: {
        red: `Sala de prácticas del Equipo Rojo. Cada partida genera un escenario nuevo sobre «${mod.subtitle}»: repite hasta que te salga sin pensar.`,
        blue: `Simulador del SOC. Cada partida genera datos nuevos sobre «${mod.subtitle}»: entrena hasta dominarlo.`,
        purple: `Campo de pruebas morado. Escenarios nuevos en cada partida sobre «${mod.subtitle}» para afinar ataque y defensa.`,
      },
      lesson: common.lesson,
      generate: TRAINING[mod.id],
      learned: [`Practicar ${mod.subtitle.toLowerCase()} con datos nuevos`, ...common.learned.slice(0, 2)],
      tip: 'Cada vez que repites el entrenamiento, los datos cambian: es la mejor forma de subir tu nota del tema.',
      xp: 120,
    },
    {
      id: `${mod.id}-examen`,
      module: mod.id,
      teams: ALL_TEAMS,
      kind: 'exam',
      title: `Examen del tema ${mod.num}`,
      story: `Examen del tema ${mod.num} (${mod.title}): 8 preguntas al azar sobre lo que has estudiado en este tema (la lección común y tus misiones) y un reto práctico. Cuenta para tu nota como cualquier otra misión.`,
      lesson: common.lesson,
      generate: examFor(mod.id, own),
      learned: [`Demostrar lo aprendido en ${mod.title}`],
      tip: 'Si sacas menos nota de la que querías, repite el examen: las preguntas cambian y se guarda tu mejor resultado.',
      xp: 150,
    },
  ];
});

/** Retos de una misión: fijos o generados con una semilla (los exámenes dependen del equipo). */
export function challengesOf(mission, seed = 1, team = null) {
  return mission.generate ? mission.generate(mulberry32(seed), team) : mission.challenges;
}

export const missionById = (id) => MISSIONS.find((m) => m.id === id);

/** Misiones visibles para un equipo (opcionalmente, de un módulo). */
export function missionsFor(team, moduleId) {
  return MISSIONS.filter((m) => m.teams.includes(team) && (!moduleId || m.module === moduleId));
}

export const moduleById = (id) => MODULES.find((m) => m.id === id);
