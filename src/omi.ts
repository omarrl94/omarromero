/**
 * Formato de archivo propio «.omi» (CircuitosSEA).
 * Es un JSON con cabecera: { format: 'omi', version, created, name, project, game? }.
 *  - project: el circuito (con su cuadro y el cajetín del plano).
 *  - game: la obra del juego «Instalador» en curso (cliente, nivel, plano e instalación), con los planos propios que use.
 * También se aceptan los .json antiguos (proyecto sin cabecera).
 * La «biblioteca» guarda archivos .omi en este navegador para abrirlos desde la propia página.
 */
import type { Project } from './model/types';
import type { GState } from './game/logic';
import { customHouses, houseOf, registerHouse, type House } from './game/houses';
import { makeClient } from './game/clients';
import { useGame, type Stage } from './game/store';

export const OMI_VERSION = 1;
export interface OmiGame { seed: number; level: number; plan: string; stage: Stage; state: GState; houses?: House[] }
export interface Omi { format: 'omi'; version: number; created: string; name: string; project: Project; game?: OmiGame }

export function gameSnapshot(): OmiGame {
  const g = useGame.getState();
  const h = houseOf(g.client.houseId);
  return { seed: g.seed, level: g.level, plan: g.plan, stage: g.stage === 'resultado' ? 'inspeccion' : g.stage, state: g.state, houses: h.custom ? [h] : undefined };
}
export function makeOmi(project: Project, withGame: boolean): Omi {
  return { format: 'omi', version: OMI_VERSION, created: new Date().toISOString(), name: project.name, project, game: withGame ? gameSnapshot() : undefined };
}
export const serializeOmi = (o: Omi) => JSON.stringify(o);

/** Lee un .omi (o un .json antiguo de proyecto). Lanza un Error con mensaje en español si no es válido. */
export function parseOmi(text: string): Omi {
  let j: unknown;
  try { j = JSON.parse(text); } catch { throw new Error('El archivo no es un .omi válido (no se puede leer).'); }
  const o = j as Partial<Omi> & Partial<Project>;
  if (o && o.format === 'omi') {
    if (!o.project || !Array.isArray(o.project.components) || !Array.isArray(o.project.wires)) throw new Error('El archivo .omi está incompleto: falta el circuito.');
    if ((o.version ?? 0) > OMI_VERSION) throw new Error('Este .omi es de una versión más nueva de CircuitosSEA.');
    return o as Omi;
  }
  if (o && Array.isArray(o.components) && Array.isArray(o.wires)) return { format: 'omi', version: OMI_VERSION, created: new Date().toISOString(), name: o.name ?? 'Sin título', project: o as Project };
  throw new Error('El archivo no es un proyecto de CircuitosSEA.');
}

/** Restaura la obra del juego guardada en un .omi. */
export function applyGame(g: OmiGame) {
  for (const h of g.houses ?? []) if (!customHouses().some((c) => c.id === h.id)) registerHouse(h);
  const plan = g.plan === 'random' || g.plan === 'all' || customHouses().some((c) => c.id === g.plan) || !g.plan.startsWith('custom-') ? g.plan : 'random';
  const client = makeClient(g.seed, g.level, plan);
  useGame.setState({ plan, seed: g.seed, level: g.level, client, state: g.state, stage: g.stage, tool: null, selected: null, linkFrom: null });
}

export function downloadOmi(o: Omi) {
  const blob = new Blob([serializeOmi(o)], { type: 'application/x-omi+json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${(o.name || 'circuito').replace(/[^\w-]+/g, '_')}.omi`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ───── Biblioteca en el navegador ───── */
const LIB = 'circuitossea:omi';
export interface LibItem { id: string; name: string; date: string; hasGame: boolean; text: string }
export function readLib(): LibItem[] { try { return JSON.parse(localStorage.getItem(LIB) ?? '[]'); } catch { return []; } }
function writeLib(l: LibItem[]): boolean { try { localStorage.setItem(LIB, JSON.stringify(l)); return true; } catch { return false; } }
/** Guarda (o sustituye si ya existe uno con ese nombre). Devuelve false si el navegador no tiene sitio. */
export function saveToLib(o: Omi): boolean {
  const l = readLib().filter((x) => x.name !== o.name);
  l.unshift({ id: Date.now().toString(36), name: o.name || 'Sin título', date: o.created, hasGame: !!o.game, text: serializeOmi(o) });
  return writeLib(l.slice(0, 40));
}
export function removeFromLib(id: string) { writeLib(readLib().filter((x) => x.id !== id)); }
