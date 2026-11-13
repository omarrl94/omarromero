/**
 * Solucionario «de pizarra» (formato del profesor): Enunciado, Resultado, métodos con pasos
 * «Qué hago / Por qué / En la pizarra», Comprobaciones, Interpretación y Reflexión. Vale para CC y para CA (fasores).
 */
import { type CNet, type Rama, ramaDesc, ramaName } from './cnet';
import { solveRamas } from './cnet';
import { buildGraph, type Graph } from './graph';
import { reduccion, cramer, eqLine, type Step } from './steps';
import { C0, C1, add, sub, mul, div, abs, cneg, cconj, cscale, isZero, isReal, nf, rect, pol, both, par, sumTerms, circ, subs, pretty, deg, meshName, type C } from './cx';

export type SBlock =
  | { t: 'p'; text: string }
  | { t: 'band'; text: string }
  | { t: 'step'; n: number; title: string; que: string; porque?: string; pizarra: string[] }
  | { t: 'box'; kind: 'result' | 'check' | 'interp' | 'reflex'; title: string; lines: string[] }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'phasors'; title: string; items: { label: string; v: C }[] }
  | { t: 'fig'; mark: 'nodes' | 'currents' | 'meshes'; caption: string };

export type MId = 'ohm' | 'kirchhoff' | 'mallas' | 'cramer' | 'nudos' | 'millman' | 'thevenin' | 'norton' | 'superposicion' | 'potencias';
export const SMETHODS: { id: MId; short: string; title: string; ac?: boolean }[] = [
  { id: 'ohm', short: 'Impedancias y Ohm', title: 'Impedancias de cada rama y ley de Ohm' },
  { id: 'kirchhoff', short: 'Kirchhoff directo', title: 'Método 1 · Kirchhoff directo' },
  { id: 'mallas', short: 'Mallas', title: 'Método · Corrientes de malla' },
  { id: 'cramer', short: 'Matrices · Cramer', title: 'Método · Matrices y regla de Cramer' },
  { id: 'nudos', short: 'Nudos', title: 'Método · Tensiones de nudo' },
  { id: 'millman', short: 'Millman', title: 'Método · Teorema de Millman' },
  { id: 'thevenin', short: 'Thévenin', title: 'Método · Teorema de Thévenin' },
  { id: 'norton', short: 'Norton', title: 'Método · Teorema de Norton' },
  { id: 'superposicion', short: 'Superposición', title: 'Método · Superposición' },
  { id: 'potencias', short: 'Potencias y cos φ (CA)', title: 'Potencias en alterna, factor de potencia y compensación', ac: true },
];
export interface SMethod { id: MId; title: string; applicable: boolean; why?: string; blocks: SBlock[]; I?: Record<string, C> }
export interface Sol { ok: boolean; reason?: string; enunciado: string[]; resultado: SBlock[]; methods: SMethod[]; cierre: SBlock[]; net: CNet; graph: Graph | null; loadId: string }

const srcE = (q: { kind: string; dir: 1 | -1; v: C }): C => (q.kind === 'E' ? (q.dir === 1 ? cneg(q.v) : q.v) : C0);
const unitI = 'A', unitV = 'V';
const SIDE3 = ['izquierda', 'central', 'derecha'];

