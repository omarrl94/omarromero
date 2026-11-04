// Campaña completa: 10 módulos, cada uno con una misión común y una por equipo.
import a from './m01-m03.js';
import b from './m04-m05.js';
import c from './m06-m07.js';
import d from './m08-m10.js';

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
  { id: 'm10', num: 10, title: 'Operación Fénix', subtitle: 'Respuesta a incidentes y examen final', icon: 'Flame', level: 'Experto' },
];

export const MISSIONS = [...a, ...b, ...c, ...d];

export const missionById = (id) => MISSIONS.find((m) => m.id === id);

/** Misiones visibles para un equipo (opcionalmente, de un módulo). */
export function missionsFor(team, moduleId) {
  return MISSIONS.filter((m) => m.teams.includes(team) && (!moduleId || m.module === moduleId));
}

export const moduleById = (id) => MODULES.find((m) => m.id === id);
