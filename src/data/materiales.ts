/**
 * Catálogo de materiales REALES del modo «Instalador».
 * Cada línea apunta a una ficha comercial de una tienda española (Leroy Merlin, Obramat, Bricodepot, ManoMano)
 * consultada en noviembre de 2026. Los precios llevan IVA y cambian a menudo: son ORIENTATIVOS.
 * `est: true` = no se encontró una ficha clara de ese calibre/modelo y el precio se ha interpolado a partir
 * de los modelos vecinos de la misma marca. Sirve para enseñar presupuestos, no para comprar.
 */
export interface Mat { brand: string; ref: string; price: number; unit: 'ud' | 'm'; url?: string; est?: boolean }
export const CONSULTA = 'nov. 2026';

const LM = 'https://www.leroymerlin.es';
const OB = 'https://www.obramat.es';

/** Cable H07V-K (hilo flexible, se cobra por metro; precio de rollo de 100 m ÷ 100). */
export const CABLE: Record<number, Mat> = {
  1.5: { brand: 'Lexman', ref: 'H07V-K 1,5 mm² · rollo 100 m', price: 0.29, unit: 'm', url: `${LM}/productos/cable-lexman-h07v-k-100-metros-1-5-mm2-color-negro-19303340.html` },
  2.5: { brand: 'Lexman', ref: 'H07V-K 2,5 mm² · rollo 100 m', price: 0.46, unit: 'm', url: `${LM}/productos/cable-lexman-h07v-k-100-metros-2-5-mm2-color-negro-19303312.html` },
  4: { brand: 'REVI', ref: 'H07V-K 4 mm² · rollo 100 m', price: 0.48, unit: 'm', url: `${OB}/productos/hilo-pvc-h07v-k-4mm2-azul-100m-10540593.html` },
  6: { brand: 'REVI', ref: 'H07V-K 6 mm² · rollo 100 m', price: 0.78, unit: 'm', url: `${OB}/hilo-flexible-h07v-k-6mm2-negro-100m-10540642.html`, est: true },
  10: { brand: 'REVI', ref: 'H07V-K 10 mm² · rollo 100 m', price: 1.3, unit: 'm', est: true },
};
export const TUBO: Mat = { brand: 'Lexman', ref: 'Tubo corrugado PVC Ø20 mm · rollo 100 m', price: 0.16, unit: 'm', url: `${LM}/productos/tubo-corrugado-de-pvc-lexman-20-mm-100-m-81908936.html` };

/** Magnetotérmicos 1P+N (Schneider Acti9 DPN). */
export const PIA: Record<number, Mat> = {
  6: { brand: 'Schneider Electric', ref: 'Magnetotérmico 1P+N DPN 6 A', price: 14.5, unit: 'ud', est: true },
  10: { brand: 'Schneider Electric', ref: 'Magnetotérmico 1P+N DPN 10 A', price: 15.99, unit: 'ud', url: `${LM}/productos/interruptor-magnetotermico-schneider-electric-1p-n-dpn-10a-15395555.html` },
  16: { brand: 'Schneider Electric', ref: 'Magnetotérmico 1P+N DPN 16 A', price: 17.5, unit: 'ud', est: true },
  20: { brand: 'Schneider Electric', ref: 'Magnetotérmico 1P+N DPN 20 A', price: 18.9, unit: 'ud', est: true },
  25: { brand: 'Schneider Electric', ref: 'Magnetotérmico 1P+N DPN 25 A', price: 20.36, unit: 'ud', url: `${LM}/productos/interruptor-magnetotermico-schneider-electric-1p-n-dpn-25a-15395583.html` },
  32: { brand: 'Schneider Electric', ref: 'Magnetotérmico 1P+N DPN 32 A', price: 23, unit: 'ud', est: true },
  40: { brand: 'Schneider Electric', ref: 'Magnetotérmico 1P+N DPN 40 A', price: 26, unit: 'ud', est: true },
};
/** Interruptor general automático 2P. */
export const IGA: Record<number, Mat> = {
  25: { brand: 'Schneider Electric', ref: 'IGA 2P 25 A', price: 21, unit: 'ud', est: true },
  32: { brand: 'Schneider Electric', ref: 'IGA 2P 32 A', price: 24, unit: 'ud', est: true },
  40: { brand: 'Schneider Electric', ref: 'IGA 2P 40 A', price: 27, unit: 'ud', est: true },
  50: { brand: 'Schneider Electric', ref: 'IGA 2P 50 A', price: 32, unit: 'ud', est: true },
  63: { brand: 'Schneider Electric', ref: 'IGA 2P 63 A', price: 38, unit: 'ud', est: true },
};
/** Diferenciales 2P 30 mA. Clase A «superinmunizado» y AC. */
export const ID: Record<'A' | 'AC', Record<number, Mat>> = {
  AC: {
    25: { brand: 'Schneider Electric', ref: 'Diferencial 2P 25 A 30 mA clase AC', price: 19, unit: 'ud', est: true },
    40: { brand: 'Schneider Electric', ref: 'Diferencial 2P 40 A 30 mA clase AC', price: 21, unit: 'ud', url: `${OB}/productos/diferencial-2p-40a-30ma-schneider-10350123.html` },
    63: { brand: 'Schneider Electric', ref: 'Diferencial 2P 63 A 30 mA clase AC', price: 45, unit: 'ud', est: true },
  },
  A: {
    25: { brand: 'Schneider Electric', ref: 'Diferencial superinmunizado 2P 25 A 30 mA clase A', price: 44, unit: 'ud', est: true },
    40: { brand: 'Schneider Electric', ref: 'Diferencial superinmunizado 2P 40 A 30 mA clase A', price: 47.5, unit: 'ud', url: `${OB}/productos/diferencial-superinmunizado-2p-40a-30ma-a-schneider-25100964.html` },
    63: { brand: 'Schneider Electric', ref: 'Diferencial superinmunizado 2P 63 A 30 mA clase A', price: 78, unit: 'ud', est: true },
  },
};
export const CAJA: Mat = { brand: 'Genérica', ref: 'Cuadro de empotrar 12 módulos con puerta', price: 28, unit: 'ud', est: true };
export const SPD: Mat = { brand: 'Legrand', ref: 'Limitador de sobretensión transitoria 1P+N tipo 2', price: 47, unit: 'ud', url: `${OB}/productos/sobretension-transitoria-1p-n-legrand-10833886.html` };

