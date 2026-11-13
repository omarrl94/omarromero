/** Formato español: coma decimal y 3 cifras significativas. */
export function fmt(v: number, digits = 3): string {
  if (!isFinite(v)) return '—';
  if (v === 0) return '0';
  return Number(v.toPrecision(digits)).toString().replace('.', ',');
}
export function fmtOhm(r: number): string {
  if (r >= 1e6) return `${fmt(r / 1e6)} MΩ`;
  if (r >= 1e3) return `${fmt(r / 1e3)} kΩ`;
  return `${fmt(r)} Ω`;
}
export function fmtSI(v: number, unit: string): string {
  const a = Math.abs(v);
  if (a < 1e-9) return `0 ${unit}`;
  if (a >= 1e3) return `${fmt(v / 1e3)} k${unit}`;
  if (a >= 1) return `${fmt(v)} ${unit}`;
  if (a >= 1e-3) return `${fmt(v * 1e3)} m${unit}`;
  return `${fmt(v * 1e6)} µ${unit}`;
}
