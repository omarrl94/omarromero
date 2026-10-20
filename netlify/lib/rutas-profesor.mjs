/**
 * /api/profesor/* — gestión de exámenes, entregas y alumnos.
 * Admin: todo. Profesor aprobado: solo lo de sus ciclos (lo comprueba cada ruta).
 */
import { almacen, leerTodas } from "./almacen.mjs";
import { json, fallo, leerCuerpo, texto } from "./http.mjs";
import { requiereProfesor, esAdmin, rolDe, ciclosDe, gestionaCiclo, gestionaExamen } from "./auth.mjs";
import { notasTrabajos, trabajosDeAlumno } from "./rutas-trabajos.mjs";
import { todosLosExamenes, obtenerExamen, validarExamen, resumen, intentosValidos, herramientasValidas, HERRAMIENTAS, aleatorioValido, raValidos } from "./examenes.mjs";
import { versionExamen, semillaDe, comprobarFormulas, esAleatorio, comprobarPropuesta, aplicarPropuestas } from "./variantes.mjs";
import { secreto } from "./auth.mjs";
import { ventanaValida, duracionValida, codigoValido, adaptacionValida, plazo, codigoPersonal } from "./plazos.mjs";
import { validarCircuitos } from "./circuitos.mjs";
import { registrar, conservar, conservarYBorrar, registrarIA, seudonimizar, leerRegistro, conservadasDe } from "./registro.mjs";
import {
  claveEntrega, vistaEntrega, partesDe, historialDe, intentosHechos, intentosPermitidos,
  consolidar, conIntento, validarAjustes, resultadoCon, puntuarPregunta, porRevisar,
} from "./entregas.mjs";
import { proveedorConfigurado, enviarCorreo } from "./correo.mjs";
import { correoAviso } from "./plantillas.mjs";
import { nombreCompleto } from "./rutas-cuenta.mjs";
import { CATALOGO, GRUPOS, cicloDe, moduloVisible, buscarModulo, crearModulo, borrarModulo, cursosModulo, renombrarModulo } from "./catalogo.mjs";
import { iaDisponible, motivoSinIA, generarLote, proveedorIA, tamLote, comprobarIA, adaptarParte, sugerirCorreccion, proponerAleatorio } from "./ia.mjs";

const examenes = () => almacen("examenes");
const entregas = () => almacen("entregas");
const progreso = () => almacen("progreso");
const usuarios = () => almacen("usuarios");
/** Notas importadas de otro cuaderno (Additio, Alexia, Excel): «grupo/módulo/id» → columna. */
const externas = () => almacen("notasExternas");

/** Examen que este profesor puede gestionar (el admin, cualquiera; el profesor, los suyos). */
async function existente(id, u) {
  const ex = await obtenerExamen(id);
  if (!gestionaExamen(u, ex)) fallo(404, "Examen no encontrado");
  return ex;
}

/** Entrega de uno de los exámenes del profesor. */
async function entregaPermitida(id, email, u) {
  const k = claveEntrega(String(id || ""), String(email || "").toLowerCase());
  const e = await entregas().get(k);
  if (!e || !gestionaExamen(u, (await obtenerExamen(e.examen.id)) || e.examen)) fallo(404, "Entrega no encontrada");
  return { k, e };
}

/** Para el registro de cambios. */
const sobreEx = (ex) => ({ tipo: "examen", id: ex.id, titulo: ex.titulo, cicloId: ex.cicloId });
const notaDe = (x) => (x ? { nota: x.resultado?.nota ?? null, ...(x.notaProfesor != null ? { notaProfesor: x.notaProfesor } : {}) } : null);

const catalogoDe = (u) => CATALOGO.filter((c) => ciclosDe(u).includes(c.id));
const gruposDe = (u) => GRUPOS().filter((g) => ciclosDe(u).includes(g.cicloId));

async function listar(req) {
  const u = await requiereProfesor(req);
  const lista = (await todosLosExamenes()).filter((ex) => gestionaExamen(u, ex));
  const filas = await Promise.all(lista.map(async (ex) => ({
    ...resumen(ex), entregas: (await entregas().list(ex.id + "/")).length,
  })));
  return json({ catalogo: catalogoDe(u), examenes: filas, correo: !!proveedorConfigurado() });
}

async function verExamen(req, url) {
  const u = await requiereProfesor(req);
  const { publicado, mostrarSoluciones, ...ex } = await existente(url.searchParams.get("id"), u);
  return json({ ...ex, publicado, mostrarSoluciones });
}

/**
 * Una versión del examen tal como la vería un alumno (con soluciones), para
 * imprimir varias versiones (A, B, C…) o ver un ejemplo. n = 0 → el original.
 */
async function version(req, url) {
  const u = await requiereProfesor(req);
  const ex = await existente(url.searchParams.get("id"), u);
  const n = Math.max(0, Math.min(26, Number(url.searchParams.get("n")) || 0));
  const v = versionExamen(ex, n ? semillaDe(await secreto(), "version", ex.id, n) : null);
  const { publicado, mostrarSoluciones, ...m } = v.mostrado;
  return json({ ...m, variables: undefined, version: n, aleatorio: ex.aleatorio, avisos: comprobarFormulas(ex) });
}

/* ── Valores aleatorios con IA: una parte cada vez (un ejercicio o un grupo de preguntas de test) ── */

/** Qué partes del examen pueden tener valores aleatorios (el panel las pide de una en una). */
export function partesAleatorizables(ex) {
  const partes = [];
  const conNumeros = (q) => /\d/.test(q.t + q.o.join(" "));
  const mcNum = ex.mc.map((q, i) => (conNumeros(q) ? i : -1)).filter((i) => i >= 0);
  for (let k = 0; k < mcNum.length; k += 8) partes.push({ tipo: "test", preguntas: mcNum.slice(k, k + 8), titulo: `Test (preguntas ${mcNum.slice(k, k + 8).map((i) => i + 1).join(", ")})` });
  const vistos = new Set();
  (ex.num || []).forEach((q, i) => {
    if (q.bloque) {
      if (vistos.has(q.bloque)) return;
      vistos.add(q.bloque);
      const b = ex.bloques.find((x) => x.id === q.bloque);
      partes.push({ tipo: "ejercicio", bloque: q.bloque, apartados: ex.num.map((x, k) => (x.bloque === q.bloque ? k : -1)).filter((k) => k >= 0), titulo: b?.titulo || q.bloque });
    } else partes.push({ tipo: "ejercicio", bloque: "", apartados: [i], titulo: q.t.slice(0, 60) });
  });
  return partes;
}

function materialParte(ex, parte) {
  if (parte.tipo === "test") {
    return "PREGUNTAS DE TEST (numeradas desde 1):\n" + parte.preguntas.map((i, n) => {
      const q = ex.mc[i];
      return `${n + 1}. ${q.t}\n${q.o.map((o, j) => `   ${"abcdef"[j]}) ${o}${j === q.c ? "   ← CORRECTA" : ""}`).join("\n")}${q.exp ? `\n   Explicación: ${q.exp}` : ""}`;
    }).join("\n\n");
  }
  const b = parte.bloque ? ex.bloques.find((x) => x.id === parte.bloque) : null;
  let t = "";
  if (b) t += `EJERCICIO: ${b.titulo || ""}\nEnunciado común: ${b.texto || "(sin texto)"}\nFigura: ${b.imagen ? "SÍ (tiene una figura que puede mostrar valores)" : "no"}\n\n`;
  t += "APARTADOS (numerados desde 1; sus resultados también desde 1):\n" + parte.apartados.map((i, n) => {
    const q = ex.num[i];
    return `${n + 1}. ${q.t}\n${q.campos.map((c, j) => `   resultado ${j + 1}: «${c.etiqueta}» = ${c.tipo === "opcion" ? `opción «${c.opciones[c.correcta]}» de [${c.opciones.join(" / ")}] (cualitativo)` : `${c.valor} ${c.unidad || ""}`}`).join("\n")}${q.exp ? `\n   Resolución: ${q.exp}` : ""}`;
  }).join("\n\n");
  return t;
}

