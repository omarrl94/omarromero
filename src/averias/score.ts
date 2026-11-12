/** Puntuación del parte: nota sobre 10 y estrellas (diagnóstico 4, eficiencia 2, coste 2, seguridad 2). */
import { faultOf } from './catalog';

export interface ScoreInput { faultId: string; point: string; attempts: { ok: boolean }[]; measures: number; minutes: number; repairs: { repair: string; target: string; cost: number }[]; unsafe: string[] }
export interface Score { diag: number; efic: number; coste: number; seg: number; total: number; stars: number; wrongCost: number; notes: string[] }
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

export function scoreOf(i: ScoreInput): Score {
  const f = faultOf(i.faultId);
  const req = f.required(i.point);
  const notes: string[] = [];
  const firstOk = i.attempts.findIndex((a) => a.ok);
  const diag = firstOk < 0 ? 0 : [4, 2.5, 1.5][firstOk] ?? 0.5;
  notes.push(firstOk === 0 ? 'Diagnóstico acertado a la primera.' : `Diagnóstico acertado al intento ${firstOk + 1}.`);
  const extraM = Math.max(0, i.measures - f.par.measures);
  const over = Math.max(0, i.minutes - f.par.minutes);
  let efic = clamp(2 - 0.25 * extraM - over / 45, 0, 2);
  if (i.measures === 0) { efic = Math.min(efic, 0.5); notes.push('No anotaste ninguna medida: diagnosticar sin medir es adivinar.'); }
  else if (extraM) notes.push(`${i.measures} medidas anotadas; con ${f.par.measures} bastaba.`);
  if (over) notes.push(`Tiempo: ${i.minutes} min frente a unos ${f.par.minutes} min de referencia.`);
  const wrong = i.repairs.filter((r) => !req.some((q) => q.repair === r.repair && q.target === r.target));
  const wrongCost = wrong.reduce((a, r) => a + r.cost, 0);
  const coste = clamp(2 - wrongCost / 60, 0, 2);
  if (wrong.length) notes.push(`Cambiaste piezas que no estaban averiadas (${wrongCost} €).`);
  const seg = clamp(2 - i.unsafe.length, 0, 2);
  for (const u of i.unsafe) notes.push(`Seguridad: ${u}`);
  const total = r1(diag + efic + coste + seg);
  return { diag, efic: r1(efic), coste: r1(coste), seg, total, stars: total >= 9 ? 3 : total >= 7 ? 2 : total >= 5 ? 1 : 0, wrongCost, notes };
}
