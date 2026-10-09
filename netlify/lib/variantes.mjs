/**
 * Exámenes aleatorios: cada alumno (y cada intento) recibe su propia versión.
 *
 *  · Orden: se barajan las preguntas tipo test, las abiertas y las opciones
 *    del test. Las respuestas se guardan siempre en el orden original, así la
 *    corrección, la revisión del profesor y las estadísticas no cambian.
 *  · Valores: el examen declara `variables` y escribe en los textos
 *    marcadores como {{R1}} o {{=V/R1}} (cálculo). Los resultados de los
 *    ejercicios llevan una `formula`. Cada versión elige valores al azar
 *    dentro de su rango y recalcula los resultados correctos.
 *
 * Variables:
 *   { nombre: "R1", valor: 6, min: 2, max: 20, paso: 1 }      al azar en un rango
 *   { nombre: "V", valor: 90, valores: [60, 90, 120] }          al azar de una lista
 *   { nombre: "R34", formula: "R3 + R4" }                       calculada a partir de otras
 * `valor` es el del examen original (versión «0»).
 */
import { createHmac } from "node:crypto";
import { fallo } from "./http.mjs";

/* ── Expresiones seguras (sin eval) ─────────────────────────── */
const FUNCIONES = {
  sqrt: Math.sqrt, raiz: Math.sqrt, abs: Math.abs, ln: Math.log, log: Math.log10, exp: Math.exp,
  sin: (x) => Math.sin((x * Math.PI) / 180), cos: (x) => Math.cos((x * Math.PI) / 180), tan: (x) => Math.tan((x * Math.PI) / 180),
  asin: (x) => (Math.asin(x) * 180) / Math.PI, acos: (x) => (Math.acos(x) * 180) / Math.PI, atan: (x) => (Math.atan(x) * 180) / Math.PI,
  round: Math.round, floor: Math.floor, ceil: Math.ceil,
};
const FUNCIONES2 = { min: Math.min, max: Math.max, redondea: (x, n) => Math.round(x * 10 ** n) / 10 ** n };

function trocear(txt) {
  const s = String(txt).replace(/×|·/g, "*").replace(/÷/g, "/").replace(/[−–]/g, "-").replace(/π/g, " pi ").replace(/²/g, "^2").replace(/³/g, "^3");
  const t = [];
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    const num = /^(\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?/.exec(s.slice(i));
    if (num) { t.push({ k: "n", v: Number(num[0]) }); i += num[0].length; continue; }
    const id = /^[A-Za-z_À-ɏ][A-Za-z0-9_À-ɏ]*/.exec(s.slice(i));
    if (id) { t.push({ k: "id", v: id[0] }); i += id[0].length; continue; }
    if ("+-*/^(),".includes(c)) { t.push({ k: c }); i++; continue; }
    throw new Error(`símbolo no válido «${c}»`);
  }
  return t;
}

/** Evalúa una expresión con variables. Lanza Error si no es válida. */
export function evaluar(expr, vars = {}) {
  const t = trocear(expr); let p = 0;
  const toma = (k) => (t[p]?.k === k ? t[p++] : null);
  const suma = () => { let v = prod(); for (;;) { if (toma("+")) v += prod(); else if (toma("-")) v -= prod(); else return v; } };
  const prod = () => { let v = unario(); for (;;) { if (toma("*")) v *= unario(); else if (toma("/")) v /= unario(); else return v; } };
  const unario = () => (toma("-") ? -unario() : toma("+") ? unario() : pot());
  const pot = () => { const b = prim(); return toma("^") ? b ** unario() : b; };
  const prim = () => {
    const x = t[p++];
    if (!x) throw new Error("expresión incompleta");
    if (x.k === "n") return x.v;
    if (x.k === "(") { const v = suma(); if (!toma(")")) throw new Error("falta un paréntesis"); return v; }
    if (x.k === "id") {
      if (x.v === "pi") return Math.PI;
      if (FUNCIONES[x.v] && t[p]?.k === "(") { p++; const v = suma(); if (!toma(")")) throw new Error("falta un paréntesis"); return FUNCIONES[x.v](v); }
      if (FUNCIONES2[x.v] && t[p]?.k === "(") {
        p++; const a = suma(); if (!toma(",")) throw new Error(`${x.v} necesita dos valores`); const b = suma();
        if (!toma(")")) throw new Error("falta un paréntesis"); return FUNCIONES2[x.v](a, b);
      }
      if (x.v in vars) return vars[x.v];
      throw new Error(`variable desconocida «${x.v}»`);
    }
    throw new Error("expresión no válida");
  };
  const v = suma();
  if (p < t.length) throw new Error("expresión no válida");
  if (!Number.isFinite(v)) throw new Error("el resultado no es un número (¿división entre 0?)");
  return v;
}

