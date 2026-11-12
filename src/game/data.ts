/**
 * Modo juego «Instalador»: catálogos de dispositivos, circuitos y precios.
 * Todos los valores normativos y los precios son ORIENTATIVOS (verified: false): están pensados para
 * enseñar el razonamiento de una instalación de vivienda, no para sustituir al REBT ni a un presupuesto.
 */
import { IZ_CU_PVC_B1 } from '../data/rebt';
import { DEV_MAT, TUBO, cableMat, idMat, igaMat, piaMat, CAJA, SPD } from '../data/materiales';

export type DevKind = 'luz' | 'luzExt' | 'int' | 'conm' | 'detector' | 'toma' | 'tomaHorno' | 'tomaLav' | 'tomaTV' | 'ac' | 'ev';

export interface DevDef {
  kind: DevKind; name: string; short: string; price: number; p: number;
  group: 'Iluminación' | 'Mando' | 'Tomas' | 'Equipos';
  /** Ayuda corta para el alumno */
  help: string;
}

export const DEVICES: DevDef[] = [
  { kind: 'luz', name: 'Punto de luz', short: 'Luz', price: DEV_MAT.luz.price, p: 100, group: 'Iluminación', help: 'Punto de luz de techo (100 W de cálculo).' },
  { kind: 'luzExt', name: 'Aplique exterior IP44', short: 'Ext.', price: DEV_MAT.luzExt.price, p: 60, group: 'Iluminación', help: 'Aplique estanco para terraza o garaje.' },
  { kind: 'int', name: 'Interruptor', short: 'I', price: DEV_MAT.int.price, p: 0, group: 'Mando', help: 'Gobierna uno o varios puntos de luz.' },
  { kind: 'conm', name: 'Conmutador', short: 'C', price: DEV_MAT.conm.price, p: 0, group: 'Mando', help: 'Dos conmutadores gobiernan la misma luz desde dos sitios.' },
  { kind: 'detector', name: 'Detector de presencia', short: 'D', price: DEV_MAT.detector.price, p: 0, group: 'Mando', help: 'Enciende la luz al detectar movimiento.' },
  { kind: 'toma', name: 'Base 16 A', short: 'T', price: DEV_MAT.toma.price, p: 400, group: 'Tomas', help: 'Base de enchufe 2P+T de uso general.' },
  { kind: 'tomaHorno', name: 'Base 25 A cocina/horno', short: '25', price: DEV_MAT.tomaHorno.price, p: 5000, group: 'Tomas', help: 'Toma de cocina y horno.' },
  { kind: 'tomaLav', name: 'Toma lavadora / lavavajillas / termo', short: 'L', price: DEV_MAT.tomaLav.price, p: 2000, group: 'Tomas', help: 'Toma de 16 A para un electrodoméstico de potencia.' },
  { kind: 'tomaTV', name: 'Toma TV / datos', short: 'TV', price: DEV_MAT.tomaTV.price, p: 0, group: 'Tomas', help: 'Baja tensión: no lleva circuito.' },
  { kind: 'ac', name: 'Aire acondicionado (split)', short: 'AC', price: DEV_MAT.ac.price, p: 2500, group: 'Equipos', help: 'Circuito propio.' },
  { kind: 'ev', name: 'Cargador de vehículo eléctrico', short: 'VE', price: DEV_MAT.ev.price, p: 7360, group: 'Equipos', help: 'Circuito propio de 32 A.' },
];
export const dev = (k: DevKind) => DEVICES.find((d) => d.kind === k)!;

export interface CircuitDef { id: string; name: string; inA: number; section: number; lighting: boolean; use: number; color: string }
export const CIRCUITS: CircuitDef[] = [
  { id: 'C1', name: 'Alumbrado', inA: 10, section: 1.5, lighting: true, use: 1, color: '#ffd23f' },
  { id: 'C2', name: 'Tomas de uso general', inA: 16, section: 2.5, lighting: false, use: 0.5, color: '#4ad0c4' },
  { id: 'C2b', name: 'Tomas de uso general (2.º circuito)', inA: 16, section: 2.5, lighting: false, use: 0.5, color: '#2fa89b' },
  { id: 'C3', name: 'Cocina y horno', inA: 25, section: 6, lighting: false, use: 0.8, color: '#ff7a59' },
  { id: 'C4', name: 'Lavadora, lavavajillas y termo', inA: 20, section: 4, lighting: false, use: 0.66, color: '#b07cff' },
  { id: 'C5', name: 'Tomas de baño y cocina', inA: 16, section: 2.5, lighting: false, use: 0.5, color: '#6cc24a' },
  { id: 'C9', name: 'Aire acondicionado', inA: 25, section: 6, lighting: false, use: 1, color: '#ff5fa8' },
  { id: 'CVE', name: 'Cargador de vehículo eléctrico', inA: 32, section: 6, lighting: false, use: 1, color: '#5aa0ff' },
];
export const circuitDef = (id: string) => CIRCUITS.find((c) => c.id === id)!;

export const PIA_RATINGS = [6, 10, 16, 20, 25, 32, 40];
export const SECTIONS_GAME = [1.5, 2.5, 4, 6, 10];
export const IZ = IZ_CU_PVC_B1;
export const ZS = 0.25; // Ω, impedancia orientativa de la red hasta el cuadro
export const GAMMA = 48; // m/(Ω·mm²), Cu a 70 °C
export const U = 230;

/** Precios de materiales reales (ver src/data/materiales.ts): cable por metro (×3 conductores: fase, neutro y tierra). */
export const PRICES = {
  cablePerM: (s: number) => cableMat(s).price,
  tubePerM: TUBO.price,
  pia: (a: number) => piaMat(a).price,
  iga: (a: number) => igaMat(a).price,
  id: (a: number, type: 'A' | 'AC') => idMat(a, type).price,
  box: CAJA.price, spd: SPD.price,
};
export const CONDUCTORS = 3;
export const DROP = 1.5; // m de bajada/subida por mecanismo
