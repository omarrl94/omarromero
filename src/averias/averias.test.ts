import { describe, it, expect } from 'vitest';
import { FAULTS, faultOf, pointsOf, REPAIRS } from './catalog';
import { makeScenario } from './game';
import { applyRepair, buildProject, checkHealth, clampOptions, clampReading, currentOf, settle, voltageOf } from './model';
import { scoreOf } from './score';
import { simulate } from '../model/netlist';
import { readMeter, initialMeter, type Dial } from '../model/meter';
import type { Project } from '../model/types';
import { HOUSES } from '../game/houses';

const probe = (p: Project, rt: Record<string, 'blown' | 'tripped' | 'burnt'>, dial: Dial, a: [string, number], b: [string, number], igaOpen = false) => {
  const q = structuredClone(p);
  if (igaOpen) for (const id of ['IGA', 'IGAN']) q.components.find((c) => c.id === id)!.params.closed = false;
  const sim = simulate(q, igaOpen ? {} : rt);
  const r = readMeter(sim, { ...initialMeter, dial, red: { comp: a[0], term: a[1] }, black: { comp: b[0], term: b[1] } }, q);
  return `${r.text} ${r.unit}`.trim();
};

describe('Parte de avería: catálogo', () => {
  it('cada avería es jugable de principio a fin en todos los planos de serie', () => {
    for (const f of FAULTS) for (const h of HOUSES) for (let seed = 1; seed <= 4; seed++) {
      let sc;
      try { sc = makeScenario(seed, f.level, h.id, f.id); } catch { continue; }
      const tag = `${f.id} ${h.id} #${seed}`;
      expect(sc.faultId, tag).toBe(f.id);
      const proj = buildProject(sc.case);
      const rt = settle(proj);
      const before = checkHealth(sc.case);
      expect(before.ok, `${tag}: debe estar averiada`).toBe(false);
      // la reparación correcta la deja funcionando
      let c = sc.case;
      for (const r of f.required(sc.point)) {
        const def = REPAIRS.find((x) => x.id === r.repair)!;
        expect(def.targets(r.target), tag).toBe(true);
        expect(pointsOf(c.setup).some((p) => p.id === r.target), `${tag}: ${r.target}`).toBe(true);
        const param = def.param === 'calibre' ? 10 : def.param === 'seccion' ? 4 : undefined;
        c = applyRepair(c, r.repair, r.target, param);
      }
      const after = checkHealth(c);
      expect(after.problems, tag).toEqual([]);
      void rt;
    }
  });
  it('los niveles tienen averías', () => { for (const l of [1, 2, 3]) expect(FAULTS.some((f) => f.level === l)).toBe(true); });
  it('el escenario es reproducible con la semilla', () => {
    expect(makeScenario(5, 2).faultId).toBe(makeScenario(5, 2).faultId);
    expect(makeScenario(5, 2).symptom).toBe(makeScenario(5, 2).symptom);
  });
  it('una reparación equivocada no arregla la avería', () => {
    const sc = makeScenario(3, 2, 'piso3', 'derivacion');
    expect(checkHealth(applyRepair(sc.case, 'cambiar_pia', 'pia', 25)).ok).toBe(false);
    expect(checkHealth(applyRepair(sc.case, 'sustituir_toma', sc.point)).ok).toBe(false);
  });
});

