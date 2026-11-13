/**
 * Electrónica: semiconductores, circuitos integrados y electrónica de potencia.
 * Se simulan en el análisis transitorio (botón «Transitorio»): cada componente aporta su modelo (`model.kind = 'TRAN'`).
 */
import type { Component } from './types';
import type { Def, ParamDef, TranCtx } from './library';
import type { TEl, Read } from '../engine/tran';
import { fmt } from './format';

type P = Component['params'];
const n = (k: string) => (p: P) => Number(p[k]);
const VT = 0.025852;
const isFor = (vf: number, nn = 1.8, i = 0.01) => i * Math.exp(-vf / (nn * VT));
const dio = (a: number, b: number, vf = 0.7, nn = 1): TEl => ({ k: 'D', a, b, is: isFor(vf, nn), n: nn });
const LEDS = [1.9, 2.1, 3.0, 2.0];
const T = (build: (c: TranCtx) => TEl[]) => ({ kind: 'TRAN' as const, build });
const pin = (x: number, y: number, name: string) => ({ x, y, name });
const comp = (type: string, name: string, cat: 'Electrónica' | 'Circuitos integrados', sym: string, terminals: Def['terminals'], params: ParamDef[], build: (c: TranCtx) => TEl[], o: Partial<Def> = {}): Def =>
  ({ type, name, category: cat, w: 80, h: Math.max(40, Math.max(...terminals.map((t) => Math.abs(t.y))) * 2 + 20), sym, terminals, params, model: T(build), ...o });

const SUP: ParamDef = { key: 'sup', label: 'Alimentación', unit: '', default: 0, options: [{ label: '±15 V', value: 0 }, { label: '±12 V', value: 1 }, { label: '±5 V', value: 2 }, { label: '+12 V (sencilla)', value: 3 }, { label: '+5 V (sencilla)', value: 4 }] };
const RAILS: [number, number][] = [[15, -15], [12, -12], [5, -5], [12, 0], [5, 0]];
const VCC: ParamDef = { key: 'vcc', label: 'Alimentación lógica', unit: 'V', default: 5, options: [{ label: '3,3 V', value: 3.3 }, { label: '5 V', value: 5 }, { label: '12 V', value: 12 }] };

const opamp = (type: string, name: string, comparator: boolean): Def => comp(type, name, 'Circuitos integrados', 'opamp', [pin(-40, 20, '+'), pin(-40, -20, '−'), pin(40, 0, 'OUT')], [SUP, { key: 'gain', label: 'Ganancia en lazo abierto', unit: '', default: comparator ? 2e5 : 1e5, min: 1e3 }],
  (c) => [{ k: 'OA', p: c.nd[0], n: c.nd[1], o: c.nd[2], vp: -1, vn: -1, vpv: RAILS[Number(c.p.sup)][0], vnv: RAILS[Number(c.p.sup)][1], gain: Number(c.p.gain) * (comparator ? 1 : 0.5), head: comparator ? 0.1 : 1.2, rout: comparator ? 30 : 75 }],
  { help: comparator ? 'Salida a un carril u otro según cuál entrada sea mayor.' : 'Modelo con ganancia finita, saturación en los carriles y resistencia de salida. Con realimentación negativa se comporta como en los ejercicios de clase.' });

type Logic = 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR';
const gate = (kind: Logic, name: string): Def => {
  const un = kind === 'NOT';
  const sym = (a: boolean, b: boolean) => (kind === 'AND' ? a && b : kind === 'OR' ? a || b : kind === 'NOT' ? !a : kind === 'NAND' ? !(a && b) : kind === 'NOR' ? !(a || b) : a !== b);
  return comp(`g_${kind.toLowerCase()}`, name, 'Circuitos integrados', 'gate', un ? [pin(-40, 0, 'A'), pin(40, 0, 'Y')] : [pin(-40, -20, 'A'), pin(-40, 20, 'B'), pin(40, 0, 'Y')], [VCC], (c) => {
    const [a, b, y] = un ? [c.nd[0], c.nd[0], c.nd[1]] : [c.nd[0], c.nd[1], c.nd[2]];
    const vcc = Number(c.p.vcc);
    return [{ k: 'B', o: y, ref: 0, rout: 40, f: (r: Read) => (sym(r(a) > vcc / 2, r(b) > vcc / 2) ? vcc : 0) }];
  }, { glyph: { AND: '&', OR: '≥1', NOT: '1', NAND: '&', NOR: '≥1', XOR: '=1' }[kind], mark: kind, help: 'Puerta lógica (símbolo IEC). Entradas: nivel alto si superan la mitad de la alimentación.' });
};

