/**
 * Defectos posibles de la instalación, definidos como DATOS: qué ensayo los delata, a quién afectan, cuánto valen
 * y cómo se explican al final. Añadir un defecto = añadir un objeto; model/instrumentos no cambian.
 */
import type { Pair, TestKind } from './rules';

export interface DefectDef {
  id: string; level: 1 | 2 | 3; test: TestKind; title: string;
  /** A qué se aplica: un circuito, la tierra general o un diferencial. */
  scope: 'circuit' | 'earth' | 'rcd';
  pair?: Pair;
  /** Valor «malo» que se le asigna (según el tipo: MΩ, Ω, mA o ms). */
  value(r: () => number): number;
  /** Segundo valor para el diferencial (tiempo). */
  cause: string;
  explain: string;
  /** Cómo se evita o se arregla. */
  fix: string;
}
const between = (r: () => number, a: number, b: number) => a + r() * (b - a);

export const DEFECTS: DefectDef[] = [
  { id: 'iso_bajo', level: 1, test: 'aislamiento', scope: 'circuit', pair: 'LPE', title: 'Aislamiento muy bajo fase–tierra',
    value: (r) => Math.round(between(r, 0.05, 0.3) * 100) / 100,
    cause: 'Un cable pellizcado por una grapa en el tubo, con el aislante dañado.', explain: 'La corriente de fuga aumenta y el aislamiento no llega al mínimo reglamentario. Con el tiempo puede derivar a tierra y disparar el diferencial, o algo peor.', fix: 'Localizar el tramo dañado y cambiar el conductor.' },
  { id: 'pe_alto', level: 1, test: 'continuidad', scope: 'circuit', title: 'Continuidad de tierra deficiente',
    value: (r) => Math.round(between(r, 8, 60) * 10) / 10,
    cause: 'Un borne de tierra flojo en una caja de registro.', explain: 'El conductor de protección casi no conduce: si hay una derivación, la carcasa quedaría con tensión y el diferencial podría no actuar.', fix: 'Reapretar o rehacer el borne y volver a medir.' },
  { id: 'tierra_alta', level: 2, test: 'tierra', scope: 'earth', title: 'Resistencia de puesta a tierra demasiado alta',
    value: (r) => Math.round(between(r, 1800, 4500)),
    cause: 'Pica corroída y terreno muy seco.', explain: 'Con tanta resistencia, una derivación no genera corriente suficiente para disparar el diferencial y la tensión de contacto puede superar los 50 V.', fix: 'Añadir picas o mejorar el electrodo y volver a medir.' },
  { id: 'rcd_lento', level: 2, test: 'diferencial', scope: 'rcd', title: 'El diferencial tarda demasiado en disparar',
    value: (r) => Math.round(between(r, 380, 700)),
    cause: 'Mecanismo del diferencial envejecido.', explain: 'Dispara, pero tarde: a IΔn debe hacerlo en 300 ms como máximo. Un contacto eléctrico prolongado es peligroso.', fix: 'Sustituir el diferencial.' },
  { id: 'rcd_no_dispara', level: 2, test: 'diferencial', scope: 'rcd', title: 'El diferencial no dispara con 30 mA',
    value: (r) => Math.round(between(r, 55, 80)),
    cause: 'Diferencial de sensibilidad real mucho menor que la marcada.', explain: 'No protege: con 30 mA en el cuerpo humano seguiría sin disparar. Es de los defectos más peligrosos.', fix: 'Sustituir el diferencial.' },
  { id: 'iso_ln', level: 3, test: 'aislamiento', scope: 'circuit', pair: 'LN', title: 'Aislamiento bajo entre fase y neutro',
    value: (r) => Math.round(between(r, 0.08, 0.25) * 100) / 100,
    cause: 'Humedad en una caja estanca de exterior.', explain: 'Solo se detecta midiendo entre fase y neutro: entre fase y tierra todo parece correcto. Por eso se miden todas las parejas de conductores.', fix: 'Secar y sellar la caja o sustituir el tramo.' },
  { id: 'iso_limite', level: 3, test: 'aislamiento', scope: 'circuit', pair: 'LPE', title: 'Aislamiento justo por debajo del mínimo',
    value: (r) => Math.round(between(r, 0.38, 0.49) * 100) / 100,
    cause: 'Humedad en la masa de un empalme.', explain: 'No es una avería llamativa, pero el reglamento no admite «casi»: por debajo de 0,5 MΩ no es apto.', fix: 'Revisar los empalmes del circuito y repetir el ensayo.' },
  { id: 'rcd_intempestivo', level: 3, test: 'diferencial', scope: 'rcd', title: 'El diferencial dispara con una fuga demasiado pequeña',
    value: (r) => Math.round(between(r, 8, 13)),
    cause: 'Diferencial hipersensible o fuga permanente en la instalación.', explain: 'Debe disparar entre 0,5·IΔn y IΔn. Si dispara por debajo, hará saltar la luz sin motivo y el cliente acabará anulándolo.', fix: 'Buscar fugas pequeñas o sustituir el diferencial.' },
];
export const defectOf = (id: string) => DEFECTS.find((d) => d.id === id)!;
