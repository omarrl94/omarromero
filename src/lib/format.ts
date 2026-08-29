/**
 * Formatea un numero de horas con separador de millares espanol.
 *
 * Se hace a mano en lugar de con `toLocaleString('es-ES')` porque algunos
 * entornos (navegadores empaquetados sin datos ICU completos) devuelven el
 * numero sin separador, y la ficha impresa quedaria inconsistente.
 */
export function formatearHoras(horas: number): string {
  if (!Number.isFinite(horas) || horas <= 0) return 'Consultar';
  return `${Math.round(horas).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} h`;
}
