import { lander, reactor } from './physics.js';
import { drones } from './drones.js';
import { cargo, inventory } from './data.js';
import { entities } from './entities.js';
import { heap, concurrency } from './systems.js';
import { boss } from './boss.js';

export const SCENES = { lander, reactor, drones, cargo, inventory, entities, heap, concurrency, boss };

export function createScene(name) {
  const factory = SCENES[name];
  return factory ? factory() : null;
}
