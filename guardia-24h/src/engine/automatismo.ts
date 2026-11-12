// Simulador de circuitos de mando de automatismos cableados.
// Modelo: terminales unidos por cables; los contactos cierran o abren según el estado.
// Una bobina (contactor, temporizador) o un piloto se activa si su terminal 1 está en el potencial L y su terminal 2 en N.
export type TipoComp = 'fuente' | 'pulsador_na' | 'pulsador_nc' | 'termico' | 'contactor' | 'temporizador' | 'piloto';
export interface Comp { id: string; tipo: TipoComp; etiqueta: string; retardo?: number }
export type Cable = [string, string];

export interface Grupo { nombre: string; terms: [string, string] }
/** Terminales agrupados por función (numeración normalizada habitual). */
export const GRUPOS: Record<TipoComp, Grupo[]> = {
  fuente: [{ nombre: 'Alimentación', terms: ['L', 'N'] }],
  pulsador_na: [{ nombre: 'Contacto NA', terms: ['13', '14'] }],
  pulsador_nc: [{ nombre: 'Contacto NC', terms: ['11', '12'] }],
  termico: [{ nombre: 'Contacto NC', terms: ['95', '96'] }],
  contactor: [
    { nombre: 'Bobina', terms: ['A1', 'A2'] }, { nombre: 'NA', terms: ['13', '14'] }, { nombre: 'NC', terms: ['21', '22'] },
    { nombre: 'NA', terms: ['33', '34'] }, { nombre: 'NC', terms: ['41', '42'] },
  ],
  temporizador: [{ nombre: 'Bobina', terms: ['A1', 'A2'] }, { nombre: 'NC temp.', terms: ['15', '16'] }, { nombre: 'NA temp.', terms: ['17', '18'] }],
  piloto: [{ nombre: 'Piloto', terms: ['X1', 'X2'] }],
};
export const terminalesDe = (t: TipoComp): string[] => GRUPOS[t].flatMap((g) => g.terms);

export interface Sim {
  comps: Comp[]; cables: Cable[];
  pulsados: Set<string>; disparados: Set<string>;
  on: Record<string, boolean>; t: Record<string, number>; hecho: Record<string, boolean>;
  corto: boolean; activos: Record<string, boolean>; ambiguo: boolean;
}

export const newSim = (comps: Comp[], cables: Cable[]): Sim => {
  const s: Sim = { comps, cables, pulsados: new Set(), disparados: new Set(), on: {}, t: {}, hecho: {}, corto: false, activos: {}, ambiguo: false };
  for (const c of comps) { s.on[c.id] = false; s.t[c.id] = 0; s.hecho[c.id] = false; }
  resuelve(s);
  return s;
};

/** Contactos conmutados por el estado actual: pares de terminales que cierran. */
function cerrados(s: Sim): Cable[] {
  const out: Cable[] = [];
  for (const c of s.comps) {
    const par = (a: string, b: string) => out.push([`${c.id}.${a}`, `${c.id}.${b}`]);
    switch (c.tipo) {
      case 'pulsador_na': if (s.pulsados.has(c.id)) par('13', '14'); break;
      case 'pulsador_nc': if (!s.pulsados.has(c.id)) par('11', '12'); break;
      case 'termico': if (!s.disparados.has(c.id)) par('95', '96'); break;
      case 'contactor': if (s.on[c.id]) { par('13', '14'); par('33', '34'); } else { par('21', '22'); par('41', '42'); } break;
      case 'temporizador': if (s.hecho[c.id]) par('17', '18'); else par('15', '16'); break;
    }
  }
  return out;
}

function conexiones(s: Sim) {
  const padre = new Map<string, string>();
  const raiz = (x: string): string => { let r = x; while (padre.get(r) && padre.get(r) !== r) r = padre.get(r)!; padre.set(x, r); return r; };
  const une = (a: string, b: string) => { if (!padre.has(a)) padre.set(a, a); if (!padre.has(b)) padre.set(b, b); padre.set(raiz(a), raiz(b)); };
  for (const [a, b] of [...s.cables, ...cerrados(s)]) une(a, b);
  const fuente = s.comps.find((c) => c.tipo === 'fuente')?.id ?? 'G';
  const L = `${fuente}.L`, N = `${fuente}.N`;
  if (!padre.has(L)) padre.set(L, L);
  if (!padre.has(N)) padre.set(N, N);
  return { raiz, L, N };
}

