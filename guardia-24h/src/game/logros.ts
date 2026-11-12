import type { Intento, Respuesta } from '../data';
import type { Item } from '../data/schemas';
import { estadoNivel } from './progreso';

export interface Contexto { respuestas: Respuesta[]; intentos: Intento[]; items: Item[]; teoriaLeida: number }
export interface Logro { id: string; nombre: string; descripcion: string; check: (c: Contexto) => boolean }

const completo = (c: Contexto, tipo: string) => c.respuestas.some((r) => r.pe_obtained >= r.pe_max && r.pe_max > 0 && r.hint_used === 0 && c.items.find((i) => i.id === r.item_id)?.tipo === tipo);

export const LOGROS: Logro[] = [
  { id: 'primera', nombre: 'Primera intervención', descripcion: 'Completa tu primer nivel.', check: (c) => c.intentos.length >= 1 },
  { id: 'cero-accidentes', nombre: 'Cero accidentes', descripcion: 'Supera 3 niveles sin ningún error de seguridad grave.', check: (c) => c.intentos.filter((i) => i.pe_max && i.pe_obtained / i.pe_max >= 0.5).length >= 3 && !c.respuestas.some((r) => r.seguridad) },
  { id: 'detective', nombre: 'Detective', descripcion: 'Encuentra todos los defectos de un cuadro sin falsos positivos ni pistas.', check: (c) => completo(c, 'hotspots') },
  { id: 'firma-limpia', nombre: 'Firma limpia', descripcion: 'Rellena un acta de verificación sin ningún error.', check: (c) => completo(c, 'acta') },
  { id: 'ia', nombre: 'La IA no me engaña', descripcion: 'Detecta todos los errores de un texto generado por IA.', check: (c) => completo(c, 'texto_errores') },
  { id: 'cableador', nombre: 'Cuadrista', descripcion: 'Cablea una maniobra que pase todas las pruebas sin pistas.', check: (c) => completo(c, 'automatismo') },
  { id: 'sin-pistas', nombre: 'Sin pistas', descripcion: 'Acierta 15 ítems sin usar ninguna pista.', check: (c) => c.respuestas.filter((r) => r.correct && r.hint_used === 0).length >= 15 },
  { id: 'biblioteca', nombre: 'Biblioteca viva', descripcion: 'Consulta la biblioteca 10 veces durante las prácticas.', check: (c) => c.intentos.reduce((s, i) => s + i.consult_count, 0) >= 10 },
  { id: 'teorico', nombre: 'Teórico', descripcion: 'Lee 10 secciones de teoría.', check: (c) => c.teoriaLeida >= 10 },
  { id: 'bloque', nombre: 'Bloque completado', descripcion: 'Supera los 5 niveles de un bloque.', check: (c) => [1, 2, 3, 4, 5, 6, 7, 8].some((d) => [1, 2, 3, 4, 5].every((n) => estadoNivel(c.intentos, d, n).superado)) },
];

export const BONUS_XP = 50;
export const nuevosLogros = (c: Contexto, ya: string[]) => LOGROS.filter((l) => !ya.includes(l.id) && l.check(c));

/** Efecto de un intento sobre dinero y reputación (no afecta a la nota). */
export function efectoIntento(pe: number, max: number, erroresSeguridad: number) {
  const ok = max > 0 && pe / max >= 0.5;
  return { dinero: ok ? Math.round(pe * 3) : 0, reputacion: (ok ? 2 : -1) - 4 * erroresSeguridad };
}
