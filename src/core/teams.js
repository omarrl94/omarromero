// Los tres equipos del juego. Cada uno vive el temario desde su perspectiva.

export const TEAMS = {
  red: {
    id: 'red',
    name: 'Equipo Rojo',
    short: 'Rojo',
    color: '#ff4767',
    soft: 'rgba(255,71,103,.12)',
    motto: 'Piensa como el adversario. Actúa con permiso.',
    role: 'Auditor ofensivo autorizado',
    desc: 'Aprendes a mirar los sistemas con los ojos de un atacante: dónde está la superficie expuesta, qué fallos existen, cuánto impacto tendrían y cómo se cuenta todo en un informe. Siempre dentro de un contrato y un alcance firmados.',
    learns: ['Metodología y reglas de enfrentamiento', 'Análisis de la superficie de ataque', 'Revisión de código y configuraciones', 'Priorización con CVSS', 'Informes de auditoría'],
    ranks: ['Recluta', 'Explorador', 'Analista de superficie', 'Auditor junior', 'Pentester', 'Red Teamer', 'Operador senior', 'Líder Red Team'],
  },
  blue: {
    id: 'blue',
    name: 'Equipo Azul',
    short: 'Azul',
    color: '#22a6ff',
    soft: 'rgba(34,166,255,.12)',
    motto: 'Proteger, detectar, responder.',
    role: 'Analista de defensa (SOC)',
    desc: 'Eres quien protege la organización: bastionas sistemas, lees registros para detectar intrusiones, contienes incidentes y recuperas el servicio. Aprendes cómo funcionan los ataques para poder pararlos.',
    learns: ['Bastionado de Linux', 'Análisis de logs y caza de amenazas', 'Gestión de vulnerabilidades y parches', 'Código seguro', 'Respuesta a incidentes'],
    ranks: ['Vigía', 'Analista SOC N1', 'Analista SOC N2', 'Cazador de amenazas', 'Respondedor de incidentes', 'Ingeniero de detección', 'Arquitecto de defensa', 'CISO'],
  },
  purple: {
    id: 'purple',
    name: 'Equipo Morado',
    short: 'Morado',
    color: '#b46bff',
    soft: 'rgba(180,107,255,.12)',
    motto: 'Cada ataque, una detección. Cada hallazgo, una mejora.',
    role: 'Enlace entre ataque y defensa',
    desc: 'Unes los dos mundos: por cada técnica que usaría un adversario, piensas cómo se detecta y cómo se corrige. Trabajas con MITRE ATT&CK para que Rojo y Azul hablen el mismo idioma y la defensa mejore de verdad.',
    learns: ['MITRE ATT&CK', 'Del hallazgo a la regla de detección', 'Ejercicios colaborativos', 'Métricas de cobertura', 'Mejora continua'],
    ranks: ['Enlace', 'Traductor táctico', 'Analista morado', 'Ingeniero de detección', 'Coordinador de ejercicios', 'Estratega morado', 'Arquitecto morado', 'Director de ciberseguridad'],
  },
};

export const TEAM_ORDER = ['red', 'blue', 'purple'];

/** Texto según la perspectiva: admite un string o { all, red, blue, purple }. */
export function persp(value, team) {
  if (value == null) return value;
  if (typeof value === 'string' || Array.isArray(value)) return value;
  return value[team] ?? value.all ?? value.blue ?? '';
}

export const RANK_XP = [0, 300, 800, 1500, 2400, 3500, 4800, 6400];

export function rankOf(team, xp) {
  let i = 0;
  while (i + 1 < RANK_XP.length && xp >= RANK_XP[i + 1]) i++;
  const next = RANK_XP[i + 1];
  return {
    index: i,
    name: TEAMS[team].ranks[i],
    next: next ?? null,
    nextName: next != null ? TEAMS[team].ranks[i + 1] : null,
    pct: next != null ? (xp - RANK_XP[i]) / (next - RANK_XP[i]) : 1,
  };
}