function ff(type: string, name: string, kind: 'D' | 'JK' | 'T' | 'SR'): Def {
  const pins = kind === 'JK' ? [pin(-40, -20, 'J'), pin(-40, 0, 'CLK'), pin(-40, 20, 'K')] : kind === 'SR' ? [pin(-40, -20, 'S'), pin(-40, 20, 'R')] : [pin(-40, -20, kind), pin(-40, 20, 'CLK')];
  const out = [pin(40, -20, 'Q'), pin(40, 20, '/Q')];
  return comp(type, name, 'Circuitos integrados', 'ic', [...pins, ...out], [VCC], (c) => {
    const vcc = Number(c.p.vcc), th = vcc / 2;
    const st = { q: false, clk: false };
    const ni = pins.length;
    const upd = (r: Read) => {
      const hi = (i: number) => r(c.nd[i]) > th;
      if (kind === 'SR') { const s = hi(0), rr = hi(1); if (s && !rr) st.q = true; else if (rr && !s) st.q = false; return; }
      const clkIdx = kind === 'JK' ? 1 : 1, clk = hi(clkIdx);
      if (clk && !st.clk) {
        if (kind === 'D') st.q = hi(0);
        else if (kind === 'T') { if (hi(0)) st.q = !st.q; }
        else { const j = hi(0), k = hi(2); if (j && k) st.q = !st.q; else if (j) st.q = true; else if (k) st.q = false; }
      }
      st.clk = clk;
    };
    let last = -1;
    const f = (isQ: boolean) => (r: Read, t: number) => { if (t !== last) { upd(r); last = t; } return (isQ ? st.q : !st.q) ? vcc : 0; };
    return [{ k: 'B', o: c.nd[ni], ref: 0, rout: 40, f: f(true) }, { k: 'B', o: c.nd[ni + 1], ref: 0, rout: 40, f: f(false) }];
  }, { glyph: kind === 'SR' ? 'SR' : kind === 'D' ? 'D' : kind === 'T' ? 'T' : 'JK', mark: `FF ${kind}`, help: 'Biestable síncrono por flanco de subida del reloj (CLK). Q y /Q complementarias.' });
}

const buckBoost = (type: string, name: string, mode: 'buck' | 'boost' | 'solar', o: { mark: string; names: [string, string, string, string]; help?: string }): Def =>
  comp(type, name, 'Electrónica', 'ic', [pin(-40, -20, o.names[0]), pin(-40, 20, o.names[1]), pin(40, -20, o.names[2]), pin(40, 20, o.names[3])],
    mode === 'solar' ? [{ key: 'vset', label: 'Tensión de la batería (carga)', unit: 'V', default: 14.4, min: 1 }, { key: 'eta', label: 'Rendimiento', unit: '', default: 0.95, min: 0.5, max: 1, step: 0.01 }]
      : [{ key: 'duty', label: 'Ciclo de trabajo D', unit: '', default: 0.5, min: 0.05, max: 0.95, step: 0.05 }, { key: 'eta', label: 'Rendimiento', unit: '', default: 0.92, min: 0.5, max: 1, step: 0.01 }],
    (c) => {
      const [ip, im, op, om] = c.nd; const eta = Number(c.p.eta), rout = 0.2;
      const target = (r: Read) => { const vin = Math.max(0, r(ip) - r(im)); if (vin < 2) return 0; return mode === 'buck' ? vin * Number(c.p.duty) : mode === 'boost' ? Math.min(vin / (1 - Number(c.p.duty)), 5 * vin) : Math.min(Number(c.p.vset), 0.97 * vin); };
      return [{ k: 'B', o: op, ref: om, rout, f: target },
        { k: 'BI', a: ip, b: im, f: (r: Read) => { const vin = Math.max(1, r(ip) - r(im)); const vt = target(r); const io = Math.max(0, (vt - (r(op) - r(om))) / rout); return (vt * io) / (eta * vin); } }];
    }, { mark: o.mark, help: o.help ?? 'Modelo promediado: da la tensión media de salida (sin rizado de conmutación).', glyph: mode === 'buck' ? '↓' : mode === 'boost' ? '↑' : '☀' });

