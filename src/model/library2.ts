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

const relay = (type: string, name: string, o: { vn: number; pn: number; nNO: number; nNC: number; mark?: string; help?: string; vnOpts?: number[]; frac?: [number, number]; sense?: boolean; vset?: number; inv?: boolean; rcFixed?: number; timer?: 'on' | 'off' | 'pulse' | 'sd' | 'toggle' | 'count'; tdef?: number; phase?: boolean; follow?: boolean }): Def => {
  const nC = o.nNO + o.nNC;
  const terminals: Def['terminals'] = o.follow ? [] : o.phase ? [{ x: -40, y: -20, name: 'L1' }, { x: -40, y: 0, name: 'L2' }, { x: -40, y: 20, name: 'L3' }] : [{ x: -40, y: -20, name: 'A1' }, { x: -40, y: 20, name: 'A2' }];
  for (let j = 0; j < nC; j++) { const x = 20 + 20 * j; const no = j < o.nNO; terminals.push({ x, y: -40, name: no ? `${j + 1}3` : `${j - o.nNO + 1}1` }, { x, y: 40, name: no ? `${j + 1}4` : `${j - o.nNO + 1}2` }); }
  const [fp, fd] = o.frac ?? [0.75, 0.4];
  const params: ParamDef[] = o.follow ? [{ key: 'kn', label: 'Sigue al contactor/relé nº (por orden de colocación)', unit: '', default: 1, min: 1, max: 12, step: 1 }] : o.sense
    ? [{ key: 'vset', label: 'Tensión de ajuste', unit: 'V', default: o.vset ?? 230, min: 1 }]
    : [o.vnOpts ? { key: 'vn', label: 'Tensión de la bobina', unit: 'V', default: o.vn, options: o.vnOpts.map((v) => ({ label: `${v} V`, value: v })) } : { key: 'vn', label: 'Tensión de la bobina', unit: 'V', default: o.vn, min: 1 },
       { key: 'pn', label: 'Potencia de la bobina', unit: 'W', default: o.pn, min: 0.01 }];
  if (o.timer && o.timer !== 'toggle') params.push({ key: 't', label: o.timer === 'sd' ? 'Tiempo en estrella' : o.timer === 'count' ? 'Nº de impulsos' : 'Tiempo', unit: o.timer === 'count' ? '' : 's', default: o.tdef ?? 5, min: o.timer === 'count' ? 1 : 0.1, step: o.timer === 'count' ? 1 : 0.5 });
  return {
    type, name, category: 'Control', w: 60 + 20 * nC, h: 100, sym: 'relay', mark: o.mark, help: o.help, terminals, params,
    model: { kind: 'RELAY', nNO: o.nNO, nNC: o.nNC, inv: o.inv, phase: o.phase, ...(o.follow ? { follow: n('kn') } : {}), ...(o.timer ? { timer: { mode: o.timer, t: o.timer === 'toggle' ? () => 0 : n('t') } } : {}),
      rc: o.sense ? () => o.rcFixed ?? 1e5 : (p) => (o.rcFixed ?? Number(p.vn) ** 2 / Number(p.pn)),
      pickup: o.sense ? (p) => Number(p.vset) : (p) => fp * Number(p.vn),
      drop: o.sense ? (p) => Number(p.vset) * 0.95 : (p) => fd * Number(p.vn) },
    tag: (p) => (o.follow ? `K${p.kn}` : o.sense ? `${fmt(+p.vset)} V` : `${fmt(+p.vn)} V`),
  };
};

