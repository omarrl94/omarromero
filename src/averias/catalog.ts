/**
 * «Parte de avería»: catálogo de averías y de reparaciones, definidas como DATOS.
 * Cada avería dice qué síntoma da, qué efectos físicos introduce en la simulación (tipos de efecto genéricos que
 * interpreta model.ts), qué medidas la delatan, cuál es la reparación correcta y cuánto cuesta equivocarse.
 * Añadir una avería nueva = añadir un objeto aquí; solo hace falta tocar model.ts si se necesita un tipo de efecto nuevo.
 *
 * Los valores de diseño del juego (tiempos, costes de mano de obra, umbrales simplificados) NO son normativos.
 */
import { DEV_MAT, cableMat, piaMat } from '../data/materiales';

export type Effect =
  | { t: 'leak'; rec: number; ohms: number } // fuga a tierra en un receptor
  | { t: 'short'; rec: number } // cortocircuito fase-neutro en una toma
  | { t: 'openN' } // neutro suelto en la caja de conexiones
  | { t: 'openPE'; rec: number } // conductor de protección interrumpido
  | { t: 'travelerTied' }; // viajero de la conmutada mal conectado

export interface Rec { name: string; w: number; extra?: boolean }
export interface Setup { circuit: string; circuitName: string; inA: number; section: number; length: number; recs: Rec[]; conmutada?: boolean }
export interface Case { setup: Setup; effects: Effect[] }
export interface Point { id: string; label: string }

/** Umbrales simplificados del juego (no vienen de una norma; ver la nota del README). */
export const RULES = {
  /** El térmico dispara si la corriente supera este múltiplo de In de forma sostenida. */
  thermalFactor: 1.45,
  /** El diferencial de 30 mA dispara con una fuga igual o mayor. */
  rcdTripA: 0.03,
  /** Tensión mínima aceptable en un receptor (en % de la nominal) para dar la instalación por buena. */
  minVoltagePct: 90,
};

export interface FaultDef {
  id: string; level: 1 | 2 | 3; cause: string;
  /** Circuitos donde puede aparecer, por orden de preferencia (el primero que exista en la vivienda). */
  circuits: string[];
  /** Mínimo de receptores que necesita el circuito. */
  minRecs?: number;
  prepare(base: Setup, r: () => number): { setup: Setup; effects: Effect[]; point: string };
  symptom(setup: Setup, room: string): string;
  /** Qué medida la delata (para el parte y la explicación final). */
  evidence: string;
  explain: string;
  /** Reparaciones que hacen falta (con su destino). Cualquier otra cuenta como pieza cambiada sin estar averiada. */
  required(point: string): { repair: string; target: string }[];
  par: { measures: number; minutes: number };
}

const EXTRAS: Rec[] = [{ name: 'Radiador eléctrico', w: 2000, extra: true }, { name: 'Plancha', w: 2200, extra: true }, { name: 'Freidora', w: 1800, extra: true }, { name: 'Calefactor', w: 1500, extra: true }];

