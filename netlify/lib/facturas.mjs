/**
 * Ejercicios de factura (ciclos de Administración y Gestión).
 *
 * Una factura es un apartado de ejercicio (`num`) con `factura` = los datos de la
 * operación. La plataforma calcula ella misma la solución (no se teclea a mano) y
 * genera las casillas que se corrigen, así que funciona igual que cualquier ejercicio:
 * corrección, puntos, revisión, PDF, correo y notas.
 *
 * Cálculo (redondeando a céntimos en cada paso, como se hace a mano):
 *   importe de cada línea = cantidad × precio − descuento comercial (%)
 *   importe bruto = suma de las líneas
 *   − descuento por pronto pago (% sobre el importe bruto)
 *   + portes / gastos (€)
 *   = base imponible
 *   cuota de IVA, recargo de equivalencia y retención de IRPF = base × su %
 *   total = base + IVA + recargo − retención
 *
 * Modos:
 *   «calculos»: cabecera y líneas ya escritas; el alumno calcula los importes.
 *   «completa»: además escribe NIF, número, fecha, cantidades, precios y descuentos
 *               a partir del enunciado.
 */
import { fallo } from "./http.mjs";

export const FAMILIA_FACTURAS = "Administración y Gestión";
const r2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
const txt = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const num = (v, nombre, { min = 0, max = 1e9 } = {}) => {
  const n = Number(String(v ?? "").replace(",", "."));
  if (!Number.isFinite(n) || n < min || n > max) fallo(400, `Factura: «${nombre}» no es válido`);
  return Math.round(n * 10000) / 10000;
};

/** Datos de la factura, limpios. */
export function validarFactura(f) {
  if (!f || typeof f !== "object") fallo(400, "Factura no válida");
  const parte = (p, quien) => ({ nombre: txt(p?.nombre, 120) || fallo(400, `Factura: falta el nombre del ${quien}`), nif: txt(p?.nif, 20).toUpperCase(), direccion: txt(p?.direccion, 200) });
  const lineas = Array.isArray(f.lineas) ? f.lineas : [];
  if (!lineas.length || lineas.length > 10) fallo(400, "Factura: entre 1 y 10 líneas");
  return {
    modo: f.modo === "completa" ? "completa" : "calculos",
    emisor: parte(f.emisor, "emisor"),
    receptor: parte(f.receptor, "cliente"),
    numero: txt(f.numero, 30),
    fecha: txt(f.fecha, 20),
    lineas: lineas.map((l, i) => ({
      concepto: txt(l?.concepto, 120) || fallo(400, `Factura: falta el concepto de la línea ${i + 1}`),
      cantidad: num(l?.cantidad, `cantidad de la línea ${i + 1}`, { min: 0.0001, max: 1e6 }),
      precio: num(l?.precio, `precio de la línea ${i + 1}`, { max: 1e7 }),
      dto: num(l?.dto ?? 0, `descuento de la línea ${i + 1}`, { max: 100 }),
    })),
    dtoPP: num(f.dtoPP ?? 0, "descuento por pronto pago", { max: 100 }),
    portes: num(f.portes ?? 0, "portes", { max: 1e6 }),
    iva: num(f.iva ?? 21, "IVA", { max: 100 }),
    re: num(f.re ?? 0, "recargo de equivalencia", { max: 100 }),
    irpf: num(f.irpf ?? 0, "retención de IRPF", { max: 100 }),
  };
}

/** Solución de la factura. */
export function calcularFactura(f) {
  const importes = f.lineas.map((l) => r2(r2(l.cantidad * l.precio) * (1 - l.dto / 100)));
  const bruto = r2(importes.reduce((s, x) => s + x, 0));
  const dtoPP = r2(bruto * f.dtoPP / 100);
  const base = r2(bruto - dtoPP + f.portes);
  const iva = r2(base * f.iva / 100), re = r2(base * f.re / 100), irpf = r2(base * f.irpf / 100);
  return { importes, bruto, dtoPP, base, iva, re, irpf, total: r2(base + iva + re - irpf) };
}

