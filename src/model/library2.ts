/**
 * Biblioteca ampliada (tanda 1): variantes de fuentes, resistencias, condensadores, bobinas, conexión, tomas,
 * maniobra, sensores como contactos, protecciones y receptores. Todas se resuelven con los modelos que ya existen
 * (R, V, ACV, SW, GANG, CROSS, SEL, BREAKER, FUSE) más una impedancia de CA opcional (`acz`).
 */
import type { Component } from './types';
import type { Def, ParamDef, Category } from './library';
import { fmt, fmtOhm } from './format';

type P = Component['params'];
const n = (k: string) => (p: P) => Number(p[k]);
const two = [{ x: -40, y: 0, name: '1' }, { x: 40, y: 0, name: '2' }];
const opt = (xs: number[], u: string) => xs.map((v) => ({ label: `${v} ${u}`, value: v }));

const volt = (type: string, name: string, v: number, rint: number, o: { sym: string; mark?: string; imax?: number; help?: string; vmax?: number; names?: [string, string] }): Def => ({
  type, name, category: 'Fuentes', w: 80, h: 40, sym: o.sym, mark: o.mark, help: o.help,
  terminals: [{ x: -40, y: 0, name: o.names?.[0] ?? '+' }, { x: 40, y: 0, name: o.names?.[1] ?? '−' }],
  params: [
    { key: 'v', label: 'Tensión', unit: 'V', default: v, step: 0.5, min: 0, max: o.vmax },
    { key: 'rint', label: 'Resist. interna', unit: 'Ω', default: rint, min: 0, step: 0.01 },
    { key: 'imax', label: 'Corriente máxima', unit: 'A', default: o.imax ?? 30, min: 0.1, step: 1 },
  ],
  model: { kind: 'V', value: n('v'), rint: n('rint') }, tag: (p) => `${fmt(+p.v)} V`,
});
const cell = (type: string, name: string, vcell: number, rcell: number, o: { sym?: string; mark?: string; help?: string; cells: number; imax: number }): Def => ({
  type, name, category: 'Fuentes', w: 80, h: 40, sym: o.sym ?? 'battery', mark: o.mark, help: o.help,
  terminals: [{ x: -40, y: 0, name: '+' }, { x: 40, y: 0, name: '−' }],
  params: [
    { key: 'cells', label: 'Elementos en serie', unit: '', default: o.cells, min: 1, step: 1 },
    { key: 'rint', label: 'Resist. interna total', unit: 'Ω', default: rcell * o.cells, min: 0, step: 0.01 },
    { key: 'imax', label: 'Corriente máxima', unit: 'A', default: o.imax, min: 0.1, step: 1 },
  ],
  model: { kind: 'V', value: (p) => vcell * Number(p.cells), rint: n('rint') }, tag: (p) => `${fmt(vcell * +p.cells)} V`,
});
const acv = (type: string, name: string, v: number, rint: number, mark: string, help?: string): Def => ({
  type, name, category: 'Fuentes', w: 80, h: 40, sym: 'acsource', mark, help,
  terminals: [{ x: -40, y: 0, name: 'L' }, { x: 40, y: 0, name: 'N' }],
  params: [
    { key: 'v', label: 'Tensión eficaz', unit: 'V', default: v, min: 0, step: 1 },
    { key: 'f', label: 'Frecuencia', unit: 'Hz', default: 50, min: 1, step: 1 },
    { key: 'rint', label: 'Impedancia interna', unit: 'Ω', default: rint, min: 0, step: 0.01 },
    { key: 'imax', label: 'Corriente máxima', unit: 'A', default: 100, min: 1, step: 5 },
  ],
  model: { kind: 'ACV', v: n('v'), f: n('f'), rint: n('rint') }, tag: (p) => `${fmt(+p.v)} V · ${fmt(+p.f)} Hz`,
});
const res = (type: string, name: string, sym: string, params: ParamDef[], value: (p: P) => number, tag: (p: P) => string, help?: string, mark?: string, cat: Category = 'Pasivos'): Def =>
  ({ type, name, category: cat, w: 80, h: 30, terminals: two, sym, mark, help, params, model: { kind: 'R', value }, tag });
