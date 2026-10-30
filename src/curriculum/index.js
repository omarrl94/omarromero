import m1 from './m1-fundamentals.js';
import m2 from './m2-control-flow.js';
import m3 from './m3-data-structures.js';
import m4 from './m4-oop.js';
import m5 from './m5-systems.js';
import boss from './boss.js';

export const MODULES = [
  { id: 1, name: 'Fundamentos', subtitle: 'Gravedad, tipos y overflow', icon: 'Atom', color: '#22e4ff', challenges: m1 },
  { id: 2, name: 'Control de Flujo', subtitle: 'Rutas de patrulla de los drones', icon: 'Route', color: '#a3ff3d', challenges: m2 },
  { id: 3, name: 'Estructuras de Datos', subtitle: 'Bodega, inventario y buffers', icon: 'Boxes', color: '#ffb534', challenges: m3 },
  { id: 4, name: 'POO', subtitle: 'Jerarquía de entidades', icon: 'Network', color: '#9d7bff', challenges: m4 },
  { id: 5, name: 'Sistemas', subtitle: 'Memoria manual y concurrencia', icon: 'Cpu', color: '#ff3df0', challenges: m5 },
  { id: 6, name: 'Boss Fight', subtitle: 'El Enjambre O(n²)', icon: 'Skull', color: '#ff4767', challenges: boss, boss: true },
];

export const CHALLENGES = MODULES.flatMap((m) => m.challenges);
export const byId = (id) => CHALLENGES.find((c) => c.id === id);

export const modeOf = (ch, lang) => (typeof ch.mode === 'function' ? ch.mode(lang) : ch.mode);
export const sceneOf = (ch, lang) => (typeof ch.scene === 'function' ? ch.scene(lang) : ch.scene);
export const objectiveOf = (ch, lang) => (typeof ch.objective === 'string' ? ch.objective : ch.objective[lang] || ch.objective.default);