/** Mecanismos y equipos. */
export const DEV_MAT: Record<string, Mat> = {
  luz: { brand: 'Genérica', ref: 'Portalámparas + lámpara LED 10 W', price: 6.5, unit: 'ud', est: true },
  luzExt: { brand: 'Genérica', ref: 'Aplique exterior IP44', price: 16, unit: 'ud', est: true },
  int: { brand: 'Simon 270', ref: 'Interruptor/conmutador completo, blanco', price: 6.58, unit: 'ud', url: `${LM}/productos/interruptor-conmutador-completo-simon-270-blanco-91729925.html` },
  conm: { brand: 'Simon 270', ref: 'Interruptor/conmutador completo, blanco', price: 6.58, unit: 'ud', url: `${LM}/productos/interruptor-conmutador-completo-simon-270-blanco-91729925.html` },
  detector: { brand: 'Genérica', ref: 'Detector de movimiento de superficie IP44', price: 7.75, unit: 'ud', url: `${OB}/productos/detector-movimiento-superficie-pared-ip44-10157665.html` },
  toma: { brand: 'Simon 270', ref: 'Base de enchufe 2P+T 16 A', price: 6.5, unit: 'ud', est: true },
  tomaHorno: { brand: 'Simon 270', ref: 'Base 2P+T 25 A cocina', price: 14, unit: 'ud', est: true },
  tomaLav: { brand: 'Simon 270', ref: 'Base 2P+T 16 A electrodoméstico', price: 7, unit: 'ud', est: true },
  tomaTV: { brand: 'Simon 270', ref: 'Toma TV/datos', price: 6, unit: 'ud', est: true },
  ac: { brand: 'ELUXE', ref: 'Split inverter Amber 2 · 3000 fg', price: 249, unit: 'ud', url: `${LM}/productos/calefaccion-y-climatizacion/aire-acondicionado/aire-acondicionado-split-inverter/aire-acondicionado-3000-frigorias/` },
  ev: { brand: 'Wallbox', ref: 'Pulsar Plus 7,4 kW · cable tipo 2 de 7 m', price: 749, unit: 'ud', url: `${LM}/productos/cargador-wallbox-pulsar-plus-negro-de-potencia-hasta-7-4-kw-y-manguera-de-7m-84043371.html` },
};

export const igaMat = (a: number): Mat => IGA[a] ?? IGA[63];
export const idMat = (a: number, t: 'A' | 'AC'): Mat => ID[t][[25, 40, 63].find((v) => v >= a) ?? 63];
export const piaMat = (a: number): Mat => PIA[a] ?? PIA[16];
export const cableMat = (s: number): Mat => CABLE[s] ?? CABLE[10];

export interface BomLine { group: string; name: string; brand: string; qty: number; unit: 'ud' | 'm'; unitPrice: number; total: number; url?: string; est?: boolean }