/** Números «a la española»: 1150 · 2,25 · 1,872·10²¹. */
export function formatear(v, decimales) {
  if (!Number.isFinite(v)) return "?";
  if (decimales != null) return (Math.round(v * 10 ** decimales) / 10 ** decimales).toFixed(decimales).replace(".", ",");
  if (v === 0) return "0";
  const a = Math.abs(v);
  if (a >= 1e7 || a < 1e-3) {
    const [m, e] = v.toExponential(3).split("e");
    const sup = { "-": "⁻", "+": "", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
    return `${m.replace(/\.?0+$/, "").replace(".", ",")}·10${[...e].map((c) => sup[c]).join("")}`;
  }
  return String(Number(v.toPrecision(4))).replace(".", ",");
}

/** {{R1}} y {{=expresión}} o {{=expresión|2}} (decimales) en un texto. */
export function rellenar(texto, vars) {
  if (typeof texto !== "string" || !texto.includes("{{")) return texto;
  return texto.replace(/\{\{\s*(=)?\s*([^{}|]+?)\s*(?:\|\s*(\d))?\s*\}\}/g, (m, calc, expr, dec) => {
    try { return formatear(calc ? evaluar(expr, vars) : expr in vars ? vars[expr] : evaluar(expr, vars), dec == null ? undefined : Number(dec)); }
    catch { return m; }
  });
}

/* ── Azar reproducible ──────────────────────────────────────── */
function generador(semilla) {
  let a = semilla >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** Semilla de un alumno en un intento: siempre la misma (al recargar o reanudar sale la misma versión). */
export const semillaDe = (secreto, ...partes) => createHmac("sha256", secreto).update(partes.join("|")).digest().readUInt32BE(0);
const barajar = (n, azar) => { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ── Variables ──────────────────────────────────────────────── */
const r6 = (x) => Number(x.toPrecision(10));

/** Valores de las variables: los originales (azar = null) o al azar. */
export function valoresVariables(variables = [], azar = null) {
  const vars = {};
  for (const v of variables) {
    if (v.formula) { vars[v.nombre] = r6(evaluar(v.formula, vars)); continue; }
    if (!azar) { vars[v.nombre] = v.valor; continue; }
    if (Array.isArray(v.valores) && v.valores.length) { vars[v.nombre] = v.valores[Math.floor(azar() * v.valores.length)]; continue; }
    const paso = v.paso > 0 ? v.paso : 1, n = Math.floor((v.max - v.min) / paso + 1e-9);
    vars[v.nombre] = r6(v.min + paso * Math.floor(azar() * (n + 1)));
  }
  return vars;
}

/** Valida la lista de variables del examen (la usa validarExamen). */
export function validarVariables(lista) {
  if (lista == null) return [];
  if (!Array.isArray(lista)) fallo(400, "«variables» debe ser una lista");
  const out = [], vistos = {};
  for (const [i, v] of lista.slice(0, 60).entries()) {
    const nombre = String(v?.nombre || "").trim();
    if (!/^[A-Za-z_À-ɏ][A-Za-z0-9_À-ɏ]*$/.test(nombre) || nombre in FUNCIONES || nombre in FUNCIONES2 || nombre === "pi")
      fallo(400, `Variable ${i + 1}: nombre no válido («${nombre}»). Usa letras, números y _ (p. ej. R1, V_fuente).`);
    if (nombre in vistos) fallo(400, `La variable «${nombre}» está repetida`);
    if (v.formula) {
      const formula = String(v.formula).slice(0, 300);
      try { evaluar(formula, vistos); } catch (e) { fallo(400, `Variable «${nombre}»: la fórmula no es válida (${e.message})`); }
      out.push({ nombre, formula }); vistos[nombre] = evaluar(formula, vistos);
      continue;
    }
    const valor = Number(v.valor);
    if (!Number.isFinite(valor)) fallo(400, `Variable «${nombre}»: falta su valor original`);
    if (Array.isArray(v.valores) && v.valores.length) {
      const valores = v.valores.map(Number).filter(Number.isFinite).slice(0, 50);
      if (!valores.length) fallo(400, `Variable «${nombre}»: la lista de valores no es válida`);
      out.push({ nombre, valor, valores });
    } else {
      const min = Number(v.min ?? valor), max = Number(v.max ?? valor), paso = Number(v.paso ?? 1);
      if (![min, max, paso].every(Number.isFinite) || min > max || paso <= 0) fallo(400, `Variable «${nombre}»: el rango no es válido`);
      if ((max - min) / paso > 100000) fallo(400, `Variable «${nombre}»: demasiados valores posibles; aumenta el paso`);
      out.push({ nombre, valor, min, max, paso });
    }
    vistos[nombre] = valor;
  }
  return out;
}

/** Comprueba las fórmulas de los resultados con los valores originales. Devuelve avisos. */
export function comprobarFormulas(ex) {
  const avisos = [];
  if (!ex.variables?.length) return avisos;
  let vars;
  try { vars = valoresVariables(ex.variables); } catch (e) { return [`Las variables no se pueden calcular: ${e.message}`]; }
  (ex.num || []).forEach((q, i) => q.campos.forEach((c) => {
    if (c.tipo !== "numero" || !c.formula) return;
    try {
      const v = evaluar(c.formula, vars);
      if (Math.abs(v - c.valor) > Math.max(Math.abs(c.valor) * 0.02, 1e-9)) avisos.push(`Apartado ${i + 1} «${c.etiqueta}»: la fórmula da ${formatear(v)} y el resultado original es ${formatear(c.valor)}`);
    } catch (e) { avisos.push(`Apartado ${i + 1} «${c.etiqueta}»: fórmula no válida (${e.message})`); }
  }));
  return avisos;
}

/* ── Versión de un examen ───────────────────────────────────── */
const aleatorioDe = (ex) => ({
  preguntas: !!ex.aleatorio?.preguntas, opciones: !!ex.aleatorio?.opciones,
  valores: !!ex.aleatorio?.valores && (ex.variables || []).length > 0,
});
export const esAleatorio = (ex) => { const a = aleatorioDe(ex); return a.preguntas || a.opciones || a.valores; };

/** Examen con los valores puestos (en el orden original). */
function instanciar(ex, vars) {
  const R = (s) => rellenar(s, vars);
  const copia = structuredClone(ex);
  copia.titulo = R(copia.titulo); copia.subtitulo = R(copia.subtitulo);
  copia.bloques = (copia.bloques || []).map((b) => ({ ...b, titulo: R(b.titulo), texto: R(b.texto), imagen: b.imagen && b.imagen.startsWith("data:image/svg") ? svgRelleno(b.imagen, vars) : b.imagen }));
  copia.mc = copia.mc.map((q) => ({ ...q, t: R(q.t), o: q.o.map(R), exp: R(q.exp) }));
  copia.open = copia.open.map((q) => ({ ...q, act: R(q.act), t: R(q.t), exp: R(q.exp) }));
  copia.num = (copia.num || []).map((q) => ({
    ...q, t: R(q.t), exp: R(q.exp),
    campos: q.campos.map((c) => (c.tipo === "numero" && c.formula ? { ...c, etiqueta: R(c.etiqueta), valor: r6(evaluar(c.formula, vars)) } : { ...c, etiqueta: R(c.etiqueta), opciones: c.opciones?.map(R) })),
  }));
  return copia;
}

/** Figuras SVG con marcadores {{R1}}: también cambian sus valores. */
function svgRelleno(dataUrl, vars) {
  const coma = dataUrl.indexOf(","), cab = dataUrl.slice(0, coma), datos = dataUrl.slice(coma + 1);
  const b64 = cab.includes(";base64");
  const svg = b64 ? Buffer.from(datos, "base64").toString("utf8") : decodeURIComponent(datos);
  const nuevo = rellenar(svg, vars);
  return b64 ? `${cab},${Buffer.from(nuevo, "utf8").toString("base64")}` : `${cab},${encodeURIComponent(nuevo)}`;
}

/**
 * Versión de un examen para una semilla.
 *  · canon: con los valores de esta versión, en el orden original (se corrige y se guarda así).
 *  · mostrado: lo que ve el alumno (preguntas y opciones en otro orden).
 *  · orden: cómo pasar de lo mostrado a lo original.
 * semilla = null → examen original sin cambios.
 */
export function versionExamen(ex, semilla) {
  const a = aleatorioDe(ex);
  if (semilla == null || !esAleatorio(ex)) {
    // Sin azar: si el examen tiene variables, se ponen sus valores originales.
    const canon = (ex.variables || []).length ? instanciar(ex, valoresVariables(ex.variables)) : ex;
    return { canon, mostrado: canon, orden: null, variante: false };
  }
  const azar = generador(semilla);
  const vars = valoresVariables(ex.variables || [], a.valores ? azar : null);
  const canon = (ex.variables || []).length ? instanciar(ex, vars) : structuredClone(ex);
  const orden = {
    mc: a.preguntas ? barajar(canon.mc.length, azar) : canon.mc.map((_, i) => i),
    open: a.preguntas ? barajar(canon.open.length, azar) : canon.open.map((_, i) => i),
    // Opciones: el último hueco «todas/ninguna de las anteriores» no se mueve.
    opciones: canon.mc.map((q) => {
      if (!a.opciones) return q.o.map((_, j) => j);
      const fija = /anteriores/i.test(q.o.at(-1) || "") ? 1 : 0;
      return [...barajar(q.o.length - fija, azar), ...(fija ? [q.o.length - 1] : [])];
    }),
  };
  // Las preguntas que comparten enunciado común (bloque) se mantienen juntas y en su orden.
  if (a.preguntas) for (const k of ["mc", "open"]) orden[k] = juntarBloques(canon[k], orden[k]);
  const mostrado = {
    ...canon,
    mc: orden.mc.map((i) => { const q = canon.mc[i], op = orden.opciones[i]; return { ...q, o: op.map((j) => q.o[j]), c: op.indexOf(q.c) }; }),
    open: orden.open.map((i) => canon.open[i]),
  };
  return { canon, mostrado, orden, variante: true, vars };
}

function juntarBloques(lista, orden) {
  if (!lista.some((q) => q.bloque)) return orden;
  const vistos = new Set(), out = [];
  for (const i of orden) {
    const b = lista[i].bloque;
    if (!b) { out.push(i); continue; }
    if (vistos.has(b)) continue;
    vistos.add(b);
    lista.forEach((q, k) => { if (q.bloque === b) out.push(k); });
  }
  return out;
}

/** Respuestas en el orden que vio el alumno → orden original. */
export function aOriginal(r, orden) {
  if (!orden || !r) return r;
  const mc = [], conf = [], open = [];
  orden.mc.forEach((i, k) => {
    const v = Array.isArray(r.mc) ? r.mc[k] : -1;
    mc[i] = Number.isInteger(v) && v >= 0 ? orden.opciones[i][v] ?? -1 : -1;
    conf[i] = Array.isArray(r.conf) ? r.conf[k] : -1;
  });
  orden.open.forEach((i, k) => { open[i] = Array.isArray(r.open) ? r.open[k] : ""; });
  return { ...r, mc, conf, open };
}

/** Respuestas en orden original → como las ve el alumno (al reanudar). */
export function aMostrado(r, orden) {
  if (!orden || !r) return r;
  return {
    ...r,
    mc: orden.mc.map((i) => { const v = r.mc?.[i]; return Number.isInteger(v) && v >= 0 ? orden.opciones[i].indexOf(v) : -1; }),
    conf: orden.mc.map((i) => r.conf?.[i] ?? -1),
    open: orden.open.map((i) => r.open?.[i] ?? ""),
  };
}

/* ── Propuestas de la IA: se comprueban antes de aceptarlas ──── */
const ID = /^[A-Za-z][A-Za-z0-9_]*$/;
const reNombre = (n) => new RegExp(`(?<![A-Za-z0-9_])${n}(?![A-Za-z0-9_])`, "g");
/** Cambia los nombres de variable en una fórmula. */
const renombrarExpr = (s, mapa) => Object.entries(mapa).reduce((t, [a, b]) => t.replace(reNombre(a), b), String(s || ""));
/** …y dentro de los marcadores {{ }} de un texto. */
const renombrarTexto = (s, mapa) => String(s || "").replace(/\{\{([^{}]*)\}\}/g, (m, dentro) => `{{${renombrarExpr(dentro, mapa)}}}`);
const marcadoresDe = (s) => [...String(s || "").matchAll(/\{\{([^{}]*)\}\}/g)].map((m) => m[1]).join(" ");

/**
 * Comprueba la propuesta de la IA para una parte del examen.
 *  unidad: { tipo: "ejercicio", bloque, apartados: [índices] } | { tipo: "test", preguntas: [índices] }
 * Devuelve { ok, motivo?, variables, cambios, resumen }. Los nombres de variable
 * se renombran con un sufijo para que no choquen entre ejercicios.
 */
export function comprobarPropuesta(ex, unidad, prop, sufijo) {
  const no = (motivo) => ({ ok: false, motivo });
  // Variables: nombres válidos y únicos → renombradas con sufijo
  const brutas = (prop.variables || []).filter((v) => ID.test(String(v.nombre || "")));
  const mapa = Object.fromEntries(brutas.map((v) => [v.nombre, `${v.nombre}_${sufijo}`]));
  let variables;
  try {
    variables = validarVariables(brutas.map((v) => (String(v.formula || "").trim()
      ? { nombre: mapa[v.nombre], formula: renombrarExpr(v.formula, mapa) }
      : { nombre: mapa[v.nombre], valor: v.valor, min: v.min, max: v.max, paso: v.paso })));
  } catch (e) { return no(e.message); }
  if (!variables.length) return no("la IA no ha encontrado datos que puedan cambiar sin tocar la figura");
  const aleatorias = variables.filter((v) => !v.formula).map((v) => v.nombre);
  for (const v of variables) if (!v.formula && !(v.valor >= v.min && v.valor <= v.max)) return no(`el valor original de ${v.nombre.split("_")[0]} queda fuera de su rango`);
  const original = valoresVariables(variables);
  const azar = generador(0x5eed + sufijo);
  const muestras = Array.from({ length: 40 }, () => valoresVariables(variables, azar));
  const R = (s) => renombrarTexto(s, mapa);
  const cambios = { bloques: {}, num: {}, mc: {} };
  let textos = "", formulas = 0;

  if (unidad.tipo === "ejercicio") {
    if (unidad.bloque) { const t = String(prop.texto || "").trim(); if (t) { cambios.bloques[unidad.bloque] = R(t); textos += t; } }
    for (const a of prop.apartados || []) {
      const i = unidad.apartados[Number(a.i) - 1] ?? -1; // la IA numera desde 1
      const q = ex.num[i];
      if (!q) continue;
      const c = { campos: {} };
      if (String(a.t || "").trim()) { c.t = R(a.t.trim()); textos += a.t; }
      if (String(a.exp || "").trim()) c.exp = R(a.exp.trim());
      for (const cp of a.campos || []) {
        const j = Number(cp.j) - 1, campo = q.campos[j];
        if (!campo) continue;
        const cc = {};
        if (String(cp.etiqueta || "").trim()) cc.etiqueta = R(cp.etiqueta.trim());
        if (campo.tipo === "numero" && String(cp.formula || "").trim()) {
          const f = renombrarExpr(cp.formula, mapa);
          let v0;
          try { v0 = evaluar(f, { ...original }); } catch (e) { return no(`«${campo.etiqueta}»: fórmula no válida (${e.message})`); }
          if (Math.abs(v0 - campo.valor) > Math.max(Math.abs(campo.valor) * 0.02, 1e-9))
            return no(`«${campo.etiqueta}»: con los datos originales la fórmula da ${formatear(v0)} y el resultado es ${formatear(campo.valor)}`);
          for (const m of muestras) {
            let v; try { v = evaluar(f, m); } catch (e) { return no(`«${campo.etiqueta}»: en alguna versión no se puede calcular (${e.message})`); }
            if (campo.valor > 0 && v <= 0) return no(`«${campo.etiqueta}»: en alguna versión sale negativo o cero`);
          }
          cc.formula = f; formulas++;
        }
        c.campos[j] = cc;
      }
      cambios.num[i] = c;
    }
    if (!formulas) return no("ningún resultado depende de los datos que cambian");
    // Todos los resultados numéricos deben tener fórmula: uno sin ella se quedaría con el valor original aunque cambien los datos.
    const sinFormula = unidad.apartados.flatMap((i) => ex.num[i].campos.map((campo, j) => (campo.tipo === "numero" && !cambios.num[i]?.campos?.[j]?.formula ? campo.etiqueta : null))).filter(Boolean);
    if (sinFormula.length) return no(`falta la fórmula de ${sinFormula.slice(0, 3).map((x) => `«${x}»`).join(", ")}${sinFormula.length > 3 ? "…" : ""}`);
  } else {
    for (const p of prop.test || []) {
      const i = unidad.preguntas[Number(p.i) - 1] ?? -1, q = ex.mc[i];
      if (!q || !String(p.t || "").includes("{{") || (p.opciones || []).length !== q.o.length) continue;
      const t = R(p.t), o = p.opciones.map(R);
      const distintas = (vars) => { const r = o.map((x) => rellenar(x, vars)); return !r.some((x) => x.includes("{{")) && new Set(r).size === r.length; };
      if (!distintas(original) || !muestras.every(distintas)) continue; // opciones repetidas en alguna versión: se descarta
      cambios.mc[i] = { t, o, exp: R(p.exp || "") || q.exp };
      textos += p.t; formulas++;
    }
    if (!formulas) return no("ninguna pregunta del test se puede hacer aleatoria sin que se repitan opciones");
  }
  // Cada dato que cambia debe verlo el alumno en algún enunciado.
  const visibles = marcadoresDe(Object.values(cambios.bloques).join(" ") + Object.values(cambios.num).map((c) => (c.t || "") + Object.values(c.campos).map((x) => x.etiqueta || "").join(" ")).join(" ") + Object.values(cambios.mc).map((c) => c.t).join(" "));
  const ocultas = aleatorias.filter((n) => !reNombre(n).test(visibles));
  if (ocultas.length) return no(`el alumno no vería el valor de ${ocultas.map((n) => n.split("_")[0]).join(", ")}`);
  // Los textos se pueden rellenar en todas las versiones
  const todo = [...Object.values(cambios.bloques), ...Object.values(cambios.num).flatMap((c) => [c.t, c.exp]), ...Object.values(cambios.mc).flatMap((c) => [c.t, ...c.o, c.exp])].filter(Boolean);
  for (const m of [original, ...muestras.slice(0, 10)]) for (const s of todo) if (rellenar(s, m).includes("{{")) return no(`hay un marcador que no se puede calcular: «${s.slice(0, 80)}»`);
  return { ok: true, variables, cambios, resumen: { variables: aleatorias.length, formulas } };
}

/** Aplica al examen las partes aceptadas. */
export function aplicarPropuestas(ex, fragmentos) {
  const e = structuredClone(ex);
  e.variables = [...(e.variables || [])];
  for (const f of fragmentos) {
    e.variables.push(...f.variables);
    for (const [id, texto] of Object.entries(f.cambios.bloques || {})) { const b = e.bloques.find((x) => x.id === id); if (b) b.texto = texto; }
    for (const [i, c] of Object.entries(f.cambios.num || {})) {
      const q = e.num[i]; if (!q) continue;
      if (c.t) q.t = c.t; if (c.exp) q.exp = c.exp;
      for (const [j, cc] of Object.entries(c.campos || {})) { const campo = q.campos[j]; if (!campo) continue; if (cc.etiqueta) campo.etiqueta = cc.etiqueta; if (cc.formula) campo.formula = cc.formula; }
    }
    for (const [i, c] of Object.entries(f.cambios.mc || {})) { const q = e.mc[i]; if (q) Object.assign(q, c); }
  }
  return e;
}