const fmtPct = (x) => String(x).replace(".", ",");
/**
 * Casillas que rellena el alumno (las de un apartado de ejercicio), con su `rol`
 * para colocarlas en la plantilla. Importes: ±1 céntimo (el total, ±2).
 */
export function camposFactura(f) {
  const s = calcularFactura(f), campos = [];
  const euro = (rol, etiqueta, valor, tolAbs = 0.011) => campos.push({ rol, etiqueta, tipo: "numero", valor, unidad: "€", tolerancia: 0, tolAbs });
  const dato = (rol, etiqueta, valor, unidad = "") => campos.push({ rol, etiqueta, tipo: "numero", valor, unidad, tolerancia: 0, tolAbs: 0.0001 });
  const texto = (rol, etiqueta, valor) => valor && campos.push({ rol, etiqueta, tipo: "texto", valor });
  if (f.modo === "completa") {
    texto("emisor.nif", "NIF del emisor", f.emisor.nif);
    texto("receptor.nif", "NIF del cliente", f.receptor.nif);
    texto("numero", "Número de factura", f.numero);
    texto("fecha", "Fecha", f.fecha);
  }
  f.lineas.forEach((l, k) => {
    if (f.modo === "completa") {
      dato(`l${k}.cantidad`, `Línea ${k + 1} · Cantidad`, l.cantidad);
      dato(`l${k}.precio`, `Línea ${k + 1} · Precio unitario`, l.precio, "€");
      if (l.dto) dato(`l${k}.dto`, `Línea ${k + 1} · Descuento`, l.dto, "%");
    }
    euro(`l${k}.importe`, `Línea ${k + 1} · Importe`, s.importes[k]);
  });
  euro("bruto", "Importe bruto", s.bruto);
  if (f.dtoPP) euro("dtoPP", `Descuento por pronto pago (${fmtPct(f.dtoPP)} %)`, s.dtoPP);
  euro("base", "Base imponible", s.base);
  euro("iva", `Cuota de IVA (${fmtPct(f.iva)} %)`, s.iva);
  if (f.re) euro("re", `Recargo de equivalencia (${fmtPct(f.re)} %)`, s.re);
  if (f.irpf) euro("irpf", `Retención de IRPF (${fmtPct(f.irpf)} %)`, s.irpf);
  euro("total", "Total factura", s.total, 0.021);
  return campos;
}

/** Lo que ve el alumno en la plantilla (sin la solución; en «completa», sin los datos que debe escribir). */
export function facturaPublica(f) {
  const completa = f.modo === "completa";
  return {
    modo: f.modo,
    emisor: { nombre: f.emisor.nombre, direccion: f.emisor.direccion, nif: completa ? "" : f.emisor.nif },
    receptor: { nombre: f.receptor.nombre, direccion: f.receptor.direccion, nif: completa ? "" : f.receptor.nif },
    numero: completa ? "" : f.numero, fecha: completa ? "" : f.fecha,
    lineas: f.lineas.map((l) => (completa ? { concepto: l.concepto, conDto: !!l.dto } : { ...l })),
    dtoPP: f.dtoPP, portes: f.portes, iva: f.iva, re: f.re, irpf: f.irpf,
  };
}

/** Compara un texto de la factura (NIF, número, fecha) sin fijarse en espacios, guiones, puntos ni mayúsculas. */
export function textoFacturaCorrecto(rol, esperado, resp) {
  const limpio = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[\s.\-–/]/g, "");
  if (rol === "fecha") {
    const f = (s) => {
      const m = String(s ?? "").match(/(\d{1,4})\D+(\d{1,2})\D+(\d{1,4})/);
      if (!m) return "";
      let [a, b, c] = [m[1], m[2], m[3]].map(Number);
      if (a > 31) [a, c] = [c, a]; // 2026-11-05
      if (c < 100) c += 2000;
      return `${a}/${b}/${c}`;
    };
    return !!f(resp) && f(resp) === f(esperado);
  }
  return !!limpio(resp) && limpio(resp) === limpio(esperado);
}
