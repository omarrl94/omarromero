/**
 * Catálogo de material y proveedor de precios.
 * IMPORTANTE: los precios de este módulo son SIMULADOS (catálogo genérico, sin marcas ni tiendas reales). Sirven para
 * enseñar a presupuestar y para probar la integración; en un proveedor real, `CatalogProvider` leería su catálogo
 * (CSV o API) con referencia, precio y stock.
 */
export type Gama = 0 | 1 | 2; // 0 económica · 1 estándar · 2 profesional
export const GAMAS = ['Económica', 'Estándar', 'Profesional'] as const;
const GAMA_FACTOR = [0.75, 1, 1.5] as const;
const GAMA_BRAND = ['Eco', 'Estándar', 'Pro'] as const;

export interface CatalogItem { key: string; ref: string; name: string; brand: string; unit: 'ud' | 'm'; price: number; gama: Gama }
export interface Quote { ref: string; price: number; stock: number; leadDays: number }

const r2 = (v: number) => Math.round(v * 100) / 100;
/** Hash determinista (para que el «mercado» simulado sea estable pero no uniforme). */
export function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }

const CABLE_M: Record<number, number> = { 1.5: 0.28, 2.5: 0.45, 4: 0.72, 6: 1.05, 10: 1.75, 16: 2.7, 25: 4.2, 35: 5.8 };
const TUBO_M: Record<number, number> = { 16: 0.12, 20: 0.16, 25: 0.24, 32: 0.38, 40: 0.6 };
const CUADRO: Record<number, number> = { 12: 18, 24: 29, 36: 45, 48: 62 };

/** Precio base (€, sin IVA, gama estándar) y descripción de una clave de material. */
export function baseOf(key: string): { name: string; unit: 'ud' | 'm'; price: number } | null {
  const [fam, ...a] = key.split(':');
  const n = (i: number) => Number(a[i]);
  switch (fam) {
    case 'mt': { const [poles, , curve] = [a[0], a[1], a[2]]; return { name: `Magnetotérmico ${poles === '2p' ? '2P' : '1P+N'} ${n(1)} A curva ${curve}`, unit: 'ud', price: (3.2 + 0.09 * n(1)) * (poles === '2p' ? 1.2 : 1) * (curve === 'D' ? 1.25 : 1) }; }
    case 'dif': return { name: `Diferencial 2P ${n(0)} A / ${n(1)} mA tipo ${a[2] ?? 'A'}`, unit: 'ud', price: (n(0) <= 25 ? 38 : n(0) <= 40 ? 42 : n(0) <= 63 ? 70 : 95) * (n(1) > 30 ? 0.9 : 1) };
    case 'iga': return { name: `Interruptor general automático 2P ${n(0)} A`, unit: 'ud', price: 22 + 0.5 * n(0) };
    case 'fus': return { name: `Fusible ${n(0)} A`, unit: 'ud', price: 1.2 + 0.03 * n(0) };
    case 'cable': return CABLE_M[n(0)] ? { name: `Cable H07V-K ${n(0)} mm² (por metro)`, unit: 'm', price: CABLE_M[n(0)] } : null;
    case 'tubo': return TUBO_M[n(0)] ? { name: `Tubo corrugado Ø${n(0)} mm (por metro)`, unit: 'm', price: TUBO_M[n(0)] } : null;
    case 'mec': { const P: Record<string, [string, number]> = { interruptor: ['Interruptor empotrable', 2.8], conmutador: ['Conmutador empotrable', 3.6], cruce: ['Conmutador de cruce', 5.2], pulsador: ['Pulsador empotrable', 3.9], schuko: ['Base de enchufe schuko 16 A', 3.4], usb: ['Base de enchufe con cargador USB', 14] }; const p = P[a[0]]; return p ? { name: p[0], unit: 'ud', price: p[1] } : null; }
    case 'caja': return { name: 'Caja de mecanismo universal', unit: 'ud', price: 0.35 };
    case 'placa': return { name: 'Marco y tapa de mecanismo', unit: 'ud', price: 1.2 };
    case 'led': return { name: `Lámpara LED ${n(0)} W`, unit: 'ud', price: 1.6 + 0.28 * n(0) };
    case 'cuadro': return CUADRO[n(0)] ? { name: `Caja de cuadro empotrable ${n(0)} módulos`, unit: 'ud', price: CUADRO[n(0)] } : null;
    default: return null;
  }
}

/** Las tres gamas de una clave. */
export function itemsFor(key: string): CatalogItem[] {
  const b = baseOf(key);
  if (!b) return [];
  return ([0, 1, 2] as Gama[]).map((g) => ({ key, ref: `GEN-${key.replace(/[:.]/g, '-').toUpperCase()}-${'EAP'[g]}`, name: b.name, brand: `Marca ${GAMA_BRAND[g]}`, unit: b.unit, price: r2(b.price * GAMA_FACTOR[g]), gama: g }));
}

export interface Provider { id: string; name: string; note: string; factor: number; latency: number; shipping: number }
export const PROVIDERS: Provider[] = [
  { id: 'a', name: 'Distribuidor A (almacén cercano)', note: 'Precios de referencia, recogida en tienda', factor: 1, latency: 500, shipping: 0 },
  { id: 'b', name: 'Distribuidor B (venta online)', note: 'Más barato, con gastos de envío', factor: 0.93, latency: 900, shipping: 6.9 },
  { id: 'c', name: 'Distribuidor C (profesional)', note: 'Más caro, entrega en 24 h', factor: 1.08, latency: 700, shipping: 0 },
];

/** Consulta a la «red»: devuelve el precio, el stock y el plazo de cada referencia. Simulado: tarda y varía. */
export function fetchQuotes(provider: Provider, items: CatalogItem[], opts: { fast?: boolean; day?: number } = {}): Promise<Record<string, Quote>> {
  const day = opts.day ?? Math.floor(Date.now() / 86400000);
  const out: Record<string, Quote> = {};
  for (const it of items) {
    const h = hash(`${provider.id}|${it.ref}`), h2 = hash(`${provider.id}|${it.ref}|${day}`);
    const price = r2(it.price * provider.factor * (0.97 + 0.06 * h2)); // ±3 % según el día
    const st = h < 0.05 ? 0 : h < 0.15 ? 3 : Math.round(10 + 190 * h);
    out[it.ref] = { ref: it.ref, price: price < 0.01 ? 0.01 : price, stock: st, leadDays: st > 0 ? (provider.id === 'c' ? 1 : provider.id === 'b' ? 3 : 0) : 5 + Math.round(hash(it.ref) * 4) };
  }
  const wait = opts.fast ? 0 : provider.latency + Math.min(900, items.length * 12);
  return new Promise((res) => setTimeout(() => res(out), wait));
}
