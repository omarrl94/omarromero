/**
 * Exámenes: se guardan en el almacén «examenes» y los sube el profesor
 * desde /profesor/. Contienen las soluciones, así que nunca se envían
 * enteros al alumno: ver `enunciado()`.
 *
 * Formato (el mismo que los arrays MC y OPEN de los HTML de cuestionario, ampliado):
 *  mc:   [{ t: "pregunta", o: ["opción a", "opción b", …], c: índiceCorrecta, exp?: "justificación" }]
 *  open: [{ act?: "actividad", t: "pregunta", groups: [["raíz", …], …],
 *           full: nºConceptosParaBien, partial: nºConceptosParaCasi, exp: "qué se esperaba",
 *           pesos?: [puntos de cada concepto] (rúbrica) }]
 *  num:  [{ t: "apartado", campos: [
 *             { etiqueta, tipo: "numero", valor, unidad, tolerancia (%) } |
 *             { etiqueta, tipo: "opcion", opciones: [...], correcta } ], exp?: "resolución" }]
 *  En todas: puntos? (por defecto 1) y bloque? (id de un elemento de `bloques`).
 *  bloques: [{ id, titulo, texto, imagen? (data URL) }] → enunciado común de un ejercicio.
 *  confianza: true → el test se puntúa con nivel de confianza (CONFIANZA).
 *  partes: { mc?, open?, num? } → títulos de cada parte.
 */
import { almacen } from "./almacen.mjs";
import { fallo, texto } from "./http.mjs";
import semillaSad from "./semilla-sad-temas-1-2.mjs";
import semillaIa from "./semilla-ia-tema-1.mjs";
import semillaSea from "./semilla-sea-temas-1-2.mjs";
import { buscarModulo, moduloPorNombre } from "./catalogo.mjs";

const str = (v, max, campo) => {
  if (typeof v !== "string" || !v.trim()) fallo(400, `Falta «${campo}»`);
  return v.trim().slice(0, max);
};

/** Test con nivel de confianza: factor sobre los puntos de la pregunta si acierta / si falla. */
export const CONFIANZA = [
  { nombre: "Muy seguro", acierto: 1, fallo: -1 },
  { nombre: "Seguro", acierto: 0.7, fallo: -0.5 },
  { nombre: "Poco seguro", acierto: 0.5, fallo: -0.3 },
];

const puntosDe = (v, n) => {
  if (v === undefined || v === null || v === "") return 1;
  const p = Number(v);
  if (!Number.isFinite(p) || p <= 0 || p > 100) fallo(400, `La ${n} tiene una puntuación no válida`);
  return Math.round(p * 1000) / 1000;
};
const opc = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function validarBloques(lista) {
  if (lista === undefined) return [];
  if (!Array.isArray(lista) || lista.length > 50) fallo(400, "Bloques no válidos");
  let peso = 0;
  const bloques = lista.map((b, i) => {
    const id = String(b?.id || "").trim().slice(0, 40);
    if (!id) fallo(400, `Al bloque ${i + 1} le falta el id`);
    let imagen = "";
    if (b.imagen) {
      if (typeof b.imagen !== "string" || !/^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(b.imagen)) fallo(400, `La imagen del bloque ${i + 1} no es válida`);
      peso += b.imagen.length;
      imagen = b.imagen;
    }
    return { id, titulo: opc(b.titulo, 300), texto: opc(b.texto, 4000), imagen };
  });
  if (peso > 1_500_000) fallo(400, "Las imágenes del examen ocupan demasiado (máximo 1 MB en total)");
  return bloques;
}

function validarNum(lista, bloques) {
  if (lista === undefined) return [];
  if (!Array.isArray(lista) || lista.length > 100) fallo(400, "Ejercicios no válidos");
  return lista.map((q, i) => {
    const n = `pregunta de ejercicio ${i + 1}`;
    if (!Array.isArray(q?.campos) || !q.campos.length || q.campos.length > 6) fallo(400, `La ${n} debe tener entre 1 y 6 resultados`);
    const campos = q.campos.map((c, j) => {
      const et = opc(c?.etiqueta, 200) || `Resultado ${j + 1}`;
      if (c?.tipo === "opcion") {
        if (!Array.isArray(c.opciones) || c.opciones.length < 2 || c.opciones.length > 6) fallo(400, `La ${n}, «${et}», debe tener entre 2 y 6 opciones`);
        if (!Number.isInteger(c.correcta) || c.correcta < 0 || c.correcta >= c.opciones.length) fallo(400, `La ${n}, «${et}», no tiene opción correcta`);
        return { etiqueta: et, tipo: "opcion", opciones: c.opciones.map((o) => str(String(o ?? ""), 300, `${n}, opción`)), correcta: c.correcta };
      }
      const valor = Number(c?.valor);
      if (!Number.isFinite(valor)) fallo(400, `La ${n}, «${et}», necesita un valor numérico`);
      const tol = c.tolerancia === undefined ? 2 : Number(c.tolerancia);
      if (!Number.isFinite(tol) || tol < 0 || tol > 50) fallo(400, `La ${n}, «${et}», tiene una tolerancia no válida`);
      return { etiqueta: et, tipo: "numero", valor, unidad: opc(c.unidad, 20), tolerancia: tol };
    });
    return { t: str(q.t, 2000, n), campos, puntos: puntosDe(q.puntos, n), exp: opc(q.exp, 3000), bloque: bloqueValido(q.bloque, bloques) };
  });
}
const bloqueValido = (id, bloques) => (id && bloques.some((b) => b.id === id) ? String(id) : "");