/** Calcula qué receptores están alimentados con el estado actual y detecta cortocircuito. */
function alimentados(s: Sim): Record<string, boolean> {
  const { raiz, L, N } = conexiones(s);
  const gl = raiz(L), gn = raiz(N);
  const act: Record<string, boolean> = {};
  const alimenta = (a: string, b: string) => { const ra = raiz(a), rb = raiz(b); return ra === gl && rb === gn; };
  for (const c of s.comps) {
    if (c.tipo === 'contactor' || c.tipo === 'temporizador') act[c.id] = alimenta(`${c.id}.A1`, `${c.id}.A2`);
    if (c.tipo === 'piloto') act[c.id] = alimenta(`${c.id}.X1`, `${c.id}.X2`);
  }
  s.corto = gl === gn;
  return act;
}

function resuelve(s: Sim) {
  for (let i = 0; i < 12; i++) {
    const act = alimentados(s);
    let cambia = false;
    for (const c of s.comps) if (c.tipo === 'contactor' && s.on[c.id] !== Boolean(act[c.id])) { s.on[c.id] = Boolean(act[c.id]); cambia = true; }
    s.activos = act;
    if (!cambia) { s.ambiguo = false; return; }
  }
  s.ambiguo = true;
}

/** Avanza el tiempo (s) en pasos de 0,05 s: los temporizadores cuentan mientras su bobina está alimentada. */
export function avanza(s: Sim, seg: number) {
  const dt = 0.05;
  for (let t = 0; t < seg - 1e-9; t += dt) {
    for (const c of s.comps) if (c.tipo === 'temporizador') {
      if (s.activos[c.id]) { s.t[c.id] = (s.t[c.id] ?? 0) + dt; if (s.t[c.id]! >= (c.retardo ?? 0)) s.hecho[c.id] = true; }
      else { s.t[c.id] = 0; s.hecho[c.id] = false; }
    }
    resuelve(s);
  }
}

export type Accion = string; // press:S2 | release:S2 | pulse:S2 | trip:F1 | reset:F1 | wait:5
export function aplica(s: Sim, a: Accion) {
  const [v, arg = ''] = a.split(':');
  switch (v) {
    case 'press': s.pulsados.add(arg); break;
    case 'release': s.pulsados.delete(arg); break;
    case 'pulse': s.pulsados.add(arg); resuelve(s); avanza(s, 0.1); s.pulsados.delete(arg); break;
    case 'trip': s.disparados.add(arg); break;
    case 'reset': s.disparados.delete(arg); break;
    case 'wait': avanza(s, Number(arg)); return;
  }
  resuelve(s); avanza(s, 0.1);
}

export interface Paso { acc: Accion; esperado?: Record<string, boolean> }
export interface Escenario { nombre: string; pasos: Paso[]; nunca?: string[][] }
export interface ResultadoEsc { nombre: string; ok: boolean; motivo?: string }

/** Estado observable de un id: 'corto' o receptor alimentado. */
export const lee = (s: Sim, id: string): boolean => (id === 'corto' ? s.corto : s.comps.find((c) => c.id === id)?.tipo === 'contactor' ? Boolean(s.on[id]) : Boolean(s.activos[id]));

/** Ejecuta los escenarios de comprobación sobre un cableado y devuelve el resultado de cada uno. */
export function evaluaEscenarios(comps: Comp[], cables: Cable[], escenarios: Escenario[]): { resultados: ResultadoEsc[]; fraccion: number } {
  const resultados: ResultadoEsc[] = escenarios.map((e) => {
    const s = newSim(comps, cables);
    for (const [i, p] of e.pasos.entries()) {
      aplica(s, p.acc);
      if (s.corto) return { nombre: e.nombre, ok: false, motivo: 'Cortocircuito: fase y neutro unidos sin receptor.' };
      if (s.ambiguo) return { nombre: e.nombre, ok: false, motivo: 'El circuito oscila (realimentación inestable).' };
      for (const grupo of e.nunca ?? []) if (grupo.every((g) => lee(s, g))) return { nombre: e.nombre, ok: false, motivo: `Estado prohibido: ${grupo.join(' y ')} activos a la vez.` };
      for (const [id, v] of Object.entries(p.esperado ?? {})) {
        if (lee(s, id) !== v) return { nombre: e.nombre, ok: false, motivo: `Paso ${i + 1} (${p.acc}): ${id} debería estar ${v ? 'activo' : 'inactivo'}.` };
      }
    }
    return { nombre: e.nombre, ok: true };
  });
  // El primer escenario es la función básica: sin ella, no hay puntuación aunque pasen los negativos.
  const fraccion = resultados[0]?.ok ? resultados.filter((r) => r.ok).length / resultados.length : 0;
  return { resultados, fraccion };
}