const cap = (type: string, name: string, sym: string, c: number, o: { mark?: string; help?: string; n?: boolean } = {}): Def => ({
  type, name, category: 'Pasivos', w: 80, h: 40, terminals: sym === 'polcap' ? [{ x: -40, y: 0, name: '+' }, { x: 40, y: 0, name: '−' }] : two, sym, mark: o.mark, help: o.help ?? 'En CC permanente es un circuito abierto; en CA, Xc = 1/(2πfC).',
  params: o.n ? [{ key: 'c', label: 'Capacidad de cada elemento', unit: 'µF', default: c, min: 0 }, { key: 'n', label: 'Número de elementos (en paralelo)', unit: '', default: 4, min: 1, step: 1 }] : [{ key: 'c', label: 'Capacidad', unit: 'µF', default: c, min: 0 }],
  model: { kind: 'OPEN' }, acz: (p, w) => ({ re: 0, im: -1 / (w * Math.max(1e-12, Number(p.c) * (o.n ? Number(p.n) : 1) * 1e-6)) }),
  tag: (p) => `${fmt(+p.c * (o.n ? +p.n : 1))} µF`,
});
const ind = (type: string, name: string, sym: string, l: number, r: number, o: { mark?: string; help?: string; cat?: Category } = {}): Def => ({
  type, name, category: o.cat ?? 'Pasivos', w: 80, h: 30, terminals: two, sym, mark: o.mark, help: o.help ?? 'En CC solo queda la resistencia del hilo; en CA, XL = 2πfL.',
  params: [{ key: 'l', label: 'Inductancia', unit: 'mH', default: l, min: 0 }, { key: 'r', label: 'Resist. del hilo', unit: 'Ω', default: r, min: 0.001 }],
  model: { kind: 'R', value: n('r') }, acz: (p, w) => ({ re: Number(p.r), im: w * Number(p.l) * 1e-3 }), tag: (p) => `${fmt(+p.l)} mH`,
});
const link = (type: string, name: string, cat: Category, sym: string, o: { toggle?: string; mark?: string; help?: string; terms?: Def['terminals'] } = {}): Def => ({
  type, name, category: cat, w: 80, h: 40, terminals: o.terms ?? two, sym, mark: o.mark, help: o.help,
  params: o.toggle ? [{ key: 'closed', label: o.toggle, unit: '', default: true, bool: true }] : [],
  model: { kind: 'SW', closed: o.toggle ? (p) => Boolean(p.closed) : () => true },
  interactive: o.toggle ? { mode: 'toggle', key: 'closed' } : undefined,
});
const gang = (type: string, name: string, poles: number, o: { sym?: string; mark?: string; help?: string; hold?: boolean; closed?: (p: P, i: number) => boolean; key?: string; label?: string; def?: boolean } = {}): Def => {
  const key = o.key ?? 'closed';
  const terminals: Def['terminals'] = [];
  for (let i = 0; i < poles; i++) { const y = (i - (poles > 2 ? 1 : 0)) * 20; terminals.push({ x: -40, y, name: `${2 * i + 1}` }, { x: 40, y, name: `${2 * i + 2}` }); }
  return {
    type, name, category: 'Maniobra', w: 80, h: 20 + poles * 20, sym: o.sym ?? 'gang', mark: o.mark, help: o.help, terminals,
    params: [{ key, label: o.label ?? 'Cerrado', unit: '', default: o.def ?? true, bool: true }],
    model: { kind: 'GANG', n: poles, closed: o.closed ?? ((p) => Boolean(p[key])) },
    interactive: { mode: o.hold ? 'hold' : 'toggle', key },
  };
};
const contact = (type: string, name: string, mark: string, help: string): Def => ({
  type, name, category: 'Sensores', w: 80, h: 40, terminals: two, sym: 'sensor', mark, help,
  params: [{ key: 'act', label: 'Detecta / activado', unit: '', default: false, bool: true }, { key: 'nc', label: 'Contacto NC (si no, NA)', unit: '', default: false, bool: true }],
  model: { kind: 'SW', closed: (p) => Boolean(p.act) !== Boolean(p.nc) }, interactive: { mode: 'toggle', key: 'act' },
});
const lampLike = (type: string, name: string, vn: number, pn: number, sym: 'lamp' | 'heater' | 'buzzer' | 'motor', mark: string, cat: Category = 'Receptores', help?: string): Def => ({
  type, name, category: cat, w: 80, h: 40, terminals: two, sym, mark, help,
  params: [{ key: 'vn', label: 'Tensión nominal', unit: 'V', default: vn, min: 0.1 }, { key: 'pn', label: 'Potencia nominal', unit: 'W', default: pn, min: 0.01 }],
  model: { kind: 'R', value: (p) => Number(p.vn) ** 2 / Number(p.pn) }, tag: (p) => `${fmt(+p.vn)} V · ${fmt(+p.pn)} W`,
});
const coilLoad = (type: string, name: string, vn: number, pn: number, l: number, mark: string, help?: string): Def => ({
  type, name, category: 'Receptores', w: 80, h: 30, terminals: two, sym: 'solenoid', mark, help: help ?? 'Bobina con resistencia R = Vn²/Pn; en CA añade la reactancia de su inductancia.',
  params: [{ key: 'vn', label: 'Tensión nominal', unit: 'V', default: vn, min: 0.1 }, { key: 'pn', label: 'Potencia nominal', unit: 'W', default: pn, min: 0.01 }, { key: 'l', label: 'Inductancia', unit: 'mH', default: l, min: 0 }],
  model: { kind: 'R', value: (p) => Number(p.vn) ** 2 / Number(p.pn) }, acz: (p, w) => ({ re: Number(p.vn) ** 2 / Number(p.pn), im: w * Number(p.l) * 1e-3 }), tag: (p) => `${fmt(+p.vn)} V · ${fmt(+p.pn)} W`,
});
const motor1 = (type: string, name: string, vn: number, pn: number, cosfi: number, mark: string, help?: string): Def => ({
  type, name, category: 'Receptores', w: 80, h: 50, terminals: two, sym: 'motor', mark, help,
  params: [{ key: 'vn', label: 'Tensión nominal', unit: 'V', default: vn, min: 1 }, { key: 'pn', label: 'Potencia útil', unit: 'W', default: pn, min: 1 }, { key: 'eta', label: 'Rendimiento', unit: '', default: 0.75, min: 0.1, max: 1, step: 0.01 }, { key: 'cosfi', label: 'cos φ', unit: '', default: cosfi, min: 0.1, max: 1, step: 0.01 }],
  model: { kind: 'R', value: (p) => Number(p.vn) ** 2 / (Number(p.pn) / Number(p.eta)) },
  acz: (p, w) => { void w; const S = Number(p.pn) / Number(p.eta) / Number(p.cosfi); const Z = Number(p.vn) ** 2 / S; const ph = Math.acos(Number(p.cosfi)); return { re: Z * Math.cos(ph), im: Z * Math.sin(ph) }; },
  tag: (p) => `${fmt(+p.pn)} W · cos φ ${fmt(+p.cosfi)}`,
});
const motorDC = (type: string, name: string, r: number, mark: string, help: string): Def => ({
  type, name, category: 'Receptores', w: 80, h: 50, terminals: two, sym: 'motor', mark, help,
  params: [{ key: 'vn', label: 'Tensión nominal', unit: 'V', default: 12, min: 0.1 }, { key: 'r', label: 'Resist. equivalente', unit: 'Ω', default: r, min: 0.01 }],
  model: { kind: 'R', value: n('r') }, tag: (p) => `${fmt(+p.vn)} V`,
});
const brk = (type: string, name: string, cals: number[], def: number, mag: number, mark: string, help?: string): Def => ({
  type, name, category: 'Protecciones', w: 80, h: 40, terminals: two, sym: 'breaker', mark, help,
  params: [{ key: 'in', label: 'Calibre', unit: '', default: def, options: opt(cals, 'A') }],
  model: { kind: 'BREAKER', rating: n('in'), mag: () => mag }, tag: (p) => `${p.in} A`,
});
const fus = (type: string, name: string, cals: number[], def: number, mark: string, help?: string): Def => ({
  type, name, category: 'Protecciones', w: 80, h: 30, terminals: two, sym: 'fuse', mark, help,
  params: [{ key: 'in', label: 'Corriente nominal', unit: 'A', default: def, options: opt(cals, 'A') }],
  model: { kind: 'FUSE', rating: n('in'), factor: 1.6 }, tag: (p) => `${p.in} A`,
});

