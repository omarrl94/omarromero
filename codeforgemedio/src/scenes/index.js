import { lander } from './physics.js';
import { drones } from './drones.js';
import { carga } from './data.js';
import { tests } from './tests.js';
import { screen } from './screen.js';

export const SCENES = { lander, drones, carga, tests, screen };

export function createScene(name) {
  const factory = SCENES[name];
  return factory ? factory() : null;
}