export function validarExamen(e) {
  if (!e || typeof e !== "object") fallo(400, "Examen no válido");
  const id = String(e.id || "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(id)) fallo(400, "El identificador solo puede tener minúsculas, números y guiones");
  if (!Array.isArray(e.mc)) e.mc = [];
  if (!Array.isArray(e.open)) e.open = [];
  const bloques = validarBloques(e.bloques);
  const num = validarNum(e.num, bloques);
  if (e.mc.length + e.open.length + num.length === 0) fallo(400, "El examen no tiene preguntas");
  if (e.mc.length > 200 || e.open.length > 100) fallo(400, "Demasiadas preguntas");

  const mc = e.mc.map((q, i) => {
    const n = `pregunta test ${i + 1}`;
    if (!Array.isArray(q?.o) || q.o.length < 2 || q.o.length > 5) fallo(400, `La ${n} debe tener entre 2 y 5 opciones`);
    if (!Number.isInteger(q.c) || q.c < 0 || q.c >= q.o.length) fallo(400, `La ${n} no tiene una respuesta correcta válida (c)`);
    return { t: str(q.t, 2000, n), o: q.o.map((o, j) => str(String(o ?? ""), 1000, `${n}, opción ${j + 1}`)), c: q.c,
      puntos: puntosDe(q.puntos, n), exp: opc(q.exp, 2000), bloque: bloqueValido(q.bloque, bloques) };
  });
  const open = e.open.map((q, i) => {
    const n = `pregunta abierta ${i + 1}`;
    if (!Array.isArray(q?.groups) || !q.groups.length || !q.groups.every((g) => Array.isArray(g) && g.length && g.every((s) => typeof s === "string" && s.trim())))
      fallo(400, `La ${n} necesita conceptos clave (groups)`);
    const full = Number(q.full), partial = Number(q.partial);
    if (!Number.isInteger(full) || !Number.isInteger(partial) || partial < 1 || partial > full || full > q.groups.length)
      fallo(400, `La ${n} tiene «full»/«partial» incoherentes`);
    let pesos;
    if (q.pesos !== undefined && q.pesos !== null) {
      if (!Array.isArray(q.pesos) || q.pesos.length !== q.groups.length || !q.pesos.every((x) => Number.isFinite(Number(x)) && Number(x) >= 0))
        fallo(400, `La ${n} tiene pesos de rúbrica que no cuadran con sus conceptos`);
      pesos = q.pesos.map(Number);
    }
    return {
      act: typeof q.act === "string" ? q.act.trim().slice(0, 300) : "",
      t: str(q.t, 2000, n),
      groups: q.groups.map((g) => g.map((s) => s.trim().slice(0, 100))),
      full, partial,
      exp: typeof q.exp === "string" ? q.exp.trim().slice(0, 2000) : "",
      puntos: puntosDe(q.puntos, n), ...(pesos ? { pesos } : {}), bloque: bloqueValido(q.bloque, bloques),
    };
  });
  const ubic = buscarModulo(e.cicloId, e.moduloId) || moduloPorNombre(e.ciclo, e.modulo);
  if (!ubic) fallo(400, "Elige el ciclo y el módulo del examen");
  return {
    id,
    titulo: str(e.titulo, 200, "título"),
    subtitulo: texto(e.subtitulo, 300),
    cicloId: ubic.ciclo.id,
    moduloId: ubic.modulo.id,
    ciclo: ubic.ciclo.nombre,
    modulo: ubic.modulo.nombre,
    orden: Number.isFinite(Number(e.orden)) ? Number(e.orden) : 0,
    publicado: e.publicado === true,
    mostrarSoluciones: e.mostrarSoluciones !== false,
    // Modo seguro: si el alumno cambia de pantalla, el examen se entrega solo.
    seguridad: e.seguridad !== false,
    // Intentos por alumno (0 = sin límite) y qué intento cuenta para la nota.
    intentos: intentosValidos(e.intentos),
    calificacion: e.calificacion === "ultima" ? "ultima" : "mejor",
    // Herramientas que el alumno tiene durante el examen (sin salir de la página).
    herramientas: herramientasValidas(e.herramientas),
    confianza: e.confianza === true,
    partes: { mc: opc(e.partes?.mc, 80), open: opc(e.partes?.open, 80), num: opc(e.partes?.num, 80) },
    bloques, mc, open, num,
  };
}

export const HERRAMIENTAS = ["notas", "calculadora"];
export const herramientasValidas = (h) => Object.fromEntries(HERRAMIENTAS.map((k) => [k, h?.[k] === true]));

/** Número de intentos: entero de 0 (sin límite) a 50; por defecto, 1. */
export function intentosValidos(v) {
  const n = Number(v ?? 1);
  return Number.isInteger(n) && n >= 0 && n <= 50 ? n : 1;
}

/** Lo que ve el alumno antes de entregar: sin soluciones ni criterios. */
export const enunciado = (ex) => ({
  id: ex.id, titulo: ex.titulo, subtitulo: ex.subtitulo, modulo: ex.modulo, ciclo: ex.ciclo, cicloId: ex.cicloId, moduloId: ex.moduloId,
  seguridad: ex.seguridad !== false,
  intentos: ex.intentos ?? 1, calificacion: ex.calificacion || "mejor",
  herramientas: herramientasValidas(ex.herramientas),
  confianza: !!ex.confianza, confianzaTabla: ex.confianza ? CONFIANZA : null,
  partes: ex.partes || {}, bloques: ex.bloques || [],
  mc: ex.mc.map(({ t, o, puntos, bloque }) => ({ t, o, puntos: puntos ?? 1, bloque: bloque || "" })),
  open: ex.open.map(({ act, t, puntos, bloque }) => ({ act, t, puntos: puntos ?? 1, bloque: bloque || "" })),
  num: (ex.num || []).map(({ t, campos, puntos, bloque }) => ({
    t, puntos: puntos ?? 1, bloque: bloque || "",
    campos: campos.map(({ etiqueta, tipo, unidad, opciones }) => ({ etiqueta, tipo, unidad: unidad || "", opciones: opciones || null })),
  })),
});

export const resumen = (ex) => ({
  id: ex.id, titulo: ex.titulo, subtitulo: ex.subtitulo, modulo: ex.modulo, ciclo: ex.ciclo,
  cicloId: ex.cicloId, moduloId: ex.moduloId, orden: ex.orden || 0,
  nMc: ex.mc.length, nOpen: ex.open.length, nNum: (ex.num || []).length, publicado: ex.publicado, mostrarSoluciones: ex.mostrarSoluciones,
  seguridad: ex.seguridad !== false,
  intentos: ex.intentos ?? 1, calificacion: ex.calificacion || "mejor",
  herramientas: herramientasValidas(ex.herramientas),
  creado: ex.creado, actualizado: ex.actualizado, autor: ex.autor?.nombre || "",
});

/**
 * Exámenes que vienen con la plataforma. Cada uno se carga UNA sola vez:
 * si el profesor lo borra o lo edita después, no se vuelve a crear.
 * Para añadir otro: crea su archivo semilla-*.mjs y añádelo aquí.
 */
const SEMILLAS = [semillaSad, semillaIa, semillaSea];
let sembrado = false;

async function sembrar() {
  if (sembrado) return;
  const sis = almacen("sistema");
  const hechas = (await sis.get("semillas")) || {};
  const antigua = await sis.get("semilla"); // versión anterior: solo marcaba el de SAD
  if (antigua && !hechas[semillaSad.id]) hechas[semillaSad.id] = antigua.fecha || true;
  const store = almacen("examenes");
  let cambios = false;
  for (const s of SEMILLAS) {
    if (hechas[s.id]) continue;
    if (!(await store.get(s.id))) {
      const ahora = new Date().toISOString();
      await store.set(s.id, { ...validarExamen({ ...s, publicado: true }), creado: ahora, actualizado: ahora });
    }
    hechas[s.id] = new Date().toISOString();
    cambios = true;
  }
  if (cambios) await sis.set("semillas", hechas);
  sembrado = true;
}

export async function todosLosExamenes() {
  await sembrar();
  const store = almacen("examenes");
  const lista = (await Promise.all((await store.list()).map((k) => store.get(k)))).filter(Boolean);
  // Orden: por `orden` y, a igualdad, por título (Tema 1, Tema 2…).
  return lista.sort((a, b) => (a.orden || 0) - (b.orden || 0) || a.titulo.localeCompare(b.titulo, "es", { numeric: true }));
}

export async function obtenerExamen(id) {
  if (typeof id !== "string" || !id) return null;
  await sembrar();
  return almacen("examenes").get(id);
}
