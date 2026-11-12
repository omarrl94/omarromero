import { create } from 'zustand';
import type { PlanChoice } from '../game/clients';
import { makeVisit, type Visit } from './game';
import { initialPrep, measureContinuity, measureEarth, measureInsulation, measureRcd, type Prep, type Reading } from './instruments';
import { scoreOf, type LogEntry, type Score } from './score';
import type { Pair, TestKind } from './rules';

export type BStage = 'visita' | 'obra' | 'fin';
export interface BCareer { visitas: number; best: number; stars: number; sum: number }
export interface Pending { kind: TestKind; target: string; pair?: Pair; key: string; desc: string; reading: Reading; volts?: number }
interface Run { visit: Visit; stage: BStage; minutes: number; prep: Prep; log: LogEntry[]; pending: Pending | null; danger: number; decision: 'firmar' | 'negarse' | null; score: Score | null; student: string }
interface S extends Partial<Run> {
  level: number; plan: PlanChoice; career: BCareer;
  start(seed?: number, level?: number): void;
  setStage(s: BStage): void;
  setStudent(n: string): void;
  setLevel(l: number): void;
  togglePrep(k: keyof Prep): void;
  test(kind: TestKind, o: { target: string; pair?: Pair; volts?: number; distance?: number }): Reading | null;
  judge(apto: boolean): void;
  discard(): void;
  finish(decision: 'firmar' | 'negarse'): void;
  setCareer(c: BCareer): void;
}
export const COST = { aislamiento: 5, continuidad: 3, tierra: 12, diferencial: 6 } as const;
export const PREP_COST: Record<keyof Prep, number> = { igaOpen: 1, receptorsOff: 6, spdOff: 3, leadsNulled: 1, earthLinkOpen: 4 };

const KEY = 'circuitossea:boletin', CAREER = 'circuitossea:btcareer', LEVEL = 'circuitossea:btlevel';
const load = <T,>(k: string): T | null => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } };
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
const RUN_KEYS: (keyof Run)[] = ['visit', 'stage', 'minutes', 'prep', 'log', 'pending', 'danger', 'decision', 'score', 'student'];
const fresh = (visit: Visit): Run => ({ visit, stage: 'visita', minutes: 0, prep: initialPrep(), log: [], pending: null, danger: 0, decision: null, score: null, student: '' });

const saved = load<Run>(KEY);
export const useBoletin = create<S>((set, get) => ({
  ...(saved && saved.visit ? saved : {}),
  level: load<number>(LEVEL) ?? 1, plan: 'random',
  career: load<BCareer>(CAREER) ?? { visitas: 0, best: 0, stars: 0, sum: 0 },
  start(seed, level) {
    const lv = level ?? get().level;
    set({ ...fresh(makeVisit(seed ?? Math.floor(Math.random() * 90000) + 10, lv, get().plan)), level: lv });
  },
  setStage(stage) { set({ stage }); },
  setStudent(student) { set({ student }); },
  setLevel(level) { set({ level }); },
  togglePrep(k) {
    const s = get();
    set({ prep: { ...s.prep!, [k]: !s.prep![k] }, minutes: (s.minutes ?? 0) + PREP_COST[k], pending: null });
  },
  test(kind, o) {
    const s = get();
    if (!s.visit) return null;
    const t = s.visit.truth, p = s.prep!;
    let reading: Reading, key: string, desc: string;
    if (kind === 'aislamiento') { reading = measureInsulation(t, o.target, o.pair!, o.volts ?? 500, p); key = `iso:${o.target}:${o.pair}`; desc = `${o.target} · aislamiento ${o.pair === 'LPE' ? 'fase–tierra' : o.pair === 'NPE' ? 'neutro–tierra' : 'fase–neutro'} a ${o.volts} V`; }
    else if (kind === 'continuidad') { reading = measureContinuity(t, o.target, p); key = `cont:${o.target}`; desc = `${o.target} · continuidad del conductor de protección`; }
    else if (kind === 'tierra') { reading = measureEarth(t, o.distance ?? 10, p); key = 'tierra'; desc = `Resistencia de tierra (picas a ${o.distance ?? 10} m)`; }
    else { reading = measureRcd(t, o.target, p); key = `dif:${o.target}`; desc = `${o.target} · disparo del diferencial`; }
    set({
      pending: { kind, target: o.target, pair: o.pair, key, desc, reading, volts: o.volts },
      minutes: (s.minutes ?? 0) + (reading.danger ? 1 : COST[kind]),
      danger: (s.danger ?? 0) + (reading.danger ? 1 : 0),
    });
    return reading;
  },
  judge(apto) {
    const s = get(); const p = s.pending;
    if (!p || p.reading.danger) return;
    const e: LogEntry = { key: p.key, kind: p.kind, target: p.target, pair: p.pair, desc: p.desc, text: p.reading.text, unit: p.reading.unit, valid: p.reading.valid, truthApto: p.reading.apto, studentApto: apto, minute: s.minutes ?? 0, notes: p.reading.notes };
    set({ log: [...(s.log ?? []), e], pending: null });
  },
  discard() { set({ pending: null }); },
  finish(decision) {
    const s = get();
    const score = scoreOf({ visit: s.visit!, log: s.log ?? [], decision, minutes: s.minutes ?? 0, danger: s.danger ?? 0 });
    const c = s.career;
    const career = { visitas: c.visitas + 1, best: Math.max(c.best, score.total), stars: c.stars + score.stars, sum: c.sum + score.total };
    save(CAREER, career);
    set({ decision, score, stage: 'fin', career });
  },
  setCareer(career) { save(CAREER, career); set({ career }); },
}));
useBoletin.subscribe((s) => {
  if (!s.visit) return;
  const snap: Record<string, unknown> = {};
  for (const k of RUN_KEYS) snap[k] = (s as unknown as Record<string, unknown>)[k];
  save(KEY, snap); save(LEVEL, s.level);
});