const relay = (type: string, name: string, o: { vn: number; pn: number; nNO: number; nNC: number; mark?: string; help?: string; vnOpts?: number[]; frac?: [number, number]; sense?: boolean; vset?: number; inv?: boolean; rcFixed?: number }): Def => {
  const nC = o.nNO + o.nNC;
  const terminals: Def['terminals'] = [{ x: -40, y: -20, name: 'A1' }, { x: -40, y: 20, name: 'A2' }];
  for (let j = 0; j < nC; j++) { const x = 20 + 20 * j; const no = j < o.nNO; terminals.push({ x, y: -40, name: no ? `${j + 1}3` : `${j - o.nNO + 1}1` }, { x, y: 40, name: no ? `${j + 1}4` : `${j - o.nNO + 1}2` }); }
  const [fp, fd] = o.frac ?? [0.75, 0.4];
  const params: ParamDef[] = o.sense
    ? [{ key: 'vset', label: 'Tensión de ajuste', unit: 'V', default: o.vset ?? 230, min: 1 }]
    : [o.vnOpts ? { key: 'vn', label: 'Tensión de la bobina', unit: 'V', default: o.vn, options: o.vnOpts.map((v) => ({ label: `${v} V`, value: v })) } : { key: 'vn', label: 'Tensión de la bobina', unit: 'V', default: o.vn, min: 1 },
       { key: 'pn', label: 'Potencia de la bobina', unit: 'W', default: o.pn, min: 0.01 }];
  return {
    type, name, category: 'Control', w: 60 + 20 * nC, h: 100, sym: 'relay', mark: o.mark, help: o.help, terminals, params,
    model: { kind: 'RELAY', nNO: o.nNO, nNC: o.nNC, inv: o.inv,
      rc: o.sense ? () => o.rcFixed ?? 1e5 : (p) => (o.rcFixed ?? Number(p.vn) ** 2 / Number(p.pn)),
      pickup: o.sense ? (p) => Number(p.vset) : (p) => fp * Number(p.vn),
      drop: o.sense ? (p) => Number(p.vset) * 0.95 : (p) => fd * Number(p.vn) },
    tag: (p) => (o.sense ? `${fmt(+p.vset)} V` : `${fmt(+p.vn)} V`),
  };
};