async function iaAleatorio(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const ex = await existente(b.id, u);
  if ((ex.variables || []).length) fallo(409, "Este examen ya tiene valores aleatorios.");
  const partes = partesAleatorizables(ex);
  if (b.listar) return json({ partes: partes.map(({ titulo, tipo }) => ({ titulo, tipo })) });
  const k = Number(b.parte), parte = partes[k];
  if (!parte) fallo(400, "Parte no válida");
  const instruccion = parte.tipo === "test"
    ? "Haz aleatorias las preguntas de test que tengan datos numéricos: escribe enunciado y opciones con marcadores (las opciones como cálculos {{=…}}), manteniendo la opción correcta en la misma posición y con distractores que sigan siendo incorrectos para cualquier valor. En «test» pon solo las preguntas que cambies (con su número). Deja «texto» y «apartados» vacíos."
    : "Haz aleatorio este ejercicio: define las variables, reescribe con marcadores el enunciado común («texto»; vacío si no cambia) y los apartados que cambien (con su número «i»), y da la fórmula de TODOS los resultados numéricos (con su número «j»; si no dependen de los datos, el propio número). Reescribe también la resolución («exp») con cálculos {{=…}}. Deja «test» vacío.";
  const prop = await proponerAleatorio({ material: materialParte(ex, parte), instruccion });
  await registrarIA(u, "valores aleatorios", { examen: ex.id });
  const r = comprobarPropuesta(ex, parte, prop, k + 1);
  return json({ titulo: parte.titulo, ...r });
}

/** Guarda en el examen las partes aleatorias aceptadas y activa «Valores». */
async function aplicarAleatorio(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req, 1_000_000);
  const ex = await existente(b.id, u);
  const fragmentos = (Array.isArray(b.fragmentos) ? b.fragmentos : []).filter((f) => f && Array.isArray(f.variables) && f.cambios);
  if (!fragmentos.length) fallo(400, "No hay ninguna parte aleatoria que guardar");
  const nuevo = validarExamen({ ...aplicarPropuestas(ex, fragmentos), aleatorio: { ...ex.aleatorio, valores: true } });
  const avisos = comprobarFormulas(nuevo);
  if (avisos.length) fallo(400, `No se ha guardado: ${avisos[0]}`);
  await examenes().set(ex.id, { ...nuevo, publicado: ex.publicado, creado: ex.creado, actualizado: new Date().toISOString(), autor: ex.autor });
  return json({ ok: true, variables: nuevo.variables.length });
}

async function guardar(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req, 2_000_000);
  const ex = validarExamen(b);
  if (!gestionaCiclo(u, ex.cicloId)) fallo(403, "Solo puedes crear exámenes de tus ciclos");
  const previo = await examenes().get(ex.id);
  if (previo && !gestionaExamen(u, previo)) fallo(409, `El identificador «${ex.id}» ya lo usa otro examen. Elige otro.`);
  if (previo?.privado) fallo(409, "Este examen es la defensa de un trabajo: se gestiona desde la pestaña Trabajos.");
  if (previo && !b.sobrescribir) fallo(409, `Ya existe un examen con el identificador «${ex.id}». Marca «Reemplazar» o cambia el identificador.`);
  // Al reemplazar un examen sin indicar intentos, se conservan los que tenía.
  if (previo && b.intentos === undefined) ex.intentos = previo.intentos ?? 1;
  if (previo && b.calificacion === undefined) ex.calificacion = previo.calificacion || "mejor";
  if (previo && b.herramientas === undefined) ex.herramientas = herramientasValidas(previo.herramientas);
  if (previo && b.aleatorio === undefined) ex.aleatorio = aleatorioValido(previo.aleatorio);
  // El horario y el código se conservan al reemplazar el examen.
  if (previo && b.ventana === undefined) ex.ventana = previo.ventana || ex.ventana;
  if (previo && b.duracion === undefined) ex.duracion = previo.duracion || 0;
  if (previo && b.codigo === undefined) ex.codigo = previo.codigo || "";
  if (previo && b.identidad === undefined) ex.identidad = !!previo.identidad;
  if (previo && b.ra === undefined) ex.ra = previo.ra || [];
  if (previo && b.conIA === undefined) ex.conIA = !!previo.conIA;
  if (previo && b.circuitos === undefined) { try { ex.circuitos = validarCircuitos(previo.circuitos, ex.num, ex.bloques); } catch { ex.circuitos = []; } }
  const ahora = new Date().toISOString();
  await examenes().set(ex.id, {
    ...ex, creado: previo?.creado || ahora, actualizado: ahora,
    autor: previo?.autor || { email: u.email, nombre: `${u.nombre} ${u.apellidos}`.trim() },
  });
  return json({ ok: true, id: ex.id });
}

async function ajustes(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const ex = await existente(b.id, u);
  if (typeof b.publicado === "boolean") ex.publicado = b.publicado;
  if (typeof b.mostrarSoluciones === "boolean") ex.mostrarSoluciones = b.mostrarSoluciones;
  if (typeof b.seguridad === "boolean") ex.seguridad = b.seguridad;
  if (Number.isFinite(b.orden)) ex.orden = b.orden;
  if (b.intentos !== undefined) {
    if (intentosValidos(b.intentos) !== Number(b.intentos)) fallo(400, "Los intentos deben ser un número entre 0 (sin límite) y 50");
    ex.intentos = Number(b.intentos);
  }
  // Aleatorio: orden de preguntas, de opciones y valores ({ aleatorio: { opciones: true } }).
  if (b.aleatorio && typeof b.aleatorio === "object") {
    const a = aleatorioValido(ex.aleatorio);
    for (const k of ["preguntas", "opciones", "valores"]) if (typeof b.aleatorio[k] === "boolean") a[k] = b.aleatorio[k];
    if (a.valores && !(ex.variables || []).length) fallo(400, "Este examen no tiene valores variables. Prepáralos antes con «✨ Valores aleatorios con IA».");
    ex.aleatorio = a;
  }
  // Herramientas: se cambian de una en una ({ herramientas: { calculadora: true } }).
  if (b.herramientas && typeof b.herramientas === "object") {
    const h = herramientasValidas(ex.herramientas);
    for (const k of HERRAMIENTAS) if (typeof b.herramientas[k] === "boolean") h[k] = b.herramientas[k];
    ex.herramientas = h;
  }
  // Horario: ventana para empezar, duración y código de acceso («nuevo» genera uno).
  if (b.ventana !== undefined) ex.ventana = ventanaValida(b.ventana);
  if (b.duracion !== undefined) ex.duracion = duracionValida(b.duracion);
  if (b.codigo !== undefined) ex.codigo = codigoValido(b.codigo);
  if (typeof b.identidad === "boolean") ex.identidad = b.identidad;
  if (b.ra !== undefined) ex.ra = raValidos(b.ra);
  if (b.circuitos !== undefined) ex.circuitos = validarCircuitos(b.circuitos, ex.num, ex.bloques);
  const cambiaCalif = (b.calificacion === "mejor" || b.calificacion === "ultima") && b.calificacion !== (ex.calificacion || "mejor");
  if (cambiaCalif) ex.calificacion = b.calificacion;
  ex.actualizado = new Date().toISOString();
  await examenes().set(ex.id, ex);
  // Si cambia qué intento cuenta, se recalcula la nota de cada entrega.
  if (cambiaCalif) {
    const ks = await entregas().list(ex.id + "/");
    await Promise.all(ks.map(async (k) => {
      const e = await entregas().get(k);
      if (e) await entregas().set(k, consolidar(e, historialDe(e), ex.calificacion));
    }));
  }
  if (cambiaCalif) await registrar({ por: u, accion: "qué intento cuenta", sobre: sobreEx(ex), despues: ex.calificacion, detalle: "Se recalculan las notas de todas las entregas" });
  return json({ ok: true, codigo: ex.codigo || "", ventana: ex.ventana, duracion: ex.duracion || 0, identidad: !!ex.identidad, ra: ex.ra || [], circuitos: ex.circuitos || [] });
}