const rcc = (p: P, vw: number, sw: number) => { const z = (Number(p.ucc) / 100) * (vw * vw) / sw; return { r: Math.max(0.3 * z, 1e-4), x: 0.954 * z }; };
const xf = (type: string, name: string, mode: '1ph' | 'tap' | 'auto' | '3ph', o: { vp: number; vs: number; s: number; ucc: number; mark?: string; help?: string; pri?: 'Y' | 'D'; sec?: 'Y' | 'D'; variac?: boolean; ti?: boolean }): Def => {
  const terminals: Def['terminals'] = [];
  if (mode === '3ph') {
    const names = ['L1', 'L2', 'L3', 'N'];
    for (let k = 0; k < (o.pri === 'Y' ? 4 : 3); k++) terminals.push({ x: -40, y: -20 + 20 * k, name: `${o.pri === 'Y' ? 'A' : 'U'}${names[k]}`.replace(/^[AU]/, (m) => m) });
    for (let k = 0; k < (o.sec === 'Y' ? 4 : 3); k++) terminals.push({ x: 40, y: -20 + 20 * k, name: `${names[k].toLowerCase()}` });
  } else if (mode === 'auto') terminals.push({ x: -40, y: -20, name: 'E' }, { x: 40, y: -20, name: 'S' }, { x: 0, y: 40, name: 'C' });
  else { terminals.push({ x: -40, y: -20, name: 'A1' }, { x: -40, y: 20, name: 'A2' }, { x: 40, y: -20, name: 'a1' }); if (mode === 'tap') terminals.push({ x: 40, y: 0, name: 'a0' }); terminals.push({ x: 40, y: 20, name: 'a2' }); if (mode === 'tap') terminals.splice(2, 3, { x: 40, y: -20, name: 'a1' }, { x: 40, y: 0, name: 'ct' }, { x: 40, y: 20, name: 'a2' }); }
  const params: ParamDef[] = o.ti
    ? [{ key: 'ip', label: 'Corriente primaria', unit: 'A', default: o.vp, min: 0.1 }, { key: 'is', label: 'Corriente secundaria', unit: 'A', default: o.vs, options: [{ label: '1 A', value: 1 }, { label: '5 A', value: 5 }] }]
    : [{ key: 'vp', label: mode === '3ph' ? 'Tensión primaria (línea)' : 'Tensión primaria', unit: 'V', default: o.vp, min: 1 },
       o.variac ? { key: 'pos', label: 'Posición (salida/entrada)', unit: '', default: 0.5, min: 0.02, max: 1.15, step: 0.01 } : { key: 'vs', label: mode === '3ph' ? 'Tensión secundaria (línea)' : 'Tensión secundaria', unit: 'V', default: o.vs, min: 0.1 },
       { key: 's', label: 'Potencia aparente', unit: 'VA', default: o.s, min: 1 }, { key: 'ucc', label: 'Tensión de cortocircuito', unit: '%', default: o.ucc, min: 0.1, max: 30, step: 0.5 }];
  const Y3 = (v: number, c: 'Y' | 'D' | undefined) => (c === 'Y' ? v / Math.sqrt(3) : v);
  const nOf = (p: P): number => {
    if (o.ti) return Number(p.is) / Number(p.ip);
    if (mode === '3ph') return Y3(Number(p.vp), o.pri) / Y3(Number(p.vs), o.sec);
    if (mode === 'tap') return Number(p.vp) / (Number(p.vs) / 2);
    if (o.variac) return 1 / Math.max(0.02, Number(p.pos));
    return Number(p.vp) / Number(p.vs);
  };
  const defName = o.ti ? `${o.vp}/${o.vs} A` : '';
  return {
    type, name, category: 'Transformadores', w: 80, h: mode === '3ph' ? 100 : 80, sym: 'xfmr', mark: o.mark, help: o.help, terminals, params,
    model: { kind: 'XFMR', mode, pri: o.pri, sec: o.sec, n: nOf,
      zcc: o.ti ? () => ({ r: 1e-4, x: 1e-4 }) : (p) => rcc(p, mode === '3ph' ? Y3(Number(p.vp), o.pri) : Number(p.vp), mode === '3ph' ? Number(p.s) / 3 : Number(p.s)),
      rdc: o.ti ? () => 0.01 : (p) => Math.max(0.3 * (Number(p.ucc) / 100) * Number(p.vp) ** 2 / Number(p.s), 1e-3) },
    tag: (p) => (o.ti ? `${fmt(+p.ip)}/${fmt(+p.is)} A` : o.variac ? `${fmt(+p.vp)} V · ${fmt(+p.pos)}` : `${fmt(+p.vp)}/${fmt(+p.vs)} V`) || defName,
  };
};
const src3 = (type: string, name: string, three: 'star' | 'delta', mark: string, help?: string): Def => ({
  type, name, category: 'Fuentes', w: 80, h: three === 'star' ? 100 : 80, sym: 'src3', mark, help,
  terminals: [{ x: 40, y: -20, name: 'L1' }, { x: 40, y: 0, name: 'L2' }, { x: 40, y: 20, name: 'L3' }, ...(three === 'star' ? [{ x: 40, y: 40, name: 'N' }] : [])],
  params: [{ key: 'v', label: 'Tensión de línea', unit: 'V', default: 400, min: 0, step: 1 }, { key: 'f', label: 'Frecuencia', unit: 'Hz', default: 50, min: 1 }, { key: 'rint', label: 'Impedancia interna por fase', unit: 'Ω', default: 0.1, min: 0, step: 0.01 }, { key: 'imax', label: 'Corriente máxima', unit: 'A', default: 200, min: 1 }],
  model: { kind: 'ACV', v: n('v'), f: n('f'), rint: n('rint'), three }, tag: (p) => `${fmt(+p.v)} V · ${fmt(+p.f)} Hz`,
});
const load3 = (type: string, name: string, delta: boolean, mark: string, o: { unbalanced?: boolean; help?: string } = {}): Def => ({
  type, name, category: 'Receptores', w: 80, h: delta ? 80 : 100, sym: 'load3', mark, help: o.help,
  terminals: [{ x: -40, y: -20, name: 'L1' }, { x: -40, y: 0, name: 'L2' }, { x: -40, y: 20, name: 'L3' }, ...(delta ? [] : [{ x: -40, y: 40, name: 'N' }])],
  params: o.unbalanced
    ? [{ key: 'r1', label: 'Resistencia fase 1', unit: 'Ω', default: 40, min: 0.01 }, { key: 'r2', label: 'Resistencia fase 2', unit: 'Ω', default: 60, min: 0.01 }, { key: 'r3', label: 'Resistencia fase 3', unit: 'Ω', default: 100, min: 0.01 }, { key: 'l', label: 'Inductancia de cada fase', unit: 'mH', default: 0, min: 0 }]
    : [{ key: 'r', label: 'Resistencia por fase', unit: 'Ω', default: 100, min: 0 }, { key: 'l', label: 'Inductancia por fase (0 = sin bobina)', unit: 'mH', default: 0, min: 0 }, { key: 'c', label: 'Capacidad por fase (0 = sin condensador)', unit: 'µF', default: 0, min: 0 }],
  model: { kind: 'LOAD3', delta: () => delta, rdc: () => 1e3,
    z: (p, w) => [0, 1, 2].map((k) => ({ re: Number(o.unbalanced ? p[`r${k + 1}`] : p.r), im: w * Number(p.l) * 1e-3 - (!o.unbalanced && Number(p.c) > 0 ? 1 / (w * Number(p.c) * 1e-6) : 0) })) },
  tag: (p) => (o.unbalanced ? `${fmt(+p.r1)}/${fmt(+p.r2)}/${fmt(+p.r3)} Ω` : `${fmt(+p.r)} Ω/fase`),
});
const motor3 = (type: string, name: string, pn: number, cosfi: number, mark: string, help?: string): Def => ({
  type, name, category: 'Receptores', w: 80, h: 80, sym: 'motor3', mark, help,
  terminals: [{ x: -40, y: -20, name: 'U1' }, { x: -40, y: 0, name: 'V1' }, { x: -40, y: 20, name: 'W1' }],
  params: [{ key: 'vn', label: 'Tensión de línea', unit: 'V', default: 400, min: 1 }, { key: 'pn', label: 'Potencia útil', unit: 'W', default: pn, min: 1 }, { key: 'eta', label: 'Rendimiento', unit: '', default: 0.85, min: 0.1, max: 1, step: 0.01 }, { key: 'cosfi', label: 'cos φ', unit: '', default: cosfi, min: 0.1, max: 1, step: 0.01 }, { key: 'conn', label: 'Conexión del motor', unit: '', default: 0, options: [{ label: 'Estrella', value: 0 }, { label: 'Triángulo', value: 1 }] }],
  model: { kind: 'LOAD3', delta: (p) => Number(p.conn) === 1, rdc: () => 1e3,
    z: (p) => { const S = Number(p.pn) / Number(p.eta) / Number(p.cosfi); const Zy = Number(p.vn) ** 2 / S; const Z = Number(p.conn) === 1 ? 3 * Zy : Zy; const ph = Math.acos(Number(p.cosfi)); return [0, 1, 2].map(() => ({ re: Z * Math.cos(ph), im: Z * Math.sin(ph) })); } },
  tag: (p) => `${fmt(+p.pn)} W · cos φ ${fmt(+p.cosfi)}`,
});

