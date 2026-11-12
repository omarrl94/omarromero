import { describe, it, expect } from 'vitest';
import { makeVisit } from './game';
import { measureContinuity, measureEarth, measureInsulation, measureRcd, initialPrep, type Prep } from './instruments';
import { scoreOf, type LogEntry } from './score';
import { DEFECTS, defectOf } from './catalog';
import { RULES, maxEarthOhm } from './rules';
import { HOUSES } from '../game/houses';

const ready: Prep = { igaOpen: true, receptorsOff: true, spdOff: true, leadsNulled: true, earthLinkOpen: true };
const visitWith = (id: string) => { for (let s = 1; s < 400; s++) for (const l of [1, 2, 3] as const) { const v = makeVisit(s, l); if (v.defects.some((d) => d.defect === id)) return v; } throw new Error('no se generó ' + id); };

describe('El boletín: visitas', () => {
  it('hay visitas en todos los niveles y planos, reproducibles', () => {
    for (const h of HOUSES) for (const l of [1, 2, 3]) { const v = makeVisit(5, l, h.id); expect(v.houseId).toBe(h.id); expect(v.required.length).toBeGreaterThan(4); }
    expect(makeVisit(7, 2).defects).toEqual(makeVisit(7, 2).defects);
  });
  it('el nivel 1 siempre lleva un defecto; el 3 puede venir limpio', () => {
    for (let s = 1; s < 40; s++) expect(makeVisit(s, 1).defects.length).toBe(1);
    expect([...Array(60).keys()].some((s) => makeVisit(s + 1, 3).defects.length === 0)).toBe(true);
  });
  it('cada defecto del catálogo aparece y se delata con su ensayo', () => {
    for (const d of DEFECTS) {
      const v = visitWith(d.id); const inst = v.defects.find((x) => x.defect === d.id)!;
      if (d.test === 'aislamiento') { const r = measureInsulation(v.truth, inst.target, d.pair!, 500, ready); expect(r.valid && r.apto, d.id).toBe(false); }
      if (d.test === 'continuidad') { const r = measureContinuity(v.truth, inst.target, ready); expect(r.apto, d.id).toBe(false); }
      if (d.test === 'tierra') { const r = measureEarth(v.truth, 30, ready); expect(r.apto, d.id).toBe(false); }
      if (d.test === 'diferencial') { const r = measureRcd(v.truth, inst.target, { ...ready, igaOpen: false }); expect(r.apto, d.id).toBe(false); }
    }
  });
  it('un valor sano es apto y los valores base cumplen el reglamento', () => {
    const v = makeVisit(3, 1); const clean = makeVisit(3, 1); void clean;
    for (const c of v.truth.circuits) { if (!v.defects.some((d) => d.target === c.id)) { expect(measureInsulation(v.truth, c.id, 'LPE', 500, ready).apto).toBe(true); expect(measureContinuity(v.truth, c.id, ready).apto).toBe(true); } }
  });
});

describe('El boletín: condiciones de ensayo', () => {
  const v = visitWith('iso_bajo'); const bad = v.defects[0].target; const good = v.truth.circuits.find((c) => c.id !== bad)!.id;
  it('medir aislamiento con tensión es peligroso y no da lectura', () => { const r = measureInsulation(v.truth, good, 'LPE', 500, { ...ready, igaOpen: false }); expect(r.danger).toBeTruthy(); expect(r.value).toBeNull(); });
  it('con los receptores conectados el aislamiento sale falsamente bajo (y no válido)', () => { const r = measureInsulation(v.truth, good, 'LPE', 500, { ...ready, receptorsOff: false }); expect(r.valid).toBe(false); expect(r.value!).toBeLessThan(RULES.iso.minMOhm); });
  it('a 250 V un defecto bajo «se esconde» pero la medida es inválida', () => { const r = measureInsulation(v.truth, bad, 'LPE', 250, ready); expect(r.valid).toBe(false); expect(r.apto).toBeNull(); });
  it('sin anular las puntas la continuidad suma 0,3 Ω', () => { const a = measureContinuity(v.truth, good, ready).value!, b = measureContinuity(v.truth, good, { ...ready, leadsNulled: false }).value!; expect(b - a).toBeCloseTo(RULES.pe.leadsOhm, 5); });
  it('picas auxiliares muy cerca o pica conectada falsean la tierra', () => {
    expect(measureEarth(v.truth, 8, ready).valid).toBe(false);
    expect(measureEarth(v.truth, 30, { ...ready, earthLinkOpen: false }).valid).toBe(false);
    expect(measureEarth(v.truth, 30, ready).valid).toBe(true);
  });
  it('el diferencial no se prueba sin tensión', () => { expect(measureRcd(v.truth, v.truth.rcds[0].id, { ...initialPrep(), igaOpen: true }).danger).toBeTruthy(); });
  it('el límite de tierra con 30 mA son 1666 Ω', () => { expect(Math.round(maxEarthOhm())).toBe(1667); });
});

describe('El boletín: puntuación', () => {
  const entry = (key: string, kind: string, target: string, valid: boolean, truth: boolean | null, student: boolean, pair?: string): LogEntry => ({ key, kind, target, pair, desc: key, text: '1', unit: '', valid, truthApto: truth, studentApto: student, minute: 10, notes: [] });
  it('firmar con un defecto limita la nota a 3', () => {
    const v = visitWith('iso_bajo');
    const s = scoreOf({ visit: v, log: [], decision: 'firmar', minutes: 30, danger: 0 });
    expect(s.total).toBeLessThanOrEqual(3);
  });
  it('encontrar el defecto y negarse con medidas buenas da nota alta', () => {
    const v = visitWith('iso_bajo'); const d = v.defects[0]; const log: LogEntry[] = [];
    for (const q of v.required) { const isBad = q.key === `iso:${d.target}:LPE`; log.push(entry(q.key, q.kind, q.target, true, !isBad, !isBad, q.pair)); }
    const s = scoreOf({ visit: v, log, decision: 'negarse', minutes: 60, danger: 0 });
    expect(s.found).toEqual(['iso_bajo']); expect(s.total).toBeGreaterThanOrEqual(9.5);
  });
  it('negarse con una instalación sana penaliza', () => {
    let v = makeVisit(1, 3); for (let s = 1; s < 80 && v.defects.length; s++) v = makeVisit(s, 3);
    expect(v.defects.length).toBe(0);
    expect(scoreOf({ visit: v, log: [], decision: 'negarse', minutes: 10, danger: 0 }).total).toBeLessThanOrEqual(5);
  });
  it('medidas inválidas usadas y ensayos con tensión restan', () => {
    const v = visitWith('iso_bajo');
    const a = scoreOf({ visit: v, log: [entry('iso:x:LPE', 'aislamiento', 'x', false, null, true)], decision: 'negarse', minutes: 10, danger: 2 });
    expect(a.safety).toBe(0); expect(a.judgment).toBe(0);
  });
  it('los defectos declaran causa y explicación', () => { for (const d of DEFECTS) { expect(defectOf(d.id).cause.length).toBeGreaterThan(10); expect(d.explain.length).toBeGreaterThan(20); } });
});