describe('Parte de avería: cada avería se delata con la medida prevista', () => {
  it('cortocircuito: salta el PIA y con el IGA abierto la toma marca ~0 Ω', () => {
    const sc = makeScenario(1, 1, 'piso3', 'cortocircuito_toma'); const p = buildProject(sc.case); const rt = settle(p);
    expect(rt.PIA).toBe('tripped');
    expect(probe(p, rt, 'ohm', ['H0', 0], ['H0', 1], true)).toMatch(/mΩ$/);
  });
  it('sobrecarga: dispara el térmico; el amperímetro en cabecera supera el calibre', () => {
    const sc = makeScenario(1, 1, 'piso3', 'sobrecarga'); const p = buildProject(sc.case);
    expect(settle(p).PIA).toBe('tripped');
    const sim = simulate(p);
    expect(currentOf(sim, 'LL')).toBeGreaterThan(sc.case.setup.inA * 1.45);
    // si se desenchufan los extras, deja de saltar
    const q = structuredClone(p); sc.case.setup.recs.forEach((r, i) => { if (r.extra) q.components.find((c) => c.id === `P${i}`)!.params.closed = false; });
    expect(settle(q).PIA).toBeUndefined();
  });
  it('neutro suelto: 0 V entre fase y neutro y 230 V entre fase y tierra, sin disparos', () => {
    const sc = makeScenario(1, 2, 'piso3', 'neutro_suelto'); const p = buildProject(sc.case); const rt = settle(p);
    expect(Object.keys(rt)).toEqual([]);
    expect(probe(p, rt, 'Vac', ['H0', 0], ['H0', 1])).toMatch(/^0,0/);
    expect(parseFloat(probe(p, rt, 'Vac', ['H0', 0], ['PE0', 0]).replace(',', '.'))).toBeGreaterThan(220);
  });
  it('derivación: dispara el diferencial; sin enchufar el receptor no dispara; el aislamiento marca ~1,2 kΩ', () => {
    const sc = makeScenario(1, 2, 'piso3', 'derivacion'); const p = buildProject(sc.case); const rt = settle(p);
    expect(rt.DIF).toBe('tripped');
    const q = structuredClone(p); q.components.find((c) => c.id === 'P0')!.params.closed = false;
    expect(settle(q).DIF).toBeUndefined();
    expect(probe(p, rt, 'ohm', ['H0', 0], ['PE0', 0], true)).toMatch(/^1,2/);
  });
  it('conmutada: desde un conmutador no se puede apagar', () => {
    const sc = makeScenario(1, 2, 'piso3', 'conmutada'); const p = buildProject(sc.case);
    const on = (a: number, b: number) => { const q = structuredClone(p); q.components.find((c) => c.id === 'S1')!.params.pos = a; q.components.find((c) => c.id === 'S2')!.params.pos = b; return voltageOf(simulate(q), 'H0') > 200; };
    expect(on(0, 0) === on(1, 0) || on(0, 0) === on(0, 1)).toBe(true);
  });
  it('protección sobredimensionada: sin síntoma, pero el PIA supera lo que admite el cable', () => {
    const sc = makeScenario(1, 3, 'piso3', 'proteccion_sobredim'); const p = buildProject(sc.case);
    expect(Object.keys(settle(p))).toEqual([]);
    expect(sc.case.setup.inA).toBeGreaterThan(15.5);
    expect(checkHealth(sc.case).problems.join(' ')).toMatch(/no lo protege/);
  });
  it('caída de tensión: en el receptor hay bastante menos tensión que en el cuadro', () => {
    const sc = makeScenario(1, 3, 'piso3', 'caida_tension'); const p = buildProject(sc.case); const sim = simulate(p, settle(p));
    expect(voltageOf(sim, 'H0')).toBeLessThan(230 * 0.95);
    expect(checkHealth(sc.case).problems.join(' ')).toMatch(/Caída de tensión/);
  });
  it('conductor de protección: sin continuidad con la tierra y sin ningún síntoma', () => {
    const sc = makeScenario(1, 3, 'piso3', 'pe_interrumpido'); const p = buildProject(sc.case); const rt = settle(p);
    expect(Object.keys(rt)).toEqual([]);
    const i = sc.case.setup.recs.length - 1;
    expect(probe(p, rt, 'cont', [`PE${i}`, 0], ['PE0', 0], true)).not.toMatch(/^0,/);
    expect(probe(p, rt, 'cont', ['PE0', 0], ['PE0', 0], true)).toMatch(/^0,/);
  });
});

describe('Parte de avería: puntuación', () => {
  const base = { faultId: 'cortocircuito_toma', point: 'rec:0', attempts: [{ ok: true }], measures: 2, minutes: 40, repairs: [{ repair: 'sustituir_toma', target: 'rec:0', cost: 55 }], unsafe: [] as string[] };
  it('el parte perfecto saca 10 y 3 estrellas', () => { const s = scoreOf(base); expect(s.total).toBe(10); expect(s.stars).toBe(3); });
  it('fallar la hipótesis resta nota', () => { expect(scoreOf({ ...base, attempts: [{ ok: false }, { ok: true }] }).total).toBeLessThan(10); });
  it('cambiar piezas que no estaban averiadas penaliza el coste', () => {
    const s = scoreOf({ ...base, repairs: [...base.repairs, { repair: 'sustituir_receptor', target: 'rec:0', cost: 140 }] });
    expect(s.coste).toBe(0); expect(s.wrongCost).toBe(140);
  });
  it('la seguridad penaliza medir con tensión', () => { expect(scoreOf({ ...base, unsafe: ['x'] }).seg).toBe(1); });
  it('medir poco y rápido da más eficiencia que medir mucho', () => { expect(scoreOf({ ...base, measures: 8, minutes: 120 }).efic).toBeLessThan(scoreOf(base).efic); });
  it('las averías declaran su explicación y su medida delatora', () => { for (const f of FAULTS) { expect(faultOf(f.id).explain.length).toBeGreaterThan(20); expect(f.evidence.length).toBeGreaterThan(20); } });
});

describe('Pinza amperimétrica', () => {
  it('lee la intensidad de la línea aunque la protección ya haya disparado', () => {
    const sc = makeScenario(1, 1, 'piso3', 'sobrecarga'); const p = buildProject(sc.case);
    expect(settle(p).PIA).toBe('tripped');
    expect(clampReading(p, 'LL')).toBeGreaterThan(sc.case.setup.inA * 1.45);
  });
  it('fase y neutro juntos leen la fuga a tierra', () => {
    const sc = makeScenario(1, 2, 'piso3', 'derivacion'); const p = buildProject(sc.case);
    expect(clampReading(p, 'LEAK0')).toBeGreaterThan(0.1);
    expect(clampReading(p, 'LEAK0')).toBeLessThan(0.3);
    const ok = makeScenario(1, 2, 'piso3', 'neutro_suelto');
    expect(clampReading(buildProject(ok.case), 'LEAK')).toBe(0);
  });
  it('con el IGA abierto no circula nada', () => {
    const sc = makeScenario(1, 1, 'piso3', 'sobrecarga'); const p = structuredClone(buildProject(sc.case));
    for (const id of ['IGA', 'IGAN']) p.components.find((c) => c.id === id)!.params.closed = false;
    expect(clampReading(p, 'LL')).toBeLessThan(1e-6);
  });
  it('ofrece un punto por receptor', () => { const sc = makeScenario(2, 2, 'piso3', 'derivacion'); expect(clampOptions(sc.case).length).toBe(3 + sc.case.setup.recs.length * 2); });
});