export const EXTRA: Def[] = [
  // ───── Fuentes de CC
  volt('dcsource', 'Fuente de tensión ideal', 12, 0, { sym: 'vsrc', help: 'Fuente de tensión ideal: resistencia interna nula por defecto.' }),
  volt('vreal', 'Fuente de tensión real', 12, 0.5, { sym: 'vsrc', help: 'Fuente con resistencia interna: la tensión cae al aumentar la corriente.' }),
  volt('vvar', 'Fuente de tensión regulable', 12, 0.05, { sym: 'vsrc', mark: 'REG', imax: 5, vmax: 60, help: 'Fuente de laboratorio: ajusta la tensión de salida.' }),
  volt('psu', 'Fuente de alimentación conmutada', 24, 0.1, { sym: 'vsrc', mark: 'SMPS', imax: 10 }),
  volt('dynamo', 'Dinamo / generador de CC', 24, 0.8, { sym: 'vsrc', mark: 'G', imax: 20 }),
  { type: 'pv', name: 'Panel fotovoltaico', category: 'Fuentes', w: 80, h: 40, sym: 'pv', terminals: [{ x: -40, y: 0, name: '+' }, { x: 40, y: 0, name: '−' }],
    params: [{ key: 'vmp', label: 'Tensión a 1000 W/m²', unit: 'V', default: 18, min: 1 }, { key: 'irr', label: 'Irradiancia', unit: 'W/m²', default: 1000, min: 0, max: 1200, step: 50 }, { key: 'rint', label: 'Resist. interna', unit: 'Ω', default: 1.5, min: 0, step: 0.1 }, { key: 'imax', label: 'Corriente máxima', unit: 'A', default: 8, min: 0.1 }],
    model: { kind: 'V', value: (p) => Number(p.vmp) * Math.min(1.2, Math.max(0, Number(p.irr) / 1000)), rint: n('rint') }, tag: (p) => `${fmt(+p.irr)} W/m²`,
    help: 'Modelo simplificado: tensión proporcional a la irradiancia y resistencia interna constante (no es la curva I-V real).' },
  cell('bat_pb', 'Batería de plomo-ácido', 2, 0.005, { cells: 6, imax: 300, mark: 'Pb', help: '2 V por elemento; 6 elementos = 12 V.' }),
  cell('bat_li', 'Batería de litio', 3.7, 0.02, { cells: 1, imax: 20, mark: 'Li', help: '3,7 V por elemento.' }),
  cell('bat_nimh', 'Batería Ni-MH', 1.2, 0.03, { cells: 4, imax: 10, mark: 'NiMH', help: '1,2 V por elemento.' }),

  // ───── Fuentes de CA
  acv('red', 'Red de distribución 230 V', 230, 0.3, 'RED', 'Red de baja tensión monofásica; la impedancia interna modela la caída en la línea.'),
  acv('alternador', 'Alternador', 230, 0.6, 'G~'),
  acv('grupo', 'Grupo electrógeno', 230, 0.9, 'GE'),
  acv('sai', 'SAI (en funcionamiento)', 230, 0.5, 'SAI', 'Se modela la salida del SAI como una fuente senoidal con su impedancia.'),

  // ───── Resistencias
  res('rpower', 'Resistencia de potencia', 'resistor', [{ key: 'r', label: 'Resistencia', unit: 'Ω', default: 10, min: 0, step: 1 }, { key: 'pmax', label: 'Potencia máx.', unit: 'W', default: 25, min: 0.1 }], n('r'), (p) => `${fmtOhm(+p.r)} · ${fmt(+p.pmax)} W`, undefined, 'W'),
  res('rheo', 'Reóstato', 'rheo', [{ key: 'rmax', label: 'Resistencia máxima', unit: 'Ω', default: 100, min: 1 }, { key: 'pos', label: 'Posición (0–1)', unit: '', default: 0.5, min: 0, max: 1, step: 0.05 }], (p) => Math.max(0.001, Number(p.rmax) * Number(p.pos)), (p) => `${fmtOhm(+p.rmax * +p.pos)}`, 'Resistencia variable de dos terminales: R = Rmáx·posición.'),
  res('trimmer', 'Trimmer (ajustable)', 'trim', [{ key: 'rmax', label: 'Resistencia máxima', unit: 'Ω', default: 10000, min: 1 }, { key: 'pos', label: 'Posición (0–1)', unit: '', default: 0.5, min: 0, max: 1, step: 0.05 }], (p) => Math.max(0.001, Number(p.rmax) * Number(p.pos)), (p) => `${fmtOhm(+p.rmax * +p.pos)}`),
  res('shunt', 'Shunt (derivación de medida)', 'shunt', [{ key: 'in', label: 'Corriente nominal', unit: 'A', default: 50, min: 0.1 }, { key: 'mv', label: 'Caída a In', unit: 'mV', default: 75, min: 1 }], (p) => Number(p.mv) / 1000 / Number(p.in), (p) => `${p.in} A / ${p.mv} mV`, 'R = mV/In. Se mide la tensión en sus bornes para conocer la corriente.'),
  res('galga', 'Galga extensiométrica', 'gauge', [{ key: 'r0', label: 'R sin deformar', unit: 'Ω', default: 120, min: 1 }, { key: 'gf', label: 'Factor de galga', unit: '', default: 2, min: 0.1, step: 0.1 }, { key: 'eps', label: 'Deformación', unit: 'µε', default: 0, min: -5000, max: 5000, step: 100 }], (p) => Number(p.r0) * (1 + Number(p.gf) * Number(p.eps) * 1e-6), (p) => `${fmt(+p.eps)} µε`, 'R = R0·(1 + GF·ε).', undefined, 'Sensores'),
  res('rnet', 'Red de resistencias', 'rnet', [{ key: 'r', label: 'Valor de cada resistencia', unit: 'Ω', default: 1000, min: 0 }, { key: 'n', label: 'Número', unit: '', default: 4, min: 1, step: 1 }, { key: 'par', label: 'Conexión', unit: '', default: 1, options: [{ label: 'En serie', value: 0 }, { label: 'En paralelo', value: 1 }] }], (p) => (Number(p.par) === 1 ? Number(p.r) / Number(p.n) : Number(p.r) * Number(p.n)), (p) => fmtOhm(Number(p.par) === 1 ? +p.r / +p.n : +p.r * +p.n), 'Resistencia equivalente de N iguales en serie o en paralelo.'),
  res('pt100', 'Sonda PT100', 'ptc', [{ key: 't', label: 'Temperatura', unit: '°C', default: 25, min: -50, max: 400 }], (p) => 100 * (1 + 0.00385 * Number(p.t)), (p) => `${fmt(+p.t)} °C`, 'R = 100·(1 + 0,00385·T) Ω.', 'PT100', 'Sensores'),

  // ───── Condensadores
  cap('c_film', 'Condensador cerámico / de película', 'capacitor', 0.1),
  cap('c_elec', 'Condensador electrolítico (polarizado)', 'polcap', 470, { help: 'Polarizado: el + debe ir al potencial más alto. En CC es un circuito abierto.' }),
  cap('c_tant', 'Condensador de tántalo', 'polcap', 10, { mark: 'Ta' }),
  cap('c_var', 'Condensador variable', 'capvar', 100),
  cap('c_super', 'Supercondensador', 'polcap', 1000000, { mark: 'SC' }),
  cap('c_arr', 'Condensador de arranque de motor', 'capacitor', 100, { mark: 'ARR' }),
  cap('c_reg', 'Condensador de régimen permanente', 'capacitor', 20, { mark: 'REG' }),
  cap('c_bat', 'Batería de condensadores', 'capbank', 25, { mark: 'BC', n: true, help: 'N condensadores en paralelo (sirve para compensar el factor de potencia).' }),

  // ───── Bobinas
  ind('l_air', 'Bobina con núcleo de aire', 'inductor', 10, 0.5),
  ind('l_iron', 'Bobina con núcleo de hierro / ferrita', 'indcore', 500, 2),
  ind('l_var', 'Bobina variable', 'indvar', 100, 1),
  ind('choke', 'Choque / reactancia de filtrado', 'indcore', 100, 0.5, { mark: 'CH' }),
  ind('ballast', 'Reactancia (balasto) de fluorescente', 'indcore', 1200, 25, { mark: 'BAL' }),
  ind('solenoid', 'Solenoide', 'solenoid', 50, 10, { cat: 'Receptores' }),
  coilLoad('electroiman', 'Electroimán', 24, 12, 200, 'EM'),
  { type: 'zgen', name: 'Impedancia genérica (R + jX)', category: 'Pasivos', w: 80, h: 30, terminals: two, sym: 'zbox',
    params: [{ key: 'r', label: 'Resistencia R', unit: 'Ω', default: 30, min: 0 }, { key: 'x', label: 'Reactancia X (+ inductiva, − capacitiva)', unit: 'Ω', default: 40, step: 1 }],
    model: { kind: 'R', value: (p) => Math.max(Number(p.r), 1e-9) }, acz: (p) => ({ re: Number(p.r), im: Number(p.x) }), tag: (p) => `${fmt(+p.r)} ${Number(p.x) < 0 ? '−' : '+'} j${fmt(Math.abs(+p.x))} Ω`,
    help: 'Z = R + jX fija. En CC solo cuenta R.' },

  // ───── Conexión y tomas
  link('borne', 'Borne', 'Conexión', 'borne', { help: 'Punto de conexión sin resistencia: continuidad entre sus dos lados.' }),
  link('regleta', 'Regleta de conexión', 'Conexión', 'borne', { mark: 'REG' }),
  link('jumper', 'Puente (jumper)', 'Conexión', 'jumper', { toggle: 'Puenteado', help: 'Puente que se puede quitar con un clic.' }),
  link('conector', 'Conector macho / hembra', 'Conexión', 'connector', { toggle: 'Conectado', help: 'Un clic lo conecta o lo desconecta.' }),
  { type: 'pica', name: 'Pica de puesta a tierra', category: 'Conexión', w: 40, h: 50, terminals: [{ x: 0, y: -20, name: 'PE' }], params: [{ key: 'rt', label: 'Resist. de tierra', unit: 'Ω', default: 20, min: 0 }], model: { kind: 'GND' }, sym: 'pica', tag: (p) => `${fmt(+p.rt)} Ω`, help: 'Referencia de 0 V (tierra). La resistencia de tierra es informativa.' },
  link('schuko', 'Base de enchufe schuko', 'Tomas', 'socket', { mark: 'F+N', help: 'Base: deja pasar la corriente entre sus dos terminales (conecta fase y neutro con la clavija).' }),
  link('clavija', 'Clavija', 'Tomas', 'plug', { mark: 'F+N' }),
  link('toma_sw', 'Toma de corriente con interruptor', 'Tomas', 'socket', { toggle: 'Conectada', mark: 'SW' }),
  { ...volt('usb', 'Base USB (5 V)', 5, 0.15, { sym: 'usb', imax: 2.4, names: ['+5V', 'GND'] }), category: 'Tomas' },

  // ───── Maniobra manual
  gang('sw2', 'Interruptor bipolar', 2, { help: 'Dos polos que se abren y cierran a la vez.' }),
  gang('sw3', 'Interruptor tripolar', 3),
  gang('sw4', 'Interruptor tetrapolar', 4),
  gang('push2', 'Pulsador doble (marcha/paro)', 2, { sym: 'push2', hold: true, key: 'pressed', label: 'Pulsado', def: false, closed: (p, i) => (i === 0 ? Boolean(p.pressed) : !p.pressed), help: 'Polo 1 NA (marcha) y polo 2 NC (paro): se mueven a la vez al pulsar.' }),
  { type: 'cruce', name: 'Conmutador de cruce', category: 'Maniobra', w: 80, h: 60, sym: 'cross', terminals: [{ x: -40, y: -20, name: '1' }, { x: 40, y: -20, name: '2' }, { x: -40, y: 20, name: '3' }, { x: 40, y: 20, name: '4' }],
    params: [{ key: 'pos', label: 'Posición (0 = recto, 1 = cruzado)', unit: '', default: 0, min: 0, max: 1, step: 1 }], model: { kind: 'CROSS', pos: n('pos') }, interactive: { mode: 'toggle', key: 'pos' }, help: 'Entre dos conmutadores, permite mandar una luz desde tres o más sitios.' },
  { type: 'estop', name: 'Seta de emergencia', category: 'Maniobra', w: 80, h: 40, sym: 'estop', terminals: two, params: [{ key: 'pressed', label: 'Pulsada (enclavada)', unit: '', default: false, bool: true }],
    model: { kind: 'SW', closed: (p) => !p.pressed }, interactive: { mode: 'toggle', key: 'pressed' }, help: 'Contacto NC que se abre y se queda enclavado al pulsarla; un clic la rearma.' },
  { type: 'sel3', name: 'Selector de 3 posiciones', category: 'Maniobra', w: 80, h: 60, sym: 'sel3', terminals: [{ x: -40, y: 0, name: 'C' }, { x: 40, y: -20, name: '1' }, { x: 40, y: 20, name: '2' }],
    params: [{ key: 'pos', label: 'Posición (0 = 1, 1 = 0, 2 = 2)', unit: '', default: 1, options: [{ label: 'I', value: 0 }, { label: '0 (centro)', value: 1 }, { label: 'II', value: 2 }] }], model: { kind: 'SEL', pos: n('pos') }, interactive: { mode: 'toggle', key: 'pos', cycle: 3 } },
  { ...link('sel2', 'Selector de 2 posiciones', 'Maniobra', 'switch', { toggle: 'Cerrado', mark: 'SEL' }) },
  link('sel_llave', 'Selector con llave', 'Maniobra', 'switch', { toggle: 'Cerrado', mark: 'KEY' }),
  link('seccionador', 'Seccionador', 'Maniobra', 'disc', { toggle: 'Cerrado', help: 'Corta el circuito sin carga; no tiene poder de corte.' }),
  link('int_sec', 'Interruptor-seccionador', 'Maniobra', 'disc', { toggle: 'Cerrado', mark: 'IS' }),
  link('tirador', 'Interruptor de tirador', 'Maniobra', 'switch', { toggle: 'Cerrado', mark: 'TIR' }),
  { ...res('x', 'x', 'x', [], () => 1, () => ''), type: 'pedal', name: 'Interruptor de pedal', category: 'Maniobra', sym: 'pushNO', mark: 'PED', w: 80, h: 40,
    params: [{ key: 'pressed', label: 'Pulsado', unit: '', default: false, bool: true }], model: { kind: 'SW', closed: (p) => Boolean(p.pressed) }, interactive: { mode: 'hold', key: 'pressed' } },

  // ───── Sensores con contacto
  contact('fincarrera', 'Final de carrera', 'FC', 'Contacto accionado por una leva: actívalo con un clic.'),
  contact('s_ind', 'Detector inductivo', 'IND', 'Detecta metales. Se representa su contacto de salida.'),
  contact('s_cap', 'Detector capacitivo', 'CAP', 'Detecta cualquier material. Se representa su contacto de salida.'),
  contact('s_foto', 'Detector fotoeléctrico', 'FOTO', 'Barrera, réflex o difuso: se representa su contacto de salida.'),
  contact('s_pir', 'Detector de presencia (PIR)', 'PIR', 'Contacto de salida de un detector de movimiento.'),
  contact('s_reed', 'Detector magnético (reed)', 'REED', 'Ampolla reed que cierra con un imán.'),
  contact('termostato', 'Termostato', 'θ', 'Contacto que actúa con la temperatura.'),
  contact('presostato', 'Presostato', 'P', 'Contacto que actúa con la presión.'),
  contact('boya', 'Interruptor de nivel (boya)', 'N', 'Contacto que actúa con el nivel de líquido.'),
  contact('fotocelula', 'Fotocélula', 'LUX', 'Contacto que actúa con la luz ambiente.'),
  contact('s_humo', 'Detector de humo', 'H', 'Contacto de alarma del detector.'),

  // ───── Protecciones
  fus('fuse_cil', 'Fusible cilíndrico', [0.5, 1, 2, 4, 6, 10, 16, 20, 25, 32], 10, '10×38'),
  fus('fuse_nh', 'Fusible de cuchilla NH', [16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250], 63, 'NH', 'Fusible de alta capacidad de ruptura para cuadros generales.'),
  fus('fuse_d', 'Fusible tipo D (Diazed)', [6, 10, 16, 20, 25, 35, 50, 63], 16, 'D'),
  fus('portafus', 'Portafusibles / seccionador fusible', [2, 4, 6, 10, 16, 20, 25, 32, 40, 50, 63], 16, 'PF'),
  brk('iga', 'Interruptor general automático (IGA)', [25, 32, 40, 50, 63], 40, 10, 'IGA', 'Protege toda la instalación de la vivienda.'),
  brk('icp', 'Interruptor de control de potencia (ICP)', [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 63], 25, 10, 'ICP', 'Limita la potencia contratada.'),
  brk('guardamotor', 'Guardamotor (disyuntor motor)', [1, 2.5, 4, 6.3, 10, 16, 25], 6.3, 12, 'GM', 'Protege el motor contra sobrecarga y cortocircuito.'),
  brk('caja_moldeada', 'Interruptor automático de caja moldeada', [100, 125, 160, 250, 400, 630], 160, 10, 'ACM'),
  brk('rele_termico', 'Relé térmico', [1, 2.5, 4, 6, 10, 16, 25], 6, 100, 'TH', 'Solo protege de sobrecarga: no tiene disparo magnético instantáneo.'),

  // ───── Receptores
  lampLike('halogena', 'Lámpara halógena', 12, 50, 'lamp', 'HAL'),
  lampLike('lampled', 'Lámpara LED', 230, 9, 'lamp', 'LED'),
  lampLike('tiraled', 'Tira LED con driver', 12, 24, 'lamp', 'TIRA'),
  lampLike('bajoconsumo', 'Lámpara de bajo consumo', 230, 15, 'lamp', 'CFL'),
  lampLike('fluorescente', 'Tubo fluorescente', 230, 36, 'lamp', 'FL'),
  lampLike('descarga', 'Lámpara de descarga', 230, 150, 'lamp', 'HID'),
  lampLike('emergencia', 'Luminaria de emergencia', 230, 6, 'lamp', 'EMG'),
  lampLike('piloto', 'Piloto de señalización', 230, 2, 'lamp', 'PIL'),
  lampLike('baliza', 'Baliza luminosa', 24, 10, 'lamp', 'BAL'),
  lampLike('radiador', 'Radiador / convector', 230, 1500, 'heater', 'RAD'),
  lampLike('termo', 'Termo eléctrico', 230, 1500, 'heater', 'TERMO'),
  lampLike('horno', 'Horno / placa', 230, 2000, 'heater', 'HORNO'),
  lampLike('timbre', 'Timbre', 12, 3, 'buzzer', 'TIM'),
  lampLike('sirena', 'Sirena', 12, 10, 'buzzer', 'SIR'),
  coilLoad('electrovalvula', 'Electroválvula', 24, 8, 80, 'EV'),
  coilLoad('electrofreno', 'Electrofreno', 24, 20, 150, 'EF'),
  lampLike('ventilador', 'Ventilador', 12, 6, 'motor', 'VENT'),
  { type: 'carga', name: 'Carga genérica R, RL, RC, RLC', category: 'Receptores', w: 80, h: 30, terminals: two, sym: 'load',
    params: [{ key: 'r', label: 'Resistencia', unit: 'Ω', default: 50, min: 0 }, { key: 'l', label: 'Inductancia (0 = sin bobina)', unit: 'mH', default: 100, min: 0 }, { key: 'c', label: 'Capacidad (0 = sin condensador)', unit: 'µF', default: 0, min: 0 }],
    model: { kind: 'R', value: (p) => (Number(p.c) > 0 ? 1e9 : Math.max(Number(p.r), 1e-9)) },
    acz: (p, w) => ({ re: Number(p.r), im: w * Number(p.l) * 1e-3 - (Number(p.c) > 0 ? 1 / (w * Number(p.c) * 1e-6) : 0) }),
    tag: (p) => `${fmt(+p.r)} Ω${+p.l > 0 ? ` · ${fmt(+p.l)} mH` : ''}${+p.c > 0 ? ` · ${fmt(+p.c)} µF` : ''}`, help: 'Elige R, RL, RC o RLC con los valores (deja a 0 lo que no quieras). En CC, un condensador la deja abierta.' },
  motor1('motor_mono', 'Motor monofásico de fase partida', 230, 370, 0.65, 'M1~', 'Carga de CA con su cos φ y rendimiento (modelo de impedancia fija).'),
  motor1('motor_cond', 'Motor monofásico con condensador', 230, 750, 0.85, 'M1~C'),
  motor1('motor_sombra', 'Motor de espira de sombra', 230, 40, 0.5, 'M1~S'),
  motor1('motor_univ', 'Motor universal', 230, 600, 0.9, 'MU'),
  motorDC('motor_pm', 'Motor de CC de imanes permanentes', 6, 'PM', 'Modelo simplificado: resistencia del inducido; la velocidad mostrada es proporcional a V/Vn.'),
  motorDC('motor_serie', 'Motor de CC serie', 4, 'SERIE', 'Excitación en serie con el inducido (modelo de resistencia equivalente).'),
  motorDC('motor_shunt', 'Motor de CC shunt', 8, 'SHUNT', 'Excitación en derivación (modelo de resistencia equivalente).'),
  motorDC('motor_exc', 'Motor de CC de excitación independiente', 6, 'EXC', 'Excitación independiente (modelo de resistencia equivalente).'),
  // ───── Control: relés y contactores (la bobina mueve sus contactos; recuerdan su estado, así funciona la autorretención)
  relay('rele', 'Relé electromagnético', { vn: 24, pn: 0.5, nNO: 1, nNC: 1, mark: 'K', vnOpts: [5, 12, 24, 48, 110, 230], help: 'Se activa al aplicar a la bobina (A1–A2) el 75 % de su tensión nominal y se suelta por debajo del 40 %. Contactos: NA (13-14) y NC (11-12).' }),
  relay('rele2', 'Relé de 2 contactos conmutados', { vn: 24, pn: 0.8, nNO: 2, nNC: 2, mark: 'K', vnOpts: [12, 24, 48, 110, 230] }),
  relay('ssr', 'Relé de estado sólido (SSR)', { vn: 5, pn: 0.05, nNO: 1, nNC: 0, mark: 'SSR', frac: [0.6, 0.4], help: 'Entrada de control de 3–32 V: conduce cuando recibe ≥ 3 V. Sin partes móviles.', rcFixed: 330 }),
  relay('contactor', 'Contactor', { vn: 230, pn: 8, nNO: 4, nNC: 1, mark: 'KM', vnOpts: [24, 48, 110, 230, 400], help: '3 contactos principales (13…) + 1 auxiliar NA + 1 auxiliar NC. Con la autorretención del contacto auxiliar mantiene la marcha al soltar el pulsador.' }),
  relay('rele_min', 'Relé de mínima tensión', { vn: 230, pn: 1, nNO: 1, nNC: 1, sense: true, vset: 200, inv: true, mark: 'U<', help: 'Mide la tensión entre A1 y A2: con menos del valor ajustado, el contacto NA cierra (alarma de falta de tensión).' }),
  relay('rele_max', 'Relé de máxima tensión', { vn: 230, pn: 1, nNO: 1, nNC: 1, sense: true, vset: 250, mark: 'U>', help: 'Mide la tensión entre A1 y A2: con más del valor ajustado, el contacto NA cierra (alarma de sobretensión).' }),
  { type: 'schottky', name: 'Diodo Schottky', category: 'Semiconductores', w: 80, h: 30, terminals: [{ x: -40, y: 0, name: 'A' }, { x: 40, y: 0, name: 'K' }], sym: 'diode', mark: 'SCH',
    params: [{ key: 'vf', label: 'Tensión umbral', unit: 'V', default: 0.3, min: 0, step: 0.05 }], model: { kind: 'DIODE', vf: n('vf'), rd: 0.03 }, tag: (p) => `Vf ${fmt(+p.vf)} V` },
];
