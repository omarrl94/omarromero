/** Puntuación de la visita: decisión 3, hallazgos 2, juicio 2, cobertura 1,5, seguridad 1, tiempo 0,5 (total 10). */
import type { Visit } from './game';
import { defectOf } from './catalog';

export interface LogEntry { key: string; kind: string; target: string; pair?: string; desc: string; text: string; unit: string; valid: boolean; truthApto: boolean | null; studentApto: boolean; minute: number; notes: string[] }
export interface ScoreInput { visit: Visit; log: LogEntry[]; decision: 'firmar' | 'negarse'; minutes: number; danger: number }
export interface Score { decision: number; findings: number; judgment: number; coverage: number; safety: number; time: number; total: number; stars: number; found: string[]; missed: string[]; notes: string[] }
const r1 = (v: number) => Math.round(v * 10) / 10;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Un defecto está «encontrado» si hay una medida válida en su punto juzgada como NO APTA. */
export function defectFound(v: Visit, log: LogEntry[], d: Visit['defects'][number]): boolean {
  const def = defectOf(d.defect);
  return log.some((e) => e.valid && !e.studentApto && e.kind === def.test && e.target === d.target && (!def.pair || e.pair === def.pair));
}

export function scoreOf(i: ScoreInput): Score {
  const { visit, log } = i;
  const notes: string[] = [];
  const bad = visit.defects.length > 0;
  const rightDecision = bad ? i.decision === 'negarse' : i.decision === 'firmar';
  const found = visit.defects.filter((d) => defectFound(visit, log, d));
  const missed = visit.defects.filter((d) => !found.includes(d));
  // Decisión
  const decision = rightDecision ? 3 : 0;
  if (!rightDecision) notes.push(bad ? 'Firmaste una instalación con defectos: eso es un delito y un riesgo real para el cliente.' : 'Te negaste a firmar una instalación correcta: el cliente no está contento.');
  else notes.push(bad ? 'Te negaste a firmar y tenías razón.' : 'Firmaste una instalación que estaba bien.');
  // Hallazgos
  const findings = bad ? 2 * (found.length / visit.defects.length) : (rightDecision ? 2 : 0);
  if (missed.length) notes.push(`Se te escaparon ${missed.length} defecto(s) que sí estaban.`);
  // Juicio: medidas válidas bien juzgadas; juzgar una medida inválida cuenta en contra
  const valid = log.filter((e) => e.valid);
  const wrongJudg = valid.filter((e) => e.truthApto !== null && e.truthApto !== e.studentApto).length;
  const onInvalid = log.filter((e) => !e.valid).length;
  const judgment = log.length ? clamp(2 * (1 - (wrongJudg + onInvalid) / log.length), 0, 2) : 0;
  if (wrongJudg) notes.push(`${wrongJudg} medida(s) válida(s) mal juzgadas (apto o no apto al revés).`);
  if (onInvalid) notes.push(`${onInvalid} medida(s) hechas en condiciones incorrectas (receptores conectados, tensión de ensayo, picas…) y las usaste igualmente.`);
  // Cobertura
  const done = visit.required.filter((q) => valid.some((e) => e.key === q.key));
  const coverage = 1.5 * (done.length / visit.required.length);
  if (done.length < visit.required.length) notes.push(`Faltaron ${visit.required.length - done.length} verificación(es) reglamentaria(s) por hacer bien.`);
  // Seguridad
  const safety = clamp(1 - 0.5 * i.danger, 0, 1);
  if (i.danger) notes.push('Ensayaste con la instalación en tensión (instrumentos de aislamiento o continuidad).');
  // Tiempo
  const time = i.minutes <= visit.budgetMin ? 0.5 : 0;
  if (!time) notes.push('Te pasaste del tiempo: el cliente se fue impacientando.');
  let total = decision + findings + judgment + coverage + safety + time;
  if (!rightDecision && bad) total = Math.min(total, 3);
  if (!rightDecision && !bad) total = Math.min(total, 5);
  total = r1(total);
  return { decision, findings: r1(findings), judgment: r1(judgment), coverage: r1(coverage), safety, time, total, stars: total >= 9 ? 3 : total >= 7 ? 2 : total >= 5 ? 1 : 0, found: found.map((d) => d.defect), missed: missed.map((d) => d.defect), notes };
}