export const FAULTS: FaultDef[] = [
  {
    id: 'cortocircuito_toma', level: 1, cause: 'Cortocircuito en una toma', circuits: ['C2', 'C5'],
    prepare: (b) => ({ setup: b, effects: [{ t: 'short', rec: 0 }], point: 'rec:0' }),
    symptom: (s) => `«Estaba enchufando el cargador en la zona “${s.recs[0].name}” y hubo un chispazo. Desde entonces ha saltado el automático y no funcionan los enchufes de esa parte de la casa.»`,
    evidence: 'Con la instalación sin tensión (IGA abierto), medir la resistencia entre fase y neutro de la toma: ≈ 0 Ω.',
    explain: 'La toma dañada unía fase y neutro. La corriente de cortocircuito (del orden de cientos de amperios) supera el umbral magnético del magnetotérmico y este dispara al instante. Al rearmar vuelve a saltar mientras la toma siga así.',
    required: (p) => [{ repair: 'sustituir_toma', target: p }],
    par: { measures: 2, minutes: 45 },
  },
  {
    id: 'sobrecarga', level: 1, cause: 'Sobrecarga del circuito', circuits: ['C5', 'C2'],
    prepare: (b) => {
      const target = 1.6 * b.inA * 230; let w = b.recs.reduce((a, r) => a + r.w, 0); const extra: Rec[] = [];
      for (const e of EXTRAS) { if (w >= target) break; extra.push({ ...e }); w += e.w; }
      return { setup: { ...b, recs: [...b.recs, ...extra] }, effects: [], point: 'linea' };
    },
    symptom: () => '«Cuando enciendo a la vez el radiador, la plancha y el resto de cosas en la cocina, se va la luz de esa zona. Si espero un rato y subo el automático, aguanta un poco y vuelve a saltar.»',
    evidence: 'Medir la intensidad en la cabecera del circuito (con la pinza amperimétrica rodeando la fase, o A~ en serie): supera con mucho el calibre del magnetotérmico.',
    explain: 'Había más receptores conectados de los que admite el circuito. La intensidad total superaba el calibre del magnetotérmico durante un tiempo y el térmico dispara: es la protección funcionando bien. La solución es repartir la carga en otro circuito, no subir el calibre (el cable no lo aguantaría).',
    required: () => [{ repair: 'repartir_carga', target: 'linea' }],
    par: { measures: 2, minutes: 40 },
  },
  {
    id: 'neutro_suelto', level: 2, cause: 'Neutro suelto en una caja', circuits: ['C2', 'C1'], minRecs: 2,
    prepare: (b) => ({ setup: b, effects: [{ t: 'openN' }], point: 'caja' }),
    symptom: () => '«En varias habitaciones no hay luz ni funcionan los enchufes, pero en el cuadro no ha saltado nada.»',
    evidence: 'Medir V~ entre fase y neutro en un receptor: 0 V; entre fase y tierra: 230 V. La tensión llega, pero no hay retorno.',
    explain: 'Un borne de neutro de la caja de conexiones estaba flojo: la fase llega a los receptores, pero la corriente no tiene camino de vuelta, así que no funcionan y ninguna protección actúa. Entre fase y tierra sí hay 230 V.',
    required: (p) => [{ repair: 'reapretar_borne', target: p }],
    par: { measures: 3, minutes: 50 },
  },
  {
    id: 'derivacion', level: 2, cause: 'Derivación a tierra en un receptor', circuits: ['C4'],
    prepare: (b) => ({ setup: b, effects: [{ t: 'leak', rec: 0, ohms: 1200 }], point: 'rec:0' }),
    symptom: (s) => `«Salta el diferencial cuando pongo ${s.recs[0].name.toLowerCase()}. Antes no pasaba.»`,
    evidence: 'Con la pinza rodeando fase y neutro juntos del receptor se lee la fuga (cientos de mA); o, con el IGA abierto y el receptor enchufado, medir la resistencia entre fase y tierra: baja (≈ 1 kΩ) en lugar de abierta.',
    explain: 'El aislamiento del receptor estaba deteriorado y parte de la corriente se iba a tierra por la carcasa. El diferencial de 30 mA detecta esa fuga y dispara. El resto del circuito está bien: el fallo aparece solo cuando se conecta ese receptor.',
    required: (p) => [{ repair: 'sustituir_receptor', target: p }],
    par: { measures: 3, minutes: 55 },
  },
  {
    id: 'conmutada', level: 2, cause: 'Conmutada mal cableada', circuits: ['C1'],
    prepare: (b) => ({ setup: { ...b, conmutada: true, recs: [{ name: 'Luz del pasillo', w: 300 }] }, effects: [{ t: 'travelerTied' }], point: 'conmutada' }),
    symptom: () => '«La luz del pasillo solo la puedo encender y apagar desde un extremo; desde el otro interruptor no hace nada.»',
    evidence: 'Accionar cada conmutador y medir V~ en la lámpara; revisar los viajeros: los dos hilos entre conmutadores deben ir a bornes distintos.',
    explain: 'Los dos hilos viajeros iban al mismo borne de uno de los conmutadores, así que ese conmutador no cambiaba nada y la luz solo respondía al otro. Hay que llevar cada viajero a su borne.',
    required: () => [{ repair: 'recablear', target: 'conmutada' }],
    par: { measures: 2, minutes: 35 },
  },
  {
    id: 'proteccion_sobredim', level: 3, cause: 'Protección sobredimensionada para la sección', circuits: ['C2'],
    prepare: (b) => {
      const w = 1600; return { setup: { ...b, section: 1.5, inA: 20, recs: [{ name: b.recs[0]?.name ?? 'Tomas', w }] }, effects: [], point: 'pia' };
    },
    symptom: () => '«No me falla nada, pero la revisión de la aseguradora dice que hay que mirar el cuadro antes de renovar la póliza.»',
    evidence: 'Comparar el calibre del magnetotérmico con la sección de la línea (ficha de la instalación) y medir con la pinza la intensidad que circula.',
    explain: 'El magnetotérmico (20 A) es mayor que la intensidad admisible del cable (1,5 mm² → 15,5 A). Ante una sobrecarga el cable se calentaría sin que la protección actuase. Debe cumplirse In ≤ Iz: hay que bajar el calibre.',
    required: () => [{ repair: 'cambiar_pia', target: 'pia' }],
    par: { measures: 1, minutes: 30 },
  },
  {
    id: 'caida_tension', level: 3, cause: 'Sección insuficiente (caída de tensión excesiva)', circuits: ['C2', 'C5'],
    prepare: (b) => ({ setup: { ...b, section: 2.5, inA: 16, length: 95, recs: [{ name: 'Taller del jardín (compresor)', w: 2500 }] }, effects: [], point: 'linea' }),
    symptom: () => '«En el taller del fondo del jardín las luces parpadean y el compresor va flojo, aunque en la casa todo va bien.»',
    evidence: 'Medir V~ a la salida del cuadro y en el receptor, con carga: la diferencia es la caída de tensión de la línea.',
    explain: 'La línea es muy larga para su sección: la caída de tensión supera el 5 % admitido para receptores (ITC-BT-19) y el receptor recibe una tensión baja. Hay que aumentar la sección.',
    required: () => [{ repair: 'cambiar_seccion', target: 'linea' }],
    par: { measures: 2, minutes: 45 },
  },
  {
    id: 'pe_interrumpido', level: 3, cause: 'Conductor de protección interrumpido', circuits: ['C2', 'C5', 'C1'],
    prepare: (b) => { const i = b.recs.length - 1; return { setup: b, effects: [{ t: 'openPE', rec: i }], point: `pe:${i}` }; },
    symptom: (s) => `«Todo funciona perfectamente. Solo pido que alguien compruebe la toma de tierra de la zona “${s.recs[s.recs.length - 1].name}”, por si acaso.»`,
    evidence: 'Con el IGA abierto, medir continuidad entre la barra de tierra y la toma: sin continuidad (OL o una lectura de megaohmios). Con tensión, entre fase y tierra de esa toma no aparecen los 230 V (una lectura muy baja o inestable).',
    explain: 'El conductor de protección estaba cortado: el receptor funciona igual, pero si hubiese una derivación la carcasa quedaría con tensión y el diferencial no tendría por dónde detectarla. Solo se detecta midiendo la continuidad de tierra.',
    required: (p) => [{ repair: 'reapretar_borne', target: p }],
    par: { measures: 2, minutes: 40 },
  },
];
export const faultOf = (id: string) => FAULTS.find((f) => f.id === id)!;