async function borrar(req) {
  const u = await requiereProfesor(req);
  const { id } = await leerCuerpo(req);
  const ex = await existente(id, u);
  const [ke, kp] = await Promise.all([entregas().list(ex.id + "/"), progreso().list(ex.id + "/")]);
  // Las entregas se conservan el plazo legal (ver lib/registro.mjs) aunque se borre el examen.
  const motivo = `Examen borrado: ${ex.titulo}`;
  await conservarYBorrar("entregas", ke, { tipo: "entrega de examen", por: u, motivo });
  await conservarYBorrar("progreso", kp, { tipo: "progreso de examen", por: u, motivo });
  await conservar({ tipo: "examen", almacen: "examenes", clave: ex.id, datos: ex, por: u, motivo });
  await examenes().del(ex.id);
  await registrar({ por: u, accion: "examen borrado", sobre: sobreEx(ex), detalle: `${ke.length} entregas conservadas` });
  return json({ ok: true });
}

function intentosFila(ex, e, p) {
  const permitidos = intentosPermitidos(ex, p);
  return { intentos: intentosHechos(e), permitidos: Number.isFinite(permitidos) ? permitidos : null, extra: p?.extra || 0, vigente: (e?.vigente ?? 0) + 1 };
}

/** Una fila por alumno que ha empezado o entregado el examen. */
async function filasEntregas(ex) {
  const id = ex.id;
  const [es, ps] = await Promise.all([
    entregas().list(id + "/").then((k) => leerTodas(entregas(), k)),
    progreso().list(id + "/").then((k) => leerTodas(progreso(), k)),
  ]);
  const prog = Object.fromEntries(ps.map((p) => [p.email, p]));
  const filas = es.map((e) => ({
    email: e.email, nombre: e.nombre, apellidos: e.apellidos, grupo: e.grupo,
    estado: "entregado", nota: e.resultado.nota, notaProfesor: e.notaProfesor ?? null,
    partes: partesDe(e), fecha: e.fecha, fechaTexto: e.fechaTexto,
    salidas: prog[e.email]?.salidas?.length ?? e.salidas ?? 0,
    finalizadoPorSalida: e.finalizadoPorSalida || "",
    finalizadoPorTiempo: !!e.finalizadoPorTiempo, fueraDeTiempo: e.fueraDeTiempo || 0, tiempoUsado: e.tiempoUsado ?? null,
    porRevisar: porRevisar(e),
    validada: !!e.validada, revision: e.revision?.estado || null,
    reanudar: !!prog[e.email]?.reanudar,
    ...intentosFila(ex, e, prog[e.email]),
  }));
  const entregados = new Set(es.map((e) => e.email));
  const sinEntregar = ps.filter((p) => !entregados.has(p.email));
  const perfiles = await leerTodas(usuarios(), sinEntregar.map((p) => p.email));
  const porEmail = Object.fromEntries(perfiles.map((u) => [u.email, u]));
  for (const p of sinEntregar) {
    const u = porEmail[p.email] || {};
    filas.push({
      email: p.email, nombre: u.nombre || "", apellidos: u.apellidos || "", grupo: u.grupo || "",
      estado: "sin entregar", nota: null, notaProfesor: null, fecha: p.inicios?.at(-1) || null, fechaTexto: "",
      salidas: p.salidas?.length || 0,
      // En curso: última vez que se guardaron sus respuestas y cuántas lleva.
      enCurso: p.borrador ? { t: p.borrador.t, n: p.borrador.n } : null,
      reanudar: !!p.reanudar,
      // Examen con duración: hora a la que se le acaba el tiempo.
      limite: p.inicioIntento ? plazo(ex, u, p, p.inicioIntento.intento).limite : null,
      ...intentosFila(ex, null, p),
    });
  }
  // Adaptaciones del alumnado (tiempo extra, sin modo seguro): se muestran en la tabla.
  const adapt = Object.fromEntries((await leerTodas(usuarios(), filas.map((f) => f.email))).map((u) => [u.email, u.adaptacion || null]));
  filas.forEach((f) => (f.adaptacion = adapt[f.email] || null));
  return filas.sort((a, b) => `${a.grupo} ${a.apellidos} ${a.nombre}`.localeCompare(`${b.grupo} ${b.apellidos} ${b.nombre}`, "es"));
}

async function listarEntregas(req, url) {
  const u = await requiereProfesor(req);
  const ex = await existente(url.searchParams.get("id"), u);
  return json({ examen: resumen(ex), filas: await filasEntregas(ex) });
}

