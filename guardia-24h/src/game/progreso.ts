import type { Intento, Respuesta } from '../data/repo';
import type { Item } from '../data/schemas';
import { baraja } from './rng';
import { cobertura, nivelSuperado, notaFinal, peMaximo, raFinal, raJuego, redondea } from './grading';

export const MAX_INTENTOS = 3;
export const ITEMS_POR_INTENTO = 10;

/** Mejor resultado por ítem (la nota nunca baja). */
export function mejoresPorItem(rs: Respuesta[]): Map<string, Respuesta> {
  const m = new Map<string, Respuesta>();
  for (const r of rs) { const p = m.get(r.item_id); if (!p || r.pe_obtained > p.pe_obtained) m.set(r.item_id, r); }
  return m;
}

/** Selección de ítems de un intento: semilla propia, prioriza los no vistos en intentos anteriores. */
export function seleccionaItems(banco: Item[], vistos: Set<string>, semilla: string, n = ITEMS_POR_INTENTO): Item[] {
  const nuevos = baraja(banco.filter((i) => !vistos.has(i.id)), semilla);
  const resto = baraja(banco.filter((i) => vistos.has(i.id)), semilla + 'r');
  return [...nuevos, ...resto].slice(0, n);
}

export interface EstadoNivel { intentos: number; mejor: number; superado: boolean; bloqueadoPorIntentos: boolean }

export function estadoNivel(intentos: Intento[], d: number, n: number, desbloqueos = 0): EstadoNivel {
  const mios = intentos.filter((i) => i.distrito === d && i.nivel === n);
  const mejor = Math.max(0, ...mios.map((i) => (i.pe_max ? i.pe_obtained / i.pe_max : 0)));
  return {
    intentos: mios.length, mejor, superado: nivelSuperado(mejor, 1),
    bloqueadoPorIntentos: mios.length >= MAX_INTENTOS + desbloqueos,
  };
}

/** Un nivel está abierto si el anterior está superado (N1 siempre abierto). */
export const nivelAbierto = (intentos: Intento[], d: number, n: number): boolean =>
  n === 1 || estadoNivel(intentos, d, n - 1).superado;

export interface NotaRaDetalle { ra: string; juego: number | null; taller: number | null; final: number | null; cobertura: number; adquirido: boolean }

export function notasPorRa(
  respuestas: Respuesta[], todos: Item[], ras: string[], taller: Record<string, number | null>, a: number, pesos: Record<string, number>,
  cfg = { notaFinalMin: 5, notaRaMin: 5, coberturaMin: 0.8 },
) {
  const mejor = mejoresPorItem(respuestas);
  const detalle: NotaRaDetalle[] = ras.map((ra) => {
    const delRa = todos.filter((i) => i.ra.includes(ra));
    const hechos = delRa.filter((i) => mejor.has(i.id)).length;
    const cob = cobertura(hechos, delRa.length);
    // El denominador usa el PE máximo de TODOS los ítems del RA.
    const juego = raJuego(
      delRa.map((i) => ({ ra: i.ra, peObtenido: mejor.get(i.id)?.pe_obtained ?? 0, peMax: mejor.get(i.id)?.pe_max ?? peMaximo(i) })),
      ra,
    );
    const t = taller[ra] ?? null;
    const fin = juego === null ? null : raFinal(juego, t, a).nota;
    return { ra, juego, taller: t, final: fin, cobertura: cob, adquirido: fin !== null && fin >= cfg.notaRaMin && cob >= cfg.coberturaMin };
  });
  // RA sin ítems o sin hacer cuentan 0 y dejan el módulo pendiente.
  const evaluables = detalle.map((d) => ({ ra: d.ra, nota: d.final ?? 0, cobertura: d.cobertura }));
  const global = notaFinal(evaluables, pesos, cfg);
  return { detalle, global: { ...global, final: redondea(global.final) } };
}
