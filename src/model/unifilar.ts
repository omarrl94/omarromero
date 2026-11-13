/**
 * Montaje en UNIFILAR: el alumno dibuja una sola línea (fase) y el simulador añade el conductor de retorno.
 *  - fuente (pila o red de CA): terminal 0 = línea, terminal 1 = retorno/neutro;
 *  - aparamenta en serie (interruptor, pulsador, fusible, magnetotérmico): entrada 0, salida 1;
 *  - receptor (lámpara, resistencia, motor…): entrada 0 y, si su terminal 1 queda libre, retorno automático a la fuente.
 * El modelo del circuito es siempre el mismo: los retornos automáticos son cables reales (marcados `auto`) que se ven
 * en el resto de vistas y se ocultan en el unifilar.
 */
import type { Project, Wire } from './types';
import { LIBRARY, defOf, symOf } from './library';

export const SOURCES = ['acsource', 'battery'];
export const SERIES = ['switch', 'pushNO', 'pushNC', 'fuse', 'breaker'];
export const LOADS = ['lamp', 'resistor', 'heater', 'buzzer', 'motor', 'led', 'ntc', 'ptc', 'ldr', 'capacitor', 'inductor'];
export const UNIFILAR_TYPES = new Set(LIBRARY.filter((d) => [...SOURCES, ...SERIES, ...LOADS].includes(d.sym ?? d.type)).map((d) => d.type));

const sourceOf = (p: Project) => p.components.find((c) => defOf(c.type).model.kind === 'ACV') ?? p.components.find((c) => symOf(c.type) === 'battery');

/** ¿Es un conductor de retorno? (automático o conectado al terminal de retorno de la fuente). No se dibuja en unifilar. */
export function isReturnWire(p: Project, w: Wire): boolean {
  if (w.auto) return true;
  const src = sourceOf(p);
  return !!src && [w.a, w.b].some((t) => t.comp === src.id && t.term === 1);
}

/**
 * Mantiene los retornos automáticos. Con `add` (solo en la vista unifilar) crea el retorno de cada receptor que tiene
 * entrada pero no salida; sin `add` solo elimina los que ya no proceden (por ejemplo, si el alumno cableó el retorno a mano).
 */
export function syncReturns(p: Project, add: boolean): Project {
  const manual = p.wires.filter((w) => !w.auto);
  const src = sourceOf(p);
  const used = new Map<string, Set<number>>();
  for (const w of manual) for (const t of [w.a, w.b]) { if (!used.has(t.comp)) used.set(t.comp, new Set()); used.get(t.comp)!.add(t.term); }
  const existing = new Map(p.wires.filter((w) => w.auto).map((w) => [w.id, w]));
  const auto: Wire[] = [];
  if (src) {
    for (const c of p.components) {
      if (!LOADS.includes(symOf(c.type))) continue;
      const t = used.get(c.id);
      if (!t?.has(0) || t.has(1)) continue;
      const id = `auto-${c.id}`;
      if (existing.has(id)) auto.push(existing.get(id)!);
      else if (add) auto.push({ id, a: { comp: c.id, term: 1 }, b: { comp: src.id, term: 1 }, auto: true });
    }
  }
  const same = auto.length === existing.size && auto.every((w) => existing.has(w.id));
  return same ? p : { ...p, wires: [...manual, ...auto] };
}
