/**
 * Cuadro eléctrico de vivienda: configuración, dimensionado paso a paso (con fórmulas) y cuadro de cargas.
 * Todo el cálculo es explicable: cada resultado lleva la fórmula y los datos usados.
 */
import { ELECTRIFICATION_BASIC, ELECTRIFICATION_BASIC_MIN_W, DROP_LIMITS } from '../data/rebt';
import { dropSingle, nextBreaker, nextSection, admissible, sectionForDrop } from './cables';
import { fmt } from './library';

export interface PanelCircuit {
  id: string; name: string;
  p: number; // potencia prevista (W)
  length: number; // longitud (m)
  lighting: boolean;
  enabled: boolean;
  /** Si no es null, el alumno fuerza el valor en lugar del calculado. */
  forceIn?: number | null;
  forceSection?: number | null;
  cs: number; cu: number;
}

export interface PanelConfig {
  nombre: string;
  voltage: number; // V
  cosphi: number;
  circuits: PanelCircuit[];
  /** Longitud de la derivación individual (m) — informativa. */
  difA: number; // calibre del diferencial (A)
  difMa: number; // sensibilidad (mA)
  difType: 'AC' | 'A';
  spd: boolean; // limitador de sobretensiones
}

export const defaultPanel = (): PanelConfig => ({
  nombre: 'Cuadro general de mando y protección', voltage: 230, cosphi: 1,
  difA: 40, difMa: 30, difType: 'A', spd: true,
  circuits: ELECTRIFICATION_BASIC.map((c, i) => ({
    id: c.id, name: c.name, p: [1500, 2500, 3500, 2500, 1500][i], length: [18, 20, 8, 10, 12][i],
    lighting: c.id === 'C1', enabled: true, cs: c.cs, cu: c.cu,
  })),
});

export interface CircuitResult {
  id: string; name: string; enabled: boolean;
  ib: number; // A
  inA: number; section: number; iz: number;
  minSecDrop: number; dropV: number; dropPct: number; dropLimit: number;
  minSecItc: number; minInItc: number;
  ok: boolean; warnings: string[];
  steps: string[]; // fórmulas paso a paso
  p: number; length: number; psim: number;
}

export interface PanelResult {
  circuits: CircuitResult[];
  totalConnected: number; totalSim: number; iga: number; igaMinW: number;
  steps: string[];
}

export function computePanel(cfg: PanelConfig): PanelResult {
  const U = cfg.voltage;
  const res: CircuitResult[] = cfg.circuits.map((c) => {
    const type = ELECTRIFICATION_BASIC.find((t) => t.id === c.id);
    const ib = c.p / (U * cfg.cosphi);
    const minIn = type?.inA ?? 0;
    const inA = c.forceIn ?? Math.max(nextBreaker(ib), minIn);
    const limit = c.lighting ? DROP_LIMITS.alumbrado : DROP_LIMITS.resto;
    const eV = (limit / 100) * U;
    const sDrop = sectionForDrop(c.length, c.p, eV, U);
    const sMinItc = type?.section ?? 1.5;
    // La sección debe soportar In (Iz ≥ In), cumplir la caída y la mínima de la ITC
    let section = nextSection(Math.max(sDrop, sMinItc));
    while (admissible(section) < inA && section < 120) section = nextSection(section + 0.01);
    if (c.forceSection) section = c.forceSection;
    const iz = admissible(section);
    const dropV = dropSingle(c.length, ib, section, cfg.cosphi);
    const dropPct = (dropV / U) * 100;
    const warnings: string[] = [];
    if (inA < ib) warnings.push(`El calibre ${inA} A es menor que la intensidad de cálculo ${fmt(ib)} A: dispararía en servicio normal.`);
    if (iz < inA) warnings.push(`La sección ${fmt(section)} mm² admite ${fmt(iz)} A y el calibre es ${inA} A: el cable no queda protegido (debe cumplirse In ≤ Iz).`);
    if (dropPct > limit) warnings.push(`Caída de tensión ${fmt(dropPct)} % > ${limit} % admisible.`);
    if (section < sMinItc) warnings.push(`La sección mínima de ${c.id} en ITC-BT-25 es ${fmt(sMinItc)} mm².`);
    if (minIn && inA < minIn) warnings.push(`El calibre mínimo de ${c.id} en ITC-BT-25 es ${minIn} A.`);
    const psim = c.p * c.cs * c.cu;
    const steps = [
      `Ib = P / (U·cos φ) = ${fmt(c.p)} / (${fmt(U)}·${fmt(cfg.cosphi)}) = ${fmt(ib)} A`,
      `Calibre: Ib ≤ In ≤ Iz → In normalizado ≥ ${fmt(ib)} A (mínimo ITC-BT-25: ${minIn || '—'} A) → In = ${inA} A`,
      `Caída admisible e = ${limit} % de ${fmt(U)} V = ${fmt(eV)} V`,
      `Sección por caída: S = 2·L·P / (γ·e·U) = 2·${fmt(c.length)}·${fmt(c.p)} / (48·${fmt(eV)}·${fmt(U)}) = ${fmt(sDrop)} mm²`,
      `Sección mínima ITC-BT-25: ${fmt(sMinItc)} mm² · Iz(${fmt(section)} mm²) = ${fmt(iz)} A ≥ In = ${inA} A → S = ${fmt(section)} mm²`,
      `Caída real: e = 2·L·Ib·cos φ / (γ·S) = 2·${fmt(c.length)}·${fmt(ib)}·${fmt(cfg.cosphi)} / (48·${fmt(section)}) = ${fmt(dropV)} V (${fmt(dropPct)} %)`,
    ];
    return { id: c.id, name: c.name, enabled: c.enabled, ib, inA, section, iz, minSecDrop: sDrop, dropV, dropPct, dropLimit: limit, minSecItc: sMinItc, minInItc: minIn, ok: warnings.length === 0, warnings, steps, p: c.p, length: c.length, psim };
  });
  const on = res.filter((r) => r.enabled);
  const totalConnected = on.reduce((a, r) => a + r.p, 0);
  const totalSim = on.reduce((a, r) => a + r.psim, 0);
  const design = Math.max(totalSim, ELECTRIFICATION_BASIC_MIN_W);
  const iga = nextBreaker(design / (U * cfg.cosphi));
  return {
    circuits: res, totalConnected, totalSim, iga, igaMinW: ELECTRIFICATION_BASIC_MIN_W,
    steps: [
      `Potencia instalada = Σ P = ${fmt(totalConnected)} W`,
      `Potencia simultánea = Σ P·Cs·Cu = ${fmt(totalSim)} W`,
      `Previsión de cálculo = máx(${fmt(totalSim)} W ; mínimo electrificación básica ${fmt(ELECTRIFICATION_BASIC_MIN_W)} W) = ${fmt(design)} W`,
      `IGA: I = P/(U·cos φ) = ${fmt(design)}/(${fmt(U)}·${fmt(cfg.cosphi)}) = ${fmt(design / (U * cfg.cosphi))} A → calibre normalizado ${iga} A`,
    ],
  };
}