async function csv(req, url) {
  const u = await requiereProfesor(req);
  const ex = await existente(url.searchParams.get("id"), u);
  const filas = await filasEntregas(ex);
  const c = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const n = (v) => (v == null ? "" : String(v).replace(".", ","));
  const lineas = [
    ["Apellidos", "Nombre", "Correo", "Grupo", "Estado", "Nota automática", "Nota revisada", "Nota final",
      `Test (/${ex.mc.reduce((s, q) => s + (q.puntos ?? 1), 0)})`, `Abiertas (/${ex.open.reduce((s, q) => s + (q.puntos ?? 1), 0)})`,
      `Ejercicios (/${(ex.num || []).reduce((s, q) => s + (q.puntos ?? 1), 0)})`, "Fecha de entrega", "Intentos", "Intento que cuenta", "Salidas de la ventana", "Finalizado al salir"].map(c).join(";"),
    ...filas.map((f) => [c(f.apellidos), c(f.nombre), c(f.email), c(f.grupo), c(f.estado), n(f.nota), n(f.notaProfesor),
      n(f.notaProfesor ?? f.nota), n(f.partes?.mc.pts), n(f.partes?.open.pts), n(f.partes?.num.pts), c(f.fechaTexto), c(`${f.intentos}${f.permitidos ? " de " + f.permitidos : ""}`), n(f.intentos ? f.vigente : null), n(f.salidas), c(f.finalizadoPorSalida ? "Sí" : "")].join(";")),
  ];
  return new Response("﻿" + lineas.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="notas_${ex.id}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

async function verEntrega(req, url) {
  const u = await requiereProfesor(req);
  const { e } = await entregaPermitida(url.searchParams.get("id"), url.searchParams.get("email"), u);
  const p = await progreso().get(claveEntrega(e.examen.id, e.email));
  const i = url.searchParams.has("intento") ? Number(url.searchParams.get("intento")) - 1 : null;
  const v = conIntento(e, i);
  return json({ ...vistaEntrega(v, { soluciones: true }), ajustes: v.ajustes || null, registroSalidas: p?.salidas || [] });
}

async function revisar(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const { k, e } = await entregaPermitida(b.id, b.email, u);
  const h = historialDe(e).map((x) => ({ ...x }));
  const i = b.intento == null ? e.vigente ?? 0 : Number(b.intento) - 1;
  const x = h[i];
  if (!x) fallo(404, "Ese intento no existe");
  const antes = { ...notaDe(x), ...(x.comentario ? { comentario: x.comentario } : {}) };
  if (b.notaProfesor === null || b.notaProfesor === "" || b.notaProfesor === undefined) delete x.notaProfesor;
  else {
    const n = Number(String(b.notaProfesor).replace(",", "."));
    if (!Number.isFinite(n) || n < 0 || n > 10) fallo(400, "La nota debe estar entre 0 y 10");
    x.notaProfesor = Math.round(n * 100) / 100;
  }
  x.comentario = String(b.comentario ?? "").slice(0, 2000);
  // Puntos de cada pregunta cambiados por el profesor: se recalcula la nota del intento.
  if (b.ajustes !== undefined) {
    const aj = validarAjustes(x.examen, b.ajustes);
    if (aj) x.ajustes = aj; else delete x.ajustes;
    x.resultado = resultadoCon(x.examen, x.respuestas, aj);
  }
  const ex = await obtenerExamen(e.examen.id);
  consolidar(e, h, ex?.calificacion);
  // Guardar la revisión valida la nota (deja de ser provisional).
  const yaValidada = !!e.validada;
  e.validada = { por: u.email, fecha: new Date().toISOString() };
  await entregas().set(k, e);
  if (!yaValidada) await registrar({ por: u, accion: "nota validada", alumno: e.email, sobre: sobreEx(ex || e.examen), despues: { notaFinal: e.notaProfesor ?? e.resultado.nota } });
  const despues = { ...notaDe(x), ...(x.comentario ? { comentario: x.comentario } : {}) };
  if (JSON.stringify(antes) !== JSON.stringify(despues))
    await registrar({ por: u, accion: "revisión del intento", alumno: e.email, sobre: sobreEx(ex || e.examen), antes, despues, detalle: `Intento ${i + 1}${b.ajustes !== undefined ? " · puntos de las preguntas" : ""}` });
  return json({ ok: true, nota: x.resultado.nota, notaFinal: e.notaProfesor ?? e.resultado.nota, vigente: e.vigente + 1 });
}

async function reabrir(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const ex = await existente(b.id, u);
  const email = String(b.email || "").toLowerCase(), k = claveEntrega(ex.id, email);
  const e = await entregas().get(k);
  await conservarYBorrar("entregas", [k], { tipo: "entrega de examen", por: u, motivo: "Examen reabierto (vuelve a empezar)" });
  await conservarYBorrar("progreso", [k], { tipo: "progreso de examen", por: u, motivo: "Examen reabierto (vuelve a empezar)" });
  await almacen("circuitos").del(k);
  await registrar({ por: u, accion: "examen reabierto", alumno: email, sobre: sobreEx(ex), antes: e ? { notaFinal: e.notaProfesor ?? e.resultado?.nota, intentos: intentosHechos(e) } : null, despues: null, detalle: "La entrega anterior se conserva" });
  return json({ ok: true });
}

/* ── Revisión rápida de respuestas escritas ── */

/** Todas las respuestas escritas y de ejercicios de un examen, para revisarlas pregunta a pregunta. */
async function respuestas(req, url) {
  const u = await requiereProfesor(req);
  const ex = await existente(url.searchParams.get("id"), u);
  const es = await entregas().list(ex.id + "/").then((k) => leerTodas(entregas(), k));
  const filas = [];
  for (const e of es) {
    historialDe(e).forEach((x, n) => {
      const r = x.resultado, a = x.ajustes || {};
      filas.push({
        email: e.email, nombre: e.nombre, apellidos: e.apellidos, grupo: e.grupo,
        intento: n + 1, intentos: historialDe(e).length, vigente: n === (e.vigente ?? 0),
        nota: x.resultado.nota, notaProfesor: x.notaProfesor ?? null,
        open: x.examen.open.map((q, i) => ({
          texto: x.respuestas.open[i] || "", v: r.opRev[i].v, pts: r.opRev[i].pts ?? 0, max: q.puntos ?? 1,
          hechos: r.opRev[i].hechos || null, revisada: a.open?.[i] != null, blanco: !String(x.respuestas.open[i] || "").trim(),
        })),
        num: (x.examen.num || []).map((q, i) => ({
          campos: q.campos.map((c, j) => ({
            resp: c.tipo === "opcion" ? (x.respuestas.num?.[i]?.[j] >= 0 ? c.opciones[x.respuestas.num[i][j]] : "") : String(x.respuestas.num?.[i]?.[j] ?? ""),
            ok: !!r.numRev?.[i]?.campos[j]?.ok,
          })),
          pts: r.numRev?.[i]?.pts ?? 0, max: q.puntos ?? 1, revisada: a.num?.[i] != null,
        })),
      });
    });
  }
  filas.sort((a, b) => `${a.grupo} ${a.apellidos} ${a.nombre}`.localeCompare(`${b.grupo} ${b.apellidos} ${b.nombre}`, "es") || a.intento - b.intento);
  return json({
    examen: {
      id: ex.id, titulo: ex.titulo, confianza: !!ex.confianza,
      open: ex.open.map((q) => ({ t: q.t, act: q.act || "", exp: q.exp || "", puntos: q.puntos ?? 1, conceptos: q.groups.map((g) => g[0]) })),
      num: (ex.num || []).map((q) => ({
        t: q.t, puntos: q.puntos ?? 1,
        campos: q.campos.map((c) => ({ etiqueta: c.etiqueta, correcto: c.tipo === "opcion" ? c.opciones[c.correcta] : `${c.valor} ${c.unidad || ""}`.trim() })),
      })),
    },
    ia: iaDisponible(),
    filas,
  });
}

/** Valida de una vez las notas de un examen (dejan de ser provisionales). */
async function validarNotas(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const ex = await existente(b.id, u);
  const solo = Array.isArray(b.emails) ? new Set(b.emails.map((x) => String(x).toLowerCase())) : null;
  let n = 0;
  for (const k of await entregas().list(ex.id + "/")) {
    const e = await entregas().get(k);
    if (!e || e.validada || (solo && !solo.has(e.email))) continue;
    e.validada = { por: u.email, fecha: new Date().toISOString() };
    await entregas().set(k, e);
    await registrar({ por: u, accion: "nota validada", alumno: e.email, sobre: sobreEx(ex), despues: { notaFinal: e.notaProfesor ?? e.resultado.nota, pendientesDeRevisar: porRevisar(e) } });
    n++;
  }
  return json({ ok: true, validadas: n });
}

/** El profesor responde a una solicitud de revisión de la nota. */
async function responderRevision(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const { k, e } = await entregaPermitida(b.id, b.email, u);
  if (!e.revision) fallo(404, "No hay ninguna solicitud de revisión");
  const respuesta = String(b.respuesta ?? "").trim().slice(0, 3000);
  if (respuesta.length < 3) fallo(400, "Escribe la respuesta para el alumno");
  e.revision = { ...e.revision, estado: "respondida", respuesta, respondida: new Date().toISOString(), por: `${u.nombre} ${u.apellidos}`.trim() };
  await entregas().set(k, e);
  await registrar({ por: u, accion: "revisión respondida", alumno: e.email, sobre: sobreEx(e.examen), despues: { notaFinal: e.notaProfesor ?? e.resultado.nota }, detalle: respuesta.slice(0, 300) });
  if (proveedorConfigurado()) {
    const c = correoAviso(e.nombre, `Respuesta a tu solicitud de revisión: ${e.examen.titulo}`, `Tu profesor ha respondido a tu solicitud de revisión del examen «${e.examen.titulo}»: ${respuesta}`);
    enviarCorreo({ to: e.email, subject: c.asunto, html: c.html, text: c.text }).catch((x) => console.error("Aviso revisión:", x));
  }
  return json({ ok: true });
}

/** Válida / medio válida / no válida (o «auto») en una pregunta de un intento. Se guarda al momento. */
async function puntuar(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const { k, e } = await entregaPermitida(b.id, b.email, u);
  const ex = await obtenerExamen(e.examen.id);
  const i = Number(b.i);
  if (!Number.isInteger(i) || i < 0) fallo(400, "Pregunta no válida");
  const ii = b.intento == null ? e.vigente ?? 0 : Number(b.intento) - 1;
  const revDe = (x) => (b.k === "num" ? x?.resultado.numRev?.[i] : b.k === "mc" ? x?.resultado.mcRev?.[i] : x?.resultado.opRev?.[i]);
  const x0 = historialDe(e)[ii], antes = { pts: revDe(x0)?.pts ?? null, nota: x0?.resultado.nota ?? null };
  puntuarPregunta(e, b.intento == null ? null : Number(b.intento) - 1, String(b.k), i, String(b.valor), ex?.calificacion);
  await entregas().set(k, e);
  const x = historialDe(e)[b.intento == null ? e.vigente : Number(b.intento) - 1];
  const rev = revDe(x);
  const NOMBRE = { mc: "test", open: "pregunta", num: "ejercicio" };
  await registrar({ por: u, accion: "puntos de una pregunta", alumno: e.email, sobre: sobreEx(ex || e.examen), antes, despues: { pts: rev.pts, nota: x.resultado.nota, valor: String(b.valor) },
    ia: b.ia === true, detalle: `Intento ${ii + 1} · ${NOMBRE[b.k] || b.k} ${i + 1}${b.ia === true ? " · sugerencia de la IA aceptada" : ""}` });
  return json({ ok: true, pts: rev.pts, notaIntento: x.resultado.nota, notaFinal: e.notaProfesor ?? e.resultado.nota, porRevisar: porRevisar(e) });
}

/** La IA propone cómo corregir las respuestas de una pregunta abierta. No guarda nada. */
async function iaCorregir(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req, 200_000);
  const ex = await existente(b.id, u);
  const i = Number(b.i), q = ex.open[i];
  if (!q) fallo(400, "Pregunta no válida");
  const pedidas = (Array.isArray(b.refs) ? b.refs : []).slice(0, 40);
  // A la IA no se le manda quién es cada alumno: cada respuesta va con un número (r1, r2…)
  // y sin correos, DNI, teléfonos ni el nombre del alumno.
  const respuestas = [], refs = {};
  for (const r of pedidas) {
    const e = await entregas().get(claveEntrega(ex.id, String(r.email || "").toLowerCase()));
    const x = historialDe(e)[Number(r.intento) - 1];
    if (x && x.examen.open.length === ex.open.length) {
      const ref = `r${respuestas.length + 1}`;
      refs[ref] = `${e.email}#${r.intento}`;
      respuestas.push({ ref, texto: seudonimizar(String(x.respuestas.open[i] || "").slice(0, 3000), [e]) });
    }
  }
  if (!respuestas.length) return json({ sugerencias: [] });
  const sugerencias = await sugerirCorreccion({ pregunta: q.t, modelo: q.exp, conceptos: q.groups.map((g) => g.join(", ")), respuestas });
  await registrarIA(u, "sugerir corrección", { examen: ex.id, pregunta: i + 1, respuestas: respuestas.length, seudonimizado: true });
  return json({ sugerencias: sugerencias.map((x) => ({ ...x, ref: refs[x.ref] })).filter((x) => x.ref) });
}

/**
 * Reanudar un examen donde lo dejó el alumno (por si ha sido un error):
 *  · Sin entregar (se le cerró, o el modo seguro no le deja volver a entrar):
 *    puede volver a entrar y recupera las respuestas guardadas.
 *  · Entregado (p. ej. se le entregó solo al salir de la ventana): se anula
 *    ese último intento y sus respuestas vuelven a quedar abiertas para seguir.
 */
async function reanudar(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const ex = await existente(b.id, u);
  const email = String(b.email || "").toLowerCase();
  const k = claveEntrega(ex.id, email);
  const [e, p0] = await Promise.all([entregas().get(k), progreso().get(k)]);
  if (!e && !p0) fallo(404, "Este alumno no ha empezado el examen");
  const p = p0 || { email, examen: ex.id, salidas: [] };
  const h = historialDe(e);
  let anulado = null;
  if (b.anularEntrega) {
    const ultimo = h.at(-1);
    if (!ultimo) fallo(400, "No hay ninguna entrega que reanudar");
    await conservar({ tipo: "entrega de examen", almacen: "entregas", clave: k, datos: e, alumno: email, por: u, motivo: "Entrega anulada para que el alumno siga con sus respuestas" });
    // Sus respuestas vuelven a ser el borrador del intento (que vuelve a estar en curso).
    p.borrador = { respuestas: ultimo.respuestas, t: new Date().toISOString(), intento: h.length, n: null, deEntrega: ultimo.fecha };
    if (h.length === 1) await entregas().del(k);
    else await entregas().set(k, consolidar(e, h.slice(0, -1), ex.calificacion));
    anulado = { nota: ultimo.notaProfesor ?? ultimo.resultado.nota, fecha: ultimo.fechaTexto };
    // Examen con duración: recupera el tiempo que le quedaba al entregarse.
    if (ultimo.tiempoUsado != null) p.inicioIntento = { intento: h.length, t: new Date(Date.now() - ultimo.tiempoUsado * 1000).toISOString() };
  } else if (p.inicioIntento) {
    // Se le cerró a mitad: el tiempo se para en su último guardado y sigue contando al reanudar.
    const usado = Math.max(0, Date.parse(p.borrador?.t || new Date().toISOString()) - Date.parse(p.inicioIntento.t));
    p.inicioIntento = { ...p.inicioIntento, t: new Date(Date.now() - usado).toISOString() };
  }
  p.reanudar = true;
  await progreso().set(k, p);
  await registrar({ por: u, accion: anulado ? "entrega anulada para reanudar" : "reanudar el examen", alumno: email, sobre: sobreEx(ex), antes: anulado, despues: null, detalle: anulado ? "La entrega anulada se conserva" : "" });
  return json({ ok: true, anulado });
}

/** Da (o quita) intentos extra a un alumno en un examen. */
async function intentoExtra(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const ex = await existente(b.id, u);
  const email = String(b.email || "").toLowerCase();
  const k = claveEntrega(ex.id, email);
  const [e, p0] = await Promise.all([entregas().get(k), progreso().get(k)]);
  if (!e && !p0) fallo(404, "Este alumno no ha empezado el examen");
  const p = p0 || { email, examen: ex.id, salidas: [] };
  const delta = b.cambio === -1 ? -1 : 1;
  const antes = p.extra || 0;
  p.extra = Math.max(0, Math.min(50, (p.extra || 0) + delta));
  await progreso().set(k, p);
  await registrar({ por: u, accion: "intentos extra", alumno: email, sobre: sobreEx(ex), antes, despues: p.extra });
  return json({ ok: true, extra: p.extra });
}

/** Borra un intento concreto (si era el único, borra la entrega). */
async function borrarIntento(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const { k, e } = await entregaPermitida(b.id, b.email, u);
  const h = historialDe(e);
  const i = Number(b.intento) - 1;
  if (!h[i]) fallo(404, "Ese intento no existe");
  await conservar({ tipo: "entrega de examen", almacen: "entregas", clave: k, datos: e, alumno: e.email, por: u, motivo: `Intento ${i + 1} borrado` });
  await registrar({ por: u, accion: "intento borrado", alumno: e.email, sobre: sobreEx(e.examen), antes: { intento: i + 1, ...notaDe(h[i]) }, despues: null, detalle: "El intento se conserva" });
  // Se devuelve el intento: en modo seguro también cuenta como no empezado.
  const p = await progreso().get(k);
  if (p?.inicios?.length) { p.inicios = p.inicios.slice(0, -1); await progreso().set(k, p); }
  if (h.length === 1) { await entregas().del(k); return json({ ok: true, borrada: true }); }
  const ex = await obtenerExamen(e.examen.id);
  await entregas().set(k, consolidar(e, h.filter((_, j) => j !== i), ex?.calificacion));
  return json({ ok: true });
}

/** Alumno al que este profesor puede gestionar (de sus ciclos; el admin, cualquiera). */
async function alumnoPermitido(email, yo) {
  const u = await usuarios().get(String(email || "").toLowerCase());
  const esAlumno = u && rolDe(u) === "alumno";
  if (!u || (!esAdmin(yo.email) && !(esAlumno && gestionaCiclo(yo, cicloDe(u))))) fallo(404, "Alumno no encontrado");
  return u;
}

async function alumnos(req) {
  const yo = await requiereProfesor(req);
  const admin = esAdmin(yo.email);
  // El profesor ve los alumnos de sus ciclos; el admin, todas las cuentas de alumno
  // (los profesores se gestionan en la pestaña «Profesores»).
  const lista = (await leerTodas(usuarios(), await usuarios().list()))
    .filter((u) => rolDe(u) === "alumno" && !u.egresado && (admin || gestionaCiclo(yo, cicloDe(u))));
  return json({
    grupos: gruposDe(yo),
    alumnos: lista
      .map((u) => ({ email: u.email, nombre: u.nombre, apellidos: u.apellidos, grupo: u.grupo, cicloId: cicloDe(u), verificado: !!u.verificado, creado: u.creado, profesor: false, externo: !!u.externo, adaptacion: u.adaptacion || null }))
      .sort((a, b) => `${a.grupo} ${a.apellidos}`.localeCompare(`${b.grupo} ${b.apellidos}`, "es")),
  });
}

async function editarAlumno(req) {
  const yo = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const u = await alumnoPermitido(b.email, yo);
  const antes = { grupo: u.grupo, adaptacion: u.adaptacion || null };
  if (b.grupo !== undefined) {
    const g = gruposDe(yo).find((x) => x.grupo === texto(b.grupo, 60));
    if (!g) fallo(400, "Grupo no válido");
    u.grupo = g.grupo;
    u.cicloId = g.cicloId;
  }
  if (b.verificado === true) { u.verificado = true; delete u.codigo; }
  // Adaptaciones (alumnado con necesidades específicas): tiempo extra y sin modo seguro.
  if (b.adaptacion !== undefined) { const a = adaptacionValida(b.adaptacion); if (a) u.adaptacion = a; else delete u.adaptacion; }
  if (b.nombre !== undefined || b.apellidos !== undefined) Object.assign(u, nombreCompleto(b.nombre ?? u.nombre, b.apellidos ?? u.apellidos));
  await usuarios().set(u.email, u);
  const despues = { grupo: u.grupo, adaptacion: u.adaptacion || null };
  if (JSON.stringify(antes) !== JSON.stringify(despues))
    await registrar({ por: yo, accion: antes.grupo !== despues.grupo ? "cambio de grupo" : "adaptación", alumno: u.email, sobre: { tipo: "cuenta", cicloId: cicloDe(u) }, antes, despues });
  return json({ ok: true });
}

async function borrarAlumno(req) {
  const yo = await requiereProfesor(req);
  const email = String((await leerCuerpo(req)).email || "").toLowerCase();
  if (email === yo.email) fallo(400, "No puedes borrar tu propia cuenta");
  const u = await alumnoPermitido(email, yo);
  if (esAdmin(u.email)) fallo(400, "No se puede borrar la cuenta del administrador");
  // Se borra la cuenta; sus entregas y notas se quedan (se borran al acabar el plazo de conservación).
  await conservar({ tipo: "cuenta", almacen: "usuarios", clave: u.email, datos: { ...u, pass: undefined, codigo: undefined }, alumno: u.email, por: yo, motivo: "Cuenta borrada" });
  await usuarios().del(u.email);
  await registrar({ por: yo, accion: "cuenta borrada", alumno: u.email, sobre: { tipo: "cuenta", cicloId: cicloDe(u) }, antes: { nombre: `${u.nombre} ${u.apellidos}`, grupo: u.grupo } });
  return json({ ok: true });
}

/* ── Módulos de los ciclos (los crea el profesor o el admin) ── */
async function nuevoModulo(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  if (!gestionaCiclo(u, b.cicloId)) fallo(403, "Solo puedes crear módulos en tus ciclos");
  const nombre = texto(b.nombre, 120);
  if (nombre.length < 3) fallo(400, "Escribe el nombre del módulo");
  return json({ ok: true, modulo: await crearModulo(b.cicloId, nombre, b.grupos) });
}

/** Cambiar el nombre de un módulo; los exámenes del módulo se actualizan también. */
async function renombrar(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  if (!gestionaCiclo(u, b.cicloId)) fallo(403, "Solo puedes cambiar módulos de tus ciclos");
  const nombre = texto(b.nombre, 120);
  if (nombre.length < 3) fallo(400, "Escribe el nombre del módulo");
  const r = await renombrarModulo(b.cicloId, b.moduloId, nombre);
  if (!r) fallo(404, "Módulo no encontrado");
  if (r.repetido) fallo(409, "Ya hay otro módulo con ese nombre en este ciclo");
  // El nombre del módulo también se guarda en cada examen (se ve en el examen, el correo y el PDF).
  const exs = (await todosLosExamenes({ privados: true })).filter((e) => e.cicloId === b.cicloId && e.moduloId === b.moduloId && e.modulo !== nombre);
  await Promise.all(exs.map((e) => examenes().set(e.id, { ...e, modulo: nombre })));
  return json({ ok: true, nombre, examenes: exs.length });
}

/** Cursos (grupos) de un módulo: el alumno solo ve los módulos de su curso. */
async function cursosDeModulo(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  if (!gestionaCiclo(u, b.cicloId)) fallo(403, "Solo puedes cambiar módulos de tus ciclos");
  const g = await cursosModulo(b.cicloId, b.moduloId, b.grupos);
  if (!g) fallo(404, "Módulo no encontrado");
  return json({ ok: true, grupos: g });
}

/**
 * Calificaciones de un grupo: alumnos × exámenes de los módulos de ese curso.
 * El profesor ve los exámenes que ha creado; el admin, todos.
 */
async function calificacionesGrupo(req, url) {
  const yo = await requiereProfesor(req);
  const g = gruposDe(yo).find((x) => x.grupo === url.searchParams.get("grupo"));
  if (!g) fallo(404, "Grupo no encontrado");
  const alumnos = (await leerTodas(usuarios(), await usuarios().list()))
    .filter((u) => rolDe(u) === "alumno" && !u.egresado && u.grupo === g.grupo)
    .sort((a, b) => `${a.apellidos} ${a.nombre}`.localeCompare(`${b.apellidos} ${b.nombre}`, "es"));
  const ciclo = CATALOGO.find((c) => c.id === g.cicloId);
  const delCurso = (m) => !m.grupos?.length || m.grupos.includes(g.grupo);
  const todos = (await todosLosExamenes()).filter((ex) => ex.cicloId === g.cicloId && gestionaExamen(yo, ex));
  const emails = new Set(alumnos.map((a) => a.email));
  const trabajosCiclo = await notasTrabajos(yo, g.cicloId, emails);
  const cols = await leerTodas(externas(), await externas().list(`${g.grupo}/`));
  const modulos = [];
  const notas = {}; // email → { examenId: { nota, intentos, porRevisar } }
  for (const m of ciclo.modulos.filter(delCurso)) {
    const exs = todos.filter((ex) => ex.moduloId === m.id);
    const columnas = [];
    for (const ex of exs) {
      const claves = (await entregas().list(ex.id + "/")).filter((k) => emails.has(k.slice(ex.id.length + 1)));
      if (!ex.publicado && !claves.length) continue; // borradores sin entregas: fuera
      for (const e of await leerTodas(entregas(), claves)) {
        (notas[e.email] ||= {})[ex.id] = { nota: e.notaProfesor ?? e.resultado.nota, intentos: intentosHechos(e), porRevisar: porRevisar(e) };
      }
      columnas.push({ id: ex.id, titulo: ex.titulo, publicado: ex.publicado, ra: ex.ra || [] });
    }
    // Trabajos del módulo: nota final (trabajo + defensa) como una columna más.
    for (const t of trabajosCiclo.filter((t) => t.moduloId === m.id)) {
      const col = `trabajo:${t.id}`;
      if (!t.publicado && !Object.keys(t.notas).length) continue;
      for (const [email, n] of Object.entries(t.notas)) if (n.nota != null) (notas[email] ||= {})[col] = { nota: n.nota, intentos: 1, porRevisar: 0 };
      columnas.push({ id: col, titulo: `Trabajo: ${t.titulo}`, publicado: t.publicado, trabajo: true, ra: t.ra || [] });
    }
    // Notas importadas (Additio, Alexia, Excel…): también cuentan en la media del módulo.
    for (const x of cols.filter((x) => x.moduloId === m.id).sort((a, b) => (a.creado || "").localeCompare(b.creado || ""))) {
      const col = `externa:${x.id}`;
      for (const [email, n] of Object.entries(x.notas || {})) if (emails.has(email) && n != null) (notas[email] ||= {})[col] = { nota: n, intentos: 1, porRevisar: 0 };
      columnas.push({ id: col, titulo: x.titulo, publicado: true, externa: true, origen: x.origen || "", ra: x.ra || [] });
    }
    modulos.push({ id: m.id, nombre: m.nombre, examenes: columnas });
  }
  return json({
    grupo: g.grupo, ciclo: { id: ciclo.id, nombre: ciclo.nombre, descripcion: ciclo.descripcion },
    modulos,
    alumnos: alumnos.map((a) => ({ email: a.email, nombre: a.nombre, apellidos: a.apellidos, verificado: !!a.verificado, notas: notas[a.email] || {} })),
  });
}

/** Guarda (o sustituye) una columna de notas importadas en un grupo y módulo. */
async function guardarExterna(req) {
  const yo = await requiereProfesor(req);
  const b = await leerCuerpo(req, 400_000);
  const g = gruposDe(yo).find((x) => x.grupo === b.grupo);
  if (!g) fallo(404, "Grupo no encontrado");
  if (!buscarModulo(g.cicloId, b.moduloId)) fallo(400, "Elige el módulo");
  const titulo = texto(b.titulo, 120);
  if (!titulo) fallo(400, "Ponle un nombre a la columna");
  const alumnos = new Set((await leerTodas(usuarios(), await usuarios().list())).filter((u) => rolDe(u) === "alumno" && u.grupo === g.grupo).map((u) => u.email));
  const notas = {};
  for (const [email, v] of Object.entries(b.notas || {})) {
    if (!alumnos.has(email) || v === null || v === "") continue;
    const n = Number(String(v).replace(",", "."));
    if (!Number.isFinite(n) || n < 0 || n > 10) fallo(400, `Nota no válida para ${email}: ${v} (debe estar entre 0 y 10)`);
    notas[email] = Math.round(n * 100) / 100;
  }
  if (!Object.keys(notas).length) fallo(400, "Ninguna nota corresponde a alumnos de este grupo");
  const id = /^[a-z0-9]{6,20}$/.test(b.id || "") ? b.id : Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const clave = `${g.grupo}/${b.moduloId}/${id}`;
  const previo = await externas().get(clave);
  await externas().set(clave, {
    id, grupo: g.grupo, cicloId: g.cicloId, moduloId: b.moduloId, titulo, origen: texto(b.origen, 60), notas, ra: raValidos(b.ra ?? previo?.ra),
    creado: previo?.creado || new Date().toISOString(), actualizado: new Date().toISOString(), autor: yo.email,
  });
  const sobre = { tipo: "externa", id, titulo, cicloId: g.cicloId };
  for (const email of new Set([...Object.keys(notas), ...Object.keys(previo?.notas || {})])) {
    const a = previo?.notas?.[email] ?? null, d = notas[email] ?? null;
    if (a !== d) await registrar({ por: yo, accion: "nota importada", alumno: email, sobre, antes: a, despues: d, detalle: texto(b.origen, 60) || "Excel" });
  }
  return json({ ok: true, id, guardadas: Object.keys(notas).length });
}

async function borrarExterna(req) {
  const yo = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  const g = gruposDe(yo).find((x) => x.grupo === b.grupo);
  if (!g) fallo(404, "Grupo no encontrado");
  const k = (await externas().list(`${g.grupo}/`)).find((k) => k.endsWith(`/${b.id}`));
  if (!k) fallo(404, "Columna no encontrada");
  const x = await externas().get(k);
  await conservarYBorrar("notasExternas", [k], { tipo: "notas importadas", por: yo, motivo: `Columna borrada: ${x?.titulo || ""}`, alumnoDe: () => "" });
  for (const [email, n] of Object.entries(x?.notas || {}))
    await registrar({ por: yo, accion: "nota importada borrada", alumno: email, sobre: { tipo: "externa", id: b.id, titulo: x.titulo, cicloId: g.cicloId }, antes: n, despues: null });
  return json({ ok: true });
}

async function quitarModulo(req) {
  const u = await requiereProfesor(req);
  const b = await leerCuerpo(req);
  if (!gestionaCiclo(u, b.cicloId)) fallo(403, "Solo puedes borrar módulos de tus ciclos");
  const m = buscarModulo(b.cicloId, b.moduloId);
  if (!m) fallo(404, "Módulo no encontrado");
  if (!m.modulo.propio) fallo(400, "Este módulo viene de serie y no se puede borrar");
  const usados = (await todosLosExamenes({ privados: true })).filter((e) => e.cicloId === b.cicloId && e.moduloId === b.moduloId).length;
  if (usados) fallo(409, `El módulo tiene ${usados} examen(es). Bórralos o muévelos antes de borrar el módulo.`);
  await borrarModulo(b.cicloId, b.moduloId);
  return json({ ok: true });
}

/* ── IA: generar preguntas a partir del material de un tema ── */
async function iaEstado(req) {
  await requiereProfesor(req);
  if (!iaDisponible()) return json({ disponible: false, motivo: motivoSinIA() });
  return json({ disponible: true, proveedor: proveedorIA(), lote: tamLote(), ...(await comprobarIA()) });
}

async function iaPreguntas(req) {
  const yo = await requiereProfesor(req);
  const b = await leerCuerpo(req, 1_500_000);
  if (!gestionaCiclo(yo, b.cicloId)) fallo(403, "Solo puedes generar exámenes de tus ciclos");
  const tipo = b.tipo === "open" ? "open" : "mc";
  const material = String(b.material || "").trim();
  if (material.length < 200) fallo(400, "El material tiene muy poco texto. ¿Son diapositivas con solo imágenes?");
  if (material.length > 400_000) fallo(413, "El material es demasiado largo. Súbelo por partes (por ejemplo, un tema cada vez).");
  const n = Math.min(Math.max(Number(b.n) || 5, 1), 12);
  const ubic = buscarModulo(b.cicloId, b.moduloId);
  const preguntas = await generarLote({
    tipo, material, n,
    ya: (Array.isArray(b.ya) ? b.ya : []).slice(0, 100).map((t) => texto(t, 300)),
    lote: Number(b.lote) || 1, lotes: Number(b.lotes) || 1,
    titulo: texto(b.titulo, 200), modulo: ubic?.modulo.nombre || "",
    indicaciones: texto(b.indicaciones, 1000),
  });
  await registrarIA(yo, "generar preguntas", { tipo, n: preguntas.length, material: material.length });
  return json({ preguntas });
}

/** Adaptar un examen de Word: una parte por petición (estructura, mc, open, num). */
async function iaAdaptar(req) {
  const yo = await requiereProfesor(req);
  const b = await leerCuerpo(req, 1_500_000);
  if (!gestionaCiclo(yo, b.cicloId)) fallo(403, "Solo puedes adaptar exámenes de tus ciclos");
  const examen = String(b.examen || "").trim(), solucionario = String(b.solucionario || "").trim();
  if (examen.length < 100) fallo(400, "El examen apenas tiene texto.");
  if (examen.length + solucionario.length > 300_000) fallo(413, "El examen es demasiado largo.");
  const r = b.rango && typeof b.rango === "object" ? b.rango : {};
  const rango = { desde: r.desde, hasta: r.hasta, ejercicio: r.ejercicio, titulo: texto(r.titulo, 120), apDesde: r.apDesde, apHasta: r.apHasta };
  const r2 = await adaptarParte({ parte: String(b.parte || ""), examen, solucionario, indicaciones: texto(b.indicaciones, 1000), rango });
  await registrarIA(yo, "adaptar examen de Word", { parte: String(b.parte || "").slice(0, 20), material: examen.length + solucionario.length });
  return json(r2);
}

/* ── Registro de cambios, expediente del alumno y códigos personales ── */

/** Entradas que puede ver este profesor: las de sus ciclos (el admin, todas). */
const puedeVerEntrada = (yo) => (x) => esAdmin(yo.email) || (x.sobre?.cicloId && ciclosDe(yo).includes(x.sobre.cicloId));

async function auditoriaRuta(req, url) {
  const yo = await requiereProfesor(req);
  const alumno = String(url.searchParams.get("alumno") || "").toLowerCase();
  const sobre = url.searchParams.get("sobre") || "";
  // Un alumno de sus ciclos (el admin, también cuentas ya borradas).
  if (alumno) { if ((await usuarios().get(alumno)) || !esAdmin(yo.email)) await alumnoPermitido(alumno, yo); }
  else if (!esAdmin(yo.email) && !sobre) fallo(400, "Elige un alumno, un examen o un trabajo");
  const ver = puedeVerEntrada(yo);
  const entradas = await leerRegistro({ alumno, filtro: (x) => ver(x) && (!sobre || x.sobre?.id === sobre), max: Number(url.searchParams.get("max")) || 500 });
  return json({ entradas });
}

/**
 * Expediente del alumno: todas sus pruebas de evaluación (exámenes con sus respuestas y
 * correcciones, trabajos, notas importadas), lo conservado y el registro de cambios.
 * La página /profesor/expediente.html lo imprime o guarda en PDF.
 */
async function expediente(req, url) {
  const yo = await requiereProfesor(req);
  const email = String(url.searchParams.get("email") || "").toLowerCase();
  const u = await usuarios().get(email);
  if (u) await alumnoPermitido(email, yo);
  else if (!esAdmin(yo.email)) fallo(404, "Alumno no encontrado");
  const examenesAl = [];
  for (const k of (await entregas().list()).filter((k) => k.endsWith(`/${email}`))) {
    const e = await entregas().get(k);
    const ex = (await obtenerExamen(e?.examen?.id)) || e?.examen;
    if (!e || !(esAdmin(yo.email) || gestionaExamen(yo, ex))) continue;
    const p = await progreso().get(k);
    examenesAl.push({
      id: e.examen.id, titulo: e.examen.titulo, modulo: e.examen.modulo || ex?.modulo || "", ra: ex?.ra || [], defensa: !!ex?.defensaDe,
      notaFinal: e.notaProfesor ?? e.resultado?.nota, calificacion: ex?.calificacion || "mejor", vigente: (e.vigente ?? 0) + 1,
      intentos: historialDe(e).map((_, i) => vistaEntrega(conIntento(e, i), { soluciones: true })),
      salidas: p?.salidas || [],
    });
  }
  examenesAl.sort((a, b) => `${a.modulo} ${a.titulo}`.localeCompare(`${b.modulo} ${b.titulo}`, "es"));
  const externasAl = (await leerTodas(externas(), await externas().list()))
    .filter((x) => x.notas?.[email] != null && (esAdmin(yo.email) || gestionaCiclo(yo, x.cicloId)))
    .map((x) => ({ titulo: x.titulo, origen: x.origen || "", moduloId: x.moduloId, nota: x.notas[email], ra: x.ra || [], creado: x.creado }));
  const ver = puedeVerEntrada(yo);
  return json({
    alumno: u ? { email, nombre: u.nombre, apellidos: u.apellidos, grupo: u.grupo, adaptacion: u.adaptacion || null, egresado: u.egresado || null } : { email, borrada: true },
    generado: new Date().toISOString(), por: `${yo.nombre} ${yo.apellidos}`.trim(),
    examenes: examenesAl, trabajos: await trabajosDeAlumno(yo, email), externas: externasAl,
    conservadas: esAdmin(yo.email) ? await conservadasDe(email) : (await conservadasDe(email)).filter((c) => !c.por || c.por === yo.email),
    registro: await leerRegistro({ alumno: email, filtro: ver }),
  });
}

/** Códigos personales de un examen a distancia (uno por alumno que puede hacerlo). */
async function codigosPersonales(req, url) {
  const yo = await requiereProfesor(req);
  const ex = await existente(url.searchParams.get("id"), yo);
  const s = await secreto();
  const lista = (await leerTodas(usuarios(), await usuarios().list()))
    .filter((u) => rolDe(u) === "alumno" && !u.egresado && cicloDe(u) === ex.cicloId && moduloVisible(ex.cicloId, ex.moduloId, u))
    .sort((a, b) => `${a.grupo} ${a.apellidos} ${a.nombre}`.localeCompare(`${b.grupo} ${b.apellidos} ${b.nombre}`, "es"))
    .map((u) => ({ email: u.email, nombre: u.nombre, apellidos: u.apellidos, grupo: u.grupo, codigo: codigoPersonal(s, ex.id, u.email) }));
  await registrar({ por: yo, accion: "códigos personales consultados", sobre: sobreEx(ex) });
  return json({ examen: { id: ex.id, titulo: ex.titulo, identidad: !!ex.identidad }, alumnos: lista });
}

export default {
  "GET /api/profesor/auditoria": auditoriaRuta,
  "GET /api/profesor/expediente": expediente,
  "GET /api/profesor/examen/codigos": codigosPersonales,
  "POST /api/profesor/ia/adaptar": iaAdaptar,
  "POST /api/profesor/modulo": nuevoModulo,
  "POST /api/profesor/modulo/borrar": quitarModulo,
  "POST /api/profesor/modulo/cursos": cursosDeModulo,
  "POST /api/profesor/modulo/nombre": renombrar,
  "GET /api/profesor/grupo": calificacionesGrupo,
  "POST /api/profesor/grupo/externa": guardarExterna,
  "POST /api/profesor/grupo/externa/borrar": borrarExterna,
  "GET /api/profesor/ia": iaEstado,
  "POST /api/profesor/ia/preguntas": iaPreguntas,
  "GET /api/profesor/examenes": listar,
  "GET /api/profesor/examen": verExamen,
  "GET /api/profesor/examen/version": version,
  "POST /api/profesor/ia/aleatorio": iaAleatorio,
  "POST /api/profesor/examen/aleatorio": aplicarAleatorio,
  "POST /api/profesor/examen": guardar,
  "POST /api/profesor/examen/ajustes": ajustes,
  "POST /api/profesor/examen/borrar": borrar,
  "GET /api/profesor/entregas": listarEntregas,
  "GET /api/profesor/entregas.csv": csv,
  "GET /api/profesor/entrega": verEntrega,
  "POST /api/profesor/entrega/revisar": revisar,
  "POST /api/profesor/entrega/reabrir": reabrir,
  "POST /api/profesor/entrega/intento-extra": intentoExtra,
  "POST /api/profesor/entrega/reanudar": reanudar,
  "GET /api/profesor/respuestas": respuestas,
  "POST /api/profesor/entrega/puntuar": puntuar,
  "POST /api/profesor/entregas/validar": validarNotas,
  "POST /api/profesor/entrega/revision": responderRevision,
  "POST /api/profesor/ia/corregir": iaCorregir,
  "POST /api/profesor/entrega/borrar-intento": borrarIntento,
  "GET /api/profesor/alumnos": alumnos,
  "POST /api/profesor/alumno": editarAlumno,
  "POST /api/profesor/alumno/borrar": borrarAlumno,
};