const rcd = (type: string, name: string, poles: 2 | 4, o: { ina: number; combined?: boolean; mark?: string; help?: string }): Def => {
  const terminals: Def['terminals'] = [];
  for (let i = 0; i < poles; i++) { const y = (i - (poles > 2 ? 1 : 0)) * 20; terminals.push({ x: -40, y, name: `${2 * i + 1}` }, { x: 40, y, name: `${2 * i + 2}` }); }
  const params: ParamDef[] = [
    { key: 'ina', label: 'Sensibilidad IΔn', unit: 'mA', default: o.ina, options: [10, 30, 100, 300, 500].map((v) => ({ label: `${v} mA`, value: v })) },
    { key: 'tipo', label: 'Tipo', unit: '', default: 1, options: [{ label: 'AC', value: 0 }, { label: 'A', value: 1 }, { label: 'F', value: 2 }, { label: 'B', value: 3 }] },
    { key: 'closed', label: 'Conectado', unit: '', default: true, bool: true },
  ];
  if (o.combined) params.splice(1, 0, { key: 'in', label: 'Calibre', unit: '', default: 16, options: [6, 10, 16, 20, 25, 32, 40, 63].map((v) => ({ label: `${v} A`, value: v })) });
  return {
    type, name, category: 'Protecciones', w: 80, h: 20 + poles * 20, sym: 'gang', mark: o.mark ?? 'RCD', help: o.help, terminals, params,
    model: { kind: 'RCD', poles, ina: n('ina'), closed: (p) => Boolean(p.closed), ...(o.combined ? { rating: n('in'), mag: () => 10 } : {}) },
    interactive: { mode: 'toggle', key: 'closed' },
    tag: (p) => `${fmt(+p.ina)} mA${o.combined ? ` · C${p.in}` : ''}`,
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

  { type: 'crepuscular', name: 'Interruptor crepuscular', category: 'Sensores', w: 80, h: 40, terminals: two, sym: 'sensor', mark: 'CREP',
    params: [{ key: 'lux', label: 'Iluminación ambiente', unit: 'lux', default: 5, min: 0 }, { key: 'umbral', label: 'Umbral de actuación', unit: 'lux', default: 20, min: 0 }, { key: 'act', label: 'Activado', unit: '', default: false, bool: true }, { key: 'nc', label: 'NC', unit: '', default: false, bool: true }],
    model: { kind: 'SW', closed: (p) => Number(p.lux) < Number(p.umbral) }, tag: (p) => `${fmt(+p.lux)} lux`, help: 'Cierra su contacto cuando la luz ambiente baja del umbral (alumbrado automático al anochecer).' },

  { type: 'horario', name: 'Interruptor horario', category: 'Control', w: 80, h: 40, terminals: two, sym: 'sensor', mark: 'HOR',
    params: [{ key: 'hora', label: 'Hora actual (simulada)', unit: 'h', default: 12, min: 0, max: 24, step: 0.25 }, { key: 'on', label: 'Conecta a las', unit: 'h', default: 18, min: 0, max: 24, step: 0.25 }, { key: 'off', label: 'Desconecta a las', unit: 'h', default: 23, min: 0, max: 24, step: 0.25 }, { key: 'act', label: '', unit: '', default: false, bool: true }, { key: 'nc', label: '', unit: '', default: false, bool: true }],
    model: { kind: 'SW', closed: (p) => { const h = Number(p.hora), a = Number(p.on), b = Number(p.off); return a <= b ? h >= a && h < b : h >= a || h < b; } }, tag: (p) => `${fmt(+p.hora)} h · ${fmt(+p.on)}–${fmt(+p.off)}`,
    help: 'Contacto programado por horas. Cambia la hora simulada para ver cómo actúa el programa diario.' },
  { type: 'astro', name: 'Programador astronómico', category: 'Control', w: 80, h: 40, terminals: two, sym: 'sensor', mark: 'ASTRO',
    params: [{ key: 'hora', label: 'Hora actual (simulada)', unit: 'h', default: 21, min: 0, max: 24, step: 0.25 }, { key: 'dia', label: 'Día del año', unit: '', default: 172, min: 1, max: 365, step: 1 }, { key: 'lat', label: 'Latitud', unit: '°', default: 40, min: -65, max: 65, step: 1 }, { key: 'act', label: '', unit: '', default: false, bool: true }, { key: 'nc', label: '', unit: '', default: false, bool: true }],
    model: { kind: 'SW', closed: (p) => { const d = 23.45 * Math.sin(((2 * Math.PI) / 365) * (284 + Number(p.dia))) * (Math.PI / 180), la = Number(p.lat) * (Math.PI / 180); const x = -Math.tan(la) * Math.tan(d); const ha = x >= 1 ? 0 : x <= -1 ? Math.PI : Math.acos(x); const sr = 12 - (ha * 12) / Math.PI, ss = 12 + (ha * 12) / Math.PI; const h = Number(p.hora); return h < sr || h >= ss; } }, tag: (p) => `${fmt(+p.hora)} h`,
    help: 'Cierra el contacto desde el ocaso hasta el orto según el día del año y la latitud (alumbrado público).' },

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

  rcd('rcd2', 'Interruptor diferencial 2P', 2, { ina: 30, help: 'Dispara si la corriente que sale por la fase no vuelve por el neutro (fuga a tierra) y supera su sensibilidad. Crea una fuga con una resistencia desde la fase a tierra.' }),
  rcd('rcd4', 'Interruptor diferencial 4P', 4, { ina: 300 }),
  rcd('rcdmt', 'Magnetotérmico-diferencial 1P+N', 2, { ina: 30, combined: true, mark: 'MT+RCD' }),
  rcd('rcdmt4', 'Magnetotérmico-diferencial 3P+N', 4, { ina: 300, combined: true, mark: 'MT+RCD' }),

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
  relay('tmr_on', 'Temporizador a la conexión', { vn: 24, pn: 1, nNO: 1, nNC: 1, mark: 'T-ON', timer: 'on', vnOpts: [24, 48, 110, 230], help: 'Al aplicar tensión a A1–A2, sus contactos conmutan pasado el tiempo ajustado; al quitarla, vuelven al instante. El tiempo corre en tiempo real mientras haya tensión.' }),
  relay('tmr_off', 'Temporizador a la desconexión', { vn: 24, pn: 1, nNO: 1, nNC: 1, mark: 'T-OFF', timer: 'off', vnOpts: [24, 48, 110, 230], help: 'Conmuta al aplicar tensión y mantiene los contactos accionados durante el tiempo ajustado después de quitarla.' }),
  relay('tmr_sd', 'Temporizador estrella-triángulo', { vn: 24, pn: 1, nNO: 2, nNC: 0, mark: 'Y-Δ', timer: 'sd', tdef: 6, vnOpts: [24, 48, 110, 230], help: 'Contacto 1 (estrella) cierra al instante y abre a los t s; contacto 2 (triángulo) cierra 0,1 s después (pausa de seguridad).' }),
  relay('escalera', 'Automático de escalera', { vn: 230, pn: 2, nNO: 1, nNC: 0, mark: 'AE', timer: 'pulse', tdef: 30, vnOpts: [24, 230], help: 'Un pulso en A1–A2 cierra el contacto durante el tiempo ajustado (reinicia con otro pulso).' }),
  relay('telerruptor', 'Telerruptor', { vn: 230, pn: 4, nNO: 2, nNC: 0, mark: 'TL', timer: 'toggle', vnOpts: [24, 48, 110, 230], help: 'Cada pulso en la bobina cambia el estado de sus contactos (alumbrado desde varios pulsadores). Recuerda su posición.' }),
  relay('rele_bi', 'Relé biestable (enclavamiento)', { vn: 24, pn: 1, nNO: 1, nNC: 1, mark: 'BIEST', timer: 'toggle', vnOpts: [12, 24, 48, 110, 230], help: 'Cada impulso en la bobina conmuta los contactos y se quedan así sin alimentación.' }),
  relay('contador', 'Contador de impulsos', { vn: 24, pn: 0.5, nNO: 1, nNC: 1, mark: 'CONT', timer: 'count', tdef: 3, vnOpts: [24, 230], help: 'Cuenta los impulsos de la bobina; al llegar al número ajustado cambia el contacto y el siguiente impulso lo reinicia.' }),
  relay('rele_fases', 'Relé de control de fases', { vn: 400, pn: 1, nNO: 1, nNC: 1, phase: true, mark: 'CF', frac: [0.8, 0.7], rcFixed: 1e5, help: 'Vigila las tres fases L1-L2-L3: el contacto NA cierra si hay las tres con tensión y asimetría menor del 20 %; si falta una fase o hay desequilibrio, se abre.' }),
  relay('aux_block', 'Bloque de contactos auxiliares', { vn: 0, pn: 0, nNO: 2, nNC: 2, follow: true, mark: 'AUX', help: 'Contactos que se mueven con un contactor o relé (indica su número por orden de colocación: nº 1 = el primero que pusiste).' }),
  { type: 'enclav', name: 'Enclavamiento mecánico', category: 'Control', w: 80, h: 40, terminals: [], sym: 'enclav', mark: 'ENCL',
    params: [{ key: 'a', label: 'Contactor nº (prioritario)', unit: '', default: 1, min: 1, max: 12, step: 1 }, { key: 'b', label: 'Contactor nº (bloqueado si el primero está cerrado)', unit: '', default: 2, min: 1, max: 12, step: 1 }],
    model: { kind: 'INTERLOCK', a: n('a'), b: n('b') }, tag: (p) => `K${p.a} ⇄ K${p.b}`, help: 'Impide que dos contactores cierren a la vez (inversión de giro, estrella-triángulo). Si ambas bobinas se excitan, solo cierra el primero.' },
  relay('rele_min', 'Relé de mínima tensión', { vn: 230, pn: 1, nNO: 1, nNC: 1, sense: true, vset: 200, inv: true, mark: 'U<', help: 'Mide la tensión entre A1 y A2: con menos del valor ajustado, el contacto NA cierra (alarma de falta de tensión).' }),
  relay('rele_max', 'Relé de máxima tensión', { vn: 230, pn: 1, nNO: 1, nNC: 1, sense: true, vset: 250, mark: 'U>', help: 'Mide la tensión entre A1 y A2: con más del valor ajustado, el contacto NA cierra (alarma de sobretensión).' }),
  // ───── Transformadores y trifásica
  xf('tr1', 'Transformador monofásico', '1ph', { vp: 230, vs: 24, s: 100, ucc: 5, mark: 'TR' }),
  xf('tr_tap', 'Transformador con toma intermedia', 'tap', { vp: 230, vs: 24, s: 100, ucc: 5, mark: 'TAP', help: 'Secundario con toma central: la tensión total se reparte a mitades.' }),
  xf('tr_aut', 'Autotransformador fijo', 'auto', { vp: 230, vs: 110, s: 500, ucc: 1.5, mark: 'AUT', help: 'Un solo devanado con toma: no hay aislamiento galvánico.' }),
  xf('variac', 'Autotransformador variable (variac)', 'auto', { vp: 230, vs: 0, s: 1000, ucc: 1.5, mark: 'VAR', variac: true, help: 'Salida = entrada × posición.' }),
  xf('tr_aisl', 'Transformador de aislamiento / separación', '1ph', { vp: 230, vs: 230, s: 500, ucc: 3, mark: 'AIS' }),
  xf('tr_seg', 'Transformador de seguridad (MBTS)', '1ph', { vp: 230, vs: 24, s: 100, ucc: 8, mark: 'MBTS', help: 'Muy baja tensión de seguridad: 24 V aislados.' }),
  xf('tr_mando', 'Transformador de mando', '1ph', { vp: 400, vs: 24, s: 63, ucc: 6, mark: 'MANDO' }),
  xf('tr_tor', 'Transformador toroidal', '1ph', { vp: 230, vs: 12, s: 100, ucc: 4, mark: 'TOR' }),
  xf('ti', 'Transformador de intensidad (TI)', '1ph', { vp: 100, vs: 5, s: 1, ucc: 1, ti: true, mark: 'TI', help: 'Reduce la corriente de medida (p. ej. 100/5 A). No dejes el secundario abierto: en un TI ideal bloquearía la corriente del primario.' }),
  xf('tt', 'Transformador de tensión (TT)', '1ph', { vp: 400, vs: 100, s: 25, ucc: 1, mark: 'TT' }),
  xf('tr3_yy', 'Transformador trifásico Yy', '3ph', { vp: 400, vs: 400, s: 10000, ucc: 4, pri: 'Y', sec: 'Y', mark: 'Yy' }),
  xf('tr3_dy', 'Transformador trifásico Dy', '3ph', { vp: 400, vs: 400, s: 10000, ucc: 4, pri: 'D', sec: 'Y', mark: 'Dy', help: 'Triángulo–estrella: típico de distribución (Dyn11); desfasa 30°.' }),
  xf('tr3_yd', 'Transformador trifásico Yd', '3ph', { vp: 400, vs: 400, s: 10000, ucc: 4, pri: 'Y', sec: 'D', mark: 'Yd' }),
  xf('tr3_dd', 'Transformador trifásico Dd', '3ph', { vp: 400, vs: 400, s: 10000, ucc: 4, pri: 'D', sec: 'D', mark: 'Dd' }),
  src3('red3', 'Red trifásica 400/230 V (con neutro)', 'star', 'RED 3~', 'Tres fases a 120° y neutro. La tensión indicada es la de línea (400 V); entre fase y neutro hay 230 V.'),
  src3('fuente3y', 'Fuente trifásica en estrella (con neutro)', 'star', '3~ Y'),
  src3('fuente3d', 'Fuente trifásica en triángulo', 'delta', '3~ Δ'),
  src3('alternador3', 'Alternador trifásico', 'star', 'G 3~'),
  load3('carga3y', 'Carga trifásica equilibrada en estrella', false, '3~ Y', { help: 'Tres impedancias iguales entre cada fase y el neutro (el borne N puede quedar sin conectar).' }),
  load3('carga3d', 'Carga trifásica equilibrada en triángulo', true, '3~ Δ'),
  load3('carga3u', 'Carga trifásica desequilibrada', false, '3~ ≠', { unbalanced: true, help: 'Tres resistencias distintas en estrella: con el neutro conectado cada fase es independiente; sin él, aparece tensión de desplazamiento del neutro.' }),
  motor3('motor3', 'Motor trifásico asíncrono de jaula de ardilla', 4000, 0.82, 'M 3~', 'Carga de impedancia fija a partir de potencia, rendimiento y cos φ. Elige estrella o triángulo.'),
  motor3('motor3_rb', 'Motor trifásico de rotor bobinado', 7500, 0.85, 'M 3~RB'),
  motor3('motor_sincrono', 'Motor síncrono', 5000, 0.95, 'MS 3~'),
  { type: 'schottky', name: 'Diodo Schottky', category: 'Semiconductores', w: 80, h: 30, terminals: [{ x: -40, y: 0, name: 'A' }, { x: 40, y: 0, name: 'K' }], sym: 'diode', mark: 'SCH',
    params: [{ key: 'vf', label: 'Tensión umbral', unit: 'V', default: 0.3, min: 0, step: 0.05 }], model: { kind: 'DIODE', vf: n('vf'), rd: 0.03 }, tag: (p) => `Vf ${fmt(+p.vf)} V` },
];