const wave = (p: P): ((t: number) => number) => {
  const f = Number(p.f), A = Number(p.amp), off = Number(p.off), duty = Number(p.duty ?? 0.5), wf = Number(p.wf);
  return (t) => {
    const ph = ((t * f) % 1 + 1) % 1;
    const sh = wf === 0 ? Math.sin(2 * Math.PI * ph) : wf === 1 ? (ph < duty ? 1 : -1) : wf === 2 ? (ph < 0.5 ? 4 * ph - 1 : 3 - 4 * ph) : 2 * ph - 1;
    return off + A * sh;
  };
};
const gen = (type: string, name: string, mark: string, params: ParamDef[], w: (p: P) => (t: number) => number, help: string): Def => ({
  type, name, category: 'Fuentes', w: 80, h: 40, sym: 'vsrc', mark, help, terminals: [pin(-40, 0, '+'), pin(40, 0, '−')], params,
  model: { kind: 'V', value: n('off'), rint: n('rint') }, wave: w, tag: (p) => `${fmt(+p.amp)} V · ${fmt(+p.f)} Hz`,
});

export const EXTRA3: Def[] = [
  // ───── Generadores de señal (solo en el análisis transitorio; en el estático dan su nivel medio)
  gen('fgen', 'Generador de funciones', 'FUNC', [{ key: 'wf', label: 'Forma de onda', unit: '', default: 0, options: [{ label: 'Senoidal', value: 0 }, { label: 'Cuadrada', value: 1 }, { label: 'Triangular', value: 2 }, { label: 'Diente de sierra', value: 3 }] }, { key: 'f', label: 'Frecuencia', unit: 'Hz', default: 1000, min: 0.1 }, { key: 'amp', label: 'Amplitud (pico)', unit: 'V', default: 5, min: 0 }, { key: 'off', label: 'Nivel de continua', unit: 'V', default: 0 }, { key: 'duty', label: 'Ciclo (cuadrada)', unit: '', default: 0.5, min: 0.05, max: 0.95, step: 0.05 }, { key: 'rint', label: 'Resist. de salida', unit: 'Ω', default: 50, min: 0 }], wave, 'Señal periódica para el osciloscopio del análisis transitorio.'),
  gen('pwm', 'Generador de pulsos / PWM', 'PWM', [{ key: 'f', label: 'Frecuencia', unit: 'Hz', default: 1000, min: 0.1 }, { key: 'amp', label: 'Nivel alto', unit: 'V', default: 5, min: 0 }, { key: 'duty', label: 'Ciclo de trabajo', unit: '', default: 0.3, min: 0.01, max: 0.99, step: 0.01 }, { key: 'rint', label: 'Resist. de salida', unit: 'Ω', default: 10, min: 0 }],
    (p) => { const f = Number(p.f), A = Number(p.amp), d = Number(p.duty); return (t) => (((t * f) % 1 + 1) % 1 < d ? A : 0); }, 'Tren de pulsos de 0 V a nivel alto con ciclo de trabajo ajustable.'),
  gen('harm', 'Fuente con armónicos', 'ARM', [{ key: 'f', label: 'Frecuencia fundamental', unit: 'Hz', default: 50, min: 1 }, { key: 'amp', label: 'Fundamental (pico)', unit: 'V', default: 325, min: 0 }, { key: 'h3', label: '3.er armónico', unit: '%', default: 20, min: 0 }, { key: 'h5', label: '5.º armónico', unit: '%', default: 10, min: 0 }, { key: 'off', label: 'Continua', unit: 'V', default: 0 }, { key: 'rint', label: 'Resist. de salida', unit: 'Ω', default: 0.5, min: 0 }],
    (p) => { const f = Number(p.f), A = Number(p.amp), a3 = (Number(p.h3) / 100) * A, a5 = (Number(p.h5) / 100) * A, off = Number(p.off); return (t) => off + A * Math.sin(2 * Math.PI * f * t) + a3 * Math.sin(6 * Math.PI * f * t) + a5 * Math.sin(10 * Math.PI * f * t); }, 'Onda con fundamental y armónicos 3.º y 5.º: sirve para ver el efecto de las cargas no lineales.'),
  { type: 'cargador', name: 'Cargador de baterías', category: 'Fuentes', w: 80, h: 40, sym: 'vsrc', mark: 'CARG', terminals: [pin(-40, 0, '+'), pin(40, 0, '−')],
    params: [{ key: 'v', label: 'Tensión de carga', unit: 'V', default: 14.4, min: 0, step: 0.1 }, { key: 'rint', label: 'Resist. de salida', unit: 'Ω', default: 0.3, min: 0 }, { key: 'imax', label: 'Corriente máxima', unit: 'A', default: 10, min: 0.1 }],
    model: { kind: 'V', value: n('v'), rint: n('rint') }, tag: (p) => `${fmt(+p.v)} V` },

  // ───── Semiconductores
  comp('bridge1', 'Puente rectificador monofásico', 'Electrónica', 'bridge', [pin(-40, -20, '~'), pin(-40, 20, '~'), pin(40, -20, '+'), pin(40, 20, '−')], [], (c) => [dio(c.nd[0], c.nd[2]), dio(c.nd[1], c.nd[2]), dio(c.nd[3], c.nd[0]), dio(c.nd[3], c.nd[1])], { help: 'Cuatro diodos: convierte la CA en pulsos de un solo sentido (+/−). Añade un condensador para alisar.' }),
  comp('bridge3', 'Puente rectificador trifásico', 'Electrónica', 'bridge', [pin(-40, -20, 'L1'), pin(-40, 0, 'L2'), pin(-40, 20, 'L3'), pin(40, -20, '+'), pin(40, 20, '−')], [], (c) => [0, 1, 2].flatMap((i) => [dio(c.nd[i], c.nd[3]), dio(c.nd[4], c.nd[i])]), { help: 'Seis diodos: rectificación trifásica de onda completa.' }),
  comp('pdiode', 'Fotodiodo', 'Electrónica', 'pdiode', [pin(-40, 0, 'A'), pin(40, 0, 'K')], [{ key: 'lux', label: 'Iluminación', unit: 'lux', default: 500, min: 0 }],
    (c) => [dio(c.nd[0], c.nd[1]), { k: 'BI', a: c.nd[1], b: c.nd[0], f: () => Number(c.p.lux) * 1e-8 }], { help: 'En inversa conduce una corriente proporcional a la luz (10 µA a 1000 lux).' }),
  comp('led_rgb', 'LED RGB (cátodo común)', 'Electrónica', 'ic', [pin(-40, -20, 'R'), pin(-40, 0, 'G'), pin(-40, 20, 'B'), pin(40, 0, 'K')], [],
    (c) => [dio(c.nd[0], c.nd[3], LEDS[0], 1.8), dio(c.nd[1], c.nd[3], LEDS[1], 1.8), dio(c.nd[2], c.nd[3], LEDS[2], 1.8)], { glyph: 'RGB', mark: 'LED RGB' }),
  comp('npn', 'Transistor BJT NPN', 'Electrónica', 'bjt', [pin(-40, 0, 'B'), pin(40, -20, 'C'), pin(40, 20, 'E')], [{ key: 'bf', label: 'Ganancia β', unit: '', default: 100, min: 5 }], (c) => [{ k: 'Q', b: c.nd[0], c: c.nd[1], e: c.nd[2], bf: Number(c.p.bf) }], { mark: 'NPN', help: 'Modelo de Ebers-Moll: corte, activa y saturación.' }),
  comp('pnp', 'Transistor BJT PNP', 'Electrónica', 'bjt', [pin(-40, 0, 'B'), pin(40, -20, 'C'), pin(40, 20, 'E')], [{ key: 'bf', label: 'Ganancia β', unit: '', default: 100, min: 5 }], (c) => [{ k: 'Q', b: c.nd[0], c: c.nd[1], e: c.nd[2], bf: Number(c.p.bf), pnp: true }], { mark: 'PNP' }),
  comp('nmos', 'MOSFET canal N', 'Electrónica', 'mos', [pin(-40, 0, 'G'), pin(40, -20, 'D'), pin(40, 20, 'S')], [{ key: 'vt', label: 'Tensión umbral VGS(th)', unit: 'V', default: 2, min: 0.2 }, { key: 'kp', label: 'Transconductancia K', unit: 'A/V²', default: 0.5, min: 0.001 }], (c) => [{ k: 'M', g: c.nd[0], d: c.nd[1], s: c.nd[2], vt: Number(c.p.vt), kp: Number(c.p.kp) }], { mark: 'N-MOS' }),
  comp('pmos', 'MOSFET canal P', 'Electrónica', 'mos', [pin(-40, 0, 'G'), pin(40, -20, 'D'), pin(40, 20, 'S')], [{ key: 'vt', label: 'Tensión umbral |VGS(th)|', unit: 'V', default: 2, min: 0.2 }, { key: 'kp', label: 'Transconductancia K', unit: 'A/V²', default: 0.5, min: 0.001 }], (c) => [{ k: 'M', g: c.nd[0], d: c.nd[1], s: c.nd[2], vt: Number(c.p.vt), kp: Number(c.p.kp), pch: true }], { mark: 'P-MOS' }),
  comp('igbt', 'IGBT', 'Electrónica', 'mos', [pin(-40, 0, 'G'), pin(40, -20, 'C'), pin(40, 20, 'E')], [{ key: 'vt', label: 'Umbral VGE(th)', unit: 'V', default: 5, min: 1 }, { key: 'kp', label: 'Transconductancia K', unit: 'A/V²', default: 2, min: 0.01 }], (c) => [{ k: 'M', g: c.nd[0], d: c.nd[1], s: c.nd[2], vt: Number(c.p.vt), kp: Number(c.p.kp) }], { mark: 'IGBT', help: 'Modelo simplificado como MOSFET de potencia.' }),
  comp('scr', 'Tiristor (SCR)', 'Electrónica', 'scr', [pin(-40, 0, 'A'), pin(40, 0, 'K'), pin(0, 20, 'G')], [{ key: 'ih', label: 'Corriente de mantenimiento', unit: 'mA', default: 20, min: 1 }],
    (c) => [{ k: 'SW', a: c.nd[0], b: c.nd[1], ron: 0.1, on: (_t, vab, i, r) => i > Number(c.p.ih) / 1000 || (vab > 0.8 && r(c.nd[2]) - r(c.nd[1]) > 0.7) }], { help: 'Se dispara con un pulso en la puerta (G) y sigue conduciendo hasta que la corriente cae por debajo de la de mantenimiento.' }),
  comp('triac', 'Triac', 'Electrónica', 'triac', [pin(-40, 0, 'MT2'), pin(40, 0, 'MT1'), pin(0, 20, 'G')], [{ key: 'ih', label: 'Corriente de mantenimiento', unit: 'mA', default: 20, min: 1 }],
    (c) => [{ k: 'SW', a: c.nd[0], b: c.nd[1], ron: 0.1, on: (_t, vab, i, r) => Math.abs(i) > Number(c.p.ih) / 1000 || (Math.abs(vab) > 0.8 && Math.abs(r(c.nd[2]) - r(c.nd[1])) > 0.7) }], { help: 'Como dos tiristores en antiparalelo: conduce en ambos sentidos al dispararlo por la puerta.' }),
  comp('diac', 'Diac', 'Electrónica', 'diac', [pin(-40, 0, '1'), pin(40, 0, '2')], [{ key: 'vbo', label: 'Tensión de ruptura', unit: 'V', default: 32, min: 5 }],
    (c) => [{ k: 'SW', a: c.nd[0], b: c.nd[1], ron: 10, on: (_t, vab, i) => Math.abs(i) > 0.003 || Math.abs(vab) > Number(c.p.vbo) }], { help: 'Conduce en ambos sentidos al superar su tensión de ruptura.' }),
  comp('opto', 'Optoacoplador', 'Electrónica', 'ic', [pin(-40, -20, 'A'), pin(-40, 20, 'K'), pin(40, -20, 'C'), pin(40, 20, 'E')], [{ key: 'ctr', label: 'Relación de transferencia CTR', unit: '', default: 1, min: 0.05, step: 0.05 }],
    (c) => [dio(c.nd[0], c.nd[1], 1.25, 1.8), { k: 'BI', a: c.nd[2], b: c.nd[3], f: (r: Read) => { const vd = r(c.nd[0]) - r(c.nd[1]); const il = isFor(1.25, 1.8) * (Math.exp(Math.min(vd, 2) / (1.8 * VT)) - 1); return Number(c.p.ctr) * il * Math.tanh(Math.max(0, r(c.nd[2]) - r(c.nd[3])) / 0.3); } }], { glyph: '⇢', mark: 'OPTO', help: 'El LED de entrada (A–K) maneja el fototransistor de salida (C–E) con aislamiento galvánico.' }),
  comp('phototr', 'Fototransistor', 'Electrónica', 'ic', [pin(40, -20, 'C'), pin(40, 20, 'E')], [{ key: 'lux', label: 'Iluminación', unit: 'lux', default: 500, min: 0 }],
    (c) => [{ k: 'BI', a: c.nd[0], b: c.nd[1], f: (r: Read) => Number(c.p.lux) * 2e-6 * Math.tanh(Math.max(0, r(c.nd[0]) - r(c.nd[1])) / 0.3) }], { glyph: '☀', mark: 'FOTO-T', help: 'Conduce entre C y E una corriente proporcional a la luz (2 mA a 1000 lux).' }),

  // ───── Electrónica de potencia
  comp('reg78', 'Regulador lineal 78xx', 'Electrónica', 'ic', [pin(-40, -20, 'IN'), pin(0, 40, 'GND'), pin(40, -20, 'OUT')], [{ key: 'vreg', label: 'Tensión de salida', unit: 'V', default: 5, options: [5, 6, 8, 9, 12, 15, 24].map((v) => ({ label: `${v} V`, value: v })) }, { key: 'drop', label: 'Caída mínima (dropout)', unit: 'V', default: 2, min: 0.1 }],
    (c) => {
      const [i, g, o] = c.nd; const tgt = (r: Read) => Math.max(0, Math.min(Number(c.p.vreg), r(i) - r(g) - Number(c.p.drop)));
      return [{ k: 'B', o, ref: g, rout: 0.5, f: tgt }, { k: 'BI', a: i, b: g, f: (r: Read) => Math.max(0, (tgt(r) - (r(o) - r(g))) / 0.5) + 0.004 }];
    }, { glyph: '78', mark: '78xx', help: 'Salida fija si la entrada supera la de salida más la caída mínima; la corriente de entrada es la de salida.' }),
  comp('lm317', 'Regulador ajustable LM317', 'Electrónica', 'ic', [pin(-40, -20, 'IN'), pin(0, 40, 'ADJ'), pin(40, -20, 'OUT')], [{ key: 'drop', label: 'Caída mínima (dropout)', unit: 'V', default: 2, min: 0.1 }],
    (c) => {
      const [i, a, o] = c.nd; const tgt = (r: Read) => Math.max(0, Math.min(r(a) + 1.25, r(i) - Number(c.p.drop)));
      return [{ k: 'B', o, ref: 0, rout: 0.5, f: tgt }, { k: 'BI', a: i, b: 0, f: (r: Read) => Math.max(0, (tgt(r) - r(o)) / 0.5) + 5e-5 }];
    }, { glyph: '317', mark: 'LM317', help: 'La salida es 1,25 V por encima del terminal ADJ: con R1 (OUT–ADJ) y R2 (ADJ–masa), Vout = 1,25·(1 + R2/R1).' }),
  buckBoost('dcdc_buck', 'Convertidor CC/CC reductor (buck)', 'buck', { mark: 'BUCK', names: ['IN+', 'IN−', 'OUT+', 'OUT−'] }),
  buckBoost('dcdc_boost', 'Convertidor CC/CC elevador (boost)', 'boost', { mark: 'BOOST', names: ['IN+', 'IN−', 'OUT+', 'OUT−'] }),
  buckBoost('solar_reg', 'Regulador de carga solar', 'solar', { mark: 'MPPT', names: ['PV+', 'PV−', 'BAT+', 'BAT−'], help: 'Carga la batería a su tensión de flotación tomando la energía del panel (modelo promediado).' }),
  comp('inversor', 'Inversor CC/CA', 'Electrónica', 'ic', [pin(-40, -20, 'DC+'), pin(-40, 20, 'DC−'), pin(40, -20, 'L'), pin(40, 20, 'N')], [{ key: 'vac', label: 'Tensión de salida (eficaz)', unit: 'V', default: 230, min: 1 }, { key: 'f', label: 'Frecuencia', unit: 'Hz', default: 50, min: 1 }, { key: 'eta', label: 'Rendimiento', unit: '', default: 0.9, min: 0.5, max: 1, step: 0.01 }],
    (c) => {
      const [ip, im, ol, on] = c.nd; const eta = Number(c.p.eta), A = Number(c.p.vac) * Math.SQRT2, f = Number(c.p.f);
      const tgt = (r: Read, t: number) => ((r(ip) - r(im)) > A * 1.05 ? A * Math.sin(2 * Math.PI * f * t) : 0);
      return [{ k: 'B', o: ol, ref: on, rout: 0.5, f: tgt }, { k: 'BI', a: ip, b: im, f: (r: Read, t: number) => { const vt = tgt(r, t); const io = (vt - (r(ol) - r(on))) / 0.5; return Math.max(0, (vt * io) / (eta * Math.max(1, r(ip) - r(im)))); } }];
    }, { glyph: '=/~', mark: 'INV', help: 'Modelo ideal con salida senoidal: necesita en continua más que el pico de la tensión de salida.' }),
  comp('vfd', 'Variador de frecuencia', 'Electrónica', 'ic', [pin(-40, -20, 'L1'), pin(-40, 0, 'L2'), pin(-40, 20, 'L3'), pin(40, -20, 'U'), pin(40, 0, 'V'), pin(40, 20, 'W')], [{ key: 'vn', label: 'Tensión de línea del motor', unit: 'V', default: 400, min: 1 }, { key: 'fn', label: 'Frecuencia nominal', unit: 'Hz', default: 50, min: 1 }, { key: 'fo', label: 'Frecuencia de salida', unit: 'Hz', default: 25, min: 0.5 }],
    (c) => {
      const vn = Number(c.p.vn), fn = Number(c.p.fn), fo = Number(c.p.fo);
      const A = (vn / Math.sqrt(3)) * Math.SQRT2 * Math.min(1, fo / fn);
      return [0, 1, 2].map((k): TEl => ({ k: 'B', o: c.nd[3 + k], ref: 0, rout: 0.3, f: (_r: Read, t: number) => A * Math.sin(2 * Math.PI * fo * t - (k * 2 * Math.PI) / 3) }));
    }, { glyph: 'VFD', mark: 'VFD', help: 'Salida trifásica con relación V/f constante. Modelo ideal: no incluye el rectificador de entrada.' }),
  comp('softstart', 'Arrancador suave', 'Electrónica', 'ic', [pin(-40, -20, 'L1'), pin(-40, 0, 'L2'), pin(-40, 20, 'L3'), pin(40, -20, 'T1'), pin(40, 0, 'T2'), pin(40, 20, 'T3')], [{ key: 'ramp', label: 'Tiempo de rampa', unit: 's', default: 0.05, min: 0.005, step: 0.005 }],
    (c) => [0, 1, 2].map((k): TEl => ({ k: 'RT', a: c.nd[k], b: c.nd[3 + k], r: (t: number) => 0.02 + 500 * Math.pow(1 - Math.min(1, t / Number(c.p.ramp)), 3) })), { glyph: 'SS', mark: 'SOFT', help: 'Resistencia serie que disminuye durante la rampa: limita la corriente de arranque.' }),
  comp('ledrv', 'Driver LED (corriente constante)', 'Electrónica', 'ic', [pin(-40, -20, 'IN+'), pin(-40, 20, 'IN−'), pin(40, -20, 'LED+'), pin(40, 20, 'LED−')], [{ key: 'iled', label: 'Corriente de salida', unit: 'mA', default: 350, min: 1 }],
    (c) => {
      const [ip, im, lp, lm] = c.nd; const I = Number(c.p.iled) / 1000;
      const on = (r: Read) => (r(ip) - r(im) > 4 ? I : 0);
      return [{ k: 'BI', a: lm, b: lp, f: (r: Read) => on(r) }, { k: 'BI', a: ip, b: im, f: (r: Read) => (on(r) * Math.max(2, r(lp) - r(lm))) / (0.9 * Math.max(4, r(ip) - r(im))) + 0.002 }];
    }, { glyph: 'I=k', mark: 'DRIVER', help: 'Fuente de corriente constante para LED de potencia.' }),
  comp('emi', 'Filtro EMI', 'Electrónica', 'ic', [pin(-40, -20, 'L in'), pin(-40, 20, 'N in'), pin(40, -20, 'L out'), pin(40, 20, 'N out')], [{ key: 'l', label: 'Inductancia por línea', unit: 'mH', default: 2, min: 0.01 }, { key: 'c', label: 'Condensador entre líneas', unit: 'nF', default: 330, min: 1 }],
    (c) => [{ k: 'L', a: c.nd[0], b: c.nd[2], l: Number(c.p.l) * 1e-3, r: 0.05 }, { k: 'L', a: c.nd[1], b: c.nd[3], l: Number(c.p.l) * 1e-3, r: 0.05 }, { k: 'C', a: c.nd[2], b: c.nd[3], c: Number(c.p.c) * 1e-9 }, { k: 'C', a: c.nd[0], b: c.nd[1], c: Number(c.p.c) * 1e-9 }], { glyph: 'EMI', mark: 'EMI', help: 'Filtro paso bajo LC: deja pasar la red y atenúa el ruido de alta frecuencia.' }),

  // ───── Circuitos integrados
  opamp('opamp', 'Amplificador operacional', false),
  opamp('comparator', 'Comparador', true),
  comp('ne555', 'Temporizador 555', 'Circuitos integrados', 'ic', [pin(0, -40, 'VCC'), pin(0, 40, 'GND'), pin(-40, -20, 'TRIG'), pin(-40, 0, 'THR'), pin(-40, 20, 'RST'), pin(40, -20, 'OUT'), pin(40, 20, 'DIS')], [],
    (c) => {
      const [vcc, gnd, trig, thr, rst, out, dis] = c.nd; const st = { q: false }; let last = -1;
      const upd = (r: Read, t: number) => { if (t === last) return; last = t; const vc = r(vcc) - r(gnd); if (vc < 3) { st.q = false; return; } const tr = r(trig) - r(gnd), th = r(thr) - r(gnd); const rs = !rst || r(rst) - r(gnd) > 0.7 ? true : false; if (!rs) st.q = false; else if (tr < vc / 3) st.q = true; else if (th > (2 * vc) / 3) st.q = false; };
      return [{ k: 'B', o: out, ref: gnd, rout: 25, f: (r: Read, t: number) => { upd(r, t); return st.q ? r(vcc) - r(gnd) - 1.7 : 0.1; } },
        { k: 'SW', a: dis, b: gnd, ron: 10, on: () => !st.q }];
    }, { glyph: '555', mark: 'NE555', help: 'Conecta RST a VCC si no la usas. Astable: R1 (VCC–DIS), R2 (DIS–THR), C (THR–masa) y TRIG unido a THR; f ≈ 1,44/((R1+2R2)·C).' }),
  gate('AND', 'Puerta AND'), gate('OR', 'Puerta OR'), gate('NOT', 'Puerta NOT'), gate('NAND', 'Puerta NAND'), gate('NOR', 'Puerta NOR'), gate('XOR', 'Puerta XOR'),
  ff('ff_d', 'Biestable D', 'D'), ff('ff_jk', 'Biestable JK', 'JK'), ff('ff_t', 'Biestable T', 'T'), ff('ff_sr', 'Biestable SR (latch)', 'SR'),
];