export function buildSolucionario(net: CNet, opts: { load?: string } = {}): Sol {
  const blank: Sol = { ok: false, reason: net.reason, enunciado: [], resultado: [], methods: [], cierre: [], net, graph: null, loadId: '' };
  if (!net.ok) return blank;
  const { ramas, names, n, ac } = net;
  const M = ramas.length;
  const nm = (k: number) => ramaName(ramas[k]);
  const dirTxt = (r: Rama) => `${names[r.a]} → ${names[r.b]}`;
  const V = (i: number, j: number) => sub(net.V[i], net.V[j]);
  const vn = (i: number, j: number) => `V_${names[i]}${names[j]}`;
  const val = (c: C) => (ac ? both(c) : rect(c));
  const unitZ = 'Ω';
  const graph = buildGraph(net);
  const hasJ = ramas.some((r) => r.J);
  const srcOf = (r: Rama) => !isZero(r.E) || !!r.J;
  // Carga elegida para Thévenin/Norton: la indicada, o la última rama sin fuentes (si no hay, la última)
  const loadIdx = (() => { const i = ramas.findIndex((r) => r.id === opts.load); if (i >= 0) return i; const noSrc = ramas.map((r, k) => (srcOf(r) ? -1 : k)).filter((k) => k >= 0); return noSrc.length ? noSrc[noSrc.length - 1] : M - 1; })();

  /* ---------- Enunciado ---------- */
  const sideName = (k: number) => (M === 3 ? `Rama ${SIDE3[k]}` : `Rama ${k + 1}`);
  const byX = [...ramas].sort((p, q) => p.x - q.x);
  const enun: string[] = [];
  enun.push(`Circuito ${ac ? `en corriente alterna (f = ${nf(net.freq)} Hz, ω = ${nf(net.omega)} rad/s) ` : 'en corriente continua '}con ${M} ramas entre ${n === 2 ? `los puntos ${names[1]} y ${names[0]}` : `${n} puntos (${names.join(', ')})`}.`);
  byX.forEach((r, k) => {
    const parts = r.parts.filter((q) => !q.internal || q.kind === 'Z').map((q) => {
      if (q.kind === 'Z') return `${pretty(q.label)} = ${ac ? rect(q.v) : nf(q.v.re)} ${unitZ}`;
      if (q.kind === 'J') return `${pretty(q.label)} = ${val(q.v)} ${unitI} (fuente de corriente)`;
      const e = srcE(q); const plus = (e.re > 1e-12 || (Math.abs(e.re) <= 1e-12 && e.im > 0)) ? names[r.b] : names[r.a];
      return `${pretty(q.label)} = ${ac ? pol(q.v) : nf(abs(q.v))} ${unitV} (polo + hacia ${plus})`;
    });
    enun.push(`${sideName(k)}: ${parts.join(' en serie con ')}.`);
  });
  enun.push(`Se quiere calcular la corriente de cada rama (${ramas.map((_, k) => nm(k)).join(', ')}) y la tensión ${n === 2 ? vn(1, 0) : 'entre los puntos'}, y comprobar el resultado.`);

  /* ---------- Resultado ---------- */
  const dirOK = (k: number, i: C) => {
    const r = ramas[k];
    if (isReal(i)) return i.re < -1e-9 ? ` (negativa: en realidad circula ${names[r.b]} → ${names[r.a]})` : '';
    return '';
  };
  const resLines: string[] = ramas.map((r, k) => `${nm(k)} = ${val(net.I[r.id])} ${unitI}   (sentido ${dirTxt(r)})${dirOK(k, net.I[r.id])}`);
  const vLines: string[] = [];
  if (n === 2) vLines.push(`${vn(1, 0)} = ${val(V(1, 0))} ${unitV}`);
  else for (let i = 1; i < n; i++) vLines.push(`V_${names[i]} = ${val(net.V[i])} ${unitV}  (respecto de ${names[0]})`);
  // Potencias
  const srcP: { k: number; label: string; S: C }[] = [];
  ramas.forEach((r, k) => { r.parts.filter((q) => q.kind === 'E').forEach((q) => { const e = srcE(q); const S = mul(e, cconj(net.I[r.id])); srcP.push({ k, label: q.label, S }); }); });
  const consP = ramas.map((r, k) => ({ k, P: r.parts.filter((q) => q.kind === 'Z').reduce((a, q) => a + q.v.re, 0) * Math.pow(abs(net.I[r.id]), 2), Q: r.parts.filter((q) => q.kind === 'Z').reduce((a, q) => a + q.v.im, 0) * Math.pow(abs(net.I[r.id]), 2) }));
  const Pdel = srcP.reduce((a, s) => a + s.S.re, 0), Pcon = consP.reduce((a, c) => a + c.P, 0);
  const pLines: string[] = [];
  if (!ac && srcP.length) {
    const t = srcP.map((s) => ({ s, abs: Math.abs(s.S.re), ok: s.S.re >= 0 }));
    pLines.push(`P entregada = ${t.map((x, i) => `${i && x.ok ? '+ ' : x.ok ? '' : '− '}${nf(Math.abs(srcOfAbs(ramas, x.s.label)))}·${nf(Math.abs(net.I[ramas[x.s.k].id].re))}`).join(' ')} = ${nf(Pdel)} W`);
    const ct = consP.filter((c) => c.P > 1e-12);
    pLines.push(`P consumida = ${ct.map((c) => `${nf(ramas[c.k].Z.re)}·${nf(Math.abs(net.I[ramas[c.k].id].re))}²`).join(' + ')} = ${nf(Pcon)} W`);
  } else if (ac) {
    const Sd = srcP.reduce((a, s) => add(a, s.S), C0);
    pLines.push(`S entregada = ${rect(Sd)} VA  →  P = ${nf(Sd.re)} W, Q = ${nf(Sd.im)} var, |S| = ${nf(abs(Sd))} VA`);
  }
  const resultado: SBlock[] = [{ t: 'box', kind: 'result', title: 'Resultado', lines: [...resLines, ...vLines, ...pLines] }];

  /* ---------- Métodos ---------- */
  const methods: SMethod[] = [];
  const mk = (id: MId, applicable: boolean, why: string | undefined, blocks: SBlock[], I?: Record<string, C>) => methods.push({ id, title: SMETHODS.find((m) => m.id === id)!.title, applicable, why, blocks, I });
  let stepN = 0;
  const S = (title: string, st: Step): SBlock => ({ t: 'step', n: ++stepN, title, que: st.que, porque: st.porque, pizarra: st.pizarra });
  const Iof = (xs: C[]) => Object.fromEntries(ramas.map((r, k) => [r.id, xs[k]])) as Record<string, C>;
  const solved = (xs: C[]): SBlock => ({ t: 'box', kind: 'result', title: 'Corrientes obtenidas', lines: xs.map((x, k) => `${nm(k)} = ${val(x)} ${unitI}`) });

  /* --- Ohm / impedancias --- */
  {
    stepN = 0; const b: SBlock[] = [{ t: 'band', text: 'Impedancia y f.e.m. de cada rama' }];
    ramas.forEach((r, k) => {
      const zs = r.parts.filter((q) => q.kind === 'Z');
      const lines: string[] = [];
      if (zs.length) {
        lines.push(zs.length === 1 ? `Z${subs(r.name.slice(1))} = ${val(r.Z)} ${unitZ}` : `Z${subs(r.name.slice(1))} = ${zs.map((q) => (ac ? par(q.v) : nf(q.v.re))).join(' + ')} = ${val(r.Z)} ${unitZ}`);
        if (ac) zs.forEach((q) => { if (!isZero(q.v) && Math.abs(q.v.im) > 1e-9) lines.push(`   ${pretty(q.label)}: ${q.v.im > 0 ? `X_L = ω·L = ${nf(q.v.im)} Ω  →  +j${nf(q.v.im)}` : `X_C = 1/(ω·C) = ${nf(-q.v.im)} Ω  →  −j${nf(-q.v.im)}`}`); });
      }
      if (!isZero(r.E)) lines.push(`E${subs(r.name.slice(1))} = ${val(r.E)} V  (suma de las fuentes de la rama, en el sentido ${dirTxt(r)})`);
      if (r.J) lines.push(`J${subs(r.name.slice(1))} = ${val(r.J)} A`);
      b.push(S(`Rama ${k + 1}`, { que: `Sumo los elementos en serie de la rama ${nm(k)} (${ramaDesc(r)}).`, porque: 'En serie, las resistencias y las impedancias se suman; las f.e.m. se suman con su signo.', pizarra: lines }));
    });
    if (M === 1) {
      const r = ramas[0]; const I = net.I[r.id];
      b.push(S('Impedancia total y corriente (ley de Ohm)', { que: 'Es un solo lazo: todo está en serie. La corriente es la f.e.m. dividida por la impedancia total.', pizarra: [`I = E / Z = ${par(r.E)} / ${par(r.Z)} = ${val(I)} A`] }));
      const drops = r.parts.filter((q) => q.kind === 'Z' && !isZero(q.v)).map((q) => ({ label: pretty(q.label), v: mul(q.v, I), z: q.v }));
      b.push(S('Caída de tensión en cada elemento', { que: 'Multiplico cada impedancia por la corriente: U = Z · I.', porque: ac ? 'Las caídas en R, L y C no se suman en módulo, sino como fasores (cada una con su fase).' : 'Las caídas suman la f.e.m.', pizarra: [...drops.map((d) => `U(${d.label}) = ${par(d.z)}·${par(I)} = ${val(d.v)} V`), `Σ U = ${rect(drops.reduce((a, d) => add(a, d.v), C0))} V  =  E = ${rect(r.E)} V  ✓`] }));
      if (ac) b.push({ t: 'phasors', title: 'Diagrama fasorial de tensiones (cada caída, con su fase)', items: drops.map((d) => ({ label: d.label, v: d.v })) });
    }
    b.push({ t: 'box', kind: 'check', title: 'Cada rama, con la ley de Ohm', lines: ramas.map((r, k) => `${nm(k)} = (V_${names[r.a]}${names[r.b]} + E) / Z = (${rect(V(r.a, r.b))} + ${rect(r.E)}) / ${rect(r.Z)} = ${val(net.I[r.id])} A`) });
    mk('ohm', true, undefined, b, net.I);
  }

  /* --- Kirchhoff directo --- */
  const Zrow = (k: number) => ramas[k].Z;
  const kclText = (node: number) => {
    const ent = ramas.map((r, k) => (r.b === node ? nm(k) : '')).filter(Boolean), sal = ramas.map((r, k) => (r.a === node ? nm(k) : '')).filter(Boolean);
    return `${ent.join(' + ') || '0'} = ${sal.join(' + ') || '0'}`;
  };
  const kclRow = (node: number) => ramas.map((r) => (r.b === node ? C1 : r.a === node ? cneg(C1) : C0));
  const loopOk = !!graph && !hasJ;
  const loopText = (li: number) => {
    const L = graph!.loops[li];
    const em = L.items.map((it) => ({ c: cscale(ramas[it.k].E, it.along), x: '1' })).filter((e) => !isZero(e.c));
    const left = em.length ? em.map((e, i) => `${i ? (e.c.re < 0 ? '− ' : '+ ') : e.c.re < 0 ? '−' : ''}${isReal(e.c) ? nf(Math.abs(e.c.re)) : par(e.c)}`).join(' ') : '0';
    const right = sumTerms(L.items.map((it) => ({ c: cscale(Zrow(it.k), it.along), x: nm(it.k) })));
    return { left, right };
  };
  const loopRow = (li: number) => { const row = new Array(M).fill(C0) as C[]; graph!.loops[li].items.forEach((it) => { row[it.k] = cscale(Zrow(it.k), it.along); }); return row; };
  const loopRhs = (li: number) => graph!.loops[li].items.reduce((a, it) => add(a, cscale(ramas[it.k].E, it.along)), C0);
  if (graph || hasJ) {
    stepN = 0;
    const b: SBlock[] = [{ t: 'band', text: 'Planteamiento' }];
    b.push(S('Sentidos de las corrientes', { que: `Elijo un sentido para cada corriente ${ramas.map((_, k) => nm(k)).join(', ')} y lo dibujo.`, porque: 'Si luego sale negativa, solo significa que va al revés de lo que dibujé.', pizarra: ramas.map((r, k) => `${nm(k)}: ${dirTxt(r)}  (${ramaDesc(r)})`) }));
    b.push({ t: 'fig', mark: 'currents', caption: 'Sentidos elegidos para las corrientes' });
    const eqs: { row: C[]; rhs: C; text: string }[] = [];
    const kclNodes = Array.from({ length: n - 1 }, (_, i) => i + 1);
    const kclSteps = kclNodes.map((node) => { eqs.push({ row: kclRow(node), rhs: C0, text: kclText(node) }); return `En el punto ${names[node]}:  ${kclText(node)}`; });
    b.push(S(`Ley de los nudos (KCL)`, { que: `Aplico la 1.ª ley de Kirchhoff en ${n - 1 === 1 ? `el punto ${names[1]}` : 'los puntos ' + names.slice(1).join(', ')}.`, porque: 'Lo que entra en un punto es igual a lo que sale.', pizarra: kclSteps.map((t, i) => `${circ(i + 1)} ${t}`) }));
    if (loopOk) {
      graph!.loops.forEach((_, li) => { const t = loopText(li); eqs.push({ row: loopRow(li), rhs: loopRhs(li), text: `${t.left} = ${t.right}` }); });
      b.push({ t: 'fig', mark: 'meshes', caption: 'Mallas recorridas en sentido horario' });
      b.push(S('Ley de las mallas (KVL)', { que: `Recorro cada malla en sentido horario: la suma de f.e.m. es igual a la suma de caídas Z·I (se cuenta + si voy a favor de la corriente y − si voy en contra).`, porque: 'Tengo que escribir tantas ecuaciones como incógnitas: 1 de nudos + las mallas independientes.', pizarra: graph!.loops.map((_, li) => `${circ(kclNodes.length + li + 1)} Malla ${String.fromCharCode(97 + li)}:  ${eqs[kclNodes.length + li].text}`) }));
    } else if (hasJ) {
      ramas.forEach((r, k) => { if (r.J) { const row = new Array(M).fill(C0) as C[]; row[k] = C1; eqs.push({ row, rhs: r.J, text: `${nm(k)} = ${val(r.J)}` }); } });
    }
    if (eqs.length === M) {
      const nms = ramas.map((_, k) => nm(k));
      const A = eqs.map((e) => e.row), z = eqs.map((e) => e.rhs);
      b.push(S('Sistema de ecuaciones', { que: 'Dejo las ecuaciones con las incógnitas a la izquierda y los números a la derecha.', pizarra: eqs.map((e, i) => `${circ(i + 1)} ${eqLine(e.row, nms, e.rhs)}`) }));
      // Sustitución (si hay mallas): corrientes de rama en función de las de las cuerdas
      let xs: C[] | null = null;
      if (loopOk && graph!.loops.length >= 1) {
        const g = graph!, cs = g.chords;
        const T = (k: number, m: number) => g.sigma[m][k] * g.sigma[m][cs[m]]; // I_k = Σ T[k][m]·I_cuerda_m
        b.push({ t: 'band', text: 'Resolución por sustitución' });
        const expr = [...g.tree].map((t) => `${nm(t)} = ${sumTerms(cs.map((c, m) => ({ c: cscale(C1, T(t, m)), x: nm(c) })))}`);
        b.push(S('Expreso las corrientes de rama de la ley de nudos', { que: `De la ecuación de nudos despejo ${[...g.tree].map(nm).join(', ')} en función de ${cs.map(nm).join(', ')}.`, porque: 'Así me quedan solo tantas incógnitas como mallas.', pizarra: expr }));
        const R2 = g.loops.map((_, l) => cs.map((_, m) => ramas.reduce((a, _r, k) => add(a, cscale(Zrow(k), g.sigma[l][k] * T(k, m))), C0)));
        const z2 = g.loops.map((_, l) => loopRhs(l));
        b.push(S('Sustituyo en las ecuaciones de malla', { que: `Sustituyo esas expresiones en las ${g.loops.length} ecuaciones de malla y agrupo términos.`, pizarra: R2.map((row, l) => `${circ(l + 1)} ${eqLine(row, cs.map(nm), z2[l])}`) }));
        const rs = reduccion(R2, z2, cs.map(nm), 1);
        rs.steps.forEach((st) => b.push(S('Resuelvo el sistema reducido', st)));
        if (rs.x) {
          xs = new Array(M).fill(C0) as C[]; cs.forEach((c, m) => { xs![c] = rs.x![m]; });
          for (const t of g.tree) xs![t] = cs.reduce((a, _c, m) => add(a, cscale(rs.x![m], T(t, m))), C0);
          b.push(S('Calculo el resto de corrientes', { que: `Con las expresiones de la ley de nudos obtengo ${[...g.tree].map(nm).join(', ')}.`, pizarra: [...g.tree].map((t) => `${nm(t)} = ${sumTerms(cs.map((c, m) => ({ c: cscale(C1, T(t, m)), x: par(rs.x![m]) })))} = ${val(xs![t])}`) }));
        }
      }
      b.push({ t: 'band', text: 'Resolución por reducción (todas las ecuaciones a la vez)' });
      const r2 = reduccion(A, z, nms, 1);
      r2.steps.forEach((st) => b.push(S('Reducción', st)));
      const fin = r2.x ?? xs;
      if (fin) { b.push(solved(fin)); mk('kirchhoff', true, undefined, b, Iof(fin)); } else mk('kirchhoff', false, 'El sistema no tiene solución única.', []);
    } else mk('kirchhoff', false, hasJ ? 'Hay fuentes de corriente en un lazo sin ramas de árbol suficientes.' : 'No se han podido plantear las ecuaciones.', []);
  } else mk('kirchhoff', false, 'No se han podido plantear las ecuaciones de mallas.', []);

  /* --- Mallas / Cramer --- */
  const meshSys = () => {
    const g = graph!; const m = g.loops.length;
    const R: C[][] = g.loops.map((_, l) => g.loops.map((_, d) => ramas.reduce((a, _r, k) => add(a, cscale(Zrow(k), g.sigma[l][k] * g.sigma[d][k])), C0)));
    const z = g.loops.map((_, l) => loopRhs(l));
    const nmL = g.loops.map((_, l) => meshName(l));
    const branchI = (x: C[]) => ramas.map((_, k) => g.loops.reduce((a, _l, l) => add(a, cscale(x[l], g.sigma[l][k])), C0));
    return { R, z, nmL, m, branchI };
  };
  if (!graph || hasJ) {
    mk('mallas', false, hasJ ? 'Hay una fuente de corriente: haría falta el método de la supermalla.' : 'El circuito no tiene mallas independientes que se puedan numerar.', []);
    mk('cramer', false, hasJ ? 'Hay una fuente de corriente.' : 'No hay mallas.', []);
  } else {
    const { R, z, nmL, m, branchI } = meshSys();
    const common = (): SBlock[] => {
      const b: SBlock[] = [{ t: 'band', text: 'Planteamiento' }];
      b.push(S('Mallas', { que: `Dibujo ${m} corriente${m > 1 ? 's' : ''} de malla (${nmL.join(', ')}) en sentido horario.`, porque: 'Con una corriente por cada malla no necesito la ley de nudos: ya la cumplen.', pizarra: graph.loops.map((l, i) => `${nmL[i]}: malla formada por ${l.items.map((it) => nm(it.k)).join(', ')}`) }));
      b.push({ t: 'fig', mark: 'meshes', caption: 'Corrientes de malla (sentido horario)' });
      b.push(S('Ecuaciones de malla', { que: 'En cada malla: suma de f.e.m. = (suma de impedancias propias)·I propia − (impedancias compartidas)·I de las mallas vecinas.', porque: 'Una rama compartida lleva la diferencia (o suma) de las dos corrientes.', pizarra: R.map((row, i) => `${circ(i + 1)} ${eqLine(row, nmL, z[i])}`) }));
      return b;
    };
    {
      stepN = 0; const b = common();
      b.push({ t: 'band', text: 'Resolución' });
      const rs = reduccion(R, z, nmL, 1);
      rs.steps.forEach((st) => b.push(S('Resuelvo el sistema', st)));
      if (rs.x) {
        const I = branchI(rs.x);
        b.push(S('Corrientes de rama', { que: 'Cada rama real lleva la corriente de su malla; si es de dos mallas, la diferencia o la suma según los sentidos.', porque: 'Es lo que pide el problema: la corriente de cada rama.', pizarra: ramas.map((_, k) => { const terms = graph.loops.map((_l, l) => ({ c: cscale(C1, graph.sigma[l][k]), x: nmL[l] })); return `${nm(k)} = ${sumTerms(terms)} = ${val(I[k])}`; }) }));
        b.push(solved(I)); mk('mallas', true, undefined, b, Iof(I));
      } else mk('mallas', false, 'El sistema no tiene solución única.', []);
    }
    {
      stepN = 0; const b = common();
      b.push({ t: 'band', text: 'Matrices y regla de Cramer' });
      const rs = cramer(R, z, nmL);
      rs.steps.forEach((st) => b.push(S('Cramer', st)));
      if (rs.x) { const I = branchI(rs.x); b.push(solved(I)); mk('cramer', true, undefined, b, Iof(I)); } else mk('cramer', false, 'El determinante vale 0.', []);
    }
  }

  /* --- Nudos / Millman --- */
  {
    stepN = 0;
    const nodes = Array.from({ length: n - 1 }, (_, i) => i + 1);
    const Y = ramas.map((r) => (r.J ? C0 : div(C1, r.Z)));
    const G: C[][] = nodes.map(() => nodes.map(() => C0)); const rhs: C[] = nodes.map(() => C0);
    nodes.forEach((nd, i) => ramas.forEach((r, k) => {
      const sgn = r.b === nd ? 1 : r.a === nd ? -1 : 0; if (!sgn) return;
      if (r.J) { rhs[i] = add(rhs[i], cscale(r.J, -sgn)); return; }
      if (r.a !== 0) G[i][r.a - 1] = add(G[i][r.a - 1], cscale(Y[k], sgn));
      if (r.b !== 0) G[i][r.b - 1] = add(G[i][r.b - 1], cscale(Y[k], -sgn));
      rhs[i] = add(rhs[i], cscale(mul(Y[k], r.E), -sgn));
    }));
    nodes.forEach((_, i) => { if (G[i][i].re < 0) { G[i] = G[i].map((c) => cneg(c)); rhs[i] = cneg(rhs[i]); } });
    const vNames = nodes.map((nd) => `V_${names[nd]}`);
    const b: SBlock[] = [{ t: 'band', text: 'Planteamiento' }];
    b.push(S('Punto de referencia', { que: `Tomo ${names[0]} como referencia: V_${names[0]} = 0.`, porque: `Las demás tensiones se miden respecto de ${names[0]}.`, pizarra: [`V_${names[0]} = 0 V`] }));
    b.push({ t: 'fig', mark: 'nodes', caption: 'Puntos del circuito' });
    b.push(S('Corriente de cada rama', { que: 'Escribo la corriente de cada rama con la ley de Ohm: I = (V_a − V_b + E) / Z.', pizarra: ramas.map((r, k) => `${nm(k)} = ${r.J ? `${val(r.J)}` : `(V_${names[r.a]} − V_${names[r.b]}${isZero(r.E) ? '' : ` + ${par(r.E)}`}) / ${par(r.Z)}`}`) }));
    b.push(S('Ley de nudos en cada punto', { que: `Aplico KCL en ${nodes.map((nd) => names[nd]).join(', ')} y agrupo.`, pizarra: nodes.map((_, i) => `${circ(i + 1)} ${eqLine(G[i], vNames, rhs[i])}`) }));
    b.push({ t: 'band', text: 'Resolución' });
    const rs = reduccion(G, rhs, vNames, 1);
    rs.steps.forEach((st) => b.push(S('Resuelvo', st)));
    if (rs.x) {
      const vv = [C0, ...rs.x];
      const I = ramas.map((r) => (r.J ? r.J : div(add(sub(vv[r.a], vv[r.b]), r.E), r.Z)));
      b.push(S('Vuelvo a las corrientes', { que: 'Con las tensiones de los puntos calculo cada corriente de rama.', pizarra: ramas.map((r, k) => `${nm(k)} = ${r.J ? val(r.J) : `(${rect(vv[r.a])} − ${par(vv[r.b])}${isZero(r.E) ? '' : ` + ${par(r.E)}`}) / ${par(r.Z)} = ${val(I[k])}`}`) }));
      b.push(solved(I)); mk('nudos', true, undefined, b, Iof(I));
    } else mk('nudos', false, 'El sistema no tiene solución única.', []);
  }
  if (n !== 2) mk('millman', false, 'Millman se aplica cuando todas las ramas están en paralelo entre dos puntos (aquí hay más).', []);
  else {
    stepN = 0; const X = 1;
    const sg = ramas.map((r) => (r.b === X ? 1 : -1));
    const Y = ramas.map((r) => (r.J ? C0 : div(C1, r.Z)));
    const num = ramas.reduce((a, r, k) => (r.J ? add(a, cscale(r.J, sg[k])) : add(a, cscale(mul(r.E, Y[k]), sg[k]))), C0);
    const den = Y.reduce((a, y) => add(a, y), C0);
    const vx = div(num, den);
    const numTxt = ramas.map((r, k) => (r.J ? `${sg[k] < 0 ? '−' : '+'} ${par(r.J)}` : isZero(r.E) ? '' : `${sg[k] < 0 ? '−' : '+'} ${par(r.E)}/${par(r.Z)}`)).filter(Boolean).join(' ').replace(/^\+ /, '');
    const b: SBlock[] = [{ t: 'band', text: 'Aplicación directa' }];
    b.push(S('Planteamiento', { que: `Veo el circuito como ramas en paralelo entre ${names[X]} y ${names[0]}.`, porque: 'Millman da directamente la tensión común de todas las ramas.', pizarra: [`${vn(X, 0)} = ( Σ ±E / Z ) / ( Σ 1/Z )`, '(+ si el polo + de la fuente apunta hacia ' + names[X] + ', − en caso contrario)'] }));
    b.push(S('Numerador', { que: 'Calculo Σ E/Z (con su signo) de las ramas con fuente.', pizarra: [`Σ E/Z = ${numTxt || '0'} = ${rect(num)}`] }));
    b.push(S('Denominador', { que: 'Calculo Σ 1/Z de todas las ramas (conductancias o admitancias).', pizarra: [`Σ 1/Z = ${ramas.filter((r) => !r.J).map((r) => `1/${par(r.Z)}`).join(' + ')} = ${rect(den)}`] }));
    b.push(S('Tensión', { que: 'Divido.', pizarra: [`${vn(X, 0)} = ${rect(num)} / ${rect(den)} = ${val(vx)} V`] }));
    const I = ramas.map((r) => (r.J ? r.J : div(add(sub(r.a === X ? vx : C0, r.b === X ? vx : C0), r.E), r.Z)));
    b.push(S('Corriente de cada rama', { que: 'Con V ya conocida, la ley de Ohm en cada rama.', pizarra: ramas.map((r, k) => `${nm(k)} = ${r.J ? val(r.J) : `(${rect(sub(r.a === X ? vx : C0, r.b === X ? vx : C0))}${isZero(r.E) ? '' : ` + ${par(r.E)}`}) / ${par(r.Z)} = ${val(I[k])}`}`) }));
    b.push(solved(I)); mk('millman', true, undefined, b, Iof(I));
  }

  /* --- Thévenin / Norton --- */
  const L = ramas[loadIdx];
  const theveOk = M >= 2 && !L.J && n >= 2;
  const rest = ramas.filter((_, k) => k !== loadIdx);
  const thev = (() => {
    if (!theveOk) return null;
    const open = solveRamas(n, rest); if (!open) return null;
    const vth = sub(open.V[L.a], open.V[L.b]);
    const dead = rest.filter((r) => !r.J).map((r) => ({ ...r, E: C0 }));
    const test = solveRamas(n, [...dead, { a: L.b, b: L.a, Z: C0, E: C0, J: C1 }]); // 1 A de b → a por fuera: V_ab = Zth·(…)
    if (!test) return null;
    const zth = sub(test.V[L.a], test.V[L.b]);
    const short = solveRamas(n, [...rest, { a: L.a, b: L.b, Z: C0, E: C0 }]);
    const isc = short ? short.I[rest.length] : null;
    return { vth, zth, isc };
  })();
  const parallelRest = rest.every((r) => (r.a === L.a && r.b === L.b) || (r.a === L.b && r.b === L.a));
  const finishLoad = (b: SBlock[], title: string, vth: C, zth: C, norton: boolean, isc: C | null) => {
    const IL = div(add(vth, L.E), add(zth, L.Z));
    b.push(S(title, { que: `Reconecto la carga ${ramaDesc(L)} al equivalente y calculo ${nm(loadIdx)}.`, porque: 'Ahora el circuito es de una sola malla (o dos nudos): se resuelve con la ley de Ohm.', pizarra: norton
      ? [`${nm(loadIdx)} = ( I_N·Z_N ${isZero(L.E) ? '' : `+ E_c `}) / ( Z_N + Z_c ) = ( ${par(isc!)}·${par(zth)}${isZero(L.E) ? '' : ` + ${par(L.E)}`} ) / ( ${par(zth)} + ${par(L.Z)} ) = ${val(IL)} A`]
      : [`${nm(loadIdx)} = ( V_Th${isZero(L.E) ? '' : ` + E_c`} ) / ( Z_Th + Z_c ) = ( ${par(vth)}${isZero(L.E) ? '' : ` + ${par(L.E)}`} ) / ( ${par(zth)} + ${par(L.Z)} ) = ${val(IL)} A`] }));
    return IL;
  };
  const baseTh = (tag: 'Th' | 'N') => {
    stepN = 0;
    const t = thev!; const b: SBlock[] = [{ t: 'band', text: `Equivalente ${tag === 'Th' ? 'de Thévenin' : 'de Norton'} visto desde ${names[L.a]} y ${names[L.b]}` }];
    b.push(S('Quito la carga', { que: `Desconecto la rama que quiero estudiar (${nm(loadIdx)}: ${ramaDesc(L)}) y me quedo con el resto del circuito, con los puntos ${names[L.a]} y ${names[L.b]} abiertos.`, porque: 'Thévenin y Norton sustituyen todo lo demás por una sola fuente con una impedancia.', pizarra: [`Carga: ${ramaDesc(L)}  (Z_c = ${rect(L.Z)} Ω${isZero(L.E) ? '' : `, E_c = ${rect(L.E)} V`})`] }));
    b.push({ t: 'fig', mark: 'nodes', caption: `Puntos ${names[L.a]} y ${names[L.b]}` });
    b.push(S(`Tensión en vacío V_Th = ${vn(L.a, L.b)}`, { que: `Calculo la tensión entre ${names[L.a]} y ${names[L.b]} con la carga desconectada.`, porque: parallelRest ? 'Las ramas que quedan están en paralelo: uso Millman.' : 'Resuelvo el circuito que queda.', pizarra: parallelRest ? [`V_Th = ( Σ ±E/Z ) / ( Σ 1/Z ) = ${val(t.vth)} V`] : [`V_Th = V_${names[L.a]} − V_${names[L.b]} = ${val(t.vth)} V`] }));
    b.push(S('Impedancia equivalente Z_Th', { que: 'Anulo las fuentes de tensión (las sustituyo por un cable) y calculo la impedancia vista desde los dos puntos.', porque: 'Una fuente de tensión ideal anulada es un cortocircuito.', pizarra: parallelRest && rest.length > 1 ? [`Z_Th = ${rest.map((r) => par(r.Z)).join(' ∥ ')} = 1 / ( ${rest.map((r) => `1/${par(r.Z)}`).join(' + ')} ) = ${val(t.zth)} Ω`] : [`Z_Th = ${val(t.zth)} Ω`] }));
    return { b, t };
  };
  if (!thev) { const why = L.J ? 'La carga elegida es una fuente de corriente.' : 'No se puede reducir el circuito respecto a esa rama.'; mk('thevenin', false, why, []); mk('norton', false, why, []); }
  else {
    {
      const { b, t } = baseTh('Th');
      b.push(S('Circuito equivalente', { que: `Dibujo la fuente V_Th = ${rect(t.vth)} V en serie con Z_Th = ${rect(t.zth)} Ω.`, pizarra: [`V_Th = ${val(t.vth)} V   Z_Th = ${val(t.zth)} Ω`] }));
      const IL = finishLoad(b, 'Corriente por la carga', t.vth, t.zth, false, null);
      b.push({ t: 'box', kind: 'result', title: 'Corriente de la carga', lines: [`${nm(loadIdx)} = ${val(IL)} A`] });
      mk('thevenin', true, undefined, b, { [L.id]: IL });
    }
    {
      const { b, t } = baseTh('N');
      const isc = t.isc ?? div(t.vth, t.zth);
      b.push(S('Corriente de Norton I_N', { que: 'Cortocircuito los puntos y calculo la corriente que pasa por el cortocircuito (o I_N = V_Th / Z_Th).', pizarra: [`I_N = V_Th / Z_Th = ${par(t.vth)} / ${par(t.zth)} = ${val(div(t.vth, t.zth))} A`, ...(t.isc ? [`Con los puntos en cortocircuito: ${val(t.isc)} A`] : [])] }));
      const IL = finishLoad(b, 'Corriente por la carga', t.vth, t.zth, true, isc);
      b.push({ t: 'box', kind: 'result', title: 'Corriente de la carga', lines: [`${nm(loadIdx)} = ${val(IL)} A`] });
      mk('norton', true, undefined, b, { [L.id]: IL });
    }
  }

  /* --- Superposición --- */
  {
    stepN = 0;
    const sources: { label: string; k: number; E?: C; J?: C }[] = [];
    ramas.forEach((r, k) => r.parts.forEach((q) => { if (q.kind === 'E' && !q.internal) sources.push({ label: q.label, k, E: srcE(q) }); else if (q.kind === 'J') sources.push({ label: q.label, k, J: r.J }); }));
    if (sources.length < 2) mk('superposicion', false, 'Con una sola fuente no hay nada que superponer.', []);
    else {
      const b: SBlock[] = [{ t: 'band', text: 'Una fuente cada vez' }];
      const partial: C[][] = [];
      let ok = true;
      sources.forEach((s, si) => {
        const rs = ramas.map((r, k) => ({ a: r.a, b: r.b, Z: r.Z, E: k === s.k && s.E ? s.E : C0, J: k === s.k && s.J ? s.J : undefined })).filter((r, k) => !(ramas[k].J && !(k === s.k && s.J)));
        const idx: number[] = []; let c = 0; ramas.forEach((_, k) => { idx.push(ramas[k].J && !(k === s.k && s.J) ? -1 : c++); });
        const sol = solveRamas(n, rs); if (!sol) { ok = false; return; }
        const Ik = ramas.map((_, k) => (idx[k] < 0 ? C0 : sol.I[idx[k]]));
        partial.push(Ik);
        const apag = sources.filter((_, j) => j !== si).map((q) => (q.J ? `${pretty(q.label)} (fuente de corriente → circuito abierto)` : `${pretty(q.label)} (fuente de tensión → cable)`));
        b.push(S(`Sólo actúa ${pretty(s.label)}`, { que: `Dejo ${pretty(s.label)} y anulo las demás: ${apag.join(', ')}.`, porque: 'En un circuito lineal el efecto de cada fuente se puede calcular por separado y luego sumar.', pizarra: Ik.map((x, k) => `${nm(k)}(${pretty(s.label)}) = ${val(x)} A`) }));
      });
      if (!ok) mk('superposicion', false, 'No se puede resolver alguno de los circuitos parciales.', []);
      else {
        const tot = ramas.map((_, k) => partial.reduce((a, p) => add(a, p[k]), C0));
        b.push(S('Sumo los efectos', { que: 'Sumo, rama por rama, las corrientes de cada fuente (con su signo).', pizarra: ramas.map((_, k) => `${nm(k)} = ${partial.map((p) => par(p[k])).join(' + ')} = ${val(tot[k])} A`) }));
        b.push({ t: 'table', head: ['Rama', ...sources.map((s) => `Sólo ${pretty(s.label)}`), 'Total'], rows: ramas.map((_, k) => [nm(k), ...partial.map((p) => val(p[k])), val(tot[k])]) });
        b.push(solved(tot)); mk('superposicion', true, undefined, b, Iof(tot));
      }
    }
  }

  /* --- Potencias en CA --- */
  if (!ac) mk('potencias', false, 'Solo para circuitos de corriente alterna.', []);
  else {
    stepN = 0;
    const b: SBlock[] = [{ t: 'band', text: 'Potencia compleja' }];
    const Sd = srcP.reduce((a, s) => add(a, s.S), C0);
    b.push(S('Potencia de cada fuente', { que: 'Calculo S = V · I* (conjugada de la corriente) en cada fuente.', porque: 'La parte real es la potencia activa P (W), la imaginaria la reactiva Q (var).', pizarra: srcP.map((s) => `S(${pretty(s.label)}) = ${par(srcOfC(ramas, s.label))}·${par(cconj(net.I[ramas[s.k].id]))} = ${rect(s.S)} VA`) }));
    b.push(S('Potencia de cada receptor', { que: 'En cada rama: P = R·I², Q = X·I², con I el valor eficaz.', pizarra: consP.filter((c) => Math.abs(c.P) + Math.abs(c.Q) > 1e-12).map((c) => `${nm(c.k)}:  P = ${nf(c.P)} W,  Q = ${nf(c.Q)} var`) }));
    const Pc = consP.reduce((a, c) => a + c.P, 0), Qc = consP.reduce((a, c) => a + c.Q, 0);
    b.push(S('Balance', { que: 'La potencia que entregan las fuentes es la que consumen los receptores.', pizarra: [`ΣP: ${nf(Sd.re)} W (fuentes) = ${nf(Pc)} W (receptores)`, `ΣQ: ${nf(Sd.im)} var (fuentes) = ${nf(Qc)} var (receptores)`] }));
    const sAbs = abs(Sd), fp = sAbs > 1e-12 ? Sd.re / sAbs : 1;
    b.push(S('Triángulo de potencias', { que: 'Calculo la potencia aparente y el factor de potencia.', pizarra: [`S = √(P² + Q²) = √(${nf(Sd.re)}² + ${nf(Sd.im)}²) = ${nf(sAbs)} VA`, `cos φ = P / S = ${nf(fp)}   (φ = ${nf(Math.atan2(Sd.im, Sd.re) * 180 / Math.PI)}°, ${Sd.im > 0 ? 'inductivo' : Sd.im < 0 ? 'capacitivo' : 'resistivo'})`] }));
    b.push({ t: 'phasors', title: 'Diagrama fasorial de las corrientes de rama', items: ramas.map((r, k) => ({ label: nm(k), v: net.I[r.id] })) });
    if (Sd.im > 1e-6 && fp >= 0.95) b.push(S('Factor de potencia', { que: `cos φ = ${nf(fp)} ya es mayor o igual que 0,95.`, porque: 'La compañía suele exigir cos φ ≥ 0,95; no hace falta compensar.', pizarra: [`cos φ = ${nf(fp)} ≥ 0,95  ✓`] }));
    if (Math.abs(Sd.im) > 1e-6 && fp < 0.95 && Sd.im > 0) {
      const target = 0.95; const phi2 = Math.acos(target); const Qn = Sd.re * Math.tan(phi2);
      const Qcap = Sd.im - Qn; const U = (net.V[1] ? abs(net.V[1]) : abs(srcP.length ? srcOfC(ramas, srcP[0].label) : C1)) || 1;
      b.push(S('Compensación a cos φ = 0,95', { que: 'Para elevar el factor de potencia pongo un condensador en paralelo con la carga.', porque: 'Su potencia reactiva negativa cancela parte de la reactiva inductiva; la activa no cambia.', pizarra: [`Q_C = P·(tan φ − tan φ') = ${nf(Sd.re)}·(${nf(Sd.im / Sd.re)} − ${nf(Math.tan(phi2))}) = ${nf(Qcap)} var`, `C = Q_C / (ω·U²) = ${nf(Qcap)} / (${nf(net.omega)}·${nf(U)}²) = ${nf((Qcap / (net.omega * U * U)) * 1e6)} µF`, '(U = tensión eficaz en bornes de la carga; se toma la del primer punto)'] }));
    }
    mk('potencias', true, undefined, b, net.I);
  }

  if (n < 2) methods.forEach((m) => { if (m.id !== 'ohm' && m.id !== 'potencias') { m.applicable = false; m.why = 'Circuito de una sola malla: basta la ley de Ohm con la impedancia total.'; m.blocks = []; m.I = undefined; } });

  /* ---------- Cierre: Comprobaciones, Interpretación, Reflexión ---------- */
  const cierre: SBlock[] = [];
  const kcl = Array.from({ length: n - 1 }, (_, i) => i + 1).map((nd) => { const s = ramas.reduce((a, r) => add(a, r.b === nd ? net.I[r.id] : r.a === nd ? cneg(net.I[r.id]) : C0), C0); return `Punto ${names[nd]}: Σ entran − Σ salen = ${nf(abs(s), 3)} → ${abs(s) < 1e-6 ? 'se cumple ✓' : 'NO se cumple'}`; });
  const chk: string[] = [...kcl];
  if (n === 2) ramas.forEach((r, k) => chk.push(`${vn(1, 0)} por ${nm(k)}: ${r.J ? '—' : `${isZero(r.E) ? '' : `${rect(r.E)} ${(r.b === 1 ? '−' : '+')} `}${par(r.Z)}·${par(net.I[r.id])}`} = ${r.J ? '—' : rect(r.a === 1 ? sub(mul(r.Z, net.I[r.id]), r.E) : sub(r.E, mul(r.Z, net.I[r.id])))}`));
  if (!ac) chk.push(`Potencias: entregada ${nf(Pdel)} W ${Math.abs(Pdel - Pcon) < 1e-6 ? '=' : '≠'} consumida ${nf(Pcon)} W`);
  cierre.push({ t: 'box', kind: 'check', title: 'Comprobaciones', lines: chk });
  const interp: string[] = [];
  ramas.forEach((r, k) => { const i = net.I[r.id]; if (isReal(i) && i.re < -1e-9) interp.push(`${nm(k)} sale negativa: la corriente real va de ${names[r.b]} a ${names[r.a]}${r.parts.some((q) => q.kind === 'E') ? `; esa pila está siendo cargada (consume potencia) en vez de entregarla` : ''}.`); });
  srcP.forEach((s) => { if (!ac && s.S.re < -1e-9) interp.push(`${pretty(s.label)} absorbe ${nf(-s.S.re)} W: funciona como receptor.`); });
  if (n === 2) interp.push(`${vn(1, 0)} = ${val(V(1, 0))} V es la tensión común a todas las ramas en paralelo.`);
  if (ac) interp.push(`Los fasores se dan en valor eficaz, con la fase tomada respecto de la fuente de referencia.`);
  if (interp.length) cierre.push({ t: 'box', kind: 'interp', title: 'Interpretación', lines: interp });
  if (n === 2 && M >= 3) {
    const op = solveRamas(n, ramas.filter((_, k) => k !== loadIdx));
    if (op) cierre.push({ t: 'box', kind: 'reflex', title: 'Reflexión', lines: [`¿Qué pasaría si se desconectara ${ramaDesc(L)}?  La tensión ${vn(L.a, L.b)} pasaría de ${val(V(L.a, L.b))} V a ${val(sub(op.V[L.a], op.V[L.b]))} V (circuito en vacío para esa rama).`, 'Cada rama de un circuito en paralelo influye en la tensión común: al quitar una, cambia el reparto de corrientes en las demás.'] });
  }
  return { ok: true, enunciado: enun, resultado, methods, cierre, net, graph, loadId: L.id };
}

function srcOfAbs(ramas: Rama[], label: string): number {
  for (const r of ramas) for (const q of r.parts) if (q.label === label && q.kind === 'E') return abs(q.v);
  return 0;
}
function srcOfC(ramas: Rama[], label: string): C {
  for (const r of ramas) for (const q of r.parts) if (q.label === label && q.kind === 'E') return srcE(q);
  return C0;
}
export { deg, nf, rect, pol, cscale };