/* ───────── Reparaciones ───────── */
export interface RepairDef { id: string; name: string; help: string; targets: (pointId: string) => boolean; param?: 'calibre' | 'seccion'; minutes: number; cost(s: Setup, param?: number): number }
const LABOR = 30;
export const REPAIRS: RepairDef[] = [
  { id: 'cambiar_pia', name: 'Cambiar el magnetotérmico', help: 'Pon otro calibre.', targets: (p) => p === 'pia', param: 'calibre', minutes: 20, cost: (_s, a = 16) => piaMat(a).price + LABOR },
  { id: 'cambiar_seccion', name: 'Cambiar la sección de la línea', help: 'Rehace la línea con otra sección.', targets: (p) => p === 'linea', param: 'seccion', minutes: 60, cost: (s, sec = 2.5) => Math.round(s.length * 3 * cableMat(sec).price) + 80 },
  { id: 'reapretar_borne', name: 'Reapretar o rehacer un borne', help: 'Para una conexión suelta o cortada.', targets: (p) => p === 'caja' || p.startsWith('pe:'), minutes: 10, cost: () => 15 },
  { id: 'sustituir_toma', name: 'Sustituir la toma', help: 'Cambia el mecanismo de enchufe.', targets: (p) => p.startsWith('rec:'), minutes: 20, cost: () => Math.round(DEV_MAT.toma.price) + LABOR },
  { id: 'sustituir_receptor', name: 'Sustituir el receptor', help: 'Cambia el aparato o la lámpara.', targets: (p) => p.startsWith('rec:'), minutes: 30, cost: () => 140 },
  { id: 'recablear', name: 'Recablear los conmutadores', help: 'Rehace la conexión de los viajeros.', targets: (p) => p === 'conmutada', minutes: 25, cost: () => 35 },
  { id: 'repartir_carga', name: 'Repartir la carga en otro circuito', help: 'Saca receptores a un circuito nuevo.', targets: (p) => p === 'linea', minutes: 60, cost: () => Math.round(piaMat(16).price + 15 * 3 * cableMat(2.5).price) + 70 },
];
export const repairOf = (id: string) => REPAIRS.find((r) => r.id === id)!;

export const pointsOf = (s: Setup): Point[] => {
  const p: Point[] = [{ id: 'pia', label: 'Magnetotérmico (PIA) del circuito' }, { id: 'linea', label: 'Línea / cableado del circuito' }, { id: 'caja', label: 'Caja de conexiones (neutro)' }];
  if (s.conmutada) p.push({ id: 'conmutada', label: 'Conmutadores del pasillo' });
  s.recs.forEach((r, i) => { p.push({ id: `rec:${i}`, label: `Toma o receptor: ${r.name}` }); if (!s.conmutada) p.push({ id: `pe:${i}`, label: `Conductor de protección de: ${r.name}` }); });
  return p;
};
