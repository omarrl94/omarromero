import { create } from 'zustand';
import type { PlanChoice } from '../game/clients';
import { makeScenario, type Scenario } from './game';
import { faultOf, repairOf, type Case } from './catalog';
import { applyRepair, checkHealth, type Health } from './model';
import { scoreOf, type Score } from './score';

export type AStage = 'aviso' | 'diag' | 'hipotesis' | 'reparacion' | 'parte';
export interface Measure { dial: string; from: string; to: string; text: string; unit: string; minute: number }
export interface Attempt { cause: string; point: string; ok: boolean }
export interface Done { repair: string; target: string; param?: number; cost: number; minute: number }
export interface ACareer { partes: number; best: number; stars: number; sum: number }

interface Run { sc: Scenario; case: Case; stage: AStage; minutes: number; measures: Measure[]; attempts: Attempt[]; repairs: Done[]; unsafe: string[]; checks: number; failed: string[]; student: string; score: Score | null }
interface S extends Partial<Run> {
  level: number; plan: PlanChoice; career: ACareer; ready: boolean;
  start(seed?: number, level?: number, faultId?: string): void;
  setStage(s: AStage): void;
  setStudent(n: string): void;
  setLevel(l: number): void;
  setPlan(p: PlanChoice): void;
  addMinutes(n: number): void;
  record(m: Omit<Measure, 'minute'>, unsafe?: string): void;
  flagUnsafe(text: string): void;
  guess(cause: string, point: string): boolean;
  repair(repair: string, target: string, param?: number, energized?: boolean): void;
  check(): Health;
  setCareer(c: ACareer): void;
}

const KEY = 'circuitossea:averia', CAREER = 'circuitossea:avcareer', LEVEL = 'circuitossea:avlevel';
const load = <T,>(k: string): T | null => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } };
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
const RUN_KEYS: (keyof Run)[] = ['sc', 'case', 'stage', 'minutes', 'measures', 'attempts', 'repairs', 'unsafe', 'checks', 'failed', 'student', 'score'];
const fresh = (sc: Scenario): Run => ({ sc, case: structuredClone(sc.case), stage: 'aviso', minutes: 0, measures: [], attempts: [], repairs: [], unsafe: [], checks: 0, failed: [], student: '', score: null });

const saved = load<Run>(KEY);
export const useAveria = create<S>((set, get) => ({
  ...(saved && saved.sc ? saved : {}),
  level: load<number>(LEVEL) ?? 1, plan: 'random', ready: true,
  career: load<ACareer>(CAREER) ?? { partes: 0, best: 0, stars: 0, sum: 0 },
  start(seed, level, faultId) {
    const lv = level ?? get().level;
    const sc = makeScenario(seed ?? Math.floor(Math.random() * 90000) + 10, lv, get().plan, faultId);
    set({ ...fresh(sc), level: lv });
  },
  setStage(stage) { set({ stage }); },
  setStudent(student) { set({ student }); },
  setLevel(level) { save(LEVEL, level); set({ level }); },
  setPlan(plan) { set({ plan }); },
  addMinutes(n) { set((s) => ({ minutes: (s.minutes ?? 0) + n })); },
  record(m, unsafe) {
    set((s) => ({ measures: [...(s.measures ?? []), { ...m, minute: s.minutes ?? 0 }], minutes: (s.minutes ?? 0) + 3, unsafe: unsafe && !(s.unsafe ?? []).includes(unsafe) ? [...(s.unsafe ?? []), unsafe] : s.unsafe }));
  },
  flagUnsafe(text) { set((s) => ((s.unsafe ?? []).includes(text) ? s : { unsafe: [...(s.unsafe ?? []), text] })); },
  guess(cause, point) {
    const s = get();
    const ok = cause === s.sc!.faultId && point === s.sc!.point;
    set({ attempts: [...(s.attempts ?? []), { cause, point, ok }], minutes: (s.minutes ?? 0) + (ok ? 0 : 5), stage: ok ? 'reparacion' : s.stage });
    return ok;
  },
  repair(repair, target, param, energized) {
    const s = get();
    const def = repairOf(repair);
    const cost = def.cost(s.case!.setup, param);
    const unsafe = energized && !(s.unsafe ?? []).includes('Manipulaste conexiones con la instalación en tensión.') ? [...(s.unsafe ?? []), 'Manipulaste conexiones con la instalación en tensión.'] : s.unsafe;
    set({ case: applyRepair(s.case!, repair, target, param), repairs: [...(s.repairs ?? []), { repair, target, param, cost, minute: s.minutes ?? 0 }], minutes: (s.minutes ?? 0) + def.minutes, unsafe });
  },
  check() {
    const s = get();
    const h = checkHealth(s.case!);
    set({ checks: (s.checks ?? 0) + 1, failed: h.problems, minutes: (s.minutes ?? 0) + 5 });
    if (h.ok) {
      const g = get();
      const score = scoreOf({ faultId: g.sc!.faultId, point: g.sc!.point, attempts: g.attempts ?? [], measures: (g.measures ?? []).length, minutes: g.minutes ?? 0, repairs: g.repairs ?? [], unsafe: g.unsafe ?? [] });
      const c = g.career;
      const career = { partes: c.partes + 1, best: Math.max(c.best, score.total), stars: c.stars + score.stars, sum: c.sum + score.total };
      save(CAREER, career);
      set({ score, stage: 'parte', career });
    }
    return h;
  },
  setCareer(career) { save(CAREER, career); set({ career }); },
}));

useAveria.subscribe((s) => {
  if (!s.sc) return;
  const snap: Partial<Run> = {};
  for (const k of RUN_KEYS) (snap as Record<string, unknown>)[k] = (s as unknown as Record<string, unknown>)[k];
  save(KEY, snap);
  save(LEVEL, s.level);
});
export { faultOf };
